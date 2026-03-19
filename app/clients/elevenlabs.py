import logging
import math
from typing import AsyncIterator
import httpx
from app.clients.vault import get_secret_safe

logger = logging.getLogger(__name__)

ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"
MAX_CHARS = 2500


def _get_creds() -> tuple[str, str]:
    secrets = get_secret_safe("elevenlabs")
    api_key = secrets.get("api_key") or ""
    voice_id = secrets.get("reese_voice_id") or ""
    if not api_key or not voice_id:
        raise RuntimeError("ElevenLabs credentials not configured")
    return api_key, voice_id


def _split_script(script: str) -> list[str]:
    if len(script) <= MAX_CHARS:
        return [script]
    chunks: list[str] = []
    words = script.split()
    current: list[str] = []
    length = 0
    for word in words:
        if length + len(word) + 1 > MAX_CHARS:
            chunks.append(" ".join(current))
            current = [word]
            length = len(word)
        else:
            current.append(word)
            length += len(word) + 1
    if current:
        chunks.append(" ".join(current))
    return chunks


async def synthesize(script: str) -> list[bytes]:
    api_key, voice_id = _get_creds()
    chunks = _split_script(script)
    audio_parts: list[bytes] = []
    url = f"{ELEVENLABS_BASE}/text-to-speech/{voice_id}"
    headers = {"xi-api-key": api_key, "Content-Type": "application/json"}
    payload = {
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.50,
            "similarity_boost": 0.80,
            "style": 0.35,
            "use_speaker_boost": True,
        },
    }
    async with httpx.AsyncClient(timeout=120) as client:
        for chunk in chunks:
            body = {**payload, "text": chunk}
            resp = await client.post(url, headers=headers, json=body)
            resp.raise_for_status()
            audio_parts.append(resp.content)
    return audio_parts
