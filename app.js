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
};

const languageParam = new URLSearchParams(window.location.search).get("lang");
const savedLanguage = safeStorage.get("ehsan-portfolio-language");
const browserLanguage = navigator.language?.toLowerCase().startsWith("fa") ? "fa" : "en";
let language = ["fa", "en"].includes(languageParam)
  ? languageParam
  : (["fa", "en"].includes(savedLanguage) ? savedLanguage : browserLanguage);
let theme = safeStorage.get("ehsan-portfolio-theme") === "dark" ? "dark" : "light";

function externalAnchor(href, text) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.textContent = text;
  if (href.startsWith("http")) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
  return anchor;
}

function renderLinks(target, labels) {
  target.replaceChildren(...contactLinks.map(({ key, href }) => externalAnchor(href, labels[key])));
}

function renderBio(strings) {
  const nodes = strings.bioSegments.map((segment) => {
    if (segment.text !== undefined) return document.createTextNode(segment.text);
    const key = segment.link;
    return externalAnchor(companyLinks[key], strings.companyNames[key]);
  });
  bio.replaceChildren(...nodes);
}

function renderProjects(strings) {
  const number = new Intl.NumberFormat(language);
  const cards = projects.map((filename, index) => {
    const figure = document.createElement("figure");
    figure.className = "project-card";
    figure.setAttribute("role", "listitem");

    const image = document.createElement("img");
    image.src = `./assets/projects/${encodeURIComponent(filename)}`;
    image.alt = `${strings.projectAlt} ${number.format(index + 1)}`;
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
    return figure;
  });
  projectGrid.setAttribute("role", "list");
  projectGrid.replaceChildren(...cards);
}

function applyLanguage(nextLanguage) {
  language = nextLanguage;
  const strings = copy[language];
  const isPersian = language === "fa";

  root.lang = language;
  root.dir = isPersian ? "rtl" : "ltr";
  document.title = strings.title;
  document.querySelector('meta[name="description"]').content = strings.description;
  document.querySelector('[data-i18n="skipLink"]').textContent = strings.skipLink;
  document.querySelector("#greeting").textContent = strings.greeting;
  document.querySelector("#contact-prompt").textContent = strings.contactPrompt;
  document.querySelector("#cv-label").textContent = strings.downloadCv;
  document.querySelector("#case-studies-tab").textContent = strings.caseStudies;
  document.querySelector("#experience-tab").textContent = strings.experience;
  document.querySelector("#about-tab").textContent = strings.about;
  document.querySelector("#case-studies-tab").setAttribute("aria-label", `${strings.caseStudies} — ${strings.comingSoon}`);
  document.querySelector("#experience-tab").setAttribute("aria-label", `${strings.experience} — ${strings.comingSoon}`);
  document.querySelector("#about-tab").setAttribute("aria-label", `${strings.about} — ${strings.comingSoon}`);
  document.querySelectorAll('[data-i18n="selectedWork"]').forEach((element) => {
    element.textContent = strings.selectedWork;
  });
  document.querySelector(".contact-block").setAttribute("aria-label", isPersian ? "راه‌های تماس" : "Contact information");
  document.querySelector(".display-controls").setAttribute("aria-label", isPersian ? "تنظیمات نمایش" : "Display settings");
  document.querySelector(".primary-nav").setAttribute("aria-label", isPersian ? "بخش‌های پرتفولیو" : "Portfolio sections");
  document.querySelector(".work-section").setAttribute("aria-label", strings.selectedWork);
  document.querySelector("#header-contact-links").setAttribute("aria-label", isPersian ? "راه‌های تماس" : "Contact links");
  document.querySelector("#footer-contact-links").setAttribute("aria-label", isPersian ? "راه‌های تماس" : "Contact links");

  renderBio(strings);
  renderLinks(document.querySelector("#header-contact-links"), strings.links);
  renderLinks(document.querySelector("#footer-contact-links"), strings.links);
  renderProjects(strings);
  safeStorage.set("ehsan-portfolio-language", language);
  updateThemeControl();
}

function updateThemeControl() {
  const isDark = theme === "dark";
  const strings = copy[language];
  root.dataset.theme = theme;
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", language === "fa"
    ? (isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک")
    : (isDark ? "Switch to light theme" : "Switch to dark theme"));
  themeToggle.title = language === "fa"
    ? (isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک")
    : (isDark ? "Switch to light theme" : "Switch to dark theme");
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
applyLanguage(language);
