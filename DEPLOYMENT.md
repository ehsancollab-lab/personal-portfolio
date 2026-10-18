# Independent hosting

The public portfolio runs on GitHub Pages at `https://ehsandesigns.com`.
The password-protected dashboard runs on Cloudflare Pages at `https://admin.ehsandesigns.com`.
All application source and published content are in the owner's GitHub repository.
Cloudflare stores encrypted configuration secrets and a small D1 table for persistent login-attempt limits. No ChatGPT account is needed to run or maintain the deployed application.

## 1. Public portfolio: GitHub Pages

Repository: `ehsancollab-lab/personal-portfolio`.

1. GitHub Free requires a **public repository** for Pages. This repository is already public with the owner’s approval. A private fork needs an eligible paid plan.
2. Open repository **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Set **Custom domain** to `ehsandesigns.com`. Verify ownership using the TXT record GitHub provides in the account's Pages settings.
4. Open **Actions → Publish portfolio to GitHub Pages → Run workflow** if no deployment is already running.
5. Wait for successful deployment before changing the domain's web records. Enable **Enforce HTTPS** after the certificate becomes available.

The workflow tests the security-critical dashboard code, builds `build/site`, and deploys that directory only. It excludes admin scripts and server code. `data/portfolio.json` is the shared published content. Dashboard updates create commits to `main`, which trigger deployment automatically. A commit is saved before its Pages deployment finishes; a successful save and a successful public deployment are distinct states.

## 2. Dashboard: Cloudflare Pages

Create the project in the owner's Cloudflare account:

1. **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize access only to `ehsancollab-lab/personal-portfolio` and select `main`.
3. Framework: **None**. Build command: `npm run build:admin`. Output directory: `build/admin`. Root directory: repository root. Node version is defined by `.nvmrc` (24).
4. Create a free D1 database for login limits, then add a D1 binding named **`AUTH_DB`** under the Pages project's **Settings → Bindings**. The worker creates its login-attempt table on first use. Login intentionally fails closed if this binding is missing.
5. Add the encrypted secrets below to the production Pages project. Redeploy after adding bindings/secrets.

| Secret | Value |
| --- | --- |
| `ADMIN_PASSWORD` | The chosen dashboard password, entered directly in the encrypted secret field (10–256 characters) |
| `GITHUB_CONTENT_TOKEN` | Owner-created fine-grained GitHub token: only this repository, Contents read/write |

In **Settings → Variables and Secrets**, select **Production**, add each name and value, choose **Secret / Encrypt**, and save. Enter the actual password as `ADMIN_PASSWORD`, not a hash. No terminal command, source download, or local Node.js installation is needed for this setup. Never commit the password/token or put them in chat, a workflow file, or public build variables.

The worker compares the password on the server and automatically derives a session-signing key using HKDF-SHA256 from the encrypted GitHub token and the configured password. The signing key is not derived from the password alone. Changing the password or GitHub token invalidates existing sessions. `AUTH_DB` remains required for persistent login-attempt limits.

Existing advanced setups with `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` remain supported. The optional `node scripts/admin-secrets.mjs` utility generates those values; it is not part of the simple setup. When `ADMIN_PASSWORD` is configured, it takes precedence over the verifier. An optional `SESSION_SECRET` supplies the signing-key seed instead of the GitHub token.

Optional plain configuration variables (defaults match this project):

| Variable | Default |
| --- | --- |
| `GITHUB_OWNER` | `ehsancollab-lab` |
| `GITHUB_REPO` | `personal-portfolio` |
| `GITHUB_BRANCH` | `main` |

Create the fine-grained token at `https://github.com/settings/personal-access-tokens/new`. Give it an expiration date, select **Only select repositories → personal-portfolio**, and grant only **Contents: Read and write**. Rotate the encrypted secret before the token expires. This token cannot configure Pages or change repository visibility.

The dashboard's landing page asks for the password. Password verification happens in the worker. A signed, host-only Secure/HttpOnly/SameSite session cookie lasts eight hours. All dashboard assets and content APIs require authentication; writes also require the correct Origin and an up-to-date content revision. Persistent D1 counters limit login attempts. Signing-secret rotation invalidates all sessions.

