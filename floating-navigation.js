import { getLocale, localizeText } from './i18n.js';

const compactLabels = {
  en: { 'selected-work': 'Work', 'case-studies': 'Cases', experience: 'Career', about: 'About' },
  fa: { 'selected-work': 'کارها', 'case-studies': 'کیس‌ها', experience: 'سوابق', about: 'درباره' }
};

export function createFloatingNavigation(source) {
  const nav = document.createElement('nav');
  nav.className = 'floating-nav'; nav.dataset.scrollNative = '';
  for (const link of source.querySelectorAll('a')) nav.append(link.cloneNode(true));
  document.body.append(nav);
  const compact = matchMedia('(max-width: 420px)');
  let enabled = false;
  function syncLabels() {
    for (const link of nav.querySelectorAll('a')) {
      const original = source.querySelector('[data-page-link="' + link.dataset.pageLink + '"]');
      const full = original.textContent;
      const label = compact.matches ? compactLabels[getLocale()][link.dataset.pageLink] : full;
      if (link.textContent !== label) link.textContent = label;
      if (link.getAttribute('aria-label') !== full) link.setAttribute('aria-label', full);
    }
    if (compact.matches && nav.scrollLeft !== 0) nav.scrollLeft = 0;
  }
  function update() {
    if (enabled && source.isConnected) syncLabels();
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
  compact.addEventListener('change', update);
  // A route can restore scroll twice within one observer frame; always use the
  // current tab geometry when scrolling as well as on intersection changes.
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  return { update(value) { enabled = value; update(); } };
}
