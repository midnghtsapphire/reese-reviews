"""Read the Amazon Resale Inventory Notion database via the official API.

Requires NOTION_TOKEN. The Secret agent does not have a Notion token yet,
so CircleCI setup is documented and pending. This module never invents
review text: empty title/body/rating stay empty.

Database / data source id: baca0fdb-dde7-439d-93c1-cb964f0ff9bc
("Amazon Resale Inventory (Reviewed NIB)").
"""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from typing import Any

DEFAULT_DATA_SOURCE = "baca0fdb-dde7-439d-93c1-cb964f0ff9bc"
NOTION_VERSION = "2022-06-28"
API = "https://api.notion.com/v1"


class NotionConfigError(SystemExit):
    """Raised when the Notion token is missing or rejected."""


def notion_token() -> str:
    token = (os.environ.get("NOTION_TOKEN") or "").strip()
    if not token:
        raise NotionConfigError(
            "NOTION_TOKEN is not set. The Secret agent does not have a Notion "
            "integration token yet. Add NOTION_TOKEN to a CircleCI context "
            "(see docs/REVIEW-DESK.md) or pass --from-json / --from-csv for a "
            "local export. Do not commit the token."
        )
    return token


def _request(method: str, url: str, token: str, body: dict | None = None) -> dict[str, Any]:
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise NotionConfigError(
            f"Notion API {exc.code} for {url}: {detail[:500]}"
        ) from exc


def _plain(rich: list[dict[str, Any]] | None) -> str:
    if not rich:
        return ""
    return "".join(part.get("plain_text") or "" for part in rich).strip()


def _prop(properties: dict[str, Any], name: str) -> Any:
    return properties.get(name) or {}


def _prop_text(properties: dict[str, Any], name: str) -> str:
    value = _prop(properties, name)
    typ = value.get("type")
    if typ == "title":
        return _plain(value.get("title"))
    if typ == "rich_text":
        return _plain(value.get("rich_text"))
    if typ == "url":
        return (value.get("url") or "").strip()
    if typ == "select":
        sel = value.get("select") or {}
        return (sel.get("name") or "").strip()
    if typ == "status":
        st = value.get("status") or {}
        return (st.get("name") or "").strip()
    if typ == "number":
        number = value.get("number")
        return "" if number is None else str(number)
    return ""


def _page_id(page: dict[str, Any]) -> str:
    return (page.get("id") or "").replace("-", "")


def extract_review_from_preview(preview: str) -> dict[str, Any]:
    """Parse `4 stars | Title: ... | body`. Ignore truncated previews."""
    text = (preview or "").strip()
    result: dict[str, Any] = {"rating": None, "title": "", "body": ""}
    if not text:
        return result
    truncated = text.endswith("...") or "(full text in page)" in text.lower()
    stars = re.search(r"\b([1-5])\s*stars?\b", text, re.I)
    if stars:
        result["rating"] = int(stars.group(1))
    title_match = re.search(r"Title:\s*([^|]+)", text)
    if title_match:
        result["title"] = title_match.group(1).strip(" |")
    parts = [part.strip() for part in re.split(r"\s*\|\s*", text) if part.strip()]
    body = ""
    if len(parts) >= 3:
        body = parts[-1]
        body = re.sub(r"^[1-5]\s*stars?\s*", "", body, flags=re.I)
        body = re.sub(r"^Title:\s*[^|]+", "", body).strip(" |")
    if truncated:
        # Preview is incomplete; keep title/stars if present, drop body.
        result["body"] = ""
        return result
    result["body"] = body
    return result


