from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    DB_NAME: str | None = None
    DB_USER: str | None= None
    DB_PASSWORD: str | None = None
    DB_HOST: str | None = None
    DB_PORT: int = 5432
    DB_SSL_MODE: str | None = None
    DB_SSL_ROOT_CERT: str | None = None

    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str | None = None
    ADMIN_EMAIL: str | None = None

    ORDER_MANAGER_USERNAME: str | None = None
    ORDER_MANAGER_PASSWORD: str | None = None
    ORDER_MANAGER_EMAIL: str | None = None

    LOGISTIC_MANAGER_USERNAME: str | None = None
    LOGISTIC_MANAGER_PASSWORD: str | None = None
    LOGISTIC_MANAGER_EMAIL: str | None = None

    ACCOUNTANT_USERNAME: str | None = None
    ACCOUNTANT_PASSWORD: str | None = None
    ACCOUNTANT_EMAIL: str | None = None

    model_config = SettingsConfigDict(
        env_file="credentials/.env", env_file_encoding="utf-8"
    )


project_settings = Settings()
