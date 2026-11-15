"""Load an Original Product Photo from a local path or HTTP(S) URL."""

from __future__ import annotations

import io
from pathlib import Path
from urllib.parse import urlparse

import requests
from PIL import Image

USER_AGENT = "review-image/0.1 (reese-reviews local tool; no tracking)"


def default_output_path(
    source: Path,
    background: str = "white",
    preset: str = "review",
) -> Path:
    """Output path next to the input, named for the preset."""
    from .presets import spec_for

    if preset and preset != "review":
        suffix = spec_for(preset).suffix
        return source.with_name(f"{source.stem}{suffix}")
    ext = ".png" if background == "transparent" else ".jpg"
    return source.with_name(f"{source.stem}-final-review{ext}")


def load_image(source: str, timeout: int = 30) -> tuple[Image.Image, Path | None]:
    """Return (image, local_path_or_None). local_path is set for file inputs."""
    parsed = urlparse(source)
    if parsed.scheme in {"http", "https"}:
        resp = requests.get(
            source,
            timeout=timeout,
            headers={"User-Agent": USER_AGENT},
        )
        resp.raise_for_status()
        img = Image.open(io.BytesIO(resp.content))
        img.load()
        return img, None
    path = Path(source).expanduser().resolve()
    if not path.is_file():
        raise FileNotFoundError(f"Original Product Photo not found: {path}")
    img = Image.open(path)
    img.load()
    return img, path


def save_image(img: Image.Image, dest: Path, background: str = "white") -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest = Path(dest)
    if background == "transparent" or dest.suffix.lower() == ".png":
        if dest.suffix.lower() not in {".png"}:
            dest = dest.with_suffix(".png")
        img.convert("RGBA").save(dest, format="PNG")
    else:
        rgb = img.convert("RGB")
        rgb.save(dest, format="JPEG", quality=95, subsampling=0, optimize=True)
    return dest
