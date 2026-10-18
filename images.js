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
  } else {
    // Replacing an optimized image must also replace its responsive candidates.
    // Otherwise the browser keeps choosing the previous srcset over the new src.
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.removeAttribute('width');
    image.removeAttribute('height');
    if (source) image.src = source;
    else image.removeAttribute('src');
  }
  return image;
}
