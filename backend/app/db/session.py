import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings

db_url = settings.SUPABASE_DB_URL

# Check if user has pasted real Supabase credentials or if placeholder is still present
if not db_url or "[YOUR-PASSWORD]" in db_url or "[YOUR-PROJECT-REF]" in db_url or "sqlite" in db_url:
    print("[SENTINEL GRID DB] Using local SQLite database (sentinel_grid.db). To use Supabase Postgres, set SUPABASE_DB_URL in backend/.env.")
    db_url = "sqlite:///./sentinel_grid.db"
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
else:
    print(f"[SENTINEL GRID DB] Connecting to Cloud Supabase PostgreSQL...")
    # Normalize postgresql:// to use psycopg2 driver if no specific driver was set
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif db_url.startswith("postgresql://") and "+" not in db_url.split("://")[0]:
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    connect_args = {
        "connect_timeout": 10,
    }
    if "psycopg2" in db_url:
        connect_args.update({
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5
        })

    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
        connect_args=connect_args
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
