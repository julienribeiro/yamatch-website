(function () {
    'use strict';

    // Organiser feature cards: native scrolling, isolated from the phone carousel.
    {
        const section = document.getElementById('organisateurs');
        const track = section?.querySelector('#ym-orga-track');
        const previous = section?.querySelector('#ym-orga-prev');
        const next = section?.querySelector('#ym-orga-next');

        if (track && previous && next) {
            const cards = Array.from(track.querySelectorAll('.ym-orga-card'));
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
            let syncFrame = null;

            const syncNavigation = () => {
                syncFrame = null;
                const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
                // One CSS pixel absorbs fractional scroll-position rounding.
                previous.disabled = track.scrollLeft <= 1;
                next.disabled = track.scrollLeft >= maximum - 1;
            };
            const scheduleSync = () => {
                if (syncFrame === null) syncFrame = requestAnimationFrame(syncNavigation);
            };
            const scrollCard = (direction) => {
                const firstCard = cards[0];
                if (!firstCard) return;
                const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
                const step = firstCard.getBoundingClientRect().width + gap;
                track.scrollBy({
                    left: direction * step,
                    behavior: reducedMotion.matches ? 'auto' : 'smooth'
                });
                scheduleSync();
            };

            previous.addEventListener('click', () => scrollCard(-1));
            next.addEventListener('click', () => scrollCard(1));
            track.addEventListener('scroll', scheduleSync, { passive: true });
            window.addEventListener('resize', scheduleSync, { passive: true });
            window.addEventListener('pageshow', scheduleSync);
            if (typeof ResizeObserver === 'function') {
                const observer = new ResizeObserver(scheduleSync);
                observer.observe(track);
                cards.forEach((card) => observer.observe(card));
            }
            syncNavigation();

            cards.forEach((card) => {
                const button = card.querySelector('.ym-orga-plus');
                const detail = card.querySelector('.ym-orga-detail');
                if (!button || !detail) return;
                const closedLabel = button.getAttribute('aria-label') || 'En savoir plus';
                const setExpanded = (expanded) => {
                    detail.hidden = !expanded;
                    card.classList.toggle('ym-orga-open', expanded);
                    button.setAttribute('aria-expanded', String(expanded));
                    button.setAttribute('aria-label', expanded
                        ? closedLabel.replace('En savoir plus', 'Fermer les détails')
                        : closedLabel);
                };
                setExpanded(false);
                button.addEventListener('click', () => setExpanded(detail.hidden));
                card.addEventListener('keydown', (event) => {
                    if (event.key !== 'Escape' || detail.hidden) return;
                    event.preventDefault();
                    setExpanded(false);
                    button.focus({ preventScroll: true });
                });
            });
        }
    }
})();
