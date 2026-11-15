from __future__ import annotations

from pathlib import Path

import import_products
from gmail_source import parse_email_dict
from order_csv import parse_order_csv_text
from zero_cost import is_zero_cost, is_zero_amount, has_vine_wording


FIXTURES = Path(__file__).resolve().parent / "fixtures"


def test_zero_cost_detects_amazon_email_totals():
    assert is_zero_cost("Grand Total:\n0.0 USD")
    assert is_zero_cost("Grand Total: $0.00")
    assert is_zero_cost("Total\n0 USD")
    assert is_zero_cost("Total $0.00")
    assert is_zero_cost("This is an Amazon Vine item")
    assert is_zero_amount("$0.00")
    assert is_zero_amount("0.00")
    assert not is_zero_cost("Grand Total: $24.99")
    assert not is_zero_amount("$24.99")
    assert has_vine_wording("Vine Voice order")


def test_gmail_parser_extracts_category_and_zero_flag_without_asin():
    item = parse_email_dict(
        {
            "subject": "Ordered 1 item: Outerwear",
            "date": "2026-11-13T11:51:24Z",
            "body": "Arriving Sunday 1 Outerwear item\nGrand Total:\n0.0 USD",
            "htmlBody": "<p>Grand Total: $0.00</p>",
        }
    )
    assert item["zeroCost"] is True
    assert item["sourceCategory"] == "Outerwear"
    assert item["asin"] == ""
    assert item["identified"] is False
    assert item["imageUrl"] == ""
    assert item["orderDate"] == "2026-11-13"


def test_gmail_parser_keeps_asin_and_image_when_present_in_the_email():
    item = parse_email_dict(
        {
            "subject": "Shipped 1 item: Home",
            "date": "2026-10-18",
            "body": "Grand Total: $0.00 https://www.amazon.com/dp/B0H8SSS7JL",
            "htmlBody": '<img src="https://m.media-amazon.com/images/I/71UFbHmybWL._AC_SL1500_.jpg">',
        }
    )
    assert item["asin"] == "B0H8SSS7JL"
    assert item["identified"] is True
    assert "71UFbHmybWL" in item["imageUrl"]
    assert item["zeroCost"] is True


def test_order_csv_keeps_zero_cost_and_drops_paid_by_default():
    text = (FIXTURES / "amazon-orders-sample.csv").read_text(encoding="utf-8")
    default = parse_order_csv_text(text, include_paid=False)
    asins = {row["asin"] for row in default["products"]}
    assert asins == {"B0EXAMPLE01", "B0EXAMPLE03"}
    assert default["excluded_paid"] == 1
    included = parse_order_csv_text(text, include_paid=True)
    assert {row["asin"] for row in included["products"]} == {"B0EXAMPLE01", "B0EXAMPLE02", "B0EXAMPLE03"}


def test_merge_fills_empty_review_fields_without_inventing():
    notion = import_products.normalize_product(
        {
            "id": "abc",
            "name": "Toploader Binder 9-Pocket Black - Migeec",
            "asin": "B0HD613SGQ",
            "slug": "toploader-9-pocket-migeec",
            "title": "",
            "body": "",
            "rating": None,
        },
        source="notion",
    )
    sample = import_products.normalize_product(
        {
            "id": "abc",
            "name": "Toploader Binder 9-Pocket Black - Migeec",
            "asin": "B0HD613SGQ",
            "slug": "toploader-9-pocket-migeec",
            "title": "Solid 9-pocket toploader binder with toploaders included",
            "body": "This black PU leather toploader binder holds 288 cards.",
            "rating": None,
        },
        source="json",
    )
    merged = import_products.merge_products([notion], [sample])
    assert len(merged) == 1
    assert merged[0]["title"].startswith("Solid 9-pocket")
    assert "holds 288" in merged[0]["body"]
    # existing text would not be overwritten
    notion2 = import_products.normalize_product(
        {
            "id": "abc",
            "name": "Toploader Binder 9-Pocket Black - Migeec",
            "asin": "B0HD613SGQ",
            "slug": "toploader-9-pocket-migeec",
            "title": "Keep this title",
            "body": "Keep this body",
        },
        source="notion",
    )
    merged2 = import_products.merge_products([notion2], [sample])
    assert merged2[0]["title"] == "Keep this title"
    assert merged2[0]["body"] == "Keep this body"


def test_importer_from_json_and_gmail_snapshot(tmp_path: Path):
    root = tmp_path
    snapshot = tmp_path / "queue.json"
    rc = import_products.main(
        [
            "--root",
            str(root),
            "--from-json",
            str(FIXTURES / "notion-inventory.json"),
            "--from-json",
            str(FIXTURES / "sample-inventory.json"),
            "--from-gmail-json",
            str(FIXTURES / "gmail-zero-cost-snapshot.json"),
            "--snapshot",
            str(snapshot),
        ]
    )
    assert rc == 0
    data = __import__("json").loads(snapshot.read_text(encoding="utf-8"))
    slugs = {row["slug"] for row in data["products"]}
    assert "toploader-9-pocket-migeec" in slugs
    migeec = next(row for row in data["products"] if row["slug"] == "toploader-9-pocket-migeec")
    assert migeec["title"]
    assert migeec["body"]
    assert data["gmailIdentified"] == 0
    assert data["gmailUnresolved"] == 2
    assert data["excludedPaid"] == 0
    for row in data["products"]:
        assert "orderId" not in row
        assert "address" not in row
        body = row.get("body") or ""
        assert "111-" not in body


def test_placeholder_svg_is_not_a_real_photo(tmp_path: Path):
    image_dir = tmp_path / "images"
    image_dir.mkdir()
    (image_dir / "final-review.svg").write_text("<svg></svg>")
    assert import_products.folder_has_photo(image_dir) is False
    (image_dir / "final-review.jpg").write_bytes(b"jpeg")
    assert import_products.folder_has_photo(image_dir) is True
