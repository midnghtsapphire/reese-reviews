"""Full pipeline: crop → background removal → light filter → original size."""

from __future__ import annotations

from PIL import Image

from .background import composite_on, foreground_mask, remove_background
from .crop import bbox_from_mask, crop_image, parse_crop
from .filters import apply_filter


def fit_to_size(
    img: Image.Image,
    size: tuple[int, int],
    background: str = "white",
) -> Image.Image:
    """Uniformly scale to fit inside `size` (no aspect change), then pad.

    The product's shape is preserved. The canvas is exactly the original
    pixel dimensions.
    """
    target_w, target_h = size
    src = img.convert("RGBA" if background == "transparent" or "A" in img.getbands() else img.mode)
    w, h = src.size
    if w == 0 or h == 0:
        raise ValueError("Cannot fit an empty image")
    scale = min(target_w / w, target_h / h)
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    # Avoid unnecessary resample when already the right size
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


def process_image(
    img: Image.Image,
    *,
    crop: str | tuple[int, int, int, int] | None = None,
    background: str = "white",
    color_filter: str = "light",
    padding_ratio: float = 0.08,
) -> Image.Image:
    """Turn an Original Product Photo into a Final Review Photo.

    Steps:
      1. Crop to the product (auto subject bbox + padding, or manual --crop).
      2. Remove the background (rembg u2net, or OpenCV fallback) and
         composite onto white or a transparent canvas.
      3. Apply the light filter (or none / glass).
      4. Resize/pad to EXACTLY the original image's pixel dimensions,
         without changing the product's aspect ratio.
    """
    if background not in {"white", "transparent"}:
        raise ValueError("background must be 'white' or 'transparent'")
    original_size = img.size
    working = img.convert("RGB")

    if crop:
        if isinstance(crop, str):
            box = parse_crop(crop, original_size)
        else:
            box = crop
    else:
        mask = foreground_mask(working)
        box = bbox_from_mask(mask, original_size, padding_ratio=padding_ratio)
    cropped = crop_image(working, box)

    rgba = remove_background(cropped)
    # Filter the product first so a white canvas stays white.
    filtered = apply_filter(rgba, color_filter)
    composited = composite_on(filtered, background=background)
    return fit_to_size(composited, original_size, background=background)
