# Amazon rules engine

Optional local check for one review or KDP file at a time. It does not post anything.

Rules: [Amazon Rules](https://app.notion.com/p/4182aa319908811288d7cc88a4304b8b). That Notion database is the source of truth. This tool reads a CSV/JSON export of it from `exports/`.

```bash
python scripts/export_amazon_rules.py
PYTHONPATH=. python -m amazon_rules check path/to/review.yml --pack reviews
```

Sample files in `examples/` are labeled **EXAMPLE ONLY** and use fake ASINs such as `B0TEST0001`.
