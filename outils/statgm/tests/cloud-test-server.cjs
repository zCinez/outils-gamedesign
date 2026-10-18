/* Local-only integration fixture. No requests or test data reach the real cloud. */
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { Readable } = require('node:stream');
const { makeService, USERS } = require('./cloud-service.test.cjs');
const root = path.resolve(__dirname, '../../..');
(async () => {
  const fixture = await makeService();
  const bootstrap = `window.NEODIUM_SUPABASE_CONFIG={url:location.origin,anonKey:'fixture',statgmCloudFixture:true};let testAccount='one';const testUsers=${JSON.stringify(USERS)};window.NeodiumCloudSync={whenReady:async()=>{},getState:()=>({email:testAccount?testAccount+'@fixture.test':''}),getSession:async()=>testAccount?{access_token:testAccount,user:{id:testUsers[testAccount],email:testAccount+'@fixture.test'}}:null};window.StatGMTestAuth={set:key=>{testAccount=key;dispatchEvent(new Event('neodium-cloud-state'));}};`;
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost:8001');
      if (url.pathname === '/functions/v1/turso-statgm') {
        if (request.method === 'POST') {
          const bytes = await Array.fromAsync(request), body = Buffer.concat(bytes);
          try { const message = JSON.parse(body); fixture.metrics.calls[message.action] = (fixture.metrics.calls[message.action] || 0) + 1; if (message.action === 'put') fixture.metrics.bytesUploaded += message.chunks.reduce((sum, chunk) => sum + Buffer.from(chunk.data, 'base64').length, 0); } catch {}
          const result = await fixture.handle(new Request(url, { method: 'POST', headers: request.headers, body }));
          response.writeHead(result.status, Object.fromEntries(result.headers)); response.end(Buffer.from(await result.arrayBuffer()));
        } else { const result = await fixture.handle(new Request(url, { method: request.method })); response.writeHead(result.status, Object.fromEntries(result.headers)); response.end(await result.text()); }
        return;
      }
      if (url.pathname === '/__test/metrics') { response.writeHead(200, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(fixture.metrics)); return; }
      if (url.pathname === '/__test/bootstrap.js') { response.writeHead(200, { 'Content-Type': 'text/javascript' }); response.end(bootstrap); return; }
      const filename = path.resolve(root, '.' + decodeURIComponent(url.pathname));
      if (!filename.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
      let content = await fs.readFile(filename);
      const ext = path.extname(filename);
      if (ext === '.html') {
        content = content.toString().replace('<script src="../../assets/supabase-config.js"></script>', '<script src="/__test/bootstrap.js"></script>').replace('<script src="../../assets/cloud-sync.js?v=20260626b"></script>', '');
        if (url.pathname.endsWith('/statgm/index.html') || url.pathname.endsWith('/statgm/joueurs.html')) content = content.replace('<body>', '<body><div style="padding:8px 24px;font-size:12px;background:#25263c;color:#eee">Démonstration locale · API et comptes fictifs <button onclick="StatGMTestAuth.set(\'one\')">Compte test 1</button> <button onclick="StatGMTestAuth.set(\'two\')">Compte test 2</button> <button onclick="StatGMTestAuth.set(\'\')">Déconnecter</button></div>');
      }
      const type = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }); response.end(content);
    } catch (error) { response.writeHead(404); response.end('Not found'); }
  });
  server.listen(8001, '127.0.0.1', () => console.log('StatGM integration fixture: http://localhost:8001/outils/statgm/tests/cloud-browser.html'));
})();
