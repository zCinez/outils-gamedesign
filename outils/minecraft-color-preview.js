const MINECRAFT_COLORS = [
  { code: "&0", label: "Noir", color: "#000000" },
  { code: "&1", label: "Bleu fonce", color: "#0000aa" },
  { code: "&2", label: "Vert fonce", color: "#00aa00" },
  { code: "&3", label: "Cyan fonce", color: "#00aaaa" },
  { code: "&4", label: "Rouge fonce", color: "#aa0000" },
  { code: "&5", label: "Violet", color: "#aa00aa" },
  { code: "&6", label: "Or", color: "#ffaa00" },
  { code: "&7", label: "Gris", color: "#aaaaaa" },
  { code: "&8", label: "Gris fonce", color: "#555555" },
  { code: "&9", label: "Bleu", color: "#5555ff" },
  { code: "&a", label: "Vert", color: "#55ff55" },
  { code: "&b", label: "Aqua", color: "#55ffff" },
  { code: "&c", label: "Rouge", color: "#ff5555" },
  { code: "&d", label: "Rose", color: "#ff55ff" },
  { code: "&e", label: "Jaune", color: "#ffff55" },
  { code: "&f", label: "Blanc", color: "#ffffff" }
];

const MINECRAFT_FORMATS = [
  { code: "&l", label: "Gras" },
  { code: "&o", label: "Italique" },
  { code: "&n", label: "Souligne" },
  { code: "&m", label: "Barre" },
  { code: "&k", label: "Magique" },
  { code: "&r", label: "Reset" }
];

const MINECRAFT_SYMBOLS = [
  { symbol: "⭑", label: "Etoile" },
  { symbol: "✦", label: "Eclat" },
  { symbol: "┃", label: "Barre" },
  { symbol: "✔", label: "Coche" },
  { symbol: "✘", label: "Croix" },
  { symbol: "➔", label: "Fleche" },
  { symbol: "➜", label: "Fleche fine" },
  { symbol: "➥", label: "Fleche retour" }
];

const COLOR_MAP = Object.fromEntries(MINECRAFT_COLORS.map((entry) => [entry.code[1], entry.color]));
const OBFUSCATION_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&?";

const input = document.getElementById("minecraftInput");
const rawOutput = document.getElementById("rawOutput");
const sectionOutput = document.getElementById("sectionOutput");
const chatPreview = document.getElementById("chatPreview");
const colorPalette = document.getElementById("colorPalette");
const formatPalette = document.getElementById("formatPalette");
const symbolPalette = document.getElementById("symbolPalette");
const hexColorInput = document.getElementById("hexColorInput");
const hexCodeInput = document.getElementById("hexCodeInput");

let obfuscationInterval = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function randomObfuscatedText(text) {
  return String(text).split("").map((char) => {
    if (char === " " || char === "\t") return char;
    return OBFUSCATION_CHARS[Math.floor(Math.random() * OBFUSCATION_CHARS.length)];
  }).join("");
}

function createDefaultState() {
  return {
    color: "#ffffff",
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    obfuscated: false
  };
}

function renderLine(line) {
  let state = createDefaultState();
  let buffer = "";
  let html = "";

  function flushBuffer() {
    if (!buffer) return;

    const classes = [];
    if (state.bold) classes.push("mc-bold");
    if (state.italic) classes.push("mc-italic");
    if (state.underline) classes.push("mc-underline");
    if (state.strike) classes.push("mc-strike");

    const textContent = state.obfuscated ? randomObfuscatedText(buffer) : buffer;
    const classAttribute = classes.length ? ` class="${classes.join(" ")}"` : "";
    html += `<span${classAttribute} style="color:${state.color}">${escapeHtml(textContent)}</span>`;
    buffer = "";
  }

  for (let i = 0; i < line.length; i += 1) {
    const current = line[i];
    const next = line[i + 1] ? line[i + 1].toLowerCase() : "";

    if ((current === "&" || current === "§") && next) {
      if (Object.hasOwn(COLOR_MAP, next)) {
        flushBuffer();
        state = { color: COLOR_MAP[next], bold: false, italic: false, underline: false, strike: false, obfuscated: false };
        i += 1;
        continue;
      }

      if (next === "l") {
        flushBuffer();
        state.bold = true;
        i += 1;
        continue;
      }

      if (next === "o") {
        flushBuffer();
        state.italic = true;
        i += 1;
        continue;
      }

      if (next === "n") {
        flushBuffer();
        state.underline = true;
        i += 1;
        continue;
      }

      if (next === "m") {
        flushBuffer();
        state.strike = true;
        i += 1;
        continue;
      }

      if (next === "k") {
        flushBuffer();
        state.obfuscated = true;
        i += 1;
        continue;
      }

      if (next === "r") {
        flushBuffer();
        state = createDefaultState();
        i += 1;
        continue;
      }

      if (next === "x" && i + 13 < line.length) {
        const hexDigits = [];
        let validHex = true;

        for (let j = i + 2; j <= i + 13; j += 2) {
          const separator = line[j];
          const hexChar = line[j + 1];
          if ((separator !== "&" && separator !== "§") || !/[0-9a-f]/i.test(hexChar || "")) {
            validHex = false;
            break;
          }
          hexDigits.push(hexChar);
        }

        if (validHex) {
          flushBuffer();
          state = { color: `#${hexDigits.join("")}`, bold: false, italic: false, underline: false, strike: false, obfuscated: false };
          i += 13;
          continue;
        }
      }
    }

    if (current === "&" && line[i + 1] === "#" && /^[0-9a-f]{6}$/i.test(line.slice(i + 2, i + 8))) {
      flushBuffer();
      state = { color: `#${line.slice(i + 2, i + 8)}`, bold: false, italic: false, underline: false, strike: false, obfuscated: false };
      i += 7;
      continue;
    }

    buffer += current;
  }

  flushBuffer();
  return `<span class="mc-line">${html || "&nbsp;"}</span>`;
}

