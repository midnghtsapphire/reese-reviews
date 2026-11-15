"""Listing-image fetch helpers. Offline — no live Amazon."""

from __future__ import annotations

import pytest

from review_image import fetch


FIXTURE_HTML = """
<html><body>
<script>
var data = {
  'colorImages' : { 'initial': [
    {"hiRes":"https://m.media-amazon.com/images/I/81MAINIMAGE._AC_SL1500_.jpg","large":"https://m.media-amazon.com/images/I/41MAIN._AC_.jpg"},
    {"hiRes":"https://m.media-amazon.com/images/I/81SECOND._AC_SL1500_.jpg","large":"https://m.media-amazon.com/images/I/41SECOND._AC_.jpg"}
  ]}
};
</script>
</body></html>
"""

CAPTCHA_HTML = """
<html><body>
<h4>Click the button below to continue shopping</h4>
<form action="/errors_page/validateCaptcha"></form>
</body></html>
"""


def test_extract_asin_from_bare_and_url():
    assert fetch.extract_asin("B0HD613SGQ") == "B0HD613SGQ"
    assert fetch.extract_asin("https://www.amazon.com/dp/B0HD613SGQ") == "B0HD613SGQ"
    assert fetch.extract_asin("https://www.amazon.com/gp/product/B0H8SSS7JL?th=1") == "B0H8SSS7JL"
    assert fetch.looks_like_asin("B0HD613SGQ")
    assert not fetch.looks_like_asin("not-an-asin")
    assert fetch.extract_asin("https://example.com/photo.jpg") is None


def test_first_hires_prefers_color_images_main():
    assert fetch.first_hires(FIXTURE_HTML) == (
        "https://m.media-amazon.com/images/I/81MAINIMAGE._AC_SL1500_.jpg"
    )


def test_first_hires_rejects_captcha_page():
    assert fetch.first_hires(CAPTCHA_HTML) is None


def test_network_guard(monkeypatch):
    monkeypatch.setenv("REVIEW_IMAGE_NO_NETWORK", "1")
    with pytest.raises(fetch.FetchError, match="NO_NETWORK"):
        fetch.http_get("https://www.amazon.com/dp/B0HD613SGQ")
