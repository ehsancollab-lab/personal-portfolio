import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function createExperienceTimeline(main, reduced) {
  const list = main.querySelector('.experience-list');
  const track = list?.querySelector('.experience-track');
  if (!track) return () => {};
  const fill = track.querySelector('.experience-progress');
  const cursor = track.querySelector('.experience-cursor');
  const entries = [...list.querySelectorAll('.experience-entry')];
  const dots = entries.map(entry => entry.querySelector('.experience-dot'));
  const state = { progress: 0 };
  let height = 0, stops = [];
  function measure() {
    const origin = list.getBoundingClientRect().top;
    const centers = dots.map(dot => { const box = dot.getBoundingClientRect(); return box.top + box.height / 2 - origin; });
    const start = centers[0] || 0;
    height = Math.max(0, (centers.at(-1) || start) - start);
    stops = centers.map(center => center - start);
    track.style.top = start + 'px'; track.style.height = height + 'px'; track.style.bottom = 'auto';
  }
  function draw() {
    const distance = state.progress * height;
    fill.style.transform = 'scaleY(' + state.progress + ')';
    cursor.style.transform = 'translate3d(0,' + distance + 'px,0)';
    track.dataset.progress = state.progress.toFixed(4);
    entries.forEach((entry, index) => {
      entry.classList.toggle('is-passed', distance >= stops[index] - 1);
      entry.classList.toggle('is-near', Math.abs(distance - stops[index]) < 24);
    });
  }
  measure(); draw();
  const tween = gsap.to(state, {
    progress: 1, ease: 'none', onUpdate: draw,
    scrollTrigger: {
      trigger: track, start: 'top 58%', end: 'bottom 58%', scrub: reduced ? true : .85,
      onRefresh() { measure(); draw(); }
    }
  });
  const observer = new ResizeObserver(() => { measure(); tween.scrollTrigger.refresh(); });
  observer.observe(list);
  return () => {
    observer.disconnect(); tween.scrollTrigger?.kill(); tween.kill();
    for (const entry of entries) entry.classList.remove('is-passed', 'is-near');
  };
}
