import { companyLinks, contactLinks, copy, projects } from "./content.js";

const root = document.documentElement;
const bio = document.querySelector("#bio");
const projectGrid = document.querySelector("#project-grid");
const themeToggle = document.querySelector("#theme-toggle");

const safeStorage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* Storage may be unavailable in private contexts. */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* Storage may be unavailable in private contexts. */ }
  },
};

const contentStorageKey = "ehsan-portfolio-cms-v1";
safeStorage.remove("ehsan-portfolio-language");

function normalizeContent(candidate) {
  if (!candidate || ![1, 2].includes(candidate.version) || !Array.isArray(candidate.projects) || !Array.isArray(candidate.caseStudies) || !Array.isArray(candidate.experience) || !Array.isArray(candidate.about) || !Array.isArray(candidate.contactLinks)) return null;
  const text = (value) => typeof value === "string" ? value : String(value?.en || "");
  const entries = (value) => Array.isArray(value) ? value : [];
  const normalizeItem = (item, fields) => ({
    id: String(item.id || ""),
    ...Object.fromEntries(fields.map((field) => [field, text(item[field])])),
    href: String(item.href || ""),
    image: String(item.image || ""),
  });
  return {
    version: 2,
    profile: {
      greeting: text(candidate.profile?.greeting),
      bio: text(candidate.profile?.bio),
      contactPrompt: text(candidate.profile?.contactPrompt),
    },
    projects: entries(candidate.projects).map((item) => ({
      id: String(item.id || ""),
      image: String(item.image || ""),
      title: text(item.title),
      href: String(item.href || ""),
      visible: item.visible !== false,
    })),
    caseStudies: entries(candidate.caseStudies).map((item) => normalizeItem(item, ["title", "summary", "body"])),
    experience: entries(candidate.experience).map((item) => normalizeItem(item, ["role", "company", "dates", "description"])),
    about: entries(candidate.about).map((item) => normalizeItem(item, ["title", "body"])),
    contactLinks: entries(candidate.contactLinks).map((item) => ({
      id: String(item.id || ""),
      label: text(item.label),
      href: String(item.href || ""),
    })),
  };
}

let contentOverride = null;
try {
  const storedContent = safeStorage.get(contentStorageKey);
  if (storedContent) {
    contentOverride = normalizeContent(JSON.parse(storedContent));
    if (contentOverride) safeStorage.set(contentStorageKey, JSON.stringify(contentOverride));
  }
} catch { /* Ignore malformed browser-local draft data and use the supplied content. */ }

let theme = safeStorage.get("ehsan-portfolio-theme") === "dark" ? "dark" : "light";

function english(value) {
  return typeof value === "string" ? value : String(value?.en || "");
}

