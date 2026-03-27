# BLUEPRINT — Reese Reviews Technical Architecture
**Version:** 1.0.0  
**Date:** March 27, 2026  
**Standard:** Revvel EXRUP — Required Artifact  
**Status:** Living document

---

## 1. SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    REESE REVIEWS PLATFORM                        │
│                                                                  │
│  Frontend (Vite + React 18 + TypeScript)                        │
│  ├── Dashboard.tsx — Main hub (all business ops)                │
│  ├── Generate.tsx — Social media publishing                     │
│  └── 404.tsx — Not found                                        │
│                                                                  │
│  State Management (Zustand-pattern + localStorage)              │
│  ├── taxStore.ts — Multi-person, multi-entity tax ERP           │
│  ├── reviewAutomationStore.ts — Review gen + media + video      │
│  └── productLifecycleStore.ts — Vine inventory lifecycle        │
│                                                                  │
│  External APIs                                                   │
│  ├── Supabase — PostgreSQL + Auth + Realtime                    │
│  ├── Plaid — Bank transaction sync                              │
│  ├── HeyGen — AI avatar video generation                        │
│  ├── ElevenLabs — Voice synthesis                               │
│  ├── Amazon SP-API / PA-API — Product data                      │
│  ├── PDFiller — IRS form completion                             │
│  └── OpenRouter — LLM routing (free-first)                      │
│                                                                  │
│  GrowlingEyes Engine (Microservices on DO 164.90.148.7)         │
│  ├── telegram-collector — telethon + Redis                      │
│  ├── github-collector — PyGithub                                │
│  ├── wildberries-collector — requests (no auth)                 │
│  ├── classifier — OpenRouter NLP                                │
│  └── api — FastAPI WebSocket → Reese Reviews UI                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. FRONTEND ARCHITECTURE

### 2a. Route Structure
```
/               → Dashboard.tsx
/generate       → Generate.tsx
*               → NotFound.tsx
```

### 2b. Component Tree (Dashboard)
```
Dashboard.tsx
├── Navbar.tsx
├── [Left Panel]
│   ├── Quick Draft textarea
│   └── Tabs
│       ├── ERPTaxCenter.tsx → TaxCenter.tsx + TaxDashboard.tsx
│       ├── VineDashboard.tsx + VineCookieManager.tsx
│       ├── AmazonDashboard.tsx
│       │   ├── AmazonOrdersToInventory.tsx (Import tab)
│       │   └── AmazonDashboard.tsx (Dashboard tab)
│       ├── InventoryManager.tsx
│       ├── FinancialDashboard.tsx
│       ├── Integrations
│       │   ├── AmazonAPISettings.tsx
│       │   ├── AmazonAccountSettings.tsx
│       │   └── PlaidBankConnect.tsx
│       ├── ProductLifecycle.tsx
│       ├── ReviewAutomation.tsx
│       │   ├── ReviewGenerator.tsx
│       │   ├── ReviewMediaManager.tsx
│       │   └── ReviewVideoCreator.tsx
│       └── ReviewPipeline.tsx
│           ├── ReviewEnricher.tsx
│           └── MarketplaceListing.tsx
└── Footer.tsx
```

### 2c. State Architecture
```
localStorage (persistence layer)
├── taxmod-persons
├── taxmod-income-sources
├── taxmod-documents
├── taxmod-writeoffs
├── taxmod-quarterly-estimates
├── reese-review-automation
├── rr-amazon-orders
├── rr-automation-settings
└── marketing_leads (Supabase)

Supabase (backend persistence)
├── vine_items
├── vine_orders
├── marketing_leads
├── stream_intelligence (GrowlingEyes)
└── blog_posts
```

---

## 3. DATA MODELS

### 3a. Tax Person
```typescript
interface TaxPerson {
  id: string;
  name: string;
  slug: string;        // "caresse" | "revvel" | "reese"
  role: "primary" | "spouse" | "dependent";
  filing_status: FilingStatus;
  dob?: string;
  ssn_last4?: string;
  accessibility?: {
    is_deaf?: boolean;
    has_adhd?: boolean;
    has_disability?: boolean;
  };
}
```

### 3b. Income Source
```typescript
interface IncomeSource {
  id: string;
  person_id: string;
  type: IncomeType;   // w2 | 1099_nec | ssa_1099 | rental | etc.
  description: string;
  ytd_amount: number;
  entity?: string;    // "fac" | "reese_reviews" | "noconook"
  is_passive: boolean;
}
```

