const LIBRARY_THEME_STORAGE_KEY = "neodium-cdc-theme";
const LIBRARY_HISTORY_STORAGE_KEY = "neodium-cdc-project-history";
const LIBRARY_PROJECTS_STORAGE_KEY = "neodium-cdc-projects";
const LIBRARY_ACTIVE_PROJECT_STORAGE_KEY = "neodium-cdc-active-project";

let selectedCdcId = null;
let autoAdvanceLocked = false;
let lastLibraryScrollY = 0;
let libraryScrollIgnoreUntil = 0;
let pendingBoundaryDirection = null;
let pendingScrollPlacement = "top";
let currentWorkspaceProjectId = "";
let currentWorkspaceProject = null;

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

function toggleLibraryTheme() {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyLibraryTheme(nextTheme);
  localStorage.setItem(LIBRARY_THEME_STORAGE_KEY, nextTheme);
}

function initLibraryTheme() {
  applyLibraryTheme(localStorage.getItem(LIBRARY_THEME_STORAGE_KEY) || "light");
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

function selectCdcEntry(id) {
  selectedCdcId = id;
  renderCdcLibrary();
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

function editSelectedCdc() {
  if (!selectedCdcId) {
    alert("Aucun CDC sélectionné.");
    return;
  }

  editLibraryCdc(selectedCdcId);
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

  const nextHistory = history.filter(item => item.id !== cdcId);
  saveLibraryHistory(nextHistory);

  if (selectedCdcId === cdcId) {
    const currentItems = nextHistory.filter(item => !currentWorkspaceProjectId || item.projectId === currentWorkspaceProjectId);
    selectedCdcId = currentItems[0]?.id || null;
  }

  void window.syncCdcProjectsDirectoryFromStorage?.();
  renderCdcLibrary();
}

function deleteSelectedCdc() {
  if (!selectedCdcId) {
    alert("Aucun CDC sélectionné.");
    return;
  }

  deleteLibraryCdc(selectedCdcId);
}

function getSelectedLibraryIndex(items) {
  return items.findIndex(item => item.id === selectedCdcId);
}

function selectNextCdc() {
  const items = getFilteredLibraryItems();
  const currentIndex = getSelectedLibraryIndex(items);
  if (currentIndex === -1 || currentIndex >= items.length - 1) return;
  pendingScrollPlacement = "top";
  selectCdcEntry(items[currentIndex + 1].id);
}

function selectPreviousCdc() {
  const items = getFilteredLibraryItems();
  const currentIndex = getSelectedLibraryIndex(items);
  if (currentIndex <= 0) return;
  pendingScrollPlacement = "bottom";
  selectCdcEntry(items[currentIndex - 1].id);
}

function renderCdcLibrary() {
  const list = document.getElementById("cdcLibraryList");
  if (!list) return;

  const items = getFilteredLibraryItems();
  renderLibraryStats(items);

  if (!selectedCdcId && items.length > 0) {
    selectedCdcId = items[0].id;
  }
  if (selectedCdcId && !items.some(item => item.id === selectedCdcId)) {
    selectedCdcId = items[0]?.id || null;
  }

  if (items.length === 0) {
    list.innerHTML = `<div class="library-empty">Aucun CDC enregistré pour le moment. Retourne sur la page de création pour enregistrer un premier document.</div>`;
    renderCdcDetail();
    return;
  }

  list.innerHTML = items.map(item => `
    <div class="library-item${item.id === selectedCdcId ? " is-active" : ""}" onclick="selectCdcEntry('${item.id}')">
      <div class="library-item-top">
        <div>
          <p class="library-item-title">${escapeLibraryHtml(item.projectName || "CDC sans nom")}</p>
          <div class="library-item-date">Modifié le ${escapeLibraryHtml(formatLibraryTimestamp(item.updatedAt || item.createdAt))}</div>
        </div>
        <span class="project-history-template">${escapeLibraryHtml(item.templateLabel || item.template || "Template")}</span>
      </div>
      <div class="library-item-actions">
        <button type="button" class="project-history-open" onclick="event.stopPropagation(); selectCdcEntry('${item.id}')">Voir</button>
        <button type="button" class="project-history-edit" onclick="event.stopPropagation(); editLibraryCdc('${item.id}')">Modifier</button>
        <button type="button" class="project-history-delete" onclick="event.stopPropagation(); deleteLibraryCdc('${item.id}')">Supprimer</button>
      </div>
    </div>
  `).join("");

  renderCdcDetail();
}

function getSelectedLibraryEntry() {
  if (!selectedCdcId) return null;
  return getLibraryHistory().find(entry => entry.id === selectedCdcId) || null;
}

function renderCdcDetail() {
  const empty = document.getElementById("cdcDetailEmpty");
  const detail = document.getElementById("cdcDetailView");
  const entry = getSelectedLibraryEntry();

  if (!entry) {
    if (empty) empty.style.display = "block";
    if (detail) detail.style.display = "none";
    return;
  }

  if (empty) empty.style.display = "none";
  if (detail) detail.style.display = "block";

  document.getElementById("cdcDetailTemplate").textContent = entry.templateLabel || entry.template || "Template";
  document.getElementById("cdcDetailTitle").textContent = entry.projectName || "CDC sans nom";
  document.getElementById("cdcDetailCreated").textContent = `Créé le ${formatLibraryTimestamp(entry.createdAt || entry.updatedAt)}`;
  document.getElementById("cdcDetailUpdated").textContent = `Modifié le ${formatLibraryTimestamp(entry.updatedAt)}`;

  const preview = document.getElementById("cdcDetailPreview");
  preview.innerHTML = entry.renderedHtml
    ? entry.renderedHtml
    : `<div class="library-empty">Ce CDC ne contient pas encore de rendu enrichi. Ouvre-le dans la page de création puis enregistre-le à nouveau pour générer l’aperçu.</div>`;

  libraryScrollIgnoreUntil = Date.now() + 700;
  pendingBoundaryDirection = null;

  if (pendingScrollPlacement === "bottom") {
    const bottomTarget = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    lastLibraryScrollY = bottomTarget;
    window.scrollTo({ top: bottomTarget, behavior: "smooth" });
  } else {
    lastLibraryScrollY = 0;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  pendingScrollPlacement = "top";
}

function downloadSelectedCdcPdf() {
  const entry = getSelectedLibraryEntry();
  if (!entry) return;

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

function initLibraryAutoAdvance() {
  window.addEventListener("scroll", () => {
    if (Date.now() < libraryScrollIgnoreUntil) {
      lastLibraryScrollY = window.scrollY;
      return;
    }

    const currentScrollY = window.scrollY;
    const remaining = document.documentElement.scrollHeight - window.innerHeight - currentScrollY;
    const atBottom = remaining <= 24;
    const atTop = currentScrollY <= 8;

    if (!atBottom && !atTop) {
      pendingBoundaryDirection = null;
    }

    lastLibraryScrollY = currentScrollY;
  });

  window.addEventListener("wheel", (event) => {
    if (autoAdvanceLocked) return;
    if (Date.now() < libraryScrollIgnoreUntil) return;

    const currentScrollY = window.scrollY;
    const remaining = document.documentElement.scrollHeight - window.innerHeight - currentScrollY;
    const atBottom = remaining <= 24;
    const atTop = currentScrollY <= 8;

    if (event.deltaY > 0 && atBottom) {
      if (pendingBoundaryDirection === "bottom") {
        autoAdvanceLocked = true;
        selectNextCdc();
        window.setTimeout(() => {
          autoAdvanceLocked = false;
        }, 500);
      } else {
        pendingBoundaryDirection = "bottom";
      }
      return;
    }

    if (event.deltaY < 0 && atTop) {
      if (pendingBoundaryDirection === "top") {
        autoAdvanceLocked = true;
        selectPreviousCdc();
        window.setTimeout(() => {
          autoAdvanceLocked = false;
        }, 500);
      } else {
        pendingBoundaryDirection = "top";
      }
      return;
    }

    if (!atBottom && !atTop) {
      pendingBoundaryDirection = null;
    }
  }, { passive: true });
}

initLibraryTheme();
resolveLibraryProjectContext();
updateLibraryProjectUi();
renderCdcLibrary();
initLibraryAutoAdvance();

window.editSelectedCdc = editSelectedCdc;
window.deleteSelectedCdc = deleteSelectedCdc;
window.editLibraryCdc = editLibraryCdc;
window.deleteLibraryCdc = deleteLibraryCdc;

void window.hydrateCdcProjectsFromFiles?.().then(result => {
  if (result?.ok && result.hydrated) {
    resolveLibraryProjectContext();
    updateLibraryProjectUi();
    renderCdcLibrary();
  }
});
