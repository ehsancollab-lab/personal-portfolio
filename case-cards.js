import { responsiveImage } from './images.js';
export function caseCard(item, { resolveImage, href, controls, eager = false } = {}) {
  const card = document.createElement(controls ? 'article' : href ? 'a' : 'article');
  card.className = 'case-study-card';
  card.dataset.itemId = item.id;
  if (href) card.href = href;
  const media = document.createElement('div');
  media.className = 'case-study-card-media';
  const src = resolveImage?.(item.image);
  const image = document.createElement('img');
  image.alt = ''; image.draggable = false;
  if (src) responsiveImage(image, src, { sizes: '(max-width: 700px) calc(100vw - 40px), (max-width: 1100px) 45vw, 440px', eager, priority: eager });
  else { image.src = './assets/figma/profile.png'; image.width = 40; image.height = 40; media.classList.add('is-placeholder'); }
  media.append(image);
  if (controls) {
    card.tabIndex = 0;
    card.setAttribute('role', 'listitem');
    media.classList.add('case-study-card-editable');
    const actions = document.createElement('div');
    actions.className = 'project-tile-actions';
    actions.append(...controls);
    media.append(actions);
    if (item.visible === false) {
      const badge = document.createElement('span');
      badge.className = 'case-draft-badge';
      badge.textContent = 'Draft';
      media.append(badge);
    }
  }
  const text = document.createElement('div');
  text.className = 'case-study-card-copy';
  const title = document.createElement('h3');
  title.className = 'case-study-card-title';
  title.textContent = item.title || 'Untitled case study';
  const summary = document.createElement('p');
  summary.className = 'case-study-card-summary';
  summary.textContent = item.summary || '';
  text.append(title, summary);
  card.append(media, text);
  return card;
}
