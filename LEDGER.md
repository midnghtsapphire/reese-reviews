# LEDGER: reese-reviews

Work log per revvel-standards `WRITE_AS_YOU_GO_STANDARD.md`. Append-only. Newest first.
This file was created on 2026-11-19. No earlier entry exists.

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
