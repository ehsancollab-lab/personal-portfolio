# Design QA — Selected Work

## Requested corrections

- [x] Replaced the initials mark with the exact profile image exported from the Figma avatar node.
- [x] Moved the CV download to the top right of the first header row and applied the Figma button shape, icon, spacing, and label.
- [x] Replaced the text-only theme control with the exported 32 × 32 Figma moon control; its click still changes the light/dark palette.
- [x] Removed the language selector from the header while retaining Persian content through `?lang=fa` and browser language detection.
- [x] Applied Figma's Inter family, text colors (`#333` and `#3f3f3f`), and light control/surface color (`#f2f2f2`).
- [x] Added slightly heavier hover text to the section buttons without enabling the unfinished sections.

## Verification limits

- The source frame was inspected at node `78:76565` (1536 × 499 CSS px), and its avatar and header icons were exported from the corresponding Figma nodes.
- An implementation screenshot and interactive browser check could not be captured in this environment because Chromium exits during startup with a Crashpad permission error.
- Inter is requested from Google Fonts to match the Figma family. The network sandbox blocked a local fetch, so runtime font loading has not been visually confirmed; the site has system sans-serif fallbacks.
- The supplied frame covers only the light theme. The dark palette remains an implementation variant until a dark-theme design is provided.

**Final result: blocked**

The requested code changes are applied and the private Site deployment succeeded, but the rendered output could not be compared against the implementation in a browser here.
