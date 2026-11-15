"""Minimal front-matter helpers for review.md files. Stdlib only."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

FRONT_MATTER_RE = re.compile(
    r"\A---\r?\n(?P<meta>[\s\S]*?)\r?\n---\r?\n?(?P<body>[\s\S]*)\Z"
)


def _strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        return value[1:-1]
    return value


def _parse_scalar(value: str) -> Any:
    text = _strip_quotes(value)
    if text in {"", "null", "~"}:
        return None
    if text == "true":
        return True
    if text == "false":
        return False
    if re.fullmatch(r"-?\d+", text):
        return int(text)
    return text


@dataclass
class ReviewDoc:
    path: Path
    product: str = ""
    asin: str = ""
    url: str = ""
    rating: int | None = None
    title: str = ""
    status: str = "draft"
    slug: str = ""
    text_only: bool = False
    category: str = ""
    notion_url: str = ""
    order_date: str = ""
    priority: str = ""
    body: str = ""
    extra: dict[str, Any] = field(default_factory=dict)

    @property
    def image_dir(self) -> Path:
        return self.path.parent / "images"

    def image_files(self) -> list[Path]:
        if not self.image_dir.is_dir():
            return []
        return [
            p
            for p in sorted(self.image_dir.iterdir())
            if p.is_file() and p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
        ]


def parse_review_markdown(text: str, path: Path | None = None) -> ReviewDoc:
    path = path or Path("review.md")
    match = FRONT_MATTER_RE.match(text)
    doc = ReviewDoc(path=path)
    if not match:
        doc.body = text.strip()
        return doc
    for line in match.group("meta").splitlines():
        if not line.strip() or line.strip().startswith("#"):
            continue
        if ":" not in line:
            continue
        key, raw = line.split(":", 1)
        key = key.strip()
        value = _parse_scalar(raw)
        doc.extra[key] = value
        if key == "product":
            doc.product = str(value or "")
        elif key == "asin":
            doc.asin = str(value or "")
        elif key in {"url", "amazon_url"}:
            doc.url = str(value or "")
        elif key == "rating":
            doc.rating = value if isinstance(value, int) else None
        elif key in {"title", "headline"}:
            doc.title = str(value or "")
        elif key == "status":
            doc.status = str(value or "draft")
        elif key == "slug":
            doc.slug = str(value or "")
        elif key in {"text_only", "textOnly"}:
            doc.text_only = value is True
        elif key == "category":
            doc.category = str(value or "")
        elif key in {"notion_url", "notionUrl"}:
            doc.notion_url = str(value or "")
        elif key in {"order_date", "orderDate"}:
            doc.order_date = str(value or "")
        elif key == "priority":
            doc.priority = str(value or "")
    doc.body = match.group("body").lstrip("\r\n").rstrip()
    return doc


def load_review(path: Path) -> ReviewDoc:
    return parse_review_markdown(path.read_text(encoding="utf-8"), path=path)


def serialize_review(doc: ReviewDoc) -> str:
    def q(value: str) -> str:
        return json.dumps(value, ensure_ascii=False)

    lines = [
        "---",
        f"product: {q(doc.product)}",
        f"asin: {q(doc.asin)}",
        f"url: {q(doc.url)}",
        f"rating: {doc.rating if doc.rating is not None else 'null'}",
        f"title: {q(doc.title)}",
        f"status: {q(doc.status)}",
        f"slug: {q(doc.slug)}",
        f"text_only: {'true' if doc.text_only else 'false'}",
    ]
    if doc.category:
        lines.append(f"category: {q(doc.category)}")
    if doc.notion_url:
        lines.append(f"notion_url: {q(doc.notion_url)}")
    if doc.order_date:
        lines.append(f"order_date: {q(doc.order_date)}")
    if doc.priority:
        lines.append(f"priority: {q(doc.priority)}")
    lines.extend(["---", "", doc.body.strip(), ""])
    return "\n".join(lines)


def slugify(name: str, asin: str = "") -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)[:80].strip("-")
    return slug or (asin.lower() if asin else "review")


def find_reviews(root: Path) -> list[Path]:
    reviews_root = root / "reviews"
    if not reviews_root.is_dir():
        return []
    return sorted(
        p
        for p in reviews_root.glob("*/review.md")
        if p.is_file() and not p.parent.name.startswith("_")
    )
