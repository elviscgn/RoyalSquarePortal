"""Application configuration with graceful fallback for standalone execution."""

import os
from typing import List

try:
    from pydantic_settings import BaseSettings

    class Settings(BaseSettings):
        PROJECT_NAME: str = "Royal Square Financial - Adviser Operations Platform"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api/v1"
        CORS_ORIGINS: List[str] = ["*"]
        DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/royal_square_db"

        model_config = {
            "env_file": ".env",
            "case_sensitive": True,
            "extra": "ignore"
        }

    settings = Settings()

except ImportError:
    from pydantic import BaseModel, Field

    class Settings(BaseModel):
        PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Royal Square Financial - Adviser Operations Platform")
        VERSION: str = "1.0.0"
        API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
        CORS_ORIGINS: List[str] = Field(default_factory=lambda: ["*"])
        DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/royal_square_db")

    settings = Settings()
