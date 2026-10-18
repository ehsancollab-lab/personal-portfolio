import { contactLinks, copy, projects } from './content.js';
import { caseStudyAssets, defaultCaseStudies, defaultExperience } from './case-content.js';

const DRAFT_KEY = 'ehsan-portfolio-server-draft-v1';
const RECOVERY_KEY = 'ehsan-portfolio-recovery-draft';
const THEME_KEY = 'ehsan-portfolio-theme';
const noticeKey = 'ehsan-dashboard-notice-dismissed';
const imageNames = [...projects];
const root = document.documentElement;
const storage = (() => {
  try {
    const local = window.localStorage;
    local.getItem('__portfolio_storage_check__');
    return local;
  } catch {
    const values = new Map();
    return {
      getItem(key) { return values.get(key) || null; },
      setItem(key, value) { values.set(key, String(value)); },
      removeItem(key) { values.delete(key); }
    };
  }
})();
const uiText = {
    skip: 'Skip to dashboard content', workspace: 'Portfolio workspace', manage: 'Manage content', overview: 'Overview', selectedWork: 'Selected Work', caseStudies: 'Case Studies', experience: 'Experience', profileContact: 'About me', viewPortfolio: 'View portfolio', designerRole: 'Senior AI Product Designer', allChangesSaved: 'All changes saved', contentManagement: 'CONTENT MANAGEMENT', overviewSubtitle: 'Manage your portfolio content in one place.', previewSite: 'Preview site', addNew: 'Add New', localStorageTitle: 'Saved in this browser', localStorageCopy: 'Edits stay on this device. Export a JSON backup to move them; publishing to all visitors needs a database and admin access.', projectImages: 'project images', draftEntries: 'draft entries', workEntries: 'work entries', contentSections: 'Content sections', contentSectionsHint: 'Choose a section to review or edit.', workspaceStatus: 'Workspace status', workspaceStatusHint: 'A quick view of your content setup.', draft: 'Draft', englishContent: 'English-only content', themeSupport: 'Light and dark themes', ready: 'Ready', publicSections: 'Case Studies and Experience pages', connected: 'Connected', sharedPublishing: 'Shared publishing', backendNeeded: 'Backend needed', onlyYouCanSee: 'Only your browser has these edits', nextSteps: 'Manage your public portfolio content', nextStepsCopy: 'Edit case study cards and full article details, or update the roles and responsibilities shown on the Experience page.', manageCaseStudies: 'Manage Case Studies', allItems: 'All items', published: 'Visible', searchContent: 'Search content', nothingHere: 'Nothing here yet', emptyCopy: 'Create your first item. You can add or change the text later.', addFirst: 'Add your first item', backupTitle: 'Backup and transfer', backupCopy: 'Export your current content to a JSON file, or restore a previous backup.', exportJson: 'Export JSON', importJson: 'Import JSON', appearanceTitle: 'Appearance', appearanceCopy: 'Choose the color theme.', switchTheme: 'Switch theme', resetTitle: 'Reset local edits', resetCopy: 'Restore the starting content from the supplied portfolio files. This clears saved edits in this browser.', reset: 'Reset content', footerNote: 'Portfolio content workspace', cancel: 'Cancel', saveChanges: 'Save changes', selectedWorkTitle: 'Selected Work', selectedWorkSubtitle: 'Add, replace, delete, and drag images to set their order.', caseStudiesSubtitle: 'Edit case study cards and full article details for the public portfolio.', experienceSubtitle: 'Edit roles, dates, and responsibilities shown on the Experience page.', profileSubtitle: 'Update the introduction and contact links shown on your portfolio.', settingsSubtitle: 'Manage backups and dashboard preferences.', allSavedToast: 'Changes saved in this browser.', savedToast: 'Saved in this browser. Open the portfolio pages here to preview the changes.', deleteConfirm: 'Delete this item? The change will be published.', resetConfirm: 'Restore the starting portfolio content for all visitors?', importConfirm: 'Replace the published portfolio with this backup?', invalidJson: 'This JSON file is not a valid portfolio backup.', exported: 'JSON backup downloaded.', imported: 'Backup imported.', resetDone: 'Starting content restored.', searchPlaceholder: 'Search by title or text', imageItem: 'Project image', untitledProject: 'Untitled work', untitledCase: 'Untitled case study', untitledExperience: 'Untitled role', noContent: 'Content not added', edit: 'Edit', delete: 'Delete', up: 'Move up', down: 'Move down', visible: 'Visible on portfolio', hidden: 'Hidden from portfolio', draftBadge: 'Draft', image: 'Image', title: 'Title', link: 'External link (optional)', summary: 'Summary', details: 'Full case study content', caseDetailsHint: 'Use ## for section headings, - for bullets, and ![Caption](image-name.png) for screenshots. Available screenshots appear in the image menu.', role: 'Role', company: 'Company', dates: 'Dates', description: 'Description', heading: 'Heading', body: 'Body text', chooseImage: 'Choose an image', noLink: 'No link added', optional: 'Optional', untitled: 'Untitled', item: 'item', items: 'items', addItem: 'Add item', newProject: 'Add project image', newCase: 'New case study', newExperience: 'New experience', editProject: 'Edit project image', editCase: 'Edit case study', editExperience: 'Edit experience', caseKicker: 'CASE STUDY', workKicker: 'SELECTED WORK', experienceKicker: 'EXPERIENCE', profileKicker: 'PROFILE', statusVisible: 'Visible', contactLabel: 'Label', destination: 'URL / email', contactsTitle: 'Contact links', contactsCopy: 'Keep the existing destinations or replace them with your own links.', addContact: 'Add contact link', saveProfile: 'Save profile', greeting: 'Greeting', biography: 'Biography', contactPrompt: 'Contact prompt', imageOrder: 'Drag and drop to reorder images.', noImageAvailable: 'No supplied project image is available.', noWorkImages: 'No work images yet.', replace: 'Replace', fileTypeError: 'Choose an image file.', uploadFailed: 'This image could not be read. Choose another image file.', storageError: 'This browser could not save the image. Try a smaller image or clear some browser storage.', badLink: 'Use a valid https, mailto, tel, or relative link.', localOnly: 'Saved in this browser only', dataImported: 'Backup restored', unexpectedError: 'Something went wrong. Please try again.'
  };

