import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { defaultExperience } from '../../case-content.js';
import { bookById } from '../../library-content.js';
import { faBooks } from '../../books-fa.js';
import { faContent } from '../../content-fa.js';
const site = 'http://localhost:4173';
const work = resolve(import.meta.dirname, '../../../work/portfolio-browser');
const language = (page, value) => page.locator('[data-language="' + value + '"]');
test.beforeEach(async ({ request }) => { await request.post(site + '/__test/reset'); });

test('minimal EN/FA control sits between CV and theme, persists, and applies local On weights', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/about.html');
  expect(await page.locator('.display-controls').evaluate(node => [...node.children].map(child => child.className))).toEqual(['cv-link', 'language-switch', 'theme-toggle']);
  await expect(language(page, 'en')).toHaveAttribute('aria-pressed', 'true');
  await language(page, 'fa').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#cv-label')).toHaveText('دریافت رزومه');
  await expect(page.locator('.about-introduction h2')).toHaveText('کمی دربارهٔ من');
  await expect(page.locator('.about-introduction')).toContainText('خودم یاد گرفتم');
  await expect(page.locator('.about-introduction')).not.toContainText('self-taught');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.about-introduction h2')).toHaveCSS('font-weight', '600');
  await expect(page.locator('.about-introduction p').first()).toHaveCSS('font-weight', '400');
  expect(await page.locator('body').evaluate(node => getComputedStyle(node).fontFamily)).toContain('On');
  const fontRequests = await page.evaluate(() => performance.getEntriesByType('resource').map(item => item.name).filter(name => /\/fonts\//.test(name)));
  expect(fontRequests.some(name => /On-Regular\.woff2/.test(name))).toBe(true);
  expect(fontRequests.some(name => /On-SemiBold\.woff2/.test(name))).toBe(true);
  expect(fontRequests.some(name => /Yekan|vazirmatn/i.test(name))).toBe(false);
  await page.getByRole('button', { name: 'تغییر به حالت تیره', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: resolve(work, 'about-fa-dark.png'), fullPage: true });
  await language(page, 'en').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('.about-introduction h2')).toHaveText('A little about me');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});

test('mobile navigation stays in one horizontally scrollable row in both languages', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/about.html');
  for (const locale of ['en', 'fa']) {
    await language(page, locale).click();
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const nav = page.locator('.primary-nav');
      await expect(nav).toHaveCSS('flex-wrap', 'nowrap');
      await expect(nav).toHaveCSS('overflow-x', 'auto');
      const positions = await nav.locator('a').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().top));
      expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const active = await nav.locator('[aria-current="page"]').boundingBox(), frame = await nav.boundingBox();
      expect(active.x).toBeGreaterThanOrEqual(frame.x - 1);
      expect(active.x + active.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
      const metrics = await nav.evaluate(node => ({ full: node.scrollWidth, visible: node.clientWidth }));
      if (width === 320) expect(metrics.full).toBeGreaterThan(metrics.visible);
      await page.screenshot({ path: resolve(work, `nav-${locale}-${width}.png`) });
    }
  }
});

test('books display a single localized title and fluent notes with language controls on detail routes', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/books.html?category=psychology');
  await expect(page.locator('.library-book-persian, .book-detail-persian')).toHaveCount(0);
  await language(page, 'fa').click();
  await expect(page.locator('.collection-panel h1')).toHaveText('روان‌شناسی و روابط');
  for (const id of ['why-nobody-told-me', 'self-compassion', 'behave']) {
    const book = bookById(id);
    await page.locator('.library-book-card[data-book-id="' + id + '"]').click();
    await expect(page.locator('.book-detail-copy h1')).toHaveText(book.titleFa);
    await expect(page.locator('.book-detail-author')).toContainText(faBooks[id].author);
    await expect(page.locator('.book-summary p')).toHaveText(faBooks[id].summary);
    await expect(page.locator('.book-takeaway blockquote')).toHaveText(faBooks[id].takeaway);
    await expect(page.locator('.book-detail-persian, .library-book-persian')).toHaveCount(0);
    await expect(language(page, 'fa')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.book-source')).toHaveAttribute('href', book.source.url);
    await language(page, 'en').click();
    await expect(page.locator('.book-detail-copy h1')).toHaveText(book.title);
    await expect(page.locator('.book-summary p')).toHaveText(book.summary);
    await language(page, 'fa').click();
    await page.locator('.library-back').click();
  }
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: resolve(work, 'collection-fa-320.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('case study translates its rich story, metadata and toolbar while preserving media', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/case-study.html?id=mohtavachi-content-calendar');
  const images = await page.locator('.case-article-body img').count();
  await language(page, 'fa').click();
  await expect(page.locator('.case-detail-title')).toHaveText('از «نمی‌دانم چه پست کنم» تا تقویم محتوایی با هوش مصنوعی');
  await expect(page.locator('.case-article-body')).toContainText('مصاحبه');
  await expect(page.locator('.case-article-body')).toContainText('اکتبر ۲۰۲۵');
  const englishParagraphs = await page.locator('.case-article-body p, .case-article-body li, .case-article-body h2').evaluateAll(nodes => nodes.map(n => n.textContent).filter(text => /[a-zA-Z]{15}/.test(text) && !/[آ-ی]/.test(text)));
  expect(englishParagraphs).toEqual([]);
  expect(await page.locator('.case-article-body img').count()).toBe(images);
  await expect(page.locator('.case-back-link')).toHaveAccessibleName('بازگشت به صفحهٔ اصلی');
  await expect(page).toHaveTitle(/احسان معصومی/);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: resolve(work, 'case-study-fa-390.png') });
  await language(page, 'en').click();
  await expect(page.locator('.case-detail-title')).toContainText('AI-Powered Content Calendar');
});

