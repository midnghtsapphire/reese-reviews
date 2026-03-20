# Reese-Reviews — Unified Business Dashboard

A cohesive, single-dashboard platform built for **Reese**, combining Amazon Vine tax tracking, inventory management, review pipeline, ERP Tax Center, and social media content publishing — all behind a clean steel-toned interface.

**Live at:** https://reesereviews.com

---

## 🗺️ Navigation — Three Pages

| Route | Page | Description |
|---|---|---|
| `/` | **Dashboard** | Main hub — quick draft + all business operations |
| `/generate` | **Create Content** | Social media publishing with platform selection, budget, analytics |
| `*` | **404** | Friendly not-found fallback |

---

## 🎯 Dashboard Features

### Main Dashboard (`/`)
Two-column layout:

**Left (main panel)**
- Quick draft textarea → carry draft directly into the Content editor
- Full business operations tabs:
  - 🍃 **Tax Center ERP** — Vine ETV, bank (Plaid), expenses, forms, quarterly, audit & export
  - 🍇 **Vine** — Amazon Vine product dashboard + cookie manager
  - 🛒 **Amazon** — Amazon seller metrics, ASIN tracking, BSR
  - 📦 **Inventory** — Vine item inventory pipeline
  - 💵 **Financial** — Revenue, P&L, cash flow
  - ⚙️ **Integrations** — Amazon API keys, account settings
  - ⚡ **Lifecycle** — Product lifecycle tracker (received → reviewed → resold / donated)
  - 🎬 **Reviews** — Review automation & media management
  - 🔀 **Review Pipeline** — Enrich and publish reviews to site

**Right sidebar**
- Analytics summary (posts published, total reach, engagement, shares)
- Quick stats (Vine items, pending reviews, ETV, inventory)
- Platform reach bars

### Content Creation (`/generate`)
- **Textarea** for post content
- **Platform selection** — Facebook, LinkedIn, Instagram, TikTok (toggle each on/off)
- **Marketing budget** input — daily spend cap with monthly estimate
- **Auto-post** — simulated publish to all selected platforms with live status badges
- **Analytics sidebar** — posts, reach, engagement, shares
- **Budget summary** — daily / platform count / monthly estimate
- Pre-fill from Dashboard quick-draft via `?draft=` URL param

---

## 🎨 Brand & Color System

Palette is **steel / neutral only**:

| Token | Tailwind | Hex |
|---|---|---|
| Light surface | `slate-50` | `#f8fafc` |
| Mid accent | `slate-600` | `#475569` |
| Dark background | `slate-900` | `#0f172a` |

CSS utility classes: `gradient-steel`, `gradient-steel-text`, `gradient-dark-surface`, `glass-card`, `glass-nav`, `steel-border`, `steel-glow`.

Centralized constants: `src/lib/branding.ts` — exports `BRAND_NAME`, `PALETTE`, `CSS_VARS`, `SOCIAL_PLATFORMS`.

No purple, no orange, no green.

---

## 🖼️ Logo System

`src/components/Logo.tsx` exports:

| Export | Description |
|---|---|
| `Logo` | Main component — `size` prop (`sm` / `md` / `lg`), optional `src` image, optional label |
| `LogoPlaceholder` | Steel-gradient box with User icon — shown when no image is provided |
| `LogoUploadHint` | Dev/admin reminder card with upload instructions |

To replace the logo: pass a PNG/SVG URL as the `src` prop to `<Logo>`.

---

## ♿ Accessibility Modes

Activated via the accessibility toggle in the navbar:

| Mode | Description |
|---|---|
| **Neurodivergent** | Atkinson Hyperlegible font, no animations, generous line spacing |
| **ECO CODE** | Near-black background, no animations, no shadows |
| **No Blue Light** | Warm amber/sepia palette, filtered images |
| **ADHD** | No animations, high-contrast focus rings, larger line spacing |
| **Dyslexic** | Atkinson Hyperlegible, extra letter/word spacing |

---

## 🔐 Authentication

The app requires login before accessing any content. Auth context: `src/contexts/AuthContext.tsx`. Supabase client: `src/integrations/supabase/client.ts`.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# Run tests
npm test
```

Environment variables — copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_AMAZON_AFFILIATE_TAG=...  # optional
AMAZON_SESSION_COOKIE=...      # optional — for live Vine scraper
```

---

## 🗂️ Key File Locations

```
src/
  lib/
    branding.ts           ← Steel palette + social platform constants
    taxStore.ts           ← Tax filers, write-off categories, IRS forms
    reviewStore.ts        ← Review CRUD + Supabase sync
    amazonStore.ts        ← Amazon order history (localStorage)
    affiliateStore.ts     ← Affiliate link tracking
  components/
    Logo.tsx              ← Logo system with placeholder variants
    Navbar.tsx            ← Simplified 2-link navigation
    business/
      ERPTaxCenter.tsx    ← Unified tax ERP (Vine ETV, Plaid, forms…)
      ReviewPipeline.tsx  ← Review import → enrich → publish
      ProductLifecycle.tsx
      ReviewAutomation.tsx
  pages/
    Dashboard.tsx         ← Main dashboard (route: /)
    Generate.tsx          ← Content creation (route: /generate)
    NotFound.tsx          ← 404 fallback
  stores/
    taxStore.ts
    productLifecycleStore.ts
    reviewAutomationStore.ts
```

---

## 📄 Migration Notes

See [RESTRUCTURE_SUMMARY.md](RESTRUCTURE_SUMMARY.md) for a full before/after comparison of the route and component structure.

---

## 🏗️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui + Framer Motion
- **Styling:** Steel/glass dark theme with 5 accessibility modes
- **State:** React hooks + localStorage + Supabase
- **Testing:** Vitest + React Testing Library

---

## 🧪 Testing

```bash
npm test            # Run all tests
npm run test:watch  # Watch mode
```

---

## 📝 License

Proprietary — All Rights Reserved, Audrey Evans / GlowStarLabs.

---

## 📞 Support

- **Email:** support@reesereviews.com
- **Contact Form:** https://reesereviews.com/contact
