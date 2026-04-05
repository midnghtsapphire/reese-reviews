# Product Backlog — Reese Reviews

**Repository:** `midnghtsapphire/reese-reviews`
**Last Updated:** April 5, 2026
**Standard:** revvel-standards/MASTER_APP_TEMPLATE.md

---

## How to Use This Backlog

This is the **single source of truth** for all outstanding work on Reese Reviews — for both human contributors and AI agents.

### For Humans (Audrey / Team Members)
1. Add new items in the **📥 Inbox** section at the bottom.
2. Move items to the correct priority tier after review.
3. Assign an owner and update the status column when work starts.
4. Mark items `Done` and log the completion date.

### For AI Agents
1. **Read this file before writing any code.**
2. Pick the **highest-priority `To Do`** item in the current sprint tier.
3. Update the item status to `In Progress` with your session date.
4. Complete the task. Run tests. Push your changes.
5. Update the item to `Done` with the PR/commit reference.
6. Update `docs/scrum/HANDOFF.md` before ending your session.
7. **Do not start a new item until the current one is verified complete.**

> ⚠️ **Rule:** One item per agent session. Finish it completely before moving on.  
> ⚠️ **Rule:** If a task is too large to finish in one session, break it into sub-tasks here first.

---

## Status Key

| Status | Meaning |
| :--- | :--- |
| `To Do` | Not started. Ready to be picked up. |
| `In Progress` | Actively being worked on. Include agent/date. |
| `Blocked` | Cannot proceed — dependency or question needed. |
| `In Review` | PR open, awaiting merge. |
| `Done` | Merged, verified. |
| `Deferred` | Intentionally pushed to a later sprint. |

---

## Sprint 4 — Security & Integrations (Current Sprint)

**Sprint Goal:** Address critical security gaps, complete Plaid/Stripe backend wiring, and fix top ESLint violations.

| ID | Priority | Title | Owner | Status | Acceptance Criteria | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| RR-401 | 🔴 Critical | Migrate Admin Panel API keys from localStorage to env vars | Agent/Team C | Done (2026-04-05) | Admin panel reads keys from `import.meta.env.*` — no key stored in `localStorage`. | Integrations tab now shows read-only env-var status. Security warning added. |
| RR-402 | 🔴 Critical | Fix top 20 ESLint `no-explicit-any` violations | Agent/Team A | Done (2026-04-05) | 22 violations fixed across 8 files (AdminPanel, Dashboard, supabasePersistence, AuthContext, reviewStore, Admin, MusicVideoCreator, InventoryManager, VineReviewDashboard). | See STANDARDS_COMPLIANCE.md issue #19. |
| RR-403 | 🟠 High | Finalize Plaid bank-link backend | Agent/Team C | Done (2026-04-05) | Plaid Link token exchange completes; transactions sync to Supabase `plaid_transactions` table; test with sandbox. | Migration: `supabase/migrations/20260405_plaid_tables.sql`. `savePlaidTransactions`/`savePlaidAccounts` now upsert to Supabase with localStorage fallback. |
| RR-404 | 🟠 High | Finalize Stripe subscription checkout | Agent/Team C | Done (2026-04-05) | Stripe Checkout session creates successfully; webhook handler verifies payment; subscription tier updates in Supabase. | `src/lib/stripeClient.ts` created: Payment Link redirect, `getSubscriptionState`/`saveSubscriptionState`, `handleCheckoutReturn`, `activateTier`. `PaymentsDashboard.tsx` fully wired; demo-mode banner; return-URL handler; active-plan badge. `.env.example` updated with `VITE_STRIPE_LINK_PRO`/`VITE_STRIPE_LINK_BUSINESS`. |
| RR-405 | 🟡 Medium | Implement Meta Business API auto-post | Agent/Team B | To Do | Posts can be scheduled and auto-published to a linked Instagram Business or Facebook Page. | See `src/components/marketing/MetaAutoPost.tsx` (scaffolded). RAID D-006 (future dep). |
| RR-406 | 🟡 Medium | Add TypeDoc to build pipeline | Agent/Team D | Done (2026-04-05) | `npm run docs` generates HTML API documentation from TSDoc comments into `/docs/api/`; CI step added. | `typedoc.json` config at repo root; `docs/api/` in `.gitignore`; `"docs": "typedoc"` in `package.json`; new CI job `docs` in `.github/workflows/ci.yml`. |
| RR-407 | 🟡 Medium | Add Mermaid architecture diagrams to README | Agent/Team D | Done (2026-04-05) | `README.md` contains at least one Mermaid diagram showing the component/data-flow architecture. | 2 diagrams added: component/data-flow flowchart + ER diagram. |
| RR-408 | 🟡 Medium | Add gitleaks pre-commit hook | Agent/Team A | Done (2026-04-05) | `gitleaks` runs on every `git commit` and blocks commits containing secrets. | Husky installed; `.husky/pre-commit` + `.gitleaks.toml` added; `prepare` script in `package.json`. |
| RR-409 | 🔵 Low | Code-split large bundle chunks | Agent/Team D | Done (2026-04-05) | `ReviewPipeline` and `index` chunks are each below 500KB (use `React.lazy()`). | App.tsx already fully lazy-loads all route-level pages with `React.lazy()` + `Suspense`. No further changes needed. |
| RR-410 | 🔵 Low | Add `typecheck` npm script | Agent/Team D | Done (2026-04-05, `package.json`) | `package.json` has `"typecheck": "tsc --noEmit"` script. | See RAID I-004 (closed in CI but missing from package.json). |

