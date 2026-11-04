import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
const site = 'http://localhost:4173';
const work = resolve(import.meta.dirname, '../../../work/portfolio-browser');
test.beforeEach(async ({ request }) => { await request.post(site + '/__test/reset'); });

test('floating capsule appears only after the original tabs leave view and navigates all four sections', async ({ page }) => {
  const documents = []; const errors = [];
  page.on('request', request => { if (request.isNavigationRequest()) documents.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto(site + '/about.html');
  const floating = page.locator('.floating-nav');
  await expect(floating).toHaveAttribute('aria-hidden', 'true');
  for (const [destination, selected] of [['experience', 'Experience'], ['case-studies', 'Case Studies'], ['selected-work', 'Selected Work'], ['about', 'About Me']]) {
    await page.evaluate(() => scrollTo({ top: document.querySelector('.primary-nav').getBoundingClientRect().bottom + scrollY + 10, behavior: 'instant' }));
    await expect(floating).toHaveAttribute('aria-hidden', 'false');
    await expect(floating).toHaveClass(/is-visible/);
    await expect(floating.locator('a')).toHaveCount(4);
    const bounds = await floating.boundingBox();
    expect(Math.abs(bounds.x + bounds.width / 2 - 720)).toBeLessThan(1);
    expect(bounds.y + bounds.height).toBeLessThan(700);
    await floating.getByRole('link', { name: selected, exact: true }).click();
    await expect(page.locator('body')).toHaveAttribute('data-page', destination);
    await expect(page.locator('.primary-nav [aria-current="page"]')).toHaveText(selected);
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect(floating).toHaveAttribute('aria-hidden', 'true');
  expect(documents).toHaveLength(1); expect(errors).toEqual([]);
});

test('floating navigation fits mobile, mirrors Persian and disappears on book and case detail routes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/about.html');
  await page.locator('[data-language="fa"]').click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => scrollTo({ top: 900, behavior: 'instant' }));
    await expect(page.locator('.floating-nav')).toHaveAttribute('aria-hidden', 'false');
    const box = await page.locator('.floating-nav').boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(10); expect(box.x + box.width).toBeLessThanOrEqual(width - 10);
    await expect(page.locator('.floating-nav')).toHaveCSS('direction', 'rtl');
    await page.screenshot({ path: resolve(work, `floating-fa-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.locator('.book-collection-card').first().click();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'books');
  await expect(page.locator('.floating-nav')).toHaveAttribute('aria-hidden', 'true');
  await page.goto(site + '/case-study.html?id=mohtavachi-content-calendar');
  await page.evaluate(() => scrollTo({ top: 900, behavior: 'instant' }));
  await expect(page.locator('.floating-nav')).toHaveAttribute('aria-hidden', 'true');
});

test('pointer halo presses, emits a short-lived click ring and plays the actual local video sample', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__taps = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() { window.__taps.push(this.src); return play.call(this); };
  });
  await page.goto(site + '/experience.html');
  await page.mouse.move(260, 180);
  const halo = page.locator('.cursor-halo');
  await expect(halo).toHaveClass(/is-visible/);
  await expect(halo).toHaveCSS('pointer-events', 'none');
  await page.mouse.down();
  await expect(halo).toHaveClass(/is-pressed/);
  await expect(page.locator('.click-ring')).toHaveCount(1);
  expect(await page.evaluate(() => window.__taps)).toEqual([]);
  await page.screenshot({ path: resolve(work, 'pointer-click-ring.png') });
  await page.mouse.up();
  await expect(halo).not.toHaveClass(/is-pressed/);
  await expect(page.locator('.click-ring')).toHaveCount(0);
  expect(await page.evaluate(() => window.__taps)).toEqual([site + '/assets/audio/tap.wav']);
  const response = await page.request.get(site + '/assets/audio/tap.wav');
  expect(response.ok()).toBe(true);
  expect((await response.body()).subarray(0, 4).toString()).toBe('RIFF');
  const duration = await page.evaluate(async () => {
    const context = new AudioContext();
    const bytes = await (await fetch('/assets/audio/tap.wav')).arrayBuffer();
    const buffer = await context.decodeAudioData(bytes); await context.close(); return buffer.duration;
  });
  expect(duration).toBeCloseTo(.22, 2);
  const target = page.locator('[data-language="fa"]'); await target.hover();
  await expect(halo).toHaveClass(/is-interactive/);
  expect(errors).toEqual([]);
});

test('reduced motion keeps click audio and suppresses ripple and page motion; Escape follows the styled Back link', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/book.html?id=self-compassion');
  await expect(page.locator('.library-back')).toHaveCSS('border-top-left-radius', '9px');
  await expect(page.locator('.library-back')).toHaveAttribute('aria-keyshortcuts', 'Escape');
  await page.mouse.click(260, 180);
  await expect(page.locator('.click-ring')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.collection-panel h1')).toHaveText('Psychology & relationships');
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).toHaveAttribute('data-page', 'about');
  await expect.poll(() => page.locator('main').evaluate(node => node.getAnimations().length)).toBe(0);
});

test('page and text entrance use blur and vertical motion and rapid navigation keeps the last destination', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(site + '/experience.html');
  const frames = await page.locator('.experience-company').first().evaluate(node => node.getAnimations().flatMap(animation => animation.effect.getKeyframes()));
  expect(frames.some(frame => frame.filter === 'blur(5px)')).toBe(true);
  await page.evaluate(() => {
    document.querySelector('.primary-nav [data-page-link="about"]').click();
    document.querySelector('.primary-nav [data-page-link="case-studies"]').click();
  });
  await expect(page.locator('body')).toHaveAttribute('data-page', 'case-studies');
  await expect.poll(() => page.locator('main').evaluate(node => node.style.filter)).toBe('');
  expect(errors).toEqual([]);
});
