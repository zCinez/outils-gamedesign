const detailTitle = document.querySelector("[data-detail-title]");
const detailSubtitle = document.querySelector("[data-detail-subtitle]");
const detailInitial = document.querySelector("[data-detail-initial]");
const detailName = document.querySelector("[data-detail-name]");
const detailMessage = document.querySelector("[data-detail-message]");
const detailBeta = document.querySelector("[data-detail-beta]");
const detailDescription = document.querySelector("[data-detail-description]");
const editPanel = document.querySelector("[data-edit-panel]");
const editForm = document.querySelector("[data-edit-form]");
const editFeedback = document.querySelector("[data-edit-feedback]");
const deletePlayerButton = document.querySelector("[data-delete-player]");
const addReleveLink = document.querySelector("[data-add-releve]");
const relevesPanel = document.querySelector("[data-releves-panel]");
const playerRelevesList = document.querySelector("[data-player-releves]");
const relevesCount = document.querySelector("[data-releves-count]");
const evolutionPanel = document.querySelector("[data-evolution-panel]");
const playerEvolution = document.querySelector("[data-player-evolution]");
const evolutionCount = document.querySelector("[data-evolution-count]");
const playerTabs = document.querySelector("[data-player-tabs]");
const betaTab = document.querySelector("[data-player-tab=\"beta\"]");
const betaEvolutionPanel = document.querySelector("[data-beta-evolution-panel]");
const playerBetaEvolution = document.querySelector("[data-player-beta-evolution]");
const betaEvolutionCount = document.querySelector("[data-beta-evolution-count]");

const storageKey = "statgm-players";
const relevesStorageKey = "statgm-releves";
const store = window.StatGMStore;
let playersCache = [];
let relevesCache = [];

const readPlayers = () => {
  return Array.isArray(playersCache) ? [...playersCache] : [];
};

const writePlayers = async (players) => {
  playersCache = Array.isArray(players) ? [...players] : [];
  if (store?.setList) {
    await store.setList(storageKey, playersCache);
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(playersCache));
};

const readReleves = () => {
  return Array.isArray(relevesCache) ? [...relevesCache] : [];
};

const writeReleves = async (releves) => {
  relevesCache = Array.isArray(releves) ? [...releves] : [];
  if (store?.setList) {
    await store.setList(relevesStorageKey, relevesCache);
    return;
  }

  localStorage.setItem(relevesStorageKey, JSON.stringify(relevesCache));
};

const hydrateStorageCaches = async () => {
  if (store?.ready) {
    await store.ready();
    playersCache = store.getList(storageKey);
    relevesCache = store.getList(relevesStorageKey);
    return;
  }

  try {
    playersCache = JSON.parse(localStorage.getItem(storageKey) || "[]");
    relevesCache = JSON.parse(localStorage.getItem(relevesStorageKey) || "[]");
  } catch {
    playersCache = [];
    relevesCache = [];
  }
};

const getInitial = (name) => {
  const trimmedName = String(name || "").trim();
  return (trimmedName.slice(0, 1) || "N").toUpperCase();
};

