import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
const site = 'http://localhost:4173';
const admin = 'https://localhost:4174';
const work = resolve(import.meta.dirname, '../../../work/portfolio-browser');
const fixtureImage = resolve(import.meta.dirname, '../../assets/case-studies/mohtavachi-cover.png');
const storyTitle = 'Browser-tested case study';
test.beforeEach(async ({ request }) => { await request.post(site + '/__test/reset'); });
async function login(page) {
  await page.goto(admin);
  await page.getByLabel('Password', { exact: true }).fill('test-only-editor-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.publishing-bar')).toHaveAttribute('data-state', 'saved');
}
async function cases(page) { await page.locator('.dashboard-tab[data-section="caseStudies"]').click(); }
async function storyInput(page) { return page.locator('.story-composer .tiptap'); }
async function selectText(page, value) {
  await page.locator('.tiptap').evaluate((element, value) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let text;
    while ((text = walker.nextNode())) {
      const index = text.textContent.indexOf(value);
      if (index < 0) continue;
      const range = document.createRange(); range.setStart(text, index); range.setEnd(text, index + value.length);
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); return;
    }
    throw new Error('Text was not found: ' + value);
  }, value);
  await expect(page.locator('.story-format-menu')).toBeVisible();
}

test('public tabs preserve the document and header; back, forward and detail links work', async ({ page }) => {
  const documents = []; const errors = [];
  page.on('request', request => { if (request.isNavigationRequest()) documents.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(site);
  await expect(page.locator('#project-grid img').first()).toBeVisible();
  await page.evaluate(() => { window.__header = document.querySelector('.site-header'); window.__grid = document.querySelector('#project-grid'); });
  const timing = [];
  for (const [name, expectedPage] of [['Case Studies', 'case-studies'], ['Experience', 'experience'], ['Selected Work', 'selected-work']]) {
    await page.evaluate(() => document.addEventListener('click', () => window.__tabTime = performance.now(), { once: true, capture: true }));
    await page.locator('.primary-nav').getByRole('link', { name, exact: true }).click();
    await expect(page.locator('body')).toHaveAttribute('data-page', expectedPage);
    timing.push(await page.evaluate(() => performance.now() - window.__tabTime));
    expect(await page.evaluate(() => window.__header === document.querySelector('.site-header'))).toBe(true);
  }
  expect(await page.evaluate(() => window.__grid === document.querySelector('#project-grid'))).toBe(true);
  await page.locator('.primary-nav').getByRole('link', { name: 'Case Studies', exact: true }).click();
  await page.locator('.case-study-card[href]').first().click();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'case-study');
  await expect(page.locator('.site-header')).toHaveCount(0);
  await expect(page.locator('.case-article-body')).toContainText('My Role and the Team');
  await page.goBack();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'case-studies');
  await page.goForward();
  await expect(page.locator('body')).toHaveAttribute('data-page', 'case-study');
  await page.getByRole('link', { name: 'Back to Home' }).click();
  await expect(page.locator('#project-grid')).toBeVisible();
  expect(documents).toHaveLength(1);
  expect(errors).toEqual([]);
  await writeFile(resolve(work, 'tab-timing.json'), JSON.stringify({ tabRenderMilliseconds: timing, documentRequests: documents.length }, null, 2));
});

test('responsive images, local fonts, dark icons, text animation and small screens', async ({ page }) => {
  await page.goto(site + '/case-studies.html');
  const image = page.locator('.case-study-card-media > img').first();
  await expect(image).toHaveAttribute('srcset', /320w.*640w/);
  await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  expect(await image.evaluate(element => element.currentSrc.endsWith('.webp'))).toBe(true);
  expect(await page.locator('link[href*="fonts.googleapis.com"]').count()).toBe(0);
  await page.screenshot({ path: resolve(work, 'case-studies-light.png'), fullPage: true });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('.theme-toggle img')).toHaveAttribute('src', /sun-fill.svg/);
  expect(await page.locator('.cv-link img').evaluate(element => getComputedStyle(element).filter)).toContain('invert(1)');
  await page.screenshot({ path: resolve(work, 'case-studies-dark.png'), fullPage: true });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.primary-nav').getByRole('link', { name: 'Experience', exact: true }).click();
  await expect(page.locator('.experience-entry h3').first()).toHaveClass(/text-reveal/);
  expect(await page.locator('.experience-entry h3').first().evaluate(element => element.getAnimations().length)).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.primary-nav').getByRole('link', { name: 'Case Studies', exact: true }).click();
  expect(await page.locator('.case-study-card-title').first().evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const cards = page.locator('.case-study-card');
    const first = await cards.nth(0).boundingBox(); const second = await cards.nth(1).boundingBox();
    expect(second.y).toBeGreaterThan(first.y + first.height);
    await page.screenshot({ path: resolve(work, `case-studies-${width}.png`), fullPage: true });
  }
});

