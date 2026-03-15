# Amazon Reviews Integration

This document describes how the Amazon Reviews integration works in Reese Reviews, including how to use demo mode, how to set up cookie-based live import, and privacy considerations.

---

## Overview

The integration allows you to import your Amazon Vine and/or purchase reviews into the app, display them as anonymised drafts, and publish or copy them into your review workflow.

All imported reviews are displayed **without your Amazon reviewer handle** — only the product name, star rating, and review text are shown.

---

## 1. Demo Mode (default)

Demo mode is active automatically when no `AMAZON_SESSION_COOKIE` is present. It loads five pre-built sample reviews that showcase all UI features without any credentials.

**To trigger demo mode via the UI:**

1. Go to **Business Dashboard → 🛒 Amazon → Connection tab**.
2. Select **Demo** mode.
3. Click **Import Reviews**.
4. Switch to the **Reviews tab** to see the imported reviews.

---

## 2. HTML Import Mode

HTML mode is a safe, credential-free alternative to the live cookie scraper. You paste the raw HTML source of your Amazon review page and the app parses it client-side.

**Steps:**

1. Log in to [amazon.com](https://www.amazon.com) and navigate to **Your Account → Your Amazon profile → Community → See all reviews**.
2. Right-click the page → **View Page Source** (or `Ctrl+U` / `Cmd+U`).
3. Select all (`Ctrl+A`) and copy the HTML.
4. In the app, go to **Business Dashboard → 🛒 Amazon → Connection → Paste HTML** mode.
5. Paste the HTML into the text area and click **Import Reviews**.

The parser tolerates minor differences in Amazon's HTML structure across locales and page versions. If no reviews are found, ensure you copied from a page that contains review blocks (`data-hook="review"` or `.review` elements).

---

## 3. Cookie Mode (server-side scraper)

Cookie mode uses an active Amazon session cookie to fetch your review pages server-side and scrape review data. Because cookies are sensitive credentials, this mode **requires a server-side proxy** — it cannot run in the browser.

> **In the current SPA deployment**, cookie mode falls back to demo data automatically. To enable live scraping, deploy the app with a server component (Node.js / Express / Edge Function) that holds the `AMAZON_SESSION_COOKIE` environment variable.

### How to obtain your Amazon session cookie

1. Log in to [amazon.com](https://www.amazon.com) in Chrome or Firefox.
2. Open DevTools → **Application** (Chrome) or **Storage** (Firefox) → **Cookies** → `amazon.com`.
3. Copy the value of the `session-id` and `ubid-main` cookies (at minimum). The scraper uses the composite cookie string passed as a `Cookie:` HTTP header.
4. Alternatively, use a browser extension like **EditThisCookie** to export all cookies as a single header string.

### Where to set the environment variable

**DigitalOcean App Platform:**
- Go to your App → **Settings → App-level environment variables**.
- Add `AMAZON_SESSION_COOKIE` with the cookie string value.
- Mark it as **secret / encrypted**.

**GitHub Actions / Secrets:**
- Go to your repo → **Settings → Secrets and variables → Actions**.
- Add a new secret named `AMAZON_SESSION_COOKIE`.
- Reference it in your workflow as `${{ secrets.AMAZON_SESSION_COOKIE }}`.

**Local development:**
- Copy `.env.example` to `.env`.
- Set `AMAZON_SESSION_COOKIE=your_cookie_here`.
- **Never commit `.env` to Git.**

### What the scraper fetches

When `AMAZON_SESSION_COOKIE` is set and cookie mode is selected, the scraper fetches:

- `https://www.amazon.com/review/review-your-purchases/listing` — recent purchase reviews
- Amazon Vine dashboard pages (if the user is a Vine reviewer)

It extracts: rating, title, body, ASIN, product link, date, and review images where available.

---

## 4. Affiliate Links

The **Affiliate Links** tab in the Amazon dashboard lets you generate affiliate URLs for any ASIN:

```
https://www.amazon.com/dp/{ASIN}?tag={AFFILIATE_TAG}
```

The default affiliate tag is `meetaudreyeva-20`. Override it by setting `VITE_AFFILIATE_TAG` in your `.env` file (see `.env.example`).

---

## 5. Privacy Considerations

- **Anonymisation** — reviewer handles are never stored or displayed. Only product name, rating, and review text are retained.
- **No secrets in source code** — `AMAZON_SESSION_COOKIE` must be set as an environment variable; never commit it to Git.
- **Cookie security** — If you use cookie mode, treat your session cookie like a password. Rotate it regularly and revoke it when you no longer need the integration.
- **Local-only storage** — Imported reviews are stored in browser `localStorage`. Nothing is sent to a third-party server in demo or HTML modes.
- **ASIN list detection** — If an `asins.txt`, `ASINs.md`, or `data/asins.json` file exists in the repo, the scraper uses it to focus fetches; otherwise it scrapes the review listing pages directly.

---

## 6. Environment Variables

See `.env.example` for all supported variables:

| Variable | Description | Default |
|---|---|---|
| `AMAZON_SESSION_COOKIE` | Amazon session cookie string for live scraping | — (falls back to demo) |
| `VITE_AFFILIATE_TAG` | Amazon affiliate tag used in generated links | `meetaudreyeva-20` |
| `VITE_SUPABASE_URL` | Supabase project URL | Required |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon public key | Required |
