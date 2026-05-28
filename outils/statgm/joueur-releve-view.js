const viewTitle = document.querySelector("[data-view-title]");
const viewSubtitle = document.querySelector("[data-view-subtitle]");
const viewBack = document.querySelector("[data-view-back]");
const viewEdit = document.querySelector("[data-view-edit]");
const viewContent = document.querySelector("[data-view-content]");

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
  { key: "wheat", label: "Bl&eacute;" },
  { key: "carrot", label: "Carotte" },
  { key: "potato", label: "Pomme de terre" },
  { key: "pumpkin", label: "Citrouille" },
  { key: "sugarCane", label: "Canne a sucre" },
  { key: "beetroot", label: "Betterave" },
  { key: "netherWart", label: "Verrue de Nether" },
  { key: "cocoaBeans", label: "F&egrave;ves de cacao" },
  { key: "vine", label: "Liane" },
  { key: "brownMushroom", label: "Champignon marron" },
  { key: "redMushroom", label: "Champignon rouge" }
];

const hunterMobs = [
  { key: "zombie", label: "Zombie" },
  { key: "angel", label: "Ange" },
  { key: "aspic", label: "Aspic" },
  { key: "asseche", label: "Ass&eacute;ch&eacute;" },
  { key: "assoife", label: "Assoif&eacute;" },
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
  const numberValue = Number(String(value ?? "").replace("%", "").replace(",", "."));
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const displayValue = (value, fallback = "0") => {
  const safeValue = value ?? "";
  return escapeHtml(String(safeValue).trim() || fallback);
};

const formatNumber = (value, digits = 2) => {
  const numberValue = toNumber(value);
  if (!numberValue) return "0";
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: digits
  }).format(numberValue);
};

const formatDateTime = (releve) => {
  const datePart = releve.date || "";
  const timePart = releve.time || "";
  if (datePart && timePart) return `${datePart} ${timePart}`;
  return datePart || timePart || "Date non renseignee";
};

const formatPlayTime = (releve) => {
  return `${displayValue(releve.days)}j ${displayValue(releve.hours)}h ${displayValue(releve.minutes)}m ${displayValue(releve.seconds)}s`;
};

const formatCaveTime = (releve) => {
  if ("minerCaveDays" in releve || "minerCaveHours" in releve || "minerCaveMinutes" in releve || "minerCaveSeconds" in releve) {
    return `${displayValue(releve.minerCaveDays)}j ${displayValue(releve.minerCaveHours)}h ${displayValue(releve.minerCaveMinutes)}m ${displayValue(releve.minerCaveSeconds)}s`;
  }
  return displayValue(releve.minerCaveTime, "0j 0h 0m 0s");
};

