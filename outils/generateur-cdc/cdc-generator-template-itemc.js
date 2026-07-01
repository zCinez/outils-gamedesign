const ITEM_CUSTOM_CRAFT_LAYOUT = {
  width: 526,
  height: 243,
  slotSize: 43,
  expandTop: 2,
  expandRight: 3,
  expandBottom: 3,
  expandLeft: 2,
  backgroundImage: "./GUI/crafting-table-template.png?v=20260629a"
};

const ITEM_CUSTOM_CRAFT_SLOT_DEFINITIONS = [
  { slot: 0, badge: "1", label: "Slot 1", description: "haut gauche", x: 93, y: 48 },
  { slot: 1, badge: "2", label: "Slot 2", description: "haut centre", x: 146, y: 48 },
  { slot: 2, badge: "3", label: "Slot 3", description: "haut droite", x: 199, y: 48 },
  { slot: 3, badge: "4", label: "Slot 4", description: "milieu gauche", x: 93, y: 103 },
  { slot: 4, badge: "5", label: "Slot 5", description: "centre", x: 146, y: 103 },
  { slot: 5, badge: "6", label: "Slot 6", description: "milieu droite", x: 199, y: 103 },
  { slot: 6, badge: "7", label: "Slot 7", description: "bas gauche", x: 93, y: 157 },
  { slot: 7, badge: "8", label: "Slot 8", description: "bas centre", x: 146, y: 157 },
  { slot: 8, badge: "9", label: "Slot 9", description: "bas droite", x: 199, y: 157 }
];

const ITEM_CUSTOM_CRAFT_RESULT_SLOT = {
  slot: "result",
  badge: "R",
  label: "Résultat",
  description: "item final",
  x: 388,
  y: 100,
  expandTop: 8,
  expandBottom: 12,
  expandLeft: 20
};

function getItemCustomCraftSlotDefinition(slotValue) {
  const parsedSlot = Number.parseInt(String(slotValue || "").trim(), 10);
  return ITEM_CUSTOM_CRAFT_SLOT_DEFINITIONS.find((entry) => entry.slot === parsedSlot) || null;
}

function getItemCustomCraftSlotDescription(slotValue) {
  const definition = getItemCustomCraftSlotDefinition(slotValue);
  if (!definition) return "Slot inconnu";
  return `${definition.label} (${definition.description})`;
}

function buildItemCustomCraftSlotOptions(selectedValue = "") {
  const normalizedSelectedValue = String(selectedValue || "").trim();
  const defaultSelected = normalizedSelectedValue ? "" : " selected";
  const options = [`<option value=""${defaultSelected}>Choisir une case</option>`];

  ITEM_CUSTOM_CRAFT_SLOT_DEFINITIONS.forEach((definition) => {
    const value = String(definition.slot);
    const selected = normalizedSelectedValue === value ? " selected" : "";
    options.push(`<option value="${value}"${selected}>${escapeHtml(getItemCustomCraftSlotDescription(value))}</option>`);
  });

  return options.join("");
}

function getItemCustomCraftIngredientElements() {
  return [...document.querySelectorAll(".gui-item[data-item-custom-craft-id]")];
}

function updateItemCustomCraftIngredientTitles() {
  getItemCustomCraftIngredientElements().forEach((itemElement, index) => {
    const itemId = String(itemElement.dataset.itemCustomCraftId || "");
    const title = itemElement.querySelector(".gui-item-title");
    const slotValue = document.getElementById(`item_custom_craft_slot_${itemId}`)?.value.trim() || "";
    if (!title) return;

    title.textContent = slotValue
      ? `Ingrédient ${index + 1} - ${getItemCustomCraftSlotDescription(slotValue)}`
      : `Ingrédient ${index + 1}`;
  });
}

function appliquerItemCustomPresetSurCraftIngredient(itemId) {
  const selectId = `item_custom_craft_preset_${itemId}`;
  const presetId = document.getElementById(selectId)?.value || "";
  if (!presetId) {
    return false;
  }

  const presetData = getItemCustomPresetVisualData(presetId);
  if (!presetData) {
    return false;
  }

  const itemField = document.getElementById(`item_custom_craft_item_${itemId}`);
  const presetSelect = document.getElementById(selectId);

  if (itemField) {
    itemField.value = presetData.item;
  }

  if (presetSelect) {
    presetSelect.value = presetData.id || "";
    presetSelect.dataset.appliedPresetId = presetData.id || "";
  }

  updateItemCustomCraftIngredientTitles();
  refreshAfterStructureChange();
  updateItemCustomCraftVisualization();
  focusItemCustomCraftIngredientField(itemId);
  return true;
}

