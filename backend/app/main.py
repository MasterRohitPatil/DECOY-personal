import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.endpoints import router as api_router
from app.api.auth import router as auth_router
from app.models.schema import Base, Asset
from app.db.session import engine, SessionLocal
from app.db.seed import seed_database, seed_users

logger = logging.getLogger("sentinel-grid")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SENTINEL GRID — AI-Based National Cyber Threat Early Warning System (D3COY 1.0 PS 01)"
)

# CORS Configuration — explicit origins required when allow_credentials=True
origins = list(set(settings.cors_origins_list + [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception on {request.url}: {exc}", exc_info=True)
    origin = request.headers.get("origin", "http://localhost:5173")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Diagnostic: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true"
        }
    )

app.include_router(api_router, prefix=settings.API_PREFIX)
app.include_router(auth_router, prefix=settings.API_PREFIX)

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
        seed_users(db)
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
