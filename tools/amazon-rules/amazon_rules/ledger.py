"""Local CSV ledger for one-review-per-ASIN checks.

This is a local file only. The engine never posts to Amazon.
"""

from __future__ import annotations

import csv
from pathlib import Path


def load_ledger_asins(path: Path) -> dict[str, dict[str, str]]:
    """Return a map of uppercase ASIN -> row for already-recorded reviews."""
    if not path.exists():
        return {}
    records: dict[str, dict[str, str]] = {}
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            asin = (row.get("asin") or "").strip().upper()
            if not asin or asin.startswith("#"):
                continue
            example = (row.get("example") or "").strip().lower()
            records[asin] = {
                "asin": asin,
                "product": (row.get("product") or "").strip(),
                "posted_date": (row.get("posted_date") or "").strip(),
                "wr_issue": (row.get("wr_issue") or "").strip(),
                "notes": (row.get("notes") or "").strip(),
                "example": example,
            }
    return records
