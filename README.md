# Ehsan Masoomi Portfolio

Responsive English/Persian portfolio based on the supplied Figma frames, with independent GitHub Pages hosting and a password-protected Cloudflare Pages dashboard.

The homepage introduces Ehsan with a centered biography, the approved cap-and-hoodie portrait, and four compact folders. Each folder lifts actual project images, case banners, company logos, or book covers on hover and keyboard focus, with a subtle 0.3% increase in the folder size. The original soft silver folder artwork is retained; separate clipped layers keep the corners clean. The folders open Selected Work, Case Studies, the Experience timeline, and About Me with its 50-book library.

Fresh document visits open with the owner's final minimal introduction: a softly arriving portrait, a slash and a 0–100% counter. Counting takes three seconds. The same framed portrait then glides into the real navigation avatar over 800ms as the site appears; the normal sequence lasts about four seconds. The destination avatar stays hidden during the flight, so there is one visible portrait and no duplicate or final position jump. `preloader.js` and `preloader.css` are independent of the application bundle and load on every public entry route, including extensionless links. Reduced motion removes the forced duration and flight. Tab, Enter or Escape can skip it; resizing during the flight safely reveals the correctly positioned header avatar. It never replays during SPA navigation and fails open within eight seconds if the application cannot load. There is no folder, preview card, visual progress bar, name, title, storage, tracking or new runtime dependency in the final intro.

## Build and hosting

Use Node 24 (see `.nvmrc`) and install the locked dependencies. Tiptap powers the story composer; Sharp generates responsive WebP images during deployment; esbuild bundles the browser code.

```sh
npm ci
npm test
npm run build:site
npm run build:admin
```

The public build is `build/site` for `ehsandesigns.com`. The dashboard build is `build/admin` for `admin.ehsandesigns.com` and includes its authentication worker. See [DEPLOYMENT.md](DEPLOYMENT.md) for account setup, encrypted secrets, domain records, and ongoing maintenance. Provider-side account configuration is required before these builds can be served in production.

## Local public preview

Build first with `npm run build:site`, then run `python3 -m http.server 4173 --directory build/site`. Open http://localhost:4173.

Browser integration checks use `npm run test:browser`. They run Chromium against a local HTTPS dashboard using the real authentication/content worker and an in-memory GitHub transport; they never alter the live portfolio. The local fixture requires OpenSSL. Set `CHROMIUM_PATH` when Chromium is installed outside `/usr/bin/chromium`, or install Playwright Chromium with `npx playwright install chromium`. See [IMPLEMENTATION-QA.md](IMPLEMENTATION-QA.md).

## Content and assets