let theme = 'light';
let data = initialData();
let activeSection = 'projects';
let activeFilter = 'all';
let editing = null;
let toastTimer = 0;
let serverRevision = '';
let saveTimer;
let changeNumber = 0;
let saving = false;
let loaded = false;
let conflicted = false;
let loadingContent = false;

function id() { return globalThis.crypto?.randomUUID?.() || 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8); }
function deepCopy(value) { return JSON.parse(JSON.stringify(value)); }
function flattenBio() {
  return copy.bioSegments.map((segment) => segment.text !== undefined ? segment.text : copy.companyNames[segment.link]).join('');
}
function initialData() {
  return {
    version: 3,
    profile: {
      greeting: copy.greeting,
      bio: flattenBio(),
      contactPrompt: copy.contactPrompt
    },
    projects: projects.map((image, index) => ({ id: 'project-' + (index + 1), image, title: '', href: '', visible: true })),
    caseStudies: deepCopy(defaultCaseStudies),
    experience: deepCopy(defaultExperience),
    contactLinks: contactLinks.map(({ key, href }) => ({
      id: key,
      label: copy.links[key],
      href
    }))
  };
}
function validHref(value) {
  const href = String(value || '').trim();
  if (!href) return true;
  return /^(https:\/\/|mailto:|tel:|\/|\.\/|#)/i.test(href) && !/^\/\//.test(href);
}
function validImageDataUrl(value) {
  return typeof value === 'string' && value.length <= 900000 && /^data:image\/(?:png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}
function validUploadedImage(value) { return typeof value === 'string' && /^uploads\/[a-f0-9]{64}\.(?:png|jpg|webp|gif|avif)$/.test(value); }
function isProjectImage(value) { return imageNames.includes(value) || validImageDataUrl(value) || validUploadedImage(value); }
function normalizeData(candidate) {
  if (!candidate || ![1, 2, 3].includes(candidate.version) || !Array.isArray(candidate.projects) || !Array.isArray(candidate.caseStudies) || !Array.isArray(candidate.experience) || !Array.isArray(candidate.contactLinks)) return null;
  const base = initialData();
  const text = (value) => typeof value === 'string' ? value : String(value?.en || '');
  const safeProject = (item, index) => ({
    id: String(item.id || id()),
    image: isProjectImage(item.image) ? item.image : imageNames[index % imageNames.length],
    title: text(item.title),
    href: validHref(item.href) ? String(item.href || '') : '',
    visible: item.visible !== false
  });
  const safeItem = (item, fields) => {
    const normalized = { id: String(item.id || id()) };
    for (const field of fields) normalized[field] = text(item[field]);
    normalized.href = validHref(item.href) ? String(item.href || '') : '';
    normalized.image = [...imageNames, ...caseStudyAssets].includes(item.image) || validImageDataUrl(item.image) || validUploadedImage(item.image) ? item.image : '';
    normalized.visible = item.visible !== false;
    return normalized;
  };
  const contacts = candidate.contactLinks.map((item) => ({
    id: String(item.id || id()),
    label: text(item.label),
    href: validHref(item.href) ? String(item.href || '') : ''
  }));
  return {
    version: 3,
    profile: {
      greeting: candidate.profile?.greeting == null ? base.profile.greeting : text(candidate.profile.greeting),
      bio: candidate.profile?.bio == null ? base.profile.bio : text(candidate.profile.bio),
      contactPrompt: candidate.profile?.contactPrompt == null ? base.profile.contactPrompt : text(candidate.profile.contactPrompt)
    },
    projects: candidate.projects.map(safeProject),
    caseStudies: candidate.version < 3 && candidate.caseStudies.length === 0 ? deepCopy(base.caseStudies) : candidate.caseStudies.map((item) => safeItem(item, ['title', 'summary', 'body'])),
    experience: candidate.version < 3 && candidate.experience.length === 0 ? deepCopy(base.experience) : candidate.experience.map((item) => safeItem(item, ['role', 'company', 'dates', 'description'])),
    contactLinks: contacts
  };
}
function saveData(messageKey = 'allSavedToast') {
  if (!loaded) { showToast('Content is not loaded yet. Please try again.'); return false; }
  try {
    storage.setItem(DRAFT_KEY, JSON.stringify({ revision: serverRevision, content: data }));
    storage.setItem(THEME_KEY, theme);
  } catch { showToast(uiText.storageError); return false; }
  changeNumber++;
  updateCounts();
  renderDashboardFooterLinks();
  publishingStatus(conflicted ? 'conflict' : 'pending', conflicted ? 'Changes kept as a draft. Download a backup before loading the latest content.' : 'Saving changes…');
  clearTimeout(saveTimer);
  if (!conflicted) saveTimer = setTimeout(publishData, 700);
  return true;
}

function updateContentAvailability() {
  const content = document.querySelector('.content-wrap');
  content.dataset.contentState = loaded ? 'ready' : loadingContent ? 'loading' : 'unavailable';
  content.setAttribute('aria-busy', String(loadingContent));
  // A failed connection must not suppress card hover or page navigation.
  content.querySelectorAll('button, input, textarea, select').forEach((control) => { control.disabled = !loaded; });
  content.querySelectorAll('.project-tile').forEach((card) => { card.draggable = loaded; });
  document.querySelector('#restore-backup').disabled = !loaded;
}
function contentErrorMessage(code, status, operation = 'load') {
  const messages = {
    publishing_not_configured: 'GitHub publishing is not configured. Set GITHUB_CONTENT_TOKEN in Cloudflare Production secrets.',
    github_token_invalid: 'GitHub rejected the content token. Update GITHUB_CONTENT_TOKEN in Cloudflare Production secrets.',
    github_access_denied: 'GitHub access was denied. Allow this repository and Contents: Read and write on the content token.',
    github_content_not_found: 'Portfolio content was not found. Check the configured GitHub repository and branch.',
    github_rate_limited: 'GitHub temporarily limited requests. Wait a minute, then retry.',
    github_connection_failed: 'The server could not connect to GitHub. Retry loading your content.',
    github_timeout: 'The connection to GitHub timed out. Retry loading your content.',
    github_redirect_not_allowed: 'GitHub redirected the repository request. Check the configured repository name.',
    github_invalid_response: 'GitHub returned an unreadable response. Retry loading your content.',
    github_unavailable: 'GitHub could not be reached. Retry loading your content.',
    invalid_stored_content: 'The stored portfolio content could not be read. Retry or check the repository content file.',
    invalid_content: 'The stored portfolio content has an unsupported format.',
    invalid_image: 'A portfolio image has an unsupported format.'
  };
  return messages[code] || (operation === 'save'
    ? `Could not confirm saving${status ? ` (HTTP ${status})` : ''}.`
    : `Could not load your published content${status ? ` (HTTP ${status})` : ''}. Editing is paused; retry loading.`);
}
function publishingStatus(state, message) {
  document.querySelector('.publishing-bar').dataset.state = state;
  document.querySelector('#publishing-status').textContent = message;
  document.querySelector('#retry-publish').hidden = state !== 'error';
  document.querySelector('#retry-publish').textContent = loaded ? 'Retry saving' : 'Retry loading';
  document.querySelector('#reload-content').hidden = state !== 'conflict';
}
async function loadPublishedData() {
  if (loadingContent) return;
  loadingContent = true;
  updateContentAvailability();
  publishingStatus('loading', 'Loading your content…');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    let response;
    try { response = await fetch('/api/content', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal }); }
    finally { clearTimeout(timeout); }
    if (response.status === 401) { location.replace('/login'); return; }
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(contentErrorMessage(result.error, response.status));
    }
    const result = await response.json();
    const normalized = normalizeData(result.content);
    if (!normalized || !/^[a-f0-9]{40}$/.test(result.revision)) throw new Error('content');
    data = normalized;
    serverRevision = result.revision;
    conflicted = false;
    let restored = false;
    try {
      const draft = JSON.parse(storage.getItem(DRAFT_KEY) || 'null');
      if (draft && normalizeData(draft.content)) {
        if (draft.revision === serverRevision) { data = normalizeData(draft.content); restored = true; }
        else { storage.setItem(RECOVERY_KEY, JSON.stringify(draft)); storage.removeItem(DRAFT_KEY); }
      }
    } catch { /* A malformed draft never replaces published content. */ }
    loaded = true;
    renderSection();
    renderDashboardFooterLinks();
    updateCounts();
    publishingStatus('saved', 'Saved to GitHub');
    if (restored) saveData();
    else if (storage.getItem(RECOVERY_KEY)) publishingStatus('saved', 'A previous draft is available in Download backup.');
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? 'Loading timed out. Retry loading your published content.'
      : error?.message === 'content' ? contentErrorMessage('invalid_stored_content')
      : error instanceof TypeError ? 'Could not connect. Check your connection, then retry loading.'
      : error?.message || contentErrorMessage();
    publishingStatus('error', `${message} Preview only until the published content loads.`);
  } finally {
    loadingContent = false;
    updateContentAvailability();
  }
}
async function publishData() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  if (!loaded) { await loadPublishedData(); return; }
  if (saving || conflicted) return;
  const sequence = changeNumber;
  const snapshot = deepCopy(data);
  saving = true;
  publishingStatus('saving', 'Saving changes…');
  try {
    const response = await fetch('/api/content', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'If-Match': serverRevision },
      body: JSON.stringify(snapshot)
    });
    if (response.status === 401) { location.replace('/login'); return; }
    if (response.status === 409) {
      conflicted = true;
      publishingStatus('conflict', 'Content changed elsewhere. Download your backup, then load the latest content.');
      return;
    }
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(contentErrorMessage(result.error, response.status, 'save'));
    }
    const result = await response.json();
    const normalized = normalizeData(result.content);
    if (!normalized || !/^[a-f0-9]{40}$/.test(result.revision)) throw new Error('content');
    serverRevision = result.revision;
    if (sequence === changeNumber) {
      data = normalized;
      storage.removeItem(DRAFT_KEY);
      if (['projects', 'caseStudies', 'experience'].includes(activeSection)) renderItems();
      publishingStatus('saved', 'Saved to GitHub. The site updates after automatic deployment.');
    } else {
      storage.setItem(DRAFT_KEY, JSON.stringify({ revision: serverRevision, content: data }));
      saveTimer = setTimeout(publishData, 700);
    }
  } catch (error) {
    const detail = error instanceof TypeError ? 'Could not connect to save your changes.' : error?.message === 'content' ? 'The save response could not be read.' : error?.message || 'Could not confirm saving.';
    publishingStatus('error', `${detail} Your draft is kept on this device. Retry saving.`);
  }
  finally { saving = false; }
}
function t(key) { return uiText[key] || key; }

