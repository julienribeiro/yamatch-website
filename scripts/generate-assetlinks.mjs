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

const productionPolicy = JSON.parse(
  await readFile(productionAllowlistPath, 'utf8'),
);
const allowlistDocument = requestedAllowlistPath
  ? JSON.parse(await readFile(allowlistPath, 'utf8'))
  : productionPolicy;
const allowedFingerprints = allowlistDocument.sha256CertFingerprints;
const policyRejectedFingerprints = allowlistDocument.rejectedUploadFingerprints;
const productionRejectedFingerprints =
  productionPolicy.rejectedUploadFingerprints;
if (
  !Array.isArray(allowedFingerprints) ||
  !Array.isArray(policyRejectedFingerprints) ||
  !Array.isArray(productionRejectedFingerprints)
) {
  throw new Error('La politique Play App Signing versionnée est invalide.');
}
const allPolicyFingerprints = [
  ...allowedFingerprints,
  ...policyRejectedFingerprints,
  ...productionRejectedFingerprints,
];
if (
  allPolicyFingerprints.some(
    (policyFingerprint) =>
      typeof policyFingerprint !== 'string' ||
      !fingerprintPattern.test(policyFingerprint),
  )
) {
  throw new Error('La politique Play App Signing versionnée est invalide.');
}
const rejectedFingerprints = new Set([
  ...policyRejectedFingerprints,
  ...productionRejectedFingerprints,
]);
if (
  allowedFingerprints.some((fingerprint) =>
    rejectedFingerprints.has(fingerprint),
  )
) {
  throw new Error(
    'Une empreinte Play ne peut pas être autorisée et rejetée simultanément.',
  );
}

const rawFingerprint = process.env.PLAY_APP_SIGNING_SHA256?.trim() ?? '';
if (!rawFingerprint && allowedFingerprints.length > 0) {
  throw new Error(
    'PLAY_APP_SIGNING_SHA256 est requis dès qu’une empreinte Play App Signing ' +
      'est autorisée dans la politique versionnée.',
  );
}

const fingerprint = rawFingerprint.toUpperCase();
if (fingerprint && !fingerprintPattern.test(fingerprint)) {
  throw new Error(
    'PLAY_APP_SIGNING_SHA256 doit contenir exactement 32 octets ' +
      'hexadécimaux séparés par des deux-points.',
  );
}
if (fingerprint && rejectedFingerprints.has(fingerprint)) {
  throw new Error(
    'PLAY_APP_SIGNING_SHA256 correspond à une clé d’upload explicitement ' +
      'rejetée et ne peut pas être publiée dans assetlinks.json.',
  );
}
if (fingerprint && !allowedFingerprints.includes(fingerprint)) {
  throw new Error(
    'PLAY_APP_SIGNING_SHA256 ne figure pas dans la allowlist de production ' +
      'versionnée. Ajoutez uniquement l’empreinte du certificat de signature ' +
      'de l’application vérifiée dans Play Console.',
  );
}

const outputPath = process.env.ASSETLINKS_OUTPUT_PATH
  ? resolve(process.env.ASSETLINKS_OUTPUT_PATH)
  : defaultOutput;

const statements = fingerprint
  ? [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.appyamatch.yamatch',
          sha256_cert_fingerprints: [fingerprint],
        },
      },
    ]
  : [];

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(statements, null, 2)}\n`, 'utf8');
console.log(`assetlinks.json généré : ${outputPath}`);
