# Design QA — Selected Work

**Findings**
- [P2] Browser-rendered comparison is blocked. The local server returned HTTP 200 for the page, JavaScript, a project image, and the CV PDF. Chromium could not create its runtime profile/crashpad state, so no implementation screenshot or visual comparison was produced.
- [P2] The profile portrait is not available locally. The ZIP contains the 20 project frames but no portrait; the Figma asset URL is outside this environment's allowed network hosts. The implementation uses the initials `EM` until the portrait is supplied.

**Open Questions**
- The supplied design shows the light theme only. The dark palette is an implementation variant and has not been visually reviewed.
- The three future tabs remain disabled pending their designs and content.

**Evidence and comparison state**
- Source visual truth: [Figma node 78:76435](https://www.figma.com/design/3JAVZyBOnAA5iYFDe0Z5wT/Case-Study?node-id=78-76435)
- Source frame: 1536 × 5646 CSS px. The Figma screenshot tool returned a 490 × 1800 preview; original dimensions were 1536 × 5646.
- Implementation URL: `http://127.0.0.1:4173/`
- Implementation screenshot: not captured; no implementation pixel dimensions or density normalization are available.
- Intended state: English, light theme; responsive rules target desktop, tablet, and mobile. Browser interaction states were not captured.
- Full-view comparison: unavailable because the implementation screenshot could not be captured.
- Focused-region comparison: unavailable for the same reason.
- Static checks: page, JS module, sample image, and CV PDF returned HTTP 200; both JavaScript modules passed Node syntax parsing.

**Implementation Checklist**
- [x] Keep the supplied project images in the Figma frame order.
- [x] Connect the supplied CV PDF to the download control.
- [x] Add English/Persian copy, RTL direction, theme toggle, and responsive grid rules.
- [ ] Capture desktop, tablet, and mobile browser views and compare them to the source.
- [ ] Replace the initials mark with the supplied portrait asset when available.

**Final result: blocked**

Blocker: browser-rendered evidence could not be captured in this environment, so visual fidelity and responsive states remain unverified.
