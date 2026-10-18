# Design QA — Portfolio pages

## Implemented Figma frames

- Case Studies list: node 88:108640.
- Case Studies card reference and hover: node 88:115497.
- Case Study details: node 88:115525.
- Experience: node 88:116089.

The shared header, profile image, CV download, theme toggle, typography, and spacing follow the existing portfolio frame. The Case Studies card keeps the reference dimensions and hover surface, and the pages adapt their content columns and screenshots to smaller viewports.

## Content and limitations

- Case study copy, image captions, dates, roles, responsibilities, and the stated lack of post-launch metrics come from the supplied Figma content.
- The article screenshots are stored locally so the site does not rely on temporary Figma URLs.
- The portfolio and dashboard remain English-only and use left-to-right layout. The About me page and dashboard section are removed.
- Dashboard edits remain in the current browser. Shared publishing still requires a database and authenticated admin access.
- Inter is loaded from Google Fonts with system sans-serif fallbacks. The dark theme remains available, using the established toggle.
