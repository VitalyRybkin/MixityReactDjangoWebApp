import os
from pathlib import Path

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: int = 5432

    DB_SSL_MODE: str | None = None
    DB_SSL_ROOT_CERT: str | None = None

    DJANGO_DEBUG:bool = True
    DJANGO_SEED_DATA: bool = False
    DJANGO_SECRET_KEY: str
    DJANGO_ALLOWED_HOSTS: str = ""
    DJANGO_CSRF_TRUSTED_ORIGINS: str = ""

    VITE_API_URL: str

    SEED_USERS_FILE: str | None = None

    model_config = SettingsConfigDict(
        env_file=os.getenv("ENV_FILE", "credentials/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

@computed_field
@property
def allowed_hosts(self) -> list[str]:
    return [
        host.strip()
        for host in self.DJANGO_ALLOWED_HOSTS.split(",")
        if host.strip()
    ]


@computed_field
@property
def csrf_trusted_origins(self) -> list[str]:
    return [
        origin.strip()
        for origin in self.DJANGO_CSRF_TRUSTED_ORIGINS.split(",")
        if origin.strip()
    ]

project_settings = Settings()
