(() => {
  const find = selector => document.querySelector(selector);
  const ui = Object.fromEntries([
    "toolbar-count", "player-count", "result-count", "search", "sort", "sort-note", "page-size", "player-grid", "empty", "empty-title", "empty-description", "empty-import", "pagination", "prev", "next", "page-info", "feedback"
  ].map(key => [key, find(`[data-${key}]`)]));
  const db = window.StatGMArchiveDB;
  const number = value => value.toLocaleString("fr-FR");
  const firstConnectionDate = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" });
  const firstConnectionTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });
  let players = [], filtered = [], page = 1, searchTimer;
  let gradeWorker = null;
  let gradeFailed = false;
  let loadedDatasetId, recordsLocal = true, completionPending = false, completionAttempt;
  let loadGeneration = 0;
  const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });
  const searchKey = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const sortModes = new Set(["name-asc", "name-desc", "grade-asc", "grade-desc", "completion-asc", "completion-desc", "first-connection-asc", "first-connection-desc"]);
  const hasFirstConnection = player => Number.isFinite(player.firstPlayedMs) && player.firstPlayedMs > 0 && player.firstPlayedMs <= 8640000000000000;
  // Outside the shared cloud-sync key prefixes: this is a device preference.
  const sortPreference = "StatGM.playerSort.v1";
  try {
    const saved = localStorage.getItem(sortPreference);
    if (sortModes.has(saved)) ui.sort.value = saved;
  } catch { /* Sorting also works when browser storage preferences are blocked. */ }

  function sortPlayers() {
    const mode = ui.sort.value;
    const direction = mode.endsWith("desc") ? -1 : 1;
    const byGrade = mode.startsWith("grade-");
    const byCompletion = mode.startsWith("completion-");
    const byFirstConnection = mode.startsWith("first-connection-");
    const byName = (a, b) => collator.compare(a.name, b.name) || a.uuid.localeCompare(b.uuid);
    players.sort((a, b) => {
      if (byFirstConnection) {
        const first = hasFirstConnection(a), second = hasFirstConnection(b);
        return Number(second) - Number(first) || (first ? direction * (a.firstPlayedMs - b.firstPlayedMs) : 0) || byName(a, b);
      }
      if (byCompletion) {
        const first = Number.isFinite(a.completion), second = Number.isFinite(b.completion);
        return Number(second) - Number(first) || (first ? direction * (a.completion - b.completion) : 0) || byName(a, b);
      }
      if (!byGrade) return direction * byName(a, b);
      const first = a.gradeSort, second = b.gradeSort;
      return first.group - second.group
        || (first.group === 0 ? direction * (first.position - second.position) : collator.compare(first.label, second.label))
        || byName(a, b);
    });
    ui["sort-note"].hidden = !byGrade && !byCompletion && !byFirstConnection;
    ui["sort-note"].textContent = byGrade
      ? "À grade égal : pseudo A → Z. Grades boutique après Neodym ; staff à la fin par nom de grade."
      : byFirstConnection ? "Première connexion au serveur. À date égale : pseudo A → Z. Dates non renseignées à la fin."
      : completionPending ? "Récupération des complétions en arrière-plan… Le classement se mettra à jour automatiquement."
      : "Pourcentage de complétion de l’export. À égalité : pseudo A → Z. Données absentes à la fin.";
  }

  function playerCard(player) {
    const card = document.createElement("a");
    card.className = "statgm-player-card";
    card.href = `fiche-joueur.html?uuid=${encodeURIComponent(player.uuid)}`;
    card.setAttribute("aria-label", `Voir les statistiques de ${player.name}`);
    const top = document.createElement("div");
    top.className = "statgm-player-top";
    const avatar = window.StatGMHeads.create(player);
    const tag = window.StatGMGrades.create(player.grade, { unavailable: gradeFailed });
    top.append(avatar, tag);
    const name = document.createElement("h3");
    name.textContent = player.name;
    const uuid = document.createElement("code");
    uuid.textContent = player.uuid;
    uuid.title = "UUID du joueur";
    card.append(top, name, uuid);
    if (ui.sort.value.startsWith("completion-")) {
      const completion = document.createElement("p");
      completion.className = "statgm-player-completion";
      const label = document.createElement("span"), value = document.createElement("strong");
      label.textContent = "Complétion";
      value.textContent = Number.isFinite(player.completion) ? `${number(player.completion)} %` : "Non renseignée";
      completion.append(label, value); card.append(completion);
    }
    const firstConnection = document.createElement("p"); firstConnection.className = "statgm-player-first-connection";
    const label = document.createElement("span"); label.textContent = "Première connexion";
    const validDate = hasFirstConnection(player);
    const date = document.createElement(validDate ? "time" : "strong");
    if (validDate) {
      date.dateTime = new Date(player.firstPlayedMs).toISOString();
      date.textContent = firstConnectionDate.format(player.firstPlayedMs);
      date.title = `${firstConnectionTime.format(player.firstPlayedMs)} (heure de Paris)`;
    } else date.textContent = "Non renseignée";
    firstConnection.append(label, date); card.append(firstConnection);
    return card;
  }
  function render() {
    window.StatGMHeads.resetObservations();
    const perPage = Number(ui["page-size"].value);
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    page = Math.max(1, Math.min(page, totalPages));
    const start = (page - 1) * perPage;
    const visible = filtered.slice(start, start + perPage);
    ui["player-grid"].replaceChildren(...visible.map(playerCard));
    ui["player-count"].textContent = number(players.length);
    ui["toolbar-count"].textContent = number(players.length);
    ui["result-count"].textContent = filtered.length ? `${number(start + 1)}–${number(start + visible.length)} sur ${number(filtered.length)} joueur${filtered.length > 1 ? "s" : ""}` : "0 joueur";
    ui.empty.hidden = filtered.length > 0;
    ui["empty-title"].textContent = players.length ? "Aucun joueur trouvé" : "Aucun joueur importé";
    ui["empty-description"].textContent = players.length ? "Essaie un autre pseudo ou un autre UUID." : "Importe ton export ZIP depuis la page StatGM pour afficher les cartes des joueurs.";
    ui["empty-import"].hidden = players.length > 0;
    ui.pagination.hidden = totalPages <= 1;
    ui["page-info"].textContent = `Page ${number(page)} sur ${number(totalPages)}`;
    ui.prev.disabled = page === 1;
    ui.next.disabled = page === totalPages;
    find("#players-section").setAttribute("aria-busy", "false");
  }
  function filterPlayers(reset = true) {
    const query = searchKey(ui.search.value.trim());
    const uuidQuery = query.replace(/-/g, "");
    filtered = query ? players.filter(player => player.searchName.includes(query) || player.uuid.includes(query) || player.uuid.replace(/-/g, "").includes(uuidQuery)) : players;
    if (reset) page = 1;
    render();
  }
  ui.search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(filterPlayers, 120);
  });
  ui["page-size"].addEventListener("change", () => { page = 1; render(); });
  ui.sort.addEventListener("change", () => {
    try { localStorage.setItem(sortPreference, ui.sort.value); } catch { /* Optional local preference. */ }
    sortPlayers();
    filterPlayers();
    completionAttempt = null;
    void restoreCloudCompletions();
  });
  for (const [key, direction] of [["prev", -1], ["next", 1]]) ui[key].addEventListener("click", () => {
    page += direction; render(); find("#players-section").scrollIntoView({ block: "start" });
  });

  function restoreGrades(datasetId, completion, firstConnection) {
    if (gradeWorker) return;
    completionPending = completion;
    sortPlayers();
    try { gradeWorker = new Worker(new URL("grade-backfill-worker.js?v=20261006c", document.baseURI)); }
    catch { gradeUnavailable(); return; }
    gradeWorker.onmessage = ({ data }) => {
      gradeWorker.terminate(); gradeWorker = null;
      completionPending = false;
      if (loadedDatasetId !== datasetId) return;
      if (data.type === "complete") void load(false).catch(gradeUnavailable);
      else gradeUnavailable();
    };
    gradeWorker.onerror = event => {
      event.preventDefault();
      gradeWorker.terminate(); gradeWorker = null;
      completionPending = false;
      gradeUnavailable();
    };
    gradeWorker.postMessage({ datasetId, completion, firstConnection });
  }
  async function restoreCloudCompletions() {
    const datesMissing = players.some(player => player.firstPlayedMs === undefined);
    const completionsMissing = ui.sort.value.startsWith("completion-") && players.some(player => player.completion === undefined);
    const recover = window.StatGMCloud?.ensureCardDetails || window.StatGMCloud?.ensureCompletions;
    if (recordsLocal || (!datesMissing && !completionsMissing) || completionPending || completionAttempt === loadedDatasetId || !recover) return;
    const datasetId = loadedDatasetId;
    completionAttempt = datasetId; completionPending = true; sortPlayers();
    try {
      await recover();
      if (loadedDatasetId === datasetId) await load(false);
    } catch (error) {
      if (loadedDatasetId !== datasetId) return;
      ui.feedback.textContent = completionsMissing ? `Le classement par complétion est incomplet : ${error.message} Sélectionne à nouveau ce tri pour réessayer.` : `Les dates de première connexion n’ont pas pu être récupérées : ${error.message} Recharge la page pour réessayer.`;
      ui.feedback.dataset.tone = "info"; ui.feedback.hidden = false;
    } finally { if (loadedDatasetId === datasetId) { completionPending = false; sortPlayers(); } }
  }
  function gradeUnavailable() {
    completionPending = false;
    gradeFailed = true;
    filterPlayers(false);
    ui.feedback.textContent = "Impossible de récupérer les données de classement de cet import. Recharge la page ou réimporte ton export.";
    ui.feedback.dataset.tone = "info";
    ui.feedback.hidden = false;
  }
  async function load(resetPage = true) {
    const generation = ++loadGeneration;
    const active = await db.readActive();
    const rows = await db.readPlayers(active?.datasetId);
    if (generation !== loadGeneration) return;
    if (loadedDatasetId !== active?.datasetId) {
      gradeWorker?.terminate(); gradeWorker = null; completionPending = false; gradeFailed = false; completionAttempt = null;
    }
    players = rows.map(player => ({
      ...player, searchName: searchKey(player.name), gradeSort: window.StatGMGrades.sortKey(player.grade)
    }));
    loadedDatasetId = active?.datasetId;
    recordsLocal = active?.recordsLocal !== false;
    sortPlayers();
    filterPlayers(resetPage);
    const completion = recordsLocal && players.some(player => player.completion === undefined);
    const firstConnection = recordsLocal && players.some(player => player.firstPlayedMs === undefined);
    if (active && (completion || firstConnection || players.some(player => typeof player.grade !== "string")) && !gradeFailed) restoreGrades(active.datasetId, completion, firstConnection);
    else void restoreCloudCompletions();
  }
  load().catch(() => {
    find("#players-section").setAttribute("aria-busy", "false");
    ui["result-count"].textContent = "Stockage indisponible";
    ui["empty-title"].textContent = "Impossible d’ouvrir les données";
    ui["empty-description"].textContent = "Autorise le stockage du site dans ton navigateur, puis recharge la page.";
    ui["empty-import"].hidden = true;
    ui.feedback.textContent = "Impossible de charger les joueurs enregistrés dans ce navigateur.";
    ui.feedback.dataset.tone = "error";
    ui.feedback.hidden = false;
  });
  window.addEventListener("statgm-data-updated", event => {
    void db.readActive().then(active => { if (event?.detail?.summaries || active?.datasetId !== loadedDatasetId) return load(false); }).catch(gradeUnavailable);
  });
  window.addEventListener("pagehide", () => { gradeWorker?.terminate(); gradeWorker = null; });
})();
