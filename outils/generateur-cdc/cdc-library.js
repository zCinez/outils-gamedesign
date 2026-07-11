const LIBRARY_HISTORY_STORAGE_KEY = "neodium-cdc-project-history";
const LIBRARY_PROJECTS_STORAGE_KEY = "neodium-cdc-projects";
const LIBRARY_ACTIVE_PROJECT_STORAGE_KEY = "neodium-cdc-active-project";

let currentWorkspaceProjectId = "";
let currentWorkspaceProject = null;

function getLibraryHistory() {
  try {
    const raw = localStorage.getItem(LIBRARY_HISTORY_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function getLibraryProjects() {
  try {
    const raw = localStorage.getItem(LIBRARY_PROJECTS_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveLibraryProjects(projects) {
  localStorage.setItem(LIBRARY_PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

function saveLibraryHistory(history) {
  localStorage.setItem(LIBRARY_HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function resolveLibraryProjectContext() {
  const url = new URL(window.location.href);
  const projectIdFromUrl = url.searchParams.get("projectId");
  const storedProjectId = localStorage.getItem(LIBRARY_ACTIVE_PROJECT_STORAGE_KEY);
  currentWorkspaceProjectId = projectIdFromUrl || storedProjectId || "";
  currentWorkspaceProject = getLibraryProjects().find(project => project.id === currentWorkspaceProjectId) || null;

  if (currentWorkspaceProjectId) {
    localStorage.setItem(LIBRARY_ACTIVE_PROJECT_STORAGE_KEY, currentWorkspaceProjectId);
  }
}

function updateLibraryTopTabs() {
  const projectTab = document.getElementById("libraryTopTabProject");
  const editorTab = document.getElementById("libraryTopTabEditor");

  if (projectTab) {
    projectTab.href = "./projects.html";
    projectTab.classList.remove("is-disabled");
  }

  if (editorTab) {
    editorTab.href = currentWorkspaceProjectId
      ? `./cdc-generator.html?projectId=${encodeURIComponent(currentWorkspaceProjectId)}`
      : "./cdc-generator.html";
    editorTab.classList.toggle("is-disabled", !currentWorkspaceProjectId);
  }
}

function renameCurrentWorkspaceProject() {
  if (!currentWorkspaceProjectId || !currentWorkspaceProject) {
    alert("Aucun projet actif à renommer.");
    return;
  }

  const nextName = window.prompt("Nouveau nom du projet :", currentWorkspaceProject.name || "")?.trim() || "";
  if (!nextName || nextName === currentWorkspaceProject.name) {
    return;
  }

  const now = new Date().toISOString();
  const nextProjects = getLibraryProjects().map(project => project.id === currentWorkspaceProjectId
    ? { ...project, name: nextName, updatedAt: now }
    : project);
  saveLibraryProjects(nextProjects);

  const nextHistory = getLibraryHistory().map(entry => entry.projectId === currentWorkspaceProjectId
    ? { ...entry, projectLabel: nextName }
    : entry);
  saveLibraryHistory(nextHistory);

  currentWorkspaceProject = nextProjects.find(project => project.id === currentWorkspaceProjectId) || null;
  void window.syncCdcProjectsDirectoryFromStorage?.();
  updateLibraryProjectUi();
  renderCdcLibrary();
}

function formatLibraryTimestamp(value) {
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

function escapeLibraryHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function applyLibraryTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = normalizedTheme;
  document.documentElement.style.colorScheme = normalizedTheme;
  window.syncGlobalThemeSwitch?.(normalizedTheme);
}

function initLibraryTheme() {
  localStorage.removeItem("neodium-cdc-theme");
  applyLibraryTheme("dark");
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function normalizePdfText(value) {
  return String(value ?? "")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("â€™", "'")
    .replaceAll("â€œ", '"')
    .replaceAll("â€", '"')
    .replaceAll("â€“", "-")
    .replaceAll("â€”", "-")
    .replaceAll("â€¢", "-");
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

function buildEditorUrlForCdc(entry) {
  const projectId = currentWorkspaceProjectId || entry?.projectId || "";
  const params = new URLSearchParams();

  if (projectId) {
    params.set("projectId", projectId);
  }

  if (entry?.id) {
    params.set("cdcId", entry.id);
  }

  return `./cdc-generator.html${params.toString() ? `?${params.toString()}` : ""}`;
}

function getFilteredLibraryItems() {
  const search = document.getElementById("librarySearch")?.value.trim().toLowerCase() || "";
  const sortMode = document.getElementById("librarySort")?.value || "recent";
  const history = getLibraryHistory().filter(entry => {
    if (currentWorkspaceProjectId && entry.projectId !== currentWorkspaceProjectId) {
      return false;
    }
    if (!search) return true;
    const haystack = [
      entry.projectName,
      entry.template,
      entry.templateLabel
    ].join(" ").toLowerCase();
    return haystack.includes(search);
  });

  history.sort((a, b) => {
    if (sortMode === "oldest") {
      return String(a.createdAt || a.updatedAt || "").localeCompare(String(b.createdAt || b.updatedAt || ""));
    }
    if (sortMode === "name") {
      return String(a.projectName || "").localeCompare(String(b.projectName || ""), "fr", { sensitivity: "base" });
    }
    if (sortMode === "template") {
      const templateCompare = String(a.templateLabel || a.template || "").localeCompare(String(b.templateLabel || b.template || ""), "fr", { sensitivity: "base" });
      return templateCompare !== 0
        ? templateCompare
        : String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    }
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });

  return history;
}

function updateLibraryProjectUi() {
  const projectName = currentWorkspaceProject?.name || "Projet inconnu";
  const title = document.getElementById("libraryProjectTitle");
  const headerTitle = document.getElementById("libraryHeaderProjectName");
  const createLink = document.getElementById("libraryCreateCdcLink");

  if (title) title.textContent = projectName;
  if (headerTitle) headerTitle.textContent = projectName;
  if (createLink) {
    createLink.href = currentWorkspaceProjectId
      ? `./cdc-generator.html?projectId=${encodeURIComponent(currentWorkspaceProjectId)}`
      : "./cdc-generator.html";
  }

  updateLibraryTopTabs();
}

function renderLibraryStats(items) {
  const count = items.length;
  const templates = new Set(items.map(item => item.templateLabel || item.template || "Inconnu")).size;
  const lastUpdated = items[0]?.updatedAt || items[0]?.createdAt || "";

  const countBadge = document.getElementById("libraryCount");
  if (countBadge) countBadge.textContent = String(count);

  const totalEl = document.getElementById("libraryStatTotal");
  if (totalEl) totalEl.textContent = String(count);

  const templatesEl = document.getElementById("libraryStatTemplates");
  if (templatesEl) templatesEl.textContent = String(templates);

  const lastUpdateEl = document.getElementById("libraryStatLastUpdate");
  if (lastUpdateEl) lastUpdateEl.textContent = count ? formatLibraryTimestamp(lastUpdated) : "-";
}

function editLibraryCdc(cdcId) {
  const entry = getLibraryHistory().find(item => item.id === cdcId);
  if (!entry) {
    alert("CDC introuvable.");
    renderCdcLibrary();
    return;
  }

  const targetUrl = buildEditorUrlForCdc(entry);
  window.navigateToPage?.(targetUrl) || (window.location.href = targetUrl);
}

function deleteLibraryCdc(cdcId) {
  const history = getLibraryHistory();
  const entry = history.find(item => item.id === cdcId);
  if (!entry) {
    renderCdcLibrary();
    return;
  }

  const confirmed = window.confirm(`Supprimer le CDC "${entry.projectName || "CDC sans nom"}" ?`);
  if (!confirmed) return;

  saveLibraryHistory(history.filter(item => item.id !== cdcId));
  void window.syncCdcProjectsDirectoryFromStorage?.();
  renderCdcLibrary();
}

function downloadLibraryCdcPdf(cdcId) {
  const entry = getLibraryHistory().find(item => item.id === cdcId);
  if (!entry) {
    alert("CDC introuvable.");
    return;
  }

  const pdfBytes = buildSimplePdfDocument(
    entry.projectName || "CDC sans nom",
    entry.renderedText || ""
  );

  downloadBlob(
    `${entry.projectName || "cdc"}.pdf`,
    pdfBytes,
    "application/pdf"
  );
}

function renderCdcLibrary() {
  const list = document.getElementById("cdcLibraryList");
  if (!list) return;

  const items = getFilteredLibraryItems();
  renderLibraryStats(items);

  if (items.length === 0) {
    list.innerHTML = `<div class="library-empty">Aucun CDC enregistré pour le moment. Retourne sur la page de création pour enregistrer un premier document.</div>`;
    return;
  }

  list.innerHTML = items.map(item => `
    <article class="library-item">
      <div class="library-item-top">
        <div>
          <p class="library-item-title">${escapeLibraryHtml(item.projectName || "CDC sans nom")}</p>
          <div class="library-item-date">Créé le ${escapeLibraryHtml(formatLibraryTimestamp(item.createdAt || item.updatedAt))}</div>
          <div class="library-item-date">Modifié le ${escapeLibraryHtml(formatLibraryTimestamp(item.updatedAt || item.createdAt))}</div>
        </div>
        <span class="project-history-template">${escapeLibraryHtml(item.templateLabel || item.template || "Template")}</span>
      </div>
      <div class="library-item-actions">
        <button type="button" class="project-history-edit" onclick="editLibraryCdc('${item.id}')">Modifier</button>
        <button type="button" class="project-history-delete" onclick="deleteLibraryCdc('${item.id}')">Supprimer</button>
        <button type="button" class="btn-primary" onclick="downloadLibraryCdcPdf('${item.id}')">Télécharger PDF</button>
      </div>
    </article>
  `).join("");
}

initLibraryTheme();
resolveLibraryProjectContext();
updateLibraryProjectUi();
renderCdcLibrary();

window.editLibraryCdc = editLibraryCdc;
window.deleteLibraryCdc = deleteLibraryCdc;
window.downloadLibraryCdcPdf = downloadLibraryCdcPdf;

void window.hydrateCdcProjectsFromFiles?.().then(result => {
  if (result?.ok && result.hydrated) {
    resolveLibraryProjectContext();
    updateLibraryProjectUi();
    renderCdcLibrary();
  }
});
