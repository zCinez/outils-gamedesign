(function () {
  const PROJECTS_STORAGE_KEY = "neodium-cdc-projects";
  const HISTORY_STORAGE_KEY = "neodium-cdc-project-history";
  const DB_NAME = "neodium-cdc-filesystem";
  const STORE_NAME = "handles";
  const ROOT_HANDLE_KEY = "cdc-projects-root-handle";
  const PROJECTS_FOLDER_NAME = "cdc-projects";
  const MANIFEST_FILE_NAME = "manifest.js";

  function queueProjectStorageRemoteSnapshotSync() {
    window.NeodiumCdcRemoteStore?.queueFullSync?.();
  }

  function getStoredProjects() {
    try {
      const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function getStoredHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function slugifyProjectFilename(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "projet";
  }

  function openHandleDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function readStoredRootHandle() {
    try {
      const database = await openHandleDatabase();
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(ROOT_HANDLE_KEY);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      return null;
    }
  }

  async function writeStoredRootHandle(handle) {
    const database = await openHandleDatabase();
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(handle, ROOT_HANDLE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function getWritableRootHandle(promptForDirectory = false) {
    let handle = await readStoredRootHandle();

    if (handle) {
      try {
        const permission = await handle.queryPermission({ mode: "readwrite" });
        if (permission === "granted") {
          return handle;
        }
        if (permission === "prompt" && promptForDirectory) {
          const granted = await handle.requestPermission({ mode: "readwrite" });
          if (granted === "granted") {
            return handle;
          }
        }
      } catch (error) {
        handle = null;
      }
    }

    if (!promptForDirectory || typeof window.showDirectoryPicker !== "function") {
      return null;
    }

    const pickedHandle = await window.showDirectoryPicker({
      id: "neodium-cdc-projects-root",
      mode: "readwrite"
    });
    await writeStoredRootHandle(pickedHandle);
    return pickedHandle;
  }

  async function getCdcProjectsDirectoryHandle(promptForDirectory = false) {
    const rootHandle = await getWritableRootHandle(promptForDirectory);
    if (!rootHandle) return null;
    return await rootHandle.getDirectoryHandle(PROJECTS_FOLDER_NAME, { create: true });
  }

  async function writeTextFile(directoryHandle, fileName, content) {
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  function buildProjectBundle(project, historyEntries) {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      project: {
        id: project.id,
        name: project.name,
        createdAt: project.createdAt || "",
        updatedAt: project.updatedAt || ""
      },
      cdcs: historyEntries
    };
  }

  function buildProjectBundleFileContent(bundle) {
    return `window.CDC_PROJECT_BUNDLE = ${JSON.stringify(bundle, null, 2)};\n`;
  }

  function buildManifestFileContent(entries) {
    return `window.CDC_PROJECTS_FILES_MANIFEST = ${JSON.stringify(entries, null, 2)};\n`;
  }

  function saveStoredProjects(projects) {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    queueProjectStorageRemoteSnapshotSync();
  }

  function saveStoredHistory(history) {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    queueProjectStorageRemoteSnapshotSync();
  }

  function getNormalizedTimestamp(value) {
    const timestamp = Date.parse(String(value || ""));
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  function mergeProjects(existingProjects, incomingProjects) {
    const mergedById = new Map();

    [...existingProjects, ...incomingProjects].forEach(project => {
      if (!project?.id) return;
      const current = mergedById.get(project.id);
      if (!current) {
        mergedById.set(project.id, project);
        return;
      }

      const currentTimestamp = getNormalizedTimestamp(current.updatedAt || current.createdAt);
      const nextTimestamp = getNormalizedTimestamp(project.updatedAt || project.createdAt);
      if (nextTimestamp >= currentTimestamp) {
        mergedById.set(project.id, { ...current, ...project });
      }
    });

    return [...mergedById.values()].sort((a, b) =>
      String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""))
    );
  }

  function mergeHistoryEntries(existingHistory, incomingHistory) {
    const mergedById = new Map();

    [...existingHistory, ...incomingHistory].forEach(entry => {
      if (!entry?.id) return;
      const current = mergedById.get(entry.id);
      if (!current) {
        mergedById.set(entry.id, entry);
        return;
      }

      const currentTimestamp = getNormalizedTimestamp(current.updatedAt || current.createdAt);
      const nextTimestamp = getNormalizedTimestamp(entry.updatedAt || entry.createdAt);
      if (nextTimestamp >= currentTimestamp) {
        mergedById.set(entry.id, { ...current, ...entry });
      }
    });

    return [...mergedById.values()].sort((a, b) =>
      String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""))
    );
  }

  async function loadProjectBundleFromFile(fileName) {
    return await new Promise((resolve, reject) => {
      const previousBundle = window.CDC_PROJECT_BUNDLE;
      const script = document.createElement("script");
      script.src = `./${PROJECTS_FOLDER_NAME}/${fileName}`;
      script.async = true;

      script.onload = () => {
        const bundle = window.CDC_PROJECT_BUNDLE
          ? JSON.parse(JSON.stringify(window.CDC_PROJECT_BUNDLE))
          : null;

        if (previousBundle === undefined) {
          delete window.CDC_PROJECT_BUNDLE;
        } else {
          window.CDC_PROJECT_BUNDLE = previousBundle;
        }

        script.remove();
        resolve(bundle);
      };

      script.onerror = () => {
        if (previousBundle === undefined) {
          delete window.CDC_PROJECT_BUNDLE;
        } else {
          window.CDC_PROJECT_BUNDLE = previousBundle;
        }

        script.remove();
        reject(new Error(`Impossible de charger ${fileName}`));
      };

      document.head.appendChild(script);
    });
  }

  async function hydrateCdcProjectsFromFiles() {
    const manifestEntries = Array.isArray(window.CDC_PROJECTS_FILES_MANIFEST)
      ? window.CDC_PROJECTS_FILES_MANIFEST
      : [];

    if (!manifestEntries.length) {
      return { ok: true, hydrated: false, projectCount: 0 };
    }

    try {
      const bundles = [];

      for (const entry of manifestEntries) {
        if (!entry?.file) continue;
        const bundle = await loadProjectBundleFromFile(entry.file);
        if (bundle?.project?.id) {
          bundles.push(bundle);
        }
      }

      const incomingProjects = bundles.map(bundle => ({
        id: bundle.project.id,
        name: bundle.project.name || "Projet sans nom",
        createdAt: bundle.project.createdAt || "",
        updatedAt: bundle.project.updatedAt || ""
      }));

      const incomingHistory = bundles.flatMap(bundle =>
        Array.isArray(bundle.cdcs) ? bundle.cdcs : []
      );

      const mergedProjects = mergeProjects(getStoredProjects(), incomingProjects);
      const mergedHistory = mergeHistoryEntries(getStoredHistory(), incomingHistory);

      saveStoredProjects(mergedProjects);
      saveStoredHistory(mergedHistory);

      return {
        ok: true,
        hydrated: true,
        projectCount: mergedProjects.length,
        historyCount: mergedHistory.length
      };
    } catch (error) {
      return {
        ok: false,
        reason: "hydrate_failed",
        error
      };
    }
  }

  async function removeObsoleteProjectFiles(directoryHandle, wantedFileNames) {
    for await (const [name, handle] of directoryHandle.entries()) {
      if (handle.kind !== "file") continue;
      if (!name.endsWith(".js")) continue;
      if (wantedFileNames.has(name)) continue;
      await directoryHandle.removeEntry(name);
    }
  }

  async function syncCdcProjectsDirectoryFromStorage({ promptForDirectory = false } = {}) {
    try {
      const directoryHandle = await getCdcProjectsDirectoryHandle(promptForDirectory);
      if (!directoryHandle) {
        return { ok: false, reason: "directory_unavailable" };
      }

      const projects = getStoredProjects();
      const history = getStoredHistory();
      const wantedFileNames = new Set([MANIFEST_FILE_NAME]);
      const manifestEntries = [];

      for (const project of projects) {
        const fileName = `${slugifyProjectFilename(project.name || project.id)}.js`;
        wantedFileNames.add(fileName);

        const projectHistory = history
          .filter(entry => entry.projectId === project.id)
          .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

        const bundle = buildProjectBundle(project, projectHistory);
        await writeTextFile(directoryHandle, fileName, buildProjectBundleFileContent(bundle));

        manifestEntries.push({
          id: project.id,
          name: project.name || "Projet sans nom",
          file: fileName,
          updatedAt: project.updatedAt || "",
          cdcCount: projectHistory.length
        });
      }

      await writeTextFile(directoryHandle, MANIFEST_FILE_NAME, buildManifestFileContent(manifestEntries));
      await removeObsoleteProjectFiles(directoryHandle, wantedFileNames);

      return {
        ok: true,
        projectCount: projects.length,
        directoryName: PROJECTS_FOLDER_NAME
      };
    } catch (error) {
      if (error?.name === "AbortError") {
        return { ok: false, reason: "cancelled" };
      }
      return {
        ok: false,
        reason: "write_failed",
        error
      };
    }
  }

  async function syncCdcProjectsDirectoryIfConnected() {
    return await syncCdcProjectsDirectoryFromStorage({ promptForDirectory: false });
  }

  async function hasStoredCdcProjectsDirectoryHandle() {
    const handle = await readStoredRootHandle();
    if (!handle) return false;

    try {
      const permission = await handle.queryPermission({ mode: "readwrite" });
      return permission === "granted";
    } catch (error) {
      return false;
    }
  }

  window.syncCdcProjectsDirectoryFromStorage = syncCdcProjectsDirectoryFromStorage;
  window.syncCdcProjectsDirectoryIfConnected = syncCdcProjectsDirectoryIfConnected;
  window.hasStoredCdcProjectsDirectoryHandle = hasStoredCdcProjectsDirectoryHandle;
  window.hydrateCdcProjectsFromFiles = hydrateCdcProjectsFromFiles;
})();
