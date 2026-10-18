import { normalizeStoryDoc, markdownDocument, safeStoryLink, videoEmbed } from './story-model.js';
import { responsiveImage } from './images.js';
export function renderStory(target, document, { body = '', resolveImage } = {}) {
  let doc;
  try { doc = normalizeStoryDoc(document) || markdownDocument(body); }
  catch { doc = markdownDocument(body); }
  function render(node) {
    if (node.type === 'text') {
      let element = globalThis.document.createTextNode(node.text);
      for (const mark of node.marks || []) {
        const tag = { bold: 'strong', italic: 'em', strike: 's', code: 'code', underline: 'u', link: 'a' }[mark.type];
        if (!tag) continue;
        const wrapper = globalThis.document.createElement(tag);
        if (tag === 'a' && safeStoryLink(mark.attrs?.href)) { wrapper.href = mark.attrs.href; if (/^https:/.test(wrapper.href)) { wrapper.target = '_blank'; wrapper.rel = 'noopener noreferrer'; } }
        wrapper.append(element);
        element = wrapper;
      }
      return element;
    }
    if (node.type === 'image') {
      const figure = globalThis.document.createElement('figure');
      figure.className = 'case-article-figure story-image-' + node.attrs.layout;
      if (node.attrs.src === 'evaluation.png') figure.classList.add('is-narrow');
      const image = globalThis.document.createElement('img');
      image.alt = node.attrs.alt;
      responsiveImage(image, resolveImage(node.attrs.src), { sizes: node.attrs.layout === 'normal' ? '(max-width: 740px) calc(100vw - 40px), 700px' : '(max-width: 1100px) calc(100vw - 40px), 1100px' });
      figure.append(image);
      if (node.attrs.caption) { const caption = globalThis.document.createElement('figcaption'); caption.textContent = node.attrs.caption; figure.append(caption); }
      return figure;
    }
    if (node.type === 'video') {
      const figure = globalThis.document.createElement('figure');
      figure.className = 'story-video';
      const iframe = globalThis.document.createElement('iframe');
      iframe.src = videoEmbed(node.attrs.src);
      iframe.loading = 'lazy'; iframe.title = 'Case study video'; iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
      figure.append(iframe); return figure;
    }
    const tags = { paragraph: 'p', heading: 'h' + node.attrs?.level, blockquote: 'blockquote', bulletList: 'ul', orderedList: 'ol', listItem: 'li', codeBlock: 'pre', horizontalRule: 'hr', hardBreak: 'br', doc: 'div' };
    const element = globalThis.document.createElement(tags[node.type] || 'div');
    if (node.type === 'orderedList' && node.attrs?.start > 1) element.start = node.attrs.start;
    const destination = node.type === 'codeBlock' ? globalThis.document.createElement('code') : element;
    if (node.type === 'codeBlock') element.append(destination);
    for (const child of node.content || []) destination.append(render(child));
    return element;
  }
  target.replaceChildren(...(doc.content || []).map(render));
}
