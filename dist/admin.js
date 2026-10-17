import { companyLinks, contactLinks, copy, projects } from './content.js';

const CONTENT_KEY = 'ehsan-portfolio-cms-v1';
const LANG_KEY = 'ehsan-portfolio-language';
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
  en: {
    skip: 'Skip to dashboard content', workspace: 'Portfolio workspace', manage: 'Manage content', overview: 'Overview', selectedWork: 'Selected Work', caseStudies: 'Case Studies', experience: 'Experience', about: 'About me', profileContact: 'Profile & contact', viewPortfolio: 'View portfolio', designerRole: 'Senior AI Product Designer', allChangesSaved: 'All changes saved', contentManagement: 'CONTENT MANAGEMENT', overviewSubtitle: 'Manage your portfolio content in one place.', previewSite: 'Preview site', addNew: 'Add new', localStorageTitle: 'Saved in this browser', localStorageCopy: 'Edits stay on this device. Export a JSON backup to move them; publishing to all visitors needs a database and admin access.', projectImages: 'project images', draftEntries: 'draft entries', workEntries: 'work entries', contentSections: 'Content sections', contentSectionsHint: 'Choose a section to review or edit.', workspaceStatus: 'Workspace status', workspaceStatusHint: 'A quick view of your content setup.', draft: 'Draft', bilingualContent: 'English and Persian fields', themeSupport: 'Light and dark themes', ready: 'Ready', publicSections: 'Case Studies, Experience, About pages', awaitingDesign: 'Awaiting design', sharedPublishing: 'Shared publishing', backendNeeded: 'Backend needed', onlyYouCanSee: 'Only your browser has these edits', aboutDraft: 'Draft content', nextSteps: 'Your content, ready for the next design handoff', nextStepsCopy: 'Case Studies, Experience, and About entries can be drafted here without inventing project outcomes. They can be connected to their public layouts when those designs are ready.', manageCaseStudies: 'Manage Case Studies', allItems: 'All items', published: 'Visible', searchContent: 'Search content', nothingHere: 'Nothing here yet', emptyCopy: 'Create your first item. You can add or change the text later.', addFirst: 'Add your first item', backupTitle: 'Backup and transfer', backupCopy: 'Export your current content to a JSON file, or restore a previous backup.', exportJson: 'Export JSON', importJson: 'Import JSON', appearanceTitle: 'Appearance', appearanceCopy: 'Choose the dashboard language and color theme.', switchLanguage: 'Switch language', switchTheme: 'Switch theme', resetTitle: 'Reset local edits', resetCopy: 'Restore the starting content from the supplied portfolio files. This clears saved edits in this browser.', reset: 'Reset content', footerNote: 'Portfolio content workspace', cancel: 'Cancel', saveChanges: 'Save changes', selectedWorkTitle: 'Selected Work', selectedWorkSubtitle: 'Manage the 20 supplied images and their display settings.', caseStudiesSubtitle: 'Write and organize case studies for the future public layout.', experienceSubtitle: 'Record roles and details from your actual work history.', aboutSubtitle: 'Draft the About page in content blocks.', profileSubtitle: 'Update the introduction and contact links shown on your portfolio.', settingsSubtitle: 'Manage backups and dashboard preferences.', allSavedToast: 'Changes saved in this browser.', savedToast: 'Saved. Open the portfolio preview in this browser to see Selected Work updates.', deleteConfirm: 'Delete this item? This cannot be undone in this browser.', resetConfirm: 'Clear local edits and restore the starting portfolio data?', importConfirm: 'Replace the current local content with this backup?', invalidJson: 'This JSON file is not a valid portfolio backup.', exported: 'JSON backup downloaded.', imported: 'Backup imported.', resetDone: 'Starting content restored.', searchPlaceholder: 'Search by title or text', imageItem: 'Project image', untitledProject: 'Untitled work', untitledCase: 'Untitled case study', untitledExperience: 'Untitled role', untitledAbout: 'Untitled section', noContent: 'Content not added', edit: 'Edit', delete: 'Delete', up: 'Move up', down: 'Move down', visible: 'Visible on portfolio', hidden: 'Hidden from portfolio', draftBadge: 'Draft', image: 'Image', title: 'Title', link: 'External link (optional)', summary: 'Summary', details: 'Details', role: 'Role', company: 'Company', dates: 'Dates', description: 'Description', heading: 'Heading', body: 'Body text', chooseImage: 'Choose an image', noLink: 'No link added', english: 'English', persian: 'Persian', optional: 'Optional', untitled: 'Untitled', item: 'item', items: 'items', addItem: 'Add item', newProject: 'Add project image', newCase: 'New case study', newExperience: 'New experience', newAbout: 'New About block', editProject: 'Edit project image', editCase: 'Edit case study', editExperience: 'Edit experience', editAbout: 'Edit About block', caseKicker: 'CASE STUDY', workKicker: 'SELECTED WORK', experienceKicker: 'EXPERIENCE', aboutKicker: 'ABOUT', profileKicker: 'PROFILE', statusVisible: 'Visible', labelEnglish: 'Label (English)', labelPersian: 'Label (Persian)', destination: 'URL / email', contactsTitle: 'Contact links', contactsCopy: 'Keep the existing destinations or replace them with your own links.', addContact: 'Add contact link', saveProfile: 'Save profile', greeting: 'Greeting', biography: 'Biography', contactPrompt: 'Contact prompt', fieldFor: 'Content for', imageOrder: 'Order follows the portfolio list. Use arrows to rearrange.', noImageAvailable: 'No supplied project image is available.', badLink: 'Use a valid https, mailto, tel, or relative link.', localOnly: 'Saved in this browser only', dataImported: 'Backup restored', unexpectedError: 'Something went wrong. Please try again.'
  },
  fa: {
    skip: 'رفتن به محتوای داشبورد', workspace: 'فضای کاری پرتفولیو', manage: 'مدیریت محتوا', overview: 'نمای کلی', selectedWork: 'کارهای منتخب', caseStudies: 'مطالعات موردی', experience: 'سوابق', about: 'دربارهٔ من', profileContact: 'پروفایل و راه‌های تماس', viewPortfolio: 'مشاهدهٔ پرتفولیو', designerRole: 'طراح ارشد محصول هوش مصنوعی', allChangesSaved: 'همهٔ تغییرها ذخیره شده‌اند', contentManagement: 'مدیریت محتوا', overviewSubtitle: 'محتوای پرتفولیو را از یکجا مدیریت کنید.', previewSite: 'پیش‌نمایش سایت', addNew: 'افزودن مورد', localStorageTitle: 'ذخیره در همین مرورگر', localStorageCopy: 'ویرایش‌ها روی همین دستگاه می‌مانند. برای انتقال، خروجی JSON بگیرید؛ انتشار برای همهٔ بازدیدکنندگان به پایگاه داده و دسترسی مدیر نیاز دارد.', projectImages: 'تصویر نمونه‌کار', draftEntries: 'پیش‌نویس', workEntries: 'مورد شغلی', contentSections: 'بخش‌های محتوا', contentSectionsHint: 'برای دیدن یا ویرایش، یک بخش را انتخاب کنید.', workspaceStatus: 'وضعیت فضای کاری', workspaceStatusHint: 'نمایی کوتاه از وضعیت محتوا.', draft: 'پیش‌نویس', bilingualContent: 'فیلدهای فارسی و انگلیسی', themeSupport: 'تم روشن و تاریک', ready: 'آماده', publicSections: 'صفحه‌های مطالعات موردی، سوابق و درباره', awaitingDesign: 'در انتظار طراحی', sharedPublishing: 'انتشار برای همه', backendNeeded: 'نیازمند بک‌اند', onlyYouCanSee: 'این ویرایش‌ها فقط در مرورگر شما هستند', aboutDraft: 'محتوای پیش‌نویس', nextSteps: 'محتوا برای مرحلهٔ بعدی طراحی آماده است', nextStepsCopy: 'می‌توانید مطالعات موردی، سوابق و بخش درباره را بدون ساختن نتیجه برای پروژه‌ها بنویسید. پس از آماده‌شدن طراحی عمومی، این محتوا به صفحه‌ها وصل می‌شود.', manageCaseStudies: 'مدیریت مطالعات موردی', allItems: 'همهٔ موارد', published: 'نمایش‌داده‌شده', searchContent: 'جست‌وجوی محتوا', nothingHere: 'هنوز محتوایی نیست', emptyCopy: 'اولین مورد را اضافه کنید؛ متن را بعداً هم می‌توانید تغییر دهید.', addFirst: 'افزودن اولین مورد', backupTitle: 'پشتیبان‌گیری و انتقال', backupCopy: 'محتوای فعلی را به فایل JSON خروجی بگیرید یا نسخهٔ پشتیبان قبلی را بازیابی کنید.', exportJson: 'خروجی JSON', importJson: 'ورود JSON', appearanceTitle: 'نمایش', appearanceCopy: 'زبان و تم داشبورد را انتخاب کنید.', switchLanguage: 'تغییر زبان', switchTheme: 'تغییر تم', resetTitle: 'پاک‌کردن ویرایش‌ها', resetCopy: 'محتوای اولیهٔ فایل‌های پرتفولیو را بازیابی می‌کند و ویرایش‌های این مرورگر را پاک می‌کند.', reset: 'بازیابی محتوا', footerNote: 'فضای مدیریت محتوای پرتفولیو', cancel: 'انصراف', saveChanges: 'ذخیرهٔ تغییرها', selectedWorkTitle: 'کارهای منتخب', selectedWorkSubtitle: '۲۰ تصویر ارسال‌شده و تنظیمات نمایش آن‌ها را مدیریت کنید.', caseStudiesSubtitle: 'مطالعات موردی را برای طراحی عمومی آینده بنویسید و مرتب کنید.', experienceSubtitle: 'سمت‌ها و جزئیات سابقهٔ واقعی کاری را ثبت کنید.', aboutSubtitle: 'پیش‌نویس صفحهٔ درباره را در چند بخش آماده کنید.', profileSubtitle: 'معرفی و راه‌های تماس نمایش‌داده‌شده در پرتفولیو را ویرایش کنید.', settingsSubtitle: 'پشتیبان‌ها و تنظیمات داشبورد را مدیریت کنید.', allSavedToast: 'تغییرها در همین مرورگر ذخیره شدند.', savedToast: 'ذخیره شد. پیش‌نمایش پرتفولیو را در همین مرورگر باز کنید تا تغییرات کارهای منتخب را ببینید.', deleteConfirm: 'این مورد حذف شود؟ در این مرورگر قابل بازگشت نیست.', resetConfirm: 'ویرایش‌های محلی پاک و محتوای اولیهٔ پرتفولیو بازیابی شود؟', importConfirm: 'محتوای فعلی با این فایل پشتیبان جایگزین شود؟', invalidJson: 'این فایل JSON پشتیبان معتبر پرتفولیو نیست.', exported: 'فایل پشتیبان JSON دانلود شد.', imported: 'فایل پشتیبان وارد شد.', resetDone: 'محتوای اولیه بازیابی شد.', searchPlaceholder: 'جست‌وجو براساس عنوان یا متن', imageItem: 'تصویر نمونه‌کار', untitledProject: 'نمونه‌کار بدون عنوان', untitledCase: 'مطالعهٔ موردی بدون عنوان', untitledExperience: 'سمت بدون عنوان', untitledAbout: 'بخش بدون عنوان', noContent: 'هنوز محتوایی اضافه نشده', edit: 'ویرایش', delete: 'حذف', up: 'انتقال به بالا', down: 'انتقال به پایین', visible: 'نمایش در پرتفولیو', hidden: 'پنهان از پرتفولیو', draftBadge: 'پیش‌نویس', image: 'تصویر', title: 'عنوان', link: 'پیوند بیرونی (اختیاری)', summary: 'خلاصه', details: 'جزئیات', role: 'سمت', company: 'شرکت', dates: 'تاریخ‌ها', description: 'توضیحات', heading: 'سرتیتر', body: 'متن', chooseImage: 'انتخاب تصویر', noLink: 'پیوندی ثبت نشده', english: 'انگلیسی', persian: 'فارسی', optional: 'اختیاری', untitled: 'بدون عنوان', item: 'مورد', items: 'مورد', addItem: 'افزودن مورد', newProject: 'افزودن تصویر نمونه‌کار', newCase: 'مطالعهٔ موردی جدید', newExperience: 'سابقهٔ کاری جدید', newAbout: 'بخش جدید درباره', editProject: 'ویرایش تصویر نمونه‌کار', editCase: 'ویرایش مطالعهٔ موردی', editExperience: 'ویرایش سابقهٔ کاری', editAbout: 'ویرایش بخش درباره', caseKicker: 'مطالعهٔ موردی', workKicker: 'کارهای منتخب', experienceKicker: 'سوابق', aboutKicker: 'درباره', profileKicker: 'پروفایل', statusVisible: 'قابل نمایش', labelEnglish: 'نام (انگلیسی)', labelPersian: 'نام (فارسی)', destination: 'نشانی / ایمیل', contactsTitle: 'راه‌های تماس', contactsCopy: 'نشانی‌های فعلی را نگه دارید یا با پیوندهای خودتان جایگزین کنید.', addContact: 'افزودن راه تماس', saveProfile: 'ذخیرهٔ پروفایل', greeting: 'سلام و معرفی', biography: 'بیوگرافی', contactPrompt: 'متن دعوت به تماس', fieldFor: 'محتوا برای', imageOrder: 'ترتیب این موارد در پرتفولیو اعمال می‌شود. برای جابه‌جایی از فلش‌ها استفاده کنید.', noImageAvailable: 'تصویری از فایل‌های ارسالی باقی نمانده است.', badLink: 'از پیوند معتبر https، mailto، tel یا نشانی نسبی استفاده کنید.', localOnly: 'فقط در همین مرورگر ذخیره شده', dataImported: 'پشتیبان بازیابی شد', unexpectedError: 'مشکلی پیش آمد. دوباره تلاش کنید.'
  }
};

