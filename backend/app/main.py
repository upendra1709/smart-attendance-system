import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401  (registers all tables)
from app.core.config import CORS_ORIGINS
from app.db.schema_sync import sync_schema
from app.api.router import api_router

# creates missing tables AND adds missing columns, so an older Supabase database upgrades itself.
# If it fails (for example the database is unreachable) the API still starts, so the real error is
# visible in the logs and at /api/health instead of the whole site hanging.
logger = logging.getLogger("uvicorn.error")
schema_error: str | None = None
try:
    sync_schema()
except Exception as exc:  # noqa: BLE001
    schema_error = f"{type(exc).__name__}: {exc}"[:500]
    logger.error("Database schema sync failed: %s", schema_error)

app = FastAPI(title="SmartAttend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/api/health")
def health():
    """Quick check you can open in a browser: is the API up, and can it reach the database?"""
    from sqlalchemy import text

    from app.db.database import engine

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database = "ok"
    except Exception as exc:  # noqa: BLE001
        database = f"error: {type(exc).__name__}"
    from app.services.face_engine import face_models_ready

    return {
        "status": "ok",
        "database": database,
        "face_models": "ok" if face_models_ready() else "MISSING - run: python scripts/download_face_models.py",
        "schema_sync_error": schema_error,
    }
