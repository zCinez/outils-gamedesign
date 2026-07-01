function renderCheckedListText(items, emptyLabel = "Aucune") {
  const lines = items.filter(Boolean);
  return lines.length ? lines.join("\n") : emptyLabel;
}

function renderCheckedListHtml(items, emptyLabel = "Aucune") {
  const lines = items.filter(Boolean);
  return lines.length ? `${lines.join("<br>")}<br>` : `${emptyLabel}<br>`;
}

function renderKeyValueRowsHtml(rows, emptyLabel = "Aucune") {
  const lines = rows.filter(Boolean);
  return lines.length ? lines.join("<br>") : emptyLabel;
}

function renderNamedEntriesHtml(entries, renderEntry, emptyLabel = "Aucun") {
  if (!entries.length) {
    return emptyLabel;
  }
  return entries.map(renderEntry).join("");
}

function renderNamedEntriesText(entries, renderEntry, emptyLabel = "Aucun") {
  if (!entries.length) {
    return emptyLabel;
  }
  return entries.map(renderEntry).join("\n\n");
}

function normalizeGuiSharedLoreVariantes(loreVariantes) {
  if (!Array.isArray(loreVariantes)) return [];

  return loreVariantes
    .map((variant) => ({
      contexte: String(variant?.contexte || variant?.etat || variant?.label || "").trim(),
      lore: String(variant?.lore || "").trim()
    }))
    .filter((variant) => variant.contexte || variant.lore);
}

function getGuiSharedLoreVariantesFromItem(item) {
  return normalizeGuiSharedLoreVariantes(item?.loreVariantes || item?.loreVariants);
}

function getGuiSharedLoreVariantesSignature(item) {
  return JSON.stringify(
    getGuiSharedLoreVariantesFromItem(item).map((variant) => ({
      contexte: variant.contexte,
      lore: variant.lore
    }))
  );
}

function renderGuiSharedLoreVariantesText(loreVariantes) {
  const normalizedVariantes = normalizeGuiSharedLoreVariantes(loreVariantes);
  if (!normalizedVariantes.length) return "";

  return `- Variantes de lore :
${normalizedVariantes.map((variant, index) => {
    const label = variant.contexte || `Variante ${index + 1}`;
    const loreLines = getFormattedLoreLines(variant.lore, "Aucun").map((line) => `    ${line}`).join("\n");
    return `  - ${label} :
${loreLines}`;
  }).join("\n")}`;
}

function renderGuiSharedLoreVariantesHtml(loreVariantes) {
  const normalizedVariantes = normalizeGuiSharedLoreVariantes(loreVariantes);
  if (!normalizedVariantes.length) return "";

  return `- Variantes de lore :<br>${normalizedVariantes.map((variant, index) => {
    const label = variant.contexte || `Variante ${index + 1}`;
    const loreLines = getFormattedLoreLines(variant.lore, "Aucun")
      .map((line) => escapeHtml(line))
      .join("<br>&nbsp;&nbsp;&nbsp;&nbsp;");
    return `&nbsp;&nbsp;- ${escapeHtml(label)} :<br>&nbsp;&nbsp;&nbsp;&nbsp;${loreLines}<br>`;
  }).join("")}`;
}

function formatGuiSharedItemRefs(entries, labelPrefix = "Item") {
  const labels = entries.map(({ index }) => `${labelPrefix} ${index + 1}`);
  if (labels.length <= 1) return labels[0] || labelPrefix;
  if (labels.length === 2) return `${labels[0]} et ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`;
}

function formatGuiSharedSlots(entries, slotField = "slot") {
  const slotValues = entries
    .map(({ item }) => String(item?.[slotField] || "").trim())
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

function getGuiSharedItemSummary(entries, itemField = "item") {
  const uniqueItems = [...new Set(entries.map(({ item }) => String(item?.[itemField] || "").trim() || "Aucun"))];
  return {
    label: uniqueItems.length > 1 ? "Items" : "Item",
    value: uniqueItems.join(", ")
  };
}

function getGuiSharedValue(entries, fieldName, fallback) {
  const values = entries.map(({ item }) => String(item?.[fieldName] || "").trim());
  if (!values.length) return fallback;
  const firstValue = values[0] || fallback;
  return values.every((value) => value === values[0]) ? firstValue : "";
}

function buildGuiSharedGroupedEntries(items, options = {}) {
  const {
    nameField = "nom",
    loreField = "lore"
  } = options;
  const groupedEntries = [];
  const groupsByContent = new Map();

  items.forEach((item, index) => {
    const nom = String(item?.[nameField] || "").trim();
    const lore = String(item?.[loreField] || "").trim();
    const loreVariantes = getGuiSharedLoreVariantesFromItem(item);

    if (!nom && !lore && !loreVariantes.length) {
      groupedEntries.push({ type: "single", item, index });
      return;
    }

    const key = `${nom}\u0000${lore}\u0000${getGuiSharedLoreVariantesSignature(item)}`;
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

  return groupedEntries.flatMap((entry) => {
    if (entry.type === "group" && entry.entries.length === 1) {
      const [singleEntry] = entry.entries;
      return [{ type: "single", item: singleEntry.item, index: singleEntry.index }];
    }

    return [entry];
  });
}
