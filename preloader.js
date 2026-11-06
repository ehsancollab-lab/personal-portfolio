// A document-entry introduction. SPA navigation never mounts it again.
(() => {
  'use strict';
  if (window.portfolioPreloader) return;
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const previousBusy = root.getAttribute('aria-busy');
  const inertNodes = new Map();
  const revealAt = 4600, progressStartsAt = 300, progressDuration = 4100;
  let overlay, mountedAt, ready = false, revealing = false, complete = false, revealTimer, exitTimer;
  let progressFrame, progressCompletedAt, lastPercent = -1;
  let previews = [];
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
    reduced.removeEventListener('change', onMotionChange);
  }
  function reveal(immediate = false) {
    if (complete || revealing) return;
    revealing = true;
    clearTimeout(revealTimer);
    restorePage();
    root.dataset.preloader = 'revealing';
    if (!overlay || immediate || reduced.matches) { finish(); return; }
    overlay.dataset.phase = 'exit';
    // Cleanup does not depend on an animationend event or browser animation support.
    exitTimer = setTimeout(finish, 400);
  }
  function scheduleReveal() {
    if (!overlay || !ready || complete || revealing) return;
    clearTimeout(revealTimer);
    if (!reduced.matches && progressCompletedAt === undefined) return;
    const delay = reduced.matches ? 0 : Math.max(0, mountedAt + revealAt - performance.now(), progressCompletedAt + 200 - performance.now());
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
    progress.querySelector('.intro-progress-fill').style.transform = `scaleX(${percent === 100 ? 1 : Math.min(fraction, ready ? 1 : .99)})`;
    if (percent === 100) { progressCompletedAt = now; scheduleReveal(); }
    else progressFrame = requestAnimationFrame(updateProgress);
  }
  function onKey(event) {
    if (event.key === 'Escape' || event.key === 'Tab' || event.key === 'Enter') reveal(true);
    else if ([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key) && !revealing) event.preventDefault();
  }
  function onMotionChange() { if (reduced.matches && ready) reveal(true); }
  function setPreviews() {
    if (!overlay) return [];
    return previews.slice(0, 4).map((source, index) => {
      if (!source) return Promise.resolve();
      const card = overlay.querySelectorAll('.intro-card')[index];
      const image = source instanceof HTMLImageElement ? source : new Image(64, 80);
      image.alt = ''; image.decoding = 'async';
      image.onload = () => card.classList.add('has-image');
      if (typeof source === 'string') image.src = source;
      if (image.complete && image.naturalWidth) card.classList.add('has-image');
      card.append(image);
      return image.decode().catch(() => {});
    });
  }
  function mount() {
    if (overlay || complete || !document.body) return;
    mountedAt = performance.now();
    overlay = document.createElement('div');
    overlay.id = 'site-preloader'; overlay.className = 'site-preloader';
    overlay.setAttribute('role', 'status'); overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML = `
      <span class="visually-hidden">Opening Ehsan Masoomi’s portfolio</span>
      <div class="intro-composition">
        <div class="intro-stage" aria-hidden="true">
          <svg class="intro-clip-definitions" width="0" height="0" focusable="false"><defs>
            <clipPath id="intro-folder-back" clipPathUnits="objectBoundingBox"><path transform="scale(.0007067138 .0009000900)" d="M130 346V154C130 84 183 35 251 35H390C457 35 506 114 591 117H1161C1235 117 1281 165 1281 235V346Z"/></clipPath>
            <clipPath id="intro-folder-front" clipPathUnits="objectBoundingBox"><path transform="scale(.0007067138 .0009000900)" d="M277 324H1143C1225 324 1282 369 1280 447L1259 965C1256 1026 1217 1060 1155 1060H243C181 1060 146 1026 143 964L130 448C128 374 183 324 277 324Z"/></clipPath>
          </defs></svg>
          <div class="intro-folder">
            <span class="intro-folder-back"><img src="./assets/home/folder.webp" width="154" height="121" alt="" /></span>
            <span class="intro-card" data-kind="work"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18M10 10v10"/></svg></span>
            <span class="intro-card" data-kind="work"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18M10 10v10"/></svg></span>
            <span class="intro-card" data-kind="work"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18M10 10v10"/></svg></span>
            <span class="intro-card" data-kind="work"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18M10 10v10"/></svg></span>
            <span class="intro-folder-front"><img src="./assets/home/folder.webp" width="154" height="121" alt="" /></span>
          </div>
        </div>
        <div class="intro-progress" role="progressbar" aria-label="Opening portfolio" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-live="off">
          <span class="intro-percentage">0%</span>
          <span class="intro-progress-track" aria-hidden="true"><span class="intro-progress-fill"></span></span>
        </div>
      </div>`;
    for (const node of document.body.children) {
      if (node.matches('script, style, link')) continue;
      inertNodes.set(node, node.inert); node.inert = true;
    }
    overlay.addEventListener('wheel', event => { if (!revealing) event.preventDefault(); }, { passive: false });
    overlay.addEventListener('touchmove', event => { if (!revealing) event.preventDefault(); }, { passive: false });
    document.body.append(overlay);
    setPreviews();
    progressFrame = requestAnimationFrame(updateProgress);
    scheduleReveal();
  }

  // Fail open even if the application bundle or one of its imports cannot load.
  const deadline = setTimeout(() => reveal(true), 8000);
  document.addEventListener('keydown', onKey);
  reduced.addEventListener('change', onMotionChange);
  window.addEventListener('pageshow', event => { if (event.persisted) reveal(true); });
  window.portfolioPreloader = {
    get active() { return !complete; },
    ready(options = {}) {
      if (complete || ready) return;
      previews = options.previews || [];
      const images = setPreviews();
      const critical = [...document.querySelectorAll('.home-portrait, .book-quote-portrait')].map(image => image.decode().catch(() => {}));
      Promise.race([
        Promise.allSettled([document.fonts?.ready, ...images, ...critical]),
        new Promise(resolve => setTimeout(resolve, 900))
      ]).then(() => { ready = true; scheduleReveal(); });
    }
  };
  if (document.readyState !== 'loading') mount();
  else {
    // interactive fires before deferred module execution, so loading is visible
    // while the application is still being fetched rather than after it starts.
    document.addEventListener('readystatechange', mount);
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  }
})();
