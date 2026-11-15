"""Parse Amazon shipped / delivered / ordered emails for Review Desk.

Read-only. Never sends, labels, archives, or modifies mail.

Current Amazon order, shipped, and delivered templates (as of 2026-11)
include a $0.00 / 0 USD grand total and a category such as "Outerwear",
but not the product name, ASIN, or product photo. Identified products
therefore come from Notion or from an order-history CSV Audrey downloads
herself. Images already linked in an email body may be used; this module
does not fetch Amazon product or order pages.
"""

from __future__ import annotations

import email
import json
import mailbox
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from email.header import decode_header, make_header
from email.message import Message
from pathlib import Path
from typing import Any

from zero_cost import is_zero_cost

CATEGORY_RE = re.compile(
    r"(?:ordered|shipped|delivered|out for delivery)\s+(\d+)\s+items?:\s*(.+)$",
    re.I,
)
ITEM_CATEGORY_RE = re.compile(
    r"\b(\d+)\s+(?:items?:\s*)?([A-Za-z][^,\n]{1,80}?)\s+item\b",
    re.I,
)
ASIN_RE = re.compile(r"\b(B0[A-Z0-9]{8})\b")
DP_RE = re.compile(r"(?:/dp/|/gp/product/)([A-Z0-9]{10})", re.I)
ORDER_DATE_RE = re.compile(r"\b(20\d{2}-\d{2}-\d{2})")
PRODUCT_IMG_RE = re.compile(
    r"https?://[^\"'\s>]*(?:media-amazon\.com|images-na\.ssl-images-amazon\.com)/images/I/[^\"'\s>]+",
    re.I,
)
EVENT_RE = re.compile(r"\b(delivered|out for delivery|shipped|ordered)\b", re.I)

# Template / chrome images, not product photos.
SKIP_IMG_RE = re.compile(
    r"/images/(?:G|X)/|NoASIN|OutboundTemplates|Amazon_logo|transp\.gif|Smile_Logo",
    re.I,
)


def _decode_subject(value: str) -> str:
    if not value:
        return ""
    try:
        return str(make_header(decode_header(value)))
    except Exception:
        return value


def _html_to_text(html: str) -> str:
    text = re.sub(r"(?is)<style.*?>.*?</style>", " ", html)
    text = re.sub(r"(?is)<script.*?>.*?</script>", " ", text)
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</p>", "\n", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"[\u00a0\u200b\u200c\u200d\u2060\ufeff\u034f\u00ad]+", " ", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text


def extract_category(subject: str, body: str) -> str:
    for source in (subject or "", body or ""):
        match = CATEGORY_RE.search(source)
        if match:
            return match.group(2).strip().rstrip(".")
        match = ITEM_CATEGORY_RE.search(source)
        if match:
            return match.group(2).strip().rstrip(".")
    return ""


def extract_asins(text: str) -> list[str]:
    found: list[str] = []
    for regex in (DP_RE, ASIN_RE):
        for match in regex.findall(text or ""):
            asin = match.upper()
            if asin not in found:
                found.append(asin)
    return found


def extract_image_urls(html: str, body: str = "") -> list[str]:
    urls: list[str] = []
    for raw in PRODUCT_IMG_RE.findall((html or "") + "\n" + (body or "")):
        if SKIP_IMG_RE.search(raw):
            continue
        if raw not in urls:
            urls.append(raw)
    return urls


def extract_event(subject: str, body: str) -> str:
    for source in (subject or "", body or ""):
        match = EVENT_RE.search(source)
        if match:
            return match.group(1).lower()
    return ""


def parse_email_dict(raw: dict[str, Any]) -> dict[str, Any]:
    """Parse one already-fetched Gmail message (connector or API snapshot)."""
    subject = _decode_subject(raw.get("subject") or raw.get("Subject") or "")
    body = raw.get("body") or raw.get("text") or raw.get("snippet") or ""
    html = raw.get("htmlBody") or raw.get("html") or ""
    if html and not body:
        body = _html_to_text(html)
    combined = f"{subject}\n{body}\n{html}"
    date = raw.get("date") or raw.get("internalDate") or ""
    if isinstance(date, (int, float)):
        # Gmail API internalDate is milliseconds.
        ms = int(date)
        if ms > 10_000_000_000:
            ms //= 1000
        date = datetime.fromtimestamp(ms, tz=timezone.utc).date().isoformat()
    else:
        date = str(date)
        match = ORDER_DATE_RE.search(date)
        date = match.group(1) if match else date[:10]
    asins = extract_asins(combined)
    images = extract_image_urls(html, body)
    name = (raw.get("name") or raw.get("product") or raw.get("productName") or "").strip()
    category = extract_category(subject, body)
    zero = is_zero_cost(subject, body, html, raw.get("grandTotal"), raw.get("total"))
    item = {
        "name": name,
        "asin": asins[0] if asins else "",
        "amazonUrl": f"https://www.amazon.com/dp/{asins[0]}" if asins else "",
        "category": "products",
        "sourceCategory": category,
        "title": "",
        "body": "",
        "rating": None,
        "textOnly": False,
        "reviewStatus": "To Review",
        "status": "draft",
        "source": "gmail",
        "zeroCost": zero,
        "orderDate": date,
        "event": extract_event(subject, body),
        "imageUrl": images[0] if images else "",
        "hasFinalPhoto": False,
        "identified": bool(name or asins),
    }
    return item


