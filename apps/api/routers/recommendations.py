"""
Purpose:
FastAPI router for recommendation endpoints integrating the ML recommender with the database.

Responsibilities:
- Provide GET /recommendations endpoint accepting either text query or seed bottle ID
- Call recommender to get ranked bottle IDs, fetch full data from RDS, preserve ML ranking order
- Normalize database rows into UI-ready format with arrays
- Return results matching API contract

System context:
- Recommender loaded at startup in app.state.recommender (singleton pattern)
- Returns original_index values (not UUIDs) which we use to fetch from RDS
- Order from ML model must be preserved in final response (don't re-sort!)
- Uses asyncpg for direct PostgreSQL access to RDS
"""

from fastapi import APIRouter, HTTPException, Query, Request

from db import db
from utils.bottle_normalizer import normalize_bottle
from intelligence.recommender import FragranceRecommender

router = APIRouter()


@router.get("/recommendations")
async def get_recommendations(
    request: Request,
    q: str | None = Query(None, description="Natural language search query (e.g., 'fresh summer citrus')"),
    seed_bottle_id: int | None = Query(None, description="Bottle ID to find similar fragrances"),
    k: int = Query(20, ge=1, le=100, description="Number of recommendations to return (1-100)")
):
    """
    Main recommendations endpoint supporting both text search and similarity queries.
    Accepts either q (natural language) OR seed_bottle_id (find similar), calls recommender,
    fetches bottle details from RDS by original_index, and preserves ML ranking order.
    Returns UI-ready bottle cards with normalized arrays for accords and notes.
    """
    # Validate that exactly one mode is specified (query XOR seed_bottle_id)
    if (q is None and seed_bottle_id is None) or (q is not None and seed_bottle_id is not None):
        raise HTTPException(
            status_code=400,
            detail="Must provide exactly one of: 'q' (query text) or 'seed_bottle_id' (bottle ID)"
        )

    # Get recommender singleton from app state (loaded at startup)
    recommender = request.app.state.recommender

    # Call ML recommender based on mode to get ranked list of bottle IDs (original_index values)
    if q:
        mode = "query"
        bottle_ids = recommender.recommend_by_query(q, k=k)
    else:
        mode = "seed"
        bottle_ids = recommender.recommend_by_bottle_id(seed_bottle_id, k=k)

    # If no results found (empty list from recommender)
    if not bottle_ids:
        return {
            "mode": mode,
            "seed_bottle_id": seed_bottle_id,
            "query": q,
            "k": k,
            "results": []
        }

    # Fetch bottle details from RDS using original_index values
    # Uses ANY() for IN clause with asyncpg array parameter
    query = """
        SELECT * FROM bottles
        WHERE original_index = ANY($1::int[])
    """
    rows = await db.fetch_all(query, bottle_ids)

    # Build lookup dict for O(1) access: {original_index: row}
    # Database returns rows in arbitrary order, but we need ML model's ranking
    bottles_by_id = {row["original_index"]: row for row in rows}

    # Reconstruct results in ML ranking order, normalize each row to UI format
    # This preserves the hybrid TF-IDF + popularity ranking from the recommender
    results = []
    for bottle_id in bottle_ids:
        if bottle_id in bottles_by_id:
            normalized = normalize_bottle(bottles_by_id[bottle_id])
            results.append(normalized)

    return {
        "mode": mode,
        "seed_bottle_id": seed_bottle_id,
        "query": q,
        "k": k,
        "results": results
    }
