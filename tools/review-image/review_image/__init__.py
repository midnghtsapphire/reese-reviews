"""Process a product photo into review, social, or cutout versions."""

__version__ = "0.2.0"

from .process import process_image

__all__ = ["process_image", "__version__"]
