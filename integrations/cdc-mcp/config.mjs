import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const GENERATOR = path.join(ROOT, 'outils', 'generateur-cdc');
export const PRIVATE = path.join(ROOT, '.cdc-mcp-private');
export const SITE = 'https://zcinez.github.io/outils-gamedesign/outils/generateur-cdc/';
const context = vm.createContext({ window: { location: new URL(SITE) } });
vm.runInContext(await readFile(path.join(ROOT, 'assets/supabase-config.js'), 'utf8'), context);
export const CONFIG = context.window.NEODIUM_SUPABASE_CONFIG;
export const SETTINGS_KEYS = [
  'neodium-template-label-overrides', 'neodium-template-meta-overrides',
  'neodium-gui-preset-overrides', 'neodium-gui-preset-hidden', 'neodium-gui-custom-presets',
  'neodium-item-custom-preset-overrides', 'neodium-item-custom-preset-hidden', 'neodium-item-custom-presets'
];
export const ITEM_PREFIX = 'neodium-item-custom-preset-entry-';
export function checkStorageKey(key) {
  if (!SETTINGS_KEYS.includes(key) && !(key.startsWith(ITEM_PREFIX) && /^[a-zA-Z0-9_-]{1,160}$/.test(key.slice(ITEM_PREFIX.length)))) {
    throw new Error('Clé hors du générateur CDC.');
  }
  return key;
}
