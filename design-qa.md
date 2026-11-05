# Sky and Experience visual verification — November 5, 2026

## Scope and source truth

- Sky: owner-supplied `Rec 0045.mp4`, 3840×2160. Extracted 1200×675 frames at 00:06 (night) and 00:12 (day). Source paths: `/workspace/work/sky-reference/frame-02.jpg` and `frame-03.jpg`.
- Experience motion: owner-supplied `Rec 0046.mp4`, 3840×2160. Focused reference: `/workspace/work/experience-reference/frame-07.jpg` (1200×675, with the source's zoom and black side bars).
- The scope is the sky atmosphere, theme transition and timeline behavior. The portfolio's own text, image gallery, navigation, fonts and book collection remain the content target. The reference's central logo and navigation are outside scope. The owner explicitly requested an 80–90% opaque reading surface and sun/moon at the outer upper corners.

## Browser evidence and normalization

Real Chromium renders at device scale factor 1:

- Desktop, 1920×1080: `/workspace/work/portfolio-browser/sky-light-1920.png`, `sky-dark-1920.png`.
- Mobile, 350×800 and 320×800: `sky-light-350.png`, `sky-dark-350.png`, `sky-light-320.png`, `sky-dark-320.png` in the same directory.
- Persian CV: `sky-fa-cv-1920.png` (1920×900) and `sky-fa-cv-350.png` (350×900).
- Timeline: `experience-smooth-progress.png` (1440×1000) and `experience-timeline-fa-350.png` (350×800).

Full-view source/implementation comparison: `/workspace/work/sky-reference/comparison-final.png`. The source's black top/bottom bars were cropped to its 1200×561 content area, then source and implementation were fitted without stretching into equal review cells. The different website layouts are intentional; this comparison evaluates the background and foreground readability, not the reference logo layout.

Focused timeline comparison: `/workspace/work/experience-reference/comparison-final.png`. It puts the source's zoomed line and the implementation's native-size line in one review image. Because source browser zoom is unknown, widths are judged qualitatively; the implementation uses a 2px route and 8px cursor. Both source and implementation were opened and compared in these combined inputs. Mobile text and the CV control were additionally inspected at native screenshot size.

## Fidelity surfaces

- **Fonts/type:** public headings remain 19px Bold; Persian body stays On SemiBold at 18px/25px. CV text now uses the genuine On SemiBold (600), matching the selected tab. Its dimensions equal icon + text + gap + padding at 1920/700/390/350/320px. English/On families and existing book quotation sizes remain verified.
- **Spacing/layout:** the shared header/main alignment and artwork width remain intact. A 32px desktop / 56px mobile sky opening makes the celestial assets visible above or beside the reading surface. The surface expands for wide artwork/case details and contains the footer. No document overflow at 320/350px.
- **Colors/tokens:** blue daytime atmosphere, a small white sun at upper right; dark navy night, restrained stars and crescent at upper left. Foreground surface opacity is exactly 0.88 in each theme; foreground text and links were checked after theme colors settled. Timeline has pale dashed future segments, gray stations, blue passed segments and a filled blue moving cursor with a faint halo.
- **Images:** generated local sky images reproduce the soft cloud art direction. Birds have real transparent alpha; sun/moon are unmodified Phosphor assets with their MIT license. No placeholder background imagery remains. Generated cloud formations are a visual reconstruction, not the reference site's original simulation.
- **Copy/content:** portfolio biography, project images, book notes, company names, roles, dates, 13 experience bullets and language-dependent resumes are preserved. No decorative UI text or new public controls were added.

## Iterations and verification

1. Initial full regression ran 65 scenarios: 61 passed. It exposed three timing-sensitive checks (separate responsive rectangle reads, a short-lived text animation assertion and GPU initialization after preference changes) and the new cursor sampling check.
2. Cloud translation now uses subpixel steps over its very slow cycle, avoiding unnecessary distinct cloud positions every frame. Experience refreshes its geometry after entry motion completes. Responsive rectangles are read atomically; text entrance tests record the actual animation keyframes rather than depending on a narrow playback window. Theme captures wait for foreground colors as well as background opacity.
3. The final affected-suite rerun passes all 15 scenarios, including all four cases from the full run. It covers bilingual font metrics, downloads/defaults, books/cases, responsive Experience, permanent blur, GPU preference changes, public navigation, day/night sky, bird-cycle states, reduced motion, cursor interpolation/reversal/station colors, and the Persian CV. All 65 scenarios have passing results across these runs. `npm test` passes all 37 checks and builds both targets.
4. Cursor frame samples verify intermediate positions during its 0.85-second scrub, line/head alignment, completion, reversal and gray-to-blue station changes. Scene and observer cleanup work across routes and locale/viewport changes. Browser console errors are checked. No writes are made to the live content store by the tests.

## Findings and limits

No actionable P0/P1/P2 findings remain. The exact cloud formations and source browser zoom are not reproducible from the videos alone; these are accepted differences for the scoped visual reconstruction. Chromium uses software WebGL in this environment, so animation timing here is not a production device frame-rate benchmark. Physical Safari/iOS testing was not performed.

## Implementation checklist

- [x] Day/night scenes, sun/moon, sparse stars and occasional tiny bird flights.
- [x] Readable 88% central surface and responsive footer.
- [x] Existing theme/language/navigation and new click sound preserved.
- [x] Reduced motion/data saving/hidden-page behavior.
- [x] Smooth filled cursor, pale halo, dashed future path and station updates.
- [x] Persian CV SemiBold and content-sized width.
- [x] Source/implementation full-view and focused visual review.
- [x] Regression checks and affected-suite rerun.

final result: passed
