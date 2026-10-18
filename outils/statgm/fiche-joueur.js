(() => {
  const s = window.StatGMPlayerStats, db = window.StatGMArchiveDB;
  const find = selector => document.querySelector(selector);
  const ui = Object.fromEntries(["breadcrumb", "load-state", "state-title", "state-detail", "retry", "player-content", "head", "name", "grade", "status", "uuid", "copy-uuid", "export-date", "export-file", "source-choice", "record", "kpis", "announcement"].map(key => [key, find(`[data-${key}]`)]));
  const tabs = [...document.querySelectorAll("[data-tab]")];
  const panels = new Map([...document.querySelectorAll("[data-panel]")].map(panel => [panel.dataset.panel, panel]));
  const uuid = (new URLSearchParams(location.search).get("uuid") || "").toLowerCase();
  let active, summary, record, data, jobList = [], keys = [], generation = 0, currentTab = "overview", selectedJob = "", loaded = new Set(), disposers = [], exportWorker;
  const node = (tag, className = "", text) => {
    const element = document.createElement(tag); if (className) element.className = className;
    if (text !== undefined) element.textContent = text; return element;
  };
  const text = value => value === null || value === undefined || value === "" ? "Non renseigné" : String(value);
  const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const note = message => node("p", "player-note", message);
  const get = path => path.split(".").reduce((value, key) => value?.[key], data);
  function fields(entries) {
    const list = node("dl", "player-fields");
    for (const [label, value, source] of entries) {
      const row = node("div", "player-field"); const term = node("dt", "", label), definition = node("dd", "", value);
      if (source) row.title = `Source : ${source}`;
      row.append(term, definition); list.append(row);
    }
    return list;
  }
  function sourceFields(section, names) {
    return fields(names.map(key => [s.label(key), s.fieldValue(key, get(`${section}.${key}`)), `${section}.${key}`]));
  }
  function panel(title, actionTab) {
    const root = node("article", "player-panel"), heading = node("div", "player-panel-heading");
    heading.append(node("h2", "", title));
    if (actionTab) {
      const action = node("button", "player-panel-link", "Voir le détail →"); action.type = "button";
      action.addEventListener("click", () => showTab(actionTab)); heading.append(action);
    }
    root.append(heading); return root;
  }
  function progress(label, value, total, footnote, source) {
    const root = node("div", "player-progress-item"), heading = node("div", "player-progress-heading");
    const valid = s.numeric(value) !== null && s.numeric(total) !== null && total > 0;
    const counts = s.numeric(value) !== null && s.numeric(total) !== null;
    heading.append(node("span", "", label), node("strong", "", counts ? `${s.number(value, 0)} / ${s.number(total, 0)}` : s.number(value, 0)));
    const track = node("div", "player-progress-track"), fill = node("span");
    if (valid) {
      track.setAttribute("role", "progressbar"); track.setAttribute("aria-label", label);
      track.setAttribute("aria-valuenow", String(Math.max(0, Math.min(total, value)))); track.setAttribute("aria-valuemin", "0"); track.setAttribute("aria-valuemax", String(total));
      fill.style.width = `${Math.max(0, Math.min(100, value / total * 100))}%`;
    } else track.setAttribute("aria-hidden", "true");
    track.append(fill); root.append(heading, track);
    if (footnote) root.append(node("small", "", footnote)); if (source) root.title = `Source : ${source}`;
    return root;
  }
  function metric(label, value, hint, source, accent = false) {
    const root = node("article", `player-kpi${accent ? " player-kpi--accent" : ""}`);
    root.title = `Source : ${source}`; root.append(node("span", "player-kpi-label", label), node("strong", "", value), node("small", "", hint)); return root;
  }
  function titleTable(headers, raw = false) {
    const wrap = node("div", "player-table-wrap"), table = node("table", `player-table${raw ? " player-raw-table" : ""}`), head = node("thead"), row = node("tr"), body = node("tbody");
    for (const header of headers) { const cell = node("th", "", header); cell.scope = "col"; row.append(cell); }
    head.append(row); table.append(head, body); wrap.append(table); return { wrap, body, table };
  }
  function renderHeader() {
    const name = typeof data.player?.name === "string" && data.player.name ? data.player.name : summary.name;
    document.title = `${name} — StatGM`; ui.name.textContent = name; ui.breadcrumb.textContent = name; ui.uuid.textContent = uuid;
    window.StatGMHeads.resetObservations(); ui.head.replaceChildren(window.StatGMHeads.create({ name, uuid }));
    const grade = data.profile?.luckperms_primary_group || data.profile?.grade_display || data.profile?.group_or_skript || summary.grade;
    ui.grade.replaceChildren(window.StatGMGrades.create(grade));
    ui.status.dataset.online = String(data.player?.online === true);
    ui.status.textContent = typeof data.player?.online === "boolean" ? `${data.player.online ? "En ligne" : "Hors ligne"} au moment de l’export` : "État de connexion non renseigné";
    const exportedAt=data.exported_at_iso || record.snapshot?.exportedAt;
    ui["export-date"].textContent = exportedAt ? s.date(exportedAt) : "Date d’export non renseignée";
    ui["export-file"].textContent = record.source || active.filename || "Fichier importé";
    const completion = get("progression.completion_percent") ?? get("quests.completion_percent");
    ui.kpis.replaceChildren(
      metric("Solde", s.money(get("profile.vault_balance")), "Portefeuille Vault", "profile.vault_balance", true),
      metric("Coins", s.number(get("profile.coins_skript")), "Monnaie Skript", "profile.coins_skript"),
      metric("Progression", s.numeric(get("progression.score_0_100")) === null ? "—" : `${s.number(get("progression.score_0_100"), 0)} / 100`, "Score déclaré", "progression.score_0_100", true),
      metric("Complétion", s.percent(completion), "Pourcentage de l’export", "progression.completion_percent / quests.completion_percent"),
      metric("Succès", s.numeric(get("quests.successes_completed")) === null ? "—" : `${s.number(get("quests.successes_completed"), 0)} / ${s.number(get("quests.successes_total"), 0)}`, "Succès terminés", "quests.successes_completed / successes_total"),
      metric("Temps de jeu", s.duration(get("playtime.play_seconds")), `Source : ${text(get("playtime.play_seconds_source"))}`, "playtime.play_seconds")
    );
  }
  function overview() {
    const columns = node("div", "player-columns"), left = node("div"), right = node("div");
    const progression = panel("Progression du joueur", "quests");
    progression.append(progress("Score de progression", get("progression.score_0_100"), 100, "Score de l’export, distinct du taux de complétion.", "progression.score_0_100"), progress("Succès", get("quests.successes_completed"), get("quests.successes_total"), "Nombre de succès terminés.", "quests"), progress("Paliers des métiers", get("quests.milestone_tiers_reached"), get("quests.milestone_tiers_total"), `${s.number(get("quests.milestone_tiers_claimed"), 0)} paliers récupérés`, "quests.milestone_tiers_reached"));
    left.append(progression);
    const jobs = panel("Les métiers", "jobs"), grid = node("div", "player-job-summary");
    for (const job of jobList) grid.append(progress(job.label, job.level, Math.max(100, job.level || 0), "Niveau déclaré", job.levelSource));
    jobs.append(jobList.length ? grid : note("Aucun métier renseigné dans cet export.")); left.append(jobs);
    const account = panel("Repères du compte");
    account.append(sourceFields("player", ["first_played_ms", "last_played_ms"]), sourceFields("progression", ["rank_among_tracked_players", "tracked_players_count"]));
    if (get("player.last_played_ms") === 0) account.append(note("La dernière connexion n’est pas renseignée dans le fichier."));
    right.append(account);
    const plot = panel("Le plot", "plot");
    plot.append(fields([["Nom", text(get("plot.name")), "plot.name"], ["Valeur", s.money(get("plot.value")), "plot.value"], ["Banque", s.money(get("plot.bank")), "plot.bank"], ["Membres", s.number(get("plot.member_count"), 0), "plot.member_count"]])); right.append(plot);
    columns.append(left, right); return columns;
  }
  function economy() {
    const model = s.economy(data), charts = window.StatGMEconomyCharts;
    const columns = node("div", "player-economy-charts"), left = panel("Répartition des gains"), right = panel("Argent gagné et dépensé");
    left.append(node("p", "player-section-note", "Catégories incluses dans l’argent total gagné · en $"), charts.donut(model));
    right.append(node("p", "player-section-note", "Gains et dépenses enregistrés · en $"), charts.bars(model));
    const snapshotDate = data.exported_at_iso || record.snapshot?.exportedAt;
    right.append(note(snapshotDate ? `Valeurs à l’export du ${s.date(snapshotDate)}. Cette fiche ne se met pas à jour en direct depuis le jeu.` : "Valeurs du fichier importé. Cette fiche ne se met pas à jour en direct depuis le jeu."));
    columns.append(left, right);
    const wallets = panel("Monnaies disponibles"); wallets.append(fields([["Dollar", s.money(get("profile.vault_balance")), "profile.vault_balance"], ["Coins", s.number(get("profile.coins_skript")), "profile.coins_skript"]]));
    const rates = panel("Revenus horaires"); rates.append(fields(["average_24h_hourly", "hourly_total_current_window"].map(key => [s.label(key), s.money(get(`economy.${key}`)), `economy.${key}`])));
    const details = node("div", "player-columns"); details.append(wallets, rates);
    const wrapper = node("div"); wrapper.append(columns, details); return wrapper;
  }
  function quests() {
    const columns = node("div", "player-columns"), left = panel("Quêtes"), right = panel("Succès par niveau");
    left.append(sourceFields("quests", ["main_unlock", "secondary_completed_count", "daily_count", "time_principal_seconds", "time_secondaire_seconds", "time_daily_seconds"]));
    const flags = Object.entries(object(get("quests.secondary_flags"))), tags = node("div", "player-tags");
    if (flags.length) left.append(node("h3", "", "Quêtes secondaires"));
    for (const [name, complete] of flags) { const tag = node("span", "player-tag", `${complete === true ? "✓" : "○"} ${name}`); tag.dataset.active = String(complete === true); tags.append(tag); }
    left.append(tags);
    const levels = Object.entries(object(get("quests.successes_by_level")));
    for (const [level, stats] of levels) right.append(progress(`Niveau ${level}`, stats?.completed, stats?.total, "Succès terminés", `quests.successes_by_level.${level}`));
    if (!levels.length) right.append(note("Aucun détail de succès par niveau.")); columns.append(left, right);
    const milestones = panel("Paliers et complétion");
    milestones.append(progress("Paliers atteints", get("quests.milestone_tiers_reached"), get("quests.milestone_tiers_total"), "", "quests"), progress("Paliers récupérés", get("quests.milestone_tiers_claimed"), get("quests.milestone_tiers_total"), "", "quests"), sourceFields("quests", ["completion_percent"]));
    const root = node("div"); root.append(columns, milestones); return root;
  }
  function plot() {
    const root = panel(text(get("plot.name")) === "Non renseigné" ? "Plot" : `Plot · ${get("plot.name")}`);
    if (!Object.keys(object(data.plot)).length) { root.append(note("Aucune donnée de plot dans ce fichier.")); return root; }
    const columns = node("div", "player-columns"), first = node("div"), second = node("div");
    first.append(sourceFields("plot", ["id", "name", "owner", "owner_uuid", "size", "member_count", "max_members", "open"]));
    second.append(fields([...["value", "bank", "generated_money"].map(key => [s.label(key), s.money(get(`plot.${key}`)), `plot.${key}`]), ...["points", "farm_score", "value_rank", "farm_rank"].map(key => [s.label(key), s.fieldValue(key, get(`plot.${key}`)), `plot.${key}`])]));
    columns.append(first, second); root.append(columns, node("h3", "", "Membres"));
    const tags = node("div", "player-tags"); for (const member of Array.isArray(get("plot.members")) ? get("plot.members") : []) tags.append(node("span", "player-tag", String(member)));
    root.append(tags); return root;
  }
  function jobs() {
    const root = node("div"), choices = node("div", "player-job-switch"), content = node("div"); root.append(choices, content);
    if (!jobList.length) { root.append(note("Aucune donnée métier dans ce fichier.")); return root; }
    if (!jobList.some(job => job.key === selectedJob)) selectedJob = jobList[0].key;
    function selectJob(key) {
      selectedJob = key;
      for (const button of choices.children) button.setAttribute("aria-pressed", String(button.dataset.job === key));
      const job = jobList.find(job => job.key === key), section = panel(`${job.label} · niveau ${s.number(job.level, 0)}`);
      const totals = node("div", "player-kpis");
      for (const [label, field, format] of [["Quantité comptabilisée", "amount", s.number], ["XP comptabilisée", "xp", s.number], ["Argent comptabilisé", "money", s.money], ["Temps cumulé des ressources", "time_seconds", s.duration]]) totals.append(metric(label, format(s.sum(job.resources, field)), "Ressources ci-dessous", "job_resources + compléments rjobs_stats"));
      section.append(totals);
      const tools = node("div", "player-table-tools"), search = node("input"), sort = node("select"); search.type = "search"; search.placeholder = "Rechercher une ressource…"; search.setAttribute("aria-label", "Rechercher une ressource"); sort.setAttribute("aria-label", "Trier les ressources");
      for (const [value, label] of [["source", "Ordre de l’export"], ["amount", "Quantité décroissante"], ["xp", "XP décroissante"], ["money", "Argent décroissant"], ["time_seconds", "Temps décroissant"], ["name", "Ressource A → Z"]]) { const option = node("option", "", label); option.value = value; sort.append(option); }
      tools.append(search, sort); section.append(tools);
      const count = node("p", "player-table-count"), table = titleTable(["Ressource", "Quantité", "XP", "Argent", "Temps cumulé", "Blocs cassés", "Paliers atteints", "Récupérés"]);
      table.table.setAttribute("aria-label", `Ressources du métier ${job.label}`);
      const paging = node("div", "player-table-paging"), previous = node("button", "", "← Précédent"), next = node("button", "", "Suivant →"); previous.type = next.type = "button"; paging.append(previous, next); let page = 0, timer;
      function update(reset = false) {
        if (reset) page = 0;
        const query = search.value.trim().toLocaleLowerCase("fr");
        const rows = job.resources.filter(row => `${row.label} ${row.resource_key}`.toLocaleLowerCase("fr").includes(query));
        if (sort.value === "name") rows.sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
        else if (sort.value !== "source") rows.sort((a, b) => (s.numeric(b[sort.value]) ?? -Infinity) - (s.numeric(a[sort.value]) ?? -Infinity));
        const pages = Math.max(1, Math.ceil(rows.length / 40)); page = Math.min(page, pages - 1); const start = page * 40;
        table.body.replaceChildren();
        for (const resource of rows.slice(start, start + 40)) {
          const row = node("tr"), name = node("td", "", resource.label); name.append(node("small", "", resource.resource_key)); name.title = `Source : ${resource.source}`; row.append(name);
          for (const value of [s.number(resource.amount), s.number(resource.xp), s.money(resource.money), s.duration(resource.time_seconds), s.number(resource.blocks_broken), s.numeric(resource.milestone_tier) === null ? "—" : `${s.number(resource.milestone_tier, 0)} / ${s.number(resource.milestone_tier_total, 0)}`, s.number(resource.milestone_claimed, 0)]) row.append(node("td", "", value));
          table.body.append(row);
        }
        if (!rows.length) { const row = node("tr"), cell = node("td", "", "Aucune ressource trouvée."); cell.colSpan = 8; row.append(cell); table.body.append(row); }
        count.textContent = `${rows.length ? `${start + 1}–${Math.min(start + 40, rows.length)} sur ` : ""}${s.number(rows.length, 0)} ressources`;
        paging.hidden = pages <= 1; previous.disabled = page === 0; next.disabled = page === pages - 1;
      }
      search.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => update(true), 120); }); sort.addEventListener("change", () => update(true));
      previous.addEventListener("click", () => { page--; update(); }); next.addEventListener("click", () => { page++; update(); });
      disposers.push(() => clearTimeout(timer));
      section.append(count, table.wrap, paging, note("Les temps des ressources sont des compteurs cumulés et ne doivent pas être assimilés au temps de connexion. Les ressources supplémentaires de rJobs sont incluses ; les copies d’une même clé ne sont pas additionnées.")); content.replaceChildren(section); update();
    }
    for (const job of jobList) { const button = node("button", "", job.label); button.type = "button"; button.dataset.job = job.key; button.addEventListener("click", () => selectJob(job.key)); choices.append(button); }
    selectJob(selectedJob); return root;
  }
  function raw() {
    const root = panel("Toutes les données du fichier"); root.append(node("p", "player-section-note", "Chaque champ est consultable, y compris les compteurs internes et les données non reconnues."));
    const tools = node("div", "player-table-tools"), search = node("input"), section = node("select"), download = node("button", "", "Télécharger ce JSON");
    search.type = "search"; search.placeholder = "Rechercher un champ ou une valeur…"; search.setAttribute("aria-label", "Rechercher dans toutes les données"); section.setAttribute("aria-label", "Section des données"); download.type = "button";
    const all = node("option", "", "Toutes les sections"); all.value = ""; section.append(all);
    for (const key of Object.keys(data)) { const option = node("option", "", s.label(key)); option.value = key; section.append(option); }
    tools.append(search, section, download); root.append(tools);
    const count = node("p", "player-table-count"), table = titleTable(["Champ et chemin", "Valeur originale"], true), paging = node("div", "player-table-paging"), previous = node("button", "", "← Précédent"), next = node("button", "", "Suivant →");
    table.table.setAttribute("aria-label", "Tous les champs du fichier JSON"); previous.type = next.type = "button"; paging.append(previous, next); root.append(count, table.wrap, paging);
    let page = 0, version = 0, timer, pumpTimer; const currentData = data;
    function update(reset = false) {
      if (reset) page = 0; const run = ++version; clearTimeout(pumpTimer); const iterator = s.leaves(currentData), query = search.value.trim().toLocaleLowerCase("fr"), group = section.value, visible = []; let total = 0;
      count.textContent = "Lecture des champs…";
      function pump() {
        if (run !== version) return;
        for (let batch = 0; batch < 500; batch++) {
          const item = iterator.next();
          if (item.done) { finish(); return; }
          const row = item.value; if (group && row.path[0] !== group) continue;
          const original = JSON.stringify(row.value);
          if (query && !`${row.path.join(".")} ${row.path.map(s.label).join(" ")} ${original} ${s.fieldValue(row.key, row.value)}`.toLocaleLowerCase("fr").includes(query)) continue;
          if (total >= page * 100 && visible.length < 100) visible.push({ ...row, original }); total++;
        }
        pumpTimer = setTimeout(pump, 0);
      }
      function finish() {
        const pages = Math.max(1, Math.ceil(total / 100)); if (page >= pages) { page = pages - 1; update(); return; }
        table.body.replaceChildren();
        for (const field of visible) {
          const row = node("tr"), name = node("td", "", s.label(field.key)); name.append(node("br"), node("code", "", field.path.join("."))); row.append(name, node("td", "", field.original)); table.body.append(row);
        }
        if (!visible.length) { const row = node("tr"), cell = node("td", "", "Aucun champ trouvé."); cell.colSpan = 2; row.append(cell); table.body.append(row); }
        count.textContent = `${total ? `${page * 100 + 1}–${Math.min((page + 1) * 100, total)} sur ` : ""}${s.number(total, 0)} champs`;
        paging.hidden = pages <= 1; previous.disabled = page === 0; next.disabled = page === pages - 1;
      }
      pump();
    }
    search.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => update(true), 150); }); section.addEventListener("change", () => update(true)); previous.addEventListener("click", () => { page--; update(); }); next.addEventListener("click", () => { page++; update(); });
    download.addEventListener("click", () => {
      if (exportWorker) return; download.disabled = true;
      try { exportWorker = new Worker(new URL("player-json-worker.js?v=20261006c", document.baseURI)); }
      catch { download.disabled = false; ui.announcement.textContent = "Impossible de préparer le fichier JSON dans ce navigateur."; return; }
      const finish = message => { exportWorker?.terminate(); exportWorker = null; download.disabled = false; ui.announcement.textContent = message; };
      exportWorker.onmessage = ({ data: result }) => {
        if (!result.blob) { finish(result.error || "Impossible de préparer le fichier."); return; }
        const url = URL.createObjectURL(result.blob), link = node("a"); link.href = url; link.download = `gdstats_${uuid}.json`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); finish("Le fichier JSON est prêt.");
      };
      exportWorker.onerror = event => { event.preventDefault(); finish("Impossible de préparer le fichier JSON."); };
      exportWorker.postMessage({ datasetId: active.datasetId, uuid, sequence: record.sequence });
    });
    disposers.push(() => { version++; clearTimeout(timer); clearTimeout(pumpTimer); }); update(); return root;
  }
  const builders = { overview, economy, jobs, quests, plot, data: raw };
  function showTab(key, updateHash = true) {
    if (!panels.has(key)) key = "overview"; currentTab = key;
    for (const tab of tabs) { const selected = tab.dataset.tab === key; tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1; }
    for (const [name, panel] of panels) panel.hidden = name !== key;
    if (data && !loaded.has(key)) { panels.get(key).replaceChildren(builders[key]()); loaded.add(key); }
    if (updateHash) history.replaceState(null, "", `#${key}`);
  }
  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener("click", () => showTab(tab.dataset.tab));
    tab.addEventListener("keydown", event => {
      const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index - 1 + tabs.length) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
      if (next === null) return; event.preventDefault(); tabs[next].focus(); showTab(tabs[next].dataset.tab);
    });
  }
  function clear() { for (const dispose of disposers) dispose(); disposers = []; loaded.clear(); exportWorker?.terminate(); exportWorker = null; for (const panel of panels.values()) panel.replaceChildren(); }
  function showError(title, message) {
    clear(); data = null; ui["player-content"].hidden = true; ui["load-state"].hidden = false; ui["state-title"].textContent = title; ui["state-detail"].textContent = message; ui.retry.hidden = false; find(".player-loader").hidden = true;
  }
  async function selectRecord(sequence, token = ++generation) {
    try {
      const next = await db.readPlayerRecord(active.datasetId, uuid, sequence);
      if (token !== generation) return;
      const fresh = await db.readActive(); if (token !== generation) return;
      if (fresh?.datasetId !== active.datasetId || fresh?.ownerId !== active.ownerId) { void load(); return; }
      if (!next || !next.data || typeof next.data !== "object" || Array.isArray(next.data)) throw new Error("Le fichier de ce joueur est introuvable ou ne contient pas de données lisibles.");
      clear(); record = next; data = next.data; jobList = s.jobs(data); selectedJob = "";
      renderHeader(); showTab(currentTab, false); ui["load-state"].hidden = true; ui["player-content"].hidden = false;
    } catch (error) { if (token === generation) showError("Statistiques indisponibles", error.message); }
  }
  async function load() {
    const token = ++generation; clear(); data = null; ui["player-content"].hidden = true; ui["load-state"].hidden = false; ui.retry.hidden = true; find(".player-loader").hidden = false; ui["state-title"].textContent = "Chargement de la fiche…"; ui["state-detail"].textContent = "Lecture des statistiques de ce joueur.";
    try {
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(uuid)) throw new Error("Le lien ne contient pas un UUID valide. Retourne à la liste et choisis un joueur.");
      const nextActive = await db.readActive(); if (token !== generation) return;
      if (!nextActive) throw new Error("Aucun export disponible. Importe un ZIP dans StatGM ou connecte-toi au compte de ta sauvegarde.");
      const player = await db.readPlayer(nextActive.datasetId, uuid); if (token !== generation) return;
      if (!player) throw new Error("Ce joueur ne figure pas dans l’export actif de ce compte.");
      active = nextActive; summary = player;
      keys = await db.readPlayerRecordKeys(active.datasetId, uuid); if (token !== generation) return;
      if (!keys.length && active.recordsLocal === false) {
        ui["state-detail"].textContent = "Récupération des statistiques de ce joueur depuis la sauvegarde…";
        // Queue behind the existing synchronization, including another tab, without polling.
        const hydrate = () => token === generation ? window.StatGMCloud.ensurePlayerRecords(uuid) : undefined;
        if (navigator.locks && active.ownerId) await navigator.locks.request(`statgm-cloud:${active.ownerId}`, hydrate);
        else await hydrate();
        if (token !== generation) return;
        keys = await db.readPlayerRecordKeys(active.datasetId, uuid); if (token !== generation) return;
      }
      if (!keys.length) throw new Error("Aucun fichier de statistiques conservé pour ce joueur. Réimporte ton archive si nécessaire.");
      const snapshots=await window.StatGMHistory.catalog(db,active,uuid);if(token!==generation)return;
      ui.record.replaceChildren(...snapshots.map((snapshot,index)=>{const option=node("option","",`${snapshot.exportedAt?s.date(snapshot.exportedAt):"Date non renseignée"} · ${snapshot.archive || snapshot.source} · fichier ${index+1}`);option.value=snapshot.sequence;return option;}));
      const last=snapshots.at(-1);ui.record.value=String(last.sequence);ui["source-choice"].hidden=snapshots.length<=1;
      await selectRecord(last.sequence,token);
    } catch (error) { if (token === generation) showError("Impossible d’ouvrir la fiche", error.message); }
  }
  ui.record.addEventListener("change", () => { clear(); ui["player-content"].hidden = true; ui["load-state"].hidden = false; void selectRecord(Number(ui.record.value)); });
  ui.retry.addEventListener("click", () => void load());
  ui["copy-uuid"].addEventListener("click", async () => { try { await navigator.clipboard.writeText(uuid); ui.announcement.textContent = "UUID copié."; } catch { ui.announcement.textContent = "Sélectionne l’UUID affiché pour le copier."; } });
  window.addEventListener("statgm-data-updated", () => void load());
  window.addEventListener("pageshow", event => { if (event.persisted) void load(); });
  window.addEventListener("pagehide", () => { generation++; clear(); exportWorker?.terminate(); });
  currentTab = panels.has(location.hash.slice(1)) ? location.hash.slice(1) : "overview"; void load();
  find("[data-history-link]").href=`progression-joueur.html?uuid=${encodeURIComponent(uuid)}`;
})();
