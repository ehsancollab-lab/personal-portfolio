import { aboutIntro, bookCategories, books, booksInCategory, categoryById, bookById } from './library-content.js';
import { responsiveImage } from './images.js';
import { getLocale, localizeText, localizeBook, number, phrase } from './i18n.js';

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = localizeText(text);
  return node;
};
const categoryURL = id => './books.html?category=' + encodeURIComponent(id);
const bookURL = id => './book.html?id=' + encodeURIComponent(id);
export const libraryPages = new Set(['about', 'books', 'book']);
const palettes = ['sand', 'sage', 'ink', 'rose', 'blue', 'ochre'];

function cover(book) {
  book = localizeBook(book);
  const wrapper = element('span', 'book-cover');
  wrapper.dataset.bookCover = book.id;
  if (book.cover) {
    const art = book.coverImage;
    const frame = art?.frame || [0, 0, art?.width || 7, art?.height || 10];
    const [left, top, width, height] = frame;
    wrapper.style.aspectRatio = width + ' / ' + height;
    wrapper.style.setProperty('--book-ratio', width / height);
    const viewport = element('span', 'book-cover-viewport');
    const image = element('img');
    const scale = art ? art.width / width : 1;
    responsiveImage(image, book.cover, { eager: true, sizes: `(max-width: 700px) ${Math.ceil(42 * scale)}vw, ${Math.ceil(285 * scale)}px` });
    image.alt = phrase('{title} — book cover', 'جلد کتاب {title}', { title: book.title });
    if (art) {
      image.style.width = art.width / width * 100 + '%';
      image.style.height = art.height / height * 100 + '%';
      image.style.left = -left / width * 100 + '%';
      image.style.top = -top / height * 100 + '%';
    }
    viewport.append(image); wrapper.append(viewport);
  } else {
    // A deliberate sample jacket, not an approximation of an actual edition.
    const sample = element('span', 'sample-cover');
    sample.dataset.palette = palettes[books.findIndex(item => item.id === book.id) % palettes.length];
    sample.setAttribute('role', 'img');
    sample.setAttribute('aria-label', phrase('Sample cover for {title}', 'جلد نمونهٔ کتاب {title}', { title: book.title }));
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
  const shortcut = element('kbd', 'back-shortcut', 'ESC'); shortcut.setAttribute('aria-hidden', 'true');
  link.append(shortcut); link.setAttribute('aria-keyshortcuts', 'Escape');
  return link;
}
function toolbar(main, href, text) {
  const bar = element('div', 'library-toolbar');
  const theme = element('button', 'theme-toggle library-theme-toggle');
  theme.type = 'button'; theme.setAttribute('aria-label', 'Switch to dark theme'); theme.setAttribute('aria-pressed', 'false');
  const icon = element('img'); icon.src = './assets/figma/theme-toggle.svg'; icon.width = 32; icon.height = 32; icon.alt = '';
  theme.append(icon); bar.append(backLink(href, text), theme); main.append(bar);
}
function categoryCard(category, index) {
  const items = booksInCategory(category.id);
  const link = element('a', 'book-collection-card'); link.href = categoryURL(category.id); link.dataset.categoryId = category.id;
  link.setAttribute('aria-label', phrase('{title}, {count} books', '{title}، {count} کتاب', { title: localizeText(category.title), count: number(items.length) }));
  const meta = element('div', 'collection-card-meta');
  meta.append(element('span', '', phrase('{n} / COLLECTION', 'مجموعهٔ {n}', { n: getLocale() === 'en' ? String(index + 1).padStart(2, '0') : number(index + 1) })), element('span', '', phrase('{count} books', '{count} کتاب', { count: number(items.length) })));
  const title = element('h3', 'collection-card-title', category.title); title.dataset.categoryTitle = category.id;
  const fan = element('span', 'book-fan');
  category.featured.map(bookById).forEach(book => fan.append(cover(book)));
  link.append(meta, title, element('p', 'collection-card-description', category.description), fan);
  return link;
}
function bookCard(book) {
  book = localizeBook(book);
  const link = element('a', 'library-book-card'); link.href = bookURL(book.id); link.dataset.bookId = book.id;
  link.setAttribute('aria-label', phrase('Read about {title}', 'دربارهٔ کتاب {title}', { title: book.title }));
  const image = element('span', 'library-book-image'); image.append(cover(book));
  const copy = element('span', 'library-book-copy');
  copy.append(element('h3', '', book.title), element('span', 'library-book-author', book.author));
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
  copy.append(title, element('p', '', phrase('{count} books. {categories} collections. A few ideas that stayed with me.', '{count} کتاب در {categories} دسته؛ چند ایده که با من مانده‌اند.', { count: number(books.length), categories: number(bookCategories.length) })));
  head.append(copy);
  const grid = element('div', 'book-collections');
  grid.append(...bookCategories.map(categoryCard));
  library.append(head, grid);
  if (books.some(book => !book.cover)) library.append(element('p', 'library-cover-note', 'Sample cover art. Original covers coming soon.'));
  main.append(intro, library);
  document.title = localizeText('About Me') + ' — ' + localizeText('Ehsan Masoomi');
  document.querySelector('meta[name="description"]').content = localizeText('A self-taught UI/UX designer, a little about life outside work, and the books Ehsan Masoomi has read.');
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
  const shelf = element('div', 'featured-book-shelf');
  shelf.setAttribute('aria-label', localizeText('Three books from this collection'));
  category.featured.map(bookById).forEach(book => {
    const link = element('a', 'shelf-book'); link.href = bookURL(book.id); link.dataset.bookId = book.id;
    link.setAttribute('aria-label', phrase('Read about {title}', 'دربارهٔ کتاب {title}', { title: localizeBook(book).title })); link.append(cover(book)); shelf.append(link);
  });
  panel.append(heading, shelf);
  const list = element('section', 'collection-book-list'); list.setAttribute('aria-label', localizeText('Books in this collection'));
  const items = booksInCategory(category.id);
  const count = element('p', 'library-result-count', phrase('Showing all {count} books', 'همهٔ {count} کتاب این دسته', { count: number(items.length) }));
  const grid = element('div', 'library-book-grid'); const cards = items.map(bookCard); grid.append(...cards);
  list.append(count, grid); main.append(panel, list);
  document.title = localizeText(category.title) + ' · ' + phrase('My Bookshelf', 'قفسهٔ کتاب‌های من') + ' — ' + localizeText('Ehsan Masoomi');
  document.querySelector('meta[name="description"]').content = phrase('{description} Books read by Ehsan Masoomi, with short summaries and personal takeaways.', '{description} کتاب‌هایی که احسان معصومی خوانده است، همراه با معرفی کوتاه و برداشت شخصی.', { description: localizeText(category.description) });
}
function notFound(main, title, description) {
  const empty = element('section', 'library-not-found'); empty.append(element('h1', '', title), element('p', '', description)); main.append(empty);
  document.title = localizeText(title) + ' — ' + localizeText('Ehsan Masoomi');
  document.querySelector('meta[name="description"]').content = localizeText(description);
}
function renderBook(main, params) {
  const raw = bookById(params.get('id'));
  const book = raw && localizeBook(raw);
  const category = book && categoryById(book.category);
  toolbar(main, category ? categoryURL(category.id) : './about.html#my-books', category ? phrase('Back to {category}', 'بازگشت به {category}', { category: localizeText(category.title) }) : localizeText('All collections'));
  if (!book) { notFound(main, 'Book not found', 'You can find the rest of my reading list in the collections.'); return; }
  main.dataset.bookId = book.id;
  const article = element('article', 'library-book-detail');
  const art = element('div', 'book-detail-art'); art.append(cover(book));
  const copy = element('div', 'book-detail-copy');
  const categoryLink = element('a', 'library-eyebrow', category.title); categoryLink.href = categoryURL(category.id); categoryLink.dataset.restoreScroll = '';
  const title = element('h1', '', book.title);
  const author = element('p', 'book-detail-author', phrase('By {author}', 'نویسنده: {author}', { author: book.author }));
  const summary = element('section', 'book-summary'); summary.setAttribute('aria-label', localizeText('About the book'));
  summary.append(element('h2', '', 'About the book'), element('p', '', book.summary));
  const takeaway = element('section', 'book-takeaway'); takeaway.setAttribute('aria-label', localizeText('My takeaway'));
  takeaway.append(element('h2', '', 'My takeaway'), element('blockquote', '', book.takeaway));
  const source = element('a', 'book-source', 'Book information in Persian');
  source.href = book.source.url; source.target = '_blank'; source.rel = 'noopener noreferrer';
  source.setAttribute('aria-label', phrase('Book information in Persian — {source} (opens in a new tab)', 'اطلاعات کتاب در منبع فارسی (در زبانهٔ جدید باز می‌شود)', { source: book.source.label }));
  copy.append(categoryLink, title, author, element('p', 'book-topics', book.topics), summary, takeaway, source);
  article.append(art, copy); main.append(article);
  document.title = book.title + ' · ' + phrase('My Bookshelf', 'قفسهٔ کتاب‌های من') + ' — ' + localizeText('Ehsan Masoomi');
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
