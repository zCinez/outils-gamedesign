import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { prepareAgentWrite, finishAgentWrite } from '../../../supabase/functions/turso-cdc/agent-records.js';

function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE cdc_workspace_projects(user_id TEXT,project_id TEXT,name TEXT,created_at TEXT,updated_at TEXT,payload_json TEXT,PRIMARY KEY(user_id,project_id)); CREATE TABLE cdc_history_entries(user_id TEXT,entry_id TEXT,project_id TEXT,project_name TEXT,template TEXT,created_at TEXT,updated_at TEXT,payload_json TEXT,PRIMARY KEY(user_id,entry_id));');
  const snapshot = user => ({ projects: db.prepare('SELECT payload_json FROM cdc_workspace_projects WHERE user_id=?').all(user).map(row => JSON.parse(row.payload_json)), history: db.prepare('SELECT payload_json FROM cdc_history_entries WHERE user_id=?').all(user).map(row => JSON.parse(row.payload_json)) });
  const normalize = { projects: x => x, history: x => ({ projectId: '', ...x, renderedHtml: '' }) };
  const prepare = (user, body) => prepareAgentWrite(user, body, snapshot(user), normalize, '2026-10-19T12:00:00.000Z');
  const run = prepared => {
    const { sql, args } = prepared.request.stmt;
    const result = db.prepare(sql).run(...args.map(arg => arg.value));
    return finishAgentWrite({ results: [{ response: { result: { affected_row_count: result.changes } } }] }, prepared.record);
  };
  const put = (user, collection, id, record, expectedUpdatedAt = null) => run(prepare(user, { collection, operation: 'put', id, record, expectedUpdatedAt })).record;
  return { db, snapshot, prepare, run, put };
}
test('création, modification atomique et conflit concurrent sans perte de données', () => {
  const f = fixture();
  try {
    const project = f.put('alice', 'projects', 'p', { name: 'Projet A' });
    const body = { collection: 'projects', operation: 'put', id: 'p', record: { name: 'Projet B' }, expectedUpdatedAt: project.updatedAt };
    const pending = f.prepare('alice', body);
    const next = f.put('alice', 'projects', 'p', { name: 'Projet C' }, project.updatedAt);
    assert.ok(next.updatedAt > project.updatedAt);
    assert.equal(next.createdAt, project.createdAt);
    assert.throws(() => f.run(pending), /Conflit/);
    assert.equal(f.snapshot('alice').projects[0].name, 'Projet C');
    assert.throws(() => f.prepare('alice', body), /Conflit/);
  } finally { f.db.close(); }
});
test('isolation des comptes et contrôle de version obligatoire', () => {
  const f = fixture();
  try {
    const alice = f.put('alice', 'projects', 'p', { name: 'Privé A' });
    f.put('bob', 'projects', 'p', { name: 'Privé B' });
    assert.throws(() => f.prepare('alice', { collection: 'projects', operation: 'put', id: 'p', record: { name: 'X' } }), /version/);
    f.run(f.prepare('alice', { collection: 'projects', operation: 'delete', id: 'p', expectedUpdatedAt: alice.updatedAt }));
    assert.equal(f.snapshot('bob').projects[0].name, 'Privé B');
    assert.throws(() => f.prepare('bob', { collection: '__proto__', operation: 'put', id: 'x', expectedUpdatedAt: null }), /invalide/);
  } finally { f.db.close(); }
});
test('création concurrente ne remplace pas une ligne existante', () => {
  const f = fixture();
  try {
    const pending = f.prepare('alice', { collection: 'projects', operation: 'put', id: 'p', expectedUpdatedAt: null, record: { name: 'A' } });
    f.put('alice', 'projects', 'p', { name: 'B' });
    assert.throws(() => f.run(pending), /Conflit/);
    assert.equal(f.snapshot('alice').projects[0].name, 'B');
  } finally { f.db.close(); }
});
test('suppression du projet protégée et cycle CDC complet', () => {
  const f = fixture();
  try {
    const project = f.put('alice', 'projects', 'p', { name: 'P' });
    const deleteProject = f.prepare('alice', { collection: 'projects', operation: 'delete', id: 'p', expectedUpdatedAt: project.updatedAt });
    const entry = f.put('alice', 'history', 'd', { projectName: 'CDC', projectId: 'p', template: 'itemC', fields: {}, dynamic: {} });
    assert.throws(() => f.run(deleteProject), /projet contenant/);
    const updated = f.put('alice', 'history', 'd', { ...entry, projectName: 'CDC 2' }, entry.updatedAt);
    f.run(f.prepare('alice', { collection: 'history', operation: 'delete', id: 'd', expectedUpdatedAt: updated.updatedAt }));
    f.run(deleteProject);
    assert.deepEqual(f.snapshot('alice'), { projects: [], history: [] });
  } finally { f.db.close(); }
});
test('parent supprimé entre lecture et écriture : refus atomique', () => {
  const f = fixture();
  try {
    const p = f.put('alice', 'projects', 'p', { name: 'P' });
    const prepared = f.prepare('alice', { collection: 'history', operation: 'put', id: 'd', expectedUpdatedAt: null, record: { projectId: 'p', projectName: 'D', template: 'libre' } });
    f.run(f.prepare('alice', { collection: 'projects', operation: 'delete', id: 'p', expectedUpdatedAt: p.updatedAt }));
    assert.throws(() => f.run(prepared), /Conflit/);
    assert.equal(f.snapshot('alice').history.length, 0);
  } finally { f.db.close(); }
});
