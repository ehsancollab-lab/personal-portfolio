import test from 'node:test';
import assert from 'node:assert/strict';
import { books, bookCategories, booksInCategory, aboutIntro } from '../library-content.js';

test('all 50 supplied books have distinct identities, researched metadata and brief original notes', () => {
  assert.equal(books.length, 50);
  assert.equal(new Set(books.map(book => book.id)).size, books.length);
  for (const book of books) {
    assert.match(book.id, /^[a-z0-9-]+$/);
    for (const field of ['title', 'titleFa', 'author', 'topics', 'summary', 'takeaway']) assert.ok(book[field]?.trim(), book.id + ': ' + field);
    assert.ok(book.summary.length >= 120 && book.summary.length <= 650, book.id);
    assert.ok(book.takeaway.length <= 200, book.id);
    assert.equal(new URL(book.source.url).protocol, 'https:');
    assert.match(book.source.label, /Persian/);
    assert.equal(book.cover, '', 'Sample covers were explicitly requested until image files arrive.');
  }
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
