(function () {
    'use strict';

    // Dynamic copyright year
    const yearEl = document.getElementById('copyrightYear');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Toast scaffolding
    const toast = document.getElementById('toast');
    let toastTimeout;
    const showToast = (message) => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('visible'), 4000);
    };
    window.yamatchToast = showToast;

    // Pending CTA delegation — store buttons aren't live yet.
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.js-pending-cta');
        if (!trigger) return;
        e.preventDefault();
        showToast("Bientôt disponible. Laisse-nous ton email pour être prévenu·e.");
    });

    // === Wordmark click-to-top — independent of scroll listener ===
    {
        const wordmark = document.querySelector('.wordmark');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (wordmark) {
            wordmark.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
            });

            let rafId = null;
            const updateCondensed = () => {
                wordmark.classList.toggle('is-condensed', window.scrollY > 30);
                rafId = null;
            };
            const onScroll = () => {
                if (!rafId) rafId = requestAnimationFrame(updateCondensed);
            };
            window.addEventListener('scroll', onScroll, { passive: true });
        }
    }

    // === Page-scroll-driven --scroll + --active-scale on .hero-carousel-embla ===
    // Desktop and mobile: the active phone starts lifted over the lime hero card so that
    // its top edge sits exactly --desired-button-gap below the hero buttons' bottom
    // edge — regardless of viewport. As the user scrolls, the lift interpolates back to
    // 0 and the phone descends into its row position.
    {
        const carousel = document.querySelector('.hero-carousel-embla');
        // The lime hero card is the consumer of `--card-shrink` (a px value
        // that shrinks the card's `min-height` so its bottom edge rises in
        // sync with the active phone descending into the row). Querying it
        // here in the page-scroll setup keeps the writer scoped: each custom
        // property is written directly to its consumer element, never to
        // documentElement (mirrors the existing `--scroll` write on `.hero-carousel-embla`).
        const heroCard = document.querySelector('.hero-card');
        // The outer `.hero` section is the consumer of `--hero-flow-collapse`
        // (a POSITIVE px magnitude written live by the page-scroll writer so
        // its CSS rule `margin-bottom: calc(-1 * var(--hero-flow-collapse, 0px))`
        // collapses the hero's flow box by exactly the same number of pixels
        // the lime fill has visually shrunk via `clip-path` on `.hero-card::before`.
        // Without this, the carousel (in-flow sibling of `.hero`) keeps its
        // natural top and a whitespace gap opens between the shrunk fill and
        // the carousel. See styles.css `.hero` rule for the consumer side.
        const hero = document.querySelector('.hero');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const mobileQuery = window.matchMedia('(max-width: 767px)');
        // Declared for cohesion with the waves block below (which gates its rAF loop on
        // coarse pointer). The page-scroll writer does NOT branch on this — its iOS
        // jank fix is to drop ALL layout reads from the per-frame path on every device,
        // not just touch ones, so the savings apply uniformly.
        const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

        // Reduced-motion path: the page-scroll writer below early-returns on the
        // `!reduceMotion` guard, so `--scroll` stays at its CSS default (0px) and
        // the active phone is flat in the row from the start. There is no lift
        // to "fully retract" → the carousel is horizontally navigable by
        // construction. Set the dataset flag once at setup so carousel.js's gate
        // (`isHorizontalReady`) doesn't permanently block these users.
        if (reduceMotion && carousel) {
            carousel.dataset.horizontalReady = 'true';
        }

        if (carousel && heroCard && hero && !reduceMotion) {
            // Default state for the carousel horizontal-navigation gate (read by
            // carousel.js via `viewport.dataset.horizontalReady`): start LOCKED so
            // wheel/touch on the carousel can't navigate horizontally while the
            // active phone is still lifted above the rail. The first
            // `updateScroll` tick (scheduled at the bottom of this block) will
            // flip it to 'true' if the user already loaded mid-scroll past the
            // threshold; otherwise it stays 'false' until the user scrolls down
            // and `progress` reaches >= 0.995.
            carousel.dataset.horizontalReady = 'false';

            // Desired vertical gap (in px) between the active phone's top edge and the
            // hero buttons' bottom edge at scroll = 0. Sourced from the CSS custom
            // property --desired-button-gap (declared in styles.css :root) so the value
            // is owned by the design tokens, not hardcoded in JS. clamp(24px, 4vh, 56px)
            // resolves at computed-time, so getPropertyValue returns the resolved px
            // string ("e.g. 27px"). Re-read on every rAF tick — getComputedStyle on
            // documentElement for a single custom property is sub-microsecond, and this
            // automatically picks up resize / orientationchange (vh-dependent clamp).
            // Fallback to 40 if the token is missing (defensive — older deployments).
            const ROOT = document.documentElement;
            const readDesiredButtonGap = () => {
                const raw = getComputedStyle(ROOT).getPropertyValue('--desired-button-gap');
                const parsed = parseFloat(raw);
                return Number.isFinite(parsed) ? parsed : 40;
            };

            // Cache viewport height. iOS Safari shrinks/grows window.innerHeight as the
            // URL bar collapses/expands DURING vertical scroll, which would otherwise
            // make our (startY = vh) → (endY = vh * 0.4) interpolation jitter mid-scroll
            // and cause the active phone image to "teleport" frame-to-frame. We refresh
            // the cached value only on resize / orientationchange / load — events that
            // signal a deliberate layout-affecting change — never on scroll.
            let cachedVh = window.innerHeight || document.documentElement.clientHeight;
            const refreshCachedVh = () => {
                cachedVh = window.innerHeight || document.documentElement.clientHeight;
            };

            // Reference top of the carousel in PAGE coordinates (scroll-independent),
            // captured "as if `--hero-flow-collapse` were 0" so it survives unchanged
            // across rAF ticks. The page-scroll writer derives a per-frame
            // `virtualCarouselTop` from `staticCarouselTop - latestScrollY` instead
            // of calling `carousel.getBoundingClientRect().top`. This breaks the
            // layout-feedback loop that would otherwise form: writing
            // `--hero-flow-collapse` shifts `.screens-rail` (in-flow sibling), which
            // would change `carousel.getBoundingClientRect().top`, which would change
            // `progress`, which would change the next written collapse — jitter.
            //
            // `currentFlowCollapse` mirrors the most recently written collapse value.
            // It is added back into the rect-based reading inside
            // `measureScrollAnimationGeometry` so the snapshot we keep is the
            // carousel's UNCOLLAPSED page position. At first measure (load),
            // `currentFlowCollapse === 0`, so the addition is a no-op. On a resize
            // that happens mid-scroll, `currentFlowCollapse` may be > 0 — adding it
            // cancels the active collapse and recovers the same stable reference.
            // Re-measured only on layout-affecting events
            // (load / resize / orientationchange), never per scroll.
            let staticCarouselTop = 0;
            let currentFlowCollapse = 0;
            // Caches updated only by `measureScrollAnimationGeometry` (load / resize /
            // orientationchange — never per scroll). The per-frame `updateScroll` reads
            // these instead of calling `computeBaseLift` / `getBoundingClientRect` /
            // `getComputedStyle`, eliminating the layout-read pass that desynchronised
            // the lift from the iOS compositor's touch-driven scroll.
            //  - `cachedBaseLift`     mirrors `computeBaseLift()` (NEGATIVE px — phone
            //                         translateY needed to put its top edge
            //                         `--desired-button-gap` below the buttons).
            //  - `cachedLiftMagnitude` is `Math.max(0, -cachedBaseLift)` — POSITIVE px,
            //                         consumed by `cardShrink = liftMagnitude * 0.8 * progress`.
            //  - `latestScrollY`      mirrors `window.scrollY`. The scroll listener writes
            //                         it once per event (single property read, no layout
            //                         work), and the rAF callback consumes it.
            // All three may go slightly stale between resize events (e.g. user changes the
            // active carousel slide while the height of the new phone differs); since all
            // five phones share the same intrinsic dimensions this drift is invisible. If
            // it ever becomes visible we can call `measureScrollAnimationGeometry()` from
            // the carousel's `setActiveIndex`.
            let cachedBaseLift = 0;
            let cachedLiftMagnitude = 0;
            let latestScrollY = window.scrollY || window.pageYOffset || 0;

            let rafId = null;

            // Reads the active phone's CURRENT translateY (m42) from the live computed
            // transform. Necessary because the lift we apply on each frame composes with
            // any prior frame's transform — to recover the phone's natural (untransformed)
            // top we subtract the current applied translateY from the bounding-rect top.
            // Mirrors the pattern carousel.js uses for translateX (getCurrentTranslateX).
            const readPhoneTranslateY = (phone) => {
                const transform = window.getComputedStyle(phone).transform;
                if (!transform || transform === 'none') return 0;

                try {
                    return new DOMMatrixReadOnly(transform).m42;
                } catch (_) {
                    const matrix = transform.match(/matrix\(([^)]+)\)/);
                    if (!matrix) return 0;
                    const values = matrix[1].split(',').map((v) => parseFloat(v.trim()));
                    return Number.isFinite(values[5]) ? values[5] : 0;
                }
            };

            // Lift (in px) needed so the phone's top sits exactly --desired-button-gap
            // below the hero-buttons bottom. Returns 0 if either node is missing.
            // Negative values lift the phone UP (translateY domain).
            //
            // Why we add `currentFlowCollapse` to `phoneNaturalTop`: the active
            // `--hero-flow-collapse` shrinks the hero's flow box by N px via
            // `margin-bottom: calc(-1 * var(--hero-flow-collapse))`, which pulls
            // every in-flow descendant of the document below `.hero` (including
            // `.screen-card.active .phone-image`) UP by exactly N px in the
            // viewport. If we measured the phone naïvely, its `phoneRect.top`
            // would already include that lift and `baseLift` would shrink as
            // the collapse grew → the lift `--scroll` would drift downward as
            // the user scrolls (visible drift of the phone away from
            // `--desired-button-gap`). Adding `currentFlowCollapse` cancels
            // the collapse-induced shift and restores the ORIGINAL natural top
            // — the same value we would have measured at scroll = 0. Result:
            // `baseLift` stays stable across the scroll, `--scroll = baseLift`
            // at `inv = 1` is identical regardless of the collapse, and the
            // collapse animates independently without disturbing the lift.
            const computeBaseLift = () => {
                const buttons = document.querySelector('.hero-buttons');
                const phone = document.querySelector('.screen-card.active .phone-image');
                if (!buttons || !phone) return 0;

                const buttonsRect = buttons.getBoundingClientRect();
                const phoneRect = phone.getBoundingClientRect();
                const currentTranslateY = readPhoneTranslateY(phone);
                const phoneNaturalTop = phoneRect.top - currentTranslateY + currentFlowCollapse;

                return buttonsRect.bottom + readDesiredButtonGap() - phoneNaturalTop;
            };

            // Centralises every layout read used by the per-frame writer. Called only on
            // load / resize / orientationchange (NEVER from `onScroll` or `updateScroll`),
            // so the per-scroll path stays pure: `scrollY → progress → setProperty`. iOS
            // jank cause: in the previous version `updateScroll` called `computeBaseLift()`
            // (which itself reads two `getBoundingClientRect` + one `getComputedStyle`),
            // forcing a synchronous layout pass per rAF tick. iOS Safari drives the
            // compositor scroll on a separate thread; the JS layout pass desynchronised
            // the `--scroll` write from the on-screen scroll position, producing the
            // "lift lags behind the finger" jank reported on iPhone 16. With the reads
            // hoisted out, `updateScroll` does pure arithmetic + 4 setProperty calls.
            const measureScrollAnimationGeometry = () => {
                latestScrollY = window.scrollY || window.pageYOffset || 0;

                cachedBaseLift = computeBaseLift();
                cachedLiftMagnitude = Math.max(0, -cachedBaseLift);

                staticCarouselTop =
                    latestScrollY + carousel.getBoundingClientRect().top + currentFlowCollapse;
            };

            // PURE per-frame writer. NO layout reads (no `getBoundingClientRect`, no
            // `getComputedStyle`, no `computeBaseLift`). Reads cached values populated by
            // `measureScrollAnimationGeometry` plus `latestScrollY` (refreshed by the
            // scroll listener), runs arithmetic, writes 4 CSS variables. This is what
            // keeps the lift in lockstep with the iOS compositor's touch-driven scroll —
            // the function is short enough that the browser can comfortably finish it
            // inside one composite-aligned rAF slot, even on mid-range hardware.
            const updateScroll = () => {
                rafId = null;

                const isMobile = mobileQuery.matches;
                const vh = cachedVh;

                const startY = vh;
                const endY = isMobile ? vh * 0.55 : vh * 0.4;

                // `staticCarouselTop` = carousel's page-coordinate top WITHOUT any active
                // flow collapse, snapshotted only on layout-affecting events. Subtracting
                // `latestScrollY` reconstructs the on-screen top — same reference point
                // as `carousel.getBoundingClientRect().top` would give, but without the
                // live read (which would also re-incorporate the flow-collapse, creating
                // a feedback loop).
                const virtualCarouselTop = staticCarouselTop - latestScrollY;

                let progress = (startY - virtualCarouselTop) / (startY - endY);
                if (progress < 0) progress = 0;
                else if (progress > 1) progress = 1;

                // Carousel horizontal-navigation gate — handshake with carousel.js.
                // The carousel may only intercept horizontal wheel/touch gestures
                // once the active phone has fully retracted from its lifted-over-
                // the-hero-buttons position (progress ~= 1, lift ~= 0). 0.995 leaves
                // a sub-pixel safety band so float-arithmetic noise on the last
                // pre-snap tick (e.g. 0.99998…) doesn't oscillate the dataset
                // attribute between true/false. Writing to a dataset slot is a pure
                // string property assignment — no layout invalidation, sub-µs cost,
                // safe in this hot rAF path. carousel.js reads it via
                // `viewport.dataset.horizontalReady === 'true'`.
                carousel.dataset.horizontalReady = progress >= 0.995 ? 'true' : 'false';

                const inv = 1 - progress;
                const activeScale = 1 + inv * (isMobile ? 0.06 : 0.14);

                // `cachedLiftMagnitude` is `Math.max(0, -cachedBaseLift)` (positive px,
                // see comment on the cache declaration). `cardShrink` is consumed by the
                // VISUAL-ONLY `clip-path` on `.hero-card::before` and `.hero-card-waves`,
                // and mirrored 1:1 by `--hero-flow-collapse` so the carousel rises in
                // lockstep with the lime fill. 0.8 factor: shrink stays slightly below
                // lift travel so the card never visually collapses past the buttons.
                const cardShrink = cachedLiftMagnitude * 0.8 * progress;
                const flowCollapse = cardShrink;

                carousel.style.setProperty('--scroll', `${cachedBaseLift * inv}px`);
                carousel.style.setProperty('--active-scale', activeScale.toFixed(4));
                heroCard.style.setProperty('--card-shrink', `${cardShrink}px`);
                hero.style.setProperty('--hero-flow-collapse', `${flowCollapse}px`);

                // Mirror the most recently written collapse so the NEXT
                // `measureScrollAnimationGeometry` (on a future resize) can back-cancel
                // it when re-snapshotting `staticCarouselTop`.
                currentFlowCollapse = flowCollapse;
            };

            // Per-scroll path: ONLY refresh `latestScrollY` (a single property read on
            // `window`, no layout work) and schedule the rAF coalescer. `{ passive: true }`
            // is preserved on the listener so the browser can keep the scroll on the
            // compositor thread on iOS Safari — `preventDefault` is never called.
            const onScroll = () => {
                latestScrollY = window.scrollY || window.pageYOffset || 0;

                if (!rafId) {
                    rafId = requestAnimationFrame(updateScroll);
                }
            };
            // Layout-affecting events: refresh the cached viewport height, re-measure
            // the geometry (carousel top + base lift + lift magnitude — all reads
            // concentrated here), then schedule the rAF tick. `refreshCachedVh` runs
            // first so `measureScrollAnimationGeometry` sees a fresh `cachedVh` if it
            // ever depended on it (it doesn't today, but the ordering is the safe one
            // for any future addition). Keeps everything in sync with the real viewport
            // (orientation flips, window resize, late font load shifting layout) while
            // keeping the per-scroll path read-free.
            const onLayoutChange = () => {
                refreshCachedVh();
                latestScrollY = window.scrollY || window.pageYOffset || 0;

                measureScrollAnimationGeometry();

                if (!rafId) {
                    rafId = requestAnimationFrame(updateScroll);
                }
            };

            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onLayoutChange, { passive: true });
            window.addEventListener('orientationchange', onLayoutChange, { passive: true });
            // Re-measure once webfonts settle — the buttons can shift vertically by a few
            // pixels between the system fallback and Inter loading, which would otherwise
            // bake in a stale lift until the next user-driven scroll/resize event.
            window.addEventListener('load', onLayoutChange, { passive: true });

            // Initial geometry snapshot — `currentFlowCollapse` is 0 here (no collapse
            // has been written yet), so the carousel rect read is the raw page-coordinate
            // top with no compensation needed. `cachedBaseLift` and `cachedLiftMagnitude`
            // are populated for the very first `updateScroll` tick scheduled below.
            measureScrollAnimationGeometry();
            requestAnimationFrame(updateScroll);
        }
    }

    // === Ambient wave lines on the lime hero card ===
    // Two crossing sets of diagonal SVG <path>s (+45° and -45°) whose vertex (x, y)
    // coordinates drift via 2D pseudo-noise (ambient "wave" displacement) AND react to
    // the cursor (per-point spring "cursor" displacement, ported from the source
    // wave-background React component). Tuned subtler than the source so the ripple
    // stays editorial — small influence radius, gentle push factor, low clamp.
    //
    // Pseudo-noise: a sin/cos mix, NOT true simplex. At our motion scale (a few pixels of
    // displacement per vertex over multi-second cycles) the visual difference is imperceptible
    // and we save an external dependency / build step.
    //
    // Performance: paused via IntersectionObserver when the hero card is off-screen, since
    // the hero unsticks into the FAQ ~270vh down and the user spends most of their session
    // outside the card after that point. Mouse listeners stay live (cheap) but their state
    // simply isn't read while the loop is paused.
    //
    // Coarse-pointer (touch) devices: the rAF loop, the `touchmove` listener (whose
    // per-event `card.getBoundingClientRect()` was a confirmed iOS jank cause during
    // vertical scroll), and the IntersectionObserver are ALL skipped. The waves render
    // exactly once, then become a static decorative pattern — the cursor reactivity
    // wouldn't apply on touch anyway (no hover), so the trade is pure UX-positive on
    // mobile: no jank, identical visual appearance at rest.
    {
        const card = document.querySelector('.hero-card');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
        // Animation runs only when (a) the user hasn't asked for reduced motion AND
        // (b) the device has a fine pointer (mouse / trackpad). On touch devices the
        // animation collapses to a single one-shot render of the wavy frame — the
        // visuals stay editorial, but no per-frame work runs and no listeners are
        // attached, eliminating the iOS Safari jank surface.
        const shouldAnimateWaves = !reduceMotion && !coarsePointer;

        if (card) {
            const SVG_NS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(SVG_NS, 'svg');
            svg.setAttribute('class', 'hero-card-waves');
            svg.setAttribute('preserveAspectRatio', 'none');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');
            // Insert as the FIRST child so .hero-card-inner remains in normal flow above it.
            card.insertBefore(svg, card.firstChild);

            // Tunables — see commit message for rationale.
            const LINE_GAP = 28;       // perpendicular spacing between adjacent diagonal lines (px)
            const POINT_GAP = 32;      // along-line spacing between adjacent vertices on a line (px)
            const AMP_X = 6;           // horizontal noise amplitude (px)
            const AMP_Y = 3;           // vertical noise amplitude (px)
            const FREQ_X = 0.004;      // time × FREQ_X feeds the x-noise phase (half of source's 0.008)
            const FREQ_Y = 0.0015;     // time × FREQ_Y feeds the y-noise phase (half of source's 0.003)
            const SPATIAL_X = 0.012;   // spatial frequency along x — adjacent lines share similar phase
            const SPATIAL_Y = 0.018;   // spatial frequency along y

            // Cursor-reactivity tunables — dialed below the source's defaults to keep the
            // ripple subtle / editorial. Source defaults shown in comments for reference.
            const CURSOR_RADIUS_MIN = 120;  // source: 175 — smaller circle of effect
            const CURSOR_PUSH = 0.00020;    // source: 0.00035 — gentler displacement
            const CURSOR_CLAMP = 25;        // source: 50 — half the maximum displacement
            const CURSOR_DAMPING = 0.95;    // source: 0.95 — keep
            const CURSOR_RESTORE = 0.01;    // source: 0.01 — keep
            const CURSOR_SMOOTH = 0.1;      // source: 0.1 — mouse position smoothing

            const SQRT2 = Math.SQRT2;
            const INV_SQRT2 = Math.SQRT1_2;

            // Mouse state, in card-local coordinates.
            //   x, y    — raw mouse position (latest event)
            //   sx, sy  — smoothed mouse position (eases toward x/y at CURSOR_SMOOTH)
            //   lx, ly  — last-frame x/y, used to compute per-frame velocity
            //   vs      — smoothed velocity magnitude (clamped to 100), feeds push strength
            //   a       — angle of motion (atan2 of last delta), feeds push direction
            const mouse = { x: 0, y: 0, sx: 0, sy: 0, lx: 0, ly: 0, vs: 0, a: 0, hasMoved: false };

            /** lines: Array<Array<{ x, y, wave: { x, y }, cursor: { x, y, vx, vy } }>>
             *  Per-point state persists across frames so the cursor spring can integrate. */
            let lines = [];
            let paths = [];           // SVG <path> nodes, one per line, parallel to `lines`
            let width = 0;
            let height = 0;

            function rebuildLines() {
                const rect = card.getBoundingClientRect();
                width = rect.width;
                height = rect.height;
                if (width <= 0 || height <= 0) {
                    return;
                }
                svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
                svg.setAttribute('width', String(width));
                svg.setAttribute('height', String(height));

                // Wipe and re-build the grids. Re-using the existing <path> nodes when count
                // matches would save a few allocations on resize, but resize is rare and the
                // simpler approach avoids subtle bugs around stale node count.
                while (svg.firstChild) svg.removeChild(svg.firstChild);
                lines = [];
                paths = [];

                // Factory: every fresh point starts with zeroed wave + cursor displacement.
                const makePoint = (x, y) => ({
                    x, y,
                    wave: { x: 0, y: 0 },
                    cursor: { x: 0, y: 0, vx: 0, vy: 0 },
                });

                // Perpendicular distance between adjacent lines = LINE_GAP. For +45° lines
                // parameterized by k = y − x (constant along the line), the perpendicular
                // distance between k and k+Δk is |Δk|/√2. So Δk = LINE_GAP × √2 keeps adjacent
                // lines exactly LINE_GAP apart in screen space. Same Δk applies to the −45°
                // family parameterized by k = y + x.
                const dK = LINE_GAP * SQRT2;
                // Along-line step in x (or in distance from line start). For (x, x+k) the
                // arc-length per unit x is √2, so dx = POINT_GAP/√2 yields POINT_GAP along-line.
                const dX = POINT_GAP * INV_SQRT2;

                // --- Set A: +45° lines (top-left to bottom-right direction). y = x + k.
                // k ∈ [−width, height]. Start k at the smallest multiple of dK that ≥ −width
                // so all lines are aligned to a consistent grid offset.
                const kAStart = Math.ceil(-width / dK) * dK;
                for (let k = kAStart; k <= height; k += dK) {
                    // Line clipped to card: y = x + k, with x ∈ [max(0, −k), min(width, height − k)].
                    const xStart = Math.max(0, -k);
                    const xEnd = Math.min(width, height - k);
                    if (xEnd <= xStart) continue;

                    const points = [];
                    for (let x = xStart; x < xEnd; x += dX) {
                        points.push(makePoint(x, x + k));
                    }
                    // Always pin the final point to the exact line-end so coverage reaches
                    // the card edge regardless of dX rounding.
                    points.push(makePoint(xEnd, xEnd + k));
                    lines.push(points);
                }

                // --- Set B: −45° lines (top-right to bottom-left direction). y = −x + k, i.e. x + y = k.
                // k ∈ [0, width + height].
                const kBStart = Math.ceil(0 / dK) * dK; // 0
                for (let k = kBStart; k <= width + height; k += dK) {
                    // Line clipped: y = k − x, with x ∈ [max(0, k − height), min(width, k)].
                    const xStart = Math.max(0, k - height);
                    const xEnd = Math.min(width, k);
                    if (xEnd <= xStart) continue;

                    const points = [];
                    for (let x = xStart; x < xEnd; x += dX) {
                        points.push(makePoint(x, k - x));
                    }
                    points.push(makePoint(xEnd, k - xEnd));
                    lines.push(points);
                }

                // One <path> per line (both sets share the same styling).
                for (let i = 0; i < lines.length; i++) {
                    const path = document.createElementNS(SVG_NS, 'path');
                    path.setAttribute('stroke', 'rgba(16, 24, 40, 0.10)');
                    path.setAttribute('stroke-width', '1');
                    path.setAttribute('fill', 'none');
                    svg.appendChild(path);
                    paths.push(path);
                }
            }

            // 2D pseudo-noise in the range ~[-1, 1]. Combining three trig terms with mutually
            // incommensurate frequencies suppresses the visible periodicity that a single sine
            // would have. Cheap (3 sins per call) and smooth (C∞).
            function noise2D(x, y, t) {
                const a = Math.sin(x * SPATIAL_X + t * FREQ_X);
                const b = Math.cos(y * SPATIAL_Y - t * FREQ_Y);
                const c = Math.sin((x + y) * 0.006 + t * (FREQ_X + FREQ_Y) * 0.5);
                return (a + b + c) / 3;
            }

            function buildPathD(points, useDisplacement) {
                if (points.length === 0) return '';
                const first = points[0];
                const fx = useDisplacement ? first.x + first.wave.x + first.cursor.x : first.x;
                const fy = useDisplacement ? first.y + first.wave.y + first.cursor.y : first.y;
                let d = `M ${fx.toFixed(2)} ${fy.toFixed(2)}`;
                for (let i = 1; i < points.length; i++) {
                    const p = points[i];
                    const px = useDisplacement ? p.x + p.wave.x + p.cursor.x : p.x;
                    const py = useDisplacement ? p.y + p.wave.y + p.cursor.y : p.y;
                    d += ` L ${px.toFixed(2)} ${py.toFixed(2)}`;
                }
                return d;
            }

            function renderFrame(time) {
                // Once-per-frame mouse smoothing + velocity computation. Mirrors the source's
                // useMouse hook: smoothed position eases toward raw, velocity magnitude is the
                // exponentially-smoothed hypot of the per-frame delta, and `a` is the angle of
                // the latest delta. `vs` is clamped to 100 so a fast flick doesn't blow out
                // the per-point push.
                mouse.sx += (mouse.x - mouse.sx) * CURSOR_SMOOTH;
                mouse.sy += (mouse.y - mouse.sy) * CURSOR_SMOOTH;
                const mdx = mouse.x - mouse.lx;
                const mdy = mouse.y - mouse.ly;
                mouse.vs += (Math.hypot(mdx, mdy) - mouse.vs) * CURSOR_SMOOTH;
                if (mouse.vs > 100) mouse.vs = 100;
                mouse.lx = mouse.x;
                mouse.ly = mouse.y;
                if (mdx !== 0 || mdy !== 0) {
                    mouse.a = Math.atan2(mdy, mdx);
                }

                for (let i = 0; i < lines.length; i++) {
                    const points = lines[i];
                    for (let j = 0; j < points.length; j++) {
                        const p = points[j];

                        // Wave (ambient noise) — two independent samples so points sweep in 2D.
                        const nx = noise2D(p.x, p.y, time);
                        const ny = noise2D(p.x + 1000, p.y + 1000, time);
                        p.wave.x = nx * AMP_X;
                        p.wave.y = ny * AMP_Y;

                        // Cursor spring — only push if the user has moved at least once
                        // (otherwise mouse.sx/sy are 0,0 and every point near the top-left
                        // corner gets a phantom push on page load).
                        if (mouse.hasMoved) {
                            const dx = p.x - mouse.sx;
                            const dy = p.y - mouse.sy;
                            const d = Math.hypot(dx, dy);
                            const l = Math.max(CURSOR_RADIUS_MIN, mouse.vs);
                            if (d < l) {
                                const s = 1 - d / l;
                                const f = Math.cos(d * 0.001) * s;
                                p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * CURSOR_PUSH;
                                p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * CURSOR_PUSH;
                            }
                        }
                        // Restoration toward 0 + damping — the spring feel.
                        p.cursor.vx += (0 - p.cursor.x) * CURSOR_RESTORE;
                        p.cursor.vy += (0 - p.cursor.y) * CURSOR_RESTORE;
                        p.cursor.vx *= CURSOR_DAMPING;
                        p.cursor.vy *= CURSOR_DAMPING;
                        p.cursor.x += p.cursor.vx;
                        p.cursor.y += p.cursor.vy;
                        if (p.cursor.x > CURSOR_CLAMP) p.cursor.x = CURSOR_CLAMP;
                        else if (p.cursor.x < -CURSOR_CLAMP) p.cursor.x = -CURSOR_CLAMP;
                        if (p.cursor.y > CURSOR_CLAMP) p.cursor.y = CURSOR_CLAMP;
                        else if (p.cursor.y < -CURSOR_CLAMP) p.cursor.y = -CURSOR_CLAMP;
                    }
                    paths[i].setAttribute('d', buildPathD(points, true));
                }
            }

            // Initial build + initial frame. Under reduced-motion we render straight diagonals
            // directly from each point's untransformed (x, y) — `noise2D(x, y, 0)` still has
            // spatial-only terms that displace by up to ~5.5 px, which would render a "frozen
            // wavy moment" rather than the spec's straight-line fallback.
            rebuildLines();
            if (reduceMotion) {
                for (let i = 0; i < paths.length; i++) {
                    paths[i].setAttribute('d', buildPathD(lines[i], false));
                }
            } else {
                renderFrame(0);
            }

            // Resize: rebuild the grid against the new card dimensions. Throttled with rAF
            // so a drag-resize doesn't trigger N rebuilds per second. Active in all modes.
            //  - Reduced-motion: redraw with `useDisplacement: false` (straight lines).
            //  - Coarse-pointer (no animation loop): redraw the frozen wavy frame
            //    (`renderFrame(0)`) so the new grid actually shows pixels — without
            //    this, `rebuildLines` would create empty `<path>` nodes after resize.
            //  - Animated: the rAF tick will paint the new grid on its next iteration,
            //    so no explicit redraw is needed here.
            let resizePending = false;
            window.addEventListener('resize', () => {
                if (resizePending) return;
                resizePending = true;
                requestAnimationFrame(() => {
                    rebuildLines();
                    if (reduceMotion) {
                        for (let i = 0; i < paths.length; i++) {
                            paths[i].setAttribute('d', buildPathD(lines[i], false));
                        }
                    } else if (!shouldAnimateWaves) {
                        // Coarse-pointer (touch) — no animation loop is running, so we
                        // need to repaint the static wavy frame ourselves after the
                        // grid is rebuilt against the new card dimensions.
                        renderFrame(0);
                    }
                    resizePending = false;
                });
            }, { passive: true });

            if (shouldAnimateWaves) {
                // Mouse + touch tracking — convert page/viewport coordinates into card-local
                // coordinates each event. The card sits in normal flow, so getBoundingClientRect
                // is the safe one-shot conversion as the user scrolls. Cost is negligible at
                // mousemove rate. Listeners on `window` so tracking continues over child elements.
                //
                // Note: `shouldAnimateWaves` is gated on `!coarsePointer`, so this entire block
                // (including the `touchmove` listener whose per-event `getBoundingClientRect`
                // was the iOS jank source) is skipped on touch-primary devices. The `touchmove`
                // listener below is therefore reachable only on hybrid devices that report a
                // fine pointer AND fire touch events (e.g. Surface Pro with stylus + touch).
                const updateMouseFromEvent = (clientX, clientY) => {
                    const rect = card.getBoundingClientRect();
                    mouse.x = clientX - rect.left;
                    mouse.y = clientY - rect.top;
                    if (!mouse.hasMoved) {
                        // Seed the smoothed/last positions on first move so the spring doesn't
                        // see a giant initial delta from (0,0).
                        mouse.sx = mouse.x;
                        mouse.sy = mouse.y;
                        mouse.lx = mouse.x;
                        mouse.ly = mouse.y;
                        mouse.hasMoved = true;
                    }
                };

                window.addEventListener('mousemove', (e) => {
                    updateMouseFromEvent(e.clientX, e.clientY);
                }, { passive: true });

                window.addEventListener('touchmove', (e) => {
                    if (e.touches.length === 0) return;
                    const t = e.touches[0];
                    updateMouseFromEvent(t.clientX, t.clientY);
                }, { passive: true });

                // Animation loop, gated by visibility via IntersectionObserver.
                let rafId = null;
                let isVisible = true;
                const startTime = performance.now();

                const tick = (now) => {
                    renderFrame(now - startTime);
                    rafId = isVisible ? requestAnimationFrame(tick) : null;
                };

                const observer = new IntersectionObserver((entries) => {
                    for (const entry of entries) {
                        isVisible = entry.isIntersecting;
                        if (isVisible && rafId === null) {
                            rafId = requestAnimationFrame(tick);
                        } else if (!isVisible && rafId !== null) {
                            cancelAnimationFrame(rafId);
                            rafId = null;
                        }
                    }
                }, { threshold: 0 });
                observer.observe(card);

                // Kick off the loop. IntersectionObserver also fires once on observe with the
                // initial visibility, but it's async — starting now avoids one rAF of blank frame.
                rafId = requestAnimationFrame(tick);
            }
        }
    }

    // === How-quest gamified parcours (3-step quest, persona swap) ===
    // Sticky section between the carousel and the FAQ. Two personas (Participant /
    // Organisateur) swap the textual + icon contents of the 3 cards via
    // PERSONA_CONTENT (single source of truth — none of the copy lives in HTML).
    // Scroll-driven mechanics:
    //   - Vertical numbered progress bar (.quest-progress-bar) fills lime as
    //     JS writes the CSS custom property --progress (0..1) on it. CSS
    //     consumes the value via a ::after pseudo with transform: scaleY().
    //   - Each .quest-step has a data-unlock threshold (0..1). Once progress
    //     crosses the threshold, the card receives `.is-unlocked` AND the
    //     matching .quest-progress-step (matched by data-step) receives
    //     `.is-active` (CSS turns its node lime).
    //   - When all 3 steps are unlocked, .quest-completion-pill is revealed
    //     (removeAttribute('hidden') + .is-visible after a double rAF so the
    //     CSS transition can play).
    // Persona switch:
    //   - Updates tabs' aria-selected / tabindex / .is-active.
    //   - Writes --indicator-x / --indicator-w on .quest-persona-tabs so the
    //     CSS sliding lime indicator (::before) glides under the active tab.
    //   - Resets cards' visual state, swaps the content via updateStepContent,
    //     then immediately re-applies the cached lastProgress so the cards
    //     (and the progress-bar's --progress + .is-active progress-steps)
    //     return to whatever scroll level the user is currently at — without
    //     a flash of empty state.
    // Performance contract (mirrors page-scroll-progress block above):
    //   - measureQuestGeometry() centralises ALL layout reads (getBoundingClientRect
    //     + window.scrollY/innerHeight). Called on load/resize/orientationchange
    //     and once at init. NEVER called from the scroll listener.
    //   - updateQuestScroll() is pure: reads only window.scrollY and cached
    //     scalars, runs arithmetic, writes inline styles + classes.
    //   - Scroll listener registers { passive: true }, rAF-coalesced via rafId.
    //   - measurePillIndicator() runs on setup + persona swap + resize only —
    //     never in the hot scroll path.
    // Reduced-motion: skip the scroll path entirely; show all cards unlocked +
    // completion pill visible + progress bar fully filled from setup.
    {
        const questSection = document.querySelector('.how-quest');

        if (questSection) {
            // Single source of truth for persona-specific content. No copy or
            // SVG icon string is duplicated in HTML — updateStepContent below
            // writes title/body via textContent and the icon via innerHTML
            // (icons are inline strings authored here, all heroicons-style:
            // viewBox 0 0 24 24, fill="none", stroke="currentColor",
            // stroke-width="1.75", round caps + joins).
            const PERSONA_CONTENT = {
                participant: {
                    completion: "Quête complétée. Ton équipe est prête. À toi de jouer.",
                    steps: [
                        {
                            title: "Trouve ton tournoi",
                            body: "Filtre par sport, distance et date. On t'affiche ce qui se joue près de chez toi.",
                            // Loupe (magnifying glass)
                            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>'
                        },
                        {
                            title: "Inscris ton équipe",
                            body: "Compose ton roster, paye en ligne, reçois la confirmation. C'est plié en deux minutes.",
                            // Shield with team marks (3 small dots inside the shield)
                            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v5.5c0 4.5-3.2 8.5-8 9.5-4.8-1-8-5-8-9.5V6l8-3z"/><circle cx="9" cy="11" r="1.2"/><circle cx="15" cy="11" r="1.2"/><circle cx="12" cy="14.5" r="1.2"/></svg>'
                        },
                        {
                            title: "Joue, suis, gagne",
                            body: "Le jour J : check-in QR, scores en direct, arbre qui se met à jour. Tu n'as plus qu'à jouer.",
                            // Trophy
                            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v4a5 5 0 01-10 0V4z"/><path d="M17 5h2a2 2 0 010 4 4 4 0 01-3 2"/><path d="M7 5H5a2 2 0 000 4 4 4 0 003 2"/></svg>'
                        }
                    ]
                },
                organisateur: {
                    completion: "Tournoi prêt à être lancé. Yamatch s'occupe du reste.",
                    steps: [
                        {
                            title: "Créez votre tournoi",
                            body: "Renseignez format, dates, lots. Notre assistant vous guide étape par étape.",
                            // Calendar with a plus
                            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M12 13v4"/><path d="M10 15h4"/></svg>'
                        },
                        {
                            title: "Recevez les inscriptions",
                            body: "Les équipes s'inscrivent et paient via Yamatch. Vous suivez le remplissage en temps réel.",
                            // Users with a check mark
                            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.5l1.7 1.7L21 4"/></svg>'
                        },
                        {
                            title: "Lancez le jour J",
                            body: "Check-in, scores, arbre : tout est piloté depuis votre tableau de bord. Vos arbitres reçoivent leurs matchs.",
                            // Play button inside a circle
                            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5v-7z"/></svg>'
                        }
                    ]
                }
            };

            // Cached refs (each is queried once at setup and reused in every
            // handler — no per-tick querySelector cost).
            const questPanel = document.querySelector('#questStepsPanel');
            const personaTabsEl = document.querySelector('.quest-persona-tabs');
            const questTabs = document.querySelectorAll('.quest-persona-tab');
            const questSteps = document.querySelectorAll('.quest-step');
            const completionPill = document.querySelector('.quest-completion-pill');
            // Vertical numbered progress bar (consumes --progress 0..1) and
            // its three numbered <li> nodes (each receives `.is-active` once
            // its corresponding .quest-step crosses its data-unlock threshold).
            // Matched to .quest-step cards via data-step (1/2/3).
            const progressBar = document.querySelector('.quest-progress-bar');
            const progressSteps = document.querySelectorAll('.quest-progress-step');

            // State.
            const state = { persona: 'participant' };
            // Last computed scroll progress (0..1). Persisted so applyPersona
            // can re-apply the same progress immediately after a persona swap
            // without waiting for the next scroll event.
            let lastProgress = 0;
            // Timeout id for the deferred [hidden] re-application on the
            // completion pill. The CSS opacity transition is 320ms; we wait
            // 360ms (40ms margin) before adding the hidden attribute back so
            // the fade-out has time to render.
            let completionHideTimer = null;
            // Geometry caches — refreshed only by measureQuestGeometry() on
            // load/resize/orientationchange. updateQuestScroll() reads these
            // (plus window.scrollY) and never re-queries the DOM.
            //   staticQuestTop = page-coordinate top of .how-quest (scroll-independent).
            //   questHeight    = section's total height minus one viewport
            //                    (= the scrollable distance over which progress
            //                     interpolates 0..1).
            let staticQuestTop = 0;
            let questHeight = 1; // initial sentinel — avoids division by zero
            let rafId = null;

            const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

            // === Helpers ===

            // Centralises ALL layout reads. Mirrors measureScrollAnimationGeometry
            // in the page-scroll-progress block above — call only on
            // load/resize/orientationchange + once at init. The result feeds
            // updateQuestScroll's pure arithmetic path.
            const measureQuestGeometry = () => {
                const rect = questSection.getBoundingClientRect();
                staticQuestTop = window.scrollY + rect.top;
                // The section is sticky-pinned for ~rect.height pixels; once
                // the section's bottom passes the viewport bottom, progress
                // hits 1. The scrollable range is therefore (rect.height − vh).
                // Math.max(1, ...) guards against rect.height <= vh edge cases
                // and the initial pre-layout snapshot (avoids /0 in updateQuestScroll).
                questHeight = Math.max(1, rect.height - window.innerHeight);
            };

            // Apply scroll-progress effects to the DOM. Pure write path.
            //   1. Vertical progress-bar fill (--progress 0..1 on .quest-progress-bar).
            //   2. Per-step unlock on .quest-step cards (class + status text).
            //   3. Per-step .is-active toggle on .quest-progress-step nodes
            //      (matched to cards by data-step, gated on the same
            //      data-unlock thresholds).
            //   4. Completion pill reveal/hide.
            const applyProgress = (progress) => {
                // 1. Vertical progress-bar fill. CSS consumes --progress on
                // the .quest-progress-bar root via a ::after pseudo with
                // transform: scaleY(var(--progress, 0)) — pure GPU paint.
                if (progressBar) {
                    progressBar.style.setProperty('--progress', progress.toString());
                }

                // 2. Cards. Single pass across questSteps; collect each card's
                // unlock state so we can mirror it onto the matching numbered
                // progress-step node and tally for the completion pill.
                let unlockedCount = 0;
                // step-number → unlocked? — keyed by data-step for the
                // progress-step mirror loop below. Avoids a second
                // questSteps.forEach pass.
                const unlockedByStep = new Map();
                questSteps.forEach((step) => {
                    const threshold = parseFloat(step.dataset.unlock);
                    const status = step.querySelector('.quest-card-status');
                    const stepKey = step.dataset.step;
                    const isUnlocked = Number.isFinite(threshold) && progress >= threshold;
                    if (isUnlocked) {
                        step.classList.add('is-unlocked');
                        if (status) status.textContent = 'Débloquée';
                        unlockedCount++;
                    } else {
                        step.classList.remove('is-unlocked');
                        if (status) status.textContent = 'À débloquer';
                    }
                    if (stepKey) unlockedByStep.set(stepKey, isUnlocked);
                });

                // 3. Numbered progress-step nodes mirror the cards' unlock
                // state via .is-active (CSS turns the node's bg/border lime).
                // Matched by data-step so HTML re-ordering can't desync them.
                progressSteps.forEach((node) => {
                    const stepKey = node.dataset.step;
                    const isActive = stepKey ? unlockedByStep.get(stepKey) === true : false;
                    node.classList.toggle('is-active', isActive);
                });

                // 4. Completion pill — visible only when all steps are unlocked.
                if (questSteps.length > 0 && unlockedCount === questSteps.length) {
                    showCompletionPill();
                } else {
                    hideCompletionPill();
                }
            };

            // Reveal the completion pill. Idempotent: safe to call repeatedly
            // while already visible (no-op aside from cancelling a pending
            // hide-timer). The double rAF is necessary when transitioning out
            // of [hidden]: removing the attribute switches `display` from
            // `none` to `inline-flex` (CSS spec — UA `[hidden] { display:none }`
            // overridden by .quest-completion-pill { display: inline-flex }),
            // and the browser needs one frame to apply that before we can flip
            // .is-visible and have the opacity/scale transition play.
            const showCompletionPill = () => {
                if (!completionPill) return;
                if (completionHideTimer) {
                    clearTimeout(completionHideTimer);
                    completionHideTimer = null;
                }
                if (completionPill.hasAttribute('hidden')) {
                    completionPill.removeAttribute('hidden');
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            completionPill.classList.add('is-visible');
                        });
                    });
                } else {
                    completionPill.classList.add('is-visible');
                }
            };

            // Hide the completion pill. Removes .is-visible immediately so the
            // CSS transition (opacity + scale, 320ms) plays the fade-out, then
            // re-adds [hidden] after 360ms (40ms margin past the transition)
            // so the element returns to display:none and stops occupying any
            // accessible / layout role.
            const hideCompletionPill = () => {
                if (!completionPill) return;
                if (completionHideTimer) {
                    clearTimeout(completionHideTimer);
                    completionHideTimer = null;
                }
                // Already fully hidden — nothing to do.
                if (!completionPill.classList.contains('is-visible') && completionPill.hasAttribute('hidden')) {
                    return;
                }
                completionPill.classList.remove('is-visible');
                completionHideTimer = setTimeout(() => {
                    completionPill.setAttribute('hidden', '');
                    completionHideTimer = null;
                }, 360);
            };

            // Swap the textual + icon contents of all 3 step cards + the
            // completion pill text to match the active persona. Uses
            // textContent for title/body (safe) and innerHTML for the icon
            // (the SVG strings are author-controlled constants — no user
            // input crosses this boundary).
            const updateStepContent = (persona) => {
                const content = PERSONA_CONTENT[persona];
                if (!content) return;
                questSteps.forEach((step, i) => {
                    const stepData = content.steps[i];
                    if (!stepData) return;
                    const titleEl = step.querySelector('.quest-step-title');
                    const bodyEl = step.querySelector('.quest-step-body');
                    const iconEl = step.querySelector('.quest-step-icon');
                    if (titleEl) titleEl.textContent = stepData.title;
                    if (bodyEl) bodyEl.textContent = stepData.body;
                    if (iconEl) iconEl.innerHTML = stepData.icon;
                });
                if (completionPill) completionPill.textContent = content.completion;
            };

            // Update tabs + tabpanel ARIA wiring for the active persona.
            //   - .is-active class flips for the visual highlight.
            //   - aria-selected reflects WAI-ARIA tab pattern (one true, others false).
            //   - tabindex: roving-tabindex pattern — only the active tab is in
            //     the document tab order; arrow keys move focus between tabs.
            //   - aria-labelledby on the tabpanel updates so screen readers
            //     announce the active tab as the panel's accessible name.
            const updateTabs = (persona) => {
                questTabs.forEach((tab) => {
                    const isActive = tab.dataset.persona === persona;
                    tab.classList.toggle('is-active', isActive);
                    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
                    tab.setAttribute('tabindex', isActive ? '0' : '-1');
                });
                if (questPanel) {
                    const activeTab = Array.from(questTabs).find((t) => t.dataset.persona === persona);
                    if (activeTab && activeTab.id) {
                        questPanel.setAttribute('aria-labelledby', activeTab.id);
                    }
                }
            };

            // Reset every step card's VISUAL unlock state. Called by
            // applyPersona before re-applying lastProgress. Critically does
            // NOT touch the .quest-progress-bar's --progress nor the
            // .quest-progress-step .is-active classes — the progress bar
            // represents the scroll, not the persona, so a mid-scroll persona
            // swap must leave the bar exactly where it is. The subsequent
            // applyProgress(lastProgress) re-toggles .is-active on the
            // progress-steps from scratch anyway, so even this comment-level
            // distinction is just defensive: the visible result would be
            // identical either way, but skipping the explicit reset avoids
            // a one-frame flash of empty bar.
            const resetStepVisualState = () => {
                questSteps.forEach((step) => {
                    step.classList.remove('is-unlocked');
                    const status = step.querySelector('.quest-card-status');
                    if (status) status.textContent = 'À débloquer';
                });
                hideCompletionPill();
            };

            // Measure the active tab's offset/width and write the two custom
            // properties consumed by the .quest-persona-tabs::before sliding
            // indicator (CSS rule in styles.css §10.3). Math:
            //   - .quest-persona-tabs has padding: 4px and position: relative.
            //   - The ::before pseudo has top: 4px; left: 4px; width:
            //     var(--indicator-w); transform: translateX(var(--indicator-x)).
            //     `left: 4px` is its baseline X.
            //   - The active tab's offsetLeft is measured against the offsetParent
            //     (the padded .quest-persona-tabs), so the first tab's offsetLeft
            //     equals the parent's padding-left (= 4px); subsequent tabs add
            //     their preceding siblings + gap.
            //   - To park the pseudo flush around the active tab we want its
            //     visual left = activeTab.offsetLeft. Since the pseudo is
            //     already at left: 4px, we need translateX = offsetLeft - 4.
            // No layout writes inside this function (we only read offsetLeft /
            // offsetWidth then write two custom properties), so the cost is one
            // forced layout per call. Called only on setup + persona swap +
            // resize / orientationchange — never in the hot scroll path.
            const PERSONA_TABS_PADDING = 4; // matches CSS .quest-persona-tabs { padding: 4px }
            const measurePillIndicator = () => {
                if (!personaTabsEl) return;
                const activeTab = personaTabsEl.querySelector('.quest-persona-tab.is-active');
                if (!activeTab) return;
                const indicatorX = activeTab.offsetLeft - PERSONA_TABS_PADDING;
                const indicatorW = activeTab.offsetWidth;
                personaTabsEl.style.setProperty('--indicator-x', `${indicatorX}px`);
                personaTabsEl.style.setProperty('--indicator-w', `${indicatorW}px`);
            };

            // Persona switch handler. Idempotent on same-persona call.
            // Pipeline: data-persona attr → tabs ARIA → sliding indicator
            // re-measure → visual reset → content swap → re-apply lastProgress.
            // The re-apply makes the newly-swapped cards unlock immediately
            // if the user is already scrolled past their thresholds (no need
            // to wait for a fresh scroll event). The progress-bar fill
            // (--progress) and its .is-active step nodes are preserved /
            // rebuilt by applyProgress, so the bar never flashes empty.
            const applyPersona = (persona) => {
                if (persona === state.persona) return;
                if (!PERSONA_CONTENT[persona]) return;
                state.persona = persona;
                questSection.setAttribute('data-persona', persona);

                updateTabs(persona);
                measurePillIndicator();
                resetStepVisualState();
                updateStepContent(persona);
                applyProgress(lastProgress);
            };

            // Pure per-frame writer. NO layout reads — only window.scrollY (a
            // single property read, no layout invalidation) plus cached scalars.
            // All side-effects funnel through applyProgress.
            const updateQuestScroll = () => {
                rafId = null;
                const scrollY = window.scrollY;
                const offset = scrollY - staticQuestTop;
                let progress = offset / questHeight;
                if (progress < 0) progress = 0;
                else if (progress > 1) progress = 1;

                lastProgress = progress;
                applyProgress(progress);
            };

            // WAI-ARIA tabs keyboard pattern: ArrowLeft/ArrowRight cycle
            // (with wrap), Home jumps to first, End to last. Click also wired
            // here for parity. Enter / Space activate the focused tab natively
            // because the tabs are <button type="button"> — no extra handler
            // needed (their click event fires).
            const setupPersonaKeyboardNavigation = () => {
                const tabsArr = Array.from(questTabs);
                questTabs.forEach((tab) => {
                    tab.addEventListener('keydown', (e) => {
                        const idx = tabsArr.indexOf(tab);
                        let targetIdx = null;
                        if (e.key === 'ArrowLeft') {
                            targetIdx = idx === 0 ? tabsArr.length - 1 : idx - 1;
                        } else if (e.key === 'ArrowRight') {
                            targetIdx = idx === tabsArr.length - 1 ? 0 : idx + 1;
                        } else if (e.key === 'Home') {
                            targetIdx = 0;
                        } else if (e.key === 'End') {
                            targetIdx = tabsArr.length - 1;
                        }
                        if (targetIdx === null) return;
                        e.preventDefault();
                        const targetTab = tabsArr[targetIdx];
                        applyPersona(targetTab.dataset.persona);
                        targetTab.focus();
                    });
                    tab.addEventListener('click', () => {
                        applyPersona(tab.dataset.persona);
                    });
                });
            };

            // === Init ===

            // Always render initial textual content (participant is the default
            // persona, matched by the [data-persona="participant"] attribute on
            // the section in HTML and by state.persona above).
            updateStepContent(state.persona);
            setupPersonaKeyboardNavigation();
            // First indicator measure runs after the initial content render so
            // the active tab has its final layout width (font has at least the
            // system fallback at this point — the load listener below
            // re-measures once webfonts settle, in case the metric width
            // drifts).
            measurePillIndicator();

            if (reduceMotionQuery.matches) {
                // Reduced-motion path: skip all scroll wiring, render the final
                // state immediately (every step unlocked, completion pill
                // visible, progress bar fully filled, every progress-step .is-active).
                // The persona-swap pipeline still works (clicking a tab calls
                // applyPersona → measurePillIndicator → resetStepVisualState →
                // applyProgress(lastProgress)). We seed lastProgress to 1 so
                // a subsequent persona swap immediately re-unlocks all cards
                // and re-fills the progress bar.
                questSteps.forEach((step) => {
                    step.classList.add('is-unlocked');
                    const status = step.querySelector('.quest-card-status');
                    if (status) status.textContent = 'Débloquée';
                });
                progressSteps.forEach((node) => node.classList.add('is-active'));
                if (progressBar) progressBar.style.setProperty('--progress', '1');
                lastProgress = 1;
                showCompletionPill();
                // Re-measure the pill indicator on resize (responsive widths)
                // and once the document fully loads (webfonts can shift the
                // active tab's width by a pixel or two between system fallback
                // and Inter). Cheap operation — no rAF coalescing needed
                // because resize already fires at most once per browser frame.
                window.addEventListener('resize', measurePillIndicator, { passive: true });
                window.addEventListener('orientationchange', measurePillIndicator, { passive: true });
                window.addEventListener('load', measurePillIndicator, { passive: true });
                return;
            }

            // Normal (motion-allowed) path.
            measureQuestGeometry();

            const onScroll = () => {
                if (!rafId) rafId = requestAnimationFrame(updateQuestScroll);
            };
            // Layout-affecting events: re-measure the section geometry AND
            // the pill indicator (its tab width is responsive via the
            // tab font-size clamp), then schedule a tick so the visual state
            // matches the new geometry on the next frame.
            const onLayoutChange = () => {
                measureQuestGeometry();
                measurePillIndicator();
                if (!rafId) rafId = requestAnimationFrame(updateQuestScroll);
            };

            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onLayoutChange, { passive: true });
            window.addEventListener('orientationchange', onLayoutChange, { passive: true });
            // Re-measure once webfonts settle — the section's height can shift
            // a few pixels between system fallback and Inter loading, and the
            // active tab's width can shift correspondingly.
            window.addEventListener('load', onLayoutChange, { passive: true });

            // First tick to apply the initial state for whatever scroll
            // position the page loaded at (e.g. user navigates back with a
            // scroll restore mid-section).
            requestAnimationFrame(updateQuestScroll);
        }
    }

    // FAQ accordion — toggle is-open on the parent item, flip aria-expanded.
    {
        const toggles = document.querySelectorAll('.faq-toggle');
        toggles.forEach((toggle) => {
            toggle.addEventListener('click', () => {
                const item = toggle.closest('.faq-item');
                if (!item) return;
                const isOpen = item.classList.toggle('is-open');
                toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
        });
    }

})();
