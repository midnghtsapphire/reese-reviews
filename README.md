# Reese-Reviews — Unified Business Dashboard

A cohesive, single-dashboard platform built for **Reese**, combining Amazon Vine tax tracking, inventory management, review pipeline, ERP Tax Center, and social media content publishing.

**Live at:** https://reesereviews.com

---

## 🚀 New Features Added

### Priority 1: Vine Review Auto-Generator (`/vine`)
- **CSV Import:** Upload Amazon Vine order CSVs or enter items manually.
- **AI Review Generation:** Integrates with OpenRouter to auto-generate authentic, high-quality reviews.
- **Star Rating Algorithm:** Calculates weighted average ratings with sentiment analysis and recency bias.
- **Avatar System:** Stock avatars (male/female/neutral) and custom avatar upload support.
- **Video Generation:** Creates slideshow-style video reviews using HTML5 Canvas and browser APIs.
- **Queue Management:** Track pending, generated, and overdue reviews with deadline color-coding.

### Admin Panel (`/admin`)
- Theme and UI customization settings.
- User management and roles.
- Analytics dashboard overview.
- API integration settings (OpenRouter, Stripe, Plaid).

### SEO & Marketing Dashboard (`/seo`)
- SEO score checker and meta tags management.
- Backlink tracking and analytics.
- Social media content scheduling with Meta Business API stubs.

### Payments & Subscriptions (`/payments`)
- Subscription tiers (Free, Pro, Business).
- Shopping cart functionality.
- Stripe checkout integration.
- Plaid bank linking integration.

---

## 🗺️ Navigation Routes

| Route | Page | Description |
|---|---|---|
| `/` | **Dashboard** | Main hub — quick draft + all business operations |
| `/vine` | **Vine AI** | Amazon Vine Review Auto-Generator |
| `/business` | **Business** | Full business operations tabs (Tax Center, Inventory, etc.) |
| `/generate` | **Create Content** | Social media publishing with platform selection |
| `/seo` | **SEO** | SEO and Marketing Dashboard |
| `/payments` | **Payments** | Subscriptions, Stripe, and Plaid integrations |
| `/admin` | **Admin** | Admin Panel for site management |

---

## 🎨 Brand & Color System

Palette is **steel / neutral only**:

| Token | Tailwind | Hex |
|---|---|---|
| Light surface | `slate-50` | `#f8fafc` |
| Mid accent | `slate-600` | `#475569` |
| Dark background | `slate-900` | `#0f172a` |

CSS utility classes: `gradient-steel`, `gradient-steel-text`, `gradient-dark-surface`, `glass-card`, `glass-nav`, `steel-border`, `steel-glow`.

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

### Environment Variables
Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_OPENROUTER_API_KEY=...    # Required for AI review generation
VITE_AMAZON_AFFILIATE_TAG=...  # optional
AMAZON_SESSION_COOKIE=...      # optional — for live Vine scraper
```

---

## 🏗️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui + Framer Motion
- **Styling:** Steel/glass dark theme with 5 accessibility modes
- **State:** Zustand + React hooks + localStorage + Supabase
- **Testing:** Vitest + React Testing Library (120+ tests passing)
- **AI:** OpenRouter API

---

## 📝 License

Proprietary — All Rights Reserved, Audrey Evans / GlowStarLabs.
