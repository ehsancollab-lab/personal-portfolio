// Local integration fixture: real worker/authentication, in-memory GitHub transport.
// Nothing in this file is copied into a deployment.
import http from 'node:http';
import https from 'node:https';
import { readFile, mkdir, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { portfolioFixture } from './fixtures/portfolio.mjs';
import { handleRequest } from '../server/dashboard-worker.mjs';
const root = resolve(import.meta.dirname, '..');
const work = resolve(root, '../work/portfolio-browser');
await mkdir(work, { recursive: true });
try { await access(resolve(work, 'cert.pem')); await access(resolve(work, 'key.pem')); }
catch { execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-keyout', resolve(work, 'key.pem'), '-out', resolve(work, 'cert.pem'), '-days', '7', '-nodes', '-subj', '/CN=localhost'], { stdio: 'ignore' }); }
const seedText = JSON.stringify(portfolioFixture(), null, 2);
let savedText = seedText;
let head = 'a'.repeat(40);
let pendingTree;
let pendingCommit;
const uploads = new Map();
const blobs = new Map();
const sha = text => createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0`).update(text).digest('hex');
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(input);
  if (url.hostname !== 'api.github.com') return originalFetch(input, init);
  const path = url.pathname;
  const body = init?.body ? JSON.parse(init.body) : null;
  if (path.endsWith('/contents/data/portfolio.json')) return Response.json({ sha: sha(savedText), encoding: 'base64', content: Buffer.from(savedText).toString('base64') });
  if (path.endsWith('/git/ref/heads/main')) return Response.json({ object: { sha: head } });
  if (/\/git\/commits\/[a-f0-9]{40}$/.test(path)) return Response.json({ tree: { sha: 'c'.repeat(40) } });
  if (path.endsWith('/git/blobs')) { const id = sha(Buffer.from(body.content, 'base64')); blobs.set(id, body.content); return Response.json({ sha: id }); }
  if (path.endsWith('/git/trees')) { pendingTree = body.tree; return Response.json({ sha: 'd'.repeat(40) }); }
  if (path.endsWith('/git/commits')) { pendingCommit = createHash('sha1').update(JSON.stringify(body) + Date.now()).digest('hex'); return Response.json({ sha: pendingCommit }); }
  if (path.endsWith('/git/refs/heads/main')) {
    for (const entry of pendingTree) { if (entry.path === 'data/portfolio.json') savedText = entry.content; else uploads.set('/' + entry.path, blobs.get(entry.sha)); }
    head = pendingCommit; return Response.json({ object: { sha: head } });
  }
  if (path.includes('/contents/assets/uploads/')) { const asset = path.slice(path.indexOf('/assets/')); if (uploads.has(asset)) return Response.json({ encoding: 'base64', content: uploads.get(asset) }); return Response.json({}, { status: 404 }); }
  return Response.json({ error: 'unknown_fixture_route' }, { status: 404 });
};
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.pdf': 'application/pdf' };
async function asset(request, target) {
  let path = decodeURIComponent(new URL(request.url).pathname);
  if (path === '/data/portfolio.json' && target === 'site') return new Response(savedText, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (uploads.has(path) && target === 'site') return new Response(Buffer.from(uploads.get(path), 'base64'), { headers: { 'Content-Type': mime[extname(path)] } });
  if (path === '/') path = '/index.html';
  else if (!extname(path)) path += '.html';
  const filename = resolve(root, 'build', target, '.' + path);
  if (!filename.startsWith(resolve(root, 'build', target) + '/')) return new Response('Forbidden', { status: 403 });
  try { return new Response(request.method === 'HEAD' ? null : await readFile(filename), { headers: { 'Content-Type': mime[extname(filename)] || 'application/octet-stream' } }); }
  catch { return new Response('Not found', { status: 404 }); }
}
class LocalDB {
  counts = new Map();
  async exec() {}
  prepare(sql) { return { bind: (...args) => ({ sql, args }) }; }
  async batch(entries) { return entries.map(({ sql, args }) => { if (sql.startsWith('DELETE')) return { results: [] }; const count = (this.counts.get(args[0]) || 0) + 1; this.counts.set(args[0], count); return { results: [{ attempts: count }] }; }); }
}
const env = { ADMIN_PASSWORD: 'test-only-editor-password', GITHUB_CONTENT_TOKEN: 'test-only-editor-github-token-long-enough', AUTH_DB: new LocalDB(), ASSETS: { fetch: request => asset(request, 'admin') } };
async function serve(req, res, target) {
  try {
    if (target === 'site' && req.method === 'POST' && req.url === '/__test/reset') { savedText = seedText; uploads.clear(); blobs.clear(); env.AUTH_DB.counts.clear(); res.writeHead(200); res.end('reset'); return; }
    const origin = target === 'admin' ? 'https://localhost:4174' : 'http://localhost:4173';
    const body = [];
    for await (const chunk of req) body.push(chunk);
    const request = new Request(origin + req.url, { method: req.method, headers: req.headers, ...(['GET', 'HEAD'].includes(req.method) ? {} : { body: Buffer.concat(body), duplex: 'half' }) });
    const response = target === 'admin' ? await handleRequest(request, env) : await asset(request, 'site');
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { console.error(error); res.writeHead(500); res.end('Fixture failure'); }
}
http.createServer((req, res) => serve(req, res, 'site')).listen(4173, '0.0.0.0');
https.createServer({ key: await readFile(resolve(work, 'key.pem')), cert: await readFile(resolve(work, 'cert.pem')) }, (req, res) => serve(req, res, 'admin')).listen(4174, '0.0.0.0');
console.log('Portfolio preview http://localhost:4173 and dashboard https://localhost:4174');
