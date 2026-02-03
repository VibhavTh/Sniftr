"""
Purpose:
FastAPI router for bottle-related endpoints.

Responsibilities:
- Provide GET /bottles for paginated browse with optional search (Explore page)
- Provide GET /bottles/random for random bottles to seed swipe queue
- Provide GET /bottles/{bottle_id} for single bottle detail (modal)
- Normalize bottle data into UI-ready format with arrays

System context:
- All endpoints are public (no auth required for v1)
- Results normalized using utils.bottle_normalizer.normalize_bottle
- Stable ordering on /bottles ensures deterministic pagination
"""

import random

from fastapi import APIRouter, HTTPException, Query

from supabase import create_client
from core.config import settings
from utils.bottle_normalizer import normalize_bottle


router = APIRouter()


# Paginated browse endpoint for Explore page.
# Stable ordering ensures page 1/2/3 are deterministic across requests.
# Optional q param filters by name OR brand (case-insensitive ilike).
# IMPORTANT: This route MUST be defined before /bottles/{bottle_id} to avoid route conflict.
@router.get("/bottles")
async def get_bottles(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(24, ge=1, le=100, description="Items per page"),
    q: str | None = Query(None, description="Search query (filters name/brand)")
):
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # Calculate offset for Supabase .range() (0-indexed, inclusive on both ends)
    offset = (page - 1) * limit

    # Build query with count for pagination metadata
    # count="exact" adds a header with total matching rows
    query = supabase.table("bottles").select("*", count="exact")

    # Optional search filter: name OR brand contains search term (case-insensitive)
    # Using ilike for case-insensitive LIKE matching in PostgreSQL
    # Normalize spaces to wildcards so "dolce gabbana" matches "dolce-gabbana"
    if q and q.strip():
        search_term = q.strip()
        # Replace spaces with % wildcard to match both "dolce gabbana" and "dolce-gabbana"
        normalized_term = search_term.replace(" ", "%")
        query = query.or_(f"name.ilike.%{normalized_term}%,brand.ilike.%{normalized_term}%")

    # Apply stable ordering for deterministic pagination:
    # 1. rating_count DESC → most reviewed first (popularity signal)
    # 2. rating_value DESC → higher rated among same review count
    # 3. original_index ASC → deterministic tiebreaker for identical ratings
    response = query \
        .order("rating_count", desc=True, nullsfirst=False) \
        .order("rating_value", desc=True, nullsfirst=False) \
        .order("original_index", desc=False) \
        .range(offset, offset + limit - 1) \
        .execute()

    # Normalize results to UI format with arrays
    results = [normalize_bottle(row) for row in response.data]

    return {
        "page": page,
        "limit": limit,
        "total": response.count,
        "results": results
    }


# Fetch random bottles for initial swipe queue or exploration.
# No authentication required - randomness is the same for all users in v1.
# Returns normalized bottle cards with arrays for accords and notes.
# Uses Python random.sample() since PostgREST doesn't support ORDER BY RANDOM().
@router.get("/bottles/random")
async def get_random_bottles(
    limit: int = Query(50, ge=1, le=100, description="Number of random bottles to return (1-100)")
):
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # PostgREST doesn't support ORDER BY RANDOM() directly.
    # Strategy: Fetch a larger pool and randomly sample in Python.
    # Pool size: 10x limit or 500, whichever is larger (covers 24K bottles well)
    pool_size = max(limit * 10, 500)

    response = supabase.table("bottles") \
        .select("*") \
        .limit(pool_size) \
        .execute()

    # Randomly sample `limit` bottles from the pool
    pool = response.data
    if len(pool) <= limit:
        # Pool smaller than requested, return all (shuffled)
        sampled = pool
        random.shuffle(sampled)
    else:
        sampled = random.sample(pool, limit)

    # Normalize each bottle to UI format with arrays
    results = [normalize_bottle(row) for row in sampled]

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
