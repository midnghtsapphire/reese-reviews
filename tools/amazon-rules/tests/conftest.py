from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def root() -> Path:
    return ROOT


@pytest.fixture
def examples() -> Path:
    return ROOT / "examples"


@pytest.fixture
def packs() -> Path:
    return ROOT / "packs"
