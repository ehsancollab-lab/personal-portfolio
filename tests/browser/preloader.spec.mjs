import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const site = process.env.PORTFOLIO_REFINEMENTS_URL || 'http://localhost:4173';
const output = '/workspace/work/portfolio-preloader';
test.beforeEach(async ({ request }) => {
  await mkdir(output, { recursive: true });
  if (!process.env.PORTFOLIO_REFINEMENTS_URL) await request.post(site + '/__test/reset');
});

for (const width of [1440, 390, 320]) {
  test('minimal portrait intro lands in navigation at ' + width + 'px', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      const trace = window.__introTrace = { started: null, finished: null, progress: [], motion: [] };
      new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.id === 'site-preloader') {
              trace.started = performance.now();
              const counter = node.querySelector('.intro-percentage');
              const capture = () => trace.progress.push({ value: Number(counter.textContent.replace('%', '')), time: performance.now() });
              capture();
              new MutationObserver(capture).observe(counter, { childList: true, subtree: true, characterData: true });
            }
            if (node.classList?.contains('intro-avatar-flight')) {
              const sample = () => {
                if (!node.isConnected) return;
                const picture = node.getBoundingClientRect();
                const target = document.querySelector('.nav-home-avatar').getBoundingClientRect();
                trace.motion.push({ x: picture.x, y: picture.y, distance: Math.hypot(picture.x - target.x, picture.y - target.y), width: picture.width, visibility: getComputedStyle(node).visibility });
                requestAnimationFrame(sample);
              };
              requestAnimationFrame(sample);
            }
          }
          for (const node of record.removedNodes) if (node.id === 'site-preloader') trace.finished = performance.now();
        }
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto(site + '/', { waitUntil: 'domcontentloaded' });
    const overlay = page.locator('#site-preloader');
    await expect(overlay).toBeVisible();
    await expect(page.locator('.intro-avatar img')).toHaveAttribute('src', './assets/home/book-avatar.webp');
    await expect(page.locator('.intro-divider')).toHaveText('/');
    await expect(page.locator('.intro-folder, .intro-card, .intro-progress-track, .intro-name, .intro-role')).toHaveCount(0);
    await expect(page.locator('.intro-avatar')).toHaveCSS('border-radius', '50%');
    await expect(page.locator('.intro-avatar')).toHaveCSS('border-top-width', '3px');
    await expect(page.locator('.intro-avatar')).toHaveCSS('border-top-color', 'rgb(255, 255, 255)');
    await expect(page.locator('.intro-progress')).toHaveAttribute('role', 'progressbar');
    const center = await page.locator('.intro-composition').evaluate(node => {
      const box = node.getBoundingClientRect();
      const backdrop = node.closest('.site-preloader').getBoundingClientRect();
      return { x: box.x + box.width / 2 - backdrop.x - backdrop.width / 2, y: box.y + box.height / 2 - backdrop.y - backdrop.height / 2 };
    });
    expect(Math.abs(center.x)).toBeLessThan(1);
    expect(Math.abs(center.y)).toBeLessThan(1);
    await page.waitForTimeout(900);
    await page.screenshot({ path: resolve(output, 'minimal-intro-' + width + '.png') });
    await page.waitForFunction(() => document.querySelector('.intro-percentage')?.textContent === '100%', null, { polling: 'raf', timeout: 5000 });
    await page.waitForFunction(() => !!document.querySelector('.intro-avatar-flight'), null, { polling: 'raf', timeout: 5000 });
    await expect(page.locator('.nav-home-avatar')).toHaveCSS('visibility', 'hidden');
    if (width === 1440) {
      await page.waitForTimeout(180);
      await page.screenshot({ path: resolve(output, 'portrait-handoff-midflight.png') });
    }
    await expect(overlay).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('.intro-avatar-flight, .is-intro-target')).toHaveCount(0);
    await expect(page.locator('.nav-home-avatar')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-preloader', 'complete');
    const trace = await page.evaluate(() => window.__introTrace);
    const duration = trace.finished - trace.started;
    expect(duration).toBeGreaterThan(3750);
    expect(duration).toBeLessThan(5000);
    expect(trace.progress[0].value).toBe(0);
    expect(trace.progress.at(-1).value).toBe(100);
    expect(trace.progress.every((entry, index) => index === 0 || entry.value >= trace.progress[index - 1].value)).toBe(true);
    const fillingTime = trace.progress.find(entry => entry.value === 100).time - trace.started;
    expect(fillingTime).toBeGreaterThan(2950);
    expect(fillingTime).toBeLessThan(3800);
    expect(trace.motion.length).toBeGreaterThan(5);
    expect(trace.motion[0].distance).toBeGreaterThan(50);
    expect(trace.motion.at(-1).distance).toBeLessThan(3);
    expect(trace.motion.every(entry => entry.visibility === 'visible')).toBe(true);
    expect(await page.evaluate(() => [...document.querySelectorAll('body > [inert]')].length)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await writeFile(resolve(output, 'portrait-handoff-' + width + '.json'), JSON.stringify({ duration, fillingTime, ...trace }, null, 2));
    await page.screenshot({ path: resolve(output, 'minimal-home-' + width + '.png') });
    expect(errors).toEqual([]);
  });
}

