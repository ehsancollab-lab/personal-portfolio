import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
const site = 'http://localhost:4173';
const work = resolve(import.meta.dirname, '../../../work/portfolio-browser');
test.beforeEach(async ({ request }) => { await request.post(site + '/__test/reset'); });

test('Experience cursor smoothly follows the solid progress line, updates gray stations and reverses cleanly', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(site + '/experience.html');
  const track = page.locator('.experience-track'), cursor = page.locator('.experience-cursor');
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.locator('main').evaluate(node => node.style.transform)).toBe('');
  await expect(cursor).toHaveCSS('background-color', 'rgb(34, 85, 255)');
  await expect(page.locator('.experience-entry').last().locator('.experience-dot')).not.toHaveCSS('background-color', 'rgb(34, 85, 255)');
  const range = await track.evaluate(node => ({ start: node.getBoundingClientRect().top + scrollY - innerHeight * .58, length: node.clientHeight }));
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
  await page.locator('.primary-nav [data-page-link="about"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'about');
  expect(errors).toEqual([]);
});

test('Persian CV label is SemiBold and its button hugs its contents on desktop and mobile', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/about.html');
  await page.locator('[data-language="fa"]').click();
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1920, 700, 390, 350, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('#cv-link')).toHaveCSS('font-weight', '600');
    const metrics = await page.locator('#cv-link').evaluate(node => {
      const style = getComputedStyle(node);
      return { actual: node.getBoundingClientRect().width, contents: [...node.children].reduce((sum, item) => sum + item.getBoundingClientRect().width, 0) + parseFloat(style.columnGap) + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) };
    });
    expect(Math.abs(metrics.actual - metrics.contents)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 1920 || width === 350) await page.screenshot({ path: resolve(work, `fa-cv-${width}.png`) });
  }
});
