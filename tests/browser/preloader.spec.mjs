import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const site = process.env.PORTFOLIO_REFINEMENTS_URL || 'http://localhost:4173';
const output = '/workspace/work/portfolio-preloader';
test.beforeEach(async ({ request }) => {
  await mkdir(output, { recursive: true });
  if (!process.env.PORTFOLIO_REFINEMENTS_URL) await request.post(site + '/__test/reset');
});

for (const width of [1440, 390, 320]) {
  test(`folder introduction opens and releases the homepage at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(site + '/', { waitUntil: 'domcontentloaded' });
    const overlay = page.locator('#site-preloader');
    await expect(overlay).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('main')).toHaveCSS('visibility', 'hidden');
    await expect(page.locator('.intro-card')).toHaveCount(4);
    await expect(page.locator('.intro-card.has-image')).toHaveCount(4);
    if (process.env.PORTFOLIO_REFINEMENTS_URL) {
      await expect(page.locator('.intro-card[data-kind="work"] img')).toHaveAttribute('sizes', '60px');
      await expect(page.locator('.intro-card[data-kind="work"] img')).toHaveAttribute('srcset', /\S+ \d+w/);
    }
    await expect(overlay).toHaveCSS('background-color', 'rgb(250, 250, 250)');
    await expect(page.locator('.intro-name')).toHaveCSS('color', 'rgb(40, 40, 40)');
    await page.waitForTimeout(400);
    await page.screenshot({ path: resolve(output, `intro-${width}.png`) });
    await expect(overlay).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('html')).toHaveAttribute('data-preloader', 'complete');
    await expect(page.locator('html')).not.toHaveClass(/is-preloading/);
    await expect(page.locator('main')).toHaveCSS('visibility', 'visible');
    expect(await page.evaluate(() => [...document.querySelectorAll('body > [inert]')].length)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: resolve(output, `homepage-${width}.png`) });
    expect(errors).toEqual([]);
  });
}

test('intro plays on a fresh document, stays finished during section navigation, and replays on reload', async ({ page }) => {
  await page.goto(site + '/');
  await expect(page.locator('html')).toHaveAttribute('data-preloader', 'complete');
  await page.evaluate(() => {
    window.__introRemounts = 0;
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) if (node.id === 'site-preloader') window.__introRemounts++;
    }).observe(document.body, { childList: true });
  });
  await page.locator('.folder-button[data-section="about"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'about');
  await page.locator('.portal-back').click();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'home');
  expect(await page.evaluate(() => window.__introRemounts)).toBe(0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#site-preloader')).toBeVisible();
  await expect(page.locator('#site-preloader')).toHaveCount(0);
});

test('reduced motion has no forced intro duration or animated cards', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/app.js', async route => { await new Promise(resolve => setTimeout(resolve, 600)); await route.continue(); });
  await page.goto(site + '/', { waitUntil: 'commit' });
  await expect(page.locator('#site-preloader')).toBeVisible();
  await expect(page.locator('.intro-card').first()).toHaveCSS('animation-name', 'none');
  // The shared reduced-motion rule uses 0.01ms !important rather than literal 0s.
  expect(await page.locator('#site-preloader').evaluate(node => parseFloat(getComputedStyle(node).transitionDuration))).toBeLessThanOrEqual(.00001);
  await expect(page.locator('#site-preloader')).toHaveCount(0, { timeout: 2500 });
  await expect(page.locator('#greeting')).toBeVisible();
});

test('keyboard users can skip the introduction immediately', async ({ page }) => {
  await page.goto(site + '/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#site-preloader')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator('#site-preloader')).toHaveCount(0);
  await expect(page.locator('.skip-link')).toBeFocused();
  expect(await page.locator('main').evaluate(node => node.inert)).toBe(false);
});

test('a failed application bundle cannot strand the visitor behind the loader', async ({ page }) => {
  await page.route('**/app.js', route => route.abort());
  await page.goto(site + '/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#site-preloader')).toBeVisible();
  await expect(page.locator('#site-preloader')).toHaveCount(0, { timeout: 5500 });
  await expect(page.locator('#greeting')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-preloader', 'complete');
  expect(await page.locator('main').evaluate(node => node.inert)).toBe(false);
});

test('direct book links have the corrected square portrait without translated clipping', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/book/?id=behave');
  await expect(page.locator('html')).toHaveAttribute('data-preloader', 'complete');
  const image = page.locator('.book-quote-portrait');
  await expect(image).toHaveAttribute('src', './assets/home/book-avatar.webp');
  const dimensions = await image.evaluate(node => {
    const image = node.getBoundingClientRect(), frame = node.parentElement.getBoundingClientRect();
    return { naturalWidth: node.naturalWidth, naturalHeight: node.naturalHeight, width: image.width, height: image.height, xOffset: image.x - frame.x, yOffset: image.y - frame.y };
  });
  expect(dimensions).toEqual({ naturalWidth: 192, naturalHeight: 192, width: 40, height: 40, xOffset: 0, yOffset: 0 });
  await page.locator('.book-quote-attribution').screenshot({ path: resolve(output, 'corrected-avatar.png') });
});

test('disabling JavaScript never hides the static homepage', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(site + '/');
  await expect(page.locator('#greeting')).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/is-preloading/);
  await expect(page.locator('#site-preloader')).toHaveCount(0);
  await context.close();
});
