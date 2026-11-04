import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { books, bookCategories, booksInCategory } from '../../library-content.js';
const site = 'http://localhost:4173';
const work = resolve(import.meta.dirname, '../../../work/portfolio-browser');
test.beforeEach(async ({ request }) => { await request.post(site + '/__test/reset'); });
const settled = page => page.waitForFunction(() => !document.documentElement.classList.contains('library-transition') && !document.querySelector('.book-transition-clone'));

test('About navigation, owner biography and six three-cover collections', async ({ page }) => {
  const documents = []; const errors = [];
  page.on('request', request => { if (request.isNavigationRequest()) documents.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(site);
  await page.locator('.primary-nav').getByRole('link', { name: 'About Me', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'about');
  await expect(page.locator('.about-introduction')).toContainText('self-taught UI/UX designer');
  await expect(page.locator('.about-introduction')).toContainText('married');
  await expect(page.locator('.about-introduction')).toContainText('love reading');
  await expect(page.locator('.bookshelf-heading')).toContainText('50 books. 6 collections.');
  await expect(page.locator('.book-collection-card')).toHaveCount(6);
  for (const card of await page.locator('.book-collection-card').all()) await expect(card.locator('.book-cover')).toHaveCount(3);
  await expect(page.locator('.sample-cover, .library-cover-note')).toHaveCount(0);
  await expect.poll(() => page.locator('.book-collections img').evaluateAll(images => images.length === 18 && images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await expect(page.locator('.primary-nav [aria-current="page"]')).toHaveText('About Me');
  expect(documents).toHaveLength(1); expect(errors).toEqual([]);
  await page.screenshot({ path: resolve(work, 'about-desktop.png'), fullPage: true });
});

test('collection expansion and reverse motion share the surface, title and three covers', async ({ page }) => {
  const errors = []; const documents = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.isNavigationRequest()) documents.push(request.url()); });
  await page.addInitScript(() => {
    const native = document.startViewTransition.bind(document); window.__transitions = [];
    document.startViewTransition = callback => {
      const record = { before: [...document.querySelectorAll('[style*="view-transition-name"]')].map(node => node.style.viewTransitionName) };
      window.__transitions.push(record);
      const transition = native(async () => { await callback(); record.after = [...document.querySelectorAll('[style*="view-transition-name"]')].map(node => node.style.viewTransitionName); });
      transition.ready.catch(error => { record.error = error.message; }); return transition;
    };
  });
  await page.goto(site + '/about.html');
  const card = page.locator('[data-category-id="psychology"].book-collection-card');
  await card.click();
  await expect(page.locator('.collection-panel h1')).toHaveText('Psychology & relationships');
  await settled(page);
  await expect(page.locator('.site-header')).toHaveCount(0);
  await expect(page.locator('.featured-book-shelf .book-cover')).toHaveCount(3);
  await expect(page.locator('.library-book-card')).toHaveCount(13);
  await page.screenshot({ path: resolve(work, 'books-desktop.png'), fullPage: true });
  await page.getByRole('link', { name: 'All collections', exact: true }).click();
  await expect(card).toBeVisible(); await settled(page);
  const transitions = await page.evaluate(() => window.__transitions);
  expect(transitions).toHaveLength(2);
  for (const record of transitions) {
    expect(record.error).toBeUndefined();
    for (const list of [record.before, record.after]) expect(list.filter(Boolean).sort()).toEqual(['reading-cover-0', 'reading-cover-1', 'reading-cover-2', 'reading-surface', 'reading-title']);
  }
  expect(documents).toHaveLength(1); expect(errors).toEqual([]);
});

test('English and Persian search filters visible cards and supports clearing an empty result', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/about.html');
  const search = page.getByRole('searchbox');
  await search.fill('Cal Newport');
  await expect(page.locator('.book-collection-card:visible')).toHaveCount(1);
  await expect(page.locator('.book-collection-card:visible')).toContainText('Work & business');
  await search.fill('دل بستگي');
  await expect(page.locator('.book-collection-card:visible')).toHaveCount(1);
  await page.locator('.book-collection-card:visible').click();
  await page.getByRole('searchbox').fill('دل بستگي');
  await expect(page.locator('.library-book-card:visible')).toHaveCount(1);
  await expect(page.locator('.library-book-card:visible')).toContainText('Attached');
  await expect(page.locator('.featured-book-shelf')).toBeHidden();
  await page.getByRole('searchbox').fill('a title that does not exist');
  await expect(page.locator('.library-book-card:visible')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('0 books found');
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.locator('.library-book-card:visible')).toHaveCount(13);
  await expect(page.locator('.featured-book-shelf')).toBeVisible();
});

test('all 50 books open with the correct author, Persian title, summary, takeaway, source and Back', async ({ page }) => {
  test.setTimeout(120000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/about.html');
  for (const category of bookCategories) {
    await page.locator('.book-collection-card[data-category-id="' + category.id + '"]').click();
    for (const book of booksInCategory(category.id)) {
      await page.locator('.library-book-card[data-book-id="' + book.id + '"]').click();
      await expect(page.locator('.book-detail-copy h1')).toHaveText(book.title);
      await expect(page.locator('.book-detail-author')).toHaveText('By ' + book.author);
      await expect(page.locator('.book-detail-persian')).toHaveText(book.titleFa);
      await expect(page.locator('.book-summary p')).toHaveText(book.summary);
      await expect(page.locator('.book-takeaway blockquote')).toHaveText(book.takeaway);
      await expect(page.locator('.book-source')).toHaveAttribute('href', book.source.url);
      await expect(page.locator('.sample-cover')).toHaveCount(0);
      const image = page.locator('.book-detail-art img');
      await expect(image).toHaveAttribute('alt', book.title + ' — book cover');
      await expect(image).toHaveAttribute('srcset', /320w/);
      await expect.poll(() => image.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
      expect(await image.evaluate(node => node.currentSrc)).toMatch(/\/assets\/optimized\/[a-f0-9]+-\d+\.webp$/);
      await page.locator('.library-back').click();
      await expect(page.locator('.collection-panel h1')).toHaveText(category.title);
    }
    await page.locator('.library-back').click();
  }
  expect(errors).toEqual([]);
});

test('book motion, cached search, scroll, title and browser back and forward work together', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(site + '/books.html?category=fiction');
  await page.getByRole('searchbox').fill('Orwell');
  const card = page.locator('.library-book-card[data-book-id="animal-farm"]');
  await card.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await card.click(); await settled(page);
  await expect(page).toHaveTitle('Animal Farm · My Bookshelf — Ehsan Masoomi');
  await page.screenshot({ path: resolve(work, 'book-desktop.png'), fullPage: true });
  await page.locator('.library-back').click(); await settled(page);
  await expect(page.getByRole('searchbox')).toHaveValue('Orwell');
  await expect(page.locator('.library-book-card:visible')).toHaveCount(2);
  expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThan(3);
  await expect(page).toHaveTitle('Fiction & literature · My Bookshelf — Ehsan Masoomi');
  await page.goBack(); await expect(page.locator('.book-detail-copy h1')).toHaveText('Animal Farm'); await settled(page);
  await page.goForward(); await expect(page.getByRole('searchbox')).toHaveValue('Orwell'); await settled(page);
  expect(errors).toEqual([]);
});

test('library is responsive at 390 and 320 pixels and keeps the saved theme and local Persian font', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/about.html');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.screenshot({ path: resolve(work, `about-${width}-dark.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.book-collection-card[data-category-id="psychology"]').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('.collection-panel')).toHaveCSS('background-color', 'rgb(34, 34, 36)');
    await page.screenshot({ path: resolve(work, `books-${width}-dark.png`), fullPage: true });
    await page.locator('.shelf-book[data-book-id="attached"]').click();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('.book-detail-persian').evaluate(node => getComputedStyle(node).fontFamily)).toContain('Vazirmatn');
    expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => /vazirmatn.*woff2/.test(entry.name)))).toBe(true);
    await page.screenshot({ path: resolve(work, `book-${width}-dark.png`), fullPage: true });
    await page.locator('.library-back').click(); await page.locator('.library-back').click();
  }
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
});