const escapeHtml = (value) => {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatDateTime = (releve) => {
  const datePart = releve.date || "";
  const timePart = releve.time || "";
  if (datePart && timePart) return `${datePart} ${timePart}`;
  return datePart || timePart || "Date non renseignee";
};

const formatPlayTime = (releve) => {
  const days = releve.days || "0";
  const hours = releve.hours || "0";
  const minutes = releve.minutes || "0";
  const seconds = releve.seconds || "0";
  return `${escapeHtml(days)}j ${escapeHtml(hours)}h ${escapeHtml(minutes)}m<br><span>${escapeHtml(seconds)}s</span>`;
};

const toNumber = (value) => {
  const numberValue = Number(String(value ?? "").replace("%", "").replace(",", "."));
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const formatCompactNumber = (value, suffix = "") => {
  const formatted = new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(toNumber(value));
  return `${formatted}${suffix}`;
};

const getPlayTimeSeconds = (releve) => {
  return (toNumber(releve.days) * 86400) + (toNumber(releve.hours) * 3600) + (toNumber(releve.minutes) * 60) + toNumber(releve.seconds);
};

const formatDurationShort = (secondsValue) => {
  const totalSeconds = Math.max(0, Math.floor(toNumber(secondsValue)));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${days}j ${hours}h ${minutes}m`;
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

const getPlayerReleves = () => {
  return readReleves()
    .filter((releve) => String(releve.playerId) === String(playerId))
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
};

const getNormalPlayerReleves = () => getPlayerReleves().filter((releve) => !releve.betaReleve);
const getBetaPlayerReleves = () => getPlayerReleves().filter((releve) => Boolean(releve.betaReleve));

const getReleveTimelineValue = (releve) => {
  const datePart = releve.date || "";
  const timePart = releve.time || "00:00";
  const parsedDate = Date.parse(`${datePart}T${timePart}`);
  return Number.isFinite(parsedDate) ? parsedDate : Number(releve.createdAt || 0);
};

const buildSmoothPath = (points) => {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.slice(1).reduce((path, point, index) => {
    const previousPoint = points[index];
    const middleX = (previousPoint.x + point.x) / 2;
    return `${path} C ${middleX.toFixed(2)} ${previousPoint.y.toFixed(2)}, ${middleX.toFixed(2)} ${point.y.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }, `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`);
};

const renderEvolutionChart = ({ title, note, labels, series }) => {
  const safeLabels = labels.map((label) => escapeHtml(label));
  const chartId = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const gradients = series.map((item, index) => `
    <linearGradient id="${chartId}-area-${index}" class="${item.className}" x1="0" x2="0" y1="0" y2="1">
      <stop class="evolution-gradient-stop" offset="0%" stop-opacity="0.34"></stop>
      <stop class="evolution-gradient-stop" offset="72%" stop-opacity="0.12"></stop>
      <stop class="evolution-gradient-stop" offset="100%" stop-opacity="0"></stop>
    </linearGradient>
  `).join("");
  const lineMarkup = series.map((item, seriesIndex) => {
    const values = item.values.map(toNumber);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, maxValue);
    const range = maxValue - minValue;
    const formatter = item.format || ((value) => formatCompactNumber(value));
    const points = values.map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = range === 0 ? 30 : 52 - (((value - minValue) / range) * 42);
      return { x, y };
    });
    const linePath = buildSmoothPath(points);
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const areaPath = `${linePath} L ${lastPoint.x.toFixed(2)} 54 L ${firstPoint.x.toFixed(2)} 54 Z`;
    const pointMarkup = points.map((point, index) => {
      const tooltip = `${item.label} - ${labels[index]} : ${formatter(values[index])}`;
      return `
        <g class="evolution-point ${item.className}" data-chart-tooltip="${escapeHtml(tooltip)}">
          <circle class="evolution-point-hit" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="3.6"></circle>
          <circle class="evolution-point-dot" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="1.15"></circle>
        </g>
      `;
    }).join("");

    return `
      <g class="evolution-series ${item.className}">
        <path class="evolution-area" d="${areaPath}" fill="url(#${chartId}-area-${seriesIndex})"></path>
        <path class="evolution-line" d="${linePath}"></path>
        ${pointMarkup}
      </g>
    `;
  }).join("");

  const legend = series.map((item) => {
    const values = item.values.map(toNumber);
    const lastValue = values[values.length - 1] || 0;
    const formatter = item.format || ((value) => formatCompactNumber(value));
    return `
      <span class="evolution-legend-item ${item.className}">
        <i aria-hidden="true"></i>
        <strong>${item.label}</strong>
        <small>${escapeHtml(formatter(lastValue))}</small>
      </span>
    `;
  }).join("");

  return `
    <article class="evolution-chart-card">
      <div class="evolution-chart-head">
        <div>
          <h3>${title}</h3>
          <p>${note}</p>
        </div>
        <div class="evolution-legend">
          ${legend}
        </div>
      </div>
      <div class="evolution-chart-frame">
        <svg class="evolution-chart" viewBox="0 0 100 56" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            ${gradients}
          </defs>
          <line x1="0" y1="10" x2="100" y2="10"></line>
          <line x1="0" y1="20.5" x2="100" y2="20.5"></line>
          <line x1="0" y1="31" x2="100" y2="31"></line>
          <line x1="0" y1="41.5" x2="100" y2="41.5"></line>
          <line x1="0" y1="52" x2="100" y2="52"></line>
          ${lineMarkup}
        </svg>
      </div>
      <div class="evolution-axis">
        ${safeLabels.map((label) => `<span>${label}</span>`).join("")}
      </div>
    </article>
  `;
};

