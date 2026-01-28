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
"""

from fastapi import APIRouter, HTTPException, Query, Request

from supabase import create_client
from core.config import settings
from utils.bottle_normalizer import normalize_bottle


router = APIRouter()


# Fetch similar bottles for swipe queue based on a seed bottle.
# This endpoint provides personalized swipe candidates by finding bottles similar to
# the seed_bottle_id (typically the last bottle the user liked). Returns k=50 bottles
# ranked by hybrid TF-IDF + popularity score, normalized to UI format with arrays.
# No authentication required in v1 - personalization is bottle-based, not user-based.
@router.get("/swipe/candidates")
async def get_swipe_candidates(
    request: Request,
    seed_bottle_id: int = Query(..., description="Bottle ID to find similar fragrances for swipe queue")
):
    # Get recommender singleton from app state (loaded at startup)
    recommender = request.app.state.recommender

    # Call ML recommender to get k=50 similar bottles (fixed batch size for swipe queue)
    # This uses the same TF-IDF + popularity hybrid as /recommendations
    bottle_ids = recommender.recommend_by_bottle_id(seed_bottle_id, k=50)

    # If no results found (invalid seed_bottle_id or empty recommender)
    if not bottle_ids:
        raise HTTPException(
            status_code=404,
            detail=f"No candidates found for bottle_id {seed_bottle_id}"
        )

    # Fetch bottle details from Supabase using original_index values
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    response = supabase.table("bottles").select("*").in_("original_index", bottle_ids).execute()

    # Build lookup dict for O(1) access and preserve ML ranking order
    bottles_by_id = {row["original_index"]: row for row in response.data}
    results = [normalize_bottle(bottles_by_id[bid]) for bid in bottle_ids if bid in bottles_by_id]

    # Return batch of swipe candidates in ML ranking order
    return {
        "seed_bottle_id": seed_bottle_id,
        "count": len(results),
        "results": results
    }
