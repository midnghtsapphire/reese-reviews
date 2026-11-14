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


def test_duplicate_asin_against_local_ledger_fails(examples: Path) -> None:
    report = run_checks(
        examples / "EXAMPLE-review-fail-duplicate.yml",
        pack_name="reviews",
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert report["overall"] == "FAIL"
    assert "REV-DUPLICATE-ASIN-001" in _ids(report, "FAIL")


def test_profanity_and_personal_attack_fail(examples: Path) -> None:
    report = run_checks(
        examples / "EXAMPLE-review-fail-profanity.yml",
        pack_name="reviews",
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert report["overall"] == "FAIL"
    assert "REV-PROFANITY-001" in _ids(report, "FAIL")


def test_stock_ai_phrasing_warns(examples: Path) -> None:
    report = run_checks(
        examples / "EXAMPLE-review-warn-ai-tone.yml",
        pack_name="reviews",
        ledger_path=examples / "EXAMPLE-ledger.csv",
    )
    assert report["overall"] == "WARN"
    assert "REV-AI-TONE-001" in _ids(report, "WARN")
    assert "REV-PHOTOS-OWN-001" in _ids(report, "WARN")
    assert report["fail_count"] == 0


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
    import yaml

    pack = yaml.safe_load((packs / "reviews.yaml").read_text(encoding="utf-8"))
    length_rules = [rule for rule in pack["rules"] if rule.get("check") == "length"]
    assert length_rules == []
    text = (packs / "reviews.yaml").read_text(encoding="utf-8")
    assert "do not state a character limit" in text


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
