"""Remove overlaid text, watermarks, and badges from a product photo.

This targets *overlays* (corner badges, SALE / Best Seller banners,
semi-opaque watermarks), not lettering that is printed on the product
itself. Detection is local and free: OpenCV morphology + optional
pytesseract if it is installed. No paid APIs.
"""

from __future__ import annotations

import re

import cv2
import numpy as np
from PIL import Image

# Words that almost always belong to an overlay, not the product.
OVERLAY_WORDS = re.compile(
    r"(best\s*seller|amazon'?s?\s*choice|sponsored|sale|deal|coupon|"
    r"climate\s*pledge|limited\s*time|watermark|stock\s*photo|sample|"
    r"promotional|advertisement|top\s*rated|new\s*arrival|#\s*1|"
    r"save\s*\d|%\s*off)",
    re.I,
)


def remove_overlay_text(img: Image.Image) -> Image.Image:
    """Inpaint overlaid text, badges, and watermarks. Shape is preserved."""
    alpha = img.getchannel("A") if "A" in img.getbands() else None
    rgb = np.array(img.convert("RGB"))
    mask = overlay_mask(rgb)
    if not np.any(mask):
        return img
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    filled = cv2.inpaint(bgr, mask, 3, cv2.INPAINT_TELEA)
    out = Image.fromarray(cv2.cvtColor(filled, cv2.COLOR_BGR2RGB))
    if alpha is not None:
        rgba = out.convert("RGBA")
        rgba.putalpha(alpha)
        return rgba
    return out


def overlay_mask(rgb: np.ndarray) -> np.ndarray:
    """Binary mask (255 = overlay to remove) for an RGB array."""
    h, w, _ = rgb.shape
    mask = np.zeros((h, w), dtype=np.uint8)
    mask = cv2.bitwise_or(mask, _peripheral_text_mask(rgb))
    mask = cv2.bitwise_or(mask, _badge_mask(rgb))
    ocr = _ocr_overlay_mask(rgb)
    if ocr is not None:
        mask = cv2.bitwise_or(mask, ocr)
    if not np.any(mask):
        return mask
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    return cv2.dilate(mask, kernel, iterations=1)


def _peripheral_text_mask(rgb: np.ndarray) -> np.ndarray:
    """Text-like high-contrast strokes in the outer 18% of the frame."""
    h, w, _ = rgb.shape
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    # Dark text on light, and light text on dark
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 3))
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
    tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, kernel)
    strokes = cv2.max(blackhat, tophat)
    _, bw = cv2.threshold(strokes, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # Keep only the margin (badges and watermarks live there)
    margin_y, margin_x = int(h * 0.18), int(w * 0.18)
    region = np.zeros_like(bw)
    region[:margin_y, :] = 1
    region[-margin_y:, :] = 1
    region[:, :margin_x] = 1
    region[:, -margin_x:] = 1
    bw = cv2.bitwise_and(bw, bw, mask=region)
    # Drop huge blobs (the product) and tiny noise
    n, labels, stats, _ = cv2.connectedComponentsWithStats(bw, connectivity=8)
    out = np.zeros_like(bw)
    min_area = max(20, int(h * w * 0.00015))
    max_area = int(h * w * 0.08)
    for i in range(1, n):
        area = int(stats[i, cv2.CC_STAT_AREA])
        bw_, bh_ = int(stats[i, cv2.CC_STAT_WIDTH]), int(stats[i, cv2.CC_STAT_HEIGHT])
        if area < min_area or area > max_area:
            continue
        aspect = bw_ / max(bh_, 1)
        # Text / banner-like, not a square product
        if 0.12 <= aspect <= 12:
            out[labels == i] = 255
    return out


def _badge_mask(rgb: np.ndarray) -> np.ndarray:
    """Solid-color promotional badges, usually in a corner (yellow/orange/blue)."""
    h, w, _ = rgb.shape
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    ranges = [
        # Yellow / orange "Best Seller" / SALE
        ((12, 80, 80), (40, 255, 255)),
        # Amazon orange
        ((5, 80, 80), (15, 255, 255)),
        # Bright blue "Amazon's Choice"-style
        ((90, 80, 80), (130, 255, 255)),
    ]
    color = np.zeros((h, w), dtype=np.uint8)
    for lo, hi in ranges:
        color = cv2.bitwise_or(color, cv2.inRange(hsv, np.array(lo), np.array(hi)))
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    color = cv2.morphologyEx(color, cv2.MORPH_CLOSE, kernel, iterations=2)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(color, connectivity=8)
    out = np.zeros((h, w), dtype=np.uint8)
    min_area = max(80, int(h * w * 0.001))
    max_area = int(h * w * 0.12)
    margin_y, margin_x = int(h * 0.28), int(w * 0.28)
    for i in range(1, n):
        area = int(stats[i, cv2.CC_STAT_AREA])
        x, y = int(stats[i, cv2.CC_STAT_LEFT]), int(stats[i, cv2.CC_STAT_TOP])
        bw_, bh_ = int(stats[i, cv2.CC_STAT_WIDTH]), int(stats[i, cv2.CC_STAT_HEIGHT])
        if area < min_area or area > max_area:
            continue
        # Must touch a corner/margin to count as a badge, not a product color
        cx, cy = x + bw_ // 2, y + bh_ // 2
        in_margin = cx < margin_x or cx > w - margin_x or cy < margin_y or cy > h - margin_y
        if not in_margin:
            continue
        out[labels == i] = 255
    return out


def _ocr_overlay_mask(rgb: np.ndarray) -> np.ndarray | None:
    """If pytesseract is installed, mask boxes whose text looks like an overlay."""
    try:
        import pytesseract
    except Exception:
        return None
    h, w, _ = rgb.shape
    try:
        data = pytesseract.image_to_data(
            Image.fromarray(rgb), output_type=pytesseract.Output.DICT
        )
    except Exception:
        return None
    mask = np.zeros((h, w), dtype=np.uint8)
    n = len(data.get("text") or [])
    for i in range(n):
        text = (data["text"][i] or "").strip()
        if not text:
            continue
        try:
            conf = float(data["conf"][i])
        except (TypeError, ValueError):
            conf = -1
        if conf >= 0 and conf < 40:
            continue
        x, y, bw_, bh_ = (
            int(data["left"][i]),
            int(data["top"][i]),
            int(data["width"][i]),
            int(data["height"][i]),
        )
        if bw_ <= 1 or bh_ <= 1:
            continue
        in_margin = (
            x < w * 0.18
            or y < h * 0.18
            or x + bw_ > w * 0.82
            or y + bh_ > h * 0.82
        )
        if OVERLAY_WORDS.search(text) or in_margin:
            pad = 2
            mask[
                max(0, y - pad) : min(h, y + bh_ + pad),
                max(0, x - pad) : min(w, x + bw_ + pad),
            ] = 255
    return mask
