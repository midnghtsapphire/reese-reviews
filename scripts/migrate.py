#!/usr/bin/env python3
"""Run database migrations using SQLAlchemy."""
import asyncio
import logging
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import get_engine, Base
import app.models  # noqa: F401 — ensure all models are imported

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def migrate():
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Migrations complete")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())
