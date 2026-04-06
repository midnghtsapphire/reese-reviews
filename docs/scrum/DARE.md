# D.A.R.E. Log — Reese Reviews

**Date:** April 3, 2026
**Standard:** revvel-standards/MASTER_APP_TEMPLATE.md (Phase 5: D.A.R.E. Log)

---

## 1. Introduction

The D.A.R.E. (Decisions, Actions, Results, Evidence) Log tracks key architectural and business decisions made during the development of `reese-reviews.com`. This log ensures transparency and provides context for future teams.

---

## Log Entries

### [2026-04-03] Transition from localStorage to Supabase

**Decision:** Migrate all data persistence from browser `localStorage` to Supabase tables with Row Level Security (RLS).
**Action:** Team A created Supabase migrations for `taxStore`, `expenseStore`, `vineReviewStore`, `productLifecycleStore`, and `reviewStore`. Client-side code was updated to use Supabase Auth and interact with these tables.
**Result:** Data is now securely stored in the cloud, accessible across devices, and protected by user-specific RLS policies. The application still supports offline fallback where necessary.
**Evidence:** See `supabase/migrations/20260403_team_a_persistence_migration.sql` and the updated store files in `src/stores/`.

### [2026-04-03] Multi-Entity Tax Architecture

**Decision:** Implement a multi-business entity structure within the tax module to support Freedom Angel Corp and its subsidiaries.
**Action:** Team A added a `business_entities` table and updated the `taxStore` to associate income, expenses, and write-offs with specific entities.
**Result:** Users can now manage taxes and financial reporting for multiple distinct businesses under a single account.
**Evidence:** See `src/stores/taxStore.ts` and the `business_entities` schema in Supabase.

### [2026-04-03] Avatar-Based Review Generation Pipeline

**Decision:** Utilize a 6-step Review Publishing Wizard and integrate YouTube auto-posting for the Caresse avatar persona.
**Action:** Team B built `ReviewPublishingWizard.tsx`, added stock avatars to `public/avatars/`, and implemented `youtubeService.ts` for automated uploads and FTC disclosure compliance.
**Result:** The review generation process is now highly structured, reducing cognitive load, and videos can be seamlessly published to YouTube.
**Evidence:** See `src/components/wizard/` and `src/services/youtube/`.

### [2026-04-03] Strict CI/CD and Branch Protection Enforcement

**Decision:** Enforce a strict CI/CD pipeline and ban force-pushes following the April 3 MindMappr incident.
**Action:** Team D created GitHub Actions workflows (`ci.yml`, `deploy.yml`), configured CodeRabbit AI PR reviews (`.coderabbit.yaml`), and documented branch protection rules (`BRANCH_PROTECTION.md`).
**Result:** All code is automatically linted, type-checked, built, and tested before deployment. The `main` branch is protected against accidental overwrites.
**Evidence:** See `.github/workflows/` and `docs/BRANCH_PROTECTION.md`.

### [2026-04-03] Live-First Deployment Exception

**Decision:** Continue operating under a "Live-First" deployment strategy, deploying directly to the DigitalOcean production environment upon merge to `main`.
**Action:** The `deploy.yml` workflow was configured to trigger DigitalOcean App Platform deployments after successful CI checks.
**Result:** Rapid iteration is maintained, but reliance on automated and AI-driven code review (Venice AI, CodeRabbit) is critical.
**Evidence:** See `CODE_REVIEW_STANDARD.md` (Section 3.2) and `.github/workflows/deploy.yml`.
