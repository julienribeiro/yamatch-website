import { readFile } from 'node:fs/promises';

const fingerprintPattern = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;
const expectedFingerprint =
  process.env.PLAY_APP_SIGNING_SHA256?.trim().toUpperCase() ?? '';
const productionPolicy = JSON.parse(
  await readFile(
    new URL('../config/play-app-signing-sha256.json', import.meta.url),
    'utf8',
  ),
);
const rejectedUploadFingerprints =
  productionPolicy.rejectedUploadFingerprints;
const baseUrl = process.env.DEEP_LINK_SMOKE_BASE_URL ?? 'https://appyamatch.fr';
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
  throw new Error('PLAY_APP_SIGNING_SHA256 est invalide pour le smoke test.');
}
if (rejectedUploadFingerprints.includes(expectedFingerprint)) {
  throw new Error(
    'PLAY_APP_SIGNING_SHA256 correspond à une clé d’upload explicitement rejetée.',
  );
}

const delay = (milliseconds) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function fetchJsonWithRetry(path) {
  let lastError;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const response = await fetch(new URL(path, baseUrl), {
        cache: 'no-store',
        headers: { accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 8) await delay(15000);
    }
  }
  throw new Error(`${path} indisponible après plusieurs tentatives : ${lastError}`);
}

const aasa = await fetchJsonWithRetry(
  '/.well-known/apple-app-site-association',
);
const details = aasa.applinks?.details;
const detail = details?.[0];
if (
  !Array.isArray(aasa.applinks?.apps) ||
  aasa.applinks.apps.length !== 0 ||
  !Array.isArray(details) ||
  details.length !== 1 ||
  detail?.appID !== 'W8JKU3PMD9.com.appyamatch.yamatch' ||
  JSON.stringify(detail.paths) !== JSON.stringify(expectedPaths) ||
  JSON.stringify(aasa.webcredentials?.apps) !==
    JSON.stringify(['W8JKU3PMD9.com.appyamatch.yamatch'])
) {
  throw new Error('Le contrat AASA publié ne correspond pas au contrat mobile.');
}

const assetlinks = await fetchJsonWithRetry('/.well-known/assetlinks.json');
if (!expectedFingerprint) {
  if (!Array.isArray(assetlinks) || assetlinks.length !== 0) {
    throw new Error(
      'Le contrat Android publié doit rester vide en attente de Play App Signing.',
    );
  }
} else {
  const statement = assetlinks?.[0];
  const target = statement?.target;
  if (
    !Array.isArray(assetlinks) ||
    assetlinks.length !== 1 ||
    !statement ||
    JSON.stringify(Object.keys(statement).sort()) !==
      JSON.stringify(['relation', 'target']) ||
    JSON.stringify(statement.relation) !==
      JSON.stringify(['delegate_permission/common.handle_all_urls']) ||
    !target ||
    typeof target !== 'object' ||
    Array.isArray(target) ||
    JSON.stringify(Object.keys(target).sort()) !==
      JSON.stringify(['namespace', 'package_name', 'sha256_cert_fingerprints']) ||
    target.package_name !== 'com.appyamatch.yamatch' ||
    target.namespace !== 'android_app' ||
    JSON.stringify(target.sha256_cert_fingerprints) !==
      JSON.stringify([expectedFingerprint])
  ) {
    throw new Error('Le contrat Android publié ne correspond pas au build déployé.');
  }
}

console.log('Smoke test post-déploiement des associations natives réussi.');
