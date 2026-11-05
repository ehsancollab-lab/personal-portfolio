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
    expect(box.x).toBeGreaterThanOrEqual(8); expect(box.x + box.width).toBeLessThanOrEqual(width - 8);
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

test('compact floating navigation keeps all four labels visible without overlap at 350px and 320px', async ({ page }) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/about.html');
  const nav = page.locator('.floating-nav');
  const show = async () => {
    await page.evaluate(() => scrollTo({ top: document.querySelector('.primary-nav').getBoundingClientRect().bottom + scrollY + 12, behavior: 'instant' }));
    await expect(nav).toHaveAttribute('aria-hidden', 'false');
  };
  for (const locale of ['en', 'fa']) {
    await page.locator('[data-language="' + locale + '"]').click();
    await page.evaluate(() => document.fonts.ready);
    const expected = locale === 'fa' ? ['کارها', 'کیس‌ها', 'سوابق', 'درباره'] : ['Work', 'Cases', 'Career', 'About'];
    for (const width of [420, 390, 375, 374, 360, 350, 320]) {
      await page.setViewportSize({ width, height: 700 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await show();
      expect(await nav.locator('a').allTextContents()).toEqual(expected);
      expect(await nav.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      const frame = await nav.boundingBox();
      const links = await nav.locator('a').evaluateAll(nodes => nodes.map(node => {
        const rect = node.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, fits: node.scrollWidth <= node.clientWidth, label: node.getAttribute('aria-label') };
      }));
      const originalLabels = await page.locator('.primary-nav a').allTextContents();
      expect(links.map(link => link.label)).toEqual(originalLabels);
      for (const link of links) {
        expect(link.fits).toBe(true);
        expect(link.width).toBeGreaterThanOrEqual(44);
        expect(link.height).toBeGreaterThanOrEqual(44);
        expect(link.x).toBeGreaterThanOrEqual(frame.x + 4);
        expect(link.x + link.width).toBeLessThanOrEqual(frame.x + frame.width - 4);
      }
      expect(Math.max(...links.map(link => link.y)) - Math.min(...links.map(link => link.y))).toBeLessThan(1);
      const ordered = [...links].sort((a, b) => a.x - b.x);
      for (let index = 1; index < ordered.length; index++) expect(ordered[index].x).toBeGreaterThan(ordered[index - 1].x + ordered[index - 1].width);
      if (width === 350) await page.screenshot({ path: resolve(work, `floating-${locale}-350-fixed.png`) });
    }
    for (const width of [350, 320]) {
      await page.setViewportSize({ width, height: 700 });
      for (const destination of ['selected-work', 'case-studies', 'experience', 'about']) {
        await show();
        await nav.locator('[data-page-link="' + destination + '"]').click();
        await expect(page.locator('body')).toHaveAttribute('data-page', destination);
        await expect(nav.locator('[aria-current="page"]')).toHaveAttribute('data-page-link', destination);
        expect(await nav.locator('a').allTextContents()).toEqual(expected);
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await show();
  expect(await nav.locator('a').allTextContents()).toEqual(await page.locator('.primary-nav a').allTextContents());
});

test('pointer has no hover halo and only a completed click emits a temporary ring and local audio', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__taps = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() { window.__taps.push(this.src); return play.call(this); };
  });
  await page.goto(site + '/experience.html');
  await page.mouse.move(260, 180);
  const halo = page.locator('.cursor-halo');
  await expect(halo).toHaveCount(0);
  await expect(page.locator('.click-ring')).toHaveCount(0);
  const target = page.locator('[data-language="fa"]'); await target.hover();
  await expect(halo).toHaveCount(0);
  await expect(page.locator('.click-ring')).toHaveCount(0);
  await page.mouse.move(260, 180);
  await page.mouse.down();
  await expect(halo).toHaveCount(0);
  await expect(page.locator('.click-ring')).toHaveCount(0);
  expect(await page.evaluate(() => window.__taps)).toEqual([]);
  await page.mouse.up();
  await expect(page.locator('.click-ring')).toHaveCount(1);
  await expect(page.locator('.click-ring')).toHaveCSS('pointer-events', 'none');
  await expect(page.locator('.click-ring')).toHaveCSS('left', '260px');
  await expect(page.locator('.click-ring')).toHaveCSS('top', '180px');
  await page.screenshot({ path: resolve(work, 'pointer-click-ring.png') });
  await expect(page.locator('.click-ring')).toHaveCount(0);
  await expect(halo).toHaveCount(0);
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
  await target.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
  expect(await page.evaluate(() => window.__taps.length)).toBe(2);
  await expect(page.locator('.click-ring')).toHaveCount(0);
  await expect(halo).toHaveCount(0);
  await target.evaluate(button => button.click());
  expect(await page.evaluate(() => window.__taps.length)).toBe(2);
  for (let index = 0; index < 3; index++) await page.mouse.click(260, 180);
  expect(await page.evaluate(() => window.__taps.length)).toBe(5);
  await expect(page.locator('.click-ring')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('touch scrolling emits neither ring nor audio while a completed tap emits both', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 350, height: 700 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.addInitScript(() => {
      window.__taps = []; window.__rings = 0;
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function() { window.__taps.push(this.src); return play.call(this); };
      new MutationObserver(records => {
        for (const record of records) for (const node of record.addedNodes) if (node.classList?.contains('click-ring')) window.__rings++;
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto(site + '/about.html');
    const input = await context.newCDPSession(page);
    await input.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 170, y: 550 }] });
    for (const y of [520, 480, 430, 380, 330]) await input.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 170, y }] });
    await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    expect(await page.evaluate(() => ({ taps: window.__taps.length, rings: window.__rings }))).toEqual({ taps: 0, rings: 0 });
    await expect(page.locator('.cursor-halo')).toHaveCount(0);
    await page.touchscreen.tap(10, 250);
    await expect.poll(() => page.evaluate(() => window.__taps.length)).toBe(1);
    expect(await page.evaluate(() => window.__rings)).toBe(1);
    await expect(page.locator('.click-ring')).toHaveCount(0);
  } finally { await context.close(); }
});

