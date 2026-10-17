# Ehsan Masoomi Portfolio

Responsive, bilingual (English and Persian) static portfolio based on the supplied Figma Selected Work frame.

## Preview

From this directory, run a static file server, for example:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Content and assets

- `content.js` contains the bilingual copy, external links, and the Selected Work image order.
- `assets/projects/` contains the 20 supplied Figma exports in the same order as the Selected Work frame.
- `assets/Ehsan-Masoomi-CV-EN.pdf` is the supplied downloadable CV.
- `assets/figma/` contains the profile portrait and header icons exported from the Figma frame.
- The CV download and theme control sit in the top header row, as shown in Figma. The theme control uses the Figma moon icon.
- The language selector is hidden from the header per the latest feedback. Persian remains available with `?lang=fa`; language and theme preferences are stored in the visitor's browser.
- The other navigation tabs are present with hover feedback but remain unavailable until their designs and content are provided.
- No dashboard, backend, or database is included yet.

