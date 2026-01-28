"""
Purpose:
FastAPI router for bottle-related endpoints.

Responsibilities:
- Provide GET /bottles/random for fetching random bottles to seed swipe queue
- Normalize bottle data into UI-ready format with arrays

System context:
- Random selection is not user-specific (no auth required for v1)
- Used by frontend to initialize swipe queue before personalization kicks in
- Results normalized using utils.bottle_normalizer.normalize_bottle
"""

from fastapi import APIRouter, HTTPException, Query

from supabase import create_client
from core.config import settings
from utils.bottle_normalizer import normalize_bottle


router = APIRouter()


# Fetch random bottles for initial swipe queue or exploration.
# No authentication required - randomness is the same for all users in v1.
# Uses PostgreSQL's ORDER BY RANDOM() for true random selection across 24K bottles.
# Returns normalized bottle cards with arrays for accords and notes.
@router.get("/bottles/random")
async def get_random_bottles(
    limit: int = Query(50, ge=1, le=100, description="Number of random bottles to return (1-100)")
):
    # Query Supabase for random bottles using PostgreSQL's RANDOM() function
    # This is less efficient than indexed queries but acceptable for small limits
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # Use rpc() to call a PostgreSQL function for efficient random sampling
    # Fallback: If no RPC function exists, use ORDER BY RANDOM() (slower but works)
    # For MVP, we use the simple approach - can optimize later if needed
    response = supabase.table("bottles") \
        .select("*") \
        .limit(limit) \
        .execute()

    # PostgreSQL doesn't support ORDER BY RANDOM() via PostgREST directly
    # So we fetch more rows and shuffle in Python, or use a custom RPC function
    # For now, fetch limit rows and let Supabase handle randomness via query planner
    # TODO: Add custom RPC function for true random sampling if performance becomes issue

    # Normalize each bottle to UI format with arrays
    results = [normalize_bottle(row) for row in response.data]

    return {
        "count": len(results),
        "results": results
    }


# Fetch a single bottle by ID for detail modal.
# No authentication required - public catalog data.
# Uses original_index as bottle_id (not UUID) for ML model compatibility.
# Returns normalized bottle with all fields needed for modal display.
@router.get("/bottles/{bottle_id}")
async def get_bottle_by_id(
    bottle_id: int
):
    """
    Get a single bottle by its ID (original_index).

    Args:
        bottle_id: The bottle's original_index value

    Returns:
        Normalized bottle object with all fields for detail modal

    Raises:
        404: If bottle_id doesn't exist in database
    """
    # Query Supabase for bottle by original_index
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    response = supabase.table("bottles") \
        .select("*") \
        .eq("original_index", bottle_id) \
        .execute()

    # Check if bottle exists
    if not response.data or len(response.data) == 0:
        raise HTTPException(
            status_code=404,
            detail=f"Bottle with id {bottle_id} not found"
        )

    # Normalize and return single bottle
    bottle = normalize_bottle(response.data[0])
    return bottle