def load_gmail_json(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        rows = list(
            data.get("messages")
            or data.get("emails")
            or data.get("items")
            or data.get("products")
            or data.get("unresolvedZeroCostOrders")
            or []
        )
        # A summary-only snapshot may already be sanitized products.
        if not rows and data.get("products"):
            rows = data["products"]
    elif isinstance(data, list):
        rows = data
    else:
        raise SystemExit(f"Unrecognized Gmail snapshot format: {path}")
    return [parse_email_dict(row) if "subject" in row or "htmlBody" in row or "body" in row else _as_item(row) for row in rows]


def _as_item(row: dict[str, Any]) -> dict[str, Any]:
    if row.get("source") == "gmail" or "zeroCost" in row or "sourceCategory" in row:
        item = parse_email_dict(row)
        for key in ("name", "asin", "amazonUrl", "sourceCategory", "orderDate", "imageUrl", "zeroCost", "identified"):
            if row.get(key) not in (None, ""):
                item[key] = row[key]
        item["identified"] = bool(item.get("name") or item.get("asin"))
        return item
    return parse_email_dict(row)


def _walk_mbox_message(message: Message) -> dict[str, Any]:
    subject = _decode_subject(str(message.get("Subject") or ""))
    date = str(message.get("Date") or "")
    body_parts: list[str] = []
    html_parts: list[str] = []
    if message.is_multipart():
        for part in message.walk():
            ctype = part.get_content_type()
            payload = part.get_payload(decode=True)
            if not payload:
                continue
            charset = part.get_content_charset() or "utf-8"
            try:
                text = payload.decode(charset, errors="replace")
            except Exception:
                text = payload.decode("utf-8", errors="replace")
            if ctype == "text/html":
                html_parts.append(text)
            elif ctype == "text/plain":
                body_parts.append(text)
    else:
        payload = message.get_payload(decode=True)
        if payload:
            charset = message.get_content_charset() or "utf-8"
            text = payload.decode(charset, errors="replace")
            if message.get_content_type() == "text/html":
                html_parts.append(text)
            else:
                body_parts.append(text)
    return parse_email_dict(
        {
            "subject": subject,
            "date": date,
            "body": "\n".join(body_parts),
            "htmlBody": "\n".join(html_parts),
        }
    )


def load_mbox(path: Path) -> list[dict[str, Any]]:
    box = mailbox.mbox(str(path))
    try:
        return [_walk_mbox_message(message) for message in box]
    finally:
        box.close()


def gmail_credentials_pending() -> str:
    return (
        "Gmail OAuth credentials are pending. Set GMAIL_CLIENT_ID, "
        "GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN (or GMAIL_ACCESS_TOKEN) "
        "in a CircleCI context or project env. See docs/REVIEW-DESK.md. "
        "Do not commit the tokens. This importer is read-only and never "
        "sends, labels, archives, or modifies mail."
    )


def _gmail_access_token() -> str:
    ready = (os.environ.get("GMAIL_ACCESS_TOKEN") or "").strip()
    if ready:
        return ready
    client_id = (os.environ.get("GMAIL_CLIENT_ID") or "").strip()
    client_secret = (os.environ.get("GMAIL_CLIENT_SECRET") or "").strip()
    refresh = (os.environ.get("GMAIL_REFRESH_TOKEN") or "").strip()
    if not (client_id and client_secret and refresh):
        raise SystemExit(gmail_credentials_pending())
    data = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh,
            "grant_type": "refresh_token",
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=data,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"Gmail token refresh failed: {exc.code}") from exc
    token = (payload.get("access_token") or "").strip()
    if not token:
        raise SystemExit("Gmail token refresh returned no access_token.")
    return token


def fetch_gmail_api(query: str, max_messages: int = 500) -> list[dict[str, Any]]:
    """List and read Gmail messages. Read-only. Does not change labels."""
    token = _gmail_access_token()
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    messages: list[dict[str, str]] = []
    page_token = ""
    while len(messages) < max_messages:
        params = {
            "q": query,
            "maxResults": str(min(100, max_messages - len(messages))),
        }
        if page_token:
            params["pageToken"] = page_token
        url = "https://gmail.googleapis.com/gmail/v1/users/me/messages?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        messages.extend(payload.get("messages") or [])
        page_token = payload.get("nextPageToken") or ""
        if not page_token:
            break
    items: list[dict[str, Any]] = []
    for meta in messages[:max_messages]:
        mid = meta.get("id")
        if not mid:
            continue
        url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{mid}?format=full"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        items.append(_api_message_to_dict(payload))
    return [parse_email_dict(item) for item in items]


def _api_headers(payload: dict[str, Any]) -> dict[str, str]:
    headers = {}
    for header in ((payload.get("payload") or {}).get("headers") or []):
        name = (header.get("name") or "").lower()
        if name in {"subject", "from", "date"}:
            headers[name] = header.get("value") or ""
    return headers


def _api_body_parts(part: dict[str, Any], plain: list[str], html: list[str]) -> None:
    import base64

    mime = (part.get("mimeType") or "").lower()
    data = (part.get("body") or {}).get("data")
    if data and mime in {"text/plain", "text/html"}:
        padded = data + "=" * (-len(data) % 4)
        text = base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8", errors="replace")
        if mime == "text/html":
            html.append(text)
        else:
            plain.append(text)
    for child in part.get("parts") or []:
        _api_body_parts(child, plain, html)


def _api_message_to_dict(payload: dict[str, Any]) -> dict[str, Any]:
    headers = _api_headers(payload)
    plain: list[str] = []
    html: list[str] = []
    _api_body_parts(payload.get("payload") or {}, plain, html)
    return {
        "id": payload.get("id") or "",
        "subject": headers.get("subject") or "",
        "date": payload.get("internalDate") or headers.get("date") or "",
        "body": "\n".join(plain),
        "htmlBody": "\n".join(html),
        "snippet": payload.get("snippet") or "",
    }


DEFAULT_GMAIL_QUERY = (
    'from:(shipment-tracking@amazon.com OR auto-confirm@amazon.com OR '
    "order-update@amazon.com) newer_than:90d"
)
