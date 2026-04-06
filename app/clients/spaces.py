import logging
import mimetypes
import boto3
from app.clients.vault import get_secret_safe

logger = logging.getLogger(__name__)


def _get_client():
    secrets = get_secret_safe("spaces")
    access_key = secrets.get("access_key") or ""
    secret_key = secrets.get("secret_key") or ""
    region = secrets.get("region") or "nyc3"
    endpoint = secrets.get("endpoint") or f"https://{region}.digitaloceanspaces.com"
    if not access_key or not secret_key:
        raise RuntimeError("DO Spaces credentials not configured")
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    ), secrets.get("bucket", "reese-reviews")


def upload_bytes(data: bytes, key: str, content_type: str | None = None) -> str:
    client, bucket = _get_client()
    if not content_type:
        content_type, _ = mimetypes.guess_type(key)
        content_type = content_type or "application/octet-stream"
    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
        ACL="public-read",
    )
    _, _, region_part = client.meta.endpoint_url.partition("//")
    return f"https://{bucket}.{region_part}/{key}"


def upload_file(local_path: str, key: str) -> str:
    with open(local_path, "rb") as f:
        return upload_bytes(f.read(), key)