function ajouterItemCustomCraftIngredient(data = {}) {
  itemCustomCraftIngredientIndex++;
  const itemId = itemCustomCraftIngredientIndex;
  const container = document.getElementById("itemCustomCraftIngredientsContainer");
  if (!container) return "";

  const item = document.createElement("div");
  item.className = "gui-item";
  item.dataset.itemCustomCraftId = itemId;
  item.innerHTML = `
    <div class="gui-item-header">
      <div class="gui-item-title">Ingrédient</div>
      <button type="button" class="btn-remove" onclick="supprimerItemCustomCraftIngredient(${itemId})">Supprimer</button>
    </div>

    <div class="gui-item-copy-tools">
      <div>
        <label for="item_custom_craft_preset_${itemId}">Preset Item Custom</label>
        <select id="item_custom_craft_preset_${itemId}" data-applied-preset-id="${escapeHtml(data.itemCustomPresetId || "")}">
          ${buildGuiItemCustomPresetOptionsMarkup(data.itemCustomPresetId || "")}
        </select>
      </div>
      <button
        type="button"
        class="btn-small btn-secondary btn-inline"
        onclick="appliquerItemCustomPresetSurCraftIngredient(${itemId})"
      >
        Utiliser le preset
      </button>
    </div>

    <div class="muted gui-item-copy-hint">Remplit automatiquement l'item Minecraft de l'ingrÃ©dient depuis un preset Item Custom.</div>

    <div class="grid-2">
      <div>
        <label for="item_custom_craft_slot_${itemId}">Case du craft</label>
        <select id="item_custom_craft_slot_${itemId}" onchange="updateItemCustomCraftIngredientTitles()">
          ${buildItemCustomCraftSlotOptions(data.slot || "")}
        </select>
      </div>

      <div>
        <label for="item_custom_craft_item_${itemId}">Item Minecraft</label>
        <input type="text" id="item_custom_craft_item_${itemId}" list="minecraftItemOptions" placeholder="Choisir ou écrire un item Minecraft" value="${escapeHtml(data.item || "")}">
      </div>
    </div>
  `;

  container.appendChild(item);
  updateItemCustomCraftIngredientTitles();
  refreshAfterStructureChange();
  updateItemCustomCraftVisualization();
  return String(itemId);
}

function supprimerItemCustomCraftIngredient(itemId) {
  const item = document.querySelector(`[data-item-custom-craft-id="${itemId}"]`);
  if (item) {
    item.remove();
  }

  updateItemCustomCraftIngredientTitles();
  refreshAfterStructureChange();
  updateItemCustomCraftVisualization();
}

function recupererItemCustomCraftIngredients() {
  return getItemCustomCraftIngredientElements()
    .map((itemElement) => {
      const itemId = String(itemElement.dataset.itemCustomCraftId || "");
      return {
        slot: document.getElementById(`item_custom_craft_slot_${itemId}`)?.value.trim() || "",
        item: document.getElementById(`item_custom_craft_item_${itemId}`)?.value.trim() || "",
        itemCustomPresetId: document.getElementById(`item_custom_craft_preset_${itemId}`)?.dataset.appliedPresetId || ""
      };
    })
    .filter((entry) => entry.slot && entry.item)
    .sort((a, b) => Number.parseInt(a.slot, 10) - Number.parseInt(b.slot, 10));
}

function findItemCustomCraftIngredientIdBySlot(slot) {
  const normalizedSlot = Number.parseInt(String(slot || "").trim(), 10);
  if (!Number.isFinite(normalizedSlot)) return "";

  for (const itemElement of getItemCustomCraftIngredientElements()) {
    const itemId = String(itemElement.dataset.itemCustomCraftId || "");
    const slotValue = document.getElementById(`item_custom_craft_slot_${itemId}`)?.value.trim() || "";
    const parsedSlot = Number.parseInt(slotValue, 10);

    if (Number.isFinite(parsedSlot) && parsedSlot === normalizedSlot) {
      return itemId;
    }
  }

  return "";
}

function focusItemCustomCraftIngredientField(itemId) {
  if (!itemId) return;

  const row = document.querySelector(`.gui-item[data-item-custom-craft-id="${itemId}"]`);
  const itemInput = document.getElementById(`item_custom_craft_item_${itemId}`);

  if (row) {
    row.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (itemInput) {
    window.setTimeout(() => {
      itemInput.focus();
    }, 180);
  }
}

function focusItemCustomCraftResultField() {
  const resultField = document.getElementById("itemMc");
  if (!resultField) return;

  resultField.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    resultField.focus();
    const valueLength = resultField.value.length;
    if (typeof resultField.setSelectionRange === "function") {
      resultField.setSelectionRange(valueLength, valueLength);
    }
  }, 180);
}

