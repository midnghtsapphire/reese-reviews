"""Unit tests for the reviews rule pack. All fixtures are labeled EXAMPLE ONLY."""

from __future__ import annotations

from pathlib import Path

import pytest

from amazon_rules.cli import main
from amazon_rules.engine import run_checks


def _ids(report, result=None):
    items = report["results"]
    if result:
        items = [item for item in items if item["result"] == result]
    return {item["id"] for item in items}


def test_good_sample_review_passes(examples: Path) -> None:
    report = run_checks(
        examples / "EXAMPLE-review-pass.yml",
        pack_name="reviews",
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert report["example"] is True
    assert report["overall"] == "PASS"
    assert report["fail_count"] == 0
    assert "REV-USED-REQUIRED-001" not in _ids(report, "FAIL")
    assert "REV-AFFILIATE-001" not in _ids(report, "FAIL")


def test_affiliate_and_short_link_fail(examples: Path) -> None:
    report = run_checks(
        examples / "EXAMPLE-review-fail-affiliate.yml",
        pack_name="reviews",
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert report["overall"] == "FAIL"
    assert "REV-AFFILIATE-001" in _ids(report, "FAIL")
    affiliate = next(item for item in report["results"] if item["id"] == "REV-AFFILIATE-001")
    evidence = " ".join(affiliate["evidence"])
    assert "tag=" in evidence.lower() or "amzn.to" in evidence.lower()


def test_unused_item_that_claims_use_fails(examples: Path) -> None:
    report = run_checks(
        examples / "EXAMPLE-review-fail-unused-claim.yml",
        pack_name="reviews",
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert report["overall"] == "FAIL"
    assert "REV-USED-REQUIRED-001" in _ids(report, "FAIL")
    assert "REV-USED-CLAIM-001" in _ids(report, "FAIL")


def test_medical_cure_claim_fails(examples: Path) -> None:
    report = run_checks(
        examples / "EXAMPLE-review-fail-medical.yml",
        pack_name="reviews",
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert report["overall"] == "FAIL"
    assert "REV-MEDICAL-001" in _ids(report, "FAIL")


def test_contact_and_external_url_fail(examples: Path) -> None:
    report = run_checks(
        examples / "EXAMPLE-review-fail-contact-external.yml",
        pack_name="reviews",
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert report["overall"] == "FAIL"
    assert "REV-CONTACT-001" in _ids(report, "FAIL")
    assert "REV-EXTERNAL-URL-001" in _ids(report, "FAIL")


def test_compensation_language_fails_when_not_vine(examples: Path) -> None:
    report = run_checks(
        examples / "EXAMPLE-review-fail-compensation.yml",
        pack_name="reviews",
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert report["overall"] == "FAIL"
    assert "REV-COMPENSATION-001" in _ids(report, "FAIL")



def test_profanity_and_personal_attack_fail(examples: Path) -> None:
    report = run_checks(
        examples / "EXAMPLE-review-fail-profanity.yml",
        pack_name="reviews",
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert report["overall"] == "FAIL"
    assert "REV-PROFANITY-001" in _ids(report, "FAIL")



def test_vine_disclosed_free_product_does_not_fail(examples: Path) -> None:
    report = run_checks(
        examples / "EXAMPLE-review-vine-ok-free.yml",
        pack_name="reviews",
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert "REV-FREE-PRODUCT-001" not in _ids(report, "FAIL")
    assert report["overall"] == "PASS"


def test_ordinary_use_language_is_not_a_medical_claim(examples: Path) -> None:
    report = run_checks(
        examples / "EXAMPLE-review-pass.yml",
        pack_name="reviews",
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert "REV-MEDICAL-001" not in _ids(report, "FAIL")


def test_no_length_rule_invents_a_numeric_bound(packs: Path) -> None:
    import json
    import yaml

    pack = yaml.safe_load((packs / "reviews.yaml").read_text(encoding="utf-8"))
    length_rules = [rule for rule in pack["rules"] if rule.get("check") == "length"]
    assert length_rules == []
    text = (packs / "reviews.yaml").read_text(encoding="utf-8")
    assert "do not state a character limit" in text
    export = json.loads((packs.parent / "exports" / "amazon-rules.json").read_text(encoding="utf-8"))
    ids = {row["rule_id"] for row in export["rules"]}
    assert "REV-PHOTOS-OWN-001" not in ids
    assert "REV-PHOTOS-OWNER-FIELD-001" not in ids
    assert "REV-AI-TONE-001" not in ids
    assert all(row["type"] == "Official" for row in export["rules"])
    assert all(row["engine"].get("source_kind") == "official" for row in export["rules"])


def test_engine_reads_the_export_by_default(examples: Path) -> None:
    from amazon_rules.engine import default_pack_path, run_checks

    path = default_pack_path("reviews")
    assert path.name == "amazon-rules.json"
    report = run_checks(
        examples / "EXAMPLE-review-pass.yml",
        pack_name="reviews",
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert report["pack_path"].endswith("amazon-rules.json")
    assert report["overall"] == "PASS"


def test_cli_exits_nonzero_on_fail(examples: Path, capsys: pytest.CaptureFixture[str]) -> None:
    code = main(
        [
            "check",
            str(examples / "EXAMPLE-review-fail-affiliate.yml"),
            "--pack",
            "reviews",
            "--ledger",
            str(examples / "EXAMPLE-ledger.csv"),
        ]
    )
    captured = capsys.readouterr()
    assert code == 1
    assert "Overall: **FAIL**" in captured.out
    assert "REV-AFFILIATE-001" in captured.out
    assert "— Proofy" in captured.out


def test_cli_exits_zero_on_pass(examples: Path, capsys: pytest.CaptureFixture[str]) -> None:
    code = main(
        [
            "check",
            str(examples / "EXAMPLE-review-pass.yml"),
            "--pack",
            "reviews",
            "--ledger",
            str(examples / "EXAMPLE-ledger.csv"),
        ]
    )
    captured = capsys.readouterr()
    assert code == 0
    assert "Overall: **PASS**" in captured.out
    assert "EXAMPLE ONLY" in captured.out


def _write_export(tmp_path: Path, enabled_map: dict[str, int | None], *, drop_enabled: bool = False) -> Path:
    import copy
    import json

    source = Path(__file__).resolve().parents[1] / "exports" / "amazon-rules.json"
    data = json.loads(source.read_text(encoding="utf-8"))
    rows = []
    for row in data["rules"]:
        row = copy.deepcopy(row)
        if row["rule_id"] in enabled_map:
            value = enabled_map[row["rule_id"]]
            if value is None or drop_enabled:
                row.pop("enabled", None)
                if isinstance(row.get("engine"), dict):
                    row["engine"].pop("enabled", None)
            else:
                row["enabled"] = value
                if isinstance(row.get("engine"), dict):
                    row["engine"]["enabled"] = value
        rows.append(row)
    data["rules"] = rows
    path = tmp_path / "amazon-rules.json"
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    return path


def test_enabled_rule_still_runs(examples: Path, tmp_path: Path) -> None:
    pack = _write_export(tmp_path, {"REV-AFFILIATE-001": 1})
    report = run_checks(
        examples / "EXAMPLE-review-fail-affiliate.yml",
        pack_name="reviews",
        pack_path=pack,
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert report["overall"] == "FAIL"
    assert "REV-AFFILIATE-001" in _ids(report, "FAIL")
    assert report["skip_count"] == 0
    assert "skipped (off)" not in {item["result"] for item in report["results"] if item["id"] == "REV-AFFILIATE-001"}


def test_disabled_rule_is_listed_as_skipped_off(examples: Path, tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    pack = _write_export(tmp_path, {"REV-AFFILIATE-001": 0})
    report = run_checks(
        examples / "EXAMPLE-review-fail-affiliate.yml",
        pack_name="reviews",
        pack_path=pack,
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert "REV-AFFILIATE-001" not in _ids(report, "FAIL")
    skipped = next(item for item in report["results"] if item["id"] == "REV-AFFILIATE-001")
    assert skipped["result"] == "skipped (off)"
    assert skipped["message"] == "skipped (off)"
    assert report["skip_count"] == 1
    assert report["overall"] == "PASS"
    from amazon_rules.report import render_markdown

    markdown = render_markdown(report)
    assert "skipped (off)" in markdown
    assert "`REV-AFFILIATE-001`" in markdown


def test_missing_enabled_defaults_to_on(examples: Path, tmp_path: Path) -> None:
    pack = _write_export(tmp_path, {"REV-AFFILIATE-001": None}, drop_enabled=True)
    report = run_checks(
        examples / "EXAMPLE-review-fail-affiliate.yml",
        pack_name="reviews",
        pack_path=pack,
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert report["overall"] == "FAIL"
    assert "REV-AFFILIATE-001" in _ids(report, "FAIL")
    assert report["skip_count"] == 0
