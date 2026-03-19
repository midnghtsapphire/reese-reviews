import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.routers import orders, jobs, webhooks

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Reese Reviews API starting up")
    yield
    logger.info("Reese Reviews API shutting down")


app = FastAPI(
    title="Reese Reviews API",
    description="Automated review generation pipeline for Reese Reviews",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(orders.router)
app.include_router(jobs.router)
app.include_router(webhooks.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "reese-reviews-api"}
