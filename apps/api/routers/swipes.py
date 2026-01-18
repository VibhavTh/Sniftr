"""
Purpose:
FastAPI router for swipe interaction logging.

Responsibilities:
- Provide POST /swipes endpoint for logging user swipe actions (like/pass)
- Require authentication via JWT to get user_id
- Insert swipe records into Supabase for future collaborative filtering

System context:
- Swipe v1 has no personalization - logs are for analytics and future ALS model
- Frontend handles queue management and deduplication
- Backend just writes rows to swipes table
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from supabase import create_client
from core.config import settings
from deps.auth import get_current_user


router = APIRouter()


# Request body schema for POST /swipes
# Validates that action is exactly 'like' or 'pass' (no typos allowed)
class SwipeRequest(BaseModel):
    bottle_id: int  # original_index value from bottles table
    action: str  # Must be 'like' or 'pass'

    class Config:
        schema_extra = {
            "example": {
                "bottle_id": 1234,
                "action": "like"
            }
        }


# Log user swipe action to database for analytics and future personalization.
# Requires authentication - user_id extracted from JWT via get_current_user dependency.
# Validates action is 'like' or 'pass', then inserts row into swipes table.
# Allows duplicate swipes (same user/bottle) for time-series analytics.
@router.post("/swipes")
async def create_swipe(
    swipe: SwipeRequest,
    current_user: dict = Depends(get_current_user)
):
    # Validate action is exactly 'like' or 'pass'
    if swipe.action not in ["like", "pass"]:
        raise HTTPException(
            status_code=400,
            detail="Action must be 'like' or 'pass'"
        )

    # Extract user_id from JWT payload (added by get_current_user dependency)
    user_id = current_user["user_id"]

    # Insert swipe record into Supabase swipes table
    # No UNIQUE constraint on (user_id, bottle_id) - allows repeat swipes over time
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    swipe_data = {
        "user_id": user_id,
        "bottle_id": swipe.bottle_id,
        "action": swipe.action
    }

    supabase.table("swipes").insert(swipe_data).execute()

    return {
        "ok": True,
        "bottle_id": swipe.bottle_id,
        "action": swipe.action
    }
