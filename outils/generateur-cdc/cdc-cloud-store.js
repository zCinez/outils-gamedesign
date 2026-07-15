(function () {
  const PROJECTS_STORAGE_KEY = "neodium-cdc-projects";
  const HISTORY_STORAGE_KEY = "neodium-cdc-project-history";
  const FUNCTION_NAME = "turso-cdc";
  const FULL_SYNC_DEBOUNCE_MS = 700;

  let hydrationPromise = null;
  let operationLock = Promise.resolve();
  let fullSyncTimerId = null;
  let suppressRemoteSync = false;
  let lastHydratedEmail = "";
  const warnedReasons = new Set();

  function warnOnce(reason, error) {
    if (warnedReasons.has(reason)) return;
    warnedReasons.add(reason);
    console.warn(`[Neodium CDC Cloud] ${reason}`, error || "");
  }

  function getTimestampRank(value) {
    const timestamp = Date.parse(String(value || ""));
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  function readStoredArray(storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function normalizeProject(rawProject) {
    if (!rawProject || typeof rawProject !== "object" || Array.isArray(rawProject)) {
      return null;
    }

    const now = new Date().toISOString();
    const project = JSON.parse(JSON.stringify(rawProject));
    const id = String(project.id || "").trim();
    if (!id) return null;

    const createdAt = String(project.createdAt || now).trim() || now;
    const updatedAt = String(project.updatedAt || createdAt).trim() || createdAt;

    return {
      ...project,
      id,
      name: String(project.name || "Projet sans nom").trim() || "Projet sans nom",
      createdAt,
      updatedAt
    };
  }

  function normalizeHistoryEntry(rawEntry) {
    if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) {
      return null;
    }

    const now = new Date().toISOString();
    const entry = JSON.parse(JSON.stringify(rawEntry));
    const id = String(entry.id || "").trim();
    if (!id) return null;

    const createdAt = String(entry.createdAt || now).trim() || now;
    const updatedAt = String(entry.updatedAt || createdAt).trim() || createdAt;

    return {
      ...entry,
      id,
      projectId: String(entry.projectId || "").trim(),
      projectName: String(entry.projectName || "Projet sans nom").trim() || "Projet sans nom",
      template: String(entry.template || "commande").trim() || "commande",
      createdAt,
      updatedAt
    };
  }

  function sortProjects(projects) {
    return [...projects].sort((a, b) =>
      String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""))
    );
  }

  function sortHistory(history) {
    return [...history].sort((a, b) =>
      String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""))
    );
  }

  function normalizeSnapshot(snapshot) {
    const source = snapshot && typeof snapshot === "object" ? snapshot : {};
    return {
      projects: sortProjects((Array.isArray(source.projects) ? source.projects : []).map(normalizeProject).filter(Boolean)),
      history: sortHistory((Array.isArray(source.history) ? source.history : []).map(normalizeHistoryEntry).filter(Boolean))
    };
  }

  function mergeByLatest(localItems, remoteItems) {
    const merged = new Map();

    [...remoteItems, ...localItems].forEach((item) => {
      if (!item?.id) return;
      const current = merged.get(item.id);
      if (!current) {
        merged.set(item.id, item);
        return;
      }

      const currentRank = getTimestampRank(current.updatedAt || current.createdAt);
      const nextRank = getTimestampRank(item.updatedAt || item.createdAt);
      if (nextRank >= currentRank) {
        merged.set(item.id, item);
      }
    });

    return [...merged.values()];
  }

  function mergeSnapshots(localSnapshot, remoteSnapshot) {
    const mergedProjects = mergeByLatest(localSnapshot.projects, remoteSnapshot.projects);
    const mergedHistory = mergeByLatest(localSnapshot.history, remoteSnapshot.history).slice(0, 50);

    return {
      projects: sortProjects(mergedProjects),
      history: sortHistory(mergedHistory)
    };
  }

  function getSnapshotFingerprint(snapshot) {
    return JSON.stringify(normalizeSnapshot(snapshot));
  }

  function readLocalSnapshot() {
    return normalizeSnapshot({
      projects: readStoredArray(PROJECTS_STORAGE_KEY),
      history: readStoredArray(HISTORY_STORAGE_KEY)
    });
  }

  function writeLocalSnapshot(snapshot) {
    suppressRemoteSync = true;
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(snapshot.projects));
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(snapshot.history));
    } finally {
      suppressRemoteSync = false;
    }
  }

  function emitStorageUpdated(detail = {}) {
    window.dispatchEvent(new CustomEvent("neodium-cdc-storage-updated", { detail }));
  }

  function applySnapshotLocally(snapshot, source = "remote") {
    const normalizedSnapshot = normalizeSnapshot(snapshot);
    const localFingerprint = getSnapshotFingerprint(readLocalSnapshot());
    const nextFingerprint = getSnapshotFingerprint(normalizedSnapshot);

    if (nextFingerprint !== localFingerprint) {
      writeLocalSnapshot(normalizedSnapshot);
      emitStorageUpdated({
        source,
        snapshot: normalizedSnapshot
      });
    }

    return normalizedSnapshot;
  }

  async function waitForSession() {
    const cloudSync = window.NeodiumCloudSync;
    if (!cloudSync?.whenReady || typeof cloudSync.getSession !== "function") {
      return null;
    }

    try {
      await cloudSync.whenReady();
    } catch (error) {
      return null;
    }

    try {
      return await cloudSync.getSession();
    } catch (error) {
      warnOnce("Lecture de session Supabase impossible.", error);
      return null;
    }
  }

  async function extractFunctionErrorDetails(error) {
    const fallbackMessage = String(error?.message || "Appel de fonction impossible.");
    const context = error?.context;
    const status = Number(context?.status || 0);
    let backendMessage = "";

    if (context && typeof context === "object") {
      const response = typeof context.clone === "function" ? context.clone() : context;

      if (typeof response.json === "function") {
        try {
          const payload = await response.json();
          backendMessage = String(
            payload?.error
            || payload?.message
            || payload?.reason
            || ""
          ).trim();
        } catch (parseError) {
          backendMessage = "";
        }
      }

      if (!backendMessage && typeof response.text === "function") {
        try {
          backendMessage = String(await response.text()).trim();
        } catch (parseError) {
          backendMessage = "";
        }
      }
    }

    let message = backendMessage || fallbackMessage;

    if (status === 400 && /action inconnue/i.test(message)) {
      message = `${message} La fonction turso-cdc doit etre redeployee.`;
    }

    return {
      status,
      message
    };
  }

  async function invokeRemote(action, payload = {}) {
    const cloudSync = window.NeodiumCloudSync;
    if (!cloudSync?.invokeFunction) {
      return { ok: false, reason: "function_unavailable" };
    }

    const session = await waitForSession();
    if (!session?.access_token || !session?.user?.id) {
      return { ok: false, reason: "signed_out" };
    }

    const { data, error } = await cloudSync.invokeFunction(FUNCTION_NAME, {
      body: {
        action,
        ...payload
      }
    });

    if (error) {
      const errorDetails = await extractFunctionErrorDetails(error);
      warnOnce(`Appel de la fonction ${FUNCTION_NAME} en erreur.`, error);
      return {
        ok: false,
        reason: "invoke_failed",
        error: {
          ...error,
          message: errorDetails.message,
          status: errorDetails.status
        }
      };
    }

    if (!data || typeof data !== "object") {
      return { ok: false, reason: "invalid_response" };
    }

    return data;
  }

  function runExclusive(task) {
    operationLock = operationLock.then(task, task);
    return operationLock;
  }

  async function hydrateFromRemote() {
    const localSnapshot = readLocalSnapshot();
    const remoteResult = await invokeRemote("get_snapshot");

    if (!remoteResult?.ok) {
      return {
        ok: true,
        hydrated: false,
        reason: remoteResult?.reason || "remote_unavailable",
        snapshot: localSnapshot
      };
    }

    const remoteSnapshot = normalizeSnapshot(remoteResult.snapshot || {});
    const mergedSnapshot = mergeSnapshots(localSnapshot, remoteSnapshot);
    const localFingerprint = getSnapshotFingerprint(localSnapshot);
    const remoteFingerprint = getSnapshotFingerprint(remoteSnapshot);
    const mergedFingerprint = getSnapshotFingerprint(mergedSnapshot);

    if (mergedFingerprint !== localFingerprint) {
      applySnapshotLocally(mergedSnapshot, "remote");
    }

    if (mergedFingerprint !== remoteFingerprint && mergedSnapshot.history.length + mergedSnapshot.projects.length > 0) {
      queueFullSync();
    }

    return {
      ok: true,
      hydrated: mergedFingerprint !== localFingerprint,
      snapshot: mergedSnapshot
    };
  }

  function ensureHydration() {
    if (!hydrationPromise) {
      hydrationPromise = runExclusive(hydrateFromRemote);
    }
    return hydrationPromise;
  }

  function clearQueuedFullSync() {
    if (!fullSyncTimerId) return;
    clearTimeout(fullSyncTimerId);
    fullSyncTimerId = null;
  }

  async function forceSnapshotSync() {
    await ensureHydration();

    if (suppressRemoteSync) {
      return { ok: false, reason: "suppressed" };
    }

    const snapshot = readLocalSnapshot();
    return await invokeRemote("replace_snapshot", { snapshot });
  }

  function queueFullSync({ immediate = false } = {}) {
    if (suppressRemoteSync) {
      return;
    }

    clearQueuedFullSync();
    fullSyncTimerId = window.setTimeout(() => {
      fullSyncTimerId = null;
      void runExclusive(async () => {
        const result = await forceSnapshotSync();
        if (!result?.ok && result?.reason && result.reason !== "signed_out") {
          warnOnce(`Synchronisation CDC complete impossible (${result.reason}).`, result.error);
        }
        return result;
      });
    }, immediate ? 0 : FULL_SYNC_DEBOUNCE_MS);
  }

  async function syncHistoryEntry(entry) {
    return await runExclusive(async () => {
      await ensureHydration();
      if (suppressRemoteSync) {
        return { ok: false, reason: "suppressed" };
      }

      const normalizedEntry = normalizeHistoryEntry(entry);
      if (!normalizedEntry?.id) {
        return { ok: false, reason: "missing_entry" };
      }

      const result = await invokeRemote("upsert_history_entry", { entry: normalizedEntry });
      if (!result?.ok && result?.reason && result.reason !== "signed_out") {
        warnOnce(`Synchronisation du CDC ${normalizedEntry.id} impossible (${result.reason}).`, result.error);
      }
      return result;
    });
  }

  async function deleteHistoryEntry(entryId) {
    return await runExclusive(async () => {
      await ensureHydration();
      if (suppressRemoteSync) {
        return { ok: false, reason: "suppressed" };
      }

      const normalizedEntryId = String(entryId || "").trim();
      if (!normalizedEntryId) {
        return { ok: false, reason: "missing_entry" };
      }

      const result = await invokeRemote("delete_history_entry", { entryId: normalizedEntryId });
      if (!result?.ok && result?.reason && result.reason !== "signed_out") {
        warnOnce(`Suppression distante du CDC ${normalizedEntryId} impossible (${result.reason}).`, result.error);
      }
      return result;
    });
  }

  async function importLegacySupabaseSnapshot() {
    return await runExclusive(async () => {
      await ensureHydration();

      const result = await invokeRemote("import_legacy_supabase_snapshot");
      if (!result?.ok) {
        if (result?.reason && result.reason !== "signed_out") {
          warnOnce(`Import Supabase -> Turso impossible (${result.reason}).`, result.error);
        }
        return result;
      }

      const nextSnapshot = applySnapshotLocally(result.snapshot || {}, "legacy-supabase");
      hydrationPromise = Promise.resolve({
        ok: true,
        hydrated: true,
        snapshot: nextSnapshot
      });

      return {
        ...result,
        snapshot: nextSnapshot
      };
    });
  }

  window.NeodiumCdcRemoteStore = {
    whenHydrated: ensureHydration,
    queueFullSync,
    forceSnapshotSync,
    syncHistoryEntry,
    deleteHistoryEntry,
    importLegacySupabaseSnapshot,
    readLocalSnapshot
  };

  window.addEventListener("neodium-cloud-state", (event) => {
    const nextEmail = String(event?.detail?.email || "").trim().toLowerCase();

    if (!nextEmail) {
      lastHydratedEmail = "";
      hydrationPromise = null;
      return;
    }

    if (nextEmail === lastHydratedEmail) {
      return;
    }

    lastHydratedEmail = nextEmail;
    hydrationPromise = null;
    void ensureHydration();
  });

  void ensureHydration();
})();
