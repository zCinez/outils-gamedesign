const PRESETS_THEME_STORAGE_KEY = "neodium-cdc-theme";
const PRESETS_PROJECTS_STORAGE_KEY = "neodium-cdc-projects";
const PRESETS_ACTIVE_PROJECT_STORAGE_KEY = "neodium-cdc-active-project";
const REQUESTED_GUI_PRESET_SESSION_KEY = "neodium-cdc-requested-gui-preset";
const REQUESTED_ITEM_CUSTOM_PRESET_SESSION_KEY = "neodium-cdc-requested-item-custom-preset";

const GUI_PRESET_OVERRIDES_STORAGE_KEY = "neodium-gui-preset-overrides";
const GUI_PRESET_HIDDEN_STORAGE_KEY = "neodium-gui-preset-hidden";
const GUI_CUSTOM_PRESETS_STORAGE_KEY = "neodium-gui-custom-presets";
const GUI_PRESETS_MANIFEST_ROWS = Array.isArray(window.GUI_PRESETS_MANIFEST) ? window.GUI_PRESETS_MANIFEST : [];
const GUI_CUSTOM_PRESETS_FILE_ROWS = Array.isArray(window.GUI_CUSTOM_PRESETS_FILE) ? window.GUI_CUSTOM_PRESETS_FILE : [];

const ITEM_CUSTOM_PRESET_OVERRIDES_STORAGE_KEY = "neodium-item-custom-preset-overrides";
const ITEM_CUSTOM_PRESET_HIDDEN_STORAGE_KEY = "neodium-item-custom-preset-hidden";
const ITEM_CUSTOM_PRESETS_STORAGE_KEY = "neodium-item-custom-presets";
const ITEM_CUSTOM_PRESETS_MANIFEST_ROWS = Array.isArray(window.ITEM_CUSTOM_PRESETS_MANIFEST) ? window.ITEM_CUSTOM_PRESETS_MANIFEST : [];
const ITEM_CUSTOM_CUSTOM_PRESETS_FILE_ROWS = Array.isArray(window.ITEM_CUSTOM_CUSTOM_PRESETS_FILE) ? window.ITEM_CUSTOM_CUSTOM_PRESETS_FILE : [];

function applyPresetsTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = normalizedTheme;
  document.documentElement.style.colorScheme = normalizedTheme;
  window.syncGlobalThemeSwitch?.(normalizedTheme);
}

function initPresetsTheme() {
  applyPresetsTheme(localStorage.getItem(PRESETS_THEME_STORAGE_KEY) || "light");
}

function escapePresetsHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugifyPresetName(value, fallback = "preset") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;
}

function getStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = JSON.parse(raw ?? "");

    if (Array.isArray(fallback)) {
      return Array.isArray(parsed) ? parsed : fallback;
    }

    if (fallback && typeof fallback === "object") {
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
    }

    return parsed ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function getStoredWorkspaceProjects() {
  return getStoredJson(PRESETS_PROJECTS_STORAGE_KEY, []);
}

function getActiveWorkspaceProjectId() {
  return localStorage.getItem(PRESETS_ACTIVE_PROJECT_STORAGE_KEY) || "";
}

function getActiveWorkspaceProject() {
  const activeProjectId = getActiveWorkspaceProjectId();
  return getStoredWorkspaceProjects().find(project => project.id === activeProjectId) || null;
}

function updatePresetsTopTabs() {
  const projectTab = document.getElementById("guiPresetsTopTabProject");
  const editorTab = document.getElementById("guiPresetsTopTabEditor");
  const activeProjectId = getActiveWorkspaceProjectId();

  if (projectTab) {
    projectTab.href = "./projects.html";
    projectTab.classList.remove("is-disabled");
  }

  if (editorTab) {
    editorTab.href = activeProjectId
      ? `./cdc-generator.html?projectId=${encodeURIComponent(activeProjectId)}`
      : "./cdc-generator.html";
    editorTab.classList.remove("is-disabled");
  }
}