test('intro remains finished during section navigation and replays on a fresh reload', async ({ page }) => {
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
  await page.locator('.nav-home-avatar').click();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'home');
  expect(await page.evaluate(() => window.__introRemounts)).toBe(0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#site-preloader')).toBeVisible();
  await expect(page.locator('#site-preloader')).toHaveCount(0);
});

test('reduced motion has no forced duration or portrait flight', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/app.js', async route => { await new Promise(resolve => setTimeout(resolve, 600)); await route.continue(); });
  await page.goto(site + '/', { waitUntil: 'commit' });
  await expect(page.locator('#site-preloader')).toBeVisible();
  await expect(page.locator('.intro-avatar')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('#site-preloader')).toHaveCount(0, { timeout: 2500 });
  await expect(page.locator('.intro-avatar-flight')).toHaveCount(0);
  await expect(page.locator('.nav-home-avatar')).toBeVisible();
});

test('keyboard users can skip the introduction immediately', async ({ page }) => {
  await page.goto(site + '/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#site-preloader')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator('#site-preloader')).toHaveCount(0);
  await expect(page.locator('.skip-link')).toBeFocused();
  expect(await page.locator('main').evaluate(node => node.inert)).toBe(false);
});

test('resizing during the portrait handoff reveals the correctly placed navigation avatar', async ({ page }) => {
  await page.goto(site + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('.intro-avatar-flight'), null, { polling: 'raf', timeout: 6000 });
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(page.locator('#site-preloader, .intro-avatar-flight, .is-intro-target')).toHaveCount(0);
  await expect(page.locator('.nav-home-avatar')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a failed application bundle cannot strand the visitor behind the loader', async ({ page }) => {
  await page.route('**/app.js', route => route.abort());
  await page.goto(site + '/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#site-preloader')).toBeVisible();
  await expect(page.locator('#site-preloader')).toHaveCount(0, { timeout: 9000 });
  await expect(page.locator('.nav-home-avatar')).toBeVisible();
  await expect(page.locator('#greeting')).toBeVisible();
  expect(await page.locator('main').evaluate(node => node.inert)).toBe(false);
});

test('direct book links keep the correctly fitted attribution portrait', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/book/?id=behave');
  await expect(page.locator('html')).toHaveAttribute('data-preloader', 'complete');
  const image = page.locator('.book-quote-portrait');
  await expect(image).toHaveAttribute('src', './assets/home/book-avatar.webp');
  const geometry = await image.evaluate(node => {
    const box = node.getBoundingClientRect(), frame = node.parentElement.getBoundingClientRect();
    return { width: box.width, height: box.height, x: box.x - frame.x, y: box.y - frame.y };
  });
  expect(geometry).toEqual({ width: 40, height: 40, x: 0, y: 0 });
});

test('disabling JavaScript keeps the static homepage and home avatar visible', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(site + '/');
  await expect(page.locator('#greeting')).toBeVisible();
  await expect(page.locator('.nav-home-avatar')).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/is-preloading/);
  await expect(page.locator('#site-preloader, #cv-link')).toHaveCount(0);
  await context.close();
});

test('navigation avatar returns home from every interior route in both languages and mobile sizes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/');
  const routes = ['work.html', 'case-studies.html', 'experience.html', 'about.html', 'books.html?category=growth', 'book.html?id=behave', 'case-study.html?id=mohtavachi-content-calendar', 'index.html#selected-work'];
  for (const locale of ['en', 'fa']) {
    if (locale === 'fa') await page.locator('[data-language="fa"]').click();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await page.evaluate(href => {
          const link = document.createElement('a'); link.href = href; document.body.append(link); link.click(); link.remove();
        }, './' + route);
        await expect(page.locator('body')).not.toHaveAttribute('data-page', 'home');
        await expect(page.locator('.portal-back-label')).toHaveText(locale === 'fa' ? 'بازگشت' : 'Back');
        await page.locator('.nav-home-avatar').click();
        await expect(page.locator('body')).toHaveAttribute('data-page', 'home');
        await expect(page.locator('.nav-home-avatar')).toHaveAttribute('aria-current', 'page');
        await expect(page.locator('.tehran-clock')).toBeVisible();
        await expect(page.locator('#cv-link, #site-preloader')).toHaveCount(0);
        expect(await page.locator('.nav-home-avatar').evaluate(node => {
          const box = node.getBoundingClientRect(), root = document.documentElement.getBoundingClientRect();
          return box.x >= root.x && box.right <= root.right;
        })).toBe(true);
      }
    }
  }
});
