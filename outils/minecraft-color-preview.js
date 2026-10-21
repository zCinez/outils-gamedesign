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
const MINI_MESSAGE_COLOR_NAMES = [
  "black", "dark_blue", "dark_green", "dark_aqua", "dark_red", "dark_purple", "gold", "gray",
  "dark_gray", "blue", "green", "aqua", "red", "light_purple", "yellow", "white"
];
const MINI_MESSAGE_COLORS = Object.fromEntries(MINI_MESSAGE_COLOR_NAMES.map((name, index) => [name, MINECRAFT_COLORS[index].color]));
const DECORATIONS = [
  { key: "bold", code: "l", tag: "bold", aliases: ["bold", "b"] },
  { key: "italic", code: "o", tag: "italic", aliases: ["italic", "i", "em"] },
  { key: "underline", code: "n", tag: "underlined", aliases: ["underlined", "u"] },
  { key: "strike", code: "m", tag: "strikethrough", aliases: ["strikethrough", "st"] },
  { key: "obfuscated", code: "k", tag: "obfuscated", aliases: ["obfuscated", "obf"] }
];
const OBFUSCATION_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&?";

const input = document.getElementById("minecraftInput");
const rawOutput = document.getElementById("rawOutput");
const sectionOutput = document.getElementById("sectionOutput");
const miniMessageOutput = document.getElementById("miniMessageOutput");
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

