const HASH = /^[a-f0-9]{64}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const MAX_BLOCK = 256 * 1024 + 1024;
const MAX_REQUEST = 2 * 1024 * 1024;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const text = value => ({ type: "text", value: String(value ?? "") });
const integer = value => ({ type: "integer", value: String(value) });
const sql = (query, args = []) => ({ type: "execute", stmt: { sql: query, args } });
const isObject = value => value && typeof value === "object" && !Array.isArray(value);
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
function rows(item) {
  const result = item?.response?.result;
  return (result?.rows || []).map(row => Object.fromEntries(result.cols.map((column, i) => [column.name, row[i]?.type === "null" ? null : row[i]?.type === "integer" ? Number(row[i].value) : row[i]?.type === "blob" ? row[i].base64 : row[i]?.value])));
}
function checkManifest(value) {
  if (!isObject(value) || value.version !== 1 || !UUID.test(value.snapshotId || "") || !isObject(value.summary) || !Array.isArray(value.chunks)) throw new HttpError(400, "Sauvegarde StatGM invalide.");
  if (value.chunks.length > 9000 || JSON.stringify(value).length > 1024 * 1024) throw new HttpError(413, "Sauvegarde trop volumineuse.");
  if (!Number.isInteger(value.summary.playerCount) || value.summary.playerCount < 1 || value.summary.playerCount > 65000 || !Number.isInteger(value.summary.fileCount) || value.summary.fileCount < value.summary.playerCount || value.summary.fileCount > 2000000) throw new HttpError(400, "Nombre de joueurs ou de relevés incorrect.");
  if (typeof value.summary.filename !== "string" || value.summary.filename.length > 255 || !Number.isFinite(Date.parse(value.summary.importedAt))) throw new HttpError(400, "Informations d’export incorrectes.");
  let rawBytes = 0, bytes = 0, playerBlocks = 0;
  for (const chunk of value.chunks) {
    if (!isObject(chunk) || !HASH.test(chunk.hash || "") || !Number.isInteger(chunk.bytes) || chunk.bytes < 18 || chunk.bytes > MAX_BLOCK || !Number.isInteger(chunk.rawBytes) || chunk.rawBytes < 1 || chunk.rawBytes > 256 * 1024 || !["players", "records"].includes(chunk.kind) || (chunk.kind === "records" && !/^[a-f0-9]{2}$/.test(chunk.bucket || ""))) throw new HttpError(400, "Bloc de sauvegarde incorrect.");
    if (chunk.kind === "players") playerBlocks++;
    rawBytes += chunk.rawBytes; bytes += chunk.bytes;
  }
  if (!playerBlocks || playerBlocks > 80 || bytes > 512 * 1024 * 1024 || rawBytes > 2 * 1024 * 1024 * 1024 + 20 * 1024 * 1024) throw new HttpError(413, "Limites de la sauvegarde dépassées.");
  if (typeof value.baseRevision !== "string" || (value.baseRevision && !UUID.test(value.baseRevision))) throw new HttpError(400, "Révision de sauvegarde incorrecte.");
  return value;
}
function json(status, payload) { return new Response(JSON.stringify(payload), { status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } }); }

