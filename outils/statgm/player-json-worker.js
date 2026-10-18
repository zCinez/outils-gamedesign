importScripts("archive-db.js?v=20261006c");
self.onmessage = async ({ data: { datasetId, uuid, sequence } }) => {
  try {
    const active = await StatGMArchiveDB.readActive();
    if (active?.datasetId !== datasetId) throw new Error("L’export actif a changé.");
    const record = await StatGMArchiveDB.readPlayerRecord(datasetId, uuid, sequence);
    if (!record) throw new Error("Fichier joueur introuvable.");
    const blob = new Blob([JSON.stringify(record.data, null, 2)], { type: "application/json" });
    self.postMessage({ blob });
  } catch (error) { self.postMessage({ error: error.message }); }
};