function renderMinecraftFormattedText(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => renderLine(line))
    .join("");
}

function normalizeAmpersandToSection(value) {
  let normalized = String(value || "");
  normalized = normalized.replace(/&x((&|§)[0-9a-fA-F]){6}/g, (match) => match.replaceAll("&", "§"));
  normalized = normalized.replace(/&#([0-9a-fA-F]{6})/g, (_, hex) => {
    const chars = hex.toUpperCase().split("");
    return `§x§${chars[0]}§${chars[1]}§${chars[2]}§${chars[3]}§${chars[4]}§${chars[5]}`;
  });
  normalized = normalized.replace(/&([0-9a-fk-or])/gi, "§$1");
  return normalized;
}

function hasObfuscatedCode(value) {
  return /(?:&|§)k/i.test(String(value || ""));
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 1800);
}

async function copyText(value, successMessage) {
  try {
    await navigator.clipboard.writeText(value);
    showToast(successMessage);
  } catch (error) {
    showToast("Copie impossible sur ce navigateur.");
  }
}

function insertAtCursor(code) {
  const start = typeof input.selectionStart === "number" ? input.selectionStart : input.value.length;
  const end = typeof input.selectionEnd === "number" ? input.selectionEnd : start;
  input.setRangeText(code, start, end, "end");
  input.focus();
  updatePreview();
}

function buildCodeChip(entry, isColor) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "code-chip";
  button.dataset.code = entry.code;
  button.innerHTML = `
    <span class="code-chip__swatch" style="background:${isColor ? entry.color : "linear-gradient(135deg, #55e0ca, #6aa7ff)"}"></span>
    <span class="code-chip__label">${entry.label}</span>
    <span class="code-chip__code">${entry.code}</span>
  `;
  return button;
}

function buildSymbolChip(entry) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "code-chip code-chip--symbol";
  button.dataset.insert = entry.symbol;
  button.innerHTML = `
    <span class="code-chip__glyph">${escapeHtml(entry.symbol)}</span>
    <span class="code-chip__label">${entry.label}</span>
    <span class="code-chip__code">${escapeHtml(entry.symbol)}</span>
  `;
  return button;
}

function renderPalettes() {
  colorPalette.innerHTML = "";
  formatPalette.innerHTML = "";
  symbolPalette.innerHTML = "";

  MINECRAFT_COLORS.forEach((entry) => {
    colorPalette.appendChild(buildCodeChip(entry, true));
  });

  MINECRAFT_FORMATS.forEach((entry) => {
    formatPalette.appendChild(buildCodeChip(entry, false));
  });

  MINECRAFT_SYMBOLS.forEach((entry) => {
    symbolPalette.appendChild(buildSymbolChip(entry));
  });
}

function syncHexInputs(fromColorPicker) {
  if (fromColorPicker) {
    hexCodeInput.value = hexColorInput.value.toUpperCase();
    return;
  }

  const normalized = String(hexCodeInput.value || "").trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(normalized)) {
    hexColorInput.value = normalized;
    hexCodeInput.value = normalized;
  }
}

function startObfuscationRefreshIfNeeded(value) {
  if (obfuscationInterval) {
    window.clearInterval(obfuscationInterval);
    obfuscationInterval = null;
  }

  if (!hasObfuscatedCode(value)) return;

  obfuscationInterval = window.setInterval(() => {
    chatPreview.innerHTML = renderMinecraftFormattedText(input.value);
  }, 260);
}

function updatePreview() {
  const value = input.value || "";
  rawOutput.textContent = value || "Aucun texte saisi";
  sectionOutput.textContent = normalizeAmpersandToSection(value) || "Aucun texte saisi";
  chatPreview.innerHTML = renderMinecraftFormattedText(value || "&7Le rendu apparaitra ici.");
  startObfuscationRefreshIfNeeded(value);
}

document.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-code]");
  if (chip) {
    insertAtCursor(chip.dataset.code || "");
    return;
  }

  const insertChip = event.target.closest("[data-insert]");
  if (insertChip) {
    insertAtCursor(insertChip.dataset.insert || "");
    return;
  }
});

document.getElementById("copyRawButton").addEventListener("click", () => copyText(input.value, "Texte copie."));
document.getElementById("copyRawHeroButton").addEventListener("click", () => copyText(input.value, "Texte copie."));
document.getElementById("copySectionButton").addEventListener("click", () => copyText(normalizeAmpersandToSection(input.value), "Version § copiee."));
document.getElementById("copySectionHeroButton").addEventListener("click", () => copyText(normalizeAmpersandToSection(input.value), "Version § copiee."));
document.getElementById("clearButton").addEventListener("click", () => {
  input.value = "";
  updatePreview();
  input.focus();
});

document.getElementById("insertHexButton").addEventListener("click", () => {
  syncHexInputs(false);
  const normalized = /^#[0-9A-F]{6}$/.test(hexCodeInput.value) ? hexCodeInput.value : hexColorInput.value.toUpperCase();
  insertAtCursor(`&${normalized}`);
});

hexColorInput.addEventListener("input", () => syncHexInputs(true));
hexCodeInput.addEventListener("input", () => syncHexInputs(false));
input.addEventListener("input", updatePreview);

renderPalettes();
input.value = "&6[Neodium] &fBienvenue sur le serveur !\n&7Passe en &a/warp spawn &7pour commencer.";
updatePreview();
