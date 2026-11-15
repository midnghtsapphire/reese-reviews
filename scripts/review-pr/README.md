# Review PR generator

Builds one `reviews/<slug>/` folder per product from a sanitized inventory snapshot. You can also open one draft pull request per product.

```bash
# Write folders only (safe, default)
python3 scripts/review-pr/generate.py --root .

# After you have reviewed the folders, open draft PRs
python3 scripts/review-pr/generate.py --root . --open-pr

# Optional: copy already-processed photos from tools/review-image
python3 scripts/review-pr/generate.py --root . --images-dir /path/to/outputs
```

The default snapshot is `fixtures/product-queue.json` when it exists, then `notion-inventory.json`, then `sample-inventory.json`. It has product names, ASINs, and review drafts only — no prices, order numbers, addresses, or affiliate tags.

To refresh the snapshot from Notion, export a sanitized JSON yourself (or use a Notion token on your computer). Do not commit private notes.

Completeness check (used by CircleCI on review PRs):

```bash
python3 scripts/review-pr/check_completeness.py --root .
```

Each PR should use `.github/PULL_REQUEST_TEMPLATE/review.md` and stay a draft until Proofy and Audrey approve it. Nothing in this script posts to Amazon.

## Import every product that needs a review

Gmail is the primary source (read-only). A `$0.00` total or Vine wording is the queue rule; paid orders are skipped unless you pass `--include-paid`. Emails for the same order number are joined so a later review-request, address-update, delay, or delivery-estimate message can supply the product name, ASIN, and photo. Cancelled items are identified and kept out of the queue. Notion is the secondary source. An order-history CSV you download yourself is also accepted. The importer does not visit Amazon.

```bash
python3 scripts/review-pr/import_products.py --root . \
  --from-json scripts/review-pr/fixtures/notion-inventory.json \
  --from-json scripts/review-pr/fixtures/sample-inventory.json \
  --from-gmail-json scripts/review-pr/fixtures/gmail-zero-cost-snapshot.json \
  --archive-demo --write-reviews \
  --snapshot scripts/review-pr/fixtures/product-queue.json

python3 scripts/review-pr/import_products.py --root . --from-gmail --write-reviews
python3 scripts/review-pr/import_products.py --root . --from-notion --write-reviews
python3 scripts/review-pr/import_products.py --root . --from-orders path/to/amazon-order-history.csv
```

`--from-gmail` uses `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` (pending). `--from-notion` uses `NOTION_TOKEN` (also pending). `--from-json`, `--from-gmail-json`, `--from-mbox`, `--from-csv`, and `--from-orders` work offline. The importer never invents review text and does not write prices, order numbers, addresses, or affiliate tags into the snapshot.

Existing `reviews/<slug>/review.md` files are kept as-is unless you pass `--overwrite`. `--archive-demo` moves the demo placeholder photo into `reviews/_archived/` (it is not deleted).

CircleCI scheduled setup: `docs/REVIEW-DESK.md` (`run_product_import=true`).
