# Yamatch Marketing Website — Architecture

**Single source of truth for the marketing site at `website/`.**

This doc is mandatory pre-flight reading for `html-expert`, `css-expert`, `js-expert`, and `website-reviewer` before any modification. If this doc disagrees with the actual code, the **code wins** — flag the drift in the report and update this doc via `doc-keeper`.

Last sync: 2026-10-22 (desktop participant hero viewport sizing and matching bottom/side gutters, mobile title and Volleyball badge centring; Stories S1 hidden shell and asset requirements; participant public tournament grid and recent ticker; HOW V2 coded three-card journey, progressive reveal and FAQ-only parallax; participant V2 split hero, shared fixed full-width navigation bar, decorative app cards and screenshot-carousel removal; public tournament rails and shared organiser loading; coded interactive management demo restyled from Flutter components with local illustrative data; organiser layout and FAQ, announcement-banner and phone-pointer-motion removal, native cursor without decorative trail; homepage tournament-notification decoration removed; homepage lime/grid replaced by a responsive action photograph; phone privacy preserved; configurable commission and order privacy prepared for coordinated rollout).

---

## Positionnement produit

Yamatch est positionné comme une **app de tournois sportifs amateurs** — le **volleyball** est le premier sport disponible, d'autres sports arrivent. La copy autorise (et encourage) la mention "d'autres sports à venir", **sans jamais nommer ces sports** (formulations correctes : "& co", "et plus", "d'autres sports" ; interdit : nommer un second sport comme basket ou foot).

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

## Conditions financières — préparation du 1er octobre 2026

La FAQ visible et son miroir JSON-LD (`website/index.html`), ainsi que l’article 6.1 des CGU (`website/cgu/index.html`), présentent une commission **ajoutée** au prix de base : 8 % par défaut pour les inscriptions, goodies et restauration. Un taux personnalisé par tournoi prévaut sur celui de l’organisateur ; l’absence de taux personnalisé laisse le défaut s’appliquer. Le taux et le total sont affichés avant paiement, et les paiements déjà commencés conservent leur taux enregistré. L’exemple 10 € → 10,80 € préserve les 10 € de base organisateur.

Cette copie est préparée dans la PR brouillon #32 et doit être publiée avec la mise en service coordonnée des commissions dans l’app, le backend et l’admin. Elle ne constitue pas une preuve d’activation : aucun déploiement ni publication n’a été effectué pendant cette modification. La politique de confidentialité goodies déjà revue reste inchangée par ce complément. Aucun changement de structure HTML, de CSS ou de JavaScript.

---

## Tech stack

Vanilla **HTML5 + CSS3 + ES2020+ JavaScript**. No framework. The production build validates the public tournament PROD configuration, generates Android Digital Asset Links from a configured fingerprint, minifies CSS, then validates both native association contracts. Homepage source files and retained historical carousel (the organiser route has its own local CSS and JS, documented below):

| File | Role | Approx. lines |
|------|------|---------------|
| `website/index.html` | Single page — hero + participant journey + public tournament rail + FAQ + footer | ~735 |
| `website/styles.css` | All styles. Design tokens in `:root`. Heavy use of `clamp()`. **Source of truth — never minify by hand.** | ~4664 |
| `website/carousel.js` | Historical standalone gesture state machine (wheel + touch + rubber-band); retained on disk but no HTML page loads it. | ~419 |
| `website/script.js` | Homepage IIFE plus independent public tournament rail IIFE: copyright year, toast scaffolding (`window.yamatchToast`, exposed but currently zero in-repo callers since both hero CTAs became real links — see Hero below), shared fixed glass header, progressive journey reveal, QR widget rendering, floating-card parallax spring-chain, shared public tournament loading and rendering. | ~1672 |

The homepage no longer loads `carousel.js`: the five-screenshot `.screens-rail` and its initialization block in `script.js` have been removed at the founder’s request. The hero directly precedes HOW. `script.js` and the QR vendor remain deferred; the public tournament rail remains independent and active when data is available.

HTML pages reference **`styles.min.css`** (the generated shared output), not `styles.css`. The homepage additionally loads `app-screens.css` directly after that shared stylesheet for its coded discovery and three journey illustrations; it is outside the CSS minification build. `/organisateur/` additionally loads its local `hero-organisateur.css`, then `gestion-organisateur.css`, after the shared stylesheet.

`website/vendor/qrcode.min.js` (20,768 bytes) is a vendored third-party library — **not** one of the four source files above and not authored in-repo. It ships `qrcode-generator@1.4.4` (Kazuhiko Arase, MIT license), byte-identical to the former jsdelivr CDN build. Loaded via `<script src="vendor/qrcode.min.js" defer>` in `index.html`, **before** `script.js`, which calls the global `window.qrcode` factory to render the homepage QR widget. See SEO → Third-party scripts below for the CDN → self-host migration history.

---

## Production build

| Aspect | Detail |
|--------|--------|
| Tool | `lightningcss-cli` (devDependency `^1.32.0`) |
| Source | `website/styles.css` — single source of truth, never minified by hand |
| Output | `website/styles.min.css` — generated; **gitignored** (never committed) |
| Sizes | 224 KB source → 37 KB minified raw / 71 KB → 7 KB gzip (~90% gzip reduction) |
| npm script | `npm run build:css` — `lightningcss --minify --bundle --targets '>= 0.5%' website/styles.css -o website/styles.min.css` |
| Pre-hooks | `predev`, `prestart`, `prepreview` all run `build:css` automatically before `live-server` starts |
| CI | `.github/workflows/deploy.yml` leaves PR verification at `contents: read`; only the deploy job receives `pages: write` and `id-token: write`. It passes the repository variable `PLAY_APP_SIGNING_SHA256`, then runs `npm run build` before the custom tar + `upload-artifact` step |

`npm run build` is fail-closed: it first runs `validate:tournament` (`scripts/validate-tournament-config.mjs`), which requires the exact PROD URL and publishable key in the tournament page (rejecting a changed URL or key independently), then generates `website/.well-known/assetlinks.json`, minifies CSS, then validates the exact AASA contract (one applinks detail, seven routes and webcredentials), the Android association state and the seven fallback routes. In pending mode (empty allowlist and absent variable), Android must be exactly `[]`, so no certificate is trusted. In active mode, Android must contain one exact statement (`handle_all_urls`, package and independently verified fingerprint). `assetlinks.json` is generated and gitignored; no static placeholder may be committed or deployed. A non-empty allowlist without its matching variable, an unallowlisted fingerprint or the explicitly rejected upload-key fingerprint stops the build.

Pull requests run `npm ci`, `npm test`, build the current production association state with the optional repository variable, then build the future active state with `NODE_ENV=test`, the allowlist under `test/fixtures/`, and an output under the runner temporary directory. The generator rejects a fixture override outside test mode and rejects a test fixture targeting the production output. After Pages deployment, `npm run smoke:deep-links` retries the two canonical `/.well-known/` endpoints and verifies the exact AASA plus either the empty pending Android state or the active Android contract against the deployed fingerprint.

**Rule:** edit `website/styles.css` for shared styling. The minified file is a build artifact — do not edit it and do not commit it. The organiser hero is isolated in `website/organisateur/hero-organisateur.css`, served directly after the shared output; this local stylesheet and `gestion-organisateur.css` are not part of `build:css`.

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

> **`404.html` — root-relative paths required.** `404.html` lives at the site root but GitHub Pages serves it at the URL that triggered the 404 (e.g. `/auth/callback`). A relative `href="fonts/Inter-Variable.woff2"` would resolve to `/auth/fonts/Inter-Variable.woff2` → another 404 → page rendered unstyled (previously caused unstyled 404 on deep URLs like `/auth/callback`). All assets in `404.html` must use root-relative paths: `/fonts/Inter-Variable.woff2`, `/styles.min.css`.

Roboto VF is **not** preloaded — it is used only for headings below the fold.

### Weight 800 — native (no faux-bold)

`.floating-card__team-eyebrow`, `.floating-card__score-value`, `.floating-badge__rotor-text` all declare `font-weight: 800`. With the VF, this resolves to the real `wght=800` axis position on both Inter and Roboto. The previous Google CDN payload only shipped wght=700, which caused faux-bold rendering on these elements.

### No Google Fonts link tags

No `<link rel="preconnect" href="https://fonts.googleapis.com">` or `fonts.gstatic.com` appear in any HTML file. Do not re-introduce them.

---

## SEO

### Robots / indexing

- `<meta name="robots" content="index, follow">` **and** `<meta name="googlebot" content="index, follow">` are present on the home, organiser page and utility sub-pages (mentions-legales, cgu, contact, download, politique-confidentialite, politique-annulation-remboursement, suppression-compte).
- `website/404.html` retains `<meta name="robots" content="noindex">` and does **not** carry a googlebot tag.

### Deep-link anchors

| Section | Anchor |
|---------|--------|
| `.how-quest` | `id="how-it-works"` |
| `/organisateur/` → `.ym-orga-band` | `id="organisateurs"` (route-specific; no homepage anchor) |
| `/organisateur/` → `.ym-gest` | `id="gestion-tournoi"` (coded interactive management demo) |
| `.showcase` (both routes) | `id="derniers-tournois"` (hidden without a valid relevant ticket) |
| `.faq` | `id="faq"` |

### Sitemap

`website/sitemap.xml` lists 8 URLs. `/download/` remains excluded (UA redirect, not indexable).

| URL | `<lastmod>` | `<changefreq>` | `<priority>` |
|-----|-------------|----------------|--------------|
| `https://appyamatch.fr/` | 2026-09-20 | weekly | 1.0 |
| `https://appyamatch.fr/organisateur/` | 2026-10-14 | monthly | 0.8 |
| `https://appyamatch.fr/mentions-legales/` | 2026-05-13 | monthly | 0.4 |
| `https://appyamatch.fr/cgu/` | 2026-09-20 | monthly | 0.4 |
| `https://appyamatch.fr/politique-annulation-remboursement/` | 2026-09-20 | monthly | 0.4 |
| `https://appyamatch.fr/politique-confidentialite/` | 2026-05-13 | monthly | 0.4 |
| `https://appyamatch.fr/suppression-compte/` | 2026-05-13 | monthly | 0.4 |
| `https://appyamatch.fr/contact/` | 2026-05-13 | monthly | 0.5 |

### Third-party scripts — none (self-hosted, migrated 2026-07-05)

The site ships **zero third-party `<script>` dependencies** — every script is same-origin. Until 2026-07-05, the qrcode-generator library was loaded from the jsdelivr CDN with an SRI hash:

```html
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"
        integrity="sha384-lQXOAyZwHXE55JFyrOMB7nY2Wv+m5ZWNtJcHrd1rceRQXAYNLak8ukN5TjBTcIwz"
        crossorigin="anonymous" defer></script>
```

It is now vendored in-repo at `website/vendor/qrcode.min.js` (byte-identical to the CDN build) and loaded same-origin:

```html
<script src="vendor/qrcode.min.js" defer></script>
```

No `integrity`/`crossorigin` attributes are needed (same-origin request never needs SRI). The `<link rel="preconnect" href="https://cdn.jsdelivr.net">` that used to warm the CDN connection was removed at the same time.

**Why:** eliminates the last third-party network request on the page — no DNS lookup/TLS handshake to a third-party host, no exposure to CDN outages, and no external request for privacy-conscious browsers (e.g. Firefox strict tracking protection) or ad/script blockers to flag.

**Rule for the future:** any CDN script reintroduced must include a `sha384` SRI hash and `crossorigin="anonymous"` (see Conventions reference).

### JSON-LD blocks (`index.html`)

Four JSON-LD `<script type="application/ld+json">` blocks in `<head>`:
1. **`Organization`** — name, legalName (`"Yamatch Corp"`), url, logo, description (`"Yamatch — application mobile de réservation de tournois sportifs amateurs en France. Volleyball déjà disponible, d'autres sports à venir."`), email, foundingDate (`"2026-05-12"` — ISO full date), taxID (`"104861091"`), vatID (`"FR63104861091"`), address (`PostalAddress`: 47 rue Vivienne, 75002 Paris, FR), sameAs (`["https://www.instagram.com/yamatch_app/"]` — Instagram active; additional entries added if/when LinkedIn or TikTok accounts go live).
2. **`WebSite`** — name, url, inLanguage, publisher.
3. **`FAQPage`** — 12 `Question` + `Answer` pairs mirroring the visible accordion (kept in sync with HTML copy).
4. **`MobileApplication`** — name, operatingSystem, applicationCategory, description, `installUrl`, publisher/offers, author.

The `MobileApplication` description in `index.html` reads: `"Yamatch — Réservation de tournois sportifs amateurs. Volleyball disponible aujourd'hui, d'autres sports à venir prochainement."` Utility pages that ship a `MobileApplication` JSON-LD block must follow the same multi-sport positioning rule (volleyball named, other sports unnamed).

`installUrl` is an array of both store links (added 2026-07-27 when the Android app shipped to Google Play): `["https://apps.apple.com/fr/app/yamatch/id6773454974", "https://play.google.com/store/apps/details?id=com.appyamatch.yamatch"]`.

### Utility / legal sub-pages

7 sub-pages live under `website/`:

| Path | Title | `<main>` class | Notes |
|------|-------|---------------|-------|
| `cgu/` | CGU | `legal-page` | |
| `contact/` | Contact | `legal-page` | |
| `download/` | Télécharger | `download-page` | UA-redirect page (iOS-only), not a legal doc — see Download page section below |
| `mentions-legales/` | Mentions légales | `legal-page` | Créée 2026-05-12 — LCEN art. 6-III-1, 12 sections |
| `politique-annulation-remboursement/` | Annulation & remboursement | `legal-page` | |
| `politique-confidentialite/` | Politique de confidentialité | `legal-page` | |
| `suppression-compte/` | Suppression de compte | `legal-page` | |

All 7 carry `<meta name="robots" content="index, follow">` + `<meta name="googlebot" content="index, follow">`. All 6 utility pages are now included in `sitemap.xml` (see Sitemap section); only `/download/` remains excluded.

Each legal page footer includes a `<nav class="legal-page-nav" aria-label="Autres documents légaux">` with a `<ul class="legal-page-nav-list">` listing the other legal pages. Standard nav order: Mentions légales (omitted on its own page), CGU, Politique de confidentialité, Annulation & remboursement, Suppression de compte, Contact.

Privacy contract for the mobile search centre (26 September 2026): Supabase stores two separate private account preferences. Discovery retains the last manual search centre (coordinates rounded to about 1 km), radius and optional municipality name taken only from the selected BAN city field; notification targeting retains approximate coordinates/radius without a city name. Disabling proximity alerts clears only targeting, preserving discovery. Exact GPS coordinates and the complete selected address/context remain device-local; the local search cache is scoped by account, survives logout and is purged on account deletion. Foreground GPS refresh never adds background tracking or reverse geocoding to infer a city. Keep `politique-confidentialite/` aligned with the native store declarations; editing this source does not confirm publication or store-console changes.

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
| `description` | `"Yamatch — Trouve, réserve et joue ton prochain tournoi de volleyball amateur près de chez toi. D'autres sports bientôt disponibles."` |
| `display` | `"standalone"` |
| `theme_color` | `"#D7FF00"` |
| `icons[192]` | `"purpose": "any"` |
| `icons[512]` | `"purpose": "any maskable"` |

The 512×512 icon's `purpose` was changed from `"any"` to `"any maskable"` as part of the 2026-05-12 SEO audit.

---

## DOM structure

Homepage sections under `<main id="top">`, in order:

1. **`.hero`** — fixed header with wordmark and navigation; dark action photograph with split text/app visual and App Store + Google Play buttons. No subtitle or reassurance copy.
2. **`section.how-quest#how-it-works`** — three-card participant journey with coded app illustrations and progressive reveal; deep-link anchor `id="how-it-works"`
3. **`section.stories#temoignages`** — prepared stories shell, `hidden` with an empty rail until at least three real stories are validated
4. **`section.showcase#derniers-tournois`** — public upcoming and recent tournament tickets; hidden until valid data is rendered
5. **`section.faq#faq`** — accordion of 12 questions; deep-link anchor `id="faq"`
6. **`<footer>`** — outside `<main>`, light-gray background (matches `.faq`), dark text, content centered

**Top announcement banners (removed 2026-10-15).** Neither route renders the former lime `.launch-ticker`. Its shared styles and homepage offset-measurement IIFE were removed. Since participant V2, the homepage logo belongs to a fixed `.hero-header` with navigation on its right; the header is now a full-width glass bar flush with the viewport top, both before and after scrolling. The organiser retains its independent wordmark controller. Earlier centred-wordmark positioning is historical.

### Footer brand strip (`.footer-brand-strip`) — added 2026-05-13 (CSS §12.1)

Decorative row rendered above the legal links. Flex row (`justify-content: center`, `gap: 20px` desktop / `gap: 16px` mobile) — horizontal on all screen sizes, no mobile stack. Layout and sizing adjusted 2026-05-13 following user feedback.

