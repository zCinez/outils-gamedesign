/* Snapshot metadata and comparisons. Original exported JSON stays immutable. */
(() => {
  const numeric = value => typeof value === "number" && Number.isFinite(value) ? value : null;
  function stamp(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null;
    const wall = !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
    const normalized=value.replace(/\.(\d{3})\d+/,".$1");
    const result = Date.parse(wall ? normalized + "Z" : normalized);
    return Number.isFinite(result) ? result : null;
  }
  function descriptor(record, fallback = {}) {
    const previous = record.snapshot || {};
    const raw = record.data?.exported_at_iso;
    const exportedAt = stamp(raw) !== null ? raw : previous.exportedAt || fallback.exportedAt || null;
    return { datasetId: record.datasetId, sequence: record.sequence, uuid: record.uuid,
      exportId: previous.exportId || fallback.exportId || fallback.datasetId || "legacy",
      exportedAt, sortTime: stamp(exportedAt), importedAt: previous.importedAt || fallback.importedAt || null,
      archive: previous.archive || fallback.filename || "Export", source: record.source || "JSON" };
  }
  const compareSnapshots = (a, b) => Number(a.sortTime !== null)-Number(b.sortTime !== null) || (a.sortTime !== null ? a.sortTime-b.sortTime : 0) || a.sequence-b.sequence;
  function observations(rows) {
    const groups = new Map();
    for (const row of rows) {
      const key = `${row.exportId}|${row.exportedAt || ""}`;
      if (!groups.has(key) || row.sequence > groups.get(key).sequence) groups.set(key, row);
    }
    return [...groups.values()].sort(compareSnapshots);
  }
  async function catalog(db, active, uuid) {
    const keys=await db.readPlayerRecordKeys(active.datasetId,uuid), rows=await db.readPlayerSnapshots(active.datasetId,uuid);
    const known=new Set(rows.filter(row=>row.archive && row.exportId && row.sortTime===stamp(row.exportedAt)).map(row=>row.sequence));
    for(const key of keys){
      if(known.has(key[1]))continue;
      const record=await db.readPlayerRecord(active.datasetId,uuid,key[1]);
      if(record){record.snapshot=descriptor(record,active.exports?.[0] || active);await db.writeBatch([],[record]);const index=rows.findIndex(row=>row.sequence===record.sequence);if(index>=0)rows[index]=record.snapshot;else rows.push(record.snapshot);}
    }
    return rows.sort(compareSnapshots);
  }
  function flatten(data) {
    const values = new Map(), stack = [{value: data, path: []}];
    while (stack.length) {
      const {value, path} = stack.pop();
      if (value && typeof value === "object") {
        if (Array.isArray(value)) {
          for (let index = value.length - 1; index >= 0; index--) {
            const item = value[index], identity = item?.resource_key || item?.key;
            stack.push({value:item, path:[...path, identity ? `[${identity}]` : String(index)]});
          }
        } else for (const [key, item] of Object.entries(value)) stack.push({value:item,path:[...path,key]});
      } else if (numeric(value) !== null) values.set(path.join("."), {path, value});
    }
    return values;
  }
  const metrics = [
    {key:"earned",label:"Argent gagné total",path:"economy.vault_gained_total_plugin",unit:"money",counter:true},
    {key:"spent",label:"Argent dépensé total",path:"economy.vault_spent_total_plugin",unit:"money",counter:true},
    {key:"balance",label:"Argent au moment du relevé",path:"profile.vault_balance",unit:"money"},
    {key:"coins",label:"Coins au moment du relevé",path:"profile.coins_skript",unit:"number"},
    {key:"completion",label:"Complétion",path:"progression.completion_percent",fallback:"quests.completion_percent",unit:"percent"},
    {key:"score",label:"Progression",path:"progression.score_0_100",unit:"number"},
    {key:"successes",label:"Succès terminés",path:"quests.successes_completed",unit:"number",counter:true},
    {key:"milestones",label:"Milestones complétés",path:"quests.milestone_tiers_reached",denominator:"quests.milestone_tiers_total",unit:"percent"},
    {key:"playtime",label:"Temps de jeu",path:"playtime.play_seconds",unit:"duration",counter:true,overview:false}
  ];
  const get = (data, path) => path.split(".").reduce((value, key) => value?.[key], data);
  function metricValue(data, metric) {
    const value = numeric(get(data, metric.path) ?? (metric.fallback ? get(data, metric.fallback) : null));
    if (!metric.denominator) return value;
    const total = numeric(get(data, metric.denominator));
    return value !== null && total !== null && total > 0 && value >= 0 && value <= total ? value / total * 100 : null;
  }
  function metricValues(before, after) {
    return metrics.map(metric => {
      const start = before ? metricValue(before, metric) : null;
      const end = metricValue(after, metric);
      const delta = start !== null && end !== null && Number.isFinite(end - start) ? end - start : null;
      const sourceChanged = metric.key === "playtime" && before && before.playtime?.play_seconds_source !== after.playtime?.play_seconds_source;
      return {...metric, before:start, after:end, delta:sourceChanged ? null : delta, warning:sourceChanged ? "Source du temps de jeu différente" : metric.counter && delta < 0 ? "Compteur en baisse : remise à zéro ou correction possible" : ""};
    });
  }
  function compare(before, after) {
    const first = flatten(before), last = flatten(after);
    return [...new Set([...first.keys(), ...last.keys()])].sort().map(key => {
      const start = first.get(key)?.value ?? null, end = last.get(key)?.value ?? null;
      const delta = start !== null && end !== null && Number.isFinite(end - start) ? end - start : null;
      return {key, path:(last.get(key) || first.get(key)).path, before:start, after:end, delta};
    });
  }
  globalThis.StatGMHistory = {stamp, descriptor, compareSnapshots, observations, catalog, metrics, metricValues, compare};
})();
