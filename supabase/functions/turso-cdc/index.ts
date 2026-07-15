import { createClient } from "npm:@supabase/supabase-js@2";
import { ungzip } from "npm:pako@2.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const MAX_PROJECTS = 500;
const MAX_HISTORY_ENTRIES = 200;
const MAX_ENTRY_BYTES = 3 * 1024 * 1024;
const MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024;
const LEGACY_STORAGE_TABLE = "neodium_shared_storage";
const LEGACY_WORKSPACE_ID = "global";
const LEGACY_PROJECTS_KEY = "neodium-cdc-projects";
const LEGACY_HISTORY_KEY = "neodium-cdc-project-history";
const COMPRESSED_VALUE_PREFIX = "__neodium_gzip__:";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const tursoDatabaseUrl = Deno.env.get("TURSO_DATABASE_URL") || "";
const tursoAuthToken = Deno.env.get("TURSO_AUTH_TOKEN") || "";
const tursoHttpUrl = tursoDatabaseUrl.startsWith("libsql://")
  ? `https://${tursoDatabaseUrl.slice("libsql://".length)}`
  : tursoDatabaseUrl;

let schemaReadyPromise: Promise<void> | null = null;

type JsonRecord = Record<string, unknown>;
type TursoValue = {
  type: "null" | "integer" | "float" | "text" | "blob";
  value?: string;
  base64?: string;
};
type AllowedUserResult =
  | {
      ok: true;
      userId: string;
      email: string;
      token: string;
    }
  | {
      ok: false;
      response: Response;
    };

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepCloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalizeTimestamp(value: unknown, fallback: string) {
  const rawValue = String(value || "").trim();
  if (!rawValue) return fallback;

  const parsed = Date.parse(rawValue);
  if (Number.isNaN(parsed)) return fallback;
  return new Date(parsed).toISOString();
}

function normalizeProject(rawProject: unknown) {
  if (!isRecord(rawProject)) return null;

  const now = new Date().toISOString();
  const project = deepCloneJson(rawProject);
  const id = String(project.id || "").trim();
  if (!id) return null;

  return {
    ...project,
    id,
    name: String(project.name || "Projet sans nom").trim() || "Projet sans nom",
    createdAt: normalizeTimestamp(project.createdAt, now),
    updatedAt: normalizeTimestamp(project.updatedAt || project.createdAt, now)
  };
}

function normalizeHistoryEntry(rawEntry: unknown) {
  if (!isRecord(rawEntry)) return null;

  const now = new Date().toISOString();
  const entry = deepCloneJson(rawEntry);
  const id = String(entry.id || "").trim();
  if (!id) return null;

  const createdAt = normalizeTimestamp(entry.createdAt, now);
  const updatedAt = normalizeTimestamp(entry.updatedAt || entry.createdAt, createdAt);

  return {
    ...entry,
    id,
    projectId: String(entry.projectId || "").trim(),
    projectName: String(entry.projectName || "Projet sans nom").trim() || "Projet sans nom",
    template: String(entry.template || "commande").trim() || "commande",
    renderedHtml: "",
    createdAt,
    updatedAt
  };
}

function sortProjects(projects: JsonRecord[]) {
  return [...projects].sort((a, b) =>
    String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""))
  );
}

function sortHistory(history: JsonRecord[]) {
  return [...history].sort((a, b) =>
    String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""))
  );
}

