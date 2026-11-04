import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
export const motionRuntime = { ticker: gsap.ticker, scrollTrigger: ScrollTrigger };
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let cleanup = () => {};
let generation = 0;

export function mountPageMotion(main, page) {
  cleanup();
  const token = ++generation;
  let stage;
  let frame;
  const invalidate = () => stage?.invalidate();
  const context = gsap.context(() => {
    if (reduced.matches) return;
    // The bookshelf already shares its actual surfaces and covers between views.
    if (!['about', 'books', 'book'].includes(page)) {
      gsap.fromTo(main, { opacity: 0, y: 22 }, {
        opacity: 1, y: 0, duration: .65, ease: 'power3.out',
        clearProps: 'opacity,transform', onUpdate: invalidate
      });
    }
    if (page === 'selected-work') {
      main.querySelectorAll('.project-card').forEach(card => {
        gsap.fromTo(card, { opacity: .12, y: 64, scale: .975 }, {
          opacity: 1, y: 0, scale: 1, duration: 1.05, ease: 'power3.out',
          clearProps: 'opacity,transform', onUpdate: invalidate,
          scrollTrigger: { trigger: card, start: 'top 94%', once: true }
        });
      });
      if (matchMedia('(hover: hover) and (pointer: fine)').matches && !navigator.connection?.saveData) {
        import('./work-scene.js').then(({ createWorkScene }) => {
          if (token === generation && main.isConnected && !reduced.matches) stage = createWorkScene(main);
        }).catch(() => {}); // The semantic image gallery remains usable without WebGL.
      }
    }
  }, main);
  frame = requestAnimationFrame(() => { ScrollTrigger.refresh(); invalidate(); });
  const change = () => { if (main.isConnected) mountPageMotion(main, page); };
  reduced.addEventListener('change', change);
  cleanup = () => {
    cancelAnimationFrame(frame);
    reduced.removeEventListener('change', change);
    context.revert();
    stage?.dispose();
  };
}