---

## Sprint 5 — Documentation & Quality (Backlog)

**Sprint Goal:** Achieve full AUTO_DOCUMENTATION_STANDARD compliance and add missing tests.

| ID | Priority | Title | Owner | Status | Acceptance Criteria | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| RR-501 | 🟠 High | Write unit tests for `plaidClient.ts` | Agent | To Do | Test coverage for `classifyTransaction`, `AutoFlagRule` matching, and error paths. | No tests exist for `plaidClient.ts`. |
| RR-502 | 🟠 High | Write unit tests for `reviewPipeline.ts` | Agent | To Do | Test coverage for `EnrichmentData` flow and `AvatarChoice` branching. | No tests exist for `reviewPipeline.ts`. |
| RR-503 | 🟡 Medium | Add TSDoc comments to all `src/lib/*.ts` files | Agent | To Do | Every exported function/class has a TSDoc `@param`, `@returns`, and summary. | Required for TypeDoc generation (RR-406). |
| RR-504 | 🟡 Medium | Add TSDoc comments to all `src/services/*.ts` files | Agent | To Do | Same as above for the services layer. | Required for TypeDoc generation (RR-406). |
| RR-505 | 🟡 Medium | Fix remaining ESLint errors (all `any` types) | Agent | To Do | `npm run lint` exits 0 with 0 errors. | Continuation of RR-402. |
| RR-506 | 🔵 Low | Add WCAG 2.1 AA accessibility audit | Agent | To Do | Run `axe-core` against all pages; fix all Critical/Serious violations. | README claims WCAG 2.1 AA compliance but no audit exists. |
| RR-507 | 🔵 Low | Update CHANGELOG.md to Keep-a-Changelog format | Agent | To Do | `CHANGELOG.md` follows https://keepachangelog.com format consistently. | Current format is inconsistent between entries. |

---

## Sprint 6 — Feature Completeness (Backlog)

**Sprint Goal:** Close all open feature stubs — nothing scaffolded but unwired.

| ID | Priority | Title | Owner | Status | Acceptance Criteria | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| RR-601 | 🟠 High | Wire CrossMarketSeeder to live OpenRouter API | Agent | To Do | Seeder generates real localized review text; each market variant is unique; no hardcoded demo text returned. | `src/lib/crossMarketReviews.ts` exists; need to verify it calls `openRouterService`. |
| RR-602 | 🟠 High | Implement real HeyGen avatar video generation | Agent | To Do | `ReviewVideoCreator` calls HeyGen API with the selected avatar and script; video URL is saved to Supabase Storage. | `HEYGEN_API_KEY` is in `.env.example` (commented). |
| RR-603 | 🟡 Medium | Implement live YouTube OAuth2 refresh token flow | Agent | To Do | Access tokens are refreshed automatically; uploads do not fail on token expiry. | `youtubeService.ts` exists; need to verify refresh logic. |
| RR-604 | 🟡 Medium | Add newsletter confirmation email via Supabase Edge Function | Agent | To Do | Subscriber receives a confirmation email within 60 seconds of signing up. | `emailStore.ts` saves to Supabase; no email trigger exists. |
| RR-605 | 🔵 Low | Implement Odoo ERP sync | Agent | To Do | Products added in ProductLifecycle sync to the Odoo instance configured in env vars. | `src/lib/odooClient.ts` exists; needs real integration test. |

