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


## Follow-up: phone data versus an MCI SIM router

The owner can read the dependency-free connection page on the phone's MCI mobile data, but not through Wi-Fi supplied by a router that also uses an MCI SIM. This establishes a successful Iranian mobile path to the domain and a separate failing path. It does not establish that every Iranian IP or all of MCI is blocked, nor does it yet isolate the router from differences between devices/browsers.

The supplied Namecheap screenshot shows the four apex A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`, matching GitHub's documented Pages targets. Its visible `admin` CNAME points to `ehsan-portfolio-admin.pages.dev`. No stale apex A or AAAA record is visible in the displayed rows; the screenshot also has a Show More control, so this is not verification of every possible record. No domain record was changed. The missing visible `www` record does not explain failure of the tested apex URL.

The next controlled check uses the exact same phone/browser and connection URL while switching only from mobile data to the router's Wi-Fi. If that reproduces the failure, inspect the router model and its actual DNS/APN configuration before changing it. DNS cache/resolver behavior and the SIM router's upstream route remain hypotheses. No remote router access or credentials are available.

References: GitHub Pages custom-domain records at https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site and Cloudflare's reversible router DNS setup at https://developers.cloudflare.com/1.1.1.1/setup/router/.


## Fresh screenshot: homepage HTML/styles present, subresources missing

The owner confirmed the failing main URL is `https://ehsandesigns.com/`, without `www`, and supplied a screenshot of its rendered homepage. The biography, social links, folder captions and current inline styles are present. All visible images/icons are broken and the static Tehran clock placeholder remains. This matches the controlled all-subresources-failed state; it does not identify the HTTP or browser failure behind those requests. A missing www record does not explain this exact URL.

The plain connection page is also visible in a supplied screenshot. Either screenshot may reflect cached HTML, so it does not alone prove a fresh successful network response on the failing connection. No blanket provider/DNS conclusion follows from it.

The opt-in `asset-check.html` performs same-origin checks for ordinary root HTML, a fresh `index.html`, the actual versioned basic/app scripts discovered in that HTML, its first shared chunk, the portrait, theme SVG and Inter font. It also tests real image decoding and execution of a tiny isolated `asset-probe.js`. It reports HTTP status, MIME type, bytes, elapsed time, response URL/server and available cache-transfer timing. Fresh checks use a timestamp query and no-store; the ordinary root check is retained for comparison. It notes a service-worker controller URL if one exists, and gives a visible no-JavaScript message. Results stay in the browser for the owner to copy; no analytics endpoint, cookies, secret values or third-party request is used. Both diagnostic files are excluded from the protected admin build. The portfolio's actual main page behavior is unchanged by this diagnostic addition.

The diagnostic build passed all 41 Node checks and three targeted Chromium checks: all working resources; simulated image HTTP 404, app HTTP 403, failed font request and browser-blocked script MIME; and disabled JavaScript. Mobile layouts at 390px and 320px were checked without horizontal overflow, and working/failing screenshots were reviewed. The no-JavaScript assertion uses visible geometry and textContent because Playwright's text matcher excludes noscript text, despite the browser rendering it correctly. These are controlled local checks; the owner's failing-connection report from the new page is still required.
