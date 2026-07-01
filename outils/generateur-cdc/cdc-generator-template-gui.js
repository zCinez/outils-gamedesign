function formatGuiTemplateItemRefs(entries) {
  const labels = entries.map(({ index }) => `Item ${index + 1}`);
  if (labels.length <= 1) return labels[0] || "Item";
  if (labels.length === 2) return `${labels[0]} et ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`;
}

function formatGuiTemplateSlots(entries) {
  const slotValues = entries
    .map(({ item }) => String(item?.slot || "").trim())
    .filter(Boolean);

  if (!slotValues.length) return "Aucun";

  const numericSlots = slotValues.map((value) => Number.parseInt(value, 10));
  const allSlotsAreNumeric = numericSlots.every((value) => Number.isFinite(value));

  if (!allSlotsAreNumeric) {
    return slotValues.join(", ");
  }

  const sortedSlots = [...new Set(numericSlots)].sort((a, b) => a - b);
  if (sortedSlots.length === 1) {
    return `de ${sortedSlots[0]} à ${sortedSlots[0]}`;
  }

  const areContiguous = sortedSlots.every((slot, index) => index === 0 || slot === sortedSlots[index - 1] + 1);
  if (areContiguous) {
    return `de ${sortedSlots[0]} à ${sortedSlots[sortedSlots.length - 1]}`;
  }

  return sortedSlots.join(", ");
}

function getGuiTemplateGroupedItemsSummary(entries) {
  const uniqueItems = [...new Set(entries.map(({ item }) => String(item?.item || "").trim() || "Aucun"))];
  return {
    label: uniqueItems.length > 1 ? "Items" : "Item",
    value: uniqueItems.join(", ")
  };
}

function getGuiTemplateSharedValue(entries, fieldName, fallback) {
  const values = entries.map(({ item }) => String(item?.[fieldName] || "").trim());
  if (!values.length) return fallback;
  const firstValue = values[0] || fallback;
  return values.every(value => value === values[0]) ? firstValue : "";
}

function normalizeGuiTemplateLoreVariantes(loreVariantes) {
  if (!Array.isArray(loreVariantes)) return [];

  return loreVariantes
    .map((variant) => ({
      contexte: String(variant?.contexte || variant?.etat || variant?.label || "").trim(),
      lore: String(variant?.lore || "").trim()
    }))
    .filter((variant) => variant.contexte || variant.lore);
}

function getGuiTemplateLoreVariantesSignature(item) {
  return JSON.stringify(
    normalizeGuiTemplateLoreVariantes(item?.loreVariantes || item?.loreVariants).map((variant) => ({
      contexte: variant.contexte,
      lore: variant.lore
    }))
  );
}

function renderGuiTemplateLoreVariantesText(loreVariantes) {
  const normalizedVariantes = normalizeGuiTemplateLoreVariantes(loreVariantes);
  if (!normalizedVariantes.length) return "";

  return `- Variantes de lore :
${normalizedVariantes.map((variant, index) => {
    const label = variant.contexte || `Variante ${index + 1}`;
    const loreLines = getFormattedLoreLines(variant.lore, "Aucun").map((line) => `    ${line}`).join("\n");
    return `  - ${label} :
${loreLines}`;
  }).join("\n")}`;
}

function renderGuiTemplateLoreVariantesHtml(loreVariantes) {
  const normalizedVariantes = normalizeGuiTemplateLoreVariantes(loreVariantes);
  if (!normalizedVariantes.length) return "";

  return `- Variantes de lore :<br>${normalizedVariantes.map((variant, index) => {
    const label = variant.contexte || `Variante ${index + 1}`;
    const loreLines = getFormattedLoreLines(variant.lore, "Aucun")
      .map((line) => escapeHtml(line))
      .join("<br>&nbsp;&nbsp;&nbsp;&nbsp;");
    return `&nbsp;&nbsp;- ${escapeHtml(label)} :<br>&nbsp;&nbsp;&nbsp;&nbsp;${loreLines}<br>`;
  }).join("")}`;
}

