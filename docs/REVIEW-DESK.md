# Review Desk

Walk through each product review one at a time, edit anything, replace generated photos, and start a one-field-at-a-time form fill. A GitHub-native agent in this repository publishes approved reviews to the Reese Reviews site. It is not a Grok bot. Nothing is posted to Amazon until you press Submit on your own computer.

## How you use it

1. **Open Review Desk locally**
   ```bash
   npm ci
   npm run dev
   ```
   Then open [http://localhost:8080/review-desk](http://localhost:8080/review-desk).

2. **Create a draft PR for each product** (when you are ready)
   ```bash
   python3 scripts/review-pr/generate.py --root .
   python3 scripts/review-pr/generate.py --root . --open-pr
   ```
   Each PR is a `review/<asin-or-slug>` branch with `reviews/<slug>/review.md` and `reviews/<slug>/images/`. The title, review, rating, and any generated photos are already filled in.

3. **Edit in Review Desk or on GitHub.** You can change any field. To replace a generated photo, use **Replace with my photo** (and save, if you pasted a GitHub token in this tab) or **Upload on GitHub**.

4. **Wait for the green check.** CircleCI runs `scripts/review-pr/check_completeness.py` and fails the PR if the rating, title, review, or photo (unless it is text-only) is missing.

5. **Proofy approves, you say yes**, add the `approved-to-post` label, and merge the PR with a normal merge (do not delete the branch).

6. **The review-poster agent publishes to the site.** CircleCI on `main` runs `agents/review-poster/publish_to_site.py` and comments on the PR as **Auky:** … — Auky.

7. **Amazon, on your computer only.** All of the data is already in the review folder. You press one Start button — or run the command below. It fills the form in this order: title, a short pause, images, a short pause, the written review. Then it stops so you can press Submit.
   ```bash
   python3 agents/review-poster/amazon_poster.py --slug 2-pocket-toploader-binder --allow-self-hosted --delay 3-6 --user-data-dir "$HOME/.config/google-chrome"
   ```
   The pause defaults to a random 3–6 seconds (`--delay 3-6`). Star rating is set during the title step if the form needs it. Amazon passwords are never stored in the repo or in CircleCI.

## What you need to set up

- **CircleCI** already has a `reese-reviews` project. No GitHub Actions changes. The usual billing-lock reds on Actions are noise. The merge gate is CircleCI plus GitGuardian.
- **Optional `GITHUB_TOKEN`** as a CircleCI project environment variable, so the poster can comment on the PR. The Review Desk token, if you use one, is typed into the page and stays in that browser tab.
- **Optional `NOTION_TOKEN`** only if you want the generator to read a live inventory later. The sample snapshot in `scripts/review-pr/fixtures/sample-inventory.json` has names, ASINs, and review drafts only.
- **Playwright on your computer** for the Amazon filler: `pip install playwright && playwright install chromium`. Use your already-logged-in browser profile. Do not run this on CircleCI cloud.
- **Label `approved-to-post`** on the repo so you can tag a review PR before merge.

## Files

- `src/pages/ReviewDeskPage.tsx` — the desk
- `scripts/review-pr/` — generator and completeness check
- `agents/review-poster/` — GitHub-native poster agent
- `.github/PULL_REQUEST_TEMPLATE/review.md` — PR checklist
- `reviews/<slug>/` — one folder per product
