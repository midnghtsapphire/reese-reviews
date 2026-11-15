"""Optional Notion read/upload for Amazon Resale Inventory item pages.

Requires NOTION_TOKEN in the environment. This module never runs against
live Notion from the test suite. A missing token prints setup instructions
instead of calling the API.
"""

from __future__ import annotations

import io
import os
import re
from pathlib import Path
from urllib.parse import urlparse

import requests
from PIL import Image

NOTION_VERSION = "2022-06-28"
ORIGINAL_LABEL = "Original Product Photo"
FINAL_LABEL = "Final Review Photo (matches original size + light filter)"

TOKEN_HELP = """\
No Notion token found.

To read an Original Product Photo from a Notion item page and (optionally)
upload the Final Review Photo back to that page, set an integration token:

  export NOTION_TOKEN="ntn_..."    # or a secret_... internal integration token
  python -m review_image --notion PAGE_URL_OR_ID

Create a Notion integration at https://www.notion.so/my-integrations,
grant it access to the Amazon Resale Inventory (Reviewed NIB) pages, and
never commit the token. This tool does not post to Amazon.
"""


def notion_token() -> str | None:
    token = os.environ.get("NOTION_TOKEN", "").strip()
    return token or None


def parse_page_id(page: str) -> str:
    """Accept a Notion URL or a 32-char hex id (with or without dashes)."""
    raw = page.strip()
    if raw.startswith("http://") or raw.startswith("https://"):
        path = urlparse(raw).path.rstrip("/")
        slug = path.split("/")[-1]
        # URLs look like .../Title-4002aa319908810f9ce4df3f07ac55df or /p/<id>
        hex_part = slug.split("-")[-1]
        hex_part = hex_part.split("?")[0]
        raw = hex_part
    hex_only = re.sub(r"[^0-9a-fA-F]", "", raw)
    if len(hex_only) != 32:
        raise ValueError(f"Could not parse a Notion page id from: {page!r}")
    return f"{hex_only[0:8]}-{hex_only[8:12]}-{hex_only[12:16]}-{hex_only[16:20]}-{hex_only[20:32]}"


def _headers(token: str, json: bool = True) -> dict[str, str]:
    h = {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
    }
    if json:
        h["Content-Type"] = "application/json"
    return h


def _paginate_blocks(token: str, block_id: str) -> list[dict]:
    url = f"https://api.notion.com/v1/blocks/{block_id}/children"
    headers = _headers(token)
    results: list[dict] = []
    cursor = None
    while True:
        params = {"page_size": 100}
        if cursor:
            params["start_cursor"] = cursor
        resp = requests.get(url, headers=headers, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        results.extend(data.get("results") or [])
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
    return results


def _plain(rich: list | None) -> str:
    if not rich:
        return ""
    return "".join(part.get("plain_text", "") for part in rich)


def _block_text(block: dict) -> str:
    typ = block.get("type")
    payload = block.get(typ) or {}
    if typ in {"paragraph", "heading_1", "heading_2", "heading_3", "quote", "callout", "bulleted_list_item", "numbered_list_item", "to_do"}:
        return _plain(payload.get("rich_text"))
    return ""


def _image_url(block: dict) -> str | None:
    if block.get("type") != "image":
        return None
    img = block.get("image") or {}
    typ = img.get("type")
    if typ == "file":
        return (img.get("file") or {}).get("url")
    if typ == "external":
        return (img.get("external") or {}).get("url")
    return None


def find_original_photo_url(blocks: list[dict]) -> str:
    """Find the image after an 'Original Product Photo' label, else the first image."""
    for i, block in enumerate(blocks):
        text = _block_text(block)
        if ORIGINAL_LABEL.lower() in text.lower():
            url = _image_url(block)
            if url:
                return url
            for later in blocks[i + 1 :]:
                if _block_text(later) and FINAL_LABEL.split("(")[0].lower() in _block_text(later).lower():
                    break
                url = _image_url(later)
                if url:
                    return url
            break
    for block in blocks:
        url = _image_url(block)
        if url:
            return url
    raise LookupError(
        "No Original Product Photo image block was found on this Notion page."
    )


def download_original(page: str, token: str | None = None) -> Image.Image:
    token = token or notion_token()
    if not token:
        raise RuntimeError(TOKEN_HELP)
    page_id = parse_page_id(page)
    blocks = _paginate_blocks(token, page_id)
    url = find_original_photo_url(blocks)
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    img = Image.open(io.BytesIO(resp.content))
    img.load()
    return img


def _create_file_upload(token: str, filename: str) -> dict:
    resp = requests.post(
        "https://api.notion.com/v1/file_uploads",
        headers=_headers(token),
        json={"filename": filename, "content_type": "image/jpeg"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def _send_file_upload(token: str, upload_id: str, data: bytes, filename: str) -> None:
    resp = requests.post(
        f"https://api.notion.com/v1/file_uploads/{upload_id}/send",
        headers=_headers(token, json=False),
        files={"file": (filename, io.BytesIO(data), "image/jpeg")},
        timeout=60,
    )
    resp.raise_for_status()


def upload_final_photo(
    page: str,
    image: Image.Image,
    token: str | None = None,
    filename: str = "final-review-photo.jpg",
) -> dict:
    """Append a Final Review Photo heading + image to the Notion page."""
    token = token or notion_token()
    if not token:
        raise RuntimeError(TOKEN_HELP)
    page_id = parse_page_id(page)
    buf = io.BytesIO()
    image.convert("RGB").save(buf, format="JPEG", quality=95)
    payload = buf.getvalue()
    created = _create_file_upload(token, filename)
    upload_id = created["id"]
    _send_file_upload(token, upload_id, payload, filename)
    children = [
        {
            "type": "paragraph",
            "paragraph": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": FINAL_LABEL + ":"},
                        "annotations": {"bold": True},
                    }
                ]
            },
        },
        {
            "type": "image",
            "image": {
                "type": "file_upload",
                "file_upload": {"id": upload_id},
            },
        },
    ]
    resp = requests.patch(
        f"https://api.notion.com/v1/blocks/{page_id}/children",
        headers=_headers(token),
        json={"children": children},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def instructions_if_no_token() -> str:
    return TOKEN_HELP
