const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const fflate = require('../vendor/fflate-0.8.2.js');
function codec() {
  const context = vm.createContext({ fflate, crypto, Uint8Array, DataView, TextEncoder, TextDecoder, btoa, atob });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../cloud-codec.js'), 'utf8'), context);
  return context.StatGMCloudCodec;
}
const USERS = { one: '11111111-1111-4111-8111-111111111111', two: '22222222-2222-4222-8222-222222222222', denied: '33333333-3333-4333-8333-333333333333' };
function fakeBackend() {
  const database = new DatabaseSync(':memory:');
  const metrics = { auth: 0, sql: 0, calls: {}, bytesUploaded: 0 };
  const fetcher = async (url, options = {}) => {
    if (url.includes('/auth/v1/user')) {
      metrics.auth++;
      const token = options.headers.Authorization.replace('Bearer ', '');
      return new Response(JSON.stringify(USERS[token] ? { id: USERS[token], email: `${token}@fixture.test` } : {}), { status: USERS[token] ? 200 : 401 });
    }
    if (url.includes('/rest/v1/neodium_allowed_emails')) {
      const token = options.headers.Authorization.replace('Bearer ', '');
      return new Response(JSON.stringify(token === 'denied' ? [] : [{ email: `${token.toUpperCase()}@FIXTURE.TEST` }]));
    }
    if (!url.startsWith('https://fixture.turso/v2/pipeline')) throw new Error(`Unexpected network request: ${url}`);
    const { requests } = JSON.parse(options.body), results = [];
    for (const request of requests) {
      if (request.type === 'close') { results.push({ type: 'ok', response: { type: 'close' } }); continue; }
      metrics.sql++;
      try {
        const statement = database.prepare(request.stmt.sql);
        const args = (request.stmt.args || []).map(arg => arg.type === 'blob' ? Buffer.from(arg.base64, 'base64') : arg.type === 'integer' ? Number(arg.value) : arg.value);
        const columns = statement.columns();
        const values = columns.length ? statement.all(...args) : (statement.run(...args), []);
        const encode = value => value == null ? { type: 'null' } : value instanceof Uint8Array ? { type: 'blob', base64: Buffer.from(value).toString('base64') } : typeof value === 'number' ? { type: 'integer', value: String(value) } : { type: 'text', value };
        results.push({ type: 'ok', response: { result: { cols: columns.map(column => ({ name: column.name })), rows: values.map(row => columns.map(column => encode(row[column.name]))) } } });
      } catch (error) { results.push({ type: 'error', error: { message: error.message } }); }
    }
    return new Response(JSON.stringify({ results }));
  };
  return { database, fetcher, metrics };
}
async function makeService() {
  const { createService } = await import(pathToFileURL(path.join(root, 'supabase/functions/turso-statgm/service.js')));
  const backend = fakeBackend();
  let clock = Date.now();
  const handle = createService({ supabaseUrl: 'https://fixture.supabase', supabaseKey: 'fixture', tursoUrl: 'libsql://fixture.turso', tursoToken: 'fixture' }, { fetcher: backend.fetcher, now: () => clock });
  const call = async (action, payload = {}, token = 'one') => {
    backend.metrics.calls[action] = (backend.metrics.calls[action] || 0) + 1;
    if (action === 'put') backend.metrics.bytesUploaded += payload.chunks.reduce((sum, chunk) => sum + Buffer.from(chunk.data, 'base64').length, 0);
    const response = await handle(new Request('https://fixture/worker', { method: 'POST', headers: { Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ action, ...payload }) }));
    return { status: response.status, data: await response.json() };
  };
  return { ...backend, handle, call, advance: value => clock += value };
}
module.exports = { makeService, codec, USERS };
async function test() {
  const c = codec(), service = await makeService();
  const chunks = [], payloads = new Map();
  const writer = c.writer(async block => { const { data, ...descriptor } = block; chunks.push({ ...descriptor, kind: 'players' }); payloads.set(block.hash, { hash: block.hash, data: c.base64(data) }); });
  const source = [];
  for (let i = 0; i < 5500; i++) { const row = { uuid: `${i.toString(16).padStart(8, '0')}-1234-4000-8000-0123456789ab`, name: `Test_${i}`, grade: 'cuivreii', note: 'Émeraude 🔥 '.repeat(10) }; source.push(row); await writer.append(row); }
  const largeRow = { uuid: USERS.one, name: 'Large_Unicode_Record', note: 'Émeraude 🔥 '.repeat(40000) };
  source.push(largeRow); await writer.append(largeRow);
  await writer.flush();
  const manifest = { version: 1, snapshotId: crypto.randomUUID(), baseRevision: '', summary: { filename: 'fixture.zip', importedAt: new Date().toISOString(), playerCount: 5500, fileCount: 5500 }, chunks };
  assert.equal((await service.call('head', {}, '')).status, 401);
  assert.equal((await service.call('head', {}, 'invalid')).status, 401);
  assert.equal((await service.call('head', {}, 'denied')).status, 403);
  assert.equal((await service.call('head')).data.manifest, null);
  assert.equal((await service.call('begin', {manifest:{...manifest,snapshotId:crypto.randomUUID(),summary:{...manifest.summary,fileCount:110000}}})).status,200,'history can exceed the per-archive entry limit');
  assert.equal((await service.call('begin', {manifest:{...manifest,snapshotId:crypto.randomUUID(),summary:{...manifest.summary,fileCount:2000001}}})).status,400,'aggregate history remains bounded');
  const first = await service.call('begin', { manifest });
  assert.equal(first.status, 200); assert.equal(first.data.missing.length, chunks.length);
  assert.equal((await service.call('commit', { snapshotId: manifest.snapshotId })).status, 409);
  assert.equal((await service.call('head')).data.manifest, null, 'incomplete uploads cannot replace the cloud backup');
  const corrupt = { ...payloads.values().next().value, data: c.base64(new Uint8Array(30)) };
  assert.equal((await service.call('put', { snapshotId: manifest.snapshotId, chunks: [corrupt] })).status, 400);
  const firstPayload = payloads.values().next().value;
  assert.equal((await service.call('put', { snapshotId: manifest.snapshotId, chunks: [firstPayload] })).status, 200);
  const resumed = await service.call('begin', { manifest });
  assert.equal(resumed.data.missing.length, chunks.length - 1);
  const remaining = [...payloads.values()].filter(payload => resumed.data.missing.includes(payload.hash));
  if (remaining.length) assert.equal((await service.call('put', { snapshotId: manifest.snapshotId, chunks: remaining })).status, 200);
  assert.equal((await service.call('commit', { snapshotId: manifest.snapshotId })).data.revision, manifest.snapshotId);
  assert.equal((await service.call('commit', { snapshotId: manifest.snapshotId })).data.ok, true, 'commit retries are idempotent');
  const unchanged = (await service.call('head', { revision: manifest.snapshotId })).data;
  assert.equal(unchanged.unchanged, true); assert.ok(JSON.stringify(unchanged).length < 128);
  assert.equal((await service.call('head', {}, 'two')).data.manifest, null);
  assert.equal((await service.call('get_chunks', { snapshotId: manifest.snapshotId, hashes: [chunks[0].hash] }, 'two')).status, 404);
  const decoded = [];
  await c.readLines(chunks, async descriptor => {
    const response = await service.call('get_chunks', { snapshotId: manifest.snapshotId, hashes: [descriptor.hash] });
    return response.data.chunks[0];
  }, row => decoded.push(row));
  assert.deepEqual(JSON.parse(JSON.stringify(decoded)), source, 'Unicode data survives arbitrary chunk boundaries');
  const bad = { ...chunks[0], hash: '0'.repeat(64) };
  await assert.rejects(c.decode({ data: payloads.get(chunks[0].hash).data }, bad), /intégrité/);
  const second = { ...manifest, snapshotId: crypto.randomUUID(), baseRevision: manifest.snapshotId };
  const concurrent = { ...second, snapshotId: crypto.randomUUID() };
  assert.equal((await service.call('begin', { manifest: second })).data.missing.length, 0, 'unchanged blocks are not uploaded again');
  assert.equal((await service.call('begin', { manifest: concurrent })).data.missing.length, 0);
  assert.equal((await service.call('commit', { snapshotId: second.snapshotId })).data.ok, true);
  assert.equal((await service.call('commit', { snapshotId: concurrent.snapshotId })).data.conflict, true);
  assert.equal((await service.call('head', { revision: second.snapshotId })).data.unchanged, true, 'a conflicting import preserves the winning backup');
  assert.equal((await service.call('begin', { manifest: { ...manifest, chunks: [{ ...chunks[0], bytes: 99999999 }] } })).status, 400);
  assert.equal((await service.call('head', { value: 'x'.repeat(2 * 1024 * 1024) })).status, 413);
  service.advance(31000);
  const before = service.metrics.auth; await service.call('head'); assert.equal(service.metrics.auth, before + 1, 'authorization cache expires');
  const raw = chunks.reduce((sum, chunk) => sum + chunk.rawBytes, 0), compressed = chunks.reduce((sum, chunk) => sum + chunk.bytes, 0);
  assert.ok(compressed < raw * .25);
  console.log(`PASS: 5,500 players + a 600KB Unicode record, ${raw} raw bytes -> ${compressed} gzip bytes; bounded Unicode blocks, integrity, resumable/idempotent writes, unchanged-block deduplication, 128-byte head, account isolation, allowlist, conflicts and request limits.`);
  service.database.close();
}
if (require.main === module) test().catch(error => { console.error(error); process.exitCode = 1; });
