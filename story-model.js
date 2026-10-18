// Shared, data-only story schema. HTML from the editor is never stored or trusted.
export function safeStoryLink(value) {
  return typeof value === 'string' && /^(https:\/\/|mailto:|tel:|\/|\.\/|#)/i.test(value) && !/^\/\//.test(value) && !/[\u0000-\u001f]/.test(value);
}
export function storyImage(value) {
  return typeof value === 'string' && (value.length <= 900000 && /^data:image\/(png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value) || /^uploads\/[a-f0-9]{64}\.(png|jpg|webp|gif|avif)$/.test(value) || /^[A-Za-z0-9][A-Za-z0-9 _.-]{0,160}\.(png|jpe?g|webp|gif|avif)$/i.test(value) && !value.includes('..'));
}
export function videoEmbed(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    if (['www.youtube.com', 'youtube.com', 'youtu.be', 'www.youtube-nocookie.com'].includes(url.hostname)) {
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.split('/').pop();
      if (/^[A-Za-z0-9_-]{11}$/.test(id)) return 'https://www.youtube-nocookie.com/embed/' + id;
    }
    if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(url.hostname)) {
      const id = url.pathname.split('/').pop();
      if (/^\d{1,12}$/.test(id)) return 'https://player.vimeo.com/video/' + id;
    }
  } catch { /* Unsupported video URL. */ }
  return null;
}
export function normalizeStoryDoc(value) {
  if (value == null) return null;
  let count = 0;
  let characters = 0;
  const inline = new Set(['text', 'hardBreak']);
  const blocks = new Set(['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'listItem', 'codeBlock', 'horizontalRule', 'image', 'video']);
  function visit(node, depth = 0) {
    if (!node || typeof node !== 'object' || ++count > 5000 || depth > 16) throw new Error('invalid_story');
    const type = node.type;
    if (!(depth === 0 ? type === 'doc' : inline.has(type) || blocks.has(type))) throw new Error('invalid_story');
    const output = { type };
    if (type === 'text') {
      if (typeof node.text !== 'string' || (characters += node.text.length) > 200000) throw new Error('invalid_story');
      output.text = node.text;
      if (node.marks) {
        if (!Array.isArray(node.marks) || node.marks.length > 8) throw new Error('invalid_story');
        output.marks = node.marks.map(mark => {
          if (['bold', 'italic', 'strike', 'code', 'underline'].includes(mark.type)) return { type: mark.type };
          if (mark.type === 'link' && safeStoryLink(mark.attrs?.href) && mark.attrs.href.length <= 2048) return { type: 'link', attrs: { href: mark.attrs.href } };
          throw new Error('invalid_story');
        });
      }
    } else if (type === 'image') {
      const attrs = node.attrs || {};
      if (!storyImage(attrs.src)) throw new Error('invalid_story_image');
      const alt = String(attrs.alt || '');
      const caption = String(attrs.caption || '');
      if (alt.length > 1000 || caption.length > 2000) throw new Error('invalid_story');
      output.attrs = { src: attrs.src, alt, caption, layout: ['normal', 'wide', 'full'].includes(attrs.layout) ? attrs.layout : 'normal' };
    } else if (type === 'video') {
      const src = videoEmbed(node.attrs?.src);
      if (!src) throw new Error('invalid_story_video');
      output.attrs = { src };
    } else {
      if (type === 'heading') output.attrs = { level: [2, 3, 4].includes(node.attrs?.level) ? node.attrs.level : 2 };
      if (type === 'orderedList') output.attrs = { start: Math.max(1, Math.min(9999, Number(node.attrs?.start) || 1)) };
      if (type === 'codeBlock') output.attrs = { language: null };
      if (node.content) {
        if (!Array.isArray(node.content)) throw new Error('invalid_story');
        output.content = node.content.map(child => visit(child, depth + 1));
        const allowed = type === 'doc' || type === 'blockquote' || type === 'listItem' ? blocks : type === 'bulletList' || type === 'orderedList' ? new Set(['listItem']) : inline;
        if (output.content.some(child => !allowed.has(child.type))) throw new Error('invalid_story');
      }
    }
    return output;
  }
  return visit(value);
}
export function inlineDocument(value) {
  const parts = String(value).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map(text => text.startsWith('**') && text.endsWith('**') ? { type: 'text', text: text.slice(2, -2), marks: [{ type: 'bold' }] } : { type: 'text', text });
}
export function markdownDocument(source = '') {
  const content = [];
  let paragraph = [];
  let list;
  const flush = () => { if (paragraph.length) content.push({ type: 'paragraph', content: inlineDocument(paragraph.join(' ')) }); paragraph = []; list = null; };
  for (const line of String(source).replace(/\r/g, '').split('\n')) {
    const value = line.trim();
    const heading = value.match(/^(#{2,4})\s+(.+)/);
    const image = value.match(/^!\[(.*?)\]\(([^)]+)\)$/);
    const bullet = value.match(/^[-•]\s+(.+)/);
    if (!value) { flush(); continue; }
    if (heading) { flush(); content.push({ type: 'heading', attrs: { level: heading[1].length }, content: inlineDocument(heading[2]) }); }
    else if (image && storyImage(image[2])) { flush(); content.push({ type: 'image', attrs: { src: image[2], alt: image[1], caption: image[1], layout: 'wide' } }); }
    else if (bullet) {
      if (!list) { flush(); list = { type: 'bulletList', content: [] }; content.push(list); }
      list.content.push({ type: 'listItem', content: [{ type: 'paragraph', content: inlineDocument(bullet[1]) }] });
    } else { if (list) flush(); paragraph.push(value); }
  }
  flush();
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}
export function documentMarkdown(doc) {
  function block(node) {
    if (node.type === 'text') {
      let value = node.text;
      for (const mark of node.marks || []) { if (mark.type === 'bold') value = '**' + value + '**'; }
      return value;
    }
    if (node.type === 'hardBreak') return '\n';
    if (node.type === 'image') return node.attrs.src.startsWith('data:') ? '' : `![${node.attrs.caption || node.attrs.alt || ''}](${node.attrs.src})`;
    if (node.type === 'video') return node.attrs.src;
    if (node.type === 'horizontalRule') return '---';
    const children = (node.content || []).map(block);
    if (node.type === 'heading') return '#'.repeat(node.attrs.level) + ' ' + children.join('');
    if (node.type === 'bulletList' || node.type === 'orderedList') return children.map((text, index) => (node.type === 'bulletList' ? '- ' : `${index + 1}. `) + text).join('\n');
    return children.join(['doc', 'blockquote', 'listItem'].includes(node.type) ? '\n\n' : '');
  }
  return block(doc);
}
export function storyText(doc) {
  return doc?.type === 'text' ? doc.text : (doc?.content || []).map(storyText).join(doc?.type === 'paragraph' ? '' : ' ');
}
export function storyImages(doc) {
  return doc?.type === 'image' ? [doc] : (doc?.content || []).flatMap(storyImages);
}
