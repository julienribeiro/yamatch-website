(function () {
  'use strict';
  const year = document.getElementById('copyrightYear');
  if (year) year.textContent = String(new Date().getFullYear());
  const card = document.querySelector('[data-org-hero]');
  if (!card) return;
  const phones = card.querySelector('.org-hero-phones');
  // These screenshots share a fixed status-bar position; the overlay follows
  // their existing entrance, rotation and responsive scale as a child.
  const phoneClocks = Array.from(card.querySelectorAll('.org-hero-phone > .org-rise'), (phone) => {
    const clock = document.createElement('span');
    clock.className = 'org-hero-phone-clock';
    clock.setAttribute('aria-hidden', 'true');
    phone.appendChild(clock);
    return clock;
  });
  if (phoneClocks.length) {
    const parisTime = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    const MINUTE_MS = 60000;
    let clockTimer;
    function updatePhoneClocks() {
      clearTimeout(clockTimer);
      const now = new Date();
      const time = parisTime.format(now);
      phoneClocks.forEach((clock) => { clock.textContent = time; });
      if (!document.hidden) {
        clockTimer = setTimeout(updatePhoneClocks, MINUTE_MS - now.getTime() % MINUTE_MS);
      }
    }
    document.addEventListener('visibilitychange', updatePhoneClocks);
    window.addEventListener('pageshow', updatePhoneClocks);
    window.addEventListener('pagehide', () => clearTimeout(clockTimer));
    updatePhoneClocks();
  }
  const buttons = card.querySelector('.hero-buttons');
  const wordmark = document.querySelector('.wordmark');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const links = Array.from(card.querySelectorAll('.org-hero-btn'));
  const MAX_LIFT = 48;
  const SCROLL_FACTOR = 0.12;
  // Preserve clearance for the magnetic buttons and their 1.03 scale.
  const SAFE_GAP = 28;
  let maxLift = 0;
  let frame = 0;
  const pointerEnabled = () => !reduce.matches && finePointer.matches;

  function render() {
    frame = 0;
    const y = Math.max(0, window.scrollY);
    if (wordmark) wordmark.classList.toggle('is-condensed', y > 40);
    if (phones) phones.style.setProperty('--lift', (reduce.matches ? 0 : Math.min(maxLift, y * SCROLL_FACTOR)).toFixed(1) + 'px');
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }
  function measure() {
    if (phones && buttons) {
      // Layout offsets exclude entrance animations and the scroll-lift transition.
      const gap = phones.offsetTop - buttons.offsetTop - buttons.offsetHeight;
      maxLift = Math.max(0, Math.min(MAX_LIFT, gap - SAFE_GAP));
    }
    schedule();
  }
  function resetPointer() {
    links.forEach((link) => {
      link.style.translate = '';
      link.style.scale = '';
    });
  }
  function preferencesChanged() {
    resetPointer();
    measure();
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pageshow', measure);
  [reduce, finePointer].forEach((query) => query.addEventListener('change', preferencesChanged));
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    if (buttons) observer.observe(buttons);
  }
  if (document.fonts) document.fonts.ready.then(measure);

  links.forEach((link) => {
    let restRect;
    link.addEventListener('pointerenter', () => {
      if (pointerEnabled()) restRect = link.getBoundingClientRect();
    });
    link.addEventListener('pointermove', (event) => {
      if (!pointerEnabled() || !restRect) return;
      const x = Math.max(-16, Math.min(16, (event.clientX - restRect.left - restRect.width / 2) * 0.22));
      const y = Math.max(-8, Math.min(8, (event.clientY - restRect.top - restRect.height / 2) * 0.28));
      link.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      link.style.scale = '1.03';
    });
    link.addEventListener('pointerleave', () => {
      restRect = null;
      link.style.translate = '';
      link.style.scale = '';
    });
  });
  measure();
})();
