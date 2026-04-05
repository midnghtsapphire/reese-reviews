# Handoff Guide — Reese Reviews

**Date:** April 3, 2026
**Standard:** revvel-standards/MASTER_APP_TEMPLATE.md (Phase 8: Release)

---

## 1. Introduction

This document provides a comprehensive takeover guide for any new developer joining the `reese-reviews.com` project. It outlines the system architecture, required credentials, local setup instructions, and key workflows.

---

## 2. System Architecture

The application is a unified business management and automated review platform built for the "Reese" persona. It integrates Amazon Vine tracking, an ERP Tax Center, and an avatar-based review generation pipeline.

### Core Technologies

*   **Frontend:** React 18, Vite, TypeScript, Tailwind CSS (Glassmorphism UI).
*   **State Management:** Custom stores (`src/stores/`) interacting with Supabase.
*   **Backend & Database:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
*   **Hosting:** DigitalOcean App Platform (Static Site, SPA routing).
*   **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`, `deploy.yml`), CodeRabbit AI PR reviews.

### Key Integrations

*   **OpenRouter API:** Powers the AI review generation and metadata stripping (`src/services/openRouterService.ts`).
*   **YouTube Data API v3:** Handles automated video publishing and scheduling (`src/services/youtube/youtubeService.ts`).
*   **Plaid & Stripe:** Scaffolded for bank linking and subscription management (UI present, backend pending).

---

## 3. Local Setup Instructions

Follow these steps to run the application locally.

### Prerequisites

1.  Node.js (v22 recommended) and npm.
2.  A Supabase project with the schema applied (`supabase/migrations/20260403_team_a_persistence_migration.sql`).
3.  An OpenRouter API key.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/midnghtsapphire/reese-reviews.git
    cd reese-reviews
    ```

2.  **Install dependencies:**
    ```bash
    npm ci
    ```

3.  **Configure environment variables:**
    Copy the `.env.example` file to `.env` and fill in your Supabase and OpenRouter credentials.
    ```bash
    cp .env.example .env
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

---

## 4. Key Workflows

### Development & Deployment

The project follows the Revvel Concurrent Development Standard.

1.  Create a feature branch: `git checkout -b feat/your-feature-name`.
2.  Commit your changes frequently.
3.  Push your branch and open a Pull Request against `main`.
4.  CodeRabbit will automatically review your PR. Address any comments.
5.  The CI pipeline (lint, typecheck, test, build) must pass before merging.
6.  Upon merge to `main`, the application automatically deploys to DigitalOcean.
7.  **NEVER force-push.** Use `git rebase` to resolve conflicts.

### Review Generation Pipeline

The core value of the application is the automated review generation pipeline.

1.  **Import:** Users import Amazon Vine items via CSV or manual entry.
2.  **Generate:** The `ReviewPublishingWizard` guides the user through generating AI content using OpenRouter.
3.  **Assemble:** An avatar (stock or custom) is selected, and media is uploaded to Supabase Storage.
4.  **Publish:** The finalized review is published to the site and optionally auto-posted to YouTube.

---

## 6. New Documents Added (April 5, 2026)

The following documents were added to address the compliance and agent-completion issues raised in GitHub Issue #issue:

| Document | Purpose |
| :--- | :--- |
| [`docs/BACKLOG.md`](../BACKLOG.md) | **Master product backlog.** Single source of truth for all outstanding work. Agents and users must read this first and update it on every session. |
| [`docs/AGENT_COMPLETION_GUIDE.md`](../AGENT_COMPLETION_GUIDE.md) | **Why agents don't finish apps.** Root cause analysis + the playbook to guarantee completion. Required reading for all agents. |
| [`docs/ROLLOUT_PLAN.md`](../ROLLOUT_PLAN.md) | **Safe live-app rollout procedures.** Risk-tiered deployment strategy + rollback procedures for all failure scenarios. |

### What Was Completed This Session (April 5, 2026 — Sprint 4 second iteration)
- **RR-403 ✅** — Plaid bank-link backend finalized:
  - New Supabase migration: `supabase/migrations/20260405_plaid_tables.sql` — creates `plaid_accounts` and `plaid_transactions` tables with RLS, indexes, and triggers.
  - `src/lib/plaidClient.ts`: `savePlaidTransactions()` and `savePlaidAccounts()` now fire async upserts to Supabase after every localStorage write. Pattern matches the existing `supabasePersistence.ts` approach (localStorage = immediate, Supabase = best-effort background sync).
- **RR-407 ✅** — Mermaid architecture diagrams added to `README.md`:
  - Component/data-flow flowchart showing user → frontend → stores → Supabase/external APIs
  - ER diagram showing key Supabase tables and their relationships
- **RR-408 ✅** — gitleaks pre-commit hook added:
  - Husky installed (`npm install --save-dev husky`)
  - `.husky/pre-commit` runs `gitleaks protect --staged --redact -v` if gitleaks is installed; warns and passes if not
  - `.gitleaks.toml` at repo root with custom rules for Supabase/OpenRouter keys and allowlisted doc paths
  - `"prepare": "husky"` added to `package.json` scripts so hooks auto-install on `npm ci`

### What's Next (Highest Priority for Next Session)

1. **RR-404** — Finalize Stripe subscription checkout (High) — `src/components/payments/PaymentsDashboard.tsx`
2. **RR-406** — Add TypeDoc to build pipeline (Medium)
3. **RR-409** — Code-split large bundle chunks with `React.lazy()` (Low)
4. **RR-405** — Meta Business API auto-post (Medium, needs Meta App credentials)

> Next agent: **read `docs/BACKLOG.md` first.** Pick the highest-priority `To Do` item. Update its status. Update this HANDOFF.md when done.

*   **Supabase Issues:** Verify your `.env` credentials and ensure RLS policies are correctly configured. Check the Supabase dashboard logs for errors.
*   **Build Failures:** The CI pipeline runs `npx tsc --noEmit` and `npm run build`. Ensure all TypeScript errors are resolved locally before pushing.
*   **Deployment Errors:** Check the DigitalOcean App Platform deployment logs. Ensure the `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` environment variables are set in the DigitalOcean dashboard.
*   **Standards:** Refer to the `revvel-standards` repository for detailed guidelines on code review, auto-documentation, and the master app template.