const renderSingleProgressChart = ({ title, note, labels, item }) => {
  return renderEvolutionChart({
    title,
    note,
    labels,
    series: [item]
  }).replace("evolution-chart-card", "evolution-chart-card evolution-chart-card--compact");
};

const renderEvolutionSet = ({ target, countTarget, releves, emptyMessage, contextTitle, releveType }) => {
  if (!target) return;

  const sortedReleves = releves.slice().sort((a, b) => getReleveTimelineValue(a) - getReleveTimelineValue(b));
  if (countTarget) countTarget.textContent = String(sortedReleves.length);

  if (!sortedReleves.length) {
    target.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
    return;
  }

  const labels = sortedReleves.map((releve) => formatDurationShort(getPlayTimeSeconds(releve)));
  const helper = sortedReleves.length < 2
    ? '<p class="evolution-hint">Un seul releve est disponible pour le moment. Ajoute un deuxieme releve pour voir les courbes evoluer.</p>'
    : "";

  target.innerHTML = `
    ${helper}
    <div class="evolution-chart-group">
      <div class="evolution-group-head">
        <h3>Progression generale</h3>
        <p>${contextTitle} : chaque indicateur a sa propre courbe pour rester lisible.</p>
      </div>
      ${renderSingleProgressChart({
        title: "Argent",
        note: "Evolution de l'argent du joueur.",
        labels,
        item: {
          label: "Argent",
          className: "evolution-line--gold",
          values: sortedReleves.map((releve) => releve.argent),
          format: (value) => formatCompactNumber(value)
        }
      })}
      ${renderSingleProgressChart({
        title: "Coins",
        note: "Evolution des coins du joueur.",
        labels,
        item: {
          label: "Coins",
          className: "evolution-line--cyan",
          values: sortedReleves.map((releve) => releve.coins),
          format: (value) => formatCompactNumber(value)
        }
      })}
      ${renderSingleProgressChart({
        title: "Temps de jeu",
        note: "Evolution du temps de jeu cumule.",
        labels,
        item: {
          label: "Temps",
          className: "evolution-line--green",
          values: sortedReleves.map(getPlayTimeSeconds),
          format: formatDurationShort
        }
      })}
      ${renderSingleProgressChart({
        title: "Completion des quetes",
        note: "Evolution du taux de quetes terminees.",
        labels,
        item: {
          label: "Quetes",
          className: "evolution-line--red",
          values: sortedReleves.map((releve) => releve.questCompletionRate),
          format: (value) => formatCompactNumber(value, "%")
        }
      })}
    </div>
    ${renderEvolutionChart({
      title: "Niveaux metiers",
      note: `Chaque courbe suit le niveau du metier sur les releves ${releveType}.`,
      labels,
      series: [
        {
          label: "Mineur",
          className: "evolution-line--cyan",
          values: sortedReleves.map((releve) => releve.minerLevel),
          format: (value) => `Niv. ${formatCompactNumber(value)}`
        },
        {
          label: "Fermier",
          className: "evolution-line--green",
          values: sortedReleves.map((releve) => releve.farmerLevel),
          format: (value) => `Niv. ${formatCompactNumber(value)}`
        },
        {
          label: "Bucheron",
          className: "evolution-line--orange",
          values: sortedReleves.map((releve) => releve.lumberjackLevel),
          format: (value) => `Niv. ${formatCompactNumber(value)}`
        },
        {
          label: "Chasseur",
          className: "evolution-line--purple",
          values: sortedReleves.map((releve) => releve.hunterLevel),
          format: (value) => `Niv. ${formatCompactNumber(value)}`
        }
      ]
    })}
  `;
};

const renderPlayerEvolution = () => {
  renderEvolutionSet({
    target: playerEvolution,
    countTarget: evolutionCount,
    releves: getNormalPlayerReleves(),
    emptyMessage: "Aucun releve normal enregistre pour ce joueur.",
    contextTitle: "Releves normaux",
    releveType: "normaux"
  });
};

const renderPlayerBetaEvolution = () => {
  renderEvolutionSet({
    target: playerBetaEvolution,
    countTarget: betaEvolutionCount,
    releves: getBetaPlayerReleves(),
    emptyMessage: "Aucun releve beta enregistre pour ce joueur.",
    contextTitle: "Releves beta",
    releveType: "beta"
  });
};