test('dashboard cards reveal Edit and Delete, and the existing article migrates into the editor', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await login(page); await cases(page);
  const card = page.locator('.case-gallery .case-study-card').first();
  await card.hover();
  await expect(card.locator('.project-tile-actions')).toHaveCSS('opacity', '1');
  await card.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.locator('.story-composer')).toBeVisible();
  await expect(page.locator('.tiptap h2').first()).toContainText('My Role and the Team');
  expect(await page.locator('.story-editor-image').count()).toBeGreaterThan(5);
  await page.screenshot({ path: resolve(work, 'editor-existing.png'), fullPage: true });
  await page.getByRole('button', { name: 'Back to case studies' }).click();
  await card.hover(); await card.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator('.case-gallery .case-study-card')).toHaveCount(0);
  await expect(page.locator('.publishing-bar')).toHaveAttribute('data-state', 'saved');
  expect(errors).toEqual([]);
});

test('write, format, link, insert an image with caption/alt/width, save draft and publish', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await login(page); await cases(page);
  await page.locator('#primary-action').click();
  await expect(page.locator('.story-composer')).toBeVisible();
  await page.getByLabel('Case study title', { exact: true }).fill(storyTitle);
  const story = await storyInput(page);
  await story.fill('A careful design process with a useful outcome.');
  await selectText(page, 'careful');
  await page.getByRole('button', { name: 'Bold (Ctrl+B)', exact: true }).click();
  await expect(story.locator('strong')).toContainText('careful');
  await selectText(page, 'useful outcome');
  await page.getByRole('button', { name: 'Add or edit link (Ctrl+K)', exact: true }).click();
  await page.getByLabel('Link URL', { exact: true }).fill('https://example.com/research');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(story.locator('a')).toHaveAttribute('href', 'https://example.com/research');
  await story.click(); await page.keyboard.press('Control+End'); await page.keyboard.press('Enter');
  await page.keyboard.type('Research findings');
  await selectText(page, 'Research findings');
  await page.getByRole('button', { name: 'Large heading', exact: true }).click();
  await expect(story.locator('h2')).toContainText('Research findings');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Add a block', exact: true }).click();
  const picker = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Upload image', exact: true }).click();
  await (await picker).setFiles(fixtureImage);
  await expect(story.locator('.story-editor-image')).toHaveCount(1);
  await page.getByLabel('Image caption', { exact: true }).fill('Main content publishing dashboard');
  await story.locator('.story-editor-image > img').click();
  await page.getByRole('button', { name: 'Wide image', exact: true }).click();
  await expect(story.locator('.story-editor-image')).toHaveAttribute('data-layout', 'wide');
  await page.getByRole('button', { name: 'Alt text', exact: true }).click();
  await page.getByLabel('Image alt text', { exact: true }).fill('A calendar showing scheduled posts');
  await page.getByRole('button', { name: 'Story settings', exact: true }).click();
  await page.getByLabel('Card description', { exact: true }).fill('A concise, browser-tested story summary.');
  await page.getByRole('button', { name: 'Close story settings', exact: true }).click();
  await page.getByRole('button', { name: 'Preview case study', exact: true }).click();
  await expect(page.locator('.story-preview strong')).toContainText('careful');
  await expect(page.locator('.story-preview figcaption')).toContainText('Main content publishing dashboard');
  await page.screenshot({ path: resolve(work, 'editor-preview.png'), fullPage: true });
  await page.getByRole('button', { name: 'Back to writing', exact: true }).click();
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.story-composer')).toHaveCount(0);
  const card = page.locator('.case-study-card').filter({ hasText: storyTitle });
  await expect(card).toContainText('Draft');
  const saved = await page.evaluate(async () => (await fetch('/api/content')).json());
  const savedStory = saved.content.caseStudies.find(item => item.title === 'Browser-tested case study');
  expect(savedStory.visible).toBe(false);
  const image = savedStory.document.content.find(node => node.type === 'image');
  expect(image.attrs.src).toMatch(/^uploads\/[a-f0-9]{64}\.webp$/);
  expect(image.attrs.caption).toBe('Main content publishing dashboard');
  expect(image.attrs.alt).toBe('A calendar showing scheduled posts');
  expect(image.attrs.layout).toBe('wide');
  await card.hover(); await card.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByLabel('Image caption', { exact: true })).toHaveValue('Main content publishing dashboard');
  await expect(page.locator('.tiptap strong')).toContainText('careful');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('button', { name: 'Publish now', exact: true }).click();
  await expect(page.locator('.story-composer')).toHaveCount(0);
  await expect(card.locator('.case-draft-badge')).toHaveCount(0);
  const published = await page.evaluate(async () => (await fetch('/api/content')).json());
  const publishedStory = published.content.caseStudies.find(item => item.title === 'Browser-tested case study');
  expect(publishedStory.visible).toBe(true);
  await page.goto(site + '/case-study.html?id=' + publishedStory.id);
  await expect(page.locator('.case-detail-title')).toHaveText(storyTitle);
  await expect(page.locator('.case-article-body strong')).toContainText('careful');
  await expect(page.locator('.case-article-body img')).toHaveAttribute('alt', 'A calendar showing scheduled posts');
  await expect(page.locator('.case-article-body figcaption')).toHaveText('Main content publishing dashboard');
  expect(errors).toEqual([]);
});

