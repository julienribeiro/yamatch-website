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
                ROOT.style.setProperty('--wordmark-scroll-progress', progress.toFixed(4));

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

    // === How-quest editorial (persona swap, sliding indicator) ===
    // Refonte 2026-05-12 : remplace l'ancien "parcours gamifié" (cartes verrouillées
    // scroll-driven, barre de progression numérotée, pill de complétion) par un
    // design éditorial 3 colonnes statiques. Plus de scroll-driven, plus de
    // gamification — les 3 .quest-step restent visibles en permanence et leur
    // contenu textuel est swappé par persona.
    //
    // Ce que ce bloc fait (et SEUL) :
    //   1. Switch persona : clic sur les pills Participant / Organisateur bascule
    //      la classe .is-active, aria-selected, tabindex sur les tabs.
    //   2. Navigation clavier WAI-ARIA tabs : ArrowLeft / ArrowRight cycliques
    //      avec wrap, Home → premier, End → dernier. Pattern roving-tabindex
    //      strict : un seul tab a tabindex="0", les autres ont tabindex="-1".
    //   3. Indicateur lime glissant : écrit --indicator-x / --indicator-w sur
    //      .quest-persona-tabs (consommés par .quest-persona-tabs::before en CSS,
    //      cf. styles.css §10.3). Calcul = activeTab.offsetLeft - PERSONA_TABS_PADDING
    //      pour X, activeTab.offsetWidth pour W. Le padding du parent (.quest-persona-tabs
    //      { padding: 4px } en CSS) compense le offset induit par l'offsetParent
    //      paddé — c'est pour ça qu'on soustrait 4.
    //   4. Remplit le contenu des 3 .quest-step (tag-label / title / body) au load
    //      et à chaque switch de persona depuis PERSONA_CONTENT.
    //   5. Synchro data-persona : écrit la valeur active sur <section.how-quest>
    //      (hook CSS pour variations futures — pas utilisé pour l'instant mais
    //      le contrat est défini).
    //
    // Re-mesure de l'indicateur : sur resize / orientationchange / load (le load
    // est nécessaire pour que les webfonts custom n'introduisent pas de décalage
    // entre fallback system et Inter chargée).
    {
        const questPanel    = document.querySelector('.how-quest');
        const personaTabsEl = document.querySelector('.quest-persona-tabs');
        const questTabs     = personaTabsEl ? Array.from(personaTabsEl.querySelectorAll('.quest-persona-tab')) : [];
        const questSteps    = Array.from(document.querySelectorAll('.quest-step'));

        if (questPanel && personaTabsEl && questTabs.length > 0 && questSteps.length > 0) {
            // Single source of truth for persona-specific textual content. No
            // copy is duplicated in HTML — renderPersona below writes
            // tag / title / body via textContent.
            const PERSONA_CONTENT = {
                participant: {
                    steps: [
                        { tag: 'Recherche',    title: 'Trouve ton tournoi',  body: "Filtre par sport, distance et date. On t'affiche ce qui se joue près de chez toi." },
                        { tag: 'Inscription',  title: 'Inscris ton équipe',  body: "Compose ton roster, paye en ligne, reçois la confirmation. C'est plié en deux minutes." },
                        { tag: 'Match day',    title: 'Joue, suis, gagne',   body: "Le jour J : check-in QR, scores en direct, arbre qui se met à jour. Tu n'as plus qu'à jouer." }
                    ]
                },
                organisateur: {
                    steps: [
                        { tag: 'Création',     title: 'Créez votre tournoi',       body: "Renseignez format, dates, lots. Notre assistant vous guide étape par étape." },
                        { tag: 'Inscriptions', title: 'Recevez les inscriptions',  body: "Les équipes s'inscrivent et paient via Yamatch. Vous suivez le remplissage en temps réel." },
                        { tag: 'Jour J',       title: 'Lancez le jour J',          body: "Check-in, scores, arbre : tout est piloté depuis votre tableau de bord." }
                    ]
                }
            };

            // Padding du parent .quest-persona-tabs (CSS styles.css §10.3 :
            // `.quest-persona-tabs { padding: 4px }`). offsetLeft du tab actif
            // est mesuré par rapport à l'offsetParent (le parent paddé), donc
            // pour aligner l'indicateur ::before (déjà à `left: 4px`) on
            // soustrait ce padding du translateX.
            const PERSONA_TABS_PADDING = 4;

            // Remplit les 3 .quest-step (tag-label / title / body) depuis
            // PERSONA_CONTENT et écrit data-persona sur la section.
            // textContent uniquement — pas d'icônes / pas d'innerHTML.
            const renderPersona = (persona) => {
                const data = PERSONA_CONTENT[persona];
                if (!data) return;
                questPanel.dataset.persona = persona;
                questSteps.forEach((step, i) => {
                    const stepData = data.steps[i];
                    if (!stepData) return;
                    const tagLabel = step.querySelector('.quest-step-tag-label');
                    const title    = step.querySelector('.quest-step-title');
                    const body     = step.querySelector('.quest-step-body');
                    if (tagLabel) tagLabel.textContent = stepData.tag;
                    if (title)    title.textContent    = stepData.title;
                    if (body)     body.textContent     = stepData.body;
                });
            };

            // Indicateur lime glissant : écrit --indicator-x / --indicator-w
            // sur .quest-persona-tabs (consommés par ::before en CSS). Lecture
            // de offsetLeft / offsetWidth uniquement — pas d'écriture de
            // layout, un seul forced-layout par appel. Appelée à init, à
            // chaque switch de tab, et sur resize / orientationchange / load.
            const measurePillIndicator = () => {
                const active = questTabs.find((t) => t.classList.contains('is-active'));
                if (!active) return;
                personaTabsEl.style.setProperty('--indicator-x', `${active.offsetLeft - PERSONA_TABS_PADDING}px`);
                personaTabsEl.style.setProperty('--indicator-w', `${active.offsetWidth}px`);
            };

            // Bascule l'état actif (classe + ARIA + roving-tabindex) puis
            // re-render le contenu et re-mesure l'indicateur. Idempotent :
            // appeler avec l'index déjà actif est sûr (les écritures sont
            // toutes des set/toggle déterministes).
            const setActiveTab = (idx) => {
                if (idx < 0 || idx >= questTabs.length) return;
                questTabs.forEach((tab, i) => {
                    const isActive = i === idx;
                    tab.classList.toggle('is-active', isActive);
                    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
                    tab.setAttribute('tabindex', isActive ? '0' : '-1');
                });
                renderPersona(questTabs[idx].dataset.persona);
                measurePillIndicator();
            };

            // Click + keyboard handlers (WAI-ARIA tab pattern).
            //   ArrowLeft  → previous tab, wrap to last
            //   ArrowRight → next tab, wrap to first
            //   Home       → first tab
            //   End        → last tab
            // Sur navigation clavier on déplace AUSSI le focus, conformément
            // au pattern roving-tabindex. Enter / Space sur un <button>
            // déclenchent nativement click, donc pas besoin de handler dédié.
            questTabs.forEach((tab, i) => {
                tab.addEventListener('click', () => setActiveTab(i));
                tab.addEventListener('keydown', (e) => {
                    let targetIdx = null;
                    if (e.key === 'ArrowLeft') {
                        targetIdx = i === 0 ? questTabs.length - 1 : i - 1;
                    } else if (e.key === 'ArrowRight') {
                        targetIdx = i === questTabs.length - 1 ? 0 : i + 1;
                    } else if (e.key === 'Home') {
                        targetIdx = 0;
                    } else if (e.key === 'End') {
                        targetIdx = questTabs.length - 1;
                    }
                    if (targetIdx === null) return;
                    e.preventDefault();
                    setActiveTab(targetIdx);
                    questTabs[targetIdx].focus();
                });
            });

            // Init : si un tab porte déjà .is-active dans le HTML (cas par
            // défaut "Participant"), on s'aligne dessus ; sinon on prend le
            // premier. setActiveTab fait le render initial + la première mesure
            // de l'indicateur.
            const initialIdx = Math.max(0, questTabs.findIndex((t) => t.classList.contains('is-active')));
            setActiveTab(initialIdx);

            // Re-mesure de l'indicateur sur événements layout-affecting. Le
            // `load` est crucial : entre system-fallback et Inter (custom
            // webfont), la largeur des labels peut shifter de quelques pixels,
            // décalant l'indicateur. Pas de rAF-throttling nécessaire — ces
            // events ne firent qu'une fois (ou au plus une fois par frame
            // browser pour resize), et la fonction est purement passive.
            window.addEventListener('resize', measurePillIndicator, { passive: true });
            window.addEventListener('orientationchange', measurePillIndicator, { passive: true });
            window.addEventListener('load', measurePillIndicator, { passive: true });
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

    // === QR widget — inline-SVG QR Code generator ===
    // Renders a stylised SVG QR code into #qrWidgetCode at load. Encodes the
    // /download/ landing URL which redirects iOS/Android via UA detection to
    // the App Store / Play Store. Visual pattern mirrors the React reference
    // component the design was ported from:
    //   - Background rounded rect (rx 12) fills the SVG viewBox.
    //   - 3 finder patterns at top-left / top-right / bottom-left, each made of
    //     three nested rounded rects (rx 12 → 8 → 3, dark-light-dark).
    //   - Data modules (everything outside the 7×7 finder squares) rendered as
    //     centred circles with radius = moduleSize / 3 (denser than the standard
    //     square modules to keep the editorial dot-grid texture).
    //
    // CDN dependency: window.qrcode (lowercase) is the factory function exposed
    // by the `qrcode-generator` UMD build (Kazuhiko Arase, MIT) loaded via a
    // <script defer> tag placed BEFORE script.js in index.html. `defer` preserves
    // source order, so by the time this IIFE runs, the lib has been parsed and
    // executed. We still guard with a `typeof` check — if the CDN is blocked
    // (AdBlock / corporate proxy / network failure), we hide the whole widget
    // rather than render an empty SVG. Same defensive hide on encoding throw.
    //
    // Library API (qrcode-generator):
    //   const qr = window.qrcode(typeNumber, errorCorrectionLevel);
    //     - typeNumber 0 = auto-detect smallest QR version that fits the data.
    //     - errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' (15% for 'M').
    //   qr.addData(string);   // append payload
    //   qr.make();            // compute the matrix (mandatory before reads)
    //   qr.getModuleCount();  // matrix edge length (≥ 21, depends on typeNumber)
    //   qr.isDark(row, col);  // boolean → module color at (row, col)
    //
    // Previous lib (`qrcode` / node-qrcode) was removed: its jsdelivr build URL
    // (`/npm/qrcode@1.5.4/build/qrcode.min.js`) returns 404 — the npm package
    // doesn't ship that file; its actual browser entry is `/lib/browser.min.js`.
    // Even if we corrected the URL, the browser bundle of node-qrcode does NOT
    // export the low-level `.create()` method (Node-only API surface) that we
    // need to read the raw module matrix. `qrcode-generator` exposes the matrix
    // explicitly and is the canonical browser-first option (~10KB).
    //
    // Sizing: the host `.qr-widget-code` div has explicit clamp() width/height
    // in CSS, and `.qr-widget-code svg { width: 100%; height: 100% }` makes
    // the inline SVG fill that box edge-to-edge — so we don't need to set
    // width/height attributes on the SVG element itself, only the viewBox.
    //
    // Performance: runs exactly once at DOMContentLoaded. No scroll/resize
    // re-render — the QR is static, and the host box scales via CSS.
    {
        const QR_VALUE = 'https://appyamatch.fr/download/';
        const QR_SIZE = 268;            // intrinsic viewBox edge length (px)
        // 'Q' = 25% error correction. Bumped from 'M' (15%) because we knock out
        // a centred rectangle to embed the Yamatch wordmark — at 'M' the masked
        // ratio (≈ 6-8% of modules) is already close to recovery headroom, so
        // 'Q' gives confortable margin for reliable scans across phones.
        const QR_ERROR_LEVEL = 'Q';
        const QR_FG = '#101828';        // dark module color (mirrors --color-text-primary)
        const QR_BG = '#FFFFFF';        // background color (mirrors --color-light-bg)

        // Embedded wordmark (centred logo) — Yamatch SVG with viewBox
        // 0 0 1067.73 206.13 (aspect ratio ≈ 5.181:1, wide & short).
        // The <image href="assets/wordmark.svg"> resolves relative to the host
        // HTML document (`website/index.html`), so the path is relative to it.
        const LOGO_HREF = 'assets/wordmark.svg';
        const LOGO_ASPECT = 1067.73 / 206.13;
        const LOGO_WIDTH_RATIO = 0.42;  // 42% of QR width — visible without overwhelming the pattern

        // The three 7×7 finder squares sit at (0,0), (0, size-7), (size-7, 0).
        // Any module inside one of those squares is rendered as the stylised
        // nested rect group, NOT as an individual circle — keeps the squares
        // visually clean.
        const isInFinderPattern = (row, col, size) => (
            (row < 7 && col < 7) ||
            (row < 7 && col >= size - 7) ||
            (row >= size - 7 && col < 7)
        );

        const renderQRCode = () => {
            const container = document.getElementById('qrWidgetCode');
            if (!container) return;

            // CDN guard — if window.qrcode is missing (CDN blocked, network
            // failure, AdBlock pattern hit), hide the whole .qr-widget aside
            // rather than render an empty/broken SVG. Same on encoding throw.
            if (typeof window.qrcode !== 'function') {
                const widget = container.closest('.qr-widget');
                if (widget) widget.style.display = 'none';
                return;
            }

            let qr;
            try {
                // typeNumber 0 → auto-detect smallest version that fits the URL.
                qr = window.qrcode(0, QR_ERROR_LEVEL);
                qr.addData(QR_VALUE);
                qr.make();
            } catch (_) {
                const widget = container.closest('.qr-widget');
                if (widget) widget.style.display = 'none';
                return;
            }

            const moduleCount = qr.getModuleCount();
            const moduleSize = QR_SIZE / moduleCount;
            const circleRadius = moduleSize * (1 / 3);
            const finderSize = 7 * moduleSize;
            const innerPadding = moduleSize;
            const innerWhiteSize = 5 * moduleSize;
            const innerBlackSize = 3 * moduleSize;

            const SVG_NS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(SVG_NS, 'svg');
            svg.setAttribute('viewBox', `0 0 ${QR_SIZE} ${QR_SIZE}`);
            svg.setAttribute('xmlns', SVG_NS);
            // No width/height attributes — CSS rule `.qr-widget-code svg
            // { width: 100%; height: 100% }` (styles.css §QR) drives sizing.

            // Background rounded rect — fills the entire viewBox.
            const bg = document.createElementNS(SVG_NS, 'rect');
            bg.setAttribute('width', String(QR_SIZE));
            bg.setAttribute('height', String(QR_SIZE));
            bg.setAttribute('fill', QR_BG);
            bg.setAttribute('rx', '12');
            bg.setAttribute('ry', '12');
            svg.appendChild(bg);

            // Three finder patterns: outer dark (rx 12), middle light (rx 8),
            // inner dark (rx 3). Positions in module-grid coords: (0,0),
            // (0, size-7), (size-7, 0) — top-left, top-right, bottom-left.
            const finderPositions = [
                [0, 0],
                [0, moduleCount - 7],
                [moduleCount - 7, 0],
            ];
            finderPositions.forEach(([r, c]) => {
                const x = c * moduleSize;
                const y = r * moduleSize;

                const outer = document.createElementNS(SVG_NS, 'rect');
                outer.setAttribute('x', String(x));
                outer.setAttribute('y', String(y));
                outer.setAttribute('width', String(finderSize));
                outer.setAttribute('height', String(finderSize));
                outer.setAttribute('fill', QR_FG);
                outer.setAttribute('rx', '12');
                outer.setAttribute('ry', '12');
                svg.appendChild(outer);

                const middle = document.createElementNS(SVG_NS, 'rect');
                middle.setAttribute('x', String(x + innerPadding));
                middle.setAttribute('y', String(y + innerPadding));
                middle.setAttribute('width', String(innerWhiteSize));
                middle.setAttribute('height', String(innerWhiteSize));
                middle.setAttribute('fill', QR_BG);
                middle.setAttribute('rx', '8');
                middle.setAttribute('ry', '8');
                svg.appendChild(middle);

                const inner = document.createElementNS(SVG_NS, 'rect');
                inner.setAttribute('x', String(x + innerPadding * 2));
                inner.setAttribute('y', String(y + innerPadding * 2));
                inner.setAttribute('width', String(innerBlackSize));
                inner.setAttribute('height', String(innerBlackSize));
                inner.setAttribute('fill', QR_FG);
                inner.setAttribute('rx', '3');
                inner.setAttribute('ry', '3');
                svg.appendChild(inner);
            });

            // Data modules → circles. We iterate the full grid and skip any
            // module that falls inside one of the three finder squares
            // (otherwise we'd double-paint dots over the nested rect group).
            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col) && !isInFinderPattern(row, col, moduleCount)) {
                        const circle = document.createElementNS(SVG_NS, 'circle');
                        circle.setAttribute('cx', String((col + 0.5) * moduleSize));
                        circle.setAttribute('cy', String((row + 0.5) * moduleSize));
                        circle.setAttribute('r', String(circleRadius));
                        circle.setAttribute('fill', QR_FG);
                        svg.appendChild(circle);
                    }
                }
            }

            // === Centred wordmark logo (knockout + <image>) ===
            // Render order matters for SVG z-stacking: source order = paint
            // order, last appended = topmost. The knockout pad masks the QR
            // modules that sit behind the logo (rather than relying on the
            // logo's opaque pixels to cover them — which would still leak
            // partially through the wordmark's negative space, and would
            // confuse scanners trying to read partially-covered modules).
            // The 'Q' error-correction level absorbs the masked area.
            const logoWidth = QR_SIZE * LOGO_WIDTH_RATIO;
            const logoHeight = logoWidth / LOGO_ASPECT;
            const logoX = (QR_SIZE - logoWidth) / 2;
            const logoY = (QR_SIZE - logoHeight) / 2;

            // White knockout pad — slightly bigger than the logo (1.5×
            // moduleSize of breathing room each side) with a soft 2×
            // moduleSize border-radius. Sized in module-grid units so the
            // pad scales with the QR density (denser QRs auto-shrink the
            // padding ring proportionally — keeps the visual margin
            // consistent against the dot grid).
            const padPaddingX = moduleSize * 1.5;
            const padPaddingY = moduleSize * 1.5;
            const padX = logoX - padPaddingX;
            const padY = logoY - padPaddingY;
            const padWidth = logoWidth + padPaddingX * 2;
            const padHeight = logoHeight + padPaddingY * 2;
            const padRadius = moduleSize * 2;

            const pad = document.createElementNS(SVG_NS, 'rect');
            pad.setAttribute('x', String(padX));
            pad.setAttribute('y', String(padY));
            pad.setAttribute('width', String(padWidth));
            pad.setAttribute('height', String(padHeight));
            pad.setAttribute('rx', String(padRadius));
            pad.setAttribute('ry', String(padRadius));
            pad.setAttribute('fill', QR_BG);
            svg.appendChild(pad);

            // Logo <image> — SVG <image href> references the external
            // wordmark.svg file. preserveAspectRatio 'xMidYMid meet' centres
            // the logo inside the [logoX..logoX+logoWidth, logoY..logoY+
            // logoHeight] box without distortion. We also set the legacy
            // xlink:href via setAttributeNS so the very old Safari (≤ iOS 12)
            // renderers that don't support the unprefixed `href` on <image>
            // still resolve the resource.
            const logo = document.createElementNS(SVG_NS, 'image');
            logo.setAttribute('href', LOGO_HREF);
            logo.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', LOGO_HREF);
            logo.setAttribute('x', String(logoX));
            logo.setAttribute('y', String(logoY));
            logo.setAttribute('width', String(logoWidth));
            logo.setAttribute('height', String(logoHeight));
            logo.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svg.appendChild(logo);

            // Idempotent mount — clear any prior contents (e.g. live-reload
            // re-running the IIFE in dev) before appending the fresh SVG.
            container.innerHTML = '';
            container.appendChild(svg);
        };

        // The qrcode CDN script + this script.js are both `defer`, so by the
        // time this IIFE evaluates, the lib's <script> has finished parsing
        // (defer scripts run after HTML parse, in source order, before
        // DOMContentLoaded fires). The readyState fork is belt-and-braces:
        // if the document is still 'loading' (rare edge case if a future
        // refactor moves this code out of a defer'd file), we wait for
        // DOMContentLoaded; otherwise we render immediately.
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderQRCode);
        } else {
            renderQRCode();
        }
    }

})();

