export const siteHeaderMarkup = `
    <header class="site-header portal-header" id="top">
      <div class="portal-header-left">
        <a class="library-back portal-back" href="./index.html" data-restore-scroll aria-keyshortcuts="Escape" hidden>
          <span class="library-back-icon" aria-hidden="true"></span>
          <span class="portal-back-label">Back to Home</span>
          <kbd class="back-shortcut" aria-hidden="true">ESC</kbd>
        </a>
        <div class="display-controls" aria-label="Display settings">
          <button class="theme-toggle" id="theme-toggle" type="button" aria-pressed="false" aria-label="Switch to dark theme">
            <img src="./assets/ui/moon-fill.svg" width="20" height="20" alt="" />
          </button>
        </div>
      </div>
      <p class="portal-page-title"></p>
      <a class="cv-link" id="cv-link" href="./assets/Ehsan-Masoomi-CV-EN-November-2026.pdf" download="Ehsan-Masoomi-CV-EN-November-2026.pdf">
        <img src="./assets/figma/download-cv.svg" width="20" height="20" alt="" />
        <span id="cv-label">Download CV</span>
      </a>
    </header>`;

export function createSiteHeader() {
  const template = document.createElement('template');
  template.innerHTML = siteHeaderMarkup;
  return template.content.firstElementChild;
}
