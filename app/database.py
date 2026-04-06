import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.clients.vault import get_secret_safe

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


def _build_database_url() -> str:
    env_url = os.getenv("DATABASE_URL", "")
    if env_url:
        if env_url.startswith("postgresql://"):
            return env_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return env_url

    secrets = get_secret_safe("supabase")
    if secrets.get("url") and secrets.get("service_key"):
        raw_url = secrets["url"]
        if raw_url.startswith("postgresql://"):
            raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return raw_url

    fallback = "postgresql+asyncpg://postgres:postgres@localhost:5432/reese_reviews"
    logger.warning("No DATABASE_URL configured; falling back to local: %s", fallback)
    return fallback


_engine = None
_session_factory = None


def get_engine():
    global _engine
    if _engine is None:
        db_url = _build_database_url()
        _engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
    return _engine


def get_session_factory():
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_engine(), expire_on_commit=False, class_=AsyncSession
        )
    return _session_factory


async def get_db() -> AsyncSession:  # type: ignore[return]
    factory = get_session_factory()
    async with factory() as session:
        yield session
