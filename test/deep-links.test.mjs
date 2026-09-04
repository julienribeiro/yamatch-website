import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..');
const generator = resolve(repoRoot, 'scripts/generate-assetlinks.mjs');
const validator = resolve(repoRoot, 'scripts/validate-deep-links.mjs');
const fixtureAllowlist = resolve(
  repoRoot,
  'test/fixtures/play-app-signing-sha256.json',
);
const fingerprint = Array(32).fill('AB').join(':');
const differentValidFingerprint = Array(32).fill('CD').join(':');
const rejectedUploadFingerprint =
  '00:78:DD:F9:7E:9F:FD:08:42:39:B3:8A:65:09:38:5B:47:6E:E3:FC:' +
  'B0:C8:DC:B8:6E:C4:A1:6E:43:97:2F:C3';

function environmentWithoutFingerprint(extra = {}) {
  const { PLAY_APP_SIGNING_SHA256: ignored, ...environment } = process.env;
  return { ...environment, ...extra };
}

test('le mode pending génère et valide un assetlinks vide', async (context) => {
  const directory = await mkdtemp(resolve(tmpdir(), 'yamatch-deep-links-'));
  context.after(async () => rm(directory, { recursive: true, force: true }));
  const outputPath = resolve(directory, 'assetlinks.json');
  const environment = environmentWithoutFingerprint({
    ASSETLINKS_OUTPUT_PATH: outputPath,
  });
  const result = spawnSync(process.execPath, [generator], {
    cwd: repoRoot,
    env: environment,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(await readFile(outputPath, 'utf8')), []);

  const validated = spawnSync(process.execPath, [validator], {
    cwd: repoRoot,
    env: environment,
    encoding: 'utf8',
  });
  assert.equal(validated.status, 0, validated.stderr);

  await writeFile(
    outputPath,
    `${JSON.stringify([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.appyamatch.yamatch',
          sha256_cert_fingerprints: [rejectedUploadFingerprint],
        },
      },
    ])}\n`,
    'utf8',
  );
  const leakedUploadKey = spawnSync(process.execPath, [validator], {
    cwd: repoRoot,
    env: environment,
    encoding: 'utf8',
  });
  assert.notEqual(leakedUploadKey.status, 0);
  assert.match(leakedUploadKey.stderr, /doit rester vide/);
});

test('une allowlist active exige son empreinte Play App Signing', async (context) => {
  const directory = await mkdtemp(resolve(tmpdir(), 'yamatch-deep-links-'));
  context.after(async () => rm(directory, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [generator], {
    cwd: repoRoot,
    env: environmentWithoutFingerprint({
      NODE_ENV: 'test',
      ASSETLINKS_ALLOWLIST_PATH: fixtureAllowlist,
      ASSETLINKS_OUTPUT_PATH: resolve(directory, 'assetlinks.json'),
    }),
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requis dès qu’une empreinte Play App Signing/);
});

test('la clé d’upload connue ne peut jamais être publiée', async (context) => {
  const directory = await mkdtemp(resolve(tmpdir(), 'yamatch-deep-links-'));
  context.after(async () => rm(directory, { recursive: true, force: true }));
  const outputPath = resolve(directory, 'assetlinks.json');
  const environment = environmentWithoutFingerprint({
    PLAY_APP_SIGNING_SHA256: rejectedUploadFingerprint,
    ASSETLINKS_OUTPUT_PATH: outputPath,
  });
  const result = spawnSync(process.execPath, [generator], {
    cwd: repoRoot,
    env: environment,
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /clé d’upload explicitement rejetée/);

  await writeFile(outputPath, '[]\n', 'utf8');
  const validated = spawnSync(process.execPath, [validator], {
    cwd: repoRoot,
    env: environment,
    encoding: 'utf8',
  });
  assert.notEqual(validated.status, 0);
  assert.match(validated.stderr, /clé d’upload explicitement rejetée/);
});

test('la génération refuse une empreinte invalide', () => {
  const result = spawnSync(process.execPath, [generator], {
    cwd: repoRoot,
    env: environmentWithoutFingerprint({ PLAY_APP_SIGNING_SHA256: 'placeholder' }),
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exactement 32 octets/);
});

test('une empreinte de fixture est refusée en mode production', async (context) => {
  const directory = await mkdtemp(resolve(tmpdir(), 'yamatch-deep-links-'));
  context.after(async () => rm(directory, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [generator], {
    cwd: repoRoot,
    env: environmentWithoutFingerprint({
      PLAY_APP_SIGNING_SHA256: fingerprint,
      ASSETLINKS_OUTPUT_PATH: resolve(directory, 'assetlinks.json'),
    }),
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /allowlist de production versionnée/);
});

test('les contrats natifs et les sept fallbacks sont validés', async (context) => {
  const directory = await mkdtemp(resolve(tmpdir(), 'yamatch-deep-links-'));
  context.after(async () => rm(directory, { recursive: true, force: true }));
  const outputPath = resolve(directory, 'assetlinks.json');
  const environment = environmentWithoutFingerprint({
    NODE_ENV: 'test',
    PLAY_APP_SIGNING_SHA256: fingerprint,
    ASSETLINKS_ALLOWLIST_PATH: fixtureAllowlist,
    ASSETLINKS_OUTPUT_PATH: outputPath,
  });

  const generated = spawnSync(process.execPath, [generator], {
    cwd: repoRoot,
    env: environment,
    encoding: 'utf8',
  });
  assert.equal(generated.status, 0, generated.stderr);

  const validated = spawnSync(process.execPath, [validator], {
    cwd: repoRoot,
    env: environment,
    encoding: 'utf8',
  });
  assert.equal(validated.status, 0, validated.stderr);

  const statements = JSON.parse(await readFile(outputPath, 'utf8'));
  assert.equal(statements.length, 1);
  assert.deepEqual(statements[0].relation, [
    'delegate_permission/common.handle_all_urls',
  ]);
  assert.equal(statements[0].target.package_name, 'com.appyamatch.yamatch');
  assert.deepEqual(statements[0].target.sha256_cert_fingerprints, [fingerprint]);

  const wrongRelation = structuredClone(statements);
  wrongRelation[0].relation = ['delegate_permission/common.get_login_creds'];
  await writeFile(outputPath, `${JSON.stringify(wrongRelation)}\n`, 'utf8');
  const invalidRelation = spawnSync(process.execPath, [validator], {
    cwd: repoRoot,
    env: environment,
    encoding: 'utf8',
  });
  assert.notEqual(invalidRelation.status, 0);
  assert.match(invalidRelation.stderr, /relation Android attendue/);

  await writeFile(
    outputPath,
    `${JSON.stringify([statements[0], statements[0]])}\n`,
    'utf8',
  );
  const duplicateStatement = spawnSync(process.execPath, [validator], {
    cwd: repoRoot,
    env: environment,
    encoding: 'utf8',
  });
  assert.notEqual(duplicateStatement.status, 0);
  assert.match(duplicateStatement.stderr, /exactement un statement Android/);

  const extraStatementKey = structuredClone(statements);
  extraStatementKey[0].unexpected = true;
  await writeFile(outputPath, `${JSON.stringify(extraStatementKey)}\n`, 'utf8');
  const invalidStatementShape = spawnSync(process.execPath, [validator], {
    cwd: repoRoot,
    env: environment,
    encoding: 'utf8',
  });
  assert.notEqual(invalidStatementShape.status, 0);
  assert.match(invalidStatementShape.stderr, /statement Android.*forme exacte/);

  const extraTargetKey = structuredClone(statements);
  extraTargetKey[0].target.unexpected = true;
  await writeFile(outputPath, `${JSON.stringify(extraTargetKey)}\n`, 'utf8');
  const invalidTargetShape = spawnSync(process.execPath, [validator], {
    cwd: repoRoot,
    env: environment,
    encoding: 'utf8',
  });
  assert.notEqual(invalidTargetShape.status, 0);
  assert.match(invalidTargetShape.stderr, /cible Android.*forme exacte/);

  const invalidTargets = [
    ['namespace', 'web'],
    ['package_name', 'com.example.other'],
    ['sha256_cert_fingerprints', ['invalid']],
    ['sha256_cert_fingerprints', [fingerprint, fingerprint]],
    ['sha256_cert_fingerprints', [differentValidFingerprint]],
  ];
  for (const [field, value] of invalidTargets) {
    const invalidTarget = structuredClone(statements);
    invalidTarget[0].target[field] = value;
    await writeFile(outputPath, `${JSON.stringify(invalidTarget)}\n`, 'utf8');
    const invalidTargetResult = spawnSync(process.execPath, [validator], {
      cwd: repoRoot,
      env: environment,
      encoding: 'utf8',
    });
    assert.notEqual(invalidTargetResult.status, 0, `${field} doit être refusé`);
    assert.match(invalidTargetResult.stderr, /contrat Android prod/);
  }
});
