from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import Job, JobStatus, JobOut
from app.queue import get_queue

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/{job_id}/approve")
async def approve_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != JobStatus.awaiting_approval:
        raise HTTPException(status_code=400, detail=f"Job is not awaiting approval (current: {job.status})")

    job.status = JobStatus.synthesizing
    await db.commit()

    q = get_queue()
    from app.stages.s4_voice import execute as s4
    q.enqueue(s4, job_id)

    return {"message": "Job approved, continuing pipeline", "job_id": job_id}


@router.post("/{job_id}/reject")
async def reject_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != JobStatus.awaiting_approval:
        raise HTTPException(status_code=400, detail=f"Job is not awaiting approval (current: {job.status})")

    job.status = JobStatus.rejected
    await db.commit()

    return {"message": "Job rejected", "job_id": job_id}
