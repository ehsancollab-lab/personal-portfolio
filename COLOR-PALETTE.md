# Blossom reference colors

## Source

Owner-selected reference: https://blossom-carousel.com/ and the five supplied mobile screenshots (`1000110888.jpg`–`1000110892.jpg`). The live page was read for context; supplied screenshots are the visual color source. Pixel sampling of large flat regions confirms the `#fafafa` page, white cards and black headings/actions. Gray text and border values are adapted from the JPEG reference; smaller supporting copy uses a slightly darker gray for readability.

## Public tokens

| Role | Light | Dark adaptation |
| --- | --- | --- |
| Page, including case details | `#fafafa` | `#111111` |
| Card/panel surface | `#ffffff` | `#1a1a1a` |
| Secondary controls | `#ffffff` | `#202020` |
| Soft surface | `#f0f0f0` | `#262626` |
| Headings/body foreground | `#000000` | `#fafafa` |
| Supporting copy | `#737373` | `#aaaaaa` |
| Border | `#e2e2e2` | `#363636` |
| Primary/selected action | `#000000` | `#fafafa` |
| Primary action label/icon | `#ffffff` | `#111111` |
| Primary action hover | `#262626` | `#e5e5e5` |
| Keyboard focus/interactive accent | `#000000` | `#fafafa` |

The dark scheme is derived from the same neutral hierarchy; the screenshots do not show a reference dark theme. Shadows use low-opacity black. The library shelf and fallback artwork use neutral tokens. The existing project images, book-cover images, portraits and company logos retain their original artwork colors. The private content dashboard retains its own separate theme.

Tokens live in `styles.css`. Public component styles consume them in `library.css`, `i18n.css`, `interaction.css` and `case-cards.css`. Static and SPA header/detail controls share the same icon source; browser theme metadata reads the computed page background.
