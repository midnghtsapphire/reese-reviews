import asyncio
import logging
import httpx
from app.clients.vault import get_secret_safe

logger = logging.getLogger(__name__)
LEONARDO_BASE = "https://cloud.leonardo.ai/api/rest/v1"


def _get_api_key() -> str:
    secrets = get_secret_safe("leonardo")
    key = secrets.get("api_key") or ""
    if not key:
        raise RuntimeError("Leonardo API key not configured")
    return key


async def generate_images(
    prompt: str,
    num_images: int = 4,
    width: int = 1024,
    height: int = 1024,
    poll_interval: int = 5,
    max_polls: int = 30,
) -> list[str]:
    api_key = _get_api_key()
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "prompt": prompt,
        "num_images": num_images,
        "width": width,
        "height": height,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{LEONARDO_BASE}/generations", headers=headers, json=payload)
        resp.raise_for_status()
        generation_id = resp.json()["sdGenerationJob"]["generationId"]

    for _ in range(max_polls):
        await asyncio.sleep(poll_interval)
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{LEONARDO_BASE}/generations/{generation_id}", headers=headers
            )
            resp.raise_for_status()
            data = resp.json()["generations_by_pk"]

        if data["status"] == "COMPLETE":
            return [img["url"] for img in data["generated_images"]]
        if data["status"] == "FAILED":
            raise RuntimeError(f"Leonardo generation failed: {generation_id}")

    raise TimeoutError(f"Leonardo generation timed out after {max_polls * poll_interval}s")
