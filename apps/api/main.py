"""
Purpose:
Main FastAPI application entry point for the ScentlyMax backend API.

Responsibilities:
- Initialize the FastAPI application instance
- Configure CORS middleware for frontend communication
- Initialize database connection pool at startup
- Register API routers
- Serve as the ASGI application entry point for uvicorn

System context:
- This file is loaded by uvicorn when starting the server
- Database pool initialized at startup, closed at shutdown
- CORS configured via CORS_ORIGINS environment variable
- All route handlers are organized in separate router modules
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path

from intelligence.recommender import FragranceRecommender
from core.config import settings
from db import db

from routers import health, recommendations, swipes, bottles, swipe_candidates, collections


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager for startup and shutdown logic.

    Startup:
    - Connect to RDS PostgreSQL database
    - Load ML recommender artifacts into memory

    Shutdown:
    - Close database connection pool
    """
    # Startup: Connect to RDS PostgreSQL
    print("🔌 Connecting to database...")
    await db.connect(settings.DATABASE_URL)
    print("✅ Database connected!")

    # Startup: Load recommender artifacts once into memory
    print("🚀 Loading recommender artifacts...")
    recommender = FragranceRecommender()
    artifacts_dir = Path(__file__).parent / "intelligence" / "artifacts"
    recommender.load_artifacts(str(artifacts_dir))
    app.state.recommender = recommender
    print("✅ Recommender loaded and ready!")

    yield  # Server runs here, handling requests

    # Shutdown: Close database pool
    print("👋 Shutting down...")
    await db.disconnect()


app = FastAPI(
    title="ScentlyMax API",
    version="0.1.0",
    description="Backend API for fragrance discovery and recommendations",
    lifespan=lifespan
)


# Configure CORS middleware to allow frontend requests.
# CORS_ORIGINS is a comma-separated string of allowed origins.
cors_origins = settings.CORS_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(health.router, tags=["health"])
app.include_router(recommendations.router, tags=["recommendations"])
app.include_router(swipes.router, tags=["swipes"])
app.include_router(bottles.router, tags=["bottles"])
app.include_router(swipe_candidates.router, tags=["swipes"])
app.include_router(collections.router, tags=["collections"])


@app.get("/")
async def root():
    """API root endpoint with basic info and documentation links."""
    return {
        "message": "ScentlyMax API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }
