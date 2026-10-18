import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { buildPages } from '../scripts/build-pages.mjs';

for (const target of ['site', 'admin']) await buildPages(target);
const read = (path) => readFile(new URL('../build/' + path, import.meta.url), 'utf8');

test('public deployment contains the actual portfolio, content, and CV', async () => {
  assert.equal((await read('site/CNAME')).trim(), 'ehsandesigns.com');
  assert.equal(JSON.parse(await read('site/data/portfolio.json')).projects.length, 20);
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
