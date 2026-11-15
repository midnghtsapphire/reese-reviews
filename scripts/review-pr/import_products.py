#!/usr/bin/env python3
"""Import every product that needs a review into Review Desk.

Primary source: Amazon shipped / delivered / ordered emails in Gmail
(read-only). Those emails, plus an order-history CSV, use a $0.00 total
(or Vine wording) as the signal that an item belongs on the Review Desk
queue. Paid orders are excluded unless --include-paid is set.

Secondary source: the Notion database "Amazon Resale Inventory
(Reviewed NIB)". Notion rows keep their existing review text; this
script never invents a review.

Other inputs: a sanitized JSON snapshot, a Gmail JSON/mbox export, a
Vine queue CSV, or an Amazon order-history CSV Audrey downloads herself.
The importer does not visit, fetch, or scrape Amazon product pages.

Rows missing a title, star rating, written review, or photo (unless
text-only) are marked needsReview. Writes a sanitized snapshot JSON and,
with --write-reviews, one reviews/<slug>/ folder per product. The demo
placeholder is archived (not deleted) with --archive-demo.

Does not post to Amazon or Notion. Does not send, label, archive, or
modify Gmail. Does not run a schedule from this machine; CircleCI owns
the recurring import (pipeline parameter run_product_import=true).
"""


from __future__ import annotations

import argparse
import csv
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from frontmatter import ReviewDoc, serialize_review, slugify  # noqa: E402
from vine_source import load_vine_csv  # noqa: E402
from gmail_source import (  # noqa: E402
    DEFAULT_GMAIL_QUERY,
    fetch_gmail_api,
    gmail_credentials_pending,
    load_gmail_json,
    load_mbox,
)
from order_csv import load_order_csv  # noqa: E402

DEFAULT_DATA_SOURCE = "baca0fdb-dde7-439d-93c1-cb964f0ff9bc"
DEFAULT_SNAPSHOT = SCRIPT_DIR / "fixtures" / "notion-inventory.json"
IMPORT_BRANCH = "import/review-desk-inventory"
PREFERRED_SLUGS_BY_ASIN = {
    "B0HHRHHLC5": "nativity-ornaments",
    "B0H4LFZTB7": "dog-multivitamin-chews",
    "B0HGRHWB6N": "2-pocket-toploader-binder",
    "B0H8NXRRQ7": "black-leather-desk-chair",
    "B0HHHNY9S7": "christmas-beanie",
    "B0H8SSS7JL": "garvee-camping-chair",
    "B0GZZN3S3J": "hearing-aids-seniors",
    "B0H86PVY8L": "icicle-christmas-lights",
    "B0H665KM3W": "ltinhome-pillow-inserts",
    "B0HGRDP6TC": "supfives-whiskey-glasses",
}
SLUG_HINTS = (
    (re.compile(r"migeec", re.I), "toploader-9-pocket-migeec"),
    (re.compile(r"pu leather|holds 288", re.I), "toploader-9-pocket-pu-leather"),
)


def preferred_slug(item: dict[str, Any]) -> str:
    if item.get("slug"):
        return str(item["slug"])
    name = item.get("name") or item.get("product") or ""
    asin = (item.get("asin") or "").strip().upper()
    for pattern, slug in SLUG_HINTS:
        if pattern.search(name):
            return slug
    if asin in PREFERRED_SLUGS_BY_ASIN:
        return PREFERRED_SLUGS_BY_ASIN[asin]
    return slugify(name, asin)


def identity_key(item: dict[str, Any]) -> str:
    """Unique key. ASIN alone is not unique (two 9-pocket binders share one)."""
    if item.get("id"):
        return f"id:{item['id']}"
    slug = preferred_slug(item)
    asin = (item.get("asin") or "").strip().upper()
    if asin:
        return f"asin-slug:{asin}:{slug}"
    return f"slug:{slug}"


def parse_rating(value: Any) -> int | None:
    if value is None or value == "":
        return None
    if isinstance(value, int) and 1 <= value <= 5:
        return value
    if isinstance(value, float) and value.is_integer() and 1 <= int(value) <= 5:
        return int(value)
    text = str(value).strip()
    match = re.search(r"([1-5])", text)
    if match:
        return int(match.group(1))
    return None