function openItemCustomCraftSlot(slot) {
  if (String(slot) === "result") {
    focusItemCustomCraftResultField();
    return;
  }

  const normalizedSlot = Number.parseInt(String(slot || "").trim(), 10);
  if (!Number.isFinite(normalizedSlot)) return;

  const existingItemId = findItemCustomCraftIngredientIdBySlot(normalizedSlot);
  if (existingItemId) {
    focusItemCustomCraftIngredientField(existingItemId);
    return;
  }

  const newItemId = ajouterItemCustomCraftIngredient({ slot: String(normalizedSlot) });
  focusItemCustomCraftIngredientField(newItemId);
}

window.openItemCustomCraftSlot = openItemCustomCraftSlot;

function resetItemCustomCraftIngredients() {
  const container = document.getElementById("itemCustomCraftIngredientsContainer");
  if (!container) return;

  container.innerHTML = "";
  updateItemCustomCraftIngredientTitles();
  refreshAfterStructureChange();
  updateItemCustomCraftVisualization();
}

function buildItemCustomCraftSlotRenderData(item, label, slotIndex) {
  if (!item) {
    return {
      slotContent: "",
      slotTooltipHtml: ""
    };
  }

  const headDatabaseHead = parseHeadDatabaseHead(item.item);
  const blockFaces = getMinecraftItemBlockFaces(item.item);
  const customTextureUrl = String(item.customTextureUrl || "").trim();
  const textureUrl = resolveMinecraftItemTextureUrl(item.item);
  const renderedTextureUrl = resolveRenderedMinecraftItemIconUrl(item.item);
  const inviconUrl = resolvePreferredBlockInventoryUrl(item.item);
  const localFallbackTexture = renderedTextureUrl || inviconUrl || textureUrl || (blockFaces?.front || "");
  const isBlockLike = !!blockFaces && (
    (blockFaces.front && blockFaces.front.includes("/block/"))
    || (blockFaces.side && blockFaces.side.includes("/block/"))
    || (blockFaces.top && blockFaces.top.includes("/block/"))
  );
  const slotTooltipHtml = buildGuiSlotTooltipHtml(item, slotIndex);

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
          data-item-key="${escapeHtml(item.item || "")}"
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

  return {
    slotContent,
    slotTooltipHtml
  };
}

function getItemCustomCraftIngredientPreviewItem(entry) {
  const presetData = entry?.itemCustomPresetId
    ? getItemCustomPresetVisualData(entry.itemCustomPresetId)
    : null;
  const item = String(entry?.item || presetData?.item || "").trim();
  const nom = String(presetData?.nom || "").trim();
  const lore = String(presetData?.lore || "").trim();
  const customTextureUrl = String(presetData?.textureSource || "").trim();

  if (!item && !nom && !lore && !customTextureUrl) {
    return null;
  }

  return {
    item,
    nom,
    lore,
    customTextureUrl
  };
}

function getItemCustomCraftResultPreviewItem() {
  const item = valeur("itemMc", "");
  const nom = valeur("nameItem", "");
  const lore = valeur("loreItem", "");
  const customTextureUrl = getImagePreviewSource("previewTextureItemTemplate") || resolveDirectImageUrl(document.getElementById("linkTexture")?.value || "");

  if (!item && !nom && !lore && !customTextureUrl) {
    return null;
  }

  return {
    item,
    nom,
    lore,
    customTextureUrl
  };
}

function getItemCustomCraftResultLabel() {
  const item = valeur("itemMc", "");
  const nom = stripMinecraftFormatting(valeur("nameItem", ""));

  if (item && nom) {
    return `${item} (${nom})`;
  }

  return item || nom || "Aucun";
}

