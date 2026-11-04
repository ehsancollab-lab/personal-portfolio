import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { books, bookCategories, booksInCategory, aboutIntro } from '../library-content.js';

test('all 50 supplied books have distinct identities, researched metadata, original covers and brief notes', async () => {
  assert.equal(books.length, 50);
  assert.equal(new Set(books.map(book => book.id)).size, books.length);
  for (const book of books) {
    assert.match(book.id, /^[a-z0-9-]+$/);
    for (const field of ['title', 'titleFa', 'author', 'topics', 'summary', 'takeaway']) assert.ok(book[field]?.trim(), book.id + ': ' + field);
    assert.ok(book.summary.length >= 120 && book.summary.length <= 650, book.id);
    assert.ok(book.takeaway.length <= 200, book.id);
    assert.equal(new URL(book.source.url).protocol, 'https:');
    assert.match(book.source.label, /Persian/);
    assert.equal(book.cover, 'assets/books/' + book.id + '.png');
    assert.equal(book.coverImage.src, book.cover);
    const [left, top, width, height] = book.coverImage.frame;
    assert.ok([left, top, width, height].every(Number.isInteger), book.id);
    assert.ok(left >= 0 && top >= 0 && width > 0 && height > 0, book.id);
    assert.ok(left + width <= book.coverImage.width && top + height <= book.coverImage.height, book.id);
  }
  const originals = await Promise.all(books.map(book => readFile(new URL('../' + book.cover, import.meta.url))));
  originals.forEach((buffer, index) => assert.equal(createHash('sha256').update(buffer).digest('hex'), books[index].coverImage.sha256, 'The uploaded source image is preserved: ' + books[index].id));
  assert.equal(new Set(books.map(book => book.coverImage.sha256)).size, 50);
});
test('the six collections account for every book and have three relevant, distinct representatives', () => {
  assert.equal(bookCategories.length, 6);
  assert.equal(bookCategories.flatMap(category => booksInCategory(category.id)).length, books.length);
  for (const category of bookCategories) {
    assert.equal(category.featured.length, 3);
    assert.equal(new Set(category.featured).size, 3);
    assert.ok(category.featured.every(id => booksInCategory(category.id).some(book => book.id === id)));
  }
});
test('the About introduction uses the owner-provided biography facts', () => {
  assert.match(aboutIntro.join(' '), /self-taught UI\/UX designer/i);
  assert.match(aboutIntro.join(' '), /married/);
  assert.match(aboutIntro.join(' '), /love reading/);
});

test('featured shelves match the owner-selected psychology, growth and design books', () => {
  const expected = {
    psychology: ['behave', 'why-nobody-told-me', 'self-compassion'],
    growth: ['thinking-fast-and-slow', 'think-again', 'twelve-rules-for-life'],
    design: ['visual-literacy', 'form-and-design', 'graphic-analysis']
  };
  for (const [id, featured] of Object.entries(expected)) assert.deepEqual(bookCategories.find(category => category.id === id).featured, featured);
});
