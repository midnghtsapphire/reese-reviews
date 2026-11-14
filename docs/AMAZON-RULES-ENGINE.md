# Amazon rules engine

Optional local check for one review or KDP file at a time. It does not post anything.

Rules are kept in the Notion database [Amazon Rules](https://app.notion.com/p/4182aa319908811288d7cc88a4304b8b). That database is the source of truth. The engine reads a CSV/JSON export of it under `tools/amazon-rules/exports/`. Refresh the export with:

```bash
python tools/amazon-rules/scripts/export_amazon_rules.py
python tools/amazon-rules/scripts/export_amazon_rules.py --from-csv path/to/notion-export.csv
```

```bash
cd tools/amazon-rules
PYTHONPATH=. python -m amazon_rules check path/to/review.yml --pack reviews
```