function updatePresetsProjectSummary() {
  const status = document.getElementById("guiPresetsActiveProjectStatus");
  const hint = document.getElementById("guiPresetsProjectHint");
  const activeProject = getActiveWorkspaceProject();

  if (status) {
    status.textContent = activeProject?.name || "Aucun projet actif";
  }

  if (hint) {
    hint.textContent = activeProject
      ? "Les presets s'ouvriront directement dans ce projet."
      : "Les presets s'ouvriront dans un brouillon si aucun projet n'est selectionne.";
  }
}

function getStoredGuiPresetOverrides() {
  return getStoredJson(GUI_PRESET_OVERRIDES_STORAGE_KEY, {});
}

function saveStoredGuiPresetOverrides(overrides) {
  localStorage.setItem(GUI_PRESET_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
}

function getStoredGuiPresetHiddenIds() {
  return getStoredJson(GUI_PRESET_HIDDEN_STORAGE_KEY, []);
}

function saveStoredGuiPresetHiddenIds(hiddenIds) {
  localStorage.setItem(GUI_PRESET_HIDDEN_STORAGE_KEY, JSON.stringify(hiddenIds));
}

function getStoredCustomGuiPresets() {
  return getStoredJson(GUI_CUSTOM_PRESETS_STORAGE_KEY, []);
}

function getGuiPresetStorageId(preset, index) {
  return preset?.id || `gui-preset-${slugifyPresetName(preset?.name || `preset-${index + 1}`)}`;
}

function getGuiPresetRows() {
  const overrides = getStoredGuiPresetOverrides();
  const hiddenIds = new Set(getStoredGuiPresetHiddenIds());
  const mergedPresets = new Map();

  GUI_PRESETS_MANIFEST_ROWS.forEach((preset, index) => {
    const id = getGuiPresetStorageId(preset, index);
    mergedPresets.set(id, { ...preset, id });
  });

  GUI_CUSTOM_PRESETS_FILE_ROWS.forEach((preset, index) => {
    const id = getGuiPresetStorageId(preset, index);
    mergedPresets.set(id, { ...preset, id });
  });

  getStoredCustomGuiPresets().forEach((preset, index) => {
    const id = getGuiPresetStorageId(preset, index);
    mergedPresets.set(id, { ...preset, id });
  });

  return [...mergedPresets.values()].map((preset, index) => {
    const id = getGuiPresetStorageId(preset, index);
    if (hiddenIds.has(id)) {
      return null;
    }

    const override = overrides[id] || {};
    const taille = String(preset?.fields?.guiTaille || preset?.fields?.guiTailleAutre || "Non definie");
    const itemsCount = Array.isArray(preset?.dynamic?.guiTemplateItems) ? preset.dynamic.guiTemplateItems.length : 0;

    return {
      id,
      name: String(override.name || preset?.name || `Preset ${index + 1}`),
      taille,
      itemsCount
    };
  }).filter(Boolean);
}

function getFilteredGuiPresetRows() {
  const search = document.getElementById("guiPresetSearch")?.value.trim().toLowerCase() || "";
  const sort = document.getElementById("guiPresetSort")?.value || "name";

  const rows = getGuiPresetRows()
    .filter(preset =>
      !search
      || preset.name.toLowerCase().includes(search)
      || preset.taille.toLowerCase().includes(search)
      || String(preset.itemsCount).includes(search)
    );

  rows.sort((a, b) => {
    if (sort === "size") {
      return a.taille.localeCompare(b.taille, "fr");
    }

    if (sort === "items") {
      return b.itemsCount - a.itemsCount || a.name.localeCompare(b.name, "fr");
    }

    return a.name.localeCompare(b.name, "fr");
  });

  return rows;
}

function openGuiPresetInEditor(presetId) {
  const preset = getGuiPresetRows().find(entry => entry.id === presetId);
  if (!preset) {
    alert("Preset introuvable.");
    return;
  }

  try {
    window.sessionStorage.setItem(REQUESTED_GUI_PRESET_SESSION_KEY, presetId);
  } catch (error) {
    alert("Impossible de preparer l'ouverture du preset.");
    return;
  }

  const activeProjectId = getActiveWorkspaceProjectId();
  const targetUrl = activeProjectId
    ? `./cdc-generator.html?projectId=${encodeURIComponent(activeProjectId)}`
    : "./cdc-generator.html";

  window.navigateToPage?.(targetUrl) || (window.location.href = targetUrl);
}

function renameGuiPreset(presetId) {
  const preset = getGuiPresetRows().find(entry => entry.id === presetId);
  if (!preset) {
    alert("Preset introuvable.");
    return;
  }

  const nextName = window.prompt("Nouveau nom du preset :", preset.name || "")?.trim() || "";
  if (!nextName || nextName === preset.name) {
    return;
  }

  const overrides = getStoredGuiPresetOverrides();
  overrides[presetId] = {
    ...(overrides[presetId] || {}),
    name: nextName
  };
  saveStoredGuiPresetOverrides(overrides);
  renderGuiPresetsLibrary();
}

function deleteGuiPreset(presetId) {
  const preset = getGuiPresetRows().find(entry => entry.id === presetId);
  if (!preset) {
    alert("Preset introuvable.");
    return;
  }

  if (!window.confirm(`Supprimer le preset "${preset.name}" de la bibliotheque ?`)) {
    return;
  }

  const hiddenIds = new Set(getStoredGuiPresetHiddenIds());
  hiddenIds.add(presetId);
  saveStoredGuiPresetHiddenIds([...hiddenIds]);
  renderGuiPresetsLibrary();
}

function renderGuiPresetsLibrary() {
  const list = document.getElementById("guiPresetsList");
  const count = document.getElementById("guiPresetsCount");
  if (!list) return;

  const presets = getFilteredGuiPresetRows();
  if (count) {
    count.textContent = String(presets.length);
  }

  if (presets.length === 0) {
    list.innerHTML = `<div class="library-empty">Aucun preset GUI ne correspond a la recherche actuelle.</div>`;
    return;
  }

  list.innerHTML = presets.map(preset => `
    <div class="library-item home-project-card" onclick="openGuiPresetInEditor('${preset.id}')">
      <div class="library-item-top">
        <div>
          <p class="library-item-title">${escapePresetsHtml(preset.name)}</p>
          <div class="library-item-date">Taille : ${escapePresetsHtml(preset.taille)}</div>
        </div>
        <span class="project-history-template">${preset.itemsCount} item${preset.itemsCount > 1 ? "s" : ""}</span>
      </div>
      <div class="home-project-actions">
        <button type="button" class="project-history-open" onclick="event.stopPropagation(); openGuiPresetInEditor('${preset.id}')">Ouvrir</button>
        <button type="button" class="project-history-edit" onclick="event.stopPropagation(); renameGuiPreset('${preset.id}')">Renommer</button>
        <button type="button" class="project-history-delete" onclick="event.stopPropagation(); deleteGuiPreset('${preset.id}')">Supprimer</button>
      </div>
    </div>
  `).join("");
}

function getStoredItemCustomPresetOverrides() {
  return getStoredJson(ITEM_CUSTOM_PRESET_OVERRIDES_STORAGE_KEY, {});
}

function saveStoredItemCustomPresetOverrides(overrides) {
  localStorage.setItem(ITEM_CUSTOM_PRESET_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
}

function getStoredItemCustomPresetHiddenIds() {
  return getStoredJson(ITEM_CUSTOM_PRESET_HIDDEN_STORAGE_KEY, []);
}

function saveStoredItemCustomPresetHiddenIds(hiddenIds) {
  localStorage.setItem(ITEM_CUSTOM_PRESET_HIDDEN_STORAGE_KEY, JSON.stringify(hiddenIds));
}

function getStoredItemCustomPresets() {
  return getStoredJson(ITEM_CUSTOM_PRESETS_STORAGE_KEY, []);
}

function getItemCustomPresetStorageId(preset, index) {
  return preset?.id || `item-custom-preset-${slugifyPresetName(preset?.name || `preset-${index + 1}`)}`;
}

function buildItemCustomTypeSummary(fields) {
  const types = [
    fields?.typeArme ? "Arme" : "",
    fields?.typeOutil ? "Outil" : "",
    fields?.typeObjet ? "Objet" : "",
    fields?.typeConsommable ? "Consommable" : "",
    fields?.typeCle ? "Cle" : "",
    fields?.typeArmure ? "Armure" : "",
    fields?.typeAutre ? (String(fields?.selectTypeAutre || "").trim() || "Autre") : ""
  ].filter(Boolean);

  return types.length ? types.join(", ") : "Type non defini";
}

function getItemCustomPresetRows() {
  const overrides = getStoredItemCustomPresetOverrides();
  const hiddenIds = new Set(getStoredItemCustomPresetHiddenIds());
  const mergedPresets = new Map();

  ITEM_CUSTOM_PRESETS_MANIFEST_ROWS.forEach((preset, index) => {
    const id = getItemCustomPresetStorageId(preset, index);
    mergedPresets.set(id, { ...preset, id });
  });

  ITEM_CUSTOM_CUSTOM_PRESETS_FILE_ROWS.forEach((preset, index) => {
    const id = getItemCustomPresetStorageId(preset, index);
    mergedPresets.set(id, { ...preset, id });
  });

  getStoredItemCustomPresets().forEach((preset, index) => {
    const id = getItemCustomPresetStorageId(preset, index);
    mergedPresets.set(id, { ...preset, id });
  });

  return [...mergedPresets.values()].map((preset, index) => {
    const id = getItemCustomPresetStorageId(preset, index);
    if (hiddenIds.has(id)) {
      return null;
    }

    const override = overrides[id] || {};
    const itemMc = String(preset?.fields?.itemMc || "Non defini");
    const typeSummary = buildItemCustomTypeSummary(preset?.fields || {});
    const ingredientsCount = Array.isArray(preset?.dynamic?.itemCustomCraftIngredients)
      ? preset.dynamic.itemCustomCraftIngredients.length
      : 0;

    return {
      id,
      name: String(override.name || preset?.name || `Preset ${index + 1}`),
      itemMc,
      typeSummary,
      ingredientsCount
    };
  }).filter(Boolean);
}

function getFilteredItemCustomPresetRows() {
  const search = document.getElementById("itemCustomPresetSearch")?.value.trim().toLowerCase() || "";
  const sort = document.getElementById("itemCustomPresetSort")?.value || "name";

  const rows = getItemCustomPresetRows()
    .filter(preset =>
      !search
      || preset.name.toLowerCase().includes(search)
      || preset.itemMc.toLowerCase().includes(search)
      || preset.typeSummary.toLowerCase().includes(search)
    );

  rows.sort((a, b) => {
    if (sort === "item") {
      return a.itemMc.localeCompare(b.itemMc, "fr") || a.name.localeCompare(b.name, "fr");
    }

    if (sort === "type") {
      return a.typeSummary.localeCompare(b.typeSummary, "fr") || a.name.localeCompare(b.name, "fr");
    }

    return a.name.localeCompare(b.name, "fr");
  });

  return rows;
}

function openItemCustomPresetInEditor(presetId) {
  const preset = getItemCustomPresetRows().find(entry => entry.id === presetId);
  if (!preset) {
    alert("Preset introuvable.");
    return;
  }

  try {
    window.sessionStorage.setItem(REQUESTED_ITEM_CUSTOM_PRESET_SESSION_KEY, presetId);
  } catch (error) {
    alert("Impossible de preparer l'ouverture du preset.");
    return;
  }

  const activeProjectId = getActiveWorkspaceProjectId();
  const targetUrl = activeProjectId
    ? `./cdc-generator.html?projectId=${encodeURIComponent(activeProjectId)}`
    : "./cdc-generator.html";

  window.navigateToPage?.(targetUrl) || (window.location.href = targetUrl);
}

function renameItemCustomPreset(presetId) {
  const preset = getItemCustomPresetRows().find(entry => entry.id === presetId);
  if (!preset) {
    alert("Preset introuvable.");
    return;
  }

  const nextName = window.prompt("Nouveau nom du preset :", preset.name || "")?.trim() || "";
  if (!nextName || nextName === preset.name) {
    return;
  }

  const overrides = getStoredItemCustomPresetOverrides();
  overrides[presetId] = {
    ...(overrides[presetId] || {}),
    name: nextName
  };
  saveStoredItemCustomPresetOverrides(overrides);
  renderItemCustomPresetsLibrary();
}

function deleteItemCustomPreset(presetId) {
  const preset = getItemCustomPresetRows().find(entry => entry.id === presetId);
  if (!preset) {
    alert("Preset introuvable.");
    return;
  }

  if (!window.confirm(`Supprimer le preset "${preset.name}" de la bibliotheque ?`)) {
    return;
  }

  const hiddenIds = new Set(getStoredItemCustomPresetHiddenIds());
  hiddenIds.add(presetId);
  saveStoredItemCustomPresetHiddenIds([...hiddenIds]);
  renderItemCustomPresetsLibrary();
}

function renderItemCustomPresetsLibrary() {
  const list = document.getElementById("itemCustomPresetsList");
  const count = document.getElementById("itemCustomPresetsCount");
  if (!list) return;

  const presets = getFilteredItemCustomPresetRows();
  if (count) {
    count.textContent = String(presets.length);
  }

  if (presets.length === 0) {
    list.innerHTML = `<div class="library-empty">Aucun preset Item Custom ne correspond a la recherche actuelle.</div>`;
    return;
  }

  list.innerHTML = presets.map(preset => `
    <div class="library-item home-project-card" onclick="openItemCustomPresetInEditor('${preset.id}')">
      <div class="library-item-top">
        <div>
          <p class="library-item-title">${escapePresetsHtml(preset.name)}</p>
          <div class="library-item-date">Item Minecraft : ${escapePresetsHtml(preset.itemMc)}</div>
          <div class="library-item-date">Type : ${escapePresetsHtml(preset.typeSummary)}</div>
        </div>
        <span class="project-history-template">${preset.ingredientsCount > 0 ? `${preset.ingredientsCount} ingredient${preset.ingredientsCount > 1 ? "s" : ""}` : "Sans craft"}</span>
      </div>
      <div class="home-project-actions">
        <button type="button" class="project-history-open" onclick="event.stopPropagation(); openItemCustomPresetInEditor('${preset.id}')">Ouvrir</button>
        <button type="button" class="project-history-edit" onclick="event.stopPropagation(); renameItemCustomPreset('${preset.id}')">Renommer</button>
        <button type="button" class="project-history-delete" onclick="event.stopPropagation(); deleteItemCustomPreset('${preset.id}')">Supprimer</button>
      </div>
    </div>
  `).join("");
}

initPresetsTheme();
updatePresetsTopTabs();
updatePresetsProjectSummary();
renderGuiPresetsLibrary();
renderItemCustomPresetsLibrary();

void window.hydrateCdcProjectsFromFiles?.().then(result => {
  if (result?.ok && result.hydrated) {
    updatePresetsTopTabs();
    updatePresetsProjectSummary();
    renderGuiPresetsLibrary();
    renderItemCustomPresetsLibrary();
  }
});
