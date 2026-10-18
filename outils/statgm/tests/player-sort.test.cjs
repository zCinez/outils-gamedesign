const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the real page controller, including filtering, pagination and reloads.
class Element {
  constructor() { this.value = ''; this.children = []; this.hidden = false; this.dataset = {}; this.listeners = {}; this.classList = { add() {} }; }
  addEventListener(type, listener) { this.listeners[type] = listener; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute() {}
  scrollIntoView() {}
}
async function page(rows, preference, blockedStorage = false, cloudRecovery) {
  const elements = new Map(), events = {}, preferences = new Map([['StatGM.playerSort.v1', preference]]), workers = [];
  const find = key => { if (!elements.has(key)) elements.set(key, new Element()); return elements.get(key); };
  find('sort').value = 'name-asc'; find('page-size').value = '48';
  let datasetId = 'first', data = rows, reads = 0, cloudReads = 0;
  const context = vm.createContext({
    Intl, URL, setTimeout, clearTimeout,
    document: { baseURI: 'http://localhost/outils/statgm/joueurs.html', createElement: () => new Element(), querySelector: selector => find(selector.startsWith('[data-') ? selector.slice(6, -1) : selector) },
    localStorage: {
      getItem: key => { if (blockedStorage) throw new Error('Blocked'); return preferences.get(key); },
      setItem: (key, value) => { if (blockedStorage) throw new Error('Blocked'); preferences.set(key, value); }
    },
    StatGMArchiveDB: { readActive: async () => ({ datasetId, recordsLocal: !cloudRecovery }), readPlayers: async () => { reads++; return data; } },
    StatGMCloud: { ensureCompletions: async () => { cloudReads++; data = await cloudRecovery(data); } },
    StatGMHeads: { create: () => new Element(), resetObservations: () => {} },
    addEventListener: (type, callback) => { events[type] = callback; },
    Worker: class { constructor() { workers.push(this); } postMessage() {} terminate() {} }
  });
  context.window = context;
  for (const filename of ['player-grades.js', 'joueurs.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', filename), 'utf8'), context);
  const settled = () => new Promise(resolve => setImmediate(resolve));
  await settled();
  return {
    find, preferences, workers, events, context, settled,
    names: () => find('player-grid').children.map(card => card.children[1].textContent),
    sort: mode => { find('sort').value = mode; find('sort').listeners.change(); },
    search: async value => { find('search').value = value; find('search').listeners.input(); await new Promise(resolve => setTimeout(resolve, 140)); },
    replace: async rows => { data = rows; datasetId += '-new'; events['statgm-data-updated'](); await settled(); },
    setRows: rows => { data = rows; },
    reads: () => reads, cloudReads: () => cloudReads
  };
}
const player = (name, grade, id, completion = null) => ({ name, grade, completion, firstPlayedMs: null, uuid: String(id).padStart(8, '0') + '-1234-4000-8000-0123456789ab' });
(async () => {
  const grades = ['rubis', 'saphir', 'titane', 'platine', 'neodym', 'emeraude5', 'emeraude4', 'diamantv', 'or1', 'Fer IV', 'feriii', 'fer2', 'feri', 'Cuivre V', 'cuivrei', 'fermier'];
  const rows = grades.map((grade, i) => player(`Test_${i}`, grade, i));
  rows.push(player('Zéro', 'builder', 20), player('Alpha', 'builder', 21), player('Beta', 'gamedesigner', 22), player('Aucune', '', 23), player('Mystère', 'inconnu', 24));
  const app = await page(rows);
  app.sort('grade-asc');
  assert.deepEqual(app.names().slice(0, grades.length), grades.map((_, i) => `Test_${i}`).reverse());
  const tail = ['Alpha', 'Zéro', 'Beta', 'Mystère', 'Aucune'];
  assert.deepEqual(app.names().slice(grades.length), tail);
  app.sort('grade-desc');
  assert.deepEqual(app.names(), [...grades.map((_, i) => `Test_${i}`), ...tail]);
  assert.equal(app.find('sort-note').hidden, false);
  app.sort('name-asc');
  const ascending = app.names();
  app.sort('name-desc');
  assert.deepEqual(app.names(), ascending.toReversed());
  assert.equal(app.find('sort-note').hidden, true);
  assert.equal(app.preferences.get('StatGM.playerSort.v1'), 'name-desc');
  assert.equal(app.reads(), 1, 'Sorting must not read the database again.');
  await app.search('test_1');
  app.sort('grade-asc');
  assert.deepEqual(app.names(), ['Test_15', 'Test_14', 'Test_13', 'Test_12', 'Test_11', 'Test_10', 'Test_1']);
  await app.search('');
  await app.replace([player('Z', 'rubis', 90), player('A', 'fermier', 91)]);
  assert.deepEqual(app.names(), ['A', 'Z'], 'Keep selected sorting after a cloud dataset update.');

  const completion = await page([player('Max', 'rubis', 1, 100), player('Zero', 'fermier', 2, 0), player('Beta', 'feri', 3, 51), player('Alpha', 'feri', 4, 51), player('Absent', 'fermier', 5), player('Decimal', 'rubis', 6, 51.5)], 'completion-desc');
  assert.deepEqual(completion.names(), ['Max', 'Decimal', 'Alpha', 'Beta', 'Zero', 'Absent']);
  assert.equal(completion.find('player-grid').children[4].children[3].children[1].textContent, '0 %');
  completion.sort('completion-asc');
  assert.deepEqual(completion.names(), ['Zero', 'Alpha', 'Beta', 'Decimal', 'Max', 'Absent']);
  assert.equal(completion.reads(), 1, 'Completion sorting uses only the lightweight summaries.');
  assert.equal(completion.find('player-grid').children[0].children.at(-1).children[1].textContent, 'Non renseignée');
  const dated = await page([{...player('Date', 'neodym', 7, 51), firstPlayedMs: Date.parse('2026-05-22T22:30:00Z')}], 'name-asc');
  const dateRow = dated.find('player-grid').children[0].children.at(-1);
  assert.equal(dateRow.children[0].textContent, 'Première connexion');
  assert.equal(dateRow.children[1].textContent, '23/05/2026', 'The card date uses Europe/Paris even near midnight.');
  assert.equal(dateRow.children[1].dateTime, '2026-05-22T22:30:00.000Z');
  dated.sort('completion-desc');
  assert.equal(dated.find('player-grid').children[0].children.at(-1).children[1].textContent, '23/05/2026', 'The date stays visible alongside completion.');
  assert.equal(dated.reads(), 1, 'Rendering dates never reads the raw player records.');
  const connectionRows = [
    ['Nouveau', Date.parse('2026-06-01T08:00:00Z')], ['Ancien', Date.parse('2026-01-01T08:00:00Z')],
    ['Beta', Date.parse('2026-05-23T12:00:00Z')], ['Alpha', Date.parse('2026-05-23T12:00:00Z')],
    ['Absent', null], ['Zero', 0], ['Negatif', -1], ['Infini', Infinity], ['Invalide', NaN], ['HorsLimite', 8640000000000001]
  ].map(([name, firstPlayedMs], i) => ({...player(name, 'fermier', i), firstPlayedMs}));
  const connections = await page(connectionRows, 'first-connection-asc');
  const missingDates = ['Absent', 'HorsLimite', 'Infini', 'Invalide', 'Negatif', 'Zero'];
  assert.deepEqual(connections.names(), ['Ancien', 'Alpha', 'Beta', 'Nouveau', ...missingDates]);
  connections.sort('first-connection-desc');
  assert.deepEqual(connections.names(), ['Nouveau', 'Alpha', 'Beta', 'Ancien', ...missingDates], 'Missing dates stay last and exact timestamp ties keep A–Z in both directions.');
  assert.equal(connections.find('sort-note').hidden, false);
  assert.match(connections.find('sort-note').textContent, /Dates non renseignées à la fin/);
  assert.equal(connections.preferences.get('StatGM.playerSort.v1'), 'first-connection-desc');
  await connections.search('Alpha');
  assert.deepEqual(connections.names(), ['Alpha']);
  assert.equal(connections.reads(), 1, 'Date sorting and searching use only the loaded lightweight summaries.');
  await completion.search('al');
  assert.deepEqual(completion.names(), ['Alpha', 'Decimal']);
  const legacyCloudRows = [player('Zero', 'fermier', 1), player('Max', 'rubis', 2)].map(({completion, ...row}) => row);
  const cloud = await page(legacyCloudRows, 'completion-desc', false, async rows => rows.map((row, i) => ({...row, completion: i * 100})));
  assert.deepEqual(cloud.names(), ['Max', 'Zero'], 'Recover an old cloud index and refresh its selected sort.');
  cloud.sort('completion-asc'); assert.deepEqual(cloud.names(), ['Zero', 'Max']);
  assert.equal(cloud.cloudReads(), 1, 'No repeat cloud reads after completion recovery.');
  const oldDates = [player('Date', 'fermier', 1), player('Ancien', 'fermier', 2)].map(({firstPlayedMs, ...row}) => row);
  const cloudDates = await page(oldDates, 'first-connection-desc', false, async rows => rows.map((row, i) => ({...row, firstPlayedMs: Date.parse('2026-05-23T12:00:00Z') - i * 86400000})));
  assert.deepEqual(cloudDates.names(), ['Date', 'Ancien'], 'Recovered cloud dates refresh the selected date sort.');
  assert.equal(cloudDates.find('player-grid').children[0].children.at(-1).children[1].textContent, '23/05/2026', 'Old cloud dates are recovered without selecting a completion sort.');
  cloudDates.sort('first-connection-asc'); await cloudDates.settled();
  assert.deepEqual(cloudDates.names(), ['Ancien', 'Date']);
  assert.equal(cloudDates.cloudReads(), 1, 'Recovered dates are not downloaded again.');
  const unavailable = await page(legacyCloudRows, 'completion-desc', false, async () => { throw new Error('Hors connexion'); });
  assert.equal(unavailable.find('feedback').hidden, false);
  assert.match(unavailable.find('feedback').textContent, /incomplet.*Hors connexion/);
  unavailable.sort('completion-desc'); await unavailable.settled();
  assert.equal(unavailable.cloudReads(), 2, 'A failed recovery can be retried by reselecting the sort.');

  const big = await page(Array.from({ length: 5500 }, (_, i) => ({...player(`Joueur_${i}`, i % 2 ? 'rubis' : 'fermier', i, i % 101), firstPlayedMs: Date.UTC(2026, 0, 1) + i * 1000})));
  big.find('next').listeners.click();
  assert.equal(big.find('page-info').textContent, 'Page 2 sur 115');
  const started = performance.now(); big.sort('grade-desc');
  const sortMs = performance.now() - started;
  assert.equal(big.find('page-info').textContent, 'Page 1 sur 115');
  assert.equal(big.names().length, 48);
  assert.equal(big.names()[0], 'Joueur_1');
  assert.equal(big.names()[47], 'Joueur_95');
  big.find('next').listeners.click();
  assert.equal(big.names()[0], 'Joueur_97', 'Sorting must cover all pages.');
  big.sort('completion-desc');
  assert.equal(big.names()[0], 'Joueur_100');
  assert.equal(big.names()[47], 'Joueur_4847');
  big.sort('first-connection-desc');
  assert.equal(big.names()[0], 'Joueur_5499');
  assert.equal(big.names()[47], 'Joueur_5452');
  big.find('next').listeners.click();
  assert.equal(big.names()[0], 'Joueur_5451', 'First connection sorting covers every page.');
  big.sort('first-connection-asc');
  assert.equal(big.names()[0], 'Joueur_0');
  assert.equal(big.find('page-info').textContent, 'Page 1 sur 115');
  big.find('page-size').value = '96'; big.find('page-size').listeners.change();
  assert.equal(big.names().length, 96);
  await big.search('00000123-1234-4000-8000-0123456789ab');
  assert.deepEqual(big.names(), ['Joueur_123']);
  await big.search('no match'); assert.equal(big.find('empty').hidden, false);
  await big.replace([]); assert.equal(big.find('empty-title').textContent, 'Aucun joueur importé');

  const restored = await page(rows, 'grade-desc');
  assert.equal(restored.find('sort').value, 'grade-desc');
  assert.deepEqual(restored.names().slice(grades.length), tail);
  const blocked = await page(rows, 'grade-desc', true);
  blocked.sort('grade-asc'); assert.equal(blocked.names()[0], 'Test_15');
  const invalid = await page(rows, 'obsolete'); assert.equal(invalid.find('sort').value, 'name-asc');
  const legacy = await page([player('A', undefined, 1), player('B', 'fermier', 2)]);
  legacy.sort('grade-desc'); assert.deepEqual(legacy.names(), ['B', 'A']);
  legacy.setRows([player('A', 'rubis', 1), player('B', 'fermier', 2)]);
  legacy.workers[0].onmessage({ data: { type: 'complete' } }); await legacy.settled();
  assert.deepEqual(legacy.names(), ['A', 'B'], 'Recovered grades must refresh the selected sort.');
  console.log(`PASS: eight sort modes, completion and first connection ties/missing/invalid data, preference, search, global pagination, dataset update and grade backfill. 5,500-player sort + 48 mocked cards: ${Math.round(sortMs)} ms.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
