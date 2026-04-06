# Security Audit Report — Reese Reviews

**Date:** April 3, 2026
**Team:** Team A (Security, Supabase, Auth)
**Status:** Remediated

---

## 1. Exposed Secrets in Git History

The `.env` file was committed to the repository in commit `21fbdf41` (initial creation) and remained tracked through commit `6249c8d` and beyond. The following secrets were exposed in the public git history:

| Secret | Type | Risk Level | Action Required |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | **Medium** | Rotate recommended; this is a public-facing key but grants RLS-scoped access |
| `VITE_SUPABASE_URL` | Supabase project URL | **Low** | Public by design, but confirms project identity |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | **Low** | Public identifier |
| `VITE_OPENROUTER_API_KEY` | OpenRouter API key | **HIGH** | **Must rotate immediately** — grants full API access and incurs billing |

### Rotation Recommendations

1. **OpenRouter API Key** — Go to [openrouter.ai/keys](https://openrouter.ai/keys), revoke the exposed key `sk-or-v1-413334f6...`, and generate a new one. Update the `.env` on the production server.

2. **Supabase Anon Key** — The anon key is designed to be public (embedded in client-side code). However, since it was committed alongside the project URL, an attacker could craft requests. Ensure Row Level Security (RLS) policies are properly configured on all tables. Consider rotating via Supabase Dashboard > Settings > API if desired.

3. **Supabase Service Role Key** — Verify this key was **never** committed. It was not found in the `.env` file, which is correct. The service role key must only exist on the server.

---

## 2. Hardcoded Secrets in Source Code

| File | Secret | Risk | Remediation |
| :--- | :--- | :--- | :--- |
| `src/contexts/AuthContext.tsx` | `VALID_PASSWORD = "WizOz#123"` | **HIGH** — plaintext password in client JS bundle | Replaced with Supabase Auth; fallback password moved to env var |
| `src/components/admin/AdminPanel.tsx` | Stores `openRouterKey`, `stripeKey`, `plaidClientId` in localStorage | **Medium** — API keys persisted in browser storage | Flagged for future remediation (Team C scope) |

---

## 3. Remediation Actions Taken

1. **`.gitignore` updated** — Added `.env`, `.env.*` exclusion rules (with `!.env.example` exception).
2. **`.env` removed from tracking** — Executed `git rm --cached .env` to stop tracking the file while preserving it locally.
3. **`.env.example` created** — Placeholder template with all required environment variables documented.
4. **Auth hardcoded password** — Replaced with Supabase Auth integration; the fallback password is now read from `VITE_FALLBACK_PASSWORD` environment variable (not hardcoded).
5. **Security documentation** — This audit report created for team reference.

---

## 4. Remaining Risks

- **Git history still contains secrets** — The `.env` values remain in git history. To fully remediate, the repository owner should use `git filter-branch` or BFG Repo Cleaner to purge the history, then force-push (with team coordination per CONCURRENT_DEVELOPMENT_STANDARD).
- **AdminPanel localStorage keys** — The admin panel allows users to enter API keys that are stored in browser localStorage. This should be migrated to server-side secret management in a future sprint.

---

## 5. Recommendations

1. Rotate the OpenRouter API key immediately.
2. Enable Supabase RLS on all new tables.
3. Add a pre-commit hook to scan for secrets (e.g., `gitleaks`).
4. Consider using GitHub Actions secrets for CI/CD instead of `.env` files.
