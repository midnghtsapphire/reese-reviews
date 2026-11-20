# LEDGER: reese-reviews

Work log per revvel-standards `WRITE_AS_YOU_GO_STANDARD.md`. Append-only. Newest first.
This file was created on 2026-11-19. No earlier entry exists.

## 2026-11-19 18:05 America/Denver — Git-Master — merge daily/2026-11-19 again into the toolkit branch (PR #98)

- **Actor:** Git-Master
- **Requested by:** Audrey Evans (t133u, 19 Nov 2026): "ya fix it all and merge it".
- **Role:** executed
- **Files:** `LEDGER.md` (conflicts resolved by keeping every entry from both sides); `CHANGELOG.md` (merged cleanly). The rest comes from the base: PR #100 (repaired `.circleci/config.yml`, docker-build job).
- **What was done:** Merged the base `daily/2026-11-19` into `git-master/toolkit-ci-18494` again with a normal merge. `.circleci/toolkit.yml` is unchanged and still its own file. No force-push, nothing deleted.
- **Commits / PRs:** PR #98.

## 2026-11-19 17:10 America/Denver — Git-Master — docker-build job and narrow Trivy ignore (issue #99 follow-up)

- **Actor:** Git-Master
- **Requested by:** TriageChief (prove the Docker build in CI; the ignore for the fake test JWT) and Audrey Evans in her own chat, t133u: "ya fix it all and merge it". The Audrey quote is `RELAYED` by the dispatcher.
- **Role:** executed
- **Files:** `.circleci/config.yml` (one job and one workflow appended); `.trivyignore.yaml` (new); `trivy.yaml` (new); `CHANGELOG.md`; `LEDGER.md`.
- **What was done:** `docker-build` uses `setup_remote_docker` to build `Dockerfile` and `Dockerfile.api`, checks `id -u` is not 0 in both images and runs `nginx -t` in the web image. It pushes and deploys nothing. The ignore file names rule `jwt-token` and path `vitest.config.ts` only; `trivy.yaml` makes Trivy read it. A local Trivy v0.76.2 run showed the finding suppressed and no other finding hidden.
- **Found by the new job:** the first `docker-build` run built both images (web uid 101, api uid 100) but `nginx -t` failed: the image's `nginx.conf` has `pid /run/nginx.pid;`, so my `sed` for `/var/run/nginx.pid` did not apply. Fixed in a new commit: the `sed` matches any pid path, the old line is kept as a comment, and the build fails if the edit does not apply.
- **Decisions:** A plain `.trivyignore` cannot be scoped to a file, so the YAML form is used. The test JWT was not changed. No CVE or Dockerfile finding was ignored.
- **Sources:** MEASURED: `circleci config validate` passes (10 jobs, 6 workflows). The docker-build result is on the PR's CircleCI run.
- **Commits / PRs:** PR #100.
- **Open / handoff:** Base `daily/2026-11-19` was merged into this branch after #102 (the CVE fixes) landed. `LEDGER.md` conflicts with #102's were resolved by keeping every entry.

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

## 2026-11-19 16:50 America/Denver — Git-Master — run both containers as non-root (Trivy DS-0002, issue #99 follow-up)

- **Actor:** Git-Master
- **Requested by:** TriageChief, 19 Nov 2026 (fix DS-0002 rather than ignore it). `RELAYED`: not Audrey's own words.
- **Role:** executed
- **Files:** `Dockerfile`; `Dockerfile.api`; `CHANGELOG.md`; `LEDGER.md`.
- **What was done:** `Dockerfile` final stage (nginx:alpine): chown `/var/cache/nginx` to the image's `nginx` user (uid 101), move the pid file from `/var/run/nginx.pid` to `/tmp/nginx.pid` and comment out `user nginx;` in `/etc/nginx/nginx.conf` with one `sed`, then `USER nginx` before `CMD`. `Dockerfile.api` (python:3.12-slim): `addgroup --system app && adduser --system --ingroup app app`, chown `/app` to it, `USER app` before `CMD`. No line was deleted; the new lines are additions.
- **Decisions:** Runtime writes were found by reading the code. `app/stages/s7_assembly.py` uses `tempfile.TemporaryDirectory()` and `app/utils/ffmpeg_helpers.py` writes beside its output path, which comes from that temp dir, so `/tmp` is enough. `docker-compose.yml` bind-mounts `./app` for development; I found no code that writes there. Ports 8080 and 8000 are above 1024. `trivy-fs` and all 9 CircleCI jobs are unchanged.
- **Sources:** MEASURED: `trivy config` v0.76.2 (the version CI uses) reports 0 misconfigurations for both Dockerfiles. NOT TESTED: neither image was built or run, because the box has no Docker. The `sed` was tested only on a sample of the stock nginx.conf lines.
- **Commits / PRs:** PR #100.
- **Open / handoff:** TriageChief reviews. Anyone with Docker should run `docker build` for both files, and `docker run` the web image to confirm nginx starts as `nginx`.

## 2026-11-19 18:00 America/Denver — Git-Master — repair duplicated .circleci/config.yml (issue #99)

- **Actor:** Git-Master
- **Requested by:** TriageChief, 19 Nov 2026, for WR midnghtsapphire/revvel-standards#18494. `RELAYED`: not Audrey's own words.
- **Role:** executed
- **Files:** `.circleci/config.yml` (merged into one config; nothing removed except by commenting out three duplicate key lines); `CHANGELOG.md`; `LEDGER.md` (new).
- **What was done:** The file was the 71-line config from merge parent `51680d83` followed by the 221-line config from merge parent `21709bb8`, joined by merge `39cf575a`. It is now one config: parameters `run_review_image`, `run_image_process_queue`, `run_product_import`; jobs `lint-typecheck-test-build`, `trivy-fs`, `review-image-test`, `image-process-queue`, `review-completeness`, `review-desk-frontend`, `review-poster-tests`, `review-poster-site`, `product-import`; workflows `ci`, `review-image-tests`, `image-process-queue`, `product-import`, `review-poster-on-main`. The second half's `version: 2.1`, `jobs:` and `workflows:` lines are kept as YAML comments.
- **Decisions:** No renames: there were no job or workflow name collisions. The `ci` workflow has no `when:` guard, as before, so it runs with the review-image workflows on non-main branches. That behavior was already written into the two halves and was not changed.
- **Sources:** MEASURED: `circleci config validate` (CLI 1.18.0) fails on main's file ("Unable to parse YAML") and passes on the repaired file. Both parents of `39cf575a` validate on their own. A script parsed the two original halves separately and checked that the merged jobs, workflows and parameters equal their union, and that every original line is still in the file except the three duplicate key lines, now comments.
- **Commits / PRs:** branch `git-master/repair-circleci-config-99`, draft PR into `daily/2026-11-19`.
- **Open / handoff:** CI-config change: needs Audrey's yes (revvel-standards AGENTS.md B5). Once this lands, the CircleCI project must still be followed for any of it to run. TriageChief reviews. Not marked ready. The branch `git-master/toolkit-ci-18494` (PR #98) also creates `LEDGER.md`; whichever merges second needs a trivial conflict fix (keep both entries).

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