function buildItemCustomCraftVisualizationMarkup(previewId = "itemCustomCraftVisualization", interactive = true) {
  const layout = ITEM_CUSTOM_CRAFT_LAYOUT;
  const ingredientMap = new Map();
  const ingredients = recupererItemCustomCraftIngredients();
  const resultItem = getItemCustomCraftResultPreviewItem();
  const slots = [...ITEM_CUSTOM_CRAFT_SLOT_DEFINITIONS, ITEM_CUSTOM_CRAFT_RESULT_SLOT];

  ingredients.forEach((entry) => {
    const parsedSlot = Number.parseInt(entry.slot, 10);
    if (Number.isFinite(parsedSlot) && parsedSlot >= 0 && parsedSlot < 9) {
      ingredientMap.set(String(parsedSlot), getItemCustomCraftIngredientPreviewItem(entry));
    }
  });

  const slotsHtml = slots.map((definition) => {
    const isResultSlot = definition.slot === "result";
    const item = isResultSlot ? resultItem : ingredientMap.get(String(definition.slot)) || null;
    const label = item
      ? (stripMinecraftFormatting(item.nom) || stripMinecraftFormatting(item.item) || definition.label)
      : definition.label;
    const slotIndex = isResultSlot ? 9 : definition.slot;
    const { slotContent, slotTooltipHtml } = buildItemCustomCraftSlotRenderData(item, label, slotIndex);
    const fallbackBadge = definition.badge;
    const datasetSlot = interactive ? `data-slot="${escapeHtml(String(definition.slot))}"` : "";
    const staticClass = interactive ? "" : " is-static";
    const expandTop = layout.expandTop + (Number(definition.expandTop) || 0);
    const expandRight = layout.expandRight + (Number(definition.expandRight) || 0);
    const expandBottom = layout.expandBottom + (Number(definition.expandBottom) || 0);
    const expandLeft = layout.expandLeft + (Number(definition.expandLeft) || 0);

    return `
      <div
        class="gui-slot-overlay craft-slot-overlay${item ? " has-item" : ""}${isResultSlot ? " is-result" : ""}${staticClass}"
        ${datasetSlot}
        ${slotTooltipHtml ? `data-tooltip-html="${escapeHtml(slotTooltipHtml)}"` : ""}
        style="
          left:${((definition.x - expandLeft) / layout.width) * 100}%;
          top:${((definition.y - expandTop) / layout.height) * 100}%;
          width:${((layout.slotSize + expandLeft + expandRight) / layout.width) * 100}%;
          height:${((layout.slotSize + expandTop + expandBottom) / layout.height) * 100}%;
        "
        title="${item ? "" : escapeHtml(isResultSlot ? "Résultat automatique" : getItemCustomCraftSlotDescription(definition.slot))}"
      >
        ${slotContent || `<span>${escapeHtml(fallbackBadge)}</span>`}
      </div>
    `;
  }).join("");

  return `
    <div class="gui-visualizer-frame has-background craft-visualizer-frame">
      <div class="gui-visualizer-stage craft-visualizer-stage">
        <img class="gui-visualizer-image" src="${layout.backgroundImage}" alt="Table de craft item custom">
        <div class="gui-slot-layer">${slotsHtml}</div>
        ${interactive ? `<div class="gui-minecraft-tooltip" id="${previewId}Tooltip" aria-hidden="true"></div>` : ""}
      </div>
    </div>
  `;
}

function bindItemCustomCraftVisualizationInteractions(previewRoot, previewId) {
  const tooltip = previewRoot.querySelector(`#${previewId}Tooltip`);
  const stage = previewRoot.querySelector(".craft-visualizer-stage");
  void hydrateHeadDatabasePreviewSlots(previewRoot);

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

  previewRoot.querySelectorAll(".craft-slot-overlay[data-slot]").forEach((slotElement) => {
    slotElement.addEventListener("click", () => {
      openItemCustomCraftSlot(slotElement.dataset.slot || "");
    });

    const tooltipHtml = slotElement.dataset.tooltipHtml || "";
    if (tooltip && tooltipHtml) {
      slotElement.addEventListener("mouseenter", (event) => {
        tooltip.innerHTML = tooltipHtml;
        tooltip.classList.add("is-visible");
        tooltip.setAttribute("aria-hidden", "false");
        moveTooltip(event);
      });
      slotElement.addEventListener("mousemove", moveTooltip);
      slotElement.addEventListener("mouseleave", hideTooltip);
    }
  });
}

function updateItemCustomCraftVisualization() {
  const preview = document.getElementById("itemCustomCraftVisualization");
  if (!preview) return;

  preview.innerHTML = buildItemCustomCraftVisualizationMarkup("itemCustomCraftVisualization", true);
  bindItemCustomCraftVisualizationInteractions(preview, "itemCustomCraftVisualization");
  updateItemCustomCraftIngredientTitles();
}

function getItemCustomCraftPreviewHtml() {
  return `
    <div class="preview-gui-visual-block">
      <div class="preview-gui-visual">
        ${buildItemCustomCraftVisualizationMarkup("itemCustomCraftPreviewStatic", false)}
      </div>
    </div>
  `;
}

