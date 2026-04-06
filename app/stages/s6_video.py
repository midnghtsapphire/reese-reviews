import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Job, JobStatus, JobCost
from app.stages import run_stage
from app.clients.heygen import generate_video
from app.clients.vault import get_secret_safe
from app.clients.telegram import notify_cost_alert
from app.utils.cost_estimator import estimate_heygen_cost, COST_ALERT_THRESHOLD_USD


async def _run(session: AsyncSession, job: Job) -> None:
    if not job.audio_url:
        raise ValueError("No audio URL available for video production")

    secrets = get_secret_safe("heygen")
    avatar_id = secrets.get("avatar_id") or ""
    if not avatar_id:
        raise RuntimeError("HeyGen avatar_id not configured")

    estimated_cost = estimate_heygen_cost(2.0)
    if estimated_cost > COST_ALERT_THRESHOLD_USD:
        notify_cost_alert(job.job_id, estimated_cost)

    video_url = await generate_video(
        avatar_id=avatar_id,
        audio_url=job.audio_url,
        script=job.review_script or "",
    )

    cost_record = JobCost(job_id=job.job_id, stage="s6_video", service="heygen", amount_usd=estimated_cost)
    session.add(cost_record)

    job.video_url = video_url
    await session.commit()


def execute(job_id: str) -> None:
    from app.queue import get_queue
    asyncio.run(run_stage(job_id, "s6_video", _run))
    q = get_queue()
    from app.stages.s7_assembly import execute as s7
    q.enqueue(s7, job_id)
