"""Unit tests for the KDP skeleton pack. Fixtures are labeled EXAMPLE ONLY."""

from pathlib import Path

from amazon_rules.engine import run_checks


def _ids(report, result=None):
    items = report["results"]
    if result:
        items = [item for item in items if item["result"] == result]
    return {item["id"] for item in items}


def test_good_sample_book_passes(examples: Path) -> None:
    report = run_checks(examples / "EXAMPLE-kdp-pass.yml", pack_name="kdp")
    assert report["example"] is True
    assert report["overall"] == "PASS"
    assert report["fail_count"] == 0


def test_missing_disclosure_and_wrong_trims_fail(examples: Path) -> None:
    report = run_checks(examples / "EXAMPLE-kdp-fail-disclosure.yml", pack_name="kdp")
    assert report["overall"] == "FAIL"
    failed = _ids(report, "FAIL")
    assert "KDP-AI-DISCLOSE-001" in failed
    assert "KDP-COVER-NO-WORDS-001" in failed
    assert "KDP-TRIM-PB-HOUSE-001" in failed
    assert "KDP-TRIM-HC-HOUSE-001" in failed
    # 7x10 and 6x9 are official supported sizes, so supported-trim rules should pass.
    assert "KDP-TRIM-PB-SUPPORTED-001" not in failed
    assert "KDP-TRIM-HC-SUPPORTED-001" not in failed
    assert "KDP-AI-TEXT-001" in _ids(report, "WARN")
