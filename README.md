# Reese Reviews — Unified Business Dashboard

A cohesive, single-dashboard platform built for **Reese**, combining Amazon Vine tax tracking, inventory management, an AI-powered review pipeline, an ERP Tax Center, and social media content publishing.

**Live at:** [https://reesereviews.com](https://reesereviews.com)

---

## 🚀 Features

### 1. Avatar-Based Review Generation
- **Publishing Wizard:** 6-step guided process for creating review videos.
- **Stock Avatars:** Multiple personas (Professional, Casual, Unboxing) for "Caresse".
- **AI Content:** OpenRouter integration for generating scripts and metadata stripping.
- **YouTube Auto-Posting:** Direct OAuth2 integration for publishing and scheduling.

### 2. Amazon Vine & Tax Tracking
- **Native Vine Scraper:** Imports Vine orders and tracks review deadlines.
- **ETV Tracking:** IRS-compliant Estimated Tax Value tracking.
- **Tax Dashboard:** 1099-NEC reconciliation, Schedule C calculations, and multi-entity support.

### 3. Business Management
- **Multi-Entity Support:** Manage Freedom Angel Corp, Angel Reporter LLC, and other subsidiaries.
- **Inventory Management:** Track product lifecycle from "Ordered" to "Sold" or "Donated".
- **Financial Integrations:** Scaffolded support for Plaid (bank linking) and Stripe (subscriptions).

### 4. Technical Foundation
- **Architecture:** React 18, Vite, TypeScript, Tailwind CSS (Glassmorphism).
- **Data Persistence:** Supabase (PostgreSQL, Auth, Storage) with offline fallback.
- **CI/CD:** GitHub Actions (Lint, Typecheck, Test, Build, Deploy) and CodeRabbit AI PR reviews.
- **Accessibility:** WCAG 2.1 AA compliant, featuring Neurodivergent and ECO modes.

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js v22+
- Supabase Project (URL and Anon Key)
- OpenRouter API Key

### Installation
```bash
git clone https://github.com/midnghtsapphire/reese-reviews.git
cd reese-reviews
npm ci                # also installs the Husky pre-commit hook
```

### Secret Scanning (gitleaks)
A [gitleaks](https://github.com/gitleaks/gitleaks) pre-commit hook runs automatically.
Install gitleaks to enable it (optional but strongly recommended):
```bash
# macOS
brew install gitleaks
# Linux — download from https://github.com/gitleaks/gitleaks/releases
```
If gitleaks is not installed the commit still proceeds with a warning.

### Environment Variables
Copy `.env.example` to `.env` and configure your keys:
```bash
cp .env.example .env
```
*Note: Never commit `.env` to version control.*

### Run Locally
```bash
npm run dev
```

---

## 📚 Documentation

- [Changelog](CHANGELOG.md)
- [Product Backlog](docs/BACKLOG.md) — all outstanding work, prioritized for agents and humans
- [Agent Completion Guide](docs/AGENT_COMPLETION_GUIDE.md) — why agents fail to finish + playbook
- [Rollout Plan](docs/ROLLOUT_PLAN.md) — safe deployment + rollback procedures
- [Scrum & Agile Docs](docs/scrum/)
- [Branch Protection Rules](docs/BRANCH_PROTECTION.md)
- [Deployment Guide](docs/DIGITALOCEAN_DEPLOYMENT.md)
- [Security Audit](docs/SECURITY_AUDIT.md)

---

## 🏗️ Architecture

- **Frontend:** React (Vite)
- **Backend:** Supabase (Auth, Postgres, Storage)
- **Hosting:** DigitalOcean App Platform
- **CI/CD:** GitHub Actions

### Component & Data-Flow Diagram

```mermaid
flowchart TD
    User["👤 User / Audrey"]

    subgraph Frontend["Frontend — React 18 + Vite + TypeScript"]
        direction TB
        Nav["Navbar"]
        subgraph Pages
            Home["Home\n(Reviews)"]
            Biz["Business\nDashboard"]
            Mkt["Marketing\nHub"]
            Pay["Payments\nPage"]
            Admin["Admin\nPanel"]
        end
        subgraph BizFeatures["Business Features"]
            Vine["Amazon Vine\nDashboard"]
            TaxERP["ERP Tax\nCenter"]
            Pipeline["Review\nPipeline"]
            PlaidUI["Plaid Bank\nConnect"]
            Stripe["Stripe\nCheckout"]
            AppTracker["App Portfolio\nTracker"]
        end
        subgraph Stores["State / Stores"]
            TaxStore["taxStore"]
            VineStore["vineReviewStore"]
            ProductStore["productLifecycleStore"]
            ExpenseStore["businessExpenseStore"]
            PlaidClient["plaidClient"]
        end
    end

    subgraph External["External Services"]
        OpenRouter["OpenRouter\n(AI / LLM)"]
        YouTube["YouTube\nData API v3"]
        PlaidAPI["Plaid\n(Bank Link)"]
        StripeAPI["Stripe\n(Payments)"]
        HeyGen["HeyGen\n(Avatar Video)"]
    end

    subgraph SupabaseBack["Supabase Backend"]
        Auth["Auth"]
        DB[("PostgreSQL\n(RLS-protected)")]
        Storage["Storage\n(media files)"]
    end

    DO["DigitalOcean\nApp Platform"]
    GHA["GitHub Actions\nCI/CD"]

    User --> Nav
    Nav --> Pages
    Biz --> BizFeatures
    BizFeatures --> Stores

    Stores -- "localStorage\n+ Supabase sync" --> DB
    PlaidClient -- "upsert plaid_transactions\nplaid_accounts" --> DB
    Auth --> DB

    Pipeline --> OpenRouter
    Vine --> OpenRouter
    Vine --> HeyGen
    Vine --> YouTube
    Pay --> StripeAPI
    PlaidUI --> PlaidAPI

    Frontend --> DO
    GHA -- "lint → typecheck\n→ build → deploy" --> DO
```

### Data Persistence Model

```mermaid
erDiagram
    user_profiles {
        uuid user_id PK
        text display_name
        text role
    }
    plaid_accounts {
        uuid user_id FK
        text account_id
        text institution
        numeric balance
        timestamptz last_synced
    }
    plaid_transactions {
        uuid user_id FK
        text plaid_transaction_id
        date date
        numeric amount
        boolean tax_deductible
        text write_off_category
    }
    vine_items {
        uuid user_id FK
        text product_name
        text status
        date deadline
    }
    business_entities {
        uuid user_id FK
        text name
        text schedule
        boolean home_office_eligible
    }

    user_profiles ||--o{ plaid_accounts : "has"
    user_profiles ||--o{ plaid_transactions : "has"
    user_profiles ||--o{ vine_items : "has"
    user_profiles ||--o{ business_entities : "owns"
```

---

## 📄 License
All Rights Reserved © 2026 Audrey Evans / GlowStarLabs.
This software is proprietary and confidential.
