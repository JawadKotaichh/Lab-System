from pathlib import Path

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://mongo:27017"
    JWT_SECRET: SecretStr
    REFRESH_PEPPER: SecretStr
    ACCESS_MINUTES: int = 15
    REFRESH_DAYS: int = 30
    DEBUG: bool = False

    @field_validator("JWT_SECRET", "REFRESH_PEPPER", mode="before")
    @classmethod
    def validate_auth_secret(cls, value: object) -> object:
        if not isinstance(value, str) or len("".join(value.split())) < 32:
            raise ValueError("must contain at least 32 non-whitespace characters")
        return value

    @field_validator("ACCESS_MINUTES")
    @classmethod
    def validate_access_minutes(cls, value: int) -> int:
        if not 1 <= value <= 1440:
            raise ValueError("must be between 1 and 1440")
        return value

    @field_validator("REFRESH_DAYS")
    @classmethod
    def validate_refresh_days(cls, value: int) -> int:
        if not 1 <= value <= 365:
            raise ValueError("must be between 1 and 365")
        return value

    model_config = SettingsConfigDict(
        env_file=ROOT_ENV_FILE,
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
