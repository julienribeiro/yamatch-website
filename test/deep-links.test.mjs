import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
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

function environmentWithoutFingerprint(extra = {}) {
  const { PLAY_APP_SIGNING_SHA256: ignored, ...environment } = process.env;
  return { ...environment, ...extra };
}

test('la génération échoue sans empreinte Play App Signing', () => {
  const result = spawnSync(process.execPath, [generator], {
    cwd: repoRoot,
    env: environmentWithoutFingerprint(),
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PLAY_APP_SIGNING_SHA256 est requis/);
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

  const statement = JSON.parse(await readFile(outputPath, 'utf8'));
  assert.equal(statement[0].target.package_name, 'com.appyamatch.yamatch');
  assert.deepEqual(statement[0].target.sha256_cert_fingerprints, [fingerprint]);
});