function buildGuiTemplateItemEntries(items) {
  const groupedEntries = [];
  const groupsByContent = new Map();

  items.forEach((item, index) => {
    const nom = String(item.nom || "").trim();
    const lore = String(item.lore || "").trim();
    const loreVariantes = normalizeGuiTemplateLoreVariantes(item.loreVariantes || item.loreVariants);

    if (!nom && !lore && !loreVariantes.length) {
      groupedEntries.push({ type: "single", item, index });
      return;
    }

    const key = `${nom}\u0000${lore}\u0000${getGuiTemplateLoreVariantesSignature(item)}`;
    const existingGroup = groupsByContent.get(key);

    if (existingGroup) {
      existingGroup.entries.push({ item, index });
      return;
    }

    const group = {
      type: "group",
      nom,
      lore,
      loreVariantes,
      entries: [{ item, index }]
    };

    groupsByContent.set(key, group);
    groupedEntries.push(group);
  });

  return groupedEntries.flatMap(entry => {
    if (entry.type === "group" && entry.entries.length === 1) {
      const [singleEntry] = entry.entries;
      return [{ type: "single", item: singleEntry.item, index: singleEntry.index }];
    }

    return [entry];
  });
}

function renderGuiTemplateItemText(item, index) {
  const loreVariantesText = renderGuiTemplateLoreVariantesText(item.loreVariantes || item.loreVariants);

  let text = `Item ${index + 1} :
- Slot : ${item.slot || "Aucun"}
- Item : ${item.item || "Aucun"}
- Nom : ${item.nom || "Aucun"}
- Lore :
${renderLoreText(item.lore, "Aucun")}`;

  if (loreVariantesText) {
    text += `\n${loreVariantesText}`;
  }

  text += `
- Fonction : ${item.fonction || "Aucune"}
- Action au clic : ${item.action || "Aucune"}`;

  return text;
}

function renderGuiTemplateGroupedItemText(group) {
  const sharedFunction = getGuiTemplateSharedValue(group.entries, "fonction", "Aucune");
  const sharedAction = getGuiTemplateSharedValue(group.entries, "action", "Aucune");
  const slots = formatGuiTemplateSlots(group.entries);
  const itemSummary = getGuiTemplateGroupedItemsSummary(group.entries);
  const loreVariantesText = renderGuiTemplateLoreVariantesText(group.loreVariantes);

  let text = `${formatGuiTemplateItemRefs(group.entries)} :
- Slots : ${slots}
- ${itemSummary.label} : ${itemSummary.value}
- Nom : ${group.nom || "Aucun"}
- Lore :
${renderLoreText(group.lore, "Aucun")}`;

  if (loreVariantesText) {
    text += `\n${loreVariantesText}`;
  }

  if (sharedFunction) {
    text += `\n- Fonction : ${sharedFunction}`;
  } else {
    text += `\n- Fonctions par item :\n${group.entries
      .map(({ item, index }) => `  - Item ${index + 1} : ${item.fonction || "Aucune"}`)
      .join("\n")}`;
  }

  if (sharedAction) {
    text += `\n- Action au clic : ${sharedAction}`;
  } else {
    text += `\n- Actions au clic par item :\n${group.entries
      .map(({ item, index }) => `  - Item ${index + 1} : ${item.action || "Aucune"}`)
      .join("\n")}`;
  }

  return text;
}

function renderGuiTemplateItemHtml(item, index) {
  const loreVariantesHtml = renderGuiTemplateLoreVariantesHtml(item.loreVariantes || item.loreVariants);

  let html = `
<br><strong>Item ${index + 1} :</strong><br>
- Slot : ${escapeHtml(item.slot || "Aucun")}<br>
- Item : ${escapeHtml(item.item || "Aucun")}<br>
- Nom : ${escapeHtml(item.nom || "Aucun")}<br>
- Lore :<br>${renderLoreHtml(item.lore, "Aucun")}<br>`;

  if (loreVariantesHtml) {
    html += `${loreVariantesHtml}`;
  }

  html += `- Fonction : ${escapeHtml(item.fonction || "Aucune")}<br>
- Action au clic : ${escapeHtml(item.action || "Aucune")}<br>`;

  return html;
}

