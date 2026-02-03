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
- Uses single collections table with collection_type column (Option A design)
- UNIQUE constraint on (user_id, bottle_id, collection_type) prevents duplicates
- Returns normalized bottle cards via normalize_bottle() so frontend can render immediately
- bottle_id is original_index (int), matching ML model and all other endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from supabase import create_client
from core.config import settings
from deps.auth import get_current_user
from utils.bottle_normalizer import normalize_bottle


router = APIRouter()

# Valid collection types — matches CHECK constraint in create_collections.sql
VALID_TYPES = {"wishlist", "favorites", "personal"}


# Check membership status of a bottle across all collection types.
# Returns boolean flags for wishlist, favorites, personal.
# Used by frontend to render filled/unfilled hearts and dropdown toggles.
# Example: GET /collections/status?bottle_id=1234
@router.get("/collections/status")
async def get_collection_status(
    bottle_id: int = Query(..., description="Bottle ID (original_index) to check"),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # Fetch all collection entries for this user + bottle (0-3 rows max)
    response = supabase.table("collections") \
        .select("collection_type") \
        .eq("user_id", user_id) \
        .eq("bottle_id", bottle_id) \
        .execute()

    # Convert rows to a set of types for O(1) lookup
    existing_types = {row["collection_type"] for row in response.data}

    return {
        "wishlist": "wishlist" in existing_types,
        "favorites": "favorites" in existing_types,
        "personal": "personal" in existing_types,
    }


# Request body schema for POST /collections.
# Validates bottle_id is an int and collection_type is one of the allowed values.
class AddToCollectionRequest(BaseModel):
    bottle_id: int  # original_index value from bottles table
    collection_type: str  # Must be 'wishlist', 'favorites', or 'personal'


# Add a bottle to a user's collection.
# Idempotent: if the bottle is already in the collection, returns 200 with already_existed flag
# instead of raising a conflict error. This lets the frontend fire-and-forget without
# checking existence first.
@router.post("/collections")
async def add_to_collection(
    body: AddToCollectionRequest,
    current_user: dict = Depends(get_current_user)
):
    # Validate collection_type before hitting the database
    if body.collection_type not in VALID_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"collection_type must be one of: {', '.join(sorted(VALID_TYPES))}"
        )

    user_id = current_user["user_id"]
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # Use upsert to handle duplicates gracefully.
    # If (user_id, bottle_id, collection_type) already exists, this is a no-op
    # thanks to the UNIQUE constraint. on_conflict tells PostgREST which columns
    # define the uniqueness check.
    response = supabase.table("collections").upsert(
        {
            "user_id": user_id,
            "bottle_id": body.bottle_id,
            "collection_type": body.collection_type,
        },
        on_conflict="user_id,bottle_id,collection_type"
    ).execute()

    return {
        "ok": True,
        "bottle_id": body.bottle_id,
        "collection_type": body.collection_type
    }


# Fetch all bottles in a user's collection by type.
# Returns full normalized bottle cards (not just IDs) so the frontend can render
# collection views immediately without a second fetch.
# Results ordered by most recently added (created_at DESC from index).
@router.get("/collections")
async def get_collection(
    type: str = Query(..., description="Collection type: wishlist, favorites, or personal"),
    current_user: dict = Depends(get_current_user)
):
    # Validate collection type
    if type not in VALID_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"type must be one of: {', '.join(sorted(VALID_TYPES))}"
        )

    user_id = current_user["user_id"]
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # Fetch collection entries for this user + type, ordered by most recently added
    collection_response = supabase.table("collections") \
        .select("bottle_id, created_at") \
        .eq("user_id", user_id) \
        .eq("collection_type", type) \
        .order("created_at", desc=True) \
        .execute()

    # If collection is empty, return early with empty results
    if not collection_response.data:
        return {"collection_type": type, "results": []}

    # Extract bottle IDs in collection order (most recent first)
    bottle_ids = [row["bottle_id"] for row in collection_response.data]

    # Fetch full bottle details from bottles table using original_index
    bottles_response = supabase.table("bottles") \
        .select("*") \
        .in_("original_index", bottle_ids) \
        .execute()

    # Build lookup dict and reconstruct in collection order (most recent first)
    bottles_by_id = {row["original_index"]: row for row in bottles_response.data}
    results = [normalize_bottle(bottles_by_id[bid]) for bid in bottle_ids if bid in bottles_by_id]

    return {
        "collection_type": type,
        "results": results
    }


# Remove a bottle from a user's collection.
# Uses bottle_id in path + collection_type as query param to identify the row.
# Idempotent: returns 200 even if the entry didn't exist (nothing to delete).
# This lets the frontend toggle collection state without checking existence first.
@router.delete("/collections/{bottle_id}")
async def remove_from_collection(
    bottle_id: int,
    type: str = Query(..., description="Collection type: wishlist, favorites, or personal"),
    current_user: dict = Depends(get_current_user)
):
    # Validate collection type
    if type not in VALID_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"type must be one of: {', '.join(sorted(VALID_TYPES))}"
        )

    user_id = current_user["user_id"]
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # Delete the matching row. If it doesn't exist, this is a no-op (idempotent).
    # The UNIQUE index on (user_id, bottle_id, collection_type) ensures at most one row matches.
    supabase.table("collections") \
        .delete() \
        .eq("user_id", user_id) \
        .eq("bottle_id", bottle_id) \
        .eq("collection_type", type) \
        .execute()

    return {
        "ok": True,
        "bottle_id": bottle_id,
        "collection_type": type
    }
