import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';
import { GENERATOR, SITE } from './config.mjs';

export const TEMPLATES = ['commande', 'gui', 'itemC', 'event', 'metier', 'rankUp', 'mobs', 'libre', 'caisse', 'soundDesign'];
const sources = [
  'gui-presets/manifest.js', 'gui-presets/presets.js', 'item-custom-presets/manifest.js', 'item-custom-presets/presets.js',
  'cdc-generator-template-helpers.js', 'cdc-generator-template-commande.js', 'cdc-generator-template-gui.js',
  'cdc-generator-template-itemc.js', 'cdc-generator-template-event.js', 'cdc-generator-template-caisse-sound.js',
  'cdc-generator-template-metier.js', 'cdc-generator-template-rankup.js', 'cdc-generator-template-mobs.js',
  'cdc-generator-template-libre.js', 'cdc-generator.js'
];
let files;
async function withGenerator(callback, settings = []) {
  files ||= Promise.all([readFile(path.join(GENERATOR, 'cdc-generator.html'), 'utf8'), ...sources.map(name => readFile(path.join(GENERATOR, name), 'utf8'))]);
  const [html, ...scripts] = await files;
  // No resources or remote scripts are loaded. Only the repository's explicit source list runs.
  const dom = new JSDOM(html, { url: SITE + 'cdc-generator.html', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: new VirtualConsole() });
  try {
    const w = dom.window;
    w.alert = () => {}; w.confirm = () => false; w.scrollTo = () => {};
    w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    w.fetch = () => Promise.reject(new Error('Réseau désactivé pour le rendu local.'));
    for (const { key, value } of settings) w.localStorage.setItem(key, JSON.stringify(value));
    scripts.forEach((source, index) => vm.runInContext(index === scripts.length - 1 ? source.replace('void bootGeneratorPage();', 'window.__cdcReady = bootGeneratorPage();') : source, dom.getInternalVMContext(), { filename: sources[index] }));
    await w.__cdcReady;
    return await callback(w);
  } finally { dom.window.close(); }
}
export async function templateInfo(template) {
  if (!TEMPLATES.includes(template)) throw new Error('Template inconnu.');
  return withGenerator(w => {
    w.document.getElementById('template').value = template;
    w.switchTemplate();
    const state = w.collectProjectState();
    state.projectName = ''; state.id = null;
    const formIds = { commande: 'commandeForm', gui: 'guiForm', itemC: 'itemCForm', event: 'eventForm', metier: 'metierForm', rankUp: 'rankUpForm', mobs: 'mobsForm', libre: 'libreForm', caisse: 'caisseForm', soundDesign: 'soundDesignForm' };
    const form = w.document.getElementById(formIds[template]);
    const fields = [...(form || w.document).querySelectorAll('input[id],textarea[id],select[id]')].filter(el => el.type !== 'file').map(el => ({
      id: el.id, type: el.type, label: el.labels?.[0]?.textContent.trim() || el.id,
      ...(el.options ? { options: [...el.options].map(option => ({ value: option.value, label: option.textContent.trim() })) } : {})
    }));
    const builders = {
      commande: ['ajouterItemGUICommande'], gui: ['ajouterItemGUITemplate'], itemC: ['ajouterItemCustomCraftIngredient'],
      event: ['ajouterConditionEvent', 'ajouterMessageEvent'], metier: ['ajouterMetierItemRow', 'ajouterMetierLevelRewardRow', 'ajouterMetierGuiItem'],
      rankUp: ['ajouterRankUp'], mobs: ['ajouterMobSpawn', 'ajouterMobDrop'], libre: ['ajouterLibreSection'], caisse: ['ajouterRewardCaisse'], soundDesign: []
    };
    for (const build of builders[template]) w[build]();
    const dynamicExamples = Object.fromEntries(Object.entries(w.collectProjectState().dynamic).filter(([, entries]) => entries.length));
    return { template, state, fields, dynamicExamples, dynamicInstructions: 'Les collections se trouvent dans state.dynamic. dynamicExamples donne des exemples natifs à compléter. Conserver les noms de propriétés. cdc_reference permet de consulter les fonctions ajouter/recuperer et les règles de rendu.' };
  });
}
export async function renderCdc(state, settings = []) {
  if (!TEMPLATES.includes(state.template)) throw new Error('Template inconnu.');
  return withGenerator(w => {
    w.loadProjectState(state);
    w.genererCDC(true);
    const rendered = w.getCurrentRenderedContent();
    return { ...rendered, state: w.collectProjectState() };
  }, settings);
}
export async function builtinPresets(kind, settings = []) {
  return withGenerator(w => kind === 'gui' ? w.getAvailableGuiPresets() : w.getAvailableItemCustomPresets(), settings);
}
export async function reference(file, start = 1, lines = 160) {
  const allow = ['cdc-settings.js', 'cdc-generator.html', ...sources];
  if (!allow.includes(file)) throw new Error('Référence non disponible.');
  const content = (await readFile(path.join(GENERATOR, file), 'utf8')).split(/\r?\n/);
  return { file, totalLines: content.length, start, text: content.slice(start - 1, start - 1 + lines).join('\n') };
}
