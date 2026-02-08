"""
Purpose:
FastAPI router for swipe candidate generation endpoint.

Responsibilities:
- Provide GET /swipe/candidates endpoint for fetching similar bottles to seed
- Call recommender with k=50 for swipe queue batch size
- Require seed_bottle_id parameter (typically the last liked bottle)
- Return UI-ready bottle cards in ML ranking order

System context:
- This is a thin wrapper around the recommender's recommend_by_bottle_id method
- Used by frontend to fetch next batch of swipe candidates after user likes a bottle
- No authentication required in v1 (same as /bottles/random)
- Results are similar to seed bottle, ranked by TF-IDF + popularity hybrid score
- Uses asyncpg for direct PostgreSQL access to RDS
"""

from fastapi import APIRouter, HTTPException, Query, Request

from db import db
from utils.bottle_normalizer import normalize_bottle


router = APIRouter()


@router.get("/swipe/candidates")
async def get_swipe_candidates(
    request: Request,
    seed_bottle_id: int = Query(..., description="Bottle ID to find similar fragrances for swipe queue")
):
    """
    Fetch similar bottles for swipe queue based on a seed bottle.
    This endpoint provides personalized swipe candidates by finding bottles similar to
    the seed_bottle_id (typically the last bottle the user liked). Returns k=50 bottles
    ranked by hybrid TF-IDF + popularity score, normalized to UI format with arrays.
    No authentication required in v1 - personalization is bottle-based, not user-based.
    """
    # Get recommender singleton from app state (loaded at startup)
    recommender = request.app.state.recommender

    # Call ML recommender to get k=50 similar bottles (fixed batch size for swipe queue)
    bottle_ids = recommender.recommend_by_bottle_id(seed_bottle_id, k=50)

    # If no results found (invalid seed_bottle_id or empty recommender)
    if not bottle_ids:
        raise HTTPException(
            status_code=404,
            detail=f"No candidates found for bottle_id {seed_bottle_id}"
        )

    # Fetch bottle details from RDS using original_index values
    query = """
        SELECT * FROM bottles
        WHERE original_index = ANY($1::int[])
    """
    rows = await db.fetch_all(query, bottle_ids)

    # Build lookup dict for O(1) access and preserve ML ranking order
    bottles_by_id = {row["original_index"]: row for row in rows}
    results = [normalize_bottle(bottles_by_id[bid]) for bid in bottle_ids if bid in bottles_by_id]

    return {
        "seed_bottle_id": seed_bottle_id,
        "count": len(results),
        "results": results
    }
