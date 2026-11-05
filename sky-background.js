export function mountSkyBackground() {
  if (document.querySelector('.sky-background')) return;
  const sky = document.createElement('div');
  sky.className = 'sky-background';
  sky.setAttribute('aria-hidden', 'true');
  sky.inert = true;
  const image = (name, className) => {
    const node = document.createElement('img');
    node.className = className;
    node.src = new URL('./assets/sky/' + name, import.meta.url).href;
    node.alt = ''; node.decoding = 'async'; node.draggable = false;
    return node;
  };
  const day = document.createElement('div'), night = document.createElement('div');
  day.className = 'sky-day'; night.className = 'sky-night';
  day.append(image('day-sky.webp', 'sky-cloud-image'), image('sun.svg', 'sky-sun'), image('birds.png', 'sky-flock'));
  night.append(image('night-sky.webp', 'sky-cloud-image'), image('moon.svg', 'sky-moon'));
  sky.append(day, night);
  document.body.prepend(sky);
  document.body.classList.add('sky-enabled');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const update = () => {
    sky.dataset.motion = reduced.matches || navigator.connection?.saveData ? 'still' : 'animated';
    sky.classList.toggle('is-paused', document.hidden);
  };
  reduced.addEventListener('change', update);
  navigator.connection?.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  update();
}
