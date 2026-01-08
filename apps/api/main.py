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

from routers import health


# Initialize the FastAPI application instance.
# This is the main ASGI application that uvicorn will serve. All middleware,
# routers, and configuration are attached to this app object. The title and
# version appear in the auto-generated OpenAPI docs at /docs.
app = FastAPI(
    title="ScentlyMax API",
    version="0.1.0",
    description="Backend API for fragrance discovery and recommendations"
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
