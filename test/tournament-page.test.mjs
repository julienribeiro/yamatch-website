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
  function element(tag = 'div') {
    const attrs = new Map(); const listeners = new Map();
    let text = '';
    return { tagName: tag, style: {}, hidden: true, className: '', children: [],
      get textContent() { return text + this.children.map(child => child.textContent).join(''); },
      set textContent(value) { text = String(value); this.children = []; },
      get firstChild() { return this.children[0] || null; },
      appendChild(child) { this.children.push(child); return child; },
      insertBefore(child) { this.children.unshift(child); return child; },
      setAttribute: (k,v) => attrs.set(k,v), getAttribute: k => attrs.get(k), removeAttribute: k => attrs.delete(k), addEventListener: (k,v) => listeners.set(k,v), click: () => listeners.get('click')?.({ preventDefault() {} }) };
  }
  for (const match of html.matchAll(/id="([^"]+)"/g)) elements[match[1]] = element();
  const window = { location: { search, pathname }, setTimeout: (fn,ms) => { timers.set(ms,fn); return ms; }, clearTimeout: ms => timers.delete(ms), addEventListener() {}, removeEventListener() {} };
  const document = { getElementById: name => elements[name], createElement: element, createElementNS: (_, tag) => element(tag), visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
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
  assert.equal(b.elements.tournamentBody.textContent, 'Eaubonne • 4×4 • Mixte');
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

const publicDetails = { ...tournament, date: '2099-10-24', start_time: '09:00:00', address: 'Gymnase des sports', levels: ['national', 'loisir', 'unexpected', 'preNational'], is_free: false, max_teams: 16, description: '<script>alert(1)</script>\n\nSeconde ligne', terrain: 'Indoor', has_buvette: true, has_accessible_parking: true, has_prizes: true, organizer_name: 'Volley Club', registrations_closed: false, is_closed: false };
test('détails publics: formats, niveaux ordonnés, équipements, texte brut et capacité sans compte inventé', async () => {
  let requested;
  const b = browser(url => { requested = new URL(url); return response([publicDetails]); }); await flush();
  assert.equal(b.elements.tournamentStatus.textContent, 'Inscriptions ouvertes');
  assert.equal(b.elements.tournamentCapacity.textContent, 'Jusqu’à 16 équipes');
  assert.equal(b.elements.openInApp.textContent, 'S’inscrire dans l’app');
  assert.match(b.elements.tournamentFacts.textContent, /9 h 00/);
  assert.match(b.elements.tournamentFacts.textContent, /Loisir · Pré-National · National/);
  assert.doesNotMatch(b.elements.tournamentFacts.textContent, /unexpected/);
  assert.equal(b.elements.tournamentDescription.textContent, publicDetails.description);
  assert.equal(b.elements.tournamentDescription.children.length, 0);
  assert.equal(b.elements.tournamentEquipment.children.length, 4);
  assert.equal(b.elements.tournamentOrganizerInitials.textContent, 'VC');
  assert.equal(b.elements.tournamentHero.getAttribute('aria-busy'), 'false');
  assert.doesNotMatch(requested.searchParams.get('select'), /organizer_(?:phone|email|instagram)|(?:^|,)(?:lat|lng)(?:,|$)|participant/);
  assert.doesNotMatch(html, /class="(?:td-fill|td-podium)"/);
});
test('D3: aucune capacité ne prouve complet, fermeture inscriptions distincte de clôture tournoi', async () => {
  for (const max_teams of [1, 16, 100]) {
    const b = browser(() => response([{ ...publicDetails, max_teams }])); await flush();
    assert.equal(b.elements.tournamentStatus.textContent, 'Inscriptions ouvertes');
    assert.doesNotMatch(b.elements.tournamentPanelTitle.textContent, /complet/i);
  }
  const closed = browser(() => response([{ ...publicDetails, registrations_closed: true }])); await flush();
  assert.equal(closed.elements.tournamentStatus.textContent, 'Inscriptions closes');
  assert.equal(closed.elements.openInApp.className, 'td-cta is-secondary');
  assert.equal(closed.elements.openInApp.textContent, 'Voir dans l’app');
  const finished = browser(() => response([{ ...publicDetails, is_closed: true }])); await flush();
  assert.equal(finished.elements.tournamentPanelTitle.textContent, 'Tournoi terminé');
});
test('joué par date ou statut: pas d’inscription, aucun décompte/podium; annulé prioritaire', async () => {
  for (const changes of [{ status: 'finished' }, { date: '2020-01-01' }]) {
    const b = browser(() => response([{ ...publicDetails, ...changes }])); await flush();
    assert.equal(b.elements.tournamentStatus.textContent, 'Terminé');
    assert.equal(b.elements.tournamentPanelTitle.textContent, 'Tournoi terminé');
    assert.equal(b.elements.tournamentCapacity.hidden, true);
    assert.equal(b.elements.tournamentPriceWrap.hidden, true);
    assert.equal(b.elements.openInApp.hidden, true);
    assert.equal(b.elements.openInApp.getAttribute('aria-disabled'), 'true');
    assert.equal(b.elements.nextTournaments.hidden, false);
    b.elements.openInApp.click(); assert.equal(b.window.location.href, undefined);
  }
  const cancelled = browser(() => response([{ ...publicDetails, status: 'cancelled', date: '2020-01-01' }])); await flush();
  assert.equal(cancelled.elements.tournamentPanelTitle.textContent, 'Tournoi annulé');
  assert.equal(cancelled.elements.tournamentStatus.hidden, true);
  assert.equal(cancelled.elements.tournamentCancelledNote.hidden, false);
});
test('champs absents omis, gratuit explicite, date/heure invalides jamais affichées', async () => {
  const empty = browser(() => response([{ title: 'Minimal', status: 'published', date: '2099-02-30', start_time: '25:70:00' }])); await flush();
  assert.equal(empty.elements.tournamentDate.hidden, true);
  assert.equal(empty.elements.tournamentFactsSection.hidden, true);
  assert.equal(empty.elements.tournamentAboutSection.hidden, true);
  assert.equal(empty.elements.tournamentOrganizer.hidden, true);
  assert.equal(empty.elements.tournamentStatus.textContent, 'À venir');
  const free = browser(() => response([{ ...publicDetails, is_free: true, price_per_team: 0 }])); await flush();
  assert.equal(free.elements.tournamentPrice.textContent, 'Gratuit');
  assert.equal(free.elements.tournamentPriceWrap.hidden, false);
  const malformedPath = browser(() => { throw new Error('unexpected fetch'); }, '', '/tournament/%invalid');
  assert.equal(malformedPath.elements.tournamentBody.textContent, 'Lien de tournoi invalide ou expiré.');
});
