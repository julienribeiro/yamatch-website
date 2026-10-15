(() => {
    'use strict';

    const faq = document.querySelector('.org-page #faq');
    if (!faq) return;

    faq.querySelectorAll('.faq-toggle').forEach((toggle) => {
        const item = toggle.closest('.faq-item');
        const answer = document.getElementById(toggle.getAttribute('aria-controls'));
        if (!item || !answer || !item.contains(answer)) return;

        toggle.addEventListener('click', () => {
            const isOpen = item.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
            answer.setAttribute('aria-hidden', String(!isOpen));
            answer.toggleAttribute('inert', !isOpen);
        });
    });
})();
