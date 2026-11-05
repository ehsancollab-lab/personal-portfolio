# Plain background restoration — November 5, 2026

The owner subsequently discarded the complete sky treatment. Its runtime, stylesheet, build entries and dedicated assets are removed. Existing opaque theme backgrounds and pre-sky header/footer geometry are restored. The theme toggle, permanent bottom blur, Experience timeline, CV sizing and other content are retained; the floating bottom menu stays removed.

No local browser or automated test run was performed for this removal. The public build is used for publication. The cloudier-sky evidence below documents the superseded version and does not describe the current result.

---

# Historical: paler, cloudier sky — November 5, 2026

## Target and scope

The owner requests a lighter, less blue day sky with more white clouds behind the central text, a smaller sun, and more visible night clouds. The latest supplied screenshot and `Rec 0045.mp4` remain the atmosphere references; `/workspace/work/sky-reference/frame-03.jpg` is the extracted video reference. The existing portfolio remains the layout/content target.

## Evidence

- Before: `/workspace/work/cloudier-sky/before/light-1920.png` and `dark-1920.png`.
- After: `/workspace/work/portfolio-browser/sky-cloudier-light-1920.png` and `sky-cloudier-dark-1920.png`.
- Equal-scale comparison: `/workspace/work/cloudier-sky/comparison.png`. All four desktop captures are 1920×1080 at scale 1, fitted without stretching into review cells. The final combined image and native desktop renders were opened and compared.
- Mobile: `sky-cloudier-{light,dark}-{350,320}.png` under `/workspace/work/portfolio-browser/`, at 800px height and scale 1. The 350px light/dark renders were opened and reviewed.
- Route evidence: `sky-no-surface-{work,book,experience}-{en,fa}-{light,dark}.png` in the same directory, captured with the new sky assets. These include project artwork, book copy and small Experience metadata.
- Captures now wait for image decoding and two rendered frames. An earlier capture showing only the fallback color was replaced before final comparison.

## Required fidelity surfaces

- **Typography:** Inter/On, existing weights, heading sizes, body leading and locale alignment retain their prior settings. The day center is much whiter; light text remains legible over the darker night field.
- **Layout:** content, tabs, cards and footer retain their geometry. No horizontal overflow at 350/320px. Text continues directly over the sky, with the permanent bottom blur. The central panel and floating bottom menu remain absent.
- **Colors:** the new day image has mean linear luminance 0.844 across its middle 40% (previously 0.664); mean blue-minus-red falls from 0.256 to 0.081. Night central luminance rises from 0.005 to 0.017. These are direction checks, not a count of clouds or a complete WCAG audit.
- **Assets:** two locally generated, optimized WebP images provide abundant central day clouds and more visible silver-blue night clouds. Fresh filenames avoid reusing cached older skies. Provenance, dimensions and hashes are in `assets/sky/README.md`. The sun is 16px on desktop and 13px on mobile with restrained glow; the moon, bird flock and project/book assets are unchanged.
- **Content:** biography, book notes, project descriptions, experience bullets, dates and resume files are retained.

## Findings and verification

No actionable P0/P1/P2 findings remain for this scoped change. Daytime central text sits over a paler, cloudier field; night clouds are visibly fuller without dominating the text. The sun is closer to the reference size on desktop and mobile.

`npm test`: all 39 checks pass and both builds succeed. All four affected Chromium scenarios pass: sky/theme/mobile geometry, animated clouds/birds and reduced motion, seven public route types in English/Persian and both themes, and transparent case details on direct/SPA navigation. Sky scenarios check console errors. The complete historical browser suite was not rerun for this asset refinement. Physical Safari/iOS and production FPS were not measured.

## Checklist

- [x] Paler day sky with more white central clouds.
- [x] More visible night clouds with a dark field for light text.
- [x] Smaller desktop/mobile sun and softer glow.
- [x] Equal-scale before/after and native mobile review.
- [x] Preserve navigation, content, direct sky treatment and reduced motion behavior.

final result: passed
