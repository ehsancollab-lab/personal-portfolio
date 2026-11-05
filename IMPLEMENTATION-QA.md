# Portfolio and story editor verification

Latest verification: 2026-11-05.

## November 5 sky, Experience cursor and Persian CV control

- `Rec 0045.mp4` supplies the sky reference. Local generated day/night images and a transparent bird flock create the atmosphere, with small Phosphor sun/moon assets positioned independently for mobile and desktop. The existing theme control crossfades scenes; one persistent sky remains across SPA routes. The shared reading surface is 88% opaque and adapts to the theme; case details use it too. The footer fits inside the surface. Sky assets and license are documented in `assets/sky/README.md`.
- Cloud drift and a short bird flight during each 64-second cycle use compositor transforms; no permanent sky animation loop or extra WebGL context is added. Inactive scenes and hidden pages pause. Reduced motion and data saving retain static skies and omit the bird flight. High contrast/reduced transparency increase the reading surface to 98%.
- `Rec 0046.mp4` supplies the revised Experience motion. The 2px pale dashed route fills blue as a single 8px blue cursor with a soft halo travels from the first station to the last. Future stations are gray, passed stations turn blue, and nearby stations receive a faint halo. A GSAP scrub of 0.85 seconds smooths movement in both directions; reduced motion follows scroll immediately. Geometry refreshes for wrapping, locale changes and resizing, and route changes clean up the observer and trigger.
- Persian Download CV now uses On SemiBold (600), matching the selected section tab, and its width follows the text, icon, gap and padding at every breakpoint.
- Verification: `npm test` passes all 37 checks and builds both targets. The full 65-scenario Chromium run passes 61 and exposes four timing/motion cases; after cloud-step/geometry adjustments and atomic animation/layout assertions, all 15 affected scenarios pass, covering all four cases. All 65 scenarios have passing results across these runs. Visual comparisons and the exact capture scope are recorded in `design-qa.md`; final result is passed.

## November 5 supplied click synthesis

- The owner supplied the requested site's JavaScript in `sounds-BL9XApyC.zip`. Its sound is generated with Web Audio. `click-sound.js` matches the source's sine sweep, noise buffer, filter, envelopes, pitch variation, compressor, pan clamp and 30ms retrigger limit. Source hash and values are documented in `assets/audio/README.md`; the old WAV is removed.
- Audio initializes lazily after a trusted primary click, resumes when needed and reuses one context. Keyboard activation produces sound without a ring; hovering, touch scrolling and synthetic clicks produce neither. The existing click-only ring and reduced-motion behavior remain intact. Audio failures do not block navigation.
- `npm test` passes all 37 checks and builds both deployment targets. All 10 targeted Chromium scenarios in `click-sound.spec.mjs` and `pointer-floating.spec.mjs` pass. Six seeded offline render comparisons match the reference within 0.0000001 at 44.1/48kHz across different volumes/pans. Checks also cover the 30ms limit, one lazy context, no audio-file requests, missing/blocked audio and rejected/still-suspended resume, keyboard input, real mobile taps/scrolling, reduced motion and the bilingual floating menu.

## November 5 click-only pointer feedback

- The persistent pointer-following halo and its hover/press listeners are removed. A completed trusted primary click now creates the temporary 480ms ring at its position; hovering, pressing without release and touch scrolling create no ring. Keyboard activation plays audio without placing a ring at artificial coordinates, and reduced motion keeps audio while suppressing the ring.
- `npm run build:site` succeeds and all seven scenarios in `tests/browser/pointer-floating.spec.mjs` pass. Checks cover idle/hover/press absence, ring position and removal, repeated clicks, keyboard and synthetic activation, local audio decoding, real touch scrolling versus tapping, reduced motion and existing bilingual floating navigation. The desktop click screenshot was reviewed.
- At that stage direct reference access was blocked. The subsequently supplied source resolves the sound replacement, as recorded above.

## November 5 compact mobile navigation

- At 420px and below, the bottom capsule uses four equal columns and shorter English/Persian labels. All four buttons remain visible without scrolling, with 44px minimum touch height and 8px outer gutters. Accessible names retain the full section titles; wider layouts show the full labels.
- `npm run build:site` succeeds. All six scenarios in `tests/browser/pointer-floating.spec.mjs` pass. The new scenario checks both languages at 320, 350, 360, 374, 375, 390 and 420px for clipped text, overlapping buttons, touch size and bounds, navigates all four destinations at 320/350px, and verifies full labels return at 1440px. The 350px English and Persian screenshots were reviewed.

## November 5 annotated sizes and permanent blur

