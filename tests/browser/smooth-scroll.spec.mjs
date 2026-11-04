import { test, expect } from '@playwright/test';
const site = 'http://localhost:4173';
const ready = page => page.waitForFunction(() => document.documentElement.classList.contains('lenis'));
test.beforeEach(async ({ request }) => { await request.post(site + '/__test/reset'); });

test('Lenis eases wheel input to the configured 0.92 target while keeping native scroll position', async ({ page }) => {
  await page.goto(site + '/about.html'); await ready(page);
  await page.evaluate(() => { window.__samples = []; window.addEventListener('scroll', () => window.__samples.push(scrollY)); });
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(552);
  const samples = await page.evaluate(() => window.__samples);
  expect(samples.some(value => value > 0 && value < 552)).toBe(true);
  expect(await page.evaluate(() => document.scrollingElement.scrollTop)).toBe(552);
  expect(await page.locator('html').evaluate(node => getComputedStyle(node).scrollPaddingTop)).toBe('35px');
});

test('section anchors ease to their offset, update the URL and focus their destination', async ({ page }) => {
  await page.goto(site + '/about.html'); await ready(page);
  await page.evaluate(() => {
    const link = document.createElement('a'); link.href = '#my-books'; link.id = 'test-books-link'; link.textContent = 'Jump to books';
    link.style.cssText = 'position:fixed;top:0;left:0;z-index:20'; document.body.append(link);
  });
  await page.locator('#test-books-link').click();
  await expect(page).toHaveURL(/#my-books$/);
  await expect(page.locator('#my-books')).toBeFocused();
  expect(Math.abs((await page.locator('#my-books').boundingBox()).y - 35)).toBeLessThan(2);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await page.locator('html').evaluate(node => getComputedStyle(node).scrollPaddingTop)).toBe('20px');
});

test('the skip link jumps immediately and works on extensionless routes', async ({ page }) => {
  await page.goto(site + '/about/'); await ready(page);
  const skip = page.locator('.skip-link');
  await skip.focus(); await skip.click();
  await expect(page.locator('main')).toBeFocused();
  await expect(page).toHaveURL(/\/about\/#about-content$/);
  const position = await page.evaluate(() => scrollY);
  await page.waitForTimeout(250);
  expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThan(2);
  await expect(page.locator('body')).toHaveAttribute('data-page', 'about');
});

test('reduced motion and page lifecycle remove and restore Lenis without moving the page', async ({ page }) => {
  await page.goto(site + '/about.html'); await ready(page);
  await page.mouse.wheel(0, 600); await expect.poll(() => page.evaluate(() => scrollY)).toBe(552);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => !document.documentElement.classList.contains('lenis'));
  const saved = await page.evaluate(() => scrollY);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await ready(page);
  expect(Math.abs(await page.evaluate(() => scrollY) - saved)).toBeLessThan(2);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await page.waitForFunction(() => !document.documentElement.classList.contains('lenis'));
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await ready(page);
  expect(Math.abs(await page.evaluate(() => scrollY) - saved)).toBeLessThan(2);
});

test('nested native scroll areas and modal dialogs keep independent scrolling', async ({ page }) => {
  await page.goto(site + '/about.html'); await ready(page);
  await page.evaluate(() => {
    const area = document.createElement('div'); area.id = 'native-scroll'; area.dataset.scrollNative = '';
    area.style.cssText = 'position:fixed;top:50px;left:50px;width:300px;height:180px;overflow:auto;z-index:20;background:white';
    const content = document.createElement('div'); content.style.height = '1000px'; content.textContent = 'Native scroll area'; area.append(content); document.body.append(area);
  });
  await page.locator('#native-scroll').hover(); await page.mouse.wheel(0, 300);
  await expect.poll(() => page.locator('#native-scroll').evaluate(node => node.scrollTop)).toBe(300);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.evaluate(() => {
    const dialog = document.createElement('dialog'); dialog.id = 'test-scroll-dialog'; dialog.style.cssText = 'width:320px;height:180px;overflow:auto';
    const content = document.createElement('div'); content.style.height = '1000px'; content.textContent = 'Dialog content'; dialog.append(content); document.body.append(dialog); dialog.showModal();
  });
  await expect(page.locator('html')).toHaveClass(/lenis-stopped/);
  await page.locator('#test-scroll-dialog').hover(); await page.mouse.wheel(0, 300);
  await expect.poll(() => page.locator('#test-scroll-dialog').evaluate(node => node.scrollTop)).toBe(300);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.locator('#test-scroll-dialog').evaluate(node => node.close());
  await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
  await page.mouse.move(700, 500); await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(552);
});

test('route changes cancel inertia and preserve collection Back and browser history', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(site + '/about.html'); await ready(page);
  await page.mouse.wheel(0, 600); await page.waitForTimeout(60);
  await page.locator('.book-collection-card').first().evaluate(node => node.click());
  await expect(page.locator('body')).toHaveAttribute('data-page', 'books');
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  const card = page.locator('.library-book-card[data-book-id="attached"]');
  await card.scrollIntoViewIfNeeded();
  const position = await page.evaluate(() => scrollY);
  await card.click();
  await expect(page.locator('.book-detail-copy h1')).toHaveText('Attached');
  await page.locator('.library-back').click();
  await expect(page.locator('.collection-panel h1')).toHaveText('Psychology & relationships');
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThan(3);
  await page.goBack(); await expect(page.locator('.book-detail-copy h1')).toHaveText('Attached');
  await page.goForward(); await expect(page.locator('.collection-panel h1')).toHaveText('Psychology & relationships');
  expect(errors).toEqual([]);
});

test('a missing Lenis chunk falls back to native scrolling and accessible anchors', async ({ page }) => {
  await page.route(/\/chunks\/lenis[^/]*\.js$/, route => route.fulfill({ status: 503, body: 'Test-only unavailable Lenis chunk' }));
  await page.goto(site + '/about.html'); await page.waitForTimeout(500);
  expect(await page.locator('html').evaluate(node => node.classList.contains('lenis'))).toBe(false);
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(300);
  const skip = page.locator('.skip-link'); await skip.focus(); await skip.click();
  await expect(page.locator('main')).toBeFocused();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'about');
});
