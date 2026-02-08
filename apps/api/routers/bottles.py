"""
Purpose:
FastAPI router for bottle-related endpoints.

Responsibilities:
- Provide GET /bottles for paginated browse with optional search (Explore page)
- Provide GET /bottles/random for random bottles to seed swipe queue
- Provide GET /bottles/{bottle_id} for single bottle detail (modal)
- Normalize bottle data into UI-ready format with arrays

System context:
- All endpoints are public (no auth required)
- Results normalized using utils.bottle_normalizer.normalize_bottle
- Stable ordering on /bottles ensures deterministic pagination
- Uses asyncpg for direct PostgreSQL access to RDS
"""

from fastapi import APIRouter, HTTPException, Query

from db import db
from utils.bottle_normalizer import normalize_bottle


router = APIRouter()


@router.get("/bottles")
async def get_bottles(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(24, ge=1, le=100, description="Items per page"),
    q: str | None = Query(None, description="Search query (filters name/brand)")
):
    """
    Paginated browse endpoint for Explore page.

    Stable ordering ensures page 1/2/3 are deterministic across requests.
    Optional q param filters by name OR brand (case-insensitive ilike).
    """
    offset = (page - 1) * limit

    if q and q.strip():
        # Search with ILIKE on name/brand
        # Replace spaces with % wildcard to match "dolce gabbana" and "dolce-gabbana"
        normalized_term = q.strip().replace(" ", "%")
        pattern = f"%{normalized_term}%"

        # Get total count for pagination
        count_query = """
            SELECT COUNT(*) FROM bottles
            WHERE name ILIKE $1 OR brand ILIKE $1
        """
        total = await db.fetch_val(count_query, pattern)

        # Get paginated results with stable ordering
        data_query = """
            SELECT * FROM bottles
            WHERE name ILIKE $1 OR brand ILIKE $1
            ORDER BY rating_count DESC NULLS LAST,
                     rating_value DESC NULLS LAST,
                     original_index ASC
            LIMIT $2 OFFSET $3
        """
        rows = await db.fetch_all(data_query, pattern, limit, offset)
    else:
        # No search - just paginate
        total = await db.fetch_val("SELECT COUNT(*) FROM bottles")

        data_query = """
            SELECT * FROM bottles
            ORDER BY rating_count DESC NULLS LAST,
                     rating_value DESC NULLS LAST,
                     original_index ASC
            LIMIT $1 OFFSET $2
        """
        rows = await db.fetch_all(data_query, limit, offset)

    results = [normalize_bottle(row) for row in rows]

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "results": results
    }


@router.get("/bottles/random")
async def get_random_bottles(
    limit: int = Query(50, ge=1, le=100, description="Number of random bottles to return (1-100)")
):
    """
    Fetch random bottles for initial swipe queue or exploration.

    Uses PostgreSQL ORDER BY random() for true uniform random sampling.
    No authentication required - randomness is the same for all users in v1.
    """
    query = """
        SELECT * FROM bottles
        ORDER BY random()
        LIMIT $1
    """
    rows = await db.fetch_all(query, limit)
    results = [normalize_bottle(row) for row in rows]

    return {
        "count": len(results),
        "results": results
    }


@router.get("/bottles/{bottle_id}")
async def get_bottle_by_id(bottle_id: int):
    """
    Fetch a single bottle by ID for detail modal.

    Uses original_index as bottle_id (not UUID) for ML model compatibility.
    """
    query = "SELECT * FROM bottles WHERE original_index = $1"
    row = await db.fetch_one(query, bottle_id)

    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"Bottle with id {bottle_id} not found"
        )

    return normalize_bottle(row)
