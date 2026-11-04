import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
const site = 'http://localhost:4173';
const work = resolve(import.meta.dirname, '../../../work/portfolio-browser');
test.beforeEach(async ({ request }) => { await request.post(site + '/__test/reset'); });
const settled = page => page.waitForFunction(() => !document.documentElement.classList.contains('library-transition'));

test('Selected Work has large single-column cards, smaller corners and responsive images', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site);
  for (const width of [1440, 1920, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const cards = page.locator('.project-card');
    const first = await cards.nth(0).boundingBox(); const second = await cards.nth(1).boundingBox();
    expect(Math.abs(first.x - second.x)).toBeLessThan(1);
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height + 15);
    expect(first.width).toBeCloseTo(width <= 420 ? width - 32 : width <= 700 ? width - 40 : Math.min(1360, width * .708), 0);
    expect(first.width / first.height).toBeCloseTo(2760 / 1921, 2);
    await expect(cards.first()).toHaveCSS('border-top-left-radius', width <= 700 ? '8px' : '12px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await expect(page.locator('.project-card img').first()).toHaveAttribute('sizes', /1360px/);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('.project-card').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(work, 'selected-work-large-static.png') });
});

test('featured fans and shelves show the requested books in the centered, header-width layout', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/about.html');
  const expected = {
    psychology: ['behave', 'why-nobody-told-me', 'self-compassion'],
    design: ['visual-literacy', 'form-and-design', 'graphic-analysis'],
    growth: ['thinking-fast-and-slow', 'think-again', 'twelve-rules-for-life']
  };
  const intro = await page.locator('.about-introduction').boundingBox();
  const grid = await page.locator('.book-collections').boundingBox();
  const header = await page.locator('.site-header').boundingBox();
  expect(Math.abs(intro.x - grid.x)).toBeLessThan(1);
  expect(Math.abs(header.x - grid.x)).toBeLessThan(1);
  expect(Math.abs(header.width - grid.width)).toBeLessThan(1);
  await expect(page.getByRole('searchbox')).toHaveCount(0);
  for (const [id, books] of Object.entries(expected)) {
    const card = page.locator('.book-collection-card[data-category-id="' + id + '"]');
    expect(await card.locator('[data-book-cover]').evaluateAll(nodes => nodes.map(n => n.dataset.bookCover))).toEqual(books);
    await card.click();
    expect(await page.locator('.featured-book-shelf [data-book-cover]').evaluateAll(nodes => nodes.map(n => n.dataset.bookCover))).toEqual(books);
    await expect(page.locator('.collection-page-heading')).toHaveCSS('text-align', 'center');
    await expect(page.getByRole('searchbox')).toHaveCount(0);
    const heights = await page.locator('.featured-book-shelf .book-cover').evaluateAll(nodes => nodes.map(n => n.offsetHeight));
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
    const copy = await page.locator('.library-book-copy').evaluateAll(nodes => nodes.slice(0, 4).map(n => n.getBoundingClientRect().top));
    expect(Math.max(...copy) - Math.min(...copy)).toBeLessThan(1);
    if (id === 'design') await page.screenshot({ path: resolve(work, 'design-collection-aligned.png'), fullPage: true });
    await page.locator('.library-back').click();
  }
});

test('GSAP reveals the page and project cards on entry and scroll', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type === 'webgl2' ? null : original.call(this, type, ...args); };
  });
  await page.goto(site);
  const first = page.locator('.project-card').first();
  await expect.poll(() => first.evaluate(node => node.style.transform)).toBe('');
  const second = page.locator('.project-card').nth(1);
  expect(await second.evaluate(node => node.style.transform)).not.toBe('');
  await second.scrollIntoViewIfNeeded();
  await expect.poll(() => second.evaluate(node => node.style.transform)).toBe('');
  await page.locator('.primary-nav').getByRole('link', { name: 'Experience', exact: true }).click();
  await expect(page.locator('main')).toHaveCSS('opacity', '1');
  await expect.poll(() => page.locator('main').evaluate(node => node.style.transform)).toBe('');
});

test('Three.js shader draws real artwork, reacts to the pointer, idles and cleans up between pages', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || /GL_INVALID|Shader Error/.test(message.text())) errors.push(message.text()); });
  await page.addInitScript(() => {
    window.__gpuDraws = 0;
    const original = WebGL2RenderingContext.prototype.drawElements;
    WebGL2RenderingContext.prototype.drawElements = function(...args) { window.__gpuDraws++; return original.apply(this, args); };
  });
  await page.goto(site);
  const first = page.locator('.project-card').first();
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveAttribute('data-enhanced', 'three');
  await page.waitForTimeout(1600);
  const pixel = await page.locator('.work-webgl-stage').evaluate(canvas => {
    const gl = canvas.getContext('webgl2'); const sample = new Uint8Array(4);
    gl.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, sample);
    return [...sample];
  });
  expect(pixel[3]).toBeGreaterThan(200);
  expect(pixel.slice(0, 3).some(value => value > 0)).toBe(true);
  const count = await page.evaluate(() => window.__gpuDraws);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.__gpuDraws) - count).toBeLessThanOrEqual(2);
  const before = await page.screenshot();
  const box = await first.boundingBox();
  await page.mouse.move(box.x + box.width * .8, Math.max(150, box.y + box.height * .3));
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => window.__gpuDraws)).toBeGreaterThan(count + 3);
  const after = await page.screenshot({ path: resolve(work, 'selected-work-three-shader.png') });
  expect(before.equals(after)).toBe(false);
  await page.locator('.primary-nav').getByRole('link', { name: 'About Me', exact: true }).click();
  await expect(page.locator('.work-webgl-stage')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('reduced motion prevents and disposes the GPU scene while keeping every image visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site);
  await expect(page.locator('.work-webgl-stage')).toHaveCount(0);
  expect(await page.locator('.project-card').first().evaluate(node => node.style.transform)).toBe('');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.project-card[data-enhanced="three"]').first()).toBeAttached();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.work-webgl-stage')).toHaveCount(0);
  expect(await page.locator('.project-card img').evaluateAll(images => images.every(image => image.style.opacity !== '0'))).toBe(true);
});

test('WebGL unavailable and context loss both preserve the normal image gallery', async ({ page }) => {
  await page.goto(site);
  await expect(page.locator('.work-webgl-stage[data-state="ready"]')).toHaveCount(1);
  await page.locator('.work-webgl-stage').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.locator('.work-webgl-stage')).toHaveCount(0);
  expect(await page.locator('.project-card img').first().evaluate(image => image.style.opacity)).toBe('');
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type === 'webgl2' ? null : original.call(this, type, ...args); };
  });
  await page.reload(); await page.waitForTimeout(900);
  await expect(page.locator('.work-webgl-stage')).toHaveCount(0);
  expect(await page.locator('.project-card img').first().evaluate(image => image.complete && image.naturalWidth > 0 && image.style.opacity !== '0')).toBe(true);
});

test('touch layouts keep artwork static and book rows aligned at 390 and 320px', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(site); await page.waitForTimeout(900);
  await expect(page.locator('.work-webgl-stage')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(site + '/books.html?category=design');
    const heights = await page.locator('.featured-book-shelf .book-cover').evaluateAll(nodes => nodes.map(n => n.offsetHeight));
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: resolve(work, `design-aligned-${width}.png`), fullPage: true });
  }
  await context.close();
});
