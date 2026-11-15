#!/usr/bin/env python3
"""Entry point for the in-repo review-poster agent (not a Grok bot)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Review poster: publish to the Reese Reviews site, or fill Amazon one field at a time."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    site = sub.add_parser("site", help="Publish merged reviews/ folders to the website")
    site.add_argument("--root", type=Path, default=None)

    amazon = sub.add_parser("amazon", help="Fill the Amazon form on Audrey's computer, then stop")
    amazon.add_argument("--slug", required=True)
    amazon.add_argument("--delay", default="3-6")
    amazon.add_argument("--allow-self-hosted", action="store_true")
    amazon.add_argument("--dry-run", action="store_true")
    amazon.add_argument("--user-data-dir", default="")

    args, rest = parser.parse_known_args(argv)
    if args.command == "site":
        from publish_to_site import main as site_main
        return site_main(rest if args.root is None else ["--root", str(args.root), *rest])
    if args.command == "amazon":
        from amazon_poster import main as amazon_main
        flags = ["--slug", args.slug, "--delay", args.delay]
        if args.allow_self_hosted:
            flags.append("--allow-self-hosted")
        if args.dry_run:
            flags.append("--dry-run")
        if args.user_data_dir:
            flags.extend(["--user-data-dir", args.user_data_dir])
        return amazon_main(flags)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
