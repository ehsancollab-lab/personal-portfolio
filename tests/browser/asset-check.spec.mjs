import { test, expect } from '@playwright/test';
const site = process.env.PORTFOLIO_REFINEMENTS_URL || 'http://localhost:4173';

test('asset check reports working HTML, images, fonts and scripts without an external host', async ({ page }) => {
  const external = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith(site + '/')) external.push(request.url()); });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(site + '/asset-check.html');
  await expect(page.locator('html')).toHaveAttribute('data-check-complete', 'true');
  const report = JSON.parse(await page.locator('#report').inputValue());
  expect(report.results.length).toBeGreaterThanOrEqual(9);
  expect(report.results.every(entry => entry.ok)).toBe(true);
  expect(report.home.staticContent).toBe(true);
  expect(report.home.embeddedStyles).toBe(4);
  expect(report.root.appURL).toBe(report.home.appURL);
  expect(report.results.find(entry => entry.label === 'نمایش واقعی عکس').width).toBe(192);
  await expect(page.locator('#copy')).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('working.png'), fullPage: true });
});

test('asset check distinguishes missing images, rejected scripts and network failures', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.route(/\/assets\/home\/book-avatar\.webp(?:\?|$)/, route => route.fulfill({ status: 404, contentType: 'text/html', body: 'missing image' }));
  await page.route(/\/app\.js(?:\?|$)/, route => route.fulfill({ status: 403, contentType: 'text/plain', body: 'rejected script' }));
  await page.route(/\/assets\/fonts\/.*\.woff2(?:\?|$)/, route => route.abort());
  await page.route(/\/asset-probe\.js(?:\?|$)/, route => route.fulfill({ contentType: 'text/plain', headers: { 'X-Content-Type-Options': 'nosniff' }, body: 'not executable' }));
  await page.goto(site + '/asset-check.html');
  await expect(page.locator('html')).toHaveAttribute('data-check-complete', 'true');
  const report = JSON.parse(await page.locator('#report').inputValue());
  expect(report.results.find(entry => entry.label === 'عکس هدر').status).toBe(404);
  expect(report.results.find(entry => entry.label === 'فایل اصلی برنامه').status).toBe(403);
  expect(report.results.find(entry => entry.label === 'فونت اصلی').error).toContain('TypeError');
  expect(report.results.find(entry => entry.label === 'اجرای فایل کوچک برنامه').ok).toBe(false);
  expect(report.results.find(entry => entry.label === 'نمایش واقعی عکس').ok).toBe(false);
  await expect(page.locator('#copy')).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('failed-files-320.png'), fullPage: true });
});

test('disabled JavaScript gives a readable diagnostic with no subresource dependency', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage(), resources = [];
  page.on('request', request => { if (request.resourceType() !== 'document') resources.push(request.url()); });
  await page.goto(site + '/asset-check.html');
  await expect(page.locator('noscript')).toBeVisible();
  expect(await page.locator('noscript').evaluate(node => node.textContent)).toContain('جاوااسکریپت در این مرورگر اجرا نمی‌شود');
  expect(resources).toEqual([]);
  await context.close();
});
