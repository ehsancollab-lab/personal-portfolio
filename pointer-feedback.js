import { createClickSound } from './click-sound.js';
export function mountPointerFeedback() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sound = createClickSound();
  function ripple(x, y) {
    const ring = document.createElement('span'); ring.className = 'click-ring'; ring.setAttribute('aria-hidden', 'true');
    ring.style.left = x + 'px'; ring.style.top = y + 'px';
    document.body.append(ring);
    const animation = ring.animate([
      { transform: 'translate(-50%, -50%) scale(.45)', opacity: .65 },
      { transform: 'translate(-50%, -50%) scale(1.8)', opacity: 0 }
    ], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
    animation.finished.then(() => ring.remove(), () => ring.remove());
  }
  document.addEventListener('click', event => {
    // Wait for a completed primary click so moving, hovering and touch scrolling
    // produce no effect. Keyboard activation keeps the sound without a fake ring.
    if (!event.isTrusted || event.button !== 0) return;
    sound();
    if (!reduced.matches && event.detail > 0) ripple(event.clientX, event.clientY);
  });
}
