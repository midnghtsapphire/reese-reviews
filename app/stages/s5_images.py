import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Job, JobStatus, JobCost, Order
from app.stages import run_stage
from app.clients.leonardo import generate_images
from app.utils.prompts import image_gen_prompt
from app.utils.cost_estimator import estimate_leonardo_cost


async def _run(session: AsyncSession, job: Job) -> None:
    order = await session.get(Order, job.order_id)
    if not order:
        raise ValueError(f"Order {job.order_id} not found")

    stage_statuses = dict(job.stage_statuses or {})
    research_data = (stage_statuses.get("s2_research") or {}).get("research_data", {})
    prompt = image_gen_prompt(order, research_data)

    image_urls = await generate_images(prompt, num_images=4)

    cost = estimate_leonardo_cost(4)
    cost_record = JobCost(job_id=job.job_id, stage="s5_images", service="leonardo", amount_usd=cost)
    session.add(cost_record)

    job.image_urls = image_urls
    await session.commit()


def execute(job_id: str) -> None:
    from app.queue import get_queue
    asyncio.run(run_stage(job_id, "s5_images", _run))
    q = get_queue()
    from app.stages.s6_video import execute as s6
    q.enqueue(s6, job_id)