test('reduced motion keeps click audio and suppresses ripple and page motion; Escape follows the styled Back link', async ({ page }) => {
  await page.addInitScript(() => {
    window.__taps = 0;
    HTMLMediaElement.prototype.play = function() { window.__taps++; return Promise.resolve(); };
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/book.html?id=self-compassion');
  await expect(page.locator('.library-back')).toHaveCSS('border-top-left-radius', '9px');
  await expect(page.locator('.library-back')).toHaveAttribute('aria-keyshortcuts', 'Escape');
  await page.mouse.click(260, 180);
  await expect(page.locator('.click-ring')).toHaveCount(0);
  await expect(page.locator('.cursor-halo')).toHaveCount(0);
  expect(await page.evaluate(() => window.__taps)).toBe(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('.collection-panel h1')).toHaveText('Psychology & relationships');
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).toHaveAttribute('data-page', 'about');
  await expect.poll(() => page.locator('main').evaluate(node => node.getAnimations().length)).toBe(0);
});

test('page and text entrance use blur and vertical motion and rapid navigation keeps the last destination', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(site + '/experience.html');
  const frames = await page.locator('.experience-role').first().evaluate(node => node.getAnimations().flatMap(animation => animation.effect.getKeyframes()));
  expect(frames.some(frame => frame.filter === 'blur(5px)')).toBe(true);
  await page.evaluate(() => {
    document.querySelector('.primary-nav [data-page-link="about"]').click();
    document.querySelector('.primary-nav [data-page-link="case-studies"]').click();
  });
  await expect(page.locator('body')).toHaveAttribute('data-page', 'case-studies');
  await expect.poll(() => page.locator('main').evaluate(node => node.style.filter)).toBe('');
  expect(errors).toEqual([]);
});