const setupChartTooltips = () => {
  if (document.body.dataset.chartTooltipReady === "true") return;

  const tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip";
  document.body.appendChild(tooltip);

  let activeTarget = null;

  const hideTooltip = () => {
    activeTarget = null;
    tooltip.classList.remove("is-visible");
  };

  const showTooltip = (target, clientX, clientY) => {
    const text = target?.getAttribute("data-chart-tooltip");
    if (!text) {
      hideTooltip();
      return;
    }

    activeTarget = target;
    tooltip.textContent = text;
    tooltip.classList.add("is-visible");

    const offset = 16;
    const rect = tooltip.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width - 12;
    const left = Math.min(Math.max(12, clientX + offset), Math.max(12, maxLeft));
    const top = Math.max(12, clientY - rect.height - offset);

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  document.addEventListener("mousemove", (event) => {
    const target = event.target.closest?.("[data-chart-tooltip]");
    if (!target) {
      if (activeTarget) hideTooltip();
      return;
    }

    showTooltip(target, event.clientX, event.clientY);
  });

  document.addEventListener("mouseleave", hideTooltip);
  document.addEventListener("scroll", hideTooltip, true);

  document.body.dataset.chartTooltipReady = "true";
};

const secondsFromFields = (days, hours, minutes, seconds) => {
  return (toNumber(days) * 86400) + (toNumber(hours) * 3600) + (toNumber(minutes) * 60) + toNumber(seconds);
};

const formatSeconds = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(safeSeconds / 86400);
  const hours = Math.floor((safeSeconds % 86400) / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${days}j ${hours}h ${minutes}m ${seconds}s`;
};


const getRemainingXpToLevel100 = (levelValue) => {
  const currentLevel = Math.max(1, Math.floor(toNumber(levelValue) || 1));
  if (currentLevel >= 100) return 0;
  return jobLevelXpRequirements
    .slice(currentLevel - 1)
    .reduce((total, xpRequired) => total + xpRequired, 0);
};

const getLevel100Estimate = (levelValue, xpPerHour) => {
  const remainingXp = getRemainingXpToLevel100(levelValue);
  const safeXpPerHour = toNumber(xpPerHour);

  if (!remainingXp) {
    return {
      remainingXp: 0,
      estimateLabel: "Niveau 100 atteint"
    };
  }

  if (safeXpPerHour <= 0) {
    return {
      remainingXp,
      estimateLabel: "Impossible a estimer"
    };
  }

  return {
    remainingXp,
    estimateLabel: formatSeconds((remainingXp / safeXpPerHour) * 3600)
  };
};

const percent = (value, max) => {
  if (!max) return 0;
  return Math.max(3, Math.min(100, (toNumber(value) / max) * 100));
};

const resultTone = (value, maxValue, mode = "relative") => {
  const score = mode === "percentage" ? toNumber(value) : percent(value, maxValue);
  if (score >= 80) return "is-good";
  if (score >= 50) return "is-medium";
  return "is-bad";
};

const getChartValueLabel = (row, toneMode = "relative") => {
  if (row.displayValue) return row.displayValue;
  if (toneMode === "percentage") return `${formatNumber(row.value, 2)}%`;
  return formatNumber(row.value, 2);
};

const renderMetricCard = (label, value, accent = false) => {
  return `
    <article class="snapshot-metric">
      <span>${label}</span>
      <strong class="${accent ? "is-accent" : ""}">${displayValue(value, "-")}</strong>
    </article>
  `;
};

const renderInfoList = (items) => {
  return `
    <div class="snapshot-info-list">
      ${items.map(([label, value]) => `
        <p><strong>${label}</strong> ${displayValue(value, "-")}</p>
      `).join("")}
    </div>
  `;
};

const renderPanelCard = (title, content, className = "") => {
  return `
    <article class="snapshot-card ${className}">
      <h2>${title}</h2>
      ${content}
    </article>
  `;
};


const renderBarChart = (title, rows, className = "", toneMode = "relative") => {
  const maxValue = Math.max(...rows.map((row) => toNumber(row.value)), 1);
  return renderPanelCard(title, `
    <div class="snapshot-bar-chart ${className}">
      ${rows.map((row) => {
        const tone = resultTone(row.value, maxValue, toneMode);
        const valueLabel = getChartValueLabel(row, toneMode);
        return `
        <div class="snapshot-bar-item ${tone}" data-chart-tooltip="${escapeHtml(`${row.label}: ${valueLabel}`)}">
          <div class="snapshot-bar-track">
            <span class="${tone}" style="height: ${percent(row.value, maxValue)}%;"></span>
          </div>
          <small>${row.label}</small>
        </div>
      `;
      }).join("")}
    </div>
  `, "snapshot-card--wide");
};

const renderLineLikeChart = (title, rows, toneMode = "relative") => {
  const maxValue = Math.max(...rows.map((row) => toNumber(row.value)), 1);
  return renderPanelCard(title, `
    <div class="snapshot-line-chart">
      ${rows.map((row) => {
        const tone = resultTone(row.value, maxValue, toneMode);
        const valueLabel = getChartValueLabel(row, toneMode);
        return `
        <div class="snapshot-line-point ${tone}" style="--point: ${percent(row.value, maxValue)}%;" data-chart-tooltip="${escapeHtml(`${row.label}: ${valueLabel}`)}">
          <span class="${tone}"></span>
          <small>${row.label}</small>
        </div>
      `;
      }).join("")}
    </div>
  `);
};

const renderDonutChart = (title, rows, note = "") => {
  const total = rows.reduce((sum, row) => sum + Math.max(0, toNumber(row.value)), 0);
  const palette = [
    { fill: "#39d8ff", glow: "rgba(57, 216, 255, 0.24)" },
    { fill: "#56df85", glow: "rgba(86, 223, 133, 0.22)" },
    { fill: "#ffb24b", glow: "rgba(255, 178, 75, 0.22)" },
    { fill: "#ad8eff", glow: "rgba(173, 142, 255, 0.24)" }
  ];

  let startAngle = 0;
  const segments = rows.map((row, index) => {
    const safeValue = Math.max(0, toNumber(row.value));
    const ratio = total > 0 ? safeValue / total : 0;
    const sweep = ratio * 360;
    const segment = {
      ...row,
      ratio,
      start: startAngle,
      end: startAngle + sweep,
      color: palette[index % palette.length].fill,
      glow: palette[index % palette.length].glow
    };
    startAngle += sweep;
    return segment;
  });

  const gradient = total > 0
    ? `conic-gradient(${segments.map((segment) => `${segment.color} ${segment.start}deg ${segment.end}deg`).join(", ")})`
    : "conic-gradient(rgba(255, 255, 255, 0.08) 0deg 360deg)";

  return renderPanelCard(title, `
    ${note ? `<p class="snapshot-donut-note">${escapeHtml(note)}</p>` : ""}
    <div class="snapshot-donut-card">
      <div class="snapshot-donut-shell">
        <div class="snapshot-donut-chart" style="--donut-gradient: ${gradient};">
          <div class="snapshot-donut-core">
            <strong>${escapeHtml(formatSeconds(total))}</strong>
            <span>Total</span>
          </div>
        </div>
      </div>
      <div class="snapshot-donut-legend">
        ${segments.map((segment) => {
          const percentLabel = `${formatNumber(segment.ratio * 100, 1)}%`;
          const timeLabel = formatSeconds(segment.value);
          return `
            <div class="snapshot-donut-item" data-chart-tooltip="${escapeHtml(`${segment.label}: ${timeLabel} - ${percentLabel}`)}" style="--donut-color: ${segment.color}; --donut-glow: ${segment.glow};">
              <i></i>
              <div>
                <strong>${segment.label}</strong>
                <span>${timeLabel}</span>
              </div>
              <small>${percentLabel}</small>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `);
};

const renderDataTable = (headers, rows, columnsClass = "") => {
  return `
    <div class="snapshot-table-wrap">
      <div class="snapshot-table ${columnsClass}">
        <div class="snapshot-table-head">
          ${headers.map((header) => `<span>${header}</span>`).join("")}
        </div>
        ${rows.map((row) => `
          <div class="snapshot-table-row">
            ${row.map((cell) => `<span>${cell}</span>`).join("")}
          </div>
        `).join("")}
      </div>
    </div>
  `;
};

const getWorstTone = (tones) => {
  if (tones.includes("is-bad")) return "is-bad";
  if (tones.includes("is-medium")) return "is-medium";
  return "is-good";
};

const renderAdjustmentResource = (label, row, context = {}) => {
  const hasFilledData = [
    row.xp,
    row.quantity,
    row.craft,
    row.xpPerHour,
    row.quantityPerHour,
    row.moneyPerHour
  ].some((value) => toNumber(value) > 0);
  const tones = [];

  if (toNumber(row.yieldRate) > 0) tones.push(resultTone(row.yieldRate, 100, "percentage"));
  if (context.maxXpPerHour) tones.push(resultTone(row.xpPerHour, context.maxXpPerHour));
  if (context.maxMoneyPerHour) tones.push(resultTone(row.moneyPerHour, context.maxMoneyPerHour));

  const tone = getWorstTone(tones);
  const needsAdjustment = hasFilledData && tone !== "is-good";
  const isHealthy = hasFilledData && tone === "is-good";

  return `
    <span class="adjustment-resource">
      ${needsAdjustment ? `<span class="adjustment-badge ${tone}" title="Ajustement a prevoir sur cette ressource">!</span>` : ""}
      ${isHealthy ? '<span class="adjustment-badge is-good" title="Ratio coherent">✓</span>' : ""}
      <span>${label}</span>
    </span>
  `;
};

const getResourceRows = (items, config) => {
  return items.map(({ key, label }) => {
    const prefix = `${key}${config.suffix}`;
    const quantity = releve[`${prefix}${config.quantityField}`];
    const quantityPerHour = releve[`${prefix}${config.quantityPerHourField}`];

    return {
      label,
      xp: releve[`${prefix}Xp`],
      quantity,
      craft: config.craftField ? releve[`${prefix}${config.craftField}`] : null,
      xpPerHour: releve[`${prefix}XpPerHour`],
      quantityPerHour,
      yieldRate: releve[`${prefix}YieldRate`],
      moneyPerHour: releve[`${prefix}MoneyPerHour`],
      timeSeconds: secondsFromFields(
        releve[`${prefix}Days`],
        releve[`${prefix}Hours`],
        releve[`${prefix}Minutes`],
        releve[`${prefix}Seconds`]
      )
    };
  });
};

const sumField = (rows, field) => rows.reduce((total, row) => total + toNumber(row[field]), 0);
const avgField = (rows, field) => rows.length ? sumField(rows, field) / rows.length : 0;

const renderJobTab = ({ key, title, label = title, level, context, rows, quantityLabel, includeCraft = false }) => {
  const averageXpPerHour = avgField(rows, "xpPerHour");
  const projection = getLevel100Estimate(level, averageXpPerHour);
  const adjustmentContext = {
    maxXpPerHour: Math.max(...rows.map((row) => toNumber(row.xpPerHour)), 0),
    maxMoneyPerHour: Math.max(...rows.map((row) => toNumber(row.moneyPerHour)), 0)
  };
  const headers = includeCraft
    ? ["Nom", "XP gagn&eacute;e", "Quantit&eacute;", "Craft bloc", "XP / h", "Quantit&eacute; / h", "Rendement", "Sommes / h"]
    : ["Nom", "XP gagn&eacute;e", "Quantit&eacute;", "XP / h", "Quantit&eacute; / h", "Rendement", "Sommes / h"];
  const tableRows = rows.map((row) => {
    const baseCells = [
      renderAdjustmentResource(row.label, row, adjustmentContext),
      formatNumber(row.xp, 0),
      formatNumber(row.quantity, 0)
    ];
    if (includeCraft) baseCells.push(formatNumber(row.craft, 0) || "-");
    return [
      ...baseCells,
      formatNumber(row.xpPerHour, 2),
      formatNumber(row.quantityPerHour, 2),
      displayValue(row.yieldRate, "0%"),
      formatNumber(row.moneyPerHour, 2)
    ];
  });

  return `
    <section class="snapshot-tab-panel" data-snapshot-panel="${key || title.toLowerCase()}">
      <div class="snapshot-metric-grid">
        ${renderMetricCard("Niveau actuel", level, true)}
        ${renderMetricCard("XP / h", formatNumber(averageXpPerHour, 2), true)}
        ${renderMetricCard("XP restants vers 100", formatNumber(projection.remainingXp, 0), true)}
        ${renderMetricCard("Temps estime vers niveau 100", projection.estimateLabel, true)}
      </div>
      ${renderBarChart(`Performance ${label.toLowerCase()}`, rows.map((row) => ({
        label: row.label,
        value: row.xpPerHour
      })), "snapshot-bar-chart--cyan")}
      ${renderDataTable(headers, tableRows, includeCraft ? "snapshot-table--miner" : "snapshot-table--job")}
    </section>
  `;
};

const setupTabs = () => {
  const tabButtons = viewContent.querySelectorAll("[data-snapshot-tab]");
  const panels = viewContent.querySelectorAll("[data-snapshot-panel]");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.snapshotTab;
      tabButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.snapshotPanel !== target;
      });
    });
  });
};

