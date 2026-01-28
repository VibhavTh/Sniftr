"""
Purpose:
Main FastAPI application entry point for the ScentlyMax backend API.

Responsibilities:
- Initialize the FastAPI application instance
- Configure CORS middleware for frontend communication
- Register API routers (health endpoints, future feature endpoints)
- Serve as the ASGI application entry point for uvicorn

System context:
- This file is loaded by uvicorn when starting the server
- CORS is configured to allow requests from the Next.js frontend
- All route handlers are organized in separate router modules and included here
- Future routers (fragrances, recommendations, etc.) will be added here
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
from intelligence.recommender import FragranceRecommender

from routers import health, recommendations, swipes, bottles, swipe_candidates, collections


# FastAPI lifespan context manager for startup and shutdown logic.
# This function runs when uvicorn starts the server (before accepting requests)
# and again when the server shuts down. The yield statement separates startup
# from shutdown logic. We use this to load the ML recommender artifacts once
# at startup and store them in app.state, avoiding repeated loading on every request.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load recommender artifacts once into memory
    # The recommender loads TF-IDF matrix (~95MB sparse), vectorizer, and ID mappings.
    # Loading at startup (not per-request) ensures sub-10ms recommendation latency.
    print("🚀 Loading recommender artifacts...")
    recommender = FragranceRecommender()

    # Artifacts directory is at apps/api/intelligence/artifacts/
    # Contains: vectorizer.joblib, tfidf_matrix.npz, bottle_id_map.json, popularity_map.json
    artifacts_dir = Path(__file__).parent / "intelligence" / "artifacts"
    recommender.load_artifacts(str(artifacts_dir))

    # Store recommender in app.state for access in route handlers via request.app.state.recommender
    # This creates a singleton pattern - one instance shared across all requests
    app.state.recommender = recommender
    print("✅ Recommender loaded and ready!")

    yield  # Server runs here, handling requests

    # Shutdown: Clean up resources (none needed for now)
    print("👋 Shutting down...")


# Initialize the FastAPI application instance.
# This is the main ASGI application that uvicorn will serve. All middleware,
# routers, and configuration are attached to this app object. The title and
# version appear in the auto-generated OpenAPI docs at /docs.
app = FastAPI(
    title="ScentlyMax API",
    version="0.1.0",
    description="Backend API for fragrance discovery and recommendations",
    lifespan=lifespan
)


# Configure CORS middleware to allow frontend requests.
# In development, the Next.js frontend runs on localhost:3000 while the API
# runs on localhost:8000. CORS middleware tells browsers it's safe to make
# cross-origin requests between these two ports. In production, replace
# localhost:3000 with your actual frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000",  # Alternative localhost
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers (including Authorization)
)


# Register the health check router.
# This includes the /health and /health-auth endpoints defined in routers/health.py.
# FastAPI automatically discovers all routes decorated with @router.get/@router.post
# in the included router and adds them to the main app.
app.include_router(health.router, tags=["health"])

# Register the recommendations router.
# This includes the /recommendations endpoint that integrates the ML recommender with Supabase.
# Supports both text search queries and bottle similarity recommendations.
app.include_router(recommendations.router, tags=["recommendations"])

# Register the swipes router for user interaction logging.
# Logs like/pass actions to swipes table for future collaborative filtering.
app.include_router(swipes.router, tags=["swipes"])

# Register the bottles router for random bottle fetching.
# Provides random bottles for initial swipe queue before personalization.
app.include_router(bottles.router, tags=["bottles"])

# Register the swipe_candidates router for personalized swipe queue generation.
# Returns k=50 similar bottles based on seed bottle for continuous swiping.
app.include_router(swipe_candidates.router, tags=["swipes"])

# Register the collections router for user-curated bottle lists.
# Provides POST/GET/DELETE for wishlist, favorites, and personal collections.
# All endpoints require JWT authentication.
app.include_router(collections.router, tags=["collections"])


# Root endpoint for API information.
# Provides a simple welcome message and links to documentation when someone
# visits the API root at http://localhost:8000/
@app.get("/")
async def root():
    """
    API root endpoint that provides basic information and documentation links.

    Returns:
        dict: Welcome message and links to interactive API documentation
    """
    return {
        "message": "ScentlyMax API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }
