const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const { validateConfig, assetLinks } = require('../scripts/android-config.cjs');

const config = { appId: 'fr.neodium.outils', appName: 'Neodium Outils', versionCode: 1, versionName: '0.1.0', webUrl: 'https://outils.example.com/' };

test('launch URL and App Links scope stay inside the published site folder', () => {
  for (const input of ['https://example.com/outils', 'https://example.com/outils/', 'https://example.com/outils/index.html']) {
    const result = validateConfig({ ...config, webUrl: input });
    assert.equal(result.scopePath, '/outils/');
    assert.equal(result.site.origin, 'https://example.com');
    assert.equal(result.webUrl, input.endsWith('.html') ? input : 'https://example.com/outils/');
  }
  assert.equal(validateConfig(config).scopePath, '/');
});

test('a build cannot silently use a demo URL or a login callback', () => {
  for (const url of ['', 'not a URL', 'http://example.com/', 'https://user:password@example.com/', 'https://example.com:8443/', 'https://example.com/?token=secret', 'https://example.com/#access_token=secret']) {
    assert.throws(() => validateConfig({ ...config, webUrl: url }));
  }
  assert.equal(validateConfig({ ...config, webUrl: '' }, { allowMissingUrl: true }).site, null);
});

test('Android identifiers and version codes are validated', () => {
  for (const appId of ['neodium', 'fr.neodium-outils', 'fr..outils']) assert.throws(() => validateConfig({ ...config, appId }));
  for (const versionCode of [0, 1.5, 2100000001]) assert.throws(() => validateConfig({ ...config, versionCode }));
});

test('Digital Asset Links use the installed application certificate, normalized and deduplicated', () => {
  const compact = 'ab'.repeat(32);
  const fingerprint = Array(32).fill('AB').join(':');
  const [statement] = assetLinks(config, [compact, fingerprint]);
  assert.equal(statement.target.package_name, config.appId);
  assert.equal(statement.target.namespace, 'android_app');
  assert.deepEqual(statement.target.sha256_cert_fingerprints, [fingerprint]);
  assert.deepEqual(statement.relation, ['delegate_permission/common.handle_all_urls']);
  assert.throws(() => assetLinks(config, []));
  assert.throws(() => assetLinks(config, ['placeholder']));
});

test('the CLI generates the domain association without changing the saved application configuration', () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'neodium-android-'));
  const configPath = path.resolve(__dirname, '../android/app-config.json');
  const savedConfig = fs.readFileSync(configPath, 'utf8');
  const outputPath = path.join(temporaryDirectory, 'assetlinks.json');
  const script = path.resolve(__dirname, '../scripts/android-config.cjs');
  try {
    const result = spawnSync(process.execPath, [script, 'assetlinks', '--url', config.webUrl, '--fingerprint', 'ab'.repeat(32), '--output', outputPath], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /https:\/\/outils\.example\.com\/\.well-known\/assetlinks\.json/);
    const [statement] = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    assert.equal(statement.target.package_name, JSON.parse(savedConfig).appId);
    assert.equal(statement.target.sha256_cert_fingerprints[0], Array(32).fill('AB').join(':'));
    assert.equal(fs.readFileSync(configPath, 'utf8'), savedConfig);
  } finally {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    fs.rmdirSync(temporaryDirectory);
  }
});
