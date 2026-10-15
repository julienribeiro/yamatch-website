/* Vitrine « Ça joue déjà » — preuve sociale alimentée par la RPC publique PROD
   `get_public_showcase` (migration yamatch `20261015120000_public_showcase.sql`).

   Règles non négociables :
   - Aucun chiffre ni tournoi inventé n'est publié. Les sections `[data-showcase]`
     sont `hidden` dans le HTML et ne sont révélées qu'avec un payload valide
     au-dessus de MIN_TOURNAMENTS_PLAYED. Échec, 404, timeout, payload invalide
     ou volume trop faible → section masquée, aucun message au visiteur.
   - Rendu XSS-safe : textContent uniquement, URLs d'images limitées à https.
   - `?showcase=demo` affiche un payload explicitement fictif, signalé à l'écran,
     pour relire le design avant déploiement. Jamais sans ce paramètre. */
(function () {
    'use strict';

    var sections = document.querySelectorAll('[data-showcase]');
    if (!sections.length) return;

    // Public production configuration (same publishable key as /tournament/).
    var SUPABASE_URL = 'https://kxwmjjgtnrhcpgopevzb.supabase.co';
    var SUPABASE_ANON_KEY = 'sb_publishable_Y-UOHfc7Z5wVnKhTTlb7iA_umRJArOf';
    var RPC_PATH = '/rest/v1/rpc/get_public_showcase';
    var FETCH_TIMEOUT_MS = 10000;

    var CACHE_KEY = 'yamatch.showcase.v1';
    var CACHE_TTL_MS = 10 * 60 * 1000;

    // Below this, the numbers would undermine trust rather than build it.
    var MIN_TOURNAMENTS_PLAYED = 3;

    var MAX_RECENT = 9;
    var MAX_UPCOMING = 6;
    var MAX_ORGANIZERS = 12;
    var MAX_ORGANIZER_RAIL = 6;
    var MAX_STAT_VALUE = 10000000;
    var MAX_TEXT_LENGTH = 120;

    var PREFETCH_ROOT_MARGIN = '600px 0px';
    var COUNT_UP_MS = 1200;
    var COUNT_UP_THRESHOLD = 0.35;

    var ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
    var DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
    var SVG_NS = 'http://www.w3.org/2000/svg';
    var PIN_PATH = 'M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z';

    var reduceMotionQuery = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    var numberFormatter = new Intl.NumberFormat('fr-FR');
    var dateFormatter = new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
    });

    var isDemo = (function () {
        try {
            return new URLSearchParams(window.location.search).get('showcase') === 'demo';
        } catch (e) {
            return false;
        }
    })();

    var payloadPromise = null;

    function prefersReducedMotion() {
        return !!(reduceMotionQuery && reduceMotionQuery.matches);
    }

    /* ---------- Formatting ---------- */

    var NBSP = '\u00A0';

    // fr-FR groups with U+202F; NBSP has wider font coverage and is the house style.
    function formatNumber(value) {
        return numberFormatter.format(value).replace(/[\u202F ]/g, NBSP);
    }

    // « 15 oct. 2026 » must never break between the day, month and year.
    function formatDate(isoDate) {
        var m = DATE_PATTERN.exec(isoDate);
        if (!m) return '';
        return dateFormatter.format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))).replace(/[\u202F ]/g, NBSP);
    }

    function countLabel(count, singular, pluralForm) {
        return formatNumber(count) + NBSP + plural(count, singular, pluralForm);
    }

    function plural(count, singular, pluralForm) {
        return count >= 2 ? pluralForm : singular;
    }

    function initials(name) {
        var words = String(name).split(/[\s\-–—'’]+/).filter(function (w) {
            return /[A-Za-zÀ-ÿ0-9]/.test(w);
        });
        var letters = words.slice(0, 2).map(function (w) {
            return Array.from(w)[0];
        }).join('');
        return (letters || '?').toLocaleUpperCase('fr-FR');
    }

    /* ---------- Validation ---------- */

    function cleanText(value) {
        if (typeof value !== 'string') return null;
        var text = value.replace(/\s+/g, ' ').trim();
        if (!text) return null;
        if (text.length > MAX_TEXT_LENGTH) text = text.slice(0, MAX_TEXT_LENGTH - 1).trim() + '…';
        return text;
    }

    function toCount(value) {
        return (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_STAT_VALUE)
            ? value : null;
    }

    function toPositiveInt(value, max) {
        return (typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= max)
            ? value : null;
    }

    function safeHttpsUrl(value) {
        if (typeof value !== 'string' || value.length > 2048) return null;
        try {
            var url = new URL(value);
            return url.protocol === 'https:' ? url.href : null;
        } catch (e) {
            return null;
        }
    }

    function validDate(value) {
        if (typeof value !== 'string') return null;
        var m = DATE_PATTERN.exec(value);
        if (!m) return null;
        var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
        return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? value : null;
    }

    function normalizeTournament(raw, withRegistration) {
        if (!raw || typeof raw !== 'object') return null;
        var id = typeof raw.id === 'string' && ID_PATTERN.test(raw.id) ? raw.id : null;
        var title = cleanText(raw.title);
        var date = validDate(raw.date);
        if (!id || !title || !date) return null;
        var tournament = {
            id: id,
            title: title,
            date: date,
            city: cleanText(raw.city),
            organizerName: cleanText(raw.organizer_name),
            organizerLogoUrl: safeHttpsUrl(raw.organizer_logo_url),
            teamsCount: toCount(raw.teams_count) || 0,
            maxTeams: toPositiveInt(raw.max_teams, 10000),
            playersPerTeam: toPositiveInt(raw.players_per_team, 30)
        };
        if (withRegistration) tournament.registrationsOpen = raw.registrations_open === true;
        return tournament;
    }

    function normalizeOrganizer(raw) {
        if (!raw || typeof raw !== 'object') return null;
        var name = cleanText(raw.name);
        if (!name) return null;
        return {
            name: name,
            logoUrl: safeHttpsUrl(raw.logo_url),
            city: cleanText(raw.city),
            tournamentsCount: toCount(raw.tournaments_count) || 0,
            teamsCount: toCount(raw.teams_count) || 0
        };
    }

    function normalizeList(list, mapper, max) {
        var out = [];
        for (var i = 0; i < list.length && out.length < max; i++) {
            var item = mapper(list[i]);
            if (item) out.push(item);
        }
        return out;
    }

    // Returns a render model, or null when the payload breaks the contract.
    function normalizePayload(data) {
        if (Array.isArray(data) && data.length === 1) data = data[0];
        if (data && typeof data === 'object' && data.get_public_showcase) data = data.get_public_showcase;
        if (!data || typeof data !== 'object' || !data.stats || typeof data.stats !== 'object') return null;
        if (!Array.isArray(data.recent) || !Array.isArray(data.upcoming)) return null;

        var keys = ['tournaments_played', 'tournaments_upcoming', 'teams_registered',
            'players_estimated', 'organizers', 'cities'];
        var stats = {};
        for (var i = 0; i < keys.length; i++) {
            var v = toCount(data.stats[keys[i]]);
            if (v === null) return null;
            stats[keys[i]] = v;
        }

        return {
            stats: stats,
            recent: normalizeList(data.recent, function (t) { return normalizeTournament(t, false); }, MAX_RECENT),
            upcoming: normalizeList(data.upcoming, function (t) { return normalizeTournament(t, true); }, MAX_UPCOMING),
            organizers: Array.isArray(data.organizers_list)
                ? normalizeList(data.organizers_list, normalizeOrganizer, MAX_ORGANIZERS)
                : []
        };
    }

    function isCredible(model) {
        return !!model && model.stats.tournaments_played >= MIN_TOURNAMENTS_PLAYED;
    }

    /* ---------- Data loading ---------- */

    function readCache() {
        try {
            var raw = window.sessionStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var entry = JSON.parse(raw);
            if (!entry || typeof entry.savedAt !== 'number') return null;
            var age = Date.now() - entry.savedAt;
            if (age < 0 || age > CACHE_TTL_MS) return null;
            return entry.payload;
        } catch (e) {
            return null;
        }
    }

    function writeCache(payload) {
        try {
            window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), payload: payload }));
        } catch (e) { /* storage disabled or full: caching is optional */ }
    }

    function fetchShowcase() {
        var controller = typeof AbortController === 'function' ? new AbortController() : null;
        var timeout = window.setTimeout(function () {
            if (controller) controller.abort();
        }, FETCH_TIMEOUT_MS);
        return fetch(SUPABASE_URL + RPC_PATH, {
            signal: controller ? controller.signal : undefined,
            method: 'POST',
            credentials: 'omit',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: '{}'
        }).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        }).then(function (data) {
            window.clearTimeout(timeout);
            return data;
        }, function (err) {
            window.clearTimeout(timeout);
            throw err;
        });
    }

    // Resolves to a credible render model or rejects. Shared across sections.
    function loadModel() {
        if (payloadPromise) return payloadPromise;
        payloadPromise = fetchShowcase().then(function (data) {
            var model = normalizePayload(data);
            if (!isCredible(model)) throw new Error('showcase_unavailable');
            writeCache(data);
            return model;
        });
        return payloadPromise;
    }

    function demoPayload() {
        function shift(days) {
            var d = new Date();
            d.setUTCDate(d.getUTCDate() + days);
            return d.toISOString().slice(0, 10);
        }
        return {
            generated_at: new Date().toISOString(),
            stats: {
                tournaments_played: 42, tournaments_upcoming: 6, teams_registered: 512,
                players_estimated: 2140, organizers: 14, cities: 9
            },
            upcoming: [
                { id: 'demo-u1', title: 'Démo · Open d’automne 4×4', city: 'Démoville', date: shift(9), organizer_name: 'Association Démo Volley', organizer_logo_url: null, teams_count: 14, max_teams: 16, players_per_team: 4, registrations_open: true },
                { id: 'demo-u2', title: 'Démo · Tournoi mixte du dimanche', city: 'Exempleville', date: shift(16), organizer_name: 'Club Fictif Beach', organizer_logo_url: null, teams_count: 6, max_teams: 24, players_per_team: 3, registrations_open: true },
                { id: 'demo-u3', title: 'Démo · Nuit du volley', city: 'Démoville', date: shift(23), organizer_name: 'Association Démo Volley', organizer_logo_url: null, teams_count: 20, max_teams: 20, players_per_team: 6, registrations_open: false }
            ],
            recent: [
                { id: 'demo-r1', title: 'Démo · Challenge de rentrée', city: 'Fictifbourg', date: shift(-6), organizer_name: 'Volley Club Exemple', organizer_logo_url: null, teams_count: 18, max_teams: 18, players_per_team: 4 },
                { id: 'demo-r2', title: 'Démo · Green Volley Cup', city: 'Exempleville', date: shift(-13), organizer_name: 'Club Fictif Beach', organizer_logo_url: null, teams_count: 24, max_teams: 24, players_per_team: 2 },
                { id: 'demo-r3', title: 'Démo · Tournoi des entreprises', city: null, date: shift(-20), organizer_name: null, organizer_logo_url: null, teams_count: 12, max_teams: 16, players_per_team: 6 },
                { id: 'demo-r4', title: 'Démo · Open de fin d’été avec un titre volontairement très long', city: 'Démoville', date: shift(-34), organizer_name: 'Association Démo Volley', organizer_logo_url: null, teams_count: 16, max_teams: 16, players_per_team: 4 }
            ],
            organizers_list: [
                { name: 'Association Démo Volley', logo_url: null, city: 'Démoville', tournaments_count: 7, teams_count: 104 },
                { name: 'Club Fictif Beach', logo_url: null, city: 'Exempleville', tournaments_count: 4, teams_count: 72 },
                { name: 'Volley Club Exemple', logo_url: null, city: 'Fictifbourg', tournaments_count: 3, teams_count: 46 },
                { name: 'Comité Démo des Sports', logo_url: null, city: null, tournaments_count: 1, teams_count: 12 }
            ]
        };
    }

    /* ---------- DOM helpers ---------- */

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    }

    function srText(text) {
        return el('span', 'showcase-sr', text);
    }

    function clear(node) {
        while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function pinIcon() {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '14');
        svg.setAttribute('height', '14');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.setAttribute('class', 'showcase-pin');
        var path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', PIN_PATH);
        path.setAttribute('fill', 'currentColor');
        path.setAttribute('fill-rule', 'evenodd');
        svg.appendChild(path);
        return svg;
    }

    function initialsBadge(name, sizeClass) {
        var span = el('span', 'showcase-avatar showcase-avatar--initials ' + sizeClass, initials(name));
        span.setAttribute('aria-hidden', 'true');
        return span;
    }

    function avatar(name, logoUrl, sizeClass, px) {
        if (!logoUrl) return initialsBadge(name, sizeClass);
        var img = document.createElement('img');
        img.className = 'showcase-avatar ' + sizeClass;
        img.alt = 'Logo de ' + name;
        img.width = px;
        img.height = px;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.addEventListener('error', function () {
            if (img.parentNode) img.parentNode.replaceChild(initialsBadge(name, sizeClass), img);
        }, { once: true });
        img.src = logoUrl;
        return img;
    }

    /* ---------- Components ---------- */

    function ticket(t, kind, demo) {
        var upcoming = kind === 'upcoming';
        var item = el('li', 'showcase-rail-item');
        var card = el('article', 'showcase-ticket showcase-ticket--' + kind);

        var top = el('div', 'showcase-ticket-top');
        top.appendChild(el('span', 'showcase-badge showcase-badge--' + kind, upcoming ? 'À venir' : 'Terminé'));
        var time = el('time', 'showcase-ticket-date', formatDate(t.date));
        time.setAttribute('datetime', t.date);
        top.appendChild(time);
        card.appendChild(top);

        var body = el('div', 'showcase-ticket-body');
        body.appendChild(el('h4', 'showcase-ticket-title', t.title));

        var metaParts = [];
        if (t.city) metaParts.push(t.city);
        if (t.playersPerTeam) metaParts.push('Équipes de' + NBSP + t.playersPerTeam);
        if (metaParts.length) {
            var meta = el('p', 'showcase-ticket-meta');
            if (t.city) meta.appendChild(pinIcon());
            meta.appendChild(el('span', null, metaParts.join(' · ')));
            body.appendChild(meta);
        }

        if (upcoming) {
            body.appendChild(gauge(t));
        } else if (t.teamsCount > 0) {
            body.appendChild(el('p', 'showcase-ticket-teams',
                countLabel(t.teamsCount, 'équipe a joué', 'équipes ont joué')));
        }

        if (t.organizerName) {
            var org = el('p', 'showcase-ticket-org');
            org.appendChild(avatar(t.organizerName, t.organizerLogoUrl, 'showcase-avatar--sm', 32));
            var orgName = el('span', 'showcase-ticket-org-name');
            orgName.appendChild(srText('Organisé par '));
            orgName.appendChild(document.createTextNode(t.organizerName));
            org.appendChild(orgName);
            body.appendChild(org);
        }

        // Demo ids do not exist in /tournament/: no dead link in the preview.
        if (upcoming && !demo) {
            var link = el('a', 'showcase-ticket-cta');
            link.href = '/tournament/?id=' + encodeURIComponent(t.id);
            link.appendChild(document.createTextNode('Voir le tournoi'));
            link.appendChild(srText(NBSP + ': ' + t.title));
            var arrow = el('span', null, ' →');
            arrow.setAttribute('aria-hidden', 'true');
            link.appendChild(arrow);
            body.appendChild(link);
        }

        card.appendChild(body);
        item.appendChild(card);
        return item;
    }

    function gauge(t) {
        var wrap = el('div', 'showcase-gauge');
        var full = t.maxTeams !== null && t.teamsCount >= t.maxTeams;
        var label;
        if (t.maxTeams !== null) {
            label = formatNumber(t.teamsCount) + '/' + countLabel(t.maxTeams, 'équipe', 'équipes');
        } else {
            label = countLabel(t.teamsCount, 'équipe inscrite', 'équipes inscrites');
        }
        var row = el('p', 'showcase-gauge-label');
        row.appendChild(el('span', null, label));
        var status = full ? 'Complet' : (t.registrationsOpen ? 'Inscriptions ouvertes' : 'Inscriptions closes');
        row.appendChild(el('span', 'showcase-gauge-status' + (full || !t.registrationsOpen ? ' is-closed' : ''), status));
        wrap.appendChild(row);
        if (t.maxTeams !== null) {
            var track = el('span', 'showcase-gauge-track');
            track.setAttribute('aria-hidden', 'true');
            var fill = el('span', 'showcase-gauge-fill');
            fill.style.setProperty('--showcase-fill', String(Math.min(1, t.teamsCount / t.maxTeams)));
            track.appendChild(fill);
            wrap.appendChild(track);
        }
        return wrap;
    }

    function organizerCard(o) {
        var item = el('li', 'showcase-org');
        item.appendChild(avatar(o.name, o.logoUrl, 'showcase-avatar--lg', 48));
        var text = el('div', 'showcase-org-text');
        text.appendChild(el('p', 'showcase-org-name', o.name));
        if (o.city) text.appendChild(el('p', 'showcase-org-city', o.city));
        var counts = [];
        if (o.tournamentsCount > 0) counts.push(countLabel(o.tournamentsCount, 'tournoi', 'tournois'));
        if (o.teamsCount > 0) counts.push(countLabel(o.teamsCount, 'équipe', 'équipes'));
        if (counts.length) text.appendChild(el('p', 'showcase-org-count', counts.join(' · ')));
        item.appendChild(text);
        return item;
    }

    function statDefinitions(variant, s) {
        if (variant === 'organizer') {
            var organized = s.tournaments_played + s.tournaments_upcoming;
            return [
                { value: s.organizers, label: plural(s.organizers, 'Structure organisatrice', 'Structures organisatrices') },
                { value: organized, label: plural(organized, 'Tournoi organisé', 'Tournois organisés') },
                { value: s.teams_registered, label: plural(s.teams_registered, 'Équipe accueillie', 'Équipes accueillies') },
                { value: s.cities, label: plural(s.cities, 'Ville', 'Villes') }
            ];
        }
        return [
            { value: s.tournaments_played, label: plural(s.tournaments_played, 'Tournoi joué', 'Tournois joués') },
            { value: s.teams_registered, label: plural(s.teams_registered, 'Équipe inscrite', 'Équipes inscrites') },
            { value: s.players_estimated, label: 'Joueurs sur les terrains', prefix: '+', srPrefix: 'Plus de ' },
            { value: s.cities, label: plural(s.cities, 'Ville', 'Villes') }
        ];
    }

    function renderStats(list, variant, stats) {
        clear(list);
        var defs = statDefinitions(variant, stats).filter(function (d) { return d.value > 0; });
        list.style.setProperty('--showcase-stat-count', String(defs.length));
        var counters = [];
        defs.forEach(function (d) {
            var prefix = d.prefix || '';
            var item = el('li', 'showcase-stat');
            var value = el('span', 'showcase-stat-value');
            value.setAttribute('aria-hidden', 'true');
            // The ghost reserves the final width so counting never reflows the row.
            value.appendChild(el('span', 'showcase-stat-ghost', prefix + formatNumber(d.value)));
            var live = el('span', 'showcase-stat-live', prefix + formatNumber(d.value));
            value.appendChild(live);
            item.appendChild(value);
            var label = el('span', 'showcase-stat-label', d.label);
            label.setAttribute('aria-hidden', 'true');
            item.appendChild(label);
            item.appendChild(srText((d.srPrefix || '') + formatNumber(d.value) + NBSP + d.label.toLocaleLowerCase('fr-FR')));
            list.appendChild(item);
            counters.push({ node: live, target: d.value, prefix: prefix });
        });
        armCountUp(list, counters);
    }

    function armCountUp(list, counters) {
        if (!counters.length || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
        counters.forEach(function (c) { c.node.textContent = c.prefix + '0'; });
        var observer = new IntersectionObserver(function (entries) {
            if (!entries.some(function (e) { return e.isIntersecting; })) return;
            observer.disconnect();
            if (prefersReducedMotion()) {
                counters.forEach(function (c) { c.node.textContent = c.prefix + formatNumber(c.target); });
                return;
            }
            var start = null;
            function frame(now) {
                if (start === null) start = now;
                var progress = Math.min(1, (now - start) / COUNT_UP_MS);
                var eased = 1 - Math.pow(1 - progress, 3);
                counters.forEach(function (c) {
                    c.node.textContent = c.prefix + formatNumber(Math.round(c.target * eased));
                });
                if (progress < 1) window.requestAnimationFrame(frame);
            }
            window.requestAnimationFrame(frame);
        }, { threshold: COUNT_UP_THRESHOLD });
        observer.observe(list);
    }

    function wireRailNav(block, rail) {
        var prev = block.querySelector('[data-showcase-prev]');
        var next = block.querySelector('[data-showcase-next]');
        if (!prev || !next || rail.dataset.showcaseNav === 'ready') return;
        rail.dataset.showcaseNav = 'ready';
        var pending = false;

        function step() {
            var first = rail.firstElementChild;
            if (!first) return rail.clientWidth;
            var gap = parseFloat(window.getComputedStyle(rail).columnGap) || 0;
            return first.getBoundingClientRect().width + gap;
        }
        function update() {
            pending = false;
            var max = rail.scrollWidth - rail.clientWidth;
            // aria-disabled (not `disabled`) keeps focus on the button at the rail ends.
            prev.setAttribute('aria-disabled', String(rail.scrollLeft <= 1));
            next.setAttribute('aria-disabled', String(rail.scrollLeft >= max - 1));
        }
        function schedule() {
            if (pending) return;
            pending = true;
            window.requestAnimationFrame(update);
        }
        function go(direction, button) {
            if (button.getAttribute('aria-disabled') === 'true') return;
            rail.scrollBy({ left: direction * step(), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        }
        prev.addEventListener('click', function () { go(-1, prev); });
        next.addEventListener('click', function () { go(1, next); });
        rail.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        schedule();
    }

    /* ---------- Section lifecycle ---------- */

    function containers(section) {
        return {
            stats: section.querySelector('[data-showcase-stats]'),
            railBlock: section.querySelector('[data-showcase-rail-block]'),
            rail: section.querySelector('[data-showcase-rail]'),
            wallBlock: section.querySelector('[data-showcase-wall-block]'),
            wall: section.querySelector('[data-showcase-wall]')
        };
    }

    function hideSection(section) {
        section.hidden = true;
        var c = containers(section);
        clear(c.stats);
        clear(c.rail);
        clear(c.wall);
    }

    function render(section, model, demo) {
        var variant = section.getAttribute('data-showcase-variant') === 'organizer' ? 'organizer' : 'participant';
        var c = containers(section);

        if (demo && !section.querySelector('.showcase-demo-note')) {
            var note = el('p', 'showcase-demo-note', 'Aperçu démo — données fictives, non publiées');
            section.insertBefore(note, section.firstElementChild);
        }

        if (c.stats) {
            c.stats.removeAttribute('aria-hidden');
            renderStats(c.stats, variant, model.stats);
        }

        if (c.rail && c.railBlock) {
            clear(c.rail);
            c.rail.removeAttribute('aria-hidden');
            var items = variant === 'organizer'
                ? model.recent.slice(0, MAX_ORGANIZER_RAIL).map(function (t) { return ticket(t, 'played', demo); })
                : model.upcoming.map(function (t) { return ticket(t, 'upcoming', demo); })
                    .concat(model.recent.map(function (t) { return ticket(t, 'played', demo); }));
            items.forEach(function (node) { c.rail.appendChild(node); });
            c.railBlock.hidden = items.length === 0;
            if (items.length) wireRailNav(c.railBlock, c.rail);
        }

        if (c.wall && c.wallBlock) {
            clear(c.wall);
            c.wall.removeAttribute('aria-hidden');
            model.organizers.forEach(function (o) { c.wall.appendChild(organizerCard(o)); });
            c.wallBlock.hidden = model.organizers.length === 0;
        }

        section.hidden = false;
    }

    // Any throw while building the DOM must not leave a half-rendered section.
    function safeRender(section, model, demo) {
        try {
            render(section, model, demo);
        } catch (e) {
            hideSection(section);
        }
    }

    // The section stays `hidden` until a credible model is fully rendered:
    // no placeholder, so a missing or failing RPC never shifts the layout.
    function start(section) {
        if (isDemo) {
            safeRender(section, normalizePayload(demoPayload()), true);
            return;
        }
        var cachedModel = normalizePayload(readCache());
        if (isCredible(cachedModel)) {
            safeRender(section, cachedModel, false);
            return;
        }
        loadModel().then(function (model) {
            render(section, model, false);
        }).catch(function () {
            hideSection(section);
        });
    }

    function init(section) {
        if (!('IntersectionObserver' in window)) {
            start(section);
            return;
        }
        // A hidden section has no box to observe, so a zero-height sentinel
        // placed just before it triggers the fetch ahead of the viewport.
        var sentinel = el('div', 'showcase-sentinel');
        sentinel.setAttribute('aria-hidden', 'true');
        section.parentNode.insertBefore(sentinel, section);
        var observer = new IntersectionObserver(function (entries) {
            if (!entries.some(function (e) { return e.isIntersecting; })) return;
            observer.disconnect();
            sentinel.parentNode.removeChild(sentinel);
            start(section);
        }, { rootMargin: PREFETCH_ROOT_MARGIN });
        observer.observe(sentinel);
    }

    Array.prototype.forEach.call(sections, init);
})();
