/* Read-only presentation model. Canonical counters are never added to their raw copies. */
(() => {
  const labels = {
    player: "Identité", profile: "Profil", progression: "Progression", quests: "Quêtes et succès", economy: "Économie", jobs_levels: "Niveaux des métiers", job_resources: "Ressources des métiers", playtime: "Temps de jeu", plot: "Plot", rjobs_stats: "Compteurs rJobs", stats_store: "Compteurs internes", integrations: "Intégrations",
    export_schema_version: "Version du schéma", plugin_version: "Version du plugin", exported_at_iso: "Date de l’export",
    uuid: "UUID", name: "Nom", first_played_ms: "Première connexion", last_played_ms: "Dernière connexion", online: "Connecté à l’export",
    grade_display: "Grade affiché", group_or_skript: "Groupe Skript", luckperms_primary_group: "Groupe principal LuckPerms", luckperms_on_staff_track: "Sur le parcours staff", vault_balance: "Solde", coins_skript: "Coins",
    score_0_100: "Score de progression", rank_among_tracked_players: "Classement de progression", tracked_players_count: "Joueurs suivis", completion_percent: "Complétion de l’export",
    main_unlock: "Étape principale débloquée", secondary_completed_count: "Quêtes secondaires terminées", daily_count: "Quêtes quotidiennes", time_principal_seconds: "Temps des quêtes principales", time_secondaire_seconds: "Temps des quêtes secondaires", time_daily_seconds: "Temps des quêtes quotidiennes", secondary_flags: "Quêtes secondaires",
    successes_completed: "Succès terminés", successes_total: "Succès disponibles", successes_by_level: "Succès par niveau", completed: "Terminés", total: "Total",
    milestone_tiers_claimed: "Paliers récupérés", milestone_tiers_reached: "Paliers atteints", milestone_tiers_total: "Paliers disponibles",
    vault_gained_total_plugin: "Gains enregistrés par le plugin", vault_spent_total_plugin: "Dépenses enregistrées par le plugin", skript_sell_total_cumulative: "Argent vendu avec le /sell", hopper_money_cumulative: "Revenus des hoppers du néant", skript_sellstick_cumulative: "Argent vendu avec les sellstick", displayed_total_gained: "Total des gains affiché", average_24h_hourly: "Moyenne horaire sur 24 h", hourly_total_current_window: "Gains de la fenêtre horaire courante",
    play_seconds: "Temps de jeu enregistré", play_seconds_vanilla_stat: "Temps de jeu vanilla", play_seconds_source: "Source du temps de jeu", cached_play_minute_ticks: "Compteur interne de temps",
    id: "Identifiant", owner: "Propriétaire", owner_uuid: "UUID du propriétaire", size: "Taille déclarée", max_members: "Membres maximum", member_count: "Nombre de membres", members: "Membres", points: "Points", value: "Valeur", farm_score: "Score de farm", value_rank: "Classement par valeur", farm_rank: "Classement par farm", bank: "Banque", generated_money: "Argent généré", open: "Plot ouvert",
    resource_key: "Ressource", key: "Clé", amount: "Quantité", crafted: "Fabrications", xp: "Expérience", money: "Argent", time_seconds: "Temps cumulé", blocks_broken: "Blocs cassés", milestone_tier: "Palier atteint", milestone_claimed: "Palier récupéré", milestone_tier_total: "Paliers disponibles",
    gained_total: "Gains internes", spent_total: "Dépenses internes", sell_total: "Ventes internes", hopper_total: "Hoppers internes", sellstick_total: "Sellstick interne", hourly_total: "Fenêtre horaire interne", average_24h: "Moyenne 24 h interne", average_index: "Index de la fenêtre", average_count: "Nombre de fenêtres", average_slots: "Fenêtres horaires internes", jobs_raw: "Compteurs métiers internes",
    rjobs_job_stats: "Statistiques rJobs", skript_variables: "Variables Skript", vault_economy: "Économie Vault", luckperms: "LuckPerms", plan_playtime: "Temps de jeu Plan", neodium_succes: "Succès Neodium", rjobs_milestones: "Paliers rJobs"
  };
  const resources = {
    stone: "Pierre", coal: "Charbon", copper: "Cuivre", lapis: "Lapis-lazuli", quartz: "Quartz", redstone: "Redstone", iron: "Fer", gold: "Or", diamond: "Diamant", emerald: "Émeraude", gemme: "Gemme", grotte: "Grotte",
    oak_log: "Chêne", birch_log: "Bouleau", acacia_log: "Acacia", dark_oak_log: "Chêne noir", spruce_log: "Sapin", jungle_log: "Acajou", crimson_stem: "Tige carmin", warped_stem: "Tige biscornue", cherry_log: "Cerisier",
    wheat: "Blé", potatoes: "Pommes de terre", carrots: "Carottes", pumpkin: "Citrouille", sugar_cane: "Canne à sucre", beetroots: "Betteraves", nether_wart: "Verrues du Nether", cocoa_beans: "Fèves de cacao", vines: "Lianes", brown_mushroom: "Champignons bruns", red_mushroom: "Champignons rouges",
    zombie: "Zombie", ange: "Ange", aspic: "Aspic", asseche: "Asséché", assoife: "Assoiffé", dracorne: "Dracorne", aragnis: "Aragnis", mutant: "Mutant", demon: "Démon", sylphe: "Sylphe", manticort: "Manticort",
    leather: "Cuir", rottenflesh: "Chair putréfiée", gunpowder: "Poudre à canon", goldingot: "Lingot d’or", copperingot: "Lingot de cuivre", ironingot: "Lingot de fer", carrot: "Carotte (vente)", potato: "Pomme de terre (vente)", sugarcane: "Canne à sucre (vente)", wheatseed: "Graines de blé", lapislazuli: "Lapis-lazuli (vente)", cobblestone: "Pierres (vente)", coal_block: "Bloc de charbon", amethystblock: "Bloc d’améthyste", cactus: "Cactus", poppy: "Coquelicot", dandelion: "Pissenlit", oxeye_daisy: "Marguerite", azure_bluet: "Houstonie", birchlog: "Bouleau (vente)", acacialog: "Acacia (vente)", junglelog: "Acajou (vente)", oaklog: "Chêne (vente)", darkoaklog: "Chêne noir (vente)", sprucelog: "Sapin (vente)"
  };
  const jobLabels = { mineur: "Mineur", bucheron: "Bûcheron", fermier: "Fermier", chasseur: "Chasseur" };
  const numeric = value => typeof value === "number" && Number.isFinite(value) ? value : null;
  const formatters = new Map();
  function number(value, digits = 2) {
    if (numeric(value) === null) return "—";
    if (!formatters.has(digits)) formatters.set(digits, new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }));
    return formatters.get(digits).format(value);
  }
  const money = value => numeric(value) === null ? "—" : `${number(value)} $`;
  const percent = value => numeric(value) === null ? "—" : `${number(value, 1)} %`;
  const rank = value => numeric(value) === null || value <= 0 ? "Non renseigné" : `#${number(value, 0)}`;
  const label = key => labels[key] || jobLabels[String(key).toLowerCase()] || resources[key] || String(key).replace(/_/g, " ");
  function duration(value) {
    if (numeric(value) === null || value < 0) return "—";
    const seconds = Math.floor(value), hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds % 3600 / 60);
    return hours ? `${number(hours, 0)} h ${String(minutes).padStart(2, "0")} min` : minutes ? `${minutes} min ${seconds % 60} s` : `${seconds} s`;
  }
  function date(value) {
    if (!value || (typeof value === "number" && value <= 0)) return "Non renseignée";
    // Unzoned exports are wall-clock values: preserve them without inventing an offset.
    const wall = typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
    const stamp = new Date(wall ? value.replace(/\.\d+$/, "") + "Z" : value);
    if (!Number.isFinite(stamp.getTime())) return "Non renseignée";
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: wall ? "UTC" : "Europe/Paris" }).format(stamp);
  }
  function fieldValue(key, value) {
    if (value === null || value === undefined) return "Non renseigné";
    if (typeof value === "boolean") return value ? "Oui" : "Non";
    if (/(?:_ms|_iso)$/.test(key)) return date(value);
    if (key.endsWith("_rank") || key === "rank_among_tracked_players") return rank(value);
    if (key.includes("seconds")) return duration(value);
    if (key.includes("percent")) return percent(value);
    if (typeof value === "number") return number(value);
    return String(value);
  }
  function jobs(data) {
    const result = new Map();
    const get = key => {
      const normalized = String(key).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (!result.has(normalized)) result.set(normalized, { key: normalized, label: jobLabels[normalized] || label(key), level: null, resources: [], keys: new Set() });
      return result.get(normalized);
    };
    for (const [key, value] of Object.entries(data.jobs_levels || {})) { const job = get(key); job.level = numeric(value); job.levelSource = `jobs_levels.${key}`; }
    for (const [key, rows] of Object.entries(data.job_resources || {})) {
      if (!Array.isArray(rows)) continue;
      const job = get(key);
      for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        const resource = String(row.resource_key || "Ressource inconnue");
        job.resources.push({ ...row, resource_key: resource, label: resources[resource] || label(resource), source: "job_resources" });
        job.keys.add(resource);
      }
    }
    // Supplement the curated rows, never sum duplicate representations of a resource.
    for (const row of Array.isArray(data.rjobs_stats) ? data.rjobs_stats : []) {
      if (!row || typeof row.key !== "string") continue;
      const dot = row.key.indexOf("."); if (dot < 1) continue;
      const job = get(row.key.slice(0, dot)), resource = row.key.slice(dot + 1);
      if (job.keys.has(resource)) continue;
      job.resources.push({ ...row, resource_key: resource, label: resources[resource] || label(resource), source: "rjobs_stats" });
      job.keys.add(resource);
    }
    return [...result.values()].map(({ keys, ...job }) => job);
  }
  function sum(rows, key) {
    const values = rows.map(row => numeric(row[key])).filter(value => value !== null);
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  }
  function economy(data) {
    const source = data?.economy || {};
    const earned = { key: "earned", label: "Argent total gagné", color: "#aaa8ff", value: numeric(source.vault_gained_total_plugin), source: "economy.vault_gained_total_plugin" };
    const total = earned.value;
    const modules = [
      ["skript_sell_total_cumulative", "Vente via /sell", "#edc979"],
      ["hopper_money_cumulative", "Vente via hopper du néant", "#85b5ed"],
      ["skript_sellstick_cumulative", "Vente via sellstick", "#e59aba"]
    ].map(([key, label, color]) => ({ key, label, color, value: numeric(source[key]), source: `economy.${key}` }));
    const known = modules.filter(row => row.value !== null);
    const sum = known.reduce((total, row) => total + row.value, 0);
    const partial = known.length < modules.length;
    const tolerance = Number.EPSILON * Math.max(1, Math.abs(total || 0)) * 8;
    let issue = "";
    if (total === null) issue = "Le total des gains et sa répartition ne sont pas suffisamment renseignés dans cet export.";
    else if (total < 0 || known.some(row => row.value < 0) || !Number.isFinite(sum)) issue = "Les montants de cet export ne permettent pas une répartition circulaire.";
    else if (sum - total > tolerance) issue = "La somme des catégories dépasse l’argent total gagné. La répartition ne peut pas être représentée fidèlement.";
    const slices = issue ? [] : known.filter(row => row.value > 0).map(row => ({ ...row }));
    // The categories are already included in earned; only the remainder closes the ring.
    if (!issue && total > sum) slices.unshift({ key: "other", label: partial ? "Gains non ventilés" : "Autres gains", color: earned.color, value: total - sum, source: "economy.vault_gained_total_plugin − catégories renseignées" });
    // Close the ring using the reconciled sum; cent rounding must not leave a gap.
    const denominator = slices.reduce((sum, row) => sum + row.value, 0);
    for (const row of slices) row.share = denominator > 0 ? row.value / denominator * 100 : 0;
    const comparison = [
      earned,
      { key: "spent", label: "Argent dépensé", value: numeric(source.vault_spent_total_plugin), color: "#edc979", source: "economy.vault_spent_total_plugin" }
    ];
    const spent = comparison[1].value;
    const difference = total !== null && spent !== null && Number.isFinite(total - spent) ? total - spent : null;
    return { total, partial, modules, slices, denominator, issue, comparison, difference };
  }
  function* leaves(data) {
    const stack = [{ path: [], iterator: [["", data]][Symbol.iterator](), root: true }];
    while (stack.length) {
      const frame = stack.at(-1), item = frame.iterator.next();
      if (item.done) { stack.pop(); continue; }
      const [key, value] = item.value, path = frame.root ? [] : [...frame.path, key];
      if (value && typeof value === "object") {
        const keys = Object.keys(value);
        if (!keys.length) yield { path, key: path.at(-1) || "", value: Array.isArray(value) ? "[]" : "{}" };
        else stack.push({ path, iterator: (function* () { for (const key of keys) yield [key, value[key]]; })() });
      } else yield { path, key: path.at(-1) || "", value };
    }
  }
  globalThis.StatGMPlayerStats = { numeric, number, money, percent, rank, label, duration, date, fieldValue, jobs, sum, economy, leaves };
})();
