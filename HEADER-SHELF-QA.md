# Header, shelves, and folder refinements — 6 November 2026

- The public header remains in normal document flow on every route; scrolling moves it out of view. Centered page labels are removed from static HTML and runtime rendering.
- Back controls are fully rounded. The live Tehran clock is 11px. CV text is 13px in both languages and at desktop/mobile widths. The download tray opacity is increased from 0.2 to 0.5.
- About Me retains both introduction paragraphs. The visible introduction and bookshelf headings/count description are removed; named sections retain accessible labels.
- All six collection cards use a local walnut grain material, recessed sides and a shelf ledge. The three overlapping books retain the original sizes, fan transforms, hover spread (106px to 118px), rotations (7° to 11°), and center lift (−7px to −20px). Cards are 32px taller so the shelf fits below the books.
- Folder back/front are independent SVG surfaces with clean silhouettes. The old clipped duplicate raster front and its 3D warp are removed. Content still lifts on hover/focus and the whole visual grows 0.3%. Reduced motion suppresses the growth.
- Company badges are circular, with a white 3px frame and soft shadow, in the Experience timeline and homepage preview. Light-mode timeline ink is `#282828`; dark mode keeps the existing light ink. These checks are included in all four locale/theme/viewport scenarios.

- Home return fades reserve the native scrollbar lane. The owner-supplied video was reviewed and the original 7.5px content shift was reproduced with visible Chromium scrollbars before applying the fix.
- Timeline scroll start/end are clamped to the document range so the shorter header does not leave the cursor partway down at the top of the page. The original smooth scrub, halo, gray stops, and reverse motion are retained.

## Verification

The production site build succeeded. The final focused Chromium run passed all ten tests, covering English/light and Persian/dark at 1440px, English/dark and Persian/light at 350px, every interior route, real scrolling, clock updates/timezone, pill corners, text sizes, icon alpha, six shelf cards, original book fan motion, folder layers/growth, reduced motion, the live timeline scrub/reverse behavior, and home-return stability with visible native scrollbars. The return tests measured zero horizontal movement of the content, portrait, and CV controls across all four section round-trips in both English and Persian. No page errors or horizontal overflow were reported. Desktop/mobile shelves and 3× folder screenshots were inspected; a hover-edge rasterization defect found during the first visual review was corrected and the suite rerun.

Tests: `tests/browser/header-shelf-refinements.spec.mjs`, `tests/browser/experience-timeline.spec.mjs`, and `tests/browser/home-return-stability.spec.mjs`. They use the normal local preview fixture at port 4173, or a static production build when `PORTFOLIO_REFINEMENTS_URL` is provided. This review used the actual production build on a local static server. Managed content, existing fonts, resumes, company links, library details, and theme/language behavior are preserved.
