const preference = matchMedia('(prefers-reduced-motion: reduce)');
const running = new Set();
preference.addEventListener('change', () => { if (preference.matches) for (const animation of running) animation.cancel(); });
export function animateTypography(scope) {
  if (!scope) return;
  const nodes = scope.querySelectorAll('h1:not(.visually-hidden), h2:not(.visually-hidden), h3, .bio, .contact-prompt, .contact-links, .primary-nav, .dashboard-tabs, .case-study-card-summary, .case-article-body > p, .experience-bullets');
  nodes.forEach((node, index) => {
    for (const animation of (node.getAnimations?.() || [])) if (running.has(animation)) animation.cancel();
    if (preference.matches || typeof node.animate !== 'function' || !node.getClientRects().length) return;
    node.classList.add('text-reveal');
    const animation = node.animate([{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(5px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }], { duration: 560, delay: Math.min(index, 5) * 42, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    running.add(animation);
    animation.finished.then(() => running.delete(animation), () => running.delete(animation));
  });
}
