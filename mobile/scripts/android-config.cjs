const fs = require('node:fs');
const path = require('node:path');

const configPath = path.resolve(__dirname, '../android/app-config.json');

function validateConfig(config, { allowMissingUrl = false } = {}) {
  if (!config || !/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/.test(config.appId || '')) {
    throw new Error('Identifiant Android invalide. Exemple : fr.neodium.outils.');
  }
  if (typeof config.appName !== 'string' || !config.appName.trim()) {
    throw new Error('Le nom de l application est obligatoire.');
  }
  if (!Number.isSafeInteger(config.versionCode) || config.versionCode < 1 || config.versionCode > 2100000000) {
    throw new Error('versionCode doit etre un entier positif valide pour Android.');
  }
  if (typeof config.versionName !== 'string' || !config.versionName.trim()) {
    throw new Error('versionName est obligatoire.');
  }
  if (typeof config.webUrl !== 'string' || !config.webUrl.trim()) {
    if (allowMissingUrl && config.webUrl === '') return { ...config, site: null };
    throw new Error('Adresse Web manquante. Lance : node mobile/scripts/android-config.cjs configure --url https://ton-site.fr/');
  }
  let site;
  try { site = new URL(config.webUrl); } catch { throw new Error('Adresse Web invalide.'); }
  if (site.protocol !== 'https:' || !site.hostname || site.username || site.password || site.port || site.search || site.hash) {
    throw new Error('Utilise une URL HTTPS publique, sans identifiants, port, parametres ni fragment.');
  }
  const scopePath = site.pathname.endsWith('.html')
    ? site.pathname.slice(0, site.pathname.lastIndexOf('/') + 1)
    : (site.pathname.endsWith('/') ? site.pathname : `${site.pathname}/`);
  if (!site.pathname.endsWith('.html')) site.pathname = scopePath;
  return { ...config, webUrl: site.href, site, scopePath };
}

function assetLinks(config, fingerprints) {
  validateConfig(config);
  if (!fingerprints.length) throw new Error('Ajoute l empreinte SHA-256 du certificat qui signe l APK.');
  const normalized = [...new Set(fingerprints.map(fingerprint => {
    const compact = fingerprint.replace(/:/g, '').trim();
    if (!/^[a-f\d]{64}$/i.test(compact)) throw new Error('Empreinte SHA-256 invalide.');
    return compact.toUpperCase().match(/.{2}/g).join(':');
  }))];
  return [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: config.appId,
      sha256_cert_fingerprints: normalized
    }
  }];
}

function main(args) {
  const [command, ...options] = args;
  const values = {};
  for (let index = 0; index < options.length; index += 2) {
    const key = options[index];
    const value = options[index + 1];
    if (!['--url', '--name', '--fingerprint', '--output'].includes(key) || !value || value.startsWith('--')) {
      throw new Error(`Option invalide : ${key || '(vide)'}.`);
    }
    (values[key] ||= []).push(value);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (command === 'configure') {
    if (!values['--url']) throw new Error('L option --url est obligatoire.');
    const candidate = {
      ...config,
      webUrl: values['--url'].at(-1),
      appName: values['--name']?.at(-1) || config.appName
    };
    const validated = validateConfig(candidate);
    fs.writeFileSync(configPath, `${JSON.stringify({ ...candidate, webUrl: validated.webUrl }, null, 2)}\n`);
    console.log(`Application configuree pour ${validated.webUrl}`);
    console.log(`Plein ecran : publier la relation Android a ${validated.site.origin}/.well-known/assetlinks.json`);
    return;
  }
  config.webUrl = values['--url']?.at(-1) || process.env.WEB_APP_URL || config.webUrl;
  const validated = validateConfig(config, { allowMissingUrl: command === 'check-template' });
  if (command === 'check' || command === 'check-template') {
    console.log(validated.site
      ? `Configuration valide : ${config.appName}, ${validated.webUrl}`
      : 'Base Android valide. Adresse Web encore a renseigner.');
    return;
  }
  if (command === 'assetlinks') {
    const statements = assetLinks(config, values['--fingerprint'] || []);
    const outputPath = path.resolve(values['--output']?.at(-1) || path.join(__dirname, '../android/build/assetlinks.json'));
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(statements, null, 2)}\n`);
    console.log(`Relation Android generee : ${outputPath}`);
    console.log(`Adresse de publication : ${validated.site.origin}/.well-known/assetlinks.json`);
    return;
  }
  throw new Error('Commande attendue : configure, check, check-template ou assetlinks.');
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { validateConfig, assetLinks };
