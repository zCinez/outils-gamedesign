import test from 'node:test';
import assert from 'node:assert/strict';
import { CdcClient, decodeValue, encodeValue } from '../client.mjs';
import { checkStorageKey } from '../config.mjs';
const config = { url: 'https://project.supabase.co', anonKey: 'public', storageTable: 'neodium_shared_storage' };
const vault = { read: async () => ({ access_token: 'private-test-token', refresh_token: 'refresh-test', expires_at: 9999999999 }), locked: async cb => cb() };
const response = (body, status = 200) => new Response(JSON.stringify(body), { status });
test('les données ne sont pas demandées lorsque le compte est retiré de la liste', async () => {
  const calls = [];
  const client = new CdcClient({ config, vault, fetcher: async url => { calls.push(url); return url.endsWith('/user') ? response({ id: 'a', email: 'a@example.com' }) : response([]); } });
  await assert.rejects(client.snapshot(), /autorisés/);
  assert.ok(calls.every(url => !url.includes('/functions/')));
});
test('clé hors CDC refusée sans accès réseau', async () => {
  assert.throws(() => checkStorageKey('statgm-users'), /hors/);
  assert.throws(() => checkStorageKey('neodium-item-custom-preset-entry-../secret'), /hors/);
  let calls = 0;
  const client = new CdcClient({ config, vault, fetcher: async () => { calls++; throw Error('network'); } });
  await assert.rejects(client.writeSetting('statgm-users', {}, null), /hors/);
  assert.equal(calls, 0);
});
test('stockage compressé compatible avec le site', () => {
  const small = { name: 'Épée' }, large = { description: 'Création '.repeat(1000) };
  assert.deepEqual(decodeValue(encodeValue(small)), small);
  const encoded = encodeValue(large);
  assert.ok(encoded.startsWith('__neodium_gzip__:'));
  assert.deepEqual(decodeValue(encoded), large);
});
test('lien de connexion limité au projet et aucune requête vers un hôte arbitraire', async () => {
  const client = new CdcClient({ config, vault, fetcher: async () => { throw new Error('Ne doit pas être appelé'); } });
  await assert.rejects(client.authLink('https://evil.example/auth/v1/verify?token=secret&type=magiclink'), /lien de connexion/);
  await assert.rejects(client.authLink(config.url + '/auth/v1/verify?token=x&type=recovery'), /non reconnu/);
});
test('authentification par lien, liste autorisée et coffre sans divulgation', async () => {
  let saved;
  const localVault = { locked: async cb => cb(), write: async value => { saved = value; } };
  const client = new CdcClient({ config, vault: localVault, fetcher: async (url, options) => {
    if (url.endsWith('/verify')) { assert.equal(JSON.parse(options.body).token_hash, 'one-time'); return response({ access_token: 'private', refresh_token: 'refresh', expires_in: 3600 }); }
    if (url.endsWith('/user')) return response({ id: 'a', email: 'a@example.com' });
    return response([{ email: 'a@example.com' }]);
  } });
  assert.deepEqual(await client.authLink(config.url + '/auth/v1/verify?token=one-time&type=magiclink'), { id: 'a', email: 'a@example.com' });
  assert.equal(saved.access_token, 'private');
  assert.ok(saved.expires_at > Date.now() / 1000);
});
test('mise à jour réglage utilise la version et signale un conflit', async () => {
  const client = new CdcClient({ config, vault, fetcher: async (url, options) => {
    if (url.endsWith('/user')) return response({ id: 'a', email: 'a@example.com' });
    if (url.includes('neodium_allowed_emails')) return response([{ email: 'a@example.com' }]);
    assert.equal(options.method, 'PATCH'); assert.ok(url.includes('updated_at=eq.')); return response([]);
  } });
  await assert.rejects(client.writeSetting('neodium-template-label-overrides', {}, '2026-10-19T00:00:00Z'), /Conflit/);
});
test('une erreur distante ne divulgue pas le jeton renvoyé par le service', async () => {
  const client = new CdcClient({ config, vault, fetcher: async () => response({ error: 'secret-token' }, 401) });
  await assert.rejects(client.authorized(), error => !error.message.includes('secret-token') && error.status === 401);
});
test('déconnexion : session expirée renouvelée avant révocation', async () => {
  const calls = [];
  let cleared = false;
  const localVault = { read: async () => ({ access_token: 'old', refresh_token: 'refresh', expires_at: 1 }), write: async () => {}, locked: async cb => cb(), clear: async () => { cleared = true; } };
  const client = new CdcClient({ config, vault: localVault, fetcher: async (url, options) => {
    calls.push(url);
    if (url.includes('/token?')) return response({ access_token: 'new', refresh_token: 'rotated', expires_at: 9999999999 });
    assert.equal(options.headers.Authorization, 'Bearer new');
    return new Response(null, { status: 204 });
  } });
  await client.disconnect();
  assert.ok(calls[0].includes('refresh_token'));
  assert.ok(calls[1].includes('/logout?scope=local'));
  assert.equal(cleared, true);
});
