"""Color filters. Default 'light' matches the Notion light-filter look."""

from __future__ import annotations

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageChops

FILTERS = ("light", "none", "glass")


def apply_filter(img: Image.Image, name: str = "light") -> Image.Image:
    if name in (None, "none"):
        return img
    if name == "light":
        return _light(img)
    if name == "glass":
        return _glass(img)
    raise ValueError(f"Unknown filter {name!r}. Choose one of: {', '.join(FILTERS)}")


def _as_rgb_or_rgba(img: Image.Image) -> Image.Image:
    if img.mode not in {"RGB", "RGBA"}:
        return img.convert("RGBA" if "A" in img.getbands() else "RGB")
    return img


def _light(img: Image.Image) -> Image.Image:
    """Gentle brightness, contrast, and warmth. Does not change the product's shape."""
    img = _as_rgb_or_rgba(img)
    alpha = img.getchannel("A") if "A" in img.getbands() else None
    rgb = img.convert("RGB")
    rgb = ImageEnhance.Brightness(rgb).enhance(1.06)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
    # Warmth: slightly lift red/yellow, slightly ease blue
    arr = np.array(rgb, dtype=np.float32)
    arr[..., 0] = np.clip(arr[..., 0] * 1.04, 0, 255)
    arr[..., 1] = np.clip(arr[..., 1] * 1.02, 0, 255)
    arr[..., 2] = np.clip(arr[..., 2] * 0.96, 0, 255)
    rgb = Image.fromarray(arr.astype(np.uint8), mode="RGB")
    if alpha is None:
        return rgb
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def _glass(img: Image.Image) -> Image.Image:
    """Optional VineFlow-inspired glassmorphic lift: soft highlight, no shape change.

    Named after the glassmorphic filter described in midnghtsapphire/VineFlow
    (PROMPT.md / README). Kept gentle so the product still looks like what
    was received. Default for Amazon review photos remains 'light'.
    """
    img = _light(img)
    img = _as_rgb_or_rgba(img)
    alpha = img.getchannel("A") if "A" in img.getbands() else None
    rgb = img.convert("RGB")
    # Soft highlight veil, very light, so colors stay honest
    glow = ImageEnhance.Brightness(rgb).enhance(1.08).filter(ImageFilter.GaussianBlur(radius=2))
    rgb = ImageChops.screen(rgb, ImageEnhance.Contrast(glow).enhance(0.35))
    rgb = ImageEnhance.Color(rgb).enhance(0.98)
    if alpha is None:
        return rgb
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out
