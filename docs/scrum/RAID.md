# R.A.I.D. Log — Reese Reviews

**Date:** April 5, 2026 (updated from April 3, 2026)
**Standard:** revvel-standards/MASTER_APP_TEMPLATE.md (Phase 6: R.A.I.D. Log)

---

## 1. Introduction

The R.A.I.D. (Risks, Assumptions, Issues, Dependencies) Log tracks critical factors that could impact the success of the `reese-reviews.com` project. It is actively maintained and reviewed during each sprint.

---

## 2. Risks

| ID | Description | Impact | Probability | Mitigation Strategy | Owner | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| R-001 | OpenRouter API Key Exposure in Git History | High | High | Key rotated immediately; `.env` added to `.gitignore`; `git filter-branch` recommended for full cleanup. | Team A | Mitigated |
| R-002 | Force-Push Overwrites (MindMappr Incident) | High | Medium | Enforce strict branch protection rules; ban `git push --force`; require PRs and CI checks. | Team D | Mitigated |
| R-003 | Supabase Anon Key Exposure | Medium | High | Ensure Row Level Security (RLS) is enabled and properly configured on all tables. | Team A | Mitigated |
| R-004 | API Rate Limits (OpenRouter, YouTube, HeyGen) | Medium | Medium | Implement retry logic with exponential backoff; monitor usage and configure billing alerts. | Team B | Open |
| R-006 | Agent sessions leave incomplete work with no handoff | High | High | Enforce HANDOFF.md update before every session end; use BACKLOG.md as shared state. See `docs/AGENT_COMPLETION_GUIDE.md`. | Audrey/All agents | Open |
| R-007 | Large bundle chunks impact performance and Core Web Vitals | Medium | High | Apply `React.lazy()` to route-level components; track with Vite bundle analyzer (RR-409). | Agent/Team D | Open |
| R-008 | Scaffolded integrations (HeyGen, Odoo, Meta) never wired up | High | Medium | Audit `.env.example` for commented-out keys; create wire-up tasks in backlog for each. See `docs/BACKLOG.md`. | Agent | Open |

---

## 3. Assumptions

| ID | Description | Impact | Owner | Status |
| :--- | :--- | :--- | :--- | :--- |
| A-001 | Users have valid Amazon Vine accounts and can provide session cookies for the import pipeline. | High | Team C | Validated |
| A-002 | The DigitalOcean App Platform will reliably auto-deploy upon pushes to the `main` branch. | Medium | Team D | Validated |
| A-003 | The Caresse avatar persona is acceptable to the target audience and complies with FTC guidelines. | Medium | Team B | Open |
| A-004 | The current glassmorphism UI aesthetic aligns with the `revvel-standards` requirements. | Low | Team A | Validated |

---

## 4. Issues

| ID | Description | Priority | Resolution | Owner | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-001 | Hardcoded fallback password in client JS bundle (`src/contexts/AuthContext.tsx`). | Critical | Replaced with Supabase Auth; fallback password moved to environment variable. | Team A | Closed |
| I-002 | Admin panel stores API keys (OpenRouter, Stripe, Plaid) in browser `localStorage`. | High | Flagged for future migration to server-side secret management. | Team C | Open |
| I-003 | Missing CI/CD pipelines and automated code review configuration. | Medium | Created `.github/workflows/ci.yml`, `deploy.yml`, and `.coderabbit.yaml`. | Team D | Closed |
| I-005 | No shared agent backlog — each session starts blind | Critical | Add `docs/BACKLOG.md` as required reading for all agents; enforce HANDOFF.md update protocol. | All agents | Closed (2026-04-05) |
| I-006 | 10+ scaffolded features with env vars commented out in `.env.example` | High | Create wire-up backlog items for each: HeyGen video, Meta auto-post, Odoo ERP sync, newsletter email trigger. | Agent | Open |

---

## 5. Dependencies

| ID | Description | Impact | Owner | Status |
| :--- | :--- | :--- | :--- | :--- |
| D-001 | **Supabase:** Core database, authentication, and storage provider. Application cannot function without it. | Critical | Team A | Active |
| D-002 | **OpenRouter API:** Required for AI-generated review content and metadata stripping. | High | Team C | Active |
| D-003 | **YouTube Data API v3:** Required for automated video publishing and scheduling. | Medium | Team B | Active |
| D-004 | **DigitalOcean App Platform:** Required for hosting the frontend application and routing. | High | Team D | Active |
| D-006 | **Meta Business API:** Required for auto-posting to Instagram/Facebook (RR-405). | Medium | Agent/Team B | Pending setup |
| D-007 | **HeyGen API:** Required for real avatar video generation (RR-602). | Medium | Agent/Team B | Pending setup |
