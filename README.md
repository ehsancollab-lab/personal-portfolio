# Ehsan Masoomi Portfolio

Responsive, bilingual (English and Persian) static portfolio based on the supplied Figma Selected Work frame.

## Preview

From this directory, run a static file server, for example:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Content and assets

- `content.js` contains the current bilingual copy, verified external links, and the Selected Work image order.
- `assets/projects/` contains the 20 supplied Figma exports in the same order as the Selected Work frame.
- `assets/Ehsan-Masoomi-CV-EN.pdf` is the supplied downloadable CV.
- The other navigation tabs are shown as planned and disabled until their designs and content are provided.
- Language and theme preferences are stored in the visitor's browser. No dashboard, backend, or database is included yet.

The Figma profile photo was not included in the ZIP and its asset host is not reachable from this environment. The header uses the initials `EM` until the portrait file is supplied.