test('reduced motion skips shared transitions and keyboard navigation opens collections', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => { window.__transitionCalls = 0; document.startViewTransition = () => { window.__transitionCalls++; throw new Error('Reduced motion must not request a transition'); }; });
  await page.goto(site + '/about/');
  const card = page.locator('.book-collection-card').first();
  expect(await card.locator('.book-cover').first().evaluate(node => parseFloat(getComputedStyle(node).transitionDuration))).toBeLessThan(.001);
  await card.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.collection-panel h1')).toHaveText('Psychology & relationships');
  expect(await page.evaluate(() => window.__transitionCalls)).toBe(0);
  await page.locator('.shelf-book').first().click();
  await expect(page.locator('.book-detail-copy h1')).toHaveText('Attached');
  expect(await page.evaluate(() => window.__transitionCalls)).toBe(0);
});

test('browsers without View Transitions animate shared cover clones and clean up', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { document.startViewTransition = undefined; });
  await page.goto(site + '/about.html');
  await page.locator('.book-collection-card').first().click();
  await expect(page.locator('.book-transition-clone')).toHaveCount(3);
  await settled(page);
  await expect(page.locator('.featured-book-shelf .book-cover')).toHaveCount(3);
  await page.locator('.shelf-book').first().click();
  await expect(page.locator('.book-transition-clone')).toHaveCount(1);
  await settled(page);
  await expect(page.locator('.book-detail-art .book-cover')).toBeVisible();
  await page.locator('.library-back').click(); await settled(page);
  await page.locator('.library-back').click(); await settled(page);
  await expect(page.locator('.book-collection-card')).toHaveCount(6);
  expect(await page.locator('[style*="visibility: hidden"]').count()).toBe(0);
  expect(errors).toEqual([]);
});

