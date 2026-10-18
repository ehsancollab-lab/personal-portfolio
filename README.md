# Ehsan Masoomi Portfolio

Responsive, English-only portfolio based on the supplied Figma frames, with independent GitHub Pages hosting and a password-protected Cloudflare Pages dashboard.

The site includes Selected Work, a Case Studies list and detail page, and Experience.

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
- case-content.js contains the Case Studies article, its local screenshot assets, and the Experience entries taken from the supplied Figma designs.
- case-studies.html, case-study.html, and experience.html are responsive public pages that use the shared header, theme control, CV download, and footer.
- assets/projects/ contains the 20 supplied Figma exports in the same order as the Selected Work frame.
- assets/Ehsan-Masoomi-CV-EN.pdf is the supplied downloadable CV.
- assets/figma/ contains the profile portrait and header icons exported from the Figma frame.
- The CV download and theme control sit in the top header row, as shown in Figma. The theme control uses the Figma moon icon in light mode and a filled sun icon in dark mode.
- The portfolio and dashboard always use English and a left-to-right layout.
- admin.html is an English-only responsive content dashboard for Selected Work, Case Studies, Experience, and profile/contact details. It supports create, edit, delete, visibility, Selected Work reordering, import, and JSON export.
- Case study content uses simple Markdown headings, bullets, and local image markers in the Details field. The available image names appear in the image selector and the field hint.
- `data/portfolio.json` is the shared published content, loaded by all public visitors.
- Dashboard writes are authenticated by the Cloudflare worker and committed atomically to GitHub. New image files are stored under `assets/uploads/`; GitHub Pages publishes content changes through the included workflow.
- Password verification, signed sessions, Origin checks, persistent D1 login limits, and revision conflict checks run on the server. Secrets are configured in Cloudflare and never committed.
- Simple dashboard setup needs two encrypted production secrets: `ADMIN_PASSWORD` (the chosen password) and `GITHUB_CONTENT_TOKEN` (repository-scoped Contents read/write). The session signing key is derived automatically; no local setup script is required.
- Browser storage retains unpublished recovery drafts and theme preferences. Earlier browser-only edits must be exported from the old site and imported before migration is complete.

## Story editing and navigation

- Public section links use the History API and cached view elements; direct URLs, back/forward, and normal external links keep working.
- Images have content-addressed WebP variants at up to 320/640/960/1440/1920px, with responsive selection and lazy loading. Original exports are retained. Fonts are served locally.
- The case-study composer supports direct writing, selection formatting, headings, links, quotes, lists, undo/redo, image upload/paste/drop, captions, alt text, image widths, code, dividers, YouTube/Vimeo embeds, cover settings, preview, drafts and publishing.
- Unsaved story edits are recovered from this device. **Save draft** stores a new/unpublished story in GitHub with visibility off; **Publish** makes it visible. Existing published stories update with **Save changes**.
- Rich stories are stored as validated JSON in each case study’s `document` field. Existing Markdown remains supported, and a compatible `body` is generated when saving. No arbitrary editor HTML is rendered.
