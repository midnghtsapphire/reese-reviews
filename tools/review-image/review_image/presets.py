"""Output presets for different uses of the same process.

- review: original-size, white background, light filter (default).
- social: square 1:1 (default 1080) on white, for social posts.
- cutout: transparent PNG of the isolated product (tight crop + padding).
"""

from __future__ import annotations

from dataclasses import dataclass

PRESET_REVIEW = "review"
PRESET_SOCIAL = "social"
PRESET_CUTOUT = "cutout"
PRESET_ALL = "all"

PRESETS = (PRESET_REVIEW, PRESET_SOCIAL, PRESET_CUTOUT, PRESET_ALL)

# Human labels used in the GitHub issue form and parser.
PRESET_LABELS = {
    PRESET_REVIEW: "Review (original-size white background)",
    PRESET_SOCIAL: "Square social (1:1)",
    PRESET_CUTOUT: "Transparent PNG cutout",
}

DEFAULT_SOCIAL_SIZE = 1080


@dataclass(frozen=True)
class PresetSpec:
    name: str
    background: str
    keep_original_size: bool
    square: int | None
    tight: bool
    suffix: str  # filename suffix including extension


SPECS = {
    PRESET_REVIEW: PresetSpec(
        name=PRESET_REVIEW,
        background="white",
        keep_original_size=True,
        square=None,
        tight=False,
        suffix="-final-review.jpg",
    ),
    PRESET_SOCIAL: PresetSpec(
        name=PRESET_SOCIAL,
        background="white",
        keep_original_size=False,
        square=DEFAULT_SOCIAL_SIZE,
        tight=False,
        suffix="-social-square.jpg",
    ),
    PRESET_CUTOUT: PresetSpec(
        name=PRESET_CUTOUT,
        background="transparent",
        keep_original_size=False,
        square=None,
        tight=True,
        suffix="-cutout.png",
    ),
}


def resolve_presets(name: str) -> list[str]:
    if name not in PRESETS:
        raise ValueError(
            f"Unknown preset {name!r}. Choose one of: {', '.join(PRESETS)}"
        )
    if name == PRESET_ALL:
        return [PRESET_REVIEW, PRESET_SOCIAL, PRESET_CUTOUT]
    return [name]


def spec_for(name: str, social_size: int | None = None) -> PresetSpec:
    if name == PRESET_ALL:
        raise ValueError("spec_for() expects a single preset, not 'all'")
    spec = SPECS[name]
    if name == PRESET_SOCIAL and social_size:
        return PresetSpec(
            name=spec.name,
            background=spec.background,
            keep_original_size=spec.keep_original_size,
            square=int(social_size),
            tight=spec.tight,
            suffix=spec.suffix,
        )
    return spec
