# Deploying SMR V1 & SMR V2 to Netlify

Two independent Netlify sites for the Sydney Metal Roofing Projects redesigns:

| Version | Folder       | Recommended site name | Production URL              |
| ------- | ------------ | --------------------- | --------------------------- |
| SMR V1  | `version-1/` | `smr-v1`              | `https://smr-v1.netlify.app` |
| SMR V2  | `version-2/` | `smr-v2`              | `https://smr-v2.netlify.app` |

Both are static (HTML + inline CSS/JS, no build step). Each folder contains its own `netlify.toml` with security headers, cache rules, and an SPA fallback.

---

## Option 1 — Drag & Drop (fastest, no CLI)

1. Open https://app.netlify.com/drop in a browser.
2. Log in (or create a free account).
3. **For SMR V1:** drag the entire `version-1/` folder into the drop zone.
4. Wait for the deploy to finish, then click **Site settings → Site information → Change site name** and enter `smr-v1`.
5. Repeat for **SMR V2** with the `version-2/` folder, site name `smr-v2`.

That's it — both sites are live at `https://smr-v1.netlify.app` and `https://smr-v2.netlify.app`.

---

## Option 2 — Netlify CLI (recommended for repeat deploys)

### One-time setup

```bash
npm install -g netlify-cli
netlify login
```

### Deploy SMR V1

```bash
cd version-1
netlify init           # → "Create & configure a new site"
                       # → site name: smr-v1
                       # → publish directory: .  (already in netlify.toml)
netlify deploy --prod  # publishes to https://smr-v1.netlify.app
```

### Deploy SMR V2

```bash
cd ../version-2
netlify init           # → "Create & configure a new site"
                       # → site name: smr-v2
                       # → publish directory: .
netlify deploy --prod  # publishes to https://smr-v2.netlify.app
```

For preview deploys (does not affect production), omit `--prod`:

```bash
netlify deploy
```

---

## Option 3 — Git-connected continuous deployment

If you push this repo to GitHub/GitLab/Bitbucket:

1. In Netlify, click **Add new site → Import an existing project**.
2. Connect the Git provider and pick the repo.
3. **Create two sites from the same repo**, each with a different base directory:

   | Site name | Base directory | Publish directory |
   | --------- | -------------- | ----------------- |
   | `smr-v1`  | `version-1`    | `version-1`       |
   | `smr-v2`  | `version-2`    | `version-2`       |

4. Leave build command empty — these are pure static sites. The `netlify.toml` inside each folder handles the rest.
5. Every push to `main` will auto-redeploy both sites.

---

## What's configured in each `netlify.toml`

- **Publish directory** → folder root (single `index.html`).
- **Security headers** → `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.
- **HTML cache** → `no-cache` so every visitor sees the latest deploy immediately.
- **Static asset cache** → `1 year, immutable` for `.css`, `.js`, `.webp` (Netlify fingerprints filenames per deploy).
- **SPA fallback** → any unknown path falls back to `index.html`.

---

## Custom domains (optional)

In each site's **Domain settings → Add custom domain**, point an `A` record to Netlify's load balancer (`75.2.60.5`) and a `CNAME` for `www` to `smr-v1.netlify.app` / `smr-v2.netlify.app`. Netlify will auto-provision Let's Encrypt SSL.

Suggested domains:
- SMR V1 → `v1.sydneymetalroofingprojects.com.au`
- SMR V2 → `v2.sydneymetalroofingprojects.com.au`

---

## Updating a deploy

- **Drag & drop:** re-drop the folder onto the site's deploys page.
- **CLI:** run `netlify deploy --prod` from inside the version folder.
- **Git:** `git push` — Netlify rebuilds automatically.
