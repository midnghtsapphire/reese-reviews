import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # Runtime
    environment: str = Field(default="development", alias="ENVIRONMENT")
    debug: bool = Field(default=False, alias="DEBUG")

    # Vault
    vault_addr: str = Field(default="http://127.0.0.1:8200", alias="VAULT_ADDR")
    vault_token: str = Field(default="", alias="VAULT_TOKEN")

    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    # Telegram
    telegram_bot_token: str = Field(default="", alias="TELEGRAM_BOT_TOKEN")
    telegram_chat_id: str = Field(default="", alias="TELEGRAM_CHAT_ID")

    # Database (populated from Vault at startup)
    database_url: str = Field(default="", alias="DATABASE_URL")

    class Config:
        env_file = ".env"
        populate_by_name = True
        extra = "ignore"

settings = Settings()
