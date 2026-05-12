# Yamatch Marketing Website — Architecture

**Single source of truth for the marketing site at `website/`.**

This doc is mandatory pre-flight reading for `html-expert`, `css-expert`, `js-expert`, and `website-reviewer` before any modification. If this doc disagrees with the actual code, the **code wins** — flag the drift in the report and update this doc via `doc-keeper`.

Last sync: 2026-05-12.

---

## Tech stack

Vanilla **HTML5 + CSS3 + ES2020+ JavaScript**. No framework, no bundler, no build step. Four files:

| File | Role | Approx. lines |
|------|------|---------------|
| `website/index.html` | Single page — hero + carousel + FAQ + footer | ~300 |
| `website/styles.css` | All styles. Design tokens in `:root`. Heavy use of `clamp()`. | ~700 |
| `website/carousel.js` | Standalone IIFE: complete carousel gesture state machine (wheel + touch + rubber-band). Loaded via `<script src="carousel.js" defer>` **before** `script.js`. | ~245 |
| `website/script.js` | Standalone IIFE: copyright year, toast, pending-CTA delegation, wordmark scroll-aware behaviour, wave-SVG animation, page-scroll-progress block. | ~454 |

`carousel.js` is loaded first in HTML (`<script src="carousel.js" defer>` then `<script src="script.js" defer>`). Sequential `defer` tags guarantee execution order while keeping both scripts non-blocking.

Only `live-server` (via `npx`) is permitted as an npm artifact.

---

## DOM structure

Sections under `<main id="top">`, in order:

1. **`.hero`** — lime card with title, subtitle, App Store / Google Play buttons; wordmark above
2. **`.screens-rail`** — horizontal carousel with 5 phone screenshots
3. **`.faq`** — accordion of 6 questions
4. **`<footer>`** — outside `<main>`, light-gray background (matches `.faq`), dark text, content centered

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
            ├── a.btn-glass.js-pending-cta (App Store)
            └── a.btn-glass.js-pending-cta (Google Play)
```

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
--font-body: 'Inter', system-ui, …;       /* weights 400, 500, 600, 700, italic-500 */
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

**Sur mobile (`max-width: 767px`), toutes les `.floating-card-parallax` sont masquées via `display: none !important` (`styles.css:4142`). Aucune card/badge n'est rendue. Décision prise 2026-05-12.**

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

Hidden on mobile: covered by the blanket `display: none !important` kill rule (`styles.css:4142`) along with all other cards. Original rationale: density — the narrow `.how-quest` cannot accommodate it without crowding the stacked-column layout.

---

### Parallax mechanism (all cards)

JS writes `--parallax-y` as a CSS custom property on each `.floating-card-parallax` element via `IntersectionObserver` + `scroll`. The base rule sets `translate: 0 var(--parallax-y, 0px)`. Cards that need X-centering override this with `translate: -50% var(--parallax-y, 0px)`. The individual `translate` property and the `transform: translateZ(0)` compositor hint sit on separate properties and do not conflict.

#### Gates / early-returns (`script.js` IIFE, lines 1392–1719)

The parallax IIFE (`script.js:1392`) evaluates three sequential guards before any listener is registered. Guards 1 and 2 are permanent early-returns (the IIFE exits); Guard 3 is dynamic (a live MQL drives `setup()` / `teardown()`).

- **Gate 1 — `prefers-reduced-motion` (`script.js:1398`):** `window.matchMedia('(prefers-reduced-motion: reduce)').matches` — if true, the entire IIFE returns immediately. Cards stay at their CSS-defined base position (`--parallax-y` defaults to `0px` via the `var()` fallback). Evaluated before any other work.

- **Gate 2 — no cards present (`script.js:1404`):** `cards.length === 0` — if no `.floating-card-parallax` elements exist in the DOM (e.g. future utility pages, or a refactor that removes them), the IIFE exits silently. No observer, no listener, no allocation.

- **Gate 3 — mobile breakpoint (`script.js:1406–1415`, initial branch `script.js:1702–1718`):** `window.matchMedia('(max-width: 767px)')` held as a live `MediaQueryList`. On mobile load, `setup()` is never called — no `IntersectionObserver`, no scroll/resize/orientationchange/load listener is attached. A `change` listener on the MQL handles breakpoint crossings mid-session: crossing into mobile calls `teardown()` (disconnects IO, removes all listeners, clears debounce timer); crossing back to desktop calls `setup()`. The pattern mirrors the launch-ticker MQL block (`script.js:~1747`). Safari < 14 fallback uses the deprecated `mobileQuery.addListener()` API.

**IntersectionObserver scroll-gate:** within `setup()`, an `IntersectionObserver` (`rootMargin: '20% 0% 20% 0%'`, `script.js:1630`) tracks unique parent sections (`.how-quest`, `.faq`). The `window scroll` listener is attached only while at least one parent is intersecting (`visibleParents > 0`) and detached when none are. A counter (`visibleParents`) — not a boolean — handles the `.how-quest visible` → `.faq visible` → `.how-quest exits` transition without flapping the listener off then back on. A synthetic `onScroll()` call on IO re-entry re-syncs `--parallax-y` before the next real scroll event.

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
- French copy throughout (`tu` form for player-facing).
- No emojis in markup unless explicitly requested.
- No third-party scripts without explicit user approval.
- All `<img>` carry meaningful French alt text (or empty alt for decorative).
- `draggable="false"` on phone images; `aria-hidden="true"` + `focusable="false"` on decorative SVG.
- Single CSS file, single HTML file. Two JS files: `carousel.js` (state machine) + `script.js` (all other JS). No XHTML mirror.
