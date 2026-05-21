# Security Policy — Reese Reviews

**Standard:** revvel-standards/SECURITY.md  
**Project:** Reese Reviews (reesereviews.com)  
**Owner:** Audrey Evans / MIDNGHTSAPPHIRE  
**Last Updated:** May 2026

---

## Reporting a Vulnerability

If you discover a security vulnerability in Reese Reviews, please **do not open a public GitHub issue**. Instead:

1. **Email:** Open a private security advisory via GitHub → Security → Advisories → "Report a vulnerability"
2. **Include:** Description of the vulnerability, steps to reproduce, potential impact, and your suggested fix (if any)
3. **Response time:** We will acknowledge receipt within 48 hours and provide a remediation timeline within 7 days

We follow responsible disclosure. Do not publicly disclose the vulnerability until a fix has been released.

---

## Supported Versions

| Version | Supported |
| :--- | :--- |
| Latest (main branch) | ✅ Active |
| Previous major versions | ❌ Not supported (single production branch) |

---

## Security Architecture

### Authentication

- **Provider:** Supabase Auth (email/password + magic link)
- **Session management:** JWTs issued by Supabase, stored in `localStorage` (client-side)
- **Protected routes:** `src/components/auth/ProtectedRoute.tsx` guards all authenticated pages
- **Fallback auth:** Environment variable `VITE_FALLBACK_PASSWORD` (never hardcoded)

### Authorization

- **Row Level Security (RLS):** Enabled on all Supabase tables. Users can only read/write their own data.
- **Service role key:** Never exposed to the client; only used in Supabase Edge Functions (server-side)
- **API keys:** All third-party API keys (OpenRouter, Stripe, Plaid, YouTube) are stored as environment variables, never in client-side localStorage

### Secret Management

All secrets are managed in **Doppler** (project: `reese-reviews`). See `AGENTS.md` for full Doppler protocol.

| Secret | Storage | Exposure |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | DigitalOcean App Platform env vars | Public (by design — Supabase client URL) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | DigitalOcean App Platform env vars | Public (by design — client-side anon key, RLS-scoped) |
| `VITE_OPENROUTER_API_KEY` | Doppler → DigitalOcean env vars | Server/build time only |
| `VITE_STRIPE_LINK_PRO` | Doppler → DigitalOcean env vars | Public Payment Link URL (no secret value) |
| `VITE_STRIPE_LINK_BUSINESS` | Doppler → DigitalOcean env vars | Public Payment Link URL (no secret value) |
| `PLAID_CLIENT_ID` | Doppler → server env vars | Server-side only |
| `HEYGEN_API_KEY` | Doppler → server env vars | Server-side only |
| `DO_API_TOKEN` | GitHub Secrets | CI/CD pipeline only |

### Transport Security

- **TLS:** All traffic served over HTTPS via DigitalOcean App Platform (auto-managed Let's Encrypt certificates)
- **HSTS:** Enforced at the CDN/platform level
- **CORS:** Supabase CORS origins restricted to `https://reesereviews.com` in production

### Content Security

- **FTC Compliance:** All AI-generated review content includes mandatory FTC disclosure text by default (configurable in `ReviewSubmissionForm.tsx`)
- **Input sanitization:** All user-supplied inputs are validated via React Hook Form with Zod schemas before submission
- **XSS prevention:** React's built-in JSX escaping; no `dangerouslySetInnerHTML` usage
- **SQL injection:** Parameterized queries via Supabase client SDK; no raw SQL construction from user input

---

## Security Controls

### Pre-commit Secret Scanning

A **gitleaks** pre-commit hook is installed via Husky. It scans staged changes for secrets before every commit.

```bash
# .husky/pre-commit
gitleaks protect --staged --config .gitleaks.toml
```

Custom rules in `.gitleaks.toml` detect Supabase and OpenRouter key patterns.

**Note:** gitleaks must be installed locally (`brew install gitleaks` / [Linux releases](https://github.com/gitleaks/gitleaks/releases)). If not installed, commits proceed with a warning.

### CI/CD Security Gates

The GitHub Actions CI pipeline (`.github/workflows/ci.yml`) includes:
- **Dependency audit:** `npm audit --audit-level=high` on every push
- **Third-party artifact audit:** `.github/workflows/gatekeeper.yml` scans for unauthorized platform artifacts
- **Secret scanning:** TruffleHog via `gatekeeper.yml` scans for verified secrets on every PR and push

### Dependency Management

- Keep all `npm` dependencies up to date; run `npm audit` regularly
- Use `npm audit fix` for non-breaking security patches
- Review breaking-change audit fixes manually before applying
- `npm audit --audit-level=high` is a CI gate (non-blocking for pre-existing issues; becomes blocking after cleanup)

---

## Known Security Gaps & Remediation Status

| Gap | Severity | Status | Remediation |
| :--- | :--- | :--- | :--- |
| Git history contains old `.env` secrets (pre-RR-104) | Medium | Accepted risk | Keys rotated; RLS prevents exploitation; BFG purge scheduled for next major version |
| `VITE_OPENROUTER_API_KEY` exposed in client bundle (Vite `VITE_*` prefix) | Medium | In Progress (RR-601) | Move to server-side proxy (edge function or backend API) |
| YouTube OAuth2 refresh token stored in localStorage | Low | In Progress (RR-603) | Migrate to Supabase secure storage |

---

## Security Checklist for Contributors

Before opening a PR, verify:

- [ ] No secrets, API keys, or tokens committed (gitleaks pre-commit will catch this)
- [ ] No new `dangerouslySetInnerHTML` usage
- [ ] All new database queries use Supabase parameterized SDK (no raw SQL string concatenation)
- [ ] All new API endpoints require authentication (Supabase RLS or explicit auth check)
- [ ] New environment variables added to `.env.example` with placeholder values only
- [ ] `npm audit --audit-level=high` passes after adding new dependencies

---

## Incident Response

| Severity | Definition | Response Time | Contact |
| :--- | :--- | :--- | :--- |
| Critical (P0) | Active exploitation, data breach, or secret exposure | <2 hours | GitHub Security Advisory (private) |
| High (P1) | Unpatched critical vulnerability with public PoC | <24 hours | GitHub Security Advisory (private) |
| Medium (P2) | Vulnerability requiring user interaction or limited impact | <7 days | GitHub issue (private) |
| Low (P3) | Minor security improvement or hardening | Next sprint | GitHub issue (public backlog) |

For P0/P1 incidents:
1. Rotate affected credentials immediately via Doppler
2. Enable Supabase RLS emergency lockdown if data exposure suspected
3. File a GitHub Security Advisory
4. Deploy hotfix via `hotfix/` branch → direct merge to main

---

*This document is maintained per revvel-standards/SECURITY.md requirements. Review quarterly or after any security incident.*