let language = storage.getItem(LANG_KEY) || (navigator.language?.toLowerCase().startsWith('fa') ? 'fa' : 'en');
if (!['en', 'fa'].includes(language)) language = 'en';
let theme = storage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
let data = loadData();
let activeSection = 'overview';
let activeFilter = 'all';
let editing = null;
let toastTimer = 0;

function id() { return globalThis.crypto?.randomUUID?.() || 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8); }
function deepCopy(value) { return JSON.parse(JSON.stringify(value)); }
function flattenBio(lang) {
  return copy[lang].bioSegments.map((segment) => segment.text !== undefined ? segment.text : copy[lang].companyNames[segment.link]).join('');
}
function initialData() {
  return {
    version: 1,
    profile: {
      greeting: { en: copy.en.greeting, fa: copy.fa.greeting },
      bio: { en: flattenBio('en'), fa: flattenBio('fa') },
      contactPrompt: { en: copy.en.contactPrompt, fa: copy.fa.contactPrompt }
    },
    projects: projects.map((image, index) => ({ id: 'project-' + (index + 1), image, title: { en: '', fa: '' }, href: '', visible: true })),
    caseStudies: [],
    experience: [],
    about: [],
    contactLinks: contactLinks.map(({ key, href }) => ({
      id: key,
      label: { en: copy.en.links[key], fa: copy.fa.links[key] },
      href
    }))
  };
}
function validHref(value) {
  const href = String(value || '').trim();
  if (!href) return true;
  return /^(https:\/\/|mailto:|tel:|\/|\.\/|#)/i.test(href) && !/^\/\//.test(href);
}
function normalizeData(candidate) {
  if (!candidate || candidate.version !== 1 || !Array.isArray(candidate.projects) || !Array.isArray(candidate.caseStudies) || !Array.isArray(candidate.experience) || !Array.isArray(candidate.about) || !Array.isArray(candidate.contactLinks)) return null;
  const base = initialData();
  const trans = (value) => ({ en: String(value?.en || ''), fa: String(value?.fa || '') });
  const safeProject = (item, index) => ({
    id: String(item.id || id()),
    image: imageNames.includes(item.image) ? item.image : imageNames[index % imageNames.length],
    title: trans(item.title),
    href: validHref(item.href) ? String(item.href || '') : '',
    visible: item.visible !== false
  });
  const safeItem = (item, fields) => {
    const normalized = { id: String(item.id || id()) };
    for (const field of fields) normalized[field] = trans(item[field]);
    normalized.href = validHref(item.href) ? String(item.href || '') : '';
    normalized.image = imageNames.includes(item.image) ? item.image : '';
    return normalized;
  };
  const contacts = candidate.contactLinks.map((item) => ({
    id: String(item.id || id()),
    label: trans(item.label),
    href: validHref(item.href) ? String(item.href || '') : ''
  }));
  return {
    version: 1,
    profile: {
      greeting: trans(candidate.profile?.greeting || base.profile.greeting),
      bio: trans(candidate.profile?.bio || base.profile.bio),
      contactPrompt: trans(candidate.profile?.contactPrompt || base.profile.contactPrompt)
    },
    projects: candidate.projects.map(safeProject),
    caseStudies: candidate.caseStudies.map((item) => safeItem(item, ['title', 'summary', 'body'])),
    experience: candidate.experience.map((item) => safeItem(item, ['role', 'company', 'dates', 'description'])),
    about: candidate.about.map((item) => safeItem(item, ['title', 'body'])),
    contactLinks: contacts
  };
}
function loadData() {
  try {
    const saved = storage.getItem(CONTENT_KEY);
    if (saved) {
      const normalized = normalizeData(JSON.parse(saved));
      if (normalized) return normalized;
    }
  } catch { /* Use the supplied content when browser storage is unavailable. */ }
  return initialData();
}
function saveData(messageKey = 'allSavedToast') {
  try {
    storage.setItem(CONTENT_KEY, JSON.stringify(data));
    storage.setItem(LANG_KEY, language);
    storage.setItem(THEME_KEY, theme);
  } catch { showToast(uiText[language].unexpectedError); return false; }
  updateCounts();
  showToast(uiText[language][messageKey] || uiText[language].allSavedToast);
  return true;
}
function t(key) { return uiText[language][key] || key; }
function setLanguage(next) {
  language = next;
  storage.setItem(LANG_KEY, language);
  applySettings();
  renderSection();
}
function setTheme(next) {
  theme = next;
  storage.setItem(THEME_KEY, theme);
  applySettings();
}
function applySettings() {
  const fa = language === 'fa';
  root.lang = language;
  root.dir = fa ? 'rtl' : 'ltr';
  root.dataset.theme = theme;
  document.querySelectorAll('[data-ui]').forEach((node) => {
    const key = node.dataset.ui;
    if (uiText[language][key]) node.textContent = uiText[language][key];
  });
  document.querySelectorAll('[data-ui-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.uiPlaceholder); });
  document.querySelectorAll('[data-ui-title]').forEach((node) => { node.title = t(node.dataset.uiTitle); });
  document.querySelector('#language-toggle').setAttribute('aria-label', language === 'fa' ? 'تغییر زبان به انگلیسی' : 'Change language to Persian');
  document.querySelector('#theme-toggle').setAttribute('aria-pressed', String(theme === 'dark'));
  document.querySelector('#theme-toggle').setAttribute('aria-label', language === 'fa' ? (theme === 'dark' ? 'تغییر به تم روشن' : 'تغییر به تم تاریک') : (theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'));
  document.querySelector('#mobile-menu').setAttribute('aria-label', language === 'fa' ? 'بازکردن ناوبری' : 'Open navigation');
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#151517' : '#f7f7f8';
  document.querySelector('#current-year').textContent = String(new Date().getFullYear());
  document.querySelector('#saved-indicator').lastElementChild.textContent = t('allChangesSaved');
  document.querySelector('#language-toggle').querySelectorAll('span')[0].textContent = language === 'en' ? 'EN' : 'EN';
  document.querySelector('#language-toggle').querySelectorAll('span')[1].textContent = 'فا';
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
  return ({ overview: 'overview', projects: 'selectedWork', caseStudies: 'caseStudies', experience: 'experience', about: 'about', profile: 'profileContact', settings: 'appearanceTitle' })[section] || 'overview';
}
function updateHeadings() {
  const key = sectionLabel(activeSection);
  const title = activeSection === 'projects' ? t('selectedWorkTitle') : t(key);
  document.querySelector('#page-title').textContent = title;
  document.querySelector('#breadcrumb-current').textContent = title;
  const subtitleKey = ({ overview: 'overviewSubtitle', projects: 'selectedWorkSubtitle', caseStudies: 'caseStudiesSubtitle', experience: 'experienceSubtitle', about: 'aboutSubtitle', profile: 'profileSubtitle', settings: 'settingsSubtitle' })[activeSection];
  document.querySelector('#page-subtitle').textContent = t(subtitleKey);
  document.querySelectorAll('.side-link').forEach((button) => button.classList.toggle('is-active', button.dataset.section === activeSection));
  const primary = document.querySelector('#primary-action');
  const canCreate = ['projects', 'caseStudies', 'experience', 'about'].includes(activeSection);
  primary.hidden = !canCreate;
  if (canCreate) primary.querySelector('span:last-child').textContent = t('addNew');
  document.querySelector('#overview-panel').hidden = activeSection !== 'overview';
  document.querySelector('#editor-panel').hidden = !['projects', 'caseStudies', 'experience', 'about'].includes(activeSection);
  document.querySelector('#profile-editor').hidden = activeSection !== 'profile';
  document.querySelector('#settings-panel').hidden = activeSection !== 'settings';
  document.querySelector('#filter-tabs').hidden = activeSection !== 'projects';
  document.querySelector('#item-search').value = '';
}
function currentItems() { return activeSection === 'projects' ? data.projects : data[activeSection] || []; }
function displayTitle(item, index) {
  const val = item.title?.[language] || item.role?.[language] || '';
  if (val.trim()) return val;
  if (activeSection === 'projects') return t('imageItem') + ' ' + new Intl.NumberFormat(language).format(index + 1);
  return t(({ caseStudies: 'untitledCase', experience: 'untitledExperience', about: 'untitledAbout' })[activeSection] || 'untitled');
}
function displayMeta(item) {
  const fields = activeSection === 'projects' ? ['title'] : activeSection === 'caseStudies' ? ['summary'] : activeSection === 'experience' ? ['company', 'dates'] : ['body'];
  const value = fields.map((field) => item[field]?.[language] || '').filter(Boolean).join(' · ');
  if (value) return value;
  if (activeSection === 'projects') return item.href || t('noLink');
  return t('noContent');
}
function makeButton(text, classes, action, idValue, title = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = classes;
  button.textContent = text;
  button.dataset.action = action;
  button.dataset.itemId = idValue;
  if (title) { button.title = title; button.setAttribute('aria-label', title); }
  return button;
}
function renderItems() {
  const host = document.querySelector('#items-grid');
  const empty = document.querySelector('#empty-state');
  const items = currentItems();
  const query = document.querySelector('#item-search').value.trim().toLocaleLowerCase();
  const filtered = items.map((item, index) => ({ item, index })).filter(({ item }) => {
    const visibleMatch = activeSection !== 'projects' || activeFilter === 'all' || (activeFilter === 'published' ? item.visible : !item.visible);
    const text = JSON.stringify(item).toLocaleLowerCase();
    return visibleMatch && (!query || text.includes(query));
  });
  host.replaceChildren();
  empty.hidden = filtered.length !== 0;
  if (filtered.length === 0) {
    document.querySelector('#empty-action').querySelector('span:last-child').textContent = items.length ? t('addItem') : t('addFirst');
    return;
  }
  filtered.forEach(({ item, index }) => {
    const card = document.createElement('article');
    card.className = 'content-item';
    const thumb = document.createElement('div');
    thumb.className = 'item-thumb';
    if (item.image && imageNames.includes(item.image)) {
      const img = document.createElement('img');
      img.src = './assets/projects/' + encodeURIComponent(item.image);
      img.alt = '';
      img.loading = 'lazy';
      thumb.append(img);
    } else {
      const placeholder = document.createElement('span');
      placeholder.className = 'item-placeholder';
      placeholder.textContent = activeSection === 'experience' ? '◷' : activeSection === 'about' ? '◉' : '▤';
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
    const isVisible = activeSection === 'projects' && item.visible;
    badge.className = 'item-status ' + (isVisible ? 'is-published' : 'is-draft');
    badge.textContent = isVisible ? t('statusVisible') : t('draftBadge');
    topline.append(badge);
    const meta = document.createElement('p');
    meta.className = 'item-meta';
    meta.textContent = displayMeta(item);
    const actions = document.createElement('div');
    actions.className = 'item-actions';
    actions.append(makeButton(t('edit'), 'mini-button', 'edit', item.id));
    if (activeSection === 'projects') {
      actions.append(makeButton('↑', 'mini-button icon-only', 'up', item.id, t('up')));
      actions.append(makeButton('↓', 'mini-button icon-only', 'down', item.id, t('down')));
    }
    actions.append(makeButton(t('delete'), 'mini-button delete', 'delete', item.id));
    body.append(topline, meta, actions);
    card.append(thumb, body);
    host.append(card);
  });
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
function languageGroup(fieldKey, value, options = {}) {
  const section = document.createElement('section');
  section.className = 'language-section';
  const heading = document.createElement('h3');
  heading.textContent = t('fieldFor') + ' · ' + t(fieldKey);
  section.append(heading);
  const grid = document.createElement('div');
  grid.className = 'form-grid';
  grid.append(
    field(t('english'), value?.en, { multiline: options.multiline, full: true, name: fieldKey + '.en' }),
    field(t('persian'), value?.fa, { multiline: options.multiline, full: true, name: fieldKey + '.fa' })
  );
  section.append(grid);
  return section;
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
  const empty = { en: '', fa: '' };
  if (section === 'projects') return { ...base, image: base.image || imageNames.find((img) => !data.projects.some((project) => project.image === img)) || imageNames[0], title: base.title || empty, href: base.href || '', visible: base.visible !== false };
  if (section === 'caseStudies') return { ...base, title: base.title || empty, summary: base.summary || empty, body: base.body || empty, href: base.href || '', image: base.image || '' };
  if (section === 'experience') return { ...base, role: base.role || empty, company: base.company || empty, dates: base.dates || empty, description: base.description || empty, href: base.href || '', image: base.image || '' };
  return { ...base, title: base.title || empty, body: base.body || empty, href: base.href || '', image: base.image || '' };
}
function typeCopy(section, edit) {
  return t((edit ? 'edit' : 'new') + ({ projects: 'Project', caseStudies: 'Case', experience: 'Experience', about: 'About' })[section]);
}
function openEditor(section, item = null) {
  const dialog = document.querySelector('#editor-dialog');
  const form = document.querySelector('#item-form');
  const model = itemDefaults(section, item);
  editing = { section, itemId: item?.id || model.id, isNew: !item };
  document.querySelector('#dialog-kicker').textContent = t(({ projects: 'workKicker', caseStudies: 'caseKicker', experience: 'experienceKicker', about: 'aboutKicker' })[section]);
  document.querySelector('#dialog-title').textContent = typeCopy(section, Boolean(item));
  form.replaceChildren();
  if (section === 'projects') {
    const selectOptions = imageNames.map((filename, index) => ({ value: filename, label: t('imageItem') + ' ' + new Intl.NumberFormat(language).format(index + 1) }));
    form.append(field(t('image'), model.image, { select: selectOptions, name: 'image' }));
    form.append(languageGroup('title', model.title));
    form.append(field(t('link'), model.href, { name: 'href', placeholder: 'https://…' }));
    form.append(checkbox(t('visible'), model.visible, 'visible'));
  } else if (section === 'caseStudies') {
    form.append(languageGroup('title', model.title));
    form.append(languageGroup('summary', model.summary, { multiline: true }));
    form.append(languageGroup('details', model.body, { multiline: true }));
    form.append(field(t('link'), model.href, { name: 'href', placeholder: 'https://…' }));
    form.append(field(t('image'), model.image, { select: [{ value: '', label: t('optional') }, ...imageNames.map((filename, index) => ({ value: filename, label: t('imageItem') + ' ' + new Intl.NumberFormat(language).format(index + 1) }))], name: 'image' }));
  } else if (section === 'experience') {
    form.append(languageGroup('role', model.role));
    form.append(languageGroup('company', model.company));
    form.append(languageGroup('dates', model.dates));
    form.append(languageGroup('description', model.description, { multiline: true }));
    form.append(field(t('link'), model.href, { name: 'href', placeholder: 'https://…' }));
  } else {
    form.append(languageGroup('heading', model.title));
    form.append(languageGroup('body', model.body, { multiline: true }));
    form.append(field(t('image'), model.image, { select: [{ value: '', label: t('optional') }, ...imageNames.map((filename, index) => ({ value: filename, label: t('imageItem') + ' ' + new Intl.NumberFormat(language).format(index + 1) }))], name: 'image' }));
  }
  if (dialog.open) dialog.close();
  dialog.showModal();
}
function readGroup(form, key) {
  return { en: form.elements.namedItem(key + '.en')?.value.trim() || '', fa: form.elements.namedItem(key + '.fa')?.value.trim() || '' };
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
  } else if (section === 'experience') {
    model.role = readGroup(form, 'role');
    model.company = readGroup(form, 'company');
    model.dates = readGroup(form, 'dates');
    model.description = readGroup(form, 'description');
    model.href = form.elements.namedItem('href').value.trim();
  } else {
    model.title = readGroup(form, 'heading');
    model.body = readGroup(form, 'body');
    model.image = form.elements.namedItem('image').value;
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
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, itemId } = button.dataset;
  const items = currentItems();
  const index = items.findIndex((item) => item.id === itemId);
  if (index < 0) return;
  if (action === 'edit') { openEditor(activeSection, items[index]); return; }
  if (action === 'delete') {
    if (!window.confirm(t('deleteConfirm'))) return;
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
}
function createProfileField(group, lang, labelText, value, multiline = false) {
  const controlLabel = field(labelText + ' · ' + t(lang === 'en' ? 'english' : 'persian'), value, { multiline, full: true });
  const input = controlLabel.querySelector('input, textarea');
  input.dataset.profileKey = group + '.' + lang;
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
  fields.append(createProfileField('greeting', 'en', t('greeting'), data.profile.greeting.en), createProfileField('greeting', 'fa', t('greeting'), data.profile.greeting.fa));
  fields.append(createProfileField('bio', 'en', t('biography'), data.profile.bio.en, true), createProfileField('bio', 'fa', t('biography'), data.profile.bio.fa, true));
  fields.append(createProfileField('contactPrompt', 'en', t('contactPrompt'), data.profile.contactPrompt.en, true), createProfileField('contactPrompt', 'fa', t('contactPrompt'), data.profile.contactPrompt.fa, true));
  intro.append(fields);

  const contactPanel = document.createElement('section');
  contactPanel.className = 'panel profile-card';
  const contactTitle = document.createElement('h2'); contactTitle.textContent = t('contactsTitle');
  const contactCopy = document.createElement('p'); contactCopy.textContent = t('contactsCopy');
  const headings = document.createElement('div'); headings.className = 'contact-headings';
  for (const text of [t('labelEnglish'), t('destination'), t('labelPersian')]) { const span = document.createElement('span'); span.textContent = text; headings.append(span); }
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
  const en = document.createElement('input'); en.value = contact.label?.en || ''; en.placeholder = t('english'); en.dataset.contactField = 'label.en'; en.setAttribute('aria-label', t('labelEnglish'));
  const url = document.createElement('input'); url.value = contact.href || ''; url.placeholder = t('destination'); url.dataset.contactField = 'href'; url.setAttribute('aria-label', t('destination'));
  const fa = document.createElement('input'); fa.value = contact.label?.fa || ''; fa.placeholder = t('persian'); fa.dataset.contactField = 'label.fa'; fa.setAttribute('aria-label', t('labelPersian'));
  const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'contact-remove'; remove.textContent = '×'; remove.dataset.action = 'remove-contact'; remove.dataset.contactIndex = String(index); remove.setAttribute('aria-label', t('delete'));
  row.append(en, url, fa, remove);
  return row;
}
function saveProfile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  for (const input of form.querySelectorAll('[data-profile-key]')) {
    const [key, lang] = input.dataset.profileKey.split('.');
    data.profile[key][lang] = input.value.trim();
  }
  const rows = [...form.querySelectorAll('.contact-editor-row')];
  const newContacts = rows.map((row) => ({
    id: row.dataset.contactId || id(),
    label: { en: row.querySelector('[data-contact-field="label.en"]').value.trim(), fa: row.querySelector('[data-contact-field="label.fa"]').value.trim() },
    href: row.querySelector('[data-contact-field="href"]').value.trim()
  })).filter((contact) => contact.label.en || contact.label.fa || contact.href);
  if (newContacts.some((contact) => !validHref(contact.href))) { showToast(t('badLink')); return; }
  data.contactLinks = newContacts;
  saveData('savedToast');
}
function renderSection() {
  updateHeadings();
  if (activeSection === 'overview') { updateCounts(); return; }
  if (activeSection === 'profile') { renderProfile(); return; }
  if (activeSection === 'settings') return;
  renderItems();
}
function setSection(section) {
  activeSection = section;
  renderSection();
  document.querySelector('#sidebar').classList.remove('is-open');
  document.querySelector('#mobile-menu').setAttribute('aria-expanded', 'false');
}
function addNew() {
  const section = activeSection === 'overview' ? 'caseStudies' : activeSection;
  if (section === 'profile' || section === 'settings' || section === 'overview') return;
  if (section === 'projects' && !imageNames.length) { showToast(t('noImageAvailable')); return; }
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
  storage.removeItem(CONTENT_KEY);
  data = initialData();
  saveData('resetDone');
  renderSection();
}

document.querySelectorAll('[data-section]').forEach((button) => button.addEventListener('click', () => setSection(button.dataset.section)));
document.querySelector('#primary-action').addEventListener('click', addNew);
document.querySelector('#empty-action').addEventListener('click', addNew);
document.querySelector('#items-grid').addEventListener('click', handleCardAction);
document.querySelector('#item-form').addEventListener('submit', handleItemSave);
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
    const newContact = { id: id(), label: { en: '', fa: '' }, href: '' };
    list.append(makeContactRow(newContact, list.children.length));
    return;
  }
  if (button.dataset.action === 'remove-contact') button.closest('.contact-editor-row').remove();
});
document.querySelector('#close-dialog').addEventListener('click', () => document.querySelector('#editor-dialog').close());
document.querySelector('#cancel-dialog').addEventListener('click', () => document.querySelector('#editor-dialog').close());
document.querySelector('#editor-dialog').addEventListener('close', () => { editing = null; });
document.querySelector('#language-toggle').addEventListener('click', () => setLanguage(language === 'en' ? 'fa' : 'en'));
document.querySelector('#settings-language').addEventListener('click', () => setLanguage(language === 'en' ? 'fa' : 'en'));
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
updateCounts();