/* ==========================================================================
   CURSOR TRAIL — volleyball emoji rigid-follow + canvas comet
   --------------------------------------------------------------------------
   Self-contained IIFE (kept outside the main script.js IIFE above so it can
   early-return cheaply on touch / mobile / reduced-motion without affecting
   any other block). Pairs with index.html ~line 384–385:
     <canvas class="cursor-trail" aria-hidden="true"></canvas>
     <span class="cursor-emoji" aria-hidden="true">🏐</span>
   and styles.css §18 (.cursor-trail, .cursor-emoji — full-viewport canvas
   pinned via position:fixed/inset:0; emoji pinned at top:0/left:0 with an
   initial off-screen translate3d(-100px, -100px, 0)).

   Behavior:
     1. Emoji rigid-follow: every `mousemove`, write `transform: translate3d(
        x, y, 0) translate(-50%, -50%)` directly. The first translate3d is in
        absolute px (top-left lands at the cursor); the second translate is
        in % of the emoji's own size (recenters by half its width/height) —
        the emoji is thus centered exactly on the cursor hot-spot. NO lerp,
        NO easing — CSS guarantees no `transform` transition on .cursor-emoji
        (only `opacity` is transitioned, 120ms ease, used for show/hide
        on document mouseenter/mouseleave).
     2. Comet trail: rAF loop clears the full canvas each frame, then
        strokes a polyline through the recent mouse-position buffer (points
        younger than MAX_AGE_MS = 500ms). Per-segment lineWidth and alpha
        decay linearly from head (fresh, thick, opaque-ish) to tail (old,
        thin, transparent). lineCap/lineJoin = 'round' for soft segment
        junctions.

   Performance notes:
     - rAF loop runs continuously, but when the cursor stops moving the
       buffer drains within MAX_AGE_MS (500 ms) and the per-frame work
       collapses to a single ctx.clearRect + a length-check short-circuit.
     - mousemove listener registered { passive: true } — no preventDefault,
       no scroll-blocking risk.
     - DPR scaling: canvas backing store is innerWidth*dpr × innerHeight*dpr
       and ctx.setTransform(dpr, 0, 0, dpr, 0, 0) is reset (not multiplied)
       on every resize so consecutive resizes don't stack scale factors.

   Defensive early-return: matches the CSS hide rules in styles.css §18
   (max-width: 767px, pointer: coarse, prefers-reduced-motion: reduce) so
   we don't attach listeners or schedule rAF on devices where the
   decoration is hidden anyway. Same guard family used elsewhere in this
   codebase (script.js line 379–380 for the wave animation block).
   ========================================================================== */
