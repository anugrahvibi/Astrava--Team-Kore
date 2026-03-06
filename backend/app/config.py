"""
CascadeNet Backend — Configuration
Pure Python configuration to avoid pydantic-settings version conflicts.
"""
import os
from functools import lru_cache

class Settings:
    # ── App ──────────────────────────────────────────────────────────────────
    app_name: str = "CascadeNet Backend"
    app_version: str = "1.0.0"
    app_env: str = os.getenv("APP_ENV", "development")
    log_level: str = os.getenv("LOG_LEVEL", "info")

    # ── Database ─────────────────────────────────────────────────────────────
    # SQLite standard driver (sync)
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./cascadenet.db")

    @property
    def is_postgres(self) -> bool:
        return self.database_url.startswith("postgresql")

    # ── Redis ─────────────────────────────────────────────────────────────────
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # ── ML Service ───────────────────────────────────────────────────────────
    ml_service_url: str = os.getenv("ML_SERVICE_URL", "http://localhost:8000")

    # ── Prediction Cycle ─────────────────────────────────────────────────────
    prediction_cycle_minutes: int = int(os.getenv("PREDICTION_CYCLE_MINUTES", "30"))

    # ── Auth ─────────────────────────────────────────────────────────────────
    secret_key: str = os.getenv("SECRET_KEY", "CHANGE_ME_IN_PRODUCTION")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

    # ── Alert Thresholds (from PRD Section 5.1) ───────────────────────────────
    red_threshold: float = float(os.getenv("RED_THRESHOLD", "0.75"))
    amber_threshold: float = float(os.getenv("AMBER_THRESHOLD", "0.50"))

    # ── Reservoir Thresholds (CWC OMS 2022) ──────────────────────────────────
    reservoir_amber_pct: float = 70.0
    reservoir_red_low_pct: float = 85.0
    reservoir_red_high_pct: float = 92.0
    reservoir_emergency_pct: float = 97.0

@lru_cache()
def get_settings() -> Settings:
    return Settings()