After saving bindings and secrets, open **Deployments**, select the latest `main` deployment and choose **Retry deployment**. Use the custom admin domain once it is active, or the assigned `pages.dev` hostname while DNS is pending. Successful login and saving a content change require the production configuration and deployment to be complete.

The advanced-mode `_worker.js` is deployed with `_routes.json` covering every route; keep this configuration so protected assets cannot be served around authentication. The worker source itself is an execution artifact and is not exposed as a static file by Pages.

6. Add `admin.ehsandesigns.com` under the project's **Custom domains**. Copy the **actual assigned Pages hostname** for the DNS CNAME. Do not make up a `pages.dev` address. Pages supports this subdomain with external DNS, so Namecheap can remain the DNS provider.

## 3. DNS at Namecheap

Keep the domain's existing Namecheap nameservers. Open **Domain List → Manage → Advanced DNS → Host Records**.

After both sites are ready, replace the previous site's web records with:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| A Record | `@` | `185.199.108.153` | Automatic |
| A Record | `@` | `185.199.109.153` | Automatic |
| A Record | `@` | `185.199.110.153` | Automatic |
| A Record | `@` | `185.199.111.153` | Automatic |
| CNAME Record | `www` | `ehsancollab-lab.github.io` | Automatic |
| CNAME Record | `admin` | **Actual hostname assigned to the dashboard by Cloudflare Pages** | Automatic |

Configure each custom domain in its host before creating the corresponding DNS records. Remove conflicting old root A/AAAA/ALIAS/CNAME/URL Redirect records when switching the root domain; preserve unrelated mail and verification records. The previous Sites root A targets (`162.159.143.30`, `172.66.3.26`) belong to the old deployment. Copy GitHub's verification TXT record exactly if ownership verification is requested. Namecheap's Host field uses the relative hostname, not the full domain.

Check the actual domain over HTTPS from the user's Iranian mobile and fixed-line connections. The provider's own homepage and its default deployment hostname do not establish accessibility of the final custom domain.

## 4. Content and recovery

The dashboard stays navigable and shows card hover previews while loading. If GitHub content cannot be loaded, editing controls are explicitly disabled and the status bar provides the connection error and **Retry loading**. A preview is not a saved change. Check that `GITHUB_CONTENT_TOKEN` is an encrypted production secret with access to the configured repository and Contents read/write. API errors distinguish rejected credentials, missing content, rate limits, and connection timeouts without exposing secrets.

Edits are automatically saved to GitHub after a short debounce. New images become deduplicated files under `assets/uploads/` and the content JSON stores their paths. A single atomic Git tree/commit includes the image files and content change. Non-fast-forward branch updates are rejected; another editor's work is never force-overwritten. After an error, the browser retains a local recovery draft and the dashboard offers retry, backup export, and loading the latest published content.

The supplied Figma content is seeded in `data/portfolio.json`; no project results were invented for this migration. Edits made in the previous browser-only dashboard exist only on that old origin/device. Export them before migration and import that JSON through the dashboard's backup controls to preserve them. Authentication and shared storage are new server features; the old Sites dashboard does not provide them.

GitHub history provides version recovery. Keep an independent source/assets backup as well. Resetting content in the dashboard publishes a reset; it does not erase Git history.

## Maintenance

- Public build: `npm run build:site`.
- Dashboard build: `npm run build:admin`.
- Security/content checks: `npm test`.
- Edit code locally or in GitHub, commit to `main`, and check both providers' deployment status.
- A GitHub Free public source repository exposes source/assets; never commit credentials. GitHub Pro supports Pages from private repositories.
- Keep the domain renewed and respect each host's free-tier limits. Hosting is independent of ChatGPT subscriptions.

References: [GitHub Pages setup](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [GitHub domain records](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/), [Cloudflare D1 bindings](https://developers.cloudflare.com/pages/functions/bindings/#d1-databases).
