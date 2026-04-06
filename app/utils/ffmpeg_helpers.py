import subprocess
import logging
import os

logger = logging.getLogger(__name__)


def merge_audio_video(video_path: str, audio_path: str, output_path: str) -> str:
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac",
        "-shortest",
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")
    return output_path


def concat_audio_parts(audio_paths: list[str], output_path: str) -> str:
    list_file = output_path + ".list.txt"
    with open(list_file, "w") as f:
        for p in audio_paths:
            f.write(f"file '{os.path.abspath(p)}'\n")
    cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_file, "-c", "copy", output_path]
    result = subprocess.run(cmd, capture_output=True, text=True)
    os.unlink(list_file)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg concat failed: {result.stderr}")
    return output_path
