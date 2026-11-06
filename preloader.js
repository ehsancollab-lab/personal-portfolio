// A minimal document-entry portrait and counter with a bounded fade-out.
(() => {
  'use strict';
  if (window.portfolioPreloader) return;
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const previousBusy = root.getAttribute('aria-busy');
  const inertNodes = new Map();
  const progressStartsAt = 100, progressDuration = 3000, revealAt = 3200;
  let overlay, mountedAt, ready = false, revealing = false, complete = false;
  let revealTimer, exitTimer, progressFrame, progressCompletedAt, lastPercent = -1;
  root.classList.add('is-preloading');
  root.dataset.preloader = 'loading';
  root.setAttribute('aria-busy', 'true');

  function restorePage() {
    root.classList.remove('is-preloading');
    for (const [node, wasInert] of inertNodes) node.inert = wasInert;
    inertNodes.clear();
  }
  function finish() {
    if (complete) return;
    complete = true;
    clearTimeout(deadline); clearTimeout(revealTimer); clearTimeout(exitTimer);
    cancelAnimationFrame(progressFrame);
    restorePage();
    overlay?.remove();
    root.dataset.preloader = 'complete';
    if (previousBusy === null) root.removeAttribute('aria-busy');
    else root.setAttribute('aria-busy', previousBusy);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('readystatechange', mount);
    document.removeEventListener('DOMContentLoaded', mount);
    window.removeEventListener('resize', onResize);
    reduced.removeEventListener('change', onMotionChange);
  }
  function reveal(immediate = false) {
    if (complete || revealing) return;
    revealing = true;
    clearTimeout(revealTimer);
    if (!overlay || immediate || reduced.matches) { finish(); return; }
    restorePage();
    root.dataset.preloader = 'revealing';
    overlay.dataset.phase = 'exit';
    exitTimer = setTimeout(finish, 420);
  }
  function scheduleReveal() {
    if (!overlay || !ready || complete || revealing) return;
    clearTimeout(revealTimer);
    if (!reduced.matches && progressCompletedAt === undefined) return;
    const now = performance.now();
    const delay = reduced.matches ? 0 : Math.max(0, mountedAt + revealAt - now, progressCompletedAt + 100 - now);
    revealTimer = setTimeout(() => reveal(), delay);
  }
  function updateProgress(now) {
    if (!overlay || complete || revealing) return;
    const fraction = Math.max(0, Math.min(1, (now - mountedAt - progressStartsAt) / progressDuration));
    const percent = reduced.matches && ready ? 100 : Math.min(ready ? 100 : 99, Math.floor(fraction * 100));
    const progress = overlay.querySelector('.intro-progress');
    if (percent !== lastPercent) {
      lastPercent = percent;
      progress.setAttribute('aria-valuenow', String(percent));
      progress.querySelector('.intro-percentage').textContent = percent + '%';
    }
    if (percent === 100) { progressCompletedAt = now; scheduleReveal(); }
    else progressFrame = requestAnimationFrame(updateProgress);
  }
  function onKey(event) {
    if (event.key === 'Escape' || event.key === 'Tab' || event.key === 'Enter') {
      if (revealing) finish(); else reveal(true);
    } else if ([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key) && !revealing) event.preventDefault();
  }
  function onResize() { if (revealing) finish(); }
  function onMotionChange() { if (reduced.matches && ready) { if (revealing) finish(); else reveal(true); } }
  function mount() {
    if (overlay || complete || !document.body) return;
    mountedAt = performance.now();
    overlay = document.createElement('div');
    overlay.id = 'site-preloader'; overlay.className = 'site-preloader';
    overlay.setAttribute('role', 'status'); overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML =
      '<span class="visually-hidden">Opening Ehsan Masoomi’s portfolio</span>' +
      '<div class="intro-composition" dir="ltr">' +
        '<span class="portrait-badge intro-avatar" aria-hidden="true"><img src="./assets/home/book-avatar.webp" width="38" height="38" alt="" /></span>' +
        '<span class="intro-divider" aria-hidden="true">/</span>' +
        '<div class="intro-progress" role="progressbar" aria-label="Opening portfolio" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-live="off"><span class="intro-percentage">0%</span></div>' +
      '</div>';
    for (const node of document.body.children) {
      if (node.matches('script, style, link')) continue;
      inertNodes.set(node, node.inert); node.inert = true;
    }
    overlay.addEventListener('wheel', event => { if (!revealing) event.preventDefault(); }, { passive: false });
    overlay.addEventListener('touchmove', event => { if (!revealing) event.preventDefault(); }, { passive: false });
    document.body.append(overlay);
    progressFrame = requestAnimationFrame(updateProgress);
    // The loader never depends on the large application download.
    Promise.race([document.fonts?.ready, new Promise(resolve => setTimeout(resolve, 600))])
      .then(() => { ready = true; scheduleReveal(); });
    scheduleReveal();
  }

  // Fail open even when the application bundle cannot load.
  const deadline = setTimeout(finish, 4500);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);
  reduced.addEventListener('change', onMotionChange);
  window.addEventListener('pageshow', event => { if (event.persisted) finish(); });
  window.portfolioPreloader = {
    get active() { return !complete; },
    ready() {
      if (complete || ready) return;
      const critical = [...document.querySelectorAll('.home-portrait, .book-quote-portrait, .nav-home-avatar img')].map(image => image.decode().catch(() => {}));
      Promise.race([
        Promise.allSettled([document.fonts?.ready, ...critical]),
        new Promise(resolve => setTimeout(resolve, 900))
      ]).then(() => { ready = true; scheduleReveal(); });
    }
  };
  if (document.readyState !== 'loading') mount();
  else {
    document.addEventListener('readystatechange', mount);
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  }
})();
