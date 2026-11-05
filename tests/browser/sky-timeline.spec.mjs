import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
const site = 'http://localhost:4173';
const work = resolve(import.meta.dirname, '../../../work/portfolio-browser');
test.beforeEach(async ({ request }) => { await request.post(site + '/__test/reset'); });

test('day and night sky sit directly behind readable content without a central overlay', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(site + '/about.html');
  await expect(page.locator('.sky-background')).toHaveCount(1);
  await expect(page.locator('.sky-background')).toHaveAttribute('aria-hidden', 'true');
  await expect.poll(() => page.locator('.sky-background img').evaluateAll(nodes => nodes.every(n => n.complete && n.naturalWidth > 0))).toBe(true);
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.locator('.theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('.sky-day')).toHaveCSS('opacity', theme === 'light' ? '1' : '0');
    await expect(page.locator('.sky-night')).toHaveCSS('opacity', theme === 'dark' ? '1' : '0');
    await expect(page.locator('.site-backdrop')).toHaveCount(0);
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('main')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('body')).toHaveCSS('color', theme === 'light' ? 'rgb(51, 51, 51)' : 'rgb(241, 241, 243)');
    await expect(page.locator('.bio a').first()).toHaveCSS('color', theme === 'light' ? 'rgb(63, 63, 63)' : 'rgb(198, 198, 203)');
    const celestial = await page.locator(theme === 'light' ? '.sky-sun' : '.sky-moon').boundingBox();
    expect(theme === 'light' ? celestial.x > 960 : celestial.x < 960).toBe(true);
    await page.screenshot({ path: resolve(work, `sky-no-surface-${theme}-1920.png`) });
    for (const width of [350, 320]) {
      await page.setViewportSize({ width, height: 800 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: resolve(work, `sky-no-surface-${theme}-${width}.png`) });
    }
    await page.setViewportSize({ width: 1920, height: 1080 });
  }
  await page.locator('[data-language="fa"]').click();
  await page.locator('.primary-nav [data-page-link="experience"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.sky-background')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(errors).toEqual([]);
});

test('clouds and occasional bird flights animate, pause when reduced motion is selected and never intercept input', async ({ page }) => {
  await page.goto(site + '/experience.html');
  await expect(page.locator('.sky-background')).toHaveCSS('pointer-events', 'none');
  await expect(page.locator('.site-backdrop')).toHaveCount(0);
  await expect(page.locator('.sky-day .sky-cloud-image')).toHaveCSS('animation-name', 'sky-cloud-drift');
  const flock = page.locator('.sky-flock');
  await flock.evaluate(node => { const a = node.getAnimations()[0]; a.pause(); a.currentTime = 7000; });
  await expect(flock).toHaveCSS('opacity', '0.48');
  await page.screenshot({ path: resolve(work, 'sky-birds-in-flight.png') });
  await flock.evaluate(node => { node.getAnimations()[0].currentTime = 32000; });
  await expect(flock).toHaveCSS('opacity', '0');
  await page.locator('.theme-toggle').click();
  await expect(page.locator('.sky-day')).toHaveCSS('opacity', '0');
  await expect(page.locator('.sky-night')).toHaveCSS('opacity', '1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.sky-background')).toHaveAttribute('data-motion', 'still');
  await expect(page.locator('.sky-day .sky-cloud-image')).toHaveCSS('animation-name', 'none');
  await expect(flock).toHaveCSS('display', 'none');
  await page.locator('.primary-nav [data-page-link="about"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'about');
});

test('all public routes keep the sky exposed in both languages and themes with readable Experience metadata', async ({ page }) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (const route of ['/', '/about.html', '/experience.html', '/case-studies.html', '/books.html?category=psychology', '/book.html?id=self-compassion', '/case-study.html?id=mohtavachi-content-calendar']) {
    await page.goto(site + route);
    for (const locale of ['en', 'fa']) {
      await page.locator('[data-language="' + locale + '"]').click();
      for (const theme of ['light', 'dark']) {
        if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('.theme-toggle').click();
        await expect(page.locator('.site-backdrop')).toHaveCount(0);
        await expect(page.locator('body')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expect(page.locator('main')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        if (route === '/experience.html') {
          await expect(page.locator('.experience-company').first()).toHaveCSS('color', theme === 'light' ? 'rgb(63, 63, 63)' : 'rgb(198, 198, 203)');
          await expect(page.locator('.experience-date-range').first()).toHaveCSS('opacity', '1');
        }
        if (route === '/' || route.startsWith('/book.html') || route === '/experience.html') {
          await page.screenshot({ path: resolve(work, `sky-no-surface-${route === '/' ? 'work' : route.startsWith('/book.html') ? 'book' : 'experience'}-${locale}-${theme}.png`) });
        }
      }
    }
  }
});

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
    if (width === 1920 || width === 350) await page.screenshot({ path: resolve(work, `sky-fa-cv-${width}.png`) });
  }
});
