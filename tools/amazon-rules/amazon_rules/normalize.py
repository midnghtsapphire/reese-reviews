"""Normalize WR-style review and KDP fields into a consistent dict."""

from __future__ import annotations

import re
from typing import Any


USED_YES = {
    "yes",
    "true",
    "used",
    "yes — she used it, and the draft only describes that experience",
    "yes - she used it, and the draft only describes that experience",
}

USED_NO = {
    "no",
    "false",
    "not yet",
    "unused",
    "not yet — hold this wr until she has used it",
    "not yet - hold this wr until she has used it",
}

USED_UNSURE = {
    "unsure",
    "unsure — stop and confirm with audrey before proofing",
    "unsure - stop and confirm with audrey before proofing",
}

SOURCE_VINE = {
    "vine",
    "amazon vine",
    "amazon vine (free product through the official vine program)",
}

SOURCE_PURCHASE = {
    "purchase",
    "purchased",
    "purchased on amazon at a regular or generally available price",
}

SOURCE_OTHER = {
    "other",
    "other allowed path (explain in the draft notes; stop if it was free or discounted in exchange for a review)",
}

PHOTO_OWNER_OK = {
    "audrey",
    "yes",
    "own",
    "hers",
    "her own",
    "permission",
    "audrey's own",
    "audreys own",
}

AI_TOOLS_HOUSE = {
    "grok imagine",
    "grok image",
}


def _collapse(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value).strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _lower(value: Any) -> str:
    return _collapse(value).lower()


def normalize_used(value: Any) -> str:
    text = _lower(value)
    if text in USED_YES:
        return "yes"
    if text in USED_NO:
        return "no"
    if text in USED_UNSURE:
        return "unsure"
    return text or ""


def normalize_source(value: Any) -> str:
    text = _lower(value)
    if text in SOURCE_VINE:
        return "vine"
    if text in SOURCE_PURCHASE:
        return "purchase"
    if text in SOURCE_OTHER:
        return "other"
    return text or ""


def normalize_photo_owner(value: Any) -> str:
    text = _lower(value)
    if text in PHOTO_OWNER_OK:
        return "ok"
    return text or ""


def _as_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [_collapse(item) for item in value if _collapse(item)]
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return []
        if "\n" in text:
            return [_collapse(part) for part in text.splitlines() if _collapse(part)]
        return [_collapse(text)]
    return [_collapse(value)]


def _stars(value: Any) -> Any:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    text = _collapse(value)
    match = re.search(r"\b([1-5])\b", text)
    if match:
        return int(match.group(1))
    return value


def document_text(data: dict[str, Any], fields: list[str] | None = None) -> str:
    """Join selected fields into one searchable string."""
    keys = fields or list(data.keys())
    chunks: list[str] = []
    for key in keys:
        value = data.get(key)
        if value is None or value == "":
            continue
        if isinstance(value, list):
            chunks.extend(_as_list(value))
        else:
            chunks.append(_collapse(value))
    return "\n".join(chunks)


def normalize_review(raw: dict[str, Any]) -> dict[str, Any]:
    data = dict(raw)
    data["product"] = _collapse(raw.get("product") or raw.get("product_name"))
    data["asin"] = _collapse(raw.get("asin")).upper()
    data["amazon_url"] = _collapse(raw.get("amazon_url"))
    data["title"] = _collapse(raw.get("title"))
    data["body"] = raw.get("body") if isinstance(raw.get("body"), str) else _collapse(raw.get("body"))
    if data["body"] is None:
        data["body"] = ""
    data["stars"] = _stars(raw.get("stars"))
    data["used_raw"] = _collapse(raw.get("used") or raw.get("used_product"))
    data["used"] = normalize_used(raw.get("used") or raw.get("used_product"))
    data["review_source_raw"] = _collapse(raw.get("review_source") or raw.get("source"))
    data["review_source"] = normalize_source(raw.get("review_source") or raw.get("source"))
    photos = raw.get("photos") or raw.get("photo_list") or raw.get("media") or []
    data["photos"] = _as_list(photos)
    data["photo_owner_raw"] = _collapse(raw.get("photo_owner") or raw.get("photo_attribution"))
    data["photo_owner"] = normalize_photo_owner(
        raw.get("photo_owner") or raw.get("photo_attribution")
    )
    data["delivered"] = _lower(raw.get("delivered"))
    return data


def _boolish(value: Any) -> Any:
    if isinstance(value, bool):
        return value
    text = _lower(value)
    if text in {"yes", "true", "y"}:
        return True
    if text in {"no", "false", "n", "none"}:
        return False
    return value


def normalize_book(raw: dict[str, Any]) -> dict[str, Any]:
    data = dict(raw)
    data["title"] = _collapse(raw.get("title") or raw.get("book_title"))
    data["subtitle"] = _collapse(raw.get("subtitle"))
    data["author"] = _collapse(raw.get("author") or raw.get("author_name"))
    data["existing_6x9"] = bool(_boolish(raw.get("existing_6x9")) is True)
    data["paperback_trim"] = _collapse(raw.get("paperback_trim") or raw.get("pb_trim")).replace(
        " ", ""
    ).replace("×", "x").replace("X", "x").lower()
    data["hardcover_trim"] = _collapse(raw.get("hardcover_trim") or raw.get("hc_trim")).replace(
        " ", ""
    ).replace("×", "x").replace("X", "x").lower()
    data["formats"] = [item.lower() for item in _as_list(raw.get("formats"))]
    data["cover_art_has_words"] = _boolish(raw.get("cover_art_has_words"))
    data["ai_generated"] = _boolish(raw.get("ai_generated"))
    data["ai_tool"] = _collapse(raw.get("ai_tool") or raw.get("cover_tool"))
    data["ai_tool_normalized"] = _lower(data["ai_tool"])
    data["ai_used_for"] = [item.lower() for item in _as_list(raw.get("ai_used_for"))]
    data["ai_images"] = _collapse(raw.get("ai_images") or raw.get("ai_images_disclosure"))
    data["ai_texts"] = _lower(raw.get("ai_texts") or raw.get("ai_text") or "none")
    data["ai_translations"] = _lower(raw.get("ai_translations") or "none")
    data["coloring_book"] = bool(_boolish(raw.get("coloring_book")) is True)
    data["coloring_paper"] = _lower(raw.get("coloring_paper"))
    data["interior_ink"] = _lower(raw.get("interior_ink"))
    if raw.get("page_count") not in (None, ""):
        try:
            data["page_count"] = int(raw.get("page_count"))
        except (TypeError, ValueError):
            data["page_count"] = raw.get("page_count")
    else:
        data["page_count"] = None
    return data