test('editor local draft recovery and a failed publication preserve work', async ({ page }) => {
  await login(page); await cases(page); await page.locator('#primary-action').click();
  await page.getByLabel('Case study title', { exact: true }).fill('Recover this local draft');
  await (await storyInput(page)).fill('This writing must survive closing the editor.');
  await page.getByRole('button', { name: 'Back to case studies', exact: true }).click();
  await page.locator('#primary-action').click();
  await expect(page.getByLabel('Case study title', { exact: true })).toHaveValue('Recover this local draft');
  await expect(page.locator('.tiptap')).toContainText('must survive');
  await page.route('**/api/content', async route => route.request().method() === 'POST' ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"github_unavailable"}' }) : route.continue());
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.story-editor-message')).toContainText('draft is kept');
  await expect(page.locator('.story-composer')).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('ehsan-story-editor-draft:')))).toBe(true);
});

test('selected work Add, Replace, drag and drop, keyboard order and Delete still publish', async ({ page }) => {
  await login(page);
  const original = await page.locator('.project-tile').count();
  const picker = page.waitForEvent('filechooser'); await page.locator('#primary-action').click(); await (await picker).setFiles(fixtureImage);
  await expect(page.locator('.project-tile')).toHaveCount(original + 1);
  await expect(page.locator('.publishing-bar')).toHaveAttribute('data-state', 'saved');
  const firstId = await page.locator('.project-tile').first().getAttribute('data-item-id');
  const first = page.locator('.project-tile').first(); await first.hover();
  const replacement = page.waitForEvent('filechooser'); await first.getByRole('button', { name: 'Replace', exact: true }).click(); await (await replacement).setFiles(fixtureImage);
  await expect(page.locator('.publishing-bar')).toHaveAttribute('data-state', 'saved');
  await page.locator('.project-tile').first().focus(); await page.keyboard.press('Alt+ArrowDown');
  await expect(page.locator('.project-tile').nth(1)).toHaveAttribute('data-item-id', firstId);
  await expect(page.locator('.publishing-bar')).toHaveAttribute('data-state', 'saved');
  await page.locator('.project-tile').nth(1).dragTo(page.locator('.project-tile').first(), { targetPosition: { x: 10, y: 10 } });
  await expect(page.locator('.project-tile').first()).toHaveAttribute('data-item-id', firstId);
  await expect(page.locator('.publishing-bar')).toHaveAttribute('data-state', 'saved');
  await page.locator('.project-tile').first().hover(); await page.locator('.project-tile').first().getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator('.project-tile')).toHaveCount(original);
  await expect(page.locator('.publishing-bar')).toHaveAttribute('data-state', 'saved');
});

