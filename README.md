# Ehsan Masoomi Portfolio

Responsive, English-only portfolio based on the supplied Figma frames, with independent GitHub Pages hosting and a password-protected Cloudflare Pages dashboard.

The site includes Selected Work, a Case Studies list and detail page, and Experience.

## Build and hosting

Use Node 24 (see `.nvmrc`). No third-party packages are required.

```sh
npm test
npm run build:site
npm run build:admin
```

The public build is `build/site` for `ehsandesigns.com`. The dashboard build is `build/admin` for `admin.ehsandesigns.com` and includes its authentication worker. See [DEPLOYMENT.md](DEPLOYMENT.md) for account setup, encrypted secrets, domain records, and ongoing maintenance. Provider-side account configuration is required before these builds can be served in production.

## Local public preview

From this directory, run a static file server with: python3 -m http.server 4173

Then open http://localhost:4173.

## Content and assets

- content.js contains the English copy, external links, and the Selected Work image order.
- case-content.js contains the Case Studies article, its local screenshot assets, and the Experience entries taken from the supplied Figma designs.
- case-studies.html, case-study.html, and experience.html are responsive public pages that use the shared header, theme control, CV download, and footer.
- assets/projects/ contains the 20 supplied Figma exports in the same order as the Selected Work frame.
- assets/Ehsan-Masoomi-CV-EN.pdf is the supplied downloadable CV.
- assets/figma/ contains the profile portrait and header icons exported from the Figma frame.
- The CV download and theme control sit in the top header row, as shown in Figma. The theme control uses the Figma moon icon.
- The portfolio and dashboard always use English and a left-to-right layout.
- admin.html is an English-only responsive content dashboard for Selected Work, Case Studies, Experience, and profile/contact details. It supports create, edit, delete, visibility, Selected Work reordering, import, and JSON export.
- Case study content uses simple Markdown headings, bullets, and local image markers in the Details field. The available image names appear in the image selector and the field hint.
- `data/portfolio.json` is the shared published content, loaded by all public visitors.
- Dashboard writes are authenticated by the Cloudflare worker and committed atomically to GitHub. New image files are stored under `assets/uploads/`; GitHub Pages publishes content changes through the included workflow.
- Password verification, signed sessions, Origin checks, persistent D1 login limits, and revision conflict checks run on the server. Secrets are configured in Cloudflare and never committed.
- Browser storage retains unpublished recovery drafts and theme preferences. Earlier browser-only edits must be exported from the old site and imported before migration is complete.
