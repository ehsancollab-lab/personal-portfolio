import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { buildPages } from '../scripts/build-pages.mjs';
import { books } from '../library-content.js';

for (const target of ['site', 'admin']) await buildPages(target);
const read = (path) => readFile(new URL('../build/' + path, import.meta.url), 'utf8');

test('public deployment contains the actual portfolio, content, and CV', async () => {
  assert.equal((await read('site/CNAME')).trim(), 'ehsandesigns.com');
  const source = JSON.parse(await readFile(new URL('../data/portfolio.json', import.meta.url), 'utf8'));
  assert.deepEqual(JSON.parse(await read('site/data/portfolio.json')), source);
  await access(new URL('../build/site/assets/Ehsan-Masoomi-CV-EN.pdf', import.meta.url));
  assert.match(await read('site/case-study/index.html'), /<base href="\.\.\/"/);
});

test('public deployment excludes dashboard code, server code, and environment files', async () => {
  for (const path of ['_worker.js', 'admin.js', 'server', 'tests', '.env', '.dev.vars', '.openai']) {
    await assert.rejects(() => access(new URL('../build/site/' + path, import.meta.url)));
  }
  assert.match(await read('site/admin.html'), /https:\/\/admin\.ehsandesigns\.com\//);
});

test('dashboard is deployed with the authentication worker on every route', async () => {
  const routes = JSON.parse(await read('admin/_routes.json'));
  assert.deepEqual(routes.include, ['/*']);
  assert.deepEqual(routes.exclude, []);
  assert.match(await read('admin/_worker.js'), /verifySession/);
  assert.match(await read('admin/index.html'), /href="https:\/\/ehsandesigns\.com\/"/);
  assert.match(await read('admin/login.html'), /autocomplete="current-password"/);
  assert.doesNotMatch(await read('admin/_worker.js'), /test-only-github-token|test-only-password/);
});

test('About, collections and book details have direct public routes and local library assets', async () => {
  for (const name of ['about', 'books', 'book']) {
    assert.match(await read('site/' + name + '.html'), /library\.css/);
    assert.match(await read('site/' + name + '/index.html'), /<base href="\.\.\/"/);
  }
  for (const weight of ['Regular', 'SemiBold', 'Bold']) await access(new URL('../build/site/assets/fonts/On-' + weight + '.woff2', import.meta.url));
  await assert.rejects(() => access(new URL('../build/site/assets/fonts/vazirmatn-arabic-wght-normal.woff2', import.meta.url)));
  assert.match(await read('site/i18n.css'), /font-family: On/);
  assert.match(await read('site/i18n.css'), /font-weight: 600/);
  assert.match(await read('site/index.html'), /data-page-link="about"/);
  assert.doesNotMatch(await read('site/library-content.js'), /GITHUB_CONTENT_TOKEN|ADMIN_PASSWORD/);
});

test('all 50 original cover files and their responsive WebP variants are in the public build', async () => {
  const manifestText = await read('site/image-manifest.js');
  const manifest = JSON.parse(manifestText.replace(/^export const imageManifest = /, '').replace(/;\s*$/, ''));
  for (const book of books) {
    await access(new URL('../build/site/' + book.cover, import.meta.url));
    const entry = manifest[book.cover];
    assert.ok(entry, book.id);
    assert.equal(entry.width, book.coverImage.width);
    assert.equal(entry.height, book.coverImage.height);
    assert.ok(entry.variants.length >= 2, book.id);
    for (const variant of entry.variants) {
      assert.match(variant.path, /^assets\/optimized\/[a-f0-9]+-\d+\.webp$/);
      await access(new URL('../build/site/' + variant.path, import.meta.url));
    }
  }
});

test('Lenis is pinned, hosted locally and excluded from the dashboard runtime', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.dependencies.lenis, '1.3.11');
  const chunks = await readdir(new URL('../build/site/chunks/', import.meta.url));
  assert.ok(chunks.some(name => /^lenis.*\.js$/.test(name)));
  await assert.rejects(() => access(new URL('../build/admin/smooth-scroll.js', import.meta.url)));
});