test('Experience follows the reference timeline with company first, original bullets, dates and logo placeholders', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/experience.html');
  await expect(page.locator('.experience-entry')).toHaveCount(3);
  await expect(page.locator('.experience-track')).toHaveCount(1);
  for (const [index, item] of defaultExperience.entries()) {
    const entry = page.locator('.experience-entry').nth(index);
    await expect(entry.locator('.experience-company')).toHaveText(item.company);
    await expect(entry.locator('.experience-role')).toHaveText(item.role);
    await expect(entry.locator('.experience-date-range')).toHaveText(item.dates);
    expect(await entry.locator('.experience-bullets li').allTextContents()).toEqual(item.description.split('\n').map(value => value.replace(/^\s*[-•]\s*/, '').trim()).filter(Boolean));
    const logo = await entry.locator('.experience-logo').boundingBox(), company = await entry.locator('.experience-company').boundingBox(), role = await entry.locator('.experience-role').boundingBox();
    expect(logo.y + logo.height).toBeLessThan(company.y);
    expect(company.y + company.height).toBeLessThanOrEqual(role.y);
  }
  await expect(page.locator('.experience-entry a, .experience-entry video, .experience-entry canvas')).toHaveCount(0);
  await page.screenshot({ path: resolve(work, 'experience-en.png'), fullPage: true });
  for (const locale of ['en', 'fa']) {
    await language(page, locale).click();
    await page.evaluate(() => document.fonts.ready);
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const entry = page.locator('.experience-entry').first();
      const dot = await entry.locator('.experience-dot').boundingBox(), body = await entry.locator('.experience-body').boundingBox(), date = await entry.locator('.experience-dates').boundingBox();
      if (locale === 'en') { expect(dot.x).toBeLessThan(body.x); expect(date.x).toBeLessThan(dot.x); }
      else { expect(dot.x).toBeGreaterThan(body.x + body.width); expect(date.x).toBeGreaterThan(dot.x); }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await expect(page.locator('.experience-role').first()).toHaveText(faContent[defaultExperience[0].role]);
  await page.screenshot({ path: resolve(work, 'experience-fa-320.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('progressive bottom blur appears on scroll, adapts to theme and leaves footer links usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/experience.html');
  const veil = page.locator('.viewport-blur');
  await expect(veil).toHaveCount(1);
  await expect(veil).toHaveAttribute('aria-hidden', 'true');
  await expect(veil).toHaveCSS('pointer-events', 'none');
  await expect(veil).toHaveCSS('opacity', '0');
  await expect(veil.locator('span')).toHaveCount(4);
  expect(await veil.locator('span').last().evaluate(node => getComputedStyle(node).backdropFilter)).toBe('blur(18px)');
  await page.evaluate(() => scrollTo({ top: 600, behavior: 'instant' }));
  await expect(veil).toHaveCSS('opacity', '1');
  const light = await veil.evaluate(node => getComputedStyle(node, '::after').backgroundImage);
  await page.screenshot({ path: resolve(work, 'viewport-blur-light.png') });
  await page.evaluate(() => document.querySelector('.theme-toggle').click());
  const dark = await veil.evaluate(node => getComputedStyle(node, '::after').backgroundImage);
  expect(dark).not.toBe(light);
  await page.screenshot({ path: resolve(work, 'viewport-blur-dark.png') });
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  const footerLink = page.locator('#footer-contact-links a').first();
  expect(await footerLink.evaluate(node => { const rect = node.getBoundingClientRect(); return node.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)); })).toBe(true);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect(veil).toHaveCSS('opacity', '0');
});
