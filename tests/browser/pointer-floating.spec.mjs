import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
const site = 'http://localhost:4173';
const work = resolve(import.meta.dirname, '../../../work/portfolio-browser');
test.beforeEach(async ({ request }) => { await request.post(site + '/__test/reset'); });

function observeClickAudio() {
  window.__taps = []; window.__audioContexts = 0; window.__mediaPlays = 0;
  const NativeAudioContext = window.AudioContext;
  window.AudioContext = class extends NativeAudioContext {
    constructor(...args) { super(...args); window.__audioContexts++; }
    createOscillator() {
      const oscillator = super.createOscillator(), start = oscillator.start.bind(oscillator);
      oscillator.start = at => { window.__taps.push(at); return start(at); };
      return oscillator;
    }
  };
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function() { window.__mediaPlays++; return play.call(this); };
}

test('bottom navigation is absent at every scroll position while header tabs still navigate', async ({ page }) => {
  test.setTimeout(90000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/about.html');
  for (const locale of ['en', 'fa']) {
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.locator('[data-language="' + locale + '"]').click();
    for (const width of [1440, 350, 320]) {
      await page.setViewportSize({ width, height: 800 });
      for (const destination of ['selected-work', 'case-studies', 'experience', 'about']) {
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
        await page.locator('.primary-nav [data-page-link="' + destination + '"]').click();
        await expect(page.locator('body')).toHaveAttribute('data-page', destination);
        await expect(page.locator('.primary-nav')).toHaveCount(1);
        await expect(page.locator('.primary-nav a')).toHaveCount(4);
        for (const position of ['top', 'middle', 'bottom']) {
          await page.evaluate(position => scrollTo({ top: position === 'top' ? 0 : position === 'middle' ? document.documentElement.scrollHeight / 2 : document.documentElement.scrollHeight, behavior: 'instant' }), position);
          await expect(page.locator('.floating-nav')).toHaveCount(0);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      if (width === 350) await page.screenshot({ path: resolve(work, `no-floating-navigation-${locale}-350.png`) });
    }
  }
  for (const path of ['/book.html?id=self-compassion', '/case-study.html']) {
    await page.goto(site + path);
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect(page.locator('.floating-nav')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('pointer has no hover halo and only a completed click emits a temporary ring and synthesized audio', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const audioRequests = []; page.on('request', request => { if (/\.(wav|mp3|ogg)(?:\?|$)/i.test(request.url())) audioRequests.push(request.url()); });
  await page.addInitScript(observeClickAudio);
  await page.goto(site + '/experience.html');
  await page.mouse.move(260, 180);
  const halo = page.locator('.cursor-halo');
  await expect(halo).toHaveCount(0);
  await expect(page.locator('.click-ring')).toHaveCount(0);
  expect(await page.evaluate(() => window.__audioContexts)).toBe(0);
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
  await expect.poll(() => page.evaluate(() => window.__taps.length)).toBe(1);
  await target.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
  await expect.poll(() => page.evaluate(() => window.__taps.length)).toBe(2);
  await expect(page.locator('.click-ring')).toHaveCount(0);
  await expect(halo).toHaveCount(0);
  await target.evaluate(button => button.click());
  expect(await page.evaluate(() => window.__taps.length)).toBe(2);
  for (let index = 0; index < 3; index++) {
    await page.mouse.click(260, 180, { delay: 50 });
    await expect.poll(() => page.evaluate(() => window.__taps.length)).toBe(3 + index);
  }
  await expect(page.locator('.click-ring')).toHaveCount(0);
  expect(await page.evaluate(() => ({ contexts: window.__audioContexts, mediaPlays: window.__mediaPlays }))).toEqual({ contexts: 1, mediaPlays: 0 });
  expect(audioRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('touch scrolling emits neither ring nor audio while a completed tap emits both', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 350, height: 700 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.addInitScript(observeClickAudio);
    await page.addInitScript(() => {
      window.__rings = 0;
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
  await page.addInitScript(observeClickAudio);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/book.html?id=self-compassion');
  await expect(page.locator('.library-back')).toHaveCSS('border-top-left-radius', '9px');
  await expect(page.locator('.library-back')).toHaveAttribute('aria-keyshortcuts', 'Escape');
  await page.mouse.click(260, 180);
  await expect(page.locator('.click-ring')).toHaveCount(0);
  await expect(page.locator('.cursor-halo')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__taps.length)).toBe(1);
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
