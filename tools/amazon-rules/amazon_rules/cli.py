"""CLI: amazon-rules check review.yml

Exit codes:
  0  PASS or WARN (no FAIL)
  1  one or more FAIL
  2  usage or file error
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from amazon_rules.engine import default_pack_path, run_checks
from amazon_rules.report import render_markdown


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="amazon-rules",
        description=(
            "Check one Amazon review or KDP book file against a YAML rule pack. "
            "This tool never posts to Amazon or KDP."
        ),
    )
    sub = parser.add_subparsers(dest="command", required=True)

    check = sub.add_parser("check", help="Run the rule pack against one YAML file")
    check.add_argument("file", type=Path, help="Path to the review or book YAML file")
    check.add_argument(
        "--pack",
        choices=["reviews", "kdp"],
        default=None,
        help="Rule pack to use (default: infer from the file, else reviews)",
    )
    check.add_argument(
        "--rules",
        type=Path,
        default=None,
        help="Override path to a rule-pack YAML file",
    )
    check.add_argument(
        "--ledger",
        type=Path,
        default=None,
        help="Local CSV ledger for one-review-per-ASIN checks",
    )
    check.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Write the markdown report to this path as well as stdout",
    )
    return parser


def default_ledger(pack_name: str) -> Path | None:
    if pack_name != "reviews":
        return None
    candidate = Path(__file__).resolve().parent.parent / "examples" / "EXAMPLE-ledger.csv"
    return candidate if candidate.exists() else None


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command != "check":
        parser.print_help()
        return 2

    document = args.file
    if not document.exists():
        print(f"amazon-rules: file not found: {document}", file=sys.stderr)
        return 2

    pack_name = args.pack
    pack_path = args.rules
    if pack_path is None and pack_name:
        pack_path = default_pack_path(pack_name)
    ledger = args.ledger
    if ledger is None:
        ledger = default_ledger(pack_name or "reviews")

    try:
        report = run_checks(
            document,
            pack_name=pack_name,
            pack_path=pack_path,
            ledger_path=ledger,
        )
    except Exception as exc:  # noqa: BLE001 — CLI must surface any pack/file error
        print(f"amazon-rules: {exc}", file=sys.stderr)
        return 2

    markdown = render_markdown(report)
    sys.stdout.write(markdown)
    if not markdown.endswith("\n"):
        sys.stdout.write("\n")
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(markdown, encoding="utf-8")

    return 1 if report["overall"] == "FAIL" else 0
