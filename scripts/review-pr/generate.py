#!/usr/bin/env python3
"""Build reviews/<slug>/ folders from a sanitized inventory snapshot.

Optionally copies tools/review-image outputs when --images-dir is given.
Use --open-pr to open one draft GitHub PR per product (requires gh).
Does not post to Amazon or write to Notion.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from frontmatter import ReviewDoc, serialize_review, slugify  # noqa: E402

PR_BODY_TEMPLATE = """This review PR was opened by `scripts/review-pr/generate.py`.

It does **not** post to Amazon. The in-repo review-poster agent publishes to the Reese Reviews site only after this PR is merged with the `approved-to-post` label. Amazon posting runs on Audrey's computer and stops so she can press Submit.

## Product
- Name: {product}
- ASIN: {asin}
- URL: {url}
- Folder: `{folder}`

## Checklist
- [ ] Star rating (1-5) is set in review.md
- [ ] Review title is filled
- [ ] Written review is filled
- [ ] Final Review Photo is in `images/` OR `text_only: true`
- [ ] Photos are Audrey's own (not listing shots), unless this is text-only
- [ ] Proofy: APPROVED
- [ ] Audrey's yes
- [ ] Label `approved-to-post` will be applied before merge
"""


def load_inventory(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        return list(data.get("products") or data.get("items") or [])
    if isinstance(data, list):
        return data
    raise SystemExit(f"Unrecognized inventory format: {path}")


def write_review(root: Path, item: dict, images_dir: Path | None) -> Path:
    name = item.get("name") or item.get("product") or "Untitled"
    asin = (item.get("asin") or "").strip()
    slug = item.get("slug") or slugify(name, asin)
    folder = root / "reviews" / slug
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "images").mkdir(exist_ok=True)

    doc = ReviewDoc(
        path=folder / "review.md",
        product=name,
        asin=asin,
        url=item.get("amazonUrl") or item.get("url") or (f"https://www.amazon.com/dp/{asin}" if asin else ""),
        rating=item.get("rating"),
        title=item.get("title") or "",
        status=item.get("status") or "draft",
        slug=slug,
        text_only=bool(item.get("textOnly") or item.get("text_only")),
        category=item.get("category") or "products",
        notion_url=item.get("notionUrl") or item.get("notion_url") or "",
        body=item.get("body") or item.get("review") or "",
    )
    (folder / "review.md").write_text(serialize_review(doc), encoding="utf-8")

    if images_dir:
        matches = list(images_dir.glob(f"*{asin}*")) + list(images_dir.glob(f"*{slug}*"))
        for src in matches:
            if src.is_file():
                dest_name = "final-review" + src.suffix.lower() if "final" in src.name.lower() else src.name
                shutil.copy2(src, folder / "images" / dest_name)
    return folder


def open_draft_pr(root: Path, folder: Path, item: dict) -> None:
    asin = (item.get("asin") or folder.name).strip()
    branch = f"review/{asin or folder.name}"
    product = item.get("name") or folder.name
    rel = folder.relative_to(root)
    body = PR_BODY_TEMPLATE.format(
        product=product,
        asin=asin or "(none)",
        url=item.get("amazonUrl") or item.get("url") or "",
        folder=rel,
    )
    subprocess.run(["git", "checkout", "main"], cwd=root, check=True)
    subprocess.run(["git", "checkout", "-B", branch], cwd=root, check=True)
    subprocess.run(["git", "add", str(rel)], cwd=root, check=True)
    message = f"**Auky:** add review draft for {product} — Auky"
    subprocess.run(["git", "commit", "-m", message], cwd=root, check=False)
    subprocess.run(["git", "push", "-u", "origin", branch], cwd=root, check=True)
    subprocess.run(
        [
            "gh",
            "pr",
            "create",
            "--draft",
            "--title",
            f"Review: {product}",
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


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--inventory",
        type=Path,
        default=SCRIPT_DIR / "fixtures" / "sample-inventory.json",
        help="JSON snapshot of products (sanitized names, ASINs, review drafts)",
    )
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--images-dir", type=Path, default=None, help="Optional folder of tools/review-image outputs")
    parser.add_argument("--open-pr", action="store_true", help="Open one draft PR per product (requires gh)")
    parser.add_argument("--limit", type=int, default=0, help="Optional cap on how many products to generate")
    args = parser.parse_args(argv)

    products = load_inventory(args.inventory)
    if args.limit:
        products = products[: args.limit]
    written = []
    for item in products:
        folder = write_review(args.root, item, args.images_dir)
        written.append((folder, item))
        print(f"Wrote {folder.relative_to(args.root)}")
        if args.open_pr:
            open_draft_pr(args.root, folder, item)
    print(f"\nGenerated {len(written)} review folder(s).")
    if not args.open_pr:
        print("Draft PRs were not opened. Re-run with --open-pr when you want one PR per product.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