function readLegacyCode(text) {
  const hex = /^(?:[&§]x(?:[&§][0-9a-f]){6}|&#[0-9a-f]{6})/i.exec(text);
  if (hex) {
    const color = hex[0][1].toLowerCase() === "x" ? hex[0].slice(2).replace(/[&§]/g, "") : hex[0].slice(2);
    return { length: hex[0].length, state: { ...createDefaultState(), color: `#${color.toLowerCase()}` } };
  }

  const match = /^[&§]([0-9a-fk-or])/i.exec(text);
  if (!match) return null;
  const code = match[1].toLowerCase();
  if (Object.hasOwn(COLOR_MAP, code)) return { length: 2, state: { ...createDefaultState(), color: COLOR_MAP[code] } };
  if (code === "r") return { length: 2, state: createDefaultState() };
  return { length: 2, decoration: DECORATIONS.find((entry) => entry.code === code).key };
}

function readMiniMessageTag(text) {
  const match = /^<(\/?)(!?)([a-z_]+|#[0-9a-f]{6})(?::([a-z_]+|#[0-9a-f]{6}))?>/i.exec(text);
  if (!match) return null;
  const closing = Boolean(match[1]);
  const negated = Boolean(match[2]);
  const name = match[3].toLowerCase().replace("grey", "gray");
  const argument = match[4]?.toLowerCase().replace("grey", "gray");
  const tag = { length: match[0].length, closing };

  if (name === "reset" && !closing && !negated && !argument) return { ...tag, reset: true };
  const colorName = ["color", "colour", "c"].includes(name) ? argument : name;
  if (!negated && (Object.hasOwn(MINI_MESSAGE_COLORS, colorName) || /^#[0-9a-f]{6}$/.test(colorName || ""))) {
    if (argument && !["color", "colour", "c"].includes(name)) return null;
    return { ...tag, name: `color:${colorName}`, color: MINI_MESSAGE_COLORS[colorName] || colorName };
  }

  const decoration = DECORATIONS.find((entry) => entry.aliases.includes(name));
  if (!decoration || (argument && !["true", "false"].includes(argument)) || (negated && argument)) return null;
  return { ...tag, name: decoration.tag, decoration: decoration.key, enabled: !negated && argument !== "false" };
}

function parseMinecraftText(line) {
  let state = createDefaultState();
  const stack = [];
  const segments = [];
  let buffer = "";

  function flushBuffer() {
    if (!buffer) return;
    segments.push({ text: buffer, state: { ...state } });
    buffer = "";
  }

  for (let i = 0; i < line.length; i += 1) {
    const current = line[i];
    if (current === "\\" && ["<", "\\"].includes(line[i + 1])) {
      buffer += line[i + 1];
      i += 1;
      continue;
    }

    const legacy = (current === "&" || current === "§") ? readLegacyCode(line.slice(i)) : null;
    if (legacy) {
      flushBuffer();
      if (legacy.state) state = legacy.state;
      else state[legacy.decoration] = true;
      i += legacy.length - 1;
      continue;
    }

    const tag = current === "<" ? readMiniMessageTag(line.slice(i)) : null;
    if (tag) {
      if (tag.closing) {
        const index = stack.findLastIndex((entry) => entry.name === tag.name);
        if (index < 0) { buffer += line.slice(i, i + tag.length); i += tag.length - 1; continue; }
        flushBuffer();
        state = stack[index].state;
        stack.length = index;
      } else {
        flushBuffer();
        if (tag.reset) {
          state = createDefaultState();
          stack.length = 0;
        } else {
          stack.push({ name: tag.name, state: { ...state } });
          if (tag.color) state = { ...state, color: tag.color };
          else state = { ...state, [tag.decoration]: tag.enabled };
        }
      }
      i += tag.length - 1;
      continue;
    }
    buffer += current;
  }

  flushBuffer();
  // Keep a final formatting change even when it has no text yet (palette insertion).
  segments.push({ text: "", state: { ...state } });
  return segments;
}

function parseMinecraftLines(value) {
  const lines = [[]];
  parseMinecraftText(String(value || "")).forEach(({ text, state }) => {
    text.split(/\r?\n/).forEach((part, index) => {
      if (index) lines.push([]);
      lines.at(-1).push({ text: part, state });
    });
  });
  return lines;
}

function renderMinecraftFormattedText(value) {
  return parseMinecraftLines(value).map((segments) => {
    const html = segments.filter((segment) => segment.text).map(({ text, state }) => {
      const classes = DECORATIONS.filter((entry) => entry.key !== "obfuscated" && state[entry.key]).map((entry) => `mc-${entry.key}`);
      const classAttribute = classes.length ? ` class="${classes.join(" ")}"` : "";
      return `<span${classAttribute} style="color:${state.color}">${escapeHtml(state.obfuscated ? randomObfuscatedText(text) : text)}</span>`;
    }).join("");
    return `<span class="mc-line">${html || "&nbsp;"}</span>`;
  }).join("");
}

function colorToLegacy(color, prefix) {
  const entry = MINECRAFT_COLORS.find((entry) => entry.color === color);
  if (entry) return `${prefix}${entry.code[1]}`;
  return prefix === "&" ? `&${color.toUpperCase()}` : `§x${color.slice(1).toUpperCase().split("").map((char) => `§${char}`).join("")}`;
}

function normalizeToLegacy(value, prefix = "&") {
  let previous = createDefaultState();
  return parseMinecraftText(String(value || "")).map(({ text, state }) => {
    const reset = state.color !== previous.color || DECORATIONS.some(({ key }) => previous[key] && !state[key]);
    let codes = reset ? colorToLegacy(state.color, prefix) : "";
    DECORATIONS.forEach(({ key, code }) => { if (state[key] && (reset || !previous[key])) codes += `${prefix}${code}`; });
    previous = state;
    return codes + text;
  }).join("");
}

function normalizeAmpersandToSection(value) {
  return normalizeToLegacy(value, "§");
}

function normalizeToMiniMessage(value) {
  if (!value) return "";
  return parseMinecraftLines(value).map((segments) => {
    const defaultState = createDefaultState();
    if (segments.every(({ text, state }) => !text && Object.keys(state).every((key) => state[key] === defaultState[key]))) return "";
    let previous = createDefaultState();
    const openedTags = ["italic"];
    const content = segments.map(({ text, state }) => {
      let tags = "";
      function openTag(name, argument) {
        tags += `<${name}${argument || ""}>`;
        openedTags.push(name);
      }
      if (state.color !== previous.color) {
        const name = Object.keys(MINI_MESSAGE_COLORS).find((name) => MINI_MESSAGE_COLORS[name] === state.color);
        openTag(name || state.color.toUpperCase());
      }
      DECORATIONS.forEach(({ key, tag }) => { if (state[key] !== previous[key]) openTag(tag, state[key] ? "" : ":false"); });
      previous = state;
      return tags + text.replaceAll("\\", "\\\\").replaceAll("<", "\\<");
    }).join("");
    // Each line can also be pasted as a separate item-lore entry.
    return `<italic:false>${content}${openedTags.reverse().map((tag) => `</${tag}>`).join("")}`;
  }).join("\n");
}

function hasObfuscatedCode(value) {
  return parseMinecraftText(String(value || "")).some(({ text, state }) => text && state.obfuscated);
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
  rawOutput.textContent = normalizeToLegacy(value) || "Aucun texte saisi";
  sectionOutput.textContent = normalizeAmpersandToSection(value) || "Aucun texte saisi";
  miniMessageOutput.textContent = normalizeToMiniMessage(value) || "Aucun texte saisi";
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
document.getElementById("copyMiniMessageButton").addEventListener("click", () => copyText(normalizeToMiniMessage(input.value), "Version MiniMessage copiee."));
document.getElementById("copyMiniMessageHeroButton").addEventListener("click", () => copyText(normalizeToMiniMessage(input.value), "Version MiniMessage copiee."));
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
