import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const websiteRoot = resolve(repoRoot, 'website');
const fingerprintPattern = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;
const expectedFingerprint =
  process.env.PLAY_APP_SIGNING_SHA256?.trim().toUpperCase() ?? '';
const productionPolicy = JSON.parse(
  await readFile(resolve(repoRoot, 'config/play-app-signing-sha256.json'), 'utf8'),
);
const rejectedUploadFingerprints =
  productionPolicy.rejectedUploadFingerprints;
const expectedPaths = [
  '/auth/callback',
  '/invite/*',
  '/org-invite/*',
  '/owner-transfer/*',
  '/referee/*',
  '/tournament/*',
  '/tournament-invite/*',
];

if (
  !Array.isArray(rejectedUploadFingerprints) ||
  rejectedUploadFingerprints.some(
    (fingerprint) =>
      typeof fingerprint !== 'string' || !fingerprintPattern.test(fingerprint),
  )
) {
  throw new Error('La liste des clés d’upload rejetées est invalide.');
}
if (expectedFingerprint && !fingerprintPattern.test(expectedFingerprint)) {
  throw new Error(
    'PLAY_APP_SIGNING_SHA256 doit contenir exactement 32 octets pour contrôler assetlinks.json.',
  );
}
if (rejectedUploadFingerprints.includes(expectedFingerprint)) {
  throw new Error(
    'PLAY_APP_SIGNING_SHA256 correspond à une clé d’upload explicitement rejetée.',
  );
}

const aasa = JSON.parse(
  await readFile(
    resolve(websiteRoot, '.well-known/apple-app-site-association'),
    'utf8',
  ),
);
const details = aasa.applinks?.details;
if (
  !Array.isArray(aasa.applinks?.apps) ||
  aasa.applinks.apps.length !== 0 ||
  !Array.isArray(details) ||
  details.length !== 1
) {
  throw new Error('AASA doit contenir exactement une déclaration applinks.');
}
if (details[0].appID !== 'W8JKU3PMD9.com.appyamatch.yamatch') {
  throw new Error('AASA appID ne correspond pas à Yamatch production.');
}
if (JSON.stringify(details[0].paths) !== JSON.stringify(expectedPaths)) {
  throw new Error('AASA ne couvre pas exactement les sept routes mobiles.');
}
if (
  JSON.stringify(aasa.webcredentials?.apps) !==
  JSON.stringify(['W8JKU3PMD9.com.appyamatch.yamatch'])
) {
  throw new Error('AASA webcredentials ne correspond pas à Yamatch production.');
}

const assetlinksPath = process.env.ASSETLINKS_OUTPUT_PATH
  ? resolve(process.env.ASSETLINKS_OUTPUT_PATH)
  : resolve(websiteRoot, '.well-known/assetlinks.json');
const assetlinksRaw = await readFile(assetlinksPath, 'utf8');
if (/placeholder/i.test(assetlinksRaw)) {
  throw new Error('assetlinks.json ne doit jamais contenir de placeholder.');
}
const assetlinks = JSON.parse(assetlinksRaw);
if (!Array.isArray(assetlinks)) {
  throw new Error('assetlinks.json doit être un tableau JSON.');
}
if (!expectedFingerprint) {
  if (assetlinks.length !== 0) {
    throw new Error(
      'assetlinks.json doit rester vide tant que Play App Signing est en attente.',
    );
  }
} else if (assetlinks.length !== 1) {
  throw new Error('assetlinks.json doit contenir exactement un statement Android.');
}
if (expectedFingerprint) {
  const statement = assetlinks[0];
  if (
    !statement ||
    typeof statement !== 'object' ||
    Array.isArray(statement) ||
    JSON.stringify(Object.keys(statement).sort()) !==
      JSON.stringify(['relation', 'target'])
  ) {
    throw new Error('Le statement Android doit respecter la forme exacte attendue.');
  }
  if (
    JSON.stringify(statement.relation) !==
    JSON.stringify(['delegate_permission/common.handle_all_urls'])
  ) {
    throw new Error('assetlinks.json ne déclare pas la relation Android attendue.');
  }
  const target = statement.target;
  if (
    !target ||
    typeof target !== 'object' ||
    Array.isArray(target) ||
    JSON.stringify(Object.keys(target).sort()) !==
      JSON.stringify(['namespace', 'package_name', 'sha256_cert_fingerprints'])
  ) {
    throw new Error('La cible Android doit respecter la forme exacte attendue.');
  }
  const fingerprints = target.sha256_cert_fingerprints;
  if (
    target.namespace !== 'android_app' ||
    target.package_name !== 'com.appyamatch.yamatch' ||
    !Array.isArray(fingerprints) ||
    JSON.stringify(fingerprints) !== JSON.stringify([expectedFingerprint])
  ) {
    throw new Error('assetlinks.json ne respecte pas le contrat Android prod.');
  }
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
