const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function harness() {
  let time = 0;
  let nextId = 0;
  const timers = new Map();
  const listeners = {};
  class Element {
    constructor(tag) {
      this.tag = tag;
      this.children = [];
      this.attributes = {};
      this.classes = new Set();
      this.classList = { add: x => this.classes.add(x), remove: x => this.classes.delete(x), contains: x => this.classes.has(x) };
    }
    setAttribute(k, v) { this.attributes[k] = v; }
    append(...children) { this.children.push(...children); }
    addEventListener(name, fn) { this[name] = fn; }
    querySelector(selector) { return (this[selector] ||= new Element(selector)); }
  }
  const body = new Element('body');
  const context = {
    URL, Map, location: new URL('https://example.test/tools/outils/generateur-cdc/index.html'),
    document: { body, readyState: 'loading', currentScript: { src: 'https://example.test/tools/assets/neodium-interface.js' }, createElement: tag => new Element(tag), addEventListener: (event, fn) => { listeners[`document:${event}`] = fn; } },
    setTimeout(fn, ms) { timers.set(++nextId, { fn, at: time + ms }); return nextId; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(event, fn) { listeners[event] = fn; }
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/neodium-interface.js'), 'utf8'), context);
  function advance(ms) {
    const end = time + ms;
    while (true) {
      const entry = [...timers].filter(([, task]) => task.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry) break;
      timers.delete(entry[0]);
      time = entry[1].at;
      entry[1].fn();
    }
    time = end;
  }
  return { context, listeners, advance, status: body.children[0], footer: body.children[1] };
}

(async () => {
  const { context, listeners, advance, status, footer } = harness();
  const loading = context.NeodiumLoading;
  assert.equal(status.hidden, true);
  advance(181);
  assert.equal(status.hidden, false);
  listeners.load();
  assert.equal(status.hidden, true);
  const first = loading.begin('First');
  const second = loading.begin('Second');
  advance(181);
  first();
  first();
  assert.equal(status.hidden, false, 'An older or duplicate completion must not hide active work');
  second();
  assert.equal(status.hidden, true);
  await assert.rejects(loading.track('Failure', async () => { throw new Error('network'); }), /network/);
  assert.equal(status.hidden, true, 'Failed operations must release their loader');
  const slow = loading.begin('Slow');
  advance(30001);
  assert.match(status.querySelector('[role="status"]').textContent, /plus de temps/);
  status.querySelector('button').click();
  assert.equal(status.hidden, true, 'Slow operations remain dismissible');
  slow();
  listeners['neodium-cloud-state']({ detail: { syncing: true } });
  advance(181);
  assert.equal(status.hidden, false);
  listeners['neodium-cloud-state']({ detail: { syncing: false, status: 'error' } });
  assert.match(status.querySelector('[role="status"]').textContent, /échouée/);
  advance(8001);
  assert.equal(status.hidden, true);
  const links = footer.children[1].children;
  assert.equal(links[0].href, 'https://example.test/tools/conditions-utilisation.html');
  assert.equal(links[1].href, 'https://example.test/tools/confidentialite.html');
  for (const name of ['conditions-utilisation.html', 'confidentialite.html']) {
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    assert.match(html, /samgiant1007@gmail.com/);
    assert.match(html, /zCinez/);
    assert.match(html, /neodium-interface.js/);
  }
  const generator = fs.readFileSync(path.join(root, 'outils/generateur-cdc/cdc-generator.js'), 'utf8');
  assert.match(generator, /function loadProjectStateWithLoader\(state, label = "Chargement du CDC…"\)/);
  assert.match(generator, /loadProjectStateWithLoader\(project\)/);
  assert.match(generator, /loadProjectStateWithLoader\(parsed, "Import de la sauvegarde…"\)/);
  assert.match(generator, /begin\("Ouverture du CDC…"\)/);
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: '', textContent: '', innerHTML: '' });
    return elements.get(id);
  };
  const history = [
    { id: '1', projectId: 'p1', projectName: 'First', template: 'gui', updatedAt: '2026-09-01' },
    { id: '2', projectId: 'p1', projectName: 'Second', template: 'item', updatedAt: '2026-09-10' },
    { id: '3', projectId: 'p2', projectName: 'Other project', template: 'gui', updatedAt: '2026-09-11' }
  ];
  const libraryContext = vm.createContext({
    window: {}, localStorage: { getItem: () => JSON.stringify(history) },
    document: { getElementById: element }
  });
  const librarySource = fs.readFileSync(path.join(root, 'outils/generateur-cdc/cdc-library.js'), 'utf8');
  vm.runInContext(librarySource.replace('void bootLibraryPage();', ''), libraryContext);
  assert.equal(vm.runInContext('getFilteredLibraryItems().length', libraryContext), 0, 'No project must not show all other projects');
  vm.runInContext('currentWorkspaceProjectId = "p1"; currentWorkspaceProject = { name: "Project" }; renderCdcLibrary();', libraryContext);
  assert.equal(element('libraryStatTotal').textContent, '2');
  element('librarySearch').value = 'First';
  vm.runInContext('renderCdcLibrary()', libraryContext);
  assert.equal(element('libraryCount').textContent, '2', 'Project counters remain stable during search');
  assert.equal(element('libraryStatTemplates').textContent, '2');
  assert.equal(vm.runInContext('getFilteredLibraryItems().length', libraryContext), 1);
  assert.match(element('libraryStatLastUpdate').textContent, /10\/09\/2026/);
  element('librarySearch').value = 'Missing';
  vm.runInContext('renderCdcLibrary()', libraryContext);
  assert.match(element('cdcLibraryList').innerHTML, /recherche/);
  console.log('PASS: loading lifecycle, concurrency, failures, slow requests, cloud state, legal links and contact.');
  console.log('PASS: project scoping, filtered documents, empty state and stable project statistics.');
})().catch(error => { console.error(error); process.exitCode = 1; });
