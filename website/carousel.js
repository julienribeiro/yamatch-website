(function () {
    'use strict';

    // === Carousel: JS-driven gesture state machine (wheel + touch) ===
    // Wheel: once |wheelAccum| crosses WHEEL_THRESHOLD, the carousel advances by one slide.
    // After a snap or rubber-band, gestureLocked blocks additional triggers until horizontal
    // wheel events have been silent for GESTURE_RELEASE_SILENCE_MS. This prevents one strong
    // trackpad gesture from triggering multiple slides while keeping quick navigation responsive.
    //
    // Mobile: first and last slides are centerable. Desktop: slides 0 and N-1 remain edge
    // sentinels and are not centerable.
    {
        const viewport = document.querySelector('.hero-carousel-embla');
        const container = document.querySelector('.hero-carousel-embla--container');
        const slides = container ? Array.from(container.querySelectorAll('.hero-carousel-embla--slide')) : [];

        if (viewport && container && slides.length > 0) {
            const mobileCarouselQuery = window.matchMedia('(max-width: 767px)');
            // Defensive declaration: script.js's page-scroll block sets
            // `viewport.dataset.horizontalReady = 'true'` for reduced-motion users
            // at setup, but if the page-scroll block is somehow skipped (e.g. one
            // of the `.hero-card` / `.hero` queries fails) reduced-motion users
            // would otherwise stay locked out of the carousel forever. Reading
            // the media query here too guarantees they can always navigate.
            const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

            // Gate the horizontal-navigation handlers (wheel + touchstart) on the
            // active phone being fully retracted into its row position. script.js
            // owns the truth: it writes 'true' inside its rAF page-scroll writer
            // when `progress >= 0.995`, and 'false' otherwise. Default at setup
            // is 'false' (locked) so the carousel can't intercept gestures while
            // the phone is still lifted above the hero-card buttons. Reduced
            // motion bypass is OR'd in defensively (see comment above).
            const isHorizontalReady = () =>
                viewport.dataset.horizontalReady === 'true' || reduceMotionQuery.matches;

            const WHEEL_THRESHOLD = 45;
            const GESTURE_LOCK_MIN_MS = 0;
            const GESTURE_RELEASE_SILENCE_MS = 30;
            const SILENCE_RESET_MS = 30;
            const RUBBER_BAND_DISTANCE = 70;
            const RUBBER_BAND_DURATION_MS = 280;
            // Touch gesture-intent lock — see touchmove handler for the full state-machine.
            // TOUCH_INTENT_THRESHOLD: minimum px of finger travel (on either axis) before
            // the handler decides whether the gesture is `vertical` (page scroll) or
            // `horizontal` (carousel swipe). 10 px is large enough to outwait the natural
            // tremor when a finger lands on glass yet small enough that the user perceives
            // no lag before the carousel starts following.
            // TOUCH_HORIZONTAL_RATIO: dominance ratio that confirms an intent. With 1.35,
            // the dominant axis must be ≥ 35 % larger than the cross axis to win — diagonal
            // gestures inside that wedge stay ambiguous and the handler waits for more
            // motion. Empirically tuned to absorb the small horizontal drift of a vertical
            // page-scroll thumb-swipe (the bug we're fixing) without making clean
            // horizontal swipes feel sluggish.
            const TOUCH_INTENT_THRESHOLD = 10;
            const TOUCH_HORIZONTAL_RATIO = 1.35;

            let activeIndex = slides.findIndex((s) => s.classList.contains('active'));
            if (activeIndex < 0) activeIndex = 0;

            let wheelAccum = 0;
            let gestureLocked = false;
            let gestureUnlockTimer = null;
            let lastWheelAt = 0;

            const getCarouselBounds = () => {
                if (mobileCarouselQuery.matches) {
                    return { min: 0, max: slides.length - 1 };
                }

                return { min: 1, max: slides.length - 2 };
            };

            const isValidCarouselIndex = (idx) => {
                const bounds = getCarouselBounds();
                return idx >= bounds.min && idx <= bounds.max;
            };

            const lockGesture = () => {
                gestureLocked = true;

                if (gestureUnlockTimer) {
                    clearTimeout(gestureUnlockTimer);
                    gestureUnlockTimer = null;
                }
            };

            const unlockGesture = () => {
                gestureLocked = false;
                gestureUnlockTimer = null;
                wheelAccum = 0;
            };

            const scheduleGestureUnlock = () => {
                if (gestureUnlockTimer) {
                    clearTimeout(gestureUnlockTimer);
                }

                gestureUnlockTimer = window.setTimeout(() => {
                    const now = performance.now();
                    const timeSinceLastWheel = now - lastWheelAt;

                    if (timeSinceLastWheel < GESTURE_RELEASE_SILENCE_MS) {
                        gestureUnlockTimer = window.setTimeout(() => {
                            const retryNow = performance.now();
                            const retryTimeSinceLastWheel = retryNow - lastWheelAt;

                            if (retryTimeSinceLastWheel < GESTURE_RELEASE_SILENCE_MS) {
                                scheduleGestureUnlock();
                                return;
                            }

                            unlockGesture();
                        }, GESTURE_RELEASE_SILENCE_MS - timeSinceLastWheel);
                        return;
                    }

                    unlockGesture();
                }, GESTURE_LOCK_MIN_MS);
            };

            let touchStartX = 0;
            let touchStartY = 0;
            let touchCurrentDx = 0;
            let touchBaseOffset = 0;
            let touching = false;
            // touchIntent: null until the first significant move is observed, then locked
            // to 'vertical' (let native page scroll handle the gesture, no transform writes,
            // no snap on touchend) or 'horizontal' (live-follow + snap, current behaviour).
            // Resetting to null in touchstart / touchend / touchcancel guarantees every new
            // gesture re-evaluates intent from scratch.
            let touchIntent = null;
            let wheelIdleTimer = null;

            const getCurrentTranslateX = () => {
                const transform = window.getComputedStyle(container).transform;

                if (!transform || transform === 'none') {
                    return 0;
                }

                try {
                    return new DOMMatrixReadOnly(transform).m41;
                } catch (_) {
                    const matrix = transform.match(/matrix\(([^)]+)\)/);
                    if (!matrix) return 0;

                    const values = matrix[1].split(',').map((value) => parseFloat(value.trim()));
                    return Number.isFinite(values[4]) ? values[4] : 0;
                }
            };

            const computeOffsetForIndex = (idx) => {
                const slide = slides[idx];
                if (!slide) return getCurrentTranslateX();

                const currentTranslateX = getCurrentTranslateX();
                const slideRect = slide.getBoundingClientRect();
                const slideCenter = slideRect.left + slideRect.width / 2;
                const viewportCenter = window.innerWidth / 2;

                return currentTranslateX + (viewportCenter - slideCenter);
            };

            const setActiveIndex = (idx) => {
                const bounds = getCarouselBounds();
                const clamped = Math.max(bounds.min, Math.min(bounds.max, idx));

                if (slides[activeIndex]) slides[activeIndex].classList.remove('active');
                if (slides[clamped]) slides[clamped].classList.add('active');

                activeIndex = clamped;
                container.style.transform = `translate3d(${computeOffsetForIndex(clamped)}px, 0, 0)`;
            };

            const rubberBand = (dir) => {
                const baseOffset = computeOffsetForIndex(activeIndex);
                const overshootOffset = baseOffset - dir * RUBBER_BAND_DISTANCE;

                container.style.transition = `transform ${RUBBER_BAND_DURATION_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`;
                container.style.transform = `translate3d(${overshootOffset}px, 0, 0)`;

                setTimeout(() => {
                    container.style.transform = `translate3d(${baseOffset}px, 0, 0)`;
                    setTimeout(() => {
                        container.style.transition = '';
                    }, RUBBER_BAND_DURATION_MS);
                }, RUBBER_BAND_DURATION_MS);

                lockGesture();
                scheduleGestureUnlock();
            };

            const wheelIdleHandler = () => {
                wheelIdleTimer = null;
                wheelAccum = 0;
            };

            viewport.addEventListener('wheel', (e) => {
                if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
                if (e.deltaX === 0) return;

                if (!isHorizontalReady()) {
                    // Page-scroll-progress hasn't yet retracted the active phone
                    // into the row (`progress < 0.995`) — the carousel must NOT
                    // intercept horizontal trackpad gestures: the user might be
                    // doing a diagonal scroll whose horizontal component is
                    // incidental, and capturing it now would block the vertical
                    // page scroll that's about to bring the carousel into its
                    // ready state. Reset `wheelAccum` so any pre-ready
                    // micro-jiggle doesn't carry over and snap the moment the
                    // gate opens. We also do NOT call `preventDefault()`, NOT
                    // stamp `lastWheelAt`, NOT mutate `gestureLocked` — leave
                    // the browser to handle the wheel event natively.
                    wheelAccum = 0;
                    return;
                }

                lastWheelAt = performance.now();
                e.preventDefault();

                if (gestureLocked) {
                    return;
                }

                wheelAccum += e.deltaX;

                if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD) {
                    const dir = wheelAccum > 0 ? 1 : -1;
                    const targetIdx = activeIndex + dir;

                    if (isValidCarouselIndex(targetIdx)) {
                        setActiveIndex(targetIdx);
                        lockGesture();
                        scheduleGestureUnlock();
                    } else {
                        rubberBand(dir);
                    }

                    wheelAccum = 0;

                    if (wheelIdleTimer) {
                        clearTimeout(wheelIdleTimer);
                        wheelIdleTimer = null;
                    }

                    return;
                }

                if (wheelIdleTimer) clearTimeout(wheelIdleTimer);
                wheelIdleTimer = window.setTimeout(wheelIdleHandler, SILENCE_RESET_MS);
            }, { passive: false });

            viewport.addEventListener('touchstart', (e) => {
                if (e.touches.length === 0) return;
                if (gestureLocked) return;
                if (!isHorizontalReady()) {
                    // Same handshake as the wheel handler: refuse to start a
                    // touch gesture while the active phone is still lifted above
                    // the hero buttons. By NOT setting `touching = true`, both
                    // `touchmove` and `touchend` early-return on their existing
                    // `if (!touching) return;` guards (lines below), so no
                    // live-follow transform is written and no snap fires. The
                    // browser handles the touch as a normal vertical scroll
                    // gesture — exactly the desired behaviour while the lift is
                    // still in play.
                    return;
                }

                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchCurrentDx = 0;
                // Intent is undecided at touchstart — the touchmove handler will set it
                // to 'vertical' or 'horizontal' once the finger has travelled enough
                // (TOUCH_INTENT_THRESHOLD on either axis) and one axis dominates the
                // other by TOUCH_HORIZONTAL_RATIO. Until then, no transform write fires.
                touchIntent = null;
                // Snapshot the resting transform so touchmove can write a live
                // translate that follows the finger in real time. Captured pre-move
                // so it reflects the centered position of the current activeIndex,
                // not any in-flight interpolation.
                touchBaseOffset = computeOffsetForIndex(activeIndex);
                touching = true;
                // NB: no container.style.transform / .transition write here — the
                // handler must stay neutral until intent is determined, otherwise a
                // diagonal-but-mostly-vertical scroll would still get interpreted as a
                // (zero-px) horizontal swipe and cancel the running CSS transition.
            }, { passive: true });

            viewport.addEventListener('touchmove', (e) => {
                if (!touching || e.touches.length !== 1) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const dx = currentX - touchStartX;
                const dy = currentY - touchStartY;
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);

                // Intent-detection phase. Until one axis travels far enough AND clearly
                // dominates the other, the handler is silent: no transform write, no
                // preventDefault (listener is { passive: true } anyway), so the browser
                // is free to perform native vertical scroll. This is the fix for the
                // mobile bug where a near-vertical scroll with a small horizontal
                // component caused a parasite horizontal nudge of the carousel.
                if (touchIntent === null) {
                    // Not enough total movement yet to decide — wait.
                    if (absDx < TOUCH_INTENT_THRESHOLD && absDy < TOUCH_INTENT_THRESHOLD) {
                        return;
                    }

                    // Vertical clearly dominates → release the gesture to native scroll.
                    if (absDy > absDx * TOUCH_HORIZONTAL_RATIO) {
                        touchIntent = 'vertical';
                        touchCurrentDx = 0;
                        return;
                    }

                    // Horizontal clearly dominates → fall through to live-follow below.
                    if (absDx > absDy * TOUCH_HORIZONTAL_RATIO) {
                        touchIntent = 'horizontal';
                    } else {
                        // Ambiguous diagonal (dx ≈ dy) — keep waiting for the gesture
                        // to clarify rather than guess. The finger will quickly resolve
                        // toward one axis as the user commits to a direction.
                        return;
                    }
                }

                // Vertical lock is sticky for the rest of the gesture: never write a
                // transform once we've decided the user is scrolling the page.
                if (touchIntent === 'vertical') {
                    return;
                }

                // touchIntent === 'horizontal' — live-follow as before. Bypass the CSS
                // snap transition and pin the container directly under the finger.
                // Touch-only — wheel keeps no live-follow (trackpad inertia would
                // extend the drag beyond the user's intent).
                touchCurrentDx = dx;
                container.style.transition = 'none';
                container.style.transform = `translate3d(${touchBaseOffset + dx}px, 0, 0)`;
            }, { passive: true });

            viewport.addEventListener('touchend', () => {
                if (!touching) return;

                // Vertical or undecided gesture — the carousel never wrote a transform,
                // never disabled the CSS transition, never moved. Just clear the state
                // and let the native vertical scroll continue uninterrupted. NO snap,
                // NO rubberBand, NO setActiveIndex (which would emit a transform write
                // and could nudge the carousel by a sub-pixel rounding amount).
                if (touchIntent !== 'horizontal') {
                    touching = false;
                    touchIntent = null;
                    touchCurrentDx = 0;
                    return;
                }

                // Horizontal intent — restore the default 440ms ease-in-out-cubic
                // transition declared in styles.css so the snap (or snap-back for
                // sub-threshold) animates.
                container.style.transition = '';

                if (Math.abs(touchCurrentDx) >= 50) {
                    const dir = touchCurrentDx < 0 ? 1 : -1;
                    const targetIdx = activeIndex + dir;

                    if (isValidCarouselIndex(targetIdx)) {
                        setActiveIndex(targetIdx);
                        lockGesture();
                        scheduleGestureUnlock();
                    } else {
                        rubberBand(dir);
                    }
                } else {
                    // Sub-threshold: live-follow displaced the container, so we must
                    // re-issue the centered transform for the current activeIndex.
                    // The restored CSS transition animates the snap-back smoothly.
                    setActiveIndex(activeIndex);
                }

                touching = false;
                touchIntent = null;
                touchCurrentDx = 0;
            }, { passive: true });

            viewport.addEventListener('touchcancel', () => {
                if (!touching) return;

                // Only the horizontal-intent branch ever wrote a transform / disabled
                // the transition, so it's the only branch that needs a snap-back. For
                // vertical or undecided cancels we just clear state — the carousel's
                // visual position is already untouched.
                if (touchIntent === 'horizontal') {
                    container.style.transition = '';
                    setActiveIndex(activeIndex);
                }

                touching = false;
                touchIntent = null;
                touchCurrentDx = 0;
            }, { passive: true });

            requestAnimationFrame(() => requestAnimationFrame(() => setActiveIndex(activeIndex)));
            window.addEventListener('load', () => setActiveIndex(activeIndex));

            let resizeRaf = null;
            window.addEventListener('resize', () => {
                if (resizeRaf) return;
                resizeRaf = requestAnimationFrame(() => {
                    resizeRaf = null;
                    setActiveIndex(activeIndex);
                });
            }, { passive: true });
        }
    }

})();
