import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const site = 'http://localhost:4173';
// Only the two sound functions from the owner-supplied JavaScript, without its
// router, presence service or any other site code. Source hash is in assets/audio/README.md.
const reference = readFileSync(new URL('../fixtures/click-sound-reference.txt', import.meta.url), 'utf8');

test('synthesized samples match the supplied reference at 44.1/48kHz and different volumes and pans', async ({ page }) => {
  await page.goto(site + '/experience.html');
  const results = await page.evaluate(async reference => {
    const { createClickSound } = await import('/click-sound.js');
    const cases = [];
    function seededRandom() {
      let seed = 173;
      return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    }
    async function render(original, sampleRate, options) {
      const offline = new OfflineAudioContext(2, Math.ceil(sampleRate * .3), sampleRate);
      const proxy = new Proxy(offline, { get(target, key) {
        if (key === 'state') return 'running';
        if (key === 'currentTime') return .1;
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      } });
      function Context() { return proxy; }
      const random = Math.random;
      try {
        Math.random = seededRandom();
        const sound = original
          ? new Function('window', reference + '; return Fh;')({ AudioContext: Context, addEventListener() {}, removeEventListener() {} })
          : createClickSound(Context);
        sound(options);
      } finally { Math.random = random; }
      return offline.startRendering();
    }
    for (const sampleRate of [44100, 48000]) for (const options of [{ volume: 1, pan: 0 }, { volume: .5, pan: -.4 }, { volume: 1, pan: 2 }]) {
      const actual = await render(false, sampleRate, options), expected = await render(true, sampleRate, options);
      let difference = 0, peak = 0;
      for (let channel = 0; channel < 2; channel++) {
        const a = actual.getChannelData(channel), b = expected.getChannelData(channel);
        for (let index = 0; index < a.length; index++) {
          difference = Math.max(difference, Math.abs(a[index] - b[index]));
          peak = Math.max(peak, Math.abs(a[index]));
        }
      }
      cases.push({ sampleRate, ...options, difference, peak });
    }
    return cases;
  }, reference);
  await test.info().attach('reference-waveforms', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  expect(results).toHaveLength(6);
  for (const result of results) {
    expect(result.peak).toBeGreaterThan(.01);
    expect(result.peak).toBeLessThan(1);
    expect(result.difference).toBeLessThan(.0000001);
  }
});

test('one audio graph is reused and clicks within 30ms are suppressed', async ({ page }) => {
  await page.goto(site + '/experience.html');
  const result = await page.evaluate(async () => {
    const { createClickSound } = await import('/click-sound.js');
    const audio = new OfflineAudioContext(2, 24000, 48000);
    let at = .1, contexts = 0, tones = 0;
    const proxy = new Proxy(audio, { get(target, key) {
      if (key === 'state') return 'running';
      if (key === 'currentTime') return at;
      if (key === 'createOscillator') return () => { tones++; return target.createOscillator(); };
      const value = Reflect.get(target, key, target);
      return typeof value === 'function' ? value.bind(target) : value;
    } });
    function Context() { contexts++; return proxy; }
    const play = createClickSound(Context);
    const before = contexts;
    play(); play(); at = .12; play(); at = .131; play();
    await audio.startRendering();
    return { before, contexts, tones };
  });
  expect(result).toEqual({ before: 0, contexts: 1, tones: 2 });
});

test('missing or blocked Web Audio leaves navigation, language switching and click rings working', async ({ browser }) => {
  for (const mode of ['missing', 'blocked', 'resume-rejected', 'resume-still-suspended']) {
    const context = await browser.newContext();
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.addInitScript(mode => {
        if (mode === 'missing') { window.AudioContext = undefined; window.webkitAudioContext = undefined; }
        else if (mode === 'blocked') window.AudioContext = class { constructor() { throw new Error('Audio device unavailable'); } };
        else {
          const Native = window.AudioContext;
          window.AudioContext = class extends Native {
            get state() { return 'suspended'; }
            resume() { return mode === 'resume-still-suspended' ? Promise.resolve() : Promise.reject(new Error('Audio resume denied')); }
          };
        }
      }, mode);
      await page.goto(site + '/experience.html');
      await page.mouse.click(260, 180);
      await expect(page.locator('.click-ring')).toHaveCount(1);
      await expect(page.locator('.cursor-halo')).toHaveCount(0);
      await page.locator('[data-language="fa"]').click();
      await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
      await page.locator('.primary-nav [data-page-link="about"]').click();
      await expect(page.locator('body')).toHaveAttribute('data-page', 'about');
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  }
});
