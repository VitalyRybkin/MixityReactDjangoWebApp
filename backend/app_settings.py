import os
from pathlib import Path

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
    DJANGO_ALLOWED_HOSTS: list[str] = []
    DJANGO_CSRF_TRUSTED_ORIGINS: list[str] = []

    VITE_API_URL: str

    SEED_USERS_FILE: str | None = None

    model_config = SettingsConfigDict(
        env_file=os.getenv("ENV_FILE", "credentials/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


project_settings = Settings()
