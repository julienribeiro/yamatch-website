# Yamatch Marketing Website — Architecture

**Single source of truth for the marketing site at `website/`.**

This doc is mandatory pre-flight reading for `html-expert`, `css-expert`, `js-expert`, and `website-reviewer` before any modification. If this doc disagrees with the actual code, the **code wins** — flag the drift in the report and update this doc via `doc-keeper`.

Last sync: 2026-05-13.

---

## Positionnement produit

Yamatch couvre **uniquement le volley-ball** aujourd'hui. La copy autorise (et encourage) la mention "d'autres sports à venir", **sans jamais nommer ces sports**.

Cette règle s'applique partout où du contenu décrit le produit :
- `website/index.html` — `<title>`, `<meta name="description">`, og/twitter tags, `<h1>`, body copy
- `website/site.webmanifest` — champ `description`
- `website/cgu/index.html` et toutes les autres pages légales
- JSON-LD : blocs `Organization`, `MobileApplication`, `FAQPage`

Cibles de longueur des balises SEO clés :

| Balise | Cible | Règle |
|--------|-------|-------|
| `<title>` | 50–65 chars | mesurée en commentaire HTML |
| `<meta name="description">` | 150–160 chars | mesurée en commentaire HTML |
| `og:description` / `twitter:description` | 145–160 chars | mesurée en commentaire HTML |

---

## Tech stack

Vanilla **HTML5 + CSS3 + ES2020+ JavaScript**. No framework. **One build step: CSS minification** (see Build CSS below). Four source files:

| File | Role | Approx. lines |
|------|------|---------------|
| `website/index.html` | Single page — hero + carousel + FAQ + footer | ~300 |
| `website/styles.css` | All styles. Design tokens in `:root`. Heavy use of `clamp()`. **Source of truth — never minify by hand.** | ~700 |
| `website/carousel.js` | Standalone IIFE: complete carousel gesture state machine (wheel + touch + rubber-band). Loaded via `<script src="carousel.js" defer>` **before** `script.js`. | ~245 |
| `website/script.js` | Standalone IIFE: copyright year, toast, pending-CTA delegation, wordmark scroll-aware behaviour, wave-SVG animation, page-scroll-progress block. | ~454 |

`carousel.js` is loaded first in HTML (`<script src="carousel.js" defer>` then `<script src="script.js" defer>`). Sequential `defer` tags guarantee execution order while keeping both scripts non-blocking.

All 9 HTML files reference **`styles.min.css`** (the generated output), not `styles.css`.

---

## Build CSS

| Aspect | Detail |
|--------|--------|
| Tool | `lightningcss-cli` (devDependency `^1.32.0`) |
| Source | `website/styles.css` — single source of truth, never minified by hand |
| Output | `website/styles.min.css` — generated; **gitignored** (never committed) |
| Sizes | 204 KB source → 36 KB minified raw / 65 KB → 7 KB gzip (~89% gzip reduction) |
| npm script | `npm run build:css` — `lightningcss --minify --bundle --targets '>= 0.5%' website/styles.css -o website/styles.min.css` |
| Pre-hooks | `predev`, `prestart`, `prepreview` all run `build:css` automatically before `live-server` starts |
| CI | `.github/workflows/deploy.yml` runs `npm ci` then `npm run build:css` before `upload-pages-artifact` |

**Rule:** always edit `website/styles.css`. The minified file is a build artifact — do not edit it and do not commit it.

---

## Fonts

