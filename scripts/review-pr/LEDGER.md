# Ledger — review-pr / Review Desk

| Date | Change | Notes |
| --- | --- | --- |
| 2026-11-14 | Review Desk, review PRs, poster agent | PR #81. Completeness check, draft review PRs, site poster. Amazon filler stays on Audrey's computer. |
| 2026-11-14 | Product importer | `import_products.py` loads Gmail (read-only, $0.00 / Vine queue rule), Notion, JSON snapshots, and order-history / Vine CSVs. Paid orders excluded by default (`--include-paid` to include). No Amazon page access. CircleCI parameter `run_product_import`. Demo placeholder archived, not deleted. |
