export function mountViewportBlur() {
  const veil = document.createElement('div');
  veil.className = 'viewport-blur'; veil.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 4; index++) veil.append(document.createElement('span'));
  document.body.append(veil);
  const update = () => veil.classList.toggle('is-visible', scrollY > 16);
  window.addEventListener('scroll', update, { passive: true });
  update();
}
