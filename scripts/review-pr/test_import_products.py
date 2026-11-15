from __future__ import annotations

from pathlib import Path

import import_products
from gmail_source import extract_asins, join_order_emails, load_gmail_json, parse_email_dict
from order_csv import parse_order_csv_text
from zero_cost import explicit_order_total, is_zero_cost, is_zero_amount, has_vine_wording


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


def test_explicit_total_ignores_list_price_without_a_total_label():
    assert explicit_order_total("Grand Total:\n0.0 USD") == 0.0
    assert explicit_order_total("* Sample Widget\n  Quantity: 1\n  30.99 USD") is None
    assert explicit_order_total("Total\n0 USD") == 0.0
    assert explicit_order_total("Grand Total: $24.99") == 24.99


def test_gmail_join_fills_name_asin_and_image_from_later_emails():
    rows = load_gmail_json(FIXTURES / "gmail-order-join.json")
    joined = join_order_emails(rows)
    by_name = {row["name"]: row for row in joined if row.get("name")}
    mat = by_name["Sample Kitchen Mat Set of 2, Washable Anti-Fatigue Mats for Kitchen and Laundry"]
    assert mat["zeroCost"] is True
    assert mat["asin"] == "B0EXAMPL01"
    assert "51EXAMPLESL" in mat["imageUrl"]
    assert mat["cancelled"] is False
    light = by_name["Sample Galaxy Projection Night Light with 12 slides"]
    assert light["zeroCost"] is True
    assert light["asin"] == "B0EXAMPL02"
    assert light["reviewRequested"] is True
    cancelled = next(row for row in joined if row.get("cancelled"))
    assert "Sample Tabi Mary Jane" in cancelled["name"]
    paid = next(row for row in joined if row.get("explicitTotal") == 24.99)
    assert paid["zeroCost"] is False
    assert paid["identified"] is False


def test_gmail_parser_reads_encoded_asin_and_review_event():
    item = parse_email_dict(
        {
            "subject": "Did your recent Amazon order meet your expectations? Review it on Amazon",
            "date": "2026-11-11",
            "body": "Your opinion matters!\n111-0000009-0000009\nhttps://www.amazon.com/review/review-your-purchases/?asin=B0EXAMPL03%3A",
            "htmlBody": '<div class="primary-text-color">Sample Sourdough Snack Minis</div>'
            '<img class="productImage" src="https://m.media-amazon.com/images/I/51EXAMPLEQL._SR500,500_.jpg">',
        }
    )
    assert item["event"] == "review_requested"
    assert item["asin"] == "B0EXAMPL03"
    assert item["name"] == "Sample Sourdough Snack Minis"
    assert "51EXAMPLEQL" in item["imageUrl"]
    assert item["orderNumbers"] == ["111-0000009-0000009"]
    assert extract_asins("https://www.amazon.com/review/review-your-purchases/?asin=B0EXAMPL03%3A") == ["B0EXAMPL03"]


def test_importer_join_fixture_queues_identified_zero_cost_only(tmp_path: Path):
    snapshot = tmp_path / "queue.json"
    rc = import_products.main(
        [
            "--root",
            str(tmp_path),
            "--from-gmail-json",
            str(FIXTURES / "gmail-order-join.json"),
            "--snapshot",
            str(snapshot),
            "--write-reviews",
        ]
    )
    assert rc == 0
    data = __import__("json").loads(snapshot.read_text(encoding="utf-8"))
    names = {row["name"] for row in data["products"]}
    assert "Sample Kitchen Mat Set of 2, Washable Anti-Fatigue Mats for Kitchen and Laundry" in names
    assert "Sample Galaxy Projection Night Light with 12 slides" in names
    assert not any("Tabi" in name for name in names)
    assert not any("24.99" in (row.get("name") or "") for row in data["products"])
    assert data["gmailIdentified"] == 2
    assert data["gmailCancelled"] == 1
    assert data["excludedPaid"] == 1
    assert data["gmailUnresolved"] == 0
    slugs = {row["slug"] for row in data["products"]}
    assert (tmp_path / "reviews" / "sample-kitchen-mat-set-of-2-washable-anti-fatigue-mats-for-kitchen-and-laundry").is_dir() or any(
        "kitchen-mat" in slug for slug in slugs
    )
    for row in data["products"]:
        assert "orderNumbers" not in row
        assert "111-" not in (row.get("body") or "")
        assert "address" not in row


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


def test_preferred_slug_keeps_shared_asin_rows_distinct():
    a = import_products.normalize_product(
        {"name": "Toploader Binder 9-Pocket Black - Migeec", "asin": "B0HD613SGQ", "id": "aaa"}
    )
    b = import_products.normalize_product(
        {
            "name": "Toploader Binder 9-Pocket Black PU Leather (Holds 288)",
            "asin": "B0HD613SGQ",
            "id": "bbb",
        }
    )
    assert a["slug"] == "toploader-9-pocket-migeec"
    assert b["slug"] == "toploader-9-pocket-pu-leather"
    merged = import_products.merge_products([a, b])
    assert len(merged) == 2


def test_truncated_preview_does_not_become_review_body():
    from notion_source import extract_review_from_preview

    parsed = extract_review_from_preview(
        "4 stars | Title: Cute ornaments | This 12-piece set has a nice rustic look..."
    )
    assert parsed["rating"] == 4
    assert parsed["title"] == "Cute ornaments"
    assert parsed["body"] == ""


def test_vine_csv_adds_only_new_items():
    from vine_source import parse_vine_csv_text

    notion = import_products.load_json_inventory(FIXTURES / "notion-inventory.json")
    vine = [
        import_products.normalize_product(row, source="vine")
        for row in parse_vine_csv_text((FIXTURES / "vine-sample.csv").read_text())
    ]
    merged = import_products.merge_products(notion, vine)
    assert sum(1 for item in merged if item["asin"] == "B0HHHNY9S7") == 1
    assert any(item["asin"] == "B0VINE00001" for item in merged)


def test_live_notion_snapshot_leaves_migeec_and_garvee_gaps():
    rows = import_products.load_json_inventory(FIXTURES / "notion-inventory.json")
    assert len(rows) == 12
    migeec = next(item for item in rows if item["slug"] == "toploader-9-pocket-migeec")
    assert migeec["title"] == ""
    assert migeec["body"] == ""
    assert "title" in migeec["missingFields"]
    garvee = next(item for item in rows if item["slug"] == "garvee-camping-chair")
    assert garvee["title"]
    assert garvee["body"]
    assert garvee["rating"] is None
    assert "rating" in garvee["missingFields"]
