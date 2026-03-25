# Reese Reviews — DigitalOcean App Platform Deployment Guide

**Domain:** reesereviews.com  
**Platform:** DigitalOcean App Platform (Static Site)  
**Repo:** MIDNGHTSAPPHIRE/reese-reviews (branch: `main`)  
**Last Updated:** March 2026

---

## Overview

Reese Reviews is a React 18 + Vite + TypeScript frontend that connects to Supabase for data. It is deployed as a **Static Site** on DigitalOcean App Platform, which handles building, CDN delivery, SSL certificates, and custom domain routing automatically.

The App Platform configuration lives in `.do/app.yaml` at the root of this repository. Every push to `main` triggers an automatic redeploy.

---

## Architecture

```
GitHub (main branch)
        │
        ▼  auto-deploy on push
DigitalOcean App Platform
  └── Static Site: npm run build → dist/
        │
        ▼  CDN + SSL (auto)
  reesereviews.com  (CNAME → <app>.ondigitalocean.app)
```

---

## One-Time Setup: Deploy via Dashboard

If you do not have a DO API token configured, follow these steps in the DigitalOcean web dashboard:

### Step 1 — Create the App

1. Log in to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Click **Apps** in the left sidebar
3. Click **Create App**
4. Choose **GitHub** as the source
5. Authorize DigitalOcean to access your GitHub account if prompted
6. Select repository: **MIDNGHTSAPPHIRE/reese-reviews**
7. Select branch: **main**
8. Check **Autodeploy** (so every push to main redeploys automatically)
9. Click **Next**

### Step 2 — Configure the Component

DigitalOcean will auto-detect the Vite project. Confirm or set these values:

| Setting | Value |
|---|---|
| **Component type** | Static Site |
| **Build command** | `npm run build` |
| **Output directory** | `dist` |
| **Index document** | `index.html` |
| **Error document** | `index.html` |

> Setting the error document to `index.html` is critical — it enables React Router to handle all client-side routes without 404 errors.

### Step 3 — Set Environment Variables

Click **Edit** on the component, then add these environment variables (scope: **Build Time**):

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://nythypgelkmyoawdnkjv.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/public key (find it in the Supabase dashboard → Project Settings → API) |

> These are Supabase **anon/public** keys — safe to expose in a frontend build. Set them here in the DO App Platform dashboard. Do **not** commit a real `.env` file; use `.env.example` as a template for local development.

### Step 4 — Choose a Plan

Select **Starter** (free tier, $0/month) — sufficient for a static site.

### Step 5 — Review and Create

Click **Create Resources**. DigitalOcean will:
1. Clone the repo
2. Run `npm run build`
3. Serve the `dist/` folder via its global CDN
4. Assign a temporary URL like `https://reese-reviews-xxxxx.ondigitalocean.app`

---

## One-Time Setup: Deploy via `doctl` CLI

If you prefer the command line, install `doctl` and authenticate first:

```bash
# Install doctl (macOS)
brew install doctl

# Install doctl (Linux)
curl -sL https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz | tar -xzv
sudo mv doctl /usr/local/bin

# Authenticate with your DO API token
doctl auth init
# Paste your Personal Access Token when prompted
```

Then create the app from the spec file already committed to this repo:

```bash
# From the root of this repository
doctl apps create --spec .do/app.yaml
```

This single command creates the entire app with all settings from `.do/app.yaml`.

To check deployment status:

```bash
# List all apps and get the app ID
doctl apps list

# Watch deployment logs (replace APP_ID with your actual ID)
doctl apps logs APP_ID --follow
```

---

## Custom Domain Setup (reesereviews.com)

### Step 1 — Add Domain in DO Dashboard

1. In your App's settings, click **Domains**
2. Click **Add Domain**
3. Enter `reesereviews.com` → set as **Primary**
4. Enter `www.reesereviews.com` → set as **Alias**
5. Click **Add Domain**

DigitalOcean will display a **CNAME target** like:
```
reese-reviews-xxxxx.ondigitalocean.app
```

### Step 2 — Configure DNS on Namecheap

Log in to Namecheap → Domain List → **Manage** reesereviews.com → **Advanced DNS**:

| Type | Host | Value | TTL |
|---|---|---|---|
| `CNAME` | `@` (or `reesereviews.com`) | `reese-reviews-xxxxx.ondigitalocean.app` | Automatic |
| `CNAME` | `www` | `reese-reviews-xxxxx.ondigitalocean.app` | Automatic |

> **Note:** Some DNS providers do not allow a CNAME on the root (`@`) record. If Namecheap blocks it, use an **ALIAS** or **ANAME** record instead of CNAME for the root domain. Namecheap supports this under "URL Redirect Record" or you can use their ALIAS feature.

### Step 3 — SSL Certificate

DigitalOcean App Platform automatically provisions a **Let's Encrypt SSL certificate** once the DNS propagates (usually within 15–60 minutes). No action required.

---

## Automatic Redeployments

Every push to the `main` branch triggers a new build and deployment automatically. The workflow is:

```
git push origin main
    → DO App Platform detects push
    → Runs: npm run build
    → Deploys dist/ to CDN
    → Live at reesereviews.com within ~2-3 minutes
```

---

## SPA Routing Fix

The file `public/_redirects` contains:
```
/*    /index.html   200
```

This instructs the static server to serve `index.html` for all routes, allowing React Router to handle client-side navigation. Without this, direct URL access to routes like `/reviews/123` would return a 404.

The `.do/app.yaml` also sets `error_document: index.html` as a belt-and-suspenders fallback.

---

## Environment Variables Reference

| Variable | Purpose | Scope |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Build Time |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key (public) | Build Time |

> If you add new environment variables in the future (e.g., `VITE_OPENROUTER_API_KEY`), add them in the DO App Platform dashboard under **Settings → Environment Variables**, and also update `.do/app.yaml`.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Build fails with `npm run build` error | Check the build logs in DO dashboard; usually a missing env var or TypeScript error |
| Routes return 404 on direct access | Confirm `error_document: index.html` is set and `public/_redirects` exists |
| Custom domain not resolving | DNS propagation can take up to 48 hours; verify CNAME with `dig reesereviews.com` |
| SSL certificate not issued | Ensure DNS is pointing to DO before SSL can be provisioned |
| Supabase not connecting | Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set in DO env vars |

---

## What Was Deployed

- **Platform:** DigitalOcean App Platform — Static Site (free Starter tier)
- **Build:** `npm run build` → Vite compiles TypeScript + React → outputs to `dist/`
- **Serving:** DO global CDN with automatic HTTPS
- **Domain:** reesereviews.com + www.reesereviews.com
- **Auto-deploy:** Enabled on every push to `main`
- **SPA routing:** Handled via `public/_redirects` and `error_document: index.html`
- **Config committed:** `.do/app.yaml` in repo root

---

*All Rights Reserved © 2024 Audrey Evans / GlowStarLabs*