All fonts are **self-hosted** (no Google Fonts CDN). Migrated 2026-05-12 — eliminates a third-party request, DNS lookup, and TLS handshake on every page load, and gives us native `font-weight: 800` (was faux-bold from Google's 700-only CDN payload).

### Files in `website/fonts/`

| File | Size | Axis |
|------|------|------|
| `Inter-Variable.woff2` | 48 KB | wght 100–900, upright |
| `Inter-Italic-Variable.woff2` | 26 KB | wght 100–900, italic |
| `Roboto-Variable.woff2` | 37 KB | wght 100–900, upright |
| `Roboto-Italic-Variable.woff2` | 41 KB | wght 100–900, italic |
| `Frick0.3-Regular.woff2` + `.woff` | — | weight 400, hero title only |

Total Inter + Roboto VF: ~152 KB. Latin subset only (covers U+0000–00FF + U+2000–206F — sufficient for all French copy).

### `@font-face` declarations (`styles.css` lines ~83–122)

Each Inter and Roboto face declares `font-weight: 100 900` (full axis range) so any weight from 100 to 900 is served from a single file. `font-display: swap` matches the Frick face behavior.

### Preload

Every HTML file carries exactly one preload for the upright Inter VF (the most render-critical):
```html
<link rel="preload" as="font" type="font/woff2" href="fonts/Inter-Variable.woff2" crossorigin>
```
(Relative path for root pages; `../fonts/Inter-Variable.woff2` for sub-pages.)
Roboto VF is **not** preloaded — it is used only for headings below the fold.

### Weight 800 — native (no faux-bold)

`.floating-card__team-eyebrow`, `.floating-card__score-value`, `.floating-badge__rotor-text` all declare `font-weight: 800`. With the VF, this resolves to the real `wght=800` axis position on both Inter and Roboto. The previous Google CDN payload only shipped wght=700, which caused faux-bold rendering on these elements.

### No Google Fonts link tags

No `<link rel="preconnect" href="https://fonts.googleapis.com">` or `fonts.gstatic.com` appear in any HTML file. Do not re-introduce them.

---

## SEO

### Robots / indexing

- `<meta name="robots" content="index, follow">` **and** `<meta name="googlebot" content="index, follow">` are present on all 8 indexable pages (home + 7 utility sub-pages: mentions-legales, cgu, contact, download, politique-confidentialite, politique-annulation-remboursement, suppression-compte).
- `website/404.html` retains `<meta name="robots" content="noindex">` and does **not** carry a googlebot tag.

### Deep-link anchors

| Section | Anchor |
|---------|--------|
| `.how-quest` | `id="how-it-works"` |
| `.faq` | `id="faq"` |

### Sitemap

`website/sitemap.xml` lists only the home URL (`https://appyamatch.fr/`). Utility pages (CGU, politique, etc.) are intentionally excluded. `<lastmod>2026-05-12</lastmod>`.

### SRI — CDN scripts

The qrcode-generator CDN `<script>` carries:
```html
integrity="sha384-lQXOAyZwHXE55JFyrOMB7nY2Wv+m5ZWNtJcHrd1rceRQXAYNLak8ukN5TjBTcIwz"
crossorigin="anonymous"
```
Any CDN script added in the future must include a `sha384` SRI hash and `crossorigin="anonymous"`.

### JSON-LD blocks (`index.html`)

Four JSON-LD `<script type="application/ld+json">` blocks in `<head>`:
1. **`Organization`** — name, legalName (`"Yamatch Corp"`), url, logo, description (volley-only + "d'autres sports à venir"), email, foundingDate (`"2026-05-12"` — ISO full date), taxID (`"104861091"`), vatID (`"FR63104861091"`), address (`PostalAddress`: 47 rue Vivienne, 75002 Paris, FR), sameAs (`["https://www.instagram.com/yamatch_app/"]` — Instagram active; additional entries added if/when LinkedIn or TikTok accounts go live).
2. **`WebSite`** — name, url, inLanguage, publisher.
3. **`FAQPage`** — 12 `Question` + `Answer` pairs mirroring the visible accordion (kept in sync with HTML copy).
4. **`MobileApplication`** — name, operatingSystem, applicationCategory, offers, author.

Utility pages that ship a `MobileApplication` JSON-LD block must also follow the volley-only copy rule.

### Utility / legal sub-pages

7 sub-pages live under `website/`:

| Path | Title | `<main>` class | Notes |
|------|-------|---------------|-------|
| `cgu/` | CGU | `legal-page` | |
| `contact/` | Contact | `legal-page` | |
| `download/` | Télécharger | `legal-page` | |
| `mentions-legales/` | Mentions légales | `legal-page` | Créée 2026-05-12 — LCEN art. 6-III-1, 12 sections |
| `politique-annulation-remboursement/` | Annulation & remboursement | `legal-page` | |
| `politique-confidentialite/` | Politique de confidentialité | `legal-page` | |
| `suppression-compte/` | Suppression de compte | `legal-page` | |

All 7 carry `<meta name="robots" content="index, follow">` + `<meta name="googlebot" content="index, follow">`. All are excluded from `sitemap.xml` (home URL only).

Each legal page footer includes a `<nav class="legal-page-nav" aria-label="Autres documents légaux">` with a `<ul class="legal-page-nav-list">` listing the other legal pages. Standard nav order: Mentions légales (omitted on its own page), CGU, Politique de confidentialité, Annulation & remboursement, Suppression de compte, Contact.

**Open placeholders (as of 2026-05-13):**
- `mentions-legales/` § 6 (Domiciliation) — numéro d'agrément préfectoral de Vivienne Domiciliation (`[À COMPLÉTER]`).

---

## Société éditrice (Yamatch Corp)

| Champ | Valeur |
|-------|--------|
| Dénomination sociale | Yamatch Corp |
| Forme juridique | SASU (Société par actions simplifiée à associé unique) |
| Capital social | 1 € (10 actions de 0,10 € intégralement libérées) |
| Siège social | 47 rue Vivienne, 75002 Paris |
| RCS | Paris 104 861 091 |
| SIREN | 104 861 091 |
| EUID | FR7501.104861091 |
| N° TVA intracommunautaire | FR63 104 861 091 |
| Email | contact@appyamatch.fr |
| Date d'immatriculation | 12 mai 2026 |
| Représentant légal / Directeur de la publication | Julien Ribeiro, Président |
| Domiciliataire | Vivienne Domiciliation, RCS Paris 994 567 121, 47 rue Vivienne 75002 Paris |

These identifiers are the authoritative values to use across all legal pages (`mentions-legales/`, `cgu/`, `politique-confidentialite/`, etc.) and in the `Organization` JSON-LD block.

---

## PWA manifest (`website/site.webmanifest`)

| Field | Value |
|-------|-------|
| `name` | `"Yamatch"` |
| `short_name` | `"Yamatch"` |
| `description` | volley-only + "D'autres sports bientôt disponibles." |
| `display` | `"standalone"` |
| `theme_color` | `"#D7FF00"` |
| `icons[192]` | `"purpose": "any"` |
| `icons[512]` | `"purpose": "any maskable"` |

The 512×512 icon's `purpose` was changed from `"any"` to `"any maskable"` as part of the 2026-05-12 SEO audit.

---

## DOM structure

Sections under `<main id="top">`, in order:

1. **`.hero`** — lime card with title, subtitle, App Store / Google Play buttons; wordmark above
2. **`.screens-rail`** — horizontal carousel with 5 phone screenshots
3. **`section.how-quest#how-it-works`** — 3-step PARCOURS section with persona tabs; deep-link anchor `id="how-it-works"`
4. **`section.faq#faq`** — accordion of 12 questions; deep-link anchor `id="faq"`
5. **`<footer>`** — outside `<main>`, light-gray background (matches `.faq`), dark text, content centered

### Footer brand strip (`.footer-brand-strip`) — added 2026-05-13 (CSS §12.1)

Decorative row rendered above the legal links. Flex row (`justify-content: space-between`) — horizontal on all screen sizes, no mobile stack.

- **Left:** `.footer-wordmark-link` > `.footer-wordmark` — SVG wordmark at 22px height desktop / 18px mobile (smaller than the fixed hero wordmark). `opacity: 0.75` on hover.
- **Right:** `.footer-social-link.footer-social-instagram` — 44×44px touch target (WCAG AA), `border-radius: 12px`, background `var(--color-accent)` (#D7FF00 lime). Inline SVG Instagram icon 22×22, `stroke="currentColor"`, colour propagated via `color: var(--color-text-primary)` (#101828 noir). `scale(1.05)` + `opacity: 0.92` on hover.
- Focus-visible: `outline: 2px solid var(--color-text-primary); outline-offset: 3px` — site-wide pattern (§19), no dedicated rule needed.
- `prefers-reduced-motion`: transitions neutralised by the global §19 blanket rule — no dedicated override needed.
- Both `<a>` tags carry no `target="_blank"` / `rel` (site convention, validated by reviewer on PR #10).

### Hero

```
.hero (z-index: implicit, padding: var(--page-pad))
├── .wordmark.wordmark-link (position: fixed, z-index: 50)
└── .hero-card (z-index: 1, lime bg)
    ├── .hero-card-waves (SVG, z-index: 0, animated wave lines)
    └── .hero-card-inner (z-index: 1)
        ├── h1.hero-title > span.hero-title-slant ("Ton prochain tournoi t'attend")
        ├── p.hero-subtitle ("Compose ton équipe, il y a match")
        └── .hero-buttons
            ├── a.btn-glass.js-pending-cta (App Store)  → toast "Bientôt disponible"
            └── a.btn-glass.js-pending-cta (Google Play) → toast "Bientôt disponible"
```

**Toast CTA:** clicking any `.js-pending-cta` shows the toast with the text `"Bientôt disponible"` (exact string, no ellipsis). Managed by the pending-CTA event delegation block in `script.js`.

### How-quest (`section.how-quest#how-it-works`)

```
section.how-quest#how-it-works (aria-labelledby="howQuestTitle", data-persona="participant")
├── .how-quest-eyebrow ("PARCOURS")
├── h2#howQuestTitle.how-quest-title
├── .quest-persona-tabs
│   ├── button.quest-tab (Participant)
│   └── button.quest-tab (Organisateur)
└── .quest-steps
    ├── .quest-step [index 0]
    │   ├── h3.quest-step-title  ("Trouve un tournoi")       ← STATIC HTML (Participant default)
    │   ├── .quest-step-tag-label                             ← JS-driven (persona switch)
    │   └── p.quest-step-body                                 ← JS-driven (persona switch)
    ├── .quest-step [index 1]
    │   ├── h3.quest-step-title  ("Inscris ton équipe")      ← STATIC HTML (Participant default)
    │   ├── .quest-step-tag-label                             ← JS-driven (persona switch)
    │   └── p.quest-step-body                                 ← JS-driven (persona switch)
    └── .quest-step [index 2]
        ├── h3.quest-step-title  ("Place au jeu")             ← STATIC HTML (Participant default)
        ├── .quest-step-tag-label                             ← JS-driven (persona switch)
        └── p.quest-step-body                                 ← JS-driven (persona switch)
```

**Heading hierarchy:** `<h1>` (hero) → `<h2>` (`how-quest-title`, `faq-title`) → `<h3>` (quest-step-titles).

**`<h3>` titles — static default + JS swap:** the three `.quest-step-title` values ("Trouve un tournoi", "Inscris ton équipe", "Place au jeu") are hard-coded in HTML as the Participant default — ensuring Google receives non-empty `<h3>` on initial parse. `renderPersona()` in `script.js` writes `tag-label`, **`title`**, and `body` on every persona switch (`script.js:786–791`). On the first render (Participant), the title write is idempotent (textContent identical to the HTML default). On toggle to Organisateur, titles swap to `PERSONA_CONTENT.organisateur.steps[].title`: `"Créez votre tournoi"` / `"Automatisez les inscriptions"` / `"Gérez le jour J"` (`script.js:759–761`). SEO is preserved: crawlers always parse the Participant titles from static HTML.

---

### Carousel (`.screens-rail`)

```
.screens-rail (z-index: 2, overflow: visible)
└── .hero-carousel-embla (cursor: grab)
    └── .hero-carousel-embla--container (display: flex, justify-content: flex-start, gap, transition: transform 440ms cubic-bezier(0.65, 0, 0.35, 1))
        ├── article.screen-card.screen-card--lime.hero-carousel-embla--slide   [index 0, sentinel — clipped]
        ├── article.screen-card.screen-card--white.screen-card--arrival.hero-carousel-embla--slide.active   [index 1, INITIAL ACTIVE]
        ├── article.screen-card.screen-card--lime.hero-carousel-embla--slide   [index 2]
        ├── article.screen-card.screen-card--white.hero-carousel-embla--slide   [index 3]
        └── article.screen-card.screen-card--lime.hero-carousel-embla--slide   [index 4, sentinel — clipped]
```

Each `.screen-card` contains:
- `.screen-card__phone` > `<picture>` > `<source srcset="screen_N.webp">` + `<img class="phone-image" src="screen_N.png" draggable="false">`
- `.screen-card__caption` > `.screen-card__caption-primary` (Inter 700) + `.screen-card__caption-secondary` (Inter 500 italic)

**`.screen-card` flex-item constraint:** `.screen-card` carries `min-width: 0`. This overrides flex's default `min-width: auto`, which would otherwise force each slide to be at least as wide as its phone `<img>` min-content — breaking the `--slide-size` formula and misaligning the sentinel ↔ hero-card left edge.

**Color pattern (lime/white/lime/white/lime):**
- Slide 0: lime — `screen_1.png` — "Tous tes tournois, / une seule app"
- Slide 1 (active): white — `screen_2.png` — "Lieu, niveau, format… / — tout y est"
- Slide 2: lime — `screen_3.png` — "Paiement sécurisé, / victoire non garantie"
- Slide 3: white — `screen_4.png` — "Matchs, scores, classement / — en live"
- Slide 4: lime — `screen_5.png` — "De la poule à la finale, / suis ta progression"

**Loading attributes:** active slide's `<img>` has `loading="eager" fetchpriority="high"`; the other 4 have `loading="lazy"`. All have `decoding="async"` and `draggable="false"`.

---

## Design tokens (`:root` in styles.css)

### Colors
```css
--color-accent: #D7FF00;        /* Yamatch lime */
--color-dark-bg: #1A1A1A;
--color-dark-surface: #000000;
--color-light-bg: #FFFFFF;
--color-light-gray: #F3F4F6;
--color-medium-gray: #99A1AF;
--color-text-primary: #101828;
--color-text-white: #FFFFFF;
--color-text-black: #000000;          /* pure black: wordmark, hero-title, hero-subtitle, faq-icon */
--color-button-glass-hover: #1F2A3D;  /* .btn-glass hover fill */
```

### Typography
```css
--font-heading: 'Roboto', system-ui, …;   /* + 'Frick 0.3' for hero title via @font-face */
--font-body: 'Inter', system-ui, …;       /* weights 400, 500, 600, 700, 800, italic-500 */
```

### Layout
```css
--page-pad: clamp(24px, 4.5vw, 60px);     /* horizontal gutter — consumers: .hero, .screens-rail, footer (mobile: .faq switches to --mobile-hero-card-margin) */
--container-max: 1200px;
--radius-card: 24px;
--radius-input: 16px;
--radius-pill: 100px;
```

### Carousel — runtime-critical
```css
--scroll: 0px;                                                   /* active phone image's translateY (px value written by JS; 0 = phone flat in row) */
--nbr-slide: 3;                                                  /* visible slides desktop; 1 on mobile (= lime card width exactly) */
--slide-spacing: clamp(16px, 2vw, 28px);                         /* gap between slides */
--slide-size: calc((100% - (var(--nbr-slide) - 1) * var(--slide-spacing)) / var(--nbr-slide));
```

**Alignment invariant (sentinel_0 ↔ page-pad):** with `justify-content: flex-start`, slide 0's left-edge is the container's left-edge, which is `--page-pad` from the viewport edge by flex layout directly — no algebraic derivation required. `--nbr-slide = 3` is no longer load-bearing for left-alignment; it remains useful for visual symmetry of the right sentinel and slide-size computation. This aligns the left lime sentinel of the carousel with the left edge of the lime hero card above, producing a coherent horizontal grid.

**Active-slide centering:** the JS actively measures and corrects via `computeOffsetForIndex` (see Carousel state machine — Helper functions). The previous static identity "slide 1 naturally sits at window/2 ↔ transform = 0" is no longer critical for correctness: `computeOffsetForIndex` is idempotent and works for any active index. The identity remains useful for explaining why `min-width: 0` on `.screen-card` matters: without it, flex's default `min-width: auto` forces each slide to respect its phone-image min-content, breaking the `--slide-size` formula and misaligning the sentinel.

**Design history:** `justify-content: center → flex-start` (2026-05-10). Sentinel-alignment is now guaranteed by explicit flex geometry instead of an implicit algebraic identity. More robust: no longer depends on `--nbr-slide = 3` for left-alignment, nor on the `offsetParent` chain.

### Animation default
```css
--transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Carousel state machine (carousel.js)

The carousel is a JS-driven state machine — NOT native CSS scroll-snap. Choice motivated by the constraint that the active phone image's `translateY(var(--scroll))` lift requires `overflow-y: visible`, which is incompatible with `overflow-x: auto` (CSS spec promotes the y-axis to `auto` and clips the lift).

### State variables

| Variable | Type | Purpose |
|----------|------|---------|
| `activeIndex` | int | Currently centered slide (init: first slide with `.active`, or 0). Clamped to `[1, slides.length - 2]` on desktop (`[0, slides.length - 1]` on mobile via `getCarouselBounds()`). |
| `wheelAccum` | float | Accumulated `event.deltaX` in current gesture. Reset on fire or unlock. |
| `gestureLocked` | bool | True while the carousel is locked after a snap or rubber-band; blocks new wheel/touch triggers until horizontal wheel events have been silent for `GESTURE_RELEASE_SILENCE_MS`. |
| `gestureUnlockTimer` | timeout id | Timer scheduled by `scheduleGestureUnlock()` to call `unlockGesture()` after silence. Replaced (not stacked) on each new call. |
| `lastWheelAt` | float | `performance.now()` timestamp of the last wheel event. Used by `scheduleGestureUnlock` to verify silence before releasing the lock. |
| `wheelIdleTimer` | timeout id | Sub-threshold silence timer; resets `wheelAccum = 0` after `SILENCE_RESET_MS` of wheel silence. No snap fires from this handler. |
| `touchStartX`, `touchCurrentDx`, `touching` | float, float, bool | Touch gesture state. |
| `touchBaseOffset` | float | `computeOffsetForIndex(activeIndex)` captured at `touchstart`. Reference transform used for live-follow writes during `touchmove`. |

### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `WHEEL_THRESHOLD` | 45 | px of accumulated `deltaX` needed to fire a slide change. |
| `GESTURE_LOCK_MIN_MS` | 0 | Minimum hold duration before `scheduleGestureUnlock` begins checking for silence. Set to 0: the unlock check starts immediately and is gated on silence alone. |
| `GESTURE_RELEASE_SILENCE_MS` | 30 | ms of wheel silence required before the gesture lock is released. `scheduleGestureUnlock` re-arms itself until `performance.now() - lastWheelAt >= 30`. |
| `SILENCE_RESET_MS` | 30 | Delay of `wheelIdleTimer`. After 30ms of wheel silence with no prior fire, `wheelIdleHandler` resets `wheelAccum = 0` silently (pure reset — no snap). Only reached for sub-threshold gestures. |
| `RUBBER_BAND_DISTANCE` | 70 | px the carousel peeks toward the unreachable sentinel during a boundary bounce. |
| `RUBBER_BAND_DURATION_MS` | 280 | Duration of one half of the rubber-band animation (peek phase or return phase). Total bounce = 560ms. |

### Helper functions

- **`getCurrentTranslateX()`** — reads the container's live `transform` via `getComputedStyle().transform`, parses it with `DOMMatrixReadOnly` (falls back to a regex matrix parse), and returns `m41` (the X component). Returns 0 if no transform is applied. Reads the **current** interpolated value mid-transition, not the target inline value.
- **`computeOffsetForIndex(idx)`** — returns the `translateX` offset to center slide `idx` in the viewport. Idempotent composition: `currentTranslateX + (window.innerWidth / 2 - slideCenter)`, where `slideCenter` is derived from `slide.getBoundingClientRect()` (live position including mid-transition interpolation) and `currentTranslateX` comes from `getCurrentTranslateX()`. Delta is 0 if the slide is already centered; converges correctly when called mid-transition. Previous formula (`viewport.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2)`) mixed coordinate systems (offsetLeft = layout-position, clientWidth = viewport) and was not safe to call during a running transition.
- **`getCarouselBounds()`** — returns `{ min, max }` for the navigable index range. Desktop: `{ min: 1, max: slides.length - 2 }` (sentinels 0 and N-1 stay pinned). Mobile: `{ min: 0, max: slides.length - 1 }` (all slides centerable).
- **`isValidCarouselIndex(idx)`** — returns true if `idx` is within `getCarouselBounds()`. Used by wheel and touch handlers before calling `setActiveIndex` vs `rubberBand`.
- **`lockGesture()`** — sets `gestureLocked = true`, clears any pending `gestureUnlockTimer`.
- **`unlockGesture()`** — sets `gestureLocked = false`, nulls `gestureUnlockTimer`, resets `wheelAccum = 0`.
- **`scheduleGestureUnlock()`** — schedules an unlock attempt after `GESTURE_LOCK_MIN_MS` (0ms). On the callback, checks `performance.now() - lastWheelAt`. If silence is shorter than `GESTURE_RELEASE_SILENCE_MS` it arms a refined retry timer for the remaining wait, then recurses until silence is confirmed. When silence is confirmed, calls `unlockGesture()`. Replacing (not stacking) the timer on each call prevents multiple concurrent unlock chains.
- **`setActiveIndex(idx)`** — clamps `idx` to `getCarouselBounds()`, removes `.active` from previous slide, adds `.active` to new slide, updates `activeIndex`, writes `container.style.transform = translate3d(${computeOffsetForIndex(clamped)}px, 0, 0)`. The CSS transition (440ms cubic-bezier(0.65, 0, 0.35, 1)) animates the snap.

### Wheel handler flow

Fire-on-threshold pattern: the listener fires immediately when `|wheelAccum|` reaches `WHEEL_THRESHOLD`; `wheelIdleHandler` is a pure reset for sub-threshold gestures only.

1. **Guards** — return early if `|deltaX| < |deltaY|` (vertical scroll passes through) or if `deltaX === 0`. Stamps `lastWheelAt = performance.now()`. Calls `event.preventDefault()`.
2. **Gesture-lock guard** — if `gestureLocked`, return immediately. No accumulation, no timer restart. The lock is held until horizontal wheel events have been silent for `GESTURE_RELEASE_SILENCE_MS` (verified by `scheduleGestureUnlock`).
3. **Accumulate** — `wheelAccum += deltaX`.
4. **Threshold check (fire immediately)** — if `|wheelAccum| >= WHEEL_THRESHOLD`: `dir = wheelAccum > 0 ? 1 : -1`; compute `targetIdx = activeIndex + dir`. If `isValidCarouselIndex(targetIdx)`: call `setActiveIndex(targetIdx)` (snap) + `lockGesture()` + `scheduleGestureUnlock()`. Else: call `rubberBand(dir)` (boundary bounce, which calls `lockGesture()` + `scheduleGestureUnlock()` internally). Either branch resets `wheelAccum = 0` and clears the idle timer.
5. **Sub-threshold path** — if `|wheelAccum| < WHEEL_THRESHOLD`: clear and restart `wheelIdleTimer = setTimeout(wheelIdleHandler, SILENCE_RESET_MS)`. No snap fires.
6. **`wheelIdleHandler`** (pure reset, runs after 30ms of sub-threshold silence) — `wheelIdleTimer = null; wheelAccum = 0`. No snap fires, no visible change.

### Touch handler flow

- **touchstart** — guard on `gestureLocked`, capture `touchStartX = e.touches[0].clientX`, `touchCurrentDx = 0; touching = true`. Captures `touchBaseOffset = computeOffsetForIndex(activeIndex)` as the reference transform for live-follow writes.
- **touchmove** — `touchCurrentDx = e.touches[0].clientX - touchStartX`. Disables the CSS transition (`container.style.transition = 'none'`) and writes the live transform directly: `translate3d(touchBaseOffset + touchCurrentDx, 0, 0)`. The card follows the finger in real time.
- **touchend** — Restores the CSS transition (`container.style.transition = ''`). `dir = touchCurrentDx < 0 ? 1 : -1`. If `|touchCurrentDx| >= 50`: compute `targetIdx = activeIndex + dir`. If `isValidCarouselIndex(targetIdx)`: call `setActiveIndex(targetIdx)` + `lockGesture()` + `scheduleGestureUnlock()`. Else: call `rubberBand(dir)` (which handles lock internally). If `|touchCurrentDx| < 50`: calls `setActiveIndex(activeIndex)` (re-center via CSS transition — snap back to current position).
- **touchcancel** — Restores the CSS transition (`container.style.transition = ''`) and calls `setActiveIndex(activeIndex)` to re-center the card.

`setActiveIndex`'s internal clamp to `getCarouselBounds()` remains a defensive safety net. In practice, boundary gestures are routed to `rubberBand` before reaching `setActiveIndex`, so the clamp is never the first line of defense.

### Page-scroll-progress block (animates `--scroll`)

Listens to `window.scroll` + `resize` + `orientationchange` + `load` — all rAF-throttled via a shared `rafPending` flag. On each tick, calls `computeBaseLift()` first, then interpolates:

- `startY = vh` (carousel just entering bottom of viewport) → `progress = 0` → `inv = 1` → `--scroll = ${baseLift}px` (full lift, phone top = buttons bottom + 40px).
- `endY = vh * 0.4` (carousel top at 40vh) → `progress = 1` → `inv = 0` → `--scroll = 0px` (phone flat in row).

Linear interpolation: `--scroll = ${baseLift * inv}px`.

**`computeBaseLift()`** — JS helper (called on every tick, also on resize/orientation/load for re-measure):
1. Reads `buttonsRect = buttons.getBoundingClientRect()`.
2. Reads `phoneRect = phone.getBoundingClientRect()`.
3. Reads `currentTranslateY` via `readPhoneTranslateY(phone)` — parses `getComputedStyle(phone).transform` with `DOMMatrixReadOnly().m42`, falling back to a regex matrix parse; returns 0 if no transform is set.
4. `phoneNaturalTop = phoneRect.top - currentTranslateY` (viewport-relative top the phone would occupy with no lift applied).
5. Returns `buttonsRect.bottom + desiredGap - phoneNaturalTop`, where `desiredGap` is read dynamically via `parseFloat(getComputedStyle(documentElement).getPropertyValue('--desired-button-gap'))`.

**`--desired-button-gap: clamp(24px, 4vh, 56px)`** (CSS token, read dynamically by JS via `getComputedStyle(documentElement)`). Replaces the former hardcoded JS constant `DESIRED_GAP_FROM_BUTTONS = 40`. Responsive range: 24px floor (mobile / short viewports), ~40px at ~1000px viewport height, 56px ceiling (4K / tall screens). Algebraic guarantee: when `inv = 1`, `--scroll = baseLift`, so `phoneTop_viewport = phoneNaturalTop + baseLift = buttonsBottom + desiredGap`. The gap is exact by construction at every viewport size.

Mobile + reduced-motion paths skip the writer entirely (CSS keeps `--scroll: 0`). There is no longer any divergence between mobile and desktop code paths in this block — both are handled by the single unified `updateScroll` function gated on `mobileQuery.matches` and `reducedMotion.matches`.

---

## Active phone image lift mechanism

```css
.screen-card.active .phone-image {
    transform: translateY(var(--scroll));
    will-change: transform;
    transition: transform 80ms linear;
}
```

- At page load (scroll = 0), `--scroll` is `${baseLift}px` — a JS-computed pixel value such that the active phone's top edge sits exactly `--desired-button-gap` below the lime-card buttons' bottom edge (CSS token `clamp(24px, 4vh, 56px)`, read at runtime via `getComputedStyle`). The active slide's phone image is lifted UP, visible above the carousel row, just below the lime-card buttons.
- As user scrolls down, page-scroll-progress block animates `--scroll` toward 0. Phone descends into its row position.
- When the user changes slides via wheel/touch, `setActiveIndex` swaps the `.active` class. The new slide's phone image immediately picks up the lift (since `--scroll` is on `.hero-carousel-embla` and inherited).
- The 80ms linear transition smooths the swap.

---

## Z-index / stacking contexts

| Element | z-index | Stacking-context creator | Why |
|---------|---------|--------------------------|-----|
| `.skip-link` | 1000 | yes | a11y; always on top when focused |
| `.toast` | 1000 | yes | always on top |
| `.wordmark` | 50 | yes (position: fixed) | fixed header above all sections |
| `.screens-rail` | 2 | yes | above `.hero-card` so the active phone image's lift renders in front |
| `.hero-card` | 1 | yes | own stacking context for waves SVG below content |
| `.hero-card-inner` | 1 | yes | content above the waves SVG |
| `.hero-card-waves` | 0 | yes | inside `.hero-card`, behind content |

---

## Overflow / clipping

```css
html, body { overflow-x: clip; }
```

`overflow-x: clip` (NOT `hidden`/`auto`) is critical: per CSS spec, `clip` allows asymmetric per-axis values WITHOUT promoting the other axis to `auto`. This lets the page clip horizontal bleed (carousel sentinels off-screen) while keeping `overflow-y: visible` (page scroll works normally and the active phone lift isn't clipped vertically).

`.screens-rail` has `overflow: visible` so the active phone image's `translateY(var(--scroll))` upward lift extends into the hero zone without clipping.

`.hero-carousel-embla--container` has NO overflow rule — it's a wide flex row whose excess content (slides 0 and 4) is clipped at viewport edges by `body { overflow-x: clip }`.

---

## CSS transitions inventory

| Selector | Property | Duration | Easing |
|----------|----------|----------|--------|
| `a` | color, opacity | 200ms | `var(--transition)` |
| `.wordmark` | translate, scale, opacity, etc. | 300ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `.btn-glass` | transform, bg, box-shadow | 200ms | `var(--transition)` |
| `.btn-glass svg` | transform | 240ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `.screen-card.active .phone-image` | transform | 80ms | linear |
| `.hero-carousel-embla--container` | transform | 440ms | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `.faq-toggle` | color | 200ms | `var(--transition)` |
| `.faq-icon` | rotate | 300ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `.faq-answer` | grid-template-rows | 300ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `.faq-answer-inner p` | padding-bottom | 300ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `.toast` | transform, opacity | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` |

## CSS keyframe animations inventory

| Selector | Keyframe | Properties animated | Notes |
|----------|----------|---------------------|-------|
| `.hero-card` | `cardEntrance` | `opacity` (0 → 1), `filter: blur` (8px → 0) | No scale. Applied to the lime hero card on page load. |
| `.hero-title`, `.hero-subtitle` | `titleEntrance` | `opacity`, `translate` (vertical), `filter: blur` | Scale 1.04 → 1 for the title. Staggered delay. |
| `.hero-card-waves path` | `waveDraw` | `stroke-dashoffset` | SVG stroke-drawing entrance; driven by JS-controlled animation iteration. |

> `titleEntrance` and `cardEntrance` are distinct keyframes. `.hero-card` uses `cardEntrance` (opacity + blur only — no scale). `.hero-title` / `.hero-subtitle` use `titleEntrance` (which includes scale). Do not conflate them.

---

## Reduced motion + mobile overrides

### `@media (prefers-reduced-motion: reduce)`
- All `*` `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important`.
- `.hero-card-waves { animation: none; opacity: 1 }` (skip wave entrance).
- `.hero-carousel-embla { --scroll: 0 }` (phone flat in row, no lift).
- JS: page-scroll-progress and wave animation loops check `matchMedia('(prefers-reduced-motion: reduce)').matches` and skip.

### `@media (max-width: 767px)`
- `.hero { padding: 0 }` — removes all padding from the hero section; horizontal spacing is handled by `.hero-card` itself.
- Two tokens govern mobile spacing (inline and block axes are **intentionally decoupled**):
  - `--mobile-hero-card-margin: clamp(20px, 5vw, 40px)` — **inline axis only**: consumed by `width` formula (`calc(100% - 2 * var(--mobile-hero-card-margin))`), `margin-inline: auto` on `.hero-card`, and `padding-inline` on `.screens-rail` and `.faq`. Aligns all three elements to the same left/right edge.
  - `--mobile-hero-card-margin-block: clamp(30px, 7.5vw, 60px)` — **block axis only**: consumed by `margin-top`, `margin-bottom`, and `min-height` (`calc(100svh - 2 * var(--mobile-hero-card-margin-block))`) on `.hero-card`, and `top` on `.wordmark`. Larger than the inline token to restore breathing room above the wordmark without widening horizontal margins.
- `.hero-card { width: calc(100% - 2 * var(--mobile-hero-card-margin)); margin-inline: auto; margin-top: var(--mobile-hero-card-margin-block); margin-bottom: var(--mobile-hero-card-margin-block); min-height: calc(100svh - 2 * var(--mobile-hero-card-margin-block)); border-radius: clamp(24px, 7vw, 32px) }` — **floating tile**: equal block margins (top = bottom), tighter inline margins (left = right), centred horizontally via `margin-inline: auto`. `min-height` ≈ 85–87 % of the viewport. Full all-corners border-radius (no flat bottom).
- `.wordmark { top: calc(var(--mobile-hero-card-margin-block) / 2) }` — positions the wordmark exactly halfway between the viewport top and the lime card top, using the block-axis token so it tracks the card's top margin automatically.
- `.hero-carousel-embla { --nbr-slide: 1; --slide-spacing: clamp(16px, 4vw, 28px); --scroll: 0 }` — exactly one slide visible per viewport (slide width = container width = viewport − 2×`--mobile-hero-card-margin` = lime card width). No lift. Carousel is intentionally pushed below the fold (visible on scroll).
- `.screens-rail { padding-inline: var(--mobile-hero-card-margin); padding-block: clamp(40px, 7vw, 96px); background: var(--color-light-bg) }` — `padding-inline` aligns the rail's left/right edges with the lime card edges; neighbouring slides peek into the padding area, providing swipe affordance.
- `.faq { padding-inline: var(--mobile-hero-card-margin); padding-block: var(--mobile-hero-card-margin) }` — overrides `--page-pad` on mobile so the FAQ left/right edges align with the lime card and carousel, not the wider desktop gutter; `padding-block` reuses the inline token (the FAQ block padding is independent of the hero card block-axis split). Footer keeps `--page-pad`.
- JS: page-scroll-progress checks `mobileQuery.matches` and skips.

---

## Recent design decisions (with rationale)

### `--mobile-hero-card-margin` token + wordmark vertical centering (2026-05-10)
The four repeated inline `clamp(20px, 5vw, 40px)` literals in `.hero-card`'s mobile override block were factored into a single CSS custom property `--mobile-hero-card-margin`. A new `.wordmark` mobile rule `top: calc(var(--mobile-hero-card-margin) / 2)` places the wordmark at the visual midpoint between viewport top and lime card top, achieving equal optical spacing. One source of truth for the margin value; the wordmark tracks it automatically when the margin changes.

### Inline/block margin split — `--mobile-hero-card-margin-block` introduced (2026-05-11)
`--mobile-hero-card-margin: clamp(20px, 5vw, 40px)` is now **inline-axis only** (left/right: `width` formula on `.hero-card`, `padding-inline` on `.screens-rail` and `.faq`). A new token `--mobile-hero-card-margin-block: clamp(30px, 7.5vw, 60px)` takes over the **block axis**: `margin-top`, `margin-bottom`, and `min-height` on `.hero-card`, plus `top` on `.wordmark`. Motivation: restore vertical breathing room above the wordmark (the block margin had been compressed when both axes shared a single token) without widening the horizontal margins, which control carousel alignment. The two tokens are kept intentionally separate — do not collapse back into one.

### Mobile carousel = lime card width (2026-05-10)
`.screens-rail` `padding-inline` on mobile is now `var(--mobile-hero-card-margin)` (previously `var(--page-pad)`), and `--nbr-slide` is `1` (previously `1.08`/`1.1`). Each slide is exactly as wide as the lime hero card (viewport − 2×`--mobile-hero-card-margin`). Neighbouring slides peek into the padding area, providing natural swipe affordance without fractional-slide hacks.

### Carousel extracted to dedicated file (2026-05-10)
The ~245-line carousel state machine was moved from `script.js` to a new standalone file `carousel.js`. Pure extraction — no behavior change. `index.html` loads `<script src="carousel.js" defer>` before `<script src="script.js" defer>`; sequential `defer` tags maintain execution order while keeping both scripts non-blocking. `script.js` now contains only non-carousel concerns: copyright year, toast, pending-CTA delegation, wordmark scroll-awareness, wave-SVG animation, page-scroll-progress.

### Hard cooldown (HARD_COOLDOWN_MS) → gesture-lock model (2026-05-10)
The fixed 680ms hard cooldown (`HARD_COOLDOWN_MS = 680`, `lastFireTime`) was replaced with a silence-based gesture-lock model. After a snap or rubber-band, `lockGesture()` sets `gestureLocked = true` and `scheduleGestureUnlock()` begins polling: it releases the lock only after `GESTURE_RELEASE_SILENCE_MS = 30ms` of continuous wheel silence (verified via `lastWheelAt`). This is strictly responsive to the user's trackpad rhythm rather than a fixed timer — a fast intentional second gesture unlocks immediately once inertia dissipates, while a slow scroll scroll that produces residual wheel events stays locked until it truly stops. Constants removed: `HARD_COOLDOWN_MS`, `lastFireTime`. Constants added: `GESTURE_LOCK_MIN_MS = 0`, `GESTURE_RELEASE_SILENCE_MS = 30`. State added: `gestureLocked` (bool), `gestureUnlockTimer` (timeout id), `lastWheelAt` (float). Helpers added: `lockGesture()`, `unlockGesture()`, `scheduleGestureUnlock()`.

### Initial active = index 1, screen 2 ("Lieu, niveau, format")
The active card at scroll=0 is the second card from the left. The first card (index 0, screen 1 "Tous tes tournois") is in permanent left-peek; the third card (index 2, screen 3 "Paiement sécurisé") in right-peek.

### Boundary behavior: rubber-band bounce (2026-05-10)
When `activeIndex = 1` and the user swipes left, or `activeIndex = 3` and the user swipes right, `rubberBand(dir)` fires instead of `setActiveIndex`. It captures `baseOffset = computeOffsetForIndex(activeIndex)`, overrides the container transition to `280ms cubic-bezier(0.65, 0, 0.35, 1)`, writes the transform to `baseOffset - dir * RUBBER_BAND_DISTANCE` (peek toward the unreachable sentinel), then after 280ms writes back to `baseOffset` (return), and after 560ms restores the default 440ms transition. The 680ms hard cooldown covers the full 560ms bounce plus a 120ms buffer, preventing bounce spam.

### Rubber-band bounce at deck boundaries (2026-05-10)
At `activeIndex = 1` (swipe left) or `activeIndex = 3` (swipe right), the carousel glides `RUBBER_BAND_DISTANCE = 70px` toward the unreachable sentinel in `RUBBER_BAND_DURATION_MS = 280ms`, then returns to the centered position in another 280ms (total 560ms). Gives coherent visual feedback instead of a silent no-op. Cooldown 680ms covers the 560ms bounce plus a 120ms inertia buffer. The peek-and-return uses the same `cubic-bezier(0.65, 0, 0.35, 1)` as the normal snap transition, so the motion family is consistent.

### Velocity-based multi-step snap — added then removed (2026-05-10)
`WHEEL_EXTRA_STEP = 150` (initially 100, bumped 2026-05-10) and `TOUCH_EXTRA_STEP = 180` were added so that gestures overshooting the base threshold could skip 2–3 slides in one snap. Removed 2026-05-10: the extra-step multiplier triggered unintended +2 advances on ordinary trackpad gestures because normal scroll magnitudes regularly exceeded the combined threshold (45 + 150 = 195px). User request: every gesture must advance exactly +1 card, no exceptions. `WHEEL_EXTRA_STEP` and `TOUCH_EXTRA_STEP` removed; both handlers now call `setActiveIndex(activeIndex + dir)` unconditionally.

### Snap easing: `ease-in-out-cubic` 440ms (`cubic-bezier(0.65, 0, 0.35, 1)`)
Symmetric ramp-up + peak speed at midpoint + symmetric deceleration — no overshoot. The previous ease-out-quart (320ms) started too fast, giving an abrupt, mechanical first impression. ease-in-out-cubic at 440ms opens with a gentle acceleration, reaches maximum velocity at the midpoint, then decelerates symmetrically for a more composed, luxurious feel.

_2026-05-10: `linear 280ms` → `cubic-bezier(0.22, 1, 0.36, 1) 320ms` (ease-out-quart, user request for a smoother snap with fast-start / slow-end feel). `HARD_COOLDOWN_MS` bumped accordingly (520 → 560 = 320ms snap + 240ms inertia buffer)._

_2026-05-10: `cubic-bezier(0.22, 1, 0.36, 1) 320ms` → `cubic-bezier(0.65, 0, 0.35, 1) 440ms` (ease-in-out-cubic, user request for an even softer and more dramatic snap — the fast-start of ease-out-quart felt brutal on second review). `HARD_COOLDOWN_MS` bumped accordingly (560 → 680 = 440ms snap + 240ms inertia buffer)._

### Carousel geometry tightening (2026-05-10)
`--nbr-slide` 3.4 → 3; `--slide-spacing` `clamp(28px, 3.6vw, 52px)` → `clamp(16px, 2vw, 28px)`. Moving to an integer slide count activates the sentinel_0 ↔ page-pad alignment invariant (see Carousel — runtime-critical token block above). User request: align the first carousel card's left edge with the left edge of the lime hero card above.

### Removed: live-follow for wheel/trackpad (2026-05-10) — restored for touch (2026-05-10)
Earlier versions wrote a live `transform` during the gesture — first uncapped, then capped to `±slideStep`, then refined to a boundary-aware directional cap at `0.35 × slideStep` (`LIVE_FOLLOW_GAIN = 0.35`). Even at 35% of a slide width the snap-back was perceptible as "dépasse puis revient". Decision: remove all live `transform` writes during **wheel/trackpad** gestures entirely. The wheel path remains a **pure state machine**: `wheelAccum` captures the gesture silently; the carousel only moves when `setActiveIndex` fires the 440ms ease-in-out-cubic CSS transition. Sub-threshold wheel gestures end with no visible change.

Touch live-follow was later re-introduced (2026-05-10) — see design decision entry below. The removal was always **wheel/trackpad-specific**; touch has a different UX contract (direct manipulation vs. accumulation).

### Hard cooldown 680ms (no extension)
Previous versions extended the cooldown on every wheel event during the cooldown window. Trackpad inertia kept the cooldown alive forever, blocking new gestures. Now: cooldown is a hard cap that does NOT extend; new gestures are blocked for exactly 680ms after a fire, then the next legitimate gesture fires immediately.

### Wheel fire-on-threshold pattern (2026-05-10, revised 2026-05-10)
**Initial idle-fire approach (reverted):** the wheel fire was moved from the listener to `wheelIdleHandler` (after `SILENCE_RESET_MS = 30ms` of silence). The intent was to accumulate the full gesture before snapping. It was reverted because: (1) trackpad inertia lasts 300-600ms after the finger lifts → waiting for silence caused perceived latency; (2) accumulation continued during inertia, so ordinary gestures overshot into multi-step territory. `lastEventTime` state variable removed (no longer needed).

**Current fire-on-threshold approach:** the snap fires immediately in the listener the instant `|wheelAccum| >= WHEEL_THRESHOLD`. `wheelIdleHandler` becomes a pure reset (no fire) for sub-threshold gestures only. Every fire calls `setActiveIndex(activeIndex + dir)` — exactly one step, no multi-step multiplier. The 680ms hard cooldown absorbs residual inertia after the fire. Touch handler: `touchend` fires `setActiveIndex(activeIndex + dir)` when `|touchCurrentDx| >= 50` — same single-step contract.

### Removed: spike + pause heuristics for new-gesture detection
Earlier iterations tried to detect new gestures via deltaX magnitude spike + time gap heuristics. These were unreliable — small trackpad fluctuations triggered false spikes. Replaced with the simpler hard-cooldown model. Worst-case latency between two intentional gestures is ~680ms, but it's deterministic.

### Touch live-follow re-introduced (2026-05-10)
During `touchmove`, the card now follows the finger in real time: the CSS transition is disabled (`container.style.transition = 'none'`) and the container transform is written directly as `translate3d(touchBaseOffset + touchCurrentDx, 0, 0)`, where `touchBaseOffset = computeOffsetForIndex(activeIndex)` is captured at `touchstart`. On `touchend`, the transition is restored (`container.style.transition = ''`) and the snap logic runs normally: `|touchCurrentDx| >= 50` → `setActiveIndex(targetIdx)` or `rubberBand(dir)`; sub-threshold → `setActiveIndex(activeIndex)` (re-center via CSS transition). `touchcancel` also restores the transition and calls `setActiveIndex(activeIndex)`. State variable added: `touchBaseOffset`.

Wheel/trackpad live-follow remains removed (decision preserved). Rationale: touch and wheel have distinct UX contracts — a finger on glass creates a direct-manipulation expectation (card must follow the finger); a trackpad gesture is an accumulated intention (no live feedback, snap fires at threshold). Inertia behavior also differs: wheel events continue after finger lift (scroll inertia), making live-follow on wheel prone to overshoot and snap-back artifacts.

### Constant 40px gap from buttons — unified lift mechanism (2026-05-10)

`--phone-button-gap` (CSS token, `clamp(130px, 10vw, 170px)`) and `--mobile-phone-overlap` (live JS calculation on mobile only) were removed. The CSS initial value of `--scroll` was changed from `calc(-60% + var(--phone-button-gap))` to `0px` (JS owns the value entirely).

Replacement: CSS token `--desired-button-gap: clamp(24px, 4vh, 56px)`, read dynamically by JS via `parseFloat(getComputedStyle(documentElement).getPropertyValue('--desired-button-gap'))`. Migrated from the former hardcoded JS constant `DESIRED_GAP_FROM_BUTTONS = 40`. Responsive range: 24px floor (mobile / short viewports), ~40px at ~1000px viewport height, 56px ceiling (4K / tall screens). On every rAF tick (scroll / resize / orientationchange / load), `computeBaseLift()` reads `buttonsRect.bottom`, `phoneNaturalTop` (= `phoneRect.top - readPhoneTranslateY(phone)`), and the current `desiredGap` from `getComputedStyle`, then returns `buttonsRect.bottom + desiredGap - phoneNaturalTop`. The page-scroll-progress block writes `--scroll: ${baseLift * inv}px`. At `inv = 1` (carousel just entered viewport), the phone top is exactly `buttonsBottom + desiredGap` by algebra — guaranteed at every viewport width, orientation, and font-load state. Desktop and mobile share a single `updateScroll` function; there is no longer a separate mobile code path for this mechanism.

### Carousel idempotent JS centering (2026-05-10)
`computeOffsetForIndex` migrated from a static formula (`viewport.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2)`) to an idempotent composition: `getCurrentTranslateX() + (window.innerWidth / 2 - slideCenter)`, where `slideCenter` comes from `slide.getBoundingClientRect()`.

Motivations:
- The old formula mixed coordinate systems (`offsetLeft` = layout-relative, `clientWidth` = viewport-relative). Calling it mid-transition returned a stale layout position, not the live interpolated one.
- `getBoundingClientRect()` returns the live on-screen position including mid-transition interpolation — safe to call at any point.
- `getComputedStyle().transform` (read via `DOMMatrixReadOnly`) returns the live computed transform, not the target inline value — correct for composition.
- The result is idempotent: if the slide is already centered, the delta is 0 and the call is a no-op.

Paired changes: `min-width: 0` added to `.screen-card` (prevents flex `min-width: auto` from expanding slides beyond `--slide-size`); `cardEntrance` keyframe (opacity + blur, no scale) replaces `titleEntrance` on `.hero-card`.

### Mobile hero — floating tile equal margins (2026-05-10)

`.hero-card` on mobile (`max-width: 767px`) is a **floating tile**: card centred horizontally via `margin-inline: auto`, full all-corners border-radius (`clamp(24px, 7vw, 32px)`). `.hero { padding: 0 }` — spacing comes from the card's own margin formula, not the wrapper. Carousel (`.screens-rail`) is intentionally below the fold.

**Current margin formula (inline/block split, 2026-05-11):**
- Inline (left/right): `--mobile-hero-card-margin: clamp(20px, 5vw, 40px)` — controls `width: calc(100% - 2 * var(--mobile-hero-card-margin))` and aligns `.screens-rail`/`.faq` `padding-inline`.
- Block (top/bottom): `--mobile-hero-card-margin-block: clamp(30px, 7.5vw, 60px)` — controls `margin-top`, `margin-bottom`, `min-height: calc(100svh - 2 * var(--mobile-hero-card-margin-block))` (≈ 85–87 % of viewport), and `.wordmark top`.
- Equal block margins (top = bottom) preserve the optical balance invariant; inline margins are intentionally tighter to keep carousel slide edges aligned with the lime card.

_Addendum (2026-05-11): the "equal margins all sides" pattern from `feedback_website_hero_pattern.md` has evolved into **equal block margins (top = bottom) + tighter inline margins (left = right)**. The invariant that matters is symmetry within each axis — not that all four values are identical. The two axes are governed by separate tokens and must stay decoupled._

_Iteration history: full-bleed (`width: 100%`, reverted quickly) → side-margins only (`clamp(24px, 6vw, 40px)` inline, top = `--page-pad`, bottom flat) → floating tile, single token all sides (2026-05-10) → **floating tile, inline/block split** (current, 2026-05-11)._

---

## Floating cards — dimensions & mobile overrides

All use the double-wrapper pattern: **outer** `.floating-card-parallax` carries position + parallax translate; **inner** `.floating-card-inner` carries the levitation keyframe. `pointer-events: none` on the outer wrapper is load-bearing (cards sit above interactive content).

**Sur mobile (`max-width: 767px`), toutes les `.floating-card-parallax` sont masquées via `display: none !important` (`styles.css:4199`). Aucune card/badge n'est rendue. Décision prise 2026-05-12.**

_(All per-card mobile position/dimension overrides that existed prior to 2026-05-12 have been removed from CSS and from this doc. The blanket kill rule supersedes them entirely.)_

---

### Card 1 — notification (`.floating-card--notif`, `[data-card-id="1"]`)

Desktop host: `.hero` — `bottom: 30%; left: 2%; rotate: -8deg`.

---

### Card 3 — team grid (`.floating-card--team`, `[data-card-id="3"]`)

Desktop host: `.how-quest` — `top: -13%; right: 4%; left: auto; rotate: 3deg`. Desktop width: `clamp(260px, 20vw, 300px)`.

Rationale: at `-13%`, the card is lifted ~90–115 px above `.how-quest`'s top edge and floats visually in the lower-right area of `.hero`, just above the "PARCOURS" eyebrow. This is the arithmetic midpoint between the origin (`top: -4%`) and the previous value (`top: -22%`, judged too high). This relies on `.how-quest { overflow-x: clip }` which — per CSS spec — does **not** promote `overflow-y` to `auto`, so the negative-top bleed on the Y axis remains visible. Parallax: base rule `translate: 0 var(--parallax-y, 0px)`, `data-parallax-speed="0.08"` (no desktop override).

---

### Card 6 — rotating badge (`.floating-badge`, `[data-card-id="6"]`)

Desktop host: `.faq` — `top: -8%; right: 8%; left: auto; bottom: auto; translate: 0 var(--parallax-y, 0px); rotate: 12deg`. Desktop size: `143px × 143px`.

The badge is lifted above `.faq`'s top edge (via `top: -8%`) and appears visually in the lower-right area beneath step 3 of `.how-quest` (PARCOURS). This works because `.faq { overflow-x: clip }` — per CSS spec, `overflow-x: clip` does **not** promote `overflow-y` to `auto`, so the negative-top bleed remains visible. `right: 8%` resolves against `.faq`'s full-bleed padding-box width (≈ viewport width): 8% of 1440 px ≈ 115 px, placing the badge's left edge ~180–215 px from the right viewport edge — naturally under the rightmost `.quest-step` column (step 3). `translate: 0 var(--parallax-y, 0px)` preserves JS-driven Y parallax without the former `-50% X` centering shift (which was only needed when the badge was `left: 50%`-anchored).

**+10% size bump (2026-05-12):** disc bumped from `130px → 143px` (`styles.css:2447`). The central arrow SVG (`index.html` line 547 carries HTML attrs `width="28" height="28"`) is bumped to `31px` via CSS override (`styles.css:2510` — `28 × 1.10 ≈ 30.8 → 31`; CSS wins over presentational HTML attrs per spec). `.floating-badge__rotor-text` stays at `font-size: 11px; letter-spacing: 0.18em` — the text arc scales automatically because `.floating-badge__rotor-svg` fills the disc with `width: 100%; height: 100%`, so the SVG viewBox (`0 0 130 130`) is physically stretched to 143px, enlarging the text-on-path proportionally.

---

### Card 2 — scoreboard (`.floating-card--scoreboard`, `[data-card-id="2"]`)

Desktop host: `.how-quest` — `top: 4%; left: 4%; right: auto; rotate: -6deg`.

| Property | Value |
|----------|-------|
| `top` | `4%` (raised from `12%` on 2026-05-12, delta −8 pts; floats at the eyebrow/"PARCOURS" / H2 level, widening the vertical gap above `.quest-step-numeral` "01") |
| `left` | `4%` |
| `right` | `auto` |
| `rotate` | `-6deg` |
| `translate` | `0 var(--parallax-y, 0px)` (inherited from base rule) |

Rationale: the card sits on the **left** side of `.how-quest`, well clear of the centred H2 (whose container caps at `--container-max: 1200px`). At any viewport ≥ 768 px the centred H2's left edge sits at least ~25–30 % from the section's left edge, so the card (~280 px wide max) at `left: 4%` cannot overlap it. `top: 4%` positions the card's visual centre near the eyebrow/H2 row, accentuating the visual separation from the quest-steps below. The `−6deg` tilt reads as "leaning toward the title" given the left-side placement.

Hidden on mobile: covered by the blanket `display: none !important` kill rule (`styles.css:4199`) along with all other cards. Original rationale: density — the narrow `.how-quest` cannot accommodate it without crowding the stacked-column layout.

---

### Parallax mechanism (all cards)

JS writes `--parallax-y` as a CSS custom property on each `.floating-card-parallax` element via `IntersectionObserver` + `scroll`. The base rule sets `translate: 0 var(--parallax-y, 0px)`. Cards that need X-centering override this with `translate: -50% var(--parallax-y, 0px)`. The individual `translate` property and the `transform: translateZ(0)` compositor hint sit on separate properties and do not conflict.

Current `data-parallax-speed` values are harmonised in the `[0.06, 0.08]` range (card 1: `0.07`, card 2: `0.06`, card 3: `0.08`, card 6 badge: `0.06`). Speeds were reduced from their former `0.15–0.25` range to prevent a perceptible ~22px jump per 100px wheel detent; the lerp (see below) absorbs any residual quantisation.

#### Lerp model — target/current with self-rescheduling RAF

The parallax engine uses a **target/current lerp** pattern rather than writing the geometry-derived value directly to `--parallax-y` on every scroll event.

**Per-card state** (initialised in `cardData` map, `setup()` in `script.js`): each card record carries `targetY` (geometry-driven destination, recomputed each tick) and `currentY` (smoothed value actually written to `--parallax-y`). Both start at `0` in the map literal and are snapped to the geometry-correct value at the end of `setup()` — see "Snap patterns" below.

**Constants:**
- `SMOOTHING = 0.14` — lerp fraction applied per frame: `currentY += (targetY - currentY) * SMOOTHING`. At 60 fps this closes ~90% of the remaining gap within ~15 frames (~250 ms) — brisk enough to feel responsive while masking wheel-detent quantisation.
- `EPS = 0.1` — convergence threshold in px. When `|targetY - currentY| < EPS` for **all** cards, the loop exits and `rafRunning` flips to `false`.

**`tick()` (the rAF callback):** recomputes `targetY = -(latestScrollY - sectionTopAtRest) * speed` for each card, steps `currentY` toward it via the lerp, writes `--parallax-y`, and self-reschedules with `requestAnimationFrame(tick)` if at least one card has not yet converged. When all cards converge, `rafRunning = false` and the loop exits. The next scroll event re-arms it (see `onScroll`).

**`onScroll()`:** only updates `latestScrollY` (one property read, zero layout work, `{ passive: true }`) and re-arms the loop via `requestAnimationFrame(tick)` **only if `!rafRunning`**. If the loop is already live it will pick up the updated `latestScrollY` on its next iteration.

**Snap patterns — hard-jump to avoid animated "rentées":**

- **Initial snap in `setup()`:** after `measureGeometry()` runs synchronously, `currentY = targetY` is set for every card and `--parallax-y` is written directly. This ensures cards mount at their geometry-correct position even when the page is loaded mid-scroll (anchor link to `#faq`, browser scroll restoration). Without the snap every card would lerp in from `0` over ~250 ms after first paint.

- **Re-snap in `onLayoutChange` (debounced 150 ms):** after `resize` or `orientationchange` causes a re-measure, `sectionTopAtRest` shifts. Rather than letting the lerp loop ease from the stale `currentY` toward the new `targetY` (which reads as a jarring animated catch-up), the handler hard-snaps `currentY = targetY` and writes `--parallax-y` synchronously. A resize/orientation flip is a viewport discontinuity — a hard jump is correct.

- **Re-snap in `loadListener`:** the `load` event fires after webfont swap, which can shift section tops by tens of pixels. The same snap pattern as `onLayoutChange` is applied so the cards don't drift visibly post-load.

#### Gates / early-returns (`script.js` parallax IIFE)

The parallax IIFE evaluates three sequential guards before any listener is registered. Guards 1 and 2 are permanent early-returns (the IIFE exits); Guard 3 is dynamic (a live MQL drives `setup()` / `teardown()`).

- **Gate 1 — `prefers-reduced-motion`:** `window.matchMedia('(prefers-reduced-motion: reduce)').matches` — if true, the entire IIFE returns immediately. Cards stay at their CSS-defined base position (`--parallax-y` defaults to `0px` via the `var()` fallback). Evaluated before any other work.

- **Gate 2 — no cards present:** `cards.length === 0` — if no `.floating-card-parallax` elements exist in the DOM (e.g. future utility pages, or a refactor that removes them), the IIFE exits silently. No observer, no listener, no allocation.

- **Gate 3 — mobile breakpoint:** `window.matchMedia('(max-width: 767px)')` held as a live `MediaQueryList`. On mobile load, `setup()` is never called — no `IntersectionObserver`, no scroll/resize/orientationchange/load listener is attached. A `change` listener on the MQL handles breakpoint crossings mid-session: crossing into mobile calls `teardown()` (disconnects IO, removes all listeners, clears debounce timer, resets `rafRunning = false`); crossing back to desktop calls `setup()`. Safari < 14 fallback uses the deprecated `mobileQuery.addListener()` API.

**IntersectionObserver scroll-gate:** within `setup()`, an `IntersectionObserver` (`rootMargin: '20% 0% 20% 0%'`) tracks unique parent sections (`.how-quest`, `.faq`). The `window scroll` listener is attached only while at least one parent is intersecting (`visibleParents > 0`) and detached when none are. A counter (`visibleParents`) — not a boolean — handles the `.how-quest visible` → `.faq visible` → `.how-quest exits` transition without flapping the listener off then back on. A synthetic `onScroll()` call on IO re-entry re-syncs `--parallax-y` before the next real scroll event.

**Listener symmetry:** `setup()` attaches `scroll` (via IO gate), `resize`, `orientationchange`, `load`. `teardown()` removes the exact same references. `setup()` is idempotent (`if (io !== null) return`); `teardown()` is idempotent (`if (io === null) return`).

---

## Cursor trail (§18 — `script.js` lines 1140–1440)

Self-contained IIFE outside the main `script.js` IIFE. Pairs with two elements in `index.html` (lines 731–732):

```html
<canvas class="cursor-trail" aria-hidden="true"></canvas>
<span class="cursor-emoji" aria-hidden="true">🏐</span>
```

CSS counterpart: `styles.css` §18 (`.cursor-trail`, `.cursor-emoji`) — full-viewport canvas pinned via `position: fixed; inset: 0`; emoji pinned at `top: 0; left: 0` with an initial off-screen `translate3d(-100px, -100px, 0)`.

### Guards (desktop-only)

The IIFE exits immediately (`return`) if any of the following match at page load:

| Media query | Reason |
|---|---|
| `prefers-reduced-motion: reduce` | accessibility |
| `pointer: coarse` | touch device — no cursor |
| `max-width: 767px` | mobile viewport |

These three guards mirror the CSS `display: none` rules in `styles.css` §18 so no listeners or rAF loops are attached on excluded devices.

### Emoji rigid-follow

On every `mousemove`, the emoji receives a direct `style.transform` write (no lerp, no easing):

```
translate3d(x, y, 0) translate(-50%, -50%)
```

The first `translate3d` places the emoji's top-left at the cursor pixel; the second `translate` (in `%` of the emoji's own size) recenters it on the hot-spot. CSS guarantees no `transform` transition on `.cursor-emoji` — only `opacity` is transitioned (120 ms ease, used for show/hide on `document` `mouseenter`/`mouseleave`).

On `mouseleave`, `opacity` is set to `0`; on `mouseenter`, back to `1`. Spring state is NOT reset — chains continue oscillating and settle naturally.

### Spring-chain multi-trails algorithm

#### Data model

| Object | Fields | Role |
|---|---|---|
| `Node` | `x, y, vx, vy` | one mass-spring node (viewport px) |
| `Line` | `spring, friction, nodes[]` | one chain of `CHAIN_SIZE` nodes |
| `pos` | `{x, y}` | shared cursor target (mutated per `mousemove`) |

`TRAILS_COUNT` independent `Line` instances are stored in `lines[]`.

#### Per-frame physics (called per `Line.update`)

1. First node (`nodes[0]`) receives spring force toward `pos`:
   ```
   vx += (pos.x - x) * spring
   vy += (pos.y - y) * spring
   ```
2. For nodes `i = 1 … CHAIN_SIZE-1`, spring force is toward the previous node + DAMPENING coupling from the predecessor's velocity:
   ```
   vx += (prev.x - x) * spring
   vy += (prev.y - y) * spring
   vx += prev.vx * DAMPENING
   vy += prev.vy * DAMPENING
   ```
3. Per node: `vx *= friction`, `vy *= friction`, then `x += vx`, `y += vy`.
4. After each node: `spring *= TENSION` (stiffness decays along the chain — tail is looser than head).

#### Rendering (called per `Line.draw`)

Smooth quadratic curves via the mid-point technique: for each pair of adjacent nodes `(a, b)`, the control point is `a` and the endpoint is the midpoint `(a+b)/2`. This guarantees C¹-continuous junctions with one `quadraticCurveTo` per node. The final segment terminates at the actual last node position so the tail tip is not clipped short. One `beginPath`/`stroke` per chain per frame.

Canvas 2D state (set inside `resize()`, not per-frame):
- `globalCompositeOperation = 'source-over'` — additive `lighter` does not work on Yamatch's near-white background (it was designed for black backgrounds).
- `strokeStyle = rgba(16, 24, 40, 0.04)` — matches `--color-text-primary #101828`.
- `lineWidth = LINE_WIDTH` (2 px).

### Tuning constants

| Constant | Value | Role |
|---|---|---|
| `TRAILS_COUNT` | 50 | number of independent spring chains (reduced from 80 to leave headroom for concurrent rAF loops: page-scroll writer, waves, floating-cards parallax) |
| `CHAIN_SIZE` | 30 | nodes per chain — determines tendril length (réduit de 50 → 30 post-test utilisateur 2026-05-13 pour des tendrils plus contenus) |
| `LINE_WIDTH` | 2 | px stroke width — subtle on light background; 3 px read as obtrusive |
| `STROKE_ALPHA` | 0.04 | alpha over `rgba(16, 24, 40, …)` — upper edge of "subtle decoration" for the Yamatch épuré aesthetic |
| `SPRING_BASE` | 0.4 | base spring stiffness for the first node of each chain |
| `FRICTION_BASE` | 0.5 | per-node velocity damping factor |
| `DAMPENING` | 0.025 | intra-chain velocity coupling — fraction of predecessor velocity added to each node |
| `TENSION` | 0.99 | spring decay multiplier applied after each node — makes the tail feel progressively looser |

Per-chain jitter: each `Line` is constructed with `spring = SPRING_BASE ± 0.05` (random) and `friction = FRICTION_BASE ± 0.005` (random) so the 50 chains fan out into a brush-like cloud rather than moving in lockstep.

### Lazy initialisation

`lines` is `null` at startup. On the first `mousemove`, `initLines()` creates all 50 `Line` instances with `pos` already set to the cursor's first known position — nodes are seeded at the cursor, so the chains unspool from there on first movement. This avoids the one-shot "snake explosion" that would occur if chains were pre-anchored at `innerWidth/2, innerHeight/2` and the cursor first appeared in a corner.

The rAF loop starts immediately at IIFE init (`requestAnimationFrame(render)`) but does nothing while `lines === null` — `render()` short-circuits after `clearRect`.

### DPR-aware sizing

`resize()` (called once at init and on `window resize`) sets `canvas.width = Math.round(innerWidth * dpr)` and applies `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` to RESET (not multiply) the transform matrix, preventing stacked scale factors on consecutive resizes. Because assigning `canvas.width/height` resets the 2D context state to defaults, `globalCompositeOperation`, `strokeStyle`, and `lineWidth` are re-applied inside `resize()`.

### Contrast with the old polyline comet algorithm

The prior implementation used a single polyline with a FIFO buffer of recent cursor positions faded by age (`MAX_AGE_MS`). The new system has no historical position buffer — `pos` holds only the current cursor position. The visual "memory" of past positions is encoded entirely in the physical state of the nodes (their `x, y, vx, vy`), not in an explicit buffer. The old system had one curve; the new system has 50 independent curves whose independent spring jitter produces the brush-like cloud effect.

---

## Memory of rejected approaches (do NOT propose these without explicit user request)

- **Embla Carousel** (vendored CDN with SRI hash) — non-deterministic centering issues; replaced with custom JS state machine.
- **Native `overflow-x: auto` + `scroll-snap-type: x mandatory`** — incompatible with the active phone lift (overflow-y promotion to `auto` clips the lift).
- **Hybrid: native scroll + hero phone overlay** — broke the hero layout; abandoned.
- **Rubber-band at boundaries with overshoot bezier** — the overshoot curve (`cubic-bezier(0.34, 1.2, 0.64, 1)`, y2 > 1) created visible bouncing that looked like a bug. _Re-introduced 2026-05-10 with a non-overshoot bezier (`cubic-bezier(0.65, 0, 0.35, 1)`) — the original rejection was specific to overshoot curves; the current bounce uses the same ease-in-out-cubic as the normal snap, so it reads as composed rather than springy._
- **Spring-out easing curves** with y2 > 1 (overshoot) — rejected on every snap test; user finds them distracting.
- **Auto-rotating carousel** — user wants user-driven, not auto-advance.
- **`max-width` on `.hero-card`** — caps the side margins on wide viewports, breaking the equal-on-all-sides margin invariant.
- **`transform: translate(-50%, -50%)` on the wordmark** — fights the entrance animation; use the `translate` individual property instead.

---

## Conventions reference

- All design tokens in `:root`. No hardcoded hex/font/radius outside this block.
- French copy throughout (`tu` form for player-facing). Volley-only positioning — see Positionnement produit.
- No emojis in markup unless explicitly requested.
- No third-party scripts without explicit user approval. Any CDN script must carry a `sha384` SRI hash + `crossorigin="anonymous"`.
- All `<img>` carry meaningful French alt text (or empty alt for decorative).
- `draggable="false"` on phone images; `aria-hidden="true"` + `focusable="false"` on decorative SVG.
- One CSS source (`styles.css`) → one minified output (`styles.min.css`, gitignored). HTML always points to `styles.min.css`. Two JS files: `carousel.js` (state machine) + `script.js` (all other JS). No XHTML mirror.
- No Google Fonts `<link>` or `preconnect` tags. All fonts are self-hosted under `website/fonts/`.

### Copy — registre de voix

| Destinataire | Registre | Exemples |
|---|---|---|
| Participant (joueur) | `tu` | "Trouve un tournoi", "Inscris ton équipe", "Place au jeu" |
| Organisateur | `vous` (vouvoiement) | "Créez votre tournoi", "Automatisez les inscriptions", "Gérez le jour J" |
| FAQ | mixte selon la réponse | `tu` si la réponse s'adresse à un joueur, `vous` si à un organisateur |

Cette distinction est portée par `PERSONA_CONTENT` dans `script.js` — ne pas mélanger les registres au sein d'un même step ou d'une même réponse FAQ.

### Typographie — règles d'apostrophe et d'espacement

- **Apostrophes typographiques** (U+2019 `'`) obligatoires dans toute la copy user-facing — jamais l'apostrophe droite ASCII (`'`).
- **Espace insécable** (U+00A0) avant `%` et entre un nombre et son unité (`24 h`, `4,5 %`).