test('direct collection and book aliases and invalid links give usable pages', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  for (const [path, title] of [['/books/?category=design', 'Design & creativity'], ['/book/?id=think-bigger', 'Think Bigger'], ['/books.html?category=missing', 'Collection not found'], ['/book.html?id=missing', 'Book not found']]) {
    await page.goto(site + path);
    await expect(page.locator('main h1')).toHaveText(title);
    await expect(page.locator('.library-back')).toBeVisible();
  }
  await page.locator('.library-back').click(); await expect(page.locator('.book-collection-card')).toHaveCount(6);
  expect(errors).toEqual([]);
});

test('rapid navigation keeps the latest destination and removes interrupted motion', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(site + '/about.html');
  await page.evaluate(() => {
    document.querySelector('.book-collection-card[data-category-id="psychology"]').click();
    document.querySelector('.primary-nav [data-page-link="selected-work"]').click();
  });
  await expect(page.locator('body')).toHaveAttribute('data-page', 'selected-work');
  await settled(page); await page.waitForTimeout(650);
  await expect(page.locator('body')).toHaveAttribute('data-page', 'selected-work');
  await page.locator('.primary-nav').getByRole('link', { name: 'About Me', exact: true }).click();
  await page.evaluate(() => {
    document.querySelector('.book-collection-card[data-category-id="psychology"]').click();
    document.querySelector('.book-collection-card[data-category-id="growth"]').click();
  });
  await expect(page.locator('.collection-panel h1')).toHaveText('Growth & learning');
  await settled(page);
  expect(await page.locator('[style*="view-transition-name: reading"]').count()).toBe(0);
  expect(errors).toEqual([]);
});
