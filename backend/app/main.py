"""
TruthLens - FastAPI Application Entry Point
============================================
Development:
    uvicorn app.main:app --reload --port 8000

Production (via Docker / Gunicorn):
    gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:8000

API Docs (disabled in production):
    http://localhost:8000/docs
    http://localhost:8000/redoc
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import Base, engine
from .routers import auth, analyze, dashboard

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO if settings.is_production else logging.DEBUG,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("truthlens")

# ── Create DB tables on startup ───────────────────────────────────────────────
# Note: In production with persistent data, prefer Alembic migrations.
# For portfolio / demo deployments this is safe and keeps setup simple.
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting TruthLens API (environment=%s)", settings.ENVIRONMENT)
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified ✓")
    yield
    logger.info("TruthLens API shutting down")

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="TruthLens API",
    description="Real-Time News Credibility Intelligence Platform.",
    version="1.0.0",
    # Disable interactive docs in production (security hardening)
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Origins are loaded from ALLOWED_ORIGINS env var (comma-separated).
# This lets you add your Vercel / Render / Railway domain without code changes.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("CORS allowed origins: %s", settings.allowed_origins_list)

# ── Register routers ──────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(dashboard.router)


# ── Health-check endpoints ────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "service": "TruthLens API",
        "version": "1.0.0",
        "status": "running",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health", tags=["Health"])
def health():
    """
    Used by Render, Railway, and Docker health checks.
    Returns 200 OK when the server and DB connection are alive.
    """
    return {"status": "healthy"}
