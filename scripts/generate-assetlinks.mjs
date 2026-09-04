import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const fingerprintPattern = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const productionAllowlistPath = resolve(
  repoRoot,
  'config/play-app-signing-sha256.json',
);
const defaultOutput = fileURLToPath(
  new URL('../website/.well-known/assetlinks.json', import.meta.url),
);
const testFixturesRoot = resolve(repoRoot, 'test/fixtures');
const requestedAllowlistPath = process.env.ASSETLINKS_ALLOWLIST_PATH;
const isTest = process.env.NODE_ENV === 'test';

if (requestedAllowlistPath && !isTest) {
  throw new Error(
    'ASSETLINKS_ALLOWLIST_PATH est réservé aux tests et exige NODE_ENV=test.',
  );
}

const allowlistPath = requestedAllowlistPath
  ? resolve(requestedAllowlistPath)
  : productionAllowlistPath;
if (requestedAllowlistPath) {
  const relativeFixturePath = relative(testFixturesRoot, allowlistPath);
  if (
    relativeFixturePath.startsWith(`..${sep}`) ||
    relativeFixturePath === '..' ||
    relativeFixturePath.startsWith(sep)
  ) {
    throw new Error('La allowlist de test doit rester sous test/fixtures/.');
  }
  if (!process.env.ASSETLINKS_OUTPUT_PATH) {
    throw new Error('Un output temporaire est obligatoire avec une fixture de test.');
  }
  if (resolve(process.env.ASSETLINKS_OUTPUT_PATH) === defaultOutput) {
    throw new Error('Une fixture de test ne peut jamais écrire le fichier de production.');
  }
}

const rawFingerprint = process.env.PLAY_APP_SIGNING_SHA256?.trim() ?? '';

if (!rawFingerprint) {
  throw new Error(
    'PLAY_APP_SIGNING_SHA256 est requis pour générer assetlinks.json. ' +
      'Copiez l’empreinte SHA-256 depuis Play Console > Configuration > ' +
      'Intégrité de l’application > Certificat de signature de l’application.',
  );
}

const fingerprint = rawFingerprint.toUpperCase();
if (!fingerprintPattern.test(fingerprint)) {
  throw new Error(
    'PLAY_APP_SIGNING_SHA256 doit contenir exactement 32 octets ' +
      'hexadécimaux séparés par des deux-points.',
  );
}

const allowlistDocument = JSON.parse(await readFile(allowlistPath, 'utf8'));
const allowedFingerprints = allowlistDocument.sha256CertFingerprints;
if (
  !Array.isArray(allowedFingerprints) ||
  allowedFingerprints.some(
    (allowedFingerprint) =>
      typeof allowedFingerprint !== 'string' ||
      !fingerprintPattern.test(allowedFingerprint),
  )
) {
  throw new Error('La allowlist Play App Signing versionnée est invalide.');
}
if (!allowedFingerprints.includes(fingerprint)) {
  throw new Error(
    'PLAY_APP_SIGNING_SHA256 ne figure pas dans la allowlist de production ' +
      'versionnée. Ajoutez uniquement l’empreinte du certificat de signature ' +
      'de l’application vérifiée dans Play Console.',
  );
}

const outputPath = process.env.ASSETLINKS_OUTPUT_PATH
  ? resolve(process.env.ASSETLINKS_OUTPUT_PATH)
  : defaultOutput;

const statement = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.appyamatch.yamatch',
      sha256_cert_fingerprints: [fingerprint],
    },
  },
];

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(statement, null, 2)}\n`, 'utf8');
console.log(`assetlinks.json généré : ${outputPath}`);
