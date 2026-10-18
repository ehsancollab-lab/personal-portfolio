import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
const site = 'http://localhost:4173';
const admin = 'https://localhost:4174';
const work = resolve(import.meta.dirname, '../../../work/portfolio-browser');
const replacementFile = resolve(import.meta.dirname, '../../assets/case-studies/mohtavagpt.png');
test.beforeEach(async ({ request }) => { await request.post(site + '/__test/reset'); });
async function loginToCases(page) {
  await page.goto(admin);
  await page.getByLabel('Password', { exact: true }).fill('test-only-editor-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.publishing-bar')).toHaveAttribute('data-state', 'saved');
  await page.locator('.dashboard-tab[data-section="caseStudies"]').click();
}
async function replaceImage(page, figure, file = replacementFile) {
  await figure.locator('> img').click();
  await expect(page.locator('.story-format-menu')).not.toBeVisible();
  const picker = page.waitForEvent('filechooser');
  await figure.getByRole('button', { name: 'Replace image', exact: true }).click();
  await (await picker).setFiles(file);
  await expect(page.locator('.story-editor-content')).toHaveAttribute('aria-busy', 'false');
  await expect(figure.locator('> img')).toHaveAttribute('src', /^data:image\/webp;base64,/);
  await expect.poll(() => figure.locator('> img').evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
}

test('case cards zoom smoothly and their title becomes #2255FF on hover and keyboard focus', async ({ page }) => {
  await page.goto(site + '/case-studies.html');
  const card = page.locator('a.case-study-card').first();
  const image = card.locator('.case-study-card-media > img');
  const title = card.locator('.case-study-card-title');
  const before = await card.boundingBox();
  await card.hover();
  await expect(title).toHaveCSS('color', 'rgb(34, 85, 255)');
  await expect(image).toHaveCSS('transform', 'matrix(1.04, 0, 0, 1.04, 0, 0)');
  expect(await image.evaluate(element => parseFloat(getComputedStyle(element).transitionDuration))).toBeGreaterThanOrEqual(.3);
  await page.screenshot({ path: resolve(work, 'case-card-hover-refined.png') });
  const after = await card.boundingBox();
  expect(after.width).toBe(before.width); expect(after.height).toBe(before.height);
  await page.mouse.move(0, 0);
  await expect(image).toHaveCSS('transform', 'none');
  await page.keyboard.press('Tab');
  await card.focus();
  await expect(title).toHaveCSS('color', 'rgb(34, 85, 255)');
});

test('the complete light detail page uses #FDFDFD on direct load and SPA navigation', async ({ page }) => {
  await page.goto(site + '/case-study.html');
  for (const selector of ['html', 'body', '.case-detail-section', '.case-detail']) await expect(page.locator(selector)).toHaveCSS('background-color', 'rgb(253, 253, 253)');
  const effective = await page.locator('.case-detail-title, .case-article-body, .site-footer').evaluateAll(elements => elements.map(element => {
    for (let parent = element; parent; parent = parent.parentElement) { const color = getComputedStyle(parent).backgroundColor; if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') return color; }
  }));
  expect(effective.every(color => color === 'rgb(253, 253, 253)')).toBe(true);
  await page.screenshot({ path: resolve(work, 'case-detail-background-refined.png') });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(19, 19, 21)');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await page.getByRole('link', { name: 'Back to Home' }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.locator('.primary-nav').getByRole('link', { name: 'Case Studies', exact: true }).click();
  await page.locator('a.case-study-card').first().click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(253, 253, 253)');
});

test('existing article image replacement changes the displayed image and survives saving', async ({ page }) => {
  await loginToCases(page);
  const card = page.locator('.case-gallery .case-study-card').first();
  await card.hover(); await card.getByRole('button', { name: 'Edit', exact: true }).click();
  const figure = page.locator('.tiptap .story-editor-image').first();
  const image = figure.locator('> img');
  await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  const original = await image.evaluate(element => element.currentSrc);
  expect(await image.getAttribute('srcset')).toContain('320w');
  await replaceImage(page, figure);
  await expect.poll(() => image.evaluate(element => element.currentSrc)).not.toBe(original);
  await expect(image).not.toHaveAttribute('srcset');
  await figure.getByLabel('Image caption', { exact: true }).fill('Replacement preserved');
  await page.getByRole('button', { name: 'Story settings', exact: true }).click();
  const cover = page.locator('.story-cover img');
  const oldCover = await cover.evaluate(element => element.currentSrc);
  const picker = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Replace cover', exact: true }).click();
  await (await picker).setFiles(replacementFile);
  await expect(cover).toHaveAttribute('src', /^data:image\/webp/);
  await expect.poll(() => cover.evaluate(element => element.currentSrc)).not.toBe(oldCover);
  await expect(cover).not.toHaveAttribute('srcset');
  await page.getByRole('button', { name: 'Close story settings', exact: true }).click();
  await page.getByRole('button', { name: 'Save changes', exact: true }).first().click();
  await expect(page.locator('.story-composer')).toHaveCount(0);
  const saved = await page.evaluate(async () => (await fetch('/api/content')).json());
  const story = saved.content.caseStudies[0];
  const firstImage = story.document.content.find(node => node.type === 'image');
  expect(firstImage.attrs.src).toMatch(/^uploads\/[a-f0-9]{64}\.webp$/);
  expect(firstImage.attrs.caption).toBe('Replacement preserved');
  expect(story.image).toBe(firstImage.attrs.src);
  await card.hover(); await card.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.locator('.story-image-caption').first()).toHaveValue('Replacement preserved');
  await expect(page.locator('.story-editor-image > img').first()).toHaveAttribute('src', './assets/' + firstImage.attrs.src);
});

test('new case study can replace a library image repeatedly and retain its caption', async ({ page }) => {
  await loginToCases(page); await page.locator('#primary-action').click();
  await page.getByLabel('Case study title', { exact: true }).fill('Image replacement in a new story');
  await page.locator('.tiptap').click();
  await page.getByRole('button', { name: 'Add a block', exact: true }).click();
  await page.getByRole('button', { name: 'Choose existing image', exact: true }).click();
  await page.getByLabel('Existing portfolio images', { exact: true }).selectOption('publishing-dashboard.png');
  await page.getByRole('button', { name: 'Use image', exact: true }).click();
  const figure = page.locator('.tiptap .story-editor-image').first();
  await figure.getByLabel('Image caption', { exact: true }).fill('Keep this caption');
  await replaceImage(page, figure);
  await expect(figure.locator('> img')).not.toHaveAttribute('srcset');
  await replaceImage(page, figure);
  await expect(figure.getByLabel('Image caption', { exact: true })).toHaveValue('Keep this caption');
  await expect(page.locator('.story-editor-image')).toHaveCount(1);
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.story-composer')).toHaveCount(0);
  const card = page.locator('.case-study-card').filter({ hasText: 'Image replacement in a new story' });
  await card.hover(); await card.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.locator('.story-image-caption').first()).toHaveValue('Keep this caption');
});
