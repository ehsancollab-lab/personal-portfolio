# Portfolio and story editor verification

Date: 2026-10-18.

## Changes

- Public navigation changes the view through the History API, retains the header and cached sections, and supports direct URLs and browser back/forward.
- Typography enters with a short opacity/position animation on the site and dashboard. Reduced-motion settings disable it. Saved dark mode is applied before the page paints.
- Sharp generates responsive WebP variants at up to 320, 640, 960, 1440 and 1920 pixels. Font files and icons are hosted with the application. Original image exports are retained.
- The supplied Case Studies screenshots define the shared card layout: two columns on desktop, one on small screens, cover image above title and truncated description. Dashboard cards reveal Edit/Delete on hover, keyboard focus and touch.
- The Tiptap story composer implements direct writing, floating selection tools, headings, bold/italic/links, quote/list formatting, undo/redo, block insertion, code/dividers, image upload/paste/drop, captions/alt text/widths, YouTube/Vimeo embeds, cover settings, preview, local draft recovery and GitHub publication.
- Rich text is stored as validated JSON and rendered through DOM nodes. Existing Markdown opens in the visual composer. Cover/body uploads are deduplicated and saved atomically with content.
- Automated checks use stable supplied-content fixtures. Deployment checks compare built content to the current owner-managed JSON and do not require a fixed card count.

## Executed checks

`npm test`: 27 server, story schema and build checks.

`npm run test:browser`: 9 Chromium scenarios:

1. Section switching without additional document requests, cached header/view identity, detail navigation and back/forward.
2. Responsive image selection, local fonts, saved dark theme/icons, typography animation, reduced motion and layouts at 1440/390/320px.
3. Card hover controls, opening the existing article, preserving its headings/images, and deleting a case study.
4. Creating a story, formatting/linking text, headings, image upload/caption/alt/width, preview, saving a draft, reopening, publishing and rendering the result.
5. Recovering an unsaved draft and retaining writing after a failed publication.
6. Selected Work Add/Replace/Delete, keyboard reordering and native drag and drop.
7. Clipboard text paste, italic, quote, lists, undo/redo, divider and code block.
8. Clipboard image paste, video embed, cover selection and mobile composer geometry.
9. Touch access to Edit/Delete without hover.

The browser checks run against a local HTTPS dashboard with the actual authentication/content worker and an in-memory GitHub adapter. They do not create stories or commits in the live portfolio. Screenshot checks cover the supplied card layout, light/dark states and mobile/editor views. Figma access was unavailable; the owner approved continuing from the supplied PNG references.

## Image measurement

For the final 32 local image assets, including the owner’s latest upload: 33,053,076 original bytes versus 826,938 bytes for the generated 960px variants, a 97.5% reduction. This compares image bytes at a specified display resolution, not total deployment size or production network latency. Responsive selection chooses larger variants on high-density screens.

The three section switches in the local browser used a single document request for the entire session. Timing depends on the device and browser; the measured behavior is view replacement without document navigation.

## Reproduction

Use Node 24, `npm ci`, then `npm test`. For browser checks, install Chromium (or run `npx playwright install chromium`) and have OpenSSL available. `CHROMIUM_PATH` can select an existing browser. The preview fixture uses local ports 4173 and 4174 and generates its temporary HTTPS certificate under `../work/portfolio-browser`.

Provider deployment results are checked separately through the GitHub Actions and Cloudflare Pages commit checks.
