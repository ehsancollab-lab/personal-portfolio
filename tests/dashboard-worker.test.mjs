import test from 'node:test';
import assert from 'node:assert/strict';
import { pbkdf2Sync, createHash } from 'node:crypto';
import { portfolioFixture } from './fixtures/portfolio.mjs';
import { createSession, verifySession, verifyPassword, handleRequest, normalizePublishedContent, extractUploads, writeContent } from '../server/dashboard-worker.mjs';

const seed = portfolioFixture();
const secret = 'test-only-session-signing-secret-32-characters';
const salt = Buffer.alloc(16, 7);
const password = 'test-only-password';
const passwordHash = `pbkdf2-sha256$100000$${salt.toString('base64')}$${pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('base64')}`;
const headSha = 'a'.repeat(40);
const fileSha = 'b'.repeat(40);
const clone = () => structuredClone(seed);
const baseEnv = () => ({ SESSION_SECRET: secret, ADMIN_PASSWORD_HASH: passwordHash, GITHUB_CONTENT_TOKEN: 'test-only-github-token', ASSETS: { fetch: async () => new Response('dashboard asset') } });

class MockDB {
  counters = new Map();
  async exec(sql) { assert.match(sql, /CREATE TABLE IF NOT EXISTS login_attempts/); }
  prepare(sql) { return { bind: (...args) => ({ sql, args }) }; }
  async batch(statements) {
    return statements.map(({ sql, args }) => {
      if (sql.startsWith('DELETE')) return { results: [] };
      assert.match(sql, /ON CONFLICT\(bucket_key\) DO UPDATE/);
      const attempts = (this.counters.get(args[0]) || 0) + 1;
      this.counters.set(args[0], attempts);
      return { results: [{ attempts }] };
    });
  }
}
async function authenticated(path, options = {}) {
  const token = await createSession(secret);
  return new Request(`https://admin.ehsandesigns.com${path}`, { ...options, headers: { Cookie: `__Host-portfolio-session=${token}`, ...options.headers } });
}
function loginRequest(value = password, origin = 'https://admin.ehsandesigns.com') {
  return new Request('https://admin.ehsandesigns.com/api/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' }, body: JSON.stringify({ password: value }) });
}
function mockGitHub(t, options = {}) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    assert.equal(new URL(url).origin, 'https://api.github.com');
    assert.equal(init.redirect, 'manual');
    assert.equal(init.headers.Authorization, 'Bearer test-only-github-token');
    const path = new URL(url).pathname;
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ path, method: init.method, body });
    if (path.endsWith('/git/ref/heads/main')) return Response.json({ object: { sha: headSha } });
    if (path.endsWith('/contents/data/portfolio.json')) return Response.json({ sha: fileSha, encoding: 'base64', content: Buffer.from(JSON.stringify(seed)).toString('base64') });
    if (path.endsWith('/git/commits/' + headSha)) return Response.json({ tree: { sha: 'c'.repeat(40) } });
    if (path.endsWith('/git/blobs')) return Response.json({ sha: 'd'.repeat(40) });
    if (path.endsWith('/git/trees')) return Response.json({ sha: 'e'.repeat(40) });
    if (path.endsWith('/git/commits')) return Response.json({ sha: 'f'.repeat(40) });
    if (path.endsWith('/git/refs/heads/main')) return options.race ? Response.json({}, { status: 422 }) : Response.json({});
    throw new Error(`Unexpected GitHub request: ${path}`);
  };
  t.after(() => { globalThis.fetch = original; });
  return calls;
}

test('sessions reject modifications, another key, and expiry', async () => {
  const now = Date.now();
  const session = await createSession(secret, now);
  assert.equal(await verifySession(session, secret, now), true);
  assert.equal(await verifySession(session + 'x', secret, now), false);
  assert.equal(await verifySession(session, secret + 'another', now), false);
  assert.equal(await verifySession(session, secret, now + 8 * 60 * 60 * 1000), false);
  assert.equal(await verifySession('not-a-session', secret), false);
});

test('PBKDF2 verifier accepts only the correct password', async () => {
  assert.equal(await verifyPassword(password, passwordHash), true);
  assert.equal(await verifyPassword('incorrect-password', passwordHash), false);
});

test('protected HTML redirects and APIs reject unauthenticated writes', async () => {
  const env = baseEnv();
  const page = await handleRequest(new Request('https://admin.ehsandesigns.com/'), env);
  assert.equal(page.status, 303);
  assert.equal(page.headers.get('Location'), 'https://admin.ehsandesigns.com/login');
  const api = await handleRequest(new Request('https://admin.ehsandesigns.com/api/content', { method: 'POST' }), env);
  assert.equal(api.status, 401);
  assert.equal(api.headers.get('Cache-Control'), 'no-store');
});

test('login assets are available while dashboard assets require a session', async () => {
  const env = baseEnv();
  assert.equal((await handleRequest(new Request('https://admin.ehsandesigns.com/login'), env)).status, 200);
  assert.equal((await handleRequest(new Request('https://admin.ehsandesigns.com/login.js'), env)).status, 200);
  assert.equal((await handleRequest(new Request('https://admin.ehsandesigns.com/admin.js'), env)).status, 303);
  assert.equal((await handleRequest(await authenticated('/admin.js'), env)).status, 200);
});

