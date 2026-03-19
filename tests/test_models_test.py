import pytest
from app.models import OrderCreate, OrderCategory, ReviewPersona, ReviewTone


def test_order_create_defaults():
    order = OrderCreate(product_name="Test Product")
    assert order.review_persona == ReviewPersona.reese
    assert order.review_tone == ReviewTone.balanced
    assert order.category == OrderCategory.other
    assert order.target_platform == []


def test_order_create_with_values():
    order = OrderCreate(
        product_name="Headphones",
        asin="B08ABCDEF",
        category=OrderCategory.electronics,
        purchase_price=79.99,
        review_persona=ReviewPersona.audrey,
        review_tone=ReviewTone.enthusiastic,
        target_platform=["youtube", "amazon"],
    )
    assert order.product_name == "Headphones"
    assert order.purchase_price == 79.99
    assert "youtube" in order.target_platform
