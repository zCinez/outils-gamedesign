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
