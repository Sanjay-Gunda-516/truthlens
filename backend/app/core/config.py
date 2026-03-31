"""
TruthLens - Application Configuration
Loads all settings from environment variables (via .env file locally,
via real env vars in Docker / Render / Railway / VPS).
"""
from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    # ── Runtime environment ───────────────────────────────────────────────────
    # Set to "production" on Render/Railway/VPS to harden the API.
    ENVIRONMENT: str = "development"

    # ── Database ──────────────────────────────────────────────────────────────
    # LOCAL dev:       postgresql://truthlens:truthlens_password@127.0.0.1:5432/truthlens_db
    # Docker compose:  postgresql://truthlens:truthlens_password@db:5432/truthlens_db
    # Render / Railway: set the full connection string they provide
    DATABASE_URL: str

    # ── JWT Auth ──────────────────────────────────────────────────────────────
    # Generate a safe key:  python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── OpenAI (Stage 2 enrichment — optional) ────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed frontend origins.
    # Example: "http://localhost:3000,https://truthlens.vercel.app"
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse the comma-separated ALLOWED_ORIGINS string into a list."""
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
