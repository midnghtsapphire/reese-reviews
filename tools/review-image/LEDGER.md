# Ledger — review-image

| Date | Change | Notes |
| --- | --- | --- |
| 2026-11-14 | Added `tools/review-image` CLI | Implements the Notion item-page image process (crop, rembg / OpenCV background removal, light filter, original pixel size). Credits VineFlow’s rembg design; VineFlow’s `cli/image.py` was only a stub and was not modified. No live Notion writes from tests. No tracking or paid APIs required. |
