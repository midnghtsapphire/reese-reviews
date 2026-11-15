"""Amazon Vine order/queue CSV source for the Review Desk importer.

This ports the column mapping from `src/stores/vineReviewStore.ts`
(`parseCSVText` / `importFromCSV`). No Vine CSV export lives in this
repo today. VineFlow (`VineFlow/`) is a scaffold only and has no parser.
The `vines` repo is spec/provenance only. Several inventory rows were
already entered in Notion from a Vine Awaiting Review screenshot.

Order dates, deadlines, and ETV are read for matching only and are not
written into review.md or the sanitized snapshot.
"""

from __future__ import annotations

import csv
import io
import re
from pathlib import Path
from typing import Any


def _norm_header(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.strip().lower())


def parse_vine_csv_text(csv_text: str) -> list[dict[str, Any]]:
    """Parse a Vine order/queue CSV into product dicts.

    Accepted headers (case-insensitive, punctuation ignored):
    productName / product / name / item, asin / id, category / type,
    orderDate / date / ordered, reviewDeadline / deadline / dueDate / due,
    etv / value / estimatedTaxValue.
    """
    text = csv_text.strip()
    if not text:
        return []
    reader = csv.reader(io.StringIO(text))
    try:
        header_row = next(reader)
    except StopIteration:
        return []
    headers = [_norm_header(h) for h in header_row]
    if not headers:
        return []

    def pick(obj: dict[str, str], *keys: str) -> str:
        for key in keys:
            if obj.get(key):
                return obj[key]
        return ""

    products: list[dict[str, Any]] = []
    for raw in reader:
        if not raw or all(not cell.strip() for cell in raw):
            continue
        obj: dict[str, str] = {}
        for index, header in enumerate(headers):
            if not header:
                continue
            obj[header] = raw[index].strip() if index < len(raw) else ""
        name = pick(obj, "productname", "product", "name", "item")
        if not name:
            continue
        asin = pick(obj, "asin", "id")
        products.append(
            {
                "name": name,
                "asin": asin,
                "amazonUrl": f"https://www.amazon.com/dp/{asin}" if asin else "",
                "category": "products",
                "title": "",
                "body": "",
                "rating": None,
                "textOnly": False,
                "reviewStatus": "To Review",
                "status": "draft",
                "source": "vine",
                "needsReview": True,
            }
        )
    return products


def load_vine_csv(path: Path) -> list[dict[str, Any]]:
    return parse_vine_csv_text(path.read_text(encoding="utf-8"))