const activatePlayerTab = (target) => {
  if (!playerTabs) return;

  const tabButtons = playerTabs.querySelectorAll("[data-player-tab]");
  const tabPanels = document.querySelectorAll("[data-player-tab-panel]");

  tabButtons.forEach((item) => {
    const isActive = item.dataset.playerTab === target;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
  });
  tabPanels.forEach((panel) => {
    panel.hidden = panel.dataset.playerTabPanel !== target;
  });
};

const syncBetaTab = () => {
  const shouldShowBeta = Boolean(player?.betaParticipant);
  if (betaTab) betaTab.hidden = !shouldShowBeta;
  if (!shouldShowBeta) {
    if (betaEvolutionPanel) betaEvolutionPanel.hidden = true;
    if (betaTab?.classList.contains("is-active")) activatePlayerTab("releves");
  }
};

const setupPlayerTabs = () => {
  if (!playerTabs) return;

  const tabButtons = playerTabs.querySelectorAll("[data-player-tab]");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activatePlayerTab(button.dataset.playerTab);
    });
  });
};

const renderPlayerReleves = () => {
  if (!playerRelevesList) return;

  const releves = getPlayerReleves();
  if (relevesCount) relevesCount.textContent = String(releves.length);

  if (!releves.length) {
    playerRelevesList.innerHTML = '<p class="empty-state">Aucun releve enregistre pour ce joueur.</p>';
    return;
  }

  const rows = releves.map((releve, index) => {
    const title = escapeHtml(releve.name || `Releve #${releves.length - index}`);
    const phase = escapeHtml(releve.phase || "Phase non renseignee");
    const grade = escapeHtml(releve.grade || "Grade non defini");
    const boost = escapeHtml(releve.boost || "0");
    const betaLabel = releve.betaReleve ? `Beta${releve.betaDay ? ` - ${escapeHtml(releve.betaDay)}` : ""}` : "Normal";
    const playTime = formatPlayTime(releve);
    const createdLabel = escapeHtml(formatDateTime(releve));
    const viewHref = `joueur-releve-view.html?id=${encodeURIComponent(playerId)}&releveId=${encodeURIComponent(releve.id)}`;
    const editHref = `joueur-releve.html?id=${encodeURIComponent(playerId)}&releveId=${encodeURIComponent(releve.id)}`;

    return `
      <div class="releve-table-row" role="row">
        <div class="releve-player-cell" role="cell">
          <span class="releve-avatar">${getInitial(releve.name || player?.name)}</span>
          <div>
            <strong>${title}</strong>
            <span>${phase}</span>
          </div>
        </div>
        <div role="cell">${createdLabel}</div>
        <div role="cell">${grade}<br><span>Boost ${boost}</span></div>
        <div role="cell">${playTime}</div>
        <div role="cell"><span class="status-pill">${escapeHtml(betaLabel)}</span></div>
        <div class="releve-actions" role="cell" aria-label="Actions du releve">
          <a href="${viewHref}" aria-label="Voir le releve">Voir</a>
          <a href="${editHref}" aria-label="Modifier le releve">Edit</a>
          <button class="releve-delete-button" type="button" data-delete-releve="${escapeHtml(releve.id)}" aria-label="Supprimer le releve">Delete</button>
        </div>
      </div>
    `;
  }).join("");

  playerRelevesList.innerHTML = `
    <div class="releve-table" role="table" aria-label="Releves du joueur">
      <div class="releve-table-head" role="row">
        <span role="columnheader">Releve</span>
        <span role="columnheader">Date</span>
        <span role="columnheader">Grade / Boost</span>
        <span role="columnheader">Temps de jeu</span>
        <span role="columnheader">Type</span>
        <span role="columnheader">Actions</span>
      </div>
      ${rows}
    </div>
  `;
};

const params = new URLSearchParams(window.location.search);
const playerId = params.get("id");
let players = [];
let player = null;

const fillEditForm = (selectedPlayer) => {
  if (!editForm || !selectedPlayer) return;
  editForm.elements.name.value = selectedPlayer.name || "";
  editForm.elements.description.value = selectedPlayer.description || "";
  editForm.elements.beta.checked = Boolean(selectedPlayer.betaParticipant);
};

