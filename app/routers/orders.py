from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import Order, Job, JobStatus, OrderCreate, OrderOut, JobOut
from app.clients.telegram import notify_job_queued
from app.queue import get_queue
from app.stages.s1_ingest import execute as s1_execute

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=JobOut, status_code=201)
async def create_order(payload: OrderCreate, db: AsyncSession = Depends(get_db)):
    order = Order(**payload.model_dump())
    db.add(order)
    await db.flush()

    job = Job(order_id=order.order_id, status=JobStatus.queued, stage_statuses={})
    db.add(job)
    await db.commit()
    await db.refresh(job)

    q = get_queue()
    q.enqueue(s1_execute, job.job_id)
    notify_job_queued(job.job_id, order.product_name)

    return job


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: str, db: AsyncSession = Depends(get_db)):
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