test('correct login sets a host-only secure HttpOnly cookie', async () => {
  const env = { ...baseEnv(), AUTH_DB: new MockDB() };
  const response = await handleRequest(loginRequest(), env);
  assert.equal(response.status, 200);
  const cookie = response.headers.get('Set-Cookie');
  assert.match(cookie, /^__Host-portfolio-session=/);
  assert.match(cookie, /HttpOnly; Secure; SameSite=Strict/);
  assert.doesNotMatch(cookie, /Domain=/i);
  const body = await response.text();
  assert.doesNotMatch(body, /test-only|pbkdf2/);
});

test('login fails closed without persistent rate-limit storage', async () => {
  assert.equal((await handleRequest(loginRequest(), baseEnv())).status, 503);
});

test('persistent per-IP counters limit repeated login attempts', async () => {
  const env = { ...baseEnv(), AUTH_DB: new MockDB() };
  for (let i = 0; i < 8; i++) assert.equal((await handleRequest(loginRequest('wrong'), env)).status, 401);
  const response = await handleRequest(loginRequest(), env);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
});

test('cross-origin login and content writes are rejected', async () => {
  const env = { ...baseEnv(), AUTH_DB: new MockDB() };
  assert.equal((await handleRequest(loginRequest(password, 'https://untrusted.example'), env)).status, 403);
  const response = await handleRequest(await authenticated('/api/content', {
    method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: '{}'
  }), env);
  assert.equal(response.status, 403);
});

test('logout expires the cookie and preserves security headers', async () => {
  const response = await handleRequest(await authenticated('/api/logout', {
    method: 'POST', headers: { Origin: 'https://admin.ehsandesigns.com', 'Content-Type': 'application/json' }, body: '{}'
  }), baseEnv());
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
});

test('supplied portfolio content passes validation without fabricated entries', () => {
  const normalized = normalizePublishedContent(seed);
  assert.equal(normalized.projects.length, 20);
  assert.deepEqual(normalized.caseStudies.map(({ title }) => title), seed.caseStudies.map(({ title }) => title));
  assert.deepEqual(normalized.experience.map(({ company }) => company), seed.experience.map(({ company }) => company));
});

test('content validation rejects executable URLs, traversal paths, duplicate ids, and SVG uploads', () => {
  const badLink = clone(); badLink.projects[0].href = 'javascript:alert(1)';
  assert.throws(() => normalizePublishedContent(badLink), /invalid_link/);
  const badPath = clone(); badPath.projects[0].image = '../secret.png';
  assert.throws(() => normalizePublishedContent(badPath), /invalid_image/);
  const duplicate = clone(); duplicate.projects[1].id = duplicate.projects[0].id;
  assert.throws(() => normalizePublishedContent(duplicate), /duplicate_id/);
  const svg = clone(); svg.projects[0].image = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';
  assert.throws(() => normalizePublishedContent(svg), /invalid_image/);
});

test('uploaded images become deduplicated hashed files while content stays small', async () => {
  const input = clone();
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X8J0AAAAASUVORK5CYII=';
  input.projects[0].image = 'data:image/png;base64,' + png;
  input.projects[1].image = input.projects[0].image;
  const { content, uploads } = await extractUploads(input);
  assert.equal(uploads.size, 1);
  assert.match(content.projects[0].image, /^uploads\/[a-f0-9]{64}\.png$/);
  assert.equal(content.projects[1].image, content.projects[0].image);
  assert.equal(input.projects[0].image.startsWith('data:'), true);
});

test('image data must match the declared image format', async () => {
  const input = clone(); input.projects[0].image = 'data:image/png;base64,' + Buffer.from('<script>unsafe</script>').toString('base64');
  await assert.rejects(() => extractUploads(input), /invalid_image/);
});

test('stale content revisions never create a commit or overwrite another edit', async (t) => {
  const calls = mockGitHub(t);
  await assert.rejects(() => writeContent(baseEnv(), seed, '9'.repeat(40)), /content_conflict/);
  assert.equal(calls.length, 2);
  assert.equal(calls.every(({ method }) => method === 'GET'), true);
});

test('publication uses one atomic tree, retains the prior tree and never force-pushes', async (t) => {
  const calls = mockGitHub(t);
  const input = clone(); input.projects.reverse();
  const result = await writeContent(baseEnv(), input, fileSha);
  assert.equal(result.content.projects[0].id, input.projects[0].id);
  const tree = calls.find(({ path }) => path.endsWith('/git/trees')).body;
  assert.equal(tree.base_tree, 'c'.repeat(40));
  assert.deepEqual(tree.tree.map(({ path }) => path), ['data/portfolio.json']);
  const expectedSha = createHash('sha1').update(`blob ${Buffer.byteLength(tree.tree[0].content)}\0`).update(tree.tree[0].content).digest('hex');
  assert.equal(result.revision, expectedSha);
  assert.deepEqual(calls.find(({ path }) => path.endsWith('/git/commits')).body.parents, [headSha]);
  assert.deepEqual(calls.at(-1).body, { sha: 'f'.repeat(40), force: false });
});

test('a concurrent branch update fails rather than force-overwriting it', async (t) => {
  const calls = mockGitHub(t, { race: true });
  await assert.rejects(() => writeContent(baseEnv(), seed, fileSha), /content_conflict/);
  assert.equal(calls.filter(({ method }) => method === 'PATCH').length, 1);
  assert.equal(calls.at(-1).body.force, false);
});

test('authenticated read returns data and revision without GitHub credentials', async (t) => {
  mockGitHub(t);
  const response = await handleRequest(await authenticated('/api/content'), baseEnv());
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.doesNotMatch(body, /test-only-github-token|Authorization|ADMIN_PASSWORD_HASH/);
  assert.equal(JSON.parse(body).revision, fileSha);
});
