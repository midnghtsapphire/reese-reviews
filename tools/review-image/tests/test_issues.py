"""GitHub issue-form parser for Product Image Process (WR)."""

from __future__ import annotations

from review_image.issues import (
    STEP_BACKGROUND,
    STEP_COPY,
    STEP_CROP,
    STEP_FILTER,
    STEP_TEXT,
    parse_issue_body,
)


FULL_BODY = """\
### Product URL or ASIN

https://www.amazon.com/dp/B0HD613SGQ

### Image (if no URL or ASIN)

_No response_

### Steps

- [x] Copy the product image
- [x] Crop
- [x] Remove background
- [x] Remove text / watermarks / badges
- [x] Apply filter

### Filter preset

light

### Output presets

- [x] Review (original-size white background)
- [x] Square social (1:1)
- [ ] Transparent PNG cutout

### Notion page URL

https://www.notion.so/3ff2aa3199088169a5ebc25c5c83871d

### Notes

Please keep the review text on the page.
"""


MINIMAL_BODY = """\
### Product URL or ASIN

B0H8SSS7JL

### Image (if no URL or ASIN)

_No response_

### Steps

- [ ] Copy the product image
- [ ] Crop
- [ ] Remove background
- [ ] Remove text / watermarks / badges
- [ ] Apply filter

### Filter preset

glass

### Output presets

- [ ] Review (original-size white background)
- [ ] Square social (1:1)
- [ ] Transparent PNG cutout

### Notion page URL

_No response_

### Notes

_No response_
"""


IMAGE_ONLY_BODY = """\
### Product URL or ASIN

_No response_

### Image (if no URL or ASIN)

https://example.com/my-photo.jpg

### Steps

- [x] Crop
- [x] Remove background
- [ ] Remove text / watermarks / badges
- [x] Apply filter

### Filter preset

none

### Output presets

- [x] Transparent PNG cutout

### Notion page URL

_No response_

### Notes

from my camera roll
"""


def test_parses_full_form():
    req = parse_issue_body(FULL_BODY, issue_number=42, title="WR: Product image process — binder")
    assert req.product_url_or_asin == "https://www.amazon.com/dp/B0HD613SGQ"
    assert req.image_link == ""
    assert req.source() == "https://www.amazon.com/dp/B0HD613SGQ"
    assert req.steps == [STEP_COPY, STEP_CROP, STEP_BACKGROUND, STEP_TEXT, STEP_FILTER]
    assert req.color_filter == "light"
    assert req.presets == ["review", "social"]
    assert "3ff2aa3199088169a5ebc25c5c83871d" in req.notion_page_url
    assert "review text" in req.notes
    assert req.issue_number == 42


def test_unchecked_steps_and_presets_use_defaults():
    req = parse_issue_body(MINIMAL_BODY)
    assert req.source() == "B0H8SSS7JL"
    assert req.steps == []
    assert req.steps_or_default() == [STEP_COPY, STEP_CROP, STEP_BACKGROUND, STEP_TEXT, STEP_FILTER]
    assert req.presets == []
    assert req.presets_or_default() == ["review"]
    assert req.color_filter == "glass"
    assert req.notion_page_url == ""
    assert req.notes == ""


def test_image_link_and_partial_steps():
    req = parse_issue_body(IMAGE_ONLY_BODY)
    assert req.source() == "https://example.com/my-photo.jpg"
    assert req.wants(STEP_CROP) and req.wants(STEP_BACKGROUND) and req.wants(STEP_FILTER)
    assert not req.wants(STEP_TEXT)
    assert req.presets == ["cutout"]
    assert req.color_filter == "none"
    assert req.notes == "from my camera roll"
