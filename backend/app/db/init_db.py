import sys
from app.db.session import engine
from app.models.schema import Base

def init_db():
    print("[SENTINEL GRID] Initializing Supabase PostgreSQL schema...")
    try:
        Base.metadata.create_all(bind=engine)
        print("[SENTINEL GRID] Successfully created all tables in Supabase PostgreSQL!")
    except Exception as e:
        print(f"[SENTINEL GRID ERROR] Failed to initialize database: {e}", file=sys.stderr)
        raise

if __name__ == "__main__":
    init_db()

