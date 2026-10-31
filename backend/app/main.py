from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.endpoints import router as api_router
from app.models.schema import Base, Asset
from app.db.session import engine, SessionLocal
from app.db.seed import seed_database

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SENTINEL GRID — AI-Based National Cyber Threat Early Warning System (D3COY 1.0 PS 01)"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)

@app.on_event("startup")
def on_startup():
    # Auto-initialize database tables and seed if empty
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Asset).count() == 0:
            print("[SENTINEL GRID] Seeding initial dataset into database...")
            seed_database(db)
            print("[SENTINEL GRID] Seed complete!")
    except Exception as e:
        print(f"[SENTINEL GRID STARTUP WARNING] Database auto-seed: {e}")
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_prefix": settings.API_PREFIX,
        "thesis": "Intelligence only becomes a warning after it is matched to what you actually run."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
