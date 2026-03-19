from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session_factory
from app.models import Job, JobStatus
from app.queue import get_queue

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/telegram")
async def telegram_webhook(request: Request):
    data = await request.json()
    message = data.get("message") or data.get("edited_message") or {}
    text: str = (message.get("text") or "").strip()

    if not text:
        return {"ok": True}

    parts = text.split()
    if len(parts) < 2:
        return {"ok": True}

    command, job_id = parts[0].lower(), parts[1]

    factory = get_session_factory()
    async with factory() as session:
        job = await session.get(Job, job_id)
        if not job:
            return {"ok": True, "error": "Job not found"}

        if command == "/approve":
            if job.status != JobStatus.awaiting_approval:
                return {"ok": True, "error": f"Job not awaiting approval (status: {job.status})"}
            job.status = JobStatus.synthesizing
            await session.commit()
            q = get_queue()
            from app.stages.s4_voice import execute as s4
            q.enqueue(s4, job_id)

        elif command == "/reject":
            if job.status != JobStatus.awaiting_approval:
                return {"ok": True, "error": f"Job not awaiting approval (status: {job.status})"}
            job.status = JobStatus.rejected
            await session.commit()

    return {"ok": True}
