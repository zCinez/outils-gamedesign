import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fileURLToPath } from 'node:url';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { templateInfo, renderCdc, TEMPLATES } from '../generator.mjs';
import { beginConnection } from '../connect.mjs';
import { Vault } from '../vault.mjs';
import { createServer } from '../server.mjs';

test('les dix templates natifs et leurs exemples dynamiques produisent un rendu', async () => {
  for (const template of TEMPLATES) {
    const info = await templateInfo(template);
    assert.equal(info.state.template, template);
    const rendered = await renderCdc({ ...info.state, projectName: 'Test ' + template, dynamic: { ...info.state.dynamic, ...info.dynamicExamples } });
    assert.ok(rendered.renderedText.length > 10, template);
    assert.ok(rendered.renderedHtml.length > 10, template);
  }
  const info = await templateInfo('commande');
  const result = await renderCdc({ ...info.state, projectName: 'Banque', fields: { ...info.state.fields, nomCommande: 'Banque <script>test</script>' } });
  assert.ok(result.renderedText.includes('Banque'));
  assert.ok(!result.renderedHtml.includes('<script>test</script>'));
});
test('serveur MCP réel : initialisation, liste des outils et validation du schéma', async () => {
  const transport = new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('../server.mjs', import.meta.url))], stderr: 'pipe' });
  const client = new Client({ name: 'cdc-test', version: '1.0.0' });
  try {
    await client.connect(transport);
    const tools = (await client.listTools()).tools;
    assert.equal(tools.length, 17);
    assert.ok(tools.find(tool => tool.name === 'cdc_delete').annotations.destructiveHint);
    const result = await client.callTool({ name: 'cdc_templates', arguments: {} });
    assert.equal(JSON.parse(result.content[0].text).templates.length, 10);
    const invalid = await client.callTool({ name: 'cdc_put_project', arguments: { name: 'Oops' } });
    assert.equal(invalid.isError, true);
  } finally { await client.close(); }
});
test('outils MCP : un CDC créé peut être relu, exporté et supprimé', async () => {
  const snapshot = { projects: [], history: [] };
  const fake = {
    snapshot: async () => structuredClone(snapshot), settings: async () => [],
    write: async (collection, operation, id, expectedUpdatedAt, record) => {
      const current = snapshot[collection].find(item => item.id === id);
      assert.equal(current?.updatedAt || null, expectedUpdatedAt);
      snapshot[collection] = snapshot[collection].filter(item => item.id !== id);
      if (operation === 'delete') return { ok: true, record: null };
      const next = { ...record, id, updatedAt: new Date().toISOString() };
      snapshot[collection].push(next); return { ok: true, record: next };
    }
  };
  const server = createServer(fake);
  const client = new Client({ name: 'workflow-test', version: '1.0.0' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  const call = async (name, args) => {
    const result = await client.callTool({ name, arguments: args });
    assert.ok(!result.isError, result.content[0].text); return JSON.parse(result.content[0].text);
  };
  try {
    await server.connect(a); await client.connect(b);
    const p = (await call('cdc_put_project', { name: 'Test integration', expectedUpdatedAt: null })).record;
    const info = await call('cdc_template', { template: 'libre' });
    const created = await call('cdc_put_document', { expectedUpdatedAt: null, record: { ...info.state, projectName: 'CDC integration', projectId: p.id, dynamic: { libreSections: [{ titre: 'Objectif', contenu: 'Un document de test' }] } } });
    const document = created.record;
    assert.equal(document.projectId, p.id);
    assert.ok(document.renderedText.length);
    assert.equal((await call('cdc_get', { collection: 'history', id: document.id })).record.projectName, 'CDC integration');
    for (const format of ['json', 'txt', 'html']) {
      const exported = await call('cdc_export', { id: document.id, format });
      assert.ok((await readFile(exported.path, 'utf8')).length);
      await rm(exported.path);
    }
    await call('cdc_delete', { collection: 'history', id: document.id, expectedUpdatedAt: document.updatedAt });
    await call('cdc_delete', { collection: 'projects', id: p.id, expectedUpdatedAt: p.updatedAt });
    assert.equal(snapshot.history.length, 0);
  } finally { await client.close(); await server.close(); }
});
test('page de connexion : origine et nonce obligatoires, lien jamais renvoyé', async () => {
  let count = 0;
  const connection = await beginConnection({ authEmail: async () => { count++; }, authLink: async () => { count++; return { email: 'test@example.com' }; } });
  const origin = new URL(connection.url).origin;
  try {
    assert.equal((await fetch(origin + '/')).status, 403);
    const page = await fetch(connection.url);
    assert.equal(page.status, 200);
    assert.ok(page.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
    const request = { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'test@example.com' }) };
    assert.equal((await fetch(connection.url + 'email', request)).status, 403);
    assert.equal(count, 0);
    request.headers.Origin = origin;
    assert.equal((await fetch(connection.url + 'email', request)).status, 200);
    assert.equal(count, 1);
    const result = await (await fetch(connection.url + 'verify', { ...request, body: JSON.stringify({ link: 'private-token' }) })).json();
    assert.equal(result.connected, true);
    assert.ok(!JSON.stringify(result).includes('private-token'));
  } finally { connection.server.closeAllConnections(); connection.server.close(); }
});
test('coffre Windows chiffré et relisible, jamais en clair sur disque', { skip: process.platform !== 'win32' }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'neodium-vault-test-'));
  const vault = new Vault(directory);
  try {
    const session = { access_token: 'test-secret-neodium', refresh_token: 'test-refresh' };
    await vault.locked(() => vault.write(session));
    assert.ok(!(await readFile(vault.file)).includes(Buffer.from('test-secret-neodium')));
    assert.deepEqual(await vault.read(), session);
    await vault.clear(); assert.equal(await vault.read(), null);
  } finally {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('neodium-vault-test-'));
    await rm(directory, { recursive: true, force: true });
  }
});