### 3c. Product Lifecycle Item
```typescript
interface ProductLifecycleItem {
  id: string;
  asin: string;
  name: string;
  etv: number;           // Estimated Tax Value
  current_stage: "RECEIVED" | "REVIEWED" | "LISTED" | "SOLD" | "DONATED";
  received_date: string;
  reviewed_date?: string;
  transaction_type?: "sale" | "rental" | "donation";
  transaction_date?: string;
  buyer_info?: { price: number; platform: string };
}
```

### 3d. Stream Intelligence Item (GrowlingEyes)
```typescript
interface StreamItem {
  id: string;
  source: "telegram" | "discord" | "github" | "gitee" | "reddit" | "wildberries";
  channel: string;
  content: string;
  url?: string;
  category: "PRODUCT" | "TOOL" | "NEWS" | "OPPORTUNITY" | "SPAM";
  composite_score: number;  // 0.0 → 1.0
  detected_at: string;
  alerted: boolean;
  dismissed: boolean;
}
```

---

## 4. TECHNOLOGY DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Framework | React 18 + Vite | Fast HMR, tree-shaking, ecosystem |
| Language | TypeScript strict mode | Type safety, IDE support, revvel-standards |
| Component library | shadcn/ui + Radix UI | Accessible by default, unstyled base |
| Styling | Tailwind CSS v3 | Utility-first, steel design system |
| State | localStorage + Zustand-pattern | No server needed for personal data |
| Backend | Supabase | Free tier generous, RLS, Realtime, Auth |
| Animation | framer-motion | Production-grade, accessible reduce-motion support |
| Charts | Recharts | MIT license, React-native friendly |
| Forms | react-hook-form + zod | Type-safe validation |
| Testing | Vitest + Testing Library | Vite-native, fast |
| PDF | jsPDF + jspdf-autotable | FOSS, browser-native |
| CSV parsing | PapaParse | Battle-tested, MIT |

---

## 5. SECURITY ARCHITECTURE

| Concern | Implementation |
|---------|---------------|
| API keys | Never in code — DO App Platform env vars |
| Supabase auth | Row Level Security on all tables |
| User data | localStorage only, no unencrypted PII to cloud |
| HTTPS | DO App Platform provides SSL automatically |
| CORS | Supabase handles via CORS settings |
| XSS | React escapes by default, DOMPurify if raw HTML needed |
| CSRF | Not applicable (SPA + Bearer token) |
| Rate limiting | Supabase built-in + OpenRouter rate limits |

---

## 6. DEPLOYMENT ARCHITECTURE

```
GitHub repo (main branch)
    ↓ push
GitHub Actions CI
    → npm run lint
    → npm run test
    → npm run build (dist/)
    ↓ success
DigitalOcean App Platform
    → Serves dist/ as static site
    → SSL via Let's Encrypt (automatic)
    → CDN edge delivery
    → Custom domain: reesereviews.com

GrowlingEyes Microservices
    → Docker Compose on DO droplet 164.90.148.7
    → Alongside: MindMappr (port 8080)
    → New: GrowlingEyes API (port 8090)
    → Caddy reverse proxy: growlingeyes.com → :8090
```

---

## 7. ACCESSIBILITY ARCHITECTURE

```typescript
// AccessibilityContext provides:
interface AccessibilityState {
  highContrast: boolean;      // WCAG AAA
  largeText: boolean;         // 18px+
  reducedMotion: boolean;     // prefers-reduced-motion
  adhdMode: boolean;          // Simplified layout + Pomodoro
  dyslexicMode: boolean;      // OpenDyslexic font + spacing
  neuroMode: boolean;         // No animations, high contrast
  ecoMode: boolean;           // No shadows/filters/animations
  noBlueLightMode: boolean;   // Amber/sepia palette
  menstrualUI: boolean;       // Soft pastels + affirmations
}
```

**CSS class application:**
```css
body.high-contrast { /* WCAG AAA overrides */ }
body.large-text { font-size: 120%; }
body.reduce-motion * { animation: none !important; transition: none !important; }
body.adhd-mode .sidebar { display: none; }
body.dyslexic-mode { font-family: 'OpenDyslexic', sans-serif; line-height: 1.9; }
body.eco-mode * { box-shadow: none !important; filter: none !important; }
body.no-blue-light { filter: sepia(30%) saturate(80%); }
```

---

*End of BLUEPRINT.md*  
*March 27, 2026 — MIDNGHTSAPPHIRE / Freedom Angel Corps*
