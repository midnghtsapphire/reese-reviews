"""Full pipeline: crop → background removal → text/watermark removal → filter → size."""

from __future__ import annotations

from PIL import Image

from .background import composite_on, foreground_mask, remove_background
from .crop import bbox_from_mask, crop_image, parse_crop
from .filters import apply_filter
from .presets import PresetSpec, spec_for
from .text import remove_overlay_text


def fit_to_size(
    img: Image.Image,
    size: tuple[int, int],
    background: str = "white",
) -> Image.Image:
    """Uniformly scale to fit inside `size` (no aspect change), then pad.

    The product's shape is preserved. The canvas is exactly `size`.
    """
    target_w, target_h = size
    src = img.convert(
        "RGBA" if background == "transparent" or "A" in img.getbands() else img.mode
    )
    w, h = src.size
    if w == 0 or h == 0:
        raise ValueError("Cannot fit an empty image")
    scale = min(target_w / w, target_h / h)
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    if (new_w, new_h) != (w, h):
        src = src.resize((new_w, new_h), Image.Resampling.LANCZOS)
    fill = (255, 255, 255, 0) if background == "transparent" else (255, 255, 255, 255)
    canvas = Image.new("RGBA", (target_w, target_h), fill)
    x = (target_w - new_w) // 2
    y = (target_h - new_h) // 2
    if src.mode != "RGBA":
        src = src.convert("RGBA")
    canvas.alpha_composite(src, (x, y))
    if background == "transparent":
        return canvas
    return canvas.convert("RGB")


def tight_bbox_from_alpha(
    img: Image.Image, padding_ratio: float = 0.08
) -> tuple[int, int, int, int]:
    """Bounding box of non-transparent (or non-white) pixels, plus padding."""
    import numpy as np

    rgba = img.convert("RGBA")
    arr = np.array(rgba)
    if arr.ndim == 3 and arr.shape[2] == 4:
        ys, xs = np.where(arr[:, :, 3] > 8)
    else:
        rgb = arr[:, :, :3]
        ys, xs = np.where(rgb.min(axis=2) < 250)
    W, H = rgba.size
    if xs.size == 0:
        return 0, 0, W, H
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    pad_x = max(2, int((x1 - x0 + 1) * padding_ratio))
    pad_y = max(2, int((y1 - y0 + 1) * padding_ratio))
    return (
        max(0, x0 - pad_x),
        max(0, y0 - pad_y),
        min(W, x1 + 1 + pad_x),
        min(H, y1 + 1 + pad_y),
    )


def process_image(
    img: Image.Image,
    *,
    crop: str | tuple[int, int, int, int] | None = None,
    background: str = "white",
    color_filter: str = "light",
    padding_ratio: float = 0.08,
    remove_text: bool = False,
    do_crop: bool = True,
    do_background: bool = True,
    preset: str = "review",
    social_size: int | None = None,
) -> Image.Image:
    """Turn a product photo into a finished image for a named preset.

    Steps (each can be skipped with the do_* flags):
      1. Crop to the product (auto subject bbox + padding, or manual --crop).
      2. Remove the background (rembg u2net, or OpenCV fallback).
      3. Remove overlaid text / watermarks / badges (optional --remove-text).
      4. Apply the light filter (or none / glass).
      5. Size the canvas: original pixels (review), square (social), or a
         tight transparent cutout.
    """
    if background not in {"white", "transparent"}:
        raise ValueError("background must be 'white' or 'transparent'")
    original_size = img.size
    working = img.convert("RGB")

    if remove_text:
        # First pass: badges and corner watermarks on the original frame,
        # so rembg does not treat them as part of the product.
        working = remove_overlay_text(working).convert("RGB")

    if crop:
        if isinstance(crop, str):
            box = parse_crop(crop, original_size)
        else:
            box = crop
        cropped = crop_image(working, box)
    elif do_crop:
        mask = foreground_mask(working)
        box = bbox_from_mask(mask, working.size, padding_ratio=padding_ratio)
        cropped = crop_image(working, box)
    else:
        cropped = working

    if do_background:
        rgba = remove_background(cropped)
    else:
        rgba = cropped.convert("RGBA")

    if remove_text:
        rgba = remove_overlay_text(rgba)

    filtered = apply_filter(rgba, color_filter)

    spec: PresetSpec = spec_for(preset, social_size=social_size)
    bg = spec.background if preset != "review" else background
    # Honour an explicit --bg on the review preset; other presets own their bg.
    if preset == "review":
        bg = background
    else:
        bg = spec.background

    if spec.tight:
        box = tight_bbox_from_alpha(filtered, padding_ratio=padding_ratio)
        filtered = filtered.crop(box)

    composited = composite_on(filtered, background=bg)
    if spec.square:
        side = int(spec.square)
        return fit_to_size(composited, (side, side), background=bg)
    if spec.keep_original_size:
        return fit_to_size(composited, original_size, background=bg)
    if bg == "transparent":
        return composited.convert("RGBA")
    return composited.convert("RGB")
