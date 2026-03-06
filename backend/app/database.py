"""
CascadeNet Backend — Database Setup
Standard Synchronous SQLAlchemy for maximum local development compatibility.
(Avoids aiosqlite/asyncpg permission issues on locked macOS environments).
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings

settings = get_settings()

# ── Engine ────────────────────────────────────────────────────────────────────
_connect_args = {}
if "sqlite" in settings.database_url:
    _connect_args = {"check_same_thread": False}

# Use synchronous engine for robustness
engine = create_engine(
    settings.database_url,
    echo=(settings.log_level == "debug"),
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ── Base Model ────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass

# ── Dependency ────────────────────────────────────────────────────────────────
def get_db():
    """FastAPI dependency — yields a DB session."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def init_db():
    """Create all tables. Called on startup."""
    Base.metadata.create_all(bind=engine)
