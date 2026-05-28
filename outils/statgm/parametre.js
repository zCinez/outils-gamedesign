const analysisGrid = document.querySelector("[data-analysis-grid]");
const analysisCount = document.querySelector("[data-analysis-count]");
const settingsTabs = Array.from(document.querySelectorAll("[data-settings-tab]"));
const projectionMinutesInput = document.querySelector("[data-projection-minutes]");
const projectionSaveButton = document.querySelector("[data-projection-save]");
const projectionResetButton = document.querySelector("[data-projection-reset]");
const referenceConfig = window.ReferenceConfig;

const relevesStorageKey = "statgm-releves";
const store = window.StatGMStore;
let activeSettingsTab = "all";
let relevesCache = [];

const analysisFieldMap = {
  minerals: { suffix: "Mineral", perHourField: "BlocksPerHour", yieldField: "YieldRate" },
  woods: { suffix: "Wood", perHourField: "LogsPerHour", yieldField: "YieldRate" },
  crops: { suffix: "Crop", perHourField: "ItemsPerHour", yieldField: "YieldRate" },
  mobs: { suffix: "Mob", perHourField: "MobsPerHour", yieldField: "YieldRate" }
};

const groupOrderMap = new Map(
  (referenceConfig?.groups || []).map((group, index) => [group.id, index])
);

const formatInteger = (value) => new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0
}).format(Number(value || 0));

const formatDecimal = (value, digits = 1) => new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: digits
}).format(Number(value || 0));

const toNumber = (value) => {
  const normalized = Number(String(value ?? "").replace("%", "").replace(",", "."));
  return Number.isFinite(normalized) ? normalized : 0;
};

const readReleves = () => {
  return Array.isArray(relevesCache) ? [...relevesCache] : [];
};

const hydrateStorageCaches = async () => {
  if (store?.ready) {
    await store.ready();
    relevesCache = store.getList(relevesStorageKey);
    return;
  }

  try {
    relevesCache = JSON.parse(localStorage.getItem(relevesStorageKey) || "[]");
  } catch {
    relevesCache = [];
  }
};

const getProjectionMinutes = () => {
  const settings = referenceConfig?.read?.() || {};
  const seconds = Number(settings?._meta?.betaProjectionMinFarmSeconds);
  if (!Number.isFinite(seconds) || seconds < 0) return 60;
  return Math.round(seconds / 60);
};

const syncProjectionMinutesInput = () => {
  if (!projectionMinutesInput) return;
  projectionMinutesInput.value = String(getProjectionMinutes());
};

const getAnalysisTone = (deltaPercent) => {
  const absoluteDelta = Math.abs(deltaPercent);
  if (absoluteDelta <= 20) {
    return { tone: "is-good", label: "Coherent" };
  }
  if (absoluteDelta <= 40) {
    return { tone: "is-medium", label: "A surveiller" };
  }
  return { tone: "is-bad", label: "A corriger" };
};

const getReliability = (samples, playerCount) => {
  if (samples >= 6 && playerCount >= 3) return { label: "Bonne", className: "status-pill--good" };
  if (samples >= 3 && playerCount >= 2) return { label: "Moyenne", className: "status-pill--warning" };
  return { label: "Faible", className: "status-pill--danger" };
};

const getSuggestedReference = (averagePerHour, currentReference, averageYieldRate) => {
  if (averagePerHour <= 0) return currentReference;
  if (averageYieldRate < 80 || averageYieldRate > 120) return Math.max(0, Math.round(averagePerHour));
  return currentReference;
};

const getSuggestionText = (entry, averageYieldRate, currentReference, suggestedReference) => {
  if (averageYieldRate < 80) {
    return `Rendement trop faible. Descends la reference de ${entry.label} vers ${formatInteger(suggestedReference)}/h ou buff la ressource en jeu.`;
  }
  if (averageYieldRate > 120) {
    return `Rendement trop haut. Monte la reference de ${entry.label} vers ${formatInteger(suggestedReference)}/h ou nerf la ressource en jeu.`;
  }
  return `Reference actuelle correcte autour de ${formatInteger(currentReference)}/h.`;
};

