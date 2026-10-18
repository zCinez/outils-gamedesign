const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const archiveSource = fs.readFileSync(path.join(root, 'archive-db.js'), 'utf8');
const cloudSource = fs.readFileSync(path.join(root, 'cloud-store.js'), 'utf8');
function contextFor(hostname, fixture = false) {
  let authCalls = 0, workers = 0, network = 0;
  const listeners = new Map(), notices = { message: {}, detail: {}, retry: {}, choices: {} };
  const panel = { dataset: {}, querySelector: selector => ({ '[data-cloud-message]': notices.message, '[data-cloud-detail]': notices.detail, '[data-cloud-retry]': notices.retry, '[data-cloud-conflict]': notices.choices }[selector]) };
  const context = vm.createContext({ location: { hostname }, navigator: { onLine: true },
    document: { baseURI: `http://${hostname}/outils/statgm/index.html`, querySelectorAll: selector => selector === '[data-cloud-panel]' ? [panel] : [], addEventListener() {} },
    NEODIUM_SUPABASE_CONFIG: { url: 'https://fixture.supabase', anonKey: 'fixture', statgmCloudFixture: fixture },
    NeodiumCloudSync: { whenReady: () => { authCalls++; return new Promise(() => {}); }, getSession: () => { throw Error('Authentication should not be needed in a local preview.'); } },
    Worker: class { constructor() { workers++; throw Error('Unexpected cloud worker.'); } },
    fetch: () => { network++; throw Error('Unexpected network request.'); },
    CustomEvent: class { constructor(type) { this.type = type; } },
    BroadcastChannel: class { addEventListener() {} postMessage() {} close() {} }
  });
  context.window = context;
  context.addEventListener = (event, callback) => listeners.set(event, callback);
  context.dispatchEvent = () => {};
  vm.runInContext(archiveSource, context);
  vm.runInContext(cloudSource, context);
  return { context, notices, counts: () => ({ authCalls, workers, network }) };
}
(async () => {
  for (const hostname of ['localhost', '127.0.0.1', '[::1]', 'preview.localhost']) {
    const test = contextFor(hostname), api = test.context.StatGMCloud;
    assert.equal(test.context.StatGMArchiveDB.activeKey, 'preview:active');
    assert.equal(await api.prepareHistoryForImport(), '');
    assert.equal(await api.validateImportAccount(''), true);
    assert.equal(await api.validateImportAccount('other-account'), false);
    await api.sync({ force: true }); await api.ensurePlayerRecords('fixture');
    api.setImportBusy(true); api.setImportBusy(false);
    assert.match(test.notices.message.textContent, /Mode de test local/);
    assert.equal(test.notices.retry.hidden, true);
    assert.deepEqual(test.counts(), { authCalls: 0, workers: 0, network: 0 }, 'Local imports must work even when cloud initialization never finishes.');
  }
  for (const hostname of ['outils.neodium.fr', 'localhost.example.org', '127.0.0.1.example.org']) {
    const test = contextFor(hostname);
    assert.equal(test.context.StatGMArchiveDB.activeKey, 'active');
    assert.equal(test.counts().authCalls, 1, 'Hosted pages keep the authenticated cloud path.');
  }
  assert.equal(contextFor('localhost', true).counts().authCalls, 1, 'The isolated cloud fixture still exercises the authenticated path.');
  console.log('PASS: localhost/IPv4/IPv6 local imports do not wait for authentication or start cloud transfers; hosted pages retain authentication and the cloud fixture remains testable.');
})().catch(error => { console.error(error); process.exitCode = 1; });
