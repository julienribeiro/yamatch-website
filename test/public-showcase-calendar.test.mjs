import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../website/script.js', import.meta.url), 'utf8');
// Execute the real isolated showcase IIFE; expose its boundary without starting I/O.
const script = source.slice(source.indexOf('/* PUBLIC TOURNAMENT RAIL'))
  .replace('Array.prototype.forEach.call(sections, init);', 'globalThis.api = { normalizePayload, renderCalendar, render, safeRender, hideSection, wireCalendarProgress, appTicket };');
class Node {
  constructor(tag = 'div') { this.tagName = tag; this.children = []; this.parentNode = null; this.attrs = {}; this.className = ''; this.hidden = true; this.text = ''; this.dataset = {}; this.listeners = new Map(); this.style = { setProperty: (key, value) => { this.style[key] = value; } }; this.scrollLeft = 0; this.clientWidth = 500; this.scrollWidth = 2000; this.left = 0; }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
  get firstChild() { return this.children[0]; }
  get firstElementChild() { return this.firstChild; }
  appendChild(child) { child.remove(); this.children.push(child); child.parentNode = this; return child; }
  insertBefore(child, sibling) { child.remove(); this.children.splice(this.children.indexOf(sibling), 0, child); child.parentNode = this; }
  removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parentNode = null; }
  remove() { this.parentNode?.removeChild(this); }
  setAttribute(key, value) { this.attrs[key] = String(value); if (key === 'class') this.className = value; }
  getAttribute(key) { return this.attrs[key] ?? null; }
  addEventListener(name, callback) { this.listeners.set(name, callback); }
  removeEventListener(name) { this.listeners.delete(name); }
  getBoundingClientRect() { return { left: this.left, width: this.clientWidth }; }
  matches(selector) { if (selector.startsWith('[')) return Object.hasOwn(this.attrs, selector.slice(1, -1)); if (selector.startsWith('.')) return selector.slice(1).split('.').every(name => this.className.split(' ').includes(name)); return this.tagName === selector; }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
function harness(now = '2026-10-22T12:00:00Z', variant = 'participant') {
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return new Date(now).getTime(); } }
  const section = new Node(); section.setAttribute('data-showcase-variant', variant);
  const block = section.appendChild(new Node()); block.setAttribute('data-showcase-rail-block', '');
  const rail = block.appendChild(new Node()); rail.setAttribute('data-showcase-rail', ''); rail.id = 'rail';
  const creation = rail.appendChild(new Node('article')); creation.setAttribute('data-showcase-create', ''); creation.appendChild(new Node('a')).href = '/organisateur/';
  const progress = section.appendChild(new Node()); progress.setAttribute('data-showcase-progress', '');
  const frames = new Map(); let frameId = 0; const events = [];
  const window = { location: { search: '' }, matchMedia: () => ({ matches: true }), requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; }, cancelAnimationFrame: id => frames.delete(id), getComputedStyle: () => ({ paddingLeft: '16px' }), addEventListener() {}, removeEventListener() {}, dispatchEvent: event => events.push(event.type) };
  const document = { querySelectorAll: () => [section], createElement: tag => new Node(tag), createElementNS: (_, tag) => new Node(tag), createTextNode: value => { const node = new Node('#text'); node.textContent = value; return node; } };
  const context = { window, document, Date: Clock, Intl, URL, URLSearchParams, Event };
  vm.runInNewContext(script, context);
  return { ...context.api, section, rail, creation, progress, events, flushFrames() { for (const [id, callback] of frames) { frames.delete(id); callback(); } } };
}
const row = (id, date, extra = {}) => ({ id, date, title: id, teams_count: 3, max_teams: 8, registrations_open: true, ...extra });
const payload = (recent = [], upcoming = []) => ({ stats: { tournaments_played: 0, tournaments_upcoming: 0, teams_registered: 0, players_estimated: 0, organizers: 0, cities: 0 }, recent, upcoming });

