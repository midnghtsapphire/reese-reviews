import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Job, JobStatus
from app.stages import run_stage


async def _run(session: AsyncSession, job: Job) -> None:
    job.status = JobStatus.researching
    job.updated_at = datetime.utcnow()
    await session.commit()


def execute(job_id: str) -> None:
    from app.queue import get_queue
    asyncio.run(run_stage(job_id, "s1_ingest", _run))
    q = get_queue()
    from app.stages.s2_research import execute as s2
    q.enqueue(s2, job_id)
