import { responsiveImage } from './images.js';
import { bookCategories, books, bookById } from './library-content.js';
import { createBookCover } from './library.js';
import { localizeText, number, phrase } from './i18n.js';

export const homeMarkup = `
    <main class="home-scene" id="home-content" tabindex="-1">
      <section class="centered-intro" aria-labelledby="greeting">
        <h1 id="greeting">Hi, I’m Ehsan 👋🏻</h1>
        <p class="bio" id="bio"></p>
        <section class="contact-block" aria-labelledby="contact-prompt">
          <p class="contact-prompt" id="contact-prompt">Feel free to reach out to me through any of the channels below.</p>
          <nav class="contact-links" id="header-contact-links" aria-label="Contact links"></nav>
        </section>
      </section>
      <nav class="folder-navigation" id="folders" aria-label="Portfolio sections">
        <a class="folder-button" href="./work.html" data-page-link="selected-work" data-section="selected-work"><span class="folder-visual" aria-hidden="true"><img class="folder-back" src="./assets/home/folder.webp" width="106" height="84" alt="" /><span class="folder-items"></span><img class="folder-front" src="./assets/home/folder.webp" width="106" height="84" alt="" /></span><span class="folder-caption">Selected Work</span><span class="folder-count"></span></a>
        <a class="folder-button" href="./case-studies.html" data-page-link="case-studies" data-section="case-studies"><span class="folder-visual" aria-hidden="true"><img class="folder-back" src="./assets/home/folder.webp" width="106" height="84" alt="" /><span class="folder-items"></span><img class="folder-front" src="./assets/home/folder.webp" width="106" height="84" alt="" /></span><span class="folder-caption">Case Studies</span><span class="folder-count"></span></a>
        <a class="folder-button" href="./experience.html" data-page-link="experience" data-section="experience"><span class="folder-visual" aria-hidden="true"><img class="folder-back" src="./assets/home/folder.webp" width="106" height="84" alt="" /><span class="folder-items"></span><img class="folder-front" src="./assets/home/folder.webp" width="106" height="84" alt="" /></span><span class="folder-caption">Experience</span><span class="folder-count"></span></a>
        <a class="folder-button" href="./about.html" data-page-link="about" data-section="about"><span class="folder-visual" aria-hidden="true"><img class="folder-back" src="./assets/home/folder.webp" width="106" height="84" alt="" /><span class="folder-items"></span><img class="folder-front" src="./assets/home/folder.webp" width="106" height="84" alt="" /></span><span class="folder-caption">About Me</span><span class="folder-count"></span></a>
      </nav>
      <div class="portrait-stage" aria-hidden="true"><img class="home-portrait" src="./assets/home/portrait.webp" width="989" height="1100" fetchpriority="high" alt="" /><span class="portrait-blur"></span></div>
    </main>`;

export function createHomePage() {
  const template = document.createElement('template');
  template.innerHTML = homeMarkup;
  return template.content.firstElementChild;
}

export function renderHomeFolders(main, content, { assetPath, companyLogos }) {
  const visible = items => items.filter(item => item.visible !== false);
  const sections = {
    'selected-work': { items: visible(content.projects), en: 'projects', fa: 'پروژه', singular: 'project' },
    'case-studies': { items: visible(content.caseStudies), en: 'case studies', fa: 'کیس‌استادی', singular: 'case study' },
    experience: { items: visible(content.experience), en: 'roles', fa: 'تجربه', singular: 'role' },
    about: { items: books, en: 'books', fa: 'کتاب', singular: 'book' }
  };
  main.querySelector('.folder-navigation').setAttribute('aria-label', localizeText('Portfolio sections'));
  for (const link of main.querySelectorAll('.folder-button')) {
    const key = link.dataset.section;
    const section = sections[key];
    const count = phrase('{n} ' + (section.items.length === 1 ? section.singular : section.en), '{n} ' + section.fa, { n: number(section.items.length) });
    link.querySelector('.folder-count').textContent = count;
    link.setAttribute('aria-label', link.querySelector('.folder-caption').textContent + ', ' + count);
    const previews = link.querySelector('.folder-items');
    previews.replaceChildren();
    if (key === 'about') {
      bookCategories[0].featured.map(bookById).filter(Boolean).forEach(book => {
        const wrapper = document.createElement('span');
        wrapper.className = 'folder-thumb';
        wrapper.append(createBookCover(book, { sizes: '60px' }));
        previews.append(wrapper);
      });
    } else {
      section.items.slice(0, 3).forEach(item => {
        const src = key === 'experience' ? companyLogos[item.id] : assetPath(item.image);
        if (!src) return;
        const image = document.createElement('img');
        image.className = 'folder-thumb'; image.alt = ''; image.decoding = 'async';
        responsiveImage(image, src, { eager: true, sizes: '90px' });
        previews.append(image);
      });
    }
  }
}
