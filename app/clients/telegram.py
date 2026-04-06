import logging
from datetime import datetime
from typing import Optional
import httpx
from app.config import settings
from app.clients.vault import get_secret_safe

logger = logging.getLogger(__name__)

_bot_token: str | None = None
_chat_id: str | None = None


def _load_telegram_creds() -> tuple[str, str]:
    global _bot_token, _chat_id
    if _bot_token and _chat_id:
        return _bot_token, _chat_id

    secrets = get_secret_safe("telegram")
    _bot_token = secrets.get("bot_token") or settings.telegram_bot_token
    _chat_id = secrets.get("chat_id") or settings.telegram_chat_id

    if not _bot_token or not _chat_id:
        raise RuntimeError("Telegram credentials not configured")

    return _bot_token, _chat_id


async def send_message(text: str) -> bool:
    try:
        token, chat_id = _load_telegram_creds()
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"})
            resp.raise_for_status()
        return True
    except Exception as exc:
        logger.error("Telegram send failed: %s", exc)
        return False


def send_message_sync(text: str) -> bool:
    try:
        token, chat_id = _load_telegram_creds()
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        with httpx.Client(timeout=10) as client:
            resp = client.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"})
            resp.raise_for_status()
        return True
    except Exception as exc:
        logger.error("Telegram send failed: %s", exc)
        return False


def notify_job_queued(job_id: str, product_name: str) -> None:
    send_message_sync(f"🟡 <b>Job Queued</b>\nJob: <code>{job_id}</code>\nProduct: {product_name}")


def notify_stage_start(job_id: str, stage: str) -> None:
    send_message_sync(f"⏳ <b>Stage Starting</b>: {stage}\nJob: <code>{job_id}</code>")


def notify_stage_complete(job_id: str, stage: str, duration_s: float) -> None:
    send_message_sync(
        f"✅ <b>Stage Complete</b>: {stage}\nJob: <code>{job_id}</code>\nDuration: {duration_s:.1f}s"
    )


def notify_awaiting_approval(job_id: str, review_text: str) -> None:
    preview = review_text[:300] + ("…" if len(review_text) > 300 else "")
    send_message_sync(
        f"🔔 <b>Awaiting Approval</b>\nJob: <code>{job_id}</code>\n\n{preview}\n\n"
        f"Reply: /approve {job_id} or /reject {job_id}"
    )


def notify_job_complete(job_id: str, final_url: Optional[str]) -> None:
    link = f"\n🎬 <a href='{final_url}'>View final asset</a>" if final_url else ""
    send_message_sync(f"🎉 <b>Job Complete</b>\nJob: <code>{job_id}</code>{link}")


def notify_job_failed(job_id: str, stage: str, error: str) -> None:
    send_message_sync(
        f"❌ <b>Job Failed</b>\nJob: <code>{job_id}</code>\nStage: {stage}\nError: {error[:300]}"
    )


def notify_cost_alert(job_id: str, cost_usd: float) -> None:
    send_message_sync(
        f"💰 <b>Cost Alert</b>\nJob: <code>{job_id}</code>\nAccumulated cost: ${cost_usd:.2f} (threshold: $2.00)"
    )
