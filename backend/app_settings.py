import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent

ENV_FILE = Path(
    os.getenv(
        "ENV_FILE",
        str(BASE_DIR / "credentials" / ".env"),
    )
)


class Settings(BaseSettings):
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: int = 5432

    DB_SSL_MODE: str | None = None
    DB_SSL_ROOT_CERT: str | None = None

    DJANGO_DEBUG: bool = True
    DJANGO_SEED_DATA: bool = False
    DJANGO_SECRET_KEY: str
    DJANGO_ALLOWED_HOSTS: str = ""
    DJANGO_CSRF_TRUSTED_ORIGINS: str = ""

    SECURE_HSTS_INCLUDE_SUBDOMAINS: bool = False
    SECURE_HSTS_PRELOAD: bool = False

    CLAMAV_ENABLED: bool = False
    CLAMAV_HOST: str = "clamav"
    CLAMAV_PORT: int = 3310
    CLAMAV_TIMEOUT: int = 10

    VITE_API_URL: str = "/api"

    SEED_USERS_FILE: str | None = None

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_hosts(self) -> list[str]:
        return [
            host.strip()
            for host in self.DJANGO_ALLOWED_HOSTS.split(",")
            if host.strip()
        ]

    @property
    def csrf_trusted_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.DJANGO_CSRF_TRUSTED_ORIGINS.split(",")
            if origin.strip()
        ]


project_settings = Settings()  # type: ignore[call-arg]