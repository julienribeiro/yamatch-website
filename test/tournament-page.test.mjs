import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { validateTournamentConfig } from '../scripts/validate-tournament-config.mjs';

const html = await readFile(new URL('../website/tournament/index.html', import.meta.url), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
const id = '35c50b14-cc6c-4d21-ae21-9dc488b6016a';
const tournament = { title: 'Open Volley', players_per_team: 4, gender: 'Mixte', location: 'Eaubonne', price_per_team: 40, status: 'published' };
const flush = () => new Promise(resolve => setImmediate(resolve));
function browser(fetch, search = '?id=' + id, pathname = '/tournament/') {
  const timers = new Map();
  const elements = {};
  for (const name of ['tournamentTitle', 'tournamentBody', 'tournamentCancelledNote', 'tournamentPriceWrap', 'tournamentPrice', 'openInApp', 'retryTournament']) {
    const attrs = new Map(); const listeners = new Map();
    elements[name] = { style: {}, hidden: true, textContent: '', setAttribute: (k,v) => attrs.set(k,v), getAttribute: k => attrs.get(k), removeAttribute: k => attrs.delete(k), addEventListener: (k,v) => listeners.set(k,v), click: () => listeners.get('click')?.({ preventDefault() {} }) };
  }
  const window = { location: { search, pathname }, setTimeout: (fn,ms) => { timers.set(ms,fn); return ms; }, clearTimeout: ms => timers.delete(ms), addEventListener() {}, removeEventListener() {} };
  const document = { getElementById: name => elements[name], visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
  vm.runInNewContext(script, { window, document, navigator: { userAgent: 'iPhone' }, URLSearchParams, AbortController, fetch });
  return { elements, timers, window };
}
const response = rows => Promise.resolve({ ok: true, json: () => Promise.resolve(rows) });

test('le build rejette une URL ou clé staging indépendamment', () => {
  validateTournamentConfig(html);
  assert.throws(() => validateTournamentConfig(html.replace('https://kxwmjjgtnrhcpgopevzb.supabase.co', 'https://uqxjxkxcbsjcscrrlwae.supabase.co')));
  assert.throws(() => validateTournamentConfig(html.replace('sb_publishable_Y-UOHfc7Z5wVnKhTTlb7iA_umRJArOf', 'sb_publishable_wrong')));
});
test('le tournoi PROD est rendu et ouvre app puis store ; téléchargement indépendant', async () => {
  let requested;
  const b = browser((url, options) => { requested = { url, options }; return response([tournament]); });
  await flush();
  assert.match(requested.url, /^https:\/\/kxwmjjgtnrhcpgopevzb.supabase.co\/rest\/v1\/tournaments/);
  assert.equal(b.elements.tournamentTitle.textContent, 'Open Volley');
  assert.equal(b.elements.tournamentBody.textContent, '4v4 · Mixte · Eaubonne');
  assert.equal(b.elements.tournamentPrice.textContent, '40 €');
  assert.equal(b.timers.has(10000), false);
  b.elements.openInApp.click();
  assert.equal(b.window.location.href, 'com.appyamatch.yamatch://tournament/' + id);
  b.timers.get(1500)();
  assert.match(b.window.location.href, /apps.apple.com/);
  assert.match(html, /href="\/download\/">Télécharger Yamatch/);
  assert.match(html, /Après installation, rouvre le lien reçu/);
});
test('absence seule affiche introuvable, erreur HTTP et réseau proposent retry', async () => {
  for (const fetch of [() => Promise.reject(new Error('offline')), () => Promise.resolve({ ok: false, status: 503 }), () => response({ error: 'malformed' })]) {
    const b = browser(fetch); await flush();
    assert.equal(b.elements.tournamentTitle.textContent, 'Chargement impossible');
    assert.equal(b.elements.retryTournament.hidden, false);
    assert.equal(b.elements.openInApp.getAttribute('aria-disabled'), 'true');
  }
  const b = browser(() => response([])); await flush();
  assert.equal(b.elements.tournamentTitle.textContent, 'Tournoi introuvable');
  assert.equal(b.elements.retryTournament.hidden, true);
});
test('timeout annule puis retry réussi, double tap ne duplique pas la requête', async () => {
  let calls = 0;
  const b = browser((url, { signal }) => {
    calls++;
    if (calls > 1) return response([tournament]);
    return new Promise((resolve,reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
  });
  b.timers.get(10000)(); await flush();
  assert.equal(b.elements.tournamentTitle.textContent, 'Chargement impossible');
  b.elements.retryTournament.click(); b.elements.retryTournament.click(); await flush();
  assert.equal(calls, 2);
  assert.equal(b.elements.tournamentTitle.textContent, 'Open Volley');
  assert.equal(b.elements.retryTournament.hidden, true);
});
test('path direct, annulé et gratuit restent compatibles ; lien invalide ne fetch pas', async () => {
  const b = browser(() => response([{ ...tournament, status: 'cancelled', price_per_team: 0 }]), '', '/tournament/' + id);
  await flush();
  assert.equal(b.elements.tournamentCancelledNote.hidden, false);
  assert.equal(b.elements.tournamentPriceWrap.hidden, true);
  assert.equal(b.elements.openInApp.getAttribute('aria-disabled'), 'true');
  const invalid = browser(() => { throw new Error('unexpected fetch'); }, '?id=%3Cbad%3E');
  assert.equal(invalid.elements.tournamentBody.textContent, 'Lien de tournoi invalide ou expiré.');
});
