"""Overlay text / badge removal. Offline, no OCR required."""

from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from review_image.process import process_image
from review_image.text import overlay_mask, remove_overlay_text


def _base(size=(240, 180)) -> Image.Image:
    img = Image.new("RGB", size, (20, 180, 40))
    img.paste(Image.new("RGB", (80, 70), (200, 40, 40)), (80, 50))
    return img


def test_sale_badge_in_corner_is_removed():
    img = _base()
    draw = ImageDraw.Draw(img)
    # Yellow "Best Seller" style badge in the top-right corner
    draw.rectangle((175, 4, 236, 36), fill=(255, 200, 0))
    draw.text((180, 10), "SALE", fill=(0, 0, 0))
    before = np.array(img)
    # The badge region is yellow
    assert before[10:30, 180:230, 0].mean() > 200
    assert before[10:30, 180:230, 2].mean() < 80
    out = remove_overlay_text(img)
    after = np.array(out)
    region = after[10:30, 180:230]
    # Inpainted toward the surrounding green background (low red, higher green)
    assert region[:, :, 1].mean() > region[:, :, 0].mean()
    # And no longer a solid yellow block
    assert region[:, :, 2].mean() > 40


def test_process_image_remove_text_keeps_size():
    img = _base((200, 160))
    draw = ImageDraw.Draw(img)
    draw.rectangle((150, 2, 198, 30), fill=(255, 180, 0))
    out = process_image(img, color_filter="none", remove_text=True)
    assert out.size == (200, 160)


def test_overlay_mask_ignores_empty_clean_photo():
    img = Image.new("RGB", (120, 90), (255, 255, 255))
    img.paste(Image.new("RGB", (40, 40), (10, 10, 200)), (40, 25))
    mask = overlay_mask(np.array(img))
    # A clean studio photo should not produce a huge mask
    assert int(mask.sum() // 255) < 200
