const StatGMStore = (() => {
  const DB_NAME = "statgm-data";
  const DB_VERSION = 1;
  const STORE_NAME = "kv";
  const trackedKeys = ["statgm-players", "statgm-releves"];
  const cache = new Map();
  let dbPromise = null;
  let readyPromise = null;
  let useLocalStorageFallback = false;

  const cloneValue = (value) => {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  };

  const openDatabase = () => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB indisponible"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Impossible d'ouvrir IndexedDB"));
    });

    return dbPromise;
  };

  const readRecord = async (key) => {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error || new Error(`Lecture impossible pour ${key}`));
    });
  };

  const writeRecord = async (key, value) => {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.put({ key, value });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error(`Ecriture impossible pour ${key}`));
      transaction.onabort = () => reject(transaction.error || new Error(`Transaction interrompue pour ${key}`));
    });
  };

  const readLocalMirror = (key) => {
    try {
      const rawValue = localStorage.getItem(key);
      if (rawValue === null) {
        return { hasValue: false, value: [] };
      }
      const parsed = JSON.parse(rawValue);
      return {
        hasValue: true,
        value: Array.isArray(parsed) ? parsed : []
      };
    } catch {
      return { hasValue: false, value: [] };
    }
  };

  const hydrateCache = async () => {
    await openDatabase();

    const legacyValues = new Map(
      trackedKeys.map((key) => [key, readLocalMirror(key)])
    );

    for (const key of trackedKeys) {
      const storedValue = await readRecord(key);
      const legacyValue = legacyValues.get(key);

      if (legacyValue?.hasValue) {
        cache.set(key, legacyValue.value);
        await writeRecord(key, legacyValue.value);
        continue;
      }

      if (Array.isArray(storedValue)) {
        cache.set(key, storedValue);
        localStorage.setItem(key, JSON.stringify(storedValue));
        continue;
      }

      const fallbackValue = [];
      cache.set(key, fallbackValue);
      await writeRecord(key, fallbackValue);
      localStorage.setItem(key, JSON.stringify(fallbackValue));
    }
  };

  const ready = async () => {
    if (!readyPromise) {
      readyPromise = hydrateCache().catch(() => {
        useLocalStorageFallback = true;
        trackedKeys.forEach((key) => {
          cache.set(key, readLocalMirror(key).value);
        });
      });
    }

    return readyPromise;
  };

  const getList = (key) => {
    const values = cache.get(key);
    return Array.isArray(values) ? cloneValue(values) : [];
  };

  const setList = async (key, values) => {
    const safeValues = Array.isArray(values) ? values : [];
    cache.set(key, cloneValue(safeValues));
    localStorage.setItem(key, JSON.stringify(safeValues));
    if (useLocalStorageFallback) {
      return;
    }
    await writeRecord(key, safeValues);
  };

  return {
    ready,
    getList,
    setList
  };
})();

window.StatGMStore = StatGMStore;