const renderPlayer = (selectedPlayer) => {
  if (!selectedPlayer) return;
  detailTitle.textContent = selectedPlayer.name;
  detailSubtitle.textContent = "Fiche detaillee du joueur selectionne depuis la liste.";
  detailInitial.textContent = getInitial(selectedPlayer.name);
  detailName.textContent = selectedPlayer.name;
  detailBeta.textContent = selectedPlayer.betaParticipant ? "Participe a la beta" : "Hors beta";
  detailBeta.classList.toggle("status-pill--active", Boolean(selectedPlayer.betaParticipant));
  detailDescription.textContent = selectedPlayer.description || "Aucune description pour le moment.";
  detailMessage.textContent = "Les releves enregistres pour ce joueur apparaissent dans l'historique plus bas.";
  document.title = `${selectedPlayer.name} - StatGM Design`;
};

const showMissingPlayerState = () => {
  detailTitle.textContent = "Joueur introuvable";
  detailSubtitle.textContent = "Impossible de retrouver ce joueur dans la sauvegarde locale.";
  detailInitial.textContent = "?";
  detailName.textContent = "Joueur introuvable";
  detailBeta.textContent = "Introuvable";
  detailDescription.textContent = "Aucune description disponible.";
  detailMessage.textContent = "Retourne a la liste des joueurs et selectionne une card existante.";
  if (editPanel) editPanel.hidden = true;
  if (relevesPanel) relevesPanel.hidden = true;
  if (evolutionPanel) evolutionPanel.hidden = true;
  if (betaEvolutionPanel) betaEvolutionPanel.hidden = true;
  if (playerTabs) playerTabs.hidden = true;
  if (addReleveLink) addReleveLink.hidden = true;
  document.title = "Joueur introuvable - StatGM Design";
};

if (editForm) {
  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!player) return;
    const data = new FormData(editForm);

    player = {
      ...player,
      name: String(data.get("name") || "").trim() || "Nouveau joueur",
      description: String(data.get("description") || "").trim(),
      betaParticipant: data.get("beta") === "on"
    };

    players = players.map((item) => String(item.id) === String(playerId) ? player : item);
    await writePlayers(players);
    renderPlayer(player);
    fillEditForm(player);
    renderPlayerBetaEvolution();
    syncBetaTab();

    if (editFeedback) {
      editFeedback.textContent = "Modifications enregistrees.";
    }
  });

  editForm.addEventListener("reset", () => {
    requestAnimationFrame(() => {
      fillEditForm(player);
      if (editFeedback) editFeedback.textContent = "";
    });
  });
}

if (deletePlayerButton) {
  deletePlayerButton.addEventListener("click", async () => {
    if (!player) return;
    const shouldDelete = confirm(`Supprimer ${player.name} ? Cette action est definitive.`);
    if (!shouldDelete) return;

    players = players.filter((item) => String(item.id) !== String(playerId));
    await writePlayers(players);
    window.location.href = "joueur.html";
  });
}

if (playerRelevesList) {
  playerRelevesList.addEventListener("click", async (event) => {
    if (!player) return;
    const deleteButton = event.target.closest("[data-delete-releve]");
    if (!deleteButton) return;

    const releveId = deleteButton.dataset.deleteReleve;
    const shouldDelete = confirm("Supprimer ce releve ? Cette action est definitive.");
    if (!shouldDelete) return;

    const releves = readReleves().filter((releve) => String(releve.id) !== String(releveId));
    await writeReleves(releves);
    renderPlayerReleves();
    renderPlayerEvolution();
    renderPlayerBetaEvolution();
  });
}

const initializePlayerDetailPage = async () => {
  await hydrateStorageCaches();
  players = readPlayers();
  player = players.find((item) => String(item.id) === String(playerId)) || null;

  if (!player) {
    showMissingPlayerState();
    return;
  }

  setupChartTooltips();
  renderPlayer(player);
  renderPlayerReleves();
  renderPlayerEvolution();
  renderPlayerBetaEvolution();
  setupPlayerTabs();
  syncBetaTab();
  fillEditForm(player);
  if (addReleveLink) addReleveLink.href = `joueur-releve.html?id=${encodeURIComponent(player.id)}`;
};

initializePlayerDetailPage();
