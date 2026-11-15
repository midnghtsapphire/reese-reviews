"""Copy a product image from a direct URL or an Amazon listing (URL or ASIN).

Amazon often serves a captcha interstitial to non-browser clients. This
module uses a browser User-Agent and prefers the system `curl` binary
(which has been reliable), then falls back to urllib. Tests stay offline
via REVIEW_IMAGE_NO_NETWORK=1 and never hit Amazon.
"""

from __future__ import annotations

import gzip
import io
import os
import re
import subprocess
from pathlib import Path
from urllib.parse import urlparse

from PIL import Image

BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

ASIN_RE = re.compile(r"\b([A-Z0-9]{10})\b")
ASIN_IN_URL_RE = re.compile(
    r"(?:/dp/|/gp/product/|/product/)([A-Z0-9]{10})", re.I
)
HIRES_RE = re.compile(
    r'"hiRes"\s*:\s*"(https://m\.media-amazon\.com/images/I/[^"]+)"'
)

NETWORK_BLOCKED = (
    "Network access is disabled (REVIEW_IMAGE_NO_NETWORK=1). "
    "Pass a local file in tests."
)


class FetchError(RuntimeError):
    """The listing or image could not be copied."""


def network_allowed() -> bool:
    return os.environ.get("REVIEW_IMAGE_NO_NETWORK", "").strip() not in {
        "1",
        "true",
        "yes",
    }


def looks_like_asin(value: str) -> bool:
    text = value.strip()
    return bool(re.fullmatch(r"[A-Z0-9]{10}", text, re.I))


def extract_asin(value: str) -> str | None:
    text = value.strip()
    if looks_like_asin(text):
        return text.upper()
    m = ASIN_IN_URL_RE.search(text)
    if m:
        return m.group(1).upper()
    return None


def amazon_url_for_asin(asin: str) -> str:
    return f"https://www.amazon.com/dp/{asin.upper()}"


def first_hires(html: str) -> str | None:
    """Main listing image: first hiRes after colorImages, else first hiRes."""
    if "validateCaptcha" in html or "Click the button below to continue shopping" in html:
        return None
    idx = html.find("colorImages")
    window = html[idx : idx + 40000] if idx != -1 else html
    found = HIRES_RE.findall(window)
    if found:
        return found[0]
    found = HIRES_RE.findall(html)
    return found[0] if found else None


def _decode_body(raw: bytes) -> bytes:
    if raw[:2] == b"\x1f\x8b":
        return gzip.decompress(raw)
    return raw


def _curl_get(url: str, timeout: int = 35) -> bytes:
    cmd = [
        "curl",
        "-sS",
        "-L",
        "-A",
        BROWSER_UA,
        "-H",
        "Accept-Language: en-US,en;q=0.9",
        "-H",
        "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/*;q=0.8,*/*;q=0.7",
        "--max-time",
        str(timeout),
        url,
    ]
    try:
        raw = subprocess.check_output(cmd, stderr=subprocess.STDOUT)
    except FileNotFoundError as exc:
        raise FetchError("curl is not installed") from exc
    except subprocess.CalledProcessError as exc:
        raise FetchError(f"curl failed for {url}: {exc.output[:200]!r}") from exc
    return _decode_body(raw)


def _urllib_get(url: str, timeout: int = 35) -> bytes:
    import urllib.request

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": BROWSER_UA,
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,image/avif,image/webp,image/*,*/*;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
    return _decode_body(raw)


def http_get(url: str, timeout: int = 35) -> bytes:
    if not network_allowed():
        raise FetchError(NETWORK_BLOCKED)
    # Prefer curl: Amazon often captchas Python's urllib/requests TLS fingerprint.
    try:
        return _curl_get(url, timeout=timeout)
    except FetchError:
        return _urllib_get(url, timeout=timeout)


def _open_image(data: bytes) -> Image.Image:
    if len(data) < 32:
        raise FetchError("Downloaded file is too small to be an image")
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
        return img
    except Exception as exc:
        raise FetchError(f"Downloaded file is not a readable image: {exc}") from exc


def fetch_direct_image(url: str, timeout: int = 35) -> Image.Image:
    data = http_get(url, timeout=timeout)
    return _open_image(data)


def fetch_amazon_main_image(asin_or_url: str, timeout: int = 35) -> tuple[Image.Image, str]:
    """Return (image, source_image_url) for the listing's main hiRes photo."""
    asin = extract_asin(asin_or_url)
    if not asin:
        raise FetchError(f"Could not parse an ASIN from {asin_or_url!r}")
    listing = amazon_url_for_asin(asin)
    html = http_get(listing, timeout=timeout).decode("utf-8", "replace")
    image_url = first_hires(html)
    if not image_url:
        raise FetchError(
            f"Could not find a main product image on {listing}. "
            "Amazon may have shown a captcha page; try again, or pass a "
            "direct image URL with --from-url."
        )
    img = fetch_direct_image(image_url, timeout=timeout)
    return img, image_url


def load_from_url_or_asin(
    value: str, timeout: int = 35
) -> tuple[Image.Image, str | None]:
    """Copy a product image from a URL or ASIN.

    Returns (image, source_url_if_known).
    """
    text = value.strip()
    if looks_like_asin(text) or extract_asin(text):
        # Amazon product page or bare ASIN — copy the main listing image.
        if looks_like_asin(text) or "amazon." in urlparse(text).netloc.lower():
            img, src = fetch_amazon_main_image(text, timeout=timeout)
            return img, src
    if text.startswith("http://") or text.startswith("https://"):
        data = http_get(text, timeout=timeout)
        # If we got HTML, try to pull a listing image; otherwise treat as a photo.
        head = data[:256].lstrip()
        if head.lower().startswith(b"<!doctype") or head.lower().startswith(b"<html"):
            html = data.decode("utf-8", "replace")
            image_url = first_hires(html)
            if not image_url:
                raise FetchError(
                    f"URL did not point at an image, and no listing photo was found: {text}"
                )
            return fetch_direct_image(image_url, timeout=timeout), image_url
        return _open_image(data), text
    raise FetchError(f"Not a URL or ASIN: {value!r}")


def save_original(img: Image.Image, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    rgb = img.convert("RGB")
    if dest.suffix.lower() in {".png"}:
        img.convert("RGBA").save(dest, format="PNG")
    else:
        if dest.suffix.lower() not in {".jpg", ".jpeg", ".webp"}:
            dest = dest.with_suffix(".jpg")
        rgb.save(dest, format="JPEG", quality=95, subsampling=0)
    return dest
