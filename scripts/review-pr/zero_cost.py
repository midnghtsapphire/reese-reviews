"""Detect $0.00 / Vine items that belong on the Review Desk queue.

Audrey's review products are Amazon Vine items with a $0.00 order or item
total. Paid orders are excluded from the queue by default.
"""

from __future__ import annotations

import re
from typing import Any

VINE_RE = re.compile(
    r"\b(?:amazon\s+vine|vine\s+voice|vine\s+program|vine\s+item|vine\s+order|etv)\b",
    re.I,
)

# Explicit zero totals used in Amazon emails and order CSVs.
ZERO_TOTAL_RE = re.compile(
    r"""
    (?:
        (?:grand\s*)?total
        |item\s*total
        |item\s*subtotal
        |purchase\s*price(?:\s*per\s*unit)?
        |amount\s*charged
    )
    [\s:]*
    (?:USD\s*)?
    \$?\s*0(?:\.0{1,2})?
    (?:\s*USD)?
    |
    \$?\s*0(?:\.0{1,2})?\s*USD
    |
    \$0(?:\.00)?
    """,
    re.I | re.X,
)

MONEY_RE = re.compile(r"\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\b|(?<![\d.])(\d+(?:\.\d{1,2})?)\s*USD\b", re.I)


def has_vine_wording(text: str | None) -> bool:
    return bool(text and VINE_RE.search(text))


def is_zero_amount(value: Any) -> bool:
    """True when a price cell or string is exactly zero."""
    if value is None or value == "":
        return False
    if isinstance(value, (int, float)):
        return float(value) == 0.0
    text = str(value).strip()
    if not text:
        return False
    if ZERO_TOTAL_RE.search(text):
        return True
    cleaned = text.replace(",", "").replace("$", "").replace("USD", "").strip()
    try:
        return float(cleaned) == 0.0
    except ValueError:
        return False


def is_zero_cost(*parts: Any) -> bool:
    """True if any part shows a $0.00 / 0 USD total or Vine wording.

    A clearly non-zero 'Grand Total' / 'Item Total' wins over a stray $0
    elsewhere in the same text (for example a $0 shipping line).
    """
    text = "\n".join(str(part) for part in parts if part is not None and str(part).strip())
    if not text:
        return False
    # Prefer an explicit grand/item total when present.
    explicit = re.search(
        r"(?:grand\s*)?total[\s:]*\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:USD)?",
        text,
        re.I,
    )
    if explicit:
        try:
            if float(explicit.group(1)) == 0.0:
                return True
            return False
        except ValueError:
            pass
    if ZERO_TOTAL_RE.search(text):
        return True
    if has_vine_wording(text):
        return True
    return False


def is_paid_cost(*parts: Any) -> bool:
    """True when a total is present and is greater than zero."""
    text = "\n".join(str(part) for part in parts if part is not None and str(part).strip())
    if not text:
        return False
    explicit = re.search(
        r"(?:grand\s*)?total[\s:]*\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:USD)?",
        text,
        re.I,
    )
    if explicit:
        try:
            return float(explicit.group(1)) > 0
        except ValueError:
            return False
    amounts = []
    for match in MONEY_RE.finditer(text):
        raw = (match.group(1) or match.group(2) or "").replace(",", "")
        try:
            amounts.append(float(raw))
        except ValueError:
            continue
    return any(amount > 0 for amount in amounts) and not is_zero_cost(text)
