# LEDGER: reese-reviews

Work log per revvel-standards `WRITE_AS_YOU_GO_STANDARD.md`. Append-only. Newest first.
This file was created on 2026-11-19. No earlier entry exists.

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
