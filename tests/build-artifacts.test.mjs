import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { buildPages } from '../scripts/build-pages.mjs';
import { books } from '../library-content.js';
import { createHash } from 'node:crypto';

for (const target of ['site', 'admin']) await buildPages(target);
const read = (path) => readFile(new URL('../build/' + path, import.meta.url), 'utf8');

test('public deployment contains the actual portfolio, content, and CV', async () => {
  assert.equal((await read('site/CNAME')).trim(), 'ehsandesigns.com');
  const source = JSON.parse(await readFile(new URL('../data/portfolio.json', import.meta.url), 'utf8'));
  assert.deepEqual(JSON.parse(await read('site/data/portfolio.json')), source);
  for (const [lang, bytes, hash] of [
    ['EN', 1573632, 'b1299479c508e790c59a3aa872cba2f5ecf96b4e0e7332d6dce94cb0cc581d06'],
    ['FA', 901437, '522ef516e1fd52bf84940f65bfc7366eeaf9cebea652bf7ac9f79e08be661162']
  ]) {
    const pdf = await readFile(new URL('../build/site/assets/Ehsan-Masoomi-CV-' + lang + '-November-2026.pdf', import.meta.url));
    assert.equal(pdf.length, bytes); assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.equal(createHash('sha256').update(pdf).digest('hex'), hash);
  }
  await assert.rejects(() => access(new URL('../build/site/assets/Ehsan-Masoomi-CV-EN.pdf', import.meta.url)));
  for (const name of ['mors', 'nibex', 'remocapp']) {
    const asset = 'assets/companies/' + name + '.jpg';
    assert.deepEqual(await readFile(new URL('../build/site/' + asset, import.meta.url)), await readFile(new URL('../' + asset, import.meta.url)));
  }
  assert.match(await read('site/case-study/index.html'), /<base href="\.\.\/"/);
});

test('public deployment excludes dashboard code, server code, and environment files', async () => {
  for (const path of ['_worker.js', 'admin.js', 'server', 'tests', '.env', '.dev.vars', '.openai']) {
    await assert.rejects(() => access(new URL('../build/site/' + path, import.meta.url)));
  }
  assert.match(await read('site/admin.html'), /https:\/\/admin\.ehsandesigns\.com\//);
});

test('public HTML contains readable content and versioned enhancement assets', async () => {
  const home = await read('site/index.html');
  assert.match(home, /<p[^>]*id="bio"[^>]*>Senior AI Product Designer/);
  assert.match(home, /data-static-locale="fa"/);
  assert.match(home, /src="\.\/app\.js\?v=[a-f0-9]{12}"/);
  assert.match(home, /src="\.\/basic-navigation\.js\?v=[a-f0-9]{12}"/);
  assert.doesNotMatch(home, /fonts\.googleapis\.com|fonts\.gstatic\.com|127\.0\.0\.1/);
  assert.doesNotMatch(home, /<script(?![^>]*(?:type="module"|defer|async))[^>]*src=/);
  assert.match(home, /const deadline = setTimeout\(finish, 4500\)/);
  assert.match(await read('site/book.html'), /id="book-behave"/);
  assert.match(await read('site/books.html'), /id="collection-growth"/);
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
