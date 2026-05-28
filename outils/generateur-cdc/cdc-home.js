const HOME_THEME_STORAGE_KEY = "neodium-cdc-theme";
const HOME_PROJECTS_STORAGE_KEY = "neodium-cdc-projects";
const HOME_HISTORY_STORAGE_KEY = "neodium-cdc-project-history";
const HOME_ACTIVE_PROJECT_STORAGE_KEY = "neodium-cdc-active-project";
const HOME_GUI_PRESET_OVERRIDES_STORAGE_KEY = "neodium-gui-preset-overrides";
const HOME_GUI_PRESET_HIDDEN_STORAGE_KEY = "neodium-gui-preset-hidden";
const HOME_GUI_CUSTOM_PRESETS_STORAGE_KEY = "neodium-gui-custom-presets";
const HOME_GUI_PRESETS = Array.isArray(window.GUI_PRESETS_MANIFEST) ? window.GUI_PRESETS_MANIFEST : [];
const HOME_GUI_CUSTOM_PRESETS_FILE = Array.isArray(window.GUI_CUSTOM_PRESETS_FILE) ? window.GUI_CUSTOM_PRESETS_FILE : [];

function getHomeProjects() {
  try {
    const raw = localStorage.getItem(HOME_PROJECTS_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveHomeProjects(projects) {
  localStorage.setItem(HOME_PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

function getHomeHistory() {
  try {
    const raw = localStorage.getItem(HOME_HISTORY_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveHomeHistory(history) {
  localStorage.setItem(HOME_HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function getHomeGuiPresetOverrides() {
  try {
    const raw = localStorage.getItem(HOME_GUI_PRESET_OVERRIDES_STORAGE_KEY);
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveHomeGuiPresetOverrides(overrides) {
  localStorage.setItem(HOME_GUI_PRESET_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
}

function getHomeGuiPresetHiddenIds() {
  try {
    const raw = localStorage.getItem(HOME_GUI_PRESET_HIDDEN_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveHomeGuiPresetHiddenIds(hiddenIds) {
  localStorage.setItem(HOME_GUI_PRESET_HIDDEN_STORAGE_KEY, JSON.stringify(hiddenIds));
}

function getHomeCustomGuiPresets() {
  try {
    const raw = localStorage.getItem(HOME_GUI_CUSTOM_PRESETS_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function formatHomeTimestamp(value) {
  if (!value) return "Aucune activité";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Aucune activité";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHomeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function applyHomeTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = normalizedTheme;
  document.documentElement.style.colorScheme = normalizedTheme;
  window.syncGlobalThemeSwitch?.(normalizedTheme);
}

function initHomeTheme() {
  applyHomeTheme(localStorage.getItem(HOME_THEME_STORAGE_KEY) || "light");
}

function toggleHomeTheme() {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyHomeTheme(nextTheme);
  localStorage.setItem(HOME_THEME_STORAGE_KEY, nextTheme);
}

function updateHomeTopTabs() {
  const projectTab = document.getElementById("homeTopTabProject");
  const editorTab = document.getElementById("homeTopTabEditor");
  const activeProjectId = localStorage.getItem(HOME_ACTIVE_PROJECT_STORAGE_KEY) || "";

  if (projectTab) {
    projectTab.href = "./projects.html";
    projectTab.classList.remove("is-disabled");
  }

  if (editorTab) {
    editorTab.href = activeProjectId
      ? `./cdc-generator.html?projectId=${encodeURIComponent(activeProjectId)}`
      : "./cdc-generator.html";
    editorTab.classList.toggle("is-disabled", !activeProjectId);
  }
}

function getProjectCdcCount(projectId) {
  return getHomeHistory().filter(entry => entry.projectId === projectId).length;
}

function getProjectLastUpdate(projectId) {
  const entries = getHomeHistory()
    .filter(entry => entry.projectId === projectId)
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  return entries[0]?.updatedAt || entries[0]?.createdAt || "";
}

function openWorkspaceProject(projectId) {
  localStorage.setItem(HOME_ACTIVE_PROJECT_STORAGE_KEY, projectId);
  updateHomeTopTabs();
  window.navigateToPage?.(`./cdc-library.html?projectId=${encodeURIComponent(projectId)}`)
    || (window.location.href = `./cdc-library.html?projectId=${encodeURIComponent(projectId)}`);
}

function renameWorkspaceProject(projectId) {
  const projects = getHomeProjects();
  const projectIndex = projects.findIndex(project => project.id === projectId);
  if (projectIndex === -1) {
    alert("Projet introuvable.");
    return;
  }

  const currentProject = projects[projectIndex];
  const nextName = window.prompt("Nouveau nom du projet :", currentProject.name || "")?.trim() || "";
  if (!nextName || nextName === currentProject.name) {
    return;
  }

  const now = new Date().toISOString();
  const nextProjects = [...projects];
  nextProjects[projectIndex] = {
    ...currentProject,
    name: nextName,
    updatedAt: now
  };
  saveHomeProjects(nextProjects);

  const nextHistory = getHomeHistory().map(entry => entry.projectId === projectId
    ? { ...entry, projectLabel: nextName }
    : entry);
  saveHomeHistory(nextHistory);

  void window.syncCdcProjectsDirectoryFromStorage?.();
  renderHomeProjects();
}

function deleteWorkspaceProject(projectId) {
  const projects = getHomeProjects();
  const project = projects.find(entry => entry.id === projectId);
  if (!project) {
    alert("Projet introuvable.");
    return;
  }

  if (!window.confirm(`Supprimer le projet "${project.name}" et ses CDC liés ?`)) {
    return;
  }

  const nextProjects = projects.filter(entry => entry.id !== projectId);
  saveHomeProjects(nextProjects);

  const nextHistory = getHomeHistory().filter(entry => entry.projectId !== projectId);
  saveHomeHistory(nextHistory);

  if (localStorage.getItem(HOME_ACTIVE_PROJECT_STORAGE_KEY) === projectId) {
    localStorage.removeItem(HOME_ACTIVE_PROJECT_STORAGE_KEY);
  }

  void window.syncCdcProjectsDirectoryFromStorage?.();
  updateHomeTopTabs();
  renderHomeProjects();
}

function createWorkspaceProject() {
  const input = document.getElementById("newProjectName");
  const name = input?.value.trim() || "";
  if (!name) {
    alert("Renseigne d'abord un nom de projet.");
    input?.focus();
    return;
  }

  const now = new Date().toISOString();
  const project = {
    id: `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    createdAt: now,
    updatedAt: now
  };

  const projects = getHomeProjects();
  saveHomeProjects([project, ...projects]);
  localStorage.setItem(HOME_ACTIVE_PROJECT_STORAGE_KEY, project.id);
  void window.syncCdcProjectsDirectoryFromStorage?.();
  updateHomeTopTabs();
  window.navigateToPage?.(`./cdc-library.html?projectId=${encodeURIComponent(project.id)}`)
    || (window.location.href = `./cdc-library.html?projectId=${encodeURIComponent(project.id)}`);
}

function getFilteredHomeProjects() {
  const search = document.getElementById("homeProjectSearch")?.value.trim().toLowerCase() || "";
  return getHomeProjects()
    .filter(project => !search || String(project.name || "").toLowerCase().includes(search))
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
}

function slugifyHomeGuiPresetName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "gui-preset";
}

function getHomeGuiPresetId(preset, index) {
  return preset?.id || `gui-preset-${slugifyHomeGuiPresetName(preset?.name || `preset-${index + 1}`)}-${index}`;
}

function getGuiPresetRows() {
  const overrides = getHomeGuiPresetOverrides();
  const hiddenIds = new Set(getHomeGuiPresetHiddenIds());
  const mergedPresets = new Map();

  HOME_GUI_PRESETS.forEach((preset, index) => {
    const id = getHomeGuiPresetId(preset, index);
    mergedPresets.set(id, { ...preset, id });
  });

  HOME_GUI_CUSTOM_PRESETS_FILE.forEach((preset, index) => {
    const id = getHomeGuiPresetId(preset, index);
    mergedPresets.set(id, { ...preset, id });
  });

  getHomeCustomGuiPresets().forEach((preset, index) => {
    const id = getHomeGuiPresetId(preset, index);
    mergedPresets.set(id, { ...preset, id });
  });

  return [...mergedPresets.values()].map((preset, index) => {
    const id = getHomeGuiPresetId(preset, index);
    if (hiddenIds.has(id)) {
      return null;
    }

    const override = overrides[id] || {};
    const taille = String(preset?.fields?.guiTaille || preset?.fields?.guiTailleAutre || "Non définie");
    const itemsCount = Array.isArray(preset?.dynamic?.guiTemplateItems) ? preset.dynamic.guiTemplateItems.length : 0;

    return {
      id,
      name: String(override.name || preset?.name || `Preset ${index + 1}`),
      taille,
      itemsCount
    };
  }).filter(Boolean);
}

function getFilteredHomeGuiPresets() {
  const search = document.getElementById("homeGuiPresetSearch")?.value.trim().toLowerCase() || "";
  const sort = document.getElementById("homeGuiPresetSort")?.value || "name";

  const rows = getGuiPresetRows()
    .filter(preset => !search || preset.name.toLowerCase().includes(search) || preset.taille.toLowerCase().includes(search));

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

function renderHomeProjects() {
  const list = document.getElementById("homeProjectsList");
  const count = document.getElementById("homeProjectsCount");
  if (!list) return;

  const projects = getFilteredHomeProjects();
  if (count) {
    count.textContent = String(projects.length);
  }

  if (projects.length === 0) {
    list.innerHTML = `<div class="library-empty">Aucun projet pour le moment.</div>`;
    return;
  }

  list.innerHTML = projects.map(project => `
    <div class="library-item home-project-card" onclick="openWorkspaceProject('${project.id}')">
      <div class="library-item-top">
        <div>
          <p class="library-item-title">${escapeHomeHtml(project.name)}</p>
          <div class="library-item-date">Dernière activité : ${escapeHomeHtml(formatHomeTimestamp(getProjectLastUpdate(project.id) || project.updatedAt || project.createdAt))}</div>
        </div>
        <span class="project-history-template">${getProjectCdcCount(project.id)} CDC</span>
      </div>
      <div class="home-project-actions">
        <button type="button" class="project-history-open" onclick="event.stopPropagation(); openWorkspaceProject('${project.id}')">Ouvrir</button>
        <button type="button" class="project-history-edit" onclick="event.stopPropagation(); renameWorkspaceProject('${project.id}')">Renommer</button>
        <button type="button" class="project-history-delete" onclick="event.stopPropagation(); deleteWorkspaceProject('${project.id}')">Supprimer</button>
      </div>
    </div>
  `).join("");
}

function renderHomeGuiPresets() {
  const list = document.getElementById("homeGuiPresetsList");
  const count = document.getElementById("homeGuiPresetsCount");
  if (!list) return;

  const presets = getFilteredHomeGuiPresets();
  if (count) {
    count.textContent = String(presets.length);
  }

  if (presets.length === 0) {
    list.innerHTML = `<div class="library-empty">Aucun preset GUI ne correspond à la recherche actuelle.</div>`;
    return;
  }

  list.innerHTML = presets.map(preset => `
    <div class="library-item home-project-card">
      <div class="library-item-top">
        <div>
          <p class="library-item-title">${escapeHomeHtml(preset.name)}</p>
          <div class="library-item-date">Taille : ${escapeHomeHtml(preset.taille)}</div>
        </div>
        <span class="project-history-template">${preset.itemsCount} item${preset.itemsCount > 1 ? "s" : ""}</span>
      </div>
      <div class="home-project-actions">
        <button type="button" class="project-history-edit" onclick="renameGuiPreset('${preset.id}')">Renommer</button>
        <button type="button" class="project-history-delete" onclick="deleteGuiPreset('${preset.id}')">Supprimer</button>
      </div>
    </div>
  `).join("");
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

  const overrides = getHomeGuiPresetOverrides();
  overrides[presetId] = {
    ...(overrides[presetId] || {}),
    name: nextName
  };
  saveHomeGuiPresetOverrides(overrides);
  renderHomeGuiPresets();
}

function deleteGuiPreset(presetId) {
  const preset = getGuiPresetRows().find(entry => entry.id === presetId);
  if (!preset) {
    alert("Preset introuvable.");
    return;
  }

  if (!window.confirm(`Supprimer le preset "${preset.name}" de la bibliothèque ?`)) {
    return;
  }

  const hiddenIds = new Set(getHomeGuiPresetHiddenIds());
  hiddenIds.add(presetId);
  saveHomeGuiPresetHiddenIds([...hiddenIds]);
  renderHomeGuiPresets();
}

function initHomeEvents() {
  const newProjectInput = document.getElementById("newProjectName");
  if (newProjectInput) {
    newProjectInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        createWorkspaceProject();
      }
    });
  }
}

initHomeTheme();
updateHomeTopTabs();
renderHomeProjects();
renderHomeGuiPresets();
initHomeEvents();

void window.hydrateCdcProjectsFromFiles?.().then(result => {
  if (result?.ok && result.hydrated) {
    updateHomeTopTabs();
    renderHomeProjects();
  }
});