(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const narrowViewport = window.matchMedia('(max-width: 767px)').matches;
    if (reduceMotion || coarsePointer || narrowViewport) return;

    const canvas = document.querySelector('.cursor-trail');
    const emoji = document.querySelector('.cursor-emoji');
    if (!canvas || !emoji) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // === Tunable constants ===
    const MAX_AGE_MS = 500;        // points older than this drop off the tail
    const STROKE_HEAD = 8;         // px line width at the freshest segment
    const TRAIL_ALPHA_HEAD = 0.85; // alpha at the head of the trail
    const TRAIL_R = 16;            // Yamatch black stroke RGB — matches --color-text-primary #101828
    const TRAIL_G = 24;
    const TRAIL_B = 40;

    // === Canvas DPR-aware sizing ===
    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
        dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        // setTransform RESETS the matrix (vs scale() which multiplies). Critical:
        // a second resize without this would stack dpr × dpr scales on the
        // existing transform, blowing up coordinates exponentially.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // === Mouse position buffer ===
    // Each entry: { x, y, t } — viewport-relative coords + performance.now() ts.
    // Bounded implicitly by the MAX_AGE_MS drain in the rAF render loop.
    const points = [];

    window.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        points.push({ x: x, y: y, t: performance.now() });
        // Rigid emoji follow — direct write, zero interpolation. CSS .cursor-emoji
        // does NOT transition `transform` (only `opacity`), so this lands on
        // the next compositor frame with no easing.
        // Centrer l'emoji sur la position EXACTE du curseur (hot-spot).
        // translate3d positionne le top-left de l'emoji à (x, y), puis translate(-50%, -50%)
        // le décale en arrière de la moitié de sa propre taille → emoji centré pile sur (x, y).
        emoji.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0) translate(-50%, -50%)';
    }, { passive: true });

    // Hide emoji + flush trail when the cursor leaves the document (window
    // blur, system menu, switch tab via keyboard, etc.). Re-show on
    // mouseenter — the next mousemove will re-seed the trail naturally.
    document.addEventListener('mouseleave', () => {
        emoji.style.opacity = '0';
        points.length = 0;
    });
    document.addEventListener('mouseenter', () => {
        emoji.style.opacity = '1';
    });

    // === rAF render loop ===
    function render() {
        const now = performance.now();
        // Drop stale points (FIFO drain). Single while-shift is O(n) worst-case
        // but n is small (a fast trackpad caps at ~60 events in 500ms at 120Hz).
        while (points.length > 0 && now - points[0].t > MAX_AGE_MS) {
            points.shift();
        }
        // Full clear each frame — guarantees no ghosting from prior strokes,
        // and at idle (empty buffer) this is the only per-frame cost.
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        if (points.length >= 2) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (let i = 1; i < points.length; i++) {
                const p0 = points[i - 1];
                const p1 = points[i];
                // freshness = 1 at the head (just-arrived), 0 at the tail
                // (about to be dropped). Linear ramp on both width and alpha
                // gives the classic comet-tail taper.
                const age = (now - p1.t) / MAX_AGE_MS;
                const freshness = age < 0 ? 1 : (age > 1 ? 0 : 1 - age);
                ctx.lineWidth = STROKE_HEAD * freshness;
                ctx.strokeStyle = 'rgba(' + TRAIL_R + ', ' + TRAIL_G + ', ' + TRAIL_B + ', ' + (freshness * TRAIL_ALPHA_HEAD) + ')';
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.stroke();
            }
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
})();