test('calendrier conserve 9 joués + 6 à venir, billets H4, CTA unique et création en dernier', () => {
  const h = harness();
  const model = h.normalizePayload(payload(Array.from({ length: 9 }, (_, i) => row('past' + i, '2026-09-' + String(i + 1).padStart(2, '0'))), Array.from({ length: 6 }, (_, i) => row('next' + i, '2026-10-' + (23 + i)))));
  h.render(h.section, model, false);
  assert.equal(h.section.hidden, false);
  assert.equal(h.rail.querySelectorAll('[data-showcase-generated]').length, 15);
  assert.equal(h.rail.querySelectorAll('h4').length, 15);
  assert.equal(h.rail.querySelectorAll('.tp-expand').length, 0);
  assert.equal(h.rail.querySelectorAll('.tp-ticket.is-past').length, 9);
  for (const cta of h.rail.querySelectorAll('.tp-cta')) { assert.match(cta.textContent, /^Voir le tournoi/); assert.match(cta.href, /^\/tournament\/\?id=/); }
  assert.equal(h.rail.children.at(-1).querySelector('ol').children.at(-1).firstChild, h.creation);
  assert.equal(h.creation.querySelector('a').href, '/organisateur/');
  h.render(h.section, model, false);
  assert.equal(h.rail.querySelectorAll('[data-showcase-create]').length, 1);
  assert.equal(h.rail.querySelectorAll('[data-showcase-generated]').length, 15);
});
test('Paris détermine mois/jour, UTC les dates, et passage d’année inclut deux mois vides', () => {
  const h = harness('2026-12-31T23:30:00Z');
  const model = h.normalizePayload(payload([row('played', '2026-12-31')], [row('next', '2027-01-03')]));
  h.renderCalendar(h.rail, model, false);
  assert.deepEqual(h.rail.querySelectorAll('h3').map(node => node.textContent), ['décembre 2026', 'janvier 2027', 'février 2027', 'mars 2027']);
  assert.equal(h.rail.querySelector('.tp-today').textContent, 'Aujourd’hui · 1');
  assert.equal(h.rail.querySelector('.tp-month.is-current').querySelector('h3').textContent, 'janvier 2027');
  assert.equal(h.rail.querySelectorAll('.tp-empty').length, 2);
  assert.equal(h.rail.querySelector('.tp-ticket.is-past').querySelector('time').getAttribute('datetime'), '2026-12-31');
});
test('le classement vient des listes, repère entre joués et à venir, tri et zéro équipe omis', () => {
  const h = harness();
  const model = h.normalizePayload(payload([row('past', '2026-10-30', { teams_count: 0 })], [row('next2', '2026-10-20'), row('next1', '2026-10-01')]));
  h.renderCalendar(h.rail, model, false);
  const cards = h.rail.querySelector('.tp-month.is-current').querySelector('ol').children;
  assert.equal(cards[0].querySelector('h4').textContent, 'past');
  assert.equal(cards[0].querySelector('.tp-count'), null);
  assert.equal(cards[1].className, 'tp-today');
  assert.equal(cards[2].querySelector('h4').textContent, 'next1');
  assert.equal(cards[3].querySelector('h4').textContent, 'next2');
});
test('absence de joués, absence d’à venir, mois passés vides omis et repli premier mois futur', () => {
  const h = harness();
  h.renderCalendar(h.rail, h.normalizePayload(payload([], [row('next', '2026-12-01')])), false);
  assert.equal(h.rail.querySelectorAll('.tp-month.is-past').length, 0);
  assert.equal(h.rail.querySelectorAll('.tp-empty').length, 1);
  h.render(h.section, h.normalizePayload(payload([row('past', '2026-07-10')], [])), false);
  assert.deepEqual(h.rail.querySelectorAll('h3').map(node => node.textContent), ['juillet 2026', 'novembre 2026', 'décembre 2026']);
  h.rail.scrollLeft = 0;
  const future = h.rail.querySelector('.tp-month.is-future'); future.left = 616;
  h.wireCalendarProgress(h.section, h.rail); h.flushFrames();
  assert.equal(h.rail.scrollLeft, 600);
  assert.equal(h.progress.style['--tp-scroll-size'], '25%');
});
test('section vide/invalide/exception cachée, création et ses liens préservés, listeners nettoyés', () => {
  const h = harness();
  const model = h.normalizePayload(payload([], [row('next', '2026-10-24')]));
  h.render(h.section, model, false);
  assert.equal(h.rail.listeners.has('scroll'), true);
  h.safeRender(h.section, null, false);
  assert.equal(h.section.hidden, true);
  assert.equal(h.rail.children.length, 1);
  assert.equal(h.rail.firstChild, h.creation);
  assert.equal(h.rail.listeners.has('scroll'), false);
  h.safeRender(h.section, h.normalizePayload(payload([row('bad/id', '2026-10-24')], [])), false);
  assert.equal(h.section.hidden, true);
  h.safeRender(h.section, { recent: [null], upcoming: [] }, false);
  assert.equal(h.section.hidden, true);
  assert.equal(h.rail.querySelectorAll('.tp-month').length, 0);
  assert.ok(h.events.includes('yamatch:showcase-layout'));
});
test('mode démo inerte, tickets plein/clos secondaires et organisateur conserve six billets récents', () => {
  const h = harness();
  h.renderCalendar(h.rail, h.normalizePayload(payload([], [row('full', '2026-10-24', { teams_count: 8 }), row('closed', '2026-10-25', { registrations_open: false })])), true);
  for (const cta of h.rail.querySelectorAll('.tp-cta')) { assert.equal(cta.tagName, 'span'); assert.equal(cta.getAttribute('aria-disabled'), 'true'); assert.match(cta.className, /is-secondary/); }
  const org = harness(undefined, 'organizer');
  org.render(org.section, org.normalizePayload(payload(Array.from({ length: 9 }, (_, i) => row('past' + i, '2026-09-01')), [row('next', '2026-10-24')])), false);
  assert.equal(org.rail.querySelectorAll('.showcase-ticket').length, 6);
  assert.equal(org.rail.querySelectorAll('h3').length, 6);
  assert.equal(org.rail.querySelector('.tp-month'), null);
  org.render(org.section, org.normalizePayload(payload([], [row('next', '2026-10-24')])), false);
  assert.equal(org.section.hidden, true);
});
