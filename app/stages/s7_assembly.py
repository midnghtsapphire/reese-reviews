import asyncio
import tempfile
import os
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Job, JobStatus
from app.stages import run_stage
from app.clients.spaces import upload_bytes
from app.utils.ffmpeg_helpers import merge_audio_video


async def _run(session: AsyncSession, job: Job) -> None:
    if not job.video_url or not job.audio_url:
        raise ValueError("Video and audio URLs required for assembly")

    async with httpx.AsyncClient(timeout=120) as client:
        video_resp = await client.get(job.video_url)
        video_resp.raise_for_status()
        audio_resp = await client.get(job.audio_url)
        audio_resp.raise_for_status()

    with tempfile.TemporaryDirectory() as tmp:
        video_path = os.path.join(tmp, "video.mp4")
        audio_path = os.path.join(tmp, "audio.mp3")
        output_path = os.path.join(tmp, "final.mp4")

        with open(video_path, "wb") as f:
            f.write(video_resp.content)
        with open(audio_path, "wb") as f:
            f.write(audio_resp.content)

        merge_audio_video(video_path, audio_path, output_path)

        with open(output_path, "rb") as f:
            final_data = f.read()

    key = f"final/{job.job_id}/review.mp4"
    final_url = upload_bytes(final_data, key, content_type="video/mp4")

    job.final_asset_url = final_url
    job.status = JobStatus.distributing
    await session.commit()


def execute(job_id: str) -> None:
    from app.queue import get_queue
    asyncio.run(run_stage(job_id, "s7_assembly", _run))
    q = get_queue()
    from app.stages.s8_distribute import execute as s8
    q.enqueue(s8, job_id)
