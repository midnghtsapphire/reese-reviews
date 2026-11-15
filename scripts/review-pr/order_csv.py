"""Parse an Amazon order-history CSV or a Vine queue CSV.

Audrey can download her order history from Amazon herself and drop the
file here. Items with a $0.00 total (or Vine wording) are review-queue
products. Paid rows are excluded unless include_paid is true.

This module never contacts Amazon.
"""

from __future__ import annotations

import csv
import io
import re
from pathlib import Path
from typing import Any

from vine_source import parse_vine_csv_text
from zero_cost import has_vine_wording, is_zero_amount, is_zero_cost

PRICE_HEADERS = {
    "itemtotal",
    "itemsubtotal",
    "purchasericeperunit",
    "purchasepriceperunit",
    "totalcharged",
    "total",
    "grandtotal",
    "itemprice",
    "price",
    "cost",
}
DATE_HEADERS = {"orderdate", "date", "ordered", "shipdate", "deliverydate"}
NAME_HEADERS = {"title", "productname", "product", "name", "item"}
ASIN_HEADERS = {"asin", "id"}


def _norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (value or "").strip().lower())


def _pick(obj: dict[str, str], keys: set[str]) -> str:
    for key in keys:
        if obj.get(key):
            return obj[key]
    return ""


def looks_like_order_history(headers: list[str]) -> bool:
    normalized = {_norm(header) for header in headers}
    return bool(normalized & PRICE_HEADERS) and bool(normalized & (NAME_HEADERS | ASIN_HEADERS))


def parse_order_csv_text(csv_text: str, include_paid: bool = False) -> dict[str, Any]:
    """Return {products, excluded_paid, unresolved} from an order or Vine CSV."""
    text = (csv_text or "").lstrip("\ufeff").strip()
    if not text:
        return {"products": [], "excluded_paid": 0, "unresolved": []}
    reader = csv.reader(io.StringIO(text))
    try:
        header_row = next(reader)
    except StopIteration:
        return {"products": [], "excluded_paid": 0, "unresolved": []}
    headers = [_norm(header) for header in header_row]
    if not looks_like_order_history(header_row):
        # Vine queue exports have names and ASINs but usually no price.
        vine_items = parse_vine_csv_text(csv_text)
        for item in vine_items:
            item["zeroCost"] = True
            item["source"] = item.get("source") or "vine"
        return {"products": vine_items, "excluded_paid": 0, "unresolved": []}

    products: list[dict[str, Any]] = []
    excluded_paid = 0
    for raw in reader:
        if not raw or all(not str(cell).strip() for cell in raw):
            continue
        obj: dict[str, str] = {}
        for index, header in enumerate(headers):
            if header:
                obj[header] = raw[index].strip() if index < len(raw) else ""
        name = _pick(obj, NAME_HEADERS)
        asin = _pick(obj, ASIN_HEADERS).upper()
        price_bits = [obj.get(key, "") for key in PRICE_HEADERS if obj.get(key)]
        row_text = " ".join([name, asin, *price_bits])
        zero = any(is_zero_amount(bit) for bit in price_bits) or is_zero_cost(row_text) or has_vine_wording(row_text)
        if not zero and not include_paid:
            if any(bit.strip() for bit in price_bits):
                excluded_paid += 1
            continue
        if not name and not asin:
            continue
        products.append(
            {
                "name": name or "Untitled",
                "asin": asin,
                "amazonUrl": f"https://www.amazon.com/dp/{asin}" if asin else "",
                "category": "products",
                "title": "",
                "body": "",
                "rating": None,
                "textOnly": False,
                "reviewStatus": "To Review",
                "status": "draft",
                "source": "orders-csv",
                "zeroCost": zero,
                "orderDate": _pick(obj, DATE_HEADERS)[:10],
                "needsReview": True,
            }
        )
    return {"products": products, "excluded_paid": excluded_paid, "unresolved": []}


def load_order_csv(path: Path, include_paid: bool = False) -> dict[str, Any]:
    return parse_order_csv_text(path.read_text(encoding="utf-8"), include_paid=include_paid)
