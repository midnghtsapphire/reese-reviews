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

## How products get into the desk

Review Desk should grab **every product that needs a review**, not have them added by hand.

**$0 cost is the queue rule.** Audrey's review products are Amazon Vine items with a `$0.00` (or `0.0 USD` / `0 USD`) order or item total. The importer treats a $0.00 total, or Vine wording, as "needs a review." Ordinary paid orders are skipped by default. Pass `--include-paid` only when you also want those paid orders on the desk.

**Gmail is the primary source.** Amazon shipped, delivered, and auto-confirm emails are read only (never sent, labeled, archived, or modified). As of November 2026, those templates include the $0.00 total and a category such as "Outerwear," but not the product name, ASIN, or product photo. The importer does **not** visit, fetch, or scrape Amazon product or order pages. Images already linked inside an email body may be used.

**Notion is the secondary source** — the Amazon Resale Inventory (Reviewed NIB) database — and is where identified product names, ASINs, and existing review drafts live. Existing review text is kept; nothing is invented.

**Order history CSV** fills the gap: download the file from Amazon yourself and pass `--from-orders`. $0.00 / Vine rows are queued; paid rows are omitted unless `--include-paid` is set.

```bash
# From the committed snapshots (no live tokens required)
python3 scripts/review-pr/import_products.py --root . \
  --from-json scripts/review-pr/fixtures/notion-inventory.json \
  --from-json scripts/review-pr/fixtures/sample-inventory.json \
  --from-gmail-json scripts/review-pr/fixtures/gmail-zero-cost-snapshot.json \
  --images-dir /path/to/final-review-photos \
  --archive-demo --write-reviews \
  --snapshot scripts/review-pr/fixtures/product-queue.json

# Live Gmail (needs GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN — pending)
python3 scripts/review-pr/import_products.py --root . --from-gmail --write-reviews

# From Notion (needs NOTION_TOKEN — pending; the Secret agent has none yet)
python3 scripts/review-pr/import_products.py --root . --from-notion --write-reviews

# Order history or Vine CSV that you downloaded yourself
python3 scripts/review-pr/import_products.py --root . \
  --from-json scripts/review-pr/fixtures/product-queue.json \
  --from-orders path/to/amazon-order-history.csv \
  --write-reviews
```

The importer writes a sanitized snapshot (`scripts/review-pr/fixtures/product-queue.json`) and one `reviews/<slug>/` folder per product. Only product name, ASIN, order date, image URL, and review drafts are stored. Empty title, rating, review, or photo fields stay empty so the desk checklist can flag them. It does not invent review text. Existing `review.md` files are left as-is unless you pass `--overwrite`. `--archive-demo` moves the demo placeholder photo into `reviews/_archived/` (it is not deleted).

The desk lists every local `reviews/<slug>/` folder when no open `review/*` pull requests are available, and lists those PRs when they exist.

### Vine and order CSV sources

A Vine order/queue CSV parser is wired, using the same column mapping as `src/stores/vineReviewStore.ts` (`productName` / `asin` / `category` / `orderDate` / `reviewDeadline` / `etv`). An Amazon order-history CSV (`Title`, `ASIN`, `Item Total`, `Order Date`, and similar headers) is also accepted. Order numbers, addresses, and paid prices are not written into review files. No live Vine or order CSV export lives in this repo; put raw files in `scripts/review-pr/fixtures/private/` (gitignored). VineFlow is a scaffold only (no parser). The `vines` repo is spec only. Several inventory rows were already entered in Notion from a Vine Awaiting Review screenshot.

## CircleCI scheduled import

The import does not run on push and must not be scheduled from the bot box. GitHub Actions is billing-locked, so the runner lives on CircleCI. Scheduled pipelines are created in the CircleCI UI or API, not by committing a crontab.

1. Create (or reuse) a CircleCI [context](https://app.circleci.com/settings/organization) named `image-process` or `product-import`.
2. Add `NOTION_TOKEN` — a Notion internal integration token with access to **Amazon Resale Inventory (Reviewed NIB)** (`baca0fdb-dde7-439d-93c1-cb964f0ff9bc`). **This token is pending.** The Secret agent does not have one yet. Until it is added, the job uses the committed JSON snapshot.
3. Add Gmail OAuth credentials, also pending: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` (or `GMAIL_ACCESS_TOKEN`). The job is read-only. Until they are added, the job uses `scripts/review-pr/fixtures/gmail-zero-cost-snapshot.json`.
4. Add a GitHub token the job can use to open or update the draft import PR (`IMAGE_PROCESS_GITHUB_TOKEN`, `GITHUB_TOKEN`, or `GH_TOKEN`). Do not commit tokens.
5. Open the reese-reviews project in CircleCI → Project Settings → Triggers → Add Trigger → Schedule.
6. Branch: `main`. Interval: daily (or the closest the plan allows).
7. Pipeline parameter: `run_product_import` = `true` (boolean).
8. Attach the context from step 1.

Until this schedule (or a manual trigger) exists, new Gmail, Notion, or order-CSV rows will not appear on their own. You can still run the importer on your computer. The scheduled job does not fail when tokens are still pending; it imports from the committed snapshots instead.

To run it once without waiting:

```bash
# CircleCI personal or project token, not the GitHub or Notion token
curl -X POST https://circleci.com/api/v2/project/github/midnghtsapphire/reese-reviews/pipeline \
  -H "Circle-Token: $CIRCLECI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"branch":"main","parameters":{"run_product_import":true}}'
```

The job writes the snapshot, updates `reviews/<slug>/` folders, and opens or updates a draft PR on `import/review-desk-inventory` (or the current feature branch when not on main). It does not force-push or delete branches. Per-product review PRs are still opened with `python3 scripts/review-pr/generate.py --root . --open-pr`.
