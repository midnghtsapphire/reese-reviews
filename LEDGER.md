# LEDGER: reese-reviews

Work log per revvel-standards `WRITE_AS_YOU_GO_STANDARD.md`. Append-only. Newest first.
This file was created on 2026-11-19. No earlier entry exists.

## 2026-11-19 17:40 America/Denver — Git-Master — merge daily/2026-11-19 into the toolkit branch (PR #98)

- **Actor:** Git-Master
- **Requested by:** Audrey Evans (t133u, 19 Nov 2026): "ya fix it all and merge it".
- **Role:** executed
- **Files:** `LEDGER.md` (add/add conflict resolved by keeping every entry from both sides); `CHANGELOG.md` (merged cleanly). The rest comes from the base: the dependency CVE fixes (#102).
- **What was done:** Merged the base `daily/2026-11-19` into `git-master/toolkit-ci-18494` with a normal merge. No force-push, nothing deleted.
- **Commits / PRs:** PR #98.

## 2026-11-19 17:05 America/Denver — Git-Master — fix the PR-number guard in the toolkit job; add the BACKLOG and HANDOFF entries

- **Actor:** Git-Master
- **Requested by:** TriageChief, 19 Nov 2026 (review of PR #98: Bugbot Medium at `.circleci/toolkit.yml` lines 45-48, plus the Devin docs flag). `RELAYED`: not Audrey's own words. Audrey (t133u, 19 Nov 2026): "ya fix it all and merge it".
- **Role:** executed
- **Files:** `.circleci/toolkit.yml`; `docs/BACKLOG.md` (Inbox row added); `docs/scrum/HANDOFF.md` (dated section added); `CHANGELOG.md`; `LEDGER.md`.
- **What was done:** Replaced the `CIRCLE_PULL_REQUEST` early exit with a three-step lookup: that variable, then `pipeline.event.github.pull_request.number`, then `gh api .../commits/$CIRCLE_SHA1/pulls`. The job logs which source found the number. Still advisory; every path ends in `exit 0`.
- **Decisions:** No `.github/workflows` file touched. No job deleted. `pipeline.trigger_parameters.github_app.*` was not used because CircleCI marks it deprecated.
- **Sources:** CircleCI docs (variables reference, pipeline values), read 19 Nov 2026.
- **Commits / PRs:** PR #98.
- **Open / handoff:** Confirm in the CircleCI step log that the check ran for the PR instead of skipping.

## 2026-11-19 17:00 America/Denver — Git-Master — fix HIGH dependency CVEs (issue #101)

- **Actor:** Git-Master
- **Requested by:** TriageChief (separate WR and draft PR for the CVEs), then Audrey Evans in her own chat, t133u: "ya fix it all and merge it". The Audrey quote is `RELAYED` by the dispatcher.
- **Role:** executed
- **Files:** `package-lock.json`; `requirements.txt`; `CHANGELOG.md`; `LEDGER.md` (new). `package.json` did not change.
- **What was done:** Ran `npm audit fix` without `--force` (Node 22.23.5, npm 10.9.9, the major version CI uses). Changed `python-multipart==0.0.22` to `>=0.0.30` and commented out the old pin. Trivy v0.76.2 with the CI flags: HIGH went from 21 (npm) and 2 (pip) to 0 and 0. MEDIUM went from 15 to 2 (npm) and from 3 to 2 (pip).
- **Decisions:** No `--force`, no Trivy ignores. Two nested transitive major bumps came from npm itself: `brace-expansion` 2.1.4 to 5.0.13 and `minimatch` 9.0.9 to 11.0.9 under `@typescript-eslint/typescript-estree`.
- **Sources:** MEASURED: `npm run typecheck` clean; `npm test` 20 files and 275 tests pass; `npm run lint` 0 errors, 11 warnings (same kind as before); `npm run build` succeeds. NOT TESTED: the Python side (`python-multipart>=0.0.30` with the pinned FastAPI) was not installed or run on the box.
- **Remaining after the fix:** Trivy MEDIUM only: `react-router` (2, fix needs 7.x, a major), `pytest` (2, fix needs 9.x), `python-dotenv` (1, fix is 1.2.2). `npm audit` still lists `vitest`/`tinypool` (critical), `vite` and `zod` (high) as needing `--force` major bumps; Trivy does not flag them at HIGH with `--ignore-unfixed`. Left for a separate decision.
- **Commits / PRs:** branch `git-master/fix-high-cves-101`, draft PR into `daily/2026-11-19`.
- **Open / handoff:** `LEDGER.md` is also created by PR #98 and #100; the second and third to merge need a trivial conflict fix (keep all entries).

## 2026-11-19 16:50 America/Denver — Git-Master — CircleCI pipeline `toolkit` registered for `.circleci/toolkit.yml`

- **Actor:** Git-Master
- **Requested by:** Secret and TriageChief, 19 Nov 2026 (push a commit to get the first run). `RELAYED`: not Audrey's own words.
- **Role:** executed
- **Files:** `LEDGER.md` only.
- **What was done:** Secret registered a CircleCI pipeline named `toolkit` for this repository. It reads `.circleci/toolkit.yml` and triggers on PR opened or pushed, plus default-branch and tag pushes. This entry is the commit that triggers its first run. The context `github-free-toolkit` (GH_TOKEN) already exists.
- **Decisions:** None. No config was changed in this commit.
- **Sources:** Secret's message to Git-Master, 19 Nov 2026.
- **Commits / PRs:** PR #98.
- **Open / handoff:** Check that `pr-hygiene-check` runs green on this PR.

## 2026-11-19 17:25 America/Denver — Git-Master — github-free-toolkit in CircleCI (WR midnghtsapphire/revvel-standards#18494)

- **Actor:** Git-Master
- **Requested by:** Audrey Evans, 19 Nov 2026, relayed by TriageChief in WR midnghtsapphire/revvel-standards#18494. `RELAYED`: this is the WR scope, not Audrey's own words.
- **Role:** executed
- **Files:** `.circleci/toolkit.yml` (new); `CHANGELOG.md`; `LEDGER.md` (new); `Library/README.md` (new). `.circleci/config.yml` was not touched.
- **What was done:** Added `pr-hygiene-check` (advisory, always exits 0) in its own workflow `pr-hygiene-advisory`. It fetches github-free-toolkit at `2b7fcd8004f4a6f21703bba10dab4ef52204a276`.
- **Decisions:** The new jobs are in their own file because `.circleci/config.yml` on main holds two configs pasted together (duplicate `version`, `jobs` and `workflows` keys) and does not parse. It was left as it is. The branch `daily/2026-11-19` was created from `main` at `81c45703`, because the only existing daily branch, `daily/2026-10-31`, is 60 commits behind main and has no `.circleci` folder.
- **Sources:** MEASURED: `circleci config validate` (CLI 1.18.0) reports `.circleci/toolkit.yml` valid. The same command reports main's `.circleci/config.yml` invalid ("Unable to parse YAML").
- **Commits / PRs:** branch `git-master/toolkit-ci-18494`, draft PR into `daily/2026-11-19`.
- **Open / handoff:** `.circleci/config.yml` is repaired by a separate draft PR (issue #99, TriageChief's request, `RELAYED`). Secret creates the CircleCI context `github-free-toolkit` (GH_TOKEN). The weekly report is scheduled only in revvel-standards; a first version of this PR also carried it and a new commit removed it. TriageChief assigns a non-author reviewer. Not marked ready.
