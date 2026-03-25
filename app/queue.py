from redis import Redis
from rq import Queue
from rq.job import Retry
from app.config import settings

_redis_conn: Redis | None = None
_queue: Queue | None = None


def get_redis() -> Redis:
    global _redis_conn
    if _redis_conn is None:
        _redis_conn = Redis.from_url(settings.redis_url)
    return _redis_conn


def get_queue() -> Queue:
    global _queue
    if _queue is None:
        _queue = Queue("reese-reviews", connection=get_redis())
    return _queue


def enqueue_stage(func_path: str, *args, **kwargs) -> str:
    q = get_queue()
    retry = Retry(max=3, interval=[5, 30, 120])
    job = q.enqueue(func_path, *args, retry=retry, **kwargs)
    return job.id
