const tapURL = new URL('./assets/audio/tap.wav', import.meta.url).href;
export function mountPointerFeedback() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const halo = document.createElement('span'); halo.className = 'cursor-halo'; halo.setAttribute('aria-hidden', 'true');
  document.body.append(halo);
  const voices = Array.from({ length: 3 }, () => { const voice = new Audio(tapURL); voice.preload = 'auto'; voice.volume = .8; return voice; });
  let index = 0;
  function sound() {
    const voice = voices[index++ % voices.length];
    voice.currentTime = 0; voice.play().catch(() => {});
  }
  document.addEventListener('pointermove', event => {
    if (!fine.matches || event.pointerType === 'touch') return;
    halo.style.left = event.clientX + 'px'; halo.style.top = event.clientY + 'px';
    halo.classList.add('is-visible');
    halo.classList.toggle('is-interactive', Boolean(event.target.closest('a, button, [role="button"]')));
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => halo.classList.remove('is-visible'));
  window.addEventListener('blur', () => halo.classList.remove('is-visible', 'is-pressed'));
  document.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    halo.classList.add('is-pressed');
    if (reduced.matches) return;
    const ring = document.createElement('span'); ring.className = 'click-ring'; ring.setAttribute('aria-hidden', 'true');
    ring.style.left = event.clientX + 'px'; ring.style.top = event.clientY + 'px';
    document.body.append(ring);
    const animation = ring.animate([
      { transform: 'translate(-50%, -50%) scale(.45)', opacity: .65 },
      { transform: 'translate(-50%, -50%) scale(1.8)', opacity: 0 }
    ], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
    animation.finished.finally(() => ring.remove());
  }, { passive: true });
  document.addEventListener('pointerup', () => halo.classList.remove('is-pressed'), { passive: true });
  document.addEventListener('pointercancel', () => halo.classList.remove('is-pressed'), { passive: true });
  document.addEventListener('click', event => {
    // A completed click also covers keyboard activation, while a touch scroll
    // or drag does not produce a click sound.
    if (event.isTrusted) sound();
  });
}
