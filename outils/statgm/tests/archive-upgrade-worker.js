// Exercise the real v1 -> v3 migration in a private test database.
const factory = indexedDB, fixtureName = `statgm-upgrade-${crypto.randomUUID()}`;
self.onmessage = async () => {
  let database;
  try {
    const uuid = i => `${i.toString(16).padStart(8, "0")}-1234-4000-8000-0123456789ab`;
    database = await new Promise((resolve, reject) => {
      const request = factory.open(fixtureName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("meta", { keyPath: "key" });
        for (const [name, keyPath] of [["players", ["datasetId", "uuid"]], ["records", ["datasetId", "sequence"]]]) request.result.createObjectStore(name, { keyPath }).createIndex("dataset", "datasetId");
      };
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const summary = { datasetId: "legacy", playerCount: 5500, fileCount: 5500, filename: "old.zip" };
    await new Promise((resolve, reject) => {
      const tx = database.transaction(["meta", "players", "records"], "readwrite");
      tx.objectStore("meta").put({ key: "active", value: summary });
      for (let i = 0; i < 5500; i++) {
        tx.objectStore("players").put({ datasetId: "legacy", uuid: uuid(i), name: `Legacy_${i}`, fileCount: 1 });
        tx.objectStore("records").put({ datasetId: "legacy", sequence: i, uuid: uuid(i), source: `gdstats_${uuid(i)}.json`, data: { profile: { luckperms_primary_group: "diamantv" }, stats: { score: i } } });
      }
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
    database.close();
    Object.defineProperty(self, "indexedDB", { value: { open: (name, version) => {
      if (name !== "statgm-archives") throw new Error("Unexpected database name.");
      return factory.open(fixtureName, version);
    } } });
    importScripts("../archive-db.js?v=20261006c", "../import-format.js?v=20261001d");
    database = await StatGMArchiveDB.open();
    if (database.version !== 3 || !database.objectStoreNames.contains("chunks") || !database.objectStoreNames.contains("snapshots")) throw new Error("Version ou stockage des blocs incorrect.");
    if (JSON.stringify(await StatGMArchiveDB.readActive()) !== JSON.stringify(summary)) throw new Error("L’import actif a changé.");
    if ((await StatGMArchiveDB.readPlayers("legacy")).length !== 5500) throw new Error("Des joueurs ont disparu.");
    let count = 0, after = null;
    do {
      const batch = await StatGMArchiveDB.readRecordPage("legacy", after);
      for (const record of batch.rows) { if (record.data.stats.score !== record.sequence) throw new Error("Les statistiques ont changé."); count++; }
      after = batch.next;
    } while (after);
    if (count !== 5500) throw new Error("Des fichiers de statistiques ont disparu.");
    await StatGMArchiveDB.backfillGrades("legacy");
    if (!(await StatGMArchiveDB.readPlayers("legacy")).every(player => player.grade === "diamantv")) throw new Error("Les anciens grades ne sont pas récupérés.");
    postMessage({ ok: true, message: "PASS — migration de 5 500 anciens joueurs vers la version 3 : import actif, statistiques et grades préservés." });
  } catch (error) { postMessage({ ok: false, message: `FAIL — ${error.message}` }); }
  finally { database?.close(); factory.deleteDatabase(fixtureName); }
};
