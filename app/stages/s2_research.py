import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Job, JobStatus, Order
from app.stages import run_stage
from app.clients.openrouter import chat_completion
from app.utils.prompts import research_prompt

RESEARCH_SCHEMA = {
    "name": "research_result",
    "schema": {
        "type": "object",
        "properties": {
            "product_description": {"type": "string"},
            "key_features": {"type": "array", "items": {"type": "string"}},
            "pros": {"type": "array", "items": {"type": "string"}},
            "cons": {"type": "array", "items": {"type": "string"}},
            "competitor_context": {"type": "string"},
        },
        "required": ["product_description", "key_features", "pros", "cons"],
    },
}


async def _run(session: AsyncSession, job: Job) -> None:
    order = await session.get(Order, job.order_id)
    if not order:
        raise ValueError(f"Order {job.order_id} not found")

    messages = [
        {"role": "system", "content": "You are a product research assistant. Return valid JSON only."},
        {"role": "user", "content": research_prompt(order)},
    ]
    research_data = await chat_completion(messages, response_schema=RESEARCH_SCHEMA)

    stage_statuses = dict(job.stage_statuses or {})
    stage_statuses["s2_research"] = {
        **(stage_statuses.get("s2_research") or {}),
        "research_data": research_data,
    }
    job.stage_statuses = stage_statuses
    job.status = JobStatus.generating
    await session.commit()


def execute(job_id: str) -> None:
    from app.queue import get_queue
    asyncio.run(run_stage(job_id, "s2_research", _run))
    q = get_queue()
    from app.stages.s3_review_gen import execute as s3
    q.enqueue(s3, job_id)
