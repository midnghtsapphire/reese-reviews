"""Load a rule pack and run every rule against one document."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from amazon_rules.checks import RESULT_FAIL, RESULT_WARN, evaluate_rule
from amazon_rules.normalize import normalize_book, normalize_review

PACKS_DIR = Path(__file__).resolve().parent.parent / "packs"


def default_pack_path(name: str) -> Path:
    return PACKS_DIR / f"{name}.yaml"


def load_pack(path: Path) -> dict[str, Any]:
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
    pack = load_pack(path)
    data = normalize_document(raw, pack.get("pack") or name)
    results = [
        evaluate_rule(rule, data, ledger_path=ledger_path)
        for rule in pack["rules"]
    ]
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
        "notes": pack.get("notes") or [],
        "unverified": pack.get("unverified") or [],
    }