function renderGuiTemplateGroupedItemHtml(group) {
  const sharedFunction = getGuiTemplateSharedValue(group.entries, "fonction", "Aucune");
  const sharedAction = getGuiTemplateSharedValue(group.entries, "action", "Aucune");
  const slots = formatGuiTemplateSlots(group.entries);
  const itemSummary = getGuiTemplateGroupedItemsSummary(group.entries);
  const loreVariantesHtml = renderGuiTemplateLoreVariantesHtml(group.loreVariantes);

  let html = `
<br><strong>${escapeHtml(formatGuiTemplateItemRefs(group.entries))} :</strong><br>
- Slots : ${escapeHtml(slots)}<br>
- ${escapeHtml(itemSummary.label)} : ${escapeHtml(itemSummary.value)}<br>
- Nom : ${escapeHtml(group.nom || "Aucun")}<br>
- Lore :<br>${renderLoreHtml(group.lore, "Aucun")}<br>`;

  if (loreVariantesHtml) {
    html += `${loreVariantesHtml}`;
  }

  if (sharedFunction) {
    html += `- Fonction : ${escapeHtml(sharedFunction)}<br>`;
  } else {
    html += `- Fonctions par item :<br>${group.entries
      .map(({ item, index }) => `&nbsp;&nbsp;- Item ${index + 1} : ${escapeHtml(item.fonction || "Aucune")}<br>`)
      .join("")}`;
  }

  if (sharedAction) {
    html += `- Action au clic : ${escapeHtml(sharedAction)}<br>`;
  } else {
    html += `- Actions au clic par item :<br>${group.entries
      .map(({ item, index }) => `&nbsp;&nbsp;- Item ${index + 1} : ${escapeHtml(item.action || "Aucune")}<br>`)
      .join("")}`;
  }

  return html;
}

function genererTemplateGUI() {
  const guiNom = valeur("guiNom");
  const guiNomAffiche = valeur("guiNomAffiche");
  const guiCommande = valeur("guiCommande");
  const guiNPCNom = valeur("guiNPCNom");
  const guiNPCCoordonnee = valeur("guiNPCCoordonnee");
  const guiItemOuverture = valeur("guiItemOuverture");
  const guiOuvertureAutre = valeur("guiOuvertureAutre");
  const guiObjectif = valeur("guiObjectif");
  const guiTailleSelect = valeur("guiTaille");
  const guiTailleAutre = valeur("guiTailleAutre", "");

  const ouvertureCommande = document.getElementById("ouvertureCommande").checked;
  const ouvertureNPC = document.getElementById("ouvertureNPC").checked;
  const ouvertureItem = document.getElementById("ouvertureItem").checked;
  const ouvertureAutreCheck = document.getElementById("ouvertureAutreCheck").checked;

  const tailleFinale = guiTailleSelect === "Autre" ? (guiTailleAutre || "Autre") : guiTailleSelect;
  const items = recupererItemsGUITemplate();
  const groupedItems = buildGuiTemplateItemEntries(items);
  const imageGUI = getSelectedFileName("guiImage");

  const ouvertureTexte = renderCheckedListText([
    ouvertureCommande ? "☑ Commande" : "",
    ouvertureNPC ? "☑ NPC" : "",
    ouvertureItem ? "☑ Item" : "",
    ouvertureAutreCheck ? "☑ Autre" : ""
  ]);

  const detailsOuverture = [
    ouvertureCommande ? `Commande : ${guiCommande}` : "",
    ouvertureNPC ? `NPC :\n- Nom : ${guiNPCNom}\n- Coordonnée : ${guiNPCCoordonnee}` : "",
    ouvertureItem ? `Item : ${guiItemOuverture}` : "",
    ouvertureAutreCheck ? `Autre : ${guiOuvertureAutre}` : ""
  ].filter(Boolean).join("\n");

  const contenuTexte = renderNamedEntriesText(
    groupedItems,
    (entry) => entry.type === "group"
      ? renderGuiTemplateGroupedItemText(entry)
      : renderGuiTemplateItemText(entry.item, entry.index),
    "Aucun item"
  );

  return `1. Informations générales

Nom du GUI : ${guiNom}
Nom affiché : ${guiNomAffiche}
Taille : ${tailleFinale}
Objectif :
${guiObjectif}

2. Ouverture

Méthodes d'ouverture :
${ouvertureTexte}
${detailsOuverture ? `\n${detailsOuverture}` : ""}

3. Visuel

Image du GUI : ${imageGUI}

4. Contenu du GUI

${contenuTexte}`;
}

