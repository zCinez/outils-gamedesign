const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function page() {
  const elements = new Map();
  const element = () => ({
    value: '', dataset: {}, listeners: {}, textContent: '', innerHTML: '',
    addEventListener(type, listener) { this.listeners[type] = listener; },
    appendChild() {}, focus() {}, remove() {}
  });
  const find = id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); };
  const copied = [];
  const context = vm.createContext({
    document: { getElementById: find, createElement: element, addEventListener() {}, querySelector() { return null; }, body: element() },
    window: { setInterval() { return 1; }, clearInterval() {}, setTimeout() {} },
    navigator: { clipboard: { async writeText(text) { copied.push(text); } } }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../minecraft-color-preview.js'), 'utf8'), context);
  return { context, find, copied };
}

const sample = `<italic:false><gray><strikethrough>---------------------------------</strikethrough>
<italic:false><dark_gray>[<aqua>!<dark_gray>] <gray>Obtention<white>: Ferme à fèves

<italic:false><gold>✷ <yellow>Fonctionnalités<white> :
<italic:false><white> <yellow>➡ Sert à crafter le Sable Augmenté.
<italic:false><gray><strikethrough>---------------------------------</strikethrough>
<italic:false><gold>➥ <white><bold>┃ </bold><aqua><bold>/wiki </bold><aqua>pour plus d'infos.
<italic:false><dark_purple>(#32)
<italic:false><gray><strikethrough>---------------------------------</strikethrough>`;

// Compare visible characters with their styles, independent of serializer grouping.
function appearance(context, value) {
  return JSON.parse(JSON.stringify(context.parseMinecraftText(value)
    .flatMap(({ text, state }) => Array.from(text, char => char === '\n' ? { char } : ({ char, ...state })))));
}

test('renders the supplied MiniMessage colors, closed decorations and blank lines', () => {
  const { context, find } = page();
  find('minecraftInput').value = sample;
  find('minecraftInput').listeners.input();
  const html = find('chatPreview').innerHTML;
  assert.equal((html.match(/class="mc-line"/g) || []).length, 9);
  assert.match(html, /class="mc-strike" style="color:#aaaaaa">-+/);
  assert.match(html, /class="mc-bold" style="color:#55ffff">\/wiki /);
  assert.match(html, /style="color:#aa00aa">\(#32\)/);
  assert.doesNotMatch(html, /&lt;italic|mc-italic/);
  for (const output of ['rawOutput', 'sectionOutput']) {
    assert.deepEqual(appearance(context, find(output).textContent), appearance(context, sample));
  }
});

test('all colors, legacy styles, HEX forms and resets survive MiniMessage conversion', () => {
  const { context } = page();
  const values = [
    ...'0123456789abcdef'.split('').map(code => `&${code}Couleur`),
    '&lGras &oitalique &nSouligné &mBarré &kMagique &rNormal',
    '&#12AbEfHEX &x&1&2&A&B&E&FLong §x§1§2§a§b§e§fSection',
    '&6Première\nDeuxième\n&rBlanc\n\n&aVert', sample,
    '<bold>A<red>B</red>C</bold>D',
    '<italic>A<italic:false>B</italic>C</italic>D',
    '<gold>Première\n<bold>Deuxième</bold>\nTroisième</gold>',
    '<color:#123456><u><st>Les deux</st></u></color:#123456>'
  ];
  for (const value of values) {
    const converted = context.normalizeToMiniMessage(value);
    assert.deepEqual(appearance(context, converted), appearance(context, value), value);
    assert.deepEqual(appearance(context, context.normalizeToLegacy(converted)), appearance(context, value), value);
    assert.deepEqual(appearance(context, context.normalizeAmpersandToSection(converted)), appearance(context, value), value);
  }
});

test('each generated line works independently as item lore', () => {
  const { context } = page();
  const value = '<gold><bold>Première\nDeuxième</bold>\n<white>Troisième';
  const original = appearance(context, value);
  const expected = [[], [], []];
  let index = 0;
  for (const char of original) { if (char.char === '\n') index++; else expected[index].push(char); }
  context.normalizeToMiniMessage(value).split('\n').forEach((line, index) => {
    assert.match(line, /^<italic:false>/);
    assert.deepEqual(appearance(context, line), expected[index]);
  });
});

test('literal tags stay escaped and input HTML cannot become markup', () => {
  const { context } = page();
  const value = String.raw`\<red> texte <img src=x onerror=alert(1)> &z`;
  const html = context.renderMinecraftFormattedText(value);
  assert.match(html, /&lt;red&gt;/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img/);
  assert.deepEqual(appearance(context, context.normalizeToMiniMessage(value)), appearance(context, value));
});

test('MiniMessage obfuscation respects false, aliases and closing tags', () => {
  const { context } = page();
  assert.equal(context.hasObfuscatedCode('<obf>Secret</obf>'), true);
  assert.equal(context.hasObfuscatedCode('<obfuscated:false>Visible'), false);
  assert.equal(context.hasObfuscatedCode('<obf></obf>Visible'), false);
  assert.equal(context.hasObfuscatedCode('&kSecret'), true);
});

test('copy buttons copy the displayed MiniMessage and clearing resets all outputs', async () => {
  const { find, copied } = page();
  find('minecraftInput').value = '&6Test &lgras';
  find('minecraftInput').listeners.input();
  for (const id of ['copyMiniMessageButton', 'copyMiniMessageHeroButton']) {
    find(id).listeners.click();
    await Promise.resolve();
    assert.equal(copied.at(-1), find('miniMessageOutput').textContent);
  }
  find('clearButton').listeners.click();
  for (const id of ['rawOutput', 'sectionOutput', 'miniMessageOutput']) assert.equal(find(id).textContent, 'Aucun texte saisi');
});