function setTheme(next) {
  theme = next;
  storage.setItem(THEME_KEY, theme);
  applySettings();
}
function applySettings() {
  root.lang = 'en';
  root.dir = 'ltr';
  root.dataset.theme = theme;
  document.querySelectorAll('[data-ui]').forEach((node) => {
    const key = node.dataset.ui;
    if (uiText[key]) node.textContent = uiText[key];
  });
  document.querySelectorAll('[data-ui-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.uiPlaceholder); });
  document.querySelectorAll('[data-ui-title]').forEach((node) => { node.title = t(node.dataset.uiTitle); });
  document.querySelector('#theme-toggle').setAttribute('aria-pressed', String(theme === 'dark'));
  document.querySelector('#theme-toggle').setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  document.querySelector('#mobile-menu').setAttribute('aria-label', 'Open navigation');
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#151517' : '#f7f7f8';
  document.querySelector('#current-year').textContent = String(new Date().getFullYear());
  document.querySelector('#saved-indicator').lastElementChild.textContent = t('allChangesSaved');
  updateHeadings();
}
function showToast(text) {
  const toast = document.querySelector('#toast');
  toast.textContent = text;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}
function sectionLabel(section) {
  return ({ overview: 'overview', projects: 'selectedWork', caseStudies: 'caseStudies', experience: 'experience', profile: 'profileContact', settings: 'appearanceTitle' })[section] || 'overview';
}
function updateHeadings() {
  const key = sectionLabel(activeSection);
  const title = activeSection === 'projects' ? t('selectedWorkTitle') : t(key);
  document.querySelector('#page-title').textContent = title;
  document.querySelector('#breadcrumb-current').textContent = title;
  const subtitleKey = ({ overview: 'overviewSubtitle', projects: 'selectedWorkSubtitle', caseStudies: 'caseStudiesSubtitle', experience: 'experienceSubtitle', profile: 'profileSubtitle', settings: 'settingsSubtitle' })[activeSection];
  document.querySelector('#page-subtitle').textContent = t(subtitleKey);
  document.querySelectorAll('.side-link').forEach((button) => button.classList.toggle('is-active', button.dataset.section === activeSection));
  document.querySelectorAll('.dashboard-tab').forEach((button) => {
    const selected = button.dataset.section === activeSection;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-current', selected ? 'page' : 'false');
  });
  const primary = document.querySelector('#primary-action');
  const canCreate = ['projects', 'caseStudies', 'experience'].includes(activeSection);
  primary.hidden = !canCreate;
  if (canCreate) primary.querySelector('span:last-child').textContent = t('addNew');
  document.querySelector('#overview-panel').hidden = activeSection !== 'overview';
  const editor = document.querySelector('#editor-panel');
  editor.hidden = !['projects', 'caseStudies', 'experience'].includes(activeSection);
  editor.classList.toggle('is-projects', activeSection === 'projects');
  document.querySelector('#profile-editor').hidden = activeSection !== 'profile';
  document.querySelector('#settings-panel').hidden = activeSection !== 'settings';
  document.querySelector('#filter-tabs').hidden = !['caseStudies', 'experience'].includes(activeSection);
  document.querySelector('#item-search').value = '';
}
function currentItems() { return activeSection === 'projects' ? data.projects : data[activeSection] || []; }
function displayTitle(item, index) {
  const val = item.title || item.role || '';
  if (val.trim()) return val;
  if (activeSection === 'projects') return t('imageItem') + ' ' + new Intl.NumberFormat('en').format(index + 1);
  return t(({ caseStudies: 'untitledCase', experience: 'untitledExperience' })[activeSection] || 'untitled');
}
function displayMeta(item) {
  const fields = activeSection === 'projects' ? ['title'] : activeSection === 'caseStudies' ? ['summary'] : activeSection === 'experience' ? ['company', 'dates'] : ['body'];
  const value = fields.map((field) => item[field] || '').filter(Boolean).join(' · ');
  if (value) return value;
  if (activeSection === 'projects') return item.href || t('noLink');
  return t('noContent');
}
function renderDashboardFooterLinks() {
  const nav = document.querySelector('#dashboard-footer-links');
  if (!nav) return;
  nav.replaceChildren();
  data.contactLinks.forEach((contact) => {
    const href = String(contact.href || '').trim();
    if (!href || !validHref(href)) return;
    const link = document.createElement('a');
    link.href = href;
    link.textContent = String(contact.label || href);
    if (/^https:\/\//i.test(href)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    nav.append(link);
  });
}
function makeButton(text, classes, action, idValue, title = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = classes;
  button.textContent = text;
  button.dataset.action = action;
  button.dataset.itemId = idValue;
  button.disabled = !loaded;
  if (title) { button.title = title; button.setAttribute('aria-label', title); }
  return button;
}
function renderProjectTile(item, index) {
  const card = document.createElement('article');
  card.className = 'project-tile';
  card.dataset.itemId = item.id;
  card.draggable = loaded;
  card.tabIndex = 0;
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', `${t('imageItem')} ${index + 1}. ${t('imageOrder')}`);
  card.setAttribute('aria-keyshortcuts', 'Alt+ArrowUp Alt+ArrowDown');

  const image = document.createElement('img');
  image.src = adminAssetPath(item.image);
  image.alt = '';
  image.loading = 'lazy';
  image.draggable = false;
  card.append(image);

  const actions = document.createElement('div');
  actions.className = 'project-tile-actions';
  actions.append(makeButton(t('replace'), 'project-action-button', 'replace', item.id));
  actions.append(makeButton(t('delete'), 'project-action-button is-delete', 'delete', item.id));
  card.append(actions);
  return card;
}
function renderItems(focusProjectId = '') {
  const host = document.querySelector('#items-grid');
  const empty = document.querySelector('#empty-state');
  const items = currentItems();
  const isProjects = activeSection === 'projects';
  const query = document.querySelector('#item-search').value.trim().toLocaleLowerCase();
  const filtered = items.map((item, index) => ({ item, index })).filter(({ item }) => {
    const hasVisibility = ['projects', 'caseStudies', 'experience'].includes(activeSection);
    const visibleMatch = !hasVisibility || isProjects || activeFilter === 'all' || (activeFilter === 'published' ? item.visible !== false : item.visible === false);
    if (!visibleMatch || !query) return visibleMatch;
    return !isProjects && JSON.stringify(item).toLocaleLowerCase().includes(query);
  });
  host.replaceChildren();
  host.classList.toggle('project-gallery', isProjects);
  host.setAttribute('role', 'list');
  host.setAttribute('aria-label', isProjects ? t('selectedWork') : t('contentSections'));
  empty.hidden = filtered.length !== 0;
  empty.classList.toggle('is-projects-empty', isProjects);
  if (filtered.length === 0) {
    const heading = empty.querySelector('h2');
    const copy = empty.querySelector('p');
    const actionText = document.querySelector('#empty-action').querySelector('span:last-child');
    heading.textContent = isProjects && items.length === 0 ? t('noWorkImages') : t('nothingHere');
    copy.hidden = isProjects;
    actionText.textContent = isProjects ? t('addNew') : items.length ? t('addItem') : t('addFirst');
    document.querySelector('#empty-action').hidden = !isProjects && items.length > 0;
    return;
  }
  document.querySelector('#empty-action').hidden = false;
  empty.querySelector('p').hidden = false;
  filtered.forEach(({ item, index }) => {
    if (isProjects) {
      host.append(renderProjectTile(item, index));
      return;
    }
    const card = document.createElement('article');
    card.className = 'content-item';
    const thumb = document.createElement('div');
    thumb.className = 'item-thumb';
    const src = item.image && adminAssetPath(item.image);
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      thumb.append(img);
    } else {
      const placeholder = document.createElement('span');
      placeholder.className = 'item-placeholder';
      placeholder.textContent = activeSection === 'experience' ? '◷' : '▤';
      thumb.append(placeholder);
    }
    const body = document.createElement('div');
    body.className = 'item-body';
    const topline = document.createElement('div');
    topline.className = 'item-topline';
    const title = document.createElement('h2');
    title.className = 'item-title';
    title.textContent = displayTitle(item, index);
    topline.append(title);
    const badge = document.createElement('span');
    const isVisible = ['projects', 'caseStudies', 'experience'].includes(activeSection) && item.visible !== false;
    badge.className = 'item-status ' + (isVisible ? 'is-published' : 'is-draft');
    badge.textContent = isVisible ? t('statusVisible') : t('draftBadge');
    topline.append(badge);
    const meta = document.createElement('p');
    meta.className = 'item-meta';
    meta.textContent = displayMeta(item);
    const actions = document.createElement('div');
    actions.className = 'item-actions';
    actions.append(makeButton(t('edit'), 'mini-button', 'edit', item.id));
    actions.append(makeButton(t('delete'), 'mini-button delete', 'delete', item.id));
    body.append(topline, meta, actions);
    card.append(thumb, body);
    host.append(card);
  });
  if (focusProjectId) host.querySelector(`[data-item-id="${CSS.escape(focusProjectId)}"]`)?.focus();
}
function field(labelText, value, opts = {}) {
  const wrapper = document.createElement('label');
  wrapper.className = 'form-field' + (opts.full ? ' full-width' : '');
  const label = document.createElement('span');
  label.textContent = labelText;
  let control;
  if (opts.select) {
    control = document.createElement('select');
    opts.select.forEach(({ value: optionValue, label: optionLabel }) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionLabel;
      control.append(option);
    });
    control.value = value || '';
  } else if (opts.multiline) {
    control = document.createElement('textarea');
    control.value = value || '';
    if (opts.rows) control.rows = opts.rows;
  } else {
    control = document.createElement('input');
    control.type = opts.type || 'text';
    control.value = value || '';
    if (opts.placeholder) control.placeholder = opts.placeholder;
    if (opts.autocomplete) control.autocomplete = opts.autocomplete;
  }
  control.name = opts.name || '';
  control.required = Boolean(opts.required);
  wrapper.append(label, control);
  if (opts.hint) {
    const hint = document.createElement('small');
    hint.className = 'field-hint';
    hint.textContent = opts.hint;
    wrapper.append(hint);
  }
  return wrapper;
}
function textGroup(fieldKey, value, options = {}) {
  const labelKey = fieldKey === 'heading' ? 'heading' : fieldKey;
  return field(t(labelKey), value, {
    multiline: options.multiline,
    full: true,
    name: fieldKey,
    hint: options.hint,
    rows: options.rows
  });
}
function adminAssetPath(name) {
  if (validImageDataUrl(name)) return name;
  if (validUploadedImage(name)) return './assets/' + name;
  if (imageNames.includes(name)) return './assets/projects/' + encodeURIComponent(name);
  if (caseStudyAssets.includes(name)) return './assets/case-studies/' + encodeURIComponent(name);
  return '';
}
let projectPickerAction = null;
let draggedProjectId = '';
function openProjectPicker(action, itemId = '') {
  if (!loaded) { showToast('Load your published content before editing. Use Retry loading above.'); return; }
  projectPickerAction = { action, itemId };
  const input = document.querySelector('#project-image-input');
  input.value = '';
  input.click();
}
async function imageFileToDataUrl(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('file-type');
  let bitmap;
  if ('createImageBitmap' in window) {
    bitmap = await createImageBitmap(file);
  } else {
    const objectUrl = URL.createObjectURL(file);
    try {
      bitmap = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = objectUrl;
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
  const sourceWidth = bitmap.width || bitmap.naturalWidth;
  const sourceHeight = bitmap.height || bitmap.naturalHeight;
  if (!sourceWidth || !sourceHeight) throw new Error('image-decode');
  let edge = Math.min(1600, Math.max(sourceWidth, sourceHeight));
  let quality = 0.84;
  let blob;
  while (true) {
    const scale = Math.min(1, edge / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob) throw new Error('image-encode');
    if (blob.size <= 280 * 1024 || edge <= 900) break;
    edge = Math.max(900, Math.round(edge * 0.8));
    quality = Math.max(0.68, quality - 0.05);
  }
  bitmap.close?.();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  if (!validImageDataUrl(dataUrl)) throw new Error('image-encode');
  return dataUrl;
}
async function handleProjectImagePick(event) {
  const file = event.target.files?.[0];
  const request = projectPickerAction;
  projectPickerAction = null;
  if (!file || !request) return;
  try {
    const image = await imageFileToDataUrl(file);
    const previousProjects = data.projects;
    let changedId = request.itemId;
    if (request.action === 'add') {
      changedId = id();
      data.projects = [{ id: changedId, image, title: '', href: '', visible: true }, ...data.projects];
    } else {
      const index = data.projects.findIndex((project) => project.id === request.itemId);
      if (index < 0) return;
      data.projects = data.projects.map((project, currentIndex) => currentIndex === index ? { ...project, image } : project);
    }
    if (!saveData('savedToast')) data.projects = previousProjects;
    renderItems(changedId);
  } catch (error) {
    showToast(error?.message === 'file-type' ? t('fileTypeError') : t('uploadFailed'));
  } finally {
    event.target.value = '';
  }
}
function reorderProject(draggedId, targetId, afterTarget = false) {
  if (!loaded) return;
  const fromIndex = data.projects.findIndex((project) => project.id === draggedId);
  const targetIndex = data.projects.findIndex((project) => project.id === targetId);
  if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) return;
  const previousProjects = data.projects;
  const nextProjects = [...data.projects];
  const [moved] = nextProjects.splice(fromIndex, 1);
  let insertionIndex = targetIndex + (afterTarget ? 1 : 0);
  if (fromIndex < insertionIndex) insertionIndex -= 1;
  nextProjects.splice(insertionIndex, 0, moved);
  data.projects = nextProjects;
  if (!saveData()) data.projects = previousProjects;
  renderItems(draggedId);
}
function projectDropAfter(event, target) {
  const dragged = itemsGrid.querySelector(`[data-item-id="${CSS.escape(draggedProjectId)}"]`);
  if (!dragged) return false;
  const fromBounds = dragged.getBoundingClientRect();
  const toBounds = target.getBoundingClientRect();
  const sameRow = Math.abs(fromBounds.top - toBounds.top) < Math.min(fromBounds.height, toBounds.height) / 2;
  return sameRow ? event.clientX > toBounds.left + toBounds.width / 2 : event.clientY > toBounds.top + toBounds.height / 2;
}
function imageOptions(includeCaseAssets = false) {
  const projectOptions = imageNames.map((filename, index) => ({ value: filename, label: t('imageItem') + ' ' + new Intl.NumberFormat('en').format(index + 1) }));
  if (!includeCaseAssets) return projectOptions;
  return [
    ...projectOptions,
    ...caseStudyAssets.map((filename) => ({ value: filename, label: 'Case study — ' + filename })),
  ];
}
function checkbox(labelText, checked, name) {
  const label = document.createElement('label');
  label.className = 'checkbox-row';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = name;
  input.checked = checked;
  const span = document.createElement('span');
  span.textContent = labelText;
  label.append(input, span);
  return label;
}
function itemDefaults(section, item) {
  const base = item ? deepCopy(item) : { id: id() };
  if (section === 'projects') return { ...base, image: base.image || imageNames.find((img) => !data.projects.some((project) => project.image === img)) || imageNames[0], title: base.title || '', href: base.href || '', visible: base.visible !== false };
  if (section === 'caseStudies') return { ...base, title: base.title || '', summary: base.summary || '', body: base.body || '', href: base.href || '', image: base.image || '', visible: base.visible !== false };
  if (section === 'experience') return { ...base, role: base.role || '', company: base.company || '', dates: base.dates || '', description: base.description || '', href: base.href || '', image: base.image || '', visible: base.visible !== false };
  return base;
}
function typeCopy(section, edit) {
  return t((edit ? 'edit' : 'new') + ({ projects: 'Project', caseStudies: 'Case', experience: 'Experience' })[section]);
}
function openEditor(section, item = null) {
  const dialog = document.querySelector('#editor-dialog');
  const form = document.querySelector('#item-form');
  const model = itemDefaults(section, item);
  editing = { section, itemId: item?.id || model.id, isNew: !item };
  document.querySelector('#dialog-kicker').textContent = t(({ projects: 'workKicker', caseStudies: 'caseKicker', experience: 'experienceKicker' })[section]);
  document.querySelector('#dialog-title').textContent = typeCopy(section, Boolean(item));
  form.replaceChildren();
  if (section === 'projects') {
    const selectOptions = imageOptions();
    form.append(field(t('image'), model.image, { select: selectOptions, name: 'image' }));
    form.append(textGroup('title', model.title));
    form.append(field(t('link'), model.href, { name: 'href', placeholder: 'https://…' }));
    form.append(checkbox(t('visible'), model.visible, 'visible'));
  } else if (section === 'caseStudies') {
    form.append(textGroup('title', model.title));
    form.append(textGroup('summary', model.summary, { multiline: true }));
    form.append(textGroup('details', model.body, { multiline: true, rows: 20, hint: t('caseDetailsHint') }));
    form.append(field(t('link'), model.href, { name: 'href', placeholder: 'https://…' }));
    form.append(field(t('image'), model.image, { select: [{ value: '', label: t('optional') }, ...imageOptions(true)], name: 'image' }));
    form.append(checkbox(t('visible'), model.visible, 'visible'));
  } else if (section === 'experience') {
    form.append(textGroup('role', model.role));
    form.append(textGroup('company', model.company));
    form.append(textGroup('dates', model.dates));
    form.append(textGroup('description', model.description, { multiline: true }));
    form.append(field(t('link'), model.href, { name: 'href', placeholder: 'https://…' }));
    form.append(checkbox(t('visible'), model.visible, 'visible'));
  }
  if (dialog.open) dialog.close();
  dialog.showModal();
}
function readGroup(form, key) {
  return String(form.elements.namedItem(key)?.value || '').trim();
}
function handleItemSave(event) {
  event.preventDefault();
  if (!editing) return;
  const form = event.currentTarget;
  const { section, itemId, isNew } = editing;
  const model = itemDefaults(section, isNew ? null : data[section].find((item) => item.id === itemId));
  if (section === 'projects') {
    model.title = readGroup(form, 'title');
    model.image = form.elements.namedItem('image').value;
    model.href = form.elements.namedItem('href').value.trim();
    model.visible = form.elements.namedItem('visible').checked;
  } else if (section === 'caseStudies') {
    model.title = readGroup(form, 'title');
    model.summary = readGroup(form, 'summary');
    model.body = readGroup(form, 'details');
    model.href = form.elements.namedItem('href').value.trim();
    model.image = form.elements.namedItem('image').value;
    model.visible = form.elements.namedItem('visible').checked;
  } else if (section === 'experience') {
    model.role = readGroup(form, 'role');
    model.company = readGroup(form, 'company');
    model.dates = readGroup(form, 'dates');
    model.description = readGroup(form, 'description');
    model.href = form.elements.namedItem('href').value.trim();
    model.visible = form.elements.namedItem('visible').checked;
  }
  if (!validHref(model.href)) { showToast(t('badLink')); return; }
  if (isNew) data[section].push(model);
  else data[section] = data[section].map((entry) => entry.id === itemId ? model : entry);
  saveData('savedToast');
  document.querySelector('#editor-dialog').close();
  editing = null;
  renderItems();
}
function handleCardAction(event) {
  if (!loaded) return;
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, itemId } = button.dataset;
  const items = currentItems();
  const index = items.findIndex((item) => item.id === itemId);
  if (index < 0) return;
  if (activeSection === 'projects') {
    if (action === 'replace') openProjectPicker('replace', itemId);
    if (action === 'delete') {
      const previousProjects = data.projects;
      data.projects = data.projects.filter((item) => item.id !== itemId);
      if (!saveData()) data.projects = previousProjects;
      renderItems();
    }
    return;
  }
  if (action === 'edit') { openEditor(activeSection, items[index]); return; }
  if (action === 'delete') {
    data[activeSection] = items.filter((item) => item.id !== itemId);
    saveData();
    renderItems();
    return;
  }
  if (action === 'up' && index > 0) [data.projects[index - 1], data.projects[index]] = [data.projects[index], data.projects[index - 1]];
  if (action === 'down' && index < data.projects.length - 1) [data.projects[index + 1], data.projects[index]] = [data.projects[index], data.projects[index + 1]];
  saveData();
  renderItems();
}
function updateCounts() {
  const counts = { projects: data.projects.length, caseStudies: data.caseStudies.length, experience: data.experience.length };
  document.querySelector('#nav-project-count').textContent = String(counts.projects);
  document.querySelector('#nav-case-count').textContent = String(counts.caseStudies);
  document.querySelector('#nav-experience-count').textContent = String(counts.experience);
  document.querySelector('#stat-projects').textContent = String(counts.projects);
  document.querySelector('#stat-cases').textContent = String(counts.caseStudies);
  document.querySelector('#stat-experience').textContent = String(counts.experience);
  document.querySelector('#shortcut-projects').textContent = counts.projects + ' ' + t(counts.projects === 1 ? 'projectImages' : 'projectImages');
  document.querySelector('#shortcut-cases').textContent = counts.caseStudies + ' ' + t(counts.caseStudies === 1 ? 'item' : 'items');
  document.querySelector('#shortcut-experience').textContent = counts.experience + ' ' + t(counts.experience === 1 ? 'item' : 'items');
  renderDashboardFooterLinks();
}
function createProfileField(group, labelText, value, multiline = false) {
  const controlLabel = field(labelText, value, { multiline, full: true });
  const input = controlLabel.querySelector('input, textarea');
  input.dataset.profileKey = group;
  return controlLabel;
}
function renderProfile() {
  const host = document.querySelector('#profile-editor');
  const form = document.createElement('form');
  form.className = 'profile-fields';
  const intro = document.createElement('section');
  intro.className = 'panel profile-card';
  const introTitle = document.createElement('h2'); introTitle.textContent = t('profileContact');
  const introCopy = document.createElement('p'); introCopy.textContent = t('profileSubtitle');
  intro.append(introTitle, introCopy);
  const fields = document.createElement('div'); fields.className = 'form-grid';
  fields.append(createProfileField('greeting', t('greeting'), data.profile.greeting));
  fields.append(createProfileField('bio', t('biography'), data.profile.bio, true));
  fields.append(createProfileField('contactPrompt', t('contactPrompt'), data.profile.contactPrompt, true));
  intro.append(fields);

  const contactPanel = document.createElement('section');
  contactPanel.className = 'panel profile-card';
  const contactTitle = document.createElement('h2'); contactTitle.textContent = t('contactsTitle');
  const contactCopy = document.createElement('p'); contactCopy.textContent = t('contactsCopy');
  const headings = document.createElement('div'); headings.className = 'contact-headings';
  for (const text of [t('contactLabel'), t('destination'), '']) { const span = document.createElement('span'); span.textContent = text; headings.append(span); }
  const list = document.createElement('div'); list.className = 'contacts-list';
  data.contactLinks.forEach((contact, index) => list.append(makeContactRow(contact, index)));
  const contactFoot = document.createElement('div'); contactFoot.className = 'contacts-footer';
  const addContact = document.createElement('button'); addContact.className = 'mini-button'; addContact.type = 'button'; addContact.dataset.action = 'add-contact'; addContact.textContent = '＋ ' + t('addContact');
  const save = document.createElement('button'); save.className = 'button button-primary'; save.type = 'submit'; save.textContent = t('saveProfile');
  contactFoot.append(addContact, save);
  contactPanel.append(contactTitle, contactCopy, headings, list, contactFoot);
  form.append(intro, contactPanel);
  host.replaceChildren(form);
}
function makeContactRow(contact, index) {
  const row = document.createElement('div'); row.className = 'contact-editor-row'; row.dataset.contactId = contact.id || id(); row.dataset.contactIndex = String(index);
  const label = document.createElement('input'); label.value = typeof contact.label === 'string' ? contact.label : String(contact.label?.en || ''); label.placeholder = t('contactLabel'); label.dataset.contactField = 'label'; label.setAttribute('aria-label', t('contactLabel'));
  const url = document.createElement('input'); url.value = contact.href || ''; url.placeholder = t('destination'); url.dataset.contactField = 'href'; url.setAttribute('aria-label', t('destination'));
  const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'contact-remove'; remove.textContent = '×'; remove.dataset.action = 'remove-contact'; remove.dataset.contactIndex = String(index); remove.setAttribute('aria-label', t('delete'));
  row.append(label, url, remove);
  return row;
}
function saveProfile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  for (const input of form.querySelectorAll('[data-profile-key]')) {
    data.profile[input.dataset.profileKey] = input.value.trim();
  }
  const rows = [...form.querySelectorAll('.contact-editor-row')];
  const newContacts = rows.map((row) => ({
    id: row.dataset.contactId || id(),
    label: row.querySelector('[data-contact-field="label"]').value.trim(),
    href: row.querySelector('[data-contact-field="href"]').value.trim()
  })).filter((contact) => contact.label || contact.href);
  if (newContacts.some((contact) => !validHref(contact.href))) { showToast(t('badLink')); return; }
  data.contactLinks = newContacts;
  saveData('savedToast');
}
function renderSection() {
  updateHeadings();
  if (activeSection === 'overview') updateCounts();
  else if (activeSection === 'profile') renderProfile();
  else if (activeSection !== 'settings') renderItems();
  updateContentAvailability();
}
function setSection(section) {
  activeSection = section;
  activeFilter = 'all';
  document.querySelectorAll('.filter-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.filter === 'all'));
  renderSection();
  document.querySelector('#sidebar')?.classList.remove('is-open');
  document.querySelector('#mobile-menu')?.setAttribute('aria-expanded', 'false');
}
function addNew() {
  if (!loaded) { showToast('Load your published content before editing. Use Retry loading above.'); return; }
  const section = activeSection === 'overview' ? 'caseStudies' : activeSection;
  if (section === 'profile' || section === 'settings' || section === 'overview') return;
  if (section === 'projects') { openProjectPicker('add'); return; }
  openEditor(section);
}
function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'ehsan-masoomi-portfolio-content.json';
  anchor.click();
  URL.revokeObjectURL(url);
  showToast(t('exported'));
}
async function importData(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const normalized = normalizeData(parsed);
    if (!normalized) throw new Error('schema');
    if (!window.confirm(t('importConfirm'))) return;
    data = normalized;
    saveData('imported');
    renderSection();
  } catch { showToast(t('invalidJson')); }
}
function resetData() {
  if (!window.confirm(t('resetConfirm'))) return;
  data = initialData();
  saveData('resetDone');
  renderSection();
}

