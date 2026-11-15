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

The default snapshot is `fixtures/sample-inventory.json`. It has product names, ASINs, and review drafts only — no prices, order numbers, addresses, or affiliate tags.

To refresh the snapshot from Notion, export a sanitized JSON yourself (or use a Notion token on your computer). Do not commit private notes.

Completeness check (used by CircleCI on review PRs):

```bash
python3 scripts/review-pr/check_completeness.py --root .
```

Each PR should use `.github/PULL_REQUEST_TEMPLATE/review.md` and stay a draft until Proofy and Audrey approve it. Nothing in this script posts to Amazon.