---

## Sprint 7 — Performance & Green Coding (Backlog)

**Sprint Goal:** Reduce bundle size, improve load times, and apply green-coding practices.

| ID | Priority | Title | Owner | Status | Acceptance Criteria | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| RR-701 | 🟡 Medium | Lazy-load all route-level components | Agent | To Do | Every page in `App.tsx` uses `React.lazy()`; initial JS bundle is under 200KB. | Continuation of RR-409. |
| RR-702 | 🟡 Medium | Add image compression pipeline | Agent | To Do | Images uploaded via `ImageUploader` are auto-compressed to ≤200KB JPEG/WebP before upload. | `src/components/business/ImageUploader.tsx` exists. |
| RR-703 | 🔵 Low | Remove dead/unreferenced components | Agent | To Do | Run `ts-unused-exports`; remove or mark any file with 0 imports as internal-only. | Green coding — no energy wasted on unused code. |
| RR-704 | 🔵 Low | Add Vite bundle analyzer report | Agent | To Do | `npm run analyze` generates a visual treemap of bundle composition. | Use `rollup-plugin-visualizer`. |

---

## 📥 Inbox (Ungroomed — Add Items Here)

> Use this section to capture new ideas, bugs, or requests. Items are groomed into sprint tiers at the next planning session.

| Date Added | Requested By | Title | Description | Priority Guess |
| :--- | :--- | :--- | :--- | :--- |
| 2026-04-05 | Issue #issue | Compliance + documentation upgrade | Full analysis, backlog, rollout plan, agent guide | 🔴 Critical |

---

## Completed Items (Archive)

| ID | Title | Completed | PR/Commit |
| :--- | :--- | :--- | :--- |
| RR-101 | Supabase Auth implementation | 2026-04-03 | `feat/team-a-*` |
| RR-102 | localStorage → Supabase migration | 2026-04-03 | `feat/team-a-*` |
| RR-103 | Multi-entity tax architecture | 2026-04-03 | `feat/team-a-*` |
| RR-104 | Remove exposed secrets from Git tracking | 2026-04-03 | `feat/team-a-*` |
| RR-201 | Stock avatars for Caresse persona | 2026-04-03 | `feat/team-b-*` |
| RR-202 | Review Publishing Wizard (6-step) | 2026-04-03 | `feat/team-b-*` |
| RR-203 | YouTube Data API v3 auto-post | 2026-04-03 | `feat/team-b-*` |
| RR-204 | Supabase Storage image uploader | 2026-04-03 | `feat/team-b-*` |
| RR-301 | GitHub Actions CI/CD workflows | 2026-04-03 | `feat/team-d-cicd-docs` |
| RR-302 | CodeRabbit AI PR review | 2026-04-03 | `feat/team-d-cicd-docs` |
| RR-303 | Scrum documentation suite | 2026-04-03 | `feat/team-d-cicd-docs` |
| RR-304 | Branch protection rules documented | 2026-04-03 | `feat/team-d-cicd-docs` |
| RR-401 | Migrate Admin Panel API keys from localStorage to env vars | 2026-04-05 | `fix: RR-401 + RR-402` |
| RR-402 | Fix 22 ESLint `no-explicit-any` violations across 8 files | 2026-04-05 | `fix: RR-401 + RR-402` |
| RR-410 | Add `typecheck` npm script to `package.json` | 2026-04-05 | `fix: RR-401 + RR-402` |
| RR-403 | Finalize Plaid bank-link backend (Supabase migration + sync) | 2026-04-05 | `fix: RR-403 RR-407 RR-408` |
| RR-407 | Add Mermaid architecture diagrams to README | 2026-04-05 | `fix: RR-403 RR-407 RR-408` |
| RR-408 | Add gitleaks pre-commit hook | 2026-04-05 | `fix: RR-403 RR-407 RR-408` |
| RR-404 | Finalize Stripe subscription checkout | 2026-04-05 | `fix: RR-404 RR-406 RR-409` |
| RR-406 | Add TypeDoc to build pipeline | 2026-04-05 | `fix: RR-404 RR-406 RR-409` |
| RR-409 | Code-split large bundle chunks (already done via React.lazy) | 2026-04-05 | `fix: RR-404 RR-406 RR-409` |
