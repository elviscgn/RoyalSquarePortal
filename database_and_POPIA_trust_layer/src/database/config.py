import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DEFAULT_DATABASE_URL = "postgresql+psycopg2:///royal_square"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

# Normalize postgres:// to postgresql:// for SQLAlchemy 1.4+ / 2.0+ compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connection engine
engine_kwargs = {"echo": False}
if "sqlite" in DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

# Attempt connection to Postgres; if unavailable and no custom DATABASE_URL was explicitly set, fallback to SQLite
try:
    engine = create_engine(DATABASE_URL, **engine_kwargs)
    with engine.connect() as conn:
        pass
except Exception:
    if "sqlite" not in DATABASE_URL and "DATABASE_URL" not in os.environ:
        sqlite_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "royal_square.db")
        )
        DATABASE_URL = f"sqlite:///{sqlite_path}"
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Context manager or dependency generator for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