function genererPreviewGUIHtml() {
  const guiNom = valeur("guiNom");
  const guiNomAffiche = valeur("guiNomAffiche");
  const guiCommande = valeur("guiCommande");
  const guiNPCNom = valeur("guiNPCNom");
  const guiNPCCoordonnee = valeur("guiNPCCoordonnee");
  const guiItemOuverture = valeur("guiItemOuverture");
  const guiOuvertureAutre = valeur("guiOuvertureAutre");
  const guiObjectif = valeur("guiObjectif");
  const guiTailleSelect = valeur("guiTaille");
  const guiTailleAutre = valeur("guiTailleAutre", "");
  const lientextureGUI = valeur("lienTextureGUI", "");

  const ouvertureCommande = document.getElementById("ouvertureCommande").checked;
  const ouvertureNPC = document.getElementById("ouvertureNPC").checked;
  const ouvertureItem = document.getElementById("ouvertureItem").checked;
  const ouvertureAutreCheck = document.getElementById("ouvertureAutreCheck").checked;

  const tailleFinale = guiTailleSelect === "Autre" ? (guiTailleAutre || "Autre") : guiTailleSelect;
  const items = recupererItemsGUITemplate();
  const groupedItems = buildGuiTemplateItemEntries(items);

  let html = `
<div><strong>1. Informations générales</strong></div><br>
<div><strong>Nom du GUI :</strong> ${escapeHtml(guiNom)}</div><br>
<div><strong>Nom affiché :</strong> ${escapeHtml(guiNomAffiche)}</div><br>
<div><strong>Taille :</strong> ${escapeHtml(tailleFinale)}</div><br>
<div><strong>Objectif :</strong><br>${nl2brSafe(guiObjectif)}</div><br>

<div><strong>2. Ouverture</strong></div><br>
<div><strong>Méthodes d'ouverture :</strong><br>${renderCheckedListHtml([
  ouvertureCommande ? "☑ Commande" : "",
  ouvertureNPC ? "☑ NPC" : "",
  ouvertureItem ? "☑ Item" : "",
  ouvertureAutreCheck ? "☑ Autre" : ""
], "Aucune")}</div>`;

  if (ouvertureCommande) html += `<br><div><strong>Commande :</strong> ${escapeHtml(guiCommande)}</div>`;
  if (ouvertureNPC) {
    html += `<br><div><strong>NPC :</strong><br>
    - Nom : ${escapeHtml(guiNPCNom)}<br>
    - Coordonnée : ${escapeHtml(guiNPCCoordonnee)}
    </div>`;
  }
  if (ouvertureItem) html += `<br><div><strong>Item :</strong> ${escapeHtml(guiItemOuverture)}</div>`;
  if (ouvertureAutreCheck) html += `<br><div><strong>Autre :</strong> ${escapeHtml(guiOuvertureAutre)}</div>`;

  html += `
<br><br><div><strong>3. Visuel</strong></div>
${getTemplateGuiImageHtml()}
<div><strong>Lien de la texture :</strong> ${escapeHtml(lientextureGUI)}</div><br>
<div><strong>4. Contenu du GUI</strong><br>${
    renderNamedEntriesHtml(
      groupedItems,
      (entry) => entry.type === "group"
        ? renderGuiTemplateGroupedItemHtml(entry)
        : renderGuiTemplateItemHtml(entry.item, entry.index),
      "Aucun item"
    )
  }</div>`;

  return html;
}