/* ==========================================================================
   FLOATING CARDS PARALLAX — depth-of-field scroll effect
   --------------------------------------------------------------------------
   Self-contained IIFE (mirrors the cursor-trail + launch-ticker structure
   above: top-level, NOT nested inside the main IIFE). Pairs with the
   `.floating-card-parallax` decorative wrappers **dispersed** across
   `.how-quest` (cards 1, 3, 5) and `.faq` (cards 2, 4, 6) in index.html,
   and with the CSS rule `translate: 0 var(--parallax-y, 0px)` on
   `.floating-card-parallax` in styles.css.

   Architecture note (2026-05-12):
     The cards previously lived in a dedicated `.floating-cards` section
     sandwiched between `.how-quest` and `.faq`. They are now scattered as
     decorations directly inside `.how-quest` and `.faq` so each card sits
     on top of the relevant content. There is no longer a single shared
     parent — each card snapshots its OWN parent <section>'s top position
     (`sectionTopAtRest`), and the per-frame delta is computed per-card
     against that parent. Sections at different page Y positions therefore
     each get their own zero-crossing, and a card's parallax is driven by
     scroll past its OWN section rather than past a global anchor.

   Contract (JS ↔ CSS handshake):
     - JS READS: `data-parallax-speed` (float, e.g. 0.15) on every
       `.floating-card-parallax` element. Read ONCE at setup, cached in
       `cardData`, never re-queried in the per-frame path.
     - JS WRITES: `--parallax-y` (px value as a string, e.g. "-42.50px") on
       each `.floating-card-parallax` element. Written every rAF tick while
       at least one parent section is in/near the viewport.
     - CSS COMPOSES: the wrapper uses the individual `translate:` property
       (NOT `transform:`) so the parallax composes cleanly with each card's
       static `rotate:` (also an individual property) and with the inner
       wrapper's keyframe-driven levitation `transform:` — three orthogonal
       transform axes, no clobbering. This is the same individual-property
       pattern the wordmark uses (translate vs. transform separation).
     - CSS also applies the compositor hints (`translate3d` keyframe,
       `will-change: translate`, `backface-visibility: hidden`) so iOS Safari
       promotes each card to its own layer. JS does NO compositor work.

   Per-frame budget (the hot path):
     - 1 read: `latestScrollY` (a plain closure variable refreshed by the
       scroll listener — NO `window.scrollY` access inside `tick`, so no
       layout-thrash risk).
     - N writes: `el.style.setProperty('--parallax-y', ...)` for each card.
       setProperty on a custom prop is a cheap string assignment; the
       cascade triggers a paint, not a re-layout (translate is composited).
     - 0 layout reads. NO `getBoundingClientRect`, NO `getComputedStyle`,
       NO `offsetTop` inside `tick`. All geometry is snapshotted in
       `measureGeometry()` (load + resize + orientationchange only) — the
       same discipline applied in the page-scroll-progress block around
       line 235 (`measureScrollAnimationGeometry`).

   Activation gate (IntersectionObserver, rootMargin 20% top/bottom):
     The scroll listener is attached while AT LEAST ONE unique parent
     section (`.how-quest` and/or `.faq`) intersects the pre-warmed
     viewport. When the user scrolls past both, we tear down the scroll
     listener — no wasted CPU during long footer reads. The 20% top and
     bottom rootMargin pre-arm the parallax before any parent section
     visibly enters / after the last one visibly leaves, so a fast scroll
     never snaps from stale `--parallax-y` to a fresh one. Same pattern as
     the waves block IntersectionObserver around line 691. Deduplication
     via Set: if multiple cards share a parent, we observe each parent
     section exactly once.

   Reduced-motion guard:
     If `prefers-reduced-motion: reduce` matches, this IIFE early-returns.
     No listeners, no observer, no rAF. The cards stay in their CSS base
     position (the keyframe levitation is also disabled by the global
     `* { animation-duration: 0.01ms !important }` rubric in styles.css's
     reduced-motion block).

   Coarse-pointer (touch) gate:
     INTENTIONALLY ABSENT. Parallax on scroll is a desirable enhancement on
     touch — finger-driven scroll is smoother on iOS Safari than trackpad
     scroll, and the compositor hints applied CSS-side make the per-card
     translate update sub-frame on modern iPhones. Contrast with the
     cursor trail (mouse-only by design) and the waves animation (skipped
     on touch because of a separate per-event `getBoundingClientRect` jank
     surface — irrelevant here since this IIFE never reads layout per scroll).

   Sign convention:
     `parallaxY = -delta * speed`. When scrolling DOWN (delta > 0),
     parallaxY is negative → the cards translate UP. Cards with a higher
     `data-parallax-speed` translate further per scroll-pixel → they
     appear to be in the FOREGROUND (move faster, like nearby objects past
     a train window). Cards with a lower speed appear BACKGROUND (move
     less, like distant objects). The badge (speed 0.25) is the most
     foreground; the team card (speed 0.08) is the most background. The
     net effect is a parallax depth-of-field reveal as the user scrolls
     INTO each parent section from above and OUT of it from below.
   ========================================================================== */
