import pytest
from unittest.mock import patch, MagicMock
from app.clients.vault import VaultConnectionError


def test_vault_connection_error_in_production():
    with patch("app.config.settings") as mock_settings:
        mock_settings.environment = "production"
        mock_settings.vault_addr = "http://unreachable:8200"
        mock_settings.vault_token = "bad-token"

        import hvac
        with patch("hvac.Client") as MockClient:
            mock_client = MagicMock()
            mock_client.is_authenticated.return_value = False
            MockClient.return_value = mock_client

            from app.clients import vault as vault_module
            vault_module._client = None  # reset cached client

            with pytest.raises((VaultConnectionError, RuntimeError)):
                vault_module.get_secret("supabase")


def test_vault_get_secret_safe_dev_returns_empty():
    with patch("app.config.settings") as mock_settings:
        mock_settings.environment = "development"
        mock_settings.vault_addr = "http://unreachable:8200"
        mock_settings.vault_token = ""

        from app.clients import vault as vault_module
        vault_module._client = None

        import hvac
        with patch("hvac.Client") as MockClient:
            mock_client = MagicMock()
            mock_client.is_authenticated.side_effect = Exception("connection refused")
            MockClient.return_value = mock_client

            result = vault_module.get_secret_safe("supabase")
            assert isinstance(result, dict)
