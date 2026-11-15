"""Command-line entry: python -m review_image ..."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import __version__
from .filters import FILTERS
from .io import default_output_path, load_image, save_image
from .notion_io import (
    download_original,
    instructions_if_no_token,
    notion_token,
    parse_page_id,
    upload_final_photo,
)
from .process import process_image


def _looks_like_notion(value: str) -> bool:
    lowered = value.lower()
    if "notion.so" in lowered or "notion.com" in lowered:
        return True
    try:
        parse_page_id(value)
        return True
    except ValueError:
        return False


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="python -m review_image",
        description=(
            "Turn an Original Product Photo into a Final Review Photo: "
            "crop, remove the background, apply a light filter, and match "
            "the original pixel size. Photos must be Audrey's own photos "
            "of the product (Amazon community guidelines)."
        ),
    )
    p.add_argument(
        "source",
        nargs="?",
        help="Local path, image URL, or a Notion item page URL/ID.",
    )
    p.add_argument(
        "--notion",
        metavar="PAGE",
        help="Notion item page URL or ID (Amazon Resale Inventory). "
        "Reads the Original Product Photo. With NOTION_TOKEN, can also "
        "upload the Final Review Photo. Does not post to Amazon.",
    )
    p.add_argument(
        "--crop",
        metavar="X,Y,W,H",
        help="Manual crop in pixels (left, top, width, height). "
        "Default: auto-crop to the product with padding.",
    )
    p.add_argument(
        "--bg",
        choices=("white", "transparent"),
        default="white",
        help="Background after removal. Default: white.",
    )
    p.add_argument(
        "--filter",
        dest="color_filter",
        choices=FILTERS,
        default="light",
        help="Color filter. Default: light (Notion look). "
        "glass is a gentle VineFlow-inspired preset. none skips the filter.",
    )
    p.add_argument(
        "--out",
        help="Output path. Default: <name>-final-review.jpg next to the input.",
    )
    p.add_argument(
        "--upload-notion",
        action="store_true",
        help="After processing a --notion page, upload the Final Review Photo "
        "back to that page. Requires NOTION_TOKEN. Off by default.",
    )
    p.add_argument("--version", action="version", version=f"review-image {__version__}")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    notion_page = args.notion
    source = args.source
    if source and not notion_page and _looks_like_notion(source):
        notion_page = source
        source = None
    if not source and not notion_page:
        build_parser().print_help()
        return 2

    local_path: Path | None = None
    if notion_page:
        if not notion_token():
            sys.stderr.write(instructions_if_no_token())
            return 2
        original = download_original(notion_page)
    else:
        original, local_path = load_image(source)

    result = process_image(
        original,
        crop=args.crop,
        background=args.bg,
        color_filter=args.color_filter,
    )

    if args.out:
        dest = Path(args.out).expanduser()
    elif local_path is not None:
        dest = default_output_path(local_path, background=args.bg)
    else:
        dest = Path.cwd() / default_output_path(
            Path("notion-original.jpg"), background=args.bg
        ).name

    saved = save_image(result, dest, background=args.bg)
    print(f"Wrote Final Review Photo: {saved}")
    print(f"Size: {result.size[0]}x{result.size[1]} (matches original {original.size[0]}x{original.size[1]})")

    if args.upload_notion:
        if not notion_page:
            sys.stderr.write("--upload-notion requires --notion PAGE\n")
            return 2
        if not notion_token():
            sys.stderr.write(instructions_if_no_token())
            return 2
        upload_final_photo(notion_page, result)
        print("Uploaded Final Review Photo to the Notion page.")
    return 0