const params = new URLSearchParams(window.location.search);
const playerId = params.get("id");
const releveId = params.get("releveId");
const renderMissingReleve = (player) => {
  viewTitle.textContent = "Releve introuvable";
  viewSubtitle.textContent = "Impossible de retrouver ce releve dans la sauvegarde locale.";
  if (viewContent) viewContent.innerHTML = '<p class="empty-state">Retourne a la fiche du joueur et selectionne un releve existant.</p>';
  if (viewEdit) viewEdit.hidden = true;
  if (viewBack) viewBack.href = player ? `joueur-detail.html?id=${encodeURIComponent(player.id)}` : "joueur.html";
  document.title = "Releve introuvable - StatGM Design";
};

const initializeReleveViewPage = async () => {
  await hydrateStorageCaches();

  const players = readStorageList(playersStorageKey);
  const releves = readStorageList(relevesStorageKey);
  const player = players.find((item) => String(item.id) === String(playerId));
  const releve = releves.find((item) => String(item.id) === String(releveId) && String(item.playerId) === String(playerId));

  if (!(player && releve)) {
    renderMissingReleve(player);
    return;
  }

  setupChartTooltips();
  const title = releve.name || "Releve sans nom";
  const minerRows = getResourceRows(minerMinerals, {
    suffix: "Mineral",
    quantityField: "BlocksBroken",
    quantityPerHourField: "BlocksPerHour",
    craftField: "BlocksCrafted"
  });
  const woodRows = getResourceRows(lumberjackWoods, {
    suffix: "Wood",
    quantityField: "Logs",
    quantityPerHourField: "LogsPerHour"
  });
  const cropRows = getResourceRows(farmerCrops, {
    suffix: "Crop",
    quantityField: "Items",
    quantityPerHourField: "ItemsPerHour"
  });
  const mobRows = getResourceRows(hunterMobs, {
    suffix: "Mob",
    quantityField: "Kills",
    quantityPerHourField: "MobsPerHour"
  });
  const jobPlaytimeRows = [
    { label: "Mineur", value: minerRows.reduce((sum, row) => sum + toNumber(row.timeSeconds), 0) },
    { label: "Fermier", value: cropRows.reduce((sum, row) => sum + toNumber(row.timeSeconds), 0) },
    { label: "Bucheron", value: woodRows.reduce((sum, row) => sum + toNumber(row.timeSeconds), 0) },
    { label: "Chasseur", value: mobRows.reduce((sum, row) => sum + toNumber(row.timeSeconds), 0) }
  ];
  const betaText = releve.betaReleve ? `Beta${releve.betaDay ? ` - ${releve.betaDay}` : ""}` : "Normal";

  viewTitle.textContent = title;
  viewSubtitle.textContent = `${player.name} - ${betaText} - ${formatDateTime(releve)}.`;
  document.title = `${title} - ${player.name}`;

  if (viewBack) viewBack.href = `joueur-detail.html?id=${encodeURIComponent(player.id)}`;
  if (viewEdit) viewEdit.href = `joueur-releve.html?id=${encodeURIComponent(player.id)}&releveId=${encodeURIComponent(releve.id)}`;

  viewContent.innerHTML = `
    <div class="snapshot-shell">
      <div class="snapshot-metric-grid">
        ${renderMetricCard("Argent", formatNumber(releve.argent, 0), true)}
        ${renderMetricCard("Coins", formatNumber(releve.coins, 0))}
        ${renderMetricCard("Temps de jeu", formatPlayTime(releve), true)}
        ${renderMetricCard("Progression serveur", `${displayValue(releve.questCompletionRate)}%`, true)}
      </div>

      <nav class="snapshot-tabs" aria-label="Onglets du releve">
        <button class="is-active" type="button" data-snapshot-tab="general">Vue g&eacute;n&eacute;rale</button>
        <button type="button" data-snapshot-tab="mineur">Mineur</button>
        <button type="button" data-snapshot-tab="fermier">Fermier</button>
        <button type="button" data-snapshot-tab="bucheron">B&ucirc;cheron</button>
        <button type="button" data-snapshot-tab="chasseur">Chasseur</button>
      </nav>

      <section class="snapshot-tab-panel" data-snapshot-panel="general">
        <div class="snapshot-general-grid">
          ${renderPanelCard("Informations g&eacute;n&eacute;rales", renderInfoList([
            ["Pseudo joueur :", player.name],
            ["Heure du releve :", releve.time || "-"],
            ["Grade :", releve.grade || "-"],
            ["Boost actif :", releve.boost || "-"],
            ["Date d'arrivee :", releve.arrival || "-"],
            ["Notes :", releve.notes || "Aucune note."]
          ]))}
          ${renderPanelCard("Qu&ecirc;tes &amp; succ&egrave;s", renderInfoList([
            ["Quetes principales :", `${displayValue(releve.mainQuestsDone)} / ${displayValue(releve.mainQuestsTotal)} - ${displayValue(releve.mainQuestDays)}j ${displayValue(releve.mainQuestHours)}h ${displayValue(releve.mainQuestMinutes)}m ${displayValue(releve.mainQuestSeconds)}s`],
            ["Quetes secondaires :", `${displayValue(releve.secondaryQuestsDone)} / ${displayValue(releve.secondaryQuestsTotal)} - ${displayValue(releve.secondaryQuestDays)}j ${displayValue(releve.secondaryQuestHours)}h ${displayValue(releve.secondaryQuestMinutes)}m ${displayValue(releve.secondaryQuestSeconds)}s`],
            ["Quetes quotidiennes :", `${displayValue(releve.dailyQuestsDone)} / ${displayValue(releve.dailyQuestsTotal, "-")} - ${displayValue(releve.dailyQuestDays)}j ${displayValue(releve.dailyQuestHours)}h ${displayValue(releve.dailyQuestMinutes)}m ${displayValue(releve.dailyQuestSeconds)}s`],
            ["Temps quetes :", releve.questTotalTime || "-"],
            ["Taux de completion :", `${displayValue(releve.questCompletionRate)}%`]
          ]))}
          ${renderLineLikeChart("Economie", [
            { label: "/sell", value: releve.sellMoney },
            { label: "Hopper", value: releve.hopperMoney },
            { label: "Sell stick", value: releve.sellStickMoney },
            { label: "Gagne", value: releve.moneyEarned }
          ])}
          ${renderLineLikeChart("Progression globale du releve", [
            { label: "Serveur", value: releve.questCompletionRate },
            { label: "Completion", value: releve.questCompletionRate },
            { label: "Ventes / h", value: releve.averageSales }
          ])}
          ${renderBarChart("Ratios comparatifs equilibrage", [
            { label: "Mineur", value: releve.minerRatio },
            { label: "Chasseur", value: releve.hunterRatio },
            { label: "Fermier", value: releve.farmerRatio },
            { label: "Bucheron", value: releve.lumberjackRatio }
          ], "", "percentage")}
          ${renderDonutChart("Repartition du temps de jeu metiers", jobPlaytimeRows, "Comparaison des temps de farm saisis pour chaque metier sur ce releve.")}
          ${renderPanelCard("Synth&egrave;se d'&eacute;quilibrage", renderInfoList([
            ["Ratio moyen :", `${formatNumber((toNumber(releve.minerRatio) + toNumber(releve.hunterRatio) + toNumber(releve.farmerRatio) + toNumber(releve.lumberjackRatio)) / 4, 2)}%`],
            ["Difference moyenne :", `${displayValue(releve.averageDifference)}%`],
            ["Etat :", "Les donnees du releve sont pretes pour comparaison."]
          ]))}
        </div>
      </section>

      ${renderJobTab({
        key: "mineur",
        title: "Mineur",
        level: releve.minerLevel,
        context: `${formatCaveTime(releve)} - ${formatNumber(sumField(minerRows, "quantity"), 0)} minerais`,
        rows: minerRows,
        quantityLabel: "minerais",
        includeCraft: true
      }).replace('data-snapshot-panel="mineur"', 'data-snapshot-panel="mineur" hidden')}

      ${renderJobTab({
        key: "fermier",
        title: "Fermier",
        level: releve.farmerLevel,
        context: "Cultures et rendement",
        rows: cropRows,
        quantityLabel: "items"
      }).replace('data-snapshot-panel="fermier"', 'data-snapshot-panel="fermier" hidden')}

      ${renderJobTab({
        key: "bucheron",
        title: "Bucheron",
        label: "B&ucirc;cheron",
        level: releve.lumberjackLevel,
        context: "Bois et productivite",
        rows: woodRows,
        quantityLabel: "buches"
      }).replace('data-snapshot-panel="bucheron"', 'data-snapshot-panel="bucheron" hidden')}

      ${renderJobTab({
        key: "chasseur",
        title: "Chasseur",
        level: releve.hunterLevel,
        context: "Mobs et drops",
        rows: mobRows,
        quantityLabel: "mobs"
      }).replace('data-snapshot-panel="chasseur"', 'data-snapshot-panel="chasseur" hidden')}
    </div>
  `;

  setupTabs();
};

initializeReleveViewPage();