const collectEntryAnalysis = (group, entry, settings, releves) => {
  const fieldMap = analysisFieldMap[group.id];
  const prefix = `${entry.key}${fieldMap.suffix}`;
  const samples = releves.reduce((list, releve) => {
    const perHour = toNumber(releve[`${prefix}${fieldMap.perHourField}`]);
    const yieldRate = toNumber(releve[`${prefix}${fieldMap.yieldField}`]);
    if (perHour <= 0 && yieldRate <= 0) return list;

    list.push({
      id: String(releve.id || ""),
      playerId: String(releve.playerId || ""),
      perHour,
      yieldRate
    });
    return list;
  }, []);

  const currentReference = toNumber(settings[group.id][entry.key]);
  const averagePerHour = samples.length
    ? samples.reduce((sum, sample) => sum + sample.perHour, 0) / samples.length
    : 0;
  const averageYieldRate = samples.length
    ? samples.reduce((sum, sample) => sum + sample.yieldRate, 0) / samples.length
    : 0;
  const suggestedReference = getSuggestedReference(averagePerHour, currentReference, averageYieldRate);
  const playerCount = new Set(samples.map((sample) => sample.playerId).filter(Boolean)).size;
  const snapshotCount = new Set(samples.map((sample) => sample.id).filter(Boolean)).size;
  const reliability = getReliability(samples.length, playerCount);
  const deltaPercent = currentReference > 0
    ? ((suggestedReference - currentReference) / currentReference) * 100
    : 0;
  const status = samples.length ? getAnalysisTone(deltaPercent) : { tone: "is-medium", label: "A analyser" };

  return {
    groupId: group.id,
    groupTitle: group.title,
    groupOrder: groupOrderMap.get(group.id) ?? 0,
    key: entry.key,
    label: entry.label,
    entryOrder: group.entries.findIndex((item) => item.key === entry.key),
    samples: samples.length,
    currentReference,
    averagePerHour,
    averageYieldRate,
    suggestedReference,
    deltaPercent,
    playerCount,
    snapshotCount,
    reliability,
    tone: status.tone,
    statusLabel: status.label,
    suggestion: getSuggestionText(entry, averageYieldRate, currentReference, suggestedReference)
  };
};

const buildAnalysisEntries = (settings) => {
  const releves = readReleves();
  return referenceConfig.groups
    .flatMap((group) => group.entries.map((entry) => collectEntryAnalysis(group, entry, settings, releves)))
    .sort((left, right) => {
      return left.groupOrder - right.groupOrder
        || left.entryOrder - right.entryOrder;
    });
};

const renderAnalysis = () => {
  if (!analysisGrid || !referenceConfig) return;

  const settings = referenceConfig.read();
  const entries = buildAnalysisEntries(settings)
    .filter((entry) => activeSettingsTab === "all" ? true : entry.groupId === activeSettingsTab);

  if (analysisCount) {
    analysisCount.textContent = `${entries.length} ressource${entries.length > 1 ? "s" : ""}`;
  }

  if (!entries.length) {
    analysisGrid.innerHTML = '<p class="empty-state">Ajoute des releves avec des metriques calculees pour lancer l\'analyse automatique.</p>';
    return;
  }

  analysisGrid.innerHTML = `
    <div class="snapshot-table-wrap settings-analysis-table-wrap">
      <table class="settings-analysis-table">
        <thead>
          <tr>
            <th>Signal</th>
            <th>Nom</th>
            <th>Categorie</th>
            <th>Actuelle</th>
            <th>Suggestion</th>
            <th>Ecart %</th>
            <th>Echantillons</th>
            <th>Fiabilite</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map((entry) => `
            <tr class="settings-analysis-row ${entry.tone}">
              <td class="cell-signal settings-signal-cell">
                <span class="adjustment-badge ${entry.tone}" title="${entry.statusLabel}">${entry.tone === "is-good" ? "✓" : "!"}</span>
              </td>
              <td class="cell-name">${entry.label}</td>
              <td class="cell-category">${entry.groupTitle}</td>
              <td class="cell-current">${formatInteger(entry.currentReference)}</td>
              <td class="cell-suggestion">${formatInteger(entry.suggestedReference)}</td>
              <td class="cell-delta ${entry.tone}">${entry.samples ? `${entry.deltaPercent >= 0 ? "+" : ""}${formatDecimal(entry.deltaPercent)}%` : "-"}</td>
              <td class="cell-samples">${entry.samples}</td>
              <td class="cell-reliability"><span class="status-pill ${entry.reliability.className}">${entry.reliability.label}</span></td>
              <td class="cell-actions">
                <div class="settings-analysis-actions">
                  <button class="ghost-btn settings-table-btn" type="button" data-analysis-detail="${entry.groupId}.${entry.key}">Voir details</button>
                  <button class="ghost-btn settings-table-btn" type="button" data-analysis-choose="${entry.groupId}.${entry.key}">Choisir</button>
                  <button class="primary-btn settings-table-btn" type="button" data-analysis-apply="${entry.groupId}.${entry.key}">Appliquer</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
};

