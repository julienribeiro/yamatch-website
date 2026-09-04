import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const websiteRoot = resolve(repoRoot, 'website');
const expectedPaths = [
  '/auth/callback',
  '/invite/*',
  '/org-invite/*',
  '/owner-transfer/*',
  '/referee/*',
  '/tournament/*',
  '/tournament-invite/*',
];

const aasa = JSON.parse(
  await readFile(
    resolve(websiteRoot, '.well-known/apple-app-site-association'),
    'utf8',
  ),
);
const details = aasa.applinks?.details;
if (!Array.isArray(details) || details.length !== 1) {
  throw new Error('AASA doit contenir exactement une déclaration applinks.');
}
if (details[0].appID !== 'W8JKU3PMD9.com.appyamatch.yamatch') {
  throw new Error('AASA appID ne correspond pas à Yamatch production.');
}
if (JSON.stringify(details[0].paths) !== JSON.stringify(expectedPaths)) {
  throw new Error('AASA ne couvre pas exactement les sept routes mobiles.');
}

const assetlinksPath = process.env.ASSETLINKS_OUTPUT_PATH
  ? resolve(process.env.ASSETLINKS_OUTPUT_PATH)
  : resolve(websiteRoot, '.well-known/assetlinks.json');
const assetlinksRaw = await readFile(assetlinksPath, 'utf8');
if (/placeholder/i.test(assetlinksRaw)) {
  throw new Error('assetlinks.json ne doit jamais contenir de placeholder.');
}
const assetlinks = JSON.parse(assetlinksRaw);
const target = assetlinks[0]?.target;
const fingerprints = target?.sha256_cert_fingerprints;
if (
  target?.namespace !== 'android_app' ||
  target?.package_name !== 'com.appyamatch.yamatch' ||
  !Array.isArray(fingerprints) ||
  fingerprints.length !== 1 ||
  !/^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(fingerprints[0])
) {
  throw new Error('assetlinks.json ne respecte pas le contrat Android prod.');
}

const fallbackContracts = new Map([
  ['invite/index.html', 'com.appyamatch.yamatch://invite/'],
  ['org-invite/index.html', 'com.appyamatch.yamatch://org-invite/'],
  ['owner-transfer/index.html', 'com.appyamatch.yamatch://owner-transfer/'],
  ['referee/index.html', 'com.appyamatch.yamatch://referee/'],
  ['tournament/index.html', 'com.appyamatch.yamatch://tournament/'],
  [
    'tournament-invite/index.html',
    'com.appyamatch.yamatch://tournament-invite/',
  ],
  ['auth/callback/index.html', 'com.appyamatch.yamatch://auth-callback'],
]);
const fallbackContents = new Map(
  await Promise.all(
    [...fallbackContracts].map(async ([relativePath, expectedScheme]) => {
      const contents = await readFile(resolve(websiteRoot, relativePath), 'utf8');
      if (!contents.includes(expectedScheme)) {
        throw new Error(`${relativePath} ne cible pas le schéma mobile attendu.`);
      }
      return [relativePath, contents];
    }),
  ),
);

const authFallback = fallbackContents.get('auth/callback/index.html');
if (
  !authFallback.includes('window.location.search') ||
  !authFallback.includes('window.location.hash')
) {
  throw new Error('Le fallback auth ne préserve pas la query et le fragment OAuth.');
}

const notFound = await readFile(resolve(websiteRoot, '404.html'), 'utf8');
if (!notFound.includes('/tournament-invite/?token=')) {
  throw new Error('Le bounce 404 tournament-invite est absent.');
}

const privacy = await readFile(
  resolve(websiteRoot, 'politique-confidentialite/index.html'),
  'utf8',
);
if (
  !privacy.includes('liée à votre compte et conservée sur les serveurs') ||
  !privacy.includes('coordonnées exactes restent uniquement sur votre appareil')
) {
  throw new Error('La politique ne décrit pas le contrat de localisation mobile.');
}

console.log('Contrats Universal Links et App Links validés.');
