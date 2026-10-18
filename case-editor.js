import { Editor, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import { normalizeStoryDoc, markdownDocument, documentMarkdown, storyText, storyImages, safeStoryLink, videoEmbed } from './story-model.js';
import { renderStory } from './story-render.js';
import { responsiveImage } from './images.js';

const node = (tag, className, text) => { const element = document.createElement(tag); if (className) element.className = className; if (text != null) element.textContent = text; return element; };
function iconButton(name, label, className = '') {
  const button = node('button', 'story-tool ' + className);
  button.type = 'button'; button.title = label; button.setAttribute('aria-label', label);
  const icon = node('span', 'story-icon');
  icon.style.setProperty('--story-icon', `url('./assets/dashboard/icons/${name}.svg')`);
  icon.setAttribute('aria-hidden', 'true'); button.append(icon);
  return button;
}
function labeledInput(label, value, { multiline = false, placeholder = '' } = {}) {
  const wrapper = node('label', 'story-field');
  wrapper.append(node('span', '', label));
  const input = node(multiline ? 'textarea' : 'input');
  input.value = value || ''; input.placeholder = placeholder;
  if (!multiline) input.type = 'text';
  wrapper.append(input);
  return { wrapper, input };
}
export function openCaseEditor({ item, isNew, resolveImage, imageOptions = [], imageFileToDataUrl, storage, onSave, onClose }) {
  let model = structuredClone(item);
  const draftKey = 'ehsan-story-editor-draft:' + (isNew ? 'new' : item.id);
  let recovered = false;
  try { const previous = JSON.parse(storage.getItem(draftKey) || 'null'); if (previous?.title !== undefined && previous.document) { model = { ...model, ...previous, id: item.id }; recovered = true; } } catch { /* Invalid local drafts never replace content. */ }
  let dirty = recovered;
  let busy = false;
  let pendingImages = 0;
  let timer;
  let editor;
  let selectedRange;
  let insertAt;
  let imageTarget = 'body';
  let replacingImage = null;
  const dialog = node('dialog', 'story-composer');
  dialog.setAttribute('aria-label', isNew ? 'New case study' : 'Edit case study');
  const header = node('header', 'story-composer-header');
  const back = iconButton('chevron-left', 'Back to case studies');
  const heading = node('div', 'story-composer-heading');
  heading.append(node('strong', '', 'Case study'));
  const draftStatus = node('span', 'story-draft-status', recovered ? 'Recovered unsaved draft' : 'Draft');
  draftStatus.setAttribute('role', 'status'); heading.append(draftStatus);
  const tools = node('div', 'story-header-tools');
  const undo = iconButton('undo-2', 'Undo (Ctrl+Z)');
  const redo = iconButton('redo-2', 'Redo (Ctrl+Shift+Z)');
  const preview = iconButton('eye', 'Preview case study');
  const settings = iconButton('settings-2', 'Story settings');
  const saveDraft = node('button', 'story-draft-button', 'Save draft'); saveDraft.type = 'button';
  const publish = node('button', 'story-publish-button', isNew || model.visible === false ? 'Publish' : 'Save changes'); publish.type = 'button';
  saveDraft.hidden = !isNew && item.visible !== false;
  tools.append(undo, redo, preview, settings, saveDraft, publish);
  header.append(back, heading, tools);
  const message = node('div', 'story-editor-message'); message.hidden = true; message.setAttribute('role', 'status');
  const canvas = node('div', 'story-writing-canvas');
  const title = node('textarea', 'story-title'); title.placeholder = 'Title'; title.setAttribute('aria-label', 'Case study title'); title.rows = 1; title.maxLength = 500; title.value = model.title || '';
  const editorHost = node('div', 'story-editor-content');
  const previewHost = node('div', 'story-preview case-article-body'); previewHost.hidden = true;
  canvas.append(title, editorHost, previewHost);
  const footer = node('p', 'story-word-count');
  const addBlock = iconButton('plus', 'Add a block', 'story-add-block');
  addBlock.setAttribute('aria-expanded', 'false');
  const blockMenu = node('div', 'story-block-menu'); blockMenu.hidden = true; blockMenu.setAttribute('role', 'group'); blockMenu.setAttribute('aria-label', 'Insert a block');
  const imageButton = iconButton('image', 'Upload image');
  const libraryButton = iconButton('columns-2', 'Choose existing image');
  const videoButton = iconButton('video', 'Embed a video');
  const codeButton = iconButton('code-xml', 'Insert code block');
  const dividerButton = iconButton('minus', 'Insert divider');
  blockMenu.append(imageButton, libraryButton, videoButton, codeButton, dividerButton);
  const fileInput = node('input'); fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.multiple = true; fileInput.hidden = true; fileInput.id = 'story-image-file';
  const bubble = node('div', 'story-format-menu'); bubble.setAttribute('role', 'toolbar'); bubble.setAttribute('aria-label', 'Text formatting');
  const formatButtons = [];
  for (const [icon, label, command, argument, active] of [
    ['bold', 'Bold (Ctrl+B)', 'toggleBold', undefined, 'bold'], ['italic', 'Italic (Ctrl+I)', 'toggleItalic', undefined, 'italic'],
    ['link', 'Add or edit link (Ctrl+K)', 'link', undefined, 'link'], ['heading-1', 'Large heading', 'toggleHeading', { level: 2 }, 'heading2'],
    ['heading-2', 'Small heading', 'toggleHeading', { level: 3 }, 'heading3'], ['quote', 'Quote', 'toggleBlockquote', undefined, 'blockquote'],
    ['list', 'Bullet list', 'toggleBulletList', undefined, 'bulletList'], ['list-ordered', 'Numbered list', 'toggleOrderedList', undefined, 'orderedList']
  ]) {
    const button = iconButton(icon, label);
    button.addEventListener('mousedown', event => event.preventDefault());
    button.addEventListener('click', () => { if (command === 'link') openLink(); else editor.chain().focus()[command](argument).run(); });
    formatButtons.push({ button, active }); bubble.append(button);
  }
  const linkPanel = node('form', 'story-inline-panel'); linkPanel.hidden = true;
  const linkField = labeledInput('Link URL', '', { placeholder: 'https://…' });
  const linkApply = node('button', 'story-panel-apply', 'Apply'); linkApply.type = 'submit';
  const linkRemove = node('button', 'story-panel-secondary', 'Remove link'); linkRemove.type = 'button';
  const linkCancel = iconButton('x', 'Close link editor');
  linkPanel.append(linkField.wrapper, linkApply, linkRemove, linkCancel);
  const mediaPanel = node('form', 'story-media-panel'); mediaPanel.hidden = true;
  const videoField = labeledInput('YouTube or Vimeo URL', '', { placeholder: 'https://www.youtube.com/watch?v=…' });
  const videoAdd = node('button', 'story-panel-apply', 'Insert video'); videoAdd.type = 'submit';
  const videoCancel = iconButton('x', 'Close video editor'); mediaPanel.append(videoField.wrapper, videoAdd, videoCancel);
  const library = node('div', 'story-library'); library.hidden = true;
  const libraryLabel = node('strong', '', 'Choose an image'); const libraryClose = iconButton('x', 'Close image library');
  library.append(libraryLabel, libraryClose);
  const librarySelect = node('select'); librarySelect.setAttribute('aria-label', 'Existing portfolio images');
  for (const option of imageOptions) { const element = node('option', '', option.label); element.value = option.value; librarySelect.append(element); }
  const libraryInsert = node('button', 'story-panel-apply', 'Use image'); libraryInsert.type = 'button'; library.append(librarySelect, libraryInsert);
  const panel = node('aside', 'story-settings'); panel.hidden = true; panel.setAttribute('aria-label', 'Story settings');
  const panelHeader = node('div', 'story-settings-header'); const panelTitle = node('h2', '', 'Story settings'); const closeSettings = iconButton('x', 'Close story settings'); panelHeader.append(panelTitle, closeSettings);
  const summary = labeledInput('Card description', model.summary, { multiline: true, placeholder: 'A short introduction shown below your case study card.' }); summary.input.maxLength = 5000;
  const projectLink = labeledInput('Project link (optional)', model.href, { placeholder: 'https://…' });
  const coverLabel = node('span', 'story-field-label', 'Cover image'); const cover = node('div', 'story-cover');
  const coverImage = node('img'); coverImage.alt = 'Case study cover preview'; coverImage.hidden = !model.image;
  if (model.image) responsiveImage(coverImage, resolveImage(model.image), { eager: true, sizes: '320px' });
  const coverButton = node('button', 'story-panel-secondary', model.image ? 'Replace cover' : 'Upload cover'); coverButton.type = 'button';
  const coverExisting = node('button', 'story-panel-secondary', 'Choose existing'); coverExisting.type = 'button'; cover.append(coverImage, coverButton, coverExisting);
  const visibility = node('label', 'story-visibility'); const visible = node('input'); visible.type = 'checkbox'; visible.checked = model.visible !== false; visibility.append(visible, node('span', '', 'Visible on portfolio'));
  const panelSave = node('button', 'story-publish-button', 'Save changes'); panelSave.type = 'button';
  panel.append(panelHeader, coverLabel, cover, summary.wrapper, projectLink.wrapper, visibility, panelSave);
  dialog.append(header, message, canvas, footer, addBlock, blockMenu, fileInput, bubble, linkPanel, mediaPanel, library, panel);
  document.body.append(dialog);
  dialog.showModal(); document.body.classList.add('story-editor-open');
  function notify(text, error = false) { message.textContent = text; message.hidden = false; message.classList.toggle('is-error', error); }
  function resizeTitle() { title.style.height = 'auto'; title.style.height = title.scrollHeight + 'px'; }
  function contentModel() {
    const document = normalizeStoryDoc(editor.getJSON());
    return { ...model, title: title.value.trim(), summary: summary.input.value.trim(), href: projectLink.input.value.trim(), visible: visible.checked, document, body: documentMarkdown(document) };
  }
  function localSave() {
    if (!editor || busy) return;
    dirty = true;
    draftStatus.textContent = 'Saving draft…';
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { storage.setItem(draftKey, JSON.stringify(contentModel())); draftStatus.textContent = 'Draft saved on this device'; }
      catch { draftStatus.textContent = 'Draft could not be saved on this device'; }
    }, 400);
  }
  function closeBlockMenu() { blockMenu.hidden = true; addBlock.setAttribute('aria-expanded', 'false'); }
  function placeAddButton() {
    if (!editor || previewHost.hidden === false || busy) { addBlock.hidden = true; closeBlockMenu(); return; }
    const { $from, empty } = editor.state.selection;
    const show = empty && $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0;
    addBlock.hidden = !show;
    if (!show) { closeBlockMenu(); return; }
    try {
      const coordinates = editor.view.coordsAtPos($from.pos);
      const bounds = editorHost.getBoundingClientRect();
      addBlock.style.top = coordinates.top - 2 + 'px';
      addBlock.style.left = Math.max(12, bounds.left - 49) + 'px';
      blockMenu.style.top = coordinates.top - 4 + 'px';
      blockMenu.style.left = Math.max(52, bounds.left - 8) + 'px';
      if (coordinates.top < 78 || coordinates.top > innerHeight - 45) addBlock.hidden = true;
    } catch { addBlock.hidden = true; }
  }
  function updateTools() {
    undo.disabled = !editor.can().undo(); redo.disabled = !editor.can().redo();
    for (const { button, active } of formatButtons) {
      const selected = active === 'heading2' ? editor.isActive('heading', { level: 2 }) : active === 'heading3' ? editor.isActive('heading', { level: 3 }) : editor.isActive(active);
      button.setAttribute('aria-pressed', String(selected));
    }
    const count = storyText(editor.getJSON()).trim().split(/\s+/).filter(Boolean).length;
    footer.textContent = count + (count === 1 ? ' word' : ' words') + ' · ' + Math.max(1, Math.ceil(count / 200)) + ' min read';
    placeAddButton();
  }
  const StoryImage = Image.extend({
    addAttributes() { return { ...this.parent?.(), caption: { default: '' }, layout: { default: 'normal' } }; },
    addNodeView() {
      return ({ node: initialNode, getPos }) => {
        let current = initialNode;
        const figure = node('figure', 'story-editor-image');
        const image = node('img'); image.draggable = false;
        const caption = node('input', 'story-image-caption'); caption.type = 'text'; caption.placeholder = 'Type caption for image (optional)'; caption.setAttribute('aria-label', 'Image caption'); caption.maxLength = 2000;
        const controls = node('div', 'story-image-tools');
        for (const [name, label, layout] of [['align-center', 'Standard image width', 'normal'], ['columns-2', 'Wide image', 'wide'], ['expand', 'Full width image', 'full']]) {
          const button = iconButton(name, label);
          button.addEventListener('click', () => editor.chain().focus().setNodeSelection(getPos()).updateAttributes('image', { layout }).run()); controls.append(button);
        }
        const alt = node('input', 'story-image-alt'); alt.type = 'text'; alt.placeholder = 'Describe this image'; alt.setAttribute('aria-label', 'Image alt text'); alt.maxLength = 1000; alt.hidden = true;
        const altButton = node('button', 'story-alt-button', 'Alt text'); altButton.type = 'button'; altButton.addEventListener('click', () => { alt.hidden = !alt.hidden; if (!alt.hidden) alt.focus(); });
        const replace = iconButton('image', 'Replace image'); replace.addEventListener('click', () => { replacingImage = getPos(); imageTarget = 'body'; fileInput.multiple = false; fileInput.click(); });
        const remove = iconButton('trash-2', 'Delete image'); remove.addEventListener('click', () => editor.chain().focus().setNodeSelection(getPos()).deleteSelection().run());
        controls.append(altButton, replace, remove);
        figure.append(controls, image, caption, alt);
        function refresh() { figure.dataset.layout = current.attrs.layout; responsiveImage(image, resolveImage(current.attrs.src), { eager: true, sizes: '900px' }); image.alt = current.attrs.alt || ''; caption.value = current.attrs.caption || ''; alt.value = current.attrs.alt || ''; }
        image.addEventListener('click', () => editor.chain().focus().setNodeSelection(getPos()).run());
        caption.addEventListener('input', () => editor.commands.command(({ tr }) => { tr.setNodeMarkup(getPos(), undefined, { ...current.attrs, caption: caption.value }); return true; }));
        alt.addEventListener('input', () => editor.commands.command(({ tr }) => { tr.setNodeMarkup(getPos(), undefined, { ...current.attrs, alt: alt.value }); return true; }));
        refresh();
        return { dom: figure, update(next) { if (next.type.name !== 'image') return false; current = next; refresh(); return true; }, stopEvent: event => Boolean(event.target.closest('input,button')), ignoreMutation: () => true };
      };
    }
  });
  const Video = Node.create({ name: 'video', group: 'block', atom: true, draggable: true, addAttributes: () => ({ src: { default: '' } }), parseHTML: () => [{ tag: 'div[data-story-video]' }], renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-story-video': '' })], addNodeView: () => ({ node: videoNode }) => {
    const wrapper = node('figure', 'story-editor-video'); const label = node('a', '', 'Video: ' + videoNode.attrs.src); label.href = videoNode.attrs.src; label.target = '_blank'; label.rel = 'noopener noreferrer';
    const iframe = node('iframe'); iframe.src = videoEmbed(videoNode.attrs.src); iframe.title = 'Video preview'; iframe.allowFullscreen = true; iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation'); wrapper.append(iframe, label); return { dom: wrapper };
  } });
  editor = new Editor({
    element: editorHost,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] } }), StoryImage.configure({ allowBase64: true }), Video, Link.configure({ openOnClick: false, autolink: true, validate: safeStoryLink }), Placeholder.configure({ placeholder: 'Tell your story…' }), BubbleMenu.configure({ element: bubble, tippyOptions: { duration: 100, appendTo: () => dialog } })],
    content: model.document || markdownDocument(model.body),
    editorProps: {
      attributes: { 'aria-label': 'Case study story', role: 'textbox', 'aria-multiline': 'true', spellcheck: 'true' },
      handlePaste(view, event) { const files = [...(event.clipboardData?.files || [])].filter(file => file.type.startsWith('image/')); if (!files.length) return false; void insertFiles(files); return true; },
      handleDrop(view, event) { const files = [...(event.dataTransfer?.files || [])].filter(file => file.type.startsWith('image/')); if (!files.length) return false; event.preventDefault(); insertAt = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos; void insertFiles(files); return true; },
      handleKeyDown(view, event) { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openLink(); return true; } return false; }
    },
    onUpdate: () => { localSave(); updateTools(); }, onSelectionUpdate: () => updateTools(), onTransaction: () => { if (editor) updateTools(); }
  });
  function openLink() {
    selectedRange = { from: editor.state.selection.from, to: editor.state.selection.to };
    linkField.input.value = editor.getAttributes('link').href || '';
    linkPanel.hidden = false; linkField.input.focus();
  }
  linkPanel.addEventListener('submit', event => { event.preventDefault(); const value = linkField.input.value.trim(); if (!safeStoryLink(value)) { linkField.input.setCustomValidity('Enter a valid https, email, or relative link.'); linkField.input.reportValidity(); return; } editor.chain().focus().setTextSelection(selectedRange).extendMarkRange('link').setLink({ href: value }).run(); linkPanel.hidden = true; });
  linkField.input.addEventListener('input', () => linkField.input.setCustomValidity(''));
  linkRemove.addEventListener('click', () => { editor.chain().focus().setTextSelection(selectedRange).extendMarkRange('link').unsetLink().run(); linkPanel.hidden = true; });
  linkCancel.addEventListener('click', () => { linkPanel.hidden = true; editor.commands.focus(); });
  undo.addEventListener('click', () => editor.chain().focus().undo().run()); redo.addEventListener('click', () => editor.chain().focus().redo().run());
  addBlock.addEventListener('mousedown', event => event.preventDefault());
  addBlock.addEventListener('click', () => { insertAt = editor.state.selection.from; blockMenu.hidden = !blockMenu.hidden; addBlock.setAttribute('aria-expanded', String(!blockMenu.hidden)); });
  function insertionContent(content) { const chain = editor.chain().focus(); if (Number.isInteger(insertAt)) chain.setTextSelection(Math.min(insertAt, editor.state.doc.content.size)); chain.insertContent(content).run(); insertAt = null; closeBlockMenu(); }
  imageButton.addEventListener('click', () => { imageTarget = 'body'; replacingImage = null; fileInput.multiple = true; fileInput.click(); });
  libraryButton.addEventListener('click', () => { imageTarget = 'body'; library.hidden = false; closeBlockMenu(); });
  libraryClose.addEventListener('click', () => { imageTarget = 'body'; library.hidden = true; editor.commands.focus(); });
  libraryInsert.addEventListener('click', () => { if (!librarySelect.value) return; if (imageTarget === 'cover') setCover(librarySelect.value); else insertionContent([{ type: 'image', attrs: { src: librarySelect.value, alt: '', caption: '', layout: 'normal' } }, { type: 'paragraph' }]); library.hidden = true; });
  videoButton.addEventListener('click', () => { mediaPanel.hidden = false; closeBlockMenu(); videoField.input.focus(); });
  videoCancel.addEventListener('click', () => { mediaPanel.hidden = true; editor.commands.focus(); });
  mediaPanel.addEventListener('submit', event => { event.preventDefault(); const src = videoEmbed(videoField.input.value.trim()); if (!src) { videoField.input.setCustomValidity('Use a valid YouTube or Vimeo video URL.'); videoField.input.reportValidity(); return; } insertionContent([{ type: 'video', attrs: { src } }, { type: 'paragraph' }]); mediaPanel.hidden = true; videoField.input.value = ''; });
  videoField.input.addEventListener('input', () => videoField.input.setCustomValidity(''));
  codeButton.addEventListener('click', () => { editor.chain().focus().setCodeBlock().run(); closeBlockMenu(); });
  dividerButton.addEventListener('click', () => insertionContent([{ type: 'horizontalRule' }, { type: 'paragraph' }]));
  function setCover(src) { model.image = src; responsiveImage(coverImage, resolveImage(src), { eager: true, sizes: '320px' }); coverImage.hidden = false; coverButton.textContent = 'Replace cover'; localSave(); }
  async function insertFiles(files) {
    if (busy) return;
    pendingImages++;
    try {
      draftStatus.textContent = 'Preparing image…';
      const images = [];
      for (const file of files.slice(0, imageTarget === 'cover' || replacingImage !== null ? 1 : 20)) images.push(await imageFileToDataUrl(file));
      if (imageTarget === 'cover') setCover(images[0]);
      else if (replacingImage !== null) { editor.chain().focus().setNodeSelection(replacingImage).updateAttributes('image', { src: images[0] }).run(); replacingImage = null; }
      else insertionContent([...images.flatMap(src => [{ type: 'image', attrs: { src, alt: '', caption: '', layout: 'normal' } }, { type: 'paragraph' }])]);
      if (!model.image && images.length) setCover(images[0]);
    } catch { notify('This image could not be read. Choose a PNG, JPEG, WebP, or GIF image.', true); }
    finally { pendingImages--; imageTarget = 'body'; localSave(); }
  }
  fileInput.addEventListener('cancel', () => { imageTarget = 'body'; replacingImage = null; });
  fileInput.addEventListener('change', () => { const files = [...fileInput.files]; fileInput.value = ''; if (files.length) void insertFiles(files); });
  coverButton.addEventListener('click', () => { imageTarget = 'cover'; replacingImage = null; fileInput.multiple = false; fileInput.click(); });
  coverExisting.addEventListener('click', () => { imageTarget = 'cover'; library.hidden = false; });
  settings.addEventListener('click', () => { panel.hidden = !panel.hidden; panelSave.textContent = 'Save changes'; });
  closeSettings.addEventListener('click', () => { panel.hidden = true; });
  preview.addEventListener('click', () => { const show = previewHost.hidden; if (show) { const current = contentModel(); renderStory(previewHost, current.document, { resolveImage }); } previewHost.hidden = !show; editorHost.hidden = show; title.readOnly = show; preview.setAttribute('aria-pressed', String(show)); preview.title = show ? 'Back to writing' : 'Preview case study'; preview.setAttribute('aria-label', preview.title); placeAddButton(); });
  title.addEventListener('input', () => { resizeTitle(); localSave(); });
  for (const input of [summary.input, projectLink.input, visible]) input.addEventListener('input', localSave);
  async function save(makeVisible) {
    if (busy) return;
    if (pendingImages) { notify('Wait for your image to finish preparing.'); return; }
    const next = contentModel();
    if (!next.title) { notify('Add a title before saving this case study.', true); title.focus(); return; }
    if (next.href && !safeStoryLink(next.href)) { panel.hidden = false; projectLink.input.focus(); notify('Use a valid project link.', true); return; }
    if (makeVisible) { next.visible = true; visible.checked = true; }
    else if (makeVisible === false) { next.visible = false; visible.checked = false; }
    if (!next.image) next.image = storyImages(next.document)[0]?.attrs.src || '';
    busy = true; draftStatus.textContent = 'Saving to GitHub…'; dialog.querySelectorAll('button,input,textarea,select').forEach(control => { control.disabled = true; }); editor.setEditable(false);
    try {
      if (await onSave(next)) { dirty = false; clearTimeout(timer); storage.removeItem(draftKey); close(); }
      else notify('Saving has not completed. Your draft is kept here; check the connection and try again.', true);
    } catch { notify('Could not save this story. Your draft is kept here. Please try again.', true); }
    finally { busy = false; if (dialog.isConnected) { editor.setEditable(true); dialog.querySelectorAll('button,input,textarea,select').forEach(control => { control.disabled = false; }); updateTools(); draftStatus.textContent = 'Draft kept on this device'; } }
  }
  saveDraft.addEventListener('click', () => save(false));
  publish.addEventListener('click', () => { if (isNew || model.visible === false) { panel.hidden = false; panelTitle.textContent = 'Ready to publish?'; panelSave.textContent = 'Publish now'; visible.checked = true; } else void save(); });
  panelSave.addEventListener('click', () => save(panelSave.textContent === 'Publish now' ? true : undefined));
  function resize() { resizeTitle(); placeAddButton(); }
  function preserveBeforeUnload() { if (dirty) { try { storage.setItem(draftKey, JSON.stringify(contentModel())); } catch {} } }
  window.addEventListener('resize', resize);
  window.addEventListener('beforeunload', preserveBeforeUnload);
  function close() { window.removeEventListener('resize', resize); window.removeEventListener('beforeunload', preserveBeforeUnload); clearTimeout(timer); document.body.classList.remove('story-editor-open'); editor.destroy(); dialog.close(); dialog.remove(); onClose?.(); }
  function requestClose() {
    if (busy || pendingImages) { notify('Wait for saving or image preparation to finish.'); return; }
    if (dirty) { try { storage.setItem(draftKey, JSON.stringify(contentModel())); } catch { if (!confirm('This device could not save your draft. Discard these unsaved changes?')) return; } }
    close();
  }
  back.addEventListener('click', requestClose);
  dialog.addEventListener('cancel', event => { event.preventDefault(); if (!panel.hidden) panel.hidden = true; else if (!linkPanel.hidden) linkPanel.hidden = true; else if (!mediaPanel.hidden) mediaPanel.hidden = true; else if (!library.hidden) library.hidden = true; else requestClose(); });
  dialog.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void save(); } });
  dialog.addEventListener('scroll', placeAddButton, { passive: true });
  resizeTitle(); requestAnimationFrame(() => { updateTools(); if (!title.value) title.focus(); else editor.commands.focus('end'); });
  return dialog;
}