def extract_review_from_markdown(content: str) -> dict[str, Any]:
    """Pull Title / Stars / Review from a Notion page body."""
    result: dict[str, Any] = {"rating": None, "title": "", "body": "", "hasFinalPhoto": False}
    if not content:
        return result
    if re.search(r"final review photo", content, re.I) and (
        "<image " in content or "notion-file-block://" in content or re.search(r"!\[[^\]]*\]\(", content)
    ):
        result["hasFinalPhoto"] = True
    title_match = re.search(r"(?:\*\*|__|<b>)?Title:(?:\*\*|__|</b>)?\s*(.+)", content)
    stars_match = re.search(r"(?:\*\*|__|<b>)?Stars:(?:\*\*|__|</b>)?\s*(.+)", content)
    review_match = re.search(
        r"(?:\*\*|__|<b>)?Review:(?:\*\*|__|</b>)?(?:<br\s*/?>)?\s*([\s\S]+?)(?:\n---|\n(?:<b>|\*\*)[A-Z]|$)",
        content,
    )
    if title_match:
        result["title"] = re.sub(r"<[^>]+>", "", title_match.group(1)).strip()
    if stars_match:
        raw = re.sub(r"<[^>]+>", "", stars_match.group(1)).strip()
        digit = re.search(r"([1-5])", raw)
        if digit:
            result["rating"] = int(digit.group(1))
    if review_match:
        body = review_match.group(1)
        body = body.replace("<br />", "\n").replace("<br/>", "\n").replace("<br>", "\n")
        body = re.sub(r"<[^>]+>", "", body)
        body = re.split(r"\nReady for Vine review form\.", body)[0]
        result["body"] = body.strip()
    return result


def _rich_to_text(block: dict[str, Any]) -> str:
    typ = block.get("type")
    payload = block.get(typ) or {}
    if typ == "image":
        return "[image]"
    rich = payload.get("rich_text") or payload.get("text") or []
    return _plain(rich)


def fetch_page_plain_text(token: str, page_id: str) -> str:
    lines: list[str] = []
    cursor = None
    while True:
        url = f"{API}/blocks/{page_id}/children?page_size=100"
        if cursor:
            url += f"&start_cursor={cursor}"
        data = _request("GET", url, token)
        for block in data.get("results") or []:
            typ = block.get("type")
            payload = block.get(typ) or {}
            if typ == "image":
                lines.append("## image")
                lines.append("[image]")
                # Mark a photo is present; signed URLs are not stored.
                continue
            text = _rich_to_text(block)
            if typ in {"heading_1", "heading_2", "heading_3"}:
                lines.append(f"## {text}")
            elif typ == "paragraph":
                lines.append(text)
            elif typ in {"bulleted_list_item", "numbered_list_item"}:
                lines.append(text)
            elif typ == "quote":
                lines.append(text)
            elif text:
                lines.append(text)
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
        if not cursor:
            break
    return "\n".join(lines)


def row_to_product(page: dict[str, Any], body_text: str = "") -> dict[str, Any]:
    props = page.get("properties") or {}
    name = _prop_text(props, "Name")
    asin = _prop_text(props, "ASIN")
    amazon_url = _prop_text(props, "Amazon URL") or (f"https://www.amazon.com/dp/{asin}" if asin else "")
    review_status = _prop_text(props, "Review Status") or "To Review"
    preview = extract_review_from_preview(_prop_text(props, "Review Preview"))
    parsed = extract_review_from_markdown(body_text)
    title = parsed["title"] or preview["title"]
    rating = parsed["rating"] if parsed["rating"] is not None else preview["rating"]
    body = parsed["body"] or preview["body"]
    page_id = _page_id(page)
    return {
        "id": page_id,
        "name": name or "Untitled",
        "asin": asin,
        "amazonUrl": amazon_url,
        "notionUrl": f"https://www.notion.so/{page_id}" if page_id else (page.get("url") or ""),
        "category": "products",
        "rating": rating,
        "title": title or "",
        "body": body or "",
        "textOnly": False,
        "reviewStatus": review_status,
        "status": "draft",
        "source": "notion",
        "hasFinalPhoto": bool(parsed.get("hasFinalPhoto")),
    }


def query_inventory(
    token: str | None = None,
    data_source: str = DEFAULT_DATA_SOURCE,
    fetch_bodies: bool = True,
) -> list[dict[str, Any]]:
    token = token or notion_token()
    rows: list[dict[str, Any]] = []
    cursor = None
    while True:
        body: dict[str, Any] = {"page_size": 100}
        if cursor:
            body["start_cursor"] = cursor
        # Prefer the databases query endpoint; the id is the collection / data source.
        data = _request("POST", f"{API}/databases/{data_source}/query", token, body)
        rows.extend(data.get("results") or [])
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
        if not cursor:
            break
    products = []
    for page in rows:
        body_text = ""
        if fetch_bodies:
            body_text = fetch_page_plain_text(token, page.get("id") or "")
        products.append(row_to_product(page, body_text))
    return products
