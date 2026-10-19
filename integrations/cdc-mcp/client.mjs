import { gunzipSync, gzipSync } from 'node:zlib';
import { CONFIG, checkStorageKey, SETTINGS_KEYS, ITEM_PREFIX } from './config.mjs';
import { Vault } from './vault.mjs';

export class CdcClient {
  constructor({ vault = new Vault(), fetcher = fetch, config = CONFIG } = {}) { this.vault = vault; this.fetcher = fetcher; this.config = config; }
  async request(endpoint, { token, method = 'GET', body, headers = {} } = {}) {
    const response = await this.fetcher(`${this.config.url}${endpoint}`, {
      method, headers: { apikey: this.config.anonKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000), redirect: 'error'
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      // Do not relay arbitrary authentication responses, which can contain credentials.
      const messages = { 400: 'Demande invalide.', 401: 'Session expirée ou connexion invalide. Reconnectez Neodium CDC.', 403: 'Ce compte ne dispose pas des droits Neodium.', 409: 'Conflit : relisez les données avant de réessayer.', 413: 'CDC trop volumineux.', 429: 'Trop de demandes, réessayez plus tard.' };
      throw Object.assign(new Error(messages[response.status] || `Service Neodium indisponible (${response.status}).`), { status: response.status });
    }
    return result;
  }
  async verifyAllowed(token) {
    const user = await this.request('/auth/v1/user', { token });
    const rows = await this.request('/rest/v1/neodium_allowed_emails?select=email', { token });
    if (!Array.isArray(rows) || !rows.some(row => String(row.email).toLowerCase() === String(user.email).toLowerCase())) throw Object.assign(new Error('Cet email ne fait pas partie des comptes Neodium autorisés.'), { status: 403 });
    return { id: user.id, email: user.email };
  }
  async session() {
    return this.vault.locked(async () => {
      let session = await this.vault.read();
      if (!session) throw new Error('Connectez votre compte avec cdc_connect, dans la page locale. Aucun secret dans le chat.');
      if (Number(session.expires_at) * 1000 < Date.now() + 90000) {
        session = await this.request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } });
        await this.vault.write(session);
      }
      return session;
    });
  }
  async authorized() { const session = await this.session(); return { token: session.access_token, user: await this.verifyAllowed(session.access_token) }; }
  async acceptSession(session) {
    if (!session?.expires_at && session?.expires_in) session.expires_at = Math.floor(Date.now() / 1000) + Number(session.expires_in);
    if (!session?.access_token || !session?.refresh_token || !session?.expires_at) throw new Error('Session reçue invalide.');
    const user = await this.verifyAllowed(session.access_token);
    await this.vault.locked(() => this.vault.write(session));
    return user;
  }
  async authEmail(email) {
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Adresse email invalide.');
    await this.request('/auth/v1/otp', { method: 'POST', body: { email, create_user: false } });
  }
  async authLink(link, email) {
    let body;
    if (/^\d{6,10}$/.test(link.trim())) body = { type: 'email', email, token: link.trim() };
    else {
      const url = new URL(link.trim());
      if (url.origin !== this.config.url || url.pathname !== '/auth/v1/verify') throw new Error('Utilisez le lien de connexion reçu de Neodium, avant de cliquer dessus.');
      const token = url.searchParams.get('token') || url.searchParams.get('token_hash');
      const type = url.searchParams.get('type');
      if (!token || token.length > 2048 || !['magiclink', 'email'].includes(type)) throw new Error('Lien de connexion non reconnu.');
      body = { token_hash: token, type };
    }
    return this.acceptSession(await this.request('/auth/v1/verify', { method: 'POST', body }));
  }
  async disconnect() {
    await this.vault.locked(async () => {
      let session = await this.vault.read();
      if (session) {
        try {
          if (Number(session.expires_at) * 1000 < Date.now() + 90000) {
            session = await this.request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } });
            await this.vault.write(session);
          }
          await this.request('/auth/v1/logout?scope=local', { token: session.access_token, method: 'POST' });
        }
        catch (error) { if (error.status !== 401) throw error; }
      }
      await this.vault.clear();
    });
    return { connected: false };
  }
  async remote(body) { const { token } = await this.authorized(); return this.request('/functions/v1/turso-cdc', { token, method: 'POST', body }); }
  async snapshot() { return (await this.remote({ action: 'get_snapshot' })).snapshot; }
  async write(collection, operation, id, expectedUpdatedAt, record) {
    return this.remote({ action: 'agent_write', collection, operation, id, expectedUpdatedAt, record });
  }
  async settings(key) {
    const { token } = await this.authorized();
    if (key) checkStorageKey(key);
    const filter = key ? `&storage_key=eq.${encodeURIComponent(key)}` : `&or=(${SETTINGS_KEYS.map(key => `storage_key.eq.${key}`).join(',')},storage_key.like.${ITEM_PREFIX}*)`;
    const rows = [];
    for (let offset = 0; ; offset += 1000) {
      const page = await this.request(`/rest/v1/${this.config.storageTable}?workspace_id=eq.global&select=storage_key,storage_value,updated_at${filter}&order=storage_key&limit=1000&offset=${offset}`, { token });
      rows.push(...page);
      if (page.length < 1000) break;
    }
    return rows.map(row => ({ key: row.storage_key, value: decodeValue(row.storage_value), updatedAt: row.updated_at }));
  }
  async writeSetting(key, value, expectedUpdatedAt, remove = false) {
    checkStorageKey(key);
    if (!remove) {
      const needsArray = key.endsWith('-hidden') || key === 'neodium-gui-custom-presets' || key === 'neodium-item-custom-presets';
      if (needsArray ? !Array.isArray(value) : (!value || typeof value !== 'object' || Array.isArray(value))) throw new Error(needsArray ? 'Ce réglage attend une liste JSON.' : 'Ce réglage attend un objet JSON.');
    }
    const { token } = await this.authorized();
    if (remove && expectedUpdatedAt === null) throw new Error('Relisez le réglage avant de le supprimer.');
    const updatedAt = new Date(Math.max(Date.now(), Date.parse(expectedUpdatedAt || '') + 1 || 0)).toISOString();
    const encoded = encodeValue(value);
    const base = `/rest/v1/${this.config.storageTable}`;
    const filter = `?workspace_id=eq.global&storage_key=eq.${encodeURIComponent(key)}&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`;
    const result = await this.request(expectedUpdatedAt === null ? base : base + filter, {
      token, method: remove ? 'DELETE' : expectedUpdatedAt === null ? 'POST' : 'PATCH', headers: { Prefer: 'return=representation' },
      ...(!remove ? { body: { workspace_id: 'global', storage_key: key, storage_value: encoded, updated_at: updatedAt } } : {})
    });
    if (!Array.isArray(result) || result.length !== 1) throw new Error('Conflit : ce réglage a changé. Relisez-le.');
    return { ok: true, key, updatedAt: remove ? null : result[0].updated_at };
  }
}
export function decodeValue(value) {
  const raw = String(value);
  const decoded = raw.startsWith('__neodium_gzip__:') ? gunzipSync(Buffer.from(raw.slice('__neodium_gzip__:'.length), 'base64'), { maxOutputLength: 8 * 1024 * 1024 }).toString('utf8') : raw;
  try { return JSON.parse(decoded); } catch { return decoded; }
}
export function encodeValue(value) {
  const raw = JSON.stringify(value);
  if (raw === undefined || Buffer.byteLength(raw) > 3 * 1024 * 1024) throw new Error('Valeur de réglage invalide ou trop volumineuse.');
  return raw.length >= 1024 ? '__neodium_gzip__:' + gzipSync(raw).toString('base64') : raw;
}
