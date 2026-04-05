# Rollout Plan — Reese Reviews

**Repository:** `midnghtsapphire/reese-reviews`
**Last Updated:** April 5, 2026
**Live URL:** https://reesereviews.com
**Hosting:** DigitalOcean App Platform (auto-deploys on merge to `main`)

---

## Overview

`reesereviews.com` is a live, active application. Every merge to `main` triggers an automatic deployment. This document defines the safe process for rolling out new features and the rollback procedure for reverting a bad deployment.

---

## Deployment Architecture

```
Developer/Agent
    │
    ▼
Feature Branch  ──►  Pull Request  ──►  CI Checks (lint, typecheck, test, build)
                                              │
                                              ▼ (all pass)
                                        Merge to main
                                              │
                                              ▼
                                   GitHub Actions deploy.yml
                                              │
                                              ▼
                                DigitalOcean App Platform
                                    (production build)
                                              │
                                              ▼
                                    reesereviews.com live
```

**Pipeline steps in `ci.yml`:** ESLint → TypeScript typecheck → Vitest → Vite build  
**Deployment step in `deploy.yml`:** Triggered only on successful CI, pushes to DigitalOcean

---

## Pre-Deployment Checklist

Before merging any PR to `main`, verify all items below:

### Code Quality
- [ ] `npm run lint` exits 0 (no errors)
- [ ] `npm run typecheck` exits 0 (no TypeScript errors) — use `npx tsc --noEmit` if script not in package.json
- [ ] `npm test` — all tests pass
- [ ] `npm run build` — production build succeeds with no warnings about oversized chunks

### Feature Verification
- [ ] Feature works end-to-end in the browser at `http://localhost:5173` (dev mode)
- [ ] Feature works with the production build (`npm run preview`)
- [ ] Error cases handled (no unhandled promise rejections in browser console)
- [ ] No new `console.log` or debug output left in the code

### Security
- [ ] No new secrets, API keys, or credentials committed
- [ ] `.env.example` updated with any new env var placeholders
- [ ] No new `any` types or unsafe casts introduced

### Documentation
- [ ] `CHANGELOG.md` updated with the change
- [ ] `docs/BACKLOG.md` item marked `Done`
- [ ] `docs/scrum/HANDOFF.md` updated

---

## Rollout Strategy by Risk Level

Not all changes carry the same risk. Use the appropriate strategy based on the change type.

### 🟢 Low Risk — Direct Merge

Changes that are safe to merge directly to `main` with no special precautions:
- Documentation-only changes (`.md` files)
- CSS/styling tweaks with no logic changes
- Adding new env vars to `.env.example`
- Test additions
- Dependency updates (patch/minor versions)

**Process:** Standard PR → CI passes → Merge → Auto-deploy

---

### 🟡 Medium Risk — Staged Rollout

Changes that modify existing behavior or add new user-facing features:
- New UI components wired to existing data
- New Supabase tables or columns
- Changes to existing stores or services
- New API integrations (not yet live-traffic)

**Process:**
1. Deploy to a preview branch first (DigitalOcean supports preview environments)
2. Test manually at the preview URL
3. Verify Supabase migrations run correctly (check Supabase dashboard)
4. Merge to `main` during low-traffic hours (overnight US time)
5. Monitor DigitalOcean logs for 30 minutes post-deploy

---

### 🔴 High Risk — Coordinated Deployment

Changes that affect authentication, payment flows, database schema (destructive), or core navigation:
- Auth provider changes
- Stripe checkout flow changes
- Database column renames/deletions
- RLS policy changes
- Major refactors affecting multiple pages

**Process:**
1. Create a feature flag or environment variable to gate the change (see Feature Flags below)
2. Deploy with the flag **disabled** — verify nothing breaks
3. Enable the flag for 10% of sessions (if supported) or enable for internal testing only
4. Run full smoke test (see Smoke Test Checklist below)
5. Merge to `main` during a maintenance window (announce on Discord/Slack)
6. Keep the previous Docker image / DigitalOcean deployment version on standby for 24 hours

---

## Rollback Procedures

### Scenario 1: Bad deploy caught within 30 minutes

**Option A — DigitalOcean Rollback (fastest)**
1. Log in to DigitalOcean App Platform dashboard
2. Navigate to the `reese-reviews` app → Deployments tab
3. Find the last known-good deployment
4. Click **Rollback to this deployment**
5. DigitalOcean re-deploys the previous build within ~2 minutes

**Option B — Git Revert**
```bash
# On main, find the bad commit
git log --oneline -5

# Revert it (creates a new commit, does not rewrite history)
git revert <bad-commit-sha>

# Push — CI runs, then auto-deploys the revert
git push origin main
```

