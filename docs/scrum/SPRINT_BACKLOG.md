# Sprint Backlog — Reese Reviews

**Date:** April 5, 2026 (updated from April 3, 2026)
**Standard:** revvel-standards/MASTER_APP_TEMPLATE.md (Phase 4: Scrum Docs)

---

## Sprint 1: Security, Persistence & Multi-Entity (Team A) - Completed

**Goal:** Secure the application, migrate local data to the cloud, and implement multi-business logic.

| Story ID | User Story | Story Points | Status | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| RR-101 | As an admin, I need the application to use Supabase Auth so that access is secure. | 5 | Done | Supabase Auth implemented; fallback password removed from client code; RLS enabled. |
| RR-102 | As a user, I need my data saved to Supabase so that it persists across devices. | 8 | Done | All `localStorage` stores migrated to Supabase tables; offline fallback implemented. |
| RR-103 | As a business owner, I need to manage multiple business entities so that I can track taxes separately. | 5 | Done | `business_entities` table created; UI added to manage entities. |
| RR-104 | As a developer, I need to remove exposed secrets from Git tracking so that the repository is secure. | 3 | Done | `.env` untracked; `.gitignore` updated; `SECURITY_AUDIT.md` created. |

---

## Sprint 2: Avatar & YouTube Automation (Team B) - Completed

**Goal:** Implement the avatar-based review generation pipeline and automate YouTube publishing.

| Story ID | User Story | Story Points | Status | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| RR-201 | As a creator, I need stock avatars of Caresse so that I can quickly generate review videos. | 3 | Done | 5 stock avatars added; AvatarSelector component created. |
| RR-202 | As a creator, I need a Review Publishing Wizard so that I am guided through the generation process. | 8 | Done | 6-step wizard implemented with validation at each step. |
| RR-203 | As a marketer, I need to auto-post reviews to YouTube so that I can reach a wider audience. | 8 | Done | YouTube Data API v3 integrated; OAuth2 flow implemented; upload queue created. |
| RR-204 | As a user, I need to upload images to Supabase Storage so that my media is managed securely. | 5 | Done | Drag-and-drop uploader created; auto-resize and optimization implemented. |

---

## Sprint 3: CI/CD, Documentation & QA (Team D) - Completed

**Goal:** Establish deployment pipelines, finalize documentation, and ensure standards compliance.

| Story ID | User Story | Story Points | Status | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| RR-301 | As a developer, I need GitHub Actions workflows so that code is automatically tested and deployed. | 5 | Done | `ci.yml` and `deploy.yml` created; typecheck, lint, test, build steps included. |
| RR-302 | As a developer, I need CodeRabbit configured so that PRs are automatically reviewed by AI. | 2 | Done | `.coderabbit.yaml` created with Revvel standards instructions. |
| RR-303 | As a project manager, I need comprehensive scrum documentation so that the project history is preserved. | 5 | Done | SPRINT_BACKLOG, DARE, RAID, RELEASE_NOTES, HANDOFF, RETROSPECTIVE created. |
| RR-304 | As a developer, I need branch protection rules documented so that force-pushes are prevented. | 2 | Done | `BRANCH_PROTECTION.md` created. |

---

## Sprint 4: Security, Integrations & Documentation (Active)

**Goal:** Address critical security gaps (Admin Panel localStorage keys), fix ESLint violations, finalize Plaid/Stripe backend wiring, and complete documentation gaps identified in the STANDARDS_COMPLIANCE audit.

> **Full backlog with all items, priorities, and acceptance criteria: [`docs/BACKLOG.md`](../BACKLOG.md)**

| Story ID | User Story | Story Points | Status | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| RR-401 | As an admin, I need API keys stored securely so that they are not accessible via browser DevTools. | 5 | To Do | Admin panel reads keys from `import.meta.env.*`; no API key written to `localStorage`; existing stored keys migrated to env-based config. |
| RR-402 | As a developer, I need the top ESLint violations fixed so that CI runs clean. | 3 | To Do | `npm run lint` shows ≤63 errors; no new `any` types introduced; at least 20 violations resolved. |
| RR-403 | As a user, I need Plaid bank-link finalized so that my transactions import automatically. | 8 | To Do | Plaid Link token exchange completes in sandbox; transactions sync to Supabase `plaid_transactions` table; transactions categorized by entity. |
| RR-404 | As a user, I need Stripe subscriptions finalized so that I can manage my billing plan. | 5 | To Do | Stripe Checkout session creates successfully; webhook handler verifies payment; subscription tier updates in Supabase. |
| RR-405 | As a marketer, I need Meta Business API integration so that I can auto-post to Instagram and Facebook. | 8 | To Do | Meta API connected; scheduling system implemented; auto-posting verified in sandbox. |
| RR-406 | As a developer, I need TypeDoc integrated into the build pipeline so that the API is auto-documented. | 3 | To Do | `npm run docs` generates HTML documentation from TSDoc comments into `/docs/api/`; CI step added. |
| RR-407 | As a developer, I need Mermaid architecture diagrams so that onboarding is faster. | 2 | To Do | `README.md` contains at least one Mermaid diagram showing component/data-flow architecture. |
| RR-408 | As a developer, I need a gitleaks pre-commit hook so that secrets are never committed. | 2 | To Do | `gitleaks` runs on every `git commit`; a test commit containing a dummy secret is blocked. |
| RR-409 | As a developer, I need large bundle chunks split so that initial load is faster. | 3 | To Do | `ReviewPipeline` and `index` chunks each below 500KB after applying `React.lazy()`. |
| RR-410 | As a developer, I need a `typecheck` npm script so that I can verify TypeScript locally. | 1 | To Do | `package.json` contains `"typecheck": "tsc --noEmit"`; `npm run typecheck` exits 0. |
