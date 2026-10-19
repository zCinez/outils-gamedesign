import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CdcClient } from './client.mjs';

export async function beginConnection(client = new CdcClient()) {
  const nonce = randomBytes(32).toString('hex');
  const page = await readFile(new URL('./connect.html', import.meta.url), 'utf8');
  let origin, completed = false, busy = false;
  const attempts = [];
  const server = http.createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'");
    const send = (status, body) => { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(body)); };
    if (request.headers.host !== new URL(origin).host || !request.url?.startsWith(`/${nonce}/`)) return send(403, { error: 'Accès refusé.' });
    if (request.method === 'GET' && request.url === `/${nonce}/`) {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return response.end(page);
    }
    if (request.method !== 'POST' || request.headers.origin !== origin || request.headers['content-type'] !== 'application/json') return send(403, { error: 'Accès refusé.' });
    if (completed || busy) return send(409, { error: 'Connexion déjà terminée ou demande en cours.' });
    const route = request.url.slice(nonce.length + 2);
    if (!['email', 'verify'].includes(route)) return send(404, { error: 'Page introuvable.' });
    const now = Date.now();
    while (attempts[0] < now - 60000) attempts.shift();
    if (attempts.length >= 6) return send(429, { error: 'Patientez une minute avant de réessayer.' });
    attempts.push(now); busy = true;
    try {
      let raw = '';
      for await (const part of request) { raw += part.toString(); if (Buffer.byteLength(raw) > 12000) throw new Error('Demande trop volumineuse.'); }
      const input = JSON.parse(raw);
      if (route === 'email') {
        await client.authEmail(input.email);
        send(200, { message: 'Email demandé. Dans votre boîte mail, copiez le lien de connexion sans l’ouvrir, puis collez-le ci-dessous.' });
      } else {
        const user = await client.authLink(input.link, input.email);
        completed = true;
        send(200, { message: `Connecté avec ${user.email}. Vous pouvez revenir dans Codex.`, connected: true });
        setTimeout(() => server.close(), 1500).unref();
      }
    } catch (error) { send(400, { error: error.message || 'Connexion impossible.' }); }
    finally { busy = false; }
  });
  server.requestTimeout = 35000;
  server.headersTimeout = 10000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  origin = `http://127.0.0.1:${server.address().port}`;
  const expiry = setTimeout(() => server.close(), 15 * 60000);
  expiry.unref();
  server.on('close', () => clearTimeout(expiry));
  return { url: `${origin}/${nonce}/`, server };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const connection = await beginConnection();
  console.log(connection.url);
}
