import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function buildPages(target) {
if (!['site', 'admin'].includes(target)) throw new Error('Choose site or admin.');
const output = resolve(root, 'build', target);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const files = target === 'site'
  ? ['index.html', 'case-studies.html', 'case-study.html', 'experience.html', 'styles.css', 'app.js', 'content.js', 'case-content.js', 'data', 'assets']
  : ['admin.js', 'admin.css', 'content.js', 'case-content.js', 'assets', 'login.html', 'login.css', 'login.js'];
for (const file of files) await cp(resolve(root, file), resolve(output, file), { recursive: true });
if (target === 'site') {
  await writeFile(resolve(output, '.nojekyll'), '');
  await writeFile(resolve(output, 'CNAME'), 'ehsandesigns.com\n');
  await writeFile(resolve(output, 'admin.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=https://admin.ehsandesigns.com/"><title>Portfolio dashboard</title><p><a href="https://admin.ehsandesigns.com/">Open the portfolio dashboard</a></p></html>\n');
  // Keep the previously shared extensionless links, including detail query strings.
  for (const page of ['case-studies', 'case-study', 'experience']) {
    const html = await readFile(resolve(output, `${page}.html`), 'utf8');
    await mkdir(resolve(output, page), { recursive: true });
    await writeFile(resolve(output, page, 'index.html'), html.replace('<head>', '<head>\n    <base href="../" />'));
  }
} else {
  let html = await readFile(resolve(root, 'admin.html'), 'utf8');
  html = html.replaceAll('href="./index.html"', 'href="https://ehsandesigns.com/"');
  await writeFile(resolve(output, 'index.html'), html);
  await cp(resolve(root, 'server/dashboard-worker.mjs'), resolve(output, '_worker.js'));
  await writeFile(resolve(output, '_routes.json'), JSON.stringify({ version: 1, include: ['/*'], exclude: [] }, null, 2));
  await writeFile(resolve(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
}
console.log(`Built ${target}: ${output}`);
return output;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildPages(process.argv[2]);
