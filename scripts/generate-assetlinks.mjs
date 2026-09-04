import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const fingerprintPattern = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;
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

const defaultOutput = fileURLToPath(
  new URL('../website/.well-known/assetlinks.json', import.meta.url),
);
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
