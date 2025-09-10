from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DB_NAME: str = "orders_db"
    DB_USER: str = "rybkin"
    DB_PASSWORD: str | None = None
    DB_HOST: str | None = None
    DB_PORT: int = 5432
    DB_SSL_MODE: str | None = None
    DB_SSL_ROOT_CERT: str | None = None

    model_config = SettingsConfigDict(
        env_file="credentials/.env", env_file_encoding="utf-8"
    )


project_settings = Settings()
