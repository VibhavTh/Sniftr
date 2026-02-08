"""
Purpose:
FastAPI router for user collection management (wishlist, favorites, personal).

Responsibilities:
- Provide GET /collections/status?bottle_id=... to check membership across all types
- Provide POST /collections to add a bottle to a collection (idempotent via upsert)
- Provide GET /collections?type=... to fetch all bottles in a collection with full detail
- Provide DELETE /collections/{bottle_id}?type=... to remove a bottle from a collection
- All endpoints require JWT authentication (user_id extracted from token)

System context:
- Uses single collections table with collection_type column
- UNIQUE constraint on (user_id, bottle_id, collection_type) prevents duplicates
- Returns normalized bottle cards via normalize_bottle() so frontend can render immediately
- bottle_id is original_index (int), matching ML model and all other endpoints
- Uses asyncpg for direct PostgreSQL access to RDS
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from db import db
from deps.auth import get_current_user
from utils.bottle_normalizer import normalize_bottle


router = APIRouter()

VALID_TYPES = {"wishlist", "favorites", "personal"}


@router.get("/collections/status")
async def get_collection_status(
    bottle_id: int = Query(..., description="Bottle ID (original_index) to check"),
    current_user: dict = Depends(get_current_user)
):
    """
    Check membership status of a bottle across all collection types.
    Returns boolean flags for wishlist, favorites, personal.
    """
    user_id = current_user["user_id"]

    query = """
        SELECT collection_type FROM collections
        WHERE user_id = $1 AND bottle_id = $2
    """
    rows = await db.fetch_all(query, user_id, bottle_id)

    existing_types = {row["collection_type"] for row in rows}

    return {
        "wishlist": "wishlist" in existing_types,
        "favorites": "favorites" in existing_types,
        "personal": "personal" in existing_types,
    }


class AddToCollectionRequest(BaseModel):
    bottle_id: int
    collection_type: str


@router.post("/collections")
async def add_to_collection(
    body: AddToCollectionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Add a bottle to a user's collection.
    Idempotent: uses ON CONFLICT DO NOTHING so duplicates are ignored.
    """
    if body.collection_type not in VALID_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"collection_type must be one of: {', '.join(sorted(VALID_TYPES))}"
        )

    user_id = current_user["user_id"]

    # UPSERT using ON CONFLICT DO NOTHING (idempotent)
    query = """
        INSERT INTO collections (user_id, bottle_id, collection_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, bottle_id, collection_type) DO NOTHING
    """
    await db.execute(query, user_id, body.bottle_id, body.collection_type)

    return {
        "ok": True,
        "bottle_id": body.bottle_id,
        "collection_type": body.collection_type
    }


@router.get("/collections")
async def get_collection(
    type: str = Query(..., description="Collection type: wishlist, favorites, or personal"),
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch all bottles in a user's collection by type.
    Returns full normalized bottle cards ordered by most recently added.
    """
    if type not in VALID_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"type must be one of: {', '.join(sorted(VALID_TYPES))}"
        )

    user_id = current_user["user_id"]

    # Get bottle_ids in collection order (most recent first)
    collection_query = """
        SELECT bottle_id FROM collections
        WHERE user_id = $1 AND collection_type = $2
        ORDER BY created_at DESC
    """
    collection_rows = await db.fetch_all(collection_query, user_id, type)

    if not collection_rows:
        return {"collection_type": type, "results": []}

    bottle_ids = [row["bottle_id"] for row in collection_rows]

    # Fetch bottle details using ANY() for IN clause with array parameter
    bottles_query = """
        SELECT * FROM bottles
        WHERE original_index = ANY($1::int[])
    """
    bottle_rows = await db.fetch_all(bottles_query, bottle_ids)

    # Preserve collection order (most recent first)
    bottles_by_id = {row["original_index"]: row for row in bottle_rows}
    results = [normalize_bottle(bottles_by_id[bid]) for bid in bottle_ids if bid in bottles_by_id]

    return {
        "collection_type": type,
        "results": results
    }


@router.delete("/collections/{bottle_id}")
async def remove_from_collection(
    bottle_id: int,
    type: str = Query(..., description="Collection type: wishlist, favorites, or personal"),
    current_user: dict = Depends(get_current_user)
):
    """
    Remove a bottle from a user's collection.
    Idempotent: returns 200 even if the entry didn't exist.
    """
    if type not in VALID_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"type must be one of: {', '.join(sorted(VALID_TYPES))}"
        )

    user_id = current_user["user_id"]

    query = """
        DELETE FROM collections
        WHERE user_id = $1 AND bottle_id = $2 AND collection_type = $3
    """
    await db.execute(query, user_id, bottle_id, type)

    return {
        "ok": True,
        "bottle_id": bottle_id,
        "collection_type": type
    }
