from app.models import Order


def research_prompt(order: Order) -> str:
    return (
        f"Research the product '{order.product_name}'"
        + (f" (ASIN: {order.asin})" if order.asin else "")
        + (f" from {order.product_url}" if order.product_url else "")
        + f" in the category '{order.category}'. "
        "Provide a JSON object with keys: "
        "'product_description' (string), 'key_features' (list of strings), "
        "'pros' (list of strings), 'cons' (list of strings), "
        "'competitor_context' (string)."
    )


def review_gen_prompt(order: Order, research: dict) -> str:
    tone = order.review_tone
    persona = order.review_persona
    price = f"${order.purchase_price:.2f}" if order.purchase_price else "unspecified price"
    return (
        f"You are writing a {tone} product review as the '{persona}' persona. "
        f"Product: {order.product_name}, Price paid: {price}. "
        f"Research data: {research}. "
        f"Usage notes: {order.usage_notes or 'None provided'}. "
        "Return a JSON object with keys: "
        "'review_text' (full written review, 200-400 words), "
        "'review_script' (spoken video script, max 2000 chars), "
        "'star_rating' (float 1-5), "
        "'pros' (list of 3-5 strings), "
        "'cons' (list of 1-3 strings)."
    )


def image_gen_prompt(order: Order, review_data: dict) -> str:
    return (
        f"Product photography for '{order.product_name}'. "
        "Generate 4 high-quality images: "
        "1. Hero product shot on clean white/gradient background, "
        "2. Lifestyle scene showing product in use, "
        "3. Feature callout detail shot, "
        "4. Star rating card overlay with product thumbnail. "
        "Professional photography style, 4K quality, studio lighting."
    )
