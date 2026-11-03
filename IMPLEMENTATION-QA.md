# Portfolio and story editor verification

Latest verification: 2026-11-03.

## Changes

- Public navigation changes the view through the History API, retains the header and cached sections, and supports direct URLs and browser back/forward.
- Typography enters with a short opacity/position animation on the site and dashboard. Reduced-motion settings disable it. Saved dark mode is applied before the page paints.
- Sharp generates responsive WebP variants at up to 320, 640, 960, 1440 and 1920 pixels. Font files and icons are hosted with the application. Original image exports are retained.
- The supplied Case Studies screenshots define the shared card layout: two columns on desktop, one on small screens, cover image above title and truncated description. Dashboard cards reveal Edit/Delete on hover, keyboard focus and touch.
- The Tiptap story composer implements direct writing, floating selection tools, headings, bold/italic/links, quote/list formatting, undo/redo, block insertion, code/dividers, image upload/paste/drop, captions/alt text/widths, YouTube/Vimeo embeds, cover settings, preview, local draft recovery and GitHub publication.
- Rich text is stored as validated JSON and rendered through DOM nodes. Existing Markdown opens in the visual composer. Cover/body uploads are deduplicated and saved atomically with content.
- Automated checks use stable supplied-content fixtures. Deployment checks compare built content to the current owner-managed JSON and do not require a fixed card count.
- Dashboard tools live in a settings dropdown to the right of the centered title. Confirmed publications show a temporary `Saved to GitHub` toast; initial loading does not show a false success, and failed/conflicting saves retain recovery actions.
- About Me is restored in the public navigation. The introduction uses the owner-provided facts: self-taught UI/UX designer, married, and loves reading. The bookshelf contains 50 books in six collections, with three representative covers per collection.
- Collection cards expand into a shelf using shared surface, title and cover transitions. Book covers move into their detail view and back to their original shelf/grid position. Cached search and scroll survive returning; interrupted navigation keeps the latest destination. Reduced motion skips the transitions, and browsers without View Transitions use animated cover clones.
- Each book has its English and Persian titles, author, topics, an original short summary, an owner-requested first-person takeaway and a Persian research source. Sources are recorded in `book-sources.js`; the takeaways are editorial copy, not quotations from the books.
- The owner requested sample cover art until the original files arrive. All 50 entries currently use clearly labelled typographic sample jackets. Real covers can be assigned through the `cover` field; future files under `assets/books` are included in responsive image generation. Persian titles use locally hosted Vazirmatn.

## Executed checks

`npm test`: 31 server, story schema, book metadata and build checks.

`npm run test:browser`: 28 Chromium scenarios:

1. Section switching without additional document requests, cached header/view identity, detail navigation and back/forward.
2. Responsive image selection, local fonts, saved dark theme/icons, typography animation, reduced motion and layouts at 1440/390/320px.
3. Card hover controls, opening the existing article, preserving its headings/images, and deleting a case study.
4. Creating a story, formatting/linking text, headings, image upload/caption/alt/width, preview, saving a draft, reopening, publishing and rendering the result.
5. Recovering an unsaved draft and retaining writing after a failed publication.
6. Selected Work Add/Replace/Delete, keyboard reordering and native drag and drop.
7. Clipboard text paste, italic, quote, lists, undo/redo, divider and code block.
8. Clipboard image paste, video embed, cover selection and mobile composer geometry.
9. Touch access to Edit/Delete without hover.
10. Smooth 4% public card image zoom and title color `#2255FF`, with stable card geometry and keyboard focus.
11. Uniform light detail-page background `#FDFDFD` on direct entry and client navigation, including correct restoration when leaving the detail view.
12. Replacing an existing article image and cover, clearing obsolete responsive candidates, and preserving the replacement and caption after saving/reopening.
13. Repeated replacement of a library image in a new story, with captions retained and no overlapping text-formatting bubble.
14. Settings-button placement, centered title, four menu items, arrow/Home navigation, Escape/focus return, Tab and outside-click dismissal.
15. Success appears only after a successful API response, dismisses after 3.2 seconds, and appears again after another save.
16. Downloading/restoring a backup through Settings, checking the public-site destination and signing out.
17. Failed saves remain visible with Retry, successful retries show success, and conflicts never show a success toast.
18. The settings menu stays within 390/320px screens, preserves 44px menu targets and respects reduced motion.
19. About navigation, biography facts, the complete count and six three-cover collection cards.
20. Shared surface/title/three-cover names on collection expansion and reverse motion, without extra document requests.
21. English author and Persian title search, Arabic/Persian letter normalization, hidden results and clearing an empty search.
22. Opening all 50 books through their collection cards and checking author, Persian title, summary, takeaway, source, sample label and Back.
23. Book transition, cached collection search and scroll, document titles, and browser back/forward.
24. About, collection and book layouts at 390/320px in dark mode, persistent theme and local Persian font loading.
25. Reduced motion bypasses the shared transition API, and keyboard Enter opens a collection.
26. Cover-clone animation and cleanup when View Transitions are unavailable.
27. Direct book/collection aliases and usable invalid-link states.
28. Rapid navigation cancels prior motion, retains the latest destination and leaves no named transition elements behind.

The reference video was inspected for its fanned covers, expanding collection surface, shelf arrangement and reverse motion. Desktop and mobile screenshots, including a paused transition midpoint, were reviewed locally. This is an adaptation to the portfolio's existing design; original cover artwork is pending from the owner.

The replacement regression was reproduced before the fix: the `src` changed while the browser kept displaying the old `srcset` candidate. Text tools could also overlap image tools during repeated replacement. Responsive attributes are now cleared when using a raw replacement, the text bubble appears only for actual text selections, and saving waits for image preparation. Opening the link editor hides the text bubble, and floating text tools stay below the composer panels.

The browser checks run against a local HTTPS dashboard with the actual authentication/content worker and an in-memory GitHub adapter. They do not create stories or commits in the live portfolio. Screenshot checks cover the supplied card layout, light/dark states and mobile/editor views. Figma access was unavailable; the owner approved continuing from the supplied PNG references.

## Image measurement

For the initial composer release’s 32 local image assets: 33,053,076 original bytes versus 826,938 bytes for the generated 960px variants, a 97.5% reduction. This compares image bytes at a specified display resolution, not total deployment size or production network latency. Responsive selection chooses larger variants on high-density screens.

The three section switches in the local browser used a single document request for the entire session. Timing depends on the device and browser; the measured behavior is view replacement without document navigation.

## Reproduction

Use Node 24, `npm ci`, then `npm test`. For browser checks, install Chromium (or run `npx playwright install chromium`) and have OpenSSL available. `CHROMIUM_PATH` can select an existing browser. The preview fixture uses local ports 4173 and 4174 and generates its temporary HTTPS certificate under `../work/portfolio-browser`.

Provider deployment results are checked separately through the GitHub Actions and Cloudflare Pages commit checks.
