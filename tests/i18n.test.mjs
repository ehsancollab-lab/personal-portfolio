import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { localizeText, localizeBook, setLocale, getLocale, number, phrase } from '../i18n.js';
import { books, aboutIntro } from '../library-content.js';
import { faBooks } from '../books-fa.js';
import { faContent } from '../content-fa.js';
import { portfolioFixture } from './fixtures/portfolio.mjs';
import { markdownDocument } from '../story-model.js';

const current = JSON.parse(await readFile(new URL('../data/portfolio.json', import.meta.url), 'utf8'));
const storage = new Map();
globalThis.document = { documentElement: {} };
globalThis.localStorage = { setItem: (key, value) => storage.set(key, value) };

test('language updates the current document without persisting preferences or changing source content', () => {
  const original = JSON.stringify(current);
  setLocale('fa');
  assert.equal(getLocale(), 'fa');
  assert.equal(document.documentElement.dir, 'rtl');
  assert.equal(document.documentElement.lang, 'fa');
  assert.equal(storage.get('ehsan-portfolio-language'), undefined);
  assert.equal(localizeText('Download CV'), 'دریافت رزومه');
  assert.equal(number(50), '۵۰');
  assert.equal(phrase('{n} books', '{n} کتاب', { n: number(3) }), '۳ کتاب');
  assert.equal(localizeText('Future owner-authored copy'), 'Future owner-authored copy');
  setLocale('en');
  assert.equal(document.documentElement.dir, 'ltr');
  assert.equal(localizeText('Download CV'), 'Download CV');
  assert.equal(JSON.stringify(current), original);
});

test('all 50 books have complete Persian reading notes and one primary title per language', () => {
  assert.equal(Object.keys(faBooks).length, 50);
  for (const book of books) {
    setLocale('fa');
    const localized = localizeBook(book);
    assert.equal(localized.title, book.titleFa, book.id);
    for (const field of ['author', 'summary', 'takeaway']) assert.match(localized[field], /[آ-ی]/, book.id + ': ' + field);
    assert.match(localized.topics, /[آ-ی]/, book.id);
    assert.equal(localized.cover, book.cover);
    assert.equal(localized.id, book.id);
    setLocale('en');
    assert.equal(localizeBook(book), book);
  }
});

test('current portfolio and fallback content both have Persian profile, About, experience and case study copy', () => {
  const strings = [...aboutIntro];
  function walk(node) {
    if (node.type === 'text') strings.push(node.text);
    if (node.type === 'image') strings.push(node.attrs.alt, node.attrs.caption);
    (node.content || []).forEach(walk);
  }
  for (const data of [current, portfolioFixture()]) {
    strings.push(data.profile.greeting, data.profile.bio, data.profile.contactPrompt);
    for (const experience of data.experience) {
      strings.push(experience.role, experience.company, experience.dates);
      strings.push(...experience.description.split('\n').map(value => value.replace(/^\s*[-•]\s*/, '').trim()));
    }
    for (const item of data.caseStudies.filter(item => item.visible !== false)) {
      strings.push(item.title, item.summary);
      walk(item.document || markdownDocument(item.body));
    }
  }
  for (const value of new Set(strings.filter(Boolean))) assert.ok(faContent[value] || faContent[value.trim()], 'Missing Persian: ' + value);
});