- Personal book quotation text is 17px and Ehsan’s name is 15px, in English and Persian at desktop and mobile breakpoints.
- The fixed four-layer bottom blur is always visible, including at scroll position zero. Scroll-dependent visibility and the opacity fade were removed; theme adaptation and pointer passthrough remain verified.
- `npm run build:site` succeeds. Three focused Chromium scenarios pass: public heading/body metrics, book detail quotation/name sizes and layout, and permanent blur at the top and bottom in desktop/mobile light/dark states.

## Changes

- Public navigation changes the view through the History API, retains the header and cached sections, and supports direct URLs and browser back/forward.
- Typography enters with a short opacity/position animation on the site and dashboard. Reduced-motion settings disable it. Fresh public documents apply English/LTR and light mode before the page paints.
- Sharp generates responsive WebP variants at up to 320, 640, 960, 1440 and 1920 pixels. Font files and icons are hosted with the application. Original image exports are retained.
- The supplied Case Studies screenshots define the shared card layout: two columns on desktop, one on small screens, cover image above title and truncated description. Dashboard cards reveal Edit/Delete on hover, keyboard focus and touch.
- The Tiptap story composer implements direct writing, floating selection tools, headings, bold/italic/links, quote/list formatting, undo/redo, block insertion, code/dividers, image upload/paste/drop, captions/alt text/widths, YouTube/Vimeo embeds, cover settings, preview, local draft recovery and GitHub publication.
- Rich text is stored as validated JSON and rendered through DOM nodes. Existing Markdown opens in the visual composer. Cover/body uploads are deduplicated and saved atomically with content.
- Automated checks use stable supplied-content fixtures. Deployment checks compare built content to the current owner-managed JSON and do not require a fixed card count.
- Dashboard tools live in a settings dropdown to the right of the centered title. Confirmed publications show a temporary `Saved to GitHub` toast; initial loading does not show a false success, and failed/conflicting saves retain recovery actions.
- About Me is restored in the public navigation. The introduction uses the owner-provided facts: self-taught UI/UX designer, married, and loves reading. The bookshelf contains 50 books in six collections, with three representative covers per collection.
- Collection cards expand into a shelf using shared surface, title and cover transitions. Book covers move into their detail view and back to their original shelf/grid position. Cached collection scroll survives returning; interrupted navigation keeps the latest destination. Reduced motion skips the transitions, and browsers without View Transitions use animated cover clones.
- Each book has its English and Persian titles, author, topics, an original short summary, an owner-requested first-person takeaway and a Persian research source. Sources are recorded in `book-sources.js`; the takeaways are editorial copy, not quotations from the books.
- All 50 owner-supplied covers replace the temporary sample jackets. The unmodified PNG files live under `assets/books`; `book-covers.js` records their book assignments, dimensions, display frames and SHA-256 hashes. CSS frames hide the surrounding white photo margins while preserving the complete cover and its proportions; full-page white cover designs retain their paper margins. Responsive WebP variants are generated for display. Each language displays one book title; the duplicated secondary Persian-name line is removed. Persian uses the owner-supplied On Regular, On SemiBold and On Bold WOFF2 files.
- Featured psychology books are Behave, Why Has Nobody Told Me This Before? and Self-Compassion. Design features Visual Literacy, Principles of Form and Design and the Masoud Sepehr graphic-analysis book. Growth features Twelve Rules for Life in place of Atomic Habits.
- The annotated About layout matches the shared header's width and left edge at desktop and mobile breakpoints. Its six collection cards form a single column with larger desktop fans, and the introductory gap is reduced. My bookshelf and the collection-page headings are centered. About and collection search controls are removed, along with About's filter-status line; category book totals remain. Fans, shelves and grid covers preserve their individual aspect ratios at a common height within each context, and grid titles start on the same row baseline.
- Selected Work uses a single column, artwork at 70.8% of desktop viewport width, capped at 1360px (the revised 1920px reference), with full-width mobile gutters, responsive image candidates sized for that layout, and 12px desktop / 8px mobile outer corners.
- GSAP supplies page entry and ScrollTrigger project reveals. A lazily loaded Three.js scene provides pointer-driven perspective, gentle surface deformation and a GLSL light/ripple shader. It uses one canvas, capped device pixel ratio, only nearby card textures, decoded bitmaps with actual source-pixel dimensions, and no repeated GPU draws when idle. Route changes and context loss release textures, bitmaps, geometry and the renderer. Reduced motion, touch-only pointers, data-saving mode and unavailable WebGL retain the normal image gallery.
- Locally hosted Lenis 1.3.11 starts after fonts are ready, with `lerp: 0.085`, `wheelMultiplier: 0.92`, smooth wheel input and native touch scrolling. It uses the GSAP ticker and updates ScrollTrigger; layout refreshes resize its measurements. Same-view anchors use a 1.3-second quartic ease, 35px desktop / 20px small-screen offsets, destination focus and a replaced URL hash. Skip links and route/history scroll restoration are immediate. Dialogs and `[data-scroll-native]` areas scroll independently; modal background motion stops. Reduced motion, page hide/show and chunk-loading failures cleanly restore or retain native scrolling. The dashboard does not load Lenis.

