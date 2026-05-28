const betaApp = document.querySelector("[data-beta-app]");

const playersStorageKey = "statgm-players";
const relevesStorageKey = "statgm-releves";
const store = window.StatGMStore;
let playersCache = [];
let relevesCache = [];

const minerMinerals = [
  { key: "stone", label: "Stone" },
  { key: "coal", label: "Charbon" },
  { key: "copper", label: "Cuivre" },
  { key: "lapis", label: "Lapis" },
  { key: "quartz", label: "Quartz" },
  { key: "redstone", label: "Redstone" },
  { key: "iron", label: "Fer" },
  { key: "gold", label: "Or" },
  { key: "diamond", label: "Diamant" },
  { key: "emerald", label: "Emeraude" },
  { key: "gem", label: "Gemme" }
];

const lumberjackWoods = [
  { key: "oak", label: "Chene" },
  { key: "birch", label: "Bouleau" },
  { key: "acacia", label: "Acacia" },
  { key: "darkOak", label: "Chene noir" },
  { key: "spruce", label: "Sapin" },
  { key: "mahogany", label: "Acajou" },
  { key: "crimson", label: "Carmin" },
  { key: "warped", label: "Biscornue" }
];

const farmerCrops = [
  { key: "wheat", label: "Ble" },
  { key: "carrot", label: "Carotte" },
  { key: "potato", label: "Pomme de terre" },
  { key: "pumpkin", label: "Citrouille" },
  { key: "sugarCane", label: "Canne a sucre" },
  { key: "beetroot", label: "Betterave" },
  { key: "netherWart", label: "Verrue de Nether" },
  { key: "cocoaBeans", label: "Feves de cacao" },
  { key: "vine", label: "Liane" },
  { key: "brownMushroom", label: "Champignon marron" },
  { key: "redMushroom", label: "Champignon rouge" }
];

const hunterMobs = [
  { key: "zombie", label: "Zombie" },
  { key: "angel", label: "Ange" },
  { key: "aspic", label: "Aspic" },
  { key: "asseche", label: "Asseche" },
  { key: "assoife", label: "Assoife" },
  { key: "dracorne", label: "Dracorne" },
  { key: "aragnis", label: "Aragnis" },
  { key: "mutant", label: "Mutant" },
  { key: "demon", label: "Demon" },
  { key: "sylphe", label: "Sylphe" },
  { key: "manticort", label: "Manticort" }
];

const jobLevelXpRequirements = [
  2100, 2205, 2315, 2917, 3063, 3216, 3377, 3546, 3723, 3909,
  4105, 4310, 4526, 6272, 6586, 6915, 7261, 7624, 8005, 8406,
  8826, 9267, 9731, 12261, 12874, 13517, 14193, 14903, 15648, 16430,
  17252, 18114, 19020, 23965, 25164, 26422, 27743, 29130, 30587, 32116,
  33722, 35408, 37178, 46844, 49187, 51646, 54228, 56940, 59787, 62776,
  65915, 69211, 72671, 91566, 96144, 100951, 105999, 111299, 116863, 122707,
  128842, 135284, 142048, 178981, 187930, 197326, 207193, 217552, 228430, 239851,
  251844, 264436, 277658, 349849, 367342, 385709, 404994, 425244, 446506, 468831,
  492273, 516886, 542731, 569867, 609757, 652440, 689111, 746976, 799267, 855216,
  915081, 979137, 1047677, 1121014, 1199485, 1283449, 1373291, 1469421, 1572281
];

const readStorageList = (key) => {
  if (key === playersStorageKey) return Array.isArray(playersCache) ? [...playersCache] : [];
  if (key === relevesStorageKey) return Array.isArray(relevesCache) ? [...relevesCache] : [];

  try {
    const values = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(values) ? values : [];
  } catch {
    return [];
  }
};

const hydrateStorageCaches = async () => {
  if (store?.ready) {
    await store.ready();
    playersCache = store.getList(playersStorageKey);
    relevesCache = store.getList(relevesStorageKey);
    return;
  }

  try {
    playersCache = JSON.parse(localStorage.getItem(playersStorageKey) || "[]");
    relevesCache = JSON.parse(localStorage.getItem(relevesStorageKey) || "[]");
  } catch {
    playersCache = [];
    relevesCache = [];
  }
};

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const toNumber = (value) => {
  const normalized = Number(String(value ?? "").replace("%", "").replace(",", "."));
  return Number.isFinite(normalized) ? normalized : 0;
};

const formatNumber = (value, digits = 2) => {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: digits
  }).format(Number(value || 0));
};

const formatCompactNumber = (value) => {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(Number(value || 0));
};

const secondsFromFields = (days, hours, minutes, seconds) => {
  return (toNumber(days) * 86400) + (toNumber(hours) * 3600) + (toNumber(minutes) * 60) + toNumber(seconds);
};

const getGroupedSeconds = (releve, prefix) => {
  return secondsFromFields(
    releve[`${prefix}Days`],
    releve[`${prefix}Hours`],
    releve[`${prefix}Minutes`],
    releve[`${prefix}Seconds`]
  );
};

