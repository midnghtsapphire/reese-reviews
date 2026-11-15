"""Pluggable uploaders for a finished photo.

Two supported paths:

1. Token path (Audrey's computer, or a CircleCI context): set NOTION_TOKEN
   and pass --upload-notion / a Notion page URL. NotionTokenUploader talks
   to the Notion API and appends a heading plus the image. It never
   removes existing page content.

2. Connector-run path (Grok Bot / Cursor with the Notion connector): the
   CLI does not hold connector credentials. The agent calls
   notion-create-file-upload, POSTs the file once to upload_url, then
   notion-update-page insert_content at the start of the page under a
   "Final Review Photo" heading. See README ("Notion upload").

Do not commit tokens. Tests never call live Notion.
"""

from __future__ import annotations

from typing import Protocol

from PIL import Image

from .notion_io import upload_final_photo


class Uploader(Protocol):
    def upload(
        self,
        destination: str,
        image: Image.Image,
        *,
        filename: str = "final-review-photo.jpg",
        heading: str | None = None,
    ) -> None:
        """Publish `image` to `destination` (a Notion page URL or id)."""


class NotionTokenUploader:
    """Uses NOTION_TOKEN in the environment. Safe no-op-constructor."""

    def upload(
        self,
        destination: str,
        image: Image.Image,
        *,
        filename: str = "final-review-photo.jpg",
        heading: str | None = None,
    ) -> None:
        # heading is reserved for callers; the Notion helper uses FINAL_LABEL.
        upload_final_photo(destination, image, filename=filename)


def default_uploader() -> NotionTokenUploader:
    return NotionTokenUploader()
