import logging
import threading
from typing import Any
import hvac
from app.config import settings

logger = logging.getLogger(__name__)

_lock = threading.Lock()


class VaultConnectionError(Exception):
    pass


_client: hvac.Client | None = None


def reset_client() -> None:
    """Reset the cached Vault client (used in tests)."""
    global _client
    with _lock:
        _client = None


def _get_client() -> hvac.Client:
    global _client
    with _lock:
        if _client is None or not _client.is_authenticated():
            client = hvac.Client(url=settings.vault_addr, token=settings.vault_token)
            try:
                if not client.is_authenticated():
                    raise VaultConnectionError("Vault token authentication failed")
            except Exception as exc:
                if settings.environment == "production":
                    raise VaultConnectionError(f"Cannot reach Vault in production: {exc}") from exc
                logger.warning("Vault unavailable in non-production environment: %s", exc)
                raise VaultConnectionError(f"Vault unreachable: {exc}") from exc
            _client = client
    return _client


def get_secret(service: str) -> dict[str, Any]:
    client = _get_client()
    path = f"secret/reese-reviews/{service}"
    try:
        response = client.secrets.kv.v1.read_secret(path=path)
        return response["data"]
    except Exception as exc:
        raise VaultConnectionError(f"Failed to read secret at {path}: {exc}") from exc


def get_secret_safe(service: str) -> dict[str, Any]:
    """Return empty dict if Vault is unavailable (development only)."""
    if settings.environment == "production":
        return get_secret(service)
    try:
        return get_secret(service)
    except VaultConnectionError:
        logger.warning("Vault unavailable; returning empty secrets for '%s'", service)
        return {}
