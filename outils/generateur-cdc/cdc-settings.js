const SETTINGS_THEME_STORAGE_KEY = "neodium-cdc-theme";
const SETTINGS_ACTIVE_PROJECT_STORAGE_KEY = "neodium-cdc-active-project";
const SETTINGS_TEMPLATE_LABEL_OVERRIDES_STORAGE_KEY = "neodium-template-label-overrides";
const SETTINGS_TEMPLATE_META_STORAGE_KEY = "neodium-template-meta-overrides";
const SETTINGS_SECTIONS = ["gui", "template"];
const SETTINGS_TEMPLATE_STATUS_LABELS = Object.freeze({
  active: "Actif",
  inactive: "Non actif",
  archived: "Archive"
});
const SETTINGS_TEMPLATE_CATALOG = [
  {
    id: "commande",
    label: "Commande",
    formId: "commandeForm",
    description: "Template pour documenter une commande, ses règles d'utilisation et les interfaces qu'elle déclenche.",
    sections: [
      {
        title: "Bloc de base",
        mode: "Fondation",
        description: "Les champs principaux visibles dès l'ouverture du template.",
        items: [
          "Nom de la commande",
          "Commande principale",
          "Alias",
          "Permission",
          "Description",
          "Type de commande",
          "Arguments"
        ]
      },
      {
        title: "Conditions d'utilisation",
        mode: "Statique",
        description: "Les contraintes et règles d'accès avant l'exécution.",
        items: [
          "Monde autorisé",
          "Niveau requis",
          "Argent requis",
          "Cooldown",
          "Fonctionnement détaillé"
        ]
      },
      {
        title: "Interfaces activables",
        mode: "Conditionnel",
        description: "Le sélecteur central qui ouvre les sous-blocs adaptés au besoin.",
        items: [
          "Chat",
          "GUI",
          "Scoreboard",
          "ActionBar",
          "SoundDesign",
          "Action joueur"
        ]
      },
      {
        title: "Messages chat",
        mode: "Dynamique",
        description: "Bloc ajouté quand l'interface chat est utilisée.",
        items: [
          "Collection dynamique de messages",
          "Structure d'un message : titre",
          "Structure d'un message : contenu"
        ]
      },
      {
        title: "GUI rattaché à la commande",
        mode: "Conditionnel",
        description: "Sous-architecture du GUI si la commande ouvre une interface.",
        items: [
          "Nom du GUI",
          "Taille",
          "Image du GUI",
          "Lien de la texture",
          "Preset à charger ou enregistrer",
          "Visualisation cliquable du GUI",
          "Liste dynamique d'items",
          "Structure d'un item : slot, item Minecraft, nom, lore, fonction, action au clic"
        ]
      },
      {
        title: "Sorties secondaires",
        mode: "Conditionnel",
        description: "Blocs additionnels selon les interfaces cochées.",
        items: [
          "Scoreboard : contenu",
          "ActionBar : QUI + message",
          "SoundDesign : quand + son",
          "Action joueur : description"
        ]
      }
    ]
  },
  {
    id: "gui",
    label: "GUI",
    formId: "guiForm",
    description: "Template pour construire une interface complète avec ouverture, visualisation et contenu dynamique.",
    sections: [
      {
        title: "Bibliothèque de presets",
        mode: "Bibliothèque",
        description: "Le bloc de lecture et sauvegarde des presets GUI du projet.",
        items: [
          "Sélection d'un preset existant",
          "Nom du preset",
          "Action charger le preset",
          "Action enregistrer le preset",
          "Statut de la bibliothèque"
        ]
      },
      {
        title: "Identité du GUI",
        mode: "Fondation",
        description: "Les informations qui définissent la fenêtre elle-même.",
        items: [
          "Nom du GUI",
          "Nom affiché",
          "Taille",
          "Taille personnalisée",
          "Image du GUI",
          "Lien de la texture",
          "Objectif"
        ]
      },
      {
        title: "Ouverture",
        mode: "Conditionnel",
        description: "Les points d'entrée possibles pour afficher le GUI.",
        items: [
          "Commande",
          "NPC : nom + coordonnée",
          "Item d'ouverture",
          "Autre déclencheur"
        ]
      },
      {
        title: "Visualisation et contenu",
        mode: "Dynamique",
        description: "La partie qui matérialise l'architecture interne du GUI.",
        items: [
          "Visualisation cliquable du GUI",
          "Liste dynamique d'items",
          "Structure d'un item : slot, item Minecraft, nom, lore, fonction, action au clic"
        ]
      }
    ]
  },
  {
    id: "itemC",
    label: "Item Custom",
    formId: "itemCForm",
    description: "Template centré sur la création d'un item custom, de son obtention à son utilisation en jeu.",
    sections: [
      {
        title: "Identification",
        mode: "Fondation",
        description: "Le socle qui définit l'objet et son rôle global.",
        items: [
          "Nom de l'item",
          "Item Minecraft de référence",
          "Type d'item",
          "Type autre",
          "Rôle de l'item"
        ]
      },
      {
        title: "Obtention",
        mode: "Conditionnel",
        description: "Le bloc qui change selon la méthode d'acquisition choisie.",
        items: [
          "Craft visuel + recette",
          "Récompense",
          "Boutique : catégorie + prix + condition",
          "Shop : catégorie + prix + devise + condition",
          "Event : nom + méthode d'obtention + condition",
          "Autre mode d'obtention"
        ]
      },
      {
        title: "Apparence Minecraft",
        mode: "Statique",
        description: "Les éléments de rendu visibles par le joueur.",
        items: [
          "Texture de l'item",
          "Lien de la texture",
          "Nom affiché",
          "Lore",
          "Durabilité",
          "Description de l'effet"
        ]
      },
      {
        title: "Utilisation",
        mode: "Conditionnel",
        description: "Les comportements disponibles selon les interactions sélectionnées.",
        items: [
          "Clic droit",
          "Clic gauche",
          "Passif"
        ]
      }
    ]
  },
  {
    id: "event",
    label: "Event",
    formId: "eventForm",
    description: "Template pour un événement avec cadence, conditions de lancement, interface, messages et commandes admin.",
    sections: [
      {
        title: "Fondations",
        mode: "Fondation",
        description: "Les données qui posent l'identité et la cadence de l'événement.",
        items: [
          "Nom de l'événement",
          "Type : Solo / Îles / Global",
          "Fréquence : Journalier / Hebdomadaire / Mensuel / Annuel",
          "Horaire",
          "Durée",
          "Objectif joueur"
        ]
      },
      {
        title: "Déclenchement",
        mode: "Conditionnel",
        description: "La manière dont l'événement démarre.",
        items: [
          "Démarrage automatique",
          "Démarrage par commande",
          "Champ commande de lancement"
        ]
      },
      {
        title: "Conditions de lancement",
        mode: "Dynamique",
        description: "Le bloc des prérequis avant démarrage.",
        items: [
          "Nombre minimum de joueurs",
          "Liste dynamique d'autres conditions",
          "Structure d'une condition : description libre"
        ]
      },
      {
        title: "Récompenses et interface",
        mode: "Mixte",
        description: "Les sorties visibles et les récompenses finales.",
        items: [
          "Récompenses du top 3",
          "Interface : Scoreboard / ActionBar / BossBar",
          "Scoreboard : modifications",
          "ActionBar : contenu",
          "BossBar : contenu"
        ]
      },
      {
        title: "Messages",
        mode: "Dynamique",
        description: "Les communications envoyées aux joueurs pendant l'événement.",
        items: [
          "Message de lancement",
          "Message de fin",
          "Message si pas assez de joueurs",
          "Liste dynamique de messages personnalisés",
          "Structure d'un message : titre + message"
        ]
      },
      {
        title: "Partie admin",
        mode: "Administration",
        description: "Les commandes internes utilisées pour piloter l'événement.",
        items: [
          "Commande de lancement",
          "Commande de fin",
          "Commande de forçage si pas assez de joueurs"
        ]
      }
    ]
  },
  {
    id: "metier",
    label: "Métier",
    formId: "metierForm",
    description: "Template pour décrire un métier, sa progression, ses messages et son GUI de suivi.",
    sections: [
      {
        title: "Type et présentation",
        mode: "Fondation",
        description: "Le bloc de cadrage du métier.",
        items: [
          "Type de métier",
          "Présentation du métier"
        ]
      },
      {
        title: "Progression par item",
        mode: "Dynamique",
        description: "Les lignes qui relient les ressources au niveau et à l'XP.",
        items: [
          "Liste d'items par niveau",
          "Structure d'une ligne : item",
          "Structure d'une ligne : niveau de déblocage",
          "Structure d'une ligne : XP donné"
        ]
      },
      {
        title: "Récompenses par niveau",
        mode: "Dynamique",
        description: "Le tableau de progression et de gain.",
        items: [
          "Liste des récompenses de niveau",
          "Structure d'une ligne : niveau",
          "Structure d'une ligne : XP",
          "Structure d'une ligne : récompense"
        ]
      },
      {
        title: "Messages d'évolution",
        mode: "Conditionnel",
        description: "Les différentes surfaces de communication de progression.",
        items: [
          "Chat",
          "ActionBar",
          "BossBar",
          "Autre affichage"
        ]
      },
      {
        title: "Message de gain de niveau",
        mode: "Statique",
        description: "Le message principal envoyé lors d'un palier franchi.",
        items: [
          "Message Chat"
        ]
      },
      {
        title: "GUI XP par item",
        mode: "Dynamique",
        description: "Le GUI secondaire qui synthétise la progression du métier.",
        items: [
          "Image du GUI",
          "Lien de la texture",
          "Liste dynamique d'items du GUI",
          "Structure d'un item : item, nom, lore",
          "Spécificité métier"
        ]
      }
    ]
  },
  {
    id: "rankUp",
    label: "Rank-up",
    formId: "rankUpForm",
    description: "Template pour documenter une progression de ranks avec prix, prérequis et récompenses par palier.",
    sections: [
      {
        title: "Paliers de rank-up",
        mode: "Dynamique",
        description: "Le template est organisé autour d'une liste de ranks successifs.",
        items: [
          "Bouton d'ajout d'un rank",
          "Liste dynamique de ranks"
        ]
      },
      {
        title: "Structure d'un rank",
        mode: "Dynamique",
        description: "Chaque palier contient les champs nécessaires à la progression.",
        items: [
          "Nom du rank",
          "Prix du rank",
          "Lien de l'image",
          "Prérequis",
          "Liste dynamique de récompenses",
          "Structure d'une récompense : texte libre"
        ]
      }
    ]
  },
  {
    id: "mobs",
    label: "Mobs",
    formId: "mobsForm",
    description: "Template pour définir un mob, ses caractéristiques, ses spawns, ses drops et son XP.",
    sections: [
      {
        title: "Identification",
        mode: "Fondation",
        description: "Les informations qui situent le mob dans le projet.",
        items: [
          "Nom du mob",
          "Type",
          "Zone"
        ]
      },
      {
        title: "Stats",
        mode: "Statique",
        description: "Les valeurs principales de combat et de rythme.",
        items: [
          "PV",
          "Attaque",
          "Vitesse",
          "Cooldown"
        ]
      },
      {
        title: "Comportement",
        mode: "Statique",
        description: "Le profil IA général du mob.",
        items: [
          "Type de comportement : agressif / passif / neutre"
        ]
      },
      {
        title: "Spawn",
        mode: "Dynamique",
        description: "Les points d'apparition configurables.",
        items: [
          "Liste dynamique de spawns",
          "Structure d'un spawn : coordonnées",
          "Structure d'un spawn : intervalle",
          "Structure d'un spawn : nombre max"
        ]
      },
      {
        title: "Drops et XP",
        mode: "Dynamique",
        description: "Les gains liés au kill du mob.",
        items: [
          "Liste dynamique de drops",
          "Structure d'un drop : item",
          "Structure d'un drop : quantité",
          "Structure d'un drop : taux",
          "XP gagné",
          "Niveau requis"
        ]
      }
    ]
  },
  {
    id: "libre",
    label: "Libre",
    formId: "libreForm",
    description: "Template souple pour documenter des sujets atypiques via des blocs ajoutés librement.",
    sections: [
      {
        title: "Fondation",
        mode: "Fondation",
        description: "Le cadrage minimal du sujet.",
        items: [
          "Nom du sujet",
          "Catégorie",
          "Présentation générale"
        ]
      },
      {
        title: "Blocs libres",
        mode: "Dynamique",
        description: "La structure modulable du template.",
        items: [
          "Liste dynamique de blocs",
          "Structure d'un bloc : titre",
          "Structure d'un bloc : contenu"
        ]
      }
    ]
  },
  {
    id: "caisse",
    label: "Caisse",
    formId: "caisseForm",
    description: "Template pour une caisse, son identité visuelle et son tableau de récompenses pondérées.",
    sections: [
      {
        title: "Identité",
        mode: "Fondation",
        description: "Les champs de base de la caisse.",
        items: [
          "Nom de la caisse",
          "Nom affiché"
        ]
      },
      {
        title: "Récompenses",
        mode: "Dynamique",
        description: "Le coeur probabiliste du template.",
        items: [
          "Aide de totalisation des pourcentages",
          "Liste dynamique de récompenses",
          "Structure d'une récompense : item",
          "Structure d'une récompense : quantité",
          "Structure d'une récompense : pourcentage de chance"
        ]
      }
    ]
  },
  {
    id: "soundDesign",
    label: "Sound Design",
    formId: "soundDesignForm",
    description: "Template dédié au catalogue des événements sonores et à leur description.",
    sections: [
      {
        title: "Collection sonore",
        mode: "Dynamique",
        description: "Le template est construit autour d'une liste d'entrées audio.",
        items: [
          "Bouton d'ajout d'un son",
          "Liste dynamique des éléments sonores"
        ]
      },
      {
        title: "Structure d'une entrée",
        mode: "Dynamique",
        description: "Le format répété pour chaque son ajouté.",
        items: [
          "Événement",
          "Son joué",
          "Écoute locale du son",
          "Description"
        ]
      }
    ]
  }
];

