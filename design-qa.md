# Direct sky background — November 5, 2026

## Target and scope

The owner's latest annotated screenshot requests removal of the central 88% reading overlay in light and dark mode. The current portfolio is the layout/content target; the sky reference videos remain the atmosphere reference. The previous reading-panel treatment is intentionally superseded.

## Evidence

- Before: `/workspace/work/sky-no-surface/before/light-1920.png` and `dark-1920.png`, captured from the prior verified implementation.
- After: `/workspace/work/portfolio-browser/sky-no-surface-light-1920.png` and `sky-no-surface-dark-1920.png`.
- Combined, equal-scale before/after comparison: `/workspace/work/sky-no-surface/comparison.png`. All four original desktop captures are 1920×1080 at device scale 1, fitted without stretching into the review cells. The combined image and native-size current renders were opened and compared.
- Mobile: `sky-no-surface-light-350.png`, `sky-no-surface-dark-350.png`, and corresponding 320px images, at 800px height and scale 1.
- Focused page evidence: `sky-no-surface-work-{en,fa}-{light,dark}.png`, `sky-no-surface-book-{en,fa}-{light,dark}.png`, and `sky-no-surface-experience-{en,fa}-{light,dark}.png` in the same directory. These cover project imagery, small metadata and book text at native desktop size.

## Required fidelity surfaces

- **Typography:** the existing Inter/On families, heading sizes/weights, body leading and Persian CV weight are retained. Experience company names use the shared muted text color; date ranges have opacity 1.
- **Layout:** header, main, project sizing and footer retain their geometry. The overlay was absolutely positioned, so removing it creates no content shift. No horizontal overflow at 350/320px.
- **Colors/readability:** light content uses the existing dark text directly on the blue cloud sky; dark content uses light text directly on the night sky. Day image sampling gives a conservative 5.53:1 minimum for body/muted text across that image. This prompted the two Experience metadata adjustments. Night text was checked in rendered screenshots, including sparse stars. This is not a full WCAG audit or a claim about every transitional pixel.
- **Assets:** original sky, cloud, bird, celestial, book and project assets are unchanged. The central panel and its border/shadow are absent. Existing project/card surfaces remain part of their components or artwork.
- **Copy/content:** biography, book notes, projects, roles, dates and resume files are unchanged.

## Findings and checks

No actionable P0/P1/P2 visual findings remain for this scoped change. Main text and project artwork remain clear, and the continuous sky is more visually integrated. The lighter Experience metadata needed stronger contrast and was corrected before the final review.

Browser checks verify the missing overlay and transparent main/body on all seven public route types in English/Persian and light/dark, plus scene switching, clouds/birds, reduced motion, timeline movement/reversal and the fitted Persian CV. Console errors are checked in the sky/timeline scenarios. Physical Safari/iOS testing was not performed.

`npm test`: 37 checks passed, with both builds successful. The affected browser run: all six scenarios passed. This revision did not rerun the entire historical browser suite.

## Checklist

- [x] Remove central panel, border and shadow from both themes.
- [x] Keep content directly over the sky on all public routes.
- [x] Improve the two small Experience metadata styles for readability.
- [x] Compare native desktop/mobile renders and equal-scale before/after evidence.
- [x] Preserve theme, navigation, project imagery, motion and resume control behavior.

final result: passed