def normalize_product(raw: dict[str, Any], source: str | None = None) -> dict[str, Any]:
    name = (raw.get("name") or raw.get("product") or raw.get("productName") or "Untitled").strip()
    asin = (raw.get("asin") or "").strip().upper()
    url = (raw.get("amazonUrl") or raw.get("amazon_url") or raw.get("url") or "").strip()
    if not url and asin:
        url = f"https://www.amazon.com/dp/{asin}"
    item = {
        "id": (raw.get("id") or "").replace("-", ""),
        "name": name,
        "slug": preferred_slug({**raw, "name": name, "asin": asin}),
        "asin": asin,
        "amazonUrl": url,
        "notionUrl": (raw.get("notionUrl") or raw.get("notion_url") or "").split("?")[0],
        "category": raw.get("category") or "products",
        "rating": parse_rating(raw.get("rating")),
        "title": (raw.get("title") or raw.get("headline") or "").strip(),
        "body": (raw.get("body") or raw.get("review") or "").strip(),
        "textOnly": bool(raw.get("textOnly") or raw.get("text_only")),
        "reviewStatus": raw.get("reviewStatus") or raw.get("review_status") or "To Review",
        "status": raw.get("status") or "draft",
        "source": raw.get("source") or source or "json",
        "hasFinalPhoto": bool(raw.get("hasFinalPhoto") or raw.get("has_final_photo")),
    }
    item["missingFields"] = missing_fields(item)
    item["needsReview"] = needs_review(item)
    return item


def missing_fields(item: dict[str, Any], has_photo: bool | None = None) -> list[str]:
    missing: list[str] = []
    if not (item.get("title") or "").strip():
        missing.append("title")
    if parse_rating(item.get("rating")) is None:
        missing.append("rating")
    if not (item.get("body") or "").strip():
        missing.append("body")
    photo = item.get("hasFinalPhoto") if has_photo is None else has_photo
    if not item.get("textOnly") and not photo:
        missing.append("photo")
    return missing


def needs_review(item: dict[str, Any]) -> bool:
    status = (item.get("reviewStatus") or "").strip().lower()
    if status in {"", "to review", "to-review", "needs review"}:
        return True
    return bool(item.get("missingFields"))


def sanitize_product(item: dict[str, Any]) -> dict[str, Any]:
    """Drop prices, order numbers, addresses, affiliate tags, and notes."""
    allowed = (
        "id",
        "name",
        "slug",
        "asin",
        "amazonUrl",
        "notionUrl",
        "category",
        "rating",
        "title",
        "body",
        "textOnly",
        "reviewStatus",
        "status",
        "source",
        "needsReview",
        "missingFields",
        "hasFinalPhoto",
        "orderDate",
        "zeroCost",
        "sourceCategory",
        "imageUrl",
        "sources",
    )
    clean = {key: item.get(key) for key in allowed}
    clean["amazonUrl"] = re.sub(r"[?&]tag=[^&]+", "", clean.get("amazonUrl") or "")
    clean["amazonUrl"] = clean["amazonUrl"].rstrip("?&")
    return clean


