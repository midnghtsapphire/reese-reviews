from pathlib import Path

from check_completeness import check_doc
from frontmatter import parse_review_markdown, serialize_review, slugify, ReviewDoc


def test_complete_review_passes(tmp_path: Path):
    doc = parse_review_markdown(
        """---
product: "Demo"
asin: "B0HGRHWB6N"
url: "https://www.amazon.com/dp/B0HGRHWB6N"
rating: 4
title: "A solid title"
status: "draft"
slug: "demo"
text_only: true
---

The written review is here.
""",
        path=tmp_path / "review.md",
    )
    assert check_doc(doc) == []


def test_missing_fields_are_reported(tmp_path: Path):
    doc = parse_review_markdown(
        """---
product: "Demo"
asin: "B0HGRHWB6N"
url: "https://www.amazon.com/dp/B0HGRHWB6N"
rating: null
title: ""
status: "draft"
slug: "demo"
text_only: false
---

""",
        path=tmp_path / "review.md",
    )
    missing = check_doc(doc)
    assert "rating (1-5)" in missing
    assert "title" in missing
    assert "review text" in missing
    assert "image (or set text_only: true)" in missing


def test_image_satisfies_photo_requirement(tmp_path: Path):
    review_dir = tmp_path / "reviews" / "demo"
    image_dir = review_dir / "images"
    image_dir.mkdir(parents=True)
    (image_dir / "final-review.jpg").write_bytes(b"fake")
    doc = ReviewDoc(
        path=review_dir / "review.md",
        product="Demo",
        asin="B0HGRHWB6N",
        url="https://www.amazon.com/dp/B0HGRHWB6N",
        rating=5,
        title="Great",
        body="Yes.",
        text_only=False,
        slug="demo",
    )
    (review_dir / "review.md").write_text(serialize_review(doc))
    assert check_doc(doc) == []


def test_slugify():
    assert slugify("2 Pocket Toploader Binder (Holds 56)", "B0HGRHWB6N") == "2-pocket-toploader-binder-holds-56"
