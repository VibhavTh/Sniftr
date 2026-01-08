"""
Purpose:
Health check endpoints for API monitoring and authentication testing.

Responsibilities:
- Provide a public health check endpoint for infrastructure monitoring
- Provide a protected health check endpoint to verify JWT authentication flow
- Return structured JSON responses with appropriate status codes

System context:
- Public endpoint (/health) used by load balancers, monitoring tools, uptime checks
- Protected endpoint (/health-auth) used by frontend to test end-to-end auth
- Demonstrates FastAPI dependency injection pattern with get_current_user
"""

from fastapi import APIRouter, Depends

from deps.auth import get_current_user


# Create a router instance to group related endpoints together.
# This router will be registered with the main FastAPI app in main.py.
# The prefix and tags will be applied to all routes defined in this file.
router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Public health check endpoint that requires no authentication.

    This endpoint is used by monitoring systems, load balancers, and infrastructure
    tools to verify the API is running and responsive. It returns a simple success
    message to confirm the service is healthy.

    Returns:
        dict: Status message indicating the API is operational
    """
    return {"status": "ok"}


@router.get("/health-auth")
async def health_check_auth(user: dict = Depends(get_current_user)):
    """
    Protected health check endpoint that requires JWT authentication.

    This endpoint tests the complete authentication flow from frontend to backend.
    It uses FastAPI's Depends() to inject the get_current_user dependency, which
    automatically verifies the JWT token before this handler executes. If the token
    is invalid, the request is rejected with HTTP 401 before reaching this code.

    The user dict is returned directly to demonstrate that auth worked and show
    what user context is available to protected routes.

    Args:
        user: Authenticated user context injected by get_current_user dependency.
              Contains 'user_id' and 'email' extracted from the JWT payload.

    Returns:
        dict: The authenticated user's ID and email from the verified JWT token
    """
    return user
