import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
const site = process.env.PORTFOLIO_REFINEMENTS_URL || 'http://localhost:4173';
const work = resolve(import.meta.dirname, '../../../work/portfolio-browser');
test.beforeEach(async ({ request }) => { if (!process.env.PORTFOLIO_REFINEMENTS_URL) await request.post(site + '/__test/reset'); });

test('Experience cursor smoothly follows the solid progress line, updates gray stations and reverses cleanly', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(site + '/experience.html');
  const track = page.locator('.experience-track'), cursor = page.locator('.experience-cursor');
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.locator('main').evaluate(node => node.style.transform)).toBe('');
  await expect(cursor).toHaveCSS('background-color', 'rgb(40, 40, 40)');
  await expect(page.locator('.experience-entry').last().locator('.experience-dot')).not.toHaveCSS('background-color', 'rgb(40, 40, 40)');
  await expect.poll(async () => Number(await track.getAttribute('data-progress'))).toBeCloseTo(0, 2);
  const range = await track.evaluate(node => {
    const top = node.getBoundingClientRect().top + scrollY;
    const start = Math.max(0, top - innerHeight * .58);
    const end = Math.min(document.documentElement.scrollHeight - innerHeight, top + node.clientHeight - innerHeight * .58);
    return { start, length: end - start };
  });
  const samples = await page.evaluate(async ({ start, length }) => {
    const samples = [];
    scrollTo({ top: start + length * .55, behavior: 'instant' });
    for (let frame = 0; frame < 12; frame++) { await new Promise(requestAnimationFrame); samples.push(Number(document.querySelector('.experience-track').dataset.progress)); }
    return samples;
  }, range);
  await test.info().attach('timeline-motion-samples', { body: JSON.stringify({ range, samples }), contentType: 'application/json' });
  expect(samples.some(value => value > .005 && value < .55 - .001)).toBe(true);
  await expect.poll(async () => Number(await track.getAttribute('data-progress'))).toBeCloseTo(.55, 1);
  const aligned = await track.evaluate(node => {
    const t = node.getBoundingClientRect(), c = node.querySelector('.experience-cursor').getBoundingClientRect();
    return { x: Math.abs(c.x + c.width / 2 - t.x - t.width / 2), progress: (c.y + c.height / 2 - t.y) / t.height };
  });
  expect(aligned.x).toBeLessThan(1);
  expect(aligned.progress).toBeCloseTo(.55, 1);
  await page.screenshot({ path: resolve(work, 'experience-smooth-progress.png') });
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect.poll(async () => Number(await track.getAttribute('data-progress'))).toBeCloseTo(1, 2);
  await expect(page.locator('.experience-entry.is-passed')).toHaveCount(3);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(async () => Number(await track.getAttribute('data-progress'))).toBeCloseTo(0, 2);
  await expect(page.locator('.experience-entry.is-passed')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('[data-language="fa"]').click();
  await page.setViewportSize({ width: 350, height: 800 });
  await expect(page.locator('.experience-track')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: resolve(work, 'experience-timeline-fa-350.png') });
  await page.locator('.portal-back').click();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'home');
  await page.locator('.folder-button[data-section="about"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'about');
  expect(errors).toEqual([]);
});

test('portrait navigation stays on one row from 320px to desktop in both languages', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/experience.html');
  for (const locale of ['en', 'fa']) {
    if (locale === 'fa') await page.locator('[data-language="fa"]').click();
    await page.evaluate(() => document.fonts.ready);
    for (const route of ['home', 'experience']) {
      if (route === 'home') await page.locator('.nav-home-avatar').click();
      else await page.locator('.folder-button[data-section="experience"]').click();
      await expect(page.locator('body')).toHaveAttribute('data-page', route);
      for (const width of [1920, 1024, 701, 700, 430, 390, 360, 350, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.locator('#cv-link, #cv-label')).toHaveCount(0);
        await expect(page.locator('.nav-home-avatar')).toHaveCSS('border-radius', '50%');
        await expect(page.locator('.nav-home-avatar')).toHaveCSS('border-top-width', '3px');
        await expect(page.locator('.nav-home-avatar')).toHaveCSS('width', '40px');
        await expect(page.locator('.nav-home-avatar')).toHaveCSS('height', '40px');
        await expect(page.locator('.nav-divider')).toHaveCSS('font-size', '14px');
        await expect(page.locator('.nav-divider')).toHaveCSS('color', 'rgb(115, 115, 115)');
        const metrics = await page.locator('.portal-header').evaluate(node => {
          const header = node.getBoundingClientRect();
          const left = node.querySelector('.portal-header-left').getBoundingClientRect();
          const right = node.querySelector('.portal-header-right').getBoundingClientRect();
          const page = document.documentElement.getBoundingClientRect();
          const avatar = node.querySelector('.nav-home-avatar').getBoundingClientRect();
          return { gap: right.x - left.right, rowOffset: Math.abs(left.y + left.height / 2 - right.y - right.height / 2), leftInside: left.x >= header.x, rightInside: right.right <= header.right, pageInside: header.x >= page.x && header.right <= page.right, avatarInside: avatar.x >= page.x && avatar.right <= page.right };
        });
        expect(metrics.gap).toBeGreaterThanOrEqual(5);
        expect(metrics.rowOffset).toBeLessThan(1);
        expect(metrics.leftInside && metrics.rightInside).toBe(true);
        expect(metrics.pageInside && metrics.avatarInside).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (route === 'home') {
          await expect(page.locator('.tehran-clock')).toBeVisible();
          await expect(page.locator('.portal-back')).toBeHidden();
        } else {
          await expect(page.locator('.tehran-clock')).toBeHidden();
          await expect(page.locator('.portal-back-label')).toHaveText(locale === 'fa' ? 'بازگشت' : 'Back');
          await expect(page.locator('.portal-back')).toHaveCSS('text-decoration-line', 'underline');
        }
        if ([1920, 390, 320].includes(width)) await page.locator('.portal-header').screenshot({ path: resolve(work, 'portrait-header-' + route + '-' + locale + '-' + width + '.png') });
      }
    }
  }
});
