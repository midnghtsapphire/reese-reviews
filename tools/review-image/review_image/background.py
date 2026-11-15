"""Background removal: rembg (u2net) with a local OpenCV fallback."""

from __future__ import annotations

import io
import os

import cv2
import numpy as np
from PIL import Image

FORCE_OPENCV = os.environ.get("REVIEW_IMAGE_FORCE_OPENCV", "").strip() in {"1", "true", "yes"}


def rembg_available() -> bool:
    if FORCE_OPENCV:
        return False
    try:
        import rembg  # noqa: F401

        return True
    except Exception:
        return False


def _remove_with_rembg(img: Image.Image) -> Image.Image:
    from rembg import new_session, remove

    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="PNG")
    session = new_session("u2net")
    out = remove(buf.getvalue(), session=session)
    result = Image.open(io.BytesIO(out)).convert("RGBA")
    return result


def _edge_background_mask(rgb: np.ndarray) -> np.ndarray:
    """Pixels similar to the border color are background (0); else foreground (255)."""
    h, w, _ = rgb.shape
    border = np.concatenate(
        [
            rgb[0, :, :],
            rgb[-1, :, :],
            rgb[:, 0, :],
            rgb[:, -1, :],
        ],
        axis=0,
    )
    bg = np.median(border, axis=0).astype(np.float32)
    dist = np.linalg.norm(rgb.astype(np.float32) - bg, axis=2)
    # Adaptive threshold: well above typical border noise
    spread = float(np.median(np.linalg.norm(border.astype(np.float32) - bg, axis=1)))
    thresh = max(28.0, spread * 4.0 + 18.0)
    fg = (dist > thresh).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, kernel)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, kernel, iterations=2)
    # Keep the largest component (the product)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    if n > 1:
        # Keep every significant subject, not only the largest. Product
        # photos often show more than one view of the item on a white
        # background (for example a closed binder and an open spread).
        areas = stats[1:, cv2.CC_STAT_AREA]
        largest = int(areas.max())
        min_area = max(int(largest * 0.08), int(h * w * 0.004), 64)
        keep = [i + 1 for i, area in enumerate(areas) if int(area) >= min_area]
        fg = np.isin(labels, keep).astype(np.uint8) * 255
    return fg


def _remove_with_opencv(img: Image.Image) -> Image.Image:
    rgb = np.array(img.convert("RGB"))
    h, w, _ = rgb.shape
    rough = _edge_background_mask(rgb)
    # GrabCut refine, seeded by the rough mask
    gc_mask = np.full((h, w), cv2.GC_PR_BGD, dtype=np.uint8)
    gc_mask[rough > 0] = cv2.GC_PR_FGD
    # Sure background: a thin border if it is marked background
    border = 4
    gc_mask[:border, :] = cv2.GC_BGD
    gc_mask[-border:, :] = cv2.GC_BGD
    gc_mask[:, :border] = cv2.GC_BGD
    gc_mask[:, -border:] = cv2.GC_BGD
    # Sure foreground: eroded rough mask
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    sure_fg = cv2.erode(rough, kernel, iterations=2)
    gc_mask[sure_fg > 0] = cv2.GC_FGD
    if int((gc_mask == cv2.GC_FGD).sum()) < 16:
        # Fall back to a centered rectangle if erosion wiped the subject
        x0, y0 = int(w * 0.2), int(h * 0.2)
        x1, y1 = int(w * 0.8), int(h * 0.8)
        gc_mask[y0:y1, x0:x1] = cv2.GC_PR_FGD
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(bgr, gc_mask, None, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_MASK)
        fg = np.where((gc_mask == cv2.GC_FGD) | (gc_mask == cv2.GC_PR_FGD), 255, 0).astype(
            np.uint8
        )
    except cv2.error:
        fg = rough
    # Soften the edge slightly
    fg = cv2.GaussianBlur(fg, (5, 5), 0)
    rgba = np.dstack([rgb, fg])
    return Image.fromarray(rgba, mode="RGBA")


def foreground_mask(img: Image.Image) -> np.ndarray:
    """Used for auto-crop. 255 = product, 0 = background."""
    rgba = remove_background(img)
    alpha = np.array(rgba.split()[-1])
    return (alpha > 16).astype(np.uint8) * 255


def remove_background(img: Image.Image) -> Image.Image:
    """Return an RGBA image with the background made transparent."""
    if rembg_available():
        return _remove_with_rembg(img)
    return _remove_with_opencv(img)


def composite_on(img: Image.Image, background: str = "white") -> Image.Image:
    rgba = img.convert("RGBA")
    if background == "transparent":
        return rgba
    canvas = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
    canvas.alpha_composite(rgba)
    return canvas.convert("RGB")
