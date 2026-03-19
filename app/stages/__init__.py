import asyncio
import traceback
import logging
from datetime import datetime
from typing import Callable, Awaitable
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session_factory
from app.models import Job, JobStatus, JobError
from app.clients.telegram import notify_stage_start, notify_stage_complete, notify_job_failed

logger = logging.getLogger(__name__)


async def _update_job(session: AsyncSession, job: Job, **kwargs) -> None:
    for key, value in kwargs.items():
        setattr(job, key, value)
    await session.commit()


async def run_stage(
    job_id: str,
    stage_name: str,
    stage_fn: Callable[[AsyncSession, Job], Awaitable[None]],
) -> None:
    factory = get_session_factory()
    async with factory() as session:
        job = await session.get(Job, job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found")

        stage_statuses = dict(job.stage_statuses or {})
        stage_statuses[stage_name] = {"status": "running", "started_at": datetime.utcnow().isoformat()}
        job.stage_statuses = stage_statuses
        await session.commit()

        notify_stage_start(job_id, stage_name)
        start_time = datetime.utcnow()

        try:
            await stage_fn(session, job)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            stage_statuses = dict(job.stage_statuses or {})
            stage_statuses[stage_name] = {
                "status": "complete",
                "started_at": start_time.isoformat(),
                "processed_at": datetime.utcnow().isoformat(),
                "duration_s": elapsed,
            }
            job.stage_statuses = stage_statuses
            await session.commit()
            notify_stage_complete(job_id, stage_name, elapsed)
        except Exception as exc:
            tb = traceback.format_exc()
            logger.error("Stage %s failed for job %s: %s", stage_name, job_id, exc)
            stage_statuses = dict(job.stage_statuses or {})
            stage_statuses[stage_name] = {
                "status": "failed",
                "error": str(exc),
                "started_at": start_time.isoformat(),
                "processed_at": datetime.utcnow().isoformat(),
            }
            job.stage_statuses = stage_statuses
            job.status = JobStatus.failed
            await session.commit()

            err = JobError(job_id=job_id, stage=stage_name, message=str(exc), stack_trace=tb)
            session.add(err)
            await session.commit()
            notify_job_failed(job_id, stage_name, str(exc))
            raise
