import asyncio
import logging
import httpx
from app.clients.vault import get_secret_safe

logger = logging.getLogger(__name__)
HEYGEN_BASE = "https://api.heygen.com"


def _get_api_key() -> str:
    secrets = get_secret_safe("heygen")
    key = secrets.get("api_key") or ""
    if not key:
        raise RuntimeError("HeyGen API key not configured")
    return key


async def generate_video(
    avatar_id: str,
    audio_url: str,
    script: str,
    poll_interval: int = 10,
    max_polls: int = 60,
) -> str:
    api_key = _get_api_key()
    headers = {"X-Api-Key": api_key, "Content-Type": "application/json"}
    payload = {
        "video_inputs": [
            {
                "character": {"type": "avatar", "avatar_id": avatar_id},
                "voice": {"type": "audio", "audio_url": audio_url},
            }
        ],
        "dimension": {"width": 1080, "height": 1920},
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{HEYGEN_BASE}/v2/video/generate", headers=headers, json=payload)
        resp.raise_for_status()
        video_id = resp.json()["data"]["video_id"]

    for _ in range(max_polls):
        await asyncio.sleep(poll_interval)
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{HEYGEN_BASE}/v1/video_status.get", params={"video_id": video_id}, headers=headers)
            resp.raise_for_status()
            data = resp.json()["data"]

        if data["status"] == "completed":
            return data["video_url"]
        if data["status"] == "failed":
            raise RuntimeError(f"HeyGen video generation failed: {data.get('error')}")

    raise TimeoutError("HeyGen video generation timed out")
