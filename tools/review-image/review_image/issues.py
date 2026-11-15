"""Parse a GitHub Issue Form body for Product Image Process (WR).

GitHub renders the form as Markdown headings plus the submitted values.
This parser is deliberately tolerant of small wording changes and of
people editing the issue after it is opened. Tests use fixture bodies
and never call GitHub.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from .presets import PRESET_CUTOUT, PRESET_REVIEW, PRESET_SOCIAL, PRESET_LABELS

STEP_COPY = "copy"
STEP_CROP = "crop"
STEP_BACKGROUND = "background"
STEP_TEXT = "remove_text"
STEP_FILTER = "filter"

STEP_ALIASES = {
    "copy the product image": STEP_COPY,
    "copy image": STEP_COPY,
    "copy": STEP_COPY,
    "crop": STEP_CROP,
    "remove background": STEP_BACKGROUND,
    "background removal": STEP_BACKGROUND,
    "remove the background": STEP_BACKGROUND,
    "remove text / watermarks / badges": STEP_TEXT,
    "remove text/watermarks/badges": STEP_TEXT,
    "remove text": STEP_TEXT,
    "remove watermarks": STEP_TEXT,
    "apply filter": STEP_FILTER,
    "filter": STEP_FILTER,
    "light filter": STEP_FILTER,
}

PRESET_ALIASES = {
    "review (original-size white background)": PRESET_REVIEW,
    "review": PRESET_REVIEW,
    "original-size white background": PRESET_REVIEW,
    "original-size white bg": PRESET_REVIEW,
    "square social (1:1)": PRESET_SOCIAL,
    "square social": PRESET_SOCIAL,
    "social": PRESET_SOCIAL,
    "1:1": PRESET_SOCIAL,
    "transparent png cutout": PRESET_CUTOUT,
    "transparent png": PRESET_CUTOUT,
    "cutout": PRESET_CUTOUT,
}

FILTERS = {"light", "none", "glass"}


@dataclass
class ImageProcessRequest:
    product_url_or_asin: str = ""
    image_link: str = ""
    steps: list[str] = field(default_factory=list)
    color_filter: str = "light"
    presets: list[str] = field(default_factory=list)
    notion_page_url: str = ""
    notes: str = ""
    issue_number: int | None = None
    issue_url: str = ""
    title: str = ""

    def steps_or_default(self) -> list[str]:
        """If the filer left every step unchecked, run the full pipeline."""
        return list(self.steps) or [
            STEP_COPY,
            STEP_CROP,
            STEP_BACKGROUND,
            STEP_TEXT,
            STEP_FILTER,
        ]

    def presets_or_default(self) -> list[str]:
        return list(self.presets) or [PRESET_REVIEW]

    def source(self) -> str:
        """Preferred input: product URL/ASIN, else a linked image."""
        return (self.product_url_or_asin or self.image_link or "").strip()

    def wants(self, step: str) -> bool:
        return step in self.steps_or_default()


_HEADING = re.compile(r"^#{1,6}\s+(.*)\s*$")
_CHECKED = re.compile(r"^[-*]\s+\[(x|X)\]\s+(.*)$")
_UNCHECKED = re.compile(r"^[-*]\s+\[\s*\]\s+(.*)$")


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def _is_blank_value(text: str) -> bool:
    stripped = text.strip()
    if not stripped:
        return True
    return _norm(stripped) in {"_no response_", "no response", "n/a", "-"}


def _section_map(body: str) -> dict[str, str]:
    """Split a GitHub form body into {heading: raw section text}."""
    sections: dict[str, str] = {}
    current: str | None = None
    buf: list[str] = []
    for line in body.replace("\r\n", "\n").split("\n"):
        m = _HEADING.match(line)
        if m:
            if current is not None:
                sections[_norm(current)] = "\n".join(buf).strip()
            current = m.group(1)
            buf = []
            continue
        buf.append(line)
    if current is not None:
        sections[_norm(current)] = "\n".join(buf).strip()
    return sections


def _first_matching(sections: dict[str, str], *needles: str) -> str:
    for needle in needles:
        for key, value in sections.items():
            if needle in key:
                return value
    return ""


def _checked_items(section: str) -> list[str]:
    items = []
    for line in section.split("\n"):
        m = _CHECKED.match(line.strip())
        if m:
            items.append(m.group(2).strip())
    return items


def _map_steps(labels: list[str]) -> list[str]:
    out: list[str] = []
    for label in labels:
        key = _norm(label)
        step = STEP_ALIASES.get(key)
        if step and step not in out:
            out.append(step)
    return out


def _map_presets(labels: list[str]) -> list[str]:
    out: list[str] = []
    for label in labels:
        key = _norm(label)
        preset = PRESET_ALIASES.get(key)
        if preset and preset not in out:
            out.append(preset)
        else:
            # Partial match against official form labels
            for official, name in PRESET_LABELS.items():
                if _norm(official) == key or key in _norm(name) or _norm(name) in key:
                    if official not in out:
                        out.append(official)
    return out


def _plain_value(section: str) -> str:
    if _is_blank_value(section):
        return ""
    # Prefer the first non-empty, non-list-heading line
    lines = [ln.strip() for ln in section.split("\n")]
    kept = [ln for ln in lines if ln and not _is_blank_value(ln)]
    return "\n".join(kept).strip()


def parse_issue_body(body: str, *, issue_number: int | None = None,
                     issue_url: str = "", title: str = "") -> ImageProcessRequest:
    sections = _section_map(body or "")
    product = _plain_value(
        _first_matching(
            sections,
            "product url or asin",
            "product url",
            "asin",
            "amazon url",
        )
    )
    image_link = _plain_value(
        _first_matching(
            sections,
            "image (if no url or asin)",
            "attached",
            "linked image",
            "image link",
            "original product photo",
        )
    )
    steps = _map_steps(
        _checked_items(
            _first_matching(sections, "steps", "image processing", "process steps")
        )
    )
    filter_raw = _plain_value(_first_matching(sections, "filter preset", "filter"))
    color_filter = "light"
    if filter_raw:
        token = _norm(filter_raw).split("\n")[0].split()[0]
        if token in FILTERS:
            color_filter = token
    presets = _map_presets(
        _checked_items(
            _first_matching(sections, "output presets", "output preset", "presets")
        )
    )
    notion = _plain_value(
        _first_matching(sections, "notion page", "notion url", "notion")
    )
    notes = _plain_value(_first_matching(sections, "notes", "comments"))
    return ImageProcessRequest(
        product_url_or_asin=product,
        image_link=image_link,
        steps=steps,
        color_filter=color_filter,
        presets=presets,
        notion_page_url=notion,
        notes=notes,
        issue_number=issue_number,
        issue_url=issue_url,
        title=title,
    )