test('Medium-style paste, italic, quote, lists, undo, redo and block insertion work', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await login(page); await cases(page); await page.locator('#primary-action').click();
  await page.getByLabel('Case study title', { exact: true }).fill('Editing tools test');
  const story = await storyInput(page);
  await story.click();
  await page.evaluate(() => navigator.clipboard.writeText('First pasted paragraph.\n\nSecond pasted paragraph.'));
  await page.keyboard.press('Control+V');
  await expect(story.locator('p')).toHaveCount(2);
  await selectText(page, 'First pasted paragraph.');
  await page.getByRole('button', { name: 'Italic (Ctrl+I)', exact: true }).click();
  await expect(story.locator('em')).toContainText('First pasted paragraph.');
  await selectText(page, 'Second pasted paragraph.');
  await page.getByRole('button', { name: 'Quote', exact: true }).click();
  await expect(story.locator('blockquote')).toContainText('Second pasted paragraph.');
  await page.getByRole('button', { name: 'Undo (Ctrl+Z)', exact: true }).click();
  await expect(story.locator('blockquote')).toHaveCount(0);
  await page.getByRole('button', { name: 'Redo (Ctrl+Shift+Z)', exact: true }).click();
  await expect(story.locator('blockquote')).toHaveCount(1);
  await selectText(page, 'First pasted paragraph.');
  await page.getByRole('button', { name: 'Bullet list', exact: true }).click();
  await expect(story.locator('ul')).toContainText('First pasted paragraph.');
  await page.getByRole('button', { name: 'Undo (Ctrl+Z)', exact: true }).click();
  await selectText(page, 'First pasted paragraph.');
  await page.getByRole('button', { name: 'Numbered list', exact: true }).click();
  await expect(story.locator('ol')).toContainText('First pasted paragraph.');
  await story.click(); await page.keyboard.press('Control+End'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Add a block', exact: true }).click();
  await page.getByRole('button', { name: 'Insert divider', exact: true }).click();
  await expect(story.locator('hr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Add a block', exact: true }).click();
  await page.getByRole('button', { name: 'Insert code block', exact: true }).click();
  await page.keyboard.type('const answer = 42;');
  await expect(story.locator('pre code')).toContainText('const answer = 42;');
});

test('image clipboard paste, video embed, cover choice and mobile composer layout', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ contentType: 'text/html', body: '<p>Local video preview fixture</p>' }));
  await login(page); await cases(page); await page.locator('#primary-action').click();
  await page.getByLabel('Case study title', { exact: true }).fill('An image, a video and a clear title');
  const story = await storyInput(page);
  await story.click();
  await page.evaluate(async () => { const response = await fetch('/assets/case-studies/mohtavachi-cover.png'); const image = await response.blob(); await navigator.clipboard.write([new ClipboardItem({ 'image/png': image })]); });
  await page.keyboard.press('Control+V');
  await expect(story.locator('.story-editor-image')).toHaveCount(1);
  await story.click(); await page.keyboard.press('Control+End');
  await page.getByRole('button', { name: 'Add a block', exact: true }).click();
  await page.getByRole('button', { name: 'Embed a video', exact: true }).click();
  await page.getByLabel('YouTube or Vimeo URL', { exact: true }).fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await page.getByRole('button', { name: 'Insert video', exact: true }).click();
  await expect(story.locator('iframe')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  await page.getByRole('button', { name: 'Story settings', exact: true }).click();
  await page.getByRole('button', { name: 'Choose existing', exact: true }).click();
  await page.getByLabel('Existing portfolio images', { exact: true }).selectOption('mohtavachi-cover.png');
  await page.getByRole('button', { name: 'Use image', exact: true }).click();
  await expect(page.locator('.story-cover img')).toHaveAttribute('src', /optimized/);
  await page.getByRole('button', { name: 'Close story settings', exact: true }).click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.locator('.story-composer').evaluate(element => element.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: resolve(work, `editor-${width}.png`) });
  }
});

test('touch users can reach case Edit/Delete without hovering', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await login(page); await cases(page);
  const card = page.locator('.case-gallery .case-study-card').first();
  await expect(card.locator('.project-tile-actions')).toHaveCSS('opacity', '1');
  await card.getByRole('button', { name: 'Edit', exact: true }).tap();
  await expect(page.locator('.story-composer')).toBeVisible();
  expect(await page.locator('.story-composer').evaluate(element => element.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Back to case studies', exact: true }).tap();
  await context.close();
});
