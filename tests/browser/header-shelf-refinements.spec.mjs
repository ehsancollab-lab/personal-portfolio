import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const site = process.env.PORTFOLIO_REFINEMENTS_URL || 'http://localhost:4173';
const output = resolve(import.meta.dirname, '../../../work/header-shelf-refinements');
const routes = ['work.html', 'case-studies.html', 'experience.html', 'about.html', 'books.html?category=growth', 'book.html?id=why-nobody-told-me', 'case-study.html?id=mohtavachi-content-calendar'];

test.beforeEach(async ({ request }) => {
  if (!process.env.PORTFOLIO_REFINEMENTS_URL) await request.post(site + '/__test/reset');
});

for (const scenario of [
  { locale: 'en', theme: 'light', width: 1440 },
  { locale: 'fa', theme: 'dark', width: 1440 },
  { locale: 'en', theme: 'dark', width: 350 },
  { locale: 'fa', theme: 'light', width: 350 }
]) {
  test(`requested refinements: ${scenario.locale}, ${scenario.theme}, ${scenario.width}px`, async ({ page, request }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await mkdir(output, { recursive: true });
    await page.setViewportSize({ width: scenario.width, height: 850 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(site + '/');
    if (scenario.locale === 'fa') await page.locator('[data-language="fa"]').click();
    if (scenario.theme === 'dark') await page.locator('.theme-toggle').click();
    await expect(page.locator('.tehran-clock')).toHaveCSS('font-size', '11px');
    await expect(page.locator('#cv-label')).toHaveCSS('font-size', '13px');
    await expect(page.locator('#tehran-time')).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
    const before = await page.locator('#tehran-time').textContent();
    await expect.poll(() => page.locator('#tehran-time').textContent()).not.toBe(before);
    expect(await page.locator('#tehran-time').evaluate(node => {
      const expected = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(node.dateTime));
      return node.textContent === expected;
    })).toBe(true);
    await expect(page.locator('.folder-count, .portal-page-title')).toHaveCount(0);
    if (scenario.theme === 'light') {
      await expect(page.locator('body')).toHaveCSS('color', 'rgb(40, 40, 40)');
      await expect(page.locator('#greeting')).toHaveCSS('color', 'rgb(40, 40, 40)');
      await expect(page.locator('#cv-link')).toHaveCSS('background-color', 'rgb(40, 40, 40)');
    }
    for (const logo of await page.locator('.folder-button[data-section="experience"] .folder-thumb').all()) {
      await expect(logo).toHaveCSS('border-radius', '50%');
      await expect(logo).toHaveCSS('border-top-color', 'rgb(255, 255, 255)');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const icon = await request.get(site + '/assets/figma/download-cv.svg');
    expect(icon.ok()).toBe(true);
    expect(await icon.text()).toContain('fill-opacity="0.5"');

    for (const route of routes) {
      // Use the real SPA so locale/theme persist while checking every interior route.
      await page.evaluate(href => {
        const link = document.createElement('a'); link.href = href; document.body.append(link); link.click(); link.remove();
      }, './' + route);
      await expect(page.locator('body')).toHaveAttribute('data-page', route.startsWith('work') ? 'selected-work' : route.split('.')[0]);
      await expect(page.locator('.portal-page-title')).toHaveCount(0);
      await expect(page.locator('.portal-header')).toHaveCSS('position', 'relative');
      await expect(page.locator('.portal-back')).toHaveCSS('border-radius', '999px');
      await expect(page.locator('#cv-label')).toHaveCSS('font-size', '13px');
      await expect(page.locator('.tehran-clock')).toBeHidden();
      await expect(page.locator('.site-footer')).toHaveCSS('text-align', 'center');
      await expect(page.locator('.site-footer')).toHaveCSS('justify-content', 'center');
      await expect(page.locator('.footer-links')).toHaveCSS('justify-content', 'center');
      if (scenario.width <= 700) await expect(page.locator('.site-footer')).toHaveCSS('align-items', 'center');
      const footerDrift = await page.locator('.site-footer').evaluate(node => {
        const box = node.getBoundingClientRect(), center = box.x + box.width / 2;
        const children = [...node.children].map(child => child.getBoundingClientRect());
        return getComputedStyle(node).flexDirection === 'column'
          ? Math.max(...children.map(box => Math.abs(box.x + box.width / 2 - center)))
          : Math.abs((Math.min(...children.map(box => box.x)) + Math.max(...children.map(box => box.right))) / 2 - center);
      });
      expect(footerDrift).toBeLessThan(1);
      if (route.startsWith('books.html')) {
        for (const title of await page.locator('.library-book-copy h3').all()) await expect(title).toHaveCSS('font-size', '15px');
        for (const card of await page.locator('.library-book-card').all()) {
          await expect(card.locator('.library-book-copy')).toHaveCSS('text-align', 'center');
          const offset = await card.evaluate(node => {
            const cover = node.querySelector('.book-cover').getBoundingClientRect();
            const title = node.querySelector('h3').getBoundingClientRect();
            const author = node.querySelector('.library-book-author').getBoundingClientRect();
            return Math.max(Math.abs(cover.x + cover.width / 2 - title.x - title.width / 2), Math.abs(cover.x + cover.width / 2 - author.x - author.width / 2));
          });
          expect(offset).toBeLessThan(1);
        }
        await page.locator('.library-book-grid').screenshot({ path: resolve(output, `book-captions-${scenario.locale}-${scenario.width}.png`) });
      }
      if (route === 'experience.html') {
        await expect(page.locator('.experience-logo')).toHaveCount(3);
        for (const logo of await page.locator('.experience-logo').all()) {
          await expect(logo).toHaveCSS('border-radius', '50%');
          await expect(logo).toHaveCSS('border-top-width', '3px');
          await expect(logo).toHaveCSS('border-top-color', 'rgb(255, 255, 255)');
          await expect(logo).not.toHaveCSS('box-shadow', 'none');
        }
        await expect(page.locator('.experience-cursor')).toHaveCSS('background-color', scenario.theme === 'light' ? 'rgb(40, 40, 40)' : 'rgb(250, 250, 250)');
        await expect(page.locator('.experience-progress')).toHaveCSS('background-color', scenario.theme === 'light' ? 'rgb(40, 40, 40)' : 'rgb(250, 250, 250)');
      }
      await page.evaluate(async () => { scrollTo({ top: 450, behavior: 'instant' }); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
      const position = await page.locator('.portal-header').evaluate(node => ({ y: node.getBoundingClientRect().top, scroll: scrollY }));
      expect(Math.abs(position.y + position.scroll)).toBeLessThan(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }

    await page.evaluate(() => {
      const link = document.createElement('a'); link.href = './about.html'; document.body.append(link); link.click(); link.remove();
    });
    await expect(page.locator('body')).toHaveAttribute('data-page', 'about');
    await expect(page.locator('.about-introduction h2, .bookshelf-heading, #bookshelf-title, #about-title')).toHaveCount(0);
    await expect(page.locator('.about-introduction p')).toHaveCount(2);
    await expect(page.locator('.book-collection-card')).toHaveCount(6);
    for (const card of await page.locator('.book-collection-card').all()) {
      await expect(card.locator('.book-cover')).toHaveCount(3);
      await expect(card).toHaveCSS('background-image', /walnut-grain\.svg/);
      await expect(card).toHaveCSS('color', 'rgb(255, 248, 239)');
    }
    const card = page.locator('.book-collection-card').first();
    await card.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.evaluate(() => document.fonts.ready);
    await card.screenshot({ path: resolve(output, `shelf-${scenario.locale}-${scenario.theme}-${scenario.width}.png`) });
    await page.locator('.site-footer').screenshot({ path: resolve(output, `footer-${scenario.locale}-${scenario.theme}-${scenario.width}.png`) });
    expect(errors).toEqual([]);
  });
}

test('wood shelf preserves the overlapping three-book fan and its original hover movement in both languages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(site + '/about.html');
  await page.evaluate(() => document.fonts.ready);
  const card = page.locator('.book-collection-card').first();
  const center = card.locator('.book-cover').nth(1);
  const first = card.locator('.book-cover').first();
  const matrix = node => { const m = new DOMMatrixReadOnly(getComputedStyle(node).transform); return { x: m.m41, y: m.m42, rotation: Math.atan2(m.m12, m.m11) * 180 / Math.PI }; };
  for (const locale of ['en', 'fa']) {
    if (locale === 'fa') await page.locator('[data-language="fa"]').click();
    await page.mouse.move(0, 0);
    await card.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect.poll(async () => (await center.evaluate(matrix)).y).toBeCloseTo(-7);
    const resting = await first.evaluate(matrix);
    expect(resting.x).toBeCloseTo(locale === 'fa' ? 106 : -106);
    expect(Math.abs(resting.rotation)).toBeCloseTo(7);
    await card.hover();
    await expect.poll(async () => (await center.evaluate(matrix)).y).toBeCloseTo(-20);
    await expect.poll(async () => Math.abs((await first.evaluate(matrix)).x)).toBeCloseTo(118);
    expect(Math.abs((await first.evaluate(matrix)).rotation)).toBeCloseTo(11);
    await card.screenshot({ path: resolve(output, `shelf-hover-${locale}.png`) });
  }
});

test('original silver folder artwork retains clean clipped layers, subtle hover growth, and lifted content', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 3 });
  const page = await context.newPage();
  await page.goto(site + '/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.folder-button')).toHaveCount(4);
  const folders = page.locator('.folder-button');
  for (const folder of await folders.all()) {
    await expect(folder.locator('.folder-back > img')).toHaveAttribute('src', /folder\.webp$/);
    await expect(folder.locator('.folder-front > img')).toHaveAttribute('src', /folder\.webp$/);
    await expect(folder.locator('.folder-front > img')).not.toHaveCSS('clip-path', 'none');
    const thumb = folder.locator('.folder-thumb').first();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(700);
    const start = await thumb.evaluate(node => node.getBoundingClientRect().y);
    await folder.hover();
    expect(await folder.locator('.folder-front').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).is2D)).toBe(true);
    await expect.poll(() => folder.locator('.folder-visual').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m11)).toBeCloseTo(1.003, 3);
    await expect.poll(async () => start - (await thumb.evaluate(node => node.getBoundingClientRect().y))).toBeGreaterThan(20);
  }
  await page.mouse.move(0, 0);
  await page.waitForTimeout(700);
  await page.locator('.folder-navigation').screenshot({ path: resolve(output, 'folders-clean-3x.png') });
  await folders.first().hover();
  await page.waitForTimeout(700);
  await page.locator('.folder-navigation').screenshot({ path: resolve(output, 'folders-hover-3x.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(folders.first().locator('.folder-visual')).toHaveCSS('transform', 'none');
  await context.close();
});
