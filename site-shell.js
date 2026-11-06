export const siteHeaderMarkup = `
    <header class="site-header portal-header" id="top">
      <div class="portal-header-left">
        <p class="tehran-clock" dir="ltr" lang="en" aria-live="off">Tehran - <time id="tehran-time">--:--:--</time></p>
        <a class="library-back portal-back" href="./index.html" data-restore-scroll aria-keyshortcuts="Escape" hidden>
          <span class="library-back-icon" aria-hidden="true"></span>
          <span class="portal-back-label">Back to Home</span>
          <kbd class="back-shortcut" aria-hidden="true">ESC</kbd>
        </a>
      </div>
      <div class="portal-header-right">
        <a class="cv-link" id="cv-link" href="./assets/Ehsan-Masoomi-CV-EN-November-2026.pdf" download="Ehsan-Masoomi-CV-EN-November-2026.pdf">
          <img src="./assets/figma/download-cv.svg" width="20" height="20" alt="" />
          <span id="cv-label">Download CV</span>
        </a>
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
