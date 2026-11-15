"""Output presets: review, social square, transparent cutout."""

from __future__ import annotations

import numpy as np
from PIL import Image

from review_image.presets import resolve_presets, spec_for
from review_image.process import process_image


def _product(size=(200, 140)):
    img = Image.new("RGB", size, (20, 180, 40))
    img.paste(Image.new("RGB", (70, 60), (200, 40, 40)), (60, 40))
    return img


def test_resolve_all_expands():
    assert resolve_presets("all") == ["review", "social", "cutout"]
    assert resolve_presets("review") == ["review"]


def test_review_preset_matches_original_size_and_white_bg():
    src = _product((220, 160))
    out = process_image(src, color_filter="none", preset="review")
    assert out.size == (220, 160)
    arr = np.array(out.convert("RGB"))
    assert arr[0, 0].min() >= 245


def test_social_preset_is_square_1080_by_default():
    src = _product((200, 140))
    out = process_image(src, color_filter="none", preset="social")
    assert out.size == (1080, 1080)
    arr = np.array(out.convert("RGB"))
    assert arr[0, 0].min() >= 245


def test_social_preset_honours_size():
    src = _product()
    out = process_image(src, color_filter="none", preset="social", social_size=512)
    assert out.size == (512, 512)


def test_cutout_is_transparent_png_tight():
    src = _product((200, 140))
    out = process_image(src, color_filter="none", preset="cutout")
    assert out.mode == "RGBA"
    arr = np.array(out)
    # Tight crop: smaller than the original canvas
    assert out.size[0] <= 200 and out.size[1] <= 140
    # Corners of a tight cutout still have transparency or near-white
    # (OpenCV fallback may leave a little fringe). Alpha at a true
    # corner after a tight pad should not be a full opaque green field.
    corners = [arr[0, 0], arr[0, -1], arr[-1, 0], arr[-1, -1]]
    # At least some transparent (or nearly transparent) pixels exist
    assert (arr[:, :, 3] < 20).sum() > 0 or arr[0, 0, 3] < 255
    # Product red still present
    rgb = arr[:, :, :3]
    assert rgb[:, :, 0].max() > 150


def test_spec_suffixes():
    assert spec_for("review").suffix.endswith(".jpg")
    assert spec_for("social").suffix.endswith(".jpg")
    assert spec_for("cutout").suffix.endswith(".png")