(function () {
    'use strict';

    // Guard 1: reduced motion — fully disable the parallax. The cards stay
    // in their CSS-defined base position (--parallax-y defaults to 0px via
    // the var() fallback in the CSS `translate:` rule).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Guard 2: no `.floating-card-parallax` wrappers present (e.g. legal /
    // utility pages, or a future edit that removes them). Without any
    // card, there's nothing to measure or observe — bail out silently.
    const cards = Array.from(document.querySelectorAll('.floating-card-parallax'));
    if (cards.length === 0) return;

    // === Per-card data, snapshotted at setup ===
    // Reading `dataset.parallaxSpeed` once at setup (string→float parse) is
    // strictly cheaper than reading it on every rAF tick — even though
    // dataset access is fast, the parseFloat would still allocate a Number
    // each tick × N cards. Cached form is just a property read on a plain
    // object literal. `el` is captured directly (no re-querying by ID).
    //
    // Per-card `parentSection` is the nearest enclosing <section> ancestor
    // (`.how-quest` or `.faq` in the current layout). `closest('section')`
    // walks up the tree once at setup. The result is cached and used both
    // by `measureGeometry` (to snapshot `sectionTopAtRest` per card) and
    // by the IntersectionObserver setup (deduplicated via Set to observe
    // each unique parent exactly once).
    const cardData = cards.map((card) => {
        const raw = parseFloat(card.dataset.parallaxSpeed);
        return {
            el: card,
            // Defensive fallback to 0 (= no parallax for that card) if the
            // attribute is missing or unparseable. Never NaN-poisons the
            // arithmetic downstream.
            speed: Number.isFinite(raw) ? raw : 0,
            parentSection: card.closest('section'),
            // Will be filled in by measureGeometry(); zero until first
            // measurement so a stray pre-measure tick reads as "card is
            // at its CSS-defined base" (parallaxY = -latestScrollY * speed,
            // visually subtle for typical small `speed` values).
            sectionTopAtRest: 0
        };
    });

    // Guard 3: every card lacks a <section> parent (degenerate case — a
    // future refactor could put a card directly under <main> or <body>).
    // `validCards` is what we work with from here on; the original
    // `cardData` is discarded so the hot path never has to filter again.
    const validCards = cardData.filter((d) => d.parentSection !== null);
    if (validCards.length === 0) return;

    // === Geometry snapshot (NOT in the per-frame path) ===
    // For each card we snapshot its parent section's TOP position in PAGE
    // coordinates (i.e. as if scroll were 0), computed by adding the
    // current scrollY to the bounding-rect top. `getBoundingClientRect()`
    // returns the viewport-relative position which already includes the
    // active scroll offset, so the addition gives us a scroll-invariant
    // reference point per card. The per-frame delta is then a clean
    // `latestScrollY - sectionTopAtRest` per card.
    //
    // Why per-card (not per-section) cache: cards may share a parent (e.g.
    // cards 1, 3, 5 all live in `.how-quest`), and reading per-section
    // here would force a second-level map lookup in the hot path. By
    // storing the resolved `sectionTopAtRest` directly on each card's
    // record, the tick() loop is a flat per-card pass with zero
    // indirection. Two `getBoundingClientRect` calls (one per unique
    // section) is a non-issue: it runs at most a few times per minute
    // (load + resize + orientationchange).
    //
    // Re-measured on load + resize + orientationchange (NEVER on scroll).
    // The page can reflow vertically between resize events (e.g. webfonts
    // loading shifts the lime-card buttons, which shifts everything below
    // by a few pixels) — those reflows are caught by the `load` listener
    // and by the resize/orientationchange debounce.
    const measureGeometry = () => {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        for (let i = 0; i < validCards.length; i++) {
            const d = validCards[i];
            const rect = d.parentSection.getBoundingClientRect();
            d.sectionTopAtRest = rect.top + scrollY;
        }
    };

    // === Scroll + rAF coalesce (mirrors page-scroll-progress block) ===
    // `latestScrollY` is updated on every scroll event (single property
    // read, no layout work) and consumed by the rAF callback. The
    // `rafScheduled` flag ensures we coalesce multiple scroll events into
    // a single rAF tick — at high scroll rates (e.g. 120Hz trackpad on
    // ProMotion displays) the browser fires ~2 scroll events per frame,
    // and we want exactly ONE setProperty pass per frame, not two.
    let latestScrollY = window.scrollY || window.pageYOffset || 0;
    let rafScheduled = false;

    const tick = () => {
        rafScheduled = false;

        for (let i = 0; i < validCards.length; i++) {
            const { el, speed, sectionTopAtRest } = validCards[i];
            // `delta` = how far the user has scrolled past this card's
            // parent section's resting position. Positive when the user
            // has scrolled DOWN past the section's natural top; negative
            // when the section is still below the current scroll position.
            // Sign convention drives the parallax direction (see header).
            const delta = latestScrollY - sectionTopAtRest;
            // Negative for downward scroll → cards translate UP (foreground
            // motion). toFixed(2) caps the precision at sub-pixel level —
            // anything finer is invisible and just wastes bytes in the
            // CSSOM string. Keeps the inline-style attribute compact.
            const parallaxY = -delta * speed;
            el.style.setProperty('--parallax-y', parallaxY.toFixed(2) + 'px');
        }
    };

    const onScroll = () => {
        // ONLY work in the scroll listener: refresh the cached scrollY
        // (which the rAF callback will consume) and schedule the rAF if
        // none is pending. Zero layout reads, zero per-event allocations
        // beyond the boolean flag flip. Keeps the listener cheap enough
        // to leave on `{ passive: true }` without affecting the
        // compositor's ability to keep scroll on its own thread (critical
        // for iOS Safari touch-driven scroll smoothness).
        latestScrollY = window.scrollY || window.pageYOffset || 0;
        if (!rafScheduled) {
            rafScheduled = true;
            requestAnimationFrame(tick);
        }
    };

    // === IntersectionObserver gate ===
    // Attaches the scroll listener while AT LEAST ONE unique parent section
    // intersects the pre-warmed viewport. When the user has scrolled past
    // every parent (or hasn't reached the first one yet), the scroll
    // listener is detached entirely — no per-scroll work, even though
    // we'd be in the pure-arithmetic per-tick path anyway. Cheap defense
    // against future additions accidentally bloating the per-tick cost.
    //
    // The 20% top/bottom rootMargin pre-warms the parallax before the
    // first section is visibly in the viewport: at typical 100vh, 20% =
    // 200px of headroom, comfortably enough to absorb a single
    // scroll-wheel tick (~100px) without any visible snap from a stale
    // `--parallax-y` to the fresh one. After detachment, the last-written
    // `--parallax-y` persists on each card; the IO callback fires a
    // synthetic `onScroll()` on re-entry so the cards re-sync before the
    // next user scroll event.
    //
    // Visibility tracking uses a COUNTER (`visibleParents`) over the
    // unique parent sections rather than a boolean per section: this
    // correctly handles the transition `.how-quest visible` → `.faq
    // visible` → `.how-quest no longer visible` without flapping the
    // listener off-then-on. The counter is clamped at 0 defensively in
    // case an IntersectionObserver delivers an unexpected duplicate
    // "leaving" entry.
    const uniqueParents = Array.from(new Set(validCards.map((d) => d.parentSection)));
    let visibleParents = 0;
    let listenerAttached = false;

    const io = new IntersectionObserver((entries) => {
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.isIntersecting) {
                visibleParents++;
            } else {
                visibleParents = Math.max(0, visibleParents - 1);
            }
        }
        if (visibleParents > 0 && !listenerAttached) {
            window.addEventListener('scroll', onScroll, { passive: true });
            listenerAttached = true;
            // Synthetic resync — important when the user re-enters a parent
            // section after a fast scroll: the cached scrollY (from the
            // last time we were attached) may be stale, and the cards'
            // current `--parallax-y` may correspond to a position
            // hundreds of px away. One synthetic onScroll → rAF tick
            // catches up before the next real scroll event.
            onScroll();
        } else if (visibleParents === 0 && listenerAttached) {
            window.removeEventListener('scroll', onScroll, { passive: true });
            listenerAttached = false;
        }
    }, { rootMargin: '20% 0% 20% 0%' });
    uniqueParents.forEach((parent) => io.observe(parent));

    // === Layout-change re-measure (debounced 150ms) ===
    // Same debounce window as the launch-ticker resize handler (line ~1401)
    // and the page-scroll-progress block's natural ordering. 150ms is the
    // sweet spot: fast enough to feel responsive at the end of a window-
    // drag, slow enough to coalesce the burst of resize events Chrome
    // fires during the drag (which can hit 60+ events/second). On
    // orientationchange the handler fires once (no debounce needed
    // for the trailing edge), but reusing the same path keeps the code
    // simple and any extra trailing rAF tick is harmless.
    let resizeTimer = null;
    const onLayoutChange = () => {
        if (resizeTimer !== null) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resizeTimer = null;
            measureGeometry();
            // Re-tick immediately after re-measure so the cards reflect the
            // new geometry on the next frame, not on the next user scroll.
            // We bypass the `rafScheduled` flag intentionally: even if a
            // scroll-driven rAF is in flight, a freshly re-measured
            // geometry should produce its own tick — `rafScheduled = false`
            // forces this. (Worst case: two ticks within one frame budget,
            // each ~20µs of arithmetic + N setProperty — still well inside
            // a 16ms frame.)
            latestScrollY = window.scrollY || window.pageYOffset || 0;
            if (!rafScheduled) {
                rafScheduled = true;
                requestAnimationFrame(tick);
            }
        }, 150);
    };

    window.addEventListener('resize', onLayoutChange, { passive: true });
    window.addEventListener('orientationchange', onLayoutChange, { passive: true });
    // `load` re-measure: webfonts (Inter via Google Fonts) can shift the
    // vertical layout 100-500ms after first paint, moving each parent
    // section by tens of pixels. Without this re-measure, the initial
    // `sectionTopAtRest` values would be stale for the rest of the
    // session. Mirrors the page-scroll-progress block's `load` listener.
    window.addEventListener('load', () => {
        measureGeometry();
        latestScrollY = window.scrollY || window.pageYOffset || 0;
        if (!rafScheduled) {
            rafScheduled = true;
            requestAnimationFrame(tick);
        }
    }, { passive: true });

    // === Initial sync ===
    // Run the first geometry measure synchronously (defer-script timing
    // means the DOM is parsed; layout has been computed at least once by
    // the time this IIFE evaluates) and schedule the first paint tick.
    // This handles the case where the user loads the page already scrolled
    // mid-document (e.g. anchor link, deep-link, reload-with-restored-
    // scroll-position): the parallax is correct on first paint, not on
    // first user scroll.
    measureGeometry();
    requestAnimationFrame(tick);
})();