const getMinimumProjectionFarmSeconds = () => {
  const settings = window.ReferenceConfig?.read?.() || {};
  const candidate = Number(settings?._meta?.betaProjectionMinFarmSeconds);
  return Number.isFinite(candidate) && candidate >= 0 ? candidate : 3600;
};

const formatDuration = (secondsValue) => {
  const totalSeconds = Math.max(0, Math.floor(toNumber(secondsValue)));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}j ${hours}h ${minutes}m ${seconds}s`;
};

const formatPercent = (value) => `${formatNumber(value, 2)}%`;

const formatModeValue = (value, fallback = "-") => {
  const safeValue = String(value ?? "").trim();
  return safeValue || fallback;
};

const getMode = (values, fallback = "-") => {
  const counts = new Map();
  values.forEach((value) => {
    const safeValue = formatModeValue(value, "");
    if (!safeValue) return;
    counts.set(safeValue, (counts.get(safeValue) || 0) + 1);
  });

  let bestValue = fallback;
  let bestCount = 0;
  counts.forEach((count, value) => {
    if (count > bestCount) {
      bestValue = value;
      bestCount = count;
    }
  });

  return bestValue;
};

const setupChartTooltips = () => {
  if (document.body.dataset.chartTooltipReady === "true") return;

  const tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip";
  document.body.appendChild(tooltip);

  const hideTooltip = () => {
    tooltip.classList.remove("is-visible");
  };

  const showTooltip = (target, clientX, clientY) => {
    const text = target?.getAttribute("data-chart-tooltip");
    if (!text) {
      hideTooltip();
      return;
    }

    tooltip.textContent = text;
    tooltip.classList.add("is-visible");

    const rect = tooltip.getBoundingClientRect();
    const offset = 16;
    const left = Math.min(Math.max(12, clientX + offset), Math.max(12, window.innerWidth - rect.width - 12));
    const top = Math.max(12, clientY - rect.height - offset);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  document.addEventListener("mousemove", (event) => {
    const target = event.target.closest?.("[data-chart-tooltip]");
    if (!target) {
      hideTooltip();
      return;
    }
    showTooltip(target, event.clientX, event.clientY);
  });

  document.addEventListener("mouseleave", hideTooltip);
  document.addEventListener("scroll", hideTooltip, true);

  document.body.dataset.chartTooltipReady = "true";
};

const aggregateMetric = (releves, getter) => {
  const values = releves
    .map(getter)
    .map(toNumber)
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return { average: 0, max: 0, min: 0, count: 0 };
  }

  return {
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    max: Math.max(...values),
    min: Math.min(...values),
    count: values.length
  };
};

const aggregateOptionalMetric = (releves, getter) => {
  const values = releves
    .map(getter)
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map(toNumber)
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!values.length) {
    return { average: 0, max: 0, min: 0, count: 0 };
  }

  return {
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    max: Math.max(...values),
    min: Math.min(...values),
    count: values.length
  };
};

const renderMetricCard = (label, value, accent = false) => `
  <article class="snapshot-metric">
    <span>${label}</span>
    <strong class="${accent ? "is-accent" : ""}">${escapeHtml(String(value))}</strong>
  </article>
`;

const renderPanelCard = (title, content, className = "") => `
  <article class="snapshot-card ${className}">
    <h2>${title}</h2>
    ${content}
  </article>
`;

const renderInfoList = (items) => `
  <div class="snapshot-info-list">
    ${items.map(([label, value]) => `<p><strong>${label}</strong> ${escapeHtml(String(value))}</p>`).join("")}
  </div>
