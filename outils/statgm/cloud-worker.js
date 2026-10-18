importScripts("vendor/fflate-0.8.2.js", "player-history.js?v=20261006c", "archive-db.js?v=20261006c", "import-format.js?v=20261006a", "cloud-codec.js?v=20261001e");

const db = StatGMArchiveDB, codec = StatGMCloudCodec;
let credentials, refresh, busy = false;
const bucketFor = uuid => (parseInt(uuid.slice(0, 2), 16) & 252).toString(16).padStart(2, "0");
const report = (status, message, detail = "") => postMessage({ type: "state", status, message, detail });
async function api(action, payload = {}) {
  let refreshed = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${credentials.url}/functions/v1/turso-statgm`, {
        method: "POST", headers: { "Content-Type": "application/json", apikey: credentials.apikey, Authorization: `Bearer ${credentials.token}` },
        body: JSON.stringify({ action, ...payload }), signal: AbortSignal.timeout(40000)
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401 && !refreshed) {
        refreshed = true;
        credentials = await new Promise((resolve, reject) => { refresh = { resolve, reject }; postMessage({ type: "refresh" }); });
        attempt--; continue;
      }
      if (!response.ok || (!result.ok && !result.conflict)) {
        const error = new Error(result.error || "La sauvegarde cloud est momentanément indisponible.");
        error.status = response.status; throw error;
      }
      return result;
    } catch (error) {
      if (attempt === 2 || (error.status && error.status < 500 && error.status !== 429)) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }
}
async function prepare(active, baseRevision, force) {
  const key = `plan:${active.datasetId}`;
  const existing = await db.readMeta(key);
  if (existing?.indexVersion === 4) {
    if (!force) return existing;
    const rebased = { ...existing, snapshotId: crypto.randomUUID(), baseRevision };
    await db.writeMeta(key, rebased); return rebased;
  }
  if (active.recordsLocal === false) throw new Error("Charge les statistiques détaillées avant de remplacer cette sauvegarde.");
  report("preparing", "Préparation de la sauvegarde…", "Compression en arrière-plan");
  await db.backfillGrades(active.datasetId);
  await db.backfillCardDetails(active.datasetId);
  const players = await db.readPlayers(active.datasetId);
  const inherited = existing ? null : await db.readMeta(`inherited:${active.datasetId}`);
  const chunks = [];
  const emit = (kind, bucket) => async chunk => {
    await db.putChunk(chunk);
    const { data, ...descriptor } = chunk;
    chunks.push({ ...descriptor, kind, ...(bucket ? { bucket } : {}) });
  };
  let recordBase = 0;
  const index = codec.writer(emit("players"));
  for (const player of players) {
    const { datasetId, searchName, ...summary } = player;
    await index.append({ uuid: summary.uuid, name: summary.name, hasName: Boolean(summary.hasName), grade: summary.grade || "", completion: summary.completion ?? null, firstPlayedMs: summary.firstPlayedMs ?? null, latestStamp:summary.latestStamp??null, fileCount: summary.fileCount, recordBase, bucket: bucketFor(summary.uuid) });
    recordBase += summary.fileCount;
  }
  await index.flush();
  let after = null, writer, bucket, count = 0, lastReport = 0;
  // Upgrading a prepared index reuses every statistics block unchanged.
  if (existing) { chunks.push(...existing.chunks.filter(chunk => chunk.kind === "records")); count = active.fileCount; }
  else {
  if(inherited){chunks.push(...inherited.chunks);count=inherited.baseCount;}
  do {
    const batch = await db.readRecordPage(active.datasetId, after, 32, null, inherited?.baseCount || 0);
    for (const record of batch.rows) {
      const nextBucket = bucketFor(record.uuid);
      if (nextBucket !== bucket) { await writer?.flush(); bucket = nextBucket; writer = codec.writer(emit("records", bucket)); }
      const metadata=StatGMHistory.descriptor(record,active); const {datasetId,sequence,uuid,...snapshot}=metadata;
      await writer.append({ uuid: record.uuid, source: record.source, data: record.data, snapshot });
      count++;
      if (performance.now() - lastReport > 250) {
        report("preparing", "Préparation de la sauvegarde…", `${count.toLocaleString("fr-FR")} / ${active.fileCount.toLocaleString("fr-FR")} fichiers`);
        lastReport = performance.now();
      }
    }
    after = batch.next;
  } while (after);
  }
  await writer?.flush();
  if (count !== active.fileCount || recordBase !== count) throw new Error("Les données locales de cet import sont incomplètes.");
  const { datasetId, ownerId, cloudRevision, pending, recordsLocal, baseRevision: previousBase, ...summary } = active;
  const manifest = { version: 1, indexVersion: 4, snapshotId: crypto.randomUUID(), baseRevision, summary, chunks };
  await db.writeMeta(key, manifest);
  return manifest;
}
async function save(active, baseRevision, force) {
  const manifest = await prepare(active, baseRevision, force);
  report("saving", "Sauvegarde cloud en cours…");
  const started = await api("begin", { manifest });
  const missing = new Set(started.missing);
  const descriptors = [...new Map(manifest.chunks.filter(chunk => missing.has(chunk.hash)).map(chunk => [chunk.hash, chunk])).values()];
  const total = descriptors.reduce((sum, chunk) => sum + chunk.bytes, 0);
  let transferred = 0, position = 0;
  async function sendBatches() {
    while (position < descriptors.length) {
      const batch = []; let size = 0;
      while (position < descriptors.length && batch.length < 64 && (size < 1100000 || !batch.length)) {
        const descriptor = descriptors[position++], chunk = await db.readChunk(descriptor.hash);
        if (!chunk) throw new Error("Un bloc local est manquant. Relance la sauvegarde.");
        batch.push({ hash: chunk.hash, data: codec.base64(chunk.data) }); size += chunk.bytes;
      }
      await api("put", { snapshotId: manifest.snapshotId, chunks: batch });
      transferred += size;
      const percent = total ? Math.round(transferred / total * 100) : 100;
      report("saving", `Sauvegarde cloud · ${percent} %`, `${(transferred / 1048576).toFixed(1)} / ${(total / 1048576).toFixed(1)} Mo à transférer`);
    }
  }
  // At most two bounded requests; hashing/compression/JSON/fetch stay off the main thread.
  await Promise.all([sendBatches(), sendBatches()]);
  const result = await api("commit", { snapshotId: manifest.snapshotId });
  if (result.conflict) { postMessage({ type: "conflict", remote: result }); return; }
  const latest = await db.readActive();
  if (latest?.datasetId !== active.datasetId) throw new Error("Un nouvel import a été créé pendant la sauvegarde.");
  const saved = { ...latest, ownerId: credentials.userId, cloudRevision: result.revision, baseRevision: result.revision, pending: false, recordsLocal: true };
  await db.activate(saved);
  await db.writeMeta(`cloud:${credentials.userId}`, { revision: result.revision, manifest, checkedAt: Date.now() });
  await db.pruneChunks().catch(() => {});
  report("saved", "Sauvegarde cloud à jour", total ? `${(total / 1048576).toFixed(1)} Mo transférés` : "Tous les blocs étaient déjà sauvegardés");
  postMessage({ type: "updated", committed: true });
}
async function getBlock(manifest, descriptor, prefetch) {
  const cached = await db.readChunk(descriptor.hash);
  if (cached && cached.data.length === descriptor.bytes && await codec.hash(cached.data) === descriptor.hash) return cached;
  const result = await api("get_chunks", { snapshotId: manifest.snapshotId, hashes: prefetch.map(chunk => chunk.hash) });
  const byHash = new Map(prefetch.map(chunk => [chunk.hash, chunk]));
  for (const chunk of result.chunks) {
    const bytes = codec.unbase64(chunk.data), expected = byHash.get(chunk.hash);
    await codec.decode({ data: bytes }, expected);
    await db.putChunk({ hash: chunk.hash, bytes: expected.bytes, rawBytes: expected.rawBytes, data: bytes });
  }
  return db.readChunk(descriptor.hash);
}
async function readBlocks(manifest, descriptors, onLine) {
  await codec.readLines(descriptors, descriptor => {
    const position = descriptors.indexOf(descriptor);
    return getBlock(manifest, descriptor, descriptors.slice(position, position + 5));
  }, onLine);
}
async function restore(head) {
  const manifest = head.manifest;
  if (manifest?.version !== 1 || !manifest.summary || !Array.isArray(manifest.chunks)) throw new Error("Format de sauvegarde cloud inconnu.");
  report("loading", "Chargement des joueurs sauvegardés…");
  const previous = await db.readActive();
  const datasetId = crypto.randomUUID();
  let batch = [], count = 0, fileCount = 0, previousUUID = "";
  try {
    await readBlocks(manifest, manifest.chunks.filter(chunk => chunk.kind === "players"), async player => {
      const uuid = StatGMImportFormat.normalizeUUID(player.uuid);
      if (!uuid || uuid <= previousUUID || typeof player.name !== "string" || typeof player.grade !== "string" || !Number.isInteger(player.fileCount) || player.fileCount < 1 || player.recordBase !== fileCount || player.bucket !== bucketFor(uuid)) throw new Error("La liste des joueurs sauvegardés est incorrecte.");
      if (player.completion !== undefined && player.completion !== null && (!Number.isFinite(player.completion) || player.completion < 0 || player.completion > 100)) throw new Error("La complétion sauvegardée est incorrecte.");
      if (player.firstPlayedMs !== undefined && player.firstPlayedMs !== null && (typeof player.firstPlayedMs !== "number" || !Number.isFinite(player.firstPlayedMs) || player.firstPlayedMs <= 0 || player.firstPlayedMs > 8640000000000000)) throw new Error("La date de première connexion sauvegardée est incorrecte.");
      previousUUID = uuid; fileCount += player.fileCount;
      batch.push({ ...player, datasetId }); count++;
      if (batch.length >= 200) { await db.writeBatch(batch, []); batch = []; }
    });
    if (count !== manifest.summary.playerCount || fileCount !== manifest.summary.fileCount) throw new Error("La liste cloud est incomplète.");
    if (batch.length) await db.writeBatch(batch, []);
    const summary = { ...manifest.summary, datasetId, ownerId: credentials.userId, cloudRevision: head.revision, baseRevision: head.revision, pending: false, recordsLocal: false };
    await db.writeMeta(`manifest:${datasetId}`, manifest);
    await db.activate(summary);
    await db.writeMeta(`cloud:${credentials.userId}`, { revision: head.revision, manifest, checkedAt: Date.now() });
    if (previous?.datasetId !== datasetId) await db.discard(previous?.datasetId).catch(() => {});
    await db.pruneChunks().catch(() => {});
    report("saved", "Sauvegarde cloud à jour", "Les statistiques détaillées se chargent à la demande");
    postMessage({ type: "updated", committed: true });
  } catch (error) { await db.discard(datasetId); throw error; }
}
async function sync({ force = false, chooseRemote = false, check = false }) {
  let active = await db.useAccount(credentials.userId);
  postMessage({ type: "updated" });
  const cached = await db.readMeta(`cloud:${credentials.userId}`);
  const pending = active && (active.pending !== false || !active.cloudRevision);
  if (!check && !force && !chooseRemote && !pending && cached && Date.now() - cached.checkedAt < 60000 && active?.cloudRevision === cached.revision) {
    report("saved", "Sauvegarde cloud à jour"); return;
  }
  report("checking", "Vérification de la sauvegarde cloud…");
  const knownRevision = force || chooseRemote || pending ? "" : active?.cloudRevision || "";
  const head = await api("head", { revision: knownRevision });
  if (chooseRemote) { if (head.manifest) await restore(head); else throw new Error("Aucune sauvegarde cloud disponible."); return; }
  if (pending) {
    const plan = await db.readMeta(`plan:${active.datasetId}`);
    if (!force && head.revision && head.revision !== active.baseRevision && head.revision !== plan?.snapshotId) {
      postMessage({ type: "conflict", remote: head }); return;
    }
    await save(active, head.revision, force);
  } else if (head.manifest && head.revision !== active?.cloudRevision) await restore(head);
  else if (active && !head.revision) {
    if (active.recordsLocal === false) throw new Error("Cette sauvegarde n’est plus disponible dans le cloud. Réimporte l’archive pour retrouver toutes les statistiques.");
    const pending = { ...active, pending: true, cloudRevision: "", baseRevision: "" };
    await db.activate(pending);
    await save(pending, "", true);
  }
  else {
    await db.writeMeta(`cloud:${credentials.userId}`, { ...(cached || {}), revision: head.revision, checkedAt: Date.now() });
    report("saved", head.revision ? "Sauvegarde cloud à jour" : "Cloud connecté · aucun import");
  }
}
async function completeIndex() {
  const active = await db.readActive();
  if (!active || active.ownerId !== credentials.userId) throw new Error("Aucun import pour ce compte.");
  const players = await db.readPlayers(active.datasetId);
  const fields = ["completion", "firstPlayedMs"];
  const missing = new Map(players.filter(player => fields.some(key => player[key] === undefined)).map(player => [player.uuid, { ...player }]));
  if (!missing.size) return;
  if (active.recordsLocal !== false) { await db.backfillCardDetails(active.datasetId); return; }
  const needed = new Map([...missing.values()].map(player => [player.uuid, fields.filter(key => player[key] === undefined)]));
  for (const player of missing.values()) for (const key of needed.get(player.uuid)) player[key] = null;
  const manifest = await db.readMeta(`manifest:${active.datasetId}`);
  const buckets = new Set([...missing.values()].map(player => player.bucket));
  const counts = new Map(), latest = new Map();
  report("loading", "Récupération des informations des joueurs…", "Ancienne sauvegarde : lecture unique en arrière-plan");
  await readBlocks(manifest, manifest.chunks.filter(chunk => chunk.kind === "records" && buckets.has(chunk.bucket)), record => {
    const player = missing.get(record.uuid);
    if (!player) return;
    const identity = StatGMImportFormat.parsePlayer(record.data, record.source);
    if (identity.uuid !== player.uuid) throw new Error("Statistiques cloud incorrectes.");
    const snapshot = StatGMHistory.descriptor(record, active.exports?.[0] || active);
    snapshot.sequence = counts.get(player.uuid) || 0;
    if (!latest.has(player.uuid) || StatGMHistory.compareSnapshots(snapshot, latest.get(player.uuid)) >= 0) {
      for (const key of needed.get(player.uuid)) player[key] = identity[key];
      latest.set(player.uuid, snapshot);
    }
    counts.set(player.uuid, (counts.get(player.uuid) || 0) + 1);
  });
  for (const player of missing.values()) if (counts.get(player.uuid) !== player.fileCount) throw new Error("Statistiques cloud incomplètes.");
  if ((await db.readActive())?.datasetId !== active.datasetId) throw new Error("L’import actif a changé pendant la récupération.");
  await db.writeBatch([...missing.values()], []);
  report("saved", "Sauvegarde cloud à jour", "Complétions et premières connexions disponibles en local");
}
async function hydratePlayer(uuid) {
  const active = await db.readActive();
  if (!active || active.ownerId !== credentials.userId) throw new Error("Aucun import pour ce compte.");
  if (active.recordsLocal !== false) return;
  const players = await db.readPlayers(active.datasetId), player = players.find(player => player.uuid === uuid);
  if (!player) throw new Error("Joueur introuvable.");
  const bucket = player.bucket, marker = `bucket:${active.datasetId}:${bucket}`;
  if (await db.readMeta(marker)) return;
  const manifest = await db.readMeta(`manifest:${active.datasetId}`);
  const selected = new Map(players.filter(player => player.bucket === bucket).map(player => [player.uuid, player]));
  const counters = new Map(); let records = [], recordBytes = 0;
  await readBlocks(manifest, manifest.chunks.filter(chunk => chunk.kind === "records" && chunk.bucket === bucket), async (record, bytes) => {
    const target = selected.get(record.uuid), count = counters.get(record.uuid) || 0;
    if (!target || count >= target.fileCount || !record.data || typeof record.data !== "object" || Array.isArray(record.data) || typeof record.source !== "string") throw new Error("Statistiques cloud incorrectes.");
    StatGMImportFormat.parsePlayer(record.data, record.source);
    counters.set(record.uuid, count + 1);
    const restored={...record,bytes,datasetId:active.datasetId,sequence:target.recordBase+count};
    restored.snapshot=StatGMHistory.descriptor(restored,active.exports?.[0] || active);
    records.push(restored);
    recordBytes += bytes;
    if (records.length >= 32 || recordBytes >= 4 * 1024 * 1024) { await db.writeBatch([], records); records = []; recordBytes = 0; }
  });
  for (const target of selected.values()) if (counters.get(target.uuid) !== target.fileCount) throw new Error("Statistiques cloud incomplètes.");
  if (records.length) await db.writeBatch([], records);
  await db.writeMeta(marker, true);
}
async function hydrateAll() {
  const active=await db.readActive();
  if(!active || active.ownerId!==credentials.userId)throw new Error("Aucun historique pour ce compte.");
  if(active.recordsLocal!==false)return;
  const players=await db.readPlayers(active.datasetId), buckets=new Map();
  for(const player of players)if(!buckets.has(player.bucket))buckets.set(player.bucket,player.uuid);
  let done=0;
  for(const uuid of buckets.values()){
    if((await db.readActive())?.datasetId!==active.datasetId)throw new Error("L’import actif a changé.");
    report("loading","Préparation de l’historique pour l’import…",`${done++} / ${buckets.size} groupes · blocs déjà en cache réutilisés`);
    await hydratePlayer(uuid);
  }
  const latest=await db.readActive();
  if(latest?.datasetId!==active.datasetId)throw new Error("L’import actif a changé.");
  await db.activate({...latest,recordsLocal:true});
}
self.onmessage = async ({ data }) => {
  if (data.type === "credentials") { data.credentials ? refresh?.resolve(data.credentials) : refresh?.reject(new Error("Reconnecte-toi au compte Neodium.")); refresh = null; return; }
  if (busy) return;
  busy = true; credentials = data.credentials;
  try {
    if (data.type === "completions") await completeIndex();
    else if (data.type === "hydrate") { await hydratePlayer(data.uuid); postMessage({ type: "hydrated" }); }
    else if (data.type === "hydrate-all") await hydrateAll();
    else await sync(data);
    postMessage({ type: "done" });
  } catch (error) { postMessage({ type: "failed", message: error.message }); }
};
