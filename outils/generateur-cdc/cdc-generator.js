    /* =========================================================
       1. VARIABLES GLOBALES
       - servent pour les listes dynamiques
       ========================================================= */
    let dernierTexteGenere = "";
    let messageIndex = 0;
    let guiCommandeItemIndex = 0;
    let guiCommandeLoreVariantIndex = 0;
    let guiTemplateItemIndex = 0;
    let guiTemplateLoreVariantIndex = 0;
    let itemCustomCraftIngredientIndex = 0;
    let eventConditionIndex = 0;
    let eventMessageIndex = 0;
    let caisseRewardIndex = 0;
    let soundDesignEntryIndex = 0;
    let metierItemIndex = 0;
    let metierLevelRewardIndex = 0;
    let metierGuiItemIndex = 0;
    let metierGuiLoreVariantIndex = 0;
    let rankUpIndex = 0;
    let rankUpRewardIndex = 0;
    let mobSpawnIndex = 0;
    let mobDropIndex = 0;
    let libreSectionIndex = 0;
    const TEMPLATE_LABEL_OVERRIDES_STORAGE_KEY = "neodium-template-label-overrides";
    const PROJECT_HISTORY_STORAGE_KEY = "neodium-cdc-project-history";
    const PROJECTS_STORAGE_KEY = "neodium-cdc-projects";
    const ACTIVE_PROJECT_STORAGE_KEY = "neodium-cdc-active-project";
    const ACTIVE_HISTORY_PROJECTS_STORAGE_KEY = "neodium-cdc-active-history-projects";
    const RECOVERY_DRAFT_STORAGE_KEY = "neodium-cdc-recovery-draft";
    const REQUESTED_GUI_PRESET_SESSION_KEY = "neodium-cdc-requested-gui-preset";
    const REQUESTED_ITEM_CUSTOM_PRESET_SESSION_KEY = "neodium-cdc-requested-item-custom-preset";
    const LOCAL_MINECRAFT_SOUNDS_BASE_PATH = "./minecraft-sounds";
    const LOCAL_MINECRAFT_ITEM_TEXTURES_BASE_PATH = "./minecraft-item-textures";
    const HEADDATABASE_REMOTE_TEXTURES_PATH = "./headdb-remote-textures.txt?v=20260623a";
    const GUI_PRESETS_MANIFEST = Array.isArray(window.GUI_PRESETS_MANIFEST) ? window.GUI_PRESETS_MANIFEST : [];
    const GUI_CUSTOM_PRESETS_FILE = Array.isArray(window.GUI_CUSTOM_PRESETS_FILE) ? window.GUI_CUSTOM_PRESETS_FILE : [];
    const ITEM_CUSTOM_PRESETS_MANIFEST = Array.isArray(window.ITEM_CUSTOM_PRESETS_MANIFEST) ? window.ITEM_CUSTOM_PRESETS_MANIFEST : [];
    const ITEM_CUSTOM_CUSTOM_PRESETS_FILE = Array.isArray(window.ITEM_CUSTOM_CUSTOM_PRESETS_FILE) ? window.ITEM_CUSTOM_CUSTOM_PRESETS_FILE : [];
    const GUI_PRESET_OVERRIDES_STORAGE_KEY = "neodium-gui-preset-overrides";
    const GUI_PRESET_HIDDEN_STORAGE_KEY = "neodium-gui-preset-hidden";
    const GUI_CUSTOM_PRESETS_STORAGE_KEY = "neodium-gui-custom-presets";
    const ITEM_CUSTOM_PRESET_OVERRIDES_STORAGE_KEY = "neodium-item-custom-preset-overrides";
    const ITEM_CUSTOM_PRESET_HIDDEN_STORAGE_KEY = "neodium-item-custom-preset-hidden";
    const ITEM_CUSTOM_PRESETS_STORAGE_KEY = "neodium-item-custom-presets";
    const ITEM_CUSTOM_PRESET_ENTRY_STORAGE_PREFIX = "neodium-item-custom-preset-entry-";
    const PROJECT_IMAGE_FIELDS = [
      { inputId: "imageGUICommande", previewId: "previewImageGUICommande" },
      { inputId: "guiImage", previewId: "previewImageTemplate" },
      { inputId: "textureItemImage", previewId: "previewTextureItemTemplate" },
      { inputId: "metierGuiXpImage", previewId: "previewMetierGuiXpImage" }
    ];
    const PROJECT_IMAGE_COMPRESSION_OPTIONS = Object.freeze({
      imageGUICommande: { maxWidth: 960, maxHeight: 960, quality: 0.78, minQuality: 0.58, targetBytes: 240 * 1024, imageSmoothing: true },
      guiImage: { maxWidth: 960, maxHeight: 960, quality: 0.78, minQuality: 0.58, targetBytes: 240 * 1024, imageSmoothing: true },
      textureItemImage: { maxWidth: 256, maxHeight: 256, quality: 0.84, minQuality: 0.64, targetBytes: 96 * 1024, imageSmoothing: false },
      metierGuiXpImage: { maxWidth: 960, maxHeight: 960, quality: 0.78, minQuality: 0.58, targetBytes: 240 * 1024, imageSmoothing: true }
    });
    const BUILTIN_MINECRAFT_ITEM_KEYS = Array.isArray(window.BUILTIN_MINECRAFT_ITEM_IDS)
      ? [...window.BUILTIN_MINECRAFT_ITEM_IDS].sort((a, b) => a.localeCompare(b))
      : [];
    const CUSTOM_MINECRAFT_ITEM_KEYS = [
      "icon_back_orange",
      "cancel",
      "icon_right_blue",
      "icon_search",
      "icon_left_blue",
      "icon_next_orange",
      "gemme_ore_block",
      "coeur_sombre",
      "feve",
      "frag_event",
      "frag_metier",
      "gemme",
      "sell_bag"
    ];
    const MINECRAFT_ITEM_TEXTURE_MAP = window.MINECRAFT_ITEM_TEXTURE_MAP || {};
    const MINECRAFT_ITEM_BLOCK_FACES_MAP = window.MINECRAFT_ITEM_BLOCK_FACES_MAP || {};
    let headDatabaseTextureMapPromise = null;
    const BUILTIN_MINECRAFT_SOUND_EVENTS = [
      "ambient.cave",
      "block.amethyst_block.break",
      "block.amethyst_block.chime",
      "block.anvil.break",
      "block.anvil.destroy",
      "block.anvil.fall",
      "block.anvil.hit",
      "block.anvil.land",
      "block.anvil.place",
      "block.anvil.step",
      "block.anvil.use",
      "block.beacon.activate",
      "block.beacon.ambient",
      "block.beacon.deactivate",
      "block.beacon.power_select",
      "block.beehive.drip",
      "block.beehive.enter",
      "block.beehive.exit",
      "block.bell.resonate",
      "block.bell.use",
      "block.brewing_stand.brew",
      "block.bubble_column.bubble_pop",
      "block.bubble_column.upwards_ambient",
      "block.chest.close",
      "block.chest.locked",
      "block.chest.open",
      "block.comparator.click",
      "block.conduit.activate",
      "block.conduit.ambient",
      "block.conduit.deactivate",
      "block.dispenser.dispense",
      "block.enchantment_table.use",
      "block.ender_chest.close",
      "block.ender_chest.open",
      "block.fire.ambient",
      "block.grindstone.use",
      "block.iron_trapdoor.close",
      "block.iron_trapdoor.open",
      "block.lava.ambient",
      "block.note_block.banjo",
      "block.note_block.basedrum",
      "block.note_block.bass",
      "block.note_block.bell",
      "block.note_block.bit",
      "block.note_block.chime",
      "block.note_block.cow_bell",
      "block.note_block.flute",
      "block.note_block.guitar",
      "block.note_block.harp",
      "block.note_block.hat",
      "block.note_block.iron_xylophone",
      "block.note_block.pling",
      "block.note_block.snare",
      "block.note_block.xylophone",
      "block.portal.ambient",
      "block.portal.travel",
      "block.portal.trigger",
      "block.respawn_anchor.charge",
      "block.respawn_anchor.deplete",
      "block.respawn_anchor.set_spawn",
      "block.sculk_sensor.clicking",
      "block.sculk_sensor.clicking_stop",
      "block.shulker_box.close",
      "block.shulker_box.open",
      "block.smoker.smoke",
      "block.stone_button.click_on",
      "block.stone_button.click_off",
      "block.trial_spawner.about_to_spawn_item",
      "block.trial_spawner.spawn_item_begin",
      "block.vault.activate",
      "block.vault.open_shutter",
      "block.water.ambient",
      "entity.allay.ambient_with_item",
      "entity.allay.ambient_without_item",
      "entity.arrow.hit_player",
      "entity.bat.ambient",
      "entity.bee.loop",
      "entity.blaze.ambient",
      "entity.cat.ambient",
      "entity.chicken.ambient",
      "entity.creeper.primed",
      "entity.dolphin.ambient",
      "entity.ender_dragon.growl",
      "entity.enderman.ambient",
      "entity.evoker.prepare_attack",
      "entity.experience_orb.pickup",
      "entity.firework_rocket.blast",
      "entity.firework_rocket.launch",
      "entity.fishing_bobber.retrieve",
      "entity.fox.ambient",
      "entity.frog.ambient",
      "entity.generic.explode",
      "entity.generic.hurt",
      "entity.ghast.ambient",
      "entity.guardian.ambient",
      "entity.horse.ambient",
      "entity.illusioner.prepare_blindness",
      "entity.iron_golem.attack",
      "entity.item.pickup",
      "entity.lightning_bolt.impact",
      "entity.lightning_bolt.thunder",
      "entity.llama.ambient",
      "entity.panda.sneeze",
      "entity.parrot.ambient",
      "entity.phantom.ambient",
      "entity.player.attack.crit",
      "entity.player.attack.knockback",
      "entity.player.attack.strong",
      "entity.player.attack.sweep",
      "entity.player.attack.weak",
      "entity.player.burp",
      "entity.player.hurt",
      "entity.player.levelup",
      "entity.player.splash.high_speed",
      "entity.rabbit.ambient",
      "entity.ravager.roar",
      "entity.sheep.ambient",
      "entity.shulker.open",
      "entity.skeleton.ambient",
      "entity.sniffer.idle",
      "entity.spider.ambient",
      "entity.totem.use",
      "entity.villager.celebrate",
      "entity.warden.heartbeat",
      "entity.witch.ambient",
      "entity.wither.ambient",
      "entity.wolf.ambient",
      "entity.zombie.ambient",
      "item.armor.equip_diamond",
      "item.book.page_turn",
      "item.bottle.empty",
      "item.bottle.fill",
      "item.brush.brushing",
      "item.bucket.empty",
      "item.bucket.fill",
      "item.bundle.drop_contents",
      "item.chorus_fruit.teleport",
      "item.crossbow.loading_end",
      "item.goat_horn.sound.0",
      "item.goat_horn.sound.1",
      "item.goat_horn.sound.2",
      "item.goat_horn.sound.3",
      "item.goat_horn.sound.4",
      "item.goat_horn.sound.5",
      "item.goat_horn.sound.6",
      "item.goat_horn.sound.7",
      "item.honey_bottle.drink",
      "item.lodestone_compass.lock",
      "item.shield.block",
      "item.spyglass.use",
      "item.totem.use",
      "music.creative",
      "music.dragon",
      "music.end",
      "music.game",
      "music.menu",
      "music.nether.basalt_deltas",
      "music.nether.crimson_forest",
      "music.nether.nether_wastes",
      "music.nether.soul_sand_valley",
      "music.nether.warped_forest",
      "music.under_water",
      "music_disc.13",
      "music_disc.blocks",
      "music_disc.cat",
      "music_disc.chirp",
      "music_disc.creator",
      "music_disc.creator_music_box",
      "music_disc.far",
      "music_disc.mall",
      "music_disc.mellohi",
      "music_disc.otherside",
      "music_disc.pigstep",
      "music_disc.precipice",
      "music_disc.relic",
      "music_disc.stal",
      "music_disc.strad",
      "music_disc.wait",
      "music_disc.ward",
      "ui.button.click",
      "ui.cartography_table.take_result",
      "ui.loom.select_pattern",
      "ui.stonecutter.select_recipe",
      "weather.rain",
      "weather.rain.above"
    ];
    let minecraftSoundCatalogPromise = null;
    let minecraftSoundDefinitions = null;
    let activePreviewAudio = null;
    let currentProjectId = null;
    let activeWorkspaceProjectId = "";
    let activeWorkspaceProjectName = "";
    let requestedHistoryProjectId = "";
    let requestedGuiPresetId = "";
    let requestedItemCustomPresetId = "";
    let isCDCDirty = true;
    let scheduledCDCGenerationId = null;
    const LOCAL_AUTOSAVE_IDLE_DELAY = 5000;
    const LOCAL_AUTOSAVE_MAX_DELAY = 30000;
    const RECOVERY_DRAFT_IDLE_DELAY = 800;
    const RECOVERY_DRAFT_MAX_AGE = 1000 * 60 * 60 * 24 * 7;
    let autosaveTimeoutId = null;
    let autosaveStartedAt = 0;
    let recoveryDraftTimeoutId = null;
    let lastAutosavedSnapshot = "";
    let lastRecoveryDraftSnapshot = "";
    let defaultProjectSnapshot = "";
    const TEMPLATE_CONFIG = {
      commande: {
        formId: "commandeForm",
        badge: "Template actif : Commande",
        textGenerator: genererTemplateCommande,
        previewGenerator: genererPreviewCommandeHtml
      },
      gui: {
        formId: "guiForm",
        badge: "Template actif : GUI",
        textGenerator: genererTemplateGUI,
        previewGenerator: genererPreviewGUIHtml
      },
      itemC: {
        formId: "itemCForm",
        badge: "Template actif : Item Custom",
        textGenerator: genererTemplateItemC,
        previewGenerator: genererPreviewItemCHtml
      },
      event: {
        formId: "eventForm",
        badge: "Template actif : Event",
        textGenerator: genererTemplateEvent,
        previewGenerator: genererPreviewEventHtml
      },
      metier: {
        formId: "metierForm",
        badge: "Template actif : Métier",
        textGenerator: genererTemplateMetier,
        previewGenerator: genererPreviewMetierHtml
      },
      rankUp: {
        formId: "rankUpForm",
        badge: "Template actif : Rank-up",
        textGenerator: genererTemplateRankUp,
        previewGenerator: genererPreviewRankUpHtml
      },
      mobs: {
        formId: "mobsForm",
        badge: "Template actif : Mobs",
        textGenerator: genererTemplateMobs,
        previewGenerator: genererPreviewMobsHtml
      },
      libre: {
        formId: "libreForm",
        badge: "Template actif : Libre",
        textGenerator: genererTemplateLibre,
        previewGenerator: genererPreviewLibreHtml
      },
      caisse: {
        formId: "caisseForm",
        badge: "Template actif : Caisse",
        textGenerator: genererTemplateCaisse,
        previewGenerator: genererPreviewCaisseHtml
      },
      soundDesign: {
        formId: "soundDesignForm",
        badge: "Template actif : Sound Design",
        textGenerator: genererTemplateSoundDesign,
        previewGenerator: genererPreviewSoundDesignHtml
      }
    };
    const TEMPLATE_LABELS = {
      commande: "Commande",
      gui: "GUI",
      itemC: "Item Custom",
      event: "Event",
      metier: "Métier",
      rankUp: "Rank-up",
      mobs: "Mobs",
      libre: "Libre",
      caisse: "Caisse",
      soundDesign: "Sound Design"
    };

    /* =========================================================
       2. FONCTIONS UTILITAIRES
       - petits helpers réutilisables partout
       ========================================================= */

    function boolToBox(value) {
      return value ? "☑" : "☐";
    }

    function valeur(id, fallback = "Aucun") {
      const el = document.getElementById(id);
      if (!el) return fallback;
      const v = el.value.trim();
      return v === "" ? fallback : v;
    }

    function cleanQuotedText(text) {
      return text.replace(/^"+|"+$/g, "");
    }

    function escapeHtml(str) {
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    function nl2brSafe(text) {
      return escapeHtml(String(text)).replace(/\n/g, "<br>");
    }

    function getFormattedLoreLines(text, fallback = "Aucun") {
      const rawText = String(text ?? "");
      if (!rawText.trim()) {
        return [fallback];
      }

      return rawText.split(/\r?\n/).map((line) => {
        const cleanedLine = cleanQuotedText(String(line ?? "").trim());
        return `"${cleanedLine || " "}"`;
      });
    }

    function renderLoreText(text, fallback = "Aucun") {
      return getFormattedLoreLines(text, fallback).join("\n");
    }

    function renderLoreHtml(text, fallback = "Aucun") {
      return getFormattedLoreLines(text, fallback)
        .map((line) => escapeHtml(line))
        .join("<br>");
    }

    const MINECRAFT_LEGACY_COLORS = {
      "0": "#000000",
      "1": "#0000aa",
      "2": "#00aa00",
      "3": "#00aaaa",
      "4": "#aa0000",
      "5": "#aa00aa",
      "6": "#ffaa00",
      "7": "#aaaaaa",
      "8": "#555555",
      "9": "#5555ff",
      "a": "#55ff55",
      "b": "#55ffff",
      "c": "#ff5555",
      "d": "#ff55ff",
      "e": "#ffff55",
      "f": "#ffffff"
    };

    function getMinecraftFormattingClasses(state) {
      const classes = [];
      if (state.bold) classes.push("mc-bold");
      if (state.italic) classes.push("mc-italic");
      if (state.underline) classes.push("mc-underline");
      if (state.strike) classes.push("mc-strike");
      return classes.join(" ");
    }

    function renderMinecraftFormattedText(text) {
      const input = String(text ?? "");
      if (!input.trim()) {
        return "Le rendu apparaîtra ici.";
      }

      const lines = input.split(/\r?\n/);

      return lines.map(line => {
        let html = "";
        let buffer = "";
        let state = {
          color: "#ffffff",
          bold: false,
          italic: false,
          underline: false,
          strike: false
        };

        const flushBuffer = () => {
          if (!buffer) return;
          const classes = getMinecraftFormattingClasses(state);
          const classAttr = classes ? ` class="${classes}"` : "";
          const styleAttr = ` style="color:${state.color}"`;
          html += `<span${classAttr}${styleAttr}>${escapeHtml(buffer)}</span>`;
          buffer = "";
        };

        for (let i = 0; i < line.length; i++) {
          const current = line[i];
          const next = line[i + 1]?.toLowerCase();

          if ((current === "&" || current === "§") && next) {
            const legacyColor = MINECRAFT_LEGACY_COLORS[next];
            if (legacyColor) {
              flushBuffer();
              state = { color: legacyColor, bold: false, italic: false, underline: false, strike: false };
              i++;
              continue;
            }

            if (next === "l") {
              flushBuffer();
              state.bold = true;
              i++;
              continue;
            }

            if (next === "o") {
              flushBuffer();
              state.italic = true;
              i++;
              continue;
            }

            if (next === "n") {
              flushBuffer();
              state.underline = true;
              i++;
              continue;
            }

            if (next === "m") {
              flushBuffer();
              state.strike = true;
              i++;
              continue;
            }

            if (next === "r") {
              flushBuffer();
              state = { color: "#ffffff", bold: false, italic: false, underline: false, strike: false };
              i++;
              continue;
            }

            if (next === "x" && i + 13 < line.length) {
              const hexDigits = [];
              let validHex = true;
              for (let j = i + 2; j <= i + 13; j += 2) {
                const separator = line[j];
                const hexChar = line[j + 1];
                if ((separator !== "&" && separator !== "§") || !/[0-9a-fA-F]/.test(hexChar || "")) {
                  validHex = false;
                  break;
                }
                hexDigits.push(hexChar);
              }
              if (validHex) {
                flushBuffer();
                state = {
                  color: `#${hexDigits.join("")}`,
                  bold: false,
                  italic: false,
                  underline: false,
                  strike: false
                };
                i += 13;
                continue;
              }
            }
          }

          if (current === "&" && line[i + 1] === "#" && /^[0-9a-fA-F]{6}$/.test(line.slice(i + 2, i + 8))) {
            flushBuffer();
            state = {
              color: `#${line.slice(i + 2, i + 8)}`,
              bold: false,
              italic: false,
              underline: false,
              strike: false
            };
            i += 7;
            continue;
          }

          buffer += current;
        }

        flushBuffer();
        return `<span class="mc-line">${html || "&nbsp;"}</span>`;
      }).join("");
    }

    function isMinecraftPreviewableField(element) {
      return !!getMinecraftPreviewConfig(element);
    }

    const MINECRAFT_PREVIEW_CODES = [
      { code: "&a", label: "Vert" },
      { code: "&b", label: "Aqua" },
      { code: "&c", label: "Rouge" },
      { code: "&d", label: "Rose" },
      { code: "&e", label: "Jaune" },
      { code: "&6", label: "Or" },
      { code: "&7", label: "Gris" },
      { code: "&f", label: "Blanc" },
      { code: "&l", label: "Gras" },
      { code: "&o", label: "Italique" },
      { code: "&n", label: "Souligné" },
      { code: "&m", label: "Barré" },
      { code: "&r", label: "Reset" }
    ];

    let activeMinecraftPreviewField = null;

    function getFieldLabelText(field) {
      if (!field?.id) return "";
      return document.querySelector(`label[for="${field.id}"]`)?.textContent?.trim() || "";
    }

    function isTextEntryField(element) {
      if (!element) return false;
      if (element.tagName === "TEXTAREA") return true;
      return element.tagName === "INPUT" && element.type === "text";
    }

    function getMinecraftPreviewConfig(field) {
      if (!isTextEntryField(field) || isGeneratorUiField(field)) return null;

      const id = String(field.id || "");
      const label = getFieldLabelText(field);
      const placeholder = String(field.getAttribute("placeholder") || "");
      const context = `${id} ${label} ${placeholder}`.toLowerCase();

      if (
        !context.includes("&")
        && !context.includes("lore")
        && !context.includes("message")
        && !context.includes("actionbar")
        && !context.includes("bossbar")
        && !context.includes("scoreboard")
        && !context.includes("nom affich")
        && !context.includes("nomaffiche")
        && !context.includes("titre")
        && !context.includes("title")
        && !context.includes("chat")
      ) {
        return null;
      }

      if (context.includes("lore") || context.includes("nom affich") || context.includes("nomaffiche")) {
        return {
          mode: "tooltip",
          title: "Aperçu tooltip Minecraft",
          hint: "Idéal pour les noms affichés et les lores."
        };
      }

      if (
        context.includes("message")
        || context.includes("chat")
        || context.includes("actionbar")
        || context.includes("bossbar")
        || context.includes("scoreboard")
      ) {
        return {
          mode: "chat",
          title: "Aperçu message Minecraft",
          hint: "Prévisualise les couleurs du texte en jeu."
        };
      }

      return {
        mode: "text",
        title: "Aperçu Minecraft",
        hint: "Rendu des codes couleur et styles."
      };
    }

    function getMinecraftInlinePreviewElement() {
      let preview = document.getElementById("minecraftInlinePreview");
      if (preview) return preview;

      preview = document.createElement("div");
      preview.id = "minecraftInlinePreview";
      preview.className = "minecraft-inline-preview";
      preview.setAttribute("aria-live", "polite");
      preview.innerHTML = `
        <div class="minecraft-inline-preview-header">
          <div>
            <div class="minecraft-inline-preview-title">Aperçu Minecraft</div>
            <div class="minecraft-inline-preview-hint">Rendu des codes couleur et styles.</div>
          </div>
          <button type="button" class="minecraft-inline-preview-close" aria-label="Masquer l'aperçu">&times;</button>
        </div>
        <div class="minecraft-code-palette" aria-label="Codes Minecraft rapides">
          ${MINECRAFT_PREVIEW_CODES.map(item => `
            <button type="button" class="minecraft-code-chip" data-minecraft-code="${escapeHtml(item.code)}" title="${escapeHtml(item.label)}">${escapeHtml(item.code)}</button>
          `).join("")}
        </div>
        <div class="minecraft-inline-render minecraft-format-preview"></div>
      `;

      preview.addEventListener("mousedown", event => {
        if (event.target.closest("button")) {
          event.preventDefault();
        }
      });

      preview.addEventListener("click", event => {
        const closeButton = event.target.closest(".minecraft-inline-preview-close");
        if (closeButton) {
          hideMinecraftInlinePreview();
          return;
        }

        const codeButton = event.target.closest("[data-minecraft-code]");
        if (!codeButton) return;

        insertMinecraftFormattingCode(codeButton.dataset.minecraftCode || "");
      });

      return preview;
    }

    function hideMinecraftInlinePreview() {
      const preview = document.getElementById("minecraftInlinePreview");
      if (preview) {
        preview.remove();
      }
      activeMinecraftPreviewField = null;
    }

    function insertMinecraftFormattingCode(code) {
      const field = activeMinecraftPreviewField;
      if (!field || !code || !document.contains(field)) return;

      const selectionStart = typeof field.selectionStart === "number" ? field.selectionStart : field.value.length;
      const selectionEnd = typeof field.selectionEnd === "number" ? field.selectionEnd : selectionStart;
      field.setRangeText(code, selectionStart, selectionEnd, "end");
      field.focus();
      field.dispatchEvent(new Event("input", { bubbles: true }));
      updateMinecraftInlinePreviewFromField(field);
    }

    function renderMinecraftInlinePreviewContent(field) {
      const rawValue = typeof field.value === "string" ? field.value : "";
      const cleanedValue = cleanQuotedText(rawValue).trim();
      return cleanedValue
        ? renderMinecraftFormattedText(cleanedValue)
        : "Le rendu apparaîtra ici.";
    }

    function getMinecraftPreviewAnchor(field) {
      return field.closest(".inline-field-group") || field;
    }

    function updateMinecraftInlinePreviewFromField(field) {
      const config = getMinecraftPreviewConfig(field);
      if (!config) {
        hideMinecraftInlinePreview();
        return;
      }

      const preview = getMinecraftInlinePreviewElement();
      const anchor = getMinecraftPreviewAnchor(field);
      activeMinecraftPreviewField = field;

      preview.className = `minecraft-inline-preview minecraft-inline-preview-${config.mode}`;
      preview.querySelector(".minecraft-inline-preview-title").textContent = config.title;
      preview.querySelector(".minecraft-inline-preview-hint").textContent = config.hint;
      preview.querySelector(".minecraft-inline-render").innerHTML = renderMinecraftInlinePreviewContent(field);

      if (preview.previousElementSibling !== anchor) {
        anchor.insertAdjacentElement("afterend", preview);
      }
    }

    function updateMinecraftSidebarPreviewFromField(field) {
      updateMinecraftInlinePreviewFromField(field);
    }


    function getSelectedFileName(id, fallback = "Aucune image") {
      const input = document.getElementById(id);
      return input?.files?.[0]?.name || input?.dataset?.savedFileName || fallback;
    }

    function getImagePreviewSource(previewId) {
      const preview = document.getElementById(previewId);
      const src = preview?.getAttribute("src") || "";
      return src.trim();
    }

    function setProjectImageState(inputId, previewId, { fileName = "", dataUrl = "" } = {}) {
      const input = document.getElementById(inputId);
      const preview = document.getElementById(previewId);

      if (input) {
        if (fileName) {
          input.dataset.savedFileName = fileName;
        } else {
          delete input.dataset.savedFileName;
        }
      }

      if (!preview) return;

      if (dataUrl) {
        preview.src = dataUrl;
        preview.style.display = "block";
        return;
      }

      preview.removeAttribute("src");
      preview.style.display = "none";
    }

    function collectProjectImages() {
      return PROJECT_IMAGE_FIELDS.reduce((images, { inputId, previewId }) => {
        const dataUrl = getImagePreviewSource(previewId);
        if (!dataUrl) {
          return images;
        }

        images[inputId] = {
          fileName: getSelectedFileName(inputId, ""),
          dataUrl
        };
        return images;
      }, {});
    }

    function restoreProjectImages(images = {}) {
      PROJECT_IMAGE_FIELDS.forEach(({ inputId, previewId }) => {
        const savedImage = images?.[inputId];
        setProjectImageState(inputId, previewId, {
          fileName: savedImage?.fileName || "",
          dataUrl: savedImage?.dataUrl || ""
        });
      });
    }

    function renderSavedImagePreviewHtml(label, previewId, alt) {
      const imageSource = getImagePreviewSource(previewId);
      if (!imageSource) {
        return `<div><strong>${escapeHtml(label)} :</strong> Aucune image</div>`;
      }

      return `
<div class="preview-image-block">
  <div><strong>${escapeHtml(label)} :</strong></div>
  <img src="${escapeHtml(imageSource)}" alt="${escapeHtml(alt)}">
</div>`;
    }

    function estimateDataUrlBytes(dataUrl) {
      const rawValue = String(dataUrl || "").trim();
      const base64Marker = ";base64,";
      const markerIndex = rawValue.indexOf(base64Marker);
      if (markerIndex < 0) {
        return rawValue.length;
      }

      const base64Payload = rawValue.slice(markerIndex + base64Marker.length);
      const paddingLength = base64Payload.endsWith("==")
        ? 2
        : (base64Payload.endsWith("=") ? 1 : 0);

      return Math.max(0, Math.floor((base64Payload.length * 3) / 4) - paddingLength);
    }

    async function buildCompactImageDataUrl(sourceDataUrl, {
      maxWidth = 128,
      maxHeight = 128,
      quality = 0.86,
      minQuality = 0.62,
      targetBytes = 120 * 1024,
      imageSmoothing = true
    } = {}) {
      const rawSource = String(sourceDataUrl || "").trim();
      if (!rawSource.startsWith("data:image/")) {
        return rawSource;
      }

      return await new Promise(resolve => {
        const image = new Image();

        image.onload = () => {
          const sourceBytes = estimateDataUrlBytes(rawSource);
          const naturalWidth = Math.max(1, image.naturalWidth || image.width || 1);
          const naturalHeight = Math.max(1, image.naturalHeight || image.height || 1);
          const baseScale = Math.min(1, maxWidth / naturalWidth, maxHeight / naturalHeight);
          const scaleCandidates = [1, 0.92, 0.84, 0.76, 0.68]
            .map(multiplier => Math.min(1, baseScale * multiplier))
            .filter((value, index, values) => value > 0.2 && values.indexOf(value) === index);
          const qualityCandidates = [];
          for (let currentQuality = quality; currentQuality >= minQuality; currentQuality -= 0.08) {
            qualityCandidates.push(Number(currentQuality.toFixed(2)));
          }
          if (!qualityCandidates.length) {
            qualityCandidates.push(Number(minQuality.toFixed(2)));
          }

          let bestCandidate = rawSource;
          let bestCandidateBytes = sourceBytes;

          for (const scale of scaleCandidates) {
            const width = Math.max(1, Math.round(naturalWidth * scale));
            const height = Math.max(1, Math.round(naturalHeight * scale));
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d");

            if (!context) {
              continue;
            }

            try {
              context.imageSmoothingEnabled = imageSmoothing;
              context.clearRect(0, 0, width, height);
              context.drawImage(image, 0, 0, width, height);
            } catch (error) {
              continue;
            }

            for (const candidateQuality of qualityCandidates) {
              let compacted = "";

              try {
                compacted = canvas.toDataURL("image/webp", candidateQuality);
              } catch (error) {
                compacted = "";
              }

              if (!compacted || compacted === "data:,") {
                continue;
              }

              const compactedBytes = estimateDataUrlBytes(compacted);
              if (compactedBytes >= bestCandidateBytes) {
                continue;
              }

              bestCandidate = compacted;
              bestCandidateBytes = compactedBytes;

              if (bestCandidateBytes <= targetBytes) {
                resolve(bestCandidate);
                return;
              }
            }
          }

          resolve(bestCandidateBytes < sourceBytes ? bestCandidate : rawSource);
        };

        image.onerror = () => {
          resolve(rawSource);
        };

        image.src = rawSource;
      });
    }

    async function readFileAsDataUrl(file) {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(String(event.target?.result || ""));
        reader.onerror = () => reject(reader.error || new Error("Lecture image impossible."));
        reader.readAsDataURL(file);
      });
    }

    async function normalizeProjectImagesForStorage(images = {}) {
      if (!images || typeof images !== "object" || Array.isArray(images)) {
        return {};
      }

      const normalizedImages = {};

      for (const [imageKey, imageValue] of Object.entries(images)) {
        if (!imageValue || typeof imageValue !== "object" || Array.isArray(imageValue)) {
          continue;
        }

        const rawDataUrl = String(imageValue.dataUrl || "").trim();
        const compressionOptions = PROJECT_IMAGE_COMPRESSION_OPTIONS[imageKey] || {
          maxWidth: 960,
          maxHeight: 960,
          quality: 0.78,
          minQuality: 0.58,
          targetBytes: 240 * 1024,
          imageSmoothing: true
        };
        const compactedDataUrl = rawDataUrl
          ? await buildCompactImageDataUrl(rawDataUrl, compressionOptions)
          : "";

        normalizedImages[imageKey] = {
          ...imageValue,
          dataUrl: compactedDataUrl || rawDataUrl
        };
      }

      return normalizedImages;
    }

    async function normalizeProjectStateForStorage(state) {
      if (!state || typeof state !== "object" || Array.isArray(state)) {
        return state;
      }

      return {
        ...state,
        images: await normalizeProjectImagesForStorage(state.images || {})
      };
    }

    function parseChancePercent(value) {
      const normalized = String(value).replace(",", ".").replace("%", "").trim();
      const parsed = Number.parseFloat(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function buildTextTable(headers, rows) {
      const widths = headers.map((header, index) => {
        const columnValues = rows.map(row => String(row[index] ?? ""));
        return Math.max(String(header).length, ...columnValues.map(value => value.length));
      });

      const formatRow = (row) => row.map((cell, index) => String(cell ?? "").padEnd(widths[index])).join(" | ");
      const separator = widths.map(width => "-".repeat(width)).join("-|-");

      return [formatRow(headers), separator, ...rows.map(formatRow)].join("\n");
    }

    function getTemplateLabelOverrides() {
      try {
        const raw = localStorage.getItem(TEMPLATE_LABEL_OVERRIDES_STORAGE_KEY);
        const parsed = JSON.parse(raw || "{}");
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    function getTemplateLabel(template) {
      const overrides = getTemplateLabelOverrides();
      const override = typeof overrides[template] === "string"
        ? overrides[template].trim()
        : "";
      return override || TEMPLATE_LABELS[template] || "Projet";
    }

    function getTemplateBadgeLabel(template) {
      return `Template actif : ${getTemplateLabel(template)}`;
    }

    function applyTemplateOptionLabels() {
      const templateSelect = document.getElementById("template");
      if (!templateSelect) return;

      [...templateSelect.options].forEach(option => {
        if (option.value && TEMPLATE_LABELS[option.value]) {
          option.textContent = getTemplateLabel(option.value);
        }
      });
    }

    function getProjectNameInputValue() {
      return document.getElementById("projectNameInput")?.value.trim() || "";
    }

    function deriveProjectName(template) {
      const fallbackLabel = getTemplateLabel(template);
      const candidateByTemplate = {
        commande: valeur("nomCommande", ""),
        gui: valeur("guiNom", ""),
        itemC: valeur("nomItem", ""),
        event: valeur("nomEvent", ""),
        metier: [
          document.getElementById("metierTypeFermier")?.checked ? "Métier Fermier" : "",
          document.getElementById("metierTypeChasseur")?.checked ? "Métier Chasseur" : "",
          document.getElementById("metierTypeMineur")?.checked ? "Métier Mineur" : "",
          document.getElementById("metierTypeBucheron")?.checked ? "Métier Bûcheron" : ""
        ].find(Boolean) || "",
        mobs: valeur("mobNom", ""),
        libre: valeur("libreNom", ""),
        caisse: valeur("caisseNom", ""),
        soundDesign: `Sound Design ${new Date().toLocaleDateString("fr-FR")}`
      };
      return candidateByTemplate[template] || fallbackLabel;
    }

    function getProjectDisplayName(state) {
      return state.projectName || deriveProjectName(state.template || "commande");
    }

    function getDefaultDynamicState() {
      return {
        messages: [
          { titre: "Message erreur", contenu: '"&cUne erreur est survenue."' },
          { titre: "Message permission", contenu: '"&cVous n’avez pas la permission."' }
        ],
        guiCommandeItems: [],
        guiTemplateItems: [],
        itemCustomCraftIngredients: [],
        eventConditions: [],
        eventMessages: [],
        metierItems: [],
        metierLevelRewards: [],
        metierGuiItems: [],
        rankUps: [],
        mobSpawns: [],
        mobDrops: [],
        libreSections: [],
        caisseRewards: [],
        soundDesignEntries: []
      };
    }

    function getDefaultProjectSnapshotState() {
      try {
        const parsed = JSON.parse(defaultProjectSnapshot || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    function getLocalProjectHistory() {
      try {
        const raw = localStorage.getItem(PROJECT_HISTORY_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function getWorkspaceProjects() {
      try {
        const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function getWorkspaceProjectById(projectId) {
      return getWorkspaceProjects().find(project => project.id === projectId) || null;
    }

    function getHistoryProjectScopeKey(workspaceProjectId = activeWorkspaceProjectId) {
      const normalizedProjectId = String(workspaceProjectId || "").trim();
      return normalizedProjectId || "__local__";
    }

    function getRememberedHistoryProjects() {
      try {
        const raw = localStorage.getItem(ACTIVE_HISTORY_PROJECTS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "{}");
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    function saveRememberedHistoryProjects(entriesByScope) {
      localStorage.setItem(ACTIVE_HISTORY_PROJECTS_STORAGE_KEY, JSON.stringify(entriesByScope));
    }

    function getRememberedHistoryProjectId(workspaceProjectId = activeWorkspaceProjectId) {
      const scopeKey = getHistoryProjectScopeKey(workspaceProjectId);
      const rememberedProjects = getRememberedHistoryProjects();
      return String(rememberedProjects[scopeKey] || "").trim();
    }

    function rememberHistoryProjectId(projectId, workspaceProjectId = activeWorkspaceProjectId) {
      const normalizedProjectId = String(projectId || "").trim();
      const scopeKey = getHistoryProjectScopeKey(workspaceProjectId);
      const rememberedProjects = getRememberedHistoryProjects();

      if (!normalizedProjectId) {
        delete rememberedProjects[scopeKey];
      } else {
        rememberedProjects[scopeKey] = normalizedProjectId;
      }

      if (Object.keys(rememberedProjects).length === 0) {
        localStorage.removeItem(ACTIVE_HISTORY_PROJECTS_STORAGE_KEY);
        return;
      }

      saveRememberedHistoryProjects(rememberedProjects);
    }

    function clearRememberedHistoryProjectId(workspaceProjectId = activeWorkspaceProjectId) {
      rememberHistoryProjectId("", workspaceProjectId);
    }

    function syncRememberedHistoryProjectForWorkspace(workspaceProjectId = activeWorkspaceProjectId) {
      const scopeWorkspaceProjectId = String(workspaceProjectId || "").trim();
      const nextMatchingEntry = getLocalProjectHistory().find((entry) => {
        const entryWorkspaceProjectId = String(entry?.projectId || "").trim();
        if (!scopeWorkspaceProjectId) {
          return !entryWorkspaceProjectId;
        }
        return entryWorkspaceProjectId === scopeWorkspaceProjectId;
      });

      if (nextMatchingEntry?.id) {
        rememberHistoryProjectId(nextMatchingEntry.id, scopeWorkspaceProjectId);
        return;
      }

      clearRememberedHistoryProjectId(scopeWorkspaceProjectId);
    }

    function resolveRequestedGuiPresetContext() {
      try {
        requestedGuiPresetId = window.sessionStorage.getItem(REQUESTED_GUI_PRESET_SESSION_KEY) || "";
      } catch (error) {
        requestedGuiPresetId = "";
      }
    }

    function resolveRequestedItemCustomPresetContext() {
      try {
        requestedItemCustomPresetId = window.sessionStorage.getItem(REQUESTED_ITEM_CUSTOM_PRESET_SESSION_KEY) || "";
      } catch (error) {
        requestedItemCustomPresetId = "";
      }
    }

    function resolveWorkspaceProjectContext() {
      const url = new URL(window.location.href);
      const projectIdFromUrl = url.searchParams.get("projectId");
      requestedHistoryProjectId = url.searchParams.get("cdcId") || "";
      resolveRequestedGuiPresetContext();
      resolveRequestedItemCustomPresetContext();
      const storedProjectId = localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
      const resolvedProjectId = projectIdFromUrl || storedProjectId || "";
      const project = resolvedProjectId ? getWorkspaceProjectById(resolvedProjectId) : null;

      activeWorkspaceProjectId = project?.id || "";
      activeWorkspaceProjectName = project?.name || "";

      if (activeWorkspaceProjectId) {
        localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, activeWorkspaceProjectId);
      } else {
        localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
      }

      if (!requestedHistoryProjectId) {
        requestedHistoryProjectId = getRememberedHistoryProjectId(activeWorkspaceProjectId);
      }
    }

    function syncWorkspaceProjectInUrl() {
      const url = new URL(window.location.href);
      if (activeWorkspaceProjectId) {
        url.searchParams.set("projectId", activeWorkspaceProjectId);
      } else {
        url.searchParams.delete("projectId");
      }
      if (currentProjectId) {
        url.searchParams.set("cdcId", currentProjectId);
      } else {
        url.searchParams.delete("cdcId");
      }
      window.history.replaceState({}, "", url.toString());
    }

    function populateWorkspaceProjectSelect() {
      const select = document.getElementById("workspaceProjectSelect");
      if (!select) return;

      const projects = getWorkspaceProjects().sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "fr", { sensitivity: "base" }));
      const hasProjects = projects.length > 0;

      select.innerHTML = hasProjects
        ? `<option value="">Choisir un projet...</option>${projects.map(project => `
            <option value="${escapeHtml(project.id)}">${escapeHtml(project.name || "Projet sans nom")}</option>
          `).join("")}`
        : `<option value="">Aucun projet disponible</option>`;

      select.disabled = !hasProjects;
      select.value = activeWorkspaceProjectId || "";
    }

    function setActiveWorkspaceProject(projectId) {
      const project = projectId ? getWorkspaceProjectById(projectId) : null;

      activeWorkspaceProjectId = project?.id || "";
      activeWorkspaceProjectName = project?.name || "";

      if (activeWorkspaceProjectId) {
        localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, activeWorkspaceProjectId);
      } else {
        localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
      }

      syncWorkspaceProjectInUrl();
      updateWorkspaceProjectUi();
      renderProjectHistory();
    }

    function handleWorkspaceProjectSelection() {
      const select = document.getElementById("workspaceProjectSelect");
      if (!select) return;
      setActiveWorkspaceProject(select.value);
    }

    function updateWorkspaceProjectUi() {
      const backToProjectLink = document.getElementById("backToProjectLink");
      const editorTopTabProject = document.getElementById("editorTopTabProject");
      const editorTopTabEditor = document.getElementById("editorTopTabEditor");
      const workspaceProjectSelect = document.getElementById("workspaceProjectSelect");

      if (backToProjectLink) {
        backToProjectLink.href = activeWorkspaceProjectId
          ? `./cdc-library.html?projectId=${encodeURIComponent(activeWorkspaceProjectId)}`
          : "./cdc-library.html";
      }

      if (editorTopTabProject) {
        editorTopTabProject.href = "./projects.html";
        editorTopTabProject.classList.remove("is-disabled");
      }

      if (editorTopTabEditor) {
        editorTopTabEditor.href = activeWorkspaceProjectId
          ? `./cdc-generator.html?projectId=${encodeURIComponent(activeWorkspaceProjectId)}`
          : "./cdc-generator.html";
      }

      if (workspaceProjectSelect) {
        workspaceProjectSelect.value = activeWorkspaceProjectId || "";
      }
    }

    function saveLocalProjectHistory(history) {
      localStorage.setItem(PROJECT_HISTORY_STORAGE_KEY, JSON.stringify(history));
    }

    function queueGeneratorRemoteSnapshotSync() {
      window.NeodiumCdcRemoteStore?.queueFullSync?.();
    }

    function syncGeneratorHistoryEntry(entry) {
      return window.NeodiumCdcRemoteStore?.syncHistoryEntry?.(entry);
    }

    function deleteGeneratorHistoryEntry(entryId) {
      return window.NeodiumCdcRemoteStore?.deleteHistoryEntry?.(entryId);
    }

    function formatProjectTimestamp(value) {
      if (!value) return "Date inconnue";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "Date inconnue";
      return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    function getHistoryEntryTimestampRank(entry) {
      const updatedTimestamp = Date.parse(String(entry?.updatedAt || ""));
      if (!Number.isNaN(updatedTimestamp)) {
        return updatedTimestamp;
      }

      const createdTimestamp = Date.parse(String(entry?.createdAt || ""));
      return Number.isNaN(createdTimestamp) ? 0 : createdTimestamp;
    }

    function normalizeHistoryProjectName(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    }

    function buildHistoryDuplicateKey(entry) {
      if (!entry || typeof entry !== "object") return "";

      const normalizedProjectName = normalizeHistoryProjectName(
        String(entry.projectName || "").trim() || deriveProjectName(entry.template || "commande")
      );
      if (!normalizedProjectName) {
        return "";
      }

      return [
        String(entry.projectId || "").trim() || "__local__",
        String(entry.template || "").trim() || "commande",
        normalizedProjectName
      ].join("::");
    }

    function dedupeCurrentHistoryProjects() {
      const history = getLocalProjectHistory();
      const scopeWorkspaceProjectId = String(activeWorkspaceProjectId || "").trim();
      const duplicatesByKey = new Map();

      history.forEach((entry) => {
        const entryWorkspaceProjectId = String(entry?.projectId || "").trim();
        const isInScope = scopeWorkspaceProjectId
          ? entryWorkspaceProjectId === scopeWorkspaceProjectId
          : !entryWorkspaceProjectId;

        if (!isInScope) return;

        const duplicateKey = buildHistoryDuplicateKey(entry);
        if (!duplicateKey) return;

        if (!duplicatesByKey.has(duplicateKey)) {
          duplicatesByKey.set(duplicateKey, []);
        }

        duplicatesByKey.get(duplicateKey).push(entry);
      });

      const duplicateIdToKeptId = new Map();

      duplicatesByKey.forEach((entries) => {
        if (!Array.isArray(entries) || entries.length < 2) return;

        const sortedEntries = [...entries].sort((a, b) => {
          const rankDifference = getHistoryEntryTimestampRank(b) - getHistoryEntryTimestampRank(a);
          if (rankDifference !== 0) {
            return rankDifference;
          }
          return String(b.id || "").localeCompare(String(a.id || ""));
        });

        const [keptEntry, ...duplicateEntries] = sortedEntries;
        duplicateEntries.forEach((entry) => {
          if (entry?.id && keptEntry?.id) {
            duplicateIdToKeptId.set(entry.id, keptEntry.id);
          }
        });
      });

      if (duplicateIdToKeptId.size === 0) {
        alert("Aucun doublon a supprimer pour ce projet.");
        return;
      }

      const duplicateGroupCount = new Set(duplicateIdToKeptId.values()).size;
      const confirmed = confirm(
        `Supprimer ${duplicateIdToKeptId.size} doublon${duplicateIdToKeptId.size > 1 ? "s" : ""} et garder ${duplicateGroupCount} version${duplicateGroupCount > 1 ? "s" : ""} la plus recente${duplicateGroupCount > 1 ? "s" : ""} ?`
      );
      if (!confirmed) return;

      const nextHistory = history.filter((entry) => !duplicateIdToKeptId.has(entry.id));
      saveLocalProjectHistory(nextHistory);
      queueGeneratorRemoteSnapshotSync();

      const nextCurrentProjectId = duplicateIdToKeptId.get(currentProjectId) || currentProjectId;
      if (nextCurrentProjectId !== currentProjectId) {
        currentProjectId = nextCurrentProjectId || null;
        lastAutosavedSnapshot = "";
      }

      const rememberedProjectId = getRememberedHistoryProjectId(scopeWorkspaceProjectId);
      const nextRememberedProjectId = duplicateIdToKeptId.get(rememberedProjectId) || rememberedProjectId;
      if (nextRememberedProjectId !== rememberedProjectId) {
        rememberHistoryProjectId(nextRememberedProjectId, scopeWorkspaceProjectId);
      } else {
        syncRememberedHistoryProjectForWorkspace(scopeWorkspaceProjectId);
      }

      renderProjectHistory();
      alert(`Doublons supprimes : ${duplicateIdToKeptId.size}.`);
    }

    function updateHistorySidebarState() {
      const templatePill = document.getElementById("currentProjectTemplatePill");
      const statusPill = document.getElementById("currentProjectStatus");
      const template = document.getElementById("template")?.value || "commande";

      if (templatePill) {
        templatePill.textContent = getTemplateLabel(template);
      }

      if (statusPill) {
        statusPill.textContent = currentProjectId ? "Projet actif" : "Nouveau brouillon";
      }
    }

    function renderProjectHistory() {
      const list = document.getElementById("projectHistoryList");
      const countBadge = document.getElementById("projectHistoryCount");
      if (!list) return;

      const search = document.getElementById("projectHistorySearch")?.value.trim().toLowerCase() || "";
      const sortMode = document.getElementById("projectHistorySort")?.value || "recent";
      const history = getLocalProjectHistory()
        .filter(project => !activeWorkspaceProjectId || project.projectId === activeWorkspaceProjectId)
        .filter(project => {
          if (!search) return true;
          const haystack = [
            project.projectName,
            getTemplateLabel(project.template),
            project.template
          ].join(" ").toLowerCase();
          return haystack.includes(search);
        });

      history.sort((a, b) => {
        if (sortMode === "oldest") {
          return String(a.updatedAt || "").localeCompare(String(b.updatedAt || ""));
        }
        if (sortMode === "name") {
          return String(a.projectName || "").localeCompare(String(b.projectName || ""), "fr", { sensitivity: "base" });
        }
        if (sortMode === "template") {
          const templateCompare = String(getTemplateLabel(a.template)).localeCompare(String(getTemplateLabel(b.template)), "fr", { sensitivity: "base" });
          return templateCompare !== 0
            ? templateCompare
            : String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
        }
        return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
      });

      updateHistorySidebarState();

      if (history.length === 0) {
        if (countBadge) {
          countBadge.textContent = "0";
        }
        list.innerHTML = `<div class="project-history-empty">Aucun projet local pour le moment.</div>`;
        return;
      }

      if (countBadge) {
        countBadge.textContent = String(history.length);
      }

      list.innerHTML = history.map(project => `
        <div class="project-history-item${project.id === currentProjectId ? " is-active" : ""}" onclick="openHistoryProject('${project.id}')">
          <div class="project-history-top">
            <div>
              <p class="project-history-title">${escapeHtml(project.projectName || "Projet sans nom")}</p>
            </div>
            <div class="project-history-actions">
              <button type="button" class="project-history-open" onclick="event.stopPropagation(); openHistoryProject('${project.id}')">Voir</button>
              <button type="button" class="project-history-delete" onclick="event.stopPropagation(); deleteHistoryProject('${project.id}')">Supprimer</button>
            </div>
          </div>
          <div class="project-history-meta-row">
            <span class="project-history-template">${escapeHtml(getTemplateLabel(project.template))}</span>
            <div class="project-history-meta">Modifié le ${escapeHtml(formatProjectTimestamp(project.updatedAt))}</div>
          </div>
        </div>
      `).join("");
    }

    function buildProjectSnapshot(state) {
      return JSON.stringify({
        projectId: state.projectId || "",
        template: state.template,
        projectName: state.projectName,
        theme: state.theme || "light",
        selection: state.selection || {},
        fields: state.fields,
        dynamic: state.dynamic,
        images: state.images || {}
      });
    }

    function hasMeaningfulProjectContent(state) {
      if (!state) return false;
      const snapshot = buildProjectSnapshot(state);
      if (!currentProjectId && snapshot === defaultProjectSnapshot) {
        return false;
      }
      if (getProjectNameInputValue()) return true;

      if (Object.values(state.images || {}).some(image => image?.dataUrl)) {
        return true;
      }

      const defaultSnapshotState = getDefaultProjectSnapshotState();
      const defaultFields = defaultSnapshotState.fields || {};
      const hasFieldValue = Object.entries(state.fields || {}).some(([id, value]) => {
        if (typeof value === "string") {
          return value.trim() !== "" || defaultFields[id] !== value;
        }
        return defaultFields[id] !== value;
      });

      if (hasFieldValue) return true;

      const defaultDynamic = defaultSnapshotState.dynamic || getDefaultDynamicState();
      if (JSON.stringify(state.dynamic || {}) !== JSON.stringify(defaultDynamic)) {
        return true;
      }

      return Boolean(currentProjectId);
    }

    async function getCloudAutosaveState() {
      const cloudSync = window.NeodiumCloudSync;
      if (!cloudSync || typeof cloudSync.getState !== "function") {
        return null;
      }

      try {
        await cloudSync.whenReady?.();
      } catch (error) {
        return null;
      }

      return cloudSync.getState?.() || null;
    }

    function isCloudAutosaveAvailable(state) {
      return state?.status === "ready" || state?.status === "syncing";
    }

    async function performLocalAutosave() {
      const cloudState = await getCloudAutosaveState();
      if (!isCloudAutosaveAvailable(cloudState)) {
        return false;
      }

      const state = collectProjectState();
      if (!hasMeaningfulProjectContent(state)) {
        return false;
      }

      const snapshot = buildProjectSnapshot(state);
      if (snapshot === lastAutosavedSnapshot) {
        return false;
      }

      await saveCurrentProjectToHistory(false, state, {
        syncDirectory: false,
        ensureAutoGuiPreset: false,
        ensureAutoItemCustomPreset: false
      });
      return true;
    }

    function scheduleLocalAutosave() {
      const now = Date.now();
      if (!autosaveStartedAt) {
        autosaveStartedAt = now;
      }

      const elapsed = now - autosaveStartedAt;
      const remainingBeforeForcedSave = Math.max(0, LOCAL_AUTOSAVE_MAX_DELAY - elapsed);
      const delay = Math.min(LOCAL_AUTOSAVE_IDLE_DELAY, remainingBeforeForcedSave);

      if (autosaveTimeoutId) {
        clearTimeout(autosaveTimeoutId);
      }

      autosaveTimeoutId = window.setTimeout(() => {
        autosaveTimeoutId = null;
        autosaveStartedAt = 0;
        void performLocalAutosave();
      }, delay);
    }

    function cancelLocalAutosave() {
      if (autosaveTimeoutId) {
        clearTimeout(autosaveTimeoutId);
        autosaveTimeoutId = null;
      }
      autosaveStartedAt = 0;
    }

    function cancelRecoveryDraftSave() {
      if (!recoveryDraftTimeoutId) return;
      clearTimeout(recoveryDraftTimeoutId);
      recoveryDraftTimeoutId = null;
    }

    function clearRecoveryDraft(snapshot = "") {
      cancelRecoveryDraftSave();
      lastRecoveryDraftSnapshot = snapshot;

      try {
        localStorage.removeItem(RECOVERY_DRAFT_STORAGE_KEY);
      } catch (error) {
        // Ignore storage access issues to keep the editor usable.
      }
    }

    function buildRecoveryDraftPayload(state, { includeImages = true } = {}) {
      const nextState = includeImages
        ? state
        : {
            ...state,
            images: {}
          };

      return {
        version: 1,
        savedAt: new Date().toISOString(),
        projectId: nextState?.id || "",
        state: nextState,
        snapshot: buildProjectSnapshot(nextState)
      };
    }

    function readRecoveryDraft() {
      try {
        const raw = localStorage.getItem(RECOVERY_DRAFT_STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || !parsed.state || typeof parsed.state !== "object") {
          localStorage.removeItem(RECOVERY_DRAFT_STORAGE_KEY);
          return null;
        }

        const savedAtTimestamp = Date.parse(String(parsed.savedAt || ""));
        if (savedAtTimestamp && Date.now() - savedAtTimestamp > RECOVERY_DRAFT_MAX_AGE) {
          localStorage.removeItem(RECOVERY_DRAFT_STORAGE_KEY);
          return null;
        }

        return parsed;
      } catch (error) {
        return null;
      }
    }

    function persistRecoveryDraft({ force = false } = {}) {
      const state = collectProjectState();
      if (!hasMeaningfulProjectContent(state)) {
        clearRecoveryDraft();
        return false;
      }

      const snapshot = buildProjectSnapshot(state);
      if (!force && snapshot === lastRecoveryDraftSnapshot) {
        return false;
      }

      const payload = buildRecoveryDraftPayload(state);

      try {
        localStorage.setItem(RECOVERY_DRAFT_STORAGE_KEY, JSON.stringify(payload));
        lastRecoveryDraftSnapshot = payload.snapshot;
        return true;
      } catch (error) {
        try {
          const lighterPayload = buildRecoveryDraftPayload(state, { includeImages: false });
          localStorage.setItem(RECOVERY_DRAFT_STORAGE_KEY, JSON.stringify(lighterPayload));
          lastRecoveryDraftSnapshot = lighterPayload.snapshot;
          return true;
        } catch (fallbackError) {
          return false;
        }
      }
    }

    function scheduleRecoveryDraftSave() {
      cancelRecoveryDraftSave();
      recoveryDraftTimeoutId = window.setTimeout(() => {
        recoveryDraftTimeoutId = null;
        persistRecoveryDraft();
      }, RECOVERY_DRAFT_IDLE_DELAY);
    }

    function restoreRecoveryDraftIfNeeded() {
      const draft = readRecoveryDraft();
      if (!draft?.state) {
        return false;
      }

      const draftState = draft.state;
      const draftProjectId = String(draftState.id || "").trim();
      const currentState = collectProjectState();
      const currentSnapshot = buildProjectSnapshot(currentState);
      const loadedProjectId = String(currentProjectId || "").trim();
      const hasRequestedPresetContext = Boolean(requestedGuiPresetId || requestedItemCustomPresetId);

      if (loadedProjectId) {
        if (!draftProjectId || loadedProjectId !== draftProjectId) {
          return false;
        }
      } else if (hasMeaningfulProjectContent(currentState) && currentSnapshot !== defaultProjectSnapshot) {
        return false;
      } else if (hasRequestedPresetContext) {
        return false;
      }

      const draftSnapshot = String(draft.snapshot || buildProjectSnapshot(draftState));
      if (currentSnapshot === draftSnapshot) {
        lastRecoveryDraftSnapshot = draftSnapshot;
        return false;
      }

      loadProjectState(draftState);
      lastRecoveryDraftSnapshot = draftSnapshot;
      return true;
    }

    function populateMinecraftSoundSelect(soundKeys) {
      const datalist = document.getElementById("soundDesignSonCommandeOptions");
      if (!datalist) return;
      datalist.innerHTML = "";

      soundKeys.forEach(key => {
        const option = document.createElement("option");
        option.value = key;
        datalist.appendChild(option);
      });
    }

    function getAvailableMinecraftSoundKeys() {
      if (minecraftSoundDefinitions) {
        return Object.keys(minecraftSoundDefinitions).sort((a, b) => a.localeCompare(b));
      }
      return BUILTIN_MINECRAFT_SOUND_EVENTS;
    }

    function populateMinecraftSoundSelectElement(datalistElement, soundKeys) {
      if (!datalistElement) return;
      datalistElement.innerHTML = "";

      soundKeys.forEach(key => {
        const option = document.createElement("option");
        option.value = key;
        datalistElement.appendChild(option);
      });
    }

    function getAvailableMinecraftItemKeys() {
      return [...new Set([...BUILTIN_MINECRAFT_ITEM_KEYS, ...CUSTOM_MINECRAFT_ITEM_KEYS])]
        .sort((a, b) => a.localeCompare(b));
    }

    function populateMinecraftItemOptions() {
      const datalist = document.getElementById("minecraftItemOptions");
      if (!datalist) return;
      datalist.innerHTML = "";

      getAvailableMinecraftItemKeys().forEach(key => {
        const option = document.createElement("option");
        option.value = key;
        datalist.appendChild(option);
      });
    }

    function setGuiPresetStatus(message) {
      const status = document.getElementById("guiPresetStatus");
      if (status) {
        status.textContent = message;
      }
    }

    function setGuiCommandePresetStatus(message) {
      const status = document.getElementById("guiCommandePresetStatus");
      if (status) {
        status.textContent = message;
      }
    }

    function setItemCustomPresetStatus(message) {
      const status = document.getElementById("itemCustomPresetStatus");
      if (status) {
        status.textContent = message;
      }
    }

    function slugifyGuiPresetName(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "gui-preset";
    }

    function getGuiPresetOverrides() {
      try {
        const raw = localStorage.getItem(GUI_PRESET_OVERRIDES_STORAGE_KEY);
        const parsed = JSON.parse(raw || "{}");
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    function getGuiPresetHiddenIds() {
      try {
        const raw = localStorage.getItem(GUI_PRESET_HIDDEN_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function getCustomGuiPresets() {
      try {
        const raw = localStorage.getItem(GUI_CUSTOM_PRESETS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function saveCustomGuiPresets(presets) {
      localStorage.setItem(GUI_CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(presets));
    }

    function getGuiPresetStorageId(preset, index) {
      return preset?.id || `gui-preset-${slugifyGuiPresetName(preset?.name || `preset-${index + 1}`)}-${index}`;
    }

    function getAvailableGuiPresets() {
      const overrides = getGuiPresetOverrides();
      const hiddenIds = new Set(getGuiPresetHiddenIds());
      const mergedPresets = new Map();

      GUI_PRESETS_MANIFEST.forEach((preset, index) => {
        const id = getGuiPresetStorageId(preset, index);
        mergedPresets.set(id, { ...preset, id });
      });

      GUI_CUSTOM_PRESETS_FILE.forEach((preset, index) => {
        const id = getGuiPresetStorageId(preset, index);
        mergedPresets.set(id, { ...preset, id });
      });

      getCustomGuiPresets().forEach((preset, index) => {
        const id = getGuiPresetStorageId(preset, index);
        mergedPresets.set(id, { ...preset, id });
      });

      return [...mergedPresets.values()].map((preset, index) => {
        const id = getGuiPresetStorageId(preset, index);
        if (hiddenIds.has(id)) {
          return null;
        }

        const override = overrides[id] || {};
        return {
          ...preset,
          id,
          name: override.name || preset?.name || `Preset ${index + 1}`
        };
      }).filter(Boolean);
    }

    function getGuiPresetFields() {
      return [
        "guiNom",
        "guiNomAffiche",
        "ouvertureCommande",
        "ouvertureNPC",
        "ouvertureItem",
        "ouvertureAutreCheck",
        "guiCommande",
        "guiNPCNom",
        "guiNPCCoordonnee",
        "guiItemOuverture",
        "guiOuvertureAutre",
        "guiTaille",
        "guiTailleAutre",
        "lienTextureGUI",
        "guiObjectif"
      ];
    }

    function collectGuiPresetState() {
      const fields = {};

      getGuiPresetFields().forEach(id => {
        const field = document.getElementById(id);
        if (!field) return;
        fields[id] = field.type === "checkbox" ? field.checked : field.value;
      });

      const resolvedName = document.getElementById("guiPresetName")?.value.trim()
        || document.getElementById("guiNom")?.value.trim()
        || document.getElementById("guiNomAffiche")?.value.trim()
        || "GUI sans nom";

      return {
        version: 1,
        type: "gui-preset",
        id: slugifyGuiPresetName(resolvedName),
        name: resolvedName,
        template: "gui",
        fields,
        dynamic: {
          guiTemplateItems: recupererItemsGUITemplate()
        }
      };
    }

    function upsertGuiPresetInManifest(preset) {
      if (!preset || typeof preset !== "object") return;
      const presetId = preset.id || slugifyGuiPresetName(preset.name || "");
      const existingIndex = GUI_PRESETS_MANIFEST.findIndex(entry => {
        const entryId = entry?.id || slugifyGuiPresetName(entry?.name || "");
        return entryId === presetId;
      });

      if (existingIndex >= 0) {
        GUI_PRESETS_MANIFEST.splice(existingIndex, 1, { ...preset, id: presetId });
      } else {
        GUI_PRESETS_MANIFEST.push({ ...preset, id: presetId });
      }
    }

    function upsertCustomGuiPreset(preset) {
      if (!preset || typeof preset !== "object") return;
      const presetId = preset.id || slugifyGuiPresetName(preset.name || "");
      const presets = getCustomGuiPresets();
      const nextPreset = { ...preset, id: presetId };
      const existingIndex = presets.findIndex(entry => {
        const entryId = entry?.id || slugifyGuiPresetName(entry?.name || "");
        return entryId === presetId;
      });

      if (existingIndex >= 0) {
        presets.splice(existingIndex, 1, nextPreset);
      } else {
        presets.push(nextPreset);
      }

      saveCustomGuiPresets(presets);
    }

    function upsertGuiCustomPresetFileEntry(preset) {
      if (!preset || typeof preset !== "object") return;
      const presetId = preset.id || slugifyGuiPresetName(preset.name || "");
      const nextPreset = { ...preset, id: presetId };
      const existingIndex = GUI_CUSTOM_PRESETS_FILE.findIndex(entry => {
        const entryId = entry?.id || slugifyGuiPresetName(entry?.name || "");
        return entryId === presetId;
      });

      if (existingIndex >= 0) {
        GUI_CUSTOM_PRESETS_FILE.splice(existingIndex, 1, nextPreset);
      } else {
        GUI_CUSTOM_PRESETS_FILE.push(nextPreset);
      }
    }

    function resetGuiTemplateState() {
      getGuiPresetFields().forEach(id => {
        const field = document.getElementById(id);
        if (!field) return;
        if (field.type === "checkbox") {
          field.checked = false;
        } else if (id === "guiTaille") {
          field.value = "3 lignes";
        } else {
          field.value = "";
        }
      });

      setProjectImageState("guiImage", "previewImageTemplate");

      clearElement("guiItemsTemplateContainer");
      guiTemplateItemIndex = 0;
      guiTemplateLoreVariantIndex = 0;
      updateOuvertureFields();
      updateGuiTailleField();
      updateGuiCommandeVisualization();
      updateGuiTemplateVisualization();
    }

    function applyGuiPreset(preset) {
      if (!preset || typeof preset !== "object") return;

      const templateSelect = document.getElementById("template");
      if (templateSelect) {
        templateSelect.value = "gui";
      }
      switchTemplate();
      resetGuiTemplateState();

      Object.entries(preset.fields || {}).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (!field) return;
        if (field.type === "checkbox") {
          field.checked = Boolean(value);
        } else {
          field.value = value ?? "";
        }
      });

      (preset.dynamic?.guiTemplateItems || []).forEach(item => ajouterItemGUITemplate(item));

      const guiPresetName = document.getElementById("guiPresetName");
      if (guiPresetName) {
        guiPresetName.value = preset.name || "";
      }

      updateOuvertureFields();
      updateGuiTailleField();
      refreshAfterStructureChange();
      setGuiPresetStatus(`Preset chargé : ${preset.name || "Sans nom"}`);
    }

    function populateGuiPresetSelect(selectId) {
      const select = document.getElementById(selectId);
      if (!select) return;
      const presets = getAvailableGuiPresets();

      select.innerHTML = "";

      if (!presets.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Aucun preset disponible";
        select.appendChild(option);
        updateAllGuiItemCustomPresetSelectors();
        return;
      }

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Choisir un preset...";
      select.appendChild(defaultOption);

      presets.forEach((preset, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = preset.name || `Preset ${index + 1}`;
        select.appendChild(option);
      });
    }

    function populateGuiPresetLibrary() {
      populateGuiPresetSelect("guiPresetSelect");
    }

    function populateGuiCommandePresetLibrary() {
      populateGuiPresetSelect("guiCommandePresetSelect");
    }

    function selectGuiPresetInLibraries(presetId) {
      ["guiPresetSelect", "guiCommandePresetSelect"].forEach(selectId => {
        selectGuiPresetInLibrary(selectId, presetId);
      });
    }

    function selectGuiPresetInLibrary(selectId, presetId) {
      const select = document.getElementById(selectId);
      if (!select) return false;

      const normalizedPresetId = String(presetId || "").trim();
      if (!normalizedPresetId) {
        select.value = "";
        return false;
      }

      const presets = getAvailableGuiPresets();
      const savedIndex = presets.findIndex(entry => String(entry.id || "").trim() === normalizedPresetId);
      if (savedIndex < 0) {
        select.value = "";
        return false;
      }

      select.value = String(savedIndex);
      return true;
    }

    function registerGuiPresetInApp(preset) {
      upsertCustomGuiPreset({
        ...preset
      });
      upsertGuiCustomPresetFileEntry({
        ...preset
      });

      const hiddenIds = getGuiPresetHiddenIds().filter(id => id !== preset.id);
      localStorage.setItem(GUI_PRESET_HIDDEN_STORAGE_KEY, JSON.stringify(hiddenIds));

      const overrides = getGuiPresetOverrides();
      if (overrides[preset.id]) {
        delete overrides[preset.id];
        localStorage.setItem(GUI_PRESET_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
      }

      populateGuiPresetLibrary();
      populateGuiCommandePresetLibrary();
      selectGuiPresetInLibraries(preset.id);
    }

    async function saveGuiPresetToLibrary(preset, setStatus) {
      try {
        registerGuiPresetInApp(preset);
        const cloudSync = window.NeodiumCloudSync;

        if (!cloudSync || typeof cloudSync.getState !== "function") {
          setStatus("Preset enregistré dans la bibliothèque du navigateur.");
          return;
        }

        await cloudSync.whenReady?.();
        const state = cloudSync.getState();

        if (state?.status === "ready") {
          await cloudSync.forceSync?.();
          const syncedState = cloudSync.getState?.() || state;
          if (syncedState?.status === "error") {
            setStatus(syncedState.message || "Preset enregistré en local, mais la synchronisation cloud a échoué.");
            return;
          }

          const emailSuffix = syncedState.email ? ` (${syncedState.email})` : "";
          setStatus(`Preset enregistré dans Cloud Neodium${emailSuffix}.`);
          return;
        }

        if (state?.status === "syncing" || state?.status === "booting") {
          setStatus("Preset enregistré. La synchronisation cloud est en cours.");
          return;
        }

        if (state?.status === "signed_out") {
          setStatus("Preset enregistré dans la bibliothèque locale. Connecte Cloud Neodium pour l'envoyer sur le cloud partagé.");
          return;
        }

        setStatus("Preset enregistré dans la bibliothèque locale. Le cloud n'est pas encore disponible.");
      } catch (error) {
        console.error("[Neodium] Sauvegarde preset GUI impossible", error);
        setStatus("Preset enregistré dans la bibliothèque locale, mais la synchronisation cloud a échoué.");
      }
    }

    function chargerGuiPresetSelection() {
      const select = document.getElementById("guiPresetSelect");
      const presets = getAvailableGuiPresets();
      if (!select || select.value === "") {
        setGuiPresetStatus("Sélectionne un preset GUI à charger.");
        return;
      }

      const preset = presets[Number.parseInt(select.value, 10)];
      if (!preset) {
        setGuiPresetStatus("Preset introuvable dans le manifest.");
        return;
      }

      applyGuiPreset(preset);
    }

    function exportCurrentGuiAsPreset() {
      const preset = collectGuiPresetState();
      void saveGuiPresetToLibrary(preset, setGuiPresetStatus);
    }

    function collectGuiCommandePresetState() {
      const resolvedName = document.getElementById("guiCommandePresetName")?.value.trim()
        || document.getElementById("nomGUICommande")?.value.trim()
        || "GUI commande sans nom";

      return {
        version: 1,
        type: "gui-preset",
        sourceTemplate: "commande",
        id: slugifyGuiPresetName(resolvedName),
        name: resolvedName,
        template: "gui",
        fields: {
          guiNom: document.getElementById("nomGUICommande")?.value.trim() || "",
          guiTaille: document.getElementById("tailleGUICommande")?.value || "3 lignes",
          lienTextureGUI: document.getElementById("textureGUICommande")?.value.trim() || ""
        },
        dynamic: {
          guiTemplateItems: recupererItemsGUICommande()
        }
      };
    }

    function applyGuiCommandePreset(preset) {
      if (!preset || typeof preset !== "object") return;

      const commandName = preset.fields?.guiNom ?? preset.fields?.nomGUICommande ?? "";
      const commandSize = preset.fields?.guiTaille ?? preset.fields?.tailleGUICommande ?? "3 lignes";
      const commandTexture = preset.fields?.lienTextureGUI ?? preset.fields?.textureGUICommande ?? "";
      const items = preset.dynamic?.guiTemplateItems || preset.dynamic?.guiCommandeItems || [];

      const nameField = document.getElementById("nomGUICommande");
      if (nameField) {
        nameField.value = commandName;
      }

      const sizeField = document.getElementById("tailleGUICommande");
      if (sizeField) {
        sizeField.value = commandSize;
      }

      const textureField = document.getElementById("textureGUICommande");
      if (textureField) {
        textureField.value = commandTexture;
      }

      const presetNameField = document.getElementById("guiCommandePresetName");
      if (presetNameField) {
        presetNameField.value = preset.name || "";
      }

      clearElement("guiItemsCommandeContainer");
      guiCommandeItemIndex = 0;
      guiCommandeLoreVariantIndex = 0;
      items.forEach(item => ajouterItemGUICommande(item));

      refreshAfterStructureChange();
      updateGuiCommandeVisualization();
      setGuiCommandePresetStatus(`Preset chargé : ${preset.name || "Sans nom"}`);
    }

    function chargerGuiCommandePresetSelection() {
      const select = document.getElementById("guiCommandePresetSelect");
      const presets = getAvailableGuiPresets();
      if (!select || select.value === "") {
        setGuiCommandePresetStatus("Sélectionne un preset GUI à charger.");
        return;
      }

      const preset = presets[Number.parseInt(select.value, 10)];
      if (!preset) {
        setGuiCommandePresetStatus("Preset introuvable dans la bibliothèque.");
        return;
      }

      applyGuiCommandePreset(preset);
    }

    function exportCurrentGuiCommandeAsPreset() {
      const preset = collectGuiCommandePresetState();
      void saveGuiPresetToLibrary(preset, setGuiCommandePresetStatus);
    }

    function getAutoGuiPresetName(projectName) {
      const resolvedProjectName = String(projectName || "").trim() || "Sans nom";
      return `GUI ${resolvedProjectName}`;
    }

    function hasSelectedGuiPreset(selectId) {
      const select = document.getElementById(selectId);
      return Boolean(select && select.value !== "");
    }

    function getSelectedGuiPreset(selectId) {
      const select = document.getElementById(selectId);
      if (!select || select.value === "") {
        return null;
      }

      const presetIndex = Number.parseInt(select.value, 10);
      if (!Number.isFinite(presetIndex)) {
        return null;
      }

      return getAvailableGuiPresets()[presetIndex] || null;
    }

    function getSelectedGuiPresetId(selectId) {
      return String(getSelectedGuiPreset(selectId)?.id || "").trim();
    }

    function buildAutoGuiPresetForSavedProject(state, projectName) {
      const autoName = getAutoGuiPresetName(projectName);

      if (state?.template === "gui") {
        const preset = collectGuiPresetState();
        return {
          ...preset,
          id: slugifyGuiPresetName(autoName),
          name: autoName
        };
      }

      if (state?.template === "commande") {
        const preset = collectGuiCommandePresetState();
        return {
          ...preset,
          id: slugifyGuiPresetName(autoName),
          name: autoName
        };
      }

      return null;
    }

    function buildSelectedGuiPresetForSavedProject(state, selectedPreset) {
      if (!selectedPreset || !state || (state.template !== "gui" && state.template !== "commande")) {
        return null;
      }

      const preset = state.template === "commande"
        ? collectGuiCommandePresetState()
        : collectGuiPresetState();

      return {
        ...preset,
        id: selectedPreset.id || slugifyGuiPresetName(selectedPreset.name || preset.name || ""),
        name: selectedPreset.name || preset.name
      };
    }

    async function ensureGuiPresetForSavedProject(state, projectName) {
      if (!state || (state.template !== "gui" && state.template !== "commande")) {
        return false;
      }

      const isCommandeGui = state.template === "commande";
      const selectId = isCommandeGui ? "guiCommandePresetSelect" : "guiPresetSelect";
      const selectedPreset = getSelectedGuiPreset(selectId);
      const presetNameField = document.getElementById(isCommandeGui ? "guiCommandePresetName" : "guiPresetName");
      const setStatus = isCommandeGui ? setGuiCommandePresetStatus : setGuiPresetStatus;

      if (selectedPreset) {
        const presetToUpdate = buildSelectedGuiPresetForSavedProject(state, selectedPreset);
        if (!presetToUpdate) {
          return false;
        }

        if (presetNameField) {
          presetNameField.value = presetToUpdate.name || "";
        }

        await saveGuiPresetToLibrary(presetToUpdate, message => {
          setStatus(`Preset GUI sélectionné : ${message}`);
        });
        return true;
      }

      const autoPreset = buildAutoGuiPresetForSavedProject(state, projectName);
      if (!autoPreset) {
        return false;
      }

      if (presetNameField) {
        presetNameField.value = autoPreset.name;
      }

      await saveGuiPresetToLibrary(autoPreset, message => {
        setStatus(`Preset GUI auto : ${message}`);
      });

      return true;
    }

    function getAutoItemCustomPresetName(projectName) {
      const resolvedProjectName = String(projectName || "").trim() || "Sans nom";
      return `Item Custom ${resolvedProjectName}`;
    }

    function buildAutoItemCustomPresetForSavedProject(state, projectName) {
      if (state?.template !== "itemC") {
        return null;
      }

      const autoName = getAutoItemCustomPresetName(projectName);
      const preset = collectItemCustomPresetState();
      return {
        ...preset,
        id: getItemCustomPresetStorageId({ name: autoName }),
        name: autoName
      };
    }

    function getItemCustomPresetOverrides() {
      try {
        const raw = localStorage.getItem(ITEM_CUSTOM_PRESET_OVERRIDES_STORAGE_KEY);
        const parsed = JSON.parse(raw || "{}");
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    function getItemCustomPresetHiddenIds() {
      try {
        const raw = localStorage.getItem(ITEM_CUSTOM_PRESET_HIDDEN_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function getItemCustomPresetEntryStorageKey(presetId) {
      return `${ITEM_CUSTOM_PRESET_ENTRY_STORAGE_PREFIX}${presetId}`;
    }

    function getStoredItemCustomPresetEntryKeys() {
      const keys = [];

      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key && key.startsWith(ITEM_CUSTOM_PRESET_ENTRY_STORAGE_PREFIX)) {
          keys.push(key);
        }
      }

      return keys.sort((a, b) => a.localeCompare(b));
    }

    function migrateLegacyItemCustomPresetsStorage() {
      try {
        const raw = localStorage.getItem(ITEM_CUSTOM_PRESETS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        if (!Array.isArray(parsed) || !parsed.length) {
          return;
        }

        parsed.forEach((preset, index) => {
          if (!preset || typeof preset !== "object") return;
          const presetId = getItemCustomPresetStorageId(preset, index);
          localStorage.setItem(getItemCustomPresetEntryStorageKey(presetId), JSON.stringify({ ...preset, id: presetId }));
        });

        localStorage.removeItem(ITEM_CUSTOM_PRESETS_STORAGE_KEY);
      } catch (error) {
        console.warn("[Neodium] Migration legacy presets Item Custom impossible", error);
      }
    }

    function getCustomItemCustomPresets() {
      migrateLegacyItemCustomPresetsStorage();

      const presets = getStoredItemCustomPresetEntryKeys().map((storageKey) => {
        try {
          const raw = localStorage.getItem(storageKey);
          const parsed = JSON.parse(raw || "{}");
          return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
        } catch (error) {
          return null;
        }
      }).filter(Boolean);

      if (presets.length) {
        return presets;
      }

      try {
        const raw = localStorage.getItem(ITEM_CUSTOM_PRESETS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function saveCustomItemCustomPresets(presets) {
      const normalizedPresets = Array.isArray(presets) ? presets : [];
      const nextIds = new Set();

      normalizedPresets.forEach((preset, index) => {
        if (!preset || typeof preset !== "object") return;
        const presetId = getItemCustomPresetStorageId(preset, index);
        nextIds.add(presetId);
        localStorage.setItem(
          getItemCustomPresetEntryStorageKey(presetId),
          JSON.stringify({ ...preset, id: presetId })
        );
      });

      getStoredItemCustomPresetEntryKeys().forEach((storageKey) => {
        const presetId = storageKey.slice(ITEM_CUSTOM_PRESET_ENTRY_STORAGE_PREFIX.length);
        if (!nextIds.has(presetId)) {
          localStorage.removeItem(storageKey);
        }
      });

      if (localStorage.getItem(ITEM_CUSTOM_PRESETS_STORAGE_KEY) != null) {
        localStorage.removeItem(ITEM_CUSTOM_PRESETS_STORAGE_KEY);
      }
    }

    function getItemCustomPresetStorageId(preset, index) {
      return preset?.id || `item-custom-preset-${slugifyGuiPresetName(preset?.name || `preset-${index + 1}`)}`;
    }

    function getAvailableItemCustomPresets() {
      const overrides = getItemCustomPresetOverrides();
      const hiddenIds = new Set(getItemCustomPresetHiddenIds());
      const mergedPresets = new Map();

      ITEM_CUSTOM_PRESETS_MANIFEST.forEach((preset, index) => {
        const id = getItemCustomPresetStorageId(preset, index);
        mergedPresets.set(id, { ...preset, id });
      });

      ITEM_CUSTOM_CUSTOM_PRESETS_FILE.forEach((preset, index) => {
        const id = getItemCustomPresetStorageId(preset, index);
        mergedPresets.set(id, { ...preset, id });
      });

      getCustomItemCustomPresets().forEach((preset, index) => {
        const id = getItemCustomPresetStorageId(preset, index);
        mergedPresets.set(id, { ...preset, id });
      });

      return [...mergedPresets.values()].map((preset, index) => {
        const id = getItemCustomPresetStorageId(preset, index);
        if (hiddenIds.has(id)) {
          return null;
        }

        const override = overrides[id] || {};
        return {
          ...preset,
          id,
          name: override.name || preset?.name || `Preset ${index + 1}`
        };
      }).filter(Boolean);
    }

    function getItemCustomPresetFields() {
      return [
        "nomItem",
        "itemMc",
        "typeArme",
        "typeOutil",
        "typeObjet",
        "typeConsommable",
        "typeCle",
        "typeArmure",
        "typeAutre",
        "selectTypeAutre",
        "itemRole",
        "obtentionCraft",
        "obtentionRecompense",
        "obtentionBoutique",
        "obtentionShop",
        "obtentionEvent",
        "obtentionAutre",
        "craftRecipeItemCustom",
        "selectObtentionRecompense",
        "selectObtentionBoutiqueCategory",
        "selectObtentionBoutiquePrice",
        "selectObtentionBoutiqueCondition",
        "selectObtentionShopCategory",
        "selectObtentionShopPrice",
        "selectObtentionShopCurrency",
        "selectObtentionShopCondition",
        "selectObtentionEventName",
        "selectObtentionEventMethod",
        "selectObtentionEventCondition",
        "selectObtentionAutre",
        "linkTexture",
        "nameItem",
        "loreItem",
        "durabiliteItem",
        "effectDescription",
        "utilisationClickDroit",
        "utilisationClickGauche",
        "utilisationPassif",
        "selectClicDroit",
        "selectClicGauche",
        "selectPassif"
      ];
    }

    function collectItemCustomPresetState() {
      const fields = {};

      getItemCustomPresetFields().forEach(id => {
        const field = document.getElementById(id);
        if (!field) return;
        fields[id] = field.type === "checkbox" ? field.checked : field.value;
      });

      const resolvedName = document.getElementById("itemCustomPresetName")?.value.trim()
        || document.getElementById("nomItem")?.value.trim()
        || document.getElementById("nameItem")?.value.trim()
        || "Item custom sans nom";

      return {
        version: 1,
        type: "item-custom-preset",
        id: getItemCustomPresetStorageId({ name: resolvedName }),
        name: resolvedName,
        template: "itemC",
        fields,
        dynamic: {
          itemCustomCraftIngredients: recupererItemCustomCraftIngredients()
        },
        images: {
          textureItemImage: {
            fileName: getSelectedFileName("textureItemImage", ""),
            dataUrl: getImagePreviewSource("previewTextureItemTemplate")
          }
        }
      };
    }

    async function normalizeItemCustomPresetForStorage(preset) {
      if (!preset || typeof preset !== "object") {
        return preset;
      }

      const currentDataUrl = String(preset.images?.textureItemImage?.dataUrl || "").trim();
      if (!currentDataUrl) {
        return preset;
      }

      const compactedDataUrl = await buildCompactImageDataUrl(currentDataUrl);
      if (!compactedDataUrl || compactedDataUrl === currentDataUrl) {
        return preset;
      }

      return {
        ...preset,
        images: {
          ...(preset.images || {}),
          textureItemImage: {
            ...(preset.images?.textureItemImage || {}),
            dataUrl: compactedDataUrl
          }
        }
      };
    }

    function upsertCustomItemCustomPreset(preset) {
      if (!preset || typeof preset !== "object") return;
      const presetId = preset.id || getItemCustomPresetStorageId(preset);
      const presets = getCustomItemCustomPresets();
      const nextPreset = { ...preset, id: presetId };
      const existingIndex = presets.findIndex(entry => {
        const entryId = entry?.id || getItemCustomPresetStorageId(entry);
        return entryId === presetId;
      });

      if (existingIndex >= 0) {
        presets.splice(existingIndex, 1, nextPreset);
      } else {
        presets.push(nextPreset);
      }

      saveCustomItemCustomPresets(presets);
    }

    function upsertItemCustomPresetFileEntry(preset) {
      if (!preset || typeof preset !== "object") return;
      const presetId = preset.id || getItemCustomPresetStorageId(preset);
      const nextPreset = { ...preset, id: presetId };
      const existingIndex = ITEM_CUSTOM_CUSTOM_PRESETS_FILE.findIndex(entry => {
        const entryId = entry?.id || getItemCustomPresetStorageId(entry);
        return entryId === presetId;
      });

      if (existingIndex >= 0) {
        ITEM_CUSTOM_CUSTOM_PRESETS_FILE.splice(existingIndex, 1, nextPreset);
      } else {
        ITEM_CUSTOM_CUSTOM_PRESETS_FILE.push(nextPreset);
      }
    }

    function resetItemCustomPresetState() {
      getItemCustomPresetFields().forEach(id => {
        const field = document.getElementById(id);
        if (!field) return;

        if (field.type === "checkbox") {
          field.checked = false;
        } else {
          field.value = "";
        }
      });

      setProjectImageState("textureItemImage", "previewTextureItemTemplate");
      clearElement("itemCustomCraftIngredientsContainer");
      itemCustomCraftIngredientIndex = 0;
      updateTypeItemFields();
      choiceObtentionFields();
      utilisationChoiseItemFields();
      updateItemCustomCraftVisualization();
    }

    function applyItemCustomPreset(preset) {
      if (!preset || typeof preset !== "object") return;

      const templateSelect = document.getElementById("template");
      if (templateSelect) {
        templateSelect.value = "itemC";
      }
      switchTemplate();
      resetItemCustomPresetState();

      Object.entries(preset.fields || {}).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (!field) return;
        if (field.type === "checkbox") {
          field.checked = Boolean(value);
        } else {
          field.value = value ?? "";
        }
      });

      (preset.dynamic?.itemCustomCraftIngredients || []).forEach(item => ajouterItemCustomCraftIngredient(item));
      setProjectImageState("textureItemImage", "previewTextureItemTemplate", preset.images?.textureItemImage || {});

      const presetNameField = document.getElementById("itemCustomPresetName");
      if (presetNameField) {
        presetNameField.value = preset.name || "";
      }

      updateTypeItemFields();
      choiceObtentionFields();
      utilisationChoiseItemFields();
      updateItemCustomCraftVisualization();
      refreshAfterStructureChange();
      setItemCustomPresetStatus(`Preset chargé : ${preset.name || "Sans nom"}`);
    }

    function populateItemCustomPresetLibrary() {
      const select = document.getElementById("itemCustomPresetSelect");
      if (!select) return;

      const presets = getAvailableItemCustomPresets();
      select.innerHTML = "";

      if (!presets.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Aucun preset disponible";
        select.appendChild(option);
        return;
      }

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Choisir un preset...";
      select.appendChild(defaultOption);

      presets.forEach((preset, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = preset.name || `Preset ${index + 1}`;
        select.appendChild(option);
      });

      updateAllGuiItemCustomPresetSelectors();
    }

    function selectItemCustomPresetInLibrary(presetId) {
      const select = document.getElementById("itemCustomPresetSelect");
      if (!select) return false;

      const normalizedPresetId = String(presetId || "").trim();
      if (!normalizedPresetId) {
        select.value = "";
        return false;
      }

      const presets = getAvailableItemCustomPresets();
      const savedIndex = presets.findIndex(entry => String(entry.id || "").trim() === normalizedPresetId);
      if (savedIndex < 0) {
        select.value = "";
        return false;
      }

      select.value = String(savedIndex);
      return true;
    }

    function registerItemCustomPresetInApp(preset) {
      upsertCustomItemCustomPreset({
        ...preset
      });
      upsertItemCustomPresetFileEntry({
        ...preset
      });

      const hiddenIds = getItemCustomPresetHiddenIds().filter(id => id !== preset.id);
      localStorage.setItem(ITEM_CUSTOM_PRESET_HIDDEN_STORAGE_KEY, JSON.stringify(hiddenIds));

      const overrides = getItemCustomPresetOverrides();
      if (overrides[preset.id]) {
        delete overrides[preset.id];
        localStorage.setItem(ITEM_CUSTOM_PRESET_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
      }

      populateItemCustomPresetLibrary();
      selectItemCustomPresetInLibrary(preset.id);
    }

    async function saveItemCustomPresetToLibrary(preset, setStatus) {
      try {
        const normalizedPreset = await normalizeItemCustomPresetForStorage(preset);
        registerItemCustomPresetInApp(normalizedPreset);

        if (document.getElementById("template")?.value === "itemC") {
          const normalizedTexture = normalizedPreset?.images?.textureItemImage;
          if (normalizedTexture?.dataUrl) {
            setProjectImageState("textureItemImage", "previewTextureItemTemplate", {
              fileName: normalizedTexture.fileName || getSelectedFileName("textureItemImage", ""),
              dataUrl: normalizedTexture.dataUrl
            });
            updateItemCustomCraftVisualization();
          }
        }
        const cloudSync = window.NeodiumCloudSync;

        if (!cloudSync || typeof cloudSync.getState !== "function") {
          setStatus("Preset enregistré dans la bibliothèque du navigateur.");
          return;
        }

        await cloudSync.whenReady?.();
        const state = cloudSync.getState();

        if (state?.status === "ready") {
          await cloudSync.forceSync?.();
          const syncedState = cloudSync.getState?.() || state;
          if (syncedState?.status === "error") {
            setStatus(syncedState.message || "Preset enregistré en local, mais la synchronisation cloud a échoué.");
            return;
          }

          const emailSuffix = syncedState.email ? ` (${syncedState.email})` : "";
          setStatus(`Preset enregistré dans Cloud Neodium${emailSuffix}.`);
          return;
        }

        if (state?.status === "syncing" || state?.status === "booting") {
          setStatus("Preset enregistré. La synchronisation cloud est en cours.");
          return;
        }

        if (state?.status === "signed_out") {
          setStatus("Preset enregistré dans la bibliothèque locale. Connecte Cloud Neodium pour l'envoyer sur le cloud partagé.");
          return;
        }

        setStatus("Preset enregistré dans la bibliothèque locale. Le cloud n'est pas encore disponible.");
      } catch (error) {
        console.error("[Neodium] Sauvegarde preset Item Custom impossible", error);
        const reason = error instanceof Error && error.message ? ` ${error.message}` : "";
        setStatus(`Preset enregistré dans la bibliothèque locale, mais la synchronisation cloud a échoué.${reason}`);
      }
    }

    function chargerItemCustomPresetSelection() {
      const select = document.getElementById("itemCustomPresetSelect");
      const presets = getAvailableItemCustomPresets();
      if (!select || select.value === "") {
        setItemCustomPresetStatus("Sélectionne un preset Item Custom à charger.");
        return;
      }

      const preset = presets[Number.parseInt(select.value, 10)];
      if (!preset) {
        setItemCustomPresetStatus("Preset introuvable dans la bibliothèque.");
        return;
      }

      applyItemCustomPreset(preset);
    }

    function getSelectedItemCustomPreset() {
      const select = document.getElementById("itemCustomPresetSelect");
      if (!select || select.value === "") {
        return null;
      }

      const presetIndex = Number.parseInt(select.value, 10);
      if (!Number.isFinite(presetIndex)) {
        return null;
      }

      return getAvailableItemCustomPresets()[presetIndex] || null;
    }

    function getSelectedItemCustomPresetId() {
      return String(getSelectedItemCustomPreset()?.id || "").trim();
    }

    function exportCurrentItemCustomAsPreset() {
      const preset = collectItemCustomPresetState();
      void saveItemCustomPresetToLibrary(preset, setItemCustomPresetStatus);
    }

    async function ensureItemCustomPresetForSavedProject(state, projectName) {
      if (!state || state.template !== "itemC") {
        return false;
      }

      if (hasSelectedGuiPreset("itemCustomPresetSelect")) {
        return false;
      }

      const autoPreset = buildAutoItemCustomPresetForSavedProject(state, projectName);
      if (!autoPreset) {
        return false;
      }

      const presetNameField = document.getElementById("itemCustomPresetName");
      if (presetNameField) {
        presetNameField.value = autoPreset.name;
      }

      await saveItemCustomPresetToLibrary(autoPreset, message => {
        setItemCustomPresetStatus(`Preset Item Custom auto : ${message}`);
      });

      return true;
    }

    function getGuiItemCustomPresetDisplayName(preset) {
      const fields = preset?.fields || {};
      return String(fields.nameItem || fields.nomItem || "").trim();
    }

    function resolveDirectImageUrl(value) {
      const raw = String(value || "").trim();
      if (!raw) return "";

      const drivePatterns = [
        /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
        /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i,
        /drive\.google\.com\/uc\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/i,
        /docs\.google\.com\/uc\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/i
      ];

      for (const pattern of drivePatterns) {
        const match = raw.match(pattern);
        if (match?.[1]) {
          return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
      }

      return raw;
    }

    function getItemCustomPresetById(presetId) {
      const normalizedPresetId = String(presetId || "").trim();
      if (!normalizedPresetId) return null;

      return getAvailableItemCustomPresets().find(entry => String(entry.id || "").trim() === normalizedPresetId) || null;
    }

    function resolveItemCustomPresetTextureSource(preset) {
      const uploadedTexture = String(preset?.images?.textureItemImage?.dataUrl || "").trim();
      if (uploadedTexture) {
        return uploadedTexture;
      }

      return resolveDirectImageUrl(preset?.fields?.linkTexture || "");
    }

    function getGuiItemCustomPresetLabel(preset, index) {
      const itemMc = String(preset?.fields?.itemMc || "").trim();
      const displayName = stripMinecraftFormatting(getGuiItemCustomPresetDisplayName(preset));
      const parts = [preset?.name || `Preset ${index + 1}`];

      if (itemMc) {
        parts.push(itemMc);
      }

      if (displayName) {
        parts.push(displayName);
      }

      return parts.join(" - ");
    }

    function buildGuiItemCustomPresetOptionsMarkup(selectedPresetId = "") {
      const presets = getAvailableItemCustomPresets();
      const normalizedSelectedId = String(selectedPresetId || "").trim();
      const defaultLabel = presets.length
        ? "Choisir un preset Item Custom"
        : "Aucun preset Item Custom disponible";
      const options = [`<option value="">${escapeHtml(defaultLabel)}</option>`];

      presets.forEach((preset, index) => {
        const presetId = String(preset.id || "").trim();
        const selected = presetId && presetId === normalizedSelectedId ? " selected" : "";
        options.push(`<option value="${escapeHtml(presetId)}"${selected}>${escapeHtml(getGuiItemCustomPresetLabel(preset, index))}</option>`);
      });

      return options.join("");
    }

    function updateGuiItemCustomPresetSelectElement(selectId, selectedPresetId = "") {
      const select = document.getElementById(selectId);
      if (!select) return;

      const resolvedSelectedId = String(
        selectedPresetId
        || select.dataset.appliedPresetId
        || select.value
        || ""
      ).trim();

      select.innerHTML = buildGuiItemCustomPresetOptionsMarkup(resolvedSelectedId);

      const availablePresetIds = new Set(getAvailableItemCustomPresets().map(preset => String(preset.id || "").trim()).filter(Boolean));
      const finalSelectedId = availablePresetIds.has(resolvedSelectedId) ? resolvedSelectedId : "";
      select.value = finalSelectedId;
      select.dataset.appliedPresetId = finalSelectedId;
    }

    function updateAllGuiItemCustomPresetSelectors() {
      document.querySelectorAll(`
        select[id^="gui_commande_item_custom_preset_"],
        select[id^="gui_template_item_custom_preset_"],
        select[id^="metier_gui_item_custom_preset_"],
        select[id^="item_custom_craft_preset_"]
      `).forEach(select => {
        updateGuiItemCustomPresetSelectElement(select.id);
      });
    }

    function getItemCustomPresetVisualData(presetId) {
      const preset = getItemCustomPresetById(presetId);
      if (!preset) return null;

      const fields = preset.fields || {};
      return {
        id: preset.id,
        item: String(fields.itemMc || "").trim(),
        nom: String(fields.nameItem || fields.nomItem || "").trim(),
        lore: String(fields.loreItem || "").trim(),
        textureSource: resolveItemCustomPresetTextureSource(preset),
        loreVariantes: []
      };
    }

    function getGuiItemCustomPresetVisualData(presetId) {
      return getItemCustomPresetVisualData(presetId);
    }

    function resolveGuiItemCustomTextureSource(item) {
      const presetId = String(item?.itemCustomPresetId || "").trim();
      if (!presetId) return "";

      return String(getItemCustomPresetVisualData(presetId)?.textureSource || "").trim();
    }

    function applyItemCustomPresetToGuiFields({
      presetId,
      selectId,
      itemFieldId,
      nomFieldId,
      loreFieldId,
      replaceLoreVariantes,
      afterApply,
      focusFieldId
    }) {
      const presetData = getItemCustomPresetVisualData(presetId);
      if (!presetData) {
        return false;
      }

      const itemField = document.getElementById(itemFieldId);
      const nomField = document.getElementById(nomFieldId);
      const loreField = document.getElementById(loreFieldId);
      const select = document.getElementById(selectId);

      if (itemField) {
        itemField.value = presetData.item;
      }

      if (nomField) {
        nomField.value = presetData.nom;
      }

      if (loreField) {
        loreField.value = presetData.lore;
      }

      if (typeof replaceLoreVariantes === "function") {
        replaceLoreVariantes(presetData.loreVariantes);
      }

      if (select) {
        select.value = presetData.id || "";
        select.dataset.appliedPresetId = presetData.id || "";
      }

      afterApply?.();

      const focusField = document.getElementById(focusFieldId);
      focusField?.focus();
      return true;
    }

    async function loadMinecraftSoundCatalog() {
      if (minecraftSoundCatalogPromise) {
        return minecraftSoundCatalogPromise;
      }

      const status = document.getElementById("soundDesignSonStatus");
      if (status) {
        status.textContent = "Chargement du catalogue local...";
      }

      minecraftSoundCatalogPromise = Promise.resolve().then(() => {
        const data = window.MINECRAFT_SOUND_CATALOG || null;

        if (data) {
          minecraftSoundDefinitions = data;
          populateMinecraftSoundSelect(Object.keys(data).sort((a, b) => a.localeCompare(b)));
          if (status) {
            status.textContent = `${Object.keys(data).length} sons locaux chargés.`;
          }
          return data;
        }

        populateMinecraftSoundSelect(BUILTIN_MINECRAFT_SOUND_EVENTS);
        if (status) {
          status.textContent = "Liste locale utilisée.";
        }
        return null;
      });

      return minecraftSoundCatalogPromise;
    }

    function normalizeSoundEventKey(value) {
      return String(value).trim().replace(/^minecraft:/, "");
    }

    function resolveMinecraftSoundPath(eventKey, visited = new Set()) {
      const normalizedKey = normalizeSoundEventKey(eventKey);
      if (!minecraftSoundDefinitions || !normalizedKey || visited.has(normalizedKey)) {
        return null;
      }

      visited.add(normalizedKey);
      const definition = minecraftSoundDefinitions[normalizedKey];
      if (!definition) return null;

      const sounds = Array.isArray(definition.sounds) ? definition.sounds : [];
      for (const sound of sounds) {
        if (typeof sound === "string") {
          return sound;
        }

        if (sound?.type === "event" && sound?.name) {
          const nested = resolveMinecraftSoundPath(sound.name, visited);
          if (nested) return nested;
        }

        if (sound?.name && (!sound.type || sound.type === "sound")) {
          return sound.name;
        }
      }

      return null;
    }

    async function previewMinecraftSound(inputId, statusId) {
      const input = document.getElementById(inputId);
      const status = document.getElementById(statusId);
      const soundEvent = input?.value?.trim();

      if (!soundEvent) {
        if (status) status.textContent = "Choisis d'abord un son.";
        return;
      }

      try {
        await loadMinecraftSoundCatalog();
        const soundPath = resolveMinecraftSoundPath(soundEvent) || normalizeSoundEventKey(soundEvent).replace(/\./g, "/");

        if (!soundPath) {
          if (status) status.textContent = "Son introuvable dans le catalogue.";
          return;
        }

        if (activePreviewAudio) {
          activePreviewAudio.pause();
          activePreviewAudio.currentTime = 0;
        }

        const normalizedPath = soundPath.replace(/^minecraft:/, "");
        const localAudioUrl = new URL(`${LOCAL_MINECRAFT_SOUNDS_BASE_PATH}/${normalizedPath}.ogg`, window.location.href).href;

        activePreviewAudio = new Audio();
        activePreviewAudio.volume = 0.9;
        activePreviewAudio.src = localAudioUrl;
        await activePreviewAudio.play();

        if (status) status.textContent = `Lecture locale : ${normalizedPath}`;
      } catch (error) {
        if (status) status.textContent = "Audio non inclus dans la version GitHub. Ajoute les .ogg dans minecraft-sounds/ pour écouter.";
      }
    }

    function setDisplay(id, isVisible, displayValue = "block") {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = isVisible ? displayValue : "none";
      }
    }

    function toggleFields(entries) {
      entries.forEach(([inputId, fieldId]) => {
        const input = document.getElementById(inputId);
        setDisplay(fieldId, Boolean(input?.checked));
      });
    }

    function setChecked(id, checked) {
      const element = document.getElementById(id);
      if (element) {
        element.checked = checked;
      }
    }

    function clearElement(id) {
      const element = document.getElementById(id);
      if (element) {
        element.innerHTML = "";
      }
    }

    function invalidateCDC() {
      dernierTexteGenere = "";
      isCDCDirty = true;
    }

    function scheduleCDCGeneration(delay = 120) {
      if (scheduledCDCGenerationId) {
        clearTimeout(scheduledCDCGenerationId);
      }

      scheduledCDCGenerationId = setTimeout(() => {
        scheduledCDCGenerationId = null;
        genererCDC();
      }, delay);
    }

    function cancelScheduledCDCGeneration() {
      if (!scheduledCDCGenerationId) return;
      clearTimeout(scheduledCDCGenerationId);
      scheduledCDCGenerationId = null;
    }

    function isGeneratorUiField(element) {
      if (!element?.id) return false;
      return element.id === "projectNameInput"
        || element.id === "projectHistorySearch"
        || element.id === "projectHistorySort"
        || element.id === "workspaceProjectSelect"
        || element.id === "guiPresetSelect"
        || element.id === "guiPresetName"
        || element.id === "guiCommandePresetSelect"
        || element.id === "guiCommandePresetName"
        || element.id === "itemCustomPresetSelect"
        || element.id === "itemCustomPresetName"
        || element.id.startsWith("gui_commande_copy_from_")
        || element.id.startsWith("metier_gui_copy_from_")
        || element.id.startsWith("gui_template_copy_from_")
        || element.id.startsWith("gui_commande_item_custom_preset_")
        || element.id.startsWith("metier_gui_item_custom_preset_")
        || element.id.startsWith("gui_template_item_custom_preset_")
        || element.id.startsWith("item_custom_craft_preset_");
    }

    function shouldAutosaveGeneratorField(element) {
      if (!element?.id) return false;
      return element.id !== "projectHistorySearch"
        && element.id !== "projectHistorySort"
        && element.id !== "guiPresetSelect"
        && element.id !== "guiPresetName"
        && element.id !== "guiCommandePresetSelect"
        && element.id !== "guiCommandePresetName"
        && element.id !== "itemCustomPresetSelect"
        && element.id !== "itemCustomPresetName"
        && !element.id.startsWith("gui_commande_copy_from_")
        && !element.id.startsWith("metier_gui_copy_from_")
        && !element.id.startsWith("gui_template_copy_from_")
        && !element.id.startsWith("gui_commande_item_custom_preset_")
        && !element.id.startsWith("metier_gui_item_custom_preset_")
        && !element.id.startsWith("gui_template_item_custom_preset_")
        && !element.id.startsWith("item_custom_craft_preset_");
    }

    function handleGeneratorFieldInteraction(element, { shouldGenerate = false, shouldAutosave = false } = {}) {
      if (!element) return;
      if (element.closest?.("#minecraftInlinePreview")) return;

      if (element.id === "projectHistorySearch") {
        renderProjectHistory();
      }

      if (element.id === "template") {
        hideMinecraftInlinePreview();
        if (shouldAutosave && shouldAutosaveGeneratorField(element)) {
          scheduleLocalAutosave();
        }
        return;
      }

      if (isMinecraftPreviewableField(element)) {
        updateMinecraftSidebarPreviewFromField(element);
      } else if (!shouldGenerate || isTextEntryField(element) || element.tagName === "INPUT" || element.tagName === "SELECT" || element.tagName === "BUTTON") {
        hideMinecraftInlinePreview();
      }

      if (
        element.id === "nomGUICommande"
        || element.id === "tailleGUICommande"
        || element.id === "imageGUICommande"
        || element.id === "textureGUICommande"
        || element.id.startsWith("gui_cmd_")
      ) {
        updateGuiCommandeVisualization();
        if (element.id.startsWith("gui_cmd_")) {
          updateGuiCommandeItemCopySources();
        }
      }

      if (
        element.id === "guiNom"
        || element.id === "guiNomAffiche"
        || element.id === "guiTailleAutre"
        || element.id.startsWith("gui_tpl_")
      ) {
        updateGuiTemplateVisualization();
        if (element.id.startsWith("gui_tpl_")) {
          updateGuiTemplateItemCopySources();
        }
      }

      if (element.id.startsWith("metier_gui_")) {
        updateMetierGuiItemCopySources();
      }

      if (
        element.id === "obtentionCraft"
        || element.id === "itemMc"
        || element.id === "nameItem"
        || element.id === "loreItem"
        || element.id === "linkTexture"
        || element.id === "textureItemImage"
        || element.id.startsWith("item_custom_craft_")
      ) {
        updateItemCustomCraftVisualization();
      }

      if (shouldAutosave && shouldAutosaveGeneratorField(element)) {
        scheduleRecoveryDraftSave();
        scheduleLocalAutosave();
      }

      if (!shouldGenerate || isGeneratorUiField(element)) {
        return;
      }

      if (element.id.startsWith("caisseRewardChance_")) {
        updateCaisseChanceHelper();
      }

      invalidateCDC();
      scheduleCDCGeneration();
    }

    function refreshAfterStructureChange() {
      invalidateCDC();
      genererCDC(true);
      scheduleLocalAutosave();
    }

    function applyTheme(theme) {
      const normalizedTheme = theme === "dark" ? "dark" : "light";
      document.body.dataset.theme = normalizedTheme;
      document.documentElement.style.colorScheme = normalizedTheme;
      window.syncGlobalThemeSwitch?.(normalizedTheme);
    }

    function initTheme() {
      localStorage.removeItem("neodium-cdc-theme");
      applyTheme("dark");
    }

    /* =========================================================
       3. GESTION DES IMAGES DANS L'APERÇU FINAL
       - ces fonctions ne servent QUE pour le rendu HTML
       - elles affichent l'image réelle et non le nom du fichier
       ========================================================= */

    function getCommandeGuiImageHtml() {
      return renderSavedImagePreviewHtml("Image du GUI", "previewImageGUICommande", "Image du GUI");
    }

    function getTemplateGuiImageHtml() {
      return renderSavedImagePreviewHtml("Image du GUI", "previewImageTemplate", "Image du GUI");
    }

	function getTemplateCraftImageHtml() {
      return renderSavedImagePreviewHtml("Image du Craft", "previewCraftTemplate", "Image du Craft");
    }
	
	function getTemplateTextureItemImageHtml() {
      return renderSavedImagePreviewHtml("Image de la texture", "previewTextureItemTemplate", "Image de la texture");
    }

    /* =========================================================
       4. CHANGEMENT DE TEMPLATE
       - affiche le bon formulaire
       ========================================================= */
    function switchTemplate() {
      const template = document.getElementById("template").value;
      const templateConfig = TEMPLATE_CONFIG[template] || TEMPLATE_CONFIG.commande;

      Object.values(TEMPLATE_CONFIG).forEach(({ formId }) => {
        document.getElementById(formId)?.classList.remove("active");
      });

      document.getElementById(templateConfig.formId)?.classList.add("active");
      document.getElementById("activeTemplateBadge").textContent = getTemplateBadgeLabel(template);

      invalidateCDC();
      genererCDC(true);
    }

    /* =========================================================
       5. AFFICHAGE DYNAMIQUE DES BLOCS
       - sert à afficher/cacher certaines sections
       ========================================================= */

    function updateCommandeInterfaceFields() {
      toggleFields([
        ["interfaceChat", "chatFields"],
        ["interfaceGUI", "commandeGuiFields"],
        ["interfaceScoreboard", "scoreboardFields"],
        ["interfaceActionBar", "actionBarFields"],
        ["interfaceSoundDesign", "soundDesignFields"],
        ["interfaceActionJoueur", "actionJoueurFields"]
      ]);
    }

    function updateOuvertureFields() {
      toggleFields([
        ["ouvertureCommande", "ouvertureCommandeField"],
        ["ouvertureNPC", "ouvertureNPCField"],
        ["ouvertureItem", "ouvertureItemField"],
        ["ouvertureAutreCheck", "ouvertureAutreField"]
      ]);
    }

    function updateTypeItemFields() {
      toggleFields([["typeAutre", "typeAutreField"]]);
    }

    function updateGuiTailleField() {
      const guiTaille = document.getElementById("guiTaille");
      setDisplay("guiTailleAutreField", guiTaille?.value === "Autre");
      updateGuiCommandeVisualization();
      updateGuiTemplateVisualization();
    }

    function startEventFields() {
      toggleFields([["startEventCommand", "startEventCommandField"]]);
    }

    function updateEventInterfaceFields() {
      toggleFields([
        ["eventInterfaceScoreboard", "eventScoreboardField"],
        ["eventInterfaceActionBar", "eventActionBarField"],
        ["eventInterfaceBossBar", "eventBossBarField"]
      ]);
    }

    function updateMetierXpMessageFields() {
      toggleFields([
        ["metierXpMessageChat", "metierXpMessageChatField"],
        ["metierXpMessageActionBar", "metierXpMessageActionBarField"],
        ["metierXpMessageBossBar", "metierXpMessageBossBarField"],
        ["metierXpMessageAutre", "metierXpMessageAutreField"]
      ]);
    }

    function choiceObtentionFields() {
      toggleFields([
        ["obtentionCraft", "obtentionCraftField"],
        ["obtentionRecompense", "obtentionRecompenseField"],
        ["obtentionBoutique", "obtentionBoutiqueField"],
        ["obtentionShop", "obtentionShopField"],
        ["obtentionEvent", "obtentionEventField"],
        ["obtentionAutre", "obtentionAutreField"]
      ]);
      updateItemCustomCraftVisualization();
    }

    function utilisationChoiseItemFields() {
      toggleFields([
        ["utilisationClickDroit", "utilisationClickDroitField"],
        ["utilisationClickGauche", "utilisationClickGaucheField"],
        ["utilisationPassif", "utilisationPassifField"]
      ]);
    }

    /* =========================================================
       6. GESTION DE L'UPLOAD IMAGE
       - affiche un aperçu dans le formulaire
       - déclenche aussi la mise à jour du rendu final
       ========================================================= */
    async function previewImage(event, previewId) {
      const input = event.target;
      const file = input.files[0];

      if (file) {
        try {
          const sourceDataUrl = await readFileAsDataUrl(file);
          const compressionOptions = PROJECT_IMAGE_COMPRESSION_OPTIONS[input.id] || {
            maxWidth: 1024,
            maxHeight: 1024,
            quality: 0.82
          };
          const compactedDataUrl = await buildCompactImageDataUrl(sourceDataUrl, compressionOptions);

          setProjectImageState(input.id, previewId, {
            fileName: file.name,
            dataUrl: compactedDataUrl || sourceDataUrl
          });
        } catch (error) {
          setProjectImageState(input.id, previewId);
        }

        if (input.id === "textureItemImage") {
          updateItemCustomCraftVisualization();
        }
        invalidateCDC();
        genererCDC(true);
        scheduleLocalAutosave();
      } else {
        setProjectImageState(input.id, previewId);
        if (input.id === "textureItemImage") {
          updateItemCustomCraftVisualization();
        }
        invalidateCDC();
        genererCDC(true);
        scheduleLocalAutosave();
      }
    }

    /* =========================================================
       7. MESSAGES DYNAMIQUES (template Commande)
       ========================================================= */
    function ajouterMessage(titre = "", contenu = "") {
      messageIndex++;
      const container = document.getElementById("messagesContainer");

      const item = document.createElement("div");
      item.className = "message-item";
      item.dataset.messageId = messageIndex;

      item.innerHTML = `
        <div class="message-item-header">
          <div class="message-item-title">Message personnalisé</div>
          <button type="button" class="btn-remove" onclick="supprimerMessage(${messageIndex})">Supprimer</button>
        </div>

        <label for="messageTitle_${messageIndex}">Titre du message</label>
        <input type="text" id="messageTitle_${messageIndex}" placeholder="Ex : Message erreur" value="${escapeHtml(titre)}" />

        <label for="messageContent_${messageIndex}">Contenu du message</label>
        <textarea id="messageContent_${messageIndex}" placeholder='Ex : "&cUne erreur est survenue."'>${escapeHtml(contenu)}</textarea>
      `;

      container.appendChild(item);
      refreshAfterStructureChange();
    }

    function supprimerMessage(id) {
      const item = document.querySelector(`[data-message-id="${id}"]`);
      if (item) item.remove();
      refreshAfterStructureChange();
    }

    function recupererMessages() {
      const items = document.querySelectorAll("#messagesContainer .message-item");
      const messages = [];

      items.forEach(item => {
        const id = item.dataset.messageId;
        const titre = document.getElementById(`messageTitle_${id}`)?.value.trim() || "";
        const contenu = document.getElementById(`messageContent_${id}`)?.value.trim() || "";

        if (titre !== "" || contenu !== "") {
          messages.push({
            titre: titre === "" ? "Message sans titre" : titre,
            contenu: contenu
          });
        }
      });

      return messages;
    }

    function ajouterConditionEvent(condition = "") {
      eventConditionIndex++;
      const container = document.getElementById("eventConditionsContainer");

      const item = document.createElement("div");
      item.className = "event-condition-item";
      item.dataset.eventConditionId = eventConditionIndex;

      item.innerHTML = `
        <div class="message-item-header">
          <div class="message-item-title">Autre condition</div>
          <button type="button" class="btn-remove" onclick="supprimerConditionEvent(${eventConditionIndex})">Supprimer</button>
        </div>

        <label for="eventConditionValue_${eventConditionIndex}">Autre condition</label>
        <textarea id="eventConditionValue_${eventConditionIndex}" placeholder="Ex : Le joueur doit être dans la zone événement.">${escapeHtml(condition)}</textarea>
      `;

      container.appendChild(item);
      refreshAfterStructureChange();
    }

    function supprimerConditionEvent(id) {
      const item = document.querySelector(`[data-event-condition-id="${id}"]`);
      if (item) item.remove();
      refreshAfterStructureChange();
    }

    function recupererConditionsEvent() {
      const items = document.querySelectorAll("[data-event-condition-id]");
      const conditions = [];

      items.forEach(item => {
        const id = item.dataset.eventConditionId;
        const condition = document.getElementById(`eventConditionValue_${id}`)?.value.trim() || "";

        if (condition !== "") {
          conditions.push({
            condition
          });
        }
      });

      return conditions;
    }

    function ajouterMessageEvent(titre = "", contenu = "") {
      eventMessageIndex++;
      const container = document.getElementById("eventMessagesContainer");

      const item = document.createElement("div");
      item.className = "message-item";
      item.dataset.eventMessageId = eventMessageIndex;

      item.innerHTML = `
        <div class="message-item-header">
          <div class="message-item-title">Message personnalisé</div>
          <button type="button" class="btn-remove" onclick="supprimerMessageEvent(${eventMessageIndex})">Supprimer</button>
        </div>

        <label for="eventMessageTitle_${eventMessageIndex}">Titre</label>
        <input type="text" id="eventMessageTitle_${eventMessageIndex}" placeholder="Ex : Message attente" value="${escapeHtml(titre)}" />

        <label for="eventMessageContent_${eventMessageIndex}">Message</label>
        <textarea id="eventMessageContent_${eventMessageIndex}" placeholder="Ex : L'événement commencera dans 5 minutes.">${escapeHtml(contenu)}</textarea>
      `;

      container.appendChild(item);
      refreshAfterStructureChange();
    }

    function supprimerMessageEvent(id) {
      const item = document.querySelector(`[data-event-message-id="${id}"]`);
      if (item) item.remove();
      refreshAfterStructureChange();
    }

    function recupererMessagesEvent() {
      const items = document.querySelectorAll("[data-event-message-id]");
      const messages = [];

      items.forEach(item => {
        const id = item.dataset.eventMessageId;
        const titre = document.getElementById(`eventMessageTitle_${id}`)?.value.trim() || "";
        const contenu = document.getElementById(`eventMessageContent_${id}`)?.value.trim() || "";

        if (titre !== "" || contenu !== "") {
          messages.push({
            titre: titre || "Message sans titre",
            contenu: contenu || "Aucun contenu"
          });
        }
      });

      return messages;
    }

    function ajouterRewardCaisse(data = {}) {
      caisseRewardIndex++;
      const container = document.getElementById("caisseRewardsContainer");

      const item = document.createElement("div");
      item.className = "gui-item";
      item.dataset.caisseRewardId = caisseRewardIndex;

      item.innerHTML = `
        <div class="gui-item-header">
          <div class="gui-item-title">Récompense</div>
          <button type="button" class="btn-remove" onclick="supprimerRewardCaisse(${caisseRewardIndex})">Supprimer</button>
        </div>

        <div class="grid-2">
          <div>
            <label for="caisseRewardItem_${caisseRewardIndex}">Item</label>
            <input type="text" id="caisseRewardItem_${caisseRewardIndex}" placeholder="Ex : 1 clé rare" value="${escapeHtml(data.item || "")}" />
          </div>

          <div class="grid-2">
            <div>
              <label for="caisseRewardQuantity_${caisseRewardIndex}">Quantité</label>
              <input type="text" id="caisseRewardQuantity_${caisseRewardIndex}" placeholder="Ex : 3" value="${escapeHtml(data.quantity || "")}" />
            </div>

            <div>
              <label for="caisseRewardChance_${caisseRewardIndex}">Pourcentage de chance</label>
              <input type="text" id="caisseRewardChance_${caisseRewardIndex}" placeholder="Ex : 12%" value="${escapeHtml(data.chance || "")}" />
            </div>
          </div>
        </div>
      `;

      container.appendChild(item);
      updateCaisseChanceHelper();
      refreshAfterStructureChange();
    }

    function supprimerRewardCaisse(id) {
      const item = document.querySelector(`[data-caisse-reward-id="${id}"]`);
      if (item) item.remove();
      updateCaisseChanceHelper();
      refreshAfterStructureChange();
    }

    function recupererRewardsCaisse() {
      const items = document.querySelectorAll("[data-caisse-reward-id]");
      const rewards = [];

      items.forEach(item => {
        const id = item.dataset.caisseRewardId;
        const rewardItem = document.getElementById(`caisseRewardItem_${id}`)?.value.trim() || "";
        const rewardQuantity = document.getElementById(`caisseRewardQuantity_${id}`)?.value.trim() || "";
        const rewardChance = document.getElementById(`caisseRewardChance_${id}`)?.value.trim() || "";

        if (rewardItem !== "" || rewardQuantity !== "" || rewardChance !== "") {
          rewards.push({
            item: rewardItem || "Aucun",
            quantity: rewardQuantity || "1",
            chance: rewardChance || "Aucune"
          });
        }
      });

      return rewards;
    }

    function updateCaisseChanceHelper() {
      const helper = document.getElementById("caisseChanceHelper");
      if (!helper) return;

      const chanceInputs = document.querySelectorAll("[id^='caisseRewardChance_']");
      const total = Array.from(chanceInputs).reduce((sum, input) => sum + parseChancePercent(input.value), 0);
      const roundedTotal = Math.round(total * 100) / 100;
      const remaining = Math.round((100 - roundedTotal) * 100) / 100;

      helper.classList.remove("is-ok", "is-warning", "is-error");

      let statusText = "";
      if (roundedTotal === 100) {
        helper.classList.add("is-ok");
        statusText = "Parfait, le total est exactement à 100%.";
      } else if (roundedTotal < 100) {
        helper.classList.add("is-warning");
        statusText = `Il reste ${remaining}% à répartir.`;
      } else {
        helper.classList.add("is-error");
        statusText = `Tu dépasses de ${Math.abs(remaining)}%.`;
      }

      helper.innerHTML = `<strong>Total :</strong> ${roundedTotal}% <span class="muted">|</span> <strong>Reste :</strong> ${remaining}% <span class="muted">|</span> ${statusText}`;
    }

    function ajouterSoundDesignEntry(data = {}) {
      soundDesignEntryIndex++;
      const container = document.getElementById("soundDesignEntriesContainer");

      const item = document.createElement("div");
      item.className = "gui-item";
      item.dataset.soundDesignEntryId = soundDesignEntryIndex;

      item.innerHTML = `
        <div class="gui-item-header">
          <div class="gui-item-title">Son ${soundDesignEntryIndex}</div>
          <button type="button" class="btn-remove" onclick="supprimerSoundDesignEntry(${soundDesignEntryIndex})">Supprimer</button>
        </div>

        <div class="grid-2">
          <div>
            <label for="soundDesignEvent_${soundDesignEntryIndex}">Événement</label>
            <input type="text" id="soundDesignEvent_${soundDesignEntryIndex}" placeholder="Ex : Ouverture de caisse" value="${escapeHtml(data.event || "")}" />
          </div>

          <div>
            <label for="soundDesignSound_${soundDesignEntryIndex}">Son joué</label>
            <div class="inline-field-group">
              <input type="text" id="soundDesignSound_${soundDesignEntryIndex}" list="soundDesignSoundOptions_${soundDesignEntryIndex}" placeholder="Choisir ou écrire un son Minecraft" value="${escapeHtml(data.sound || "")}" />
              <datalist id="soundDesignSoundOptions_${soundDesignEntryIndex}"></datalist>
              <button type="button" class="btn-secondary btn-inline" onclick="previewMinecraftSound('soundDesignSound_${soundDesignEntryIndex}', 'soundDesignSoundStatus_${soundDesignEntryIndex}')">Écouter</button>
            </div>
            <div id="soundDesignSoundStatus_${soundDesignEntryIndex}" class="muted" style="margin-top:6px;">Catalogue disponible. Audio GitHub léger : ajoute les .ogg dans minecraft-sounds/ pour écouter.</div>
          </div>
        </div>

        <label for="soundDesignDescription_${soundDesignEntryIndex}">Description</label>
        <textarea id="soundDesignDescription_${soundDesignEntryIndex}" placeholder="Ex : Son joué au moment où le joueur ouvre la caisse.">${escapeHtml(data.description || "")}</textarea>
      `;

      container.appendChild(item);
      populateMinecraftSoundSelectElement(
        document.getElementById(`soundDesignSoundOptions_${soundDesignEntryIndex}`),
        getAvailableMinecraftSoundKeys()
      );
      refreshAfterStructureChange();
    }

    function supprimerSoundDesignEntry(id) {
      const item = document.querySelector(`[data-sound-design-entry-id="${id}"]`);
      if (item) item.remove();
      refreshAfterStructureChange();
    }

    function recupererSoundDesignEntries() {
      const items = document.querySelectorAll("[data-sound-design-entry-id]");
      const entries = [];

      items.forEach(item => {
        const id = item.dataset.soundDesignEntryId;
        const event = document.getElementById(`soundDesignEvent_${id}`)?.value.trim() || "";
        const sound = document.getElementById(`soundDesignSound_${id}`)?.value.trim() || "";
        const description = document.getElementById(`soundDesignDescription_${id}`)?.value.trim() || "";

        if (event !== "" || sound !== "" || description !== "") {
          entries.push({
            event: event || "Aucun",
            sound: sound || "Aucun",
            description: description || "Aucune"
          });
        }
      });

      return entries;
    }

    /* =========================================================
       8. ITEMS GUI DYNAMIQUES POUR TEMPLATE COMMANDE
       ========================================================= */
    function normalizeGuiEditorLoreVariantes(loreVariantes) {
      if (!Array.isArray(loreVariantes)) return [];

      return loreVariantes
        .map(variant => ({
          contexte: String(variant?.contexte || variant?.etat || variant?.label || "").trim(),
          lore: String(variant?.lore || "").trim()
        }))
        .filter(variant => variant.contexte || variant.lore);
    }

    function getGuiCommandeItemElements() {
      return [...document.querySelectorAll(".gui-item[data-gui-commande-item-id]")];
    }

    function buildGuiCommandeItemSourceLabel(itemElement, index) {
      const id = String(itemElement?.dataset?.guiCommandeItemId || "").trim();
      const slotValue = document.getElementById(`gui_cmd_slot_${id}`)?.value.trim() || "";
      const itemValue = document.getElementById(`gui_cmd_item_${id}`)?.value.trim() || "";
      const nomValue = document.getElementById(`gui_cmd_nom_${id}`)?.value.trim() || "";
      const cleanedNom = stripMinecraftFormatting(nomValue);
      const descriptor = cleanedNom || itemValue || "";
      const parts = [`Item ${index + 1}`];

      if (slotValue) {
        parts.push(`slot ${slotValue}`);
      }

      if (descriptor) {
        parts.push(descriptor);
      }

      return parts.join(" - ");
    }

    function updateGuiCommandeCopyActionState(itemId) {
      const sourceSelect = document.getElementById(`gui_commande_copy_from_${itemId}`);
      const copyButton = document.querySelector(`[data-gui-commande-copy-button-for="${itemId}"]`);
      if (!sourceSelect || !copyButton) return;
      copyButton.disabled = sourceSelect.disabled || !sourceSelect.value;
    }

    function getGuiCommandeLoreVariantes(itemId) {
      const container = document.getElementById(`gui_cmd_lore_variants_${itemId}`);
      if (!container) return [];

      return [...container.querySelectorAll("[data-gui-commande-lore-variant-id]")]
        .map(variantRow => {
          const variantId = variantRow.dataset.guiCommandeLoreVariantId;
          return {
            contexte: document.getElementById(`gui_cmd_lore_variant_context_${variantId}`)?.value.trim() || "",
            lore: document.getElementById(`gui_cmd_lore_variant_text_${variantId}`)?.value.trim() || ""
          };
        })
        .filter(variant => variant.contexte || variant.lore);
    }

    function ajouterGuiCommandeLoreVariante(itemId, data = {}, { skipRefresh = false } = {}) {
      guiCommandeLoreVariantIndex++;
      const variantId = guiCommandeLoreVariantIndex;
      const container = document.getElementById(`gui_cmd_lore_variants_${itemId}`);
      if (!container) return "";

      const normalizedData = normalizeGuiEditorLoreVariantes([data])[0] || {
        contexte: "",
        lore: ""
      };

      const variant = document.createElement("div");
      variant.className = "gui-item-lore-variant";
      variant.dataset.guiCommandeLoreVariantId = variantId;
      variant.dataset.guiCommandeLoreVariantParentId = itemId;
      variant.innerHTML = `
        <div class="gui-item-lore-variant-header">
          <div class="gui-item-lore-variant-title">Variante de lore</div>
          <button type="button" class="btn-remove" onclick="supprimerGuiCommandeLoreVariante(${variantId})">Supprimer</button>
        </div>

        <label for="gui_cmd_lore_variant_context_${variantId}">Contexte / etat</label>
        <input type="text" id="gui_cmd_lore_variant_context_${variantId}" placeholder="Ex : Etat selectionne" value="${escapeHtml(normalizedData.contexte)}">

        <label for="gui_cmd_lore_variant_text_${variantId}">Lore</label>
        <textarea id="gui_cmd_lore_variant_text_${variantId}" placeholder="Ex : &aCet item est actuellement utilise">${escapeHtml(normalizedData.lore)}</textarea>
      `;

      container.appendChild(variant);

      if (!skipRefresh) {
        refreshAfterStructureChange();
        updateGuiCommandeVisualization();
      }

      return String(variantId);
    }

    function remplacerGuiCommandeLoreVariantes(itemId, loreVariantes) {
      const container = document.getElementById(`gui_cmd_lore_variants_${itemId}`);
      if (!container) return;

      container.innerHTML = "";
      normalizeGuiEditorLoreVariantes(loreVariantes).forEach(variant => {
        ajouterGuiCommandeLoreVariante(itemId, variant, { skipRefresh: true });
      });
    }

    function supprimerGuiCommandeLoreVariante(variantId) {
      const variant = document.querySelector(`[data-gui-commande-lore-variant-id="${variantId}"]`);
      if (variant) {
        variant.remove();
      }

      refreshAfterStructureChange();
      updateGuiCommandeVisualization();
    }

    function updateGuiCommandeItemCopySources() {
      const itemElements = getGuiCommandeItemElements();
      const sourceItems = itemElements.map((itemElement, index) => ({
        id: String(itemElement.dataset.guiCommandeItemId || ""),
        label: buildGuiCommandeItemSourceLabel(itemElement, index)
      }));

      itemElements.forEach((itemElement, index) => {
        const itemId = String(itemElement.dataset.guiCommandeItemId || "");
        const title = itemElement.querySelector(".gui-item-title");
        const sourceSelect = document.getElementById(`gui_commande_copy_from_${itemId}`);
        const copyHint = itemElement.querySelector(".gui-item-copy-hint");
        const previousValue = sourceSelect?.value || "";
        const availableSources = sourceItems.filter(source => source.id !== itemId);

        if (title) {
          title.textContent = `Item GUI ${index + 1}`;
        }

        if (!sourceSelect) {
          return;
        }

        sourceSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = availableSources.length
          ? "Choisir un item source"
          : "Aucun autre item disponible";
        sourceSelect.appendChild(defaultOption);

        availableSources.forEach(source => {
          const option = document.createElement("option");
          option.value = source.id;
          option.textContent = source.label;
          sourceSelect.appendChild(option);
        });

        sourceSelect.disabled = availableSources.length === 0;
        sourceSelect.value = availableSources.some(source => source.id === previousValue) ? previousValue : "";
        updateGuiCommandeCopyActionState(itemId);

        if (copyHint) {
          copyHint.textContent = availableSources.length
            ? "Recopie Item + Nom + Lore principal + variantes sans toucher au slot."
            : "Ajoute un autre item pour reutiliser son contenu.";
        }
      });
    }

    function copierVisuelDepuisItemGUICommande(targetItemId) {
      const sourceSelect = document.getElementById(`gui_commande_copy_from_${targetItemId}`);
      const sourceItemId = sourceSelect?.value || "";
      if (!sourceItemId) return;

      ["item", "nom", "lore"].forEach(fieldName => {
        const sourceField = document.getElementById(`gui_cmd_${fieldName}_${sourceItemId}`);
        const targetField = document.getElementById(`gui_cmd_${fieldName}_${targetItemId}`);
        if (sourceField && targetField) {
          targetField.value = sourceField.value;
        }
      });

      remplacerGuiCommandeLoreVariantes(targetItemId, getGuiCommandeLoreVariantes(sourceItemId));
      const sourcePresetSelect = document.getElementById(`gui_commande_item_custom_preset_${sourceItemId}`);
      const targetPresetSelect = document.getElementById(`gui_commande_item_custom_preset_${targetItemId}`);
      if (sourcePresetSelect && targetPresetSelect) {
        const appliedPresetId = sourcePresetSelect.dataset.appliedPresetId || "";
        targetPresetSelect.dataset.appliedPresetId = appliedPresetId;
        targetPresetSelect.value = appliedPresetId;
      }
      updateGuiCommandeItemCopySources();
      updateGuiCommandeVisualization();
      invalidateCDC();
      genererCDC(true);

      const focusField = document.getElementById(`gui_cmd_nom_${targetItemId}`);
      focusField?.focus();
    }

    function appliquerItemCustomPresetSurGuiCommandeItem(itemId) {
      const selectId = `gui_commande_item_custom_preset_${itemId}`;
      const presetId = document.getElementById(selectId)?.value || "";
      if (!presetId) {
        return;
      }

      applyItemCustomPresetToGuiFields({
        presetId,
        selectId,
        itemFieldId: `gui_cmd_item_${itemId}`,
        nomFieldId: `gui_cmd_nom_${itemId}`,
        loreFieldId: `gui_cmd_lore_${itemId}`,
        replaceLoreVariantes: loreVariantes => remplacerGuiCommandeLoreVariantes(itemId, loreVariantes),
        afterApply: () => {
          updateGuiCommandeItemCopySources();
          refreshAfterStructureChange();
          updateGuiCommandeVisualization();
        },
        focusFieldId: `gui_cmd_nom_${itemId}`
      });
    }

    function ajouterItemGUICommande(data = {}) {
      guiCommandeItemIndex++;
      const container = document.getElementById("guiItemsCommandeContainer");
      const itemId = guiCommandeItemIndex;

      const item = document.createElement("div");
      item.className = "gui-item";
      item.dataset.guiCommandeItemId = itemId;

      item.innerHTML = `
        <div class="gui-item-header">
          <div class="gui-item-title">Item GUI</div>
          <button type="button" class="btn-remove" onclick="supprimerItemGUICommande(${itemId})">Supprimer</button>
        </div>

        <div class="gui-item-copy-tools">
          <div>
            <label for="gui_commande_item_custom_preset_${itemId}">Preset Item Custom</label>
            <select id="gui_commande_item_custom_preset_${itemId}" data-applied-preset-id="${escapeHtml(data.itemCustomPresetId || "")}">
              ${buildGuiItemCustomPresetOptionsMarkup(data.itemCustomPresetId || "")}
            </select>
          </div>
          <button
            type="button"
            class="btn-small btn-secondary btn-inline"
            onclick="appliquerItemCustomPresetSurGuiCommandeItem(${itemId})"
          >
            Utiliser le preset
          </button>
        </div>

        <div class="muted gui-item-copy-hint">Remplit automatiquement l'item Minecraft, le nom et le lore depuis un preset Item Custom.</div>

        <div class="gui-item-copy-tools">
          <div>
            <label for="gui_commande_copy_from_${itemId}">Recopier depuis</label>
            <select id="gui_commande_copy_from_${itemId}" onchange="updateGuiCommandeCopyActionState(${itemId})">
              <option value="">Choisir un item source</option>
            </select>
          </div>
          <button
            type="button"
            class="btn-small btn-secondary btn-inline"
            data-gui-commande-copy-button-for="${itemId}"
            onclick="copierVisuelDepuisItemGUICommande(${itemId})"
            disabled
          >
            Copier Item + Nom + Lore(s)
          </button>
        </div>

        <div class="muted gui-item-copy-hint">Ajoute un autre item pour reutiliser son contenu.</div>

        <label for="gui_cmd_slot_${itemId}">Slot</label>
        <input type="text" id="gui_cmd_slot_${itemId}" placeholder="Ex : 0" value="${escapeHtml(data.slot || "")}">

        <label for="gui_cmd_item_${itemId}">Item</label>
        <input type="text" id="gui_cmd_item_${itemId}" list="minecraftItemOptions" placeholder="Choisir ou écrire un item Minecraft" value="${escapeHtml(data.item || "")}">

        <label for="gui_cmd_nom_${itemId}">Nom</label>
        <input type="text" id="gui_cmd_nom_${itemId}" placeholder="Ex : &aBanque" value="${escapeHtml(data.nom || "")}">

        <label for="gui_cmd_lore_${itemId}">Lore</label>
        <textarea id="gui_cmd_lore_${itemId}" placeholder="Ex : &7Clique pour ouvrir">${escapeHtml(data.lore || "")}</textarea>

        <div class="gui-item-lore-variants">
          <div class="gui-item-lore-variants-header">
            <div>
              <div class="gui-item-lore-variants-title">Variantes de lore</div>
              <div class="muted">Ex : Etat normal, Etat selectionne, indisponible...</div>
            </div>
            <button type="button" class="btn-small" onclick="ajouterGuiCommandeLoreVariante(${itemId})">+ Ajouter un lore alternatif</button>
          </div>
          <div id="gui_cmd_lore_variants_${itemId}" class="gui-item-lore-variants-list"></div>
        </div>

        <label for="gui_cmd_fonction_${itemId}">Fonction</label>
        <input type="text" id="gui_cmd_fonction_${itemId}" placeholder="Ex : ouvrir banque" value="${escapeHtml(data.fonction || "")}">

        <label for="gui_cmd_action_${itemId}">Action au clic</label>
        <input type="text" id="gui_cmd_action_${itemId}" placeholder="Ex : open_bank" value="${escapeHtml(data.action || "")}">
      `;

      container.appendChild(item);
      normalizeGuiEditorLoreVariantes(data.loreVariantes || data.loreVariants).forEach(variant => {
        ajouterGuiCommandeLoreVariante(itemId, variant, { skipRefresh: true });
      });
      updateGuiCommandeItemCopySources();
      refreshAfterStructureChange();
      updateGuiCommandeVisualization();
      return itemId;
    }

    function supprimerItemGUICommande(id) {
      const item = document.querySelector(`[data-gui-commande-item-id="${id}"]`);
      if (item) item.remove();
      updateGuiCommandeItemCopySources();
      refreshAfterStructureChange();
      updateGuiCommandeVisualization();
    }

    function recupererItemsGUICommande() {
      const items = document.querySelectorAll(".gui-item[data-gui-commande-item-id]");
      const result = [];

      items.forEach(item => {
        const id = item.dataset.guiCommandeItemId;

        const data = {
          slot: document.getElementById(`gui_cmd_slot_${id}`)?.value.trim() || "",
          item: document.getElementById(`gui_cmd_item_${id}`)?.value.trim() || "",
          nom: document.getElementById(`gui_cmd_nom_${id}`)?.value.trim() || "",
          lore: document.getElementById(`gui_cmd_lore_${id}`)?.value.trim() || "",
          loreVariantes: getGuiCommandeLoreVariantes(id),
          itemCustomPresetId: document.getElementById(`gui_commande_item_custom_preset_${id}`)?.dataset.appliedPresetId || "",
          fonction: document.getElementById(`gui_cmd_fonction_${id}`)?.value.trim() || "",
          action: document.getElementById(`gui_cmd_action_${id}`)?.value.trim() || ""
        };

        if (data.slot || data.item || data.nom || data.lore || data.loreVariantes.length || data.fonction || data.action) {
          result.push(data);
        }
      });

      return result;
    }

    function findGuiCommandeItemIdBySlot(slot) {
      const items = document.querySelectorAll(".gui-item[data-gui-commande-item-id]");

      for (const item of items) {
        const id = item.dataset.guiCommandeItemId;
        const slotValue = document.getElementById(`gui_cmd_slot_${id}`)?.value.trim() || "";
        const parsedSlot = Number.parseInt(slotValue, 10);

        if (Number.isFinite(parsedSlot) && parsedSlot === slot) {
          return id;
        }
      }

      return "";
    }

    function focusGuiCommandeItemField(itemId) {
      if (!itemId) return;

      const row = document.querySelector(`.gui-item[data-gui-commande-item-id="${itemId}"]`);
      const itemInput = document.getElementById(`gui_cmd_item_${itemId}`);

      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      if (itemInput) {
        window.setTimeout(() => {
          itemInput.focus();
        }, 180);
      }
    }

    function openGuiCommandeSlot(slot) {
      const normalizedSlot = Number.parseInt(slot, 10);
      if (!Number.isFinite(normalizedSlot)) return;

      const existingItemId = findGuiCommandeItemIdBySlot(normalizedSlot);
      if (existingItemId) {
        focusGuiCommandeItemField(existingItemId);
        return;
      }

      const newItemId = ajouterItemGUICommande({ slot: String(normalizedSlot) });
      focusGuiCommandeItemField(newItemId);
    }

    window.openGuiCommandeSlot = openGuiCommandeSlot;

    function getGuiCommandePreviewRows() {
      const selectedSize = document.getElementById("tailleGUICommande")?.value || "";
      if (selectedSize) {
        const parsedSelected = Number.parseInt(selectedSize, 10);
        if (Number.isFinite(parsedSelected) && parsedSelected > 0) {
          return Math.max(1, Math.min(6, parsedSelected));
        }
      }

      const items = recupererItemsGUICommande();
      const parsedSlots = items
        .map((item, index) => {
          const parsedSlot = Number.parseInt(item.slot, 10);
          return Number.isFinite(parsedSlot) ? parsedSlot : index;
        })
        .filter(slot => slot >= 0);

      const maxSlot = parsedSlots.length ? Math.max(...parsedSlots) : 26;
      return Math.max(1, Math.min(6, Math.ceil((maxSlot + 1) / 9)));
    }

    function renderGuiInventoryVisualization({ previewId, rows, items, backgroundImage, openSlotHandlerName }) {
      const preview = document.getElementById(previewId);
      if (!preview) return;

      const totalSlots = rows * 9;
      const layout = getGuiLayoutConfig(rows);
      const itemsBySlot = new Map();

      items.forEach((item, index) => {
        const parsedSlot = Number.parseInt(item.slot, 10);
        const fallbackSlot = index;
        const targetSlot = Number.isFinite(parsedSlot) ? parsedSlot : fallbackSlot;

        if (targetSlot >= 0 && targetSlot < totalSlots && !itemsBySlot.has(targetSlot)) {
          itemsBySlot.set(targetSlot, item);
        }
      });

      let slotsHtml = "";
      for (let index = 0; index < totalSlots; index += 1) {
        const row = Math.floor(index / 9);
        const column = index % 9;
        const left = layout.startX + column * (layout.slotSize + layout.gapX);
        const rowOffsetsY = Array.isArray(layout.rowOffsetsY) ? layout.rowOffsetsY : [];
        const top = layout.startY + row * (layout.slotSize + layout.gapY) + (rowOffsetsY[row] || 0);
        const rowExpandTop = Array.isArray(layout.rowExpandTop) ? layout.rowExpandTop : [];
        const rowExpandRight = Array.isArray(layout.rowExpandRight) ? layout.rowExpandRight : [];
        const rowExpandBottom = Array.isArray(layout.rowExpandBottom) ? layout.rowExpandBottom : [];
        const rowExpandLeft = Array.isArray(layout.rowExpandLeft) ? layout.rowExpandLeft : [];
        const expandTop = (layout.expandTop || 0) + (rowExpandTop[row] || 0);
        const expandRight = (layout.expandRight || 0) + (rowExpandRight[row] || 0);
        const expandBottom = (layout.expandBottom || 0) + (rowExpandBottom[row] || 0);
        const expandLeft = (layout.expandLeft || 0) + (rowExpandLeft[row] || 0);
        const item = itemsBySlot.get(index);
        const headDatabaseHead = item ? parseHeadDatabaseHead(item.item) : null;
        const label = item
          ? (stripMinecraftFormatting(item.nom) || (headDatabaseHead ? `HeadDatabase #${headDatabaseHead.id}` : stripMinecraftFormatting(item.item)) || `Slot ${index}`)
          : String(index);
        const blockFaces = item ? getMinecraftItemBlockFaces(item.item) : null;
        const customTextureUrl = item ? resolveGuiItemCustomTextureSource(item) : "";
        const textureUrl = item ? resolveMinecraftItemTextureUrl(item.item) : "";
        const renderedTextureUrl = item ? resolveRenderedMinecraftItemIconUrl(item.item) : "";
        const inviconUrl = item ? resolvePreferredBlockInventoryUrl(item.item) : "";
        const localFallbackTexture = textureUrl || (blockFaces?.front || "") || inviconUrl || renderedTextureUrl;
        const isBlockLike = !!blockFaces && (
          (blockFaces.front && blockFaces.front.includes("/block/")) ||
          (blockFaces.side && blockFaces.side.includes("/block/")) ||
          (blockFaces.top && blockFaces.top.includes("/block/"))
        );
        const slotTooltipHtml = item ? buildGuiSlotTooltipHtml(item, index) : "";
        const slotContent = customTextureUrl
          ? `
            <img
              class="gui-slot-rendered-item-texture gui-slot-custom-item-texture"
              src="${escapeHtml(customTextureUrl)}"
              alt="${escapeHtml(label)}"
              title="${escapeHtml(label)}"
              data-fallback="${escapeHtml(localFallbackTexture)}"
              onerror="if (this.dataset.fallback) { this.onerror = null; this.src = this.dataset.fallback; this.classList.add('is-local-fallback'); }"
            >
          `
          : headDatabaseHead
          ? `
            <div class="gui-slot-hdb-placeholder" data-hdb-id="${escapeHtml(headDatabaseHead.id)}" data-hdb-label="${escapeHtml(label)}">
              <span>HDB</span>
            </div>
          `
          : isBlockLike
          ? `
            <img
              class="gui-slot-rendered-item-texture gui-slot-block-inventory-texture"
              src="${inviconUrl}"
              alt="${escapeHtml(label)}"
              title="${escapeHtml(label)}"
              data-item-key="${escapeHtml(item?.item || "")}"
              data-front-texture="${escapeHtml(blockFaces?.front || "")}"
              data-side-texture="${escapeHtml(blockFaces?.side || "")}"
              data-top-texture="${escapeHtml(blockFaces?.top || "")}"
              data-fallback="${localFallbackTexture}"
              onerror="if (this.dataset.fallback) { this.onerror = null; this.src = this.dataset.fallback; this.classList.add('is-local-fallback'); }"
            >
          `
          : renderedTextureUrl
            ? `
              <img class="gui-slot-rendered-item-texture" src="${renderedTextureUrl}" alt="${escapeHtml(label)}" title="${escapeHtml(label)}" data-fallback="${localFallbackTexture}" onerror="if (this.dataset.fallback) { this.onerror = null; this.src = this.dataset.fallback; this.classList.add('is-local-fallback'); }">
            `
            : textureUrl
              ? `<img class="gui-slot-item-texture" src="${textureUrl}" alt="${escapeHtml(label)}" title="${escapeHtml(label)}">`
              : `<span>${escapeHtml(label)}</span>`;

        slotsHtml += `
          <div
            class="gui-slot-overlay${item ? " has-item" : ""}"
            data-slot="${index}"
            ${slotTooltipHtml ? `data-tooltip-html="${escapeHtml(slotTooltipHtml)}"` : ""}
            style="
              left:${((left - expandLeft) / layout.width) * 100}%;
              top:${((top - expandTop) / layout.height) * 100}%;
              width:${((layout.slotSize + expandLeft + expandRight) / layout.width) * 100}%;
              height:${((layout.slotSize + expandTop + expandBottom) / layout.height) * 100}%;
            "
            title="${item ? "" : escapeHtml(label)}"
          >
            ${slotContent}
          </div>
        `;
      }

      preview.innerHTML = `
        <div class="gui-visualizer-frame${backgroundImage ? " has-background" : ""}">
          ${backgroundImage
            ? `
              <div class="gui-visualizer-stage">
                <img class="gui-visualizer-image" src="${backgroundImage}" alt="Aperçu inventaire ${rows} lignes">
                <div class="gui-slot-layer">${slotsHtml}</div>
                <div class="gui-minecraft-tooltip" id="${previewId}Tooltip" aria-hidden="true"></div>
              </div>
            `
            : `<div class="gui-visualizer-title">Aucune image d'inventaire disponible pour ${rows} lignes.</div>`}
        </div>
      `;

      const tooltip = preview.querySelector(`#${previewId}Tooltip`);
      const stage = preview.querySelector(".gui-visualizer-stage");
      void hydrateHeadDatabasePreviewSlots(preview);

      const hideTooltip = () => {
        if (!tooltip) return;
        tooltip.classList.remove("is-visible");
        tooltip.setAttribute("aria-hidden", "true");
        tooltip.innerHTML = "";
      };

      const moveTooltip = (event) => {
        if (!tooltip || !stage || !tooltip.classList.contains("is-visible")) return;
        const stageRect = stage.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const offset = 14;
        let left = event.clientX - stageRect.left + offset;
        let top = event.clientY - stageRect.top + offset;
        const maxLeft = Math.max(8, stageRect.width - tooltipRect.width - 8);
        const maxTop = Math.max(8, stageRect.height - tooltipRect.height - 8);
        if (left > maxLeft) left = Math.max(8, event.clientX - stageRect.left - tooltipRect.width - offset);
        if (top > maxTop) top = Math.max(8, event.clientY - stageRect.top - tooltipRect.height - offset);
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      };

      preview.querySelectorAll(".gui-slot-overlay[data-slot]").forEach(slotEl => {
        slotEl.addEventListener("click", () => {
          const handler = window[openSlotHandlerName];
          if (typeof handler === "function") {
            handler(slotEl.dataset.slot);
          }
        });

        const tooltipHtml = slotEl.dataset.tooltipHtml || "";
        if (tooltip && tooltipHtml) {
          slotEl.addEventListener("mouseenter", event => {
            tooltip.innerHTML = tooltipHtml;
            tooltip.classList.add("is-visible");
            tooltip.setAttribute("aria-hidden", "false");
            moveTooltip(event);
          });
          slotEl.addEventListener("mousemove", moveTooltip);
          slotEl.addEventListener("mouseleave", hideTooltip);
        }
      });
    }

    /* =========================================================
       9. ITEMS GUI DYNAMIQUES POUR TEMPLATE GUI
       ========================================================= */
    function getGuiTemplateItemElements() {
      return [...document.querySelectorAll(".gui-item[data-gui-template-item-id]")];
    }

    function buildGuiTemplateItemSourceLabel(itemElement, index) {
      const id = String(itemElement?.dataset?.guiTemplateItemId || "").trim();
      const slotValue = document.getElementById(`gui_tpl_slot_${id}`)?.value.trim() || "";
      const itemValue = document.getElementById(`gui_tpl_item_${id}`)?.value.trim() || "";
      const nomValue = document.getElementById(`gui_tpl_nom_${id}`)?.value.trim() || "";
      const cleanedNom = stripMinecraftFormatting(nomValue);
      const descriptor = cleanedNom || itemValue || "";
      const parts = [`Item ${index + 1}`];

      if (slotValue) {
        parts.push(`slot ${slotValue}`);
      }

      if (descriptor) {
        parts.push(descriptor);
      }

      return parts.join(" - ");
    }

    function updateGuiTemplateCopyActionState(itemId) {
      const sourceSelect = document.getElementById(`gui_template_copy_from_${itemId}`);
      const copyButton = document.querySelector(`[data-gui-template-copy-button-for="${itemId}"]`);
      if (!sourceSelect || !copyButton) return;
      copyButton.disabled = sourceSelect.disabled || !sourceSelect.value;
    }

    function normalizeGuiTemplateLoreVariantes(loreVariantes) {
      if (!Array.isArray(loreVariantes)) return [];

      return loreVariantes
        .map(variant => ({
          contexte: String(variant?.contexte || variant?.etat || variant?.label || "").trim(),
          lore: String(variant?.lore || "").trim()
        }))
        .filter(variant => variant.contexte || variant.lore);
    }

    function getGuiTemplateLoreVariantes(itemId) {
      const container = document.getElementById(`gui_tpl_lore_variants_${itemId}`);
      if (!container) return [];

      return [...container.querySelectorAll("[data-gui-template-lore-variant-id]")]
        .map(variantRow => {
          const variantId = variantRow.dataset.guiTemplateLoreVariantId;
          return {
            contexte: document.getElementById(`gui_tpl_lore_variant_context_${variantId}`)?.value.trim() || "",
            lore: document.getElementById(`gui_tpl_lore_variant_text_${variantId}`)?.value.trim() || ""
          };
        })
        .filter(variant => variant.contexte || variant.lore);
    }

    function ajouterGuiTemplateLoreVariante(itemId, data = {}, { skipRefresh = false } = {}) {
      guiTemplateLoreVariantIndex++;
      const variantId = guiTemplateLoreVariantIndex;
      const container = document.getElementById(`gui_tpl_lore_variants_${itemId}`);
      if (!container) return "";

      const normalizedData = normalizeGuiTemplateLoreVariantes([data])[0] || {
        contexte: "",
        lore: ""
      };

      const variant = document.createElement("div");
      variant.className = "gui-item-lore-variant";
      variant.dataset.guiTemplateLoreVariantId = variantId;
      variant.dataset.guiTemplateLoreVariantParentId = itemId;
      variant.innerHTML = `
        <div class="gui-item-lore-variant-header">
          <div class="gui-item-lore-variant-title">Variante de lore</div>
          <button type="button" class="btn-remove" onclick="supprimerGuiTemplateLoreVariante(${variantId})">Supprimer</button>
        </div>

        <label for="gui_tpl_lore_variant_context_${variantId}">Contexte / etat</label>
        <input type="text" id="gui_tpl_lore_variant_context_${variantId}" placeholder="Ex : Etat selectionne" value="${escapeHtml(normalizedData.contexte)}">

        <label for="gui_tpl_lore_variant_text_${variantId}">Lore</label>
        <textarea id="gui_tpl_lore_variant_text_${variantId}" placeholder="Ex : &aCet item est actuellement utilise">${escapeHtml(normalizedData.lore)}</textarea>
      `;

      container.appendChild(variant);

      if (!skipRefresh) {
        refreshAfterStructureChange();
        updateGuiTemplateVisualization();
      }

      return String(variantId);
    }

    function remplacerGuiTemplateLoreVariantes(itemId, loreVariantes) {
      const container = document.getElementById(`gui_tpl_lore_variants_${itemId}`);
      if (!container) return;

      container.innerHTML = "";
      normalizeGuiTemplateLoreVariantes(loreVariantes).forEach(variant => {
        ajouterGuiTemplateLoreVariante(itemId, variant, { skipRefresh: true });
      });
    }

    function supprimerGuiTemplateLoreVariante(variantId) {
      const variant = document.querySelector(`[data-gui-template-lore-variant-id="${variantId}"]`);
      if (variant) {
        variant.remove();
      }

      refreshAfterStructureChange();
      updateGuiTemplateVisualization();
    }

    function updateGuiTemplateItemCopySources() {
      const itemElements = getGuiTemplateItemElements();
      const sourceItems = itemElements.map((itemElement, index) => ({
        id: String(itemElement.dataset.guiTemplateItemId || ""),
        label: buildGuiTemplateItemSourceLabel(itemElement, index)
      }));

      itemElements.forEach((itemElement, index) => {
        const itemId = String(itemElement.dataset.guiTemplateItemId || "");
        const title = itemElement.querySelector(".gui-item-title");
        const sourceSelect = document.getElementById(`gui_template_copy_from_${itemId}`);
        const copyHint = itemElement.querySelector(".gui-item-copy-hint");
        const previousValue = sourceSelect?.value || "";
        const availableSources = sourceItems.filter(source => source.id !== itemId);

        if (title) {
          title.textContent = `Item GUI ${index + 1}`;
        }

        if (!sourceSelect) {
          return;
        }

        sourceSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = availableSources.length
          ? "Choisir un item source"
          : "Aucun autre item disponible";
        sourceSelect.appendChild(defaultOption);

        availableSources.forEach(source => {
          const option = document.createElement("option");
          option.value = source.id;
          option.textContent = source.label;
          sourceSelect.appendChild(option);
        });

        sourceSelect.disabled = availableSources.length === 0;
        sourceSelect.value = availableSources.some(source => source.id === previousValue) ? previousValue : "";
        updateGuiTemplateCopyActionState(itemId);

        if (copyHint) {
          copyHint.textContent = availableSources.length
            ? "Recopie Item + Nom + Lore principal + variantes sans toucher au slot."
            : "Ajoute un autre item pour reutiliser son contenu.";
        }
      });
    }

    function copierVisuelDepuisItemGUITemplate(targetItemId) {
      const sourceSelect = document.getElementById(`gui_template_copy_from_${targetItemId}`);
      const sourceItemId = sourceSelect?.value || "";
      if (!sourceItemId) return;

      ["item", "nom", "lore"].forEach(fieldName => {
        const sourceField = document.getElementById(`gui_tpl_${fieldName}_${sourceItemId}`);
        const targetField = document.getElementById(`gui_tpl_${fieldName}_${targetItemId}`);
        if (sourceField && targetField) {
          targetField.value = sourceField.value;
        }
      });

      remplacerGuiTemplateLoreVariantes(targetItemId, getGuiTemplateLoreVariantes(sourceItemId));
      const sourcePresetSelect = document.getElementById(`gui_template_item_custom_preset_${sourceItemId}`);
      const targetPresetSelect = document.getElementById(`gui_template_item_custom_preset_${targetItemId}`);
      if (sourcePresetSelect && targetPresetSelect) {
        const appliedPresetId = sourcePresetSelect.dataset.appliedPresetId || "";
        targetPresetSelect.dataset.appliedPresetId = appliedPresetId;
        targetPresetSelect.value = appliedPresetId;
      }
      updateGuiTemplateItemCopySources();
      updateGuiTemplateVisualization();
      invalidateCDC();
      genererCDC(true);

      const focusField = document.getElementById(`gui_tpl_nom_${targetItemId}`);
      focusField?.focus();
    }

    function appliquerItemCustomPresetSurGuiTemplateItem(itemId) {
      const selectId = `gui_template_item_custom_preset_${itemId}`;
      const presetId = document.getElementById(selectId)?.value || "";
      if (!presetId) {
        return;
      }

      applyItemCustomPresetToGuiFields({
        presetId,
        selectId,
        itemFieldId: `gui_tpl_item_${itemId}`,
        nomFieldId: `gui_tpl_nom_${itemId}`,
        loreFieldId: `gui_tpl_lore_${itemId}`,
        replaceLoreVariantes: loreVariantes => remplacerGuiTemplateLoreVariantes(itemId, loreVariantes),
        afterApply: () => {
          updateGuiTemplateItemCopySources();
          refreshAfterStructureChange();
          updateGuiTemplateVisualization();
        },
        focusFieldId: `gui_tpl_nom_${itemId}`
      });
    }

    function ajouterItemGUITemplate(data = {}) {
      guiTemplateItemIndex++;
      const container = document.getElementById("guiItemsTemplateContainer");
      const itemId = guiTemplateItemIndex;

      const item = document.createElement("div");
      item.className = "gui-item";
      item.dataset.guiTemplateItemId = itemId;

      item.innerHTML = `
        <div class="gui-item-header">
          <div class="gui-item-title">Item GUI</div>
          <button type="button" class="btn-remove" onclick="supprimerItemGUITemplate(${itemId})">Supprimer</button>
        </div>

        <div class="gui-item-copy-tools">
          <div>
            <label for="gui_template_item_custom_preset_${itemId}">Preset Item Custom</label>
            <select id="gui_template_item_custom_preset_${itemId}" data-applied-preset-id="${escapeHtml(data.itemCustomPresetId || "")}">
              ${buildGuiItemCustomPresetOptionsMarkup(data.itemCustomPresetId || "")}
            </select>
          </div>
          <button
            type="button"
            class="btn-small btn-secondary btn-inline"
            onclick="appliquerItemCustomPresetSurGuiTemplateItem(${itemId})"
          >
            Utiliser le preset
          </button>
        </div>

        <div class="muted gui-item-copy-hint">Remplit automatiquement l'item Minecraft, le nom et le lore depuis un preset Item Custom.</div>

        <div class="gui-item-copy-tools">
          <div>
            <label for="gui_template_copy_from_${itemId}">Recopier depuis</label>
            <select id="gui_template_copy_from_${itemId}" onchange="updateGuiTemplateCopyActionState(${itemId})">
              <option value="">Choisir un item source</option>
            </select>
          </div>
          <button
            type="button"
            class="btn-small btn-secondary btn-inline"
            data-gui-template-copy-button-for="${itemId}"
            onclick="copierVisuelDepuisItemGUITemplate(${itemId})"
            disabled
          >
            Copier Item + Nom + Lore(s)
          </button>
        </div>

        <div class="muted gui-item-copy-hint">Ajoute un autre item pour reutiliser son contenu.</div>

        <label for="gui_tpl_slot_${itemId}">Slot</label>
        <input type="text" id="gui_tpl_slot_${itemId}" placeholder="Ex : 0" value="${escapeHtml(data.slot || "")}">

        <label for="gui_tpl_item_${itemId}">Item</label>
        <input type="text" id="gui_tpl_item_${itemId}" list="minecraftItemOptions" placeholder="Choisir ou écrire un item Minecraft" value="${escapeHtml(data.item || "")}">

        <label for="gui_tpl_nom_${itemId}">Nom</label>
        <input type="text" id="gui_tpl_nom_${itemId}" placeholder="Ex : &6Banque" value="${escapeHtml(data.nom || "")}">

        <label for="gui_tpl_lore_${itemId}">Lore</label>
        <textarea id="gui_tpl_lore_${itemId}" placeholder="Ex : &7Clique pour ouvrir">${escapeHtml(data.lore || "")}</textarea>

        <div class="gui-item-lore-variants">
          <div class="gui-item-lore-variants-header">
            <div>
              <div class="gui-item-lore-variants-title">Variantes de lore</div>
              <div class="muted">Ex : Etat normal, Etat selectionne, indisponible...</div>
            </div>
            <button type="button" class="btn-small" onclick="ajouterGuiTemplateLoreVariante(${itemId})">+ Ajouter un lore alternatif</button>
          </div>
          <div id="gui_tpl_lore_variants_${itemId}" class="gui-item-lore-variants-list"></div>
        </div>

        <label for="gui_tpl_fonction_${itemId}">Fonction</label>
        <input type="text" id="gui_tpl_fonction_${itemId}" placeholder="Ex : afficher les ressources" value="${escapeHtml(data.fonction || "")}">

        <label for="gui_tpl_action_${itemId}">Action au clic</label>
        <input type="text" id="gui_tpl_action_${itemId}" placeholder="Ex : ouvrir_sous_menu" value="${escapeHtml(data.action || "")}">
      `;

      container.appendChild(item);
      normalizeGuiTemplateLoreVariantes(data.loreVariantes || data.loreVariants).forEach(variant => {
        ajouterGuiTemplateLoreVariante(itemId, variant, { skipRefresh: true });
      });
      updateGuiTemplateItemCopySources();
      refreshAfterStructureChange();
      updateGuiTemplateVisualization();
      return itemId;
    }

    function supprimerItemGUITemplate(id) {
      const item = document.querySelector(`[data-gui-template-item-id="${id}"]`);
      if (item) item.remove();
      updateGuiTemplateItemCopySources();
      refreshAfterStructureChange();
      updateGuiTemplateVisualization();
    }

    function recupererItemsGUITemplate() {
      const items = document.querySelectorAll(".gui-item[data-gui-template-item-id]");
      const result = [];

      items.forEach(item => {
        const id = item.dataset.guiTemplateItemId;

        const data = {
          slot: document.getElementById(`gui_tpl_slot_${id}`)?.value.trim() || "",
          item: document.getElementById(`gui_tpl_item_${id}`)?.value.trim() || "",
          nom: document.getElementById(`gui_tpl_nom_${id}`)?.value.trim() || "",
          lore: document.getElementById(`gui_tpl_lore_${id}`)?.value.trim() || "",
          loreVariantes: getGuiTemplateLoreVariantes(id),
          itemCustomPresetId: document.getElementById(`gui_template_item_custom_preset_${id}`)?.dataset.appliedPresetId || "",
          fonction: document.getElementById(`gui_tpl_fonction_${id}`)?.value.trim() || "",
          action: document.getElementById(`gui_tpl_action_${id}`)?.value.trim() || ""
        };

        if (data.slot || data.item || data.nom || data.lore || data.loreVariantes.length || data.fonction || data.action) {
          result.push(data);
        }
      });

      return result;
    }

    function findGuiTemplateItemIdBySlot(slot) {
      const items = document.querySelectorAll(".gui-item[data-gui-template-item-id]");

      for (const item of items) {
        const id = item.dataset.guiTemplateItemId;
        const slotValue = document.getElementById(`gui_tpl_slot_${id}`)?.value.trim() || "";
        const parsedSlot = Number.parseInt(slotValue, 10);

        if (Number.isFinite(parsedSlot) && parsedSlot === slot) {
          return id;
        }
      }

      return "";
    }

    function focusGuiTemplateItemField(itemId) {
      if (!itemId) return;

      const row = document.querySelector(`.gui-item[data-gui-template-item-id="${itemId}"]`);
      const itemInput = document.getElementById(`gui_tpl_item_${itemId}`);

      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      if (itemInput) {
        window.setTimeout(() => {
          itemInput.focus();
          itemInput.select?.();
        }, 120);
      }
    }

    function openGuiTemplateSlot(slot) {
      const parsedSlot = Number.parseInt(slot, 10);
      if (!Number.isFinite(parsedSlot) || parsedSlot < 0) return;

      const existingItemId = findGuiTemplateItemIdBySlot(parsedSlot);
      if (existingItemId) {
        focusGuiTemplateItemField(existingItemId);
        return;
      }

      const newItemId = ajouterItemGUITemplate({ slot: String(parsedSlot) });
      focusGuiTemplateItemField(newItemId);
    }

    window.openGuiTemplateSlot = openGuiTemplateSlot;

    function stripMinecraftFormatting(value) {
      return String(value || "")
        .replace(/&[0-9a-fk-or]/gi, "")
        .replace(/&#[0-9a-f]{6}/gi, "")
        .replace(/&x(?:&[0-9a-f]){6}/gi, "")
        .replace(/^"+|"+$/g, "")
        .trim();
    }

    function renderGuiTooltipMinecraftText(value, fallbackText = "") {
      const cleaned = cleanQuotedText(String(value || "")).trim();
      if (!cleaned) {
        return fallbackText ? `<span class="mc-line">${escapeHtml(fallbackText)}</span>` : "";
      }
      return renderMinecraftFormattedText(cleaned);
    }

    function buildGuiSlotTooltipHtml(item, slotIndex) {
      if (!item) return "";

      const headDatabaseHead = parseHeadDatabaseHead(item.item);
      const fallbackName = headDatabaseHead
        ? `HeadDatabase #${headDatabaseHead.id}`
        : (stripMinecraftFormatting(item.item) || `Slot ${slotIndex}`);
      const nameHtml = renderGuiTooltipMinecraftText(item.nom, fallbackName);
      const loreHtml = renderGuiTooltipMinecraftText(item.lore || "");

      return `
        <div class="gui-minecraft-tooltip-name">${nameHtml}</div>
        ${loreHtml ? `<div class="gui-minecraft-tooltip-lore">${loreHtml}</div>` : ""}
      `;
    }

    function parseHeadDatabaseHead(value) {
      const raw = String(value || "").trim();
      const match = raw.match(/^hdb(?:[:\-_]?)(\d+)$/i);
      if (!match) return null;
      return {
        id: match[1],
        normalized: `hdb:${match[1]}`
      };
    }

    function parseHeadDatabaseTextureCatalog(text) {
      const map = new Map();

      String(text || "").split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const separatorIndex = trimmed.indexOf(":");
        if (separatorIndex <= 0) return;

        const id = trimmed.slice(0, separatorIndex).trim();
        const textureHash = trimmed.slice(separatorIndex + 1).trim();
        if (!id || !textureHash) return;

        map.set(id, textureHash);
      });

      return map;
    }

    async function loadHeadDatabaseTextureMap() {
      if (window.__HEADDB_TEXTURE_MAP__ instanceof Map) {
        return window.__HEADDB_TEXTURE_MAP__;
      }

      if (!headDatabaseTextureMapPromise) {
        headDatabaseTextureMapPromise = fetch(HEADDATABASE_REMOTE_TEXTURES_PATH, { cache: "force-cache" })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Impossible de charger le catalogue HeadDatabase (${response.status}).`);
            }
            return response.text();
          })
          .then(text => {
            const map = parseHeadDatabaseTextureCatalog(text);
            window.__HEADDB_TEXTURE_MAP__ = map;
            return map;
          })
          .catch(error => {
            headDatabaseTextureMapPromise = null;
            console.error("[Neodium] Chargement HeadDatabase impossible", error);
            throw error;
          });
      }

      return headDatabaseTextureMapPromise;
    }

    async function hydrateHeadDatabasePreviewSlots(previewRoot) {
      if (!previewRoot) return;

      const placeholders = Array.from(previewRoot.querySelectorAll(".gui-slot-hdb-placeholder[data-hdb-id]"));
      if (!placeholders.length) return;

      let textureMap = null;
      try {
        textureMap = await loadHeadDatabaseTextureMap();
      } catch (error) {
        return;
      }

      placeholders.forEach(placeholder => {
        if (!placeholder.isConnected) return;

        const headId = String(placeholder.dataset.hdbId || "").trim();
        const label = String(placeholder.dataset.hdbLabel || `HeadDatabase #${headId}`);
        const textureHash = textureMap.get(headId);

        if (!textureHash) {
          placeholder.innerHTML = `<span>${escapeHtml(label)}</span>`;
          return;
        }

        const renderedHeadUrl = `https://mc-heads.net/head/${encodeURIComponent(textureHash)}/64.png`;
        placeholder.innerHTML = `<img class="gui-slot-rendered-item-texture" src="${renderedHeadUrl}" alt="${escapeHtml(label)}" title="${escapeHtml(label)}">`;
      });
    }

    function normalizeMinecraftItemKey(value) {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/^minecraft:/, "");
    }

    function resolveMinecraftItemTextureUrl(itemKey) {
      if (parseHeadDatabaseHead(itemKey)) return "";

      const normalizedItemKey = normalizeMinecraftItemKey(itemKey);
      if (!normalizedItemKey) return "";

      const texturePath = MINECRAFT_ITEM_TEXTURE_MAP[normalizedItemKey];
      if (!texturePath) return "";

      return `${LOCAL_MINECRAFT_ITEM_TEXTURES_BASE_PATH}/${texturePath}.png`;
    }

    function isLocalOnlyMinecraftItem(itemKey) {
      const normalizedItemKey = normalizeMinecraftItemKey(itemKey);
      if (!normalizedItemKey) return false;

      if (CUSTOM_MINECRAFT_ITEM_KEYS.includes(normalizedItemKey)) {
        return true;
      }

      const texturePath = getMinecraftItemTexturePath(normalizedItemKey);
      return texturePath.includes("/neodium/") || normalizedItemKey === "gemme_ore_block";
    }

    function resolveRenderedMinecraftItemIconUrl(itemKey) {
      if (parseHeadDatabaseHead(itemKey)) return "";

      const normalizedItemKey = normalizeMinecraftItemKey(itemKey);
      if (!normalizedItemKey || isLocalOnlyMinecraftItem(normalizedItemKey)) return "";

      return `https://api.minecraftitems.xyz/api/item/${encodeURIComponent(normalizedItemKey)}/size=4`;
    }

    function resolvePreferredBlockInventoryUrl(itemKey) {
      if (parseHeadDatabaseHead(itemKey)) return "";

      const normalizedItemKey = normalizeMinecraftItemKey(itemKey);
      if (!normalizedItemKey) return "";

      if (isLocalOnlyMinecraftItem(normalizedItemKey)) {
        return resolveMinecraftItemTextureUrl(normalizedItemKey) || getMinecraftItemBlockFaces(normalizedItemKey)?.front || "";
      }

      // Some blocks have unreliable wiki invicon names, so we force the
      // rendered inventory icon to keep a consistent Minecraft-like display.
      if (normalizedItemKey === "emerald_block" || normalizedItemKey === "lapis_ore") {
        return resolveRenderedMinecraftItemIconUrl(normalizedItemKey);
      }

      return resolveMinecraftWikiInviconUrl(normalizedItemKey);
    }

    function toMinecraftWikiInviconName(itemKey) {
      const normalizedItemKey = normalizeMinecraftItemKey(itemKey);
      if (!normalizedItemKey) return "";

      return normalizedItemKey
        .split("_")
        .map(part => {
          if (part === "tnt") return "TNT";
          if (part === "xp") return "XP";
          return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join(" ");
    }

    function resolveMinecraftWikiInviconUrl(itemKey) {
      const inviconName = toMinecraftWikiInviconName(itemKey);
      if (!inviconName) return "";

      return `https://minecraft.wiki/Special:FilePath/${encodeURIComponent(`Invicon ${inviconName}.png`)}`;
    }

    function getMinecraftItemTexturePath(itemKey) {
      const normalizedItemKey = normalizeMinecraftItemKey(itemKey);
      if (!normalizedItemKey) return "";
      return MINECRAFT_ITEM_TEXTURE_MAP[normalizedItemKey] || "";
    }

    function getMinecraftItemBlockFaces(itemKey) {
      const normalizedItemKey = normalizeMinecraftItemKey(itemKey);
      if (!normalizedItemKey) return null;

      const faces = MINECRAFT_ITEM_BLOCK_FACES_MAP[normalizedItemKey];
      if (!faces) return null;

      const front = faces.front ? `${LOCAL_MINECRAFT_ITEM_TEXTURES_BASE_PATH}/${faces.front}.png` : "";
      const side = faces.side ? `${LOCAL_MINECRAFT_ITEM_TEXTURES_BASE_PATH}/${faces.side}.png` : front;
      const top = faces.top ? `${LOCAL_MINECRAFT_ITEM_TEXTURES_BASE_PATH}/${faces.top}.png` : side || front;

      if (!front && !side && !top) return null;

      return {
        front: front || side || top,
        side: side || front || top,
        top: top || side || front
      };
    }

    function getGuiPreviewRows() {
      const guiTaille = document.getElementById("guiTaille")?.value || "3 lignes";
      const guiTailleAutre = document.getElementById("guiTailleAutre")?.value || "";

      if (guiTaille !== "Autre") {
        const parsed = Number.parseInt(guiTaille, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
      }

      const match = guiTailleAutre.match(/\d+/);
      const parsed = Number.parseInt(match?.[0] || "", 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
    }

    function getGuiBackgroundImagePath(rows) {
      const backgrounds = {
        1: "./GUI/interface_UI_-_Neodium_1_lignes.png",
        2: "./GUI/interface_UI_-_Neodium_2_lignes.png",
        3: "./GUI/interface_UI_-_Neodium_3_lignes.png",
        4: "./GUI/interface_UI_-_Neodium_4_lignes.png",
        5: "./GUI/interface_UI_-_Neodium_5_lignes.png",
        6: "./GUI/interface_UI_-_Neodium_6_lignes.png"
      };

      return backgrounds[rows] || "";
    }

    function getGuiLayoutConfig(rows) {
      const configs = {
        // Chaque texture a sa propre grille: on cale les slots sur les cases sombres
        // visibles dans l'image, au lieu de réutiliser une config générique.
        1: {
          width: 197,
          height: 59,
          startX: 21,
          startY: 31,
          slotSize: 15,
          gapX: 3,
          gapY: 2,
          expandTop: 1,
          expandRight: 1
        },
        2: {
          width: 199,
          height: 77,
          startX: 22,
          startY: 32,
          slotSize: 14,
          gapX: 4,
          gapY: 3,
          expandTop: 1,
          expandRight: 2,
          expandBottom: 1,
          rowOffsetsY: [-1, 0]
        },
        3: {
          width: 203,
          height: 96,
          startX: 29,
          startY: 35,
          slotSize: 13,
          gapX: 5,
          gapY: 4,
          expandTop: 0,
          expandRight: 0,
          expandBottom: 0,
          rowOffsetsY: [-4, -3, -2],
          rowExpandLeft: [3, 3, 3],
          rowExpandBottom: [3, 3, 3]
        },
        4: {
          width: 202,
          height: 113,
          startX: 29,
          startY: 34,
          slotSize: 13,
          gapX: 5,
          gapY: 4,
          expandTop: 0,
          expandRight: 0,
          expandBottom: 0,
          rowOffsetsY: [-4, -3, -2, -1],
          rowExpandLeft: [3, 3, 3, 3],
          rowExpandBottom: [3, 3, 3, 3]
        },
        5: {
          width: 201,
          height: 134,
          startX: 28,
          startY: 36,
          slotSize: 13,
          gapX: 5,
          gapY: 4,
          expandTop: 0,
          expandRight: 0,
          expandBottom: 0,
          rowOffsetsY: [-4, -3, -2, -1, 0],
          rowExpandLeft: [3, 3, 3, 3, 3],
          rowExpandBottom: [3, 3, 3, 3, 3]
        },
        6: { width: 200, height: 150, startX: 24, startY: 31, slotSize: 16, gapX: 2, gapY: 2 }
      };

      return configs[rows] || configs[3];
    }

    function updateGuiTemplateVisualization() {
      const rows = getGuiPreviewRows();
      const backgroundImage = getGuiBackgroundImagePath(rows);
      const items = recupererItemsGUITemplate();
      renderGuiInventoryVisualization({
        previewId: "guiVisualPreview",
        rows,
        items,
        backgroundImage,
        openSlotHandlerName: "openGuiTemplateSlot"
      });
    }

    function updateGuiCommandeVisualization() {
      const rows = getGuiCommandePreviewRows();
      const backgroundImage = getGuiBackgroundImagePath(rows);
      const items = recupererItemsGUICommande();

      renderGuiInventoryVisualization({
        previewId: "guiCommandeVisualPreview",
        rows,
        items,
        backgroundImage,
        openSlotHandlerName: "openGuiCommandeSlot"
      });
    }

    function ajouterMetierItemRow(data = {}) {
      metierItemIndex++;
      const container = document.getElementById("metierItemsContainer");
      if (!container) return;

      const item = document.createElement("div");
      item.className = "gui-item";
      item.dataset.metierItemId = metierItemIndex;

      item.innerHTML = `
        <div class="gui-item-header">
          <div class="gui-item-title">Ligne progression item</div>
          <button type="button" class="btn-remove" onclick="supprimerMetierItemRow(${metierItemIndex})">Supprimer</button>
        </div>

        <div class="grid-3">
          <div>
            <label for="metier_item_nom_${metierItemIndex}">Item</label>
            <input type="text" id="metier_item_nom_${metierItemIndex}" placeholder="Ex : Blé" value="${escapeHtml(data.item || "")}">
          </div>

          <div>
            <label for="metier_item_niveau_${metierItemIndex}">Niveau de déblocage</label>
            <input type="text" id="metier_item_niveau_${metierItemIndex}" placeholder="Ex : 5" value="${escapeHtml(data.niveau || "")}">
          </div>

          <div>
            <label for="metier_item_xp_${metierItemIndex}">XP donné</label>
            <input type="text" id="metier_item_xp_${metierItemIndex}" placeholder="Ex : 25 XP" value="${escapeHtml(data.xp || "")}">
          </div>
        </div>
      `;

      container.appendChild(item);
      refreshAfterStructureChange();
    }

    function supprimerMetierItemRow(id) {
      const item = document.querySelector(`[data-metier-item-id="${id}"]`);
      if (item) item.remove();
      refreshAfterStructureChange();
    }

    function recupererMetierItems() {
      const items = document.querySelectorAll("[data-metier-item-id]");
      const result = [];

      items.forEach(item => {
        const id = item.dataset.metierItemId;
        const data = {
          item: document.getElementById(`metier_item_nom_${id}`)?.value.trim() || "",
          niveau: document.getElementById(`metier_item_niveau_${id}`)?.value.trim() || "",
          xp: document.getElementById(`metier_item_xp_${id}`)?.value.trim() || ""
        };

        if (data.item || data.niveau || data.xp) {
          result.push(data);
        }
      });

      return result;
    }

    function ajouterMetierLevelRewardRow(data = {}) {
      metierLevelRewardIndex++;
      const container = document.getElementById("metierLevelRewardsContainer");
      if (!container) return;

      const item = document.createElement("div");
      item.className = "gui-item";
      item.dataset.metierLevelRewardId = metierLevelRewardIndex;

      item.innerHTML = `
        <div class="gui-item-header">
          <div class="gui-item-title">Ligne récompense niveau</div>
          <button type="button" class="btn-remove" onclick="supprimerMetierLevelRewardRow(${metierLevelRewardIndex})">Supprimer</button>
        </div>

        <div class="grid-3">
          <div>
            <label for="metier_reward_level_${metierLevelRewardIndex}">Niveau</label>
            <input type="text" id="metier_reward_level_${metierLevelRewardIndex}" placeholder="Ex : 10" value="${escapeHtml(data.niveau || "")}">
          </div>

          <div>
            <label for="metier_reward_xp_${metierLevelRewardIndex}">XP</label>
            <input type="text" id="metier_reward_xp_${metierLevelRewardIndex}" placeholder="Ex : 1 500 XP" value="${escapeHtml(data.xp || "")}">
          </div>

          <div>
            <label for="metier_reward_gain_${metierLevelRewardIndex}">Récompense</label>
            <input type="text" id="metier_reward_gain_${metierLevelRewardIndex}" placeholder="Ex : Accès à la récolte rare" value="${escapeHtml(data.recompense || "")}">
          </div>
        </div>
      `;

      container.appendChild(item);
      refreshAfterStructureChange();
    }

    function supprimerMetierLevelRewardRow(id) {
      const item = document.querySelector(`[data-metier-level-reward-id="${id}"]`);
      if (item) item.remove();
      refreshAfterStructureChange();
    }

    function recupererMetierLevelRewards() {
      const items = document.querySelectorAll("[data-metier-level-reward-id]");
      const result = [];

      items.forEach(item => {
        const id = item.dataset.metierLevelRewardId;
        const data = {
          niveau: document.getElementById(`metier_reward_level_${id}`)?.value.trim() || "",
          xp: document.getElementById(`metier_reward_xp_${id}`)?.value.trim() || "",
          recompense: document.getElementById(`metier_reward_gain_${id}`)?.value.trim() || ""
        };

        if (data.niveau || data.xp || data.recompense) {
          result.push(data);
        }
      });

      return result;
    }

    function getMetierGuiItemElements() {
      return [...document.querySelectorAll("[data-metier-gui-item-id]")];
    }

    function buildMetierGuiItemSourceLabel(itemElement, index) {
      const id = String(itemElement?.dataset?.metierGuiItemId || "").trim();
      const itemValue = document.getElementById(`metier_gui_item_${id}`)?.value.trim() || "";
      const nomValue = document.getElementById(`metier_gui_nom_${id}`)?.value.trim() || "";
      const cleanedNom = stripMinecraftFormatting(nomValue);
      return [`Item ${index + 1}`, cleanedNom || itemValue || ""].filter(Boolean).join(" - ");
    }

    function updateMetierGuiCopyActionState(itemId) {
      const sourceSelect = document.getElementById(`metier_gui_copy_from_${itemId}`);
      const copyButton = document.querySelector(`[data-metier-gui-copy-button-for="${itemId}"]`);
      if (!sourceSelect || !copyButton) return;
      copyButton.disabled = sourceSelect.disabled || !sourceSelect.value;
    }

    function getMetierGuiLoreVariantes(itemId) {
      const container = document.getElementById(`metier_gui_lore_variants_${itemId}`);
      if (!container) return [];

      return [...container.querySelectorAll("[data-metier-gui-lore-variant-id]")]
        .map(variantRow => {
          const variantId = variantRow.dataset.metierGuiLoreVariantId;
          return {
            contexte: document.getElementById(`metier_gui_lore_variant_context_${variantId}`)?.value.trim() || "",
            lore: document.getElementById(`metier_gui_lore_variant_text_${variantId}`)?.value.trim() || ""
          };
        })
        .filter(variant => variant.contexte || variant.lore);
    }

    function ajouterMetierGuiLoreVariante(itemId, data = {}, { skipRefresh = false } = {}) {
      metierGuiLoreVariantIndex++;
      const variantId = metierGuiLoreVariantIndex;
      const container = document.getElementById(`metier_gui_lore_variants_${itemId}`);
      if (!container) return "";

      const normalizedData = normalizeGuiEditorLoreVariantes([data])[0] || {
        contexte: "",
        lore: ""
      };

      const variant = document.createElement("div");
      variant.className = "gui-item-lore-variant";
      variant.dataset.metierGuiLoreVariantId = variantId;
      variant.dataset.metierGuiLoreVariantParentId = itemId;
      variant.innerHTML = `
        <div class="gui-item-lore-variant-header">
          <div class="gui-item-lore-variant-title">Variante de lore</div>
          <button type="button" class="btn-remove" onclick="supprimerMetierGuiLoreVariante(${variantId})">Supprimer</button>
        </div>

        <label for="metier_gui_lore_variant_context_${variantId}">Contexte / etat</label>
        <input type="text" id="metier_gui_lore_variant_context_${variantId}" placeholder="Ex : Etat selectionne" value="${escapeHtml(normalizedData.contexte)}">

        <label for="metier_gui_lore_variant_text_${variantId}">Lore</label>
        <textarea id="metier_gui_lore_variant_text_${variantId}" placeholder="Ex : &aCe metier est actuellement selectionne">${escapeHtml(normalizedData.lore)}</textarea>
      `;

      container.appendChild(variant);

      if (!skipRefresh) {
        refreshAfterStructureChange();
      }

      return String(variantId);
    }

    function remplacerMetierGuiLoreVariantes(itemId, loreVariantes) {
      const container = document.getElementById(`metier_gui_lore_variants_${itemId}`);
      if (!container) return;

      container.innerHTML = "";
      normalizeGuiEditorLoreVariantes(loreVariantes).forEach(variant => {
        ajouterMetierGuiLoreVariante(itemId, variant, { skipRefresh: true });
      });
    }

    function supprimerMetierGuiLoreVariante(variantId) {
      const variant = document.querySelector(`[data-metier-gui-lore-variant-id="${variantId}"]`);
      if (variant) {
        variant.remove();
      }

      refreshAfterStructureChange();
    }

    function updateMetierGuiItemCopySources() {
      const itemElements = getMetierGuiItemElements();
      const sourceItems = itemElements.map((itemElement, index) => ({
        id: String(itemElement.dataset.metierGuiItemId || ""),
        label: buildMetierGuiItemSourceLabel(itemElement, index)
      }));

      itemElements.forEach((itemElement, index) => {
        const itemId = String(itemElement.dataset.metierGuiItemId || "");
        const title = itemElement.querySelector(".gui-item-title");
        const sourceSelect = document.getElementById(`metier_gui_copy_from_${itemId}`);
        const copyHint = itemElement.querySelector(".gui-item-copy-hint");
        const previousValue = sourceSelect?.value || "";
        const availableSources = sourceItems.filter(source => source.id !== itemId);

        if (title) {
          title.textContent = `Item du GUI ${index + 1}`;
        }

        if (!sourceSelect) {
          return;
        }

        sourceSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = availableSources.length
          ? "Choisir un item source"
          : "Aucun autre item disponible";
        sourceSelect.appendChild(defaultOption);

        availableSources.forEach(source => {
          const option = document.createElement("option");
          option.value = source.id;
          option.textContent = source.label;
          sourceSelect.appendChild(option);
        });

        sourceSelect.disabled = availableSources.length === 0;
        sourceSelect.value = availableSources.some(source => source.id === previousValue) ? previousValue : "";
        updateMetierGuiCopyActionState(itemId);

        if (copyHint) {
          copyHint.textContent = availableSources.length
            ? "Recopie Item + Nom + Lore principal + variantes."
            : "Ajoute un autre item pour reutiliser son contenu.";
        }
      });
    }

    function copierVisuelDepuisMetierGuiItem(targetItemId) {
      const sourceSelect = document.getElementById(`metier_gui_copy_from_${targetItemId}`);
      const sourceItemId = sourceSelect?.value || "";
      if (!sourceItemId) return;

      ["item", "nom", "lore"].forEach(fieldName => {
        const sourceField = document.getElementById(`metier_gui_${fieldName}_${sourceItemId}`);
        const targetField = document.getElementById(`metier_gui_${fieldName}_${targetItemId}`);
        if (sourceField && targetField) {
          targetField.value = sourceField.value;
        }
      });

      remplacerMetierGuiLoreVariantes(targetItemId, getMetierGuiLoreVariantes(sourceItemId));
      const sourcePresetSelect = document.getElementById(`metier_gui_item_custom_preset_${sourceItemId}`);
      const targetPresetSelect = document.getElementById(`metier_gui_item_custom_preset_${targetItemId}`);
      if (sourcePresetSelect && targetPresetSelect) {
        const appliedPresetId = sourcePresetSelect.dataset.appliedPresetId || "";
        targetPresetSelect.dataset.appliedPresetId = appliedPresetId;
        targetPresetSelect.value = appliedPresetId;
      }
      updateMetierGuiItemCopySources();
      invalidateCDC();
      genererCDC(true);

      const focusField = document.getElementById(`metier_gui_nom_${targetItemId}`);
      focusField?.focus();
    }

    function appliquerItemCustomPresetSurMetierGuiItem(itemId) {
      const selectId = `metier_gui_item_custom_preset_${itemId}`;
      const presetId = document.getElementById(selectId)?.value || "";
      if (!presetId) {
        return;
      }

      applyItemCustomPresetToGuiFields({
        presetId,
        selectId,
        itemFieldId: `metier_gui_item_${itemId}`,
        nomFieldId: `metier_gui_nom_${itemId}`,
        loreFieldId: `metier_gui_lore_${itemId}`,
        replaceLoreVariantes: loreVariantes => remplacerMetierGuiLoreVariantes(itemId, loreVariantes),
        afterApply: () => {
          updateMetierGuiItemCopySources();
          refreshAfterStructureChange();
        },
        focusFieldId: `metier_gui_nom_${itemId}`
      });
    }

    function ajouterMetierGuiItem(data = {}) {
      metierGuiItemIndex++;
      const container = document.getElementById("metierGuiItemsContainer");
      if (!container) return;
      const itemId = metierGuiItemIndex;

      const item = document.createElement("div");
      item.className = "gui-item";
      item.dataset.metierGuiItemId = itemId;

      item.innerHTML = `
        <div class="gui-item-header">
          <div class="gui-item-title">Item du GUI</div>
          <button type="button" class="btn-remove" onclick="supprimerMetierGuiItem(${itemId})">Supprimer</button>
        </div>

        <div class="gui-item-copy-tools">
          <div>
            <label for="metier_gui_item_custom_preset_${itemId}">Preset Item Custom</label>
            <select id="metier_gui_item_custom_preset_${itemId}" data-applied-preset-id="${escapeHtml(data.itemCustomPresetId || "")}">
              ${buildGuiItemCustomPresetOptionsMarkup(data.itemCustomPresetId || "")}
            </select>
          </div>
          <button
            type="button"
            class="btn-small btn-secondary btn-inline"
            onclick="appliquerItemCustomPresetSurMetierGuiItem(${itemId})"
          >
            Utiliser le preset
          </button>
        </div>

        <div class="muted gui-item-copy-hint">Remplit automatiquement l'item Minecraft, le nom et le lore depuis un preset Item Custom.</div>

        <div class="gui-item-copy-tools">
          <div>
            <label for="metier_gui_copy_from_${itemId}">Recopier depuis</label>
            <select id="metier_gui_copy_from_${itemId}" onchange="updateMetierGuiCopyActionState(${itemId})">
              <option value="">Choisir un item source</option>
            </select>
          </div>
          <button
            type="button"
            class="btn-small btn-secondary btn-inline"
            data-metier-gui-copy-button-for="${itemId}"
            onclick="copierVisuelDepuisMetierGuiItem(${itemId})"
            disabled
          >
            Copier Item + Nom + Lore(s)
          </button>
        </div>

        <div class="muted gui-item-copy-hint">Ajoute un autre item pour reutiliser son contenu.</div>

        <div class="grid-2">
          <div>
            <label for="metier_gui_item_${itemId}">Item</label>
            <input type="text" id="metier_gui_item_${itemId}" placeholder="Ex : BLAZE_ROD" value="${escapeHtml(data.item || "")}">
          </div>

          <div>
            <label for="metier_gui_nom_${itemId}">Nom</label>
            <input type="text" id="metier_gui_nom_${itemId}" placeholder="Ex : &6Métier Mineur" value="${escapeHtml(data.nom || "")}">
          </div>
        </div>

        <label for="metier_gui_lore_${itemId}">Lore</label>
        <textarea id="metier_gui_lore_${itemId}" placeholder="Ex : &7Affiche la progression du métier et les récompenses à venir.">${escapeHtml(data.lore || "")}</textarea>

        <div class="gui-item-lore-variants">
          <div class="gui-item-lore-variants-header">
            <div>
              <div class="gui-item-lore-variants-title">Variantes de lore</div>
              <div class="muted">Ex : Etat normal, Etat selectionne, max atteint...</div>
            </div>
            <button type="button" class="btn-small" onclick="ajouterMetierGuiLoreVariante(${itemId})">+ Ajouter un lore alternatif</button>
          </div>
          <div id="metier_gui_lore_variants_${itemId}" class="gui-item-lore-variants-list"></div>
        </div>
      `;

      container.appendChild(item);
      normalizeGuiEditorLoreVariantes(data.loreVariantes || data.loreVariants).forEach(variant => {
        ajouterMetierGuiLoreVariante(itemId, variant, { skipRefresh: true });
      });
      updateMetierGuiItemCopySources();
      refreshAfterStructureChange();
    }

    function supprimerMetierGuiItem(id) {
      const item = document.querySelector(`[data-metier-gui-item-id="${id}"]`);
      if (item) item.remove();
      updateMetierGuiItemCopySources();
      refreshAfterStructureChange();
    }

    function recupererMetierGuiItems() {
      const items = document.querySelectorAll("[data-metier-gui-item-id]");
      const result = [];

      items.forEach(item => {
        const id = item.dataset.metierGuiItemId;
        const data = {
          item: document.getElementById(`metier_gui_item_${id}`)?.value.trim() || "",
          nom: document.getElementById(`metier_gui_nom_${id}`)?.value.trim() || "",
          lore: document.getElementById(`metier_gui_lore_${id}`)?.value.trim() || "",
          itemCustomPresetId: document.getElementById(`metier_gui_item_custom_preset_${id}`)?.dataset.appliedPresetId || "",
          loreVariantes: getMetierGuiLoreVariantes(id)
        };

        if (data.item || data.nom || data.lore || data.loreVariantes.length) {
          result.push(data);
        }
      });

      return result;
    }

    function ajouterMobSpawn(data = {}) {
      mobSpawnIndex++;
      const container = document.getElementById("mobSpawnsContainer");
      if (!container) return;

      const item = document.createElement("div");
      item.className = "gui-item";
      item.dataset.mobSpawnId = mobSpawnIndex;

      item.innerHTML = `
        <div class="gui-item-header">
          <div class="gui-item-title">Spawn</div>
          <button type="button" class="btn-remove" onclick="supprimerMobSpawn(${mobSpawnIndex})">Supprimer</button>
        </div>

        <div class="grid-3">
          <div>
            <label for="mob_spawn_coordonnees_${mobSpawnIndex}">Coordonnées</label>
            <input type="text" id="mob_spawn_coordonnees_${mobSpawnIndex}" placeholder="Ex : 125 64 -218" value="${escapeHtml(data.coordonnees || "")}">
          </div>

          <div>
            <label for="mob_spawn_intervalle_${mobSpawnIndex}">Intervalle</label>
            <input type="text" id="mob_spawn_intervalle_${mobSpawnIndex}" placeholder="Ex : toutes les 45 secondes" value="${escapeHtml(data.intervalle || "")}">
          </div>

          <div>
            <label for="mob_spawn_nombre_max_${mobSpawnIndex}">Nombre max</label>
            <input type="text" id="mob_spawn_nombre_max_${mobSpawnIndex}" placeholder="Ex : 8" value="${escapeHtml(data.nombreMax || "")}">
          </div>
        </div>
      `;

      container.appendChild(item);
      refreshAfterStructureChange();
    }

    function supprimerMobSpawn(id) {
      const item = document.querySelector(`[data-mob-spawn-id="${id}"]`);
      if (item) item.remove();
      refreshAfterStructureChange();
    }

    function recupererMobSpawns() {
      const items = document.querySelectorAll("[data-mob-spawn-id]");
      const result = [];

      items.forEach(item => {
        const id = item.dataset.mobSpawnId;
        const data = {
          coordonnees: document.getElementById(`mob_spawn_coordonnees_${id}`)?.value.trim() || "",
          intervalle: document.getElementById(`mob_spawn_intervalle_${id}`)?.value.trim() || "",
          nombreMax: document.getElementById(`mob_spawn_nombre_max_${id}`)?.value.trim() || ""
        };

        if (data.coordonnees || data.intervalle || data.nombreMax) {
          result.push(data);
        }
      });

      return result;
    }

    function ajouterMobDrop(data = {}) {
      mobDropIndex++;
      const container = document.getElementById("mobDropsContainer");
      if (!container) return;

      const item = document.createElement("div");
      item.className = "gui-item";
      item.dataset.mobDropId = mobDropIndex;

      item.innerHTML = `
        <div class="gui-item-header">
          <div class="gui-item-title">Drop</div>
          <button type="button" class="btn-remove" onclick="supprimerMobDrop(${mobDropIndex})">Supprimer</button>
        </div>

        <div class="grid-3">
          <div>
            <label for="mob_drop_item_${mobDropIndex}">Item</label>
            <input type="text" id="mob_drop_item_${mobDropIndex}" placeholder="Ex : Fragment corrompu" value="${escapeHtml(data.item || "")}">
          </div>

          <div>
            <label for="mob_drop_quantite_${mobDropIndex}">Quantité</label>
            <input type="text" id="mob_drop_quantite_${mobDropIndex}" placeholder="Ex : 1 à 3" value="${escapeHtml(data.quantite || "")}">
          </div>

          <div>
            <label for="mob_drop_taux_${mobDropIndex}">Taux</label>
            <input type="text" id="mob_drop_taux_${mobDropIndex}" placeholder="Ex : 12%" value="${escapeHtml(data.taux || "")}">
          </div>
        </div>
      `;

      container.appendChild(item);
      refreshAfterStructureChange();
    }

    function supprimerMobDrop(id) {
      const item = document.querySelector(`[data-mob-drop-id="${id}"]`);
      if (item) item.remove();
      refreshAfterStructureChange();
    }

    function ajouterLibreSection(data = {}) {
      libreSectionIndex++;
      const container = document.getElementById("libreSectionsContainer");
      if (!container) return;

      const item = document.createElement("div");
      item.className = "gui-item";
      item.dataset.libreSectionId = libreSectionIndex;
      item.innerHTML = `
        <div class="gui-item-header">
          <div class="gui-item-title">Bloc</div>
          <button type="button" class="btn-remove" onclick="supprimerLibreSection(${libreSectionIndex})">Supprimer</button>
        </div>

        <div>
          <label for="libre_section_titre_${libreSectionIndex}">Titre du bloc</label>
          <input type="text" id="libre_section_titre_${libreSectionIndex}" placeholder="Ex : Déclenchement visuel" value="${escapeHtml(data.titre || "")}">
        </div>

        <div>
          <label for="libre_section_contenu_${libreSectionIndex}">Contenu</label>
          <textarea id="libre_section_contenu_${libreSectionIndex}" placeholder="Décris ici librement ce bloc...">${escapeHtml(data.contenu || "")}</textarea>
        </div>
      `;

      container.appendChild(item);
      refreshAfterStructureChange();
    }

    function supprimerLibreSection(id) {
      const item = document.querySelector(`[data-libre-section-id="${id}"]`);
      if (item) item.remove();
      refreshAfterStructureChange();
    }

    function recupererLibreSections() {
      return Array.from(document.querySelectorAll("[data-libre-section-id]")).map(item => {
        const id = item.dataset.libreSectionId;
        return {
          titre: document.getElementById(`libre_section_titre_${id}`)?.value.trim() || "",
          contenu: document.getElementById(`libre_section_contenu_${id}`)?.value.trim() || ""
        };
      });
    }

    function recupererMobDrops() {
      const items = document.querySelectorAll("[data-mob-drop-id]");
      const result = [];

      items.forEach(item => {
        const id = item.dataset.mobDropId;
        const data = {
          item: document.getElementById(`mob_drop_item_${id}`)?.value.trim() || "",
          quantite: document.getElementById(`mob_drop_quantite_${id}`)?.value.trim() || "",
          taux: document.getElementById(`mob_drop_taux_${id}`)?.value.trim() || ""
        };

        if (data.item || data.quantite || data.taux) {
          result.push(data);
        }
      });

      return result;
    }

    /* =========================================================
       14. FONCTION CENTRALE
       - génère :
       1) le texte brut (copie / txt)
       2) l'aperçu HTML (avec image)
       ========================================================= */
    function genererCDC(force = false) {
      if (!force && !isCDCDirty && dernierTexteGenere) {
        return;
      }

      cancelScheduledCDCGeneration();

      const template = document.getElementById("template").value;
      const templateConfig = TEMPLATE_CONFIG[template] || TEMPLATE_CONFIG.commande;

      dernierTexteGenere = templateConfig.textGenerator();
      const previewHtml = templateConfig.previewGenerator();
      isCDCDirty = false;

      document.getElementById("preview").innerHTML = previewHtml;
    }

    function isRelativeClipboardImageSource(sourceUrl) {
      const normalizedUrl = String(sourceUrl || "").trim();
      if (!normalizedUrl) return false;
      if (/^(data:|https?:|blob:|file:)/i.test(normalizedUrl)) {
        return false;
      }
      return normalizedUrl.startsWith("./")
        || normalizedUrl.startsWith("../")
        || normalizedUrl.startsWith("/");
    }

    async function buildClipboardCompatibleImageSource(sourceUrl) {
      const normalizedUrl = String(sourceUrl || "").trim();
      if (!normalizedUrl) {
        return normalizedUrl;
      }

      if (isRelativeClipboardImageSource(normalizedUrl)) {
        try {
          return new URL(normalizedUrl, window.location.href).href;
        } catch (error) {
          return normalizedUrl;
        }
      }

      if (!normalizedUrl.startsWith("data:image/")) {
        return normalizedUrl;
      }

      return await new Promise(resolve => {
        const image = new Image();

        image.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, image.naturalWidth || image.width || 1);
            canvas.height = Math.max(1, image.naturalHeight || image.height || 1);
            const context = canvas.getContext("2d");

            if (!context) {
              resolve(normalizedUrl);
              return;
            }

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0);

            const clipboardDataUrl = canvas.toDataURL("image/png");
            resolve(clipboardDataUrl && clipboardDataUrl !== "data:," ? clipboardDataUrl : normalizedUrl);
          } catch (error) {
            resolve(normalizedUrl);
          }
        };

        image.onerror = () => {
          resolve(normalizedUrl);
        };

        image.src = normalizedUrl;
      });
    }

    async function normalizeClipboardPreviewImages(clone) {
      const images = Array.from(clone.querySelectorAll("img"));

      await Promise.all(images.map(async (image) => {
        const rawSource = String(image.getAttribute("src") || "").trim();
        if (!rawSource) return;
        const nextSource = await buildClipboardCompatibleImageSource(rawSource);
        if (nextSource && nextSource !== rawSource) {
          image.setAttribute("src", nextSource);
        }

        const rawFallback = String(image.getAttribute("data-fallback") || "").trim();
        if (!rawFallback) return;
        const nextFallback = await buildClipboardCompatibleImageSource(rawFallback);
        if (nextFallback && nextFallback !== rawFallback) {
          image.setAttribute("data-fallback", nextFallback);
        }
      }));
    }

    async function getClipboardPreviewHtml() {
      const preview = document.getElementById("preview");
      if (!preview) {
        return "";
      }

      const clone = preview.cloneNode(true);
      await normalizeClipboardPreviewImages(clone);

      clone.querySelectorAll(".preview-image-block").forEach(block => {
        block.style.margin = "12px 0";
      });

      clone.querySelectorAll(".preview-image-block img").forEach(image => {
        image.style.display = "block";
        image.style.maxWidth = "100%";
        image.style.height = "auto";
        image.style.marginTop = "8px";
        image.style.borderRadius = "10px";
      });

      clone.querySelectorAll(".preview-table-wrapper").forEach(wrapper => {
        wrapper.style.margin = "12px 0";
        wrapper.style.overflowX = "auto";
      });

      clone.querySelectorAll(".preview-table").forEach(table => {
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.margin = "8px 0 16px";
      });

      clone.querySelectorAll(".preview-table th").forEach(cell => {
        cell.style.border = "1px solid #d7c7b0";
        cell.style.padding = "8px 10px";
        cell.style.textAlign = "left";
        cell.style.fontWeight = "700";
        cell.style.background = "#f6ede0";
      });

      clone.querySelectorAll(".preview-table td").forEach(cell => {
        cell.style.border = "1px solid #d7c7b0";
        cell.style.padding = "8px 10px";
        cell.style.verticalAlign = "top";
      });

      clone.querySelectorAll(".preview-gui-visual-block").forEach(block => {
        block.style.margin = "14px 0 18px";
      });

      clone.querySelectorAll(".preview-gui-visual").forEach(wrapper => {
        wrapper.style.marginTop = "8px";
        wrapper.style.maxWidth = "720px";
      });

      clone.querySelectorAll(".preview-gui-visual .gui-visualizer-frame").forEach(frame => {
        frame.style.padding = "0";
        frame.style.background = "transparent";
        frame.style.border = "none";
        frame.style.boxShadow = "none";
        frame.style.maxWidth = "720px";
      });

      clone.querySelectorAll(".preview-gui-visual .gui-visualizer-stage").forEach(stage => {
        stage.style.position = "relative";
        stage.style.width = "100%";
        stage.style.maxWidth = "720px";
      });

      clone.querySelectorAll(".preview-gui-visual .gui-visualizer-image").forEach(image => {
        image.style.display = "block";
        image.style.width = "100%";
        image.style.height = "auto";
        image.style.maxWidth = "720px";
        image.style.border = "1px solid #d7c7b0";
        image.style.borderRadius = "12px";
        image.style.background = "#ffffff";
        image.style.padding = "0";
      });

      clone.querySelectorAll(".preview-gui-visual .gui-slot-layer").forEach(layer => {
        layer.style.position = "absolute";
        layer.style.inset = "0";
      });

      clone.querySelectorAll(".preview-gui-visual .gui-slot-overlay").forEach(slot => {
        slot.style.position = "absolute";
        slot.style.display = "flex";
        slot.style.alignItems = "center";
        slot.style.justifyContent = "center";
        slot.style.overflow = "hidden";
        slot.style.cursor = "default";
      });

      clone.querySelectorAll(".preview-gui-visual .gui-slot-item-texture, .preview-gui-visual .gui-slot-rendered-item-texture").forEach(image => {
        image.style.display = "block";
        image.style.width = "88%";
        image.style.height = "88%";
        image.style.objectFit = "contain";
      });

      return `<div>${clone.innerHTML}</div>`;
    }

    /* =========================================================
       15. COPIE RICHE
       - HTML si possible
       - texte brut en secours
       ========================================================= */
    async function copierCDC() {
      if (!dernierTexteGenere || isCDCDirty) {
        genererCDC(true);
      }

      const htmlContent = await getClipboardPreviewHtml();

      try {
        if (window.ClipboardItem && navigator.clipboard?.write && htmlContent) {
          const clipboardItem = new ClipboardItem({
            "text/html": new Blob([htmlContent], { type: "text/html" }),
            "text/plain": new Blob([dernierTexteGenere], { type: "text/plain" })
          });

          await navigator.clipboard.write([clipboardItem]);
        } else {
          await navigator.clipboard.writeText(dernierTexteGenere);
        }

        alert("CDC copié dans le presse-papiers.");
      } catch (error) {
        try {
          await navigator.clipboard.writeText(dernierTexteGenere);
          alert("CDC copié en texte brut dans le presse-papiers.");
        } catch (fallbackError) {
          alert("Impossible de copier automatiquement. Copie le texte manuellement.");
        }
      }
    }

    /* =========================================================
       16. EXPORT PDF
       ========================================================= */
    function normalizePdfText(value) {
      return String(value ?? "")
        .replaceAll("\r\n", "\n")
        .replaceAll("\r", "\n")
        .replaceAll("’", "'")
        .replaceAll("“", '"')
        .replaceAll("”", '"')
        .replaceAll("–", "-")
        .replaceAll("—", "-")
        .replaceAll("•", "-");
    }

    function splitPdfWrappedLines(text, maxChars = 92) {
      const rawLines = normalizePdfText(text).split("\n");
      const wrappedLines = [];

      rawLines.forEach(line => {
        if (!line.trim()) {
          wrappedLines.push("");
          return;
        }

        let remaining = line;
        while (remaining.length > maxChars) {
          const chunk = remaining.slice(0, maxChars);
          const splitIndex = Math.max(chunk.lastIndexOf(" "), chunk.lastIndexOf("\t"));
          const cutIndex = splitIndex > 20 ? splitIndex : maxChars;
          wrappedLines.push(remaining.slice(0, cutIndex).trimEnd());
          remaining = remaining.slice(cutIndex).trimStart();
        }

        wrappedLines.push(remaining);
      });

      return wrappedLines;
    }

    function stringToPdfBytes(value) {
      return Uint8Array.from(Array.from(value, character => character.charCodeAt(0) & 0xff));
    }

    function base64ToUint8Array(base64) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      return bytes;
    }

    function concatenatePdfChunks(chunks) {
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const merged = new Uint8Array(totalLength);
      let offset = 0;

      chunks.forEach(chunk => {
        merged.set(chunk, offset);
        offset += chunk.length;
      });

      return merged;
    }

    function buildPdfFromJpegPages(imagePages) {
      const pageWidth = 595;
      const pageHeight = 842;
      const objects = [];
      const pageObjectNumbers = [];

      objects.push("<< /Type /Catalog /Pages 2 0 R >>");
      objects.push("<< /Type /Pages /Kids [] /Count 0 >>");

      imagePages.forEach(page => {
        const imageObjectNumber = objects.length + 1;
        const contentObjectNumber = objects.length + 2;
        const pageObjectNumber = objects.length + 3;
        pageObjectNumbers.push(pageObjectNumber);

        const drawWidth = pageWidth - 48;
        const drawHeight = pageHeight - 48;
        const drawX = 24;
        const drawY = 24;
        const contentStream = `q\n${drawWidth} 0 0 ${drawHeight} ${drawX} ${drawY} cm\n/Im1 Do\nQ`;

        objects.push({
          header: `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>`,
          streamBytes: page.bytes
        });
        objects.push({
          header: `<< /Length ${contentStream.length} >>`,
          streamBytes: stringToPdfBytes(contentStream)
        });
        objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im1 ${imageObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
      });

      objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map(number => `${number} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`;

      const chunks = [stringToPdfBytes("%PDF-1.4\n")];
      const offsets = [0];
      let currentOffset = chunks[0].length;

      objects.forEach((objectContent, index) => {
        offsets.push(currentOffset);
        const prefix = stringToPdfBytes(`${index + 1} 0 obj\n`);
        const suffix = stringToPdfBytes("\nendobj\n");

        if (typeof objectContent === "string") {
          const body = stringToPdfBytes(`${objectContent}\n`);
          chunks.push(prefix, body, suffix);
          currentOffset += prefix.length + body.length + suffix.length;
          return;
        }

        const header = stringToPdfBytes(`${objectContent.header}\nstream\n`);
        const footer = stringToPdfBytes("\nendstream\n");
        chunks.push(prefix, header, objectContent.streamBytes, footer, suffix);
        currentOffset += prefix.length + header.length + objectContent.streamBytes.length + footer.length + suffix.length;
      });

      const xrefOffset = currentOffset;
      let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
      offsets.slice(1).forEach(offset => {
        xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
      });
      xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
      chunks.push(stringToPdfBytes(xref));

      return concatenatePdfChunks(chunks);
    }

    function renderPdfPages(title, bodyText) {
      const canvas = document.createElement("canvas");
      canvas.width = 1240;
      canvas.height = 1754;
      const context = canvas.getContext("2d");
      if (!context) {
        return [];
      }

      const marginX = 80;
      const marginTop = 92;
      const lineHeight = 34;
      const linesPerPage = Math.floor((canvas.height - marginTop - 90) / lineHeight);
      const lines = splitPdfWrappedLines(`${title}\n\n${bodyText}`, 84);
      const pages = [];

      for (let pageIndex = 0; pageIndex < lines.length; pageIndex += linesPerPage) {
        const pageLines = lines.slice(pageIndex, pageIndex + linesPerPage);

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#1f1a15";
        context.textBaseline = "top";

        pageLines.forEach((line, index) => {
          const y = marginTop + index * lineHeight;
          const isTitle = pageIndex === 0 && index === 0;
          context.font = isTitle ? "bold 30px Arial" : "24px Arial";
          context.fillText(line, marginX, y);
        });

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const base64 = dataUrl.split(",")[1] || "";
        pages.push({
          width: canvas.width,
          height: canvas.height,
          bytes: base64ToUint8Array(base64)
        });
      }

      return pages;
    }

    function buildSimplePdfDocument(title, bodyText) {
      const imagePages = renderPdfPages(title, bodyText);
      return buildPdfFromJpegPages(imagePages.length ? imagePages : renderPdfPages(title, ""));
    }

    function telechargerPDF() {
      if (!dernierTexteGenere || isCDCDirty) {
        genererCDC(true);
      }

      const template = document.getElementById("template").value;
      const projectName = getProjectNameInputValue() || deriveProjectName(template);
      const pdfBytes = buildSimplePdfDocument(projectName, dernierTexteGenere);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `cdc-${template}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    }

    function getCurrentRenderedContent() {
      if (!dernierTexteGenere || isCDCDirty) {
        genererCDC(true);
      }

      return {
        renderedText: dernierTexteGenere || "",
        renderedHtml: document.getElementById("preview")?.innerHTML || ""
      };
    }

    function collectProjectState() {
      const fields = {};
      const excludedFieldIds = new Set([
        "projectNameInput",
        "projectHistorySearch",
        "projectHistorySort",
        "workspaceProjectSelect",
        "template",
        "guiPresetSelect",
        "guiPresetName",
        "guiCommandePresetSelect",
        "guiCommandePresetName",
        "itemCustomPresetSelect",
        "itemCustomPresetName"
      ]);

      document.querySelectorAll("input[type='text'], textarea, select, input[type='checkbox']").forEach(field => {
        if (
          !field.id
          || field.type === "file"
          || excludedFieldIds.has(field.id)
          || field.id.startsWith("gui_commande_item_custom_preset_")
          || field.id.startsWith("metier_gui_item_custom_preset_")
          || field.id.startsWith("gui_template_item_custom_preset_")
          || field.id.startsWith("item_custom_craft_preset_")
        ) return;
        fields[field.id] = field.type === "checkbox" ? field.checked : field.value;
      });

      const selection = {
        workspaceProjectId: activeWorkspaceProjectId || "",
        workspaceProjectName: activeWorkspaceProjectName || "",
        guiPresetId: getSelectedGuiPresetId("guiPresetSelect"),
        guiCommandePresetId: getSelectedGuiPresetId("guiCommandePresetSelect"),
        itemCustomPresetId: getSelectedItemCustomPresetId()
      };

      return {
        version: 1,
        id: currentProjectId,
        projectId: activeWorkspaceProjectId,
        projectLabel: activeWorkspaceProjectName,
        projectName: getProjectNameInputValue() || deriveProjectName(document.getElementById("template")?.value || "commande"),
        template: document.getElementById("template")?.value || "commande",
        theme: document.body.dataset.theme || "light",
        selection,
        fields,
        images: collectProjectImages(),
        dynamic: {
          messages: recupererMessages(),
          guiCommandeItems: recupererItemsGUICommande(),
          guiTemplateItems: recupererItemsGUITemplate(),
          itemCustomCraftIngredients: recupererItemCustomCraftIngredients(),
          eventConditions: recupererConditionsEvent(),
          eventMessages: recupererMessagesEvent(),
          metierItems: recupererMetierItems(),
          metierLevelRewards: recupererMetierLevelRewards(),
          metierGuiItems: recupererMetierGuiItems(),
          rankUps: recupererRankUps(),
          mobSpawns: recupererMobSpawns(),
          mobDrops: recupererMobDrops(),
          libreSections: recupererLibreSections(),
          caisseRewards: recupererRewardsCaisse(),
          soundDesignEntries: recupererSoundDesignEntries()
        }
      };
    }

    async function saveCurrentProjectToHistory(
      showFeedback = true,
      providedState = null,
      {
        syncDirectory = true,
        ensureAutoGuiPreset = true,
        ensureAutoItemCustomPreset = true
      } = {}
    ) {
      const state = await normalizeProjectStateForStorage(providedState || collectProjectState());
      restoreProjectImages(state.images || {});
      invalidateCDC();
      const renderedContent = getCurrentRenderedContent();
      const now = new Date().toISOString();
      const history = getLocalProjectHistory();
      const rememberedProjectId = getRememberedHistoryProjectId(activeWorkspaceProjectId);
      const rememberedProject = rememberedProjectId
        ? history.find((project) => project.id === rememberedProjectId)
        : null;
      const projectId = currentProjectId
        || rememberedProject?.id
        || `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      currentProjectId = projectId;
      rememberHistoryProjectId(projectId, activeWorkspaceProjectId);

      const entry = {
        ...state,
        id: projectId,
        projectId: activeWorkspaceProjectId,
        projectLabel: activeWorkspaceProjectName,
        projectName: state.projectName || deriveProjectName(state.template),
        templateLabel: getTemplateLabel(state.template),
        author: state.author || "",
        renderedText: renderedContent.renderedText,
        renderedHtml: "",
        createdAt: history.find(project => project.id === projectId)?.createdAt || now,
        updatedAt: now
      };

      const nextHistory = [entry, ...history.filter(project => project.id !== projectId)].slice(0, 50);
      saveLocalProjectHistory(nextHistory);
      lastAutosavedSnapshot = buildProjectSnapshot(entry);
      clearRecoveryDraft(lastAutosavedSnapshot);
      cancelLocalAutosave();
      syncWorkspaceProjectInUrl();

      const projectNameInput = document.getElementById("projectNameInput");
      if (projectNameInput && !projectNameInput.value.trim()) {
        projectNameInput.value = entry.projectName;
      }

      renderProjectHistory();
      if (syncDirectory) {
        void window.syncCdcProjectsDirectoryIfConnected?.();
      }

      if (ensureAutoGuiPreset) {
        void ensureGuiPresetForSavedProject(entry, entry.projectName);
      }

      if (ensureAutoItemCustomPreset) {
        void ensureItemCustomPresetForSavedProject(entry, entry.projectName);
      }

      if (showFeedback) {
        void syncGeneratorHistoryEntry(entry);
        alert("Projet enregistré dans l'historique local.");
      }
    }

    async function sauvegarderProjet() {
      await saveCurrentProjectToHistory(false);

      const run = async () => {
        const result = await window.syncCdcProjectsDirectoryFromStorage?.({ promptForDirectory: true });

        if (!result) {
          alert("La sauvegarde en dossier n'est pas disponible dans ce navigateur.");
          return;
        }

        if (result.ok) {
          alert(`Projet sauvegardé dans le dossier \`${result.directoryName}\`.`);
          return;
        }

        if (result.reason === "cancelled") {
          alert("Sauvegarde annulée.");
          return;
        }

        alert("Impossible de sauvegarder le projet dans le dossier sélectionné.");
      };

      await run();
    }

    function resetFormState(includeDefaults = true) {
      cancelLocalAutosave();
      const currentTemplate = document.getElementById("template")?.value || "commande";

      const textInputs = document.querySelectorAll("input[type='text'], textarea");
      textInputs.forEach(champ => champ.value = "");

      document.querySelectorAll("select").forEach(select => {
        if (select.id === "template") return;
        if (select.id === "guiTaille") {
          select.value = "3 lignes";
          return;
        }
        select.selectedIndex = 0;
      });

      document.querySelectorAll("input[type='file']").forEach(input => {
        input.value = "";
      });

      restoreProjectImages();

      document.querySelectorAll("input[type='checkbox']").forEach(input => {
        input.checked = false;
      });

      [
        ["typeJoueur", true],
        ["typeStaff", false],
        ["typeAdmin", false],
        ["interfaceChat", true],
        ["interfaceGUI", false],
        ["interfaceScoreboard", false],
        ["interfaceActionBar", false],
        ["interfaceSoundDesign", false],
        ["interfaceActionJoueur", false],
        ["ouvertureCommande", false],
        ["ouvertureNPC", false],
        ["ouvertureItem", false],
        ["ouvertureAutreCheck", false],
        ["eventInterfaceScoreboard", false],
        ["eventInterfaceActionBar", false],
        ["eventInterfaceBossBar", false],
        ["metierXpMessageChat", false],
        ["metierXpMessageActionBar", false],
        ["metierXpMessageBossBar", false],
        ["metierXpMessageAutre", false]
      ].forEach(([id, checked]) => setChecked(id, checked));

      ["messagesContainer", "guiItemsCommandeContainer", "guiItemsTemplateContainer", "itemCustomCraftIngredientsContainer", "eventConditionsContainer", "eventMessagesContainer", "metierItemsContainer", "metierLevelRewardsContainer", "metierGuiItemsContainer", "rankUpContainer", "mobSpawnsContainer", "mobDropsContainer", "libreSectionsContainer", "caisseRewardsContainer", "soundDesignEntriesContainer"].forEach(clearElement);

      messageIndex = 0;
      guiCommandeItemIndex = 0;
      guiCommandeLoreVariantIndex = 0;
      guiTemplateItemIndex = 0;
      guiTemplateLoreVariantIndex = 0;
      itemCustomCraftIngredientIndex = 0;
      eventConditionIndex = 0;
      eventMessageIndex = 0;
      metierItemIndex = 0;
      metierLevelRewardIndex = 0;
      metierGuiItemIndex = 0;
      metierGuiLoreVariantIndex = 0;
      rankUpIndex = 0;
      rankUpRewardIndex = 0;
      mobSpawnIndex = 0;
      mobDropIndex = 0;
      libreSectionIndex = 0;
      caisseRewardIndex = 0;
      soundDesignEntryIndex = 0;

      const templateSelect = document.getElementById("template");
      if (templateSelect) {
        templateSelect.value = currentTemplate;
      }

      const projectNameInput = document.getElementById("projectNameInput");
      if (projectNameInput) {
        projectNameInput.value = "";
      }

      currentProjectId = null;
      lastAutosavedSnapshot = "";

      invalidateCDC();
      clearElement("preview");

      updateCommandeInterfaceFields();
      updateOuvertureFields();
      updateTypeItemFields();
      updateGuiTailleField();
      choiceObtentionFields();
      updateItemCustomCraftVisualization();
      utilisationChoiseItemFields();
      startEventFields();
      updateEventInterfaceFields();
      updateMetierXpMessageFields();
      updateCaisseChanceHelper();

      if (includeDefaults) {
        ajouterMessage("Message erreur", '"&cUne erreur est survenue."');
        ajouterMessage("Message permission", '"&cVous n’avez pas la permission."');
        ajouterSoundDesignEntry();
      }

      defaultProjectSnapshot = buildProjectSnapshot(collectProjectState());
      renderProjectHistory();
    }

    function loadProjectState(state) {
      if (!state || typeof state !== "object") {
        throw new Error("Fichier de sauvegarde invalide.");
      }

      resetFormState(false);

      const templateSelect = document.getElementById("template");
      if (templateSelect && state.template) {
        templateSelect.value = state.template;
      }

      currentProjectId = state.id || null;
      const projectNameInput = document.getElementById("projectNameInput");
      if (projectNameInput) {
        projectNameInput.value = state.projectName || deriveProjectName(state.template || "commande");
      }
      switchTemplate();

      const savedSelection = state.selection && typeof state.selection === "object"
        ? state.selection
        : {};
      const savedWorkspaceProjectId = String(savedSelection.workspaceProjectId || state.projectId || "").trim();
      const savedWorkspaceProject = savedWorkspaceProjectId
        ? getWorkspaceProjectById(savedWorkspaceProjectId)
        : null;

      activeWorkspaceProjectId = savedWorkspaceProject?.id || savedWorkspaceProjectId;
      activeWorkspaceProjectName = savedWorkspaceProject?.name
        || (activeWorkspaceProjectId ? String(savedSelection.workspaceProjectName || state.projectLabel || "").trim() : "");

      if (activeWorkspaceProjectId) {
        localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, activeWorkspaceProjectId);
      } else {
        localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
      }

      rememberHistoryProjectId(currentProjectId, activeWorkspaceProjectId);

      populateWorkspaceProjectSelect();
      updateWorkspaceProjectUi();

      const dynamic = state.dynamic || {};
      (dynamic.messages || []).forEach(message => ajouterMessage(message.titre || "", message.contenu || ""));
      (dynamic.guiCommandeItems || []).forEach(item => ajouterItemGUICommande(item));
      (dynamic.guiTemplateItems || []).forEach(item => ajouterItemGUITemplate(item));
      (dynamic.itemCustomCraftIngredients || []).forEach(item => ajouterItemCustomCraftIngredient(item));
      (dynamic.eventConditions || []).forEach(condition => ajouterConditionEvent(condition.condition || ""));
      (dynamic.eventMessages || []).forEach(message => ajouterMessageEvent(message.titre || "", message.contenu || ""));
      (dynamic.metierItems || []).forEach(item => ajouterMetierItemRow(item));
      (dynamic.metierLevelRewards || []).forEach(entry => ajouterMetierLevelRewardRow(entry));
      (dynamic.metierGuiItems || []).forEach(item => ajouterMetierGuiItem(item));
      (dynamic.rankUps || []).forEach(rankUp => ajouterRankUp(rankUp));
      (dynamic.mobSpawns || []).forEach(spawn => ajouterMobSpawn(spawn));
      (dynamic.mobDrops || []).forEach(drop => ajouterMobDrop(drop));
      (dynamic.libreSections || []).forEach(section => ajouterLibreSection(section));
      (dynamic.caisseRewards || []).forEach(reward => ajouterRewardCaisse(reward));
      (dynamic.soundDesignEntries || []).forEach(entry => ajouterSoundDesignEntry(entry));

      Object.entries(state.fields || {}).forEach(([id, value]) => {
        if (id === "projectNameInput" || id === "projectHistorySearch") return;
        const field = document.getElementById(id);
        if (!field || field.type === "file") return;
        if (field.type === "checkbox") {
          field.checked = Boolean(value);
        } else {
          field.value = value;
        }
      });

      restoreProjectImages(state.images || {});

      Object.entries(state.checks || {}).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (field && field.type === "checkbox") {
          field.checked = Boolean(value);
        }
      });

      if (state.theme === "dark" || state.theme === "light") {
        applyTheme(state.theme);
      }

      populateGuiPresetLibrary();
      populateGuiCommandePresetLibrary();
      populateItemCustomPresetLibrary();

      const savedGuiPresetId = String(savedSelection.guiPresetId || "").trim();
      if (savedGuiPresetId) {
        const savedGuiPreset = getAvailableGuiPresets().find(entry => String(entry.id || "").trim() === savedGuiPresetId);
        selectGuiPresetInLibrary("guiPresetSelect", savedGuiPresetId);
        const guiPresetNameField = document.getElementById("guiPresetName");
        if (guiPresetNameField) {
          guiPresetNameField.value = savedGuiPreset?.name || "";
        }
      }

      const savedGuiCommandePresetId = String(savedSelection.guiCommandePresetId || "").trim();
      if (savedGuiCommandePresetId) {
        const savedGuiCommandePreset = getAvailableGuiPresets().find(entry => String(entry.id || "").trim() === savedGuiCommandePresetId);
        selectGuiPresetInLibrary("guiCommandePresetSelect", savedGuiCommandePresetId);
        const guiCommandePresetNameField = document.getElementById("guiCommandePresetName");
        if (guiCommandePresetNameField) {
          guiCommandePresetNameField.value = savedGuiCommandePreset?.name || "";
        }
      }

      const savedItemCustomPresetId = String(savedSelection.itemCustomPresetId || "").trim();
      if (savedItemCustomPresetId) {
        const savedItemCustomPreset = getAvailableItemCustomPresets().find(entry => String(entry.id || "").trim() === savedItemCustomPresetId);
        selectItemCustomPresetInLibrary(savedItemCustomPresetId);
        const itemCustomPresetNameField = document.getElementById("itemCustomPresetName");
        if (itemCustomPresetNameField) {
          itemCustomPresetNameField.value = savedItemCustomPreset?.name || "";
        }
      }

      lastAutosavedSnapshot = buildProjectSnapshot({
        projectId: activeWorkspaceProjectId,
        template: state.template || "commande",
        projectName: state.projectName || "",
        theme: state.theme || "light",
        selection: {
          workspaceProjectId: activeWorkspaceProjectId,
          workspaceProjectName: activeWorkspaceProjectName,
          guiPresetId: savedGuiPresetId,
          guiCommandePresetId: savedGuiCommandePresetId,
          itemCustomPresetId: savedItemCustomPresetId
        },
        fields: state.fields || {},
        dynamic: state.dynamic || {},
        images: state.images || {}
      });

      updateCommandeInterfaceFields();
      updateOuvertureFields();
      updateTypeItemFields();
      updateGuiTailleField();
      choiceObtentionFields();
      updateItemCustomCraftVisualization();
      utilisationChoiseItemFields();
      startEventFields();
      updateEventInterfaceFields();
      updateMetierXpMessageFields();
      updateCaisseChanceHelper();
      updateGuiCommandeVisualization();
      updateGuiTemplateVisualization();
      renderProjectHistory();
      genererCDC(true);
      syncWorkspaceProjectInUrl();
    }

    function loadRequestedHistoryProjectIfAny() {
      if (!requestedHistoryProjectId) return false;

      const project = getLocalProjectHistory().find(entry => entry.id === requestedHistoryProjectId);
      if (!project) {
        syncRememberedHistoryProjectForWorkspace(activeWorkspaceProjectId);
        requestedHistoryProjectId = "";
        syncWorkspaceProjectInUrl();
        return false;
      }

      requestedHistoryProjectId = "";
      loadProjectState(project);
      return true;
    }

    function clearRequestedGuiPreset() {
      requestedGuiPresetId = "";
      try {
        window.sessionStorage.removeItem(REQUESTED_GUI_PRESET_SESSION_KEY);
      } catch (error) {
        // Ignore session storage access issues and keep the editor usable.
      }
    }

    function loadRequestedGuiPresetIfAny() {
      if (!requestedGuiPresetId || requestedHistoryProjectId) return false;

      const preset = getAvailableGuiPresets().find(entry => entry.id === requestedGuiPresetId);
      if (!preset) {
        clearRequestedGuiPreset();
        return false;
      }

      clearRequestedGuiPreset();
      applyGuiPreset(preset);
      selectGuiPresetInLibraries(preset.id || "");
      cancelLocalAutosave();
      defaultProjectSnapshot = buildProjectSnapshot(collectProjectState());
      return true;
    }

    function clearRequestedItemCustomPreset() {
      requestedItemCustomPresetId = "";
      try {
        window.sessionStorage.removeItem(REQUESTED_ITEM_CUSTOM_PRESET_SESSION_KEY);
      } catch (error) {
        // Ignore session storage access issues and keep the editor usable.
      }
    }

    function loadRequestedItemCustomPresetIfAny() {
      if (!requestedItemCustomPresetId || requestedHistoryProjectId) return false;

      const preset = getAvailableItemCustomPresets().find(entry => entry.id === requestedItemCustomPresetId);
      if (!preset) {
        clearRequestedItemCustomPreset();
        return false;
      }

      clearRequestedItemCustomPreset();
      applyItemCustomPreset(preset);
      selectItemCustomPresetInLibrary(preset.id || "");
      cancelLocalAutosave();
      defaultProjectSnapshot = buildProjectSnapshot(collectProjectState());
      return true;
    }

    function openHistoryProject(projectId) {
      const project = getLocalProjectHistory().find(entry => entry.id === projectId);
      if (!project) {
        alert("Projet introuvable dans l'historique local.");
        renderProjectHistory();
        return;
      }

      loadProjectState(project);
    }

    function deleteHistoryProject(projectId) {
      const history = getLocalProjectHistory();
      const project = history.find(entry => entry.id === projectId);
      if (!project) {
        renderProjectHistory();
        return;
      }

      const confirmed = confirm(`Supprimer le projet local "${project.projectName || "Projet sans nom"}" ?`);
      if (!confirmed) return;

      saveLocalProjectHistory(history.filter(entry => entry.id !== projectId));
      void deleteGeneratorHistoryEntry(projectId);
      if (currentProjectId === projectId) {
        currentProjectId = null;
        lastAutosavedSnapshot = "";
      }
      syncRememberedHistoryProjectForWorkspace(project.projectId);
      void window.syncCdcProjectsDirectoryFromStorage?.();
      renderProjectHistory();
    }

    function createNewLocalProject() {
      resetFormState(true);
      clearRememberedHistoryProjectId(activeWorkspaceProjectId);
      clearRecoveryDraft(defaultProjectSnapshot);
      const projectNameInput = document.getElementById("projectNameInput");
      if (projectNameInput) {
        projectNameInput.focus();
      }
      genererCDC(true);
    }

    function chargerProjetDepuisFichier(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || "{}"));
          loadProjectState(parsed);
          alert("Sauvegarde chargée avec succès.");
        } catch (error) {
          alert("Impossible de charger cette sauvegarde JSON.");
        } finally {
          event.target.value = "";
        }
      };
      reader.onerror = () => {
        alert("Impossible de lire le fichier sélectionné.");
        event.target.value = "";
      };
      reader.readAsText(file, "utf-8");
    }

    /* =========================================================
       17. RESET GLOBAL
       - vide tous les champs
       - remet les valeurs par défaut
       ========================================================= */
    function viderFormulaire() {
      resetFormState(true);
      clearRememberedHistoryProjectId(activeWorkspaceProjectId);
      clearRecoveryDraft(defaultProjectSnapshot);
      genererCDC();
    }

    document.addEventListener("input", (event) => {
      if (event.target.closest("input, textarea, select")) {
        handleGeneratorFieldInteraction(event.target, { shouldGenerate: true, shouldAutosave: true });
      }
    });

    document.addEventListener("change", (event) => {
      if (event.target.closest("input, textarea, select")) {
        handleGeneratorFieldInteraction(event.target, { shouldGenerate: true, shouldAutosave: true });
      }
    });

    document.addEventListener("focusin", (event) => {
      handleGeneratorFieldInteraction(event.target);
    });

    document.addEventListener("click", (event) => {
      handleGeneratorFieldInteraction(event.target);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        persistRecoveryDraft({ force: true });
        void performLocalAutosave();
      }
    });

    window.addEventListener("pagehide", () => {
      persistRecoveryDraft({ force: true });
      void performLocalAutosave();
    });

    document.getElementById("loadProjectInput")?.addEventListener("change", chargerProjetDepuisFichier);

    function refreshGeneratorStorageViews() {
      populateWorkspaceProjectSelect();
      updateWorkspaceProjectUi();
      populateGuiPresetLibrary();
      populateGuiCommandePresetLibrary();
      renderProjectHistory();
      populateItemCustomPresetLibrary();
    }

    async function bootGeneratorPage() {
      await window.NeodiumCdcRemoteStore?.whenHydrated?.();

      initTheme();
      applyTemplateOptionLabels();
      resolveWorkspaceProjectContext();
      refreshGeneratorStorageViews();
      populateMinecraftSoundSelect(BUILTIN_MINECRAFT_SOUND_EVENTS);
      populateMinecraftItemOptions();
      updateCommandeInterfaceFields();
      updateOuvertureFields();
      updateTypeItemFields();
      updateGuiTailleField();
      choiceObtentionFields();
      updateItemCustomCraftVisualization();
      utilisationChoiseItemFields();
      startEventFields();
      updateEventInterfaceFields();
      updateMetierXpMessageFields();
      updateCaisseChanceHelper();
      updateGuiCommandeVisualization();
      updateGuiTemplateVisualization();
      ajouterMessage("Message erreur", '"&cUne erreur est survenue."');
      ajouterMessage("Message permission", '"&cVous n’avez pas la permission."');
      ajouterSoundDesignEntry();
      switchTemplate();
      defaultProjectSnapshot = buildProjectSnapshot(collectProjectState());
      window.addEventListener("neodium-cdc-storage-updated", refreshGeneratorStorageViews);
      if (!loadRequestedHistoryProjectIfAny()) {
        if (!loadRequestedGuiPresetIfAny()) {
          loadRequestedItemCustomPresetIfAny();
        }
      }
      restoreRecoveryDraftIfNeeded();

      const result = await window.hydrateCdcProjectsFromFiles?.();
      if (result?.ok && result.hydrated) {
        resolveWorkspaceProjectContext();
        refreshGeneratorStorageViews();
        if (!loadRequestedHistoryProjectIfAny()) {
          if (!loadRequestedGuiPresetIfAny()) {
            loadRequestedItemCustomPresetIfAny();
          }
        }
        restoreRecoveryDraftIfNeeded();
      }
    }

    void bootGeneratorPage();
  