`;

const renderCompareChart = (title, note, metrics, formatter = (value) => formatNumber(value, 2)) => {
  const allValues = metrics.flatMap((metric) => [metric.stats.average, metric.stats.max, metric.stats.min]);
  const maxValue = Math.max(...allValues, 1);

  return renderPanelCard(title, `
    <p class="beta-chart-note">${escapeHtml(note)}</p>
    <div class="beta-compare-chart">
      ${metrics.map((metric) => {
        const avgHeight = maxValue ? (metric.stats.average / maxValue) * 100 : 0;
        const maxHeight = maxValue ? (metric.stats.max / maxValue) * 100 : 0;
        const minHeight = maxValue ? (metric.stats.min / maxValue) * 100 : 0;

        return `
          <article class="beta-compare-item">
            <div class="beta-compare-bars">
              <div class="beta-compare-bar beta-compare-bar--avg" style="height: ${avgHeight}%;" data-chart-tooltip="${escapeHtml(`${metric.label} - Moyenne : ${formatter(metric.stats.average)}`)}">
                <span>${escapeHtml(formatter(metric.stats.average))}</span>
              </div>
              <div class="beta-compare-bar beta-compare-bar--max" style="height: ${maxHeight}%;" data-chart-tooltip="${escapeHtml(`${metric.label} - Plus haut : ${formatter(metric.stats.max)}`)}">
                <span>${escapeHtml(formatter(metric.stats.max))}</span>
              </div>
              <div class="beta-compare-bar beta-compare-bar--min" style="height: ${minHeight}%;" data-chart-tooltip="${escapeHtml(`${metric.label} - Plus bas : ${formatter(metric.stats.min)}`)}">
                <span>${escapeHtml(formatter(metric.stats.min))}</span>
              </div>
            </div>
            <small>${metric.label}</small>
          </article>
        `;
      }).join("")}
    </div>
    <div class="beta-compare-legend">
      <span><i class="beta-compare-bar beta-compare-bar--avg"></i>Moyenne</span>
      <span><i class="beta-compare-bar beta-compare-bar--max"></i>Plus haut</span>
      <span><i class="beta-compare-bar beta-compare-bar--min"></i>Plus bas</span>
    </div>
  `, "snapshot-card--wide");
};

const renderLevel100Projection = (title, note, rows) => {
  return renderPanelCard(title, `
    <p class="beta-chart-note">${escapeHtml(note)}</p>
    <div class="beta-projection-grid">
      ${rows.map((row) => `
        <article class="beta-projection-item">
          <span class="beta-projection-item__label">${row.label}</span>
          <strong class="beta-projection-item__value">${escapeHtml(row.estimateLabel)}</strong>
          <div class="beta-projection-item__meta">
            <p><strong>Niveau moyen :</strong> ${escapeHtml(row.levelLabel)}</p>
            <p><strong>XP / h moyen :</strong> ${escapeHtml(row.xpPerHourLabel)}</p>
            <p><strong>XP restants moyens :</strong> ${escapeHtml(row.remainingXpLabel)}</p>
            <p><strong>Releves retenus :</strong> ${escapeHtml(row.sampleCountLabel)}</p>
          </div>
        </article>
      `).join("")}
    </div>
  `, "snapshot-card--wide");
};

const renderMetricSummaryBoard = (title, note, metrics, formatter = (value) => formatNumber(value, 2)) => {
  return renderPanelCard(title, `
    <p class="beta-chart-note">${escapeHtml(note)}</p>
    <div class="beta-summary-grid">
      ${metrics.map((metric) => `
        <article class="beta-summary-item">
          <span class="beta-summary-item__label">${metric.label}</span>
          <strong class="beta-summary-item__value">${escapeHtml(formatter(metric.stats.average))}</strong>
          <div class="beta-summary-item__meta">
            <p><strong>Moyenne</strong><span>${escapeHtml(formatter(metric.stats.average))}</span></p>
            <p><strong>Plus haut</strong><span>${escapeHtml(formatter(metric.stats.max))}</span></p>
            <p><strong>Plus bas</strong><span>${escapeHtml(formatter(metric.stats.min))}</span></p>
          </div>
        </article>
      `).join("")}
    </div>
  `, "snapshot-card--wide");
};

const getRemainingXpToLevel100 = (levelValue) => {
  const currentLevel = Math.max(1, Math.floor(toNumber(levelValue) || 1));
  if (currentLevel >= 100) return 0;
  return jobLevelXpRequirements
    .slice(currentLevel - 1)
    .reduce((total, xpRequired) => total + xpRequired, 0);
};

const getJobXpPerHour = (releve, items, suffix) => {
  const totals = items.reduce((accumulator, item) => {
    const prefix = `${item.key}${suffix}`;
    accumulator.xp += toNumber(releve[`${prefix}Xp`]);
    accumulator.seconds += getGroupedSeconds(releve, prefix);
    return accumulator;
  }, { xp: 0, seconds: 0 });

  if (!totals.xp || !totals.seconds) return 0;
  return totals.xp / (totals.seconds / 3600);
};

const getJobFarmSeconds = (releve, items, suffix) => {
  return items.reduce((total, item) => total + getGroupedSeconds(releve, `${item.key}${suffix}`), 0);
};

const getEstimatedLevel100Seconds = (releve, levelField, items, suffix) => {
  const remainingXp = getRemainingXpToLevel100(releve[levelField]);
  const farmSeconds = getJobFarmSeconds(releve, items, suffix);
  if (farmSeconds < getMinimumProjectionFarmSeconds()) return null;
  const xpPerHour = getJobXpPerHour(releve, items, suffix);
  if (!remainingXp || xpPerHour <= 0) return null;
  return (remainingXp / xpPerHour) * 3600;
};

const renderStatsTable = (title, rows) => {
  return renderPanelCard(title, `
    <div class="snapshot-table-wrap">
      <table class="beta-stats-table">
        <thead>
          <tr>
            <th>Champ</th>
            <th>Moyenne</th>
            <th>Plus haut</th>
            <th>Plus bas</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => {
            const formatter = row.format || ((value) => formatNumber(value, 2));
            return `
              <tr>
                <td>${row.label}</td>
                <td>${escapeHtml(formatter(row.stats.average))}</td>
                <td>${escapeHtml(formatter(row.stats.max))}</td>
                <td>${escapeHtml(formatter(row.stats.min))}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `, "snapshot-card--wide");
};