let currentSettingsTemplateId = SETTINGS_TEMPLATE_CATALOG[0]?.id || "";

function escapeSettingsHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getSettingsTemplateLabelOverrides() {
  try {
    const raw = localStorage.getItem(SETTINGS_TEMPLATE_LABEL_OVERRIDES_STORAGE_KEY);
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveSettingsTemplateLabelOverrides(overrides) {
  localStorage.setItem(SETTINGS_TEMPLATE_LABEL_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
}

function getSettingsTemplateMetaOverrides() {
  try {
    const raw = localStorage.getItem(SETTINGS_TEMPLATE_META_STORAGE_KEY);
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveSettingsTemplateMetaOverrides(overrides) {
  localStorage.setItem(SETTINGS_TEMPLATE_META_STORAGE_KEY, JSON.stringify(overrides));
}

function sanitizeSettingsTemplateVersion(version, fallback = "1.0.0") {
  const trimmedVersion = String(version ?? "").trim();
  return trimmedVersion || fallback;
}

function sanitizeSettingsTemplateStatus(status) {
  return Object.prototype.hasOwnProperty.call(SETTINGS_TEMPLATE_STATUS_LABELS, status) ? status : "active";
}

function getSettingsTemplateStatusLabel(status) {
  return SETTINGS_TEMPLATE_STATUS_LABELS[sanitizeSettingsTemplateStatus(status)];
}

function getSettingsTemplateDefaultMeta(template) {
  return {
    version: sanitizeSettingsTemplateVersion(template?.version, "1.0.0"),
    status: sanitizeSettingsTemplateStatus(template?.status)
  };
}

function getResolvedSettingsTemplateMeta(template) {
  const defaults = getSettingsTemplateDefaultMeta(template);
  const overrides = getSettingsTemplateMetaOverrides();
  const rawOverride = overrides[template.id];
  const safeOverride = rawOverride && typeof rawOverride === "object" && !Array.isArray(rawOverride)
    ? rawOverride
    : {};

  return {
    version: sanitizeSettingsTemplateVersion(safeOverride.version, defaults.version),
    status: sanitizeSettingsTemplateStatus(safeOverride.status || defaults.status)
  };
}

function getSettingsTemplateDisplayLabel(template) {
  if (!template) return "Template";
  const overrides = getSettingsTemplateLabelOverrides();
  const override = typeof overrides[template.id] === "string" ? overrides[template.id].trim() : "";
  return override || template.label;
}

function getResolvedSettingsTemplate(template) {
  if (!template) return null;
  const metadata = getResolvedSettingsTemplateMeta(template);
  return {
    ...template,
    defaultLabel: template.label,
    label: getSettingsTemplateDisplayLabel(template),
    version: metadata.version,
    status: metadata.status,
    statusLabel: getSettingsTemplateStatusLabel(metadata.status)
  };
}

function getSettingsTemplateById(templateId) {
  const template = SETTINGS_TEMPLATE_CATALOG.find(entry => entry.id === templateId) || SETTINGS_TEMPLATE_CATALOG[0] || null;
  return getResolvedSettingsTemplate(template);
}

function updateSettingsTemplateLabel(templateId, nextLabel) {
  const baseTemplate = SETTINGS_TEMPLATE_CATALOG.find(template => template.id === templateId);
  if (!baseTemplate) return null;

  const overrides = getSettingsTemplateLabelOverrides();
  const trimmedLabel = String(nextLabel ?? "").trim();

  if (!trimmedLabel || trimmedLabel === baseTemplate.label) {
    delete overrides[templateId];
  } else {
    overrides[templateId] = trimmedLabel;
  }

  saveSettingsTemplateLabelOverrides(overrides);
  return getSettingsTemplateById(templateId);
}

function updateSettingsTemplateMetadata(templateId, nextMetadata) {
  const baseTemplate = SETTINGS_TEMPLATE_CATALOG.find(template => template.id === templateId);
  if (!baseTemplate) return null;

  const defaults = getSettingsTemplateDefaultMeta(baseTemplate);
  const overrides = getSettingsTemplateMetaOverrides();
  const currentOverride = overrides[templateId];
  const currentMeta = currentOverride && typeof currentOverride === "object" && !Array.isArray(currentOverride)
    ? currentOverride
    : {};
  const safeNextMetadata = nextMetadata && typeof nextMetadata === "object" ? nextMetadata : {};

  const hasVersion = Object.prototype.hasOwnProperty.call(safeNextMetadata, "version");
  const hasStatus = Object.prototype.hasOwnProperty.call(safeNextMetadata, "status");

  const resolvedMeta = {
    version: sanitizeSettingsTemplateVersion(
      hasVersion ? safeNextMetadata.version : currentMeta.version,
      defaults.version
    ),
    status: sanitizeSettingsTemplateStatus(
      hasStatus ? safeNextMetadata.status : (currentMeta.status || defaults.status)
    )
  };

  if (resolvedMeta.version === defaults.version && resolvedMeta.status === defaults.status) {
    delete overrides[templateId];
  } else {
    overrides[templateId] = resolvedMeta;
  }

  saveSettingsTemplateMetaOverrides(overrides);
  return getSettingsTemplateById(templateId);
}

function applySettingsTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = normalizedTheme;
  document.documentElement.style.colorScheme = normalizedTheme;
  window.syncGlobalThemeSwitch?.(normalizedTheme);
}

function initSettingsTheme() {
  applySettingsTheme(localStorage.getItem(SETTINGS_THEME_STORAGE_KEY) || "light");
}

function toggleTheme() {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applySettingsTheme(nextTheme);
  localStorage.setItem(SETTINGS_THEME_STORAGE_KEY, nextTheme);
}

function updateSettingsTopTabs() {
  const projectTab = document.getElementById("settingsTopTabProject");
  const editorTab = document.getElementById("settingsTopTabEditor");
  const activeProjectId = localStorage.getItem(SETTINGS_ACTIVE_PROJECT_STORAGE_KEY) || "";

  if (projectTab) {
    projectTab.href = "./projects.html";
    projectTab.classList.remove("is-disabled");
    projectTab.removeAttribute("aria-disabled");
  }

  if (editorTab) {
    editorTab.href = activeProjectId
      ? `./cdc-generator.html?projectId=${encodeURIComponent(activeProjectId)}`
      : "./cdc-generator.html";
    editorTab.classList.toggle("is-disabled", !activeProjectId);
    if (activeProjectId) {
      editorTab.removeAttribute("aria-disabled");
    } else {
      editorTab.setAttribute("aria-disabled", "true");
    }
  }
}

function setActiveSettingsSection(sectionId) {
  const normalizedSection = SETTINGS_SECTIONS.includes(sectionId) ? sectionId : "gui";
  const menuItems = document.querySelectorAll("[data-settings-section]");
  const panels = document.querySelectorAll("[data-settings-panel]");

  menuItems.forEach(item => {
    const isActive = item.dataset.settingsSection === normalizedSection;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
    item.tabIndex = isActive ? 0 : -1;
  });

  panels.forEach(panel => {
    const isActive = panel.dataset.settingsPanel === normalizedSection;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  if (window.location.hash !== `#${normalizedSection}`) {
    window.history.replaceState(null, "", `#${normalizedSection}`);
  }
}

function initSettingsSections() {
  const menuItems = document.querySelectorAll("[data-settings-section]");
  const panels = document.querySelectorAll("[data-settings-panel]");
  if (!menuItems.length || !panels.length) return;

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      setActiveSettingsSection(item.dataset.settingsSection || "gui");
    });
  });

  const initialSection = window.location.hash.replace("#", "");
  setActiveSettingsSection(initialSection || "gui");
}

function buildSettingsTemplateDetail(template) {
  if (!template) {
    return `
      <div class="settings-template-detail-surface">
        <p class="muted">Aucun template sélectionné.</p>
      </div>
    `;
  }

  const blockCount = template.sections.reduce((total, section) => total + section.items.length, 0);
  const statusOptionsHtml = Object.entries(SETTINGS_TEMPLATE_STATUS_LABELS).map(([value, label]) => `
    <option value="${escapeSettingsHtml(value)}"${value === template.status ? " selected" : ""}>${escapeSettingsHtml(label)}</option>
  `).join("");
  const sectionsHtml = template.sections.map((section, index) => `
    <article class="settings-architecture-section">
      <div class="settings-architecture-section-top">
        <div class="settings-architecture-step">${String(index + 1).padStart(2, "0")}</div>
        <div class="settings-architecture-section-body">
          <div class="settings-architecture-title-row">
            <h5 class="settings-architecture-title">${escapeSettingsHtml(section.title)}</h5>
            <span class="settings-template-chip settings-template-chip-soft">${escapeSettingsHtml(section.mode)}</span>
          </div>
          <p class="muted settings-architecture-copy">${escapeSettingsHtml(section.description)}</p>
        </div>
      </div>
      <ul class="settings-architecture-items">
        ${section.items.map(item => `<li>${escapeSettingsHtml(item)}</li>`).join("")}
      </ul>
    </article>
  `).join("");

  return `
    <div class="settings-template-detail-surface">
      <div class="settings-template-detail-header">
        <div class="settings-template-detail-header-top">
          <div>
            <div class="template-badge">Architecture du template</div>
            <div class="settings-template-detail-title-row">
            <h4 class="settings-template-detail-title">${escapeSettingsHtml(template.label)}</h4>
            <button
              type="button"
              class="btn-secondary settings-template-detail-edit"
              data-template-rename-trigger
              data-template-id="${escapeSettingsHtml(template.id)}"
              aria-label="Modifier le nom du template ${escapeSettingsHtml(template.label)}"
            >
              Modifier
            </button>
            </div>
            <p class="muted settings-template-detail-copy">${escapeSettingsHtml(template.description)}</p>
          </div>

          <div class="settings-template-detail-controls">
            <div class="settings-template-detail-controls-grid">
              <div class="settings-template-detail-control">
                <label class="settings-template-detail-control-label" for="settingsTemplateVersionInput">Version</label>
                <input
                  id="settingsTemplateVersionInput"
                  class="settings-template-detail-control-input"
                  type="text"
                  value="${escapeSettingsHtml(template.version)}"
                  placeholder="Ex : 1.0.0"
                  autocomplete="off"
                />
              </div>

              <div class="settings-template-detail-control">
                <label class="settings-template-detail-control-label" for="settingsTemplateStatusSelect">Statut</label>
                <select
                  id="settingsTemplateStatusSelect"
                  class="settings-template-detail-control-input"
                  aria-label="Statut du template"
                >
                  ${statusOptionsHtml}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="settings-template-detail-metrics">
          <span class="settings-template-chip">Formulaire : ${escapeSettingsHtml(template.formId)}</span>
          <span class="settings-template-chip">Sections : ${template.sections.length}</span>
          <span class="settings-template-chip">Blocs repérés : ${blockCount}</span>
        </div>
      </div>
      <div class="settings-architecture-list">
        ${sectionsHtml}
      </div>
    </div>
  `;
}

function selectSettingsTemplate(templateId) {
  const template = getSettingsTemplateById(templateId);
  if (!template) return;
  currentSettingsTemplateId = template.id;
  renderSettingsTemplateCatalog();
}

function renderSettingsTemplateCatalog() {
  const count = document.getElementById("settingsTemplateCount");
  const list = document.getElementById("settingsTemplateList");
  const detail = document.getElementById("settingsTemplateDetail");
  if (!count || !list) return;

  const selectedTemplate = getSettingsTemplateById(currentSettingsTemplateId);
  if (!selectedTemplate) return;

  currentSettingsTemplateId = selectedTemplate.id;
  count.textContent = String(SETTINGS_TEMPLATE_CATALOG.length);

  if (!detail) {
    list.innerHTML = SETTINGS_TEMPLATE_CATALOG.map(template => {
      const resolvedTemplate = getResolvedSettingsTemplate(template);
      return `
      <a
        class="settings-template-item settings-template-link"
        href="./settings-template.html?template=${encodeURIComponent(resolvedTemplate.id)}"
      >
        <div class="settings-template-item-top">
          <div>
            <h4 class="settings-template-item-title">${escapeSettingsHtml(resolvedTemplate.label)}</h4>
            <div class="settings-template-item-meta">Formulaire : <code>${escapeSettingsHtml(resolvedTemplate.formId)}</code></div>
          </div>
          <span class="project-history-template">${resolvedTemplate.sections.length} sections</span>
        </div>
        <p class="muted settings-template-item-copy">${escapeSettingsHtml(resolvedTemplate.description)}</p>
        <div class="settings-template-item-footer">
          <span
            class="settings-template-chip settings-template-status-badge"
            data-status="${escapeSettingsHtml(resolvedTemplate.status)}"
          >${escapeSettingsHtml(resolvedTemplate.statusLabel)}</span>
          <span class="settings-template-chip settings-template-chip-soft">Version : ${escapeSettingsHtml(resolvedTemplate.version)}</span>
          <span class="settings-template-chip settings-template-chip-soft">Ouvrir l'architecture</span>
        </div>
      </a>
    `;
    }).join("");
    return;
  }

  list.innerHTML = SETTINGS_TEMPLATE_CATALOG.map(template => {
    const resolvedTemplate = getResolvedSettingsTemplate(template);
    const isActive = resolvedTemplate.id === currentSettingsTemplateId;
    return `
      <button
        type="button"
        class="settings-template-item${isActive ? " is-active" : ""}"
        data-template-id="${escapeSettingsHtml(resolvedTemplate.id)}"
        role="option"
        aria-selected="${String(isActive)}"
      >
        <div class="settings-template-item-top">
          <div>
            <h4 class="settings-template-item-title">${escapeSettingsHtml(resolvedTemplate.label)}</h4>
            <div class="settings-template-item-meta">Formulaire : <code>${escapeSettingsHtml(resolvedTemplate.formId)}</code></div>
          </div>
          <span class="project-history-template">${resolvedTemplate.sections.length} sections</span>
        </div>
        <p class="muted settings-template-item-copy">${escapeSettingsHtml(resolvedTemplate.description)}</p>
        <div class="settings-template-item-footer">
          <span
            class="settings-template-chip settings-template-status-badge"
            data-status="${escapeSettingsHtml(resolvedTemplate.status)}"
          >${escapeSettingsHtml(resolvedTemplate.statusLabel)}</span>
          <span class="settings-template-chip settings-template-chip-soft">Version : ${escapeSettingsHtml(resolvedTemplate.version)}</span>
          <span class="settings-template-chip settings-template-chip-soft">Clique pour voir l'architecture</span>
        </div>
      </button>
    `;
  }).join("");

  list.querySelectorAll("[data-template-id]").forEach(item => {
    item.addEventListener("click", () => {
      selectSettingsTemplate(item.dataset.templateId || "");
    });
  });

  detail.innerHTML = buildSettingsTemplateDetail(selectedTemplate);
}

function initSettingsPage() {
  initSettingsTheme();
  updateSettingsTopTabs();
  initSettingsSections();
  renderSettingsTemplateCatalog();
}

window.SETTINGS_TEMPLATE_CATALOG = SETTINGS_TEMPLATE_CATALOG;
window.getSettingsTemplateById = getSettingsTemplateById;
window.getSettingsTemplateDisplayLabel = getSettingsTemplateDisplayLabel;
window.getSettingsTemplateStatusLabel = getSettingsTemplateStatusLabel;
window.updateSettingsTemplateLabel = updateSettingsTemplateLabel;
window.updateSettingsTemplateMetadata = updateSettingsTemplateMetadata;
window.escapeSettingsHtml = escapeSettingsHtml;
window.buildSettingsTemplateDetail = buildSettingsTemplateDetail;
window.initSettingsTheme = initSettingsTheme;
window.updateSettingsTopTabs = updateSettingsTopTabs;
window.toggleTheme = toggleTheme;

document.addEventListener("DOMContentLoaded", initSettingsPage);
