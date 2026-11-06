# Blossom reference colors

## Source

Owner-selected reference: https://blossom-carousel.com/ and the five supplied mobile screenshots (`1000110888.jpg`–`1000110892.jpg`). The live page was read for context; supplied screenshots are the visual color source. Pixel sampling of large flat regions confirms the `#fafafa` page, white cards and black headings/actions in the reference. Gray text and border values are adapted from the JPEG reference; smaller supporting copy uses a slightly darker gray for readability.

The owner subsequently requested replacing pure black throughout the public UI with `#282828`. The tokens below reflect that update, including button surfaces, interactive accents, icon filters, and low-opacity shadows.

## Public tokens

| Role | Light | Dark adaptation |
| --- | --- | --- |
| Page, including case details | `#fafafa` | `#111111` |
| Card/panel surface | `#ffffff` | `#1a1a1a` |
| Secondary controls | `#ffffff` | `#202020` |
| Soft surface | `#f0f0f0` | `#262626` |
| Headings/body foreground | `#282828` | `#fafafa` |
| Supporting copy | `#737373` | `#aaaaaa` |
| Border | `#e2e2e2` | `#363636` |
| Primary/selected action | `#282828` | `#fafafa` |
| Primary action label/icon | `#ffffff` | `#111111` |
| Primary action hover | `#3a3a3a` | `#e5e5e5` |
| Keyboard focus/interactive accent | `#282828` | `#fafafa` |

The dark scheme is derived from the same neutral hierarchy; the screenshots do not show a reference dark theme. Shadows use low-opacity `#282828`. The library shelf and fallback artwork use neutral tokens. The existing project images, book-cover images, portraits and company logos retain their original artwork colors. The private content dashboard retains its own separate theme.

Tokens live in `styles.css`. Public component styles consume them in `library.css`, `i18n.css`, `interaction.css` and `case-cards.css`. Static and SPA header/detail controls share the same icon source; browser theme metadata reads the computed page background.

## Card and bookshelf treatment

The owner's subsequent desktop Blossom screenshot supplies the card finish: an 18px radius, fine neutral edge and compact layered shadow (`--card-radius` / `--card-shadow`). Public project cards, case previews, story images/videos and collection panels use the shared finish. Book covers keep their physical corner shape and use the shared shadow.

Collection cards and open collection heroes use the owner's plain `#EDEDED` background in both themes, with `#282828` titles and `#737373` descriptions. Wooden grain, inset walls, shelf ledges, collection numbers and count labels are removed. The original covers, overlapping card fan and hover movement remain.
