const COOKIE = '__Host-portfolio-session';
const SESSION_SECONDS = 8 * 60 * 60;
const CONTENT_PATH = 'data/portfolio.json';
const MAX_BODY = 8 * 1024 * 1024;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}
function secure(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'same-origin');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Strict-Transport-Security', 'max-age=31536000');
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function encode64(bytes) {
  let result = '';
  for (let i = 0; i < bytes.length; i += 8192) result += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(result);
}
function decode64(value) { return Uint8Array.from(atob(value), (char) => char.charCodeAt(0)); }
function url64(bytes) { return encode64(bytes).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, ''); }
function unurl64(value) { return decode64(value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4)); }
async function hmacKey(secret) {
  if (typeof secret !== 'string' || secret.length < 32) throw new HttpError(503, 'admin_not_configured');
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function createSession(secret, now = Date.now()) {
  const payload = url64(encoder.encode(JSON.stringify({ sub: 'portfolio-owner', exp: Math.floor(now / 1000) + SESSION_SECONDS })));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${url64(new Uint8Array(signature))}`;
}
export async function verifySession(token, secret, now = Date.now()) {
  try {
    if (!token || token.length > 1024) return false;
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) return false;
    if (!await crypto.subtle.verify('HMAC', await hmacKey(secret), unurl64(signature), encoder.encode(payload))) return false;
    const parsed = JSON.parse(decoder.decode(unurl64(payload)));
    const current = Math.floor(now / 1000);
    return parsed.sub === 'portfolio-owner' && Number.isInteger(parsed.exp) && parsed.exp > current && parsed.exp <= current + SESSION_SECONDS;
  } catch { return false; }
}
function requestSession(request) {
  return request.headers.get('Cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
}
function cookie(token, maxAge = SESSION_SECONDS) {
  return `${COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}
export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || password.length > 256) return false;
  const [algorithm, count, salt, expected, extra] = String(encoded || '').split('$');
  if (algorithm !== 'pbkdf2-sha256' || count !== '100000' || !salt || !expected || extra) throw new HttpError(503, 'admin_not_configured');
  const expectedBytes = decode64(expected);
  const saltBytes = decode64(salt);
  if (expectedBytes.length !== 32 || saltBytes.length < 16) throw new HttpError(503, 'admin_not_configured');
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const actual = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', iterations: 100000, salt: saltBytes }, key, 256));
  let difference = 0;
  for (let i = 0; i < expectedBytes.length; i++) difference |= actual[i] ^ expectedBytes[i];
  return difference === 0;
}
function loginCredential(env) {
  if (env.ADMIN_PASSWORD !== undefined) {
    if (typeof env.ADMIN_PASSWORD !== 'string' || env.ADMIN_PASSWORD.length < 10 || env.ADMIN_PASSWORD.length > 256) throw new HttpError(503, 'admin_not_configured');
    return ['password', env.ADMIN_PASSWORD];
  }
  if (typeof env.ADMIN_PASSWORD_HASH !== 'string' || !env.ADMIN_PASSWORD_HASH) throw new HttpError(503, 'admin_not_configured');
  return ['verifier', env.ADMIN_PASSWORD_HASH];
}
async function verifyLoginPassword(password, env) {
  const [mode, expected] = loginCredential(env);
  if (mode === 'verifier') return verifyPassword(password, expected);
  // Compare fixed-length digests without revealing the configured password length.
  const [actualDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(password)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected))
  ]);
  const actualBytes = new Uint8Array(actualDigest);
  const expectedBytes = new Uint8Array(expectedDigest);
  let difference = 0;
  for (let i = 0; i < expectedBytes.length; i++) difference |= actualBytes[i] ^ expectedBytes[i];
  return difference === 0;
}
async function sessionSigningSecret(env) {
  // Retain existing verifier/session configurations for already configured hosts.
  if (env.ADMIN_PASSWORD === undefined && env.SESSION_SECRET !== undefined) {
    await hmacKey(env.SESSION_SECRET);
    return env.SESSION_SECRET;
  }
  const credential = loginCredential(env);
  // The GitHub credential supplies server-only entropy, so a short numeric password
  // is never sufficient on its own to forge session cookies. No setup script is needed.
  const rootSecret = env.SESSION_SECRET ?? env.GITHUB_CONTENT_TOKEN;
  if (typeof rootSecret !== 'string' || rootSecret.length < 32) throw new HttpError(503, 'admin_not_configured');
  const key = await crypto.subtle.importKey('raw', encoder.encode(rootSecret), 'HKDF', false, ['deriveBits']);
  const info = JSON.stringify([
    env.GITHUB_OWNER || 'ehsancollab-lab', env.GITHUB_REPO || 'personal-portfolio', branch(env), credential
  ]);
  const bits = await crypto.subtle.deriveBits({
    name: 'HKDF', hash: 'SHA-256', salt: encoder.encode('portfolio-dashboard-session-v1'), info: encoder.encode(info)
  }, key, 256);
  return url64(new Uint8Array(bits));
}
function sameOrigin(request) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) throw new HttpError(403, 'origin_not_allowed');
  const type = request.headers.get('Content-Type') || '';
  if (!/^application\/json(?:;|$)/i.test(type)) throw new HttpError(415, 'json_required');
}
async function readJson(request, max = MAX_BODY) {
  if (Number(request.headers.get('Content-Length')) > max) throw new HttpError(413, 'request_too_large');
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > max) throw new HttpError(413, 'request_too_large');
  try { return JSON.parse(decoder.decode(bytes)); } catch { throw new HttpError(400, 'invalid_json'); }
}
async function loginAllowed(request, env, signingSecret) {
  if (!env.AUTH_DB) throw new HttpError(503, 'admin_not_configured');
  const minute = Math.floor(Date.now() / 60000);
  const address = request.headers.get('CF-Connecting-IP') || 'unknown';
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(signingSecret + address)));
  const key = `${minute}:${url64(digest)}`;
  await env.AUTH_DB.exec('CREATE TABLE IF NOT EXISTS login_attempts (bucket_key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL)');
  const sql = 'INSERT INTO login_attempts (bucket_key, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket_key) DO UPDATE SET attempts = login_attempts.attempts + 1 RETURNING attempts';
  const result = await env.AUTH_DB.batch([
    env.AUTH_DB.prepare(sql).bind(key, minute + 60),
    env.AUTH_DB.prepare(sql).bind(`${minute}:all`, minute + 60),
    env.AUTH_DB.prepare('DELETE FROM login_attempts WHERE expires_at < ?').bind(minute)
  ]);
  return result[0].results[0].attempts <= 8 && result[1].results[0].attempts <= 80;
}
const validHref = (value) => !value || (/^(https:\/\/|mailto:|tel:|\/|\.\/|#)/i.test(value) && !/^\/\//.test(value) && !/[\u0000-\u001f]/.test(value));
const uploadPath = /^uploads\/[a-f0-9]{64}\.(?:png|jpg|webp|gif|avif)$/;
const imageData = /^data:image\/(png|jpeg|webp|gif|avif);base64,([A-Za-z0-9+/]+={0,2})$/;
function string(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new HttpError(400, 'invalid_content');
  return value;
}
function image(value) {
  if (typeof value !== 'string') throw new HttpError(400, 'invalid_image');
  if (value === '' || uploadPath.test(value)) return value;
  if (value.length <= 900000 && imageData.test(value)) return value;
  if (/^[A-Za-z0-9][A-Za-z0-9 _.-]{0,160}\.(?:png|jpe?g|webp|gif|avif)$/i.test(value) && !value.includes('..')) return value;
  throw new HttpError(400, 'invalid_image');
}
export function normalizePublishedContent(candidate) {
  if (!candidate || candidate.version !== 3) throw new HttpError(400, 'invalid_content');
  const list = (key, limit, fields, hasImage = true) => {
    const input = candidate[key];
    if (!Array.isArray(input) || input.length > limit) throw new HttpError(400, 'invalid_content');
    const ids = new Set();
    return input.map((item) => {
      if (!item || typeof item !== 'object') throw new HttpError(400, 'invalid_content');
      const id = string(item.id, 128, true);
      if (ids.has(id)) throw new HttpError(400, 'duplicate_id');
      ids.add(id);
      const row = { id };
      for (const [key, max] of Object.entries(fields)) row[key] = string(item[key] ?? '', max);
      row.href = string(item.href ?? '', 2048);
      if (!validHref(row.href)) throw new HttpError(400, 'invalid_link');
      if (hasImage) { row.image = image(item.image ?? ''); row.visible = item.visible !== false; }
      return row;
    });
  };
  return {
    version: 3,
    profile: {
      greeting: string(candidate.profile?.greeting, 300),
      bio: string(candidate.profile?.bio, 10000),
      contactPrompt: string(candidate.profile?.contactPrompt, 1000)
    },
    projects: list('projects', 500, { title: 500 }),
    caseStudies: list('caseStudies', 100, { title: 500, summary: 5000, body: 200000 }),
    experience: list('experience', 100, { role: 500, company: 500, dates: 500, description: 30000 }),
    contactLinks: list('contactLinks', 30, { label: 150 }, false)
  };
}
export async function extractUploads(content) {
  const output = normalizePublishedContent(content);
  const uploads = new Map();
  for (const item of [...output.projects, ...output.caseStudies, ...output.experience]) {
    const match = imageData.exec(item.image);
    if (!match) continue;
    let bytes;
    try { bytes = decode64(match[2]); } catch { throw new HttpError(400, 'invalid_image'); }
    const signature = Array.from(bytes.subarray(0, 16));
    const text = String.fromCharCode(...signature);
    const valid = match[1] === 'png' ? signature.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
      : match[1] === 'jpeg' ? signature[0] === 255 && signature[1] === 216 && signature[2] === 255
      : match[1] === 'webp' ? text.startsWith('RIFF') && text.slice(8, 12) === 'WEBP'
      : match[1] === 'gif' ? /^GIF8[79]a/.test(text)
      : text.slice(4, 8) === 'ftyp' && /avif|avis/.test(text.slice(8));
    if (!valid) throw new HttpError(400, 'invalid_image');
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (value) => value.toString(16).padStart(2, '0')).join('');
    const path = `uploads/${digest}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`;
    uploads.set(`assets/${path}`, match[2]);
    item.image = path;
  }
  return { content: output, uploads };
}
function repoBase(env) {
  const owner = env.GITHUB_OWNER || 'ehsancollab-lab';
  const repo = env.GITHUB_REPO || 'personal-portfolio';
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo) || !env.GITHUB_CONTENT_TOKEN) throw new HttpError(503, 'publishing_not_configured');
  return `https://api.github.com/repos/${owner}/${repo}`;
}
async function github(env, path, method = 'GET', body) {
  const response = await fetch(repoBase(env) + path, {
    method, redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: {
      'Accept': 'application/vnd.github+json', 'Authorization': `Bearer ${env.GITHUB_CONTENT_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Ehsan-Portfolio-Dashboard',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!response.ok) {
    if (response.status === 409 || response.status === 422) throw new HttpError(409, 'content_conflict');
    throw new HttpError(502, 'github_unavailable');
  }
  return response.json();
}
function branch(env) { return env.GITHUB_BRANCH || 'main'; }
async function readContent(env, ref = branch(env)) {
  const file = await github(env, `/contents/${CONTENT_PATH}?ref=${encodeURIComponent(ref)}`);
  if (!/^[a-f0-9]{40}$/.test(file.sha)) throw new HttpError(502, 'invalid_stored_content');
  const blob = file.encoding === 'base64' ? file : await github(env, `/git/blobs/${file.sha}`);
  if (blob.encoding !== 'base64' || typeof blob.content !== 'string') throw new HttpError(502, 'invalid_stored_content');
  let parsed;
  try { parsed = JSON.parse(decoder.decode(decode64(blob.content.replace(/\s/g, '')))); }
  catch { throw new HttpError(502, 'invalid_stored_content'); }
  return { content: normalizePublishedContent(parsed), revision: file.sha };
}
async function blobSha(value) {
  const bytes = encoder.encode(value);
  const header = encoder.encode(`blob ${bytes.length}\0`);
  const buffer = new Uint8Array(header.length + bytes.length);
  buffer.set(header); buffer.set(bytes, header.length);
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', buffer)), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
export async function writeContent(env, candidate, expectedRevision) {
  if (!/^[a-f0-9]{40}$/.test(expectedRevision || '')) throw new HttpError(428, 'revision_required');
  const { content, uploads } = await extractUploads(candidate);
  if (uploads.size > 32) throw new HttpError(413, 'too_many_new_images');
  const head = await github(env, `/git/ref/heads/${encodeURIComponent(branch(env))}`);
  const current = await readContent(env, head.object.sha);
  if (current.revision !== expectedRevision) throw new HttpError(409, 'content_conflict');
  const commit = await github(env, `/git/commits/${head.object.sha}`);
  const entries = [];
  // Sequential uploads bound CPU and memory use. One tree publishes all files atomically.
  for (const [path, encoded] of uploads) {
    const blob = await github(env, '/git/blobs', 'POST', { content: encoded, encoding: 'base64' });
    entries.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const text = JSON.stringify(content, null, 2) + '\n';
  entries.push({ path: CONTENT_PATH, mode: '100644', type: 'blob', content: text });
  const tree = await github(env, '/git/trees', 'POST', { base_tree: commit.tree.sha, tree: entries });
  const saved = await github(env, '/git/commits', 'POST', { message: 'Update portfolio content from dashboard', tree: tree.sha, parents: [head.object.sha] });
  await github(env, `/git/refs/heads/${encodeURIComponent(branch(env))}`, 'PATCH', { sha: saved.sha, force: false });
  return { content, revision: await blobSha(text), commit: saved.sha };
}
export async function handleRequest(request, env) {
  try {
    const url = new URL(request.url);
    if (url.protocol !== 'https:') { url.protocol = 'https:'; return secure(Response.redirect(url.href, 308)); }
    const path = url.pathname;
    if (request.method === 'POST' && path === '/api/login') {
      sameOrigin(request);
      const input = await readJson(request, 2048);
      if (!input || typeof input.password !== 'string' || input.password.length < 1 || input.password.length > 256) throw new HttpError(400, 'invalid_request');
      const signingSecret = await sessionSigningSecret(env);
      if (!await loginAllowed(request, env, signingSecret)) return secure(json({ error: 'too_many_attempts' }, 429, { 'Retry-After': '60' }));
      if (!await verifyLoginPassword(input.password, env)) return secure(json({ error: 'incorrect_password' }, 401));
      return secure(json({ authenticated: true }, 200, { 'Set-Cookie': cookie(await createSession(signingSecret)) }));
    }
    if (request.method === 'POST' && path === '/api/logout') {
      sameOrigin(request);
      return secure(json({ authenticated: false }, 200, { 'Set-Cookie': cookie('', 0) }));
    }
    const session = requestSession(request);
    const authenticated = session ? await verifySession(session, await sessionSigningSecret(env)) : false;
    if (path === '/login' || path === '/login.html') {
      if (!['GET', 'HEAD'].includes(request.method)) throw new HttpError(405, 'method_not_allowed');
      if (authenticated) return secure(Response.redirect(url.origin + '/', 303));
      return secure(await env.ASSETS.fetch(new Request(new URL('/login.html', url), request)));
    }
    if (['/login.css', '/login.js', '/assets/figma/profile.png'].includes(path) && ['GET', 'HEAD'].includes(request.method)) return secure(await env.ASSETS.fetch(request));
    if (!authenticated) {
      if (path.startsWith('/api/')) throw new HttpError(401, 'sign_in_required');
      return secure(Response.redirect(url.origin + '/login', 303));
    }
    if (path === '/api/session' && request.method === 'GET') return secure(json({ authenticated: true }));
    if (path === '/api/content') {
      if (request.method === 'GET') return secure(json(await readContent(env)));
      if (request.method === 'POST') {
        sameOrigin(request);
        const expected = request.headers.get('If-Match')?.replace(/^"|"$/g, '');
        return secure(json(await writeContent(env, await readJson(request), expected)));
      }
      throw new HttpError(405, 'method_not_allowed');
    }
    if (path.startsWith('/api/')) throw new HttpError(404, 'not_found');
    if (!['GET', 'HEAD'].includes(request.method)) throw new HttpError(405, 'method_not_allowed');
    if (path.startsWith('/assets/uploads/')) {
      if (!uploadPath.test(path.slice('/assets/'.length))) throw new HttpError(404, 'not_found');
      const file = await github(env, `/contents${path}?ref=${encodeURIComponent(branch(env))}`);
      if (file.encoding !== 'base64' || typeof file.content !== 'string') throw new HttpError(502, 'invalid_image');
      const extensions = { png: 'png', jpg: 'jpeg', webp: 'webp', gif: 'gif', avif: 'avif' };
      return secure(new Response(request.method === 'HEAD' ? null : decode64(file.content.replace(/\s/g, '')), { headers: { 'Content-Type': `image/${extensions[path.split('.').pop()]}` } }));
    }
    if (path === '/admin.html') return secure(Response.redirect(url.origin + '/', 303));
    return secure(await env.ASSETS.fetch(request));
  } catch (error) {
    return secure(json({ error: error instanceof HttpError ? error.code : 'temporarily_unavailable' }, error instanceof HttpError ? error.status : 503));
  }
}

export default { fetch: handleRequest };
