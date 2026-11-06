export const siteHeaderMarkup = `
    <header class="site-header portal-header" id="top">
      <div class="portal-header-left">
        <a class="portrait-badge nav-home-avatar" href="./index.html" aria-label="Home"><img src="./assets/home/book-avatar.webp" width="38" height="38" alt="" /></a>
        <span class="nav-divider" aria-hidden="true">/</span>
        <p class="tehran-clock" dir="ltr" lang="en" aria-live="off">Tehran - <time id="tehran-time">--:--:--</time></p>
        <a class="library-back portal-back" href="./index.html" data-restore-scroll aria-keyshortcuts="Escape" hidden>
          <span class="portal-back-label">Back</span>
        </a>
      </div>
      <div class="portal-header-right">
        <div class="display-controls" aria-label="Display settings">
          <button class="theme-toggle" id="theme-toggle" type="button" aria-pressed="false" aria-label="Switch to dark theme">
            <img src="./assets/ui/moon-fill.svg" width="20" height="20" alt="" />
          </button>
        </div>
      </div>
    </header>`;

export function createSiteHeader() {
  const template = document.createElement('template');
  template.innerHTML = siteHeaderMarkup;
  return template.content.firstElementChild;
}

export function mountTehranClock(header) {
  const clock = header.querySelector('#tehran-time');
  if (!clock) return;
  if (clock.dataset.clockMounted === 'true') return;
  clock.dataset.clockMounted = 'true';
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const update = () => {
    const now = new Date();
    clock.textContent = formatter.format(now);
    clock.dateTime = now.toISOString();
  };
  update();
  window.setInterval(update, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
}
