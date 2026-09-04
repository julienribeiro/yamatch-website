const expectedFingerprint = process.env.PLAY_APP_SIGNING_SHA256?.trim().toUpperCase();
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

if (!expectedFingerprint) {
  throw new Error('PLAY_APP_SIGNING_SHA256 est requis pour le smoke test.');
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
const detail = aasa.applinks?.details?.[0];
if (
  detail?.appID !== 'W8JKU3PMD9.com.appyamatch.yamatch' ||
  JSON.stringify(detail.paths) !== JSON.stringify(expectedPaths)
) {
  throw new Error('Le contrat AASA publié ne correspond pas au contrat mobile.');
}

const assetlinks = await fetchJsonWithRetry('/.well-known/assetlinks.json');
const target = assetlinks[0]?.target;
if (
  target?.package_name !== 'com.appyamatch.yamatch' ||
  target?.namespace !== 'android_app' ||
  JSON.stringify(target.sha256_cert_fingerprints) !==
    JSON.stringify([expectedFingerprint])
) {
  throw new Error('Le contrat Android publié ne correspond pas au build déployé.');
}

console.log('Smoke test post-déploiement des associations natives réussi.');
