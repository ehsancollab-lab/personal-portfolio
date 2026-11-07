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


## Follow-up: MCI / Hamrah-e Aval, 7 November 2026

The owner retried release `3c5f00b` without a VPN and still saw a white page, specifically on Hamrah-e Aval. The JavaScript resilience change therefore did not establish a resolution on that connection.

A controlled 6.5-second delay of CSS requests reproduced a separate blank-render path: at 4032ms, the real biography was already present in the DOM but no first paint had occurred. Nested stylesheet imports prolonged the wait. The build now bundles and embeds the existing four public stylesheets and their imports into every entry HTML document, preserving their order, rules and local font files. First paint no longer waits for those network requests. In the follow-up local run, with the main bundle blocked and stylesheet requests intercepted, first paint/contentful paint occurred at 500ms; at 4192.3ms the real biography was present, the loader was gone, and no separate stylesheet request had been made. These are local measurements, not a connection from MCI.

`connection-check.html` is a plain, unstyled, untracked HTML document with no scripts, fonts, images or stylesheet dependencies. It can distinguish inability to receive this minimal document from a problem involving homepage resources. It is intentionally excluded from the dashboard build and from search indexing.

Direct HTTPS inspection from the execution environment was also attempted: the normal sandbox could not reach its inherited proxy; the approved outside-sandbox retry received a proxy CONNECT 403. The runtime reports restricted egress with no user domain grants and no Iranian egress. This is an environment-policy denial, not an HTTP 403 from the portfolio or evidence about MCI. No DNS, TLS or provider block has been established, and no DNS or hosting configuration has been changed.

The updated production build passed all 39 Node checks and all 29 focused Chromium checks (2.8 minutes), including first paint with stylesheet downloads blocked, the plain connection page with every subresource blocked, delayed/failed scripts, both locales at mobile widths, existing library hover and home-return stability. The 320px Persian header and mobile home/library screenshots were reviewed. Actual MCI reachability remains unverified. The owner was asked for the Namecheap Host Records table because DNS account access is not available.
