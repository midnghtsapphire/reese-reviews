# Ledger — review-image

| Date | Change | Notes |
| --- | --- | --- |
| 2026-11-14 | Added `tools/review-image` CLI | Implements the Notion item-page image process (crop, rembg / OpenCV background removal, light filter, original pixel size). Credits VineFlow’s rembg design; VineFlow’s `cli/image.py` was only a stub and was not modified. No live Notion writes from tests. No tracking or paid APIs required. |
| 2026-11-14 | General reusable process + Product Image Process WR | Added `--from-url` / `--asin` (copy listing or direct image), `--remove-text`, `--preset` (`review`, `social`, `cutout`, `all`), pluggable Notion uploader (token path + documented connector-run path). Selectable GitHub issue form `Product Image Process (WR)`. CircleCI queue for `image-process` issues (schedule documented in SETUP.md, not invented). n8n / Zapier entry in the README. Linked from Stage 3 of `amazon-review-wr.yml` (edit only). Tests stay offline. |
