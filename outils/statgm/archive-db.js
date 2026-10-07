/* Shared by the page and the import worker. Raw statistics never enter localStorage. */
(() => {
  const scope = globalThis;
  const hostname = String(scope.location?.hostname || "").toLowerCase();
  const isLocalPreview = hostname === "localhost" || hostname.endsWith(".localhost") || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) || hostname === "::1" || hostname === "[::1]";
  const activeKey = isLocalPreview ? "preview:active" : "active";
  const previousLocal = summary => summary && summary.recordsLocal !== false ? { ...summary, ownerId: "", cloudRevision: "", baseRevision: "", pending: false } : null;
  let databasePromise;
  function open() {
    if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open("statgm-archives", 3);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
        for (const [name, keyPath] of [["players", ["datasetId", "uuid"]], ["records", ["datasetId", "sequence"]]]) {
          const store = db.objectStoreNames.contains(name) ? request.transaction.objectStore(name) : db.createObjectStore(name, { keyPath });
          if (!store.indexNames.contains("dataset")) store.createIndex("dataset", "datasetId");
          if (name === "records" && !store.indexNames.contains("player")) store.createIndex("player", ["datasetId", "uuid", "sequence"]);
        }
        if (!db.objectStoreNames.contains("chunks")) db.createObjectStore("chunks", { keyPath: "hash" });
        if (!db.objectStoreNames.contains("snapshots")) {
          const store = db.createObjectStore("snapshots", { keyPath: ["datasetId", "sequence"] });
          store.createIndex("dataset", "datasetId"); store.createIndex("player", ["datasetId", "uuid", "sequence"]);
        }
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Ferme les autres onglets StatGM, puis réessaie."));
    });
    return databasePromise;
  }
  const finished = (transaction) => new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Impossible d’enregistrer les données."));
    transaction.onabort = () => reject(transaction.error || new Error("Enregistrement interrompu."));
  });
  async function writeBatch(players, records) {
    const db = await open();
    const tx = db.transaction(["players", "records", "snapshots"], "readwrite");
    const complete = finished(tx);
    for (const player of players) tx.objectStore("players").put(player);
    for (const record of records) {
      tx.objectStore("records").put(record);
      const snapshot = scope.StatGMHistory?.descriptor(record) || { ...record.snapshot, datasetId:record.datasetId, uuid:record.uuid, sequence:record.sequence, source:record.source, exportedAt:record.data?.exported_at_iso || null, sortTime:null, exportId:record.datasetId };
      tx.objectStore("snapshots").put(snapshot);
    }
    await complete;
  }
  async function readActive() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const store = db.transaction("meta").objectStore("meta"), request = store.get(activeKey);
      request.onsuccess = () => {
        if (request.result !== undefined || !isLocalPreview) { resolve(request.result?.value || null); return; }
        // Reuse an already complete local copy; keep its original account entry intact.
        const previous = store.get("active");
        previous.onsuccess = () => resolve(previousLocal(previous.result?.value));
        previous.onerror = () => reject(previous.error);
      };
      request.onerror = () => reject(request.error);
    });
  }
  async function readMeta(key) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const request = db.transaction("meta").objectStore("meta").get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }
  async function writeMeta(key, value) {
    const db = await open(), tx = db.transaction("meta", "readwrite"), complete = finished(tx);
    tx.objectStore("meta").put({ key, value });
    await complete;
  }
  async function useAccount(ownerId) {
    const active = await readActive();
    if (active && !active.ownerId && ownerId) {
      const bound = { ...active, ownerId };
      await activate(bound); return bound;
    }
    if (active && (!active.ownerId || active.ownerId === ownerId)) return active;
    const saved = ownerId ? await readMeta(`account:${ownerId}`) : null;
    await writeMeta(activeKey, saved);
    return saved;
  }
  async function readRecordPage(datasetId, after, limit = 32, uuid = null, minimumSequence = 0) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const index = db.transaction("records").objectStore("records").index("player");
      const first = after || [datasetId, uuid || "", -1];
      const last = [datasetId, uuid || "\uffff", Number.MAX_SAFE_INTEGER];
      const request = index.openCursor(IDBKeyRange.bound(first, last, Boolean(after), false));
      const rows = []; let size = 0, next = null;
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) { resolve({ rows, next: null }); return; }
        if (cursor.primaryKey[1] < minimumSequence) { cursor.continue(); return; }
        rows.push(cursor.value); next = cursor.key;
        // Bounded pages; one exceptionally large player file is still handled alone.
        size += cursor.value.bytes || JSON.stringify(cursor.value.data).length * 2;
        if (rows.length >= limit || size >= 256 * 1024) resolve({ rows, next });
        else cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
  }
  async function putChunk(chunk) {
    const db = await open(), tx = db.transaction("chunks", "readwrite"), complete = finished(tx);
    tx.objectStore("chunks").put(chunk); await complete;
  }
  async function readChunk(hash) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const request = db.transaction("chunks").objectStore("chunks").get(hash);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  async function pruneChunks() {
    const db = await open();
    const values = await new Promise((resolve, reject) => {
      const request = db.transaction("meta").objectStore("meta").getAll();
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const referenced = new Set();
    for (const item of values) {
      if (item.key.startsWith("plan:") || item.key.startsWith("manifest:") || item.key.startsWith("inherited:")) for (const chunk of item.value?.chunks || []) referenced.add(chunk.hash);
    }
    const tx = db.transaction("chunks", "readwrite"), complete = finished(tx);
    const request = tx.objectStore("chunks").openKeyCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      if (!referenced.has(cursor.key)) tx.objectStore("chunks").delete(cursor.key);
      cursor.continue();
    };
    await complete;
  }
  async function readPlayers(datasetId) {
    if (!datasetId) return [];
    const db = await open();
    return new Promise((resolve, reject) => {
      const request = db.transaction("players").objectStore("players").index("dataset").getAll(datasetId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function readPlayer(datasetId, uuid) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const request = db.transaction("players").objectStore("players").get([datasetId, uuid]);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  async function readPlayerRecordKeys(datasetId, uuid) {
    const db = await open();
    return new Promise((resolve, reject) => {
      // Index keys only: never read the other players' JSON or all duplicate files.
      const request = db.transaction("records").objectStore("records").index("player")
        .getAllKeys(IDBKeyRange.bound([datasetId, uuid, -1], [datasetId, uuid, Number.MAX_SAFE_INTEGER]));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function readPlayerSnapshots(datasetId, uuid) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const request = db.transaction("snapshots").objectStore("snapshots").index("player").getAll(IDBKeyRange.bound([datasetId,uuid,-1],[datasetId,uuid,Number.MAX_SAFE_INTEGER]));
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
  }
  async function readPlayerRecord(datasetId, uuid, sequence) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const request = db.transaction("records").objectStore("records").get([datasetId, sequence]);
      request.onsuccess = () => resolve(request.result?.uuid === uuid ? request.result : null);
      request.onerror = () => reject(request.error);
    });
  }
  async function activate(summary, expectedDatasetId) {
    const db = await open();
    const tx = db.transaction(["meta", "players"], "readwrite");
    const complete = finished(tx);
    if (expectedDatasetId !== undefined) {
      const store = tx.objectStore("meta"), current = store.get(activeKey);
      const check = summary => { if ((summary?.datasetId || null) !== expectedDatasetId) tx.abort(); };
      current.onsuccess = () => {
        if (current.result !== undefined || !isLocalPreview) { check(current.result?.value); return; }
        const previous = store.get("active");
        previous.onsuccess = () => check(previousLocal(previous.result?.value));
      };
    }
    const request = tx.objectStore("players").index("dataset").count(summary.datasetId);
    request.onsuccess = () => {
      if (!request.result || request.result !== summary.playerCount) { tx.abort(); return; }
      tx.objectStore("meta").put({ key: activeKey, value: summary });
      if (summary.ownerId) tx.objectStore("meta").put({ key: `account:${summary.ownerId}`, value: summary });
    };
    await complete;
  }
  async function backfillGrades(datasetId) {
    const players = await readPlayers(datasetId);
    const missing = new Map(players.filter(player => typeof player.grade !== "string").map(player => [player.uuid, player]));
    if (!missing.size) return 0;
    const db = await open();
    const grades = new Map(), latest = new Map();
    // Run this cursor in a worker: each raw record can hold substantial statistics.
    // Keep only UUID/grade pairs in memory, never a second copy of all raw exports.
    await new Promise((resolve, reject) => {
      const tx = db.transaction("records", "readonly");
      const request = tx.objectStore("records").index("dataset").openCursor(IDBKeyRange.only(datasetId));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        const record = cursor.value;
        if (missing.has(record.uuid)) {
          const grade = globalThis.StatGMImportFormat.extractGrade(record.data);
          const snapshot = scope.StatGMHistory?.descriptor(record);
          if (grade && (!snapshot || !latest.has(record.uuid) || scope.StatGMHistory.compareSnapshots(snapshot, latest.get(record.uuid)) >= 0)) { grades.set(record.uuid, grade); if (snapshot) latest.set(record.uuid, snapshot); }
        }
        cursor.continue();
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("Impossible de retrouver les grades."));
      tx.onabort = () => reject(tx.error || new Error("Lecture des grades interrompue."));
    });
    const updated = [...missing.values()].map(player => ({ ...player, grade: grades.get(player.uuid) || "" }));
    await writeBatch(updated, []);
    return updated.length;
  }
  async function backfillFields(datasetId, fields) {
    const players = await readPlayers(datasetId);
    const missing = new Map(players.filter(player => fields.some(([key]) => player[key] === undefined)).map(player => [player.uuid, { ...player }]));
    if (!missing.size) return 0;
    const needed = new Map([...missing.values()].map(player => [player.uuid, fields.filter(([key]) => player[key] === undefined)]));
    for (const player of missing.values()) for (const [key] of needed.get(player.uuid)) player[key] = null;
    const db = await open();
    const latest = new Map();
    // One bounded cursor in a worker; prefer the most recent export date.
    await new Promise((resolve, reject) => {
      const tx = db.transaction("records", "readonly");
      const request = tx.objectStore("records").index("dataset").openCursor(IDBKeyRange.only(datasetId));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        const record = cursor.value, player = missing.get(record.uuid), snapshot = scope.StatGMHistory?.descriptor(record);
        if (player && (!snapshot || !latest.has(player.uuid) || scope.StatGMHistory.compareSnapshots(snapshot, latest.get(player.uuid)) >= 0)) {
          for (const [key, extract] of needed.get(player.uuid)) player[key] = globalThis.StatGMImportFormat[extract](record.data);
          if (snapshot) latest.set(player.uuid, snapshot);
        }
        cursor.continue();
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Lecture des informations des joueurs interrompue."));
    });
    await writeBatch([...missing.values()], []);
    return missing.size;
  }
  const backfillCompletions = datasetId => backfillFields(datasetId, [["completion", "extractCompletion"]]);
  const backfillCardDetails = datasetId => backfillFields(datasetId, [["completion", "extractCompletion"], ["firstPlayedMs", "extractFirstPlayed"]]);
  async function discard(datasetId) {
    if (!datasetId) return;
    const db = await open();
    const tx = db.transaction(["meta", "players", "records", "snapshots"], "readwrite");
    const complete = finished(tx);
    const references = tx.objectStore("meta").getAll();
    references.onsuccess = () => {
      // Preserve the current import of every account, including signed-out accounts.
      if (references.result.some(item => (item.key === "active" || item.key === "preview:active" || item.key.startsWith("account:")) && item.value?.datasetId === datasetId)) return;
      for (const name of ["players", "records", "snapshots"]) {
        const request = tx.objectStore(name).index("dataset").openCursor(IDBKeyRange.only(datasetId));
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) { cursor.delete(); cursor.continue(); }
        };
      }
      tx.objectStore("meta").delete(`plan:${datasetId}`);
      tx.objectStore("meta").delete(`manifest:${datasetId}`);
      tx.objectStore("meta").delete(`inherited:${datasetId}`);
      const markers = tx.objectStore("meta").openKeyCursor(IDBKeyRange.bound(`bucket:${datasetId}:`, `bucket:${datasetId}:\uffff`));
      markers.onsuccess = () => {
        const cursor = markers.result;
        if (!cursor) return;
        tx.objectStore("meta").delete(cursor.key); cursor.continue();
      };
    };
    await complete;
  }
  scope.StatGMArchiveDB = { isLocalPreview, activeKey, open, writeBatch, readActive, readPlayers, readPlayer, readPlayerRecordKeys, readPlayerRecord, readPlayerSnapshots, activate, backfillGrades, backfillCompletions, backfillCardDetails, discard, readMeta, writeMeta, useAccount, readRecordPage, putChunk, readChunk, pruneChunks };
})();
