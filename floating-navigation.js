import { localizeText } from './i18n.js';

export function createFloatingNavigation(source) {
  const nav = document.createElement('nav');
  nav.className = 'floating-nav'; nav.dataset.scrollNative = '';
  for (const link of source.querySelectorAll('a')) nav.append(link.cloneNode(true));
  document.body.append(nav);
  let enabled = false;
  function update() {
    const visible = enabled && source.isConnected && source.getBoundingClientRect().bottom <= 0;
    nav.classList.toggle('is-visible', visible);
    nav.inert = !visible;
    nav.setAttribute('aria-hidden', String(!visible));
    nav.setAttribute('aria-label', localizeText('Page navigation'));
    if (visible) {
      const active = nav.querySelector('[aria-current="page"]');
      if (active) {
        const frame = nav.getBoundingClientRect(), item = active.getBoundingClientRect();
        if (item.left < frame.left) nav.scrollLeft += item.left - frame.left - 6;
        if (item.right > frame.right) nav.scrollLeft += item.right - frame.right + 6;
      }
    }
  }
  const observer = new IntersectionObserver(update);
  observer.observe(source);
  // A route can restore scroll twice within one observer frame; always use the
  // current tab geometry when scrolling as well as on intersection changes.
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  return { update(value) { enabled = value; update(); } };
}