- The public EN/FA segmented control sits between CV and theme, updates `lang`, `dir`, copy, route titles and the matching CV download for the current visit. A reload starts English/light even with legacy stored preferences. All public headings use 19px Bold at every breakpoint and in both languages. Persian 18px body copy uses On SemiBold with exactly 25px line height; headings use the genuine On Bold webfont. Persian translations cover all current profile/About/experience/case-study strings and all 50 book summaries and takeaways; the source content remains unchanged.
- Section tabs remain one horizontally scrolling row on mobile. A fixed bottom capsule appears when the source navigation leaves the viewport, mirrors the active section and RTL direction, and hides on interior case/book/collection pages. Hidden duplicates are inert.
- Experience follows `Rec 0040.mp4`: a vertical timeline with blue dots and scroll progress, year/date, the original supplied company logo above a role-first heading, a smaller muted company name beside it, and the existing bullet points. The MORS, Nibex and Remocapp JPEGs are copied byte-for-byte from the supplied ZIP; their original filenames and hashes are recorded under `assets/companies/`. No hover project previews were added.
- A four-layer masked backdrop blur remains visible at the bottom at all scroll positions, including the very top, adapts to the theme, ignores pointer input, and leaves the bottom navigation and footer readable.
- `Rec 0042.mp4` informed the blur/vertical text entrance, short departure transition, and interior Back button with an Escape shortcut. Temporary click rings ignore pointer input; no persistent hover halo is mounted, and reduced motion skips the ripple and transitions. Click audio uses the subsequently supplied `eduardoalba.com` synthesis and plays only after user input.

## Typography and book detail revision

- Headings across all seven public route types remain exactly 19px Bold in English and Persian at 1440/390/320px. Persian 18px body text is SemiBold with a 25px line height, and the genuine On Bold file is included in deployment.
- Personal book takeaways match the supplied testimonial reference: a 17px Bold quotation and 15px Bold name, as specified in the red annotations, then Ehsan’s portrait and the Product Designer/طراح محصول caption. The section has no background and aligns left for English and right for Persian. The header includes only the book title and author; category/topic labels are omitted. Back reads Back/بازگشت, with SemiBold Persian text. The language pill has no border. English reads LTR and Persian RTL. The book-source link is removed from the rendered page; research metadata remains available in the source data.
- Detail covers have no CSS rotation in either locale. Collection fans retain their existing layout and shared-cover transitions.
- `npm test` passes all 37 checks. The revised bilingual/library suites pass all 18 browser scenarios, including the new typography and testimonial scenarios, all 50 book details and shared-cover navigation. A separate targeted 10-scenario run also passed for typography, responsive collection/Selected Work layouts, mobile artwork and floating navigation. Checks cover 1440/390/320px, both languages, portrait loading, upright covers, the missing source link and dark testimonial styling.

## Resume and initial-state revision

Final verification: `npm test` passes all 37 checks; the complete `npm run test:browser` run passes all 56 scenarios. This includes byte-identical EN/FA downloads, default English/light with legacy preferences and OS dark mode, all 50 books, original company logos, inline experience headings, language alignment, and the dashboard regression suite.

- The November 2026 English and Persian PDFs replace the previous resume; the old source and obsolete build copies are removed. The file selected by Download CV follows the active language, including after internal navigation. Original uploaded PDF bytes and download filenames are checked.
- Every new public document starts English/LTR and light before CSS paints, independently of old saved preferences or system dark mode. A user's choices remain active through same-document navigation, while reload returns to English/light. Public preference storage and cross-tab theme synchronization are removed; dashboard behavior is unchanged.

## Previous full regression baseline

`npm test`: 37 server, story schema, book metadata, original-image integrity, localization coverage and build checks.

`npm run test:browser`: 53 Chromium scenarios:

