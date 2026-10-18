import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readdir, readFile, mkdir, writeFile, cp, access } from 'node:fs/promises';
import { join } from 'node:path';
export async function optimizeImages(root, output) {
  const destination = join(output, 'assets/optimized');
  const cache = join(root, 'build/.image-cache');
  await mkdir(destination, { recursive: true });
  await mkdir(cache, { recursive: true });
  const manifest = {};
  let originalBytes = 0;
  let displayBytes = 0;
  for (const directory of ['projects', 'case-studies', 'uploads']) {
    const folder = join(root, 'assets', directory);
    let files;
    try { files = await readdir(folder); } catch { continue; }
    for (const name of files) {
      if (!/\.(png|jpe?g|webp|avif)$/i.test(name)) continue;
      const buffer = await readFile(join(folder, name));
      const hash = createHash('sha256').update('webp-q88-v1').update(buffer).digest('hex').slice(0, 20);
      const metadata = await sharp(buffer).metadata();
      if (!metadata.width || !metadata.height || (metadata.pages || 1) > 1) continue;
      const variants = [];
      for (const width of [...new Set([320, 640, 960, 1440, 1920].map(size => Math.min(metadata.width, size)))]) {
        const filename = `${hash}-${width}.webp`;
        const cached = join(cache, filename);
        try { await access(cached); }
        catch { await sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 88, effort: 4 }).toFile(cached); }
        await cp(cached, join(destination, filename));
        variants.push({ width, path: 'assets/optimized/' + filename });
      }
      manifest[`assets/${directory}/${name}`] = { width: metadata.width, height: metadata.height, variants };
      originalBytes += buffer.length;
      const display = variants.find(item => item.width >= 960) || variants.at(-1);
      displayBytes += (await readFile(join(output, display.path))).length;
    }
  }
  await writeFile(join(output, 'image-manifest.js'), 'export const imageManifest = ' + JSON.stringify(manifest) + ';\n');
  await writeFile(join(root, 'build/image-report.json'), JSON.stringify({ images: Object.keys(manifest).length, originalBytes, display960Bytes: displayBytes, reduction: 1 - displayBytes / originalBytes }, null, 2));
  console.log(`Responsive images: ${Object.keys(manifest).length}; original ${(originalBytes / 1048576).toFixed(1)} MB → 960px WebP ${(displayBytes / 1048576).toFixed(2)} MB`);
}
