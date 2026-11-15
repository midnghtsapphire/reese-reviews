"""Command-line entry: python -m review_image ..."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import __version__
from .fetch import extract_asin, load_from_url_or_asin, looks_like_asin, save_original
from .filters import FILTERS
from .io import default_output_path, load_image, save_image
from .notion_io import (
    download_original,
    instructions_if_no_token,
    notion_token,
    parse_page_id,
)
from .presets import PRESETS, resolve_presets, spec_for
from .process import process_image
from .upload import default_uploader


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
            "Reusable product-image process: copy a photo (local file, URL, "
            "or Amazon ASIN), crop, remove the background, remove overlaid "
            "text and watermarks, apply a filter, and write review / social "
            "/ cutout versions. Optional Notion upload. "
            "Not limited to reviews."
        ),
    )
    p.add_argument(
        "source",
        nargs="?",
        help="Local path, image URL, Amazon product URL, ASIN, or a Notion page URL/ID.",
    )
    p.add_argument(
        "--from-url",
        dest="from_url",
        metavar="URL",
        help="Copy a product image from a direct photo URL or an Amazon listing URL.",
    )
    p.add_argument(
        "--asin",
        metavar="ASIN",
        help="Copy the main image from an Amazon listing (ten-character ASIN).",
    )
    p.add_argument(
        "--notion",
        metavar="PAGE",
        help="Notion item page URL or ID. Reads the Original Product Photo. "
        "With NOTION_TOKEN, can also upload a finished photo. "
        "Does not post to Amazon.",
    )
    p.add_argument(
        "--crop",
        metavar="X,Y,W,H",
        help="Manual crop in pixels (left, top, width, height). "
        "Default: auto-crop to the product with padding.",
    )
    p.add_argument(
        "--no-crop",
        action="store_true",
        help="Skip auto-crop (manual --crop still applies).",
    )
    p.add_argument(
        "--no-background",
        action="store_true",
        help="Skip background removal.",
    )
    p.add_argument(
        "--bg",
        choices=("white", "transparent"),
        default=None,
        help="Background after removal for the review preset. "
        "Default: white. Ignored by --preset social/cutout, which set their own.",
    )
    p.add_argument(
        "--remove-text",
        action="store_true",
        help="Remove overlaid text, watermarks, and badges (corner banners, "
        "SALE / Best Seller style marks). Does not try to erase print on the product.",
    )
    p.add_argument(
        "--filter",
        dest="color_filter",
        choices=FILTERS,
        default="light",
        help="Color filter. Default: light. glass is a gentle VineFlow-inspired "
        "preset. none skips the filter.",
    )
    p.add_argument(
        "--preset",
        choices=PRESETS,
        default="review",
        help="Output preset: review (original-size white background), "
        "social (square 1:1), cutout (transparent PNG), or all. Default: review.",
    )
    p.add_argument(
        "--size",
        type=int,
        default=None,
        metavar="PX",
        help="Square side in pixels for --preset social (default 1080).",
    )
    p.add_argument(
        "--out",
        help="Output path for a single preset. Ignored when --preset all "
        "(files are written next to the input, or in --out-dir).",
    )
    p.add_argument(
        "--out-dir",
        help="Directory for outputs (used with --preset all, or when copying "
        "from a URL/ASIN with no local path).",
    )
    p.add_argument(
        "--save-original",
        help="Where to save the copied original (URL/ASIN). "
        "Default: <out-dir-or-cwd>/original.jpg.",
    )
    p.add_argument(
        "--upload-notion",
        action="store_true",
        help="After processing, upload the review (or only) result to the "
        "--notion page. Requires NOTION_TOKEN. Off by default. "
        "Agents using the Notion connector should follow the connector-run "
        "path in the README instead of this flag.",
    )
    p.add_argument("--version", action="version", version=f"review-image {__version__}")
    return p


def _stem_for(local_path: Path | None, out_dir: Path) -> Path:
    if local_path is not None:
        return local_path
    return out_dir / "product.jpg"


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    notion_page = args.notion
    source = args.source
    from_url = args.from_url
    asin = args.asin

    if source and not notion_page and not from_url and not asin:
        if _looks_like_notion(source):
            notion_page = source
            source = None
        elif looks_like_asin(source) or extract_asin(source or ""):
            # Bare ASIN or Amazon URL passed as the positional source.
            if looks_like_asin(source) or "amazon." in source.lower():
                asin = source
                source = None

    if not source and not notion_page and not from_url and not asin:
        build_parser().print_help()
        return 2

    local_path: Path | None = None
    source_url: str | None = None
    original_saved: Path | None = None

    if notion_page:
        if not notion_token():
            sys.stderr.write(instructions_if_no_token())
            return 2
        original = download_original(notion_page)
    elif from_url or asin:
        try:
            original, source_url = load_from_url_or_asin(from_url or asin)
        except Exception as exc:
            sys.stderr.write(f"Could not copy the product image: {exc}\n")
            return 2
    else:
        # Positional: local file or direct image URL (already classified above).
        if source and (source.startswith("http://") or source.startswith("https://")):
            try:
                original, source_url = load_from_url_or_asin(source)
            except Exception as exc:
                sys.stderr.write(f"Could not copy the product image: {exc}\n")
                return 2
        else:
            original, local_path = load_image(source)

    out_dir = Path(args.out_dir).expanduser() if args.out_dir else (
        local_path.parent if local_path is not None else Path.cwd()
    )
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.save_original or from_url or asin:
        dest_orig = Path(args.save_original).expanduser() if args.save_original else out_dir / "original.jpg"
        original_saved = save_original(original, dest_orig)
        print(f"Copied original: {original_saved}" + (f" (from {source_url})" if source_url else ""))

    presets = resolve_presets(args.preset)
    written: list[Path] = []
    review_image = None
    stem = _stem_for(local_path, out_dir)

    for name in presets:
        spec = spec_for(name, social_size=args.size)
        bg = args.bg if (name == "review" and args.bg) else spec.background
        result = process_image(
            original,
            crop=args.crop,
            background=bg,
            color_filter=args.color_filter,
            remove_text=args.remove_text,
            do_crop=not args.no_crop or bool(args.crop),
            do_background=not args.no_background,
            preset=name,
            social_size=args.size,
        )
        if name == "review":
            review_image = result
        if args.out and len(presets) == 1:
            dest = Path(args.out).expanduser()
        else:
            dest = default_output_path(stem, background=bg, preset=name)
            if local_path is None:
                dest = out_dir / dest.name
        saved = save_image(result, dest, background=bg)
        written.append(saved)
        label = "Final Review Photo" if name == "review" else name
        print(f"Wrote {label}: {saved} ({result.size[0]}x{result.size[1]})")

    if review_image is not None:
        print(
            f"Review canvas: {review_image.size[0]}x{review_image.size[1]} "
            f"(original {original.size[0]}x{original.size[1]})"
        )

    if args.upload_notion:
        if not notion_page:
            sys.stderr.write("--upload-notion requires --notion PAGE\n")
            return 2
        if not notion_token():
            sys.stderr.write(instructions_if_no_token())
            return 2
        to_upload = review_image
        if to_upload is None:
            # e.g. --preset cutout only
            to_upload = process_image(
                original,
                crop=args.crop,
                background="white",
                color_filter=args.color_filter,
                remove_text=args.remove_text,
                do_crop=not args.no_crop or bool(args.crop),
                do_background=not args.no_background,
                preset="review",
            )
        default_uploader().upload(notion_page, to_upload)
        print("Uploaded to the Notion page (token path). Existing content was left in place.")
    return 0