function normalizeSnapshot(rawSnapshot: unknown) {
  const snapshot = isRecord(rawSnapshot) ? rawSnapshot : {};
  const projects = Array.isArray(snapshot.projects)
    ? snapshot.projects.map(normalizeProject).filter(Boolean) as JsonRecord[]
    : [];
  const history = Array.isArray(snapshot.history)
    ? snapshot.history.map(normalizeHistoryEntry).filter(Boolean) as JsonRecord[]
    : [];

  if (projects.length > MAX_PROJECTS) {
    throw new Error(`Le snapshot depasse la limite de ${MAX_PROJECTS} projets.`);
  }

  if (history.length > MAX_HISTORY_ENTRIES) {
    throw new Error(`Le snapshot depasse la limite de ${MAX_HISTORY_ENTRIES} CDC.`);
  }

  const serializedSize = new TextEncoder().encode(JSON.stringify({ projects, history })).length;
  if (serializedSize > MAX_SNAPSHOT_BYTES) {
    throw new Error("Le snapshot CDC est trop volumineux pour etre synchronise.");
  }

  history.forEach((entry) => {
    const entrySize = new TextEncoder().encode(JSON.stringify(entry)).length;
    if (entrySize > MAX_ENTRY_BYTES) {
      throw new Error(`Le CDC "${String(entry.projectName || entry.id || "sans nom")}" est trop volumineux.`);
    }
  });

  return {
    projects: sortProjects(projects),
    history: sortHistory(history)
  };
}

function mergeByLatest(baseItems: JsonRecord[], incomingItems: JsonRecord[]) {
  const merged = new Map<string, JsonRecord>();

  [...incomingItems, ...baseItems].forEach((item) => {
    const itemId = String(item?.id || "").trim();
    if (!itemId) return;

    const current = merged.get(itemId);
    if (!current) {
      merged.set(itemId, item);
      return;
    }

    const currentTimestamp = Date.parse(String(current.updatedAt || current.createdAt || ""));
    const nextTimestamp = Date.parse(String(item.updatedAt || item.createdAt || ""));
    const safeCurrentTimestamp = Number.isNaN(currentTimestamp) ? 0 : currentTimestamp;
    const safeNextTimestamp = Number.isNaN(nextTimestamp) ? 0 : nextTimestamp;

    if (safeNextTimestamp >= safeCurrentTimestamp) {
      merged.set(itemId, item);
    }
  });

  return [...merged.values()];
}

function mergeSnapshots(baseSnapshot: { projects: JsonRecord[]; history: JsonRecord[] }, incomingSnapshot: { projects: JsonRecord[]; history: JsonRecord[] }) {
  return normalizeSnapshot({
    projects: mergeByLatest(baseSnapshot.projects, incomingSnapshot.projects),
    history: mergeByLatest(baseSnapshot.history, incomingSnapshot.history).slice(0, 50)
  });
}

function textArg(value: unknown): TursoValue {
  return {
    type: "text",
    value: String(value ?? "")
  };
}

function integerArg(value: number): TursoValue {
  return {
    type: "integer",
    value: String(Math.trunc(value))
  };
}

