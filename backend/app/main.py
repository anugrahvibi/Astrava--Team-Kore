"""
CascadeNet Backend — FastAPI Entry Point
Orchestration of all services, routers and real-time management.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import init_db, get_db
from app.routers import zones, predictions, alerts, simulation, admin, sensors, cascade
from app.services.websocket_manager import manager


# ─── Settings & Logging ───────────────────────────────────────────────────────
settings = get_settings()
logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)


# ─── Lifecycle ───────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB tables
    logger.info("Starting up: Initializing database tables...")
    init_db()
    logger.info("Database initialization complete.")
    yield
    # Shutdown: Clean up any resources
    logger.info("Shutting down...")


# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-Powered Flood Prediction & Infrastructure Cascade Analysis System — Hackathon Edition",
    lifespan=lifespan
)

# ─── Middleware ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(zones.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(cascade.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(sensors.router, prefix="/api/v1")
app.include_router(simulation.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


# ─── Health check ────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "online",
        "system": "CascadeNet",
        "version": settings.app_version,
        "region": "India (Pilot: Godavari Basin)"
    }


# ─── Real-Time WebSockets ────────────────────────────────────────────────────
@app.websocket("/ws/live-updates")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time dashboard updates (PRD Section 7.2)."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Handle incoming client messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        manager.disconnect(websocket)


# ─── Application Entry Point ──────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8001, 
        reload=(settings.app_env == "development")
    )
