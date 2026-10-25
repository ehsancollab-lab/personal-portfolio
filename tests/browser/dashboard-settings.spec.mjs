import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const site = 'http://localhost:4173';
const admin = 'https://localhost:4174';
const work = resolve(import.meta.dirname, '../../../work/portfolio-browser');
test.beforeEach(async ({ request }) => { await request.post(site + '/__test/reset'); });
async function login(page) {
  await page.goto(admin);
  await page.getByLabel('Password', { exact: true }).fill('test-only-editor-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.publishing-bar')).toHaveAttribute('data-state', 'saved');
}
async function editProfile(page, greeting) {
  await page.locator('.dashboard-tab[data-section="profile"]').click();
  await page.getByLabel('Greeting', { exact: true }).fill(greeting);
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
}

test('settings sits to the right of the centered title and supports keyboard and outside dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 973, height: 800 });
  await login(page);
  const toggle = page.getByRole('button', { name: 'Dashboard settings', exact: true });
  const menu = page.getByRole('menu', { name: 'Dashboard settings', exact: true });
  await page.locator('.dashboard-title').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {}))));
  const title = await page.locator('.dashboard-title').boundingBox();
  const gear = await toggle.boundingBox();
  expect(Math.abs(title.x + title.width / 2 - 973 / 2)).toBeLessThan(1);
  expect(gear.x - (title.x + title.width)).toBe(16);
  expect(Math.abs(gear.y + gear.height / 2 - title.y - title.height / 2)).toBeLessThan(1);
  await expect(page.locator('.publishing-bar')).toBeHidden();
  await expect(page.locator('#toast')).not.toBeVisible();
  await expect(menu).toBeHidden();
  await toggle.click();
  await expect(menu.getByRole('menuitem')).toHaveCount(4);
  await expect(page.getByRole('menuitem', { name: 'Download backup' })).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.getByRole('menuitem', { name: 'Download backup' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Restore backup' })).toBeFocused();
  await page.screenshot({ path: resolve(work, 'dashboard-settings-menu.png') });
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused(); await expect(menu).toBeHidden();
  await page.keyboard.press('ArrowDown'); await expect(menu).toBeVisible();
  await page.locator('.dashboard-title').click(); await expect(menu).toBeHidden();
  await toggle.click(); await page.keyboard.press('Tab'); await expect(menu).toBeHidden();
  expect(await page.locator('.dashboard-title').boundingBox()).toEqual(title);
});

test('successful saves show a temporary toast only after GitHub confirms, and repeated saves show it again', async ({ page }) => {
  await login(page);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/content', async route => {
    if (route.request().method() === 'POST') await gate;
    await route.continue();
  });
  await editProfile(page, 'First confirmed save');
  await expect(page.locator('.publishing-bar')).toHaveAttribute('data-state', 'saving');
  await expect(page.locator('#toast')).not.toBeVisible();
  release();
  await expect(page.locator('#toast')).toBeVisible();
  await expect(page.locator('#toast')).toHaveAttribute('data-tone', 'success');
  await expect(page.locator('#toast')).toHaveText('Saved to GitHub');
  await expect(page.locator('.publishing-bar')).toBeHidden();
  await page.screenshot({ path: resolve(work, 'dashboard-saved-toast.png') });
  await expect(page.locator('#toast')).not.toBeVisible({ timeout: 5000 });
  await page.getByLabel('Greeting', { exact: true }).fill('Second confirmed save');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.locator('#toast')).toBeVisible();
  await expect(page.locator('#toast')).toHaveText('Saved to GitHub');
  await expect.poll(() => page.evaluate(async () => (await (await fetch('/api/content')).json()).content.profile.greeting)).toBe('Second confirmed save');
  await expect(page.locator('#toast')).not.toBeVisible({ timeout: 5000 });
});

test('settings keeps download, restore, view site and sign out working', async ({ page }) => {
  await login(page);
  const toggle = page.getByRole('button', { name: 'Dashboard settings', exact: true });
  await toggle.click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'Download backup' }).click();
  const download = await downloading;
  const backup = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(backup.version).toBe(3); expect(backup.projects.length).toBeGreaterThan(0);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  backup.profile.greeting = 'Restored through settings';
  await toggle.click();
  await expect(page.getByRole('menuitem', { name: 'View site (opens in a new tab)' })).toHaveAttribute('href', 'https://ehsandesigns.com/');
  await expect(page.getByRole('menuitem', { name: 'View site (opens in a new tab)' })).toHaveAttribute('target', '_blank');
  const choosing = page.waitForEvent('filechooser');
  await page.getByRole('menuitem', { name: 'Restore backup' }).click();
  page.once('dialog', dialog => dialog.accept());
  await (await choosing).setFiles({ name: 'portfolio.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.locator('#toast')).toHaveText('Saved to GitHub');
  await expect.poll(() => page.evaluate(async () => (await (await fetch('/api/content')).json()).content.profile.greeting)).toBe('Restored through settings');
  await toggle.click(); await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(admin + '/login');
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
});

test('failed saves remain actionable, retries succeed, and conflicts never show success', async ({ page }) => {
  await login(page);
  const failure = async route => route.request().method() === 'POST' ? route.fulfill({ status: 503, json: { error: 'github_unavailable' } }) : route.continue();
  await page.route('**/api/content', failure);
  await editProfile(page, 'Keep this local draft');
  const status = page.locator('.publishing-bar');
  await expect(status).toHaveAttribute('data-state', 'error');
  await expect(page.getByRole('button', { name: 'Retry saving', exact: true })).toBeVisible();
  await expect(page.locator('#toast')).not.toBeVisible();
  await page.waitForTimeout(3600);
  await expect(status).toBeVisible();
  await page.unroute('**/api/content', failure);
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click();
  await expect(page.locator('#toast')).toHaveText('Saved to GitHub');
  await page.route('**/api/content', async route => route.request().method() === 'POST' ? route.fulfill({ status: 409, json: { error: 'conflict' } }) : route.continue());
  await page.getByLabel('Greeting', { exact: true }).fill('Conflicting draft');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(status).toHaveAttribute('data-state', 'conflict');
  await expect(page.getByRole('button', { name: 'Load latest', exact: true })).toBeVisible();
  await expect(page.locator('#toast')).not.toBeVisible();
});

test('settings menu fits small screens and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole('button', { name: 'Dashboard settings', exact: true }).click();
    const menu = page.getByRole('menu', { name: 'Dashboard settings', exact: true });
    const bounds = await menu.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const item of await menu.getByRole('menuitem').all()) expect((await item.boundingBox()).height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: resolve(work, `dashboard-settings-${width}.png`) });
    await page.keyboard.press('Escape');
  }
});