- content.js contains the English copy, external links, and the Selected Work image order.
- `home.js`, `home.css`, and `assets/home/` contain the approved folder homepage and its approved portrait and original silver folder artwork. The homepage uses the same Inter/On styles, managed profile copy, and clickable company links as the rest of the live site. `work.html` is the full original project gallery; existing `index.html#selected-work` links still open it.
- case-content.js contains the Case Studies article, its local screenshot assets, and the Experience entries taken from the supplied Figma designs.
- case-studies.html, case-study.html, and experience.html are responsive public pages that use the shared portrait header, language/theme controls and footer.
- assets/projects/ contains the 20 supplied Figma exports in the same order as the Selected Work frame.
- The supplied November 2026 English and Persian PDFs remain under `assets/Ehsan-Masoomi-CV-{EN,FA}-November-2026.pdf`. The owner has temporarily removed the CV button from public navigation.
- assets/figma/ contains the profile portrait and header icons exported from the Figma frame.
- The shared header stays in one row on desktop and mobile in both languages. Its physical left side shows a clickable 44px portrait with a white 3px frame and soft shadow, a slash, and the live Tehran clock (11px DM Mono) on the homepage or a plain underlined Back label on interior pages. The portrait always returns to the homepage; Back retains each route's parent destination and Escape shortcut. Language/theme controls stay on the physical right. The CV button and centered page label are removed; the header scrolls away with the page. English keeps its 17px Medium greeting and Persian its 19px Bold greeting; Persian social links remain bold at their existing size and color. Folder counts are removed. Public footers center their copyright and contact links. The theme control uses the Figma moon icon in light mode and a filled sun icon in dark mode.
- The public portfolio switches between English/LTR and Persian/RTL. Every fresh public document starts in English and light mode. Language and theme choices last through internal navigation in that visit and reset on reload. Persian uses the supplied On webfonts: 19px Bold headings and 18px SemiBold body copy with 25px line height; the dashboard remains English/LTR.
- `i18n.js`, `content-fa.js`, and `books-fa.js` contain UI labels and the Persian versions of the current published copy. Future English copy edits keep their source text until a corresponding translation is added.
- Book detail covers stand upright. Book headers show the title and author, with a short Back/بازگشت action. Personal takeaways have no panel background, align to the start of the chosen language, and show Ehsan’s portrait, localized name and Product Designer/طراح محصول caption. Quotation text is 17px and Ehsan’s name is 15px in both languages and at every breakpoint. Research sources remain in the metadata and are not shown as external links.
- Section navigation uses the four homepage folders and the interior Back action. Homepage navigation fades out over 700ms and the destination fades in over 900ms; reduced motion removes those effects. The owner-requested floating bottom menu remains removed. The homepage portrait has its own lower blur, while interior pages retain the permanent bottom blur.
- Experience follows the supplied vertical timeline reference and keeps the existing bullet points. The role leads each entry, followed inline by a smaller muted company name; narrow layouts wrap that metadata. The three original owner-supplied company logos are served locally under `assets/companies/`. Company logos use a circular white 3px frame and a soft shadow in both the timeline and folder previews. The light-theme timeline line, dots, and moving cursor use `#282828`; the dark-theme ink remains light for readability. Its scroll range is clamped to the page so the cursor returns to the first station at scroll position zero.
- Completed pointer clicks use the Web Audio click synthesis from the owner-supplied `eduardoalba.com` source and a temporary expanding ring at the click position. The tone, filtered noise and compressor settings match the source; audio initializes on the first user click and reuses one context without downloading sound files. Moving or hovering the pointer shows no halo; touch scrolling also produces no ring or audio. Keyboard activation keeps the sound without a ring, and reduced motion suppresses the ring. Interior Back links have an Escape shortcut. A stable native scrollbar gutter prevents the home content and header controls from jumping horizontally during route fades. A permanent, theme-aware progressive bottom blur stays visible at every scroll position behind usable navigation and footer links.
- Public colors follow the owner's Blossom screenshots: `#fafafa` pages, white surfaces, charcoal (`#282828`) headings/actions, neutral gray supporting copy, pale borders and soft shadows. Dark mode uses the same neutral hierarchy with light actions on dark surfaces. All public routes share these tokens, including interior pages, hover/focus feedback, and language/theme controls. Library collection cards and collection heroes use the owner's plain `#EDEDED` background in both themes. See `COLOR-PALETTE.md`. The sky scenes remain removed; the permanent bottom blur uses the current page color.
- Public content cards and media frames share an 18px corner radius, fine edge and compact soft shadow; book covers share the shadow while retaining book-shaped corners. About Me omits the visible introduction heading and bookshelf heading/count description while retaining both introductory paragraphs. Collection cards and open collection heroes have a simple gray surface without wooden or recessed shelf decoration; collection numbers, count labels, and the hero eyebrow are removed. The overlapping three-book fan and hover transforms are retained. The existing three featured books open their detail pages. Collection book titles and author captions are centered beneath their cover; titles are 15px in both languages on desktop and mobile; other headings retain the shared scale. Book quote attribution uses the separately prepared square `assets/home/book-avatar.webp`, fitted inside its 40px circular frame without translated offsets so the cap and face remain visible.
- Experience uses a pale dashed route, gray future stations, monochrome passed stations, and a 6px cursor with a soft blurred halo. GSAP follows scroll with 0.85-second scrub smoothing in either direction; reduced motion follows immediately. The route is measured from the first station to the last and resizes with the localized content.
- admin.html is an English-only responsive content dashboard for Selected Work, Case Studies, Experience, and profile/contact details. It supports create, edit, delete, visibility, Selected Work reordering, import, and JSON export.
- Case study content uses simple Markdown headings, bullets, and local image markers in the Details field. The available image names appear in the image selector and the field hint.
- `data/portfolio.json` is the shared published content, loaded by all public visitors.
- Dashboard writes are authenticated by the Cloudflare worker and committed atomically to GitHub. New image files are stored under `assets/uploads/`; GitHub Pages publishes content changes through the included workflow.
- Password verification, signed sessions, Origin checks, persistent D1 login limits, and revision conflict checks run on the server. Secrets are configured in Cloudflare and never committed.
- Simple dashboard setup needs two encrypted production secrets: `ADMIN_PASSWORD` (the chosen password) and `GITHUB_CONTENT_TOKEN` (repository-scoped Contents read/write). The session signing key is derived automatically; no local setup script is required.
- Dashboard browser storage retains unpublished recovery drafts and its theme preferences. Earlier browser-only edits must be exported from the old site and imported before migration is complete.

## Story editing and navigation

- Public section links use the History API and cached view elements; direct URLs, back/forward, and normal external links keep working.
- Images have content-addressed WebP variants at up to 320/640/960/1440/1920px, with responsive selection and lazy loading. Original exports are retained. Fonts are served locally.
- The case-study composer supports direct writing, selection formatting, headings, links, quotes, lists, undo/redo, image upload/paste/drop, captions, alt text, image widths, code, dividers, YouTube/Vimeo embeds, cover settings, preview, drafts and publishing.
- Unsaved story edits are recovered from this device. **Save draft** stores a new/unpublished story in GitHub with visibility off; **Publish** makes it visible. Existing published stories update with **Save changes**.
- Rich stories are stored as validated JSON in each case study’s `document` field. Existing Markdown remains supported, and a compatible `body` is generated when saving. No arbitrary editor HTML is rendered.
