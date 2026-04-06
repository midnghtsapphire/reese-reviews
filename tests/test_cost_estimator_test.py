import pytest
from app.utils.cost_estimator import (
    estimate_openrouter_cost,
    estimate_elevenlabs_cost,
    estimate_leonardo_cost,
    estimate_heygen_cost,
    COST_ALERT_THRESHOLD_USD,
)


def test_openrouter_cost():
    cost = estimate_openrouter_cost(1000, 500)
    assert cost > 0


def test_elevenlabs_cost():
    cost = estimate_elevenlabs_cost("hello world")
    assert cost > 0


def test_leonardo_cost():
    assert estimate_leonardo_cost(4) == pytest.approx(0.08, rel=0.01)


def test_heygen_cost():
    assert estimate_heygen_cost(2.0) == pytest.approx(0.20, rel=0.01)


def test_alert_threshold():
    assert COST_ALERT_THRESHOLD_USD == 2.00
