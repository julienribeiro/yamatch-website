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

            const WHEEL_THRESHOLD = 45;
            const GESTURE_LOCK_MIN_MS = 0;
            const GESTURE_RELEASE_SILENCE_MS = 30;
            const SILENCE_RESET_MS = 30;
            const RUBBER_BAND_DISTANCE = 70;
            const RUBBER_BAND_DURATION_MS = 280;

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
            let touchCurrentDx = 0;
            let touchBaseOffset = 0;
            let touching = false;
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

                touchStartX = e.touches[0].clientX;
                touchCurrentDx = 0;
                // Snapshot the resting transform so touchmove can write a live
                // translate that follows the finger in real time. Captured pre-move
                // so it reflects the centered position of the current activeIndex,
                // not any in-flight interpolation.
                touchBaseOffset = computeOffsetForIndex(activeIndex);
                touching = true;
            }, { passive: true });

            viewport.addEventListener('touchmove', (e) => {
                if (!touching || e.touches.length !== 1) return;
                touchCurrentDx = e.touches[0].clientX - touchStartX;
                // Live-follow: bypass the CSS snap transition and pin the container
                // directly under the finger. Touch-only — wheel keeps no live-follow
                // (trackpad inertia would extend the drag beyond the user's intent).
                container.style.transition = 'none';
                container.style.transform = `translate3d(${touchBaseOffset + touchCurrentDx}px, 0, 0)`;
            }, { passive: true });

            viewport.addEventListener('touchend', () => {
                if (!touching) return;
                touching = false;

                // Restore the default 440ms ease-in-out-cubic transition declared in
                // styles.css so the snap (or snap-back for sub-threshold) animates.
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
            }, { passive: true });

            viewport.addEventListener('touchcancel', () => {
                if (!touching) return;
                touching = false;
                container.style.transition = '';
                setActiveIndex(activeIndex);
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
