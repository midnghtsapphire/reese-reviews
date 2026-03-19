#!/usr/bin/env python3
"""Seed a test order and job for local development."""
import asyncio
import logging
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import get_session_factory
from app.models import Order, Job, JobStatus, OrderCategory, ReviewPersona, ReviewTone

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed():
    factory = get_session_factory()
    async with factory() as session:
        order = Order(
            product_name="Test Product — Wireless Headphones",
            asin="B08HVZBJ2Y",
            category=OrderCategory.electronics,
            purchase_price=79.99,
            review_persona=ReviewPersona.reese,
            review_tone=ReviewTone.balanced,
            target_platform=["youtube", "amazon"],
        )
        session.add(order)
        await session.flush()

        job = Job(order_id=order.order_id, status=JobStatus.queued, stage_statuses={})
        session.add(job)
        await session.commit()

        logger.info("Created order %s and job %s", order.order_id, job.job_id)


if __name__ == "__main__":
    asyncio.run(seed())
