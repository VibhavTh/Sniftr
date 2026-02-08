"""
Purpose:
FastAPI router for swipe interaction logging.

Responsibilities:
- Provide POST /swipes endpoint for logging user swipe actions (like/pass)
- Require authentication via JWT to get user_id
- Insert swipe records into RDS PostgreSQL for future collaborative filtering

System context:
- Swipe v1 has no personalization - logs are for analytics and future ALS model
- Frontend handles queue management and deduplication
- Backend just writes rows to swipes table
- Uses asyncpg for direct PostgreSQL access to RDS
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from db import db
from deps.auth import get_current_user


router = APIRouter()


class SwipeRequest(BaseModel):
    bottle_id: int  # original_index value from bottles table
    action: str  # Must be 'like' or 'pass'


@router.post("/swipes")
async def create_swipe(
    swipe: SwipeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Log user swipe action to database for analytics and future personalization.
    Requires authentication - user_id extracted from JWT via get_current_user dependency.
    Validates action is 'like' or 'pass', then inserts row into swipes table.
    Allows duplicate swipes (same user/bottle) for time-series analytics.
    """
    if swipe.action not in ["like", "pass"]:
        raise HTTPException(
            status_code=400,
            detail="Action must be 'like' or 'pass'"
        )

    user_id = current_user["user_id"]

    query = """
        INSERT INTO swipes (user_id, bottle_id, action)
        VALUES ($1, $2, $3)
    """
    await db.execute(query, user_id, swipe.bottle_id, swipe.action)

    return {
        "ok": True,
        "bottle_id": swipe.bottle_id,
        "action": swipe.action
    }
