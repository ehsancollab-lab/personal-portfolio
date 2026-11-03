import { aboutIntro, bookCategories, books, booksInCategory, categoryById, bookById } from './library-content.js';
import { responsiveImage } from './images.js';

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};
const categoryURL = id => './books.html?category=' + encodeURIComponent(id);
const bookURL = id => './book.html?id=' + encodeURIComponent(id);
const normalized = value => String(value).normalize('NFKC').toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[\u064b-\u065f]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
export const libraryPages = new Set(['about', 'books', 'book']);
const palettes = ['sand', 'sage', 'ink', 'rose', 'blue', 'ochre'];

function cover(book) {
  const wrapper = element('span', 'book-cover');
  wrapper.dataset.bookCover = book.id;
  if (book.cover) {
    const image = element('img');
    responsiveImage(image, book.cover, { eager: true, sizes: '(max-width: 700px) 42vw, 260px' });
    image.alt = book.title + ' — book cover';
    wrapper.append(image);
  } else {
    // A deliberate sample jacket, not an approximation of an actual edition.
    const sample = element('span', 'sample-cover');
    sample.dataset.palette = palettes[books.indexOf(book) % palettes.length];
    sample.setAttribute('role', 'img');
    sample.setAttribute('aria-label', 'Sample cover for ' + book.title);
    sample.append(element('span', 'sample-cover-label', 'MY BOOKSHELF'), element('strong', 'sample-cover-title', book.title), element('span', 'sample-cover-author', book.author), element('span', 'sample-cover-note', 'Sample cover'));
    wrapper.append(sample);
  }
  return wrapper;
}
function backLink(href, text) {
  const link = element('a', 'library-back', text);
  link.href = href;
  link.dataset.restoreScroll = '';
  const icon = element('span', 'library-back-icon'); icon.setAttribute('aria-hidden', 'true');
  link.prepend(icon);
  return link;
}
function toolbar(main, href, text) {
  const bar = element('div', 'library-toolbar');
  const theme = element('button', 'theme-toggle library-theme-toggle');
  theme.type = 'button'; theme.setAttribute('aria-label', 'Switch to dark theme'); theme.setAttribute('aria-pressed', 'false');
  const icon = element('img'); icon.src = './assets/figma/theme-toggle.svg'; icon.width = 32; icon.height = 32; icon.alt = '';
  theme.append(icon); bar.append(backLink(href, text), theme); main.append(bar);
}
function search(label, placeholder) {
  const field = element('label', 'library-search');
  field.append(element('span', 'visually-hidden', label));
  const input = element('input'); input.type = 'search'; input.placeholder = placeholder; input.autocomplete = 'off';
  field.append(input);
  return { field, input };
}
function emptySearch(input) {
  const empty = element('div', 'library-empty');
  empty.hidden = true;
  const clear = element('button', 'library-clear', 'Clear search'); clear.type = 'button';
  clear.addEventListener('click', () => { input.value = ''; input.dispatchEvent(new Event('input')); input.focus(); });
  empty.append(element('p', '', 'No books match that search.'), clear);
  return empty;
}
function categoryCard(category, index) {
  const items = booksInCategory(category.id);
  const link = element('a', 'book-collection-card'); link.href = categoryURL(category.id); link.dataset.categoryId = category.id;
  link.setAttribute('aria-label', category.title + ', ' + items.length + ' books');
  const meta = element('div', 'collection-card-meta');
  meta.append(element('span', '', String(index + 1).padStart(2, '0') + ' / COLLECTION'), element('span', '', items.length + ' books'));
  const title = element('h3', 'collection-card-title', category.title); title.dataset.categoryTitle = category.id;
  const fan = element('span', 'book-fan');
  category.featured.map(bookById).forEach(book => fan.append(cover(book)));
  link.append(meta, title, element('p', 'collection-card-description', category.description), fan);
  return link;
}
function bookCard(book) {
  const link = element('a', 'library-book-card'); link.href = bookURL(book.id); link.dataset.bookId = book.id;
  link.setAttribute('aria-label', 'Read about ' + book.title);
  const image = element('span', 'library-book-image'); image.append(cover(book));
  const copy = element('span', 'library-book-copy');
  copy.append(element('h3', '', book.title), element('span', 'library-book-author', book.author));
  const persian = element('span', 'library-book-persian', book.titleFa); persian.lang = 'fa'; persian.dir = 'rtl'; copy.append(persian);
  link.append(image, copy);
  return link;
}
function renderAbout(main) {
  const intro = element('section', 'about-introduction'); intro.setAttribute('aria-labelledby', 'about-title');
  const heading = element('h2', '', 'A little about me'); heading.id = 'about-title'; intro.append(heading);
  aboutIntro.forEach(text => intro.append(element('p', '', text)));
  const library = element('section', 'about-library'); library.id = 'my-books'; library.setAttribute('aria-labelledby', 'bookshelf-title');
  const head = element('div', 'bookshelf-heading');
  const copy = element('div'); const title = element('h2', '', 'My bookshelf'); title.id = 'bookshelf-title';
  copy.append(title, element('p', '', books.length + ' books. ' + bookCategories.length + ' collections. A few ideas that stayed with me.'));
  head.append(copy);
  const { field, input } = search('Search my book collections', 'Search collections or books');
  const count = element('p', 'library-result-count', 'Showing all collections'); count.setAttribute('role', 'status');
  const grid = element('div', 'book-collections');
  const cards = bookCategories.map(categoryCard); grid.append(...cards);
  const empty = emptySearch(input);
  input.addEventListener('input', () => {
    const term = normalized(input.value);
    cards.forEach((card, index) => {
      const category = bookCategories[index];
      const haystack = [category.title, category.description, ...booksInCategory(category.id).flatMap(book => [book.title, book.titleFa, book.author])].join(' ');
      card.hidden = !normalized(haystack).includes(term);
    });
    const total = cards.filter(card => !card.hidden).length;
    count.textContent = term ? total + (total === 1 ? ' collection found' : ' collections found') : 'Showing all collections';
    empty.hidden = total > 0;
  });
  library.append(head, field, count, grid, empty, element('p', 'library-cover-note', 'Sample cover art. Original covers coming soon.'));
  main.append(intro, library);
  document.title = 'About Me — Ehsan Masoomi';
  document.querySelector('meta[name="description"]').content = 'A self-taught UI/UX designer, a little about life outside work, and the books Ehsan Masoomi has read.';
}
function renderCollection(main, params) {
  const category = categoryById(params.get('category'));
  toolbar(main, './about.html#my-books', 'All collections');
  if (!category) { notFound(main, 'Collection not found', 'Choose a collection from my bookshelf.'); return; }
  main.dataset.categoryId = category.id;
  const panel = element('section', 'collection-panel'); panel.dataset.categorySurface = category.id;
  const heading = element('div', 'collection-page-heading');
  heading.append(element('p', 'library-eyebrow', 'MY BOOKSHELF'));
  const title = element('h1', '', category.title); title.dataset.categoryTitle = category.id;
  heading.append(title, element('p', '', category.description));
  const { field, input } = search('Search ' + category.title, 'Search this collection');
  const shelf = element('div', 'featured-book-shelf');
  shelf.setAttribute('aria-label', 'Three books from this collection');
  category.featured.map(bookById).forEach(book => {
    const link = element('a', 'shelf-book'); link.href = bookURL(book.id); link.dataset.bookId = book.id;
    link.setAttribute('aria-label', 'Read about ' + book.title); link.append(cover(book)); shelf.append(link);
  });
  panel.append(heading, field, shelf);
  const list = element('section', 'collection-book-list'); list.setAttribute('aria-label', 'Books in this collection');
  const items = booksInCategory(category.id);
  const count = element('p', 'library-result-count', 'Showing all ' + items.length + ' books'); count.setAttribute('role', 'status');
  const grid = element('div', 'library-book-grid'); const cards = items.map(bookCard); grid.append(...cards);
  const empty = emptySearch(input);
  input.addEventListener('input', () => {
    const term = normalized(input.value);
    cards.forEach((card, i) => { const book = items[i]; card.hidden = !normalized([book.title, book.titleFa, book.author, book.topics].join(' ')).includes(term); });
    const total = cards.filter(card => !card.hidden).length;
    shelf.hidden = Boolean(term);
    count.textContent = term ? total + (total === 1 ? ' book found' : ' books found') : 'Showing all ' + items.length + ' books';
    empty.hidden = total > 0;
  });
  list.append(count, grid, empty); main.append(panel, list);
  document.title = category.title + ' · My Bookshelf — Ehsan Masoomi';
  document.querySelector('meta[name="description"]').content = category.description + ' Books read by Ehsan Masoomi, with short summaries and personal takeaways.';
}
function notFound(main, title, description) {
  const empty = element('section', 'library-not-found'); empty.append(element('h1', '', title), element('p', '', description)); main.append(empty);
  document.title = title + ' — Ehsan Masoomi';
}
function renderBook(main, params) {
  const book = bookById(params.get('id'));
  const category = book && categoryById(book.category);
  toolbar(main, category ? categoryURL(category.id) : './about.html#my-books', category ? 'Back to ' + category.title : 'All collections');
  if (!book) { notFound(main, 'Book not found', 'You can find the rest of my reading list in the collections.'); return; }
  main.dataset.bookId = book.id;
  const article = element('article', 'library-book-detail');
  const art = element('div', 'book-detail-art'); art.append(cover(book));
  const copy = element('div', 'book-detail-copy');
  const categoryLink = element('a', 'library-eyebrow', category.title); categoryLink.href = categoryURL(category.id); categoryLink.dataset.restoreScroll = '';
  const title = element('h1', '', book.title);
  const persian = element('p', 'book-detail-persian', book.titleFa); persian.lang = 'fa'; persian.dir = 'rtl';
  const author = element('p', 'book-detail-author', 'By ' + book.author);
  const summary = element('section', 'book-summary'); summary.setAttribute('aria-label', 'About the book');
  summary.append(element('h2', '', 'About the book'), element('p', '', book.summary));
  const takeaway = element('section', 'book-takeaway'); takeaway.setAttribute('aria-label', 'My takeaway');
  takeaway.append(element('h2', '', 'My takeaway'), element('blockquote', '', book.takeaway));
  const source = element('a', 'book-source', 'Book information in Persian');
  source.href = book.source.url; source.target = '_blank'; source.rel = 'noopener noreferrer';
  source.setAttribute('aria-label', 'Book information in Persian — ' + book.source.label + ' (opens in a new tab)');
  copy.append(categoryLink, title, persian, author, element('p', 'book-topics', book.topics), summary, takeaway, source);
  article.append(art, copy); main.append(article);
  document.title = book.title + ' · My Bookshelf — Ehsan Masoomi';
  document.querySelector('meta[name="description"]').content = book.summary;
}
export function renderLibrary(main, page, query = location.search) {
  main.replaceChildren();
  const params = new URLSearchParams(query);
  if (page === 'about') renderAbout(main);
  if (page === 'books') renderCollection(main, params);
  if (page === 'book') renderBook(main, params);
}

