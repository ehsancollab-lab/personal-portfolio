import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
export const motionRuntime = { ticker: gsap.ticker, scrollTrigger: ScrollTrigger };
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let cleanup = () => {};
let generation = 0;
let departure;
export function cancelPageTransition() { departure?.cancel(); departure = null; }
export function transitionPage(main, commit) {
  cancelPageTransition();
  if (reduced.matches || !main?.isConnected) { commit(); return; }
  const animation = main.animate([
    { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
    { opacity: 0, transform: 'translateY(-8px)', filter: 'blur(5px)' }
  ], { duration: 160, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
  departure = animation;
  animation.finished.then(() => {
    if (departure !== animation) return;
    departure = null; commit(); animation.cancel();
  }).catch(() => {});
}

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
      gsap.fromTo(main, { opacity: 0, y: 14, filter: 'blur(5px)' }, {
        opacity: 1, y: 0, filter: 'blur(0px)', duration: .6, ease: 'power3.out',
        clearProps: 'opacity,transform,filter', onUpdate: invalidate
      });
    }
    if (page === 'experience') {
      const track = main.querySelector('.experience-track > span');
      if (track) gsap.fromTo(track, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.experience-list', start: 'top 65%', end: 'bottom 65%', scrub: .35 }
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
