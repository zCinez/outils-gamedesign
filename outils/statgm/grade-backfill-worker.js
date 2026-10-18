importScripts("player-history.js?v=20261006c", "archive-db.js?v=20261006c", "import-format.js?v=20261006a");
self.onmessage = async ({ data: { datasetId, completion = false, firstConnection = false } }) => {
  try {
    const updated = await StatGMArchiveDB.backfillGrades(datasetId);
    const completions = firstConnection ? await StatGMArchiveDB.backfillCardDetails(datasetId) : completion ? await StatGMArchiveDB.backfillCompletions(datasetId) : 0;
    postMessage({ type: "complete", updated, completions });
  } catch (error) {
    postMessage({ type: "error", message: error.message });
  }
};
