"""
Purpose:
Application configuration using Pydantic Settings.

Responsibilities:
- Load environment variables from .env file
- Provide typed access to configuration values
- Support both RDS (DATABASE_URL) and Supabase Auth (SUPABASE_URL)

System context:
- DATABASE_URL: RDS PostgreSQL connection string for all data access
- SUPABASE_URL: Only used for JWT verification via JWKS endpoint
- CORS_ORIGINS: Comma-separated list of allowed frontend origins
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # RDS Database (required for all DB operations)
    DATABASE_URL: str

    # Supabase Auth only (for JWT verification via JWKS endpoint)
    SUPABASE_URL: str

    # Legacy: Keep for backwards compatibility, will be removed after migration
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = None

    # CORS origins (comma-separated for production)
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
    }


settings = Settings()
