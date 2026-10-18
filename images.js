import { imageManifest } from './image-manifest.js';
export function responsiveImage(image, source, { sizes = '(max-width: 700px) calc(100vw - 40px), 50vw', eager = false, priority = false } = {}) {
  const key = decodeURIComponent(String(source).replace(/^\.\//, '').split('?')[0]);
  const entry = imageManifest[key];
  image.decoding = 'async';
  image.loading = eager ? 'eager' : 'lazy';
  image.fetchPriority = priority ? 'high' : 'auto';
  if (entry) {
    image.width = entry.width;
    image.height = entry.height;
    image.srcset = entry.variants.map(item => `./${item.path} ${item.width}w`).join(', ');
    image.sizes = sizes;
    image.src = './' + (entry.variants.find(item => item.width >= 960) || entry.variants.at(-1)).path;
  } else if (source) image.src = source;
  return image;
}
