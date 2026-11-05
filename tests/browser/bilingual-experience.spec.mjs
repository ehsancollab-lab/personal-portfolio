import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { defaultExperience } from '../../case-content.js';
import { bookById } from '../../library-content.js';
import { faBooks } from '../../books-fa.js';
import { faContent } from '../../content-fa.js';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const site = 'http://localhost:4173';
const work = resolve(import.meta.dirname, '../../../work/portfolio-browser');
const language = (page, value) => page.locator('[data-language="' + value + '"]');
test.beforeEach(async ({ request }) => { await request.post(site + '/__test/reset'); });

test('EN/FA control applies On weights, keeps choices within navigation and resets on reload', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/about.html');
  expect(await page.locator('.display-controls').evaluate(node => [...node.children].map(child => child.className))).toEqual(['cv-link', 'language-switch', 'theme-toggle']);
  await expect(language(page, 'en')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.language-switch')).toHaveCSS('border-top-width', '0px');
  await language(page, 'fa').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#cv-label')).toHaveText('دریافت رزومه');
  await expect(page.locator('.about-introduction h2')).toHaveText('کمی دربارهٔ من');
  await expect(page.locator('.about-introduction')).toContainText('خودم یاد گرفتم');
  await expect(page.locator('.about-introduction')).not.toContainText('self-taught');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.about-introduction h2')).toHaveCSS('font-weight', '700');
  await expect(page.locator('.about-introduction h2')).toHaveCSS('font-size', '19px');
  await expect(page.locator('.about-introduction p').first()).toHaveCSS('font-weight', '600');
  await expect(page.locator('.about-introduction p').first()).toHaveCSS('line-height', '25px');
  expect(await page.locator('body').evaluate(node => getComputedStyle(node).fontFamily)).toContain('On');
  const fontRequests = await page.evaluate(() => performance.getEntriesByType('resource').map(item => item.name).filter(name => /\/fonts\//.test(name)));
  expect(fontRequests.some(name => /On-Regular\.woff2/.test(name))).toBe(true);
  expect(fontRequests.some(name => /On-SemiBold\.woff2/.test(name))).toBe(true);
  expect(fontRequests.some(name => /On-Bold\.woff2/.test(name))).toBe(true);
  expect(fontRequests.some(name => /Yekan|vazirmatn/i.test(name))).toBe(false);
  await page.getByRole('button', { name: 'تغییر به حالت تیره', exact: true }).click();
  await page.locator('.primary-nav [data-page-link="experience"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'experience');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.primary-nav [data-page-link="about"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'about');
  await page.screenshot({ path: resolve(work, 'about-fa-dark.png'), fullPage: true });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('.about-introduction h2')).toHaveText('A little about me');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(errors).toEqual([]);
});

test('updated CV downloads match the active language and every fresh document starts English/light', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.addInitScript(() => {
    localStorage.setItem('ehsan-portfolio-language', 'fa');
    localStorage.setItem('ehsan-portfolio-theme', 'dark');
  });
  await page.goto(site + '/about.html');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  for (const [locale, hash] of [
    ['en', 'b1299479c508e790c59a3aa872cba2f5ecf96b4e0e7332d6dce94cb0cc581d06'],
    ['fa', '522ef516e1fd52bf84940f65bfc7366eeaf9cebea652bf7ac9f79e08be661162']
  ]) {
    await language(page, locale).click();
    const name = 'Ehsan-Masoomi-CV-' + locale.toUpperCase() + '-November-2026.pdf';
    await expect(page.locator('#cv-link')).toHaveAttribute('href', './assets/' + name);
    await expect(page.locator('#cv-link')).toHaveAttribute('download', name);
    await expect(page.locator('#cv-link')).toHaveAttribute('hreflang', locale);
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#cv-link').click()]);
    expect(download.suggestedFilename()).toBe(name);
    const bytes = await readFile(await download.path());
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash);
  }
  await page.getByRole('button', { name: 'تغییر به حالت تیره', exact: true }).click();
  await page.locator('.primary-nav [data-page-link="experience"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'experience');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#cv-link')).toHaveAttribute('href', /CV-FA-November-2026\.pdf$/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#cv-link')).toHaveAttribute('href', /CV-EN-November-2026\.pdf$/);
  expect((await request.get(site + '/assets/Ehsan-Masoomi-CV-EN.pdf')).status()).toBe(404);
});

