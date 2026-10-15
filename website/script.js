(function () {
    'use strict';

    // The organiser route owns its wordmark, FAQ and footer controllers.
    if (document.body.classList.contains('org-page')) return;

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
    // Exposed as a public API on `window` — deliberately kept even though no
    // in-repo caller exists today. The former `.js-pending-cta` click
    // delegation (toast "Bientôt disponible") was removed on 2026-07-27 when
    // the Android app shipped to Google Play and the hero Google Play button
    // became a real external link (index.html:283), leaving zero elements
    // carrying that class. Keeping the delegation alive would have been both
    // dead code AND a hazard: any element that ever picked up the class by
    // mistake would silently have its default action `preventDefault()`ed.
    // `window.yamatchToast(message)` remains the supported entry point for
    // any future ad-hoc notification (inline handler, console, future block).
    window.yamatchToast = showToast;

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
                // VISUAL-ONLY `clip-path` on `.hero-card::before`,
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
   FLOATING CARDS PARALLAX — depth-of-field scroll effect
   --------------------------------------------------------------------------
   Self-contained top-level IIFE, not nested inside the main IIFE. Pairs with the
   `.floating-card-parallax` decorative wrappers **dispersed** across
   `.how-quest` (cards 2, 3) and `.faq` (card 6) in index.html,
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
     never snaps from stale `--parallax-y` to a fresh one. Deduplication
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
     translate update sub-frame on modern iPhones. This IIFE never reads
     layout per scroll.

   Narrow-viewport (mobile, <=767px) gate:
     ACTIVE — every `.floating-card-parallax` is hidden via `display: none`
     in styles.css §18 on mobile (the cards are decorative density that
     doesn't read well in a single-column mobile layout). Writing
     `--parallax-y` on `display: none` elements is legal but wasteful — N
     setProperty calls per rAF tick + one IntersectionObserver entry per
     parent section, all producing no visible effect. So we GATE the entire
     observer + scroll-listener setup on `mobileQuery.matches`: skip setup
     on mobile, and watch the MediaQueryList for breakpoint crossings to
     teardown / re-init symmetrically on resize / orientationchange that
     crosses the 767px boundary. Reduced-motion guard is still
     evaluated first and short-circuits before the mobile gate — both
     conditions stack additively, neither subsumes the other.

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

    // Guard 3: mobile (<= 767px). Held as a live MediaQueryList so a
    // window-resize that crosses the breakpoint mid-session toggles the
    // entire parallax engine on/off (see `setup()` / `teardown()` below).
    // The cards are `display: none` on mobile per styles.css §18, so any
    // `--parallax-y` write is silently ignored by the renderer; we skip
    // the work entirely rather than burn an rAF tick per scroll event +
    // N setProperty calls + an IntersectionObserver. Same MQL family as
    // the page-scroll-progress block.
    const mobileQuery = window.matchMedia('(max-width: 767px)');

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
            sectionTopAtRest: 0,
            // === Lerp state (target/current pattern) ===
            // `targetY` is the geometry-driven destination computed each
            // tick from `latestScrollY - sectionTopAtRest`; `currentY` is
            // the smoothed value actually written to `--parallax-y`. Both
            // start at 0 here and are snapped to the geometry-correct value
            // in `setup()` once `measureGeometry()` has run — this avoids a
            // visible "rentrée" animation when the user lands mid-scroll
            // (e.g. via an anchor link to #faq).
            targetY: 0,
            currentY: 0
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
    // cards 2 and 3 both live in `.how-quest`), and reading per-section
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

    // === Scroll + self-rescheduling rAF lerp loop ===
    // `latestScrollY` is updated on every scroll event (single property
    // read, no layout work) and consumed by the rAF callback. The
    // `rafRunning` flag tracks whether the lerp loop is currently alive;
    // a fresh scroll event re-arms the loop only if it is idle (already
    // converged and self-stopped), otherwise it lets the running loop
    // pick up the new `latestScrollY` on its next iteration.
    //
    // Smoothing rationale: scroll-wheel events on desktop arrive in
    // discrete 50-100px chunks ("wheel detents"). Writing the raw
    // geometry-derived `parallaxY` straight to `--parallax-y` produces
    // a visible jump per detent on every card. By easing `currentY`
    // toward `targetY` with a per-frame fraction (`SMOOTHING`), each
    // jump is dissolved into a multi-frame ramp that the eye reads as
    // smooth motion. At 60fps a SMOOTHING of 0.14 converges ~90% of
    // the remaining distance within ~15 frames (~250ms), which is
    // brisk enough to feel responsive but slow enough to mask the
    // wheel-detent quantization.
    //
    // Self-stop: when `|targetY - currentY| < EPS` for ALL cards, the
    // loop exits and `rafRunning` flips to false. The next scroll
    // event re-starts it. This avoids burning rAF ticks at rest.
    const SMOOTHING = 0.14;
    const EPS = 0.1;
    let latestScrollY = window.scrollY || window.pageYOffset || 0;
    let rafRunning = false;

    const tick = () => {
        let stillAnimating = false;

        for (let i = 0; i < validCards.length; i++) {
            const d = validCards[i];
            // `delta` = how far the user has scrolled past this card's
            // parent section's resting position. Positive when the user
            // has scrolled DOWN past the section's natural top; negative
            // when the section is still below the current scroll position.
            // Sign convention drives the parallax direction (see header).
            const delta = latestScrollY - d.sectionTopAtRest;
            // Negative for downward scroll → cards translate UP (foreground
            // motion). The geometry-derived destination is recomputed every
            // tick so that `latestScrollY` updates between scroll-event
            // bursts feed into the lerp without being missed.
            d.targetY = -delta * d.speed;
            // Standard lerp: move a SMOOTHING fraction of the remaining
            // distance per frame. Frame-rate-dependent on purpose — at
            // 60fps it feels uniform; on a 120fps ProMotion display the
            // motion is the same total duration in frame-count terms but
            // half the wall-clock duration, which reads as slightly
            // snappier (acceptable trade-off for vanilla-JS simplicity).
            d.currentY += (d.targetY - d.currentY) * SMOOTHING;

            if (Math.abs(d.targetY - d.currentY) > EPS) {
                stillAnimating = true;
            }

            // toFixed(2) caps the precision at sub-pixel level — anything
            // finer is invisible and just wastes bytes in the CSSOM
            // string. Keeps the inline-style attribute compact.
            d.el.style.setProperty('--parallax-y', d.currentY.toFixed(2) + 'px');
        }

        if (stillAnimating) {
            requestAnimationFrame(tick);
        } else {
            rafRunning = false;
        }
    };

    const onScroll = () => {
        // ONLY work in the scroll listener: refresh the cached scrollY
        // (which the lerp loop reads each tick) and re-arm the loop if
        // it has self-stopped. Zero layout reads, zero per-event
        // allocations beyond the boolean flag flip. Keeps the listener
        // cheap enough to leave on `{ passive: true }` without affecting
        // the compositor's ability to keep scroll on its own thread
        // (critical for iOS Safari touch-driven scroll smoothness).
        latestScrollY = window.scrollY || window.pageYOffset || 0;
        if (!rafRunning) {
            rafRunning = true;
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

    // Closure-scoped handles — assigned by `setup()`, nulled by
    // `teardown()`. Keeping them in the outer scope (rather than inside
    // `setup`) lets `teardown` disconnect and remove with the exact same
    // function references, even after the MQL `change` listener has
    // ping-ponged the engine on/off multiple times.
    let io = null;
    let resizeTimer = null;
    let loadListener = null;

    // Debounced resize / orientationchange handler — 150ms is the sweet
    // spot: fast enough to feel responsive at the end of a window-drag,
    // slow enough to coalesce the burst of resize events Chrome fires
    // during the drag (which can hit 60+ events/second). Defined at the
    // IIFE scope so `setup()` and `teardown()` share the exact same
    // function reference for add/removeEventListener symmetry.
    const onLayoutChange = () => {
        if (resizeTimer !== null) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resizeTimer = null;
            measureGeometry();
            // After a re-measure, the `sectionTopAtRest` of each card has
            // shifted — feeding the new geometry into the running lerp
            // unchanged would produce a brusque animated catch-up from
            // the stale `currentY` toward the new `targetY`. Instead we
            // re-snap: recompute `targetY` against the fresh geometry
            // and copy it into `currentY`, then write `--parallax-y`
            // synchronously. The resize is itself a discontinuity in
            // the user's viewport, so a hard jump here is correct.
            latestScrollY = window.scrollY || window.pageYOffset || 0;
            for (let i = 0; i < validCards.length; i++) {
                const d = validCards[i];
                const delta = latestScrollY - d.sectionTopAtRest;
                d.targetY = -delta * d.speed;
                d.currentY = d.targetY;
                d.el.style.setProperty('--parallax-y', d.currentY.toFixed(2) + 'px');
            }
            // No need to re-arm the loop: targetY === currentY for every
            // card, so the convergence test would exit on the first
            // iteration anyway. Leaving `rafRunning` untouched is safe —
            // if a scroll-driven loop was already running, it picks up
            // the new geometry on its next tick; if not, the next user
            // scroll re-arms it.
        }, 150);
    };

    // === setup() — wire everything that costs CPU per scroll ===
    // Idempotent: calling twice without an intervening `teardown()` does
    // nothing (guarded by `io !== null`). Builds the IntersectionObserver,
    // attaches the resize/orientationchange/load listeners, performs the
    // initial geometry measure, and schedules the first paint tick.
    const setup = () => {
        if (io !== null) return;

        // Reset gate state so a re-entry after a teardown starts clean.
        visibleParents = 0;
        listenerAttached = false;

        io = new IntersectionObserver((entries) => {
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

        window.addEventListener('resize', onLayoutChange, { passive: true });
        window.addEventListener('orientationchange', onLayoutChange, { passive: true });
        // `load` re-measure: webfonts (Inter via Google Fonts) can shift the
        // vertical layout 100-500ms after first paint, moving each parent
        // section by tens of pixels. Without this re-measure, the initial
        // `sectionTopAtRest` values would be stale for the rest of the
        // session. Mirrors the page-scroll-progress block's `load` listener.
        // Stored on a closure-scope variable so `teardown` can detach this
        // exact reference (even though `load` fires at most once per page
        // lifecycle, a mobile→desktop→mobile→desktop pattern would otherwise
        // stack listeners).
        loadListener = () => {
            measureGeometry();
            // Same re-snap pattern as `onLayoutChange`: webfont swap can
            // shift each section's top by tens of pixels, so we hard-jump
            // the lerp state to the geometry-correct value rather than
            // letting the loop ease into it (which would read as a visible
            // post-load animation).
            latestScrollY = window.scrollY || window.pageYOffset || 0;
            for (let i = 0; i < validCards.length; i++) {
                const d = validCards[i];
                const delta = latestScrollY - d.sectionTopAtRest;
                d.targetY = -delta * d.speed;
                d.currentY = d.targetY;
                d.el.style.setProperty('--parallax-y', d.currentY.toFixed(2) + 'px');
            }
        };
        window.addEventListener('load', loadListener, { passive: true });
        // The asynchronous rail changes the FAQ's page position after load.
        window.addEventListener('yamatch:showcase-layout', loadListener);

        // === Initial sync ===
        // Run the first geometry measure synchronously (defer-script timing
        // means the DOM is parsed; layout has been computed at least once by
        // the time this IIFE evaluates), then SNAP the lerp state to the
        // geometry-correct value — `currentY = targetY` for every card —
        // so the cards mount at their final position rather than easing in
        // from 0 over the first ~250ms after load. This is critical when
        // the page is loaded mid-scroll (anchor link to #faq, browser
        // scroll restoration, etc.): without the snap, every card would
        // animate from its CSS-base into place after first paint, which
        // reads as a glitchy "rentrée" rather than a static landing.
        measureGeometry();
        latestScrollY = window.scrollY || window.pageYOffset || 0;
        for (let i = 0; i < validCards.length; i++) {
            const d = validCards[i];
            const delta = latestScrollY - d.sectionTopAtRest;
            d.targetY = -delta * d.speed;
            d.currentY = d.targetY;
            d.el.style.setProperty('--parallax-y', d.currentY.toFixed(2) + 'px');
        }
        // No initial rAF kick — the snap above already paints the correct
        // value. The loop will start on the first scroll event via
        // `onScroll()` (or sooner via the IO `onScroll()` re-sync on entry).
    };

    // === teardown() — symmetric cleanup, no listener leaks ===
    // Disconnects the IO, removes every listener installed by `setup`, and
    // any in-flight rAF lerp loop is left to drain harmlessly (the tick
    // callback's `--parallax-y` writes are silently no-op'd by the
    // renderer once the cards hit `display: none` on mobile per styles.css
    // §18). The lerp loop will self-stop within ~15 frames as `targetY`
    // and `currentY` converge against a now-frozen `latestScrollY`; we
    // also reset `rafRunning` to `false` explicitly so a subsequent
    // `setup()` (on desktop re-entry) starts from a known-clean gate
    // state. Last-written `--parallax-y` values persist on the cards'
    // inline style — invisible while `display: none`, and the next
    // `setup()` snaps them to the correct values on entry.
    const teardown = () => {
        if (io === null) return;
        io.disconnect();
        io = null;
        if (listenerAttached) {
            window.removeEventListener('scroll', onScroll, { passive: true });
            listenerAttached = false;
        }
        window.removeEventListener('resize', onLayoutChange, { passive: true });
        window.removeEventListener('orientationchange', onLayoutChange, { passive: true });
        if (loadListener !== null) {
            window.removeEventListener('load', loadListener, { passive: true });
            window.removeEventListener('yamatch:showcase-layout', loadListener);
            loadListener = null;
        }
        if (resizeTimer !== null) {
            clearTimeout(resizeTimer);
            resizeTimer = null;
        }
        // Explicit reset for cohérence — a still-running rAF tick will
        // observe `validCards` unchanged and self-stop on its next
        // iteration, then flip this flag itself; but the reset here
        // covers the case where teardown is followed immediately by
        // setup on a fast MQL flap.
        rafRunning = false;
    };

    // === Mobile gate — initial state + breakpoint-change listener ===
    // On mobile load (or anchor-link to mobile viewport) we skip the entire
    // setup. The MQL `change` listener handles the desktop↔mobile crossing
    // for window-resize drags and orientation changes that cross 767px.
    if (!mobileQuery.matches) {
        setup();
    }

    const onMobileQueryChange = (event) => {
        if (event.matches) {
            teardown();
        } else {
            setup();
        }
    };
    if (typeof mobileQuery.addEventListener === 'function') {
        mobileQuery.addEventListener('change', onMobileQueryChange);
    } else if (typeof mobileQuery.addListener === 'function') {
        // Safari < 14 fallback (deprecated API, still ships in older iOS).
        mobileQuery.addListener(onMobileQueryChange);
    }
})();

/* PUBLIC TOURNAMENT RAIL — participant and organiser variants.
   Adapted from the approved rail-only handoff (2026-10-15).
   The public RPC must be deployed separately; failures keep the section hidden.
   Demo data is only rendered with the explicit ?showcase=demo parameter. */
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

    var MAX_RECENT = 9;
    var MAX_UPCOMING = 6;
    var MAX_ORGANIZER_RAIL = 6;
    var MAX_STAT_VALUE = 10000000;
    var MAX_TEXT_LENGTH = 120;

    var PREFETCH_ROOT_MARGIN = '600px 0px';

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

    var NBSP = ' ';

    // fr-FR groups with U+202F; NBSP has wider font coverage and is the house style.
    function formatNumber(value) {
        return numberFormatter.format(value).replace(/[  ]/g, NBSP);
    }

    // « 15 oct. 2026 » must never break between the day, month and year.
    function formatDate(isoDate) {
        var m = DATE_PATTERN.exec(isoDate);
        if (!m) return '';
        return dateFormatter.format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))).replace(/[  ]/g, NBSP);
    }

    function countLabel(count, singular, pluralForm) {
        return formatNumber(count) + NBSP + (count >= 2 ? pluralForm : singular);
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

    function normalizeList(list, mapper, max) {
        var out = [];
        for (var i = 0; i < list.length && out.length < max; i++) {
            var item = mapper(list[i]);
            if (item) out.push(item);
        }
        return out;
    }

    // Returns a render model, or null when the payload breaks the contract.
    // All six stats stay mandatory for the contract; none gate visibility.
    function normalizePayload(data) {
        if (Array.isArray(data) && data.length === 1) data = data[0];
        if (data && typeof data === 'object' && data.get_public_showcase) data = data.get_public_showcase;
        if (!data || typeof data !== 'object' || !data.stats || typeof data.stats !== 'object') return null;
        if (!Array.isArray(data.recent) || !Array.isArray(data.upcoming)) return null;

        var keys = ['tournaments_played', 'tournaments_upcoming', 'teams_registered',
            'players_estimated', 'organizers', 'cities'];
        for (var i = 0; i < keys.length; i++) {
            if (toCount(data.stats[keys[i]]) === null) return null;
        }

        return {
            recent: normalizeList(data.recent, function (t) { return normalizeTournament(t, false); }, MAX_RECENT),
            upcoming: normalizeList(data.upcoming, function (t) { return normalizeTournament(t, true); }, MAX_UPCOMING)
        };
    }

    function hasTickets(model) {
        return !!model && (model.recent.length > 0 || model.upcoming.length > 0);
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

    // Resolves to a valid render model with tickets or rejects. Shared across sections.
    function loadModel() {
        if (payloadPromise) return payloadPromise;
        payloadPromise = fetchShowcase().then(function (data) {
            var model = normalizePayload(data);
            if (!hasTickets(model)) throw new Error('showcase_unavailable');
            writeCache(data);
            return model;
        });
        return payloadPromise;
    }

    // Explicitly fictive payload (« Démo · … », « Démoville »), only ever used
    // behind ?showcase=demo. Stats exist solely to pass the contract check.
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

    function initialsBadge(name) {
        var span = el('span', 'showcase-avatar showcase-avatar--initials showcase-avatar--sm', initials(name));
        span.setAttribute('aria-hidden', 'true');
        return span;
    }

    function avatar(name, logoUrl) {
        if (!logoUrl) return initialsBadge(name);
        var img = document.createElement('img');
        img.className = 'showcase-avatar showcase-avatar--sm';
        img.alt = 'Logo de ' + name;
        img.width = 32;
        img.height = 32;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.addEventListener('error', function () {
            if (img.parentNode) img.parentNode.replaceChild(initialsBadge(name), img);
        }, { once: true });
        img.src = logoUrl;
        return img;
    }

    /* ---------- Components ---------- */

    // The rail title is the section's h2, so ticket titles are h3.
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
        body.appendChild(el('h3', 'showcase-ticket-title', t.title));

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
            org.appendChild(avatar(t.organizerName, t.organizerLogoUrl));
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

    function hideSection(section) {
        var wasVisible = !section.hidden;
        section.hidden = true;
        clear(section.querySelector('[data-showcase-rail]'));
        if (wasVisible) window.dispatchEvent(new Event('yamatch:showcase-layout'));
    }

    function render(section, model, demo) {
        var variant = section.getAttribute('data-showcase-variant') === 'organizer' ? 'organizer' : 'participant';
        var block = section.querySelector('[data-showcase-rail-block]');
        var rail = section.querySelector('[data-showcase-rail]');
        if (!block || !rail) throw new Error('showcase_markup_missing');

        var items = variant === 'organizer'
            ? model.recent.slice(0, MAX_ORGANIZER_RAIL).map(function (t) { return ticket(t, 'played', demo); })
            : model.upcoming.map(function (t) { return ticket(t, 'upcoming', demo); })
                .concat(model.recent.map(function (t) { return ticket(t, 'played', demo); }));

        // The rail is the section's only content: nothing to show, no section.
        if (!items.length) {
            hideSection(section);
            return;
        }

        if (demo && !section.querySelector('.showcase-demo-note')) {
            var note = el('p', 'showcase-demo-note', 'Aperçu démo — données fictives, non publiées');
            section.insertBefore(note, section.firstElementChild);
        }

        clear(rail);
        items.forEach(function (node) { rail.appendChild(node); });
        section.hidden = false;
        wireRailNav(block, rail);
        window.dispatchEvent(new Event('yamatch:showcase-layout'));
    }

    // Any throw while building the DOM must not leave a half-rendered section.
    function safeRender(section, model, demo) {
        try {
            render(section, model, demo);
        } catch (e) {
            hideSection(section);
        }
    }

    // The section stays `hidden` until a valid model is fully rendered:
    // no placeholder, so a missing or failing RPC never shifts the layout.
    function start(section) {
        if (isDemo) {
            safeRender(section, normalizePayload(demoPayload()), true);
            return;
        }
        var cachedModel = normalizePayload(readCache());
        if (hasTickets(cachedModel)) {
            safeRender(section, cachedModel, false);
            return;
        }
        loadModel().then(function (model) {
            safeRender(section, model, false);
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
