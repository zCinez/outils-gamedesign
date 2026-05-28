function getSettingsTemplatePageTemplate() {
  const templateId = new URL(window.location.href).searchParams.get("template") || "";

  if (typeof window.getSettingsTemplateById === "function") {
    return window.getSettingsTemplateById(templateId);
  }

  const catalog = Array.isArray(window.SETTINGS_TEMPLATE_CATALOG) ? window.SETTINGS_TEMPLATE_CATALOG : [];
  return catalog.find(template => template.id === templateId) || catalog[0] || null;
}

function applySettingsTemplateHeader(template) {
  if (!template) return;

  const displayLabel = String(template.label || "").trim() || template.defaultLabel || "Template";
  const sidebarName = document.getElementById("settingsTemplatePageName");
  const mark = document.querySelector(".settings-panel-mark");

  document.title = `Neodium - ${displayLabel}`;

  if (sidebarName) {
    sidebarName.textContent = displayLabel;
  }

  if (mark) {
    mark.textContent = displayLabel.slice(0, 2).toUpperCase();
  }
}

function bindSettingsTemplateRename(template) {
  const renameTrigger = document.querySelector("[data-template-rename-trigger]");
  if (!renameTrigger || !template) return;

  renameTrigger.addEventListener("click", () => {
    if (typeof window.updateSettingsTemplateLabel !== "function") return;

    const currentLabel = String(template.label || "").trim() || template.defaultLabel || "Template";
    const nextLabel = window.prompt("Nouveau nom du template :", currentLabel);

    if (nextLabel === null) return;

    window.updateSettingsTemplateLabel(template.id, nextLabel);
    renderSettingsTemplatePage();
  });
}

function syncSettingsTemplateMetadata(template) {
  const versionInput = document.getElementById("settingsTemplateVersionInput");
  const statusSelect = document.getElementById("settingsTemplateStatusSelect");

  if (versionInput) {
    versionInput.value = template.version;
  }

  if (statusSelect) {
    statusSelect.value = template.status;
  }
}

function bindSettingsTemplateMetadataControls(template) {
  const versionInput = document.getElementById("settingsTemplateVersionInput");
  const statusSelect = document.getElementById("settingsTemplateStatusSelect");

  if (versionInput) {
    const commitVersion = () => {
      if (typeof window.updateSettingsTemplateMetadata !== "function") return;

      const nextVersion = String(versionInput.value || "").trim();
      if (!nextVersion || nextVersion === template.version) {
        versionInput.value = template.version;
        return;
      }

      window.updateSettingsTemplateMetadata(template.id, { version: nextVersion });
      renderSettingsTemplatePage();
    };

    versionInput.onblur = commitVersion;
    versionInput.onkeydown = event => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitVersion();
      }

      if (event.key === "Escape") {
        versionInput.value = template.version;
        versionInput.blur();
      }
    };
  }

  if (statusSelect) {
    statusSelect.onchange = () => {
      const nextStatus = statusSelect.value || "active";
      if (nextStatus === template.status || typeof window.updateSettingsTemplateMetadata !== "function") return;

      window.updateSettingsTemplateMetadata(template.id, { status: nextStatus });
      renderSettingsTemplatePage();
    };
  }
}

function renderSettingsTemplatePage() {
  const template = getSettingsTemplatePageTemplate();
  if (!template) return;

  const detailBuilder = typeof window.buildSettingsTemplateDetail === "function"
    ? window.buildSettingsTemplateDetail
    : (() => "<div class=\"settings-template-detail-surface\"><p class=\"muted\">Aucune architecture disponible.</p></div>");

  const sectionsCount = template.sections.length;
  const blocksCount = template.sections.reduce((total, section) => total + section.items.length, 0);

  const description = document.getElementById("settingsTemplatePageDescription");
  const formId = document.getElementById("settingsTemplatePageFormId");
  const sections = document.getElementById("settingsTemplatePageSections");
  const blocks = document.getElementById("settingsTemplatePageBlocks");
  const architecture = document.getElementById("settingsTemplateArchitecture");

  if (description) description.textContent = template.description;
  if (formId) formId.textContent = template.formId;
  if (sections) sections.textContent = String(sectionsCount);
  if (blocks) blocks.textContent = String(blocksCount);
  if (architecture) architecture.innerHTML = detailBuilder(template);

  applySettingsTemplateHeader(template);
  syncSettingsTemplateMetadata(template);
  bindSettingsTemplateMetadataControls(template);
  bindSettingsTemplateRename(template);
}

document.addEventListener("DOMContentLoaded", renderSettingsTemplatePage);
