import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStoryDoc, markdownDocument, documentMarkdown, storyImages, videoEmbed } from '../story-model.js';
import { normalizePublishedContent, extractUploads } from '../server/dashboard-worker.mjs';
import { portfolioFixture } from './fixtures/portfolio.mjs';
const seed = portfolioFixture();
const text = value => ({ type: 'text', text: value });
test('existing case study Markdown migrates without losing paragraphs, headings, images, or lists', () => {
  const doc = normalizeStoryDoc(markdownDocument(seed.caseStudies[0].body));
  assert.ok(doc.content.some(node => node.type === 'heading'));
  assert.ok(doc.content.some(node => node.type === 'bulletList'));
  assert.ok(storyImages(doc).length > 5);
  assert.match(documentMarkdown(doc), /My Role and the Team/);
});
test('rich stories preserve marks, captions, alt text and media layout', () => {
  const doc = normalizeStoryDoc({ type: 'doc', content: [
    { type: 'paragraph', content: [{ ...text('Example'), marks: [{ type: 'bold' }, { type: 'italic' }, { type: 'link', attrs: { href: 'https://example.com' } }] }] },
    { type: 'image', attrs: { src: 'mohtavachi-cover.png', caption: 'Main dashboard', alt: 'Calendar screenshot', layout: 'wide' } }
  ] });
  assert.equal(doc.content[0].content[0].marks.length, 3);
  assert.equal(doc.content[1].attrs.layout, 'wide');
  assert.equal(normalizeStoryDoc(doc).content[1].attrs.caption, 'Main dashboard');
});
test('rich stories reject script URLs, HTML nodes, unsafe images and excessive depth', () => {
  for (const child of [{ type: 'script', text: 'alert(1)' }, { type: 'image', attrs: { src: '../secret.png' } }, { type: 'paragraph', content: [{ ...text('x'), marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }]) assert.throws(() => normalizeStoryDoc({ type: 'doc', content: [child] }));
  let child = { type: 'paragraph' }; for (let i = 0; i < 20; i++) child = { type: 'blockquote', content: [child] };
  assert.throws(() => normalizeStoryDoc({ type: 'doc', content: [child] }));
});
test('only recognized video hosts and validated video IDs can become iframe sources', () => {
  assert.equal(videoEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  assert.equal(videoEmbed('https://evil.example/embed/dQw4w9WgXcQ'), null);
  assert.equal(videoEmbed('javascript:alert(1)'), null);
});
test('body images and cover uploads are hashed and deduplicated in the same publication', async () => {
  const input = structuredClone(seed);
  const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X8J0AAAAASUVORK5CYII=';
  input.caseStudies[0].image = image;
  input.caseStudies[0].document = { type: 'doc', content: [{ type: 'image', attrs: { src: image, alt: 'Test', caption: 'Caption', layout: 'full' } }] };
  const result = await extractUploads(input);
  assert.equal(result.uploads.size, 1);
  assert.equal(result.content.caseStudies[0].image, result.content.caseStudies[0].document.content[0].attrs.src);
  assert.doesNotMatch(result.content.caseStudies[0].body, /data:image/);
  assert.match(result.content.caseStudies[0].body, /uploads\/[a-f0-9]{64}.png/);
  assert.equal(normalizePublishedContent(result.content).caseStudies[0].document.content[0].attrs.caption, 'Caption');
});

test('large rich stories cannot create a legacy body that breaks a later content read', async () => {
  const input = structuredClone(seed);
  input.caseStudies[0].document = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x'.repeat(200000), marks: [{ type: 'bold' }] }] }] };
  const result = await extractUploads(input);
  assert.equal(result.content.caseStudies[0].body.length, 200000);
  assert.equal(result.content.caseStudies[0].document.content[0].content[0].text.length, 200000);
  assert.doesNotThrow(() => normalizePublishedContent(result.content));
});

test('deleting all cards remains a valid publishable portfolio', () => {
  const input = structuredClone(seed);
  input.projects = []; input.caseStudies = []; input.experience = [];
  const output = normalizePublishedContent(input);
  assert.deepEqual(output.projects, []);
  assert.deepEqual(output.caseStudies, []);
});
