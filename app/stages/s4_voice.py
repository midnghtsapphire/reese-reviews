import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Job, JobStatus, JobCost
from app.stages import run_stage
from app.clients.elevenlabs import synthesize
from app.clients.spaces import upload_bytes
from app.clients.telegram import notify_cost_alert
from app.utils.cost_estimator import estimate_elevenlabs_cost, COST_ALERT_THRESHOLD_USD


async def _run(session: AsyncSession, job: Job) -> None:
    script = job.review_script or job.review_text or ""
    if not script:
        raise ValueError("No review script available for voice synthesis")

    audio_parts = await synthesize(script)
    audio_data = b"".join(audio_parts)

    key = f"audio/{job.job_id}/narration.mp3"
    audio_url = upload_bytes(audio_data, key, content_type="audio/mpeg")

    cost = estimate_elevenlabs_cost(script)
    cost_record = JobCost(job_id=job.job_id, stage="s4_voice", service="elevenlabs", amount_usd=cost)
    session.add(cost_record)

    job.audio_url = audio_url
    job.status = JobStatus.rendering
    await session.commit()

    if cost > COST_ALERT_THRESHOLD_USD:
        notify_cost_alert(job.job_id, cost)


def execute(job_id: str) -> None:
    from app.queue import get_queue
    asyncio.run(run_stage(job_id, "s4_voice", _run))
    q = get_queue()
    from app.stages.s5_images import execute as s5
    q.enqueue(s5, job_id)
