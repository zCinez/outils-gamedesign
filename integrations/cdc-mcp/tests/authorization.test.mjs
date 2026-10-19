import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const source = await readFile(new URL('../../../supabase/functions/turso-cdc/index.ts', import.meta.url), 'utf8');
const functionSource = stripTypeScriptTypes(source.slice(source.indexOf('async function requireAllowedUser('), source.indexOf('Deno.serve(')));
async function authorize({ token = 'test-token', email = 'member@example.com', row = { email: 'member@example.com' }, invalidSession = false } = {}) {
  const filters = [];
  const context = vm.createContext({
    supabaseUrl: 'https://test.supabase.co', supabaseAnonKey: 'public',
    jsonResponse: (status, body) => ({ status, body }),
    createClient: () => ({
      auth: { getUser: async () => ({ data: { user: invalidSession ? null : { id: 'member', email } }, error: invalidSession ? Error('invalid') : null }) },
      from: () => ({ select: () => ({ eq: (key, value) => { filters.push([key, value]); return { maybeSingle: async () => ({ data: row, error: null }) }; } }) })
    })
  });
  vm.runInContext(functionSource, context);
  const result = await context.requireAllowedUser(new Request('https://test.example', { headers: token ? { Authorization: `Bearer ${token}` } : {} }));
  return { result, filters };
}
test('serveur : session absente ou invalide refusée', async () => {
  assert.equal((await authorize({ token: '' })).result.response.status, 401);
  assert.equal((await authorize({ invalidSession: true })).result.response.status, 401);
});
test('serveur : email filtré explicitement et mauvais email refusé même sans RLS', async () => {
  const denied = await authorize({ email: 'outsider@example.com' });
  assert.deepEqual(denied.filters, [['email', 'outsider@example.com']]);
  assert.equal(denied.result.response.status, 403);
  assert.equal((await authorize({ row: null })).result.response.status, 403);
});
test('serveur : email exact autorisé et identité du token conservée', async () => {
  const { result } = await authorize();
  assert.equal(result.ok, true);
  assert.equal(result.userId, 'member');
});
