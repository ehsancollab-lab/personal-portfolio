import { companyLinks, contactLinks, copy, projects } from "./content.js";
import { caseStudyAssets, defaultCaseStudies, defaultExperience } from "./case-content.js";

import { responsiveImage } from "./images.js";
import { caseCard } from "./case-cards.js";
import { normalizeStoryDoc } from "./story-model.js";
import { renderStory } from "./story-render.js";
import { publishedContent } from "./published-content.js";
import { animateTypography } from "./typography.js";
import { createSiteHeader } from "./site-shell.js";
import { renderLibrary, transitionLibrary, cancelLibraryTransition, libraryPages } from './library.js';
import { mountPageMotion, motionRuntime, transitionPage, cancelPageTransition } from './motion.js';
import { initSmoothScroll, scrollToPosition, scrollToSection } from './smooth-scroll.js';
import { getLocale, setLocale, localizeText, number, phrase, syncLanguageControls } from './i18n.js';
import { mountViewportBlur } from './viewport-blur.js';
import { createFloatingNavigation } from './floating-navigation.js';
import { mountPointerFeedback } from './pointer-feedback.js';

const root = document.documentElement;
let page = document.body.dataset.page || "selected-work";
const projectAssets = [...projects];

const safeStorage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* Storage may be unavailable in private contexts. */ }
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultContent() {
  return {
    version: 3,
    profile: {
      greeting: copy.greeting,
      bio: copy.bioSegments
        .map((segment) => segment.text !== undefined ? segment.text : copy.companyNames[segment.link])
        .join(""),
      contactPrompt: copy.contactPrompt,
    },
    projects: projects.map((image, index) => ({ id: String(index + 1), image, title: "", visible: true })),
    caseStudies: clone(defaultCaseStudies),
    experience: clone(defaultExperience),
    contactLinks: contactLinks.map(({ key, href }) => ({ id: key, label: copy.links[key], href })),
  };
}

function text(value) {
  return typeof value === "string" ? value : String(value?.en || "");
}
const displayText = value => localizeText(text(value));

