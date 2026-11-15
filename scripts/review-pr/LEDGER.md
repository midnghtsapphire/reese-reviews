# Ledger — review-pr / Review Desk

| Date | Change | Notes |
| --- | --- | --- |
| 2026-11-14 | Gmail-identified Vine items | One import PR writes `reviews/<slug>/` for $0 non-cancelled products identified from Gmail. `order_date` and `priority: reviews-to-do` (review-request / seller-feedback) are stored; review text stays empty; no email bodies or order numbers. |
| 2026-11-14 | Review Desk, review PRs, poster agent | PR #81. Completeness check, draft review PRs, site poster. Amazon filler stays on Audrey's computer. |
| 2026-11-14 | Gmail order-number join | `gmail_source.join_order_emails` fills product name, ASIN, and email-embedded images by matching review-request, address-update, delay, and delivery-estimate emails to the $0 confirmation. Cancellations are excluded from the queue. Sanitized fixtures only; no personal mail bodies. |
| 2026-11-14 | Product importer | `import_products.py` loads Gmail (read-only, $0.00 / Vine queue rule), Notion, JSON snapshots, and order-history / Vine CSVs. Paid orders excluded by default (`--include-paid` to include). No Amazon page access. CircleCI parameter `run_product_import`. Demo placeholder archived, not deleted. |
