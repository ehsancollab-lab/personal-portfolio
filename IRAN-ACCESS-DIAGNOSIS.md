# Public access investigation

## Report and confirmed frontend issue

The owner reports a white page or a loader that stays visible without a VPN in Iran. The live custom domain is `https://ehsandesigns.com/`; the public site uses GitHub Pages and the protected dashboard uses Cloudflare Pages.

The previous public entry HTML depended on a roughly 403 KB JavaScript bundle (about 97 KB gzip) to create the biography, links and most interior content. If that file is delayed or unavailable, the page can lack its actual content. The former loader also relied on application readiness and a global body visibility rule. This is a confirmed frontend dependency; it does not establish an ISP-level block or DNS fault.

## Changes

- Pre-render the existing page renderers into real HTML: eight page types, six collections, fifty book details and the published cases, in both languages.
- Preserve native navigation, including query and fragment detail links; keep lightweight independent clock/language/theme controls.
- Embed the tiny startup theme and preloader scripts so downloading them cannot block HTML parsing.
- Release the loader independently of the application bundle, with a 4.5-second deadline and no global body visibility hiding.
- Preserve language/theme choices if the application arrives late; avoid replaying entrance motion over the static content.
- Keep required fonts, scripts and styles on the same host and version production entry assets by content hash.

## Verification scope

Browser checks deliberately block the main bundle, block every downloaded script, delay the main bundle by 6.5 seconds, block every external domain, disable JavaScript, and visit all fifty legacy book detail URLs. Existing mobile/header, loader, library hover, timeline and home-return checks cover visual regressions. These controlled scenarios establish resilience to missing/delayed JavaScript, not reachability from Iran.

## Remaining network evidence

This execution environment has no Iranian egress or VPN. Its restricted outbound network cannot directly inspect the custom domain or initiate an Iranian third-party probe. Failed tool requests and local DNS resolver refusals are environment limitations, not evidence about Iranian access. No provider or DNS migration has been performed on that basis.

After the new deployment, the owner must retry the custom domain without a VPN. If it still fails, record the ISP and whether the HTML document itself arrives; a screenshot or browser network trace can distinguish document/DNS/TLS failure from an individual blocked file. Test the actual custom domain on both mobile and fixed-line networks before claiming the issue resolved.