function formatItemCustomCraftIngredientsText() {
  const ingredients = recupererItemCustomCraftIngredients();
  if (!ingredients.length) {
    return "- Aucun ingrédient";
  }

  return ingredients
    .map((entry) => {
      const previewItem = getItemCustomCraftIngredientPreviewItem(entry);
      const itemLabel = previewItem?.item || entry.item || "Aucun";
      return `- ${getItemCustomCraftSlotDescription(entry.slot)} : ${itemLabel}`;
    })
    .join("\n");
}

function formatItemCustomCraftIngredientsHtml() {
  const ingredients = recupererItemCustomCraftIngredients();
  if (!ingredients.length) {
    return "<div>- Aucun ingrédient</div>";
  }

  return ingredients
    .map((entry) => {
      const previewItem = getItemCustomCraftIngredientPreviewItem(entry);
      const itemLabel = previewItem?.item || entry.item || "Aucun";
      return `<div>- ${escapeHtml(getItemCustomCraftSlotDescription(entry.slot))} : ${escapeHtml(itemLabel)}</div>`;
    })
    .join("");
}

function genererTemplateItemC() {
  const nomItem = valeur("nomItem");
  const itemMc = valeur("itemMc");

  const typeArme = document.getElementById("typeArme").checked;
  const typeOutil = document.getElementById("typeOutil").checked;
  const typeObjet = document.getElementById("typeObjet").checked;
  const typeConsommable = document.getElementById("typeConsommable").checked;
  const typeArmure = document.getElementById("typeArmure").checked;
  const typeCle = document.getElementById("typeCle").checked;
  const typeAutre = document.getElementById("typeAutre").checked;

  const obtentionCraft = document.getElementById("obtentionCraft").checked;
  const obtentionRecompense = document.getElementById("obtentionRecompense").checked;
  const obtentionBoutique = document.getElementById("obtentionBoutique").checked;
  const obtentionShop = document.getElementById("obtentionShop").checked;
  const obtentionEvent = document.getElementById("obtentionEvent").checked;
  const obtentionAutre = document.getElementById("obtentionAutre").checked;

  const selectTypeAutre = valeur("selectTypeAutre");
  const itemRole = valeur("itemRole");

  const craftRecipeItemCustom = valeur("craftRecipeItemCustom");
  const selectObtentionRecompense = valeur("selectObtentionRecompense");
  const selectObtentionBoutiqueCategory = valeur("selectObtentionBoutiqueCategory");
  const selectObtentionBoutiquePrice = valeur("selectObtentionBoutiquePrice");
  const selectObtentionBoutiqueCondition = valeur("selectObtentionBoutiqueCondition");
  const selectObtentionShopCategory = valeur("selectObtentionShopCategory");
  const selectObtentionShopPrice = valeur("selectObtentionShopPrice");
  const selectObtentionShopCurrency = valeur("selectObtentionShopCurrency");
  const selectObtentionShopCondition = valeur("selectObtentionShopCondition");
  const selectObtentionEventName = valeur("selectObtentionEventName");
  const selectObtentionEventMethod = valeur("selectObtentionEventMethod");
  const selectObtentionEventCondition = valeur("selectObtentionEventCondition");
  const selectObtentionAutre = valeur("selectObtentionAutre");
  const linkTexture = valeur("linkTexture");
  const nameItem = valeur("nameItem");
  const loreItem = valeur("loreItem", "");
  const durabiliteItem = valeur("durabiliteItem");
  const effectDescription = valeur("effectDescription");

  const textureItemImage = getSelectedFileName("textureItemImage");
  const selectClicDroit = valeur("selectClicDroit");
  const selectClicGauche = valeur("selectClicGauche");
  const selectPassif = valeur("selectPassif");
  const utilisationClickDroit = document.getElementById("utilisationClickDroit").checked;
  const utilisationClickGauche = document.getElementById("utilisationClickGauche").checked;
  const utilisationPassif = document.getElementById("utilisationPassif").checked;

  let itemTexte = "";
  let detailsItem = "";

  if (typeArme) itemTexte += `☑ Arme\n`;
  if (typeOutil) itemTexte += `☑ Outil\n`;
  if (typeObjet) itemTexte += `☑ Objet\n`;
  if (typeConsommable) itemTexte += `☑ Consommable\n`;
  if (typeCle) itemTexte += `☑ Clé\n`;
  if (typeArmure) itemTexte += `☑ Armure\n`;
  if (typeAutre) {
    itemTexte += `☑ Autre\n`;
    detailsItem += `Autre : ${selectTypeAutre}\n`;
  }

  if (!typeArme && !typeOutil && !typeObjet && !typeConsommable && !typeArmure && !typeCle && !typeAutre) {
    itemTexte = "Aucune";
    detailsItem = "";
  } else {
    itemTexte = itemTexte.trimEnd();
    detailsItem = detailsItem.trimEnd();
  }

  let obtentionTexte = "";
  let detailsObtention = "";

  if (obtentionCraft) {
    obtentionTexte += `☑ Craft\n`;
    detailsObtention += `Craft :\n`;
    detailsObtention += `- Ingrédients :\n${formatItemCustomCraftIngredientsText()}\n`;
    detailsObtention += `- Résultat : ${getItemCustomCraftResultLabel()}\n`;
    detailsObtention += `- Précisions : ${craftRecipeItemCustom || "Aucune"}\n`;
  }
  if (obtentionRecompense) {
    obtentionTexte += `☑ Récompense\n`;
    detailsObtention += `Récompense : ${selectObtentionRecompense}\n`;
  }
  if (obtentionBoutique) {
    obtentionTexte += `☑ Boutique\n`;
    detailsObtention += `Boutique :\n`;
    detailsObtention += `- Catégorie : ${selectObtentionBoutiqueCategory || "Aucune"}\n`;
    detailsObtention += `- Prix : ${selectObtentionBoutiquePrice || "Aucun"}\n`;
    detailsObtention += `- Condition : ${selectObtentionBoutiqueCondition || "Aucune"}\n`;
  }
  if (obtentionShop) {
    obtentionTexte += `☑ Shop\n`;
    detailsObtention += `Shop :\n`;
    detailsObtention += `- Catégorie : ${selectObtentionShopCategory || "Aucune"}\n`;
    detailsObtention += `- Prix : ${selectObtentionShopPrice || "Aucun"}\n`;
    detailsObtention += `- Devise : ${selectObtentionShopCurrency || "Aucune"}\n`;
    detailsObtention += `- Condition : ${selectObtentionShopCondition || "Aucune"}\n`;
  }
  if (obtentionEvent) {
    obtentionTexte += `☑ Event\n`;
    detailsObtention += `Event :\n`;
    detailsObtention += `- Nom de l'event : ${selectObtentionEventName || "Aucun"}\n`;
    detailsObtention += `- Méthode d'obtention : ${selectObtentionEventMethod || "Aucune"}\n`;
    detailsObtention += `- Condition : ${selectObtentionEventCondition || "Aucune"}\n`;
  }
  if (obtentionAutre) {
    obtentionTexte += `☑ Autre\n`;
    detailsObtention += `Autre : ${selectObtentionAutre}\n`;
  }

  if (!obtentionCraft && !obtentionRecompense && !obtentionBoutique && !obtentionShop && !obtentionEvent && !obtentionAutre) {
    obtentionTexte = "Aucune";
    detailsObtention = "";
  } else {
    obtentionTexte = obtentionTexte.trimEnd();
    detailsObtention = detailsObtention.trimEnd();
  }

  let clicTexte = "";
  let detailsClic = "";

  if (utilisationClickDroit) {
    clicTexte += `☑ Clic Droit\n`;
    detailsClic += `Clic Droit : ${selectClicDroit}\n`;
  }
  if (utilisationClickGauche) {
    clicTexte += `☑ Clic Gauche\n`;
    detailsClic += `Clic Gauche : ${selectClicGauche}\n`;
  }
  if (utilisationPassif) {
    clicTexte += `☑ Passif\n`;
    detailsClic += `Passif : ${selectPassif}\n`;
  }

  if (!utilisationClickDroit && !utilisationClickGauche && !utilisationPassif) {
    clicTexte = "Aucune";
    detailsClic = "";
  } else {
    clicTexte = clicTexte.trimEnd();
    detailsClic = detailsClic.trimEnd();
  }

  return `1. Informations générales

Nom de l'item : ${nomItem}
Item Minecraft : ${itemMc}
Type d'item :
${itemTexte}
${detailsItem ? `${detailsItem}\n` : ""}Rôle de l'item :
${itemRole}

2. Obtention

Méthodes d'obtention :
${obtentionTexte}
${detailsObtention ? `\n${detailsObtention}` : ""}

3. Apparence

Texture de l'item : ${textureItemImage}
Lien de la texture : ${linkTexture}
Nom affiché : ${nameItem}
Lore :
${renderLoreText(loreItem, "Aucun")}

4. Caractéristiques

Durabilité : ${durabiliteItem}
Description de l'effet :
${effectDescription}

5. Utilisation

Types d'utilisation :
${clicTexte}
${detailsClic ? `\n${detailsClic}` : ""}`;
}