function bytesFromBase64(base64Value: string) {
  const binary = atob(base64Value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function decodeLegacyStorageValue(rawValue: unknown) {
  const normalizedValue = String(rawValue ?? "");
  if (!normalizedValue.startsWith(COMPRESSED_VALUE_PREFIX)) {
    return normalizedValue;
  }

  try {
    const compressedPayload = normalizedValue.slice(COMPRESSED_VALUE_PREFIX.length);
    return ungzip(bytesFromBase64(compressedPayload), { to: "string" });
  } catch (error) {
    throw new Error("Impossible de lire une ancienne sauvegarde Supabase compressee.");
  }
}

function buildExecute(sql: string, args: TursoValue[] = []) {
  return {
    type: "execute",
    stmt: {
      sql,
      args
    }
  };
}

function decodeTursoCell(cell: unknown) {
  if (!isRecord(cell)) return null;
  if (cell.type === "null") return null;
  if (cell.type === "integer" || cell.type === "float") {
    return Number(cell.value || "0");
  }
  if (cell.type === "blob") {
    return String(cell.base64 || "");
  }
  return String(cell.value || "");
}

function decodeTursoRows(resultPayload: unknown) {
  if (!isRecord(resultPayload)) return [];
  const response = isRecord(resultPayload.response) ? resultPayload.response : null;
  const result = response && isRecord(response.result) ? response.result : null;
  const cols = Array.isArray(result?.cols) ? result.cols : [];
  const rows = Array.isArray(result?.rows) ? result.rows : [];
  const columnNames = cols.map((column) => isRecord(column) ? String(column.name || "") : "");

  return rows.map((row) => {
    if (!Array.isArray(row)) {
      return {};
    }

    return Object.fromEntries(columnNames.map((name, index) => [name, decodeTursoCell(row[index])])) as JsonRecord;
  });
}

async function executeTursoPipeline(requests: unknown[]) {
  if (!tursoHttpUrl || !tursoAuthToken) {
    throw new Error("Les secrets Turso ne sont pas configures dans Supabase.");
  }

  const response = await fetch(`${tursoHttpUrl}/v2/pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tursoAuthToken}`
    },
    body: JSON.stringify({
      requests: [...requests, { type: "close" }]
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Turso a repondu ${response.status}.`);
  }

  const results = Array.isArray(payload?.results) ? payload.results : [];
  results.forEach((result) => {
    if (isRecord(result) && result.type === "error") {
      const message = isRecord(result.error) ? String(result.error.message || "") : "";
      throw new Error(message || "Une requete Turso a echoue.");
    }
  });

  return payload;
}

async function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = executeTursoPipeline([
      buildExecute(`
        CREATE TABLE IF NOT EXISTS cdc_workspace_projects (
          user_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          PRIMARY KEY (user_id, project_id)
        )
      `),
      buildExecute(`
        CREATE TABLE IF NOT EXISTS cdc_history_entries (
          user_id TEXT NOT NULL,
          entry_id TEXT NOT NULL,
          project_id TEXT,
          project_name TEXT NOT NULL,
          template TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          PRIMARY KEY (user_id, entry_id)
        )
      `),
      buildExecute(`
        CREATE INDEX IF NOT EXISTS idx_cdc_workspace_projects_user_updated
        ON cdc_workspace_projects (user_id, updated_at DESC)
      `),
      buildExecute(`
        CREATE INDEX IF NOT EXISTS idx_cdc_history_entries_user_project_updated
        ON cdc_history_entries (user_id, project_id, updated_at DESC)
      `)
    ]).then(() => undefined);
  }

  await schemaReadyPromise;
}

async function getSnapshot(userId: string) {
  await ensureSchema();

  const result = await executeTursoPipeline([
    buildExecute(
      `
        SELECT payload_json
        FROM cdc_workspace_projects
        WHERE user_id = ?
        ORDER BY updated_at DESC
      `,
      [textArg(userId)]
    ),
    buildExecute(
      `
        SELECT payload_json
        FROM cdc_history_entries
        WHERE user_id = ?
        ORDER BY updated_at DESC
        LIMIT ?
      `,
      [textArg(userId), integerArg(MAX_HISTORY_ENTRIES)]
    )
  ]);

  const rows = Array.isArray(result?.results) ? result.results : [];
  const projects = decodeTursoRows(rows[0])
    .map((row) => {
      try {
        return JSON.parse(String(row.payload_json || "{}"));
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean) as JsonRecord[];

  const history = decodeTursoRows(rows[1])
    .map((row) => {
      try {
        return JSON.parse(String(row.payload_json || "{}"));
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean) as JsonRecord[];

  return normalizeSnapshot({ projects, history });
}

async function replaceSnapshot(userId: string, rawSnapshot: unknown) {
  const snapshot = normalizeSnapshot(rawSnapshot);
  await ensureSchema();

  const requests = [
    buildExecute("BEGIN"),
    buildExecute("DELETE FROM cdc_workspace_projects WHERE user_id = ?", [textArg(userId)]),
    buildExecute("DELETE FROM cdc_history_entries WHERE user_id = ?", [textArg(userId)])
  ];

  snapshot.projects.forEach((project) => {
    requests.push(
      buildExecute(
        `
          INSERT INTO cdc_workspace_projects (
            user_id,
            project_id,
            name,
            created_at,
            updated_at,
            payload_json
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          textArg(userId),
          textArg(project.id),
          textArg(project.name),
          textArg(project.createdAt),
          textArg(project.updatedAt),
          textArg(JSON.stringify(project))
        ]
      )
    );
  });

  snapshot.history.forEach((entry) => {
    requests.push(
      buildExecute(
        `
          INSERT INTO cdc_history_entries (
            user_id,
            entry_id,
            project_id,
            project_name,
            template,
            created_at,
            updated_at,
            payload_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          textArg(userId),
          textArg(entry.id),
          textArg(entry.projectId || ""),
          textArg(entry.projectName || ""),
          textArg(entry.template || "commande"),
          textArg(entry.createdAt),
          textArg(entry.updatedAt),
          textArg(JSON.stringify(entry))
        ]
      )
    );
  });

  requests.push(buildExecute("COMMIT"));

  try {
    await executeTursoPipeline(requests);
  } catch (error) {
    await executeTursoPipeline([buildExecute("ROLLBACK")]).catch(() => null);
    throw error;
  }

  return {
    ok: true,
    projectCount: snapshot.projects.length,
    historyCount: snapshot.history.length
  };
}

async function loadLegacySupabaseSnapshot(token: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const { data, error } = await supabase
    .from(LEGACY_STORAGE_TABLE)
    .select("storage_key, storage_value")
    .eq("workspace_id", LEGACY_WORKSPACE_ID)
    .in("storage_key", [LEGACY_PROJECTS_KEY, LEGACY_HISTORY_KEY]);

  if (error) {
    throw new Error(error.message || "Impossible de lire les anciennes sauvegardes Supabase.");
  }

  const storageMap = new Map(
    (Array.isArray(data) ? data : []).map((row) => [String(row.storage_key || ""), decodeLegacyStorageValue(row.storage_value)])
  );

  let parsedProjects: unknown[] = [];
  let parsedHistory: unknown[] = [];

  try {
    parsedProjects = JSON.parse(String(storageMap.get(LEGACY_PROJECTS_KEY) || "[]"));
  } catch (error) {
    parsedProjects = [];
  }

  try {
    parsedHistory = JSON.parse(String(storageMap.get(LEGACY_HISTORY_KEY) || "[]"));
  } catch (error) {
    parsedHistory = [];
  }

  return normalizeSnapshot({
    projects: Array.isArray(parsedProjects) ? parsedProjects : [],
    history: Array.isArray(parsedHistory) ? parsedHistory : []
  });
}

async function importLegacySupabaseSnapshot(userId: string, token: string) {
  const legacySnapshot = await loadLegacySupabaseSnapshot(token);
  const currentSnapshot = await getSnapshot(userId);
  const mergedSnapshot = mergeSnapshots(currentSnapshot, legacySnapshot);
  const hasLegacyData = legacySnapshot.projects.length > 0 || legacySnapshot.history.length > 0;
  const currentFingerprint = JSON.stringify(currentSnapshot);
  const mergedFingerprint = JSON.stringify(mergedSnapshot);

  if (hasLegacyData && mergedFingerprint !== currentFingerprint) {
    await replaceSnapshot(userId, mergedSnapshot);
  }

  return {
    ok: true,
    imported: hasLegacyData,
    changed: mergedFingerprint !== currentFingerprint,
    legacyProjectsCount: legacySnapshot.projects.length,
    legacyHistoryCount: legacySnapshot.history.length,
    snapshot: mergedSnapshot
  };
}

async function upsertHistoryEntry(userId: string, rawEntry: unknown) {
  const entry = normalizeHistoryEntry(rawEntry);
  if (!entry) {
    throw new Error("Le CDC fourni est invalide.");
  }

  const entryBytes = new TextEncoder().encode(JSON.stringify(entry)).length;
  if (entryBytes > MAX_ENTRY_BYTES) {
    throw new Error(`Le CDC "${String(entry.projectName || entry.id)}" est trop volumineux.`);
  }

  await ensureSchema();
  await executeTursoPipeline([
    buildExecute(
      `
        INSERT INTO cdc_history_entries (
          user_id,
          entry_id,
          project_id,
          project_name,
          template,
          created_at,
          updated_at,
          payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, entry_id) DO UPDATE SET
          project_id = excluded.project_id,
          project_name = excluded.project_name,
          template = excluded.template,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          payload_json = excluded.payload_json
      `,
      [
        textArg(userId),
        textArg(entry.id),
        textArg(entry.projectId || ""),
        textArg(entry.projectName || ""),
        textArg(entry.template || "commande"),
        textArg(entry.createdAt),
        textArg(entry.updatedAt),
        textArg(JSON.stringify(entry))
      ]
    )
  ]);

  return {
    ok: true,
    entryId: entry.id
  };
}

async function deleteHistoryEntry(userId: string, entryId: unknown) {
  const normalizedEntryId = String(entryId || "").trim();
  if (!normalizedEntryId) {
    throw new Error("Aucun identifiant de CDC n'a ete fourni.");
  }

  await ensureSchema();
  await executeTursoPipeline([
    buildExecute(
      `
        DELETE FROM cdc_history_entries
        WHERE user_id = ? AND entry_id = ?
      `,
      [textArg(userId), textArg(normalizedEntryId)]
    )
  ]);

  return {
    ok: true,
    entryId: normalizedEntryId
  };
}

async function requireAllowedUser(request: Request): Promise<AllowedUserResult> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Les variables Supabase de la fonction sont introuvables.");
  }

  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return {
      ok: false,
      response: jsonResponse(401, {
        ok: false,
        error: "Session utilisateur manquante."
      })
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.id || !userData.user.email) {
    return {
      ok: false,
      response: jsonResponse(401, {
        ok: false,
        error: "Session utilisateur invalide."
      })
    };
  }

  const { data: allowedEmail, error: allowError } = await supabase
    .from("neodium_allowed_emails")
    .select("email")
    .maybeSingle();

  if (allowError) {
    throw new Error(allowError.message || "Impossible de verifier les emails autorises.");
  }

  if (!allowedEmail?.email) {
    return {
      ok: false,
      response: jsonResponse(403, {
        ok: false,
        error: "Cet email n'est pas autorise a utiliser le cloud CDC."
      })
    };
  }

  return {
    ok: true,
    userId: userData.user.id,
    email: userData.user.email,
    token
  };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, {
      ok: false,
      error: "Methode non supportee."
    });
  }

  try {
    const authResult = await requireAllowedUser(request);
    if (!authResult.ok) {
      return authResult.response;
    }

    const body = await request.json().catch(() => ({}));
    const action = isRecord(body) ? String(body.action || "") : "";

    if (!action) {
      return jsonResponse(400, {
        ok: false,
        error: "Action manquante."
      });
    }

    if (action === "get_snapshot") {
      const snapshot = await getSnapshot(authResult.userId);
      return jsonResponse(200, {
        ok: true,
        snapshot
      });
    }

    if (action === "replace_snapshot") {
      const result = await replaceSnapshot(authResult.userId, isRecord(body) ? body.snapshot : null);
      return jsonResponse(200, result);
    }

    if (action === "upsert_history_entry") {
      const result = await upsertHistoryEntry(authResult.userId, isRecord(body) ? body.entry : null);
      return jsonResponse(200, result);
    }

    if (action === "delete_history_entry") {
      const result = await deleteHistoryEntry(authResult.userId, isRecord(body) ? body.entryId : "");
      return jsonResponse(200, result);
    }

    if (action === "import_legacy_supabase_snapshot") {
      const result = await importLegacySupabaseSnapshot(authResult.userId, authResult.token);
      return jsonResponse(200, result);
    }

    return jsonResponse(400, {
      ok: false,
      error: "Action inconnue."
    });
  } catch (error) {
    console.error("[turso-cdc]", error);
    const message = error instanceof Error ? error.message : "Erreur interne.";
    const status = message.toLowerCase().includes("volumineux") ? 413 : 500;
    return jsonResponse(status, {
      ok: false,
      error: message
    });
  }
});
