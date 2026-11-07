import { test, expect } from '@playwright/test';
import { books } from '../../library-content.js';
const site = process.env.PORTFOLIO_REFINEMENTS_URL || 'http://localhost:4173';
const app = /\/app\.js(?:\?|$)/;

test('first paint and readable content never wait for a stylesheet download', async ({ page }) => {
  const styles = [];
  await page.route('**/*', route => {
    if (route.request().resourceType() === 'stylesheet') { styles.push(route.request().url()); return route.abort(); }
    if (app.test(route.request().url())) return route.abort();
    return route.continue();
  });
  await page.goto(site + '/', { waitUntil: 'commit' });
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('paint').length), { timeout: 2000 }).toBeGreaterThan(0);
  await expect(page.locator('#site-preloader')).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('#bio')).toBeVisible();
  await expect(page.locator('#bio')).toHaveCSS('color', 'rgb(115, 115, 115)');
  expect(styles).toEqual([]);
});

test('connection check remains readable with all subresources blocked', async ({ page }) => {
  const subresources = [];
  await page.route('**/*', route => {
    if (route.request().resourceType() !== 'document') { subresources.push(route.request().url()); return route.abort(); }
    return route.continue();
  });
  await page.goto(site + '/connection-check.html');
  await expect(page.getByRole('heading', { name: 'اتصال برقرار است' })).toBeVisible();
  expect(subresources).toEqual([]);
});

test('all content and native navigation work when the main application cannot download', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route(app, route => route.abort());
  await page.goto(site + '/');
  await expect(page.locator('#site-preloader')).toHaveCount(0);
  await expect(page.locator('#bio')).toContainText('Senior AI Product Designer');
  await expect(page.locator('#bio a')).toHaveCount(3);
  await expect(page.locator('#header-contact-links a')).toHaveCount(4);
  await expect(page.locator('html')).not.toHaveAttribute('data-app-ready', 'true');
  await page.locator('[data-language="fa"]').click();
  await expect(page.locator('#greeting')).toContainText('احسان');
  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.folder-button[data-section="selected-work"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('.project-card')).toHaveCount(20);
  await page.locator('.nav-home-avatar').click();
  await page.waitForLoadState('domcontentloaded');
  await page.locator('.folder-button[data-section="about"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('.book-collection-card')).toHaveCount(6);
  await page.locator('.book-collection-card[data-category-id="growth"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('.collection-panel:visible h1')).toHaveText('Growth & learning');
  await expect(page.locator('.library-book-card:visible')).toHaveCount(9);
  await page.locator('.library-book-card:visible').first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('.book-detail-copy:visible h1')).toHaveText('Thinking, Fast and Slow');
  await page.locator('[data-language="fa"]').click();
  await expect(page.locator('.book-detail-copy:visible h1')).toHaveText('تفکر سریع و کند');
  await page.locator('.portal-back').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/category=growth/);
  await expect(page.locator('.collection-panel:visible h1')).toHaveText('Growth & learning');
});

test('all fifty direct book URLs render correctly with the application blocked', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route(app, route => route.abort());
  for (const book of books) {
    await page.goto(site + '/book.html?id=' + encodeURIComponent(book.id));
    await expect(page.locator('.book-detail-copy:visible h1')).toHaveText(book.title);
    await expect(page.locator('.book-detail-author:visible')).toContainText(book.author);
  }
});

test('startup remains readable when every downloaded script is blocked', async ({ page }) => {
  await page.route('**/*', route => route.request().resourceType() === 'script' ? route.abort() : route.continue());
  await page.goto(site + '/');
  await expect(page.locator('#site-preloader')).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('#bio')).toContainText('Senior AI Product Designer');
  await page.locator('.folder-button[data-section="about"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('#site-preloader')).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('.book-collection-card')).toHaveCount(6);
});

test('static content is readable with JavaScript entirely disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(site + '/');
  await expect(page.locator('#bio')).toContainText('Senior AI Product Designer');
  await expect(page.locator('#header-contact-links a')).toHaveCount(4);
  await page.goto(site + '/work.html');
  await expect(page.locator('.project-card')).toHaveCount(20);
  await page.goto(site + '/books.html?category=growth#collection-growth');
  await expect(page.locator('.collection-panel:visible h1')).toHaveText('Growth & learning');
  await page.goto(site + '/book.html?id=behave#book-behave');
  await expect(page.locator('.book-detail-copy:visible h1')).toHaveText('Behave');
  await context.close();
});

test('language and theme choices survive a late application download', async ({ page }) => {
  await page.route(app, async route => { await new Promise(resolve => setTimeout(resolve, 6500)); await route.continue(); });
  await page.goto(site + '/', { waitUntil: 'commit' });
  await expect(page.locator('#site-preloader')).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('#bio')).toContainText('Senior AI Product Designer');
  await page.locator('[data-language="fa"]').click();
  await page.locator('.theme-toggle').click();
  await expect(page.locator('#greeting')).toContainText('احسان');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true', { timeout: 8000 });
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.folder-button')).toHaveCount(4);
});

test('required scripts, fonts and styles never need an external host', async ({ page }) => {
  const critical = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', route => {
    const request = route.request();
    if (!request.url().startsWith(site + '/')) {
      if (['script', 'font', 'stylesheet'].includes(request.resourceType())) critical.push(request.url());
      return route.abort();
    }
    return route.continue();
  });
  await page.goto(site + '/');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await page.locator('.folder-button[data-section="about"]').click();
  await expect(page.locator('.book-collection-card')).toHaveCount(6);
  expect(critical).toEqual([]);
});