/* ==========================================================================
   LAUNCH-TICKER START OFFSET — center first span at t=0
   --------------------------------------------------------------------------
   Contract with css-expert:
     @keyframes launchTickerScroll {
         from { transform: translate3d(var(--ticker-start-offset, 0px), 0, 0); }
         to   { transform: translate3d(calc(var(--ticker-start-offset, 0px) - 50%), 0, 0); }
     }
   The keyframe still translates by exactly 50% of the track width over its
   period, so the seamless-loop math (see styles.css §4.5: 4S + 4G width with
   `padding-right: var(--ticker-gap)` closing the loop) is preserved — the
   start offset is a constant additive shift on both endpoints, NOT a change
   to the translation distance. The loop remains seamless.

   What this IIFE does:
     1. Measures the first span width (S) and the viewport width (V).
     2. Computes offset = max(0, (V - S) / 2). Capped at 0 to avoid pushing
        the span off-screen LEFT when S > V (very narrow viewport with long
        message — falls back to the current left-aligned behaviour).
     3. Writes `--ticker-start-offset` (in px) on `.launch-ticker__track`
        — scoped to the element, NOT on `:root`, to avoid polluting the
        global cascade.
     4. Recomputes on `window.resize` (debounced ~150ms) AND once
        `document.fonts.ready` resolves (re-measure after custom font load,
        which can shift `S`).

   Early-returns:
     - `.launch-ticker__track` absent (legal / utility pages don't render it).
     - `prefers-reduced-motion: reduce` — the CSS `@media` block already
       disables the animation, so the offset is irrelevant.

   Timing note:
     With `<script defer>`, this IIFE runs AFTER DOM parsing but BEFORE the
     first paint of the ticker animation in the typical case — so the var
     is set before the keyframe's `from` keyframe is sampled, no flash.
     The fonts-ready re-measure handles the post-FOUT case where Inter
     loads late and the span width changes.
   ========================================================================== */
