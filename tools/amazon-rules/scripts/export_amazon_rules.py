#!/usr/bin/env python3
"""Export the Amazon Rules Notion database into files the optional engine can load.

The Notion database is the source of truth:
https://app.notion.com/p/4182aa319908811288d7cc88a4304b8b

Usage:
  python scripts/export_amazon_rules.py
  python scripts/export_amazon_rules.py --from-json path/to/export.json
  python scripts/export_amazon_rules.py --from-csv path/to/export.csv

With no input path, the checked-in snapshot at exports/amazon-rules.json is used.
A Notion CSV or JSON export can be passed instead after a fresh download.
This script writes exports/amazon-rules.json, exports/amazon-rules.csv,
and packs/reviews.yaml plus packs/kdp.yaml.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPORTS = ROOT / "exports"
PACKS = ROOT / "packs"
NOTION_DB = "https://app.notion.com/p/4182aa319908811288d7cc88a4304b8b"
SNAPSHOT = EXPORTS / "amazon-rules.json"

CSV_FIELDS = [
    "Rule ID",
    "Rule",
    "Applies To",
    "Type",
    "Severity",
    "Check",
    "Pattern",
    "Source URL",
    "Source Quote",
    "Date Checked",
]

APPLIES = {"reviews": "Reviews", "kdp": "KDP", "resale": "Resale"}


def _norm_header(name: str) -> str:
    return " ".join(name.strip().split()).lower()


def _pick(row: dict, *names: str) -> str:
    lowered = {_norm_header(k): v for k, v in row.items()}
    for name in names:
        value = lowered.get(_norm_header(name))
        if value not in (None, ""):
            return value if isinstance(value, str) else str(value)
    return ""


def _engine_from_row(row: dict) -> dict:
    if isinstance(row.get("engine"), dict):
        return dict(row["engine"])
    rule_id = _pick(row, "Rule ID", "rule_id", "id")
    check = _pick(row, "Check", "check_type", "check").lower()
    pattern = _pick(row, "Pattern", "pattern")
    severity = _pick(row, "Severity", "severity").lower() or "fail"
    message = _pick(row, "Rule", "rule", "message")
    engine = {
        "id": rule_id,
        "severity": "warn" if severity == "warn" else "fail",
        "check": check or "regex",
        "message": message,
        "source_kind": "official" if _pick(row, "Type", "type").lower() != "house" else "house_rule",
        "source_url": _pick(row, "Source URL", "source_url"),
        "source_quote": _pick(row, "Source Quote", "source_quote"),
        "fetched": _pick(row, "Date Checked", "date_checked"),
    }
    if check == "regex" and pattern:
        engine["pattern"] = pattern
        engine["fields"] = ["title", "body"]
    elif check == "keyword" and pattern and pattern != "keyword":
        engine["keywords"] = [part.strip() for part in pattern.split(",") if part.strip()]
        engine["fields"] = ["title", "body"]
    elif check == "field" and pattern:
        parts = pattern.split()
        if "field" in parts:
            idx = parts.index("field")
            if idx + 1 < len(parts):
                engine["field"] = parts[idx + 1]
        if "range" in parts:
            engine["op"] = "range"
        elif "eq" in parts:
            engine["op"] = "eq"
        elif "in" in parts:
            engine["op"] = "in"
        for part in parts:
            if part.startswith("min="):
                engine["min"] = int(part.split("=", 1)[1])
            elif part.startswith("max="):
                engine["max"] = int(part.split("=", 1)[1])
            elif part.startswith("values="):
                engine["values"] = part.split("=", 1)[1].split(",")
    return engine


def rows_from_snapshot(data: dict) -> list[dict]:
    if "rules" in data and isinstance(data["rules"], list):
        return list(data["rules"])
    if "pages" in data and isinstance(data["pages"], list):
        return data["pages"]
    raise ValueError("JSON export must have a 'rules' or 'pages' list")


def load_json(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    if not isinstance(data, dict):
        raise ValueError(f"{path} is not a JSON object or list")
    return rows_from_snapshot(data)


def load_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def normalize_rows(raw_rows: list[dict]) -> list[dict]:
    rows = []
    for raw in raw_rows:
        rule_id = _pick(raw, "Rule ID", "rule_id", "id")
        if not rule_id:
            continue
        applies = _pick(raw, "Applies To", "applies_to") or "Reviews"
        row = {
            "rule_id": rule_id,
            "rule": _pick(raw, "Rule", "rule", "message"),
            "applies_to": applies,
            "type": _pick(raw, "Type", "type") or "Official",
            "severity": _pick(raw, "Severity", "severity") or "Fail",
            "check_type": _pick(raw, "Check", "check_type", "check"),
            "pattern": _pick(raw, "Pattern", "pattern"),
            "source_url": _pick(raw, "Source URL", "source_url"),
            "source_quote": _pick(raw, "Source Quote", "source_quote"),
            "date_checked": _pick(raw, "Date Checked", "date_checked") or "2026-11-14",
            "engine": _engine_from_row(raw),
        }
        rows.append(row)
    return rows


def write_csv(rows: list[dict], path: Path) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow({
                "Rule ID": row["rule_id"],
                "Rule": row["rule"],
                "Applies To": row["applies_to"],
                "Type": row["type"],
                "Severity": row["severity"],
                "Check": row["check_type"],
                "Pattern": row["pattern"],
                "Source URL": row["source_url"],
                "Source Quote": row["source_quote"],
                "Date Checked": row["date_checked"],
            })


def write_pack(rows: list[dict], pack_name: str, path: Path) -> None:
    label = APPLIES[pack_name]
    rules = [row["engine"] for row in rows if row["applies_to"] == label]
    doc = {
        "pack": pack_name,
        "title": f"Amazon {label} rules (export of {NOTION_DB})",
        "version": "2026-11-14",
        "fetched": "2026-11-14",
        "timezone": "America/Denver",
        "source": NOTION_DB,
        "notes": [
            "Generated from an export of the Amazon Rules Notion database, which is the source of truth.",
            "Official public help pages do not state a character limit, a maximum number of photos, a maximum video length, or a maximum file size. This pack therefore has no length bounds.",
        ],
        "rules": rules,
    }
    text = yaml_dump(doc)
    path.write_text(text, encoding="utf-8")


def yaml_dump(doc: dict) -> str:
    import yaml

    return yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=100)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--from-json", type=Path, default=None)
    parser.add_argument("--from-csv", type=Path, default=None)
    args = parser.parse_args(argv)
    if args.from_json and args.from_csv:
        print("amazon-rules export: pass only one of --from-json or --from-csv", file=sys.stderr)
        return 2
    source = args.from_json or args.from_csv or SNAPSHOT
    if not source.exists():
        print(f"amazon-rules export: file not found: {source}", file=sys.stderr)
        return 2
    raw = load_csv(source) if args.from_csv or source.suffix.lower() == ".csv" else load_json(source)
    rows = normalize_rows(raw)
    EXPORTS.mkdir(parents=True, exist_ok=True)
    PACKS.mkdir(parents=True, exist_ok=True)
    snapshot = {
        "source": "Amazon Rules",
        "source_url": NOTION_DB,
        "exported": "2026-11-14",
        "timezone": "America/Denver",
        "notes": [
            "Notion database Amazon Rules is the source of truth.",
            "This file is an export used by the optional amazon-rules engine.",
            "Official text rules only. No photo or image rules, and no extra house rules.",
        ],
        "rules": rows,
    }
    if not args.from_csv:
        # Preserve engine blocks from a JSON snapshot when rewriting outputs.
        (EXPORTS / "amazon-rules.json").write_text(
            json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
    write_csv(rows, EXPORTS / "amazon-rules.csv")
    write_pack(rows, "reviews", PACKS / "reviews.yaml")
    write_pack(rows, "kdp", PACKS / "kdp.yaml")
    print(f"Wrote {len(rows)} rules from {source} to {EXPORTS} and {PACKS}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
