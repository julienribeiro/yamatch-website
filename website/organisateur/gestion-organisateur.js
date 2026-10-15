(() => {
  'use strict';
  const root = document.getElementById('gestion-tournoi');
  if (!root) return;
  const steps = [...root.querySelectorAll('.ym-gest-step')];
  const screens = [...root.querySelectorAll('.ym-gest-screen')];
  const viewport = root.querySelector('.ym-gest-viewport');
  const strip = root.querySelector('.ym-gest-steps');
  const stage = root.querySelector('.ym-gest-stage');
  const grid = root.querySelector('.ym-gest-grid');
  const description = root.querySelector('.ym-gest-mobile-description');
  const sticker = root.querySelector('.ym-gest-sticker');
  const requirements = [['.ym-demo-create-scroll'], ['[data-demo-present]', '[data-demo-pending-label]', '[data-demo-checkin-label]', '.ym-demo-checkin-team small', '[data-demo-action]'],
    ['.ym-demo-moving-team', '.ym-demo-drop', '.ym-demo-pool-trigger', '.ym-demo-scroll', '[data-demo-action]'],
    ['[data-demo-actions]', '.ym-demo-task-resolved > span:nth-child(2)', '[data-demo-action]'],
    ['[data-demo-score="a"]', '[data-demo-score="b"]', '[data-demo-set]'], ['[role="switch"]'], ['.ym-demo-bracket-scroll'], ['.ym-demo-table-scroll']];
  if (steps.length !== 8 || screens.length !== 8
    || ![viewport, strip, stage, grid, description, sticker].every(Boolean)
    || steps.some((step) => !step.querySelector('.ym-gest-name') || !step.querySelector('.ym-gest-desc'))
    || screens.some((screen, index) => !screen.querySelector('.ym-demo-app') || requirements[index].some((selector) => !screen.querySelector(selector)))
    || screens[2].querySelectorAll('.ym-demo-pool .ym-demo-line small').length !== 2
    || !screens[3].querySelector('.ym-demo-task-resolved > span:nth-child(2)').firstChild) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 880px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const desktopWheel = matchMedia('(min-width: 1025px) and (hover: hover) and (pointer: fine)');
  // A finite scene needs no playback toolbar and leaves its result available to inspect.
  const DURATION = 4800;
  const PHASE_DURATION = 1000;
  const WHEEL_THRESHOLD = 40;
  const WHEEL_SILENCE_MS = 240;
  const captions = ['6 étapes, c’est parti', 'Le pointage, sans paperasse', 'Les équipes trouvent leur place', 'Tout est sous contrôle', 'Chaque point compte', 'Une équipe au repos prend le relais', 'Direction la finale', 'Les résultats sont prêts'];
  let current = 0;
  let elapsed = 0;
  let last = null;
  let frame = null;
  let visible = false;
  let hovered = false;
  let focused = false;
  let userPaused = false;
  let phase = -1;
  let score = { a: 16, b: 13 };
  let manuallyChanged = false;
  // Layout offsets remain in app points; scale is applied only to the outer canvas.
  const positionPoolTrigger = () => {
    const screen = screens[2];
    const row = screen.querySelector('.ym-demo-moving-team');
    const target = screen.querySelector('.ym-demo-drop');
    const trigger = screen.querySelector('.ym-demo-pool-trigger');
    const scroll = screen.querySelector('.ym-demo-scroll');
    const destination = screen.classList.contains('is-complete') ? target : row;
    const ratio = viewport.clientWidth / 402;
    const left = destination.offsetLeft;
    const top = destination.offsetTop - scroll.scrollTop;
    const height = Math.max(row.offsetHeight, 44 / ratio);
    const transfer = target.offsetTop - row.offsetTop;
    trigger.style.left = left + 'px';
    trigger.style.top = top + 'px';
    trigger.style.width = '44px';
    trigger.style.height = height + 'px';
    screen.style.setProperty('--ym-demo-transfer-y', transfer + 'px');
  };
  let poolFrame = null;
  const schedulePoolTrigger = () => {
    if (poolFrame !== null) return;
    poolFrame = requestAnimationFrame(() => {
      poolFrame = null;
      positionPoolTrigger();
    });
  };
  const fitCanvas = () => {
    root.style.setProperty('--ym-demo-scale', String(viewport.clientWidth / 402));
    positionPoolTrigger();
  };
  const stopped = () => motion.matches || userPaused || elapsed >= DURATION || !visible || document.hidden || hovered || focused;
  const setScore = () => {
    root.querySelector('[data-demo-score="a"]').textContent = score.a;
    root.querySelector('[data-demo-score="b"]').textContent = score.b;
    screens[4].style.setProperty('--ym-demo-score-progress', Math.min(Math.max(score.a, score.b) / 25, 1) * 100 + '%');
    root.querySelector('[data-demo-set]').textContent = `${score.a} – ${score.b}`;
  };
  const complete = (done) => {
    const screen = screens[current];
    screen.classList.toggle('is-complete', done);
    if (current === 1) {
      screen.querySelector('[data-demo-present]').textContent = done ? '6' : '5';
      const status = screen.querySelector('.ym-demo-checkin-team small');
      status.textContent = done ? 'Présente' : 'À pointer';
      status.classList.toggle('is-pending', !done);
      const pendingLabel = done ? '1 équipe à pointer' : '2 équipes à pointer';
      screen.querySelector('[data-demo-pending-label]').textContent = pendingLabel;
      screen.querySelector('[data-demo-checkin-label]').textContent = pendingLabel;
      screen.querySelector('[data-demo-action]').setAttribute('aria-label', done ? 'Annuler le pointage des Smashers' : 'Pointer Les Smashers');
    }
    if (current === 2) {
      const row = screen.querySelector('.ym-demo-moving-team');
      const target = screen.querySelector('.ym-demo-drop');
      screen.style.setProperty('--ym-demo-transfer-y', `${target.offsetTop - row.offsetTop}px`);
      const counts = screen.querySelectorAll('.ym-demo-pool .ym-demo-line small');
      counts[0].textContent = done ? '3 inscrits' : '4 inscrits';
      counts[1].textContent = done ? '5 inscrits' : '4 inscrits';
      screen.querySelector('[data-demo-action]').setAttribute('aria-label', done ? 'Remettre Net Flix dans la poule A' : 'Déplacer Net Flix vers la poule B');
      positionPoolTrigger();
    }
    if (current === 3) {
      screen.querySelector('[data-demo-actions]').textContent = done ? '1' : '2';
      screen.querySelector('[data-demo-action]').setAttribute('aria-label', done ? 'Annuler la validation du score' : 'Valider le score');
      screen.querySelector('.ym-demo-task-resolved > span:nth-child(2)').firstChild.textContent = done ? 'Score validé' : 'Score à valider';
    }
    if (current === 5) screen.querySelector('[role="switch"]').setAttribute('aria-checked', String(done));
  };
  const scene = (nextPhase) => {
    if (phase === nextPhase) return;
    phase = nextPhase;
    screens[current].dataset.phase = String(phase);
    if (current === 0 && !manuallyChanged) {
      const scroll = screens[0].querySelector('.ym-demo-create-scroll');
      scroll.scrollTo({ top: phase >= 2 ? scroll.scrollHeight : 0, behavior: motion.matches ? 'auto' : 'smooth' });
    }
    if (current === 6 && !manuallyChanged) {
      screens[6].querySelector('.ym-demo-bracket-scroll').scrollTo({ left: phase >= 3 ? 328 : 0, behavior: motion.matches ? 'auto' : 'smooth' });
    }
    if (!manuallyChanged && [1, 2, 3, 5].includes(current)) complete(phase >= 2);
    if (!manuallyChanged && current === 4) {
      score = [{a:16,b:13}, {a:17,b:13}, {a:17,b:14}, {a:18,b:14}, {a:18,b:15}][phase];
      setScore();
    }
  };
  const sync = () => {
    const paused = stopped();
    root.classList.toggle('is-paused', paused);
    if (paused) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      last = null;
    } else if (frame === null) frame = requestAnimationFrame(tick);
  };
  const centerStep = () => {
    if (!narrow.matches) return;
    const item = steps[current].getBoundingClientRect();
    const bounds = strip.getBoundingClientRect();
    strip.scrollTo({ left: strip.scrollLeft + item.left - bounds.left - (bounds.width - item.width) / 2, behavior: motion.matches ? 'auto' : 'smooth' });
  };
  const activate = (index, announce = false) => {
    current = index;
    elapsed = 0;
    last = null;
    phase = -1;
    userPaused = false;
    manuallyChanged = false;
    score = { a: 16, b: 13 };
    setScore();
    screens.forEach((screen, i) => {
      screen.classList.toggle('is-on', i === index);
      screen.setAttribute('aria-hidden', String(i !== index));
      screen.inert = i !== index;
      screen.classList.remove('is-complete');
      screen.dataset.phase = '0';
      screen.querySelectorAll('.ym-demo-scroll, .ym-demo-bracket-scroll, .ym-demo-table-scroll').forEach((area) => area.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    });
    steps.forEach((step, i) => {
      step.classList.toggle('is-on', i === index);
      step.setAttribute('aria-pressed', String(i === index));
    });
    viewport.setAttribute('aria-label', steps[index].querySelector('.ym-gest-name').textContent);
    // Automatic scenes stay quiet; only an explicit selection announces its description.
    description.setAttribute('aria-live', announce ? 'polite' : 'off');
    description.textContent = steps[index].querySelector('.ym-gest-desc').textContent;
    sticker.textContent = captions[index];
    root.style.setProperty('--ym-gest-progress', '0');
    scene(motion.matches ? 4 : 0);
    centerStep();
    sync();
  };
  const tick = (time) => {
    frame = null;
    if (stopped()) return;
    if (last !== null) elapsed += Math.min(time - last, 100);
    last = time;
    root.style.setProperty('--ym-gest-progress', String(Math.min(elapsed / DURATION, 1)));
    scene(Math.min(4, Math.floor(elapsed / PHASE_DURATION)));
    if (elapsed >= DURATION) {
      sync();
      return;
    }
    if (frame === null && !stopped()) frame = requestAnimationFrame(tick);
  };
  let wheelDelta = 0;
  let wheelDirection = 0;
  let wheelLocked = false;
  let wheelLast = -Infinity;
  const resetWheel = () => {
    wheelDelta = 0;
    wheelDirection = 0;
    wheelLocked = false;
    wheelLast = -Infinity;
  };
  grid.addEventListener('wheel', (event) => {
    if (!desktopWheel.matches || document.hidden || event.defaultPrevented || !event.cancelable
      || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
      || !event.deltaY || Math.abs(event.deltaY) <= Math.abs(event.deltaX)
      || !(event.target instanceof Element)) return;
    if (event.target.closest('.ym-demo-scroll, .ym-demo-bracket-scroll, .ym-demo-table-scroll, input, select, textarea, [contenteditable], [data-demo-action], [data-demo-score-change], [role="slider"]')) return;
    const bounds = stage.getBoundingClientRect();
    const shown = Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 0);
    if (shown < Math.min(bounds.height, innerHeight) * .7) return;

    const now = performance.now();
    if (now - wheelLast >= WHEEL_SILENCE_MS) resetWheel();
    wheelLast = now;
    const direction = Math.sign(event.deltaY);
    // Leaving either end remains ordinary page scrolling, including its momentum.
    if ((direction < 0 && current === 0) || (direction > 0 && current === steps.length - 1)) return;
    event.preventDefault();
    // Keep the whole trackpad momentum tail in the gesture that selected this step.
    if (wheelLocked) return;
    if (direction !== wheelDirection) wheelDelta = 0;
    wheelDirection = direction;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    wheelDelta += Math.abs(event.deltaY) * unit;
    if (wheelDelta < WHEEL_THRESHOLD) return;
    wheelLocked = true;
    focused = false;
    activate(current + direction, true);
  }, { passive: false });
  desktopWheel.addEventListener('change', resetWheel);
  window.addEventListener('pagehide', resetWheel);

  steps.forEach((step, i) => step.addEventListener('click', (event) => {
    if (event.detail > 0) focused = false;
    activate(i, true);
  }));
  strip.addEventListener('keydown', (event) => {
    const index = steps.indexOf(document.activeElement);
    if (index < 0 || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? 7 : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : 7)) % 8;
    steps[target].focus({ preventScroll: true });
    activate(target, true);
  });
  root.addEventListener('click', (event) => {
    const action = event.target.closest('[data-demo-action], [data-demo-score-change]');
    if (!action) return;
    userPaused = true;
    manuallyChanged = true;
    if (action.dataset.demoScoreChange) {
      const [team, delta] = action.dataset.demoScoreChange.split(':');
      score[team] = Math.max(0, Math.min(99, score[team] + Number(delta)));
      setScore();
    } else {
      if (current === 5) screens[current].dataset.phase = '2';
      complete(!screens[current].classList.contains('is-complete'));
    }
    sync();
  });
  [stage].forEach((area) => {
    area.addEventListener('pointerenter', () => { if (fine.matches) { hovered = true; sync(); } });
    area.addEventListener('pointerleave', () => { hovered = false; sync(); });
  });
  root.addEventListener('focusin', (event) => {
    focused = stage.contains(event.target) && event.target.matches(':focus-visible');
    sync();
  });
  root.addEventListener('focusout', () => queueMicrotask(() => {
    focused = stage.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
    sync();
  }));
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', () => { activate(current); });
  narrow.addEventListener('change', centerStep);
  const checkVisibility = () => {
    const bounds = stage.getBoundingClientRect();
    visible = Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 0) >= Math.min(bounds.height, innerHeight) * .25;
    sync();
  };
  window.addEventListener('pagehide', () => { visible = false; sync(); });
  window.addEventListener('pageshow', checkVisibility);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && entry.intersectionRatio >= .25; sync(); }, { threshold: [0, .25] }).observe(stage);
  } else {
    let visibilityFrame = null;
    const scheduleVisibility = () => {
      if (visibilityFrame !== null) return;
      visibilityFrame = requestAnimationFrame(() => { visibilityFrame = null; checkVisibility(); });
    };
    window.addEventListener('scroll', scheduleVisibility, { passive: true });
    window.addEventListener('resize', scheduleVisibility, { passive: true });
  }
  screens[2].querySelector('.ym-demo-scroll').addEventListener('scroll', schedulePoolTrigger, { passive: true });
  root.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.ym-demo-scroll, .ym-demo-bracket-scroll, .ym-demo-table-scroll')) return;
    userPaused = true;
    manuallyChanged = true;
    sync();
  });
  if ('ResizeObserver' in window) new ResizeObserver(fitCanvas).observe(viewport);
  else window.addEventListener('resize', fitCanvas, { passive: true });
  document.fonts.ready.then(fitCanvas);
  fitCanvas();
  root.classList.add('is-ready');
  activate(0);
  checkVisibility();
})();
