// Small, self-contained controls for the pre-rendered site while the app loads.
(() => {
  const root = document.documentElement;
  const routeKey = (prefix, id) => prefix + '-' + encodeURIComponent(id).replaceAll('%', '_');
  function activateRoute() {
    const page = document.body.dataset.page;
    const params = new URLSearchParams(location.search);
    const id = page === 'books' ? params.get('category') : params.get('id');
    const prefix = { books: 'collection', book: 'book', 'case-study': 'case' }[page];
    if (!id || !prefix) return;
    const panel = document.getElementById(routeKey(prefix, id));
    if (!panel) return;
    for (const node of document.querySelectorAll('main > .static-route-panel')) node.style.display = node === panel ? 'block' : 'none';
    const index = document.querySelector('main > .static-route-index');
    if (index) index.hidden = true;
    document.title = panel.dataset.staticTitle;
    document.querySelector('meta[name="description"]').content = panel.dataset.staticDescription;
    const back = document.querySelector('.portal-back');
    if (back && panel.dataset.staticParent) back.href = panel.dataset.staticParent;
  }
  function labels() {
    const fa = root.lang === 'fa';
    for (const button of document.querySelectorAll('[data-language]')) button.setAttribute('aria-pressed', String(button.dataset.language === root.lang));
    const back = document.querySelector('.portal-back-label');
    if (back) back.textContent = fa ? 'بازگشت' : 'Back';
    const avatar = document.querySelector('.nav-home-avatar');
    if (avatar) avatar.setAttribute('aria-label', fa ? 'صفحهٔ اصلی' : 'Home');
    const dark = root.dataset.theme === 'dark';
    for (const toggle of document.querySelectorAll('.theme-toggle')) {
      toggle.setAttribute('aria-pressed', String(dark));
      toggle.setAttribute('aria-label', fa ? (dark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره') : (dark ? 'Switch to light theme' : 'Switch to dark theme'));
      const image = toggle.querySelector('img');
      if (image) image.src = dark ? './assets/ui/sun-fill.svg' : './assets/ui/moon-fill.svg';
    }
  }
  const clock = document.querySelector('#tehran-time');
  if (clock && clock.dataset.clockMounted !== 'true') {
    clock.dataset.clockMounted = 'true';
    const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const update = () => { const now = new Date(); clock.textContent = formatter.format(now); clock.dateTime = now.toISOString(); };
    update(); setInterval(update, 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
  }
  activateRoute(); labels();
  document.addEventListener('click', event => {
    if (root.dataset.appReady === 'true') return;
    const language = event.target.closest('[data-language]');
    if (language) {
      const locale = language.dataset.language;
      const template = document.querySelector('template[data-static-locale="' + locale + '"]');
      if (!template || locale === root.lang) return;
      const content = template.content;
      document.querySelector('main').replaceWith(content.querySelector('main').cloneNode(true));
      document.querySelector('.site-footer').replaceWith(content.querySelector('.site-footer').cloneNode(true));
      root.lang = locale; root.dir = locale === 'fa' ? 'rtl' : 'ltr';
      document.title = template.dataset.staticTitle;
      document.querySelector('meta[name="description"]').content = template.dataset.staticDescription;
      activateRoute(); labels();
    }
    if (event.target.closest('.theme-toggle')) { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; labels(); }
  });
})();