export function createService(config, { fetcher = fetch, now = () => Date.now() } = {}) {
  let schemaPromise;
  const sessions = new Map();
  async function pipeline(requests) {
    const url = config.tursoUrl.replace(/^(?:libsql|turso):\/\//, "https://");
    if (!url || !config.tursoToken) throw new HttpError(503, "Le stockage Turso n’est pas configuré.");
    const response = await fetcher(`${url}/v2/pipeline`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.tursoToken}` }, body: JSON.stringify({ requests: [...requests, { type: "close" }] }), signal: AbortSignal.timeout(25000) });
    const result = await response.json();
    if (!response.ok || !Array.isArray(result.results) || result.results.length !== requests.length + 1) throw new HttpError(503, "Le stockage cloud est momentanément indisponible.");
    if (result.results.some(item => item.type === "error")) throw new HttpError(503, "Impossible de terminer l’opération de stockage cloud.");
    return result.results;
  }
  async function schema() {
    if (!schemaPromise) schemaPromise = pipeline([
      sql("CREATE TABLE IF NOT EXISTS statgm_snapshots (user_id TEXT NOT NULL, snapshot_id TEXT NOT NULL, manifest_json TEXT NOT NULL, base_revision TEXT NOT NULL, created_at INTEGER NOT NULL, committed INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, snapshot_id))"),
      sql("CREATE TABLE IF NOT EXISTS statgm_chunks (user_id TEXT NOT NULL, hash TEXT NOT NULL, data BLOB NOT NULL, bytes INTEGER NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (user_id, hash))"),
      sql("CREATE TABLE IF NOT EXISTS statgm_snapshot_chunks (user_id TEXT NOT NULL, snapshot_id TEXT NOT NULL, position INTEGER NOT NULL, hash TEXT NOT NULL, PRIMARY KEY (user_id, snapshot_id, position))"),
      sql("CREATE INDEX IF NOT EXISTS statgm_chunk_references ON statgm_snapshot_chunks (user_id, hash)"),
      sql("CREATE INDEX IF NOT EXISTS statgm_snapshot_dates ON statgm_snapshots (user_id, committed, created_at DESC)"),
      sql("CREATE TABLE IF NOT EXISTS statgm_current (user_id TEXT PRIMARY KEY, snapshot_id TEXT NOT NULL, revision TEXT NOT NULL, updated_at INTEGER NOT NULL)")
    ]).catch(error => { schemaPromise = null; throw error; });
    await schemaPromise;
  }
  async function authorize(request) {
    const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) throw new HttpError(401, "Connecte-toi au compte Neodium.");
    const cached = sessions.get(token);
    if (cached && cached.until > now()) return cached.userId;
    const headers = { apikey: config.supabaseKey, Authorization: `Bearer ${token}` };
    const response = await fetcher(`${config.supabaseUrl}/auth/v1/user`, { headers, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new HttpError(response.status >= 500 ? 503 : 401, "Session Neodium indisponible.");
    const user = await response.json();
    if (!UUID.test(user.id || "") || !user.email) throw new HttpError(401, "Session Neodium invalide.");
    // User JWT + existing RLS + explicit email equality; no client-supplied owner ID.
    const allowed = await fetcher(`${config.supabaseUrl}/rest/v1/neodium_allowed_emails?select=email&limit=2`, { headers, signal: AbortSignal.timeout(10000) });
    if (!allowed.ok) throw new HttpError(503, "Impossible de vérifier l’accès Neodium.");
    const emails = await allowed.json();
    if (!Array.isArray(emails) || !emails.some(row => String(row.email).toLowerCase() === user.email.toLowerCase())) throw new HttpError(403, "Ce compte n’est pas autorisé à utiliser StatGM.");
    if (sessions.size >= 64) sessions.delete(sessions.keys().next().value);
    sessions.set(token, { userId: user.id, until: now() + 30000 });
    return user.id;
  }
  async function current(userId, revision) {
    const result = await pipeline([sql("SELECT c.revision, c.snapshot_id, CASE WHEN c.revision = ? THEN NULL ELSE s.manifest_json END AS manifest_json FROM statgm_current c JOIN statgm_snapshots s ON s.user_id = c.user_id AND s.snapshot_id = c.snapshot_id AND s.committed = 1 WHERE c.user_id = ?", [text(revision), text(userId)])]);
    const row = rows(result[0])[0];
    if (!row) return { ok: true, revision: "", manifest: null };
    return row.revision === revision ? { ok: true, revision: row.revision, unchanged: true } : { ok: true, revision: row.revision, manifest: JSON.parse(row.manifest_json) };
  }
  async function begin(userId, body) {
    const manifest = checkManifest(body.manifest), serialized = JSON.stringify(manifest);
    const args = [text(userId), text(manifest.snapshotId)];
    const result = await pipeline([
      sql("INSERT OR IGNORE INTO statgm_snapshots (user_id, snapshot_id, manifest_json, base_revision, created_at) VALUES (?, ?, ?, ?, ?)", [...args, text(serialized), text(manifest.baseRevision), integer(now())]),
      sql("INSERT OR IGNORE INTO statgm_snapshot_chunks (user_id, snapshot_id, position, hash) SELECT ?, ?, CAST(j.key AS INTEGER), json_extract(j.value, '$.hash') FROM json_each(?) j WHERE EXISTS (SELECT 1 FROM statgm_snapshots WHERE user_id = ? AND snapshot_id = ? AND manifest_json = ?)", [...args, text(JSON.stringify(manifest.chunks)), ...args, text(serialized)]),
      sql("SELECT manifest_json FROM statgm_snapshots WHERE user_id = ? AND snapshot_id = ?", args),
      sql("SELECT DISTINCT r.hash FROM statgm_snapshot_chunks r LEFT JOIN statgm_chunks c ON c.user_id = r.user_id AND c.hash = r.hash WHERE r.user_id = ? AND r.snapshot_id = ? AND c.hash IS NULL", args)
    ]);
    if (rows(result[2])[0]?.manifest_json !== serialized) throw new HttpError(409, "L’identifiant de cette sauvegarde est déjà utilisé.");
    return { ok: true, missing: rows(result[3]).map(row => row.hash) };
  }
  async function put(userId, body) {
    if (!UUID.test(body.snapshotId || "") || !Array.isArray(body.chunks) || !body.chunks.length || body.chunks.length > 64) throw new HttpError(400, "Lot de sauvegarde incorrect.");
    const snapshot = rows((await pipeline([sql("SELECT manifest_json FROM statgm_snapshots WHERE user_id = ? AND snapshot_id = ?", [text(userId), text(body.snapshotId)])]))[0])[0];
    if (!snapshot) throw new HttpError(404, "Sauvegarde à reprendre introuvable.");
    const descriptors = new Map(JSON.parse(snapshot.manifest_json).chunks.map(chunk => [chunk.hash, chunk]));
    const writes = [];
    for (const chunk of body.chunks) {
      const descriptor = descriptors.get(chunk.hash);
      if (!descriptor || typeof chunk.data !== "string" || chunk.data.length > Math.ceil(MAX_BLOCK / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(chunk.data)) throw new HttpError(400, "Bloc de sauvegarde inconnu.");
      let binary; try { binary = atob(chunk.data); } catch { throw new HttpError(400, "Encodage du bloc incorrect."); }
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      const actualHash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(value => value.toString(16).padStart(2, "0")).join("");
      if (bytes.length !== descriptor.bytes || actualHash !== chunk.hash || bytes.length < 18 || new DataView(bytes.buffer).getUint32(bytes.length - 4, true) !== descriptor.rawBytes) throw new HttpError(400, "L’intégrité d’un bloc est incorrecte.");
      writes.push(sql("INSERT OR IGNORE INTO statgm_chunks (user_id, hash, data, bytes, created_at) VALUES (?, ?, ?, ?, ?)", [text(userId), text(chunk.hash), { type: "blob", base64: chunk.data }, integer(bytes.length), integer(now())]));
    }
    await pipeline([sql("BEGIN"), ...writes, sql("COMMIT")]);
    return { ok: true, received: writes.length };
  }
  async function commit(userId, body) {
    if (!UUID.test(body.snapshotId || "")) throw new HttpError(400, "Identifiant de sauvegarde incorrect.");
    const args = [text(userId), text(body.snapshotId)];
    const result = await pipeline([
      sql("SELECT manifest_json, base_revision FROM statgm_snapshots WHERE user_id = ? AND snapshot_id = ?", args),
      sql("SELECT COUNT(*) AS missing FROM statgm_snapshot_chunks r LEFT JOIN statgm_chunks c ON c.user_id = r.user_id AND c.hash = r.hash WHERE r.user_id = ? AND r.snapshot_id = ? AND c.hash IS NULL", args)
    ]);
    const snapshot = rows(result[0])[0];
    if (!snapshot) throw new HttpError(404, "Sauvegarde introuvable.");
    if (rows(result[1])[0]?.missing) throw new HttpError(409, "Des blocs de sauvegarde sont encore manquants.");
    const revision = body.snapshotId;
    const published = await pipeline([
      sql("UPDATE statgm_snapshots SET committed = 1 WHERE user_id = ? AND snapshot_id = ?", args),
      // A single conditional write publishes a complete backup. Concurrent imports cannot overwrite it silently.
      sql("INSERT INTO statgm_current (user_id, snapshot_id, revision, updated_at) SELECT ?, ?, ?, ? WHERE ? = '' OR EXISTS (SELECT 1 FROM statgm_current WHERE user_id = ?) ON CONFLICT(user_id) DO UPDATE SET snapshot_id = excluded.snapshot_id, revision = excluded.revision, updated_at = excluded.updated_at WHERE statgm_current.revision = ? OR statgm_current.snapshot_id = excluded.snapshot_id RETURNING revision", [text(userId), text(body.snapshotId), text(revision), integer(now()), text(snapshot.base_revision), text(userId), text(snapshot.base_revision)])
    ]);
    if (!rows(published[1])[0]) return { ...(await current(userId, "")), ok: false, conflict: true };
    // Retain two complete backups, seven-day resumable transfers, and only their referenced blocks.
    // Cleanup failure never turns a successful durable save into a failed save.
    await pipeline([
      sql("DELETE FROM statgm_snapshots WHERE user_id = ? AND snapshot_id NOT IN (SELECT snapshot_id FROM statgm_current WHERE user_id = ?) AND ((committed = 0 AND created_at < ?) OR (committed = 1 AND snapshot_id NOT IN (SELECT snapshot_id FROM statgm_snapshots WHERE user_id = ? AND committed = 1 ORDER BY created_at DESC LIMIT 2)))", [text(userId), text(userId), integer(now() - 7 * 86400000), text(userId)]),
      sql("DELETE FROM statgm_snapshot_chunks WHERE user_id = ? AND NOT EXISTS (SELECT 1 FROM statgm_snapshots s WHERE s.user_id = statgm_snapshot_chunks.user_id AND s.snapshot_id = statgm_snapshot_chunks.snapshot_id)", [text(userId)]),
      sql("DELETE FROM statgm_chunks WHERE user_id = ? AND NOT EXISTS (SELECT 1 FROM statgm_snapshot_chunks r WHERE r.user_id = statgm_chunks.user_id AND r.hash = statgm_chunks.hash)", [text(userId)])
    ]).catch(() => {});
    return { ok: true, revision };
  }
  async function getChunks(userId, body) {
    if (!UUID.test(body.snapshotId || "") || !Array.isArray(body.hashes) || !body.hashes.length || body.hashes.length > 6 || !body.hashes.every(hash => HASH.test(hash))) throw new HttpError(400, "Lecture de blocs incorrecte.");
    const result = await pipeline([sql(`SELECT DISTINCT c.hash, c.data FROM statgm_chunks c JOIN statgm_snapshot_chunks r ON r.user_id = c.user_id AND r.hash = c.hash JOIN statgm_snapshots s ON s.user_id = r.user_id AND s.snapshot_id = r.snapshot_id AND s.committed = 1 WHERE r.user_id = ? AND r.snapshot_id = ? AND c.hash IN (${body.hashes.map(() => "?").join(",")})`, [text(userId), text(body.snapshotId), ...body.hashes.map(text)])]);
    const chunks = rows(result[0]);
    if (chunks.length !== new Set(body.hashes).size) throw new HttpError(404, "Bloc de sauvegarde introuvable.");
    return { ok: true, chunks };
  }
  return async request => {
    if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (request.method !== "POST") return json(405, { ok: false, error: "Méthode non supportée." });
    try {
      if (Number(request.headers.get("Content-Length")) > MAX_REQUEST) throw new HttpError(413, "Lot trop volumineux.");
      const userId = await authorize(request);
      // Read a bounded stream rather than request.json(), including requests without Content-Length.
      const reader = request.body?.getReader(); let length = 0, parts = [];
      if (!reader) throw new HttpError(400, "Requête manquante.");
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        length += value.length;
        if (length > MAX_REQUEST) { await reader.cancel(); throw new HttpError(413, "Lot trop volumineux."); }
        parts.push(value);
      }
      const bytes = new Uint8Array(length); let offset = 0;
      for (const part of parts) { bytes.set(part, offset); offset += part.length; }
      let body; try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new HttpError(400, "JSON incorrect."); }
      if (!isObject(body)) throw new HttpError(400, "Requête incorrecte.");
      await schema();
      const actions = { head: () => current(userId, body.revision), begin: () => begin(userId, body), put: () => put(userId, body), commit: () => commit(userId, body), get_chunks: () => getChunks(userId, body) };
      if (!Object.hasOwn(actions, body.action)) throw new HttpError(400, "Action inconnue.");
      return json(200, await actions[body.action]());
    } catch (error) {
      return json(error.status || 503, { ok: false, error: error.status ? error.message : "La sauvegarde cloud est momentanément indisponible." });
    }
  };
}
