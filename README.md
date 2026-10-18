# Ehsan Masoomi Portfolio

Responsive, English-only static portfolio based on the supplied Figma frames.

The site includes Selected Work, a Case Studies list and detail page, and Experience.

## Preview

From this directory, run a static file server with: python3 -m http.server 4173

Then open http://localhost:4173.

## Content and assets

- content.js contains the English copy, external links, and the Selected Work image order.
- case-content.js contains the Case Studies article, its local screenshot assets, and the Experience entries taken from the supplied Figma designs.
- case-studies.html, case-study.html, and experience.html are responsive public pages that use the shared header, theme control, CV download, and footer.
- assets/projects/ contains the 20 supplied Figma exports in the same order as the Selected Work frame.
- assets/Ehsan-Masoomi-CV-EN.pdf is the supplied downloadable CV.
- assets/figma/ contains the profile portrait and header icons exported from the Figma frame.
- The CV download and theme control sit in the top header row, as shown in Figma. The theme control uses the Figma moon icon.
- The portfolio and dashboard always use English and a left-to-right layout.
- admin.html is an English-only responsive content dashboard for Selected Work, Case Studies, Experience, and profile/contact details. It supports create, edit, delete, visibility, Selected Work reordering, import, and JSON export.
- Case study content uses simple Markdown headings, bullets, and local image markers in the Details field. The available image names appear in the image selector and the field hint.
- Dashboard changes are stored in the current browser. Selected Work, profile/contact, Case Studies, and Experience updates appear on the public pages in that same browser. Shared publishing across visitors needs a database and authenticated admin access, neither of which is part of this static version.
