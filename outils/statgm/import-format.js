(() => {
  const UUID_PATTERN = /^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
  function normalizeUUID(value) {
    if (typeof value !== "string" || !UUID_PATTERN.test(value.trim())) return null;
    const hex = value.trim().replace(/-/g, "").toLowerCase();
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  function isPlayerFile(path) {
    if (/(^|\/)(?:__MACOSX|\.)/.test(path)) return false;
    return /^gdstats_.+\.json$/i.test(path.split(/[\\/]/).pop());
  }
  function extractGrade(data) {
    const sources = [data?.profile, data?.player, data?.joueur, data];
    const keys = ["luckperms_primary_group", "luckpermsPrimaryGroup", "primary_group", "primaryGroup", "grade", "rank"];
    for (const source of sources) {
      if (!source || typeof source !== "object" || Array.isArray(source)) continue;
      for (const key of keys) {
        let value = source[key];
        if (value && typeof value === "object" && !Array.isArray(value)) value = value.name || value.id || value.key;
        if (typeof value === "string" && value.trim()) return value.trim().slice(0, 100);
      }
    }
    return "";
  }
  function parsePlayer(data, path) {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Le JSON doit contenir un objet de statistiques joueur.");
    const basename = path.split(/[\\/]/).pop();
    const uuid = normalizeUUID(basename.replace(/^gdstats_/i, "").replace(/\.json$/i, ""));
    if (!uuid) throw new Error("Le nom du fichier ne contient pas un UUID valide.");
    const identity = [data.player, data.joueur, data.profile, data].filter(value => value && typeof value === "object" && !Array.isArray(value));
    const uuidKeys = ["uuid", "UUID", "uniqueId", "unique_id", "player_uuid", "playerUUID", "playerUuid"];
    for (const object of identity) {
      for (const key of uuidKeys) {
        if (object[key] == null || object[key] === "") continue;
        if (normalizeUUID(object[key]) !== uuid) throw new Error("L’UUID dans le JSON ne correspond pas au nom du fichier.");
      }
    }
    const nameKeys = ["name", "player_name", "playerName", "username", "pseudo", "lastKnownName", "last_known_name"];
    let name = "";
    for (const object of identity) {
      for (const key of nameKeys) {
        if (typeof object[key] === "string" && object[key].trim()) { name = object[key].trim().slice(0, 100); break; }
      }
      if (name) break;
    }
    return { uuid, name: name || `Joueur ${uuid.slice(0, 8)}`, hasName: Boolean(name), grade: extractGrade(data), completion: extractCompletion(data), firstPlayedMs: extractFirstPlayed(data) };
  }
  function extractFirstPlayed(data) {
    const value = data?.player?.first_played_ms;
    return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 8640000000000000 ? value : null;
  }
  function extractCompletion(data) {
    for (const value of [data?.progression?.completion_percent, data?.quests?.completion_percent]) {
      if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) continue;
      const percent = Number(value);
      if (Number.isFinite(percent) && percent >= 0 && percent <= 100) return percent;
    }
    return null;
  }
  function exportDate(filename) {
    // Some exports append a trailing zero after the two-digit seconds field.
    const match = /^Export_(\d{1,2})-(\d{1,2})-(\d{4})-(\d{1,2})-(\d{1,2})-(\d{2})(?:0)?\.zip$/i.exec(filename);
    if (!match) return null;
    const [, d, m, y, h, min, s] = match.map((value, index) => index ? Number(value) : value);
    const date = new Date(y, m - 1, d, h, min, s);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d || h > 23 || min > 59 || s > 59) return null;
    return date.toISOString();
  }
  globalThis.StatGMImportFormat = { normalizeUUID, isPlayerFile, parsePlayer, extractGrade, extractCompletion, extractFirstPlayed, exportDate };
})();