(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const track = document.querySelector('.launch-ticker__track');
    if (!track) return;

    const firstSpan = track.querySelector('span');
    if (!firstSpan) return;

    // Mobile/tablet gate — the centering offset is a mobile-only feature.
    // On desktop the ticker keeps its standard left-aligned start (span 1 at
    // the viewport's left edge, the natural ticker behaviour). Same media
    // query family used elsewhere in this file (cursor trail line 1529-1531,
    // waves animation line 379-380) — `(max-width: 767px)` covers narrow
    // viewports and `(pointer: coarse)` covers touch tablets that may have
    // a viewport wider than 767px (iPad portrait = 768px). Stored as a
    // MediaQueryList so we can attach `change` listeners below — those fire
    // exactly once at the breakpoint crossing, with no debounce, while the
    // resize listener catches in-bucket dimension changes.
    const mobileTabletMQL = window.matchMedia('(max-width: 767px), (pointer: coarse)');

    // Measure → compute → write. Pure function: read DOM, write one CSS var,
    // no internal state, no rAF loop. Idempotent — calling it twice in a row
    // with no layout change writes the same value.
    //
    // Re-checks the media query on every call so a window-resize drag that
    // crosses the 767px boundary mid-session toggles the offset on/off
    // correctly. The desktop branch writes `0px` explicitly (rather than
    // leaving a stale value) so a mobile→desktop transition resets cleanly.
    const updateOffset = () => {
        if (!mobileTabletMQL.matches) {
            // Desktop / fine-pointer path: explicit reset to 0 so a
            // tablet→desktop resize doesn't leave a stale offset on the
            // element. The keyframe then runs `0 → -50%` — the standard
            // left-aligned ticker behaviour.
            track.style.setProperty('--ticker-start-offset', '0px');
            return;
        }

        // `getBoundingClientRect().width` returns the rendered (post-layout)
        // sub-pixel width of the span — accurate to whatever the browser
        // actually painted, which is what we need to centre visually. Reading
        // `offsetWidth` would round to integer px and could miss the centre
        // by up to 0.5px on HiDPI displays.
        const spanWidth = firstSpan.getBoundingClientRect().width;
        const viewportWidth = window.innerWidth;
        // If the span is wider than the viewport (very small mobile + long
        // message), Math.max clamps to 0 — a positive offset would push the
        // span PAST the right edge at t=0, hiding its left half off-screen
        // left. Better to fall back to the natural left-aligned start.
        const offset = Math.max(0, (viewportWidth - spanWidth) / 2);
        track.style.setProperty('--ticker-start-offset', offset + 'px');
    };

    // Initial write — runs before first paint thanks to `<script defer>`.
    // Note: at this point custom fonts (Inter via Google Fonts) may not be
    // loaded yet, so `spanWidth` is measured against the fallback stack.
    // The `document.fonts.ready` re-measure below corrects this once the
    // real font lands.
    updateOffset();

    // Re-measure once custom fonts have loaded — Inter shipped via Google
    // Fonts can land 100-500ms after first paint, and the resulting glyph
    // metrics shift the span width. Without this, the initial offset would
    // be off by however much the fallback font's width differs from Inter's.
    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
        document.fonts.ready.then(updateOffset).catch(() => { /* swallow */ });
    }

    // Debounced resize handler — 150ms is fast enough to feel responsive on
    // a window-resize drag, slow enough to coalesce the burst of events the
    // browser fires during the drag. The visual jump from re-writing the
    // var mid-animation is acceptable (resize is rare; user accepts the
    // compromise per task spec).
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        if (resizeTimer !== null) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resizeTimer = null;
            updateOffset();
        }, 150);
    }, { passive: true });

    // MediaQueryList change listener — fires exactly once at each breakpoint
    // crossing (mobile↔desktop). Complements the resize listener: covers
    // pointer-type changes that don't necessarily produce a resize event
    // (e.g. plugging in a mouse on a tablet), and reacts immediately at the
    // 767px boundary without waiting for the 150ms resize debounce.
    if (typeof mobileTabletMQL.addEventListener === 'function') {
        mobileTabletMQL.addEventListener('change', updateOffset);
    } else if (typeof mobileTabletMQL.addListener === 'function') {
        // Safari < 14 fallback (deprecated API, still ships in older iOS).
        mobileTabletMQL.addListener(updateOffset);
    }
})();

