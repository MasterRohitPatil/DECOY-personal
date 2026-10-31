import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Look for .env in backend/.env or root .env
backend_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "SENTINEL GRID"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Supabase PostgreSQL or local fallback
    SUPABASE_DB_URL: str = os.getenv(
        "SUPABASE_DB_URL",
        "sqlite:///./sentinel_grid.db"
    )
    
    # Optional Gemini API Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Server configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
    
    # Flags
    SYNTHETIC_DATA: bool = os.getenv("SYNTHETIC_DATA", "true").lower() == "true"
    SIMULATED_ACTIONS: bool = os.getenv("SIMULATED_ACTIONS", "true").lower() == "true"
    OFFLINE_PROFILE: bool = os.getenv("OFFLINE_PROFILE", "true").lower() == "true"

    # Real SMTP Email Configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()
