# Header, shelves, and folder refinements — 6 November 2026

- The public header remains in normal document flow on every route; scrolling moves it out of view. Centered page labels are removed from static HTML and runtime rendering.
- Back controls are fully rounded. The live Tehran clock is 11px. CV text is 13px in both languages and at desktop/mobile widths. The download tray opacity is increased from 0.2 to 0.5.
- About Me retains both introduction paragraphs. The visible introduction and bookshelf headings/count description are removed; named sections retain accessible labels.
- All six collection cards use a local walnut grain material, recessed sides and a shelf ledge. The three overlapping books retain the original sizes, fan transforms, hover spread (106px to 118px), rotations (7° to 11°), and center lift (−7px to −20px). Cards are 32px taller so the shelf fits below the books.
- Folder back/front are independent SVG surfaces with clean silhouettes. The old clipped duplicate raster front and its 3D warp are removed. Content still lifts on hover/focus and the whole visual grows 0.3%. Reduced motion suppresses the growth.

## Verification

The production site build succeeded. The focused Chromium suite passed all six tests (28 seconds), covering English/light and Persian/dark at 1440px, English/dark and Persian/light at 350px, every interior route, real scrolling, clock updates/timezone, pill corners, text sizes, icon alpha, six shelf cards, original book fan motion, folder layers/growth, and reduced motion. No page errors or horizontal overflow were reported. Desktop/mobile shelves and 3× folder screenshots were inspected; a hover-edge rasterization defect found during the first visual review was corrected and the suite rerun.

Test: `tests/browser/header-shelf-refinements.spec.mjs`. It uses the normal local preview fixture at port 4173, or a static production build when `PORTFOLIO_REFINEMENTS_URL` is provided. This review used the actual production build on a local static server. Managed content, existing fonts, resumes, company links, library details, and theme/language behavior are preserved.