function genererPreviewItemCHtml() {
  const nomItem = valeur("nomItem");
  const itemMc = valeur("itemMc");

  const typeArme = document.getElementById("typeArme").checked;
  const typeOutil = document.getElementById("typeOutil").checked;
  const typeObjet = document.getElementById("typeObjet").checked;
  const typeConsommable = document.getElementById("typeConsommable").checked;
  const typeArmure = document.getElementById("typeArmure").checked;
  const typeCle = document.getElementById("typeCle").checked;
  const typeAutre = document.getElementById("typeAutre").checked;

  const selectTypeAutre = valeur("selectTypeAutre");
  const itemRole = valeur("itemRole");

  const obtentionCraft = document.getElementById("obtentionCraft").checked;
  const obtentionRecompense = document.getElementById("obtentionRecompense").checked;
  const obtentionBoutique = document.getElementById("obtentionBoutique").checked;
  const obtentionShop = document.getElementById("obtentionShop").checked;
  const obtentionEvent = document.getElementById("obtentionEvent").checked;
  const obtentionAutre = document.getElementById("obtentionAutre").checked;

  const craftRecipeItemCustom = valeur("craftRecipeItemCustom");
  const selectObtentionRecompense = valeur("selectObtentionRecompense");
  const selectObtentionBoutiqueCategory = valeur("selectObtentionBoutiqueCategory");
  const selectObtentionBoutiquePrice = valeur("selectObtentionBoutiquePrice");
  const selectObtentionBoutiqueCondition = valeur("selectObtentionBoutiqueCondition");
  const selectObtentionShopCategory = valeur("selectObtentionShopCategory");
  const selectObtentionShopPrice = valeur("selectObtentionShopPrice");
  const selectObtentionShopCurrency = valeur("selectObtentionShopCurrency");
  const selectObtentionShopCondition = valeur("selectObtentionShopCondition");
  const selectObtentionEventName = valeur("selectObtentionEventName");
  const selectObtentionEventMethod = valeur("selectObtentionEventMethod");
  const selectObtentionEventCondition = valeur("selectObtentionEventCondition");
  const selectObtentionAutre = valeur("selectObtentionAutre");
  const linkTexture = valeur("linkTexture");
  const nameItem = valeur("nameItem");
  const loreItem = valeur("loreItem", "");
  const durabiliteItem = valeur("durabiliteItem");
  const effectDescription = valeur("effectDescription");

  const selectClicDroit = valeur("selectClicDroit");
  const selectClicGauche = valeur("selectClicGauche");
  const selectPassif = valeur("selectPassif");
  const utilisationClickDroit = document.getElementById("utilisationClickDroit").checked;
  const utilisationClickGauche = document.getElementById("utilisationClickGauche").checked;
  const utilisationPassif = document.getElementById("utilisationPassif").checked;

  let html = `

      <div><strong>1. Informations générales</strong></div><br>
      <div><strong>Nom de l'item :</strong> ${escapeHtml(nomItem)}</div><br>
      <div><strong>Item Minecraft :</strong> ${escapeHtml(itemMc)}</div><br>

      <div><strong>Type d'item :</strong><br>`;

  if (typeArme) html += `☑ Arme<br>`;
  if (typeOutil) html += `☑ Outil<br>`;
  if (typeObjet) html += `☑ Objet<br>`;
  if (typeConsommable) html += `☑ Consommable<br>`;
  if (typeCle) html += `☑ Clé<br>`;
  if (typeAutre) html += `☑ Autre<br>`;

  if (typeArmure) html += `☑ Armure<br>`;

  if (!typeArme && !typeOutil && !typeObjet && !typeConsommable && !typeArmure && !typeCle && !typeAutre) {
    html += `Aucune<br>`;
  }

  html += `</div>`;

  if (typeAutre) {
    html += `<br><div><strong>Autre :</strong> ${escapeHtml(selectTypeAutre)}</div>`;
  }

  html += `<br><div><strong>Rôle de l'item :</strong><br>${itemRole ? nl2brSafe(itemRole) : "Aucun"}</div>`;

  html += `
      <br><div><strong>2. Obtention</strong></div><br><div><strong>Méthodes d'obtention :</strong><br>`;

  if (obtentionCraft) html += `☑ Craft<br>`;
  if (obtentionRecompense) html += `☑ Récompense<br>`;
  if (obtentionBoutique) html += `☑ Boutique<br>`;
  if (obtentionShop) html += `☑ Shop<br>`;
  if (obtentionEvent) html += `☑ Event<br>`;
  if (obtentionAutre) html += `☑ Autre<br>`;

  if (!obtentionCraft && !obtentionRecompense && !obtentionBoutique && !obtentionShop && !obtentionEvent && !obtentionAutre) {
    html += `Aucune<br>`;
  }

  html += `</div>`;

  if (obtentionCraft) {
    html += `
      <br><div><strong>Craft :</strong></div>
      ${getItemCustomCraftPreviewHtml()}
      <div><strong>Ingrédients :</strong><br>${formatItemCustomCraftIngredientsHtml()}</div><br>
      <div><strong>Résultat :</strong> ${escapeHtml(getItemCustomCraftResultLabel())}</div><br>
      <div><strong>Précisions :</strong><br>${craftRecipeItemCustom ? nl2brSafe(craftRecipeItemCustom) : "Aucune"}</div>
    `;
  }

  if (obtentionRecompense) {
    html += `<br><div><strong>Récompense :</strong> ${escapeHtml(selectObtentionRecompense)}</div>`;
  }

  if (obtentionBoutique) {
    html += `<br><div><strong>Boutique :</strong><br>
        - Catégorie : ${escapeHtml(selectObtentionBoutiqueCategory || "Aucune")}<br>
        - Prix : ${escapeHtml(selectObtentionBoutiquePrice || "Aucun")}<br>
        - Condition : ${escapeHtml(selectObtentionBoutiqueCondition || "Aucune")}
        </div>`;
  }

  if (obtentionShop) {
    html += `<br><div><strong>Shop :</strong><br>
        - Catégorie : ${escapeHtml(selectObtentionShopCategory || "Aucune")}<br>
        - Prix : ${escapeHtml(selectObtentionShopPrice || "Aucun")}<br>
        - Devise : ${escapeHtml(selectObtentionShopCurrency || "Aucune")}<br>
        - Condition : ${escapeHtml(selectObtentionShopCondition || "Aucune")}
        </div>`;
  }

  if (obtentionEvent) {
    html += `<br><div><strong>Event :</strong><br>
        - Nom de l'event : ${escapeHtml(selectObtentionEventName || "Aucun")}<br>
        - Méthode d'obtention : ${escapeHtml(selectObtentionEventMethod || "Aucune")}<br>
        - Condition : ${escapeHtml(selectObtentionEventCondition || "Aucune")}
        </div>`;
  }

  if (obtentionAutre) {
    html += `<br><div><strong>Autre :</strong> ${escapeHtml(selectObtentionAutre)}</div>`;
  }

  html += `
      <br><div><strong>3. Apparence</strong></div>
      <div><strong>Texture de l'item :</strong></div>
      ${getTemplateTextureItemImageHtml()}

      <br><div><strong>Lien de la texture :</strong> ${escapeHtml(linkTexture)}</div><br>

      <div><strong>Nom affiché :</strong> ${escapeHtml(nameItem)}</div><br>

      <div><strong>Lore :</strong><br>${renderLoreHtml(loreItem, "Aucun")}</div><br>
      <br><div><strong>4. Caractéristiques</strong></div><br>
      <div><strong>Durabilité :</strong> ${escapeHtml(durabiliteItem)}</div><br>
      <div><strong>Description de l'effet :</strong><br>${nl2brSafe(effectDescription)}</div><br>

      <div><strong>5. Utilisation</strong></div><br>
      <div><strong>Types d'utilisation :</strong><br>`;

  if (utilisationClickDroit) html += `☑ Clic Droit<br>`;
  if (utilisationClickGauche) html += `☑ Clic Gauche<br>`;
  if (utilisationPassif) html += `☑ Passif<br>`;

  if (!utilisationClickDroit && !utilisationClickGauche && !utilisationPassif) {
    html += `Aucune<br>`;
  }

  if (utilisationClickDroit) {
    html += `<br><div><strong>Description du clic droit :</strong><br>${nl2brSafe(selectClicDroit)}</div>`;
  }

  if (utilisationClickGauche) {
    html += `<br><div><strong>Description du clic gauche :</strong><br>${nl2brSafe(selectClicGauche)}</div>`;
  }

  if (utilisationPassif) {
    html += `<br><div><strong>Description du passif :</strong><br>${nl2brSafe(selectPassif)}</div>`;
  }

  html += `</div>`;

  return html;
}
