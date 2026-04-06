import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Job, JobStatus
from app.stages import run_stage
from app.clients.telegram import notify_job_complete


async def _run(session: AsyncSession, job: Job) -> None:
    job.status = JobStatus.done
    job.telegram_notified_at = datetime.utcnow()
    await session.commit()
    notify_job_complete(job.job_id, job.final_asset_url)


def execute(job_id: str) -> None:
    asyncio.run(run_stage(job_id, "s8_distribute", _run))
