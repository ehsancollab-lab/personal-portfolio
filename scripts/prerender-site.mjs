import { access, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { chromium } from '@playwright/test';
import { books, bookCategories } from '../library-content.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const key = (prefix, id) => prefix + '-' + encodeURIComponent(id).replaceAll('%', '_');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };

export async function prerenderSite(output) {
  let executablePath;
  for (const candidate of [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean)) {
    try { await access(candidate); executablePath = candidate; break; } catch { /* Try the next installed browser. */ }
  }
  if (!executablePath) throw new Error('Static rendering needs Chrome/Chromium. Set CHROME_BIN to an installed executable.');
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = resolve(output, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(output + sep)) { response.writeHead(403).end(); return; }
      const bytes = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
      response.end(bytes);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    await context.route('**/*', route => {
      const request = route.request();
      if (!request.url().startsWith(origin + '/') || ['image', 'media'].includes(request.resourceType())) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    const snapshots = {};
    const visit = async (filename, locale = 'en') => {
      await page.goto(origin + '/' + filename, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
      await page.waitForFunction(() => window.portfolioPreloader?.active === false);
      if (locale === 'fa') await page.locator('[data-language="fa"]').click();
      return page.evaluate(() => {
        const main = document.querySelector('main').cloneNode(true);
        main.dataset.staticRendered = 'true';
        for (const image of main.querySelectorAll('img')) if (!image.classList.contains('home-portrait')) image.loading = 'lazy';
        const header = document.querySelector('.portal-header').cloneNode(true);
        const clock = header.querySelector('#tehran-time');
        if (clock) { clock.textContent = '--:--:--'; clock.removeAttribute('datetime'); clock.removeAttribute('data-clock-mounted'); }
        return { main: main.outerHTML, inner: main.innerHTML, footer: document.querySelector('.site-footer').outerHTML, header: header.outerHTML, title: document.title, description: document.querySelector('meta[name="description"]').content };
      });
    };
    for (const filename of ['index', 'work', 'case-studies', 'case-study', 'experience', 'about', 'books', 'book']) {
      snapshots[filename] = {};
      for (const locale of ['en', 'fa']) snapshots[filename][locale] = await visit(filename + '.html', locale);
    }
    const library = {};
    for (const locale of ['en', 'fa']) {
      await visit('about.html', locale);
      library[locale] = await page.evaluate(async locale => {
        const { renderLibrary } = await import('./library.js');
        const { books, bookCategories } = await import('./library-content.js');
        const { setLocale } = await import('./i18n.js');
        setLocale(locale);
        const render = (page, query) => {
          const main = document.createElement('main');
          renderLibrary(main, page, query);
          for (const image of main.querySelectorAll('img')) image.loading = 'lazy';
          return { inner: main.innerHTML, title: document.title, description: document.querySelector('meta[name="description"]').content };
        };
        return {
          categories: Object.fromEntries(bookCategories.map(item => [item.id, render('books', '?category=' + encodeURIComponent(item.id))])),
          books: Object.fromEntries(books.map(item => [item.id, render('book', '?id=' + encodeURIComponent(item.id))]))
        };
      }, locale);
    }
    const content = JSON.parse(await readFile(resolve(output, 'data/portfolio.json'), 'utf8'));
    const cases = { en: {}, fa: {} };
    for (const item of content.caseStudies.filter(item => item.visible !== false)) {
      for (const locale of ['en', 'fa']) cases[locale][item.id] = await visit('case-study.html?id=' + encodeURIComponent(item.id), locale);
    }
    const panel = (prefix, id, snapshot, parent) => '<section class="static-route-panel" id="' + key(prefix, id) + '" data-static-title="' + escape(snapshot.title) + '" data-static-description="' + escape(snapshot.description) + '" data-static-parent="' + escape(parent) + '">' + snapshot.inner + '</section>';
    for (const locale of ['en', 'fa']) {
      const variants = [
        ['books', bookCategories.map(item => panel('collection', item.id, library[locale].categories[item.id], './about.html#my-books')).join('')],
        ['book', books.map(item => panel('book', item.id, library[locale].books[item.id], './books.html?category=' + encodeURIComponent(item.category) + '#' + key('collection', item.category))).join('')],
        ['case-study', Object.entries(cases[locale]).map(([id, snapshot]) => panel('case', id, snapshot, './case-studies.html')).join('')]
      ];
      for (const [filename, panels] of variants) {
        const snapshot = snapshots[filename][locale];
        snapshot.main = snapshot.main.replace(snapshot.inner, panels + '<div class="static-route-index">' + snapshot.inner + '</div>');
      }
    }
    const nativeLinks = html => html.replace(/href="([^"]+)"/g, (match, href) => {
      const clean = href.replaceAll('&amp;', '&');
      if (!clean.startsWith('./')) return match;
      const url = new URL(clean, origin + '/');
      const filename = url.pathname.split('/').pop();
      const id = url.searchParams.get(filename === 'books.html' ? 'category' : 'id');
      const prefix = { 'books.html': 'collection', 'book.html': 'book', 'case-study.html': 'case' }[filename];
      if (!prefix || !id) return match;
      return 'href="' + escape('./' + filename + url.search + '#' + key(prefix, id)) + '"';
    });
    for (const [filename, locales] of Object.entries(snapshots)) {
      let html = await readFile(resolve(output, filename + '.html'), 'utf8');
      const english = locales.en;
      html = html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/, english.main);
      html = html.replace(/<header class="site-header portal-header"[\s\S]*?<\/header>/, english.header);
      html = html.replace(/<footer class="site-footer"[\s\S]*?<\/footer>/, english.footer);
      html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + escape(english.title) + '</title>');
      const templates = Object.entries(locales).map(([locale, snapshot]) => '<template data-static-locale="' + locale + '" data-static-title="' + escape(snapshot.title) + '" data-static-description="' + escape(snapshot.description) + '">' + snapshot.main + snapshot.footer + '</template>').join('\n');
      html = nativeLinks(html.replace('</body>', templates + '\n  </body>'));
      if (html.includes(origin)) throw new Error('A local preview URL leaked into ' + filename + '.html');
      await writeFile(resolve(output, filename + '.html'), html);
    }
    console.log('Pre-rendered 8 pages, ' + bookCategories.length + ' collections, ' + books.length + ' books and ' + Object.keys(cases.en).length + ' case studies in English and Persian.');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}
