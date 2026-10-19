// Targeted, optimistic writes for the CDC connector. Authentication remains in index.ts.
const definitions = {
  projects: { table: "cdc_workspace_projects", idColumn: "project_id", limit: 500 },
  history: { table: "cdc_history_entries", idColumn: "entry_id", limit: 200 }
};
const templates = new Set(["commande", "gui", "itemC", "event", "metier", "rankUp", "mobs", "libre", "caisse", "soundDesign"]);

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}
function text(value) { return { type: "text", value: String(value ?? "") }; }

export function prepareAgentWrite(userId, body, snapshot, normalize, now = new Date().toISOString()) {
  const definition = Object.hasOwn(definitions, body.collection) ? definitions[body.collection] : null;
  if (!definition || !["put", "delete"].includes(body.operation)) throw fail("Opération CDC invalide.");
  if (typeof body.id !== "string" || !/^[a-zA-Z0-9_-]{1,160}$/.test(body.id)) throw fail("Identifiant CDC invalide.");
  if (!Object.hasOwn(body, "expectedUpdatedAt") || (body.expectedUpdatedAt !== null && typeof body.expectedUpdatedAt !== "string")) {
    throw fail("La version lue est obligatoire : expectedUpdatedAt, ou null pour une création.");
  }
  const current = snapshot[body.collection].find(item => item.id === body.id);
  if ((current?.updatedAt ?? null) !== body.expectedUpdatedAt) throw fail("Conflit : relisez cet élément avant de le modifier.", 409);
  if (body.operation === "delete" && !current) throw fail("Élément introuvable.", 404);
  const { table, idColumn, limit } = definition;
  let sql, args, record = null;
  if (body.operation === "delete") {
    sql = `DELETE FROM ${table} WHERE user_id = ? AND ${idColumn} = ? AND updated_at = ?`;
    args = [text(userId), text(body.id), text(body.expectedUpdatedAt)];
    if (body.collection === "projects") {
      // Never orphan documents, including a document added after the preceding read.
      sql += " AND NOT EXISTS (SELECT 1 FROM cdc_history_entries WHERE user_id = ? AND project_id = ?)";
      args.push(text(userId), text(body.id));
    }
  } else {
    if (!body.record || typeof body.record !== "object" || Array.isArray(body.record)) throw fail("Objet record invalide.");
    const timestamp = new Date(Math.max(Date.parse(now), Date.parse(current?.updatedAt || "") + 1 || 0)).toISOString();
    record = normalize[body.collection]({ ...body.record, id: body.id, createdAt: current?.createdAt || timestamp, updatedAt: timestamp });
    if (!record || new TextEncoder().encode(JSON.stringify(record)).length > 3 * 1024 * 1024) throw fail("Élément invalide ou trop volumineux.", 413);
    if (body.collection === "history") {
      if (!templates.has(record.template)) throw fail("Template CDC inconnu.");
      for (const key of ["fields", "dynamic", "images", "selection"]) {
        if (record[key] !== undefined && (!record[key] || typeof record[key] !== "object" || Array.isArray(record[key]))) throw fail(`${key} doit être un objet.`);
      }
      if (record.projectId && !snapshot.projects.some(project => project.id === record.projectId)) throw fail("Projet parent introuvable.");
    }
    const values = body.collection === "projects"
      ? { name: record.name, created_at: record.createdAt, updated_at: record.updatedAt, payload_json: JSON.stringify(record) }
      : { project_id: record.projectId, project_name: record.projectName, template: record.template, created_at: record.createdAt, updated_at: record.updatedAt, payload_json: JSON.stringify(record) };
    const columns = Object.keys(values);
    const parentGuard = body.collection === "history" && record.projectId
      ? " AND EXISTS (SELECT 1 FROM cdc_workspace_projects WHERE user_id = ? AND project_id = ?)" : "";
    if (current) {
      sql = `UPDATE ${table} SET ${columns.map(name => `${name} = ?`).join(", ")} WHERE user_id = ? AND ${idColumn} = ? AND updated_at = ?${parentGuard}`;
      args = [...Object.values(values).map(text), text(userId), text(body.id), text(body.expectedUpdatedAt)];
    } else {
      sql = `INSERT OR IGNORE INTO ${table} (user_id, ${idColumn}, ${columns.join(", ")}) SELECT ${Array(columns.length + 2).fill("?").join(", ")} WHERE (SELECT COUNT(*) FROM ${table} WHERE user_id = ?) < ${limit}${parentGuard}`;
      args = [text(userId), text(body.id), ...Object.values(values).map(text), text(userId)];
    }
    if (parentGuard) args.push(text(userId), text(record.projectId));
  }
  return { request: { type: "execute", stmt: { sql, args } }, record };
}

export function finishAgentWrite(result, record) {
  if (Number(result?.results?.[0]?.response?.result?.affected_row_count) !== 1) {
    throw fail("Conflit, limite atteinte ou projet contenant encore des CDC. Relisez les données ; supprimez les CDC liés avant leur projet.", 409);
  }
  return { ok: true, record };
}
