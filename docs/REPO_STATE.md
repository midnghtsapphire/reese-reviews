# Reese Reviews — Repository State

**Last updated:** March 2026  
**Repo:** `midnghtsapphire/reese-reviews`  
**Branch:** `main`  
**Deployed at:** [reesereviews.com](https://reesereviews.com) (DigitalOcean App Platform — Static Site)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router v6 |
| State / data | localStorage (demo) or Supabase Postgres (production) |
| Build / deploy | DigitalOcean App Platform (static site, `npm run build → dist/`) |
| Database (optional) | Supabase (Postgres + Auth + Storage) |
| Auth | Local password check via `AuthContext` (demo) or Supabase Auth (production) |

**Not used / removed:**
- Firebase — was introduced via Lovable scaffolding, never wired up, not present in the codebase.

---

## What Works Today

### Public-facing pages
| Route | Status | Data source |
|---|---|---|
| `/` | ✅ Working | localStorage / static data |
| `/reviews` | ✅ Working | `reviewStore` (localStorage) |
| `/reviews/:slug` | ✅ Working | `reviewStore` (localStorage) |
| `/products` | ✅ Working | `productStore` (localStorage) |
| `/products/:slug` | ✅ Working | `productStore` (localStorage) |
| `/categories` | ✅ Working | `reviewStore` (localStorage) |
| `/marketing` | ✅ Working | localStorage |

### Business / admin pages (require password)
| Route | Status | Data source |
|---|---|---|
| `/business` | ✅ Working | localStorage (demo data) |
| `/business` → Tax Center ERP | ✅ Working | `taxStore` (localStorage) |
| `/business` → Vine | ✅ Working | localStorage / Supabase (optional, requires backend mode) |
| `/business` → Amazon | ✅ Working | localStorage |
| `/business` → Inventory | ✅ Working | localStorage |
| `/business` → Financial | ✅ Working | localStorage |
| `/business` → Integrations | ✅ Working | localStorage (Plaid demo mode) |
| `/business` → Lifecycle | ✅ Working | `productLifecycleStore` (localStorage) |
| `/business` → Reviews | ✅ Working | `reviewStore` (localStorage) |
| `/business` → Review Pipeline | ✅ Working | localStorage |

---

## Supabase Integration

Supabase is **optional** — the app runs fully in demo/localStorage mode without it.

### Where Supabase is wired
| File | What it does | Required? |
|---|---|---|
| `src/integrations/supabase/client.ts` | Supabase JS client | No — only initialised if env vars present |
| `src/hooks/useReviews.ts` | Fetch reviews from Supabase `reviews` table | No — returns `[]` if unconfigured |
| `src/hooks/useAdmin.ts` | Admin auth + CRUD for reviews/products | No — returns empty/false if unconfigured |
| `src/hooks/useProducts.ts` | Fetch products from Supabase `products` table | No — returns `[]` if unconfigured |
| `src/lib/vineScraperEnhanced.ts` | Sync Vine items to/from Supabase `vine_items` | No — falls back to localStorage automatically |

> **Note:** `useReviews`, `useAdmin`, and `useProducts` hooks exist and are guarded but are not currently imported by any component — the app uses `reviewStore` / `productStore` (localStorage) for all active pages.

### Supabase schema (existing tables)
| Table | Purpose |
|---|---|
| `reviews` | Product reviews |
| `products` | Product catalogue |
| `admins` | Admin user IDs |
| `vine_items` | Amazon Vine product tracking |
| `amazon_orders` | Amazon order history |
| `api_configurations` | Stored API credentials (encrypted) |
| `marketing_leads` | Newsletter subscribers |

### Enabling Supabase (production mode)
1. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. Or set those variables in the DigitalOcean App Platform dashboard (preferred for production).
3. Run Supabase migrations: `supabase db push supabase/migrations/<file>.sql`
4. In the Vine Dashboard settings, toggle **"Use Backend API"** to enable Supabase sync for Vine items.

### Supabase Edge Functions (planned / optional)
- `supabase/functions/sync-vine-items/` — Referenced in docs and `vineScraperEnhanced.ts` but not yet deployed. Clearly marked as a planned feature.

---

## Secrets & Environment Variables

| Variable | Required | Where to set |
|---|---|---|
| `VITE_SUPABASE_URL` | Optional (enables Supabase) | `.env` (local) or DO App Platform dashboard (production) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Optional (enables Supabase) | `.env` (local) or DO App Platform dashboard (production) |
| `AMAZON_SESSION_COOKIE` | Optional (enables live Amazon scraping) | `.env` only — never commit real values |
| `VITE_AFFILIATE_TAG` | Optional | `.env` or hardcoded default `meetaudreyeva-20` |

**Rules:**
- `.env` is **not tracked** in git (excluded via `.gitignore`).
- `.env.example` exists at the repo root with placeholder values — copy it to `.env` to get started.
- The Supabase anon/public key is safe to expose in a frontend build (it is a read-only public key protected by Row Level Security).
- Never commit secret keys (Amazon session cookies, service-role keys, Plaid tokens, etc.).

---

## How to Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/midnghtsapphire/reese-reviews.git
cd reese-reviews

# 2. Install dependencies
npm install

# 3. (Optional) Configure environment variables
cp .env.example .env
# Edit .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
# if you want live Supabase data. Leave blank for demo/localStorage mode.

# 4. Start dev server
npm run dev
# → http://localhost:5173

# 5. Build for production
npm run build
# → dist/
```

---

## Placeholder / Spec-Only Features

These exist in docs or code stubs but are **not yet implemented end-to-end**:

| Feature | Location | Status |
|---|---|---|
| Supabase Edge Function: sync-vine-items | `vineScraperEnhanced.ts`, `QUICKSTART.md` | Planned — not deployed |
| Plaid bank import (live) | `src/lib/plaidClient.ts`, `PlaidBankConnect.tsx` | Demo mode only; real Plaid token exchange not wired |
| Gusto payroll integration | `src/stores/taxStore.ts` | Schema placeholder only |
| Multi-entity tax filing | `src/stores/taxStore.ts` | Demo data wired; not production-ready |
| Admin panel (Supabase-backed) | `src/hooks/useAdmin.ts` | Hooks exist; no admin UI page yet |

---

*All Rights Reserved © 2026 Audrey Evans / GlowStarLabs*