> ⚠️ **Never** use `git push --force` on `main`. Always use `git revert`. Force-pushes break the CI history and may corrupt DigitalOcean's deployment state.

---

### Scenario 2: Database migration was applied and needs rollback

Supabase migrations are **not automatically rolled back** when you revert code. You must roll back the database separately.

1. Log in to Supabase dashboard → SQL Editor
2. Run the rollback SQL for the migration. Every migration in `supabase/migrations/` must have a corresponding rollback section (see Migration Template below).
3. After the database is rolled back, revert the code (Scenario 1).

**Migration Template — always include a rollback section:**

```sql
-- Migration: 20260405_your_feature.sql
-- Description: What this migration does

-- === FORWARD MIGRATION ===
ALTER TABLE products ADD COLUMN new_field TEXT;

-- === ROLLBACK MIGRATION ===
-- Run this section manually in Supabase SQL Editor to undo
-- ALTER TABLE products DROP COLUMN new_field;
```

---

### Scenario 3: Auth or Supabase RLS broken (users locked out)

This is the highest-severity scenario. Users cannot log in or access their data.

**Immediate response:**
1. Revert the code change immediately (Scenario 1, Option A)
2. Check Supabase dashboard → Authentication → Logs for errors
3. Check Supabase dashboard → Database → Policies for any broken RLS rules
4. If RLS is the issue, temporarily disable the broken policy via Supabase SQL Editor:
   ```sql
   -- Temporarily disable the broken policy
   DROP POLICY IF EXISTS "broken_policy_name" ON your_table;
   -- Then re-enable the working policy from the previous migration
   ```
5. Post a status update in Discord/Slack immediately

---

### Scenario 4: Third-party API outage (OpenRouter, YouTube, Plaid)

The app should degrade gracefully. If it doesn't:
1. Identify which API is down (check status pages: openrouter.ai/status, developers.google.com/youtube/status)
2. Temporarily disable the affected feature via environment variable if possible
3. Review the service's error handling code — is it surfacing errors to the user or failing silently?
4. If the feature is critical, notify users via site banner or email

---

## Smoke Test Checklist

Run after every production deployment:

### Public Pages
- [ ] Home page loads at `reesereviews.com`
- [ ] Nav links work (Reviews, Blog, About, Contact)
- [ ] Featured reviews display correctly
- [ ] SEO meta tags present (check via browser DevTools → Elements → head)

### Auth
- [ ] Login page loads at `/login`
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials shows error message (not a blank screen)
- [ ] Logout works

### Business Dashboard
- [ ] Dashboard page loads after login
- [ ] Tax/ERP Center loads
- [ ] Vine Review list loads (even if empty)

### Review Pipeline
- [ ] Review Publishing Wizard opens
- [ ] Step 1 (import/select item) completes without errors

### API Health
- [ ] OpenRouter AI generation works (generate a test review)
- [ ] No errors in browser console (`F12` → Console tab)

---

## Feature Flags

For high-risk changes, use environment variables as feature flags. Add to `.env.example` and check in component:

```typescript
// In component or service
const isFeatureEnabled = import.meta.env.VITE_ENABLE_NEW_STRIPE_FLOW === 'true';

if (isFeatureEnabled) {
  // New behavior
} else {
  // Existing behavior
}
```

On DigitalOcean: set the env var to `false` on deploy, verify nothing breaks, then set to `true` to activate.

---

## Maintenance Window Schedule

For high-risk deployments, use the following schedule to minimize user impact:

| Day | Time (US Mountain) | Notes |
| :--- | :--- | :--- |
| Tuesday–Thursday | 2:00 AM – 4:00 AM | Lowest traffic window |
| Avoid Friday–Sunday | — | Weekend traffic spike |
| Avoid Monday morning | — | Start-of-week usage |

---

## Contacts & Escalation

| Role | Contact | When to Reach |
| :--- | :--- | :--- |
| App Owner | Audrey Evans (`@midnghtsapphire`) | All critical incidents |
| DigitalOcean Support | [cloud.digitalocean.com/support](https://cloud.digitalocean.com/support) | Hosting/infra issues |
| Supabase Support | [supabase.com/support](https://supabase.com/support) | DB/Auth issues |
| OpenRouter Support | [openrouter.ai](https://openrouter.ai) | AI API issues |

---

## Version History

| Version | Date | Summary |
| :--- | :--- | :--- |
| 1.0.0 | 2026-04-05 | Initial rollout plan created |
