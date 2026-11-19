# LEDGER: reese-reviews

Work log per revvel-standards `WRITE_AS_YOU_GO_STANDARD.md`. Append-only. Newest first.
This file was created on 2026-11-19. No earlier entry exists.

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
