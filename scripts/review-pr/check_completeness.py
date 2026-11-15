#!/usr/bin/env python3
"""Fail a review PR when required Amazon review fields are missing.

Required: rating (1-5), title, written review, and at least one image
unless text_only is true.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from frontmatter import load_review, find_reviews  # noqa: E402

TITLE_MAX = 100


def check_doc(doc) -> list[str]:
    missing: list[str] = []
    if not (isinstance(doc.rating, int) and 1 <= doc.rating <= 5):
        missing.append("rating (1-5)")
    title = (doc.title or "").strip()
    if not title:
        missing.append("title")
    elif len(title) > TITLE_MAX:
        missing.append(f"title is over {TITLE_MAX} characters")
    if not (doc.body or "").strip():
        missing.append("review text")
    if not doc.text_only and not doc.image_files():
        missing.append("image (or set text_only: true)")
    return missing


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root",
        type=Path,
        default=Path.cwd(),
        help="Repository root (default: current directory)",
    )
    parser.add_argument(
        "--report-only",
        action="store_true",
        help="Print missing fields but exit 0. Used on importer/feature branches so "
        "known gaps (empty Notion fields) do not block the merge gate. Review PRs "
        "on review/* branches still fail when fields are missing.",
    )
    args = parser.parse_args(argv)
    paths = find_reviews(args.root)
    if not paths:
        print("No reviews/*/review.md files in this checkout. Completeness check skipped.")
        return 0

    failed = 0
    for path in paths:
        doc = load_review(path)
        missing = check_doc(doc)
        rel = path.relative_to(args.root) if path.is_relative_to(args.root) else path
        if missing:
            failed += 1
            print(f"INCOMPLETE  {rel}: missing {', '.join(missing)}")
        else:
            print(f"COMPLETE    {rel}")

    if failed:
        print(f"\n{failed} review(s) are missing required fields.")
        return 0 if args.report_only else 1
    print(f"\nAll {len(paths)} review(s) have the required fields.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
