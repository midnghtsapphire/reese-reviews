"""Load a rule pack and run every rule against one document."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import json

import yaml

from amazon_rules.checks import RESULT_FAIL, RESULT_WARN, evaluate_rule
from amazon_rules.normalize import normalize_book, normalize_review

PACKS_DIR = Path(__file__).resolve().parent.parent / "packs"
EXPORT_PATH = Path(__file__).resolve().parent.parent / "exports" / "amazon-rules.json"

APPLIES = {"reviews": "Reviews", "kdp": "KDP", "resale": "Resale"}

def parse_enabled(value, default: int = 1) -> int:
    """Return 1 (on) or 0 (off). Missing or unreadable values default to 1."""
    if value is None or value == "":
        return default
    try:
        return 0 if int(float(str(value).strip())) == 0 else 1
    except (TypeError, ValueError):
        return default


def rule_is_enabled(rule: dict[str, Any]) -> bool:
    return parse_enabled(rule.get("enabled"), default=1) == 1


def skipped_result(rule: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": rule.get("id") or "",
        "severity": rule.get("severity") or "",
        "result": "skipped (off)",
        "message": "skipped (off)",
        "detail": "Enabled is 0, so this rule was not checked",
        "evidence": [],
        "skipped": True,
        "source_kind": rule.get("source_kind") or "official",
        "source_url": rule.get("source_url") or "",
        "source_quote": rule.get("source_quote") or "",
        "house_attribution": rule.get("house_attribution") or "",
        "enabled": 0,
    }




def default_export_path() -> Path:
    return EXPORT_PATH


def default_pack_path(name: str) -> Path:
    if EXPORT_PATH.exists():
        return EXPORT_PATH
    return PACKS_DIR / f"{name}.yaml"


def _pack_from_export(data: dict[str, Any], pack_name: str | None) -> dict[str, Any]:
    rows = data.get("rules") or []
    if pack_name:
        label = APPLIES.get(pack_name, pack_name)
        rows = [row for row in rows if row.get("applies_to") == label]
    rules = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        if isinstance(row.get("engine"), dict):
            rule = dict(row["engine"])
            if "enabled" not in rule:
                rule["enabled"] = parse_enabled(row.get("enabled"), default=1)
            else:
                rule["enabled"] = parse_enabled(rule.get("enabled"), default=1)
        else:
            rule = dict(row)
            rule["enabled"] = parse_enabled(row.get("enabled"), default=1)
        rules.append(rule)
    return {
        "pack": pack_name or data.get("pack") or "reviews",
        "title": data.get("source") or data.get("title") or "Amazon Rules",
        "version": data.get("exported") or data.get("version") or "",
        "source": data.get("source_url") or data.get("source") or "",
        "notes": data.get("notes") or [],
        "unverified": data.get("unverified") or [],
        "rules": rules,
    }


def load_pack(path: Path, pack_name: str | None = None) -> dict[str, Any]:
    if path.suffix.lower() == ".json":
        with path.open(encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, dict):
            raise ValueError(f"Rule export {path} must be a JSON object")
        return _pack_from_export(data, pack_name)
    with path.open(encoding="utf-8") as handle:
        pack = yaml.safe_load(handle)
    if not isinstance(pack, dict) or "rules" not in pack:
        raise ValueError(f"Rule pack {path} must be a mapping with a 'rules' list")
    if not isinstance(pack["rules"], list):
        raise ValueError(f"Rule pack {path} has a non-list 'rules' value")
    return pack


def load_document(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        data = yaml.safe_load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"{path} must be a YAML mapping")
    return data


def detect_pack_name(document: dict[str, Any], requested: str | None) -> str:
    if requested:
        return requested
    if document.get("pack"):
        return str(document["pack"])
    if "asin" in document or "body" in document or "review_source" in document:
        return "reviews"
    return "kdp"


def normalize_document(document: dict[str, Any], pack_name: str) -> dict[str, Any]:
    if pack_name == "kdp":
        return normalize_book(document)
    return normalize_review(document)


def overall_result(results: list[dict[str, Any]]) -> str:
    if any(item["result"] == RESULT_FAIL for item in results):
        return RESULT_FAIL
    if any(item["result"] == RESULT_WARN for item in results):
        return RESULT_WARN
    return "PASS"


def run_checks(
    document_path: Path,
    *,
    pack_name: str | None = None,
    pack_path: Path | None = None,
    ledger_path: Path | None = None,
) -> dict[str, Any]:
    raw = load_document(document_path)
    name = detect_pack_name(raw, pack_name)
    path = pack_path or default_pack_path(name)
    if not path.exists():
        raise FileNotFoundError(f"Rule pack not found: {path}")
    pack = load_pack(path, pack_name=name)
    data = normalize_document(raw, pack.get("pack") or name)
    results = []
    for rule in pack["rules"]:
        if rule_is_enabled(rule):
            results.append(evaluate_rule(rule, data, ledger_path=ledger_path))
        else:
            results.append(skipped_result(rule))
    return {
        "pack": pack.get("pack") or name,
        "pack_title": pack.get("title") or "",
        "pack_version": pack.get("version") or "",
        "pack_path": str(path),
        "document_path": str(document_path),
        "example": bool(raw.get("example") or raw.get("example_only")),
        "document": data,
        "results": results,
        "overall": overall_result(results),
        "fail_count": sum(1 for item in results if item["result"] == RESULT_FAIL),
        "warn_count": sum(1 for item in results if item["result"] == RESULT_WARN),
        "pass_count": sum(1 for item in results if item["result"] == "PASS"),
        "skip_count": sum(1 for item in results if item["result"] == "skipped (off)"),
        "notes": pack.get("notes") or [],
        "unverified": pack.get("unverified") or [],
    }
