// A document-entry introduction. SPA navigation never mounts it again.
(() => {
  'use strict';
  if (window.portfolioPreloader) return;
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const previousBusy = root.getAttribute('aria-busy');
  const inertNodes = new Map();
  let overlay, mountedAt, ready = false, revealing = false, complete = false, revealTimer, exitTimer;
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
    exitTimer = setTimeout(finish, 420);
  }
  function scheduleReveal() {
    if (!overlay || !ready || complete || revealing) return;
    clearTimeout(revealTimer);
    const delay = reduced.matches ? 0 : Math.max(0, 1680 - (performance.now() - mountedAt));
    revealTimer = setTimeout(() => reveal(), delay);
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
      <div class="intro-composition" aria-hidden="true">
        <div class="intro-stage">
          <svg class="intro-clip-definitions" width="0" height="0" focusable="false"><defs>
            <clipPath id="intro-folder-back" clipPathUnits="objectBoundingBox"><path transform="scale(.0007067138 .0009000900)" d="M130 346V154C130 84 183 35 251 35H390C457 35 506 114 591 117H1161C1235 117 1281 165 1281 235V346Z"/></clipPath>
            <clipPath id="intro-folder-front" clipPathUnits="objectBoundingBox"><path transform="scale(.0007067138 .0009000900)" d="M277 324H1143C1225 324 1282 369 1280 447L1259 965C1256 1026 1217 1060 1155 1060H243C181 1060 146 1026 143 964L130 448C128 374 183 324 277 324Z"/></clipPath>
          </defs></svg>
          <div class="intro-folder">
            <span class="intro-folder-back"><img src="./assets/home/folder.webp" width="154" height="121" alt="" /></span>
            <span class="intro-card" data-kind="work"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18M10 10v10"/></svg></span>
            <span class="intro-card" data-kind="case"><svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 8h6M9 12h6M9 16h3"/></svg></span>
            <span class="intro-card" data-kind="experience"><svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M8 7V4h8v3M3 12a22 22 0 0 0 18 0M12 12v3"/></svg></span>
            <span class="intro-card" data-kind="books"><svg viewBox="0 0 24 24"><path d="M12 5C9 3 6 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1v15"/></svg></span>
            <span class="intro-folder-front"><img src="./assets/home/folder.webp" width="154" height="121" alt="" /></span>
          </div>
        </div>
        <p class="intro-name">Ehsan Masoomi<span class="intro-name-dot"></span></p>
        <p class="intro-role">Senior AI Product Designer</p>
        <div class="intro-indicator"><span></span><span></span><span></span><span></span></div>
      </div>`;
    for (const node of document.body.children) {
      if (node.matches('script, style, link')) continue;
      inertNodes.set(node, node.inert); node.inert = true;
    }
    overlay.addEventListener('wheel', event => { if (!revealing) event.preventDefault(); }, { passive: false });
    overlay.addEventListener('touchmove', event => { if (!revealing) event.preventDefault(); }, { passive: false });
    document.body.append(overlay);
    setPreviews();
    scheduleReveal();
  }

  // Fail open even if the application bundle or one of its imports cannot load.
  const deadline = setTimeout(() => reveal(true), 4500);
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
