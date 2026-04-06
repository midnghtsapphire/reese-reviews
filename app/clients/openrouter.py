import logging
import json
from typing import Any
import httpx
from app.clients.vault import get_secret_safe
from app.config import settings

logger = logging.getLogger(__name__)

OPENROUTER_BASE = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "anthropic/claude-sonnet-4"


def _get_api_key() -> str:
    secrets = get_secret_safe("openrouter")
    key = secrets.get("api_key") or ""
    if not key:
        raise RuntimeError("OpenRouter API key not configured")
    return key


async def chat_completion(
    messages: list[dict[str, str]],
    model: str = DEFAULT_MODEL,
    response_schema: dict[str, Any] | None = None,
) -> dict[str, Any]:
    api_key = _get_api_key()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://reesereviews.com",
        "X-Title": "Reese Reviews",
    }
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
    }
    if response_schema:
        payload["response_format"] = {"type": "json_schema", "json_schema": response_schema}

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(f"{OPENROUTER_BASE}/chat/completions", headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

    content = data["choices"][0]["message"]["content"]
    if response_schema:
        return json.loads(content)
    return {"content": content}
