const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "..", "player-heads.js"), "utf8");
const uuid = number => `${number.toString(16).padStart(8, "0")}-1234-4000-8000-0123456789ab`;
const png = (status = 200, extra = {}) => new Response(new Blob(["test-image"], { type: "image/png" }), { status, headers: { "Content-Type": "image/png", ...extra } });
function runtime(fetch) {
  let sequence = 0;
  const context = vm.createContext({ fetch, AbortController, setTimeout, clearTimeout, URL: {
    createObjectURL: () => `blob:test-${++sequence}`, revokeObjectURL: () => {}
  } });
  vm.runInContext(source, context);
  return context.StatGMHeads;
}
(async () => {
  const requests = [];
  const fallback = runtime(async url => {
    requests.push(url);
    return url.startsWith("https://crafatar-pub.neodium.fr") ? png(500) : png();
  });
  assert.equal(await fallback.load(uuid(1)), "blob:test-1");
  assert.equal(requests.length, 2);
  assert.ok(requests[0].includes("/renders/head/"));
  assert.ok(requests[1].startsWith("https://mc-heads.net/head/"));
  assert.equal(await fallback.load(uuid(1)), "blob:test-1");
  assert.equal(requests.length, 2, "A cached head must not request the APIs again.");

  const storageRequests = [];
  const storageError = runtime(async url => {
    storageRequests.push(url);
    return storageRequests.length === 1 ? png(200, { "X-Storage-Type": "server error" }) : png();
  });
  await storageError.load(uuid(2));
  assert.equal(storageRequests.length, 2, "A server-error PNG must be rejected even with HTTP 200.");

  let failures = 0;
  const unavailable = runtime(async () => { failures++; return png(500); });
  await assert.rejects(unavailable.load(uuid(3)), /Skin indisponible/);
  assert.equal(failures, 3);
  await assert.rejects(unavailable.load(uuid(3)), /temporairement/);
  assert.equal(failures, 3, "Failed heads should not flood the APIs on repeated rendering.");
  await assert.rejects(unavailable.load("invalid-uuid"), /UUID invalide/);

  let active = 0, maximum = 0, calls = 0;
  const bounded = runtime(async () => {
    calls++; active++; maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 5));
    active--;
    return png();
  });
  const first = bounded.load(uuid(4));
  assert.equal(bounded.load(uuid(4)), first, "Concurrent requests for one UUID should share a promise.");
  await Promise.all([first, ...Array.from({ length: 19 }, (_, index) => bounded.load(uuid(index + 5)))]);
  assert.equal(calls, 20);
  assert.equal(maximum, 4);
  console.log("PASS: 3D endpoints, HTTP-error PNG rejection, provider fallback, cache, unavailable skins, UUID validation, deduplication and four-request concurrency.");
})().catch(error => { console.error(error); process.exitCode = 1; });
