const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let engine;
let runtime = {};
let ticker;
let raf;
let generation = 0;
let suspended = false;
let initialized = false;
const refresh = () => engine?.resize();
const update = () => runtime.scrollTrigger?.update();

function destroyEngine() {
  if (ticker) runtime.ticker?.remove(ticker);
  ticker = null;
  cancelAnimationFrame(raf);
  runtime.scrollTrigger?.removeEventListener('refresh', refresh);
  engine?.off('scroll', update);
  engine?.destroy(); engine = null;
}
function syncDialog() {
  if (!engine) return;
  const open = Boolean(document.querySelector('dialog[open]'));
  if (open && !engine.isStopped) engine.stop();
  if (!open && engine.isStopped) engine.start();
}
async function configure() {
  const token = ++generation;
  destroyEngine();
  if (reduced.matches || suspended) return;
  await document.fonts?.ready;
  try {
    const { default: Lenis } = await import('lenis');
    if (token !== generation || reduced.matches || suspended) return;
    engine = new Lenis({
      lerp: .085, smoothWheel: true, syncTouch: false,
      wheelMultiplier: .92, autoRaf: false, anchors: false,
      prevent: node => Boolean(node.closest?.('dialog[open], [data-scroll-native]'))
    });
    engine.on('scroll', update);
    runtime.scrollTrigger?.addEventListener('refresh', refresh);
    if (runtime.ticker) {
      ticker = seconds => engine?.raf(seconds * 1000);
      runtime.ticker.add(ticker);
    } else {
      const frame = time => { engine?.raf(time); raf = requestAnimationFrame(frame); };
      raf = requestAnimationFrame(frame);
    }
    syncDialog();
  } catch { /* Native scrolling remains available if the local Lenis chunk fails. */ }
}
export function initSmoothScroll(clock = {}) {
  if (initialized) return;
  initialized = true; runtime = clock;
  reduced.addEventListener('change', configure);
  window.addEventListener('pagehide', () => { suspended = true; generation++; destroyEngine(); });
  window.addEventListener('pageshow', () => { if (suspended) { suspended = false; configure(); } });
  new MutationObserver(syncDialog).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
  configure();
}

// Route changes and history restoration must cancel wheel inertia immediately.
export function scrollToPosition(top) {
  if (engine) {
    engine.resize(); engine.reset();
    engine.scrollTo(top, { immediate: true, force: true });
  } else window.scrollTo({ top, behavior: 'instant' });
  update();
}
function focusTarget(target) {
  if (!target.isConnected) return;
  const temporary = !target.hasAttribute('tabindex') && target.tabIndex < 0;
  if (temporary) {
    target.tabIndex = -1;
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  }
  target.focus({ preventScroll: true });
}
export function scrollToSection(target, { immediate = false } = {}) {
  const instant = immediate || reduced.matches;
  if (engine) {
    engine.resize(); engine.reset();
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    engine.scrollTo(target, {
      offset: -padding, immediate: instant, duration: 1.3,
      easing: t => 1 - Math.pow(1 - t, 4), force: true,
      onComplete: () => focusTarget(target)
    });
  } else {
    target.scrollIntoView({ behavior: instant ? 'instant' : 'smooth', block: 'start' });
    focusTarget(target);
  }
}
