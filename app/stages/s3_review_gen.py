import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Job, JobStatus, Order
from app.stages import run_stage
from app.clients.openrouter import chat_completion
from app.clients.telegram import notify_awaiting_approval
from app.utils.prompts import review_gen_prompt

REVIEW_SCHEMA = {
    "name": "review_result",
    "schema": {
        "type": "object",
        "properties": {
            "review_text": {"type": "string"},
            "review_script": {"type": "string"},
            "star_rating": {"type": "number"},
            "pros": {"type": "array", "items": {"type": "string"}},
            "cons": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["review_text", "review_script", "star_rating"],
    },
}


async def _run(session: AsyncSession, job: Job) -> None:
    order = await session.get(Order, job.order_id)
    if not order:
        raise ValueError(f"Order {job.order_id} not found")

    stage_statuses = dict(job.stage_statuses or {})
    research_data = (stage_statuses.get("s2_research") or {}).get("research_data", {})

    messages = [
        {"role": "system", "content": "You are a professional product reviewer. Return valid JSON only."},
        {"role": "user", "content": review_gen_prompt(order, research_data)},
    ]
    review_data = await chat_completion(messages, response_schema=REVIEW_SCHEMA)

    job.review_text = review_data.get("review_text", "")
    job.review_script = review_data.get("review_script", "")
    job.star_rating = float(review_data.get("star_rating", 3.0))
    job.status = JobStatus.awaiting_approval
    await session.commit()

    notify_awaiting_approval(job.job_id, job.review_text or "")


def execute(job_id: str) -> None:
    asyncio.run(run_stage(job_id, "s3_review_gen", _run))
