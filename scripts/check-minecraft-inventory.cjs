const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../outils/generateur-cdc');
const context = vm.createContext({
  window: { addEventListener() {} },
  document: { addEventListener() {}, getElementById() { return null; } },
  console,
});
for (const name of ['minecraft-items-catalog.js', 'minecraft-inventory-icons.js',
  'minecraft-item-texture-map.js', 'minecraft-item-block-faces-map.js',
  ...fs.readdirSync(root).filter(name => /^cdc-generator-template-.*\.js$/.test(name)), 'cdc-generator.js']) {
  // Exercise the real renderer without booting the UI or touching saved CDCs.
  const source = fs.readFileSync(path.join(root, name), 'utf8').replace('void bootGeneratorPage();', '');
  vm.runInContext(source, context, { filename: name });
}

const icons = context.window.MINECRAFT_INVENTORY_ICONS;
for (const id of Object.keys(icons)) {
  const url = context.resolveRenderedMinecraftItemIconUrl(`minecraft:${id.toUpperCase()}`);
  assert.equal(url, `./minecraft-item-textures/inventory/${id}.png`, id);
  assert.ok(fs.existsSync(path.join(root, url)), id);
  const craft = context.buildItemCustomCraftSlotRenderData({ item: id }, id, 1);
  assert.ok(craft.slotContent.includes(`src="${url}"`), `Craft icon: ${id}`);
  assert.ok(!craft.slotContent.includes('https://'), `External request: ${id}`);
}

const customIds = vm.runInContext('CUSTOM_MINECRAFT_ITEM_KEYS', context);
for (const id of customIds) {
  assert.equal(context.resolveRenderedMinecraftItemIconUrl(id), '', id);
  const url = context.resolveMinecraftItemTextureUrl(id);
  assert.ok(url && fs.existsSync(path.join(root, url)), `Custom texture: ${id}`);
}
assert.equal(context.resolveRenderedMinecraftItemIconUrl('unknown_item'), '');
assert.equal(context.resolveRenderedMinecraftItemIconUrl('hdb:1234'), '');
assert.match(context.buildItemCustomCraftSlotRenderData({item:'hdb:1234'}, 'Head', 1).slotContent, /data-hdb-id="1234"/);
const custom = context.buildItemCustomCraftSlotRenderData({item:'oak_log',customTextureUrl:'data:image/png;base64,custom'}, 'Custom', 1);
assert.match(custom.slotContent, /src="data:image\/png;base64,custom"/);
assert.ok(custom.slotContent.includes('data-fallback="./minecraft-item-textures/inventory/oak_log.png"'));
console.log(`OK: ${Object.keys(icons).length} inventory/craft resolutions, ${customIds.length} custom textures, HDB and custom-image priority.`);
