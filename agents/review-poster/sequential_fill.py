"""Fill a review form one field at a time, with a pause between fields.

Order: title, then images, then the written review.
Star rating is set during the title step when the form needs it.
This module never clicks Submit.
"""

from __future__ import annotations

import random
import time
from dataclasses import dataclass, field
from typing import Callable, Protocol

STEPS = ("headline", "photos", "body")
STEP_LABELS = {"headline": "Title", "photos": "Images", "body": "Review"}
DEFAULT_DELAY = (3.0, 6.0)


class FormAdapter(Protocol):
    def set_rating(self, stars: int) -> None: ...
    def set_title(self, title: str) -> None: ...
    def attach_photos(self, paths: list[str]) -> None: ...
    def set_body(self, body: str) -> None: ...


ProgressFn = Callable[[str, str, str], None]


@dataclass
class FillConfig:
    delay_min: float = 3.0
    delay_max: float = 6.0
    sleep: Callable[[float], None] = time.sleep
    random: Callable[[], float] = random.random
    include_rating_with_title: bool = True

    def pick_delay(self) -> float:
        lo, hi = sorted((self.delay_min, self.delay_max))
        return round(lo + self.random() * (hi - lo), 1)


@dataclass
class FillResult:
    steps_done: list[str] = field(default_factory=list)
    delays: list[float] = field(default_factory=list)
    awaiting_human_submit: bool = False
    message: str = ""


def _report(progress: ProgressFn | None, key: str, state: str, detail: str) -> None:
    if progress:
        progress(key, state, detail)
    print(f"[{STEP_LABELS.get(key, key)}] {state}: {detail}", flush=True)


def run_fill(
    adapter: FormAdapter,
    *,
    title: str,
    body: str,
    photo_paths: list[str],
    rating: int | None = None,
    config: FillConfig | None = None,
    progress: ProgressFn | None = None,
) -> FillResult:
    """Fill title, wait, images, wait, review. Do not submit."""
    cfg = config or FillConfig()
    result = FillResult()

    _report(progress, "headline", "filling", "Writing the title.")
    if cfg.include_rating_with_title and rating is not None:
        adapter.set_rating(rating)
    adapter.set_title(title)
    _report(progress, "headline", "done", "Title is in.")
    result.steps_done.append("headline")

    delay = cfg.pick_delay()
    result.delays.append(delay)
    _report(progress, "photos", "waiting", f"Waiting {delay}s before images.")
    cfg.sleep(delay)

    _report(progress, "photos", "filling", f"Adding {len(photo_paths)} image(s).")
    adapter.attach_photos(photo_paths)
    _report(progress, "photos", "done", "Images are in.")
    result.steps_done.append("photos")

    delay = cfg.pick_delay()
    result.delays.append(delay)
    _report(progress, "body", "waiting", f"Waiting {delay}s before the review.")
    cfg.sleep(delay)

    _report(progress, "body", "filling", "Writing the review.")
    adapter.set_body(body)
    _report(progress, "body", "done", "Review is in.")
    result.steps_done.append("body")

    result.awaiting_human_submit = True
    result.message = "Title, images, and review are in. Please press Submit yourself."
    print(result.message, flush=True)
    return result


def parse_delay_arg(value: str) -> tuple[float, float]:
    """Parse --delay 4 or --delay 3-6 into a min/max pair of seconds."""
    text = value.strip()
    if "-" in text:
        left, right = text.split("-", 1)
        return float(left), float(right)
    fixed = float(text)
    return fixed, fixed