const bookCoverOrigins = new Map();
function transitionElements(oldURL, newURL, trigger) {
  const oldPage = document.body.dataset.page;
  const book = bookById(oldPage === 'book' ? oldURL.searchParams.get('id') : newURL.searchParams.get('id'));
  if (book && (oldPage === 'book' || /\/book(?:\.html)?\/?$/.test(newURL.pathname))) {
    const categoryCover = () => {
      const preferred = bookCoverOrigins.get(book.id) === 'shelf' ? '.featured-book-shelf' : '.library-book-grid';
      return document.querySelector(preferred + ' [data-book-cover="' + book.id + '"]')
        || document.querySelector('.featured-book-shelf [data-book-cover="' + book.id + '"]');
    };
    if (trigger?.closest('.shelf-book, .library-book-card')) bookCoverOrigins.set(book.id, trigger.closest('.shelf-book') ? 'shelf' : 'grid');
    const sourceCover = trigger?.querySelector('[data-book-cover]') || (oldPage === 'book'
      ? document.querySelector('.library-book-detail [data-book-cover]') : categoryCover());
    if (!sourceCover) return [];
    return [{ name: 'reading-cover', source: sourceCover, target: () => oldPage === 'book'
      ? categoryCover()
      : document.querySelector('.library-book-detail [data-book-cover]') }];
  }
  const category = categoryById(oldPage === 'books' ? oldURL.searchParams.get('category') : newURL.searchParams.get('category'));
  if (!category) return [];
  const opening = oldPage === 'about';
  const source = opening ? document.querySelector('.book-collection-card[data-category-id="' + category.id + '"]') : document.querySelector('.collection-panel');
  const target = () => opening ? document.querySelector('.collection-panel') : document.querySelector('.book-collection-card[data-category-id="' + category.id + '"]');
  const pairs = [
    { name: 'reading-surface', source, target },
    { name: 'reading-title', source: source?.querySelector('[data-category-title]'), target: () => target()?.querySelector('[data-category-title]') }
  ];
  category.featured.forEach((id, i) => pairs.push({ name: 'reading-cover-' + i, source: source?.querySelector('[data-book-cover="' + id + '"]'), target: () => target()?.querySelector('[data-book-cover="' + id + '"]') }));
  return pairs.filter(pair => pair.source);
}
let runningTransition;
const namedNodes = new Set();
const fallbackCleanups = new Set();
export function cancelLibraryTransition() {
  runningTransition?.skipTransition(); runningTransition = null;
  document.documentElement.classList.remove('library-transition');
  namedNodes.forEach(node => { node.style.viewTransitionName = ''; }); namedNodes.clear();
  [...fallbackCleanups].forEach(cleanup => cleanup());
}
export function transitionLibrary(oldURL, newURL, trigger, swap) {
  cancelLibraryTransition();
  const pairs = transitionElements(oldURL, newURL, trigger);
  if (!pairs.length || matchMedia('(prefers-reduced-motion: reduce)').matches) { swap(); return; }
  if (document.startViewTransition) {
    const root = document.documentElement;
    root.classList.add('library-transition');
    pairs.forEach(pair => { pair.source.style.viewTransitionName = pair.name; namedNodes.add(pair.source); });
    const transition = document.startViewTransition(() => {
      pairs.forEach(pair => { pair.source.style.viewTransitionName = ''; });
      if (swap() === false) return;
      pairs.forEach(pair => { const target = pair.target(); if (target) { target.style.viewTransitionName = pair.name; namedNodes.add(target); } });
    });
    runningTransition = transition;
    transition.ready.catch(() => {}); // Skipping a superseded transition rejects ready.
    transition.finished.catch(() => {}).finally(() => {
      if (runningTransition !== transition) return;
      runningTransition = null; root.classList.remove('library-transition');
      namedNodes.forEach(node => { node.style.viewTransitionName = ''; }); namedNodes.clear();
    });
  } else {
    // Shared-cover fallback for browsers without the View Transition API.
    const covers = pairs.filter(pair => pair.name.startsWith('reading-cover') && pair.source);
    const floating = covers.map(pair => {
      const bounds = pair.source.getBoundingClientRect();
      const clone = pair.source.cloneNode(true); clone.classList.add('book-transition-clone');
      clone.setAttribute('aria-hidden', 'true'); document.body.append(clone);
      return { pair, bounds, clone };
    });
    swap();
    floating.forEach(({ pair, bounds, clone }) => {
      const target = pair.target();
      if (!target) { clone.remove(); return; }
      const next = target.getBoundingClientRect();
      clone.style.width = next.width + 'px'; clone.style.height = next.height + 'px';
      target.style.visibility = 'hidden';
      const animation = clone.animate([
        { transform: `translate(${bounds.x}px, ${bounds.y}px) scale(${bounds.width / next.width}, ${bounds.height / next.height})` },
        { transform: `translate(${next.x}px, ${next.y}px) scale(1)` }
      ], { duration: 520, easing: 'cubic-bezier(.22,.75,.2,1)', fill: 'both' });
      const cleanup = () => { animation.cancel(); clone.remove(); target.style.visibility = ''; fallbackCleanups.delete(cleanup); };
      fallbackCleanups.add(cleanup);
      animation.finished.catch(() => {}).finally(cleanup);
    });
  }
}
