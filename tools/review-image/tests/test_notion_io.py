"""Notion helpers are unit-tested with fixtures only — never against live Notion."""

from review_image.notion_io import find_original_photo_url, parse_page_id


def test_parse_page_id_from_hex_and_url():
    expected = "4002aa31-9908-810f-9ce4-df3f07ac55df"
    assert parse_page_id("4002aa319908810f9ce4df3f07ac55df") == expected
    assert parse_page_id(expected) == expected
    url = "https://app.notion.com/p/4002aa319908810f9ce4df3f07ac55df"
    assert parse_page_id(url) == expected


def test_find_original_photo_prefers_labeled_block():
    blocks = [
        {
            "type": "paragraph",
            "paragraph": {
                "rich_text": [{"plain_text": "Original Product Photo:"}]
            },
        },
        {
            "type": "image",
            "image": {"type": "file", "file": {"url": "https://example.com/original.jpg"}},
        },
        {
            "type": "paragraph",
            "paragraph": {
                "rich_text": [{"plain_text": "Final Review Photo (matches original size + light filter):"}]
            },
        },
        {
            "type": "image",
            "image": {"type": "file", "file": {"url": "https://example.com/final.jpg"}},
        },
    ]
    assert find_original_photo_url(blocks) == "https://example.com/original.jpg"