test('all public headings stay 19px Bold and 18px body copy is SemiBold with 25px leading', async ({ page }) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const routes = ['/', '/about.html', '/experience.html', '/case-studies.html', '/case-study.html?id=mohtavachi-content-calendar', '/books.html?category=psychology', '/book.html?id=self-compassion'];
  for (const route of routes) {
    await page.goto(site + route);
    for (const locale of ['en', 'fa']) {
      await language(page, locale).click();
      await page.evaluate(() => document.fonts.ready);
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const headings = await page.locator('h1, h2, h3, h4, h5, h6, .experience-role').evaluateAll(nodes => nodes.map(node => {
          const css = getComputedStyle(node);
          return { text: node.textContent, size: css.fontSize, weight: css.fontWeight };
        }));
        expect(headings.length).toBeGreaterThan(0);
        expect(headings.filter(node => node.size !== '19px' || node.weight !== '700'), `${route}, ${locale}, ${width}`).toEqual([]);
        const body = await page.locator('p, li, blockquote').evaluateAll(nodes => nodes.map(node => {
          const css = getComputedStyle(node);
          return { text: node.textContent, size: css.fontSize, weight: css.fontWeight, leading: css.lineHeight };
        }).filter(node => node.size === '18px'));
        expect(body.filter(node => node.weight !== '600' || node.leading !== '25px'), `${route}, ${locale}, ${width}`).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    }
  }
  await page.goto(site + '/about.html');
  await language(page, 'fa').click();
  await page.evaluate(() => document.fonts.ready);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect.poll(() => page.locator('.book-collections img').evaluateAll(images => images.length === 18 && images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: resolve(work, 'about-fa-bold-19-body-18-25.png'), fullPage: true });
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
    await expect(page.locator('.book-source')).toHaveCount(0);
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

test('book details keep a minimal header, plain aligned quotation, short Back and upright cover', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/book.html?id=self-compassion');
  for (const locale of ['en', 'fa']) {
    await language(page, locale).click();
    await page.evaluate(() => document.fonts.ready);
    const quote = page.locator('.book-quote-text');
    const attribution = page.locator('.book-quote-attribution');
    await expect(quote).toHaveText(locale === 'fa' ? faBooks['self-compassion'].takeaway : bookById('self-compassion').takeaway);
    await expect(quote).toHaveCSS('direction', locale === 'fa' ? 'rtl' : 'ltr');
    await expect(quote).toHaveCSS('font-size', '17px');
    await expect(quote).toHaveCSS('font-weight', '700');
    await expect(page.locator('.book-quote')).toHaveCSS('text-align', 'start');
    await expect(page.locator('.book-takeaway')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('.book-quote-attribution')).toHaveCSS('align-items', 'flex-start');
    await expect(page.locator('.book-quote-name')).toHaveText(locale === 'fa' ? 'احسان معصومی' : 'Ehsan Masoomi');
    await expect(page.locator('.book-quote-role')).toHaveText(locale === 'fa' ? 'طراح محصول' : 'Product Designer');
    await expect(page.locator('.library-back')).toHaveText(locale === 'fa' ? 'بازگشت' : 'Back');
    await expect(page.locator('.library-back')).toHaveAttribute('aria-keyshortcuts', 'Escape');
    await expect(page.locator('.library-back .back-shortcut')).toHaveCount(0);
    if (locale === 'fa') await expect(page.locator('.library-back')).toHaveCSS('font-weight', '600');
    await expect(page.locator('.book-detail-copy > .library-eyebrow, .book-detail-copy > .book-topics')).toHaveCount(0);
    await expect(page.locator('.language-switch')).toHaveCSS('border-top-width', '0px');
    await expect(page.locator('.book-summary h2')).toHaveCSS('font-size', '19px');
    await expect(page.locator('.book-quote-name')).toHaveCSS('font-size', '15px');
    await expect(attribution.locator('img')).toHaveAttribute('src', './assets/figma/profile.png');
    await expect.poll(() => attribution.locator('img').evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
    await expect(page.locator('.book-source')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Book information in Persian|اطلاعات کتاب در منبع فارسی/ })).toHaveCount(0);
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await expect(quote).toHaveCSS('font-size', '17px');
      await expect(page.locator('.book-quote-name')).toHaveCSS('font-size', '15px');
      await expect(page.locator('.book-detail-art > .book-cover')).toHaveCSS('transform', 'none');
      const quoteBox = await quote.boundingBox(), captionBox = await attribution.boundingBox();
      expect(captionBox.y).toBeGreaterThan(quoteBox.y + quoteBox.height);
      const portraitBox = await attribution.locator('img').boundingBox();
      if (locale === 'en') expect(Math.abs(portraitBox.x - quoteBox.x)).toBeLessThan(1);
      else expect(Math.abs(portraitBox.x + portraitBox.width - quoteBox.x - quoteBox.width)).toBeLessThan(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width !== 390) await page.screenshot({ path: resolve(work, `book-testimonial-${locale}-${width}.png`), fullPage: true });
    }
  }
  await page.evaluate(() => document.querySelector('.theme-toggle').click());
  await expect(page.locator('.book-takeaway')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
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

test('Experience follows the timeline with role first, smaller inline company, original bullets and dates', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/experience.html');
  await expect(page.locator('.experience-entry')).toHaveCount(3);
  await expect(page.locator('.experience-logo-placeholder')).toHaveCount(0);
  expect(await page.locator('.experience-logo img').evaluateAll(nodes => nodes.map(node => node.getAttribute('src')))).toEqual(['./assets/companies/mors.jpg', './assets/companies/nibex.jpg', './assets/companies/remocapp.jpg']);
  await expect.poll(() => page.locator('.experience-logo img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth === 200))).toBe(true);
  await expect(page.locator('.experience-track')).toHaveCount(1);
  for (const [index, item] of defaultExperience.entries()) {
    const entry = page.locator('.experience-entry').nth(index);
    await expect(entry.locator('.experience-company')).toHaveText(item.company);
    await expect(entry.locator('.experience-role')).toHaveText(item.role);
    await expect(entry.locator('.experience-date-range')).toHaveText(item.dates);
    expect(await entry.locator('.experience-bullets li').allTextContents()).toEqual(item.description.split('\n').map(value => value.replace(/^\s*[-•]\s*/, '').trim()).filter(Boolean));
    const logo = await entry.locator('.experience-logo').boundingBox(), company = await entry.locator('.experience-company').boundingBox(), role = await entry.locator('.experience-role').boundingBox();
    expect(logo.y + logo.height).toBeLessThan(role.y);
    expect(company.x).toBeGreaterThan(role.x + role.width);
    expect(Math.abs(company.y - role.y)).toBeLessThan(10);
    expect(await entry.locator('.experience-heading').evaluate(node => node.firstElementChild.className)).toBe('experience-role');
    expect(await entry.locator('.experience-company').evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeLessThan(await entry.locator('.experience-role').evaluate(node => parseFloat(getComputedStyle(node).fontSize)));
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

test('progressive bottom blur stays visible at the top and bottom, adapts to theme and leaves footer links usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site + '/experience.html');
  const veil = page.locator('.viewport-blur');
  await expect(veil).toHaveCount(1);
  await expect(veil).toHaveAttribute('aria-hidden', 'true');
  await expect(veil).toHaveCSS('pointer-events', 'none');
  await expect(veil).toHaveCSS('opacity', '1');
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
  await expect(veil).toHaveCSS('opacity', '1');
  const footerLink = page.locator('#footer-contact-links a').first();
  expect(await footerLink.evaluate(node => { const rect = node.getBoundingClientRect(); return node.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)); })).toBe(true);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect(veil).toHaveCSS('opacity', '1');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(veil).toHaveCSS('opacity', '1');
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect(veil).toHaveCSS('opacity', '1');
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await expect(veil).toHaveCSS('opacity', '1');
  }
});
