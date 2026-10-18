import { companyLinks, contactLinks, copy, projects } from "./content.js";
import { caseStudyAssets, defaultCaseStudies, defaultExperience } from "./case-content.js";

const root = document.documentElement;
const page = document.body.dataset.page || "selected-work";
const contentStorageKey = "ehsan-portfolio-cms-v1";
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

function normalizeContent(candidate) {
  if (!candidate || ![1, 2, 3].includes(candidate.version) || !Array.isArray(candidate.projects) || !Array.isArray(candidate.caseStudies) || !Array.isArray(candidate.experience) || !Array.isArray(candidate.contactLinks)) return null;
  const defaults = defaultContent();
  const normalizeItem = (item, fields) => ({
    id: String(item.id || ""),
    ...Object.fromEntries(fields.map((field) => [field, text(item[field])])),
    href: validHref(item.href) ? String(item.href || "") : "",
    image: [...projectAssets, ...caseStudyAssets].includes(item.image) ? String(item.image) : "",
    visible: item.visible !== false,
  });
  const caseStudies = candidate.caseStudies.map((item) => normalizeItem(item, ["title", "summary", "body"]));
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
      image: projectAssets.includes(item.image) ? String(item.image) : projectAssets[index % projectAssets.length],
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

let contentOverride = null;
try {
  const saved = safeStorage.get(contentStorageKey);
  if (saved) {
    contentOverride = normalizeContent(JSON.parse(saved));
    if (contentOverride) safeStorage.set(contentStorageKey, JSON.stringify(contentOverride));
  }
} catch { /* Ignore malformed local drafts and use the supplied content. */ }

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
    bio.textContent = text(managedBio);
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
  if (projectAssets.includes(asset)) return "./assets/projects/" + encodeURIComponent(asset);
  if (caseStudyAssets.includes(asset)) return "./assets/case-studies/" + encodeURIComponent(asset);
  return "";
}

function createProjectCard(project, index) {
  const figure = document.createElement("figure");
  figure.className = "project-card";
  figure.setAttribute("role", "listitem");
  const image = document.createElement("img");
  image.src = assetPath(project.image);
  image.alt = text(project.title).trim() || copy.projectAlt + " " + (index + 1);
  image.width = 2760;
  image.height = 1921;
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
    ? managed.filter((item) => item.visible !== false && projectAssets.includes(item.image))
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
  items.forEach((item, index) => {
    const link = document.createElement("a");
    link.className = "case-study-card";
    link.href = "./case-study.html?id=" + encodeURIComponent(item.id);

    const thumbnail = document.createElement("img");
    const src = assetPath(item.image);
    if (src) thumbnail.src = src;
    thumbnail.alt = "";
    thumbnail.loading = index === 0 ? "eager" : "lazy";
    thumbnail.width = 115;
    thumbnail.height = 79;

    const textWrap = document.createElement("span");
    textWrap.className = "case-study-card-copy";
    const title = document.createElement("span");
    title.className = "case-study-card-title";
    title.textContent = text(item.title) || "Untitled case study";
    const summary = document.createElement("span");
    summary.className = "case-study-card-summary";
    summary.textContent = text(item.summary);
    textWrap.append(title, summary);
    link.append(thumbnail, textWrap);
    list.append(link);
  });
}

function appendInlineText(target, value) {
  const parts = String(value).split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      const strong = document.createElement("strong");
      strong.textContent = part.slice(2, -2);
      target.append(strong);
    } else if (part) {
      target.append(document.createTextNode(part));
    }
  }
}

function makeFigure(alt, name) {
  const src = assetPath(name);
  if (!src) return null;
  const figure = document.createElement("figure");
  figure.className = "case-article-figure";
  if (name === "evaluation.png") figure.classList.add("is-narrow");
  const image = document.createElement("img");
  image.src = src;
  image.alt = alt;
  image.loading = "lazy";
  image.decoding = "async";
  figure.append(image);
  if (alt) {
    const caption = document.createElement("figcaption");
    caption.textContent = alt;
    figure.append(caption);
  }
  return figure;
}

function renderArticleBody(target, source) {
  const lines = String(source || "").replace(/\r/g, "").split("\n");
  let paragraph = [];
  let bullets = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const p = document.createElement("p");
    appendInlineText(p, paragraph.join(" "));
    target.append(p);
    paragraph = [];
  };
  const flushBullets = () => {
    if (!bullets.length) return;
    const list = document.createElement("ul");
    bullets.forEach((line) => {
      const item = document.createElement("li");
      appendInlineText(item, line);
      list.append(item);
    });
    target.append(list);
    bullets = [];
  };
  const flush = () => {
    flushParagraph();
    flushBullets();
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      continue;
    }
    const heading = trimmed.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flush();
      const level = Math.min(4, heading[1].length);
      const node = document.createElement("h" + level);
      node.textContent = heading[2];
      target.append(node);
      continue;
    }
    const image = trimmed.match(/^!\[(.*?)\]\(([^)]+)\)$/);
    if (image) {
      flush();
      const figure = makeFigure(image[1], image[2]);
      if (figure) target.append(figure);
      continue;
    }
    const bullet = trimmed.match(/^[-•]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      bullets.push(bullet[1]);
      continue;
    }
    flushBullets();
    paragraph.push(trimmed);
  }
  flush();
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
  renderArticleBody(body, item.body);
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

renderHeaderAndFooter();
if (page === "selected-work") renderProjects();
if (page === "case-studies") renderCaseStudies();
if (page === "experience") renderExperience();
if (page === "case-study") renderCaseStudyDetails();
updateTheme();

window.addEventListener("storage", (event) => {
  if (event.key === contentStorageKey) {
    try {
      contentOverride = event.newValue ? normalizeContent(JSON.parse(event.newValue)) : null;
      renderHeaderAndFooter();
      if (page === "selected-work") renderProjects();
      if (page === "case-studies") renderCaseStudies();
      if (page === "experience") renderExperience();
      if (page === "case-study") renderCaseStudyDetails();
    } catch { /* Keep the last rendered content if another tab writes invalid data. */ }
  }
  if (event.key === "ehsan-portfolio-theme") {
    theme = event.newValue === "dark" ? "dark" : "light";
    updateTheme();
  }
});