document.querySelectorAll('[data-section]').forEach((button) => button.addEventListener('click', () => setSection(button.dataset.section)));
document.querySelector('#primary-action').addEventListener('click', addNew);
document.querySelector('#retry-publish').addEventListener('click', publishData);
document.querySelector('#restore-backup').addEventListener('click', () => document.querySelector('#restore-backup-input').click());
document.querySelector('#restore-backup-input').addEventListener('change', (event) => { importData(event.target.files?.[0]); event.target.value = ''; });
document.querySelector('#download-backup').addEventListener('click', () => {
  const recovery = storage.getItem(RECOVERY_KEY);
  if (!recovery) { exportData(); return; }
  try {
    const backup = JSON.parse(recovery);
    const blob = new Blob([JSON.stringify(backup.content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'ehsan-portfolio-recovery.json'; anchor.click();
    URL.revokeObjectURL(url);
  } catch { exportData(); }
});
document.querySelector('#reload-content').addEventListener('click', async () => {
  exportData();
  storage.removeItem(DRAFT_KEY);
  loaded = false;
  await loadPublishedData();
});
document.querySelector('#sign-out').addEventListener('click', async () => {
  if (saving || saveTimer) {
    if (!window.confirm('There may be unpublished changes. Sign out and keep a local draft?')) return;
  }
  clearTimeout(saveTimer);
  try {
    const response = await fetch('/api/logout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (response.ok) location.replace('/login');
    else showToast('Could not sign out. Please try again.');
  } catch { showToast('Could not sign out. Please try again.'); }
});
document.querySelector('#empty-action').addEventListener('click', addNew);
const itemsGrid = document.querySelector('#items-grid');
itemsGrid.addEventListener('click', handleCardAction);
itemsGrid.addEventListener('dragstart', (event) => {
  if (!loaded || activeSection !== 'projects') { event.preventDefault(); return; }
  const card = event.target.closest('.project-tile');
  if (!card) return;
  draggedProjectId = card.dataset.itemId;
  card.classList.add('is-dragging');
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedProjectId);
  }
});
itemsGrid.addEventListener('dragover', (event) => {
  if (activeSection !== 'projects' || !draggedProjectId) return;
  const card = event.target.closest('.project-tile');
  if (!card || card.dataset.itemId === draggedProjectId) return;
  event.preventDefault();
  const after = projectDropAfter(event, card);
  itemsGrid.querySelectorAll('.project-tile').forEach((tile) => tile.classList.remove('drop-before', 'drop-after'));
  card.classList.add(after ? 'drop-after' : 'drop-before');
});
itemsGrid.addEventListener('drop', (event) => {
  if (activeSection !== 'projects' || !draggedProjectId) return;
  const card = event.target.closest('.project-tile');
  if (!card || card.dataset.itemId === draggedProjectId) return;
  event.preventDefault();
  reorderProject(draggedProjectId, card.dataset.itemId, projectDropAfter(event, card));
  draggedProjectId = '';
});
itemsGrid.addEventListener('dragend', () => {
  draggedProjectId = '';
  itemsGrid.querySelectorAll('.project-tile').forEach((tile) => tile.classList.remove('is-dragging', 'drop-before', 'drop-after'));
});
itemsGrid.addEventListener('keydown', (event) => {
  if (activeSection !== 'projects' || !event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
  const card = event.target.closest('.project-tile');
  if (!card) return;
  const index = data.projects.findIndex((item) => item.id === card.dataset.itemId);
  const target = data.projects[index + (event.key === 'ArrowUp' ? -1 : 1)];
  if (!target) return;
  event.preventDefault();
  reorderProject(card.dataset.itemId, target.id, event.key === 'ArrowDown');
});
document.querySelector('#item-form').addEventListener('submit', handleItemSave);
document.querySelector('#project-image-input').addEventListener('change', handleProjectImagePick);
document.querySelector('#item-search').addEventListener('input', renderItems);
document.querySelector('#filter-tabs').addEventListener('click', (event) => {
  const filter = event.target.closest('[data-filter]');
  if (!filter) return;
  activeFilter = filter.dataset.filter;
  document.querySelectorAll('.filter-tab').forEach((tab) => tab.classList.toggle('is-active', tab === filter));
  renderItems();
});
document.querySelector('#profile-editor').addEventListener('submit', saveProfile);
document.querySelector('#profile-editor').addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.action === 'add-contact') {
    const form = document.querySelector('#profile-editor form');
    const list = form.querySelector('.contacts-list');
    const newContact = { id: id(), label: '', href: '' };
    list.append(makeContactRow(newContact, list.children.length));
    return;
  }
  if (button.dataset.action === 'remove-contact') button.closest('.contact-editor-row').remove();
});
document.querySelector('#close-dialog').addEventListener('click', () => document.querySelector('#editor-dialog').close());
document.querySelector('#cancel-dialog').addEventListener('click', () => document.querySelector('#editor-dialog').close());
document.querySelector('#editor-dialog').addEventListener('close', () => { editing = null; });
document.querySelector('#theme-toggle').addEventListener('click', () => setTheme(theme === 'light' ? 'dark' : 'light'));
document.querySelector('#settings-theme').addEventListener('click', () => setTheme(theme === 'light' ? 'dark' : 'light'));
document.querySelector('#export-button').addEventListener('click', exportData);
document.querySelector('#import-input').addEventListener('change', (event) => { importData(event.target.files?.[0]); event.target.value = ''; });
document.querySelector('#reset-button').addEventListener('click', resetData);
document.querySelector('#dismiss-notice').addEventListener('click', () => { document.querySelector('.local-notice').hidden = true; storage.setItem(noticeKey, '1'); });
document.querySelector('#mobile-menu').addEventListener('click', (event) => {
  const sidebar = document.querySelector('#sidebar');
  const isOpen = sidebar.classList.toggle('is-open');
  event.currentTarget.setAttribute('aria-expanded', String(isOpen));
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') document.querySelector('#sidebar').classList.remove('is-open'); });
if (storage.getItem(noticeKey) === '1') document.querySelector('.local-notice').hidden = true;
applySettings();
renderItems();
updateCounts();
loadPublishedData();