- **Left:** `.footer-wordmark-link` > `.footer-wordmark` — SVG wordmark at 14px height desktop / 12px mobile (drastically reduced; smaller than the fixed hero wordmark). `opacity: 0.75` on hover.
- **Right:** `.footer-social-link.footer-social-instagram` — 44×44px touch target (WCAG AA), `border-radius: 50%` (perfect circle guaranteed by fixed 44×44 dimensions), background `var(--color-accent)` (#D7FF00 lime). Inline SVG Instagram icon 22×22, `stroke="currentColor"`, colour propagated via `color: var(--color-text-primary)` (#101828 noir). `scale(1.05)` + `opacity: 0.92` on hover.
- Focus-visible: `outline: 2px solid var(--color-text-primary); outline-offset: 3px` — site-wide pattern (§19), no dedicated rule needed.
- `prefers-reduced-motion`: transitions neutralised by the global §19 blanket rule — no dedicated override needed.
- The wordmark link carries no `target`/`rel` (site convention preserved, validated by reviewer on PR #10). The Instagram link carries `target="_blank" rel="noopener noreferrer"` and an extended `aria-label` `"Suivre Yamatch sur Instagram (nouvelle fenêtre)"` — **deliberate exception** for social discovery: the user stays on the landing page while exploring Instagram, protecting the conversion funnel. Validated 2026-05-13.

### Hero — participant V2 (2026-10-17)

```text
.hero[aria-labelledby="heroTitle"]
├── header.hero-header (fixed, z-index: 50; .is-condensed after 30 px)
│   ├── a.wordmark.wordmark-link[href="#top"] (left, static inside header)
│   └── nav.hero-nav[aria-label="Navigation principale"] (right)
│       ├── a.hero-nav-link → #how-it-works
│       ├── a.hero-nav-link → #faq
│       └── a.hero-nav-cta → organisateur/ (long/short responsive labels)
└── .hero-card.hero-card--photo (clipped, z-index: 1)
    ├── ::before (photo + readability gradients, z-index: 0)
    └── .hero-card-inner.hero-card-inner--split (z-index: 1)
        ├── .hero-copy
        │   ├── .hero-eyebrow ("Volleyball")
        │   ├── h1#heroTitle.hero-title > .hero-title-slant > .hero-title-accent
        │   ├── p.hero-lede (desktop/tablet)
        │   └── .hero-buttons > a.btn-glass[data-cta] × 2
        └── .hero-visual
            └── .hero-phone[role="img"][aria-label] (coded discovery illustration)
            │   └── .ym-phone-slot[aria-hidden="true"] > .ym-phone
            │       └── .ym-app.ym-screen.ym-screen--discovery
            │           ├── .ym-disc-viewport (clipped content, hidden original ticket + placeholder)
            │           └── .ym-disc-ticket-relief[aria-hidden="true"] > .ym-disc-ticket (decorative copy)
```

**Founder decisions override the original handoff.** D1 initially flattened the carousel; a subsequent founder request removes the screenshot carousel entirely. HOW now follows the hero directly, without active-phone lift or photo shrink. D2 first introduced a shared fixed pill; the latest founder adjustment replaces it with a **full-width rectangular glass bar**, flush with the viewport top. Logo left and navigation right are preserved. D3 initially kept all three decorations; later founder requests remove `.hero-float--ticket` (“Tournoi de la jeunesse”) and `.hero-float--badge` (“Ton équipe passe en phase finale”). The final external score card (“21 – 18”) and its `.hero-floats` wrapper were subsequently removed as well. No external hero decoration remains; the first discovery ticket keeps its separate relief effect inside the coded phone, while the HOW decorative overlays were later removed separately. The four coded app screens remain intact, including tournament content inside those screens. The founder additionally removed “Compose ton équipe, il y a match.” and all hero reassurance copy (“App gratuite”, Stripe and wallets), including the mobile version. The H1 stays exactly “Ton prochain tournoi t’attend”, with only “t’attend” lime. These removals deliberately change spacing relative to the original target JPGs.

**Layout.** CSS §7.7 scopes content to `.hero-card--photo` and navigation to `.hero-header`; shared 404 and organiser rules remain independent. Desktop uses a 1.15fr / .85fr grid, left-aligned text and a phone cropped by the rounded card. At ≤1023 px it stacks text then a 520 px visual; organiser navigation stays visible. At ≤767 px the H1 and Volleyball badge are centred independently within the copy column; the lede and nav text links hide, stores share equal widths at 46 px minimum height, and the coded phone is 230 px wide without an external score card. The separate mobile inline/block tokens remain; V2 reserves header space above the card rather than applying the older equal top/bottom card margins.

**Desktop viewport sizing (2026-10-22).** At ≥1024 px, the participant card uses `min-height: calc(100svh - var(--hero-header-space) - var(--hero-gutter))`, with a preceding `100vh` fallback. The section’s bottom padding reuses `--hero-gutter` (24 px), matching its left/right gutters; the top reserves `--hero-header-space` (84 px) for the navigation. The split grid inherits the card’s minimum height. This removes the former 680 px minimum on desktop, which forced the card below the fold on shorter screens. It remains a minimum rather than a fixed height: content can expand on very short windows or with enlarged text, preserving access to copy and store links. The 680 px floor remains at tablet widths (768–1023 px); mobile retains its separate header-space and block-margin calculation. The phone remains intentionally cropped inside the rounded card.

**Straight hero title and responsive alignment.** The photo hero’s `.hero-title-slant` now uses `transform: none`: no skew or line-to-line horizontal offset is applied. Frick, title sizes, copy and accent colors are unchanged. The hero copy and H1 are left-aligned on desktop/tablet. At ≤767 px, the H1 uses `align-self: center` and `text-align: center`, and the Volleyball badge uses `align-self: center`; the copy container retains its left alignment. `--hero-copy-text-inset` is 0 px everywhere, so the Volleyball badge and white lede share the title’s left edge on desktop/tablet; the lede keeps its 46ch cap and remains hidden on mobile. Store-button alignment is unchanged. The hero reset is scoped to `.hero-card--photo`; the four section H2s use the shared tilted-pill system described below.

**Images.** Existing mutually exclusive high-priority WebP photo preloads remain: `hero-volley-mixed.webp` (1672 × 941) for ≥768 px and `hero-volley-mixed-mobile.webp` (1122 × 1402) for ≤767 px. The photo modifier disables the old scroll-driven `::before` clip, while the card itself uses `clip-path: inset(0 round var(--hero-card-radius))` and overflow clipping to contain the coded phone and its chrome. Side/bottom gradients improve desktop readability; a vertical gradient serves tablet/mobile. [HERO_IMAGE_PROMPT.md](HERO_IMAGE_PROMPT.md) records photo provenance. The phone is a coded discovery illustration, initially derived from `docs/handoff/app-screens/screens/discovery.html` and subsequently updated from the current Flutter components described below instead of using a raster capture. Its hero integration intentionally adds two wrappers for the first-ticket relief; the source fragment remains unchanged by this effect. Its `.hero-phone` wrapper exposes one French-labelled `role="img"`; the `.ym-phone-slot` hides the entire decorative frame and screen from assistive technology. The slot reserves scaled frame dimensions, so no phone-image preload or intrinsic image attributes are needed. `app-screens.css` loads after `styles.min.css`; the photo preloads remain. Source SVGs carry decorative accessibility attributes before the fragment is copied into the homepage. Cards are decorative illustration, not live tournament data.

**Scroll contract.** A guarded `script.js` block toggles `.hero-header.is-condensed` for `window.scrollY > 30`, initializes after measuring the phone, and shares one pending animation frame between header state and the decorative phone-content scroll described below. The logo uses native `#top` navigation. `body.org-page` still exits the homepage IIFE before these controllers. The class is still toggled, but the header keeps the same glass appearance and geometry at top and scroll: `top: 0`, `left: 0`, `width: 100%`, zero radius and no border. Its minimum height is 76 px desktop/tablet or 68 px mobile, preserving the previous lower edge; inner horizontal padding is 36 px desktop/tablet and the mobile gutter token plus 8 px (28 px at 390 px). It neither centres nor individually shrinks the logo. Its SVG keeps the former condensed-pill optical height at both top and scroll: `--hero-logo-height` is 18.4 px desktop/tablet and 12.88 px mobile (20/14 px × .92), with automatic proportional width (about 95/67 px). The link retains its 44 px minimum target height. Declare `-webkit-backdrop-filter` before standard `backdrop-filter`, both using `--hero-header-backdrop`, so Lightning CSS preserves the standard blur in generated CSS.

**Floating download QR.** The homepage `.qr-widget` remains fixed to the viewport during scroll. At ≥1024 px its bottom offset is `var(--hero-gutter)` (24 px), aligning its lower edge with the hero card’s lower edge at the top of the page when the card fits the available viewport height. Tablet widths retain `bottom: clamp(16px, 2vh, 24px)` (18 px for a 900 px-high viewport); at ≤767 px the widget is hidden. The organiser route has no QR widget.

**Navigation accessibility.** Header links and organiser CTA have a minimum 44 × 44 px target and visible lime keyboard focus. On the homepage, `#faq` and `#how-it-works` use `scroll-margin-top: calc(var(--hero-header-space) + 16px)` (100 px desktop/tablet, 96 px mobile) so the fixed bar does not cover the destination. Store eyebrows remain visible: Google Play uses opaque white (`--hero-photo-ink`, alias of `--color-text-white`), while App Store inherits black. The lede also uses opaque white; the 80% white `--hero-ink-muted` remains for secondary ticket text, not the lede or store eyebrows. Store buttons use 22 px icons, a 10 px inner gap and 16/20 px left/right padding on desktop/tablet; mobile retains 20 px icons and its existing typography. The hero eyebrow now reads only “Volleyball”, as requested by the founder.

**Motion.** `cardEntrance` and `titleEntrance` remain. The phone enters upward from 40 px over 600 ms (620 ms delay); no external hero-card entrance remains. The popped-out discovery ticket has a gentle continuous 6s floating cycle, detailed below. Hero/header descendants explicitly use `animation: none` and `transition: none` under reduced motion, alongside the shared blanket rule.

<details>
<summary>Historical photograph hero (2026-10-15; superseded by participant V2)</summary>

### Hero

```
.hero (z-index: implicit, padding: var(--page-pad))
├── .wordmark.wordmark-link (position: fixed, z-index: 50)
└── .hero-card.hero-card--photo (z-index: 1)
    ├── ::before (z-index: 0, photograph + readability gradient)
    └── .hero-card-inner (z-index: 1)
        ├── h1.hero-title > span.hero-title-slant ("Ton prochain tournoi t'attend")
        ├── p.hero-subtitle ("Compose ton équipe, il y a match")
        └── .hero-buttons
            ├── a.btn-glass (App Store)    → real external link, target="_blank" rel="noopener"
            └── a.btn-glass (Google Play)  → real external link, target="_blank" rel="noopener"
```

**Homepage photograph (2026-10-15).** The homepage alone adds `.hero-card--photo`. Its decorative background shows an adult woman attacking against a mixed man/woman block, with a dark lime-compatible grade. It replaces the lime fill and animated grid; the former `.hero-card-waves` SVG, dedicated styles/keyframes and standalone JavaScript wave engine are removed. The organiser hero and the shared 404 palette do not use this modifier.

The image and a readability gradient paint on the existing `.hero-card::before` layer (`z-index: 0`, `pointer-events: none`). Its rounded `clip-path` and `--card-shrink` contract remain intact, as do card geometry, entrance animation and the phone carousel lift. `.hero-card-inner` stays at `z-index: 1`. Title/subtitle turn white only within the modifier; store buttons retain dark backgrounds, gain a translucent white border and keep lime keyboard focus.

| Served asset under `website/assets/hero-volley/` | Dimensions | Encoded size | Selection |
|---|---|---|---|
| `hero-volley-mixed.webp` | 1672 × 941 | 81,254 bytes | ≥768 px, `cover`, centred |
| `hero-volley-mixed-mobile.webp` | 1122 × 1402 | 120,802 bytes | ≤767 px, `cover`, image positioned at `60% center` |

Two homepage image preloads use matching mutually exclusive media queries, WebP type and `fetchpriority="high"`; only the applicable composition is preloaded. The four new shared `:root` tokens are `--hero-photo-surface: #0c100b` (fallback), `--hero-photo-ink: var(--color-text-white)`, `--hero-photo-shade` (180° gradient of `rgba(5,9,5,alpha)` at .46 / .20 at 42% / .04 at 70% / .20), and `--hero-photo-button-border: rgba(255,255,255,.32)`. Generation provenance and prompts are recorded in [HERO_IMAGE_PROMPT.md](HERO_IMAGE_PROMPT.md); these are generated promotional images, not real-app captures.


</details>

**Both hero CTAs are live external links (Google Play joined the App Store on 2026-07-27, when the Android app shipped).** Neither carries a `.js-pending-cta` class or a `href="#"` placeholder any more; there is no longer a "pending" state on the homepage.

- **App Store button** — `data-cta="app-store"`, `href="https://apps.apple.com/fr/app/yamatch/id6773454974"`, `target="_blank" rel="noopener"`, `aria-label="Télécharger sur l'App Store"`. Live since 2026-07 (iOS app shipped). Same App Store ID (`id6773454974`) used by the `/download/` UA-redirect page and every smart deep-link bridge page (see below).
- **Google Play button** — `data-cta="play-store"`, `href="https://play.google.com/store/apps/details?id=com.appyamatch.yamatch"`, `target="_blank" rel="noopener"`, `aria-label="Télécharger sur Google Play"`. Live since 2026-07-27. The `<!-- TODO(yamatch): replace with real Google Play URL -->` comment that used to sit above it in `index.html` is gone.

**Toast scaffolding — kept, currently unused:** `script.js` still exposes `window.yamatchToast(message)` (shows the `#toast` element for 4s), but the `.js-pending-cta` click-delegation block that used to call it (toast text `"Bientôt disponible"`) was removed on 2026-07-27 — there is no longer any element in the DOM carrying that class. `window.yamatchToast` remains available as a public API for any future ad-hoc notification; it has zero in-repo callers today.

### Download page (`website/download/index.html`) — UA redirect, bi-store

Standalone utility page, `<main class="download-page">`, excluded from `sitemap.xml` (see SEO — Sitemap). It exists as the QR-code target and as a manual fallback link. Updated 2026-07-27 to route to both stores now that Android has shipped (previously iOS-only, Android "coming soon").

- **QR code target:** `website/script.js` renders the homepage's QR widget with `QR_VALUE = 'https://appyamatch.fr/download/'` (unchanged by this update) — the QR always points at this routing page, never directly at a store, so the destination can change without regenerating the QR.
- **UA-detection script (inline `<script>` at the bottom of the page):** tests `/iPhone|iPad|iPod/i` against `navigator.userAgent` (with the `!window.MSStream` guard against legacy IE false positives) and `/Android/i` for Android. iOS → `window.location.replace('https://apps.apple.com/fr/app/yamatch/id6773454974')`. Android → `window.location.replace('https://play.google.com/store/apps/details?id=com.appyamatch.yamatch')`. Both fire immediately on page load.
- **Desktop:** no redirect fires; the visitor stays on the page. Visible content: `<h1>` "Télécharge Yamatch", body copy stating the app is available on both the App Store and Google Play, a `.download-back` CTA linking to the App Store (`target="_blank" rel="noopener"`), a second `.download-back` CTA linking to Google Play (`target="_blank" rel="noopener"`), and a third `.download-back` link back to the homepage (`../`).
- The page carries no JSON-LD block. Its `<meta name="description">` reads `"Yamatch — Télécharge l'app sur l'App Store et Google Play pour réserver tes tournois de volleyball amateur."` — flag drift if a future edit reintroduces "bientôt disponible" style copy for either store.

### Smart deep-link bridge pages (`auth/callback/`, `referee/`, `owner-transfer/`, `org-invite/`, `tournament/`, `tournament-invite/`, `invite/`)

Seven standalone pages under `website/`, each a bridge for a specific in-app action reached via a shared link (e.g. `/referee/<token>`, resolved through the 404-bounce + query-string pattern documented in Mobile deep-linking below). The six token/ID pages follow the same script recipe:

1. Read a token from the query string or path.
2. Attempt to open the app via a custom URL scheme (`com.appyamatch.yamatch://…`).
3. Listen for `visibilitychange` / `pagehide` to detect whether the app actually intercepted the scheme.
4. If, after 1.5s, the page is still visible (app not installed / scheme not intercepted), redirect to a **UA-dependent `fallbackUrl`**.

**`fallbackUrl` resolution (updated 2026-07-27 — was hardcoded to `/download/` for everyone before the Android launch):**
- iOS (`/iPhone|iPad|iPod/i` + `!window.MSStream`) → `https://apps.apple.com/fr/app/yamatch/id6773454974`
- Android (`/Android/i`) → `https://play.google.com/store/apps/details?id=com.appyamatch.yamatch`
- Desktop (no match) → `/download/` (the bi-store routing page above)

The OAuth bridge `/auth/callback/` follows the same fallback logic but forwards the original query string and fragment directly to `com.appyamatch.yamatch://auth-callback`; it never renders or logs their values. This preserves the authentication callback if the HTTPS Universal Link was not intercepted.

This mirrors the `/download/` page's own UA-detection logic — same regexes, same two store URLs — so the download and bridge pages agree on which platform gets which link.

**Public tournament page (`tournament/index.html`, updated 2026-09-27):**

- The page reads `?id=` (or the direct path) and fetches `title,players_per_team,gender,location,price_per_team,status` from **PROD** `https://kxwmjjgtnrhcpgopevzb.supabase.co/rest/v1/tournaments`, using the public publishable key matching the Flutter PROD configuration. No session or privileged key is required; existing RLS governs visibility.
- Loading disables the app action. A successful non-cancelled tournament shows the name, format/gender/location and existing price pill, and enables **Ouvrir dans Yamatch**. A cancelled tournament retains its details and cancellation note with the app action disabled. Existing zero-price hiding and price rounding remain unchanged.
- An empty response alone renders **Tournoi introuvable**. Invalid links are rejected before fetching. HTTP/network errors, a non-array response or an aborted request render **Chargement impossible** with **Réessayer**, rather than claiming that the tournament was removed.
- `FETCH_TIMEOUT_MS = 10000` aborts the request via `AbortController`; its timer is cleared on settlement. A loading guard prevents concurrent retries. The app click handler is registered once, and only acts with an enabled target ID.
- **Télécharger Yamatch** always links to `/download/`, independently of the fetch and app action. The page explains: « Après installation, rouvre le lien reçu pour retrouver ce tournoi. » The custom scheme and 1.5-second store fallback remain unchanged. There is no deferred deep linking or automatic return after installation.
- `test/tournament-page.test.mjs` exercises the PROD configuration guard, success rendering, app/store navigation, actual absence versus technical failures, timeout/retry and duplicate taps, direct paths, cancellation, zero price and invalid links. Browser/device installation flows still require physical testing.


---

### Organiser page (`website/organisateur/`) — hero variant B

Implemented 2026-10-14 at **`https://appyamatch.fr/organisateur/`**. The page contains the handoff's hero, then the seven organiser feature cards moved from the homepage, an organiser-specific FAQ (added 2026-10-15), and the shared footer. The prototype's statistics, four-screen journey and comparison are not implemented. A public recent-tournament ticket rail follows the feature cards and precedes the management demo. A coded, interactive management-screen demonstration is implemented between the cards and FAQ (see below); this local implementation does not itself establish deployment status. The new FAQ reuses the homepage accordion design with seven answers grounded in the feature cards; no organiser FAQ structured data is published.

| File | Responsibility |
|---|---|
| `organisateur/index.html` | French hero, wordmark linking home, two store CTAs, three static phone images, seven feature cards directly below the hero, public recent-tournament rail, eight coded management screens, seven-question organiser FAQ, shared footer and route-specific SEO |
| `organisateur/hero-organisateur.css` | Local `org-` rules, `:root` tokens and keyframes; loaded after `../styles.min.css` |
| `organisateur/hero-organisateur.js` | Standalone deferred IIFE: live Paris phone clocks, wordmark, phone lift, magnetic CTAs and footer year |
| `organisateur/organisateur-cards.js` | Standalone deferred IIFE: native card navigation, disabled button states and expandable details; loaded after the hero script |
| `organisateur/gestion-organisateur.css` | Local `ym-gest-` layout, tokens, transitions and responsive phone frame; served directly after hero CSS |
| `organisateur/gestion-organisateur.js` | Standalone deferred IIFE: eight coded scenes, local demo interactions, timed advancement and pause conditions; loaded between cards and FAQ scripts |
| `organisateur/organisateur-faq.js` | Standalone deferred IIFE: independent FAQ toggles and accessible answer visibility; loaded after the management-screen script |
| `assets/organisateurs/*-v2.webp` | Seven revised feature-card photographs, referenced through `../assets/organisateurs/` on this route; original PNG/WebP assets are preserved |
| `organisateur/assets/phone-{main-tournoi-test,left-poules,right-matchs}.webp` | Three handoff illustrations, converted to 600 × 1240 WebP, about 125 KB combined |

The route loads `../script.js` after its local deferred scripts for the independent public tournament rail. The first, homepage-specific IIFE returns immediately for `body.org-page`, preventing duplicate wordmark, FAQ and footer handlers. It does not load `carousel.js` or QR vendor code. It shares the site's self-hosted fonts, hero typography, buttons, FAQ styling, footer and `cardEntrance` keyframes. The three hero phone illustrations are static, non-draggable images with French alt text; they do not contain interactive app screens. They are handoff recreations, not simulator captures.

**Phone status-bar clocks.** The hero script adds an `aria-hidden="true"` `.org-hero-phone-clock` span inside each of the three `.org-hero-phone > .org-rise` wrappers. Each displays the visitor device's current time converted with `Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })`, including Paris daylight-saving changes. A shared timeout updates immediately and then at each minute boundary (`MINUTE_MS = 60000`); `visibilitychange` pauses scheduling while hidden and refreshes on return, `pageshow` refreshes after restoration, and `pagehide` clears the timer. These decorative updates remain active with reduced motion. At the native 300 × 620 px phone size, a 50 × 22 px overlay at top/left 32 px masks the baked-in `09:16`; shared white/text tokens, 16 px semibold Roboto and tabular numerals reproduce the status bar. The overlay ignores pointer events and inherits its wrapper's entrance, rotation and responsive scaling. Without JavaScript, the original image time remains visible.

**Layout and tokens.** `.org-hero-card` has `z-index: 1`, a black background (`--org-color-card`), clipped overflow and `--org-radius-card: clamp(24px, 3vw, 40px)`. Local colors (`--org-color-*`), shadows (`--org-shadow-*`) and radii are declared only in `:root`; lime, white, black and typography reuse shared tokens. Decorative layers are a masked 72 px grid, lime/teal halos and a bottom fade. Content uses a centred column and a 20–32 px fluid gap. The central phone is `z-index: 2`; phones render at 300 × 620 px in a 380 px cropped container. Side phones sit at ±260 px, 60 px lower, rotated ±9°. At ≤760 px, offsets become ±150 px, side scale .78, centre scale .86 and container height 300 px. At ≤767 px, `.org-page .org-hero` preserves the separate shared inline and block mobile-margin tokens; the card's minimum height uses the block token.

**Motion.** Card entrance remains 540 ms with a 120 ms delay. Words use `orgWordIn` (980 ms, `cubic-bezier(.16,1,.3,1)`) with delays 120/190/260/330/420/490/560 ms. `orgRise` takes 1200 ms with the same curve, moving from 72 px/scale .965/blur 6 px; eyebrow/subtitle/buttons/centre/left/right delays are 40/620/760/860/980/1100 ms. Halos loop over 16/19 seconds; the eyebrow dot breathes over 1.8 seconds. Entrance transforms belong to inner phone wrappers; outer wrappers use individual `translate`, `rotate` and `scale`, preventing scroll lift from overriding entrance animation. Phone horizontal positions and rotations are fixed; the three phones no longer react to pointer movement.

**Scroll lift and button safety.** `MAX_LIFT = 48`, `SCROLL_FACTOR = 0.12`, `SAFE_GAP = 28`. Lift is capped by the measured layout gap between buttons and phone container minus 28 px (clearance retained for the magnetic buttons and their 1.03 scale), and never below zero. The central phone rises by the lift, sides by 60%. Measurement uses layout offsets, excluding animated transforms; resize, `ResizeObserver`, font readiness and `pageshow` remeasure. A passive scroll listener batches renders through one pending animation frame. The wordmark condenses after 40 px of scroll.

Phone scroll translations retain their 700 ms transition; no phone pointer listener or `--mx`/`--my` offset remains. Magnetic buttons require `(hover: hover) and (pointer: fine)` and no reduced-motion preference. Button offsets use .22/.28 multipliers, capped at ±16/8 px, and scale 1.03 with 380 ms transitions. Pointer leave and media-query changes reset button offsets. Reduced motion disables animations/transitions throughout `.org-page` and resets lift/magnets to zero. Content remains visible without JavaScript.

**Navigation and SEO.** App Store and Google Play destinations match the homepage's live store URLs. Canonical, Open Graph and Twitter metadata use the production `.fr` domain; the route is indexable and appears in the sitemap. Homepage access is the organiser CTA in the fixed header, plus “Organisateur” in the footer. The former participant/organiser selector and the later HOW-header CTA are absent. This hero intentionally keeps the handoff's informal “Ton tournoi…” voice.

### How-quest V2 (`section.how-quest#how-it-works`, 2026-10-17)

```text
section.how-quest#how-it-works[aria-labelledby="howQuestTitle"]
└── .how-quest-inner
    ├── .how-quest-header
    │   └── .how-quest-copy → eyebrow, h2#howQuestTitle, p.how-intro
    └── .quest-steps
        ├── article.quest-step → copy + tournament phone
        ├── article.quest-step.quest-step--lime → copy + confirmation phone
        └── article.quest-step → copy + ranking phone
```

Each `.quest-step-copy` keeps the number, tag, H3 and existing participant paragraph. The H2 reads “Comment ça marche en 3 étapes”, with “en 3 étapes” inside the shared tilted lime pill. The founder removed the organiser CTA from this section header; the existing flex header now contains only `.how-quest-copy`. The organiser CTA in the fixed page header and the footer link remain. All copy is static HTML, available without JavaScript. Heading hierarchy and `#how-it-works` remain intact.

**Coded screens.** Each `.quest-step-phone[role="img"][aria-label]` exposes one French-labelled illustration and contains an `aria-hidden` `.ym-phone-slot` with `.ym-phone` and a coded `tournament`, `confirmation` or `ranking` illustration refreshed from the current Flutter reference recorded below. Shared `app-screens.css` adds those screen styles to discovery; it stays outside `build:css` and uses local fonts. No PNG phone capture or interactive booking/payment control is introduced.

**Decorative internal HOW scroll.** The header/hero shared requestAnimationFrame controller also writes `--ym-quest-scroll` on each `.quest-step-phone`. The cap is `--ym-quest-scroll-max:36px` in `app-screens.css :root`, in logical app pixels. Each phone progresses from 0 to 36 px over its own visible passage: `clamp((scrollY - start) / range, 0, 1)`, with `start = layoutTop - viewportHeight` and `range = max(1, viewportHeight + visibleHeight)`. `layoutTop` sums offset-parent positions; `visibleHeight` is limited by the containing step’s remaining height, ignoring decorative rotation and entrance transforms.

Geometry and the cap are cached at initialization, resize, `pageshow`, font readiness and ResizeObserver changes to phones, steps and hero/HOW sections. Scroll only schedules the shared frame; writes are deduplicated at two decimal places. The tournament body moves beneath its fixed header/footer (`z-index:1`); confirmation’s check, labels and summary move while its bottom actions stay fixed. Ranking’s scopes, sorting and table move inside `.ym-rank-scroll-viewport`, clipped from `--ym-rank-scroll-top:191px`, below the fixed header/tabs. Phone frames and status chrome stay fixed. This is decorative page-scroll coupling, without wheel/touch interception or independent timers. Reduced motion initially or at runtime sets the offset to zero; CSS independently resets translations. Without JS, the default offset is zero. The hero’s separate 0.12 factor and Pop A2 gauge are preserved.

**E1/E2 decisions and subsequent simplification (2026-10-18).** E1 initially replaced the old HOW parallax team/score wrappers with integrated location/team/score illustrations. The founder subsequently removed all three `.quest-step-float` decorations and their exclusive styles/tokens. Each step now contains its copy and coded phone only; the shared F2 titles, phone-content scroll and hero Pop A2 remain unchanged. The FAQ rotating badge is preserved and remains the only `.floating-card-parallax` host. The proposed “Prêt à jouer ?” end banner and its duplicate store buttons remain omitted by founder decision E2.

**Responsive geometry and stacking.** Desktop uses three equal columns with a 20 px gap, 640 px minimum height and 32 px radius. Tablet ≤1023 px stacks the cards and header. Mobile ≤767 px uses separate existing mobile gutters, a 16 px card gap, 560 px minimum height and 28 px radius. Each card uses rounded `clip-path` plus `overflow: hidden` so scaled phone chrome cannot escape its boundary; copy has local `z-index: 1`. Phones alternate −3°/+3°/−3°, with scale .6522 (about 270 px wide) desktop/tablet and .5072 (about 210 px) mobile.

**Text-to-phone spacing (2026-10-18).** Each step is a two-row grid (`max-content 1fr`). The absolutely positioned phone belongs to row 2, with `top:max(16px, calc(50% - (var(--how-card-min-height) - var(--how-phone-rest-top)) / 2 + var(--how-phone-gap-optical)))`. This halves the previous visible gap after the description while accounting for the unchanged ±3° rotation. Root tokens are `--how-phone-rest-top:330px` and `--how-phone-gap-optical:3.34px`, becoming 290 px / 2.6 px on mobile. The 16 px minimum protects longer copy. Card heights, phone scale and internal scroll remain unchanged. Specialist measurements at 1440/820 px are 94.43→47.21 / 131.23→65.60 px; at 390 px the three gaps are 73.01/96.26/73.01→36.49/48.12/36.49 px.

**Progressive entrance.** The section is visible by default. With IntersectionObserver and no reduced-motion preference, `script.js` adds `.is-enhanced` and observes each card at threshold .1 (default root margin 0). First intersection adds `.is-revealed`, then unobserves that card. Once all cards have appeared the observer and motion listener are disconnected. Turning reduced motion on at runtime reveals all pending cards, removes `.is-enhanced` and stops observation; CSS also forces visibility without motion. Without IO, JavaScript or with reduced motion from startup, nothing is hidden. CSS owns opacity/24 px rise, 480 ms easing, 0/80/160 ms card staggering and a 120 ms phone delay. This is independent of FAQ parallax and the decorative internal phone scroll.

| HOW tokens in `:root` | Desktop/tablet → mobile where overridden |
|---|---|
| `--how-card-radius`, `--how-card-min-height` | 32 px / 640 px → 28 px / 560 px |
| `--how-card-dark-bg` | shared showcase ticket glow + background |
| `--how-ink-muted-dark`, `--how-ink-muted-lime`, `--how-intro-ink` | white 78%, black 78%, `#4A5565` |
| `--how-numeral-size` | `clamp(2.75rem,3.9vw,3.5rem)`; H2 uses shared section-title tokens |
| `--how-step-title-size`, `--how-body-size`, `--how-intro-size`, `--how-tag-size` | 1.875/1/1.125/.8125rem → 1.5/.9375/1/.75rem |
| `--how-phone-scale` | .6522 → .5072 |
| `--how-phone-rest-top`, `--how-phone-gap-optical` | 330 / 3.34 px → 290 / 2.6 px; grid-relative phone spacing |
| `--how-phone-shadow`, `--how-phone-shadow-lime` | 30 px / 50 px drop shadows, black .6 / .35 |
| `--how-tag-border` | White 18% |
| `--how-reveal-duration`, `--how-reveal-easing` | 480 ms; `cubic-bezier(.2,.8,.2,1)` |

<details>
<summary>Historical editorial HOW layout (superseded by V2)</summary>

### How-quest (`section.how-quest#how-it-works`)

```
section.how-quest#how-it-works (aria-labelledby="howQuestTitle")
├── .how-quest-eyebrow ("PARCOURS")
├── h2#howQuestTitle.how-quest-title
├── p.quest-organiser-link
│   └── a[href="organisateur/"] ("T’es organisateur ? C’est par ici →")
└── .quest-steps
    ├── .quest-step [index 0]
    │   ├── h3.quest-step-title ("Trouve un tournoi")
    │   ├── .quest-step-tag-label ("Recherche")
    │   └── p.quest-step-body
    ├── .quest-step [index 1]
    │   ├── h3.quest-step-title ("Inscris ton équipe")
    │   ├── .quest-step-tag-label ("Inscription")
    │   └── p.quest-step-body
    └── .quest-step [index 2]
        ├── h3.quest-step-title ("Place au jeu")
        ├── .quest-step-tag-label ("Le jour J")
        └── p.quest-step-body
```

**Organiser route link:** `.quest-organiser-link a` navigates directly to `organisateur/`. CSS §10.3 presents it as a lime sticker with dark text, a 1 px border, 3 px hard shadow, bold type and −1° rotation. The decorative arrow remains hidden from assistive technology and sits in a dark 30 × 30 px tile with lime text. Both use the `:root` token `--radius-organiser-link: 4px`; colors and typography reuse shared tokens. The inline-flex link wraps text on narrow screens, has `max-width: 100%`, `min-height: 44px` and 10/12/10/16 px padding. The heading's bottom margin remains `clamp(16px, 2vw, 24px)`.

Fine-pointer hover straightens the sticker, lifts it 2 px, expands the shadow to 4/5 px and moves the arrow 2 px right. Pressing shifts the link 2 px right/down with a 1 px shadow; keyboard focus straightens it and adds a 2 px outline with 6 px offset. Rotation, translation and shadow use shared `--transition` (200 ms, `cubic-bezier(.4,0,.2,1)`). Reduced motion explicitly resets rotation and translation for the link, its interaction states and arrow; the global reduced-motion rule also shortens transition durations. This styling adds no JavaScript or explicit z-index.

**Heading hierarchy:** homepage `<h1>` (hero) → `<h2>` (`how-quest-title`, `faq-title`) → `<h3>` (quest-step titles). The organiser route separately uses its hero `<h1>` → `<h2 id="ym-orga-t">` → card `<h3>` headings, followed in the DOM by the interactive management section `<h2 id="ym-gest-title">` and FAQ `<h2 id="orgFaqTitle">`.

**Static participant content:** all three tags, titles and body paragraphs are authored directly in `index.html`, so the full journey is available before JavaScript and to crawlers. The previous persona buttons, panel state, sliding indicator and JavaScript content-switching controller have been removed. No script writes this section's text or handles selection/keyboard navigation for it.

---

</details>

### Organiser page feature cards (`section.ym-orga-band#organisateurs`) — added 2026-10-14

This section is visible only on `/organisateur/`, directly after `.org-hero` and before the interactive management-screen section and organiser FAQ. Its deep link is `/organisateur/#organisateurs`; the homepage no longer contains the section or its JavaScript. It remains independent of the phone carousel state machine. All classes, keyframes and section-specific custom properties use the `ym-orga-` prefix; shared fonts and colors reuse the site's existing tokens. No external fonts or dependencies are loaded.

`h2#ym-orga-t` (« Organiser un tournoi, c’est simple comme bonjour ») labels the section through `aria-labelledby`. An explicit `<br>` immediately after the comma places the emphasized phrase on a new line at every viewport width; narrow screens may wrap that phrase further. The former « Côté organisateur » eyebrow and « Tu t’occupes de l’ambiance et de la buvette. Yamatch gère le reste. » subtitle are removed; the heading and navigation remain. `#ym-orga-track` is a focusable, labelled group containing seven `<article>` cards, each labelled by its own `<h3>`. Cards present format settings, sharing/payment, goodies/food, pools, announcements, refereeing and rankings. Team names, scores and monetary figures are illustrative examples, not live app data. Seven AI-generated, realistic volleyball-club photographs now illustrate the cards; they do not depict an actual Yamatch event. Their revised reportage style uses neutral available light, ordinary municipal-club surroundings, practical mismatched clothing and spontaneous expressions, reducing the original coordinated teal/coral palette and polished staging. Decorative `<img class="ym-orga-bg …">` elements carry `alt=""`, `aria-hidden="true"`, `loading="lazy"`, `decoding="async"`, `draggable="false"` and explicit 1086 × 1448 dimensions. `object-fit: cover` fills the 15:22 cards, cropping the unchanged 3:4 photographs horizontally, with `.ym-orga-g1` through `.ym-orga-g7` gradients retained underneath. Assets live in `website/assets/organisateurs/` (`01-format` through `07-classement`); the page serves the seven `*-v2.webp` revisions encoded at quality 85, preserving the original dimensions. Both the original PNG/WebP files and the revised PNG sources remain available. Exact generation prompts and encoding details are recorded in [ORGANIZER_IMAGE_PROMPTS.md](ORGANIZER_IMAGE_PROMPTS.md).

**Layout and tokens (CSS §10.6):** the band uses `--color-light-bg` and 56px top / 120px bottom padding. The wrapper and scrolling track span the viewport: `--ym-orga-gutter: var(--page-pad)` supplies the track's internal inline padding and `scroll-padding-inline`, and aligns the heading/navigation margins with the hero's outer edges. At the initial scroll position, the first card and section heading share the hero card's left edge, including on wide screens. Thus cards clip only at the viewport edges, with no fixed white side bands covering neighbouring cards. Card sizing is independent of these outer gutters: the grid track uses `grid-auto-columns: var(--ym-orga-card-width)`, with the `:root` token set to `clamp(338px, min(40.3%, calc(var(--container-max) * .403)), 494px)`. The inner `min()` preserves the former maximum 1200px percentage-sizing basis, so aligning the section does not enlarge cards on wide screens; widths retain the earlier 30% increase from `clamp(260px, 31%, 380px)`. The root token `--ym-orga-card-aspect-ratio: 15 / 22` now gives every card 10% more height at the same width than its former 3:4 ratio, including the mobile width cap. Gaps remain 20px, with mandatory horizontal scroll snap and no visible scrollbar; the card radius remains `--ym-orga-radius-card: 28px`. At ≤767px, `--ym-orga-gutter` becomes `--mobile-hero-card-margin`, the root width token becomes `100%` of the track's content width, gaps become 14px and bottom padding becomes 64px. This mobile cap keeps a complete card visible: growth from the former 84% width is approximately 19%, since a full 30% increase would require 109.2% of the content width. Decoration sizes and motion remain unchanged. Decorative positions live in `.ym-orga-placement-*` CSS rules rather than inline HTML. `--ym-orga-r` rotations are independent of the bobbing `translate` animation.

**Two-line card headings:** each card `<h3>` contains two `.ym-orga-title-line` spans (`display: block; white-space: nowrap`), separated by a literal space for accessible text. Explicit breaks retain the original wording: “Le tournoi / à ta sauce”, “Un lien, et / tout le monde a payé”, “Tee-shirts et / crêpes, déjà payés”, “Les poules se font / en un clic”, “Un message, / tout le monde suit”, “L’arbitre tient / dans ta poche” and “Le classement / se fait tout seul”. Each card establishes `container-type: inline-size`; headings use `font-size: clamp(20px, 7cqi, 34px)` so type follows card width, with 26px top/inline insets (20px on mobile).

All new palette, gradient, overlay, border, shadow and radius values are declared under `:root` as `--ym-orga-*` tokens. The palette adds `--ym-orga-teal: #164540`, `--ym-orga-teal-deep: #0c2a27` and uses shared `--color-accent` for chartreuse. Detail entry uses `--ym-orga-detail-motion: 350ms cubic-bezier(.2,.8,.2,1)`; the plus control rotates 45° using `--ym-orga-plus-motion: 300ms ease`. Stickers bob vertically by 6px over 4s (`.ym-orga-fl`) or 5s with a −2s delay (`.ym-orga-fl2`).

**Photograph readability:** `--ym-orga-overlay` shades the image with dark teal at opacity .78 from 0–28%, .12 at 50%, .08 at 70% and .55 at the bottom. This protects the headline while keeping the central scene visible. All card headings inherit white, including the first card; keyboard focus uses the shared lime outline, and the first card's large “18 PTS” decoration also uses lime. Photo integration does not change card geometry, stacking or animation durations.

**Navigation (`organisateur/organisateur-cards.js`, standalone IIFE):** at viewport widths ≤1024px, `.ym-orga-nav { display: none; }` hides both navigation buttons and removes them from keyboard focus and the accessibility tree. Native swipe and focused-track keyboard scrolling remain available on mobile and tablet. Above 1024px, previous/next buttons remain visible and scroll by the first card's measured width plus computed column gap, using smooth native `scrollBy` (auto under reduced motion). Disabled states derive from `scrollLeft` and `scrollWidth - clientWidth`, with a 1px rounding tolerance. Scroll, resize, pageshow and a guarded `ResizeObserver` schedule updates through one pending animation frame. Native swipe, trackpad and focused-track keyboard scrolling remain browser-controlled; there are no wheel/touch interceptors or connections to `carousel.js`.

**Details and accessibility:** each 48px plus button controls a unique `#ym-orga-detail-N` panel through `aria-controls` and `aria-expanded`. Panels initially carry `hidden`; opening removes it and adds `.ym-orga-open`, while closing restores it immediately. The accessible button label changes from « En savoir plus » to « Fermer les détails ». Escape closes the card's open panel and returns focus to its button without scrolling. Panels open independently, scroll internally when needed, and reserve 84px bottom padding for the close control. Navigation buttons are 46px targets; buttons and the track have visible keyboard outlines. Reduced motion explicitly disables sticker/detail animation and plus transitions; the JavaScript media-query object is checked on each navigation click. On `/organisateur/`, the local `.org-page *` reduced-motion override additionally disables all animations and transitions across the hero and cards.

**Stacking and overflow:** each card creates an isolated context and clips its own decoration. Backgrounds sit at z=−2, shading at −1, headings at 2, detail panels at 4 and plus controls at 5. The track deliberately uses `overflow-x: auto; overflow-y: hidden` with `overscroll-behavior-x: contain`; this local containment does not change the phone rail's lift/overflow rules.

---

### Organiser page — interactive management screens (`section.ym-gest#gestion-tournoi`) — implemented locally

**Product contract:** the section is visible on `/organisateur/#gestion-tournoi`, between the feature cards and FAQ. Eight interfaces are coded in native HTML/CSS/JavaScript from the existing Flutter app’s component structure, typography, colors and spacing; their fields, rows, scores and panels animate directly in the page. This is a browser recreation, not an embedded Flutter build or a guarantee of pixel-for-pixel equivalence across platforms. The user's clarification supersedes the earlier screenshot/video plan and simulator-capture requirement. There is no pending-media template or capture/login dependency. Visitors need neither an account nor an app installation; the controller makes no backend requests and keeps demonstration state only in memory. Tournament names, teams and scores remain illustrative; the bottom explanatory note, playback buttons and position counter have been removed. These are guided website demonstrations, not a complete embedded app. The three hero phone illustrations remain separate static assets. Local implementation is not evidence of production deployment.

```text
main
├── section.ym-orga-band#organisateurs
├── section.ym-gest#gestion-tournoi
│   └── .ym-gest-wrap
│       ├── header → eyebrow, h2#ym-gest-title, lead
│       ├── .ym-gest-grid
│       │   ├── nav.ym-gest-steps → 3 groups / 8 button.ym-gest-step
│       │   └── .ym-gest-stage → court SVG, halo, caption sticker, phone frame
│       │       └── #ym-gest-screen → 8 div.ym-gest-screen → .ym-demo-app logical canvas
│       └── .ym-gest-mobile-description
└── section.faq#faq
```

| Step | Coded scene and local interaction |
|---|---|
| Crée ton tournoi | Native six-segment step header, bordered fields, choice chips and fixed bottom Continue label. The name is revealed, selected chips turn lime and the internal form scrolls down at phase 2. Fields and Continue remain illustrative, not a submission form. |
| Inscriptions et pointage | Dark registration-capacity card, native pointage panel and participant status/level pills. Confirming Les Smashers changes present teams from 5 to 6, pending teams from 2 to 1 and the row status to Présente; the action can be toggled. |
| Poules en un clic | White pool panels with gray participant rows and status/level pills. Net Flix moves to the second pool, whose border highlights; the row’s accessible action reverses the transfer and pool counts change from 4/4 to 3/5. This is an animated transfer, not a drag-and-drop editor. |
| Pilotage des matchs | Native dark Actions à réaliser block above gray match cards. Score validation reduces the action count from 2 to 1 and marks the resolved row. No estimated finish time is displayed or promised. |
| Score en direct | Native dark score hero with white 50-point numerals, lime progress, separate control strip and set/referee panels. Automatic scores advance from 16–13 to 18–15; four labelled minus/plus buttons adjust the scores within 0–99 and update the set summary and progress. |
| Arbitrage automatique | Native Actions bottom sheet over a scrim, with handle, heading, menu rows, footer and switch. The sheet rises 24 logical points; the switch activates automatic refereeing and a confirmation, and remains manually operable. |
| Phase finale | Horizontal native bracket with dark semifinal/final match cards, winner indicators for completed semifinals and connecting lines; the pending final has no winner marker. Columns are 300 logical points wide with a 28-point gap; phase 3 scrolls 328 points to reveal the final. Visitors can browse the bracket horizontally. |
| Classement et résultats | Native Général / Par poule selector, eight-column ranking table, form dots and legend. Rows appear progressively; horizontal scrolling exposes all statistics while the rank and team columns remain sticky. No separate champion card is shown. |

**Flutter source map:** visual references come from the sibling app repository `../yamatch/lib/`; these are development references, not website runtime imports. Theme/background use `shared/theme/app_theme.dart` and `shared/widgets/screen_background.dart`. Creation uses `features/tournament_creation/screens/tournament_creation_screen.dart` and `shared/widgets/segmented_step_header.dart`. Management uses `features/tournament_management/screens/tournament_management_shell.dart`; the following paths are relative to `features/tournament_management/` unless stated otherwise:

| Website component | Flutter reference |
|---|---|
| Management tabs | `widgets/pill_bar_glass.dart` |
| Registration and pointage | `widgets/teams_panel.dart`, `shared/widgets/registration_fill_block.dart` (relative to `lib/`) |
| Pool rows and status/level pills | `widgets/pools_panel.dart`, `widgets/participant_status_level_line.dart` |
| Match cards and action block | `widgets/match_row.dart`, `widgets/pilotage/action_rows.dart` |
| Score hero | `widgets/match_detail/score_hero_card.dart` |
| Actions sheet | `utils/tournament_action_menus.dart`, `shared/widgets/yamatch_bottom_sheet.dart` (relative to `lib/`) |
| Bracket and rankings | `widgets/bracket_tree_view.dart`, `widgets/classement_panel.dart` |

The website adapts these components to guided scenes with fictitious names/scores and simplified inline SVG icons. It preserves the selected visual structures without reproducing all app forms, navigation, networking or business rules.

**Controller and timing:** `gestion-organisateur.js` validates eight steps/screens, required layout nodes, step labels/descriptions and per-scene action targets, then adds `.is-ready`. Each selection—including selecting the current step again—resets elapsed time, completion classes, interaction pause, score state, internal scroll positions and scene phase; it updates `aria-pressed`, the active screen, viewport label, description and caption sticker. A single `requestAnimationFrame` loop runs a finite scene for `DURATION = 4800` ms, with phases 0–4 changing every `PHASE_DURATION = 1000` ms. Individual frame deltas are capped at 100 ms to prevent stalled frames skipping the demonstration. `--ym-gest-progress` receives the elapsed ratio. At 4.8 seconds the loop stops and the current result stays visible: steps never advance automatically. Selecting a step restarts its scene. Clicking a phone action or score button pauses scene progression and marks it manually changed, preserving the visitor's values until another selection. Pointer-down within an internal form, bracket or ranking scroll area also pauses progression and suppresses scripted scene changes, preserving manual browsing until selection.

**Desktop wheel navigation:** a non-passive `wheel` listener is scoped to `.ym-gest-grid`; it is enabled only for `(min-width: 1025px) and (hover: hover) and (pointer: fine)`. At least 70% of the smaller of phone-stage height and viewport height must be visible, distinct from the animation’s 25% visibility threshold. A predominantly vertical gesture moves one step down/up without wrapping. Eligible gestures prevent page scrolling while accumulating `WHEEL_THRESHOLD = 40` normalized pixels; line-mode deltas use 16 px per line, page-mode deltas use viewport height. After selection, a gesture lock absorbs the remaining momentum: `WHEEL_SILENCE_MS = 240` without eligible input rearms navigation. Reversing direction clears uncommitted accumulation but cannot bypass an already locked gesture. Upward scrolling on the first step and downward scrolling on the last step immediately return to normal page scrolling, including momentum.

The listener leaves mobile/tablet, horizontal gestures, modified gestures (Ctrl/Meta/Alt/Shift), hidden documents, already-cancelled/non-cancelable events, and zero vertical deltas untouched. It also excludes internal phone scroll containers, editable fields, demo action/score buttons and sliders, preserving their native interactions. Wheel selection calls the same explicit activation path as a step click, resets scene state and announces its description; reduced motion still shows a static final scene. Desktop-media changes and `pagehide` clear wheel accumulation/lock. No document-wide wheel capture, synthetic page scroll or new controls are added.

**Pause and lifecycle:** the finite scene pauses after completion, after phone interaction, under reduced motion, for a hidden document, for an offscreen phone stage, on fine-pointer hover over the stage and on visible keyboard focus inside the stage. Keyboard focus on the step list does not pause the selected scene. Pausing cancels the frame and clears its last timestamp while retaining elapsed progress. `IntersectionObserver` watches the **phone stage**, not the entire long section, at a 25% threshold. The fallback batches visible stage-height checks on scroll/resize through one pending animation frame; startup, `pageshow` and the fallback use 25% of the smaller of stage height and viewport height. `pagehide` clears visibility. A pointer step click or accepted wheel selection clears the keyboard pause; wheel navigation does not remove the existing phone-hover pause. No media playback, preloading, network timing or persistent storage is involved.

**Responsive layout and accessibility:** section padding reuses `--ym-orga-gutter`, aligning its left edge with the hero/cards. Desktop has steps then phone in two columns. At ≤880 px the phone comes first; enhanced step buttons form a horizontal scroll-snap strip with the current description below. Selection recentres only that strip, without scrolling the page. Phone width remains 320 px, 290 px at ≤1080, 272 px at ≤880 and 248 px at ≤420; the viewport retains aspect ratio 1206/2622. Inside it, each `.ym-demo-app` is a **402 × 874 logical-point canvas**, uniformly scaled from its top-left corner by `--ym-demo-scale = viewport.clientWidth / 402`. `ResizeObserver` remeasures the viewport, with a resize-event fallback; font readiness also remeasures. CSS fallback scales are .746269 / .671642 / .626866 / .567164 for the four phone widths. The former ≤250 px typography compression is removed: internal type and component proportions stay consistent at every size.

Internal content can scroll within the clipped phone shell. Pool transfer measures source/destination `offsetTop` in unscaled logical coordinates through `--ym-demo-transfer-y` (230 px CSS fallback). Its overlaid action follows the destination row and internal scroll position. Passive pool-scroll events coalesce positioning through one pending animation frame; measurements are read before style writes. Native step buttons expose `aria-pressed`, `aria-controls` and `aria-describedby`; arrows wrap between steps and Home/End select the first/last. Only the active screen is accessibility-visible: inactive screens carry both `aria-hidden` and `inert`. Phone controls have accessible labels; transparent button pseudo-elements expand hit areas with `max(100%, 44px / scale)` while preserving visual component size. The creation form, bracket and ranking scroll regions are keyboard-focusable, labelled and visibly outlined on keyboard focus. Explicit step selections announce the mobile description politely; initial activation and motion-preference resets set its live region to off. Without JavaScript, the first coded screen and all step descriptions remain available, using CSS fallback scaling; there are no playback controls.

**Reduced motion:** under `prefers-reduced-motion: reduce`, the controller displays phase 4 as a static result without starting the animation loop. Step navigation, selecting the current step again and manual phone controls remain usable. Preference changes reset the current scene. CSS removes the frame/halo loops and screen/element transitions, reveals the typed name and bottom sheet, and shows complete ranking/final visuals. There is no opt-in to automatic motion while this preference is enabled.

**External section typography:** the heading « Tout ton tournoi dans ta poche » is plain sentence-case text, without the former Frick face, skewed span or lime `<mark>`. It uses shared `--font-heading` (Roboto), weight 700, `clamp(2rem, 4.5vw, 3rem)`, line-height 1.1 and −.02em tracking; at ≤767 px its size becomes `clamp(1.25rem, 5.5vw, 2rem)`. The header retains an 800 px maximum width with a 16 px gap. The unboxed eyebrow uses Inter 600, 12 px/1.65, .16em tracking and shared medium gray. Lead and step descriptions use Inter 400, `clamp(.9375rem, 1.4vw, 1rem)`/1.6 and `--ym-gest-text-secondary: rgba(16,24,40,.78)`; the lead has a 72ch maximum width. Step titles use Roboto 700, `clamp(1.0625rem, 1.5vw, 1.25rem)`/1.25 and −.01em tracking without a separate mobile size override; group labels use Inter 500 at 11 px with .16em tracking. The obsolete `--ym-gest-font-display` and `--ym-gest-radius-mark` tokens are removed. Typography inside `.ym-demo-*` remains faithful to the app components described below.

**Tokens and motion:** the shell retains its remaining `:root` `--ym-gest-*` tokens, shared light backgrounds, lime halo, soft text `#364153`, court lines, dark frame gradient and phone/step shadows. Phone float uses a 7 s ease-in-out keyframe cycle reaching −10 px; the halo has a 6 s cycle to scale 1.08. Both are paused by default and run only under `.is-ready:not(.is-paused)`, so they stop with the finite scene after 4.8 seconds and remain paused without JavaScript. Step backgrounds transition over 260 ms; descriptions use 420 ms grid and 320 ms opacity; screens use 420 ms opacity/blur and 520 ms transform/visibility from −22 px / .985 scale / 3 px blur. The common ease is `cubic-bezier(.2,.8,.2,1)`.

**App visual foundations:** no new images, fonts or external dependencies are needed. The phone reuses the self-hosted `Inter` body and `Roboto` heading faces through `--font-body` and `--font-heading`; body text is 14 logical points, app headers 22 and score numerals 50. Simplified inline SVG icons replace emoji approximations. App-specific `:root` tokens include charcoal `--ym-demo-dark: #1a1a1a` and `--ym-demo-elevated: #2a2a2a`, muted `#e5e7eb`, gray `#99a1af`, subtitle `#666666`, divider `#e0e0e0`, success `#4caf50`, warm `#ff9800` and error `#ef4444`. The native canvas background gradients white to `#f5ffe6`; dark cards gradient black to charcoal, selected chips gradient `#d7ff00` to `#c5f000`, and translucent white tabs use a 10 px backdrop blur and a dedicated glass shadow. Additional tokens cover white opacity, scrim, task icons and sheet shadow. Radii are 24 px (cards/sheet), 16 px (small panels), 20 px (pointage), 12 px (avatars), 10 px (task icons) and 3 px (bars); phone content inset is 20 logical points. Shared colors remain referenced where they already match the app.

**Internal motion and layers:** the name reveal uses 1.3 s stepped clipping; chip highlights 400 ms; capacity meter 900 ms; pointage gauge 550 ms; pool translation 1100 ms with 400 ms shadow; score progress 300 ms; bottom sheet 700 ms; switch 180 ms; confirmation 350 ms; bracket connector 650 ms and final 700 ms; ranking rows 400 ms opacity. Pool rows and sticky ranking columns use z=1; the pool action and decorative caption sticker use z=2, with the sticker ignoring pointer input. The ranking table is 573 logical points wide; its rank/team columns remain fixed at a combined 165 points. Screen/canvas overflow is clipped while explicit inner containers support browsing. Reduced motion disables these transitions and uses immediate programmatic scrolling.

### Organiser FAQ (`/organisateur/#faq`) — added 2026-10-15

`section.faq#faq` follows the interactive management-screen section and seven feature cards inside `<main>`, immediately before the footer. Its `aria-labelledby="orgFaqTitle"` references the heading « Questions d’organisateurs ». It uses the homepage structure (`.faq-inner`, eyebrow, title, list, item, toggle, question, lime circular chevron and answer wrappers) and shared CSS §11 without new CSS or decorative floating cards. Shared responsive spacing, typography, separators and keyboard focus styling therefore stay consistent with the homepage.

Seven static French answers use `tu` throughout and cover match formats, sharing/registration/payment, goodies and food, pools and scheduling, team notifications, scorekeeping and live rankings. Their scope mirrors the preceding cards; they do not add pricing, refund or operational guarantees. The homepage retains its separate twelve-question FAQ and matching JSON-LD; the organiser page has no `FAQPage` JSON-LD.

`organisateur-faq.js` scopes itself to `.org-page #faq` and attaches listeners only to toggles with a controlled answer inside the same item. Each button has a unique `orgFaqToggle-1`…`-7` ID, `aria-controls="orgFaqAnswer-N"` and initial `aria-expanded="false"`; each answer is a labelled `role="region"` with initial `aria-hidden="true"` and `inert`. A click toggles `.is-open`, `aria-expanded`, `aria-hidden` and `inert` together. Multiple answers can stay open, as on the homepage. Native button keyboard activation applies; no arrow-key or single-open state machine is introduced.

Closed panels use the shared grid collapse, not `hidden`, preserving the CSS 300 ms row/padding and chevron transitions. The route's existing `.org-page *` reduced-motion override disables those transitions. The route does not load the homepage controller: unlike that controller, the local FAQ also synchronizes answer `aria-hidden` and `inert`. Without JavaScript the answers remain collapsed.

---

### Stories V2 (`section.stories#temoignages`) — prepared, hidden (2026-10-18)

**S1 is the release condition.** No real story media or testimonials were supplied. The section sits between HOW and public tournaments with `hidden`, an empty rail and no story nodes, media URLs, author identities or quotations. It makes no story-media request. Fewer than three validated real stories must keep this state; adding CSS or the section shell does not activate it. There is no Instagram feed/API integration or new header navigation link.

```text
section.stories#temoignages[aria-labelledby="storiesTitle"][hidden]
└── .stories-band
    ├── svg.stories-court--desktop + svg.stories-court--mobile (aria-hidden)
    ├── .stories-head
    │   ├── wrapper → p.stories-eyebrow + h2#storiesTitle.stories-title
    │   └── a.stories-insta → instagram.com/yamatch_app/ (new tab)
    └── ul.stories-rail[tabindex="0"][aria-label] (empty)
```

**Real-content contract.** Every person, media item and quote must be real, with written permission for image/citation and rights from the media author. Do not publish bracketed mockup placeholders or fabricated testimonials. Require a short accurate alt description, first name plus surname initial, an allowed role and a real quote ≤60 characters without quotation marks. Images use `story-NN.webp` (9:16, recommended 720 × 1280, ≤150 KB); optional avatars use `story-NN-avatar.webp` (96 × 96), otherwise a lime circle. A supplied original-post URL is optional, as is at most one featured story. Full asset specifications and private permission-record guidance live in [website/assets/stories/README.md](../website/assets/stories/README.md).

**Prepared CSS, not populated-content validation.** Scoped `.stories` rules preserve `[hidden]`, use a light-gray rounded band and decorative court strokes shared with tournament tokens. The Instagram CTA is 48 px tall. The future native horizontal rail is focusable, uses mandatory start snapping, hidden scrollbars and a negative right margin matched by padding so cards reach the rounded edge. Focus is visible on the rail and links. `#temoignages` reserves `--hero-header-space + 16px` beneath the fixed header. The existing three animated LED badge selectors do not include Stories.

| Stories tokens (`:root`) | Desktop/tablet → mobile |
|---|---|
| `--stories-band-bg`, `--stories-court-line`, `--stories-court-net` | shared light gray and `--tp-court-line` / `--tp-court-net` |
| `--stories-card-w`, `--stories-card-h`, `--stories-card-radius` | 250 / 444 / 24 px → 220 / 390 / 22 px |
| `--stories-band-radius`, `--stories-content-pad` | 40 px / `clamp(24px,4.5vw,72px)` → 28 / 16 px |
| `--stories-quote-size` | 1.375rem → 1.25rem; H2 uses shared section-title tokens |
| `--stories-shade` | transparent-to-black .85 vertical gradient |
| `--stories-placeholder`, `--stories-shadow`, `--stories-progress-muted` | `#2E333A`; 18/40 px dark-ink .18 shadow; white .4 |

**Video work is not implemented.** No video was supplied, so no controller or story-specific JavaScript is added. Future video activation must implement the SPEC §5 requirements: H.264 ≤1.5 MB/10 seconds with WebP poster, `muted loop playsinline preload="none"`, a 44 × 44 pause/play button, autoplay only at ≥60% visibility, pause outside view, at most one playing video, no reduced-motion autoplay, and poster-only fallback without JS. These behaviours, populated-media layout/contrast and image layout-shift checks require real content and a new review before activation. Current validation covers the empty hidden state only.

### Public tournament rails (`section.showcase#derniers-tournois`) — added 2026-10-15

**Placement and visibility.** The participant homepage now renders the light-gray court section headed « Ça smash près de chez toi » between HOW and FAQ (`data-showcase-variant="participant"`). `/organisateur/` retains « Les derniers tournois » between feature cards and the management demo (variant `organizer`). Both start `hidden`: no JavaScript, invalid/empty data or a request failure exposes no placeholder. **One valid relevant tournament is sufficient.** Participant V2 inserts up to five upcoming tournaments in server order before the static creation card, and up to nine recent tournaments in a separate ticker. Recent-only data shows the creation card plus ticker; upcoming-only data hides the ticker. The creation card alone never makes an empty section visible. Organizer still uses only its first six valid recent tournaments; upcoming-only data keeps it hidden. Aggregate statistics are not rendered or used as visibility thresholds.

**Data boundary.** The independent final IIFE in `website/script.js` posts `{}` to the production `/rest/v1/rpc/get_public_showcase` endpoint using the public publishable key shared with `/tournament/`, with `credentials: 'omit'`. The request has a 10-second abort timer where `AbortController` is available and one shared promise per page. The RPC is maintained in the app repository at `yamatch/supabase/migrations/20261015214227_public_showcase.sql`. Backend deployment was verified on staging and production on 2026-10-15, including production HTTP 200 and anonymous SQL smoke checks. This records backend verification, not publication of these website changes.

The payload must contain `recent` and `upcoming` arrays and six non-negative integer statistics: `tournaments_played`, `tournaments_upcoming`, `teams_registered`, `players_estimated`, `organizers`, `cities` (each at most 10,000,000). The client validates those statistics but does not display them or use their values as a visibility threshold. Single-row array and `get_public_showcase` wrappers are accepted. Each ticket requires a valid ID, title and calendar date (`YYYY-MM-DD`); invalid entries are skipped. Optional city, organiser name/logo, team count, capacity and players per team are normalised. Text is inserted with `textContent`, limited to 120 characters; logo URLs must be HTTPS. Missing or failed logos fall back to initials, and optional missing metadata is omitted.

**Loading and cache.** A zero-height, `aria-hidden` sentinel before each hidden section triggers loading within a `600px 0px` IntersectionObserver root margin, then disconnects and removes itself. Without IntersectionObserver, loading starts immediately. Valid payloads with tickets are cached in `sessionStorage` under `yamatch.showcase.v1`, with `{ savedAt, payload }` and a ten-minute TTL. A fresh, revalidated cache is reused without a background refresh; expired, future-dated or corrupt entries are ignored. Storage failure is harmless. Render exceptions hide and clear the section. Rendering or hiding a previously visible section dispatches `yamatch:showcase-layout`; the homepage floating-card controller remeasures its cached geometry on that event and removes the listener on cleanup.

**Participant tickets (`appTicket`).** Semantic list items contain articles, H3 titles, French/UTC `<time>` dates and optional `city • N×N` metadata. Dates use an unpadded day and uppercase abbreviated month without dots. Counts read « N/M inscrits » or « N inscrits » without capacity. With capacity, open tickets show remaining teams and a clamped progress bar; full takes label precedence (« Complet »), otherwise closed tickets show « Inscriptions closes ». Without capacity, status and progress are omitted. Full tickets retain the default teal gradient even when registrations are closed. Only closed, non-full tickets receive `.is-closed` and a black header; “Complet” therefore takes precedence for both label and palette. Real CTAs link to `/tournament/?id=…`, with the tournament title in visually hidden accessible text: « S’inscrire » when open with room, « Voir le tournoi » otherwise. Neither price nor custom palette is invented from absent RPC fields. Muted full/closed statuses use `--tp-white-90` rather than the SPEC’s 80% white: review found the latter insufficient on the teal gradient, so this intentional adjustment serves the AA acceptance criterion.

```text
section.showcase.tp-band#derniers-tournois[data-showcase-variant="participant"][hidden]
├── svg.tp-court--desktop + svg.tp-court--mobile (decorative)
├── .tp-content[data-showcase-rail-block]
│   ├── header.tp-header → badge, h2#showcaseRailTitle, introduction
│   └── ol.tp-cards[data-showcase-rail]
│       ├── generated li[data-showcase-generated] × 0–5
│       └── li[data-showcase-create] → static creation ticket
└── .tp-ticker[role="region"][tabindex="0"][hidden]
    ├── .tp-ticker-label
    └── ul.tp-track[data-showcase-ticker] → recent items + hidden duplicates
```

**Static creation card.** `li[data-showcase-create]` remains last in `ol.tp-cards`; rendering clears only generated siblings and inserts tickets before it. Its « Créer mon tournoi → » link points to `organisateur/`. Organizer rendering continues to use the historical `ticket()` implementation, optional organiser metadata and native rail controls; participant rendering never calls `wireRailNav()`.

**Recent ticker (`renderTicker`).** The focusable `.tp-ticker[role="region"]` is labelled « Tournois déjà joués ». It renders up to nine names, UTC dates, optional cities and positive team counts, then duplicates these list items with `.tp-ticker-copy[aria-hidden="true"]`. Missing city/zero count omit their separator. Decorative trophy SVGs are not interactive. The ticker is hidden without recent entries; duplicate items do not add focus targets.

**Demo mode.** Only explicit `?showcase=demo` selects local fictitious data; it bypasses network/cache loading and labels the preview « Aperçu démo — données fictives, non publiées ». Names include « Démo » and fictitious cities. Participant demo tickets preserve the visual CTA using an inert `span[aria-disabled="true"]` rather than a link to a fictitious ID; organizer demo tickets retain their existing no-CTA behaviour. The static creation card still links to the real organiser page. A live-data failure never falls back to demo content.

**Participant layout and interaction (CSS §10.7).** Scoped `tp-*` rules create a rounded light-gray band, white radial glow and decorative horizontal/vertical court SVGs. The section keeps `#derniers-tournois` and reserves `--hero-header-space + 16px` for fixed-header anchor clearance. Its 1392 px maximum width, 24 px desktop gutters and 40 px radius contain a 3-column grid (2 columns at 768–1023 px, 1 below 768 px). Mobile uses the existing inline-margin token, 28 px radius and 16 px card gaps. Tickets now follow the current Flutter `tournament_card` / ticket-background reference at app commit `4f6d88fe` (matching the relevant `origin/main` source), with content-driven height rather than a fixed 281 px box. The header uses 20/20/24 px padding, a 72 px minimum date tile with 16 px radius, a 28 px Roboto day, 22 px Roboto title, 14 px Inter metadata and a bare 20 px chevron. Counts follow with a 16 px gap; the 6 px progress bar follows after 8 px. The tear is 16 px high with a .6 px dashed line; 8 px side notches sit at `calc(100% - 86px)`, with an 8.5 px mask edge. The ticket radius stays 24 px. Footer padding is 6/20/12 px with a 10 px gap, a 56 px icon circle and a minimum 60 px CTA in 18 px Inter. Narrow containers ≤300 px reduce inline padding, text and footer icon size without changing data or the date tile minimum. The creation ticket shares this geometry and keeps its lime header. Participant previous/next arrows and the old footer app link are absent.

The lime ticker animates `tpScroll` from 0 to −50% over 40 seconds, linearly and indefinitely. Hover and focus within pause it. Reduced motion disables animation, hides duplicates and enables manual horizontal scrolling; the label becomes sticky. The fixed label has local `z-index: 1` above the moving text, with widths 196 px desktop/tablet and 150 px mobile.

| Participant tokens (`:root`) | Value / purpose |
|---|---|
| `--tp-band-bg`, `--tp-band-glow` | Shared light gray plus white radial glow |
| `--tp-court-line`, `--tp-court-net` | Dark ink at .045 / .09 opacity |
| `--tp-radius`, `--tp-content-pad` | 40 px / `clamp(24px,4.5vw,72px)`; mobile 28 / 16 px |
| `--tp-intro-size` | 1.125rem → 1rem mobile; H2 uses shared section-title tokens |
| `--tp-ticket-head`, `--tp-ticket-head-closed`, `--tp-ticket-foot` | Dimension-relative `circle closest-side` radial gradient, black 0% → teal 300%; black closed header; dark foot |
| `--tp-ticket-contrast-shade` | Uniform black 35% gradient layered over the teal header for text contrast; creation lime and closed black remain unchanged |
| `--tp-ticket-notch-y`, `--tp-ticket-notch-radius`, `--tp-ticket-notch-edge` | `calc(100% - 86px)` / 8 / 8.5 px; ticket height follows content |
| `--tp-ticket-radius`, `--tp-date-radius` | 24 / 16 px |
| `--tp-body-size`, `--tp-name-size`, `--tp-day-size`, `--tp-cta-size` | .875 / 1.375 / 1.75 / 1.125rem |
| `--tp-small-size`, `--tp-compact-size` | .8125 / .75rem |
| `--tp-ticker-title-size`, `--tp-ticker-meta-size`, `--tp-ticker-duration` | 1.625rem (mobile 1.375rem) / 1rem / 40s |
| `--tp-white-*`, `--tp-black-*` | Tokenized translucent ticket ink, borders and progress tracks |

**Organizer layout remains unchanged.** Shared CSS §10.7 uses native horizontal grid scrolling and mandatory start-aligned scroll snap, isolated from the phone carousel state machine. `--showcase-gutter` aligns the rail with page/container margins; `--showcase-card-width: clamp(268px, 24vw, 312px)` controls desktop columns. Tickets use `--showcase-ticket-bg`, glow/strong-glow and on-dark palette tokens; `--showcase-ticket-stub: 64px` and `--showcase-ticket-notch: 11px` set the dashed stub and masked edge notches. The section has fluid 64–120px block padding and clipped horizontal overflow. At ≤767px, gutter becomes `--mobile-hero-card-margin`, columns become `min(82%, 300px)`, gap becomes 12px (16px desktop), and arrow controls hide in favour of native swipe. The rail remains focusable for keyboard scrolling. Desktop 44px arrow buttons scroll by one card plus gap; boundary `aria-disabled` preserves focus and suppresses movement. Scroll/resize updates are animation-frame batched. Reduced motion selects immediate scrolling and disables button/CTA transitions.

### Historical carousel (`.screens-rail`, removed from homepage)

The following describes retained CSS and `carousel.js` only. The five-card DOM and script tag are absent from all current HTML consumers; no carousel gesture handler or initialization runs.

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
--color-medium-gray: #6A7282;        /* ≈4.66:1 on #FFFFFF — passes WCAG AA (small text). Bumped from #99A1AF (≈2.6:1, failed AA) after Lighthouse audit 2026-05 flagging .how-quest-eyebrow, .quest-step-tag-label, .faq-eyebrow */
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

### Participant V2 tokens (CSS §7.7)

All new colors, shadows, type sizes and motion tokens are declared in `:root`; responsive overrides also use `:root`. Shared tokens are not repurposed for other heroes.

| Tokens | Values / responsibility |
|---|---|
| `--hero-photo-shade-side`, `--hero-photo-shade-bottom`, `--hero-photo-shade-mobile` | Side/bottom desktop and vertical tablet/mobile gradients; exact stops in `styles.css` §2 |
| `--hero-ink-muted` | White at 80% for secondary copy |
| `--hero-glass-bg`, `--hero-glass-bg-hover`, `--hero-glass-border` | White at 12% / 20% / 22% |
| `--hero-led-off`, `--hero-led-duration` | Olive `#3D4A12`; 2.4s |
| `--hero-led-shadow-on`, `--hero-led-shadow-off`, `--hero-led-shadow-static` | Lime glow: 10 px blur / 3 px spread at 65%; transparent zero shadow; 8 px blur / 2 px spread at 50% |
| `--hero-float-surface`, `--hero-float-border`, `--hero-float-shadow` | Retained ticket surface/border tokens (no current hero ticket); retained 18 px / 40 px float shadow (no current hero float consumer) |
| `--hero-phone-shadow` | 40 px / 60 px drop shadow, black 55% |
| `--hero-store-height` | 50 px desktop/tablet; 46 px mobile |
| `--hero-title-size` | `clamp(2.875rem, 6.4vw, 5.75rem)` desktop; 3.5rem tablet; `clamp(2rem, 10.8vw, 2.875rem)` mobile |
| `--hero-lede-size`, `--hero-small-size`, `--hero-ticket-size` | 1.0625rem / .875rem / .75rem; small becomes .75rem mobile |
| `--hero-store-eyebrow-size`, `--hero-store-label-size` | .6875rem / 1rem; .625rem / `clamp(.75rem, 3.85vw, .9375rem)` mobile |
| `--hero-nav-size`, `--hero-score-size` | .9375rem / 2.125rem; .8125rem / 1.5rem mobile |
| `--hero-font-display` | Frick 0.3 with shared heading fallback |
| `--hero-copy-text-inset` | 0 px at every breakpoint; badge and lede share the straight title’s left edge on desktop/tablet; title and badge are centred on mobile |
| `--hero-copy-pad`, `--hero-copy-gap` | `clamp(24px, 5vw, 80px)` / 28 px; 20 px / 18 px mobile |
| `--hero-phone-width`, `--hero-phone-scale` | 360 px / .8696 desktop and tablet; 230 px / .5556 mobile |
| `--hero-gutter` | 24 px; `--mobile-hero-card-margin` mobile |
| `--hero-header-height`, `--hero-header-radius`, `--hero-header-space` | 76 px / 0 px / 84 px; mobile height 68 px and reserved space 80 px. Header top is 0; the former top token is removed. |
| `--hero-card-radius`, `--hero-float-radius`, `--hero-date-radius` | `clamp(24px,3vw,40px)` / 20 px / 12 px; card 28 px and floats 16 px mobile |
| `--hero-header-bg`, `--hero-header-border`, `--hero-header-fallback` | White 64%, dark border 6%; white 96% without backdrop-filter |
| `--hero-header-backdrop` | `blur(32px) saturate(160%)` at both top and scroll |
| `--hero-logo-height` | 18.4 px desktop/tablet; 12.88 px mobile; same at top and after scrolling, SVG width auto |
| `--hero-entry`, `--hero-phone-entry`, `--hero-header-motion` | 480 / 600 / 300 ms, `cubic-bezier(.2,.8,.2,1)` |

### Coded illustrative app screen — `website/app-screens.css`

The standalone stylesheet is served directly, outside `build:css`. It combines app tokens (`--ym-*`), the phone frame and discovery/tournament/confirmation/ranking screen styling from `docs/handoff/app-screens/`. Its Inter/Roboto font paths point to the existing local `fonts/` files. Rules use the `ym-` namespace; paragraph/reset rules are scoped to `.ym-app` so the page typography stays independent.

The frame is 414 × 868 px with a 390 × 844 px screen. `.ym-phone-slot` reserves the scaled frame dimensions before fonts load; the inner `.ym-phone` scales from its top-left origin. Hero CSS maps `--ym-phone-scale` to `--hero-phone-scale` (.8696 desktop/tablet, .5556 mobile), producing nominal widths of 360 and 230 px. Device status chrome uses local stacking levels 50/51 within the screen, independent of the fixed page header. Tokens and original source fragments remain in the historical handoff. All four current illustrations are maintained against the recorded Flutter components below; they are no longer exact copies of those historical fragments. The hero-only relief wrappers and Pop A2 treatment remain intentional website integration adaptations.

**Current discovery components (2026-10-18).** The hero was refreshed from `/Users/julien/Projects/yamatch/.worktrees/website-captures-20261015` at app commit `4f6d88fe`; the relevant components match `origin/main` at `c2fc0c42`. Sources are `home_screen.dart` / `MainTabHeader` / `PillToggle`, `organizer_cta_card.dart` and `BottomNavBar`. This remains a non-interactive illustration with scroll-driven decorative movement, not a running app or live user session.

The selected state is a participant who is not an organiser, with no active simulation. “Accueil” replaces the old heading, the list/calendar toggle moves into the header, and the sport pill has no chevron. Bottom navigation reads “Accueil”, “Mes tournois”, “Profil”; “Créer” is organiser-only and is not shown in this participant state. The organiser-acquisition card now uses “Plus de sport, moins de galère”, “Pas encore organisateur ?”, the current explanatory text, six feature tiles and “Essayer, ça prend 2 min”, without the old dismiss cross. These illustrated controls remain inside the existing `aria-hidden` phone subtree; they do not create website actions.

Hero-scoped CSS places the 44 px header at y74 with 20 px side offsets, its toggle at 88 × 44 px, and the 48 px filters at y136. The acquisition card stays at y514 with automatic height, 20 px padding, a two-column feature grid (8 px gaps) and 52 px CTA. Its longer content pushes the next tournament below the screen (`top:calc(100% + var(--ym-disc-scroll-max))`). Navigation is centred, 62 px high and 52 px above the bottom, with local `z-index:2`; frame dimensions, phone scale and first-ticket relief are preserved. New `--ym-disc-current-*` tokens cover filter/card shadows, lime 12% icon tile, white 6% feature fill, black 34% nav fill, white 85% labels and white 40% inactive-toggle ink. Overrides are limited to `.hero-phone .ym-screen--discovery`; HOW screens and the straight hero H1 are unchanged.

**Current HOW components (2026-10-18).** The three HOW illustrations use the same app checkout at `4f6d88fe`; the nine relevant reference files match `origin/main` at `c2fc0c42`. Tournament detail shows the header price chip and three-dot menu, plus a separate footer price/availability group and “Payer” action. The former 48-hour cancellation claim is removed.

Confirmation follows `BookingConfirmationScreen` → `SuccessScreen`: lime background, 84 px dark check badge, “INSCRIPTION CONFIRMÉE”, “Rendez-vous sur le terrain !” and the teammate invitation subtitle. A dark tournament summary shows date, name, sport, place/time and “Place réservée”; the two illustrated actions are “Inviter mon équipe” and “Voir mes tournois à venir”. The former ticket/back illustration, toast, address and payment/cancellation details are removed. New `--ym-conf-*` tokens cover badge shadow/ring, date border, summary metadata and shadow.

Ranking follows `MyTournamentDayScreen`, `SegmentedPillBar` and `ClassementPanel`: tournament name, “Suivre mon tournoi”, QG/Matchs/Classement tabs, and Tableau général/Par poule scopes. Eight existing illustrative team/stat rows remain; the identity column uses the source fallback “Niveau non renseigné”. The 573 px table is clipped inside its 350 px card: points and recent-form columns extend offscreen, without inventing values. `--ym-rank-tabs-shadow`, `--ym-rank-scope-border` and `--ym-rank-scope-ink` supply the updated controls. All three screens retain the 414 × 868 frame, HOW scales and labelled decorative wrappers; none adds website payment, navigation or app state. Hero Pop A2 is independent of this refresh.

**Local hero date and clock.** The first discovery ticket displays Paris · 5 km as fixed illustrative location, without geolocation. Its original hidden ticket and Pop A2 copy both expose `[data-hero-tournament-day]` / `[data-hero-tournament-month]`. A hero-scoped controller computes the visitor’s local calendar date plus `TOURNAMENT_DAYS_AHEAD=14` using `Date.setDate`, preserving calendar-day arithmetic across daylight-saving changes. The day is unpadded; the French short month is uppercased with abbreviation dots removed. Both tickets are updated with `textContent`.

The single `[data-hero-clock]` status label uses `Intl.DateTimeFormat('fr-FR', { hour:'2-digit', minute:'2-digit', hourCycle:'h23' })`, showing local 24-hour time. One timeout, separate from the Pop A2 gauge timer, aligns updates to the next minute (`MINUTE_MS=60000`); each tick recomputes both clock and date, including midnight rollover. Hidden documents cancel the timer; visibility return updates immediately. `pagehide` suspends it and clears the timeout, while `pageshow` resumes with a fresh local date/time. No network request or live region is added. Without JavaScript, the HTML fallback remains 1 NOV and 09:15; HOW illustrations and organiser clocks are unchanged.

**Hero discovery relief — Pop A2.** The original first ticket remains inside `.ym-disc-viewport` as `.ym-disc-ticket--original` with `visibility:hidden`; an `aria-hidden` placeholder reserves its visual location at left 18 px / top 218 px, 353 × 281 px, radius 24 px, dark ink .08 fill and a 2 px dashed .25 border. The decorative copy sits in the sibling `.ym-disc-ticket-relief[aria-hidden="true"]` at the same base position, local `z-index:4`, `transform-origin:center`, with no pointer interaction. The phone’s existing accessible label and 414 × 868 frame remain unchanged.

Tokens live in `styles.css :root` and are consumed through `--ym-hero-pop-*` aliases in `app-screens.css`. `--hero-pop-transform` is `translate(-70px, -36px) rotate(-7deg) scale(1.2)` desktop/tablet; mobile reduces translation to −18/−18 px. `--hero-pop-shadow` combines `drop-shadow(0 34px 40px rgba(0,0,0,.55))` and `drop-shadow(0 0 30px rgba(215,255,0,.22))`. Placeholder tokens are `--hero-pop-placeholder-bg`, `--hero-pop-placeholder-border` and `--hero-pop-placeholder-radius`; `--hero-pop-gauge-transition` is `600ms cubic-bezier(.2,.8,.2,1)`. The hero card still clips the overall composition. HOW screens and the current Flutter discovery layout remain unchanged.

**Gentle floating ticket.** Only `.hero-phone .ym-disc-ticket-relief > .ym-disc-ticket` receives `ym-hero-ticket-float`: an infinite `ease-in-out` cycle with `--ym-hero-ticket-float-duration:6s` and `--ym-hero-ticket-float-distance:-4px`, declared in `app-screens.css :root`. The child translates from 0 to −4 logical app pixels and back; its parent retains the Pop A2 pose, shadow and independent scroll translation. The gauge controller is unchanged. Reduced motion disables the animation and resets the child translation to zero. No extra JavaScript or timer is introduced.

**Illustrative registration sequence.** A guarded, hero-copy-only controller updates `[data-hero-registrations]`, `[data-hero-remaining]` and `[data-hero-progress]`. Constants are `INITIAL_COUNT=27`, `FINAL_COUNT=33`, `CAPACITY=36`, `STEP_MS=1400`. Once `section.hero` intersects (IntersectionObserver threshold 0, phone fallback if the section is absent, immediate start without IO), one timeout adds one registration per step, ending at 33/36 and 3 teams remaining; the bar width is count/capacity. Labels use `textContent` and singular handling for one remaining team. This is illustrative, not live registration data; there is no live region or external request.

The sequence runs only once per page load. When the document becomes hidden, its sole timeout is cleared and the remaining delay saved using `performance.now()`; returning resumes that delay without resetting progress. Completion removes timeout, observer, visibility and motion-preference listeners. Reduced motion initially or at runtime jumps immediately to 33/36, cleans up and disables the CSS width transition. Without JS, the markup remains 27/36, 9 remaining and the existing 75% bar. The copy and original remain hidden from assistive technology inside the existing labelled phone illustration.

**Ticket LED and app-style shimmer.** The remaining-team dot inside `.ym-disc-ticket-relief` reuses `heroBadgeLed` and the shared 2.4s LED tokens, rather than the app’s 1.5s dot pulse. Reduced motion leaves it lime at scale 1 with the static halo. The progress fill keeps its white background and gains a clipped `::after` gradient: transparent at 0%/100%, white 70% at 30%/70%. `ym-hero-progress-shimmer` translates this layer from −100% to +100%, linearly and indefinitely, using `--ym-hero-progress-shimmer-duration:3500ms` in `app-screens.css :root`. This intentionally reproduces the app’s nearly invisible white-on-white shimmer; no darker sweep is invented. The reference is `tournament_card` at `4f6d88fe`, matching the relevant `origin/main` source. Reduced motion removes the pseudo-element and its animation. The registration ratio, 27→33 sequence and 600ms width transition are unchanged; no JS timer is added.

**Decorative internal phone scroll.** The existing header rAF controller writes `--ym-disc-scroll` on `.hero-phone`, in logical app pixels, using `min(measuredMaximum, max(0, window.scrollY) * 0.12)`. The CSS cap `--ym-disc-scroll-max` is 36 px: at page offsets 0/150/300 px the nominal content offsets are 0/18/36 px. Filters, the placeholder, acquisition card and next ticket translate upward by the full offset; the first-ticket relief instead translates downward by the positive offset (up to 36 px), independently of its child’s −4 px floating cycle; the app header follows at half speed (up to 18 px). Header and filters have local `z-index:3`; phone frame, status bar and bottom navigation remain fixed. The next ticket starts below the viewport plus the maximum offset, so it stays out of view.

The actual maximum is clamped non-negative and no greater than the resting layout clearance between `relief.offsetTop` and the app header’s bottom; the deliberate Pop A2 transform is excluded. `measurePhone()` reads layout offsets only during initialization, passive resize, `pageshow`, font readiness and ResizeObserver notifications for phone/relief/header. Ordinary scroll events only schedule the shared frame; writes occur only when the value changes, rounded to two decimals. No wheel/touch interception or separate animation loop is added. Reduced motion sets the JS offset to zero, responds to preference changes at runtime, and also resets translations in CSS. Missing phone elements are guarded; organiser controllers remain independent.

### Historical carousel tokens — no current homepage consumer
```css
--scroll: 0px;                                                   /* active phone image's translateY (px value written by JS; 0 = phone flat in row) */
--nbr-slide: 3;                                                  /* visible slides desktop; 1 on mobile (= hero card width exactly) */
--slide-spacing: clamp(16px, 2vw, 28px);                         /* gap between slides */
--slide-size: calc((100% - (var(--nbr-slide) - 1) * var(--slide-spacing)) / var(--nbr-slide));
```

**Alignment invariant (sentinel_0 ↔ page-pad):** with `justify-content: flex-start`, slide 0's left-edge is the container's left-edge, which is `--page-pad` from the viewport edge by flex layout directly — no algebraic derivation required. `--nbr-slide = 3` is no longer load-bearing for left-alignment; it remains useful for visual symmetry of the right sentinel and slide-size computation. This aligns the left lime sentinel of the carousel with the left edge of the hero card above, producing a coherent horizontal grid.

**Active-slide centering:** the JS actively measures and corrects via `computeOffsetForIndex` (see Carousel state machine — Helper functions). The previous static identity "slide 1 naturally sits at window/2 ↔ transform = 0" is no longer critical for correctness: `computeOffsetForIndex` is idempotent and works for any active index. The identity remains useful for explaining why `min-width: 0` on `.screen-card` matters: without it, flex's default `min-width: auto` forces each slide to respect its phone-image min-content, breaking the `--slide-size` formula and misaligning the sentinel.

**Design history:** `justify-content: center → flex-start` (2026-05-10). Sentinel-alignment is now guaranteed by explicit flex geometry instead of an implicit algebraic identity. More robust: no longer depends on `--nbr-slide = 3` for left-alignment, nor on the `offsetParent` chain.

### Animation default
```css
--transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Historical carousel state machine (carousel.js, not loaded)

This file remains on disk for reference. The homepage removal also deleted the `--scroll`/`--active-scale`/`data-horizontal-ready` initialization from `script.js`. All state and algorithms below are historical, not active page behaviour.

The carousel is a JS-driven state machine — NOT native CSS scroll-snap. The original choice was motivated by the constraint that the active phone image's `translateY(var(--scroll))` lift requires `overflow-y: visible`, which is incompatible with `overflow-x: auto` (CSS spec promotes the y-axis to `auto` and clips the lift). Participant V2 removes that lift but preserves the gesture state machine.

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

### Historical flat carousel initialization (removed after participant V2)

Before removal, the homepage initialized `.hero-carousel-embla` with `--scroll: 0px`, `--active-scale: 1` and `data-horizontal-ready="true"`. Gestures work immediately, including before page scrolling and with reduced motion. `carousel.js` remains owner of wheel/touch intent, snapping, active index and rubber-band behaviour. `computeBaseLift`, scroll interpolation and the photo shrink writer have been removed from `script.js`; retained CSS lift hooks are inert on the homepage. No handler measures hero buttons for carousel positioning.

<details>
<summary>Historical lift algorithm (removed from homepage on 2026-10-17)</summary>

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

- At page load (scroll = 0), `--scroll` is `${baseLift}px` — a JS-computed pixel value such that the active phone's top edge sits exactly `--desired-button-gap` below the hero-card buttons' bottom edge (CSS token `clamp(24px, 4vh, 56px)`, read at runtime via `getComputedStyle`). The active slide's phone image is lifted UP, visible above the carousel row, just below the hero-card buttons.
- As user scrolls down, page-scroll-progress block animates `--scroll` toward 0. Phone descends into its row position.
- When the user changes slides via wheel/touch, `setActiveIndex` swaps the `.active` class. The new slide's phone image immediately picks up the lift (since `--scroll` is on `.hero-carousel-embla` and inherited).
- The 80ms linear transition smooths the swap.

---

</details>

## Z-index / stacking contexts

| Element | z-index | Stacking-context creator | Why |
|---------|---------|--------------------------|-----|
| `.skip-link` | 1000 | yes | a11y; always on top when focused |
| `.toast` | 1000 | yes | always on top |
| `.hero-header` | 50 | yes (position: fixed) | full-width homepage navigation bar; logo static inside |
| `.screens-rail` (historical CSS, no DOM consumer) | 2 | yes | retained carousel stacking level |
| `.hero-card` | 1 | yes | own stacking context for the background below content |
| `.hero-card-inner` | 1 | yes | content above the photograph and gradient |
| `.hero-card::before` | 0 | yes | clipped photograph and gradient inside the homepage hero, behind content |

---

## Overflow / clipping

```css
html, body { overflow-x: clip; }
```

`overflow-x: clip` (NOT `hidden`/`auto`) is critical: per CSS spec, `clip` allows asymmetric per-axis values WITHOUT promoting the other axis to `auto`. This lets the page clip horizontal bleed (carousel sentinels off-screen) while keeping `overflow-y: visible` (page scroll works normally and the active phone lift isn't clipped vertically).

Historical `.screens-rail` CSS retains `overflow: visible`, but no homepage element consumes it after removal. The photo card independently clips its embedded phone.

`.hero-carousel-embla--container` has NO overflow rule — it's a wide flex row whose excess content (slides 0 and 4) is clipped at viewport edges by `body { overflow-x: clip }`.

---

## CSS transitions inventory

| Selector | Property | Duration | Easing |
|----------|----------|----------|--------|
| `a` | color, opacity | 200ms | `var(--transition)` |
| `.hero-header` | background-color, border-color, backdrop-filter | 300ms | `--hero-header-motion` |
| `.wordmark` (legacy shared styling) | translate, scale, opacity, etc. | 300ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `.btn-glass` | transform, bg, box-shadow | 200ms | `var(--transition)` |
| `.btn-glass svg` | transform | 240ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `.screen-card.active .phone-image` | transform | 80ms | linear |
| `.hero-carousel-embla--container` | transform | 440ms | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `.ym-orga-plus` | rotate | 300ms | `ease` (`--ym-orga-plus-motion`) |
| `.faq-toggle` | color | 200ms | `var(--transition)` |
| `.faq-icon` | rotate | 300ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `.faq-answer` | grid-template-rows | 300ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `.faq-answer-inner p` | padding-bottom | 300ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `.toast` | transform, opacity | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` |

### Shared participant section titles — founder decision 2026-10-18

Four homepage H2s opt into `.section-title` with an inline `.title-pill`: “Comment ça marche **en 3 étapes**”, “Ça smash **près de chez toi**”, “Vu dans **les stories**” and “Questions **fréquentes**” (bold here identifies the pill). Existing IDs remain; Stories stays hidden under S1. H1, eyebrows and step numerals are unchanged; organiser and 404 headings do not opt in.

Headings use Inter 700, normal case, primary text color and no skew. Root tokens are `--section-title-size:clamp(2.25rem,4.6vw,3.5rem)`, `--section-title-line-height:1.02`, `--section-title-tracking:-.045em` and `--section-title-weight:700`. The inline-block pill keeps its text on one line, with lime `--title-pill-bg`, black text, `--title-pill-padding:.02em .28em .08em`, `--title-pill-radius:.4em`, `--title-pill-rotate:-3deg` and `--title-pill-margin:.08em` on its inline start. The old HOW/Stories/tournament H2 size tokens are removed; other typography remains independent. At widths ≤359 px, the tournament H2 borrows the section’s inline padding via an expanded width and negative inline-start margin, keeping its non-wrapping pill inside the band at 320 px. Historical handoff images retain the previous headings.

### Participant badge LED (CSS only)

The three section badges `.hero-card--photo .hero-eyebrow-dot`, `.how-quest .how-eyebrow-dot` and participant `.tp-eyebrow-dot` receive the gentle LED animation (Volleyball, Parcours, Tournois). The hero ticket’s remaining-team dot also reuses this animation, as described above. `heroBadgeLed` runs for `--hero-led-duration:2.4s` with `ease-in-out`, indefinitely. At 0%/100%, the dot uses lime, scale 1.15 and `--hero-led-shadow-on` (10 px blur, 3 px spread, lime 65%). At 50%, it uses `--hero-led-off:#3D4A12`, scale .8 and the transparent zero-size `--hero-led-shadow-off`. These tokens live in `:root`. The dots animate without changing badge/text layout; no pseudo-element or JavaScript is involved. Under reduced motion, animation stops and the dot stays lime at scale 1 with `--hero-led-shadow-static` (8 px blur, 2 px spread, lime 50%). Stories and organiser indicators are excluded.

## CSS keyframe animations inventory

| Selector | Keyframe | Properties animated | Notes |
|----------|----------|---------------------|-------|
| `.hero-card` | `cardEntrance` | `opacity` (0 → 1), `filter: blur` (8px → 0) | No scale. Applied to the hero card on page load. |
| `.hero-title`, `.hero-subtitle` | `titleEntrance` | `opacity`, `translate` (vertical), `filter: blur` | Scale 1.04 → 1 for the title. Staggered delay. |
| `.ym-orga-detail:not([hidden])` | `ym-orga-detail-in` | transform: translateY(101% → 0) | 350ms entry; closing restores `hidden` immediately. |
| `.ym-orga-fl`, `.ym-orga-fl2` | `ym-orga-bob` | translate: 0 → −6px → 0 | 4s / 5s infinite; second variant has −2s delay. |
| Hero relief `[data-hero-progress]::after` | `ym-hero-progress-shimmer` | `translate`: −100% → +100% | 3500ms linear infinite, clipped to fill; removed under reduced motion |
| `.hero-phone .ym-disc-ticket-relief > .ym-disc-ticket` | `ym-hero-ticket-float` | `translate`: 0 → −4 px → 0 | 6s ease-in-out infinite; zero translation under reduced motion |
| Three participant eyebrow dots and hero ticket remaining-team dot | `heroBadgeLed` | `scale`, `background`, `box-shadow` | 2.4s ease-in-out infinite; static lime glow under reduced motion |
| Former `.hero-card-waves path` | `waveDraw` (removed 2026-10-15) | — | Historical SVG stroke entrance; replaced by the static photograph. |

> `titleEntrance` and `cardEntrance` are distinct keyframes. `.hero-card` uses `cardEntrance` (opacity + blur only — no scale). `.hero-title` / `.hero-subtitle` use `titleEntrance` (which includes scale). Do not conflate them.

---

## Reduced motion + mobile overrides

### `@media (prefers-reduced-motion: reduce)`
- All `*` `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important`.
- The former wave-specific override was removed with the SVG; the photograph itself has no animation loop.
- `.hero-carousel-embla { --scroll: 0 }` (phone flat in row, no lift).
- Organiser stickers/detail entry use `animation: none`; plus controls use `transition: none`; navigation uses native auto scrolling.
- Participant hero/header explicitly disable all animations and transitions. The screenshot carousel and its initialization are absent; no scroll-progress writer remains.

### `@media (max-width: 767px)`

The following shared/legacy rules remain available for other consumers. Participant V2 overrides header/card geometry and store typography as described in Hero above; the legacy equal-margin/centred-logo assumptions no longer apply to it.
- `.hero { padding: 0 }` — removes all padding from the hero section; horizontal spacing is handled by `.hero-card` itself.
- Two tokens govern mobile spacing (inline and block axes are **intentionally decoupled**):
  - `--mobile-hero-card-margin: clamp(20px, 5vw, 40px)` — **inline axis only**: consumed by `width` formula (`calc(100% - 2 * var(--mobile-hero-card-margin))`), `margin-inline: auto` on `.hero-card`, and `padding-inline` on `.screens-rail` and `.faq`. Aligns all three elements to the same left/right edge.
  - `--mobile-hero-card-margin-block: clamp(30px, 7.5vw, 60px)` — **block axis only**: consumed by `margin-top`, `margin-bottom`, and `min-height` (`calc(100svh - 2 * var(--mobile-hero-card-margin-block))`) on `.hero-card`, and `top` on `.wordmark`. Larger than the inline token to restore breathing room above the wordmark without widening horizontal margins.
- `.hero-card { width: calc(100% - 2 * var(--mobile-hero-card-margin)); margin-inline: auto; margin-top: var(--mobile-hero-card-margin-block); margin-bottom: var(--mobile-hero-card-margin-block); min-height: calc(100svh - 2 * var(--mobile-hero-card-margin-block)); border-radius: clamp(24px, 7vw, 32px) }` — **floating tile**: equal block margins (top = bottom), tighter inline margins (left = right), centred horizontally via `margin-inline: auto`. `min-height` ≈ 85–87 % of the viewport. Full all-corners border-radius (no flat bottom).
- `.wordmark { top: calc(var(--mobile-hero-card-margin-block) / 2) }` — positions the wordmark exactly halfway between the viewport top and the hero card top, using the block-axis token so it tracks the card's top margin automatically.
- `.hero-carousel-embla { --nbr-slide: 1; --slide-spacing: clamp(16px, 4vw, 28px); --scroll: 0 }` — exactly one slide visible per viewport (slide width = container width = viewport − 2×`--mobile-hero-card-margin` = hero card width). No lift. Carousel is intentionally pushed below the fold (visible on scroll).
- `.screens-rail { padding-inline: var(--mobile-hero-card-margin); padding-block: clamp(40px, 7vw, 96px); background: var(--color-light-bg) }` — `padding-inline` aligns the rail's left/right edges with the hero card edges; neighbouring slides peek into the padding area, providing swipe affordance.
- `.faq { padding-inline: var(--mobile-hero-card-margin); padding-block: var(--mobile-hero-card-margin) }` — overrides `--page-pad` on mobile so the FAQ left/right edges align with the hero card and carousel, not the wider desktop gutter; `padding-block` reuses the inline token (the FAQ block padding is independent of the hero card block-axis split). Footer keeps `--page-pad`.
- `.glass-eyebrow { display: none }` (`styles.css:4258`) — the eyebrow line of the `.btn-glass` CTAs is hidden entirely on mobile; the narrow 320–414 px viewport leaves only ~55–80 px of label width, too tight for the two-line "Télécharger sur / App Store" stack. The `aria-label` on `.btn-glass` already carries the full "Télécharger sur l'App Store" / "Télécharger sur Google Play" copy to screen readers, so there is no semantic loss.
- `.glass-label { font-size: clamp(10px, 2.6vw, 12px); white-space: nowrap }` (`styles.css:4271`) — shrinks and locks the CTA label to a single line so "Google Play" never wraps inside its button; the desktop clamp collapses to a 12 px floor on mobile, which is still too wide for the ~55 px label slot at vp 320, hence the tighter 10 px floor.
- Participant V2 overrides legacy mobile hero/wordmark/CTA rules through §7.7 scoped selectors: header spacing, static left logo, visible store eyebrows and tokenized label sizing. The screenshot carousel is absent at every width.

---

## Recent design decisions (with rationale)

### Participant tournament section V2 (2026-10-18)

Replaced the participant public rail with an app-ticket grid, final static creation card and recent-tournament ticker on a light-gray court background. Kept data loading, validation, cache and organizer rendering unchanged; demo tournament CTAs are inert visual spans. See [implementation notes](handoff/tournois-plateforme-v2/implementation/README.md).

### Screenshot carousel removed (2026-10-17)

Removed the five-card `.screens-rail` between hero and HOW, the `carousel.js` script tag and the flat-carousel initialization block in `script.js` at the founder’s request. Retained the historical JS file and unused CSS for reference. The coded phones inside hero/HOW and the independent public tournament rail remain. Earlier carousel descriptions and design decisions below are historical.

### HOW V2 — coded journey and integrated illustrations (2026-10-17)

Replaced the editorial three-column journey with dark/lime cards containing tournament, confirmation and ranking HTML screens. E1 integrates former team/score decorations and preserves FAQ parallax; E2 omits the conversion banner. A progressive, one-shot IntersectionObserver entrance preserves visibility without JS/IO and with reduced motion. Shared `app-screens.css` stays outside the minification build. See [implementation notes](handoff/comment-ca-marche-v2/implementation/README.md).

### Participant hero V2 — founder decisions (2026-10-17)

Implemented split hero with a coded discovery screen and decorative cards, unchanged H1, no subtitle/reassurance, and initially a single fixed header pill after 30 px, subsequently replaced by a full-width rectangular bar. Removed homepage carousel lift, active scaling and photo shrink writers; retained independent carousel and organiser controllers. [Implementation notes](handoff/hero-participant-v2/implementation/README.md) record accepted differences from the original handoff. Earlier decisions below are historical where superseded by V2.

### `--mobile-hero-card-margin` token + wordmark vertical centering (2026-05-10)
The four repeated inline `clamp(20px, 5vw, 40px)` literals in `.hero-card`'s mobile override block were factored into a single CSS custom property `--mobile-hero-card-margin`. A new `.wordmark` mobile rule `top: calc(var(--mobile-hero-card-margin) / 2)` places the wordmark at the visual midpoint between viewport top and lime card top, achieving equal optical spacing. One source of truth for the margin value; the wordmark tracks it automatically when the margin changes.

### Inline/block margin split — `--mobile-hero-card-margin-block` introduced (2026-05-11)
`--mobile-hero-card-margin: clamp(20px, 5vw, 40px)` is now **inline-axis only** (left/right: `width` formula on `.hero-card`, `padding-inline` on `.screens-rail` and `.faq`). A new token `--mobile-hero-card-margin-block: clamp(30px, 7.5vw, 60px)` takes over the **block axis**: `margin-top`, `margin-bottom`, and `min-height` on `.hero-card`, plus `top` on `.wordmark`. Motivation: restore vertical breathing room above the wordmark (the block margin had been compressed when both axes shared a single token) without widening the horizontal margins, which control carousel alignment. The two tokens are kept intentionally separate — do not collapse back into one.

### Mobile carousel = hero card width (2026-05-10)
`.screens-rail` `padding-inline` on mobile is now `var(--mobile-hero-card-margin)` (previously `var(--page-pad)`), and `--nbr-slide` is `1` (previously `1.08`/`1.1`). Each slide is exactly as wide as the lime hero card (viewport − 2×`--mobile-hero-card-margin`). Neighbouring slides peek into the padding area, providing natural swipe affordance without fractional-slide hacks.

### Carousel extracted to dedicated file (2026-05-10)
The ~245-line carousel state machine was moved from `script.js` to a new standalone file `carousel.js`. Pure extraction — no behavior change. `index.html` loads `<script src="carousel.js" defer>` before `<script src="script.js" defer>`; sequential `defer` tags maintain execution order while keeping both scripts non-blocking. `script.js` now contains only non-carousel concerns: copyright year, toast scaffolding, wordmark scroll-awareness, page-scroll-progress (and, added since, QR widget, floating-card parallax; the wave-SVG animation was removed with the homepage photo replacement on 2026-10-15). The pending-CTA delegation block mentioned here at the time of extraction was removed 2026-07-27 — see Hero section above.

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
`--nbr-slide` 3.4 → 3; `--slide-spacing` `clamp(28px, 3.6vw, 52px)` → `clamp(16px, 2vw, 28px)`. Moving to an integer slide count activates the sentinel_0 ↔ page-pad alignment invariant (see Carousel — runtime-critical token block above). User request: align the first carousel card's left edge with the left edge of the hero card above.

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
- Equal block margins (top = bottom) preserve the optical balance invariant; inline margins are intentionally tighter to keep carousel slide edges aligned with the hero card.

_Addendum (2026-05-11): the "equal margins all sides" pattern from `feedback_website_hero_pattern.md` has evolved into **equal block margins (top = bottom) + tighter inline margins (left = right)**. The invariant that matters is symmetry within each axis — not that all four values are identical. The two axes are governed by separate tokens and must stay decoupled._

_Iteration history: full-bleed (`width: 100%`, reverted quickly) → side-margins only (`clamp(24px, 6vw, 40px)` inline, top = `--page-pad`, bottom flat) → floating tile, single token all sides (2026-05-10) → **floating tile, inline/block split** (current, 2026-05-11)._

---

## Floating cards — dimensions & mobile overrides

Only the rotating badge (`data-card-id="6"`) in `.faq` remains in the parallax engine after HOW V2. Team grid (`3`) and scoreboard (`2`) were first replaced by integrated `.quest-step-float` illustrations; those integrated illustrations were subsequently removed on 2026-10-18. Historical placements below describe their former parallax versions, not active V2 layout.

All use the double-wrapper pattern: **outer** `.floating-card-parallax` carries position + parallax translate; **inner** `.floating-card-inner` carries the levitation keyframe. `pointer-events: none` on the outer wrapper is load-bearing (cards sit above interactive content).

**Sur mobile (`max-width: 767px`), toutes les `.floating-card-parallax` sont masquées via `display: none !important` (`styles.css:4199`). Seules les décorations utilisant cette classe sont concernées ; les anciennes `.quest-step-float` V2 ont depuis été supprimées du DOM. Décision initiale prise 2026-05-12.**

_(All per-card mobile position/dimension overrides that existed prior to 2026-05-12 have been removed from CSS and from this doc. The blanket kill rule supersedes them entirely.)_

---

### Removed decoration — Card 1 notification (2026-10-15)

The homepage’s “Nouveau tournoi dispo” mock notification, its `.floating-card-parallax[data-card-id="1"]` wrapper and dedicated notification styling/levitation were removed. The separate hero lime/grid background was subsequently replaced by the photograph described above. The shared parallax engine now serves only the FAQ badge; HOW V2 later replaced its two other wrappers.

Historical placement only: `.hero` — `bottom: 30%; left: 2%; rotate: -8deg`; former variant `.floating-card--notif`. These are no longer active layout rules.

---

### Historical Card 3 — team grid (replaced by HOW V2) (`.floating-card--team`, `[data-card-id="3"]`)

Desktop host: `.how-quest` — `top: -13%; right: 4%; left: auto; rotate: 3deg`. Desktop width: `clamp(260px, 20vw, 300px)`.

Rationale: at `-13%`, the card is lifted ~90–115 px above `.how-quest`'s top edge and floats visually in the lower-right area of `.hero`, just above the "PARCOURS" eyebrow. This is the arithmetic midpoint between the origin (`top: -4%`) and the previous value (`top: -22%`, judged too high). This relies on `.how-quest { overflow-x: clip }` which — per CSS spec — does **not** promote `overflow-y` to `auto`, so the negative-top bleed on the Y axis remains visible. Parallax: base rule `translate: 0 var(--parallax-y, 0px)`, `data-parallax-speed="0.08"` (no desktop override).

---

### Card 6 — rotating badge (`.floating-badge`, `[data-card-id="6"]`)

Desktop host: `.faq` — `top: -8%; right: 8%; left: auto; bottom: auto; translate: 0 var(--parallax-y, 0px); rotate: 12deg`. Desktop size: `143px × 143px`.

The badge is lifted above `.faq`'s top edge (via `top: -8%`) and now appears at the lower-right organiser/FAQ seam, following insertion of the organiser cards on 2026-10-14. This works because `.faq { overflow-x: clip }` — per CSS spec, `overflow-x: clip` does **not** promote `overflow-y` to `auto`, so the negative-top bleed remains visible. `right: 8%` resolves against `.faq`'s full-bleed padding-box width (≈ viewport width): 8% of 1440 px ≈ 115 px, placing the badge's left edge ~180–215 px from the right viewport edge — near the right edge of the preceding organiser section. `translate: 0 var(--parallax-y, 0px)` preserves JS-driven Y parallax without the former `-50% X` centering shift (which was only needed when the badge was `left: 50%`-anchored).

**+10% size bump (2026-05-12):** disc bumped from `130px → 143px` (`styles.css:2447`). The central arrow SVG (`index.html` line 547 carries HTML attrs `width="28" height="28"`) is bumped to `31px` via CSS override (`styles.css:2510` — `28 × 1.10 ≈ 30.8 → 31`; CSS wins over presentational HTML attrs per spec). `.floating-badge__rotor-text` stays at `font-size: 11px; letter-spacing: 0.18em` — the text arc scales automatically because `.floating-badge__rotor-svg` fills the disc with `width: 100%; height: 100%`, so the SVG viewBox (`0 0 130 130`) is physically stretched to 143px, enlarging the text-on-path proportionally.

---

### Historical Card 2 — scoreboard (replaced by HOW V2) (`.floating-card--scoreboard`, `[data-card-id="2"]`)

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

Current `data-parallax-speed` values are harmonised in the `[0.06, 0.08]` range (card 2: `0.06`, card 3: `0.08`, card 6 badge: `0.06`). Speeds were reduced from their former `0.15–0.25` range to prevent a perceptible ~22px jump per 100px wheel detent; the lerp (see below) absorbs any residual quantisation.

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

**IntersectionObserver scroll-gate:** within `setup()`, an `IntersectionObserver` (`rootMargin: '20% 0% 20% 0%'`) tracks unique parent sections (currently only `.faq`; `.how-quest` no longer contains parallax wrappers). The `window scroll` listener is attached only while at least one parent is intersecting (`visibleParents > 0`) and detached when none are. A counter (`visibleParents`) — not a boolean — handles the `.how-quest visible` → `.faq visible` → `.how-quest exits` transition without flapping the listener off then back on. A synthetic `onScroll()` call on IO re-entry re-syncs `--parallax-y` before the next real scroll event.

**Listener symmetry:** `setup()` attaches `scroll` (via IO gate), `resize`, `orientationchange`, `load`. `teardown()` removes the exact same references. `setup()` is idempotent (`if (io !== null) return`); `teardown()` is idempotent (`if (io === null) return`).

---

## Native cursor — decorative trail removed (2026-10-15)

The homepage and organiser route use the native system cursor without a volleyball companion or drawn trail. The homepage’s `.cursor-trail` canvas and `.cursor-emoji` span, the standalone cursor IIFE in `script.js`, and their shared CSS rules (including reduced-motion selectors) have been removed. The organiser route already had no cursor-decoration markup or script.

No cursor-specific pointer listeners, animation-frame loop or canvas remain. Existing link/button cursors and carousel grab/grabbing feedback are preserved. Magnetic buttons and scroll-driven effects are independent and remain unchanged by this removal. Homepage waves were subsequently removed for the photograph replacement.

<details>
<summary>Historical reference — removed cursor implementation (not active)</summary>

The following describes the implementation before removal; selectors, constants and line references are historical and must not be treated as current requirements.

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

</details>

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

## Mobile deep-linking — `.well-known/`

Two static JSON manifests enable native deep-linking between the website and the Yamatch iOS/Android apps. They live under `website/.well-known/` and are served at `https://appyamatch.fr/.well-known/*` automatically by GitHub Pages after every push to `main`.

**No extra server configuration is required.** GitHub Pages has natively served `apple-app-site-association` (without extension) with `Content-Type: application/json` since 2016. No `vercel.json`, no `.htaccess`, no custom headers config.

### Deployment pipeline

The workflow `.github/workflows/deploy.yml` runs the fail-closed production build, then uploads `./website` as the Pages artifact via a custom tar step (see below). Because `website/.well-known/` is part of that tree, both association files are deployed on every `git push main` (typically live within 1–3 minutes).

#### Custom tar workflow — required (do not revert)

`actions/upload-pages-artifact@v5` (the standard GitHub Pages upload action) internally runs `tar --exclude=.[^/]*`, which silently strips **every dotfile and dotfolder** — including `.well-known/` and `.nojekyll` — before the artifact ever reaches the CDN. The result is a guaranteed 404 on `/.well-known/*` with no build error and no warning. Root cause confirmed by inspecting GitHub Actions run `26437651146`.

**Fix (currently in place).** The deploy workflow uses a manual tar + `actions/upload-artifact@v4` instead:

- Step `Tar artifact (preserve dotfiles for .well-known/)` — tars `./website` excluding only `.git` and `.github`, preserving all other dotfiles.
- Step `Upload artifact` (`actions/upload-artifact@v4`, `include-hidden-files: true`) — uploads the tar without stripping.

See `.github/workflows/deploy.yml` lines ~34-49 for the exact YAML.

**Critical invariant — do not revert to `actions/upload-pages-artifact@v5`.** Doing so silently re-breaks Universal Links and Android App Links on the next deploy with no build error and no runtime signal on device.

#### `website/.nojekyll` — defence-in-depth sentinel (do not delete)

`website/.nojekyll` is an empty (0-byte) file at the root of the served directory.

**Why.** If the workflow is ever reverted to `actions/upload-pages-artifact@v5`, GitHub Pages' Jekyll pre-processing layer would additionally strip dotfolders at serving time. `.nojekyll` disables that second layer of stripping. It is not the current fix (the CI tar step is), but it guards against a regression at a different layer.

**Side effects of disabling Jekyll: none.** The site uses no Jekyll features — no `_config.yml`, no `_layouts/`, no `_includes/`, no front-matter. Disabling Jekyll is pure gain.

**Do not delete this file.** It costs nothing and provides a second line of defence if the upload action is ever changed.

To verify the Apple file is reachable after deployment:

```bash
curl -I https://appyamatch.fr/.well-known/apple-app-site-association
# Expect: HTTP/2 200 + content-type: application/json
```

Apple's CDN (APNs / CFNetwork) revalidates the AASA automatically every few hours. A freshly installed app reads the file at install time; an already-installed app picks up changes on the next revalidation cycle. **Modifying `paths` or `appID` in the AASA requires a full app reinstall on the device to take effect** (CFNetwork caches aggressively).

---

### `website/.well-known/apple-app-site-association` — Apple Universal Links

| Field | Value |
|-------|-------|
| File | `website/.well-known/apple-app-site-association` (no extension — required by Apple spec) |
| Format | Raw JSON, validated during `npm run build` |
| `applinks.details[0].appID` | `W8JKU3PMD9.com.appyamatch.yamatch` |
| `applinks.details[0].paths` | The seven exact routes listed below |
| `webcredentials.apps[0]` | `W8JKU3PMD9.com.appyamatch.yamatch` |

**URL patterns handled natively by the iOS app (opens in-app, not Safari):**
- `https://appyamatch.fr/auth/callback` — OAuth / magic-link callback after login
- `https://appyamatch.fr/invite/*` — team invite
- `https://appyamatch.fr/org-invite/*` — organization invite
- `https://appyamatch.fr/owner-transfer/*` — organization owner transfer
- `https://appyamatch.fr/referee/*` — referee request
- `https://appyamatch.fr/tournament/*` — tournament detail
- `https://appyamatch.fr/tournament-invite/*` — tournament invite

Any URL not matching these paths falls through to the browser normally.

---

### `website/.well-known/assetlinks.json` — Android App Links

| Field | Value |
|-------|-------|
| File | `website/.well-known/assetlinks.json` (generated, gitignored) |
| Format | JSON array generated by `scripts/generate-assetlinks.mjs` |
| Pending state | `[]` — no Android certificate trusted |
| Active `relation` | `["delegate_permission/common.handle_all_urls"]` |
| Active `target.namespace` | `android_app` |
| Active `target.package_name` | `com.appyamatch.yamatch` |
| Active `target.sha256_cert_fingerprints` | Exact value of `PLAY_APP_SIGNING_SHA256` |

**Statut Android App Links : actif.** L'empreinte `07:5D:03:FF:1F:34:9D:72:4F:48:A9:62:5D:BB:8F:3F:53:D6:B8:80:56:6C:87:43:1C:4E:EB:7B:11:A3:9B:13` provient du fichier JSON Digital Asset Links officiel de Play Console pour `com.appyamatch.yamatch`. Elle est l'unique valeur de `sha256CertFingerprints` et de la variable GitHub. L'ancienne valeur `00:78:DD:F9:7E:9F:FD:08:42:39:B3:8A:65:09:38:5B:47:6E:E3:FC:B0:C8:DC:B8:6E:C4:A1:6E:43:97:2F:C3` reste uniquement dans `rejectedUploadFingerprints`, car elle correspond au certificat de clé d'upload.

Toute rotation future doit repartir du fichier JSON Digital Asset Links officiel de Play Console : ajouter la nouvelle empreinte à `sha256CertFingerprints` dans une PR reviewée, puis mettre à jour `PLAY_APP_SIGNING_SHA256`. L'empreinte du certificat d'upload n'est jamais équivalente. Une valeur absente avec une allowlist active, invalide, différente de l'allowlist ou explicitement rejetée arrête le déploiement avant la création de l'artefact.

Après déploiement, vérifier le document servi via Google's Statement List Checker ou :

```bash
curl https://appyamatch.fr/.well-known/assetlinks.json
```

---

## Conventions reference

- All design tokens in `:root`. No hardcoded hex/font/radius outside this block.
- French copy throughout (`tu` form for player-facing). Multi-sport positioning (volleyball first, other sports unnamed) — see Positionnement produit.
- No emojis in markup unless explicitly requested.
- No third-party scripts — the site is 100% same-origin (qrcode-generator vendored at `website/vendor/qrcode.min.js`, migrated off the jsdelivr CDN 2026-07-05 — see SEO → Third-party scripts). Any CDN script reintroduced without explicit user approval must carry a `sha384` SRI hash + `crossorigin="anonymous"`.
- All `<img>` carry meaningful French alt text (or empty alt for decorative).
- `draggable="false"` on phone images; `aria-hidden="true"` + `focusable="false"` on decorative SVG.
- Shared CSS source (`styles.css`) → generated `styles.min.css` (gitignored). Homepage JS: `script.js` plus the QR vendor; `carousel.js` is historical and not loaded. The organiser route additionally loads its own unminified `hero-organisateur.css`, local `gestion-organisateur.css`, standalone `hero-organisateur.js`, `organisateur-cards.js`, `gestion-organisateur.js` and `organisateur-faq.js`; it then loads shared `../script.js` for the tournament rail, with homepage controllers guarded by `body.org-page`. No XHTML mirror.
- No Google Fonts `<link>` or `preconnect` tags. All fonts are self-hosted under `website/fonts/`.

### Copy — registre de voix

| Destinataire | Registre | Exemples |
|---|---|---|
| Participant (joueur) | `tu` | "Trouve un tournoi", "Inscris ton équipe", "Place au jeu" |
| Organisateur (lien home, cartes et page dédiée) | `tu` | "T’es organisateur ?", "Ton tournoi de volley…" |
| FAQ | mixte selon la réponse | `tu` si la réponse s'adresse à un joueur, `vous` si à un organisateur |

La page `/organisateur/` conserve le tutoiement du handoff approuvé (« Ton tournoi de volley… »). Le parcours participant de la home est désormais statique dans `index.html`. Ne pas mélanger les registres au sein d’un même step ou d’une même réponse FAQ.

### Typographie — règles d'apostrophe et d'espacement

- **Apostrophes typographiques** (U+2019 `'`) obligatoires dans toute la copy user-facing — jamais l'apostrophe droite ASCII (`'`).
- **Espace insécable** (U+00A0) avant `%` et entre un nombre et son unité (`24 h`, `4,5 %`).

## Contact de participation — 12 octobre 2026

La politique décrit le téléphone privé lié au compte : +33 vérifié via Twilio Verify, international déclaré, accès organisateur aux participants confirmés/roster jusqu’à J+30 inclus Europe/Paris. Cette borne limite l’accès, pas la conservation dans le compte. La page distingue les purges techniques Yamatch des durées fournisseur non attestées. Aucun changement CSS, JavaScript, permissions ou métadonnées console n’est implicite.

### 12 October — combined privacy/commercial preparation

The PR #32 candidate incorporates the published PR #33 phone policy without
removing its Twilio, verification, organizer-access J+30 or notice paragraphs.
Order data and phone data are combined in the Supabase recipient description.
The public privacy date remains 12 October. Independent comparison of the phone
paragraphs against main and 15 website tests PASS. This is preparation, not proof
of publication or activation.

The subsequent founder-approved CGU draft removes the universal fixed 15-day
promise prospectively. Article 3 retains applicable legal notice/consent rules
(explicitly including EU Regulation 2019/1150), prior notification and protection
of rights/notice periods under previously accepted terms. It does not claim a
small-platform exemption or retroactively erase obligations. Privacy article 10
still retains its separate 15-day clause. Article 6.1 and both visible/JSON-LD FAQ
state 8% by default, including possible reduced or zero partner rates, while
preserving already consented payment prices. Preparing this PR is not legal
certification or evidence that notices have been sent.

Review references: [DGCCRF marketplace obligations](https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/pratiques-restrictives-de-concurrence-les-obligations-juridiques-specifiques-imposees-aux-places-de-marche-en-ligne)
and [Regulation (EU) 2019/1150, articles 1–3](https://eur-lex.europa.eu/eli/reg/2019/1150/oj?locale=fr).
Whether each organizer falls within the business-user scope must not be inferred
from platform size alone. Publication and applicability timing remain separate
from the technical build.