function externalAnchor(href, text) {
  const anchor = document.createElement("a");
  const safeHref = /^(https:\/\/|mailto:|tel:|\/|\.\/|#)/i.test(String(href || "")) && !/^\/\//.test(String(href || ""));
  anchor.href = safeHref ? href : "#";
  anchor.textContent = text;
  if (String(href).startsWith("https://")) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
  return anchor;
}

function renderLinks(target) {
  const managedLinks = Array.isArray(contentOverride?.contactLinks) ? contentOverride.contactLinks : null;
  const links = managedLinks
    ? managedLinks
      .map(({ href, label }) => ({ href, label: english(label) }))
      .filter(({ label, href }) => label && href)
    : contactLinks.map(({ key, href }) => ({ href, label: copy.links[key] }));
  target.replaceChildren(...links.map(({ href, label }) => externalAnchor(href, label)));
}

function renderBio() {
  const strings = copy;
  const originalBio = strings.bioSegments
    .map((segment) => segment.text !== undefined ? segment.text : strings.companyNames[segment.link])
    .join("");
  const hasManagedBio = contentOverride?.profile && Object.prototype.hasOwnProperty.call(contentOverride.profile, "bio");
  const managedBio = hasManagedBio ? english(contentOverride.profile.bio) : undefined;

  if (managedBio !== undefined && managedBio !== originalBio) {
    bio.textContent = managedBio;
    return;
  }

  const nodes = strings.bioSegments.map((segment) => {
    if (segment.text !== undefined) return document.createTextNode(segment.text);
    const key = segment.link;
    return externalAnchor(companyLinks[key], strings.companyNames[key]);
  });
  bio.replaceChildren(...nodes);
}

function renderProjects() {
  const managedProjects = Array.isArray(contentOverride?.projects)
    ? contentOverride.projects.filter((project) => project.visible !== false && projects.includes(project.image))
    : projects.map((image, index) => ({ image, title: "", visible: true, id: String(index) }));

  const cards = managedProjects.map((project, index) => {
    const figure = document.createElement("figure");
    figure.className = "project-card";
    figure.setAttribute("role", "listitem");

    const image = document.createElement("img");
    image.src = "./assets/projects/" + encodeURIComponent(project.image);
    image.alt = english(project.title).trim() || copy.projectAlt + " " + (index + 1);
    image.width = 2760;
    image.height = 1921;
    image.decoding = "async";
    if (index < 2) {
      image.loading = "eager";
      image.fetchPriority = "high";
    } else {
      image.loading = "lazy";
    }

    figure.append(image);
    const projectHref = String(project.href || "");
    if (/^(https:\/\/|mailto:|tel:|\/|\.\/|#)/i.test(projectHref) && !/^\/\//.test(projectHref)) {
      const link = document.createElement("a");
      link.className = "project-card-link";
      link.href = projectHref;
      if (projectHref.startsWith("https://")) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      link.setAttribute("aria-label", image.alt);
      link.append(figure);
      return link;
    }
    return figure;
  });

  projectGrid.setAttribute("role", "list");
  projectGrid.replaceChildren(...cards);
}

function renderPortfolio() {
  root.lang = "en";
  root.dir = "ltr";
  document.title = copy.title;
  document.querySelector('meta[name="description"]').content = copy.description;
  const managedProfile = contentOverride?.profile || {};
  document.querySelector("#greeting").textContent = Object.prototype.hasOwnProperty.call(managedProfile, "greeting") ? english(managedProfile.greeting) : copy.greeting;
  document.querySelector("#contact-prompt").textContent = Object.prototype.hasOwnProperty.call(managedProfile, "contactPrompt") ? english(managedProfile.contactPrompt) : copy.contactPrompt;

  const ariaLabels = {
    ".contact-block": "Contact information",
    ".display-controls": "Display settings",
    ".primary-nav": "Portfolio sections",
    "#header-contact-links": "Contact links",
    "#footer-contact-links": "Contact links",
    ".work-section": "Selected Work",
  };
  for (const [selector, label] of Object.entries(ariaLabels)) {
    document.querySelector(selector).setAttribute("aria-label", label);
  }

  renderBio();
  renderLinks(document.querySelector("#header-contact-links"));
  renderLinks(document.querySelector("#footer-contact-links"));
  renderProjects();
}

function updateThemeControl() {
  const isDark = theme === "dark";
  root.dataset.theme = theme;
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  themeToggle.title = isDark ? "Switch to light theme" : "Switch to dark theme";
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#131315" : "#ffffff";
  safeStorage.set("ehsan-portfolio-theme", theme);
}

themeToggle.addEventListener("click", () => {
  theme = theme === "light" ? "dark" : "light";
  updateThemeControl();
});

document.querySelectorAll('.planned-tab[aria-disabled="true"]').forEach((tab) => {
  tab.addEventListener("click", (event) => event.preventDefault());
});

document.querySelector("#copyright-year").textContent = String(new Date().getFullYear());
renderPortfolio();
updateThemeControl();

window.addEventListener("storage", (event) => {
  if (event.key !== contentStorageKey) return;
  try {
    contentOverride = event.newValue ? JSON.parse(event.newValue) : null;
    renderPortfolio();
  } catch { /* Keep the last rendered content if a different tab writes invalid JSON. */ }
});
