import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { optimizeImages } from './optimize-images.mjs';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function buildPages(target) {
if (!['site', 'admin'].includes(target)) throw new Error('Choose site or admin.');
const output = resolve(root, 'build', target);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const files = target === 'site'
  ? ['index.html', 'case-studies.html', 'case-study.html', 'experience.html', 'about.html', 'books.html', 'book.html', 'library.js', 'library.css', 'library-content.js', 'book-sources.js', 'book-covers.js', 'styles.css', 'theme-init.js', 'app.js', 'content.js', 'case-content.js', 'data', 'assets']
  : ['admin.js', 'admin.css', 'content.js', 'case-content.js', 'assets', 'login.html', 'login.css', 'login.js'];
files.push('typography.js', 'story-model.js', 'story-render.js', 'images.js', 'image-manifest.js', 'case-cards.js', 'case-cards.css', 'published-content.js', 'site-shell.js');
if (target === 'admin') files.push('case-editor.js', 'case-editor.css');
if (target === 'site') files.push('home.js', 'home.css', 'work.html', 'motion.js', 'experience-timeline.js', 'work-scene.js', 'smooth-scroll.js', 'i18n.js', 'i18n.css', 'content-fa.js', 'books-fa.js', 'viewport-blur.js', 'pointer-feedback.js', 'click-sound.js', 'interaction.css', 'preloader.js', 'preloader.css');
if (target === 'site') files.push('basic-navigation.js', 'static-pages.css', 'connection-check.html', 'asset-check.html', 'asset-probe.js');
for (const file of files) await cp(resolve(root, file), resolve(output, file), { recursive: true });
await optimizeImages(root, output);
await mkdir(resolve(output, 'assets/fonts'), { recursive: true });
await cp(resolve(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'), resolve(output, 'assets/fonts/inter-latin-wght-normal.woff2'));
await cp(resolve(root, 'node_modules/@fontsource-variable/inter/LICENSE'), resolve(output, 'assets/fonts/INTER-LICENSE'));
await writeFile(resolve(output, 'published-content.js'), 'export const publishedContent = ' + await readFile(resolve(root, 'data/portfolio.json'), 'utf8') + ';\n');
if (target === 'site') {
  await writeFile(resolve(output, '.nojekyll'), '');
  await writeFile(resolve(output, 'CNAME'), 'ehsandesigns.com\n');
  await writeFile(resolve(output, 'admin.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=https://admin.ehsandesigns.com/"><title>Portfolio dashboard</title><p><a href="https://admin.ehsandesigns.com/">Open the portfolio dashboard</a></p></html>\n');
  // Keep the previously shared extensionless links, including detail query strings.
  for (const page of ['work', 'case-studies', 'case-study', 'experience', 'about', 'books', 'book']) {
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
const entryPoints = target === 'site' ? [resolve(output, 'app.js')] : [resolve(output, 'admin.js')];
await build({ entryPoints, outdir: output, bundle: true, splitting: true, format: 'esm', minify: true, target: 'es2022', allowOverwrite: true, chunkNames: 'chunks/[name]-[hash]' });
if (target === 'admin') await build({ entryPoints: [resolve(root, 'server/dashboard-worker.mjs')], outfile: resolve(output, '_worker.js'), bundle: true, format: 'esm', target: 'es2022' });
const embeddedStyles = new Map();
let favicon = '<link rel="icon" href="./assets/figma/profile.png" type="image/png" />';
if (target === 'site') {
  const portraitVersion = createHash('sha256').update(await readFile(resolve(output, 'assets/home/book-avatar.webp'))).digest('hex').slice(0, 12);
  favicon = '<link rel="icon" href="./assets/home/book-avatar.webp?v=' + portraitVersion + '" type="image/webp" sizes="192x192" />';
  // First paint must not wait for a separate stylesheet or its nested imports.
  const css = await build({ entryPoints: ['preloader.css', 'styles.css', 'library.css', 'home.css'].map(name => resolve(output, name)), outdir: output, bundle: true, write: false, minify: true, external: ['./assets/*'] });
  for (const file of css.outputFiles) embeddedStyles.set(basename(file.path), file.text.replaceAll('</style', '<\\/style'));
}
for (const filename of target === 'site' ? ['index.html', 'work.html', 'case-studies.html', 'case-study.html', 'experience.html', 'about.html', 'books.html', 'book.html', 'work/index.html', 'case-studies/index.html', 'case-study/index.html', 'experience/index.html', 'about/index.html', 'books/index.html', 'book/index.html'] : ['index.html', 'login.html']) {
  const path = resolve(output, filename);
  let html = await readFile(path, 'utf8');
  html = html.replace(/    <link rel="preconnect"[^>]+>\n/g, '').replace(/    <link href="https:\/\/fonts.googleapis.com[^>]+>\n/g, '');
  if (target === 'site') {
    html = html.replace(/<link rel="stylesheet" href="\.\/([^"?]+\.css)"\s*\/?>/g, (tag, name) => embeddedStyles.has(name) ? '<style data-local-styles="' + name + '">' + embeddedStyles.get(name) + '</style>' : tag);
    // These small startup scripts must not block HTML parsing on a slow request.
    for (const name of ['theme-init.js', 'preloader.js']) {
      const script = (await readFile(resolve(output, name), 'utf8')).replaceAll('</script', '<\\/script');
      html = html.replace('<script src="./' + name + '"></script>', '<script>' + script + '</script>');
    }
  }
  html = html.replace('</head>', '  ' + favicon + '\n  <link rel="preload" href="./assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin />\n  </head>');
  await writeFile(path, html);
}
if (target === 'site') {
  const { prerenderSite } = await import('./prerender-site.mjs');
  await prerenderSite(output);
  const versions = {};
  for (const name of ['app.js', 'basic-navigation.js', 'preloader.js', 'theme-init.js', 'styles.css', 'home.css', 'library.css', 'preloader.css']) versions[name] = createHash('sha256').update(await readFile(resolve(output, name))).digest('hex').slice(0, 12);
  for (const name of ['index', 'work', 'case-studies', 'case-study', 'experience', 'about', 'books', 'book']) {
    const path = resolve(output, name + '.html');
    let html = await readFile(path, 'utf8');
    html = html.replace(/(src|href)="\.\/([^"?]+\.(?:js|css))"/g, (match, attribute, asset) => versions[asset] ? attribute + '="./' + asset + '?v=' + versions[asset] + '"' : match);
    await writeFile(path, html);
    if (name !== 'index') await writeFile(resolve(output, name, 'index.html'), html.replace('<head>', '<head>\n    <base href="../" />'));
  }
}
console.log(`Built ${target}: ${output}`);
return output;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildPages(process.argv[2]);
