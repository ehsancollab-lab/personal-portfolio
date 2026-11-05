import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';

// Regression bounds for the requested visual direction, not cloud segmentation
// or a full accessibility audit. Sampling the middle 40% matches the text zone.
async function centerStats(name) {
  const { data, info } = await sharp(new URL('../assets/sky/' + name, import.meta.url).pathname).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let count = 0, luminance = 0, blueExcess = 0, bright = 0, visible = 0, high = 0;
  const linear = value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  for (let y = 0; y < info.height; y++) for (let x = Math.floor(info.width * .3); x < Math.floor(info.width * .7); x++) {
    const index = (y * info.width + x) * info.channels;
    const r = data[index] / 255, g = data[index + 1] / 255, b = data[index + 2] / 255;
    const light = linear(r) * .2126 + linear(g) * .7152 + linear(b) * .0722;
    count++; luminance += light; blueExcess += b - r;
    if (light > .75) bright++;
    if (light > .012) visible++;
    if (light > .12) high++;
  }
  return { width: info.width, height: info.height, mean: luminance / count, blueExcess: blueExcess / count, bright: bright / count, visible: visible / count, high: high / count };
}

test('day sky has a bright central text area with restrained blue', async () => {
  const stats = await centerStats('day-sky-cloudy.webp');
  assert.ok(stats.width >= 1500 && stats.height >= 900);
  assert.ok(stats.mean > .78);
  assert.ok(stats.blueExcess < .14);
  assert.ok(stats.bright > .55);
});

test('night sky has visible central cloud detail while keeping broad fields dark', async () => {
  const stats = await centerStats('night-sky-cloudy.webp');
  assert.ok(stats.width >= 1500 && stats.height >= 900);
  assert.ok(stats.visible > .3);
  assert.ok(stats.mean < .04);
  assert.ok(stats.high < .015);
});
