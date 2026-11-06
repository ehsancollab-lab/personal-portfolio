import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const site = process.env.PORTFOLIO_REFINEMENTS_URL || 'http://localhost:4173';
const output = resolve(import.meta.dirname, '../../../work/header-shelf-refinements');
test.use({ launchOptions: { executablePath: '/usr/bin/chromium', ignoreDefaultArgs: ['--hide-scrollbars'], args: ['--no-sandbox', '--enable-unsafe-swiftshader'] } });
test.beforeEach(async ({ request }) => {
  if (!process.env.PORTFOLIO_REFINEMENTS_URL) await request.post(site + '/__test/reset');
});

for (const locale of ['en', 'fa']) {
  test(`returning home keeps content and header aligned through the fade (${locale}, visible scrollbars)`, async ({ page }) => {
    await mkdir(output, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(site + '/');
    if (locale === 'fa') await page.locator('[data-language="fa"]').click();
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => page.locator('main').evaluate(node => node.style.transform)).toBe('');
    const reports = [];
    for (const section of ['case-studies', 'experience', 'about', 'selected-work']) {
      await page.locator(`.folder-button[data-section="${section}"]`).click();
      await expect(page.locator('body')).toHaveAttribute('data-page', section);
      await expect.poll(() => page.locator('main').evaluate(node => node.style.transform)).toBe('');
      await page.evaluate(() => {
        window.__returnSamples = []; window.__returnFinished = false;
        let start;
        const sample = time => {
          if (document.body.dataset.page === 'home') {
            start ??= time;
            const main = document.querySelector('main');
            const bio = document.querySelector('#bio').getBoundingClientRect();
            const portrait = document.querySelector('.home-portrait').getBoundingClientRect();
            window.__returnSamples.push({
              time: time - start, opacity: Number(getComputedStyle(main).opacity),
              center: bio.x + bio.width / 2, portrait: portrait.x + portrait.width / 2,
              right: document.querySelector('.display-controls').getBoundingClientRect().right,
              avatar: document.querySelector('.nav-home-avatar').getBoundingClientRect().left,
              client: document.documentElement.clientWidth, scroll: scrollY
            });
            if (time - start > 1300) { window.__returnFinished = true; return; }
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      await page.locator('.portal-back').click();
      await expect(page.locator('body')).toHaveAttribute('data-page', 'home');
      await page.waitForFunction(() => window.__returnFinished);
      const samples = await page.evaluate(() => window.__returnSamples);
      const visible = samples.filter(s => s.opacity >= .15);
      const spread = key => Math.max(...visible.map(s => s[key])) - Math.min(...visible.map(s => s[key]));
      reports.push({ section, samples, drift: { content: spread('center'), portrait: spread('portrait'), controls: spread('right'), avatar: spread('avatar') } });
      await writeFile(resolve(output, `home-return-${locale}.json`), JSON.stringify(reports, null, 2));
      expect(spread('center'), section + ': content shifted horizontally').toBeLessThan(1);
      expect(spread('portrait'), section + ': portrait shifted horizontally').toBeLessThan(1);
      expect(spread('right'), section + ': language/theme controls shifted horizontally').toBeLessThan(1);
      expect(spread('avatar'), section + ': navigation avatar shifted horizontally').toBeLessThan(1);
    }
    await page.screenshot({ path: resolve(output, `home-return-stable-${locale}.png`) });
  });
}
