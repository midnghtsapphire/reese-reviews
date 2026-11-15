"""Crop to the product subject bounding box, with padding."""

from __future__ import annotations

import numpy as np
from PIL import Image


def parse_crop(spec: str, size: tuple[int, int]) -> tuple[int, int, int, int]:
    """Parse --crop x,y,w,h (pixels) into a PIL box (left, top, right, bottom)."""
    parts = [p.strip() for p in spec.replace("x", ",").split(",") if p.strip()]
    if len(parts) != 4:
        raise ValueError("Crop must be x,y,w,h in pixels, for example 10,20,400,500")
    x, y, w, h = (int(float(p)) for p in parts)
    if w <= 0 or h <= 0:
        raise ValueError("Crop width and height must be positive")
    W, H = size
    left = max(0, x)
    top = max(0, y)
    right = min(W, x + w)
    bottom = min(H, y + h)
    if right <= left or bottom <= top:
        raise ValueError("Crop box is empty or outside the image")
    return left, top, right, bottom


def bbox_from_mask(
    mask: np.ndarray,
    size: tuple[int, int],
    padding_ratio: float = 0.08,
) -> tuple[int, int, int, int]:
    """Foreground mask (nonzero = product) → padded box clamped to the image."""
    ys, xs = np.where(mask > 0)
    W, H = size
    if xs.size == 0:
        return 0, 0, W, H
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    pad_x = max(2, int((x1 - x0 + 1) * padding_ratio))
    pad_y = max(2, int((y1 - y0 + 1) * padding_ratio))
    left = max(0, x0 - pad_x)
    top = max(0, y0 - pad_y)
    right = min(W, x1 + 1 + pad_x)
    bottom = min(H, y1 + 1 + pad_y)
    return left, top, right, bottom


def crop_image(img: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return img.crop(box)
