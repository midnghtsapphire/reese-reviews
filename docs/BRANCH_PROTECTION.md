# Branch Protection Rules — Reese Reviews

**Date:** April 3, 2026
**Standard:** revvel-standards/CONCURRENT_DEVELOPMENT_STANDARD.md
**Status:** Mandatory Policy

---

## 1. Overview

Branch protection rules are enforced on the `main` branch of the `reese-reviews` repository to prevent accidental overwrites, ensure code quality, and maintain a stable production deployment. These rules align with the Revvel Concurrent Development Standard and the No Force Push Policy established after the MindMappr incident on April 3, 2026.

---

## 2. Protected Branch: `main`

The following rules are configured (or must be configured) on the `main` branch via GitHub Settings or the GitHub API.

| Rule | Setting | Rationale |
| :--- | :--- | :--- |
| **Require pull request before merging** | Enabled | All changes must go through a PR for review. |
| **Required approving reviews** | 1 minimum | At least one reviewer (human or CodeRabbit) must approve. |
| **Dismiss stale PR reviews** | Enabled | New pushes to a PR branch invalidate previous approvals. |
| **Require status checks to pass** | Enabled | CI pipeline (lint, typecheck, build, test) must pass. |
| **Required status checks** | `ESLint`, `TypeScript Type Check`, `Vitest Unit & Integration Tests`, `Vite Production Build` | All four CI jobs must succeed. |
| **Require branches to be up to date** | Enabled | PR branch must be rebased on latest `main`. |
| **Require linear history** | Recommended | Prefer rebase over merge commits for clean history. |
| **Allow force pushes** | **Disabled** | Force-push is permanently banned per CODE_REVIEW_STANDARD. |
| **Allow deletions** | Disabled | The `main` branch cannot be deleted. |
| **Restrict who can push** | Repository admins only | Direct pushes to `main` are blocked for all other contributors. |

---

## 3. How to Apply via GitHub API

The following script applies branch protection rules programmatically. Replace `YOUR_PAT` with a GitHub Personal Access Token that has `repo` scope.

```bash
curl -X PUT \
  -H "Authorization: token YOUR_PAT" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/midnghtsapphire/reese-reviews/branches/main/protection \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": [
        "ESLint",
        "TypeScript Type Check",
        "Vitest Unit & Integration Tests",
        "Vite Production Build"
      ]
    },
    "enforce_admins": false,
    "required_pull_request_reviews": {
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": false,
      "required_approving_review_count": 1
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "required_linear_history": true
  }'
```

---

## 4. Multi-Team Workflow

When multiple teams work concurrently on this repository, the following workflow applies (per CONCURRENT_DEVELOPMENT_STANDARD):

1. Each team creates a dedicated feature branch: `feat/team-name-description`.
2. Teams commit and push to their feature branch freely.
3. When ready, the team creates a Pull Request to `main`.
4. CodeRabbit performs automated line-by-line review.
5. CI pipeline runs all checks (lint, typecheck, build, test).
6. PRs are merged sequentially (first-come-first-served).
7. If conflicts arise, the later team rebases on the updated `main`.
8. **Force-push is never used to resolve conflicts** — always rebase.

---

## 5. Enforcement History

On April 3, 2026, a force-push to the `master` branch of the MindMappr repository overwrote two teams' committed work, including the Rex Tools integration and the Activity Window feature. The lost commits required a full manual reconstruction effort. This incident led to the creation of the No Force Push Policy (CODE_REVIEW_STANDARD Section 5) and the Concurrent Development Standard.

---

## 6. Related Documents

- [CODE_REVIEW_STANDARD.md](https://github.com/midnghtsapphire/revvel-standards/blob/main/CODE_REVIEW_STANDARD.md)
- [CONCURRENT_DEVELOPMENT_STANDARD.md](https://github.com/midnghtsapphire/revvel-standards/blob/main/CONCURRENT_DEVELOPMENT_STANDARD.md)
- [CI Workflow](.github/workflows/ci.yml)
- [Deploy Workflow](.github/workflows/deploy.yml)