The full suite passed 51 scenarios and exposed two navigation timing cases. The floating menu now also checks actual tab geometry on scroll, covering route restoration within one observer frame. The rapid-navigation scenario waits for the new view after the intentional departure animation. Both cases and rapid page navigation passed the targeted rerun. The final affected-suite rerun covers all bilingual, pointer/floating-navigation and Lenis scenarios; all 53 scenarios have passing results across these runs.

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
21. Annotated About alignment with the header at 1440/800/700/600/390/320px, large single-column category cards, centered headings and absence of search controls/filter status.
22. Opening all 50 books through their collection cards and checking author, Persian title, summary, takeaway, source, loaded responsive WebP cover, absence of sample artwork and Back.
23. Book transition, cached collection scroll, document titles, and browser back/forward.
24. About, collection and book layouts at 390/320px in dark mode, persistent theme and local Persian font loading.
25. Reduced motion bypasses the shared transition API, and keyboard Enter opens a collection.
26. Cover-clone animation and cleanup when View Transitions are unavailable.
27. Direct book/collection aliases and usable invalid-link states.
28. Rapid navigation cancels prior motion, retains the latest destination and leaves no named transition elements behind.
29. Large single-column Selected Work geometry, smaller corners and responsive images at 1920/1440/390/320px.
30. Requested featured books in both fans and shelves; header-width About layout, centered collection headings, shelf heights and grid-title alignment.
31. GSAP page entry and project reveals on scroll.
32. Real Three.js shader pixels, pointer reaction, idle draw-count stability and canvas cleanup when changing pages.
33. Reduced motion prevents and disposes the GPU scene while restoring the semantic image gallery.
34. Missing WebGL and context loss preserve the normal project images.
35. Touch layouts use the static gallery and keep book rows aligned at 390/320px.
36. Wheel input eases through intermediate positions and a 600px input reaches the configured 552px target while retaining native scroll position.
37. Section anchors update the URL, stop at the responsive padding offset and focus their destination.
38. Skip links jump immediately and resolve correctly on extensionless routes.
39. Reduced motion and page hide/show remove and recreate Lenis without changing the scroll position.
40. Native nested scroll regions and modal dialogs scroll independently; closing the modal resumes background wheel scrolling.
41. Route changes cancel pending inertia, and book Back/browser history restore collection position.
42. A missing Lenis chunk falls back to native scrolling and usable skip links.
43. The EN/FA control order, persisted locale/theme, local On fonts and SemiBold/Bold weights.
44. A single mobile tab row with horizontal scrolling, visible active tab, RTL direction and no page overflow.
45. Single localized book titles and complete Persian author/summary/takeaway copy on interior routes.
46. Persian rich-story text, metadata, media preservation and interior toolbar.
47. Experience company/role order, unchanged bullets, dates, dots, mirrored timeline and approved logo placeholders.
48. Progressive bottom blur activation, theme adaptation, pointer passthrough and footer link hit targets.
49. Bottom capsule visibility after the source tabs leave view, all four destinations and no document navigation.
50. Mobile/RTL bottom capsule bounds and hidden/inert state on interior pages.
51. Hover halo, pressed state, temporary click ring and playback/decoding of the local 220 ms source WAV.
52. Reduced-motion click behavior and the styled Back button’s Escape shortcut.
53. Blur/vertical text keyframes and last-destination behavior during interrupted departures.

The GPU browser scenarios use Chromium's software WebGL renderer to exercise actual shader compilation, draw calls and pixel output. An initial responsive-HTML-image texture size mismatch was reproduced and fixed by uploading decoded ImageBitmaps with their real pixel dimensions. A separate dark-theme resize check found no WebGL errors or horizontal overflow.

The reference video was inspected for its fanned covers, expanding collection surface, shelf arrangement and reverse motion. Desktop and mobile screenshots, including a paused transition midpoint, were reviewed locally. The supplied 50-image ZIP was visually matched to the book list. The updated collection cards, shelf and detail pages were reviewed with those covers, including the 320px dark-mode detail layout. No sample jackets or pending-cover message remain in the current bookshelf.

The replacement regression was reproduced before the fix: the `src` changed while the browser kept displaying the old `srcset` candidate. Text tools could also overlap image tools during repeated replacement. Responsive attributes are now cleared when using a raw replacement, the text bubble appears only for actual text selections, and saving waits for image preparation. Opening the link editor hides the text bubble, and floating text tools stay below the composer panels.

The browser checks run against a local HTTPS dashboard with the actual authentication/content worker and an in-memory GitHub adapter. They do not create stories or commits in the live portfolio. Screenshot checks cover the supplied card layout, light/dark states and mobile/editor views. Figma access was unavailable; the owner approved continuing from the supplied PNG references.

## Image measurement

For the initial composer release’s 32 local image assets: 33,053,076 original bytes versus 826,938 bytes for the generated 960px variants, a 97.5% reduction. This compares image bytes at a specified display resolution, not total deployment size or production network latency. Responsive selection chooses larger variants on high-density screens.

The three section switches in the local browser used a single document request for the entire session. Timing depends on the device and browser; the measured behavior is view replacement without document navigation.

## Reproduction

Use Node 24, `npm ci`, then `npm test`. For browser checks, install Chromium (or run `npx playwright install chromium`) and have OpenSSL available. `CHROMIUM_PATH` can select an existing browser. The preview fixture uses local ports 4173 and 4174 and generates its temporary HTTPS certificate under `../work/portfolio-browser`.

Provider deployment results are checked separately through the GitHub Actions and Cloudflare Pages commit checks.