const buildRowsFromConfig = (releves, config) => {
  return config.map((item) => ({
    label: item.label,
    stats: aggregateMetric(releves, item.getter),
    format: item.format
  }));
};

const buildResourceRows = (releves, items, suffix, metrics) => {
  return items.flatMap((item) => {
    return metrics.map((metric) => ({
      label: `${item.label} - ${metric.label}`,
      stats: aggregateMetric(releves, (releve) => metric.getter(releve, item.key, suffix)),
      format: metric.format
    }));
  });
};

const renderTabPanel = (id, cards) => `
  <section class="snapshot-tab-panel" data-beta-panel="${id}" ${id === "general" ? "" : "hidden"}>
    <div class="snapshot-general-grid beta-grid">
      ${cards.join("")}
    </div>
  </section>
`;

const createBetaDashboard = () => {
  const players = readStorageList(playersStorageKey);
  const playerMap = new Map(players.map((player) => [String(player.id), player]));
  const betaReleves = readStorageList(relevesStorageKey)
    .filter((releve) => Boolean(releve.betaReleve))
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0));

  if (!betaReleves.length) {
    betaApp.innerHTML = '<p class="empty-state">Aucun releve beta disponible pour le moment.</p>';
    return;
  }

  setupChartTooltips();

  const betaPlayers = new Set(betaReleves.map((releve) => String(releve.playerId))).size;
  const latestReleve = betaReleves[0];
  const overviewMetrics = `
    <div class="snapshot-metric-grid snapshot-metric-grid--three">
      ${renderMetricCard("Releves beta", betaReleves.length, true)}
      ${renderMetricCard("Joueurs beta", betaPlayers)}
      ${renderMetricCard("Dernier jour beta", latestReleve.betaDay || "-", true)}
    </div>
  `;

  const generalRows = buildRowsFromConfig(betaReleves, [
    { label: "Argent", getter: (releve) => releve.argent, format: (value) => formatCompactNumber(value) },
    { label: "Coins", getter: (releve) => releve.coins, format: (value) => formatCompactNumber(value) },
    { label: "Temps de jeu", getter: (releve) => secondsFromFields(releve.days, releve.hours, releve.minutes, releve.seconds), format: formatDuration },
    { label: "Argent total gagne", getter: (releve) => releve.moneyEarned, format: (value) => formatCompactNumber(value) },
    { label: "Argent total depense", getter: (releve) => releve.moneySpent, format: (value) => formatCompactNumber(value) },
    { label: "Argent vendu via /sell", getter: (releve) => releve.sellMoney, format: (value) => formatCompactNumber(value) },
    { label: "Argent vendu via hopper", getter: (releve) => releve.hopperMoney, format: (value) => formatCompactNumber(value) },
    { label: "Argent vendu via sell stick", getter: (releve) => releve.sellStickMoney, format: (value) => formatCompactNumber(value) },
    { label: "Ventes moyennes / h", getter: (releve) => releve.averageSales, format: (value) => formatCompactNumber(value) },
    { label: "Completion des quetes", getter: (releve) => releve.questCompletionRate, format: formatPercent },
    { label: "Difference moyenne", getter: (releve) => releve.averageDifference, format: formatPercent }
  ]);

  const questRows = buildRowsFromConfig(betaReleves, [
    { label: "Quetes principales terminees", getter: (releve) => releve.mainQuestsDone },
    { label: "Quetes secondaires terminees", getter: (releve) => releve.secondaryQuestsDone },
    { label: "Quetes quotidiennes terminees", getter: (releve) => releve.dailyQuestsDone },
    { label: "Temps quetes principales", getter: (releve) => secondsFromFields(releve.mainQuestDays, releve.mainQuestHours, releve.mainQuestMinutes, releve.mainQuestSeconds), format: formatDuration },
    { label: "Temps quetes secondaires", getter: (releve) => secondsFromFields(releve.secondaryQuestDays, releve.secondaryQuestHours, releve.secondaryQuestMinutes, releve.secondaryQuestSeconds), format: formatDuration },
    { label: "Temps quetes quotidiennes", getter: (releve) => secondsFromFields(releve.dailyQuestDays, releve.dailyQuestHours, releve.dailyQuestMinutes, releve.dailyQuestSeconds), format: formatDuration },
    { label: "Completion", getter: (releve) => releve.questCompletionRate, format: formatPercent }
  ]);

  const ratioRows = buildRowsFromConfig(betaReleves, [
    { label: "Mineur %", getter: (releve) => releve.minerRatio, format: formatPercent },
    { label: "Chasseur %", getter: (releve) => releve.hunterRatio, format: formatPercent },
    { label: "Fermier %", getter: (releve) => releve.farmerRatio, format: formatPercent },
    { label: "Bucheron %", getter: (releve) => releve.lumberjackRatio, format: formatPercent },
    { label: "Difference moyenne %", getter: (releve) => releve.averageDifference, format: formatPercent }
  ]);

  const minerOverviewRows = buildRowsFromConfig(betaReleves, [
    { label: "Niveau mineur", getter: (releve) => releve.minerLevel },
    { label: "Temps en grotte", getter: (releve) => secondsFromFields(releve.minerCaveDays, releve.minerCaveHours, releve.minerCaveMinutes, releve.minerCaveSeconds), format: formatDuration },
    { label: "Minerais grotte", getter: (releve) => releve.minerCaveOres },
    { label: "Ratio grotte", getter: (releve) => releve.minerCaveRatio, format: (value) => formatNumber(value, 2) },
    { label: "Temps info minage", getter: (releve) => secondsFromFields(releve.minerInfoDays, releve.minerInfoHours, releve.minerInfoMinutes, releve.minerInfoSeconds), format: formatDuration },
    { label: "Minerais info minage", getter: (releve) => releve.minerInfoOres },
    { label: "Ratio info minage", getter: (releve) => releve.minerInfoRatio, format: (value) => formatNumber(value, 2) }
  ]);

  const minerResourceRows = buildResourceRows(betaReleves, minerMinerals, "Mineral", [
    { label: "XP gagnee", getter: (releve, key, suffix) => releve[`${key}${suffix}Xp`], format: (value) => formatCompactNumber(value) },
    { label: "Temps de farm", getter: (releve, key, suffix) => getGroupedSeconds(releve, `${key}${suffix}`), format: formatDuration },
    { label: "Blocs casses", getter: (releve, key, suffix) => releve[`${key}${suffix}BlocksBroken`], format: (value) => formatCompactNumber(value) },
    { label: "Blocs craftes", getter: (releve, key, suffix) => releve[`${key}${suffix}BlocksCrafted`], format: (value) => formatCompactNumber(value) },
    { label: "Somme gagnee", getter: (releve, key, suffix) => releve[`${key}${suffix}Money`], format: (value) => formatCompactNumber(value) },
    { label: "Ratio bloc / XP", getter: (releve, key, suffix) => releve[`${key}${suffix}BlockXpRatio`], format: (value) => formatNumber(value, 2) },
    { label: "XP / h", getter: (releve, key, suffix) => releve[`${key}${suffix}XpPerHour`], format: (value) => formatCompactNumber(value) },
    { label: "Blocs / h", getter: (releve, key, suffix) => releve[`${key}${suffix}BlocksPerHour`], format: (value) => formatCompactNumber(value) },
    { label: "Rendement %", getter: (releve, key, suffix) => releve[`${key}${suffix}YieldRate`], format: formatPercent },
    { label: "Argent / h", getter: (releve, key, suffix) => releve[`${key}${suffix}MoneyPerHour`], format: (value) => formatCompactNumber(value) },
    { label: "Ratio somme / temps", getter: (releve, key, suffix) => releve[`${key}${suffix}MoneyTimeRatio`], format: (value) => formatNumber(value, 2) }
  ]);

  const woodOverviewRows = buildRowsFromConfig(betaReleves, [
    { label: "Niveau bucheron", getter: (releve) => releve.lumberjackLevel }
  ]);

  const woodResourceRows = buildResourceRows(betaReleves, lumberjackWoods, "Wood", [
    { label: "XP gagnee", getter: (releve, key, suffix) => releve[`${key}${suffix}Xp`], format: (value) => formatCompactNumber(value) },
    { label: "Temps de farm", getter: (releve, key, suffix) => getGroupedSeconds(releve, `${key}${suffix}`), format: formatDuration },
    { label: "Buches recoltees", getter: (releve, key, suffix) => releve[`${key}${suffix}Logs`], format: (value) => formatCompactNumber(value) },
    { label: "Somme gagnee", getter: (releve, key, suffix) => releve[`${key}${suffix}Money`], format: (value) => formatCompactNumber(value) },
    { label: "Ratio buche / XP", getter: (releve, key, suffix) => releve[`${key}${suffix}LogXpRatio`], format: (value) => formatNumber(value, 2) },
    { label: "XP / h", getter: (releve, key, suffix) => releve[`${key}${suffix}XpPerHour`], format: (value) => formatCompactNumber(value) },
    { label: "Buches / h", getter: (releve, key, suffix) => releve[`${key}${suffix}LogsPerHour`], format: (value) => formatCompactNumber(value) },
    { label: "Rendement %", getter: (releve, key, suffix) => releve[`${key}${suffix}YieldRate`], format: formatPercent },
    { label: "Argent / h", getter: (releve, key, suffix) => releve[`${key}${suffix}MoneyPerHour`], format: (value) => formatCompactNumber(value) },
    { label: "Ratio somme / temps", getter: (releve, key, suffix) => releve[`${key}${suffix}MoneyTimeRatio`], format: (value) => formatNumber(value, 2) }
  ]);

  const farmerOverviewRows = buildRowsFromConfig(betaReleves, [
    { label: "Niveau fermier", getter: (releve) => releve.farmerLevel }
  ]);

  const farmerResourceRows = buildResourceRows(betaReleves, farmerCrops, "Crop", [
    { label: "XP gagnee", getter: (releve, key, suffix) => releve[`${key}${suffix}Xp`], format: (value) => formatCompactNumber(value) },
    { label: "Temps de farm", getter: (releve, key, suffix) => getGroupedSeconds(releve, `${key}${suffix}`), format: formatDuration },
    { label: "Items recoltes", getter: (releve, key, suffix) => releve[`${key}${suffix}Items`], format: (value) => formatCompactNumber(value) },
    { label: "Somme gagnee", getter: (releve, key, suffix) => releve[`${key}${suffix}Money`], format: (value) => formatCompactNumber(value) },
    { label: "Ratio item / XP", getter: (releve, key, suffix) => releve[`${key}${suffix}ItemXpRatio`], format: (value) => formatNumber(value, 2) },
    { label: "XP / h", getter: (releve, key, suffix) => releve[`${key}${suffix}XpPerHour`], format: (value) => formatCompactNumber(value) },
    { label: "Items / h", getter: (releve, key, suffix) => releve[`${key}${suffix}ItemsPerHour`], format: (value) => formatCompactNumber(value) },
    { label: "Rendement %", getter: (releve, key, suffix) => releve[`${key}${suffix}YieldRate`], format: formatPercent },
    { label: "Argent / h", getter: (releve, key, suffix) => releve[`${key}${suffix}MoneyPerHour`], format: (value) => formatCompactNumber(value) },
    { label: "Ratio somme / temps", getter: (releve, key, suffix) => releve[`${key}${suffix}MoneyTimeRatio`], format: (value) => formatNumber(value, 2) }
  ]);

  const hunterOverviewRows = buildRowsFromConfig(betaReleves, [
    { label: "Niveau chasseur", getter: (releve) => releve.hunterLevel }
  ]);

  const hunterResourceRows = buildResourceRows(betaReleves, hunterMobs, "Mob", [
    { label: "XP gagnee", getter: (releve, key, suffix) => releve[`${key}${suffix}Xp`], format: (value) => formatCompactNumber(value) },
    { label: "Temps de farm", getter: (releve, key, suffix) => getGroupedSeconds(releve, `${key}${suffix}`), format: formatDuration },
    { label: "Mobs tues", getter: (releve, key, suffix) => releve[`${key}${suffix}Kills`], format: (value) => formatCompactNumber(value) },
    { label: "Somme gagnee", getter: (releve, key, suffix) => releve[`${key}${suffix}Money`], format: (value) => formatCompactNumber(value) },
    { label: "Ratio mobs / XP", getter: (releve, key, suffix) => releve[`${key}${suffix}MobXpRatio`], format: (value) => formatNumber(value, 2) },
    { label: "XP / h", getter: (releve, key, suffix) => releve[`${key}${suffix}XpPerHour`], format: (value) => formatCompactNumber(value) },
    { label: "Mobs / h", getter: (releve, key, suffix) => releve[`${key}${suffix}MobsPerHour`], format: (value) => formatCompactNumber(value) },
    { label: "Rendement %", getter: (releve, key, suffix) => releve[`${key}${suffix}YieldRate`], format: formatPercent },
    { label: "Argent / h", getter: (releve, key, suffix) => releve[`${key}${suffix}MoneyPerHour`], format: (value) => formatCompactNumber(value) },
    { label: "Ratio somme / temps", getter: (releve, key, suffix) => releve[`${key}${suffix}MoneyTimeRatio`], format: (value) => formatNumber(value, 2) }
  ]);

  const modeInfo = renderPanelCard("Valeurs dominantes", renderInfoList([
    ["Phase la plus frequente :", getMode(betaReleves.map((releve) => releve.phase), "-")],
    ["Grade le plus frequent :", getMode(betaReleves.map((releve) => releve.grade), "-")],
    ["Boost le plus frequent :", getMode(betaReleves.map((releve) => releve.boost), "-")],
    ["Jour beta le plus frequent :", getMode(betaReleves.map((releve) => releve.betaDay), "-")],
    ["Date d'arrivee la plus vue :", getMode(betaReleves.map((releve) => releve.arrival), "-")],
    ["Joueur le plus present :", getMode(betaReleves.map((releve) => playerMap.get(String(releve.playerId))?.name || ""), "-")]
  ]));

  const notesInfo = renderPanelCard("Notes et contexte", renderInfoList([
    ["Nom de releve le plus frequent :", getMode(betaReleves.map((releve) => releve.name), "-")],
    ["Note la plus frequente :", getMode(betaReleves.map((releve) => releve.notes), "Aucune note frequente.")]
  ]));
  const projectionFilterMinutes = Math.round(getMinimumProjectionFarmSeconds() / 60);
  const level100ProjectionRows = [
    {
      label: "Mineur",
      levelStats: aggregateMetric(betaReleves, (releve) => releve.minerLevel),
      xpPerHourStats: aggregateOptionalMetric(betaReleves, (releve) => getJobXpPerHour(releve, minerMinerals, "Mineral")),
      estimateStats: aggregateOptionalMetric(betaReleves, (releve) => getEstimatedLevel100Seconds(releve, "minerLevel", minerMinerals, "Mineral"))
    },
    {
      label: "Bucheron",
      levelStats: aggregateMetric(betaReleves, (releve) => releve.lumberjackLevel),
      xpPerHourStats: aggregateOptionalMetric(betaReleves, (releve) => getJobXpPerHour(releve, lumberjackWoods, "Wood")),
      estimateStats: aggregateOptionalMetric(betaReleves, (releve) => getEstimatedLevel100Seconds(releve, "lumberjackLevel", lumberjackWoods, "Wood"))
    },
    {
      label: "Fermier",
      levelStats: aggregateMetric(betaReleves, (releve) => releve.farmerLevel),
      xpPerHourStats: aggregateOptionalMetric(betaReleves, (releve) => getJobXpPerHour(releve, farmerCrops, "Crop")),
      estimateStats: aggregateOptionalMetric(betaReleves, (releve) => getEstimatedLevel100Seconds(releve, "farmerLevel", farmerCrops, "Crop"))
    },
    {
      label: "Chasseur",
      levelStats: aggregateMetric(betaReleves, (releve) => releve.hunterLevel),
      xpPerHourStats: aggregateOptionalMetric(betaReleves, (releve) => getJobXpPerHour(releve, hunterMobs, "Mob")),
      estimateStats: aggregateOptionalMetric(betaReleves, (releve) => getEstimatedLevel100Seconds(releve, "hunterLevel", hunterMobs, "Mob"))
    }
  ].map((row) => {
    const averageLevel = row.levelStats.average;
    const averageRemainingXp = getRemainingXpToLevel100(averageLevel);

    return {
      label: row.label,
      estimateLabel: row.estimateStats.count ? formatDuration(row.estimateStats.average) : "Impossible a estimer",
      levelLabel: formatNumber(averageLevel, 1),
      xpPerHourLabel: row.xpPerHourStats.count ? formatNumber(row.xpPerHourStats.average, 2) : "-",
      remainingXpLabel: formatNumber(averageRemainingXp, 0),
      sampleCountLabel: String(row.estimateStats.count)
    };
  });

  betaApp.innerHTML = `
    <div class="snapshot-shell beta-dashboard">
      ${overviewMetrics}

      <nav class="snapshot-tabs" aria-label="Sections beta">
        <button class="is-active" type="button" data-beta-tab="general">Vue generale</button>
        <button type="button" data-beta-tab="quests">Quetes</button>
        <button type="button" data-beta-tab="ratios">Ratios</button>
        <button type="button" data-beta-tab="miner">Mineur</button>
        <button type="button" data-beta-tab="wood">Bucheron</button>
        <button type="button" data-beta-tab="farmer">Fermier</button>
        <button type="button" data-beta-tab="hunter">Chasseur</button>
      </nav>

      ${renderTabPanel("general", [
        renderLevel100Projection("Projection moyenne vers niveau 100", `Lecture rapide du temps moyen estime pour atteindre le niveau 100 sur les releves beta. Seuls les releves avec au moins ${projectionFilterMinutes} min de farm sur le metier sont retenus.`, level100ProjectionRows),
        renderMetricSummaryBoard("Economie beta", "Lecture simplifiee des valeurs economie sur les releves beta.", [
          { label: "Argent", stats: aggregateMetric(betaReleves, (releve) => releve.argent) },
          { label: "Coins", stats: aggregateMetric(betaReleves, (releve) => releve.coins) },
          { label: "Argent gagne total", stats: aggregateMetric(betaReleves, (releve) => releve.moneyEarned) },
          { label: "Argent depense total", stats: aggregateMetric(betaReleves, (releve) => releve.moneySpent) },
          { label: "Ventes / h", stats: aggregateMetric(betaReleves, (releve) => releve.averageSales) }
        ], (value) => formatCompactNumber(value)),
        renderMetricSummaryBoard("Sell stick beta", "Lecture dediee aux ventes du sell stick sur les releves beta.", [
          { label: "Ventes sell stick", stats: aggregateMetric(betaReleves, (releve) => releve.sellStickMoney) }
        ], (value) => formatCompactNumber(value)),
        renderCompareChart("Progression beta", "Suivi global des releves beta.", [
          { label: "Temps jeu", stats: aggregateMetric(betaReleves, (releve) => secondsFromFields(releve.days, releve.hours, releve.minutes, releve.seconds)) },
          { label: "Completion", stats: aggregateMetric(betaReleves, (releve) => releve.questCompletionRate) },
          { label: "Diff. moyenne", stats: aggregateMetric(betaReleves, (releve) => releve.averageDifference) }
        ], (value) => value > 1000 ? formatDuration(value) : formatPercent(value)),
        modeInfo,
        notesInfo,
        renderStatsTable("Resume general detaille", generalRows)
      ])}

      ${renderTabPanel("quests", [
        renderMetricSummaryBoard("Quetes beta", "Lecture simple des quetes sur les releves beta.", [
          { label: "Principales", stats: aggregateMetric(betaReleves, (releve) => releve.mainQuestsDone) },
          { label: "Secondaires", stats: aggregateMetric(betaReleves, (releve) => releve.secondaryQuestsDone) },
          { label: "Quotidiennes", stats: aggregateMetric(betaReleves, (releve) => releve.dailyQuestsDone) },
          { label: "Completion", stats: aggregateMetric(betaReleves, (releve) => releve.questCompletionRate) }
        ], (value) => formatNumber(value, 2)),
        renderStatsTable("Resume quetes detaille", questRows)
      ])}

      ${renderTabPanel("ratios", [
        renderCompareChart("Ratios d'equilibrage beta", "Lecture des ratios saisis sur les releves beta.", [
          { label: "Mineur", stats: aggregateMetric(betaReleves, (releve) => releve.minerRatio) },
          { label: "Chasseur", stats: aggregateMetric(betaReleves, (releve) => releve.hunterRatio) },
          { label: "Fermier", stats: aggregateMetric(betaReleves, (releve) => releve.farmerRatio) },
          { label: "Bucheron", stats: aggregateMetric(betaReleves, (releve) => releve.lumberjackRatio) },
          { label: "Diff. moyenne", stats: aggregateMetric(betaReleves, (releve) => releve.averageDifference) }
        ], (value) => formatPercent(value)),
        renderStatsTable("Resume ratios detaille", ratioRows)
      ])}

      ${renderTabPanel("miner", [
        renderCompareChart("Vue mineur beta", "Niveau, grotte et info minage.", [
          { label: "Niveau", stats: aggregateMetric(betaReleves, (releve) => releve.minerLevel) },
          { label: "Minerais grotte", stats: aggregateMetric(betaReleves, (releve) => releve.minerCaveOres) },
          { label: "Ratio grotte", stats: aggregateMetric(betaReleves, (releve) => releve.minerCaveRatio) },
          { label: "Minerais minage", stats: aggregateMetric(betaReleves, (releve) => releve.minerInfoOres) },
          { label: "Ratio minage", stats: aggregateMetric(betaReleves, (releve) => releve.minerInfoRatio) }
        ], (value) => formatNumber(value, 2)),
        renderCompareChart("Rendement mineur par minerai", "Lecture rapide des rendements moyens.", minerMinerals.map((item) => ({
          label: item.label,
          stats: aggregateMetric(betaReleves, (releve) => releve[`${item.key}MineralYieldRate`])
        })), (value) => formatPercent(value)),
        renderStatsTable("Resume mineur detaille", minerOverviewRows),
        renderStatsTable("Mineraux detailles", minerResourceRows)
      ])}

      ${renderTabPanel("wood", [
        renderCompareChart("Vue bucheron beta", "Niveau et rendements bois.", [
          { label: "Niveau", stats: aggregateMetric(betaReleves, (releve) => releve.lumberjackLevel) },
          ...lumberjackWoods.map((item) => ({
            label: item.label,
            stats: aggregateMetric(betaReleves, (releve) => releve[`${item.key}WoodYieldRate`])
          }))
        ], (value) => formatPercent(value)),
        renderStatsTable("Resume bucheron detaille", woodOverviewRows),
        renderStatsTable("Essences detaillees", woodResourceRows)
      ])}

      ${renderTabPanel("farmer", [
        renderCompareChart("Vue fermier beta", "Niveau et rendements cultures.", [
          { label: "Niveau", stats: aggregateMetric(betaReleves, (releve) => releve.farmerLevel) },
          ...farmerCrops.map((item) => ({
            label: item.label,
            stats: aggregateMetric(betaReleves, (releve) => releve[`${item.key}CropYieldRate`])
          }))
        ], (value) => formatPercent(value)),
        renderStatsTable("Resume fermier detaille", farmerOverviewRows),
        renderStatsTable("Cultures detaillees", farmerResourceRows)
      ])}

      ${renderTabPanel("hunter", [
        renderCompareChart("Vue chasseur beta", "Niveau et rendements mobs.", [
          { label: "Niveau", stats: aggregateMetric(betaReleves, (releve) => releve.hunterLevel) },
          ...hunterMobs.map((item) => ({
            label: item.label,
            stats: aggregateMetric(betaReleves, (releve) => releve[`${item.key}MobYieldRate`])
          }))
        ], (value) => formatPercent(value)),
        renderStatsTable("Resume chasseur detaille", hunterOverviewRows),
        renderStatsTable("Mobs detailles", hunterResourceRows)
      ])}
    </div>
  `;

  const tabs = Array.from(betaApp.querySelectorAll("[data-beta-tab]"));
  const panels = Array.from(betaApp.querySelectorAll("[data-beta-panel]"));

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.betaTab;
      tabs.forEach((button) => {
        button.classList.toggle("is-active", button === tab);
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.betaPanel !== target;
      });
    });
  });
};

if (betaApp) {
  (async () => {
    await hydrateStorageCaches();
    createBetaDashboard();
  })();
}