def load_json_inventory(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        rows = list(data.get("products") or data.get("items") or data.get("rows") or [])
    elif isinstance(data, list):
        rows = data
    else:
        raise SystemExit(f"Unrecognized inventory format: {path}")
    return [normalize_product(row, source="json") for row in rows]


def load_csv_inventory(path: Path) -> list[dict[str, Any]]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        rows = []
        for raw in reader:
            mapped = {re.sub(r"[^a-z0-9]", "", key.strip().lower()): value for key, value in raw.items()}
            rows.append(
                normalize_product(
                    {
                        "name": mapped.get("name") or mapped.get("product") or mapped.get("productname") or "",
                        "asin": mapped.get("asin") or "",
                        "amazonUrl": mapped.get("amazonurl") or mapped.get("url") or "",
                        "notionUrl": mapped.get("notionurl") or "",
                        "title": mapped.get("title") or mapped.get("headline") or "",
                        "body": mapped.get("body") or mapped.get("review") or "",
                        "rating": mapped.get("rating") or "",
                        "reviewStatus": mapped.get("reviewstatus") or "To Review",
                        "slug": mapped.get("slug") or "",
                        "textOnly": (mapped.get("textonly") or "").lower() in {"1", "true", "yes"},
                        "category": mapped.get("category") or "products",
                    },
                    source="csv",
                )
            )
        return rows


def fill_blanks(existing: dict[str, Any], incoming: dict[str, Any]) -> None:
    """Copy only empty fields. Never overwrite existing review text."""
    fillable = (
        "title",
        "body",
        "rating",
        "amazonUrl",
        "notionUrl",
        "hasFinalPhoto",
        "orderDate",
        "imageUrl",
        "sourceCategory",
        "zeroCost",
    )
    for key in fillable:
        if not existing.get(key) and incoming.get(key):
            existing[key] = incoming[key]
    sources: list[str] = []
    for value in (existing.get("sources"), existing.get("source"), incoming.get("source")):
        if isinstance(value, list):
            sources.extend(str(part) for part in value if part)
        elif value:
            sources.append(str(value))
    existing["sources"] = list(dict.fromkeys(sources))
    existing["source"] = existing["sources"][0] if existing["sources"] else existing.get("source") or "json"
    existing["missingFields"] = missing_fields(existing)
    existing["needsReview"] = needs_review(existing)


def merge_products(*groups: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """First source wins identity. Later sources only fill empty fields.

    A later row matches an existing row when the slug is the same, the page
    id is the same, or the ASIN is the same *and* the slug matches. Two rows
    that share an ASIN but have different slugs (the two 9-pocket binders)
    are both kept.
    """
    merged: list[dict[str, Any]] = []
    by_id: dict[str, dict[str, Any]] = {}
    by_slug: dict[str, dict[str, Any]] = {}
    by_asin_slug: dict[tuple[str, str], dict[str, Any]] = {}
    for group in groups:
        for item in group:
            slug = preferred_slug(item)
            item["slug"] = slug
            page_id = (item.get("id") or "").replace("-", "")
            asin = (item.get("asin") or "").strip().upper()
            existing = None
            if page_id and page_id in by_id:
                existing = by_id[page_id]
            elif slug in by_slug:
                existing = by_slug[slug]
            elif asin and (asin, slug) in by_asin_slug:
                existing = by_asin_slug[(asin, slug)]
            if existing is not None:
                fill_blanks(existing, item)
                continue
            item["sources"] = list(dict.fromkeys([item.get("source") or "json"]))
            if page_id:
                by_id[page_id] = item
            by_slug[slug] = item
            if asin:
                by_asin_slug[(asin, slug)] = item
            merged.append(item)
    merged.sort(key=lambda item: (item.get("name") or "").lower())
    return merged


PLACEHOLDER_PHOTO_NAMES = {
    "final-review.svg",
    "demo-placeholder.svg",
    "revvel-disabled-final-review.svg",
}


def folder_has_photo(image_dir: Path) -> bool:
    if not image_dir.is_dir():
        return False
    for path in image_dir.iterdir():
        if not path.is_file():
            continue
        if path.name.lower() in PLACEHOLDER_PHOTO_NAMES:
            continue
        if path.name.upper().startswith("REVVEL-DISABLED"):
            continue
        if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
            return True
    return False


def archive_demo(root: Path) -> Path | None:
    """Move the demo placeholder photo into reviews/_archived/. Do not delete it."""
    demo_image = root / "reviews" / "2-pocket-toploader-binder" / "images" / "final-review.svg"
    archive = root / "reviews" / "_archived" / "demo-2-pocket-toploader-binder"
    if not demo_image.is_file() and not archive.is_dir():
        return None
    archive.mkdir(parents=True, exist_ok=True)
    if demo_image.is_file():
        dest = archive / "final-review.svg"
        if not dest.exists():
            shutil.copy2(demo_image, dest)
        disabled = demo_image.with_name("REVVEL-DISABLED-final-review.svg")
        if not disabled.exists():
            demo_image.replace(disabled)
        if disabled.exists():
            archived_disabled = archive / "REVVEL-DISABLED-final-review.svg"
            if not archived_disabled.exists():
                shutil.copy2(disabled, archived_disabled)
    readme = archive / "README.md"
    if not readme.exists():
        readme.write_text(
            "Archived Review Desk demo placeholder (not deleted).\n\n"
            "REVVEL-DISABLED: the original demo used this SVG as a stand-in "
            "Final Review Photo for the 2-pocket toploader binder. The real "
            "review.md stayed in reviews/2-pocket-toploader-binder/.\n",
            encoding="utf-8",
        )
    print("Archived demo placeholder to reviews/_archived/demo-2-pocket-toploader-binder/")
    return archive


def sanitize_unresolved(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "sourceCategory": item.get("sourceCategory") or "",
        "orderDate": item.get("orderDate") or "",
        "event": item.get("event") or "",
        "zeroCost": bool(item.get("zeroCost")),
        "missingFields": item.get("missingFields") or ["name", "asin", "title", "body", "photo"],
    }


def split_gmail_items(
    rows: list[dict[str, Any]], include_paid: bool
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], int]:
    identified: list[dict[str, Any]] = []
    unresolved: list[dict[str, Any]] = []
    excluded = 0
    for row in rows:
        if not row.get("zeroCost") and not include_paid:
            excluded += 1
            continue
        name = (row.get("name") or "").strip()
        flagged = bool(row.get("identified") or row.get("asin") or (name and name.lower() != "untitled"))
        if flagged:
            item = normalize_product(row, source="gmail")
            item["zeroCost"] = bool(row.get("zeroCost"))
            item["orderDate"] = row.get("orderDate") or ""
            item["sourceCategory"] = row.get("sourceCategory") or ""
            item["imageUrl"] = row.get("imageUrl") or ""
            identified.append(item)
        else:
            unresolved.append(sanitize_unresolved(row))
    return identified, unresolved, excluded



def find_final_photo(images_dir: Path, slug: str, asin: str) -> Path | None:
    if not images_dir or not images_dir.is_dir():
        return None
    candidates: list[Path] = []
    sub = images_dir / slug
    search_roots = [sub] if sub.is_dir() else []
    # Also scan one level for folders whose name contains the slug or ASIN.
    for child in images_dir.iterdir() if images_dir.is_dir() else []:
        if child.is_dir() and (slug in child.name or (asin and asin.lower() in child.name.lower())):
            search_roots.append(child)
    search_roots.append(images_dir)
    seen: set[Path] = set()
    for root in search_roots:
        if root in seen or not root.exists():
            continue
        seen.add(root)
        for path in sorted(root.rglob("*final-review*.jpg")) + sorted(root.rglob("*final-review*.png")):
            name = path.name.lower()
            if "rembg" in name:
                continue
            if slug in str(path) or (asin and asin.lower() in path.name.lower()) or root == sub or root.name == slug:
                candidates.append(path)
    # Prefer original-final-review.jpg (the filtered fallback), then any other.
    def rank(path: Path) -> tuple[int, int, str]:
        name = path.name.lower()
        preferred = 0 if name.startswith("original-final-review") or name == "final-review.jpg" else 1
        return (preferred, len(str(path)), str(path))

    candidates = [path for path in candidates if path.is_file()]
    if not candidates:
        return None
    return sorted(set(candidates), key=rank)[0]


def copy_photo(dest_dir: Path, source: Path) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    suffix = source.suffix.lower() or ".jpg"
    dest = dest_dir / f"final-review{suffix}"
    shutil.copy2(source, dest)
    return dest


def write_snapshot(
    path: Path,
    products: list[dict[str, Any]],
    note: str | None = None,
    extra: dict[str, Any] | None = None,
) -> None:
    payload = {
        "source": "Amazon Resale Inventory (Reviewed NIB) + Gmail $0 / Vine queue",
        "sourceId": DEFAULT_DATA_SOURCE,
        "note": note
        or (
            "Sanitized inventory snapshot for Review Desk. Product names, "
            "ASINs, review drafts, order dates, and missing-field flags only. "
            "No prices, order numbers, addresses, email bodies, or affiliate tags. "
            "By default only $0.00 / Vine items are queued; paid orders are omitted."
        ),
        "products": [sanitize_product(item) for item in products],
    }
    if extra:
        payload.update(extra)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_review_folder(
    root: Path,
    item: dict[str, Any],
    images_dir: Path | None,
    overwrite: bool = False,
) -> tuple[Path, bool, bool]:
    """Return (folder, wrote_or_updated, skipped)."""
    slug = item["slug"]
    folder = root / "reviews" / slug
    review_path = folder / "review.md"
    if review_path.exists() and not overwrite:
        # Still try to add a photo if the folder has none.
        image_dir = folder / "images"
        has_image = folder_has_photo(image_dir)
        if images_dir and not has_image and not item.get("textOnly"):
            photo = find_final_photo(images_dir, slug, item.get("asin") or "")
            if photo:
                copy_photo(image_dir, photo)
                item["hasFinalPhoto"] = True
        return folder, False, True

    folder.mkdir(parents=True, exist_ok=True)
    image_dir = folder / "images"
    image_dir.mkdir(exist_ok=True)
    has_photo = False
    if images_dir:
        photo = find_final_photo(images_dir, slug, item.get("asin") or "")
        if photo:
            copy_photo(image_dir, photo)
            has_photo = True
    if not has_photo:
        has_photo = folder_has_photo(image_dir)
    item["hasFinalPhoto"] = has_photo or bool(item.get("hasFinalPhoto"))
    item["missingFields"] = missing_fields(item, has_photo=item["hasFinalPhoto"])
    item["needsReview"] = needs_review(item)

    doc = ReviewDoc(
        path=review_path,
        product=item["name"],
        asin=item.get("asin") or "",
        url=item.get("amazonUrl") or "",
        rating=item.get("rating"),
        title=item.get("title") or "",
        status=item.get("status") or "draft",
        slug=slug,
        text_only=bool(item.get("textOnly")),
        category=item.get("category") or "products",
        notion_url=item.get("notionUrl") or "",
        body=item.get("body") or "",
    )
    review_path.write_text(serialize_review(doc), encoding="utf-8")
    return folder, True, False


def github_token() -> str:
    for key in ("IMAGE_PROCESS_GITHUB_TOKEN", "GITHUB_TOKEN", "GH_TOKEN"):
        value = (os.environ.get(key) or "").strip()
        if value:
            return value
    return ""


def open_import_pr(root: Path, snapshot: Path, products: list[dict[str, Any]]) -> None:
    """Commit the snapshot on the current branch (or IMPORT_BRANCH when on main) and open a draft PR.

    Never force-pushes, never deletes a branch, and never checks out origin/main
    over a feature branch (that would drop in-progress importer work).
    """
    missing = [item for item in products if item.get("needsReview")]
    snapshot_rel = ""
    try:
        if snapshot.exists():
            snapshot_rel = f" (`{snapshot.relative_to(root)}`)"
    except ValueError:
        snapshot_rel = f" (`{snapshot}`)"
    body = (
        "**Auky:** this draft PR is the automatic product import for Review Desk. "
        "It grabs every row from the Amazon Resale Inventory (and any new Vine CSV "
        "items when a file is provided) and writes the sanitized snapshot"
        + snapshot_rel
        + ". It does not invent review text. Empty title, rating, review, or photo "
        "fields stay empty so the desk can flag them.\n\n"
        f"{len(products)} product(s) imported; {len(missing)} still need a review.\n\n"
        "This does **not** post to Amazon. Per-product review PRs are opened with "
        "`scripts/review-pr/generate.py --open-pr`.\n\n"
        "— Auky"
    )
    current = subprocess.check_output(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=root, text=True
    ).strip()
    if current in {"main", "HEAD"}:
        subprocess.run(["git", "checkout", "-B", IMPORT_BRANCH], cwd=root, check=True)
        branch = IMPORT_BRANCH
    else:
        branch = current
    rels = []
    try:
        if snapshot.exists():
            rels.append(str(snapshot.relative_to(root)))
    except ValueError:
        pass
    subprocess.run(["git", "add", *rels, "--", str(snapshot)], cwd=root, check=False)
    message = "**Auky:** import products that need a review into Review Desk — Auky"
    committed = subprocess.run(["git", "commit", "-m", message], cwd=root)
    subprocess.run(["git", "push", "-u", "origin", branch], cwd=root, check=True)
    existing = subprocess.run(
        ["gh", "pr", "list", "--head", branch, "--base", "main", "--json", "number,url"],
        cwd=root,
        capture_output=True,
        text=True,
    )
    prs = json.loads(existing.stdout or "[]") if existing.returncode == 0 else []
    if prs:
        print(f"Updated existing draft PR: {prs[0].get('url')}")
        return
    if committed.returncode != 0:
        print("No new commit was created (working tree may already be committed).")
    subprocess.run(
        [
            "gh",
            "pr",
            "create",
            "--draft",
            "--title",
            "Import products that need a review",
            "--body",
            body,
            "--head",
            branch,
            "--base",
            "main",
        ],
        cwd=root,
        check=True,
    )


def load_sources(args: argparse.Namespace) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    groups: list[list[dict[str, Any]]] = []
    meta: dict[str, Any] = {
        "unresolvedZeroCostOrders": [],
        "excludedPaid": 0,
        "gmailNote": (
            "Current Amazon order, shipped, and delivered emails include a "
            "$0.00 / 0 USD total and a category, but not the product name, "
            "ASIN, or product photo. Identified products come from Notion or "
            "from an order-history CSV. The importer does not visit Amazon."
        ),
    }
    include_paid = bool(getattr(args, "include_paid", False))
    if args.from_notion:
        from notion_source import query_inventory  # local import keeps tests offline

        groups.append([normalize_product(row, source="notion") for row in query_inventory()])
    for json_path in args.from_json or []:
        groups.append(load_json_inventory(json_path))
    if args.from_csv:
        groups.append(load_csv_inventory(args.from_csv))
    if args.from_vine:
        groups.append([normalize_product(row, source="vine") for row in load_vine_csv(args.from_vine)])
    if getattr(args, "from_orders", None):
        result = load_order_csv(args.from_orders, include_paid=include_paid)
        groups.append([normalize_product(row, source=row.get("source") or "orders-csv") for row in result["products"]])
        meta["excludedPaid"] += int(result.get("excluded_paid") or 0)
    gmail_rows: list[dict[str, Any]] = []
    for gmail_json in getattr(args, "from_gmail_json", None) or []:
        gmail_rows.extend(load_gmail_json(gmail_json))
    if getattr(args, "from_mbox", None):
        gmail_rows.extend(load_mbox(args.from_mbox))
    if getattr(args, "from_gmail", False):
        try:
            query = getattr(args, "gmail_query", None) or DEFAULT_GMAIL_QUERY
            gmail_rows.extend(fetch_gmail_api(query))
        except SystemExit as exc:
            print(exc)
    if gmail_rows:
        identified, unresolved, excluded = split_gmail_items(gmail_rows, include_paid=include_paid)
        groups.append(identified)
        meta["unresolvedZeroCostOrders"].extend(unresolved)
        meta["excludedPaid"] += excluded
        meta["gmailParsed"] = len(gmail_rows)
        meta["gmailIdentified"] = len(identified)
        meta["gmailUnresolved"] = len(unresolved)
    if not groups:
        raise SystemExit(
            "No source given. Use --from-gmail, --from-gmail-json, --from-mbox, "
            "--from-notion, --from-json, --from-csv, --from-orders, and/or --from-vine."
        )
    return merge_products(*groups), meta


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--from-notion", action="store_true", help="Read the Notion inventory (needs NOTION_TOKEN)")
    parser.add_argument(
        "--from-json",
        action="append",
        type=Path,
        default=[],
        help="Local JSON export (repeatable). Later files only fill empty fields.",
    )
    parser.add_argument("--from-csv", type=Path, help="Local inventory CSV")
    parser.add_argument("--from-vine", type=Path, help="Vine order/queue CSV (adds new items only)")
    parser.add_argument(
        "--from-orders",
        type=Path,
        help="Amazon order-history CSV. $0.00 / Vine rows are queued; paid rows are skipped unless --include-paid.",
    )
    parser.add_argument("--from-gmail", action="store_true", help="Read Gmail via API (OAuth env vars, pending; read-only)")
    parser.add_argument(
        "--from-gmail-json",
        action="append",
        type=Path,
        default=[],
        help="Gmail JSON snapshot or connector export (repeatable, read-only)",
    )
    parser.add_argument("--from-mbox", type=Path, help="Gmail mbox export (read-only)")
    parser.add_argument("--gmail-query", default=DEFAULT_GMAIL_QUERY, help="Gmail search query for --from-gmail")
    parser.add_argument(
        "--include-paid",
        action="store_true",
        help="Also queue paid (non-zero) Gmail / order-CSV items. Off by default.",
    )
    parser.add_argument("--snapshot", type=Path, default=DEFAULT_SNAPSHOT, help="Where to write the sanitized snapshot")
    parser.add_argument("--write-reviews", action="store_true", help="Write reviews/<slug>/ folders")
    parser.add_argument("--images-dir", type=Path, default=None, help="Folder of Final Review Photos (slug subfolders ok)")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing review.md files (off by default)")
    parser.add_argument(
        "--archive-demo",
        action="store_true",
        help="Archive the demo placeholder photo (does not delete it)",
    )
    parser.add_argument("--open-import-pr", action="store_true", help="Open or update the draft import PR")
    args = parser.parse_args(argv)

    root = args.root.resolve()
    if args.archive_demo:
        archive_demo(root)
    products, meta = load_sources(args)

    written = skipped = 0
    if args.write_reviews:
        for item in products:
            _folder, did_write, did_skip = write_review_folder(
                root, item, args.images_dir, overwrite=args.overwrite
            )
            image_dir = root / "reviews" / item["slug"] / "images"
            has_photo = folder_has_photo(image_dir)
            item["hasFinalPhoto"] = has_photo
            item["missingFields"] = missing_fields(item, has_photo=has_photo)
            item["needsReview"] = needs_review(item)
            if did_write:
                written += 1
                print(f"Wrote reviews/{item['slug']}/")
            elif did_skip:
                skipped += 1
                print(f"Kept existing reviews/{item['slug']}/ (use --overwrite to replace)")

    snapshot = args.snapshot if args.snapshot.is_absolute() else root / args.snapshot
    write_snapshot(snapshot, products, extra=meta)
    print(f"\nImported {len(products)} product(s). Wrote snapshot {args.snapshot}.")
    if meta.get("gmailParsed") is not None:
        print(
            f"Gmail: parsed {meta['gmailParsed']}, identified {meta['gmailIdentified']}, "
            f"unresolved $0 orders {meta['gmailUnresolved']}, excluded paid {meta['excludedPaid']}."
        )
        print(meta.get("gmailNote") or "")
    if args.write_reviews:
        print(f"Review folders written: {written}; kept as-is: {skipped}.")
    print("Needs review / missing fields:")
    for item in products:
        missing = item.get("missingFields") or []
        flag = "needs review" if item.get("needsReview") else "complete"
        extra = f" (missing: {', '.join(missing)})" if missing else ""
        print(f"  - {item['slug']}: {flag}{extra}")
    unresolved = meta.get("unresolvedZeroCostOrders") or []
    if unresolved:
        print(f"{len(unresolved)} $0 Gmail order(s) have no product name or ASIN in the email.")
        # Do not print more than a compact category/date tally.
        tallies: dict[str, int] = {}
        for row in unresolved:
            key = (row.get("sourceCategory") or "unknown") + " @ " + (row.get("orderDate") or "undated")
            tallies[key] = tallies.get(key, 0) + 1
        for key, count in list(tallies.items())[:20]:
            print(f"  - {count}x {key}")

    if args.open_import_pr:
        open_import_pr(root, snapshot, products)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