function validHref(value) {
  const href = String(value || "").trim();
  return /^(https:\/\/|mailto:|tel:|\/|\.\/|#)/i.test(href) && !/^\/\//.test(href);
}

function validImageDataUrl(value) {
  return typeof value === "string" && value.length <= 900000 && /^data:image\/(?:png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function validUploadedImage(value) {
  return typeof value === 'string' && /^uploads\/[a-f0-9]{64}\.(?:png|jpg|webp|gif|avif)$/.test(value);
}

function normalizeContent(candidate) {
  if (!candidate || ![1, 2, 3].includes(candidate.version) || !Array.isArray(candidate.projects) || !Array.isArray(candidate.caseStudies) || !Array.isArray(candidate.experience) || !Array.isArray(candidate.contactLinks)) return null;
  const defaults = defaultContent();
  const normalizeItem = (item, fields) => ({
    id: String(item.id || ""),
    ...Object.fromEntries(fields.map((field) => [field, text(item[field])])),
    href: validHref(item.href) ? String(item.href || "") : "",
    image: [...projectAssets, ...caseStudyAssets].includes(item.image) || validImageDataUrl(item.image) || validUploadedImage(item.image) ? String(item.image) : "",
    visible: item.visible !== false,
  });
  const caseStudies = candidate.caseStudies.map((item) => {
    const normalized = normalizeItem(item, ["title", "summary", "body"]);
    try { normalized.document = normalizeStoryDoc(item.document); } catch { normalized.document = null; }
    return normalized;
  });
  const experience = candidate.experience.map((item) => normalizeItem(item, ["role", "company", "dates", "description"]));
  return {
    version: 3,
    profile: {
      greeting: candidate.profile?.greeting == null ? defaults.profile.greeting : text(candidate.profile.greeting),
      bio: candidate.profile?.bio == null ? defaults.profile.bio : text(candidate.profile.bio),
      contactPrompt: candidate.profile?.contactPrompt == null ? defaults.profile.contactPrompt : text(candidate.profile.contactPrompt),
    },
    projects: candidate.projects.map((item, index) => ({
      id: String(item.id || String(index + 1)),
      image: projectAssets.includes(item.image) || validImageDataUrl(item.image) || validUploadedImage(item.image) ? String(item.image) : projectAssets[index % projectAssets.length],
      title: text(item.title),
      href: validHref(item.href) ? String(item.href || "") : "",
      visible: item.visible !== false,
    })),
    caseStudies: candidate.version < 3 && caseStudies.length === 0 ? clone(defaults.caseStudies) : caseStudies,
    experience: candidate.version < 3 && experience.length === 0 ? clone(defaults.experience) : experience,
    contactLinks: candidate.contactLinks.map((item) => ({
      id: String(item.id || ""),
      label: text(item.label),
      href: validHref(item.href) ? String(item.href || "") : "",
    })),
  };
}

let contentOverride = normalizeContent(publishedContent);

let theme = safeStorage.get("ehsan-portfolio-theme") === "dark" ? "dark" : "light";

function content() {
  return contentOverride || defaultContent();
}

function externalAnchor(href, label) {
  const anchor = document.createElement("a");
  const safeHref = validHref(href);
  anchor.href = safeHref ? href : "#";
  anchor.textContent = localizeText(label);
  anchor.dir = 'auto';
  if (String(href).startsWith("https://")) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
  return anchor;
}

function renderLinks(target) {
  if (!target) return;
  const managed = contentOverride?.contactLinks;
  const links = managed
    ? managed.map(({ href, label }) => ({ href, label: text(label) })).filter(({ label, href }) => label && href)
    : contactLinks.map(({ key, href }) => ({ href, label: copy.links[key] }));
  target.replaceChildren(...links.map(({ href, label }) => externalAnchor(href, label)));
}

function renderBio() {
  const bio = document.querySelector("#bio");
  if (!bio) return;
  const value = displayText(contentOverride?.profile?.bio ?? copy.bioSegments.map(segment => segment.text ?? copy.companyNames[segment.link]).join(''));
  const names = Object.entries(copy.companyNames);
  const pattern = new RegExp('(' + names.map(([, name]) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
  bio.replaceChildren(...value.split(pattern).map((part) => {
    const found = names.find(([, name]) => name === part);
    return found ? externalAnchor(companyLinks[found[0]], part) : document.createTextNode(part);
  }));
}

function assetPath(name) {
  const asset = String(name || "");
  if (validImageDataUrl(asset)) return asset;
  if (validUploadedImage(asset)) return './assets/' + asset;
  if (projectAssets.includes(asset)) return "./assets/projects/" + encodeURIComponent(asset);
  if (caseStudyAssets.includes(asset)) return "./assets/case-studies/" + encodeURIComponent(asset);
  return "";
}

function createProjectCard(project, index) {
  const figure = document.createElement("figure");
  figure.className = "project-card";
  figure.setAttribute("role", "listitem");
  const image = document.createElement("img");
  responsiveImage(image, assetPath(project.image), { eager: index < 2, priority: index === 0, sizes: "(max-width: 420px) calc(100vw - 32px), (max-width: 700px) calc(100vw - 40px), (max-width: 1920px) 70.8vw, 1360px" });
  image.alt = displayText(project.title).trim() || phrase('Selected work preview {n}', 'پیش‌نمایش کار منتخب {n}', { n: number(index + 1) });

  image.decoding = "async";
  image.loading = index < 2 ? "eager" : "lazy";
  figure.append(image);

  if (validHref(project.href)) {
    const link = document.createElement("a");
    link.className = "project-card-link";
    link.href = project.href;
    if (project.href.startsWith("https://")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    link.setAttribute("aria-label", image.alt);
    link.append(figure);
    return link;
  }
  return figure;
}

function renderProjects() {
  const grid = document.querySelector("#project-grid");
  const managed = contentOverride?.projects;
  const items = managed
    ? managed.filter((item) => item.visible !== false && (projectAssets.includes(item.image) || validImageDataUrl(item.image) || validUploadedImage(item.image)))
    : projects.map((image, index) => ({ id: String(index), image, visible: true }));
  grid.setAttribute("role", "list");
  grid.replaceChildren(...items.map(createProjectCard));
}

function renderCaseStudies() {
  const list = document.querySelector("#case-studies-list");
  if (!list) return;
  const items = content().caseStudies.filter((item) => item.visible !== false);
  list.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-page-message";
    empty.textContent = localizeText('No case studies yet.');
    list.append(empty);
    return;
  }
  items.forEach((item, index) => list.append(caseCard({ ...item, title: displayText(item.title) || localizeText('Untitled case study'), summary: displayText(item.summary) }, { resolveImage: assetPath, eager: index < 2, href: "./case-study.html?id=" + encodeURIComponent(item.id) })));
  if (items.length % 2 === 1) {
    const placeholder = caseCard({ id: 'coming-soon', title: 'New case studies will be displayed here soon.', summary: 'Since symmetry is really important to me and visual asymmetry bothers me, I’ve added a sample card here for now.' });
    placeholder.classList.add('case-study-card-placeholder');
    placeholder.querySelector('.case-study-card-title').textContent = localizeText(placeholder.querySelector('.case-study-card-title').textContent);
    placeholder.querySelector('.case-study-card-summary').textContent = localizeText(placeholder.querySelector('.case-study-card-summary').textContent);
    list.append(placeholder);
  }
}

function renderExperience() {
  const list = document.querySelector("#experience-list");
  if (!list) return;
  const items = content().experience.filter((item) => item.visible !== false);
  list.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-page-message";
    empty.textContent = localizeText('No experience entries yet.');
    list.append(empty);
    return;
  }
  list.setAttribute('aria-label', localizeText('Experience'));
  const track = document.createElement('span');
  track.className = 'experience-track'; track.setAttribute('aria-hidden', 'true');
  track.append(document.createElement('span'));
  list.append(track);
  items.forEach((item) => {
    const entry = document.createElement("article");
    entry.className = "experience-entry";
    const dates = document.createElement('div');
    dates.className = 'experience-dates';
    const year = document.createElement('span'); year.className = 'experience-year';
    const firstYear = text(item.dates).match(/\b(19|20)\d{2}\b/)?.[0];
    year.textContent = firstYear ? number(Number(firstYear)) : '';
    const range = document.createElement('span'); range.className = 'experience-date-range';
    range.textContent = displayText(item.dates);
    dates.append(year, range);
    const dot = document.createElement('span'); dot.className = 'experience-dot'; dot.setAttribute('aria-hidden', 'true');
    const body = document.createElement('div'); body.className = 'experience-body';
    const logo = document.createElement('span'); logo.className = 'experience-logo experience-logo-placeholder';
    logo.dir = 'ltr'; logo.setAttribute('aria-hidden', 'true');
    logo.textContent = /^mors/i.test(item.company) ? 'M' : /^nibex/i.test(item.company) ? 'N' : /^remocapp/i.test(item.company) ? 'R' : text(item.company).slice(0, 1);
    const heading = document.createElement("div");
    heading.className = "experience-heading";
    const role = document.createElement("p"); role.className = 'experience-role';
    role.textContent = displayText(item.role);
    const company = document.createElement("h3");
    company.className = "experience-company";
    company.textContent = displayText(item.company);
    heading.append(company, role);

    const description = document.createElement("ul");
    description.className = "experience-bullets";
    text(item.description).split(/\r?\n/).map((bullet) => bullet.replace(/^\s*[-•]\s*/, "").trim()).filter(Boolean).forEach((bullet) => {
      const li = document.createElement("li");
      li.textContent = localizeText(bullet);
      description.append(li);
    });
    body.append(logo, heading, description);
    entry.append(dates, dot, body);
    list.append(entry);
  });
}

function renderCaseStudyDetails() {
  const host = document.querySelector("#case-detail");
  if (!host) return;
  const items = content().caseStudies.filter((item) => item.visible !== false);
  const id = new URLSearchParams(window.location.search).get("id");
  const item = items.find((candidate) => candidate.id === id) || (!id ? items[0] : null);
  host.replaceChildren();

  const toolbar = document.createElement("div");
  toolbar.className = "case-detail-toolbar";

  const back = document.createElement("a");
  back.className = "case-back-link";
  back.href = "./index.html";
  const icon = document.createElement("span");
  icon.className = "case-back-icon";
  icon.setAttribute("aria-hidden", "true");
  const iconImage = document.createElement("img");
  iconImage.src = "./assets/figma/arrow-left.svg";
  iconImage.width = 20;
  iconImage.height = 20;
  iconImage.alt = "";
  icon.append(iconImage);
  const backLabel = document.createElement("span");
  backLabel.textContent = localizeText('Back to Home');
  back.append(icon, backLabel);
  const shortcut = document.createElement('kbd'); shortcut.className = 'back-shortcut'; shortcut.textContent = 'ESC'; shortcut.setAttribute('aria-hidden', 'true');
  back.append(shortcut); back.setAttribute('aria-keyshortcuts', 'Escape');

  const themeToggle = document.createElement("button");
  themeToggle.className = "theme-toggle detail-theme-toggle";
  themeToggle.type = "button";
  themeToggle.setAttribute("aria-pressed", "false");
  const themeIcon = document.createElement("img");
  themeIcon.src = "./assets/figma/theme-toggle.svg";
  themeIcon.width = 32;
  themeIcon.height = 32;
  themeIcon.alt = "";
  themeToggle.append(themeIcon);
  toolbar.append(back, themeToggle);
  host.append(toolbar);

  if (!item) {
    const empty = document.createElement("p");
    empty.className = "case-detail-empty";
    empty.textContent = localizeText('This case study is unavailable.');
    host.append(empty);
    document.title = localizeText('This case study is unavailable.') + ' — ' + localizeText('Ehsan Masoomi');
    document.querySelector('meta[name="description"]').content = localizeText('This case study is unavailable.');
    return;
  }

  const article = document.createElement("article");
  article.className = "case-detail-article";
  const title = document.createElement("h1");
  title.className = "case-detail-title";
  title.textContent = displayText(item.title);
  const body = document.createElement("div");
  body.className = "case-article-body";
  renderStory(body, item.document, { body: item.body, resolveImage: assetPath, translate: localizeText });
  article.append(title, body);
  if (item.href && validHref(item.href)) {
    const projectLink = externalAnchor(item.href, "Visit project");
    projectLink.className = "case-project-link";
    article.append(projectLink);
  }
  host.append(article);
  document.title = displayText(item.title) + ' — ' + localizeText('Ehsan Masoomi');
  document.querySelector('meta[name="description"]').content = displayText(item.summary);
}

function renderHeaderAndFooter() {
  root.lang = getLocale();
  root.dir = getLocale() === 'fa' ? 'rtl' : 'ltr';
  const greeting = document.querySelector("#greeting");
  if (greeting) greeting.textContent = displayText(contentOverride?.profile?.greeting ?? copy.greeting);
  const contactPrompt = document.querySelector("#contact-prompt");
  if (contactPrompt) contactPrompt.textContent = displayText(contentOverride?.profile?.contactPrompt ?? copy.contactPrompt);
  renderBio();
  renderLinks(document.querySelector("#header-contact-links"));
  renderLinks(document.querySelector("#footer-contact-links"));
  const copyrightYear = document.querySelector("#copyright-year");
  if (copyrightYear) copyrightYear.textContent = number(new Date().getFullYear());
  const copyright = document.querySelector('.copyright');
  if (copyright?.lastElementChild) copyright.lastElementChild.textContent = ' ' + localizeText('Ehsan Masoomi');
  const cv = document.querySelector('#cv-label'); if (cv) cv.textContent = localizeText('Download CV');
  document.querySelector('.avatar-mark')?.setAttribute('aria-label', localizeText('Ehsan Masoomi'));

  const current = page === "case-study" ? "case-studies" : libraryPages.has(page) ? 'about' : page;
  document.querySelectorAll("[data-page-link]").forEach((link) => {
    link.textContent = localizeText({ 'selected-work': 'Selected Work', 'case-studies': 'Case Studies', experience: 'Experience', about: 'About Me' }[link.dataset.pageLink]);
    const selected = link.dataset.pageLink === current;
    link.classList.toggle("is-current", selected);
    if (selected) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.querySelector('.primary-nav')?.setAttribute('aria-label', localizeText('Portfolio sections'));
  document.querySelector('.primary-nav')?.setAttribute('data-scroll-native', '');
  document.querySelector('.contact-block')?.setAttribute('aria-label', localizeText('Contact information'));
  document.querySelector('.display-controls')?.setAttribute('aria-label', localizeText('Display settings'));
  document.querySelectorAll('.contact-links').forEach(nav => nav.setAttribute('aria-label', localizeText('Contact links')));
}

function updateTheme() {
  const dark = theme === "dark";
  root.dataset.theme = theme;
  document.querySelectorAll(".theme-toggle").forEach((toggle) => {
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.setAttribute('aria-label', localizeText(dark ? 'Switch to light theme' : 'Switch to dark theme'));
    const image = toggle.querySelector('img');
    if (image) {
      image.src = dark ? './assets/ui/sun-fill.svg' : './assets/figma/theme-toggle.svg';
      image.width = dark ? 20 : 32;
      image.height = dark ? 20 : 32;
    }
    toggle.title = localizeText(dark ? 'Switch to light theme' : 'Switch to dark theme');
  });
  document.querySelector('meta[name="theme-color"]').content = dark ? "#131315" : page === "case-study" ? "#fdfdfd" : "#ffffff";
  safeStorage.set("ehsan-portfolio-theme", theme);
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".theme-toggle")) return;
  theme = theme === "light" ? "dark" : "light";
  updateTheme();
});

const pageViews = new Map();
const scrollPositions = new Map();
const sharedHeader = document.querySelector('.site-header') || createSiteHeader();
const floatingNavigation = createFloatingNavigation(sharedHeader.querySelector('.primary-nav'));
const initialMain = document.querySelector('main');
const routeKey = (url = new URL(location.href)) => routeFor(url) + url.search + '::' + getLocale();
function routeFor(url) {
  const filename = url.pathname.replace(/\/$/, '').split('/').pop().replace(/\.html$/, '');
  return ({ '': 'selected-work', index: 'selected-work', 'case-studies': 'case-studies', experience: 'experience', 'case-study': 'case-study', about: 'about', books: 'books', book: 'book' })[filename] || null;
}
function makePage(next) {
  const main = document.createElement('main');
  main.tabIndex = -1;
  const config = {
    'selected-work': ['work-section', 'selected-work', '<h2 class="visually-hidden">Selected Work</h2><div class="project-grid" id="project-grid" aria-label="Selected work"></div>'],
    'case-studies': ['case-studies-section', 'case-studies-content', '<h2 class="visually-hidden">Case Studies</h2><div class="case-studies-list" id="case-studies-list" aria-label="Case studies"></div>'],
    experience: ['experience-section', 'experience-content', '<h2 class="visually-hidden">Experience</h2><div class="experience-list" id="experience-list" aria-label="Experience"></div>'],
    'case-study': ['case-detail-section', 'case-study-content', '<div class="case-detail" id="case-detail"></div>'],
    about: ['about-section', 'about-content', ''],
    books: ['library-section', 'library-content', ''],
    book: ['library-section', 'library-content', '']
  }[next];
  main.className = config[0]; main.id = config[1]; main.innerHTML = config[2];
  return main;
}
function renderPage(next, fresh = false) {
  page = next;
  root.dataset.page = next;
  document.body.dataset.page = next;
  if (['case-study', 'books', 'book'].includes(next)) sharedHeader.remove();
  else if (!sharedHeader.isConnected) document.querySelector('main').before(sharedHeader);
  const key = routeKey();
  let main = pageViews.get(key);
  const newView = !main || fresh;
  if (newView) { main = fresh ? makePage(next) : pageViews.size === 0 ? initialMain : makePage(next); pageViews.set(key, main); }
  if (document.querySelector('main') !== main) document.querySelector('main').replaceWith(main);
  renderHeaderAndFooter();
  floatingNavigation.update(!['case-study', 'books', 'book'].includes(next));
  if (newView) {
    if (next === 'selected-work') renderProjects();
    if (next === 'case-studies') renderCaseStudies();
    if (next === 'experience') renderExperience();
    if (next === 'case-study') renderCaseStudyDetails();
  }
  if (libraryPages.has(next)) {
    // Refresh the metadata of cached views without discarding their search state.
    if (newView) renderLibrary(main, next);
    else { document.title = main.dataset.documentTitle; document.querySelector('meta[name="description"]').content = main.dataset.documentDescription; }
    main.dataset.documentTitle = document.title;
    main.dataset.documentDescription = document.querySelector('meta[name="description"]').content;
  } else if (next !== 'case-study') {
    document.title = next === 'selected-work' ? localizeText('Ehsan Masoomi') + ' — ' + localizeText('Senior AI Product Designer') : localizeText(next === 'case-studies' ? 'Case Studies' : 'Experience') + ' — ' + localizeText('Ehsan Masoomi');
    document.querySelector('meta[name="description"]').content = document.title;
  } else if (!newView) renderCaseStudyDetails();
  const skip = document.querySelector('.skip-link');
  skip.href = '#' + main.id; skip.textContent = localizeText('Skip to main content');
  main.querySelector('.visually-hidden')?.replaceChildren(document.createTextNode(localizeText({ 'selected-work': 'Selected Work', 'case-studies': 'Case Studies', experience: 'Experience' }[next] || '')));
  main.querySelector('#project-grid')?.setAttribute('aria-label', localizeText('Selected Work'));
  main.querySelector('#case-studies-list')?.setAttribute('aria-label', localizeText('Case Studies'));
  syncLanguageControls();
  updateTheme();
  animateTypography(main);
  mountPageMotion(main, next);
  requestAnimationFrame(ensureActiveNavVisible);
  return main;
}
function ensureActiveNavVisible() {
  const nav = document.querySelector('.primary-nav'); const active = nav?.querySelector('[aria-current="page"]');
  if (!active) return;
  const frame = nav.getBoundingClientRect(), item = active.getBoundingClientRect();
  if (item.left < frame.left) nav.scrollBy({ left: item.left - frame.left - 4, behavior: 'instant' });
  else if (item.right > frame.right) nav.scrollBy({ left: item.right - frame.right + 4, behavior: 'instant' });
}
window.addEventListener('resize', () => requestAnimationFrame(ensureActiveNavVisible), { passive: true });
document.fonts?.addEventListener('loadingdone', ensureActiveNavVisible);
let currentRoute = routeKey();
let currentURL = new URL(location.href);
let navigationVersion = 0;
renderPage(page);
animateTypography(sharedHeader);
document.addEventListener('click', event => {
  const button = event.target.closest('[data-language]');
  if (!button || button.dataset.language === getLocale()) return;
  const position = scrollY;
  scrollPositions.set(currentRoute, position); navigationVersion++; cancelLibraryTransition(); cancelPageTransition();
  setLocale(button.dataset.language); currentRoute = routeKey();
  renderPage(page); scrollToPosition(position);
  document.querySelector('[data-language="' + getLocale() + '"]')?.focus({ preventScroll: true });
  document.fonts.ready.then(() => { motionRuntime.scrollTrigger.refresh(); ensureActiveNavVisible(); });
});
function navigate(url, push = true, trigger = null) {
  const next = routeFor(url);
  if (!next || (push && url.href === location.href && next === page)) return;
  const version = ++navigationVersion;
  scrollPositions.set(currentRoute, scrollY);
  scrollToPosition(scrollY);
  const swap = () => {
    if (version !== navigationVersion) return false;
    if (push) history.pushState({}, '', url.href);
    const main = renderPage(next);
    currentRoute = routeKey(url);
    currentURL = new URL(url.href);
    const restore = !push || trigger?.hasAttribute('data-restore-scroll');
    scrollToPosition(restore ? scrollPositions.get(currentRoute) || 0 : 0);
    main.focus({ preventScroll: true });
    return true;
  };
  if (libraryPages.has(page) && libraryPages.has(next)) { cancelPageTransition(); transitionLibrary(currentURL, url, trigger, swap); }
  else { cancelLibraryTransition(); transitionPage(document.querySelector('main'), swap); }
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
  const href = link.getAttribute('href');
  const url = new URL(href?.startsWith('#') ? href : link.href, location.href);
  if (url.origin !== location.origin || !routeFor(url)) return;
  if (routeKey(url) === currentRoute && url.hash) {
    let id;
    try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    history.replaceState(history.state, '', url.href);
    currentURL = new URL(url.href);
    scrollToSection(target, { immediate: link.classList.contains('skip-link') });
    return;
  }
  event.preventDefault(); navigate(url, true, link);
});
window.addEventListener('popstate', () => navigate(new URL(location.href), false));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]') || event.target.closest('input, textarea, [contenteditable="true"]')) return;
  const back = document.querySelector('.library-back, .case-back-link');
  if (back) { event.preventDefault(); back.click(); }
});
history.scrollRestoration = 'manual';
initSmoothScroll(motionRuntime);
mountViewportBlur();
mountPointerFeedback();
// Revalidate in the background; the build embeds content for an immediate first render.
(async () => {
  try {
    const response = await fetch(new URL('./data/portfolio.json', import.meta.url), { cache: 'no-cache', signal: AbortSignal.timeout(8000) });
    if (!response.ok) return;
    const latest = normalizeContent(await response.json());
    if (latest && JSON.stringify(latest) !== JSON.stringify(contentOverride)) {
      contentOverride = latest; pageViews.clear(); renderPage(page, true);
    }
  } catch { /* The embedded portfolio works offline or with a slow content request. */ }
})();

window.addEventListener("storage", (event) => {
  if (event.key === "ehsan-portfolio-theme") {
    theme = event.newValue === "dark" ? "dark" : "light";
    updateTheme();
  }
});
