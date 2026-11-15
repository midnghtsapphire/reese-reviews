"""Synthetic-image tests for the review image pipeline."""

from __future__ import annotations

import numpy as np
import pytest
from PIL import Image

from review_image.crop import parse_crop
from review_image.process import fit_to_size, process_image


def _product_photo(size=(240, 180), product_box=(70, 40, 170, 140), product_color=(200, 40, 40), bg=(20, 180, 40)):
    """A solid-color product on a contrasting background."""
    img = Image.new("RGB", size, bg)
    # product_box is (left, top, right, bottom)
    px = Image.new("RGB", (product_box[2] - product_box[0], product_box[3] - product_box[1]), product_color)
    img.paste(px, (product_box[0], product_box[1]))
    return img


def test_output_size_matches_input():
    src = _product_photo(size=(320, 200))
    out = process_image(src, color_filter="none")
    assert out.size == (320, 200)


def test_background_becomes_white():
    src = _product_photo()
    out = process_image(src, color_filter="none")
    arr = np.array(out.convert("RGB"))
    # Corners were the green background; they should now be white (or very close).
    for y, x in ((0, 0), (0, -1), (-1, 0), (-1, -1), (2, 2)):
        pixel = arr[y, x]
        assert pixel.min() >= 245, f"corner {y,x} was {tuple(pixel)}"


def test_crop_bbox_auto_tightens_around_product():
    from review_image.background import foreground_mask
    from review_image.crop import bbox_from_mask

    box = (80, 50, 160, 130)
    src = _product_photo(size=(300, 220), product_box=box)
    mask = foreground_mask(src)
    cropped = bbox_from_mask(mask, src.size, padding_ratio=0.08)
    left, top, right, bottom = cropped
    # The box should include the product and be smaller than the full frame.
    assert left <= box[0]
    assert top <= box[1]
    assert right >= box[2]
    assert bottom >= box[3]
    assert (right - left) < src.size[0]
    assert (bottom - top) < src.size[1]


def test_manual_crop():
    src = _product_photo(size=(200, 200))
    box = parse_crop("10,20,80,90", src.size)
    assert box == (10, 20, 90, 110)
    out = process_image(src, crop="10,20,80,90", color_filter="none")
    assert out.size == src.size


def test_product_color_stays_recognizable_with_light_filter():
    src = _product_photo(product_color=(200, 40, 40))
    out = process_image(src, color_filter="light")
    arr = np.array(out.convert("RGB"))
    # Center should still be a red-ish product, not white and not green.
    cx, cy = arr.shape[1] // 2, arr.shape[0] // 2
    r, g, b = (int(v) for v in arr[cy, cx])
    assert r > g + 40 and r > b + 40, f"center color {(r, g, b)} lost the product hue"


def test_filter_none_vs_light_changes_brightness():
    src = _product_photo(product_color=(180, 60, 60))
    plain = np.array(process_image(src, color_filter="none").convert("RGB"), dtype=np.int16)
    lit = np.array(process_image(src, color_filter="light").convert("RGB"), dtype=np.int16)
    # Mean luminance of the mid frame should rise a little with the light filter.
    assert lit.mean() >= plain.mean()


def test_fit_to_size_pads_and_preserves_aspect():
    src = Image.new("RGB", (50, 20), (10, 10, 200))
    fitted = fit_to_size(src, (200, 200), background="white")
    assert fitted.size == (200, 200)
    arr = np.array(fitted.convert("RGB"))
    # Corners padded white
    assert arr[0, 0].min() >= 250


def test_keeps_two_product_views_on_white():
    img = Image.new("RGB", (300, 220), (255, 255, 255))
    img.paste(Image.new("RGB", (80, 80), (200, 30, 30)), (30, 30))
    img.paste(Image.new("RGB", (80, 50), (30, 30, 180)), (160, 130))
    out = process_image(img, color_filter="none")
    assert out.size == (300, 220)
    arr = np.array(out.convert("RGB"))
    region1 = arr[30:110, 30:110]
    region2 = arr[130:180, 160:240]
    assert region1[:, :, 0].mean() > region1[:, :, 1].mean() + 20
    assert region2[:, :, 2].mean() > region2[:, :, 0].mean() + 20
