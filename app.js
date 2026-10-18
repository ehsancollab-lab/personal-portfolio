import { companyLinks, contactLinks, copy, projects } from "./content.js";
import { caseStudyAssets, defaultCaseStudies, defaultExperience } from "./case-content.js";

import { responsiveImage } from "./images.js";
import { caseCard } from "./case-cards.js";
import { normalizeStoryDoc } from "./story-model.js";
import { renderStory } from "./story-render.js";
import { publishedContent } from "./published-content.js";
import { animateTypography } from "./typography.js";
import { createSiteHeader } from "./site-shell.js";

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
  anchor.textContent = label;
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
  const managedBio = contentOverride?.profile?.bio;
  if (managedBio != null) {
    const value = text(managedBio);
    const names = Object.entries(copy.companyNames);
    const pattern = new RegExp('(' + names.map(([, name]) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
    bio.replaceChildren(...value.split(pattern).map((part) => {
      const found = names.find(([, name]) => name === part);
      return found ? externalAnchor(companyLinks[found[0]], part) : document.createTextNode(part);
    }));
    return;
  }
  const nodes = copy.bioSegments.map((segment) => {
    if (segment.text !== undefined) return document.createTextNode(segment.text);
    const key = segment.link;
    return externalAnchor(companyLinks[key], copy.companyNames[key]);
  });
  bio.replaceChildren(...nodes);
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
  responsiveImage(image, assetPath(project.image), { eager: index < 2, priority: index === 0, sizes: "(max-width: 700px) calc(100vw - 40px), (max-width: 1536px) calc((100vw - 156px) / 2), 690px" });
  image.alt = text(project.title).trim() || copy.projectAlt + " " + (index + 1);

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
    empty.textContent = "No case studies yet.";
    list.append(empty);
    return;
  }
  items.forEach((item, index) => list.append(caseCard(item, { resolveImage: assetPath, eager: index < 2, href: "./case-study.html?id=" + encodeURIComponent(item.id) })));
  if (items.length % 2 === 1) {
    const placeholder = caseCard({ id: 'coming-soon', title: 'New case studies will be displayed here soon.', summary: 'Since symmetry is really important to me and visual asymmetry bothers me, I’ve added a sample card here for now.' });
    placeholder.classList.add('case-study-card-placeholder');
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
    empty.textContent = "No experience entries yet.";
    list.append(empty);
    return;
  }
  items.forEach((item) => {
    const entry = document.createElement("article");
    entry.className = "experience-entry";

    const heading = document.createElement("div");
    heading.className = "experience-heading";
    const roleAndCompany = document.createElement("div");
    roleAndCompany.className = "experience-title-line";
    const role = document.createElement("h3");
    role.textContent = text(item.role);
    const company = document.createElement("p");
    company.className = "experience-company";
    company.textContent = text(item.company);
    roleAndCompany.append(role, company);
    const dates = document.createElement("p");
    dates.className = "experience-dates";
    dates.textContent = text(item.dates);
    heading.append(roleAndCompany, dates);

    const description = document.createElement("ul");
    description.className = "experience-bullets";
    text(item.description).split(/\r?\n/).map((bullet) => bullet.replace(/^\s*[-•]\s*/, "").trim()).filter(Boolean).forEach((bullet) => {
      const li = document.createElement("li");
      li.textContent = bullet;
      description.append(li);
    });
    entry.append(heading, description);
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
  backLabel.textContent = "Back to Home";
  back.append(icon, backLabel);

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
    empty.textContent = "This case study is unavailable.";
    host.append(empty);
    return;
  }

  const article = document.createElement("article");
  article.className = "case-detail-article";
  const title = document.createElement("h1");
  title.className = "case-detail-title";
  title.textContent = text(item.title);
  const body = document.createElement("div");
  body.className = "case-article-body";
  renderStory(body, item.document, { body: item.body, resolveImage: assetPath });
  article.append(title, body);
  if (item.href && validHref(item.href)) {
    const projectLink = externalAnchor(item.href, "Visit project");
    projectLink.className = "case-project-link";
    article.append(projectLink);
  }
  host.append(article);
  document.title = text(item.title) + " — Ehsan Masoomi";
  document.querySelector('meta[name="description"]').content = text(item.summary);
}

function renderHeaderAndFooter() {
  root.lang = "en";
  root.dir = "ltr";
  const greeting = document.querySelector("#greeting");
  if (greeting) greeting.textContent = contentOverride?.profile?.greeting == null ? copy.greeting : text(contentOverride.profile.greeting);
  const contactPrompt = document.querySelector("#contact-prompt");
  if (contactPrompt) contactPrompt.textContent = contentOverride?.profile?.contactPrompt == null ? copy.contactPrompt : text(contentOverride.profile.contactPrompt);
  renderBio();
  renderLinks(document.querySelector("#header-contact-links"));
  renderLinks(document.querySelector("#footer-contact-links"));
  const copyrightYear = document.querySelector("#copyright-year");
  if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());

  const current = page === "case-study" ? "case-studies" : page;
  document.querySelectorAll("[data-page-link]").forEach((link) => {
    const selected = link.dataset.pageLink === current;
    link.classList.toggle("is-current", selected);
    if (selected) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.querySelector(".primary-nav")?.setAttribute("aria-label", "Portfolio sections");
  document.querySelector(".contact-block")?.setAttribute("aria-label", "Contact information");
  document.querySelector(".display-controls")?.setAttribute("aria-label", "Display settings");
}

function updateTheme() {
  const dark = theme === "dark";
  root.dataset.theme = theme;
  document.querySelectorAll(".theme-toggle").forEach((toggle) => {
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    const image = toggle.querySelector('img');
    if (image) {
      image.src = dark ? './assets/ui/sun-fill.svg' : './assets/figma/theme-toggle.svg';
      image.width = dark ? 20 : 32;
      image.height = dark ? 20 : 32;
    }
    toggle.title = dark ? "Switch to light theme" : "Switch to dark theme";
  });
  document.querySelector('meta[name="theme-color"]').content = dark ? "#131315" : "#ffffff";
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
const initialMain = document.querySelector('main');
const routeKey = (url = new URL(location.href)) => routeFor(url) + url.search;
function routeFor(url) {
  const filename = url.pathname.replace(/\/$/, '').split('/').pop().replace(/\.html$/, '');
  return ({ '': 'selected-work', index: 'selected-work', 'case-studies': 'case-studies', experience: 'experience', 'case-study': 'case-study' })[filename] || null;
}
function makePage(next) {
  const main = document.createElement('main');
  main.tabIndex = -1;
  const config = {
    'selected-work': ['work-section', 'selected-work', '<h2 class="visually-hidden">Selected Work</h2><div class="project-grid" id="project-grid" aria-label="Selected work"></div>'],
    'case-studies': ['case-studies-section', 'case-studies-content', '<h2 class="visually-hidden">Case Studies</h2><div class="case-studies-list" id="case-studies-list" aria-label="Case studies"></div>'],
    experience: ['experience-section', 'experience-content', '<h2 class="visually-hidden">Experience</h2><div class="experience-list" id="experience-list" aria-label="Experience"></div>'],
    'case-study': ['case-detail-section', 'case-study-content', '<div class="case-detail" id="case-detail"></div>']
  }[next];
  main.className = config[0]; main.id = config[1]; main.innerHTML = config[2];
  return main;
}
function renderPage(next, fresh = false) {
  page = next;
  document.body.dataset.page = next;
  if (next === 'case-study') sharedHeader.remove();
  else if (!sharedHeader.isConnected) document.querySelector('main').before(sharedHeader);
  const key = routeKey();
  let main = pageViews.get(key);
  const newView = !main || fresh;
  if (newView) { main = fresh ? makePage(next) : pageViews.size === 0 ? initialMain : makePage(next); pageViews.set(key, main); }
  if (document.querySelector('main') !== main) document.querySelector('main').replaceWith(main);
  renderHeaderAndFooter();
  if (newView) {
    if (next === 'selected-work') renderProjects();
    if (next === 'case-studies') renderCaseStudies();
    if (next === 'experience') renderExperience();
    if (next === 'case-study') renderCaseStudyDetails();
  }
  if (next !== 'case-study') {
    document.title = next === 'selected-work' ? 'Ehsan Masoomi — Senior AI Product Designer' : (next === 'case-studies' ? 'Case Studies' : 'Experience') + ' — Ehsan Masoomi';
    document.querySelector('meta[name="description"]').content = next === 'selected-work' ? 'Ehsan Masoomi — Senior AI Product Designer.' : document.title;
  } else if (!newView) renderCaseStudyDetails();
  const skip = document.querySelector('.skip-link');
  skip.href = '#' + main.id; skip.textContent = 'Skip to main content';
  updateTheme();
  animateTypography(main);
  return main;
}
let currentRoute = routeKey();
renderPage(page);
animateTypography(sharedHeader);
function navigate(url, push = true) {
  const next = routeFor(url);
  if (!next || (push && url.href === location.href && next === page)) return;
  scrollPositions.set(currentRoute, scrollY);
  if (push) history.pushState({}, '', url.href);
  const main = renderPage(next);
  currentRoute = routeKey(url);
  window.scrollTo({ top: push ? 0 : scrollPositions.get(currentRoute) || 0, behavior: 'instant' });
  main.focus({ preventScroll: true });
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || !routeFor(url) || (url.pathname === location.pathname && url.search === location.search && url.hash)) return;
  event.preventDefault(); navigate(url);
});
window.addEventListener('popstate', () => navigate(new URL(location.href), false));
history.scrollRestoration = 'manual';
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