if (analysisGrid && referenceConfig) {
  (async () => {
    await hydrateStorageCaches();
    syncProjectionMinutesInput();
    renderAnalysis();
  })();

  settingsTabs.forEach((button) => {
    button.addEventListener("click", () => {
      activeSettingsTab = button.dataset.settingsTab || "all";
      settingsTabs.forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      renderAnalysis();
    });
  });

  analysisGrid.addEventListener("click", (event) => {
    const detailButton = event.target.closest("[data-analysis-detail]");
    if (detailButton) {
      const targetId = detailButton.getAttribute("data-analysis-detail");
      const settings = referenceConfig.read();
      const entry = buildAnalysisEntries(settings).find((item) => `${item.groupId}.${item.key}` === targetId);
      if (entry) {
        alert([
          `${entry.label} - ${entry.groupTitle}`,
          "",
          `Etat : ${entry.statusLabel}`,
          `Reference actuelle : ${formatInteger(entry.currentReference)}/h`,
          `Reference suggeree : ${formatInteger(entry.suggestedReference)}/h`,
          `Rendement moyen : ${entry.samples ? `${formatDecimal(entry.averageYieldRate)}%` : "Aucune donnee"}`,
          `Moyenne observee : ${entry.samples ? `${formatInteger(entry.averagePerHour)}/h` : "Aucune donnee"}`,
          "",
          entry.suggestion
        ].join("\n"));
      }
      return;
    }

    const applyButton = event.target.closest("[data-analysis-apply]");
    if (applyButton) {
      const targetId = applyButton.getAttribute("data-analysis-apply");
      const [groupId, key] = targetId.split(".");
      const settings = referenceConfig.read();
      const entry = buildAnalysisEntries(settings).find((item) => item.groupId === groupId && item.key === key);
      if (!entry) return;

      settings[groupId][key] = entry.suggestedReference;
      referenceConfig.write(settings);
      renderAnalysis();
      return;
    }

    const chooseButton = event.target.closest("[data-analysis-choose]");
    if (!chooseButton) return;

    const targetId = chooseButton.getAttribute("data-analysis-choose");
    const [groupId, key] = targetId.split(".");
    const settings = referenceConfig.read();
    const entry = buildAnalysisEntries(settings).find((item) => item.groupId === groupId && item.key === key);
    if (!entry) return;

    const suggestedValue = String(entry.suggestedReference || entry.currentReference || 0);
    const chosenValue = prompt(
      `Choisir une nouvelle reference pour ${entry.label} (${entry.groupTitle}).`,
      suggestedValue
    );
    if (chosenValue === null) return;

    const parsedValue = Number(String(chosenValue).replace(",", ".").trim());
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      alert("Entre une valeur numerique valide.");
      return;
    }

    settings[groupId][key] = Math.round(parsedValue);
    referenceConfig.write(settings);
    renderAnalysis();
  });

  projectionSaveButton?.addEventListener("click", () => {
    const parsedMinutes = Number(String(projectionMinutesInput?.value || "").replace(",", ".").trim());
    if (!Number.isFinite(parsedMinutes) || parsedMinutes < 0) {
      alert("Entre un nombre de minutes valide.");
      return;
    }

    const settings = referenceConfig.read();
    settings._meta = settings._meta || {};
    settings._meta.betaProjectionMinFarmSeconds = Math.round(parsedMinutes * 60);
    referenceConfig.write(settings);
    syncProjectionMinutesInput();
  });

  projectionResetButton?.addEventListener("click", () => {
    const settings = referenceConfig.read();
    settings._meta = settings._meta || {};
    settings._meta.betaProjectionMinFarmSeconds = 3600;
    referenceConfig.write(settings);
    syncProjectionMinutesInput();
  });
}
