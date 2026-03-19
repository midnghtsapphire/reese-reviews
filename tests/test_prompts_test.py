from unittest.mock import MagicMock
from app.utils.prompts import research_prompt, review_gen_prompt, image_gen_prompt


def _make_order(**kwargs):
    from app.models import OrderCategory, ReviewPersona, ReviewTone
    order = MagicMock()
    order.product_name = kwargs.get("product_name", "Test Product")
    order.asin = kwargs.get("asin", None)
    order.product_url = kwargs.get("product_url", None)
    order.category = kwargs.get("category", OrderCategory.electronics)
    order.purchase_price = kwargs.get("purchase_price", 99.99)
    order.review_tone = kwargs.get("review_tone", ReviewTone.balanced)
    order.review_persona = kwargs.get("review_persona", ReviewPersona.reese)
    order.usage_notes = kwargs.get("usage_notes", None)
    return order


def test_research_prompt_contains_product_name():
    order = _make_order(product_name="Sony WH-1000XM5")
    prompt = research_prompt(order)
    assert "Sony WH-1000XM5" in prompt


def test_review_gen_prompt_contains_tone():
    order = _make_order()
    prompt = review_gen_prompt(order, {"key_features": ["Great sound"]})
    assert "balanced" in prompt


def test_image_gen_prompt_contains_product():
    order = _make_order(product_name="Nike Air Max")
    prompt = image_gen_prompt(order, {})
    assert "Nike Air Max" in prompt
