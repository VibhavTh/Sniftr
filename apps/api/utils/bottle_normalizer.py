"""
Purpose:
Utility functions for transforming raw database bottle rows into UI-ready API responses.

Responsibilities:
- Normalize accord1..5 TEXT columns into main_accords string array
- Split comma-separated notes_top/middle/base TEXT into string arrays
- Return consistent bottle card objects for frontend consumption

System context:
- Database uses TEXT columns (Option B) for MVP speed
- API contract requires arrays, so transformation happens here at the API layer
"""


# Helper function to split comma-separated TEXT fields into clean string arrays.
# Handles None values and filters empty strings. Example: "rose, jasmine" → ["rose", "jasmine"]
def split_comma_separated(text: str | None) -> list[str]:
    if not text:
        return []
    return [item.strip() for item in text.split(',') if item.strip()]


# Sanitize image_url field - return None for invalid/placeholder values.
# Database may contain 'NOT_FOUND' or other non-URL strings from scraping failures.
def sanitize_image_url(url: str | None) -> str | None:
    if not url:
        return None
    # Must start with http:// or https:// to be a valid URL
    if not url.startswith(('http://', 'https://')):
        return None
    return url


# Transform raw Supabase row into UI-ready bottle card with arrays for accords and notes.
# Bridges the gap between database schema (accord1..5 columns, comma-separated notes)
# and API contract (main_accords[], notes_top[], notes_middle[], notes_base[]).
# Uses original_index as "id" for ML model compatibility (not UUID).
def normalize_bottle(db_row: dict) -> dict:
    # Collect accords from separate columns, filter None values, preserve order (accord1 = most prominent)
    accords = [
        db_row.get("accord1"),
        db_row.get("accord2"),
        db_row.get("accord3"),
        db_row.get("accord4"),
        db_row.get("accord5"),
    ]
    main_accords = [a for a in accords if a]

    # Split comma-separated notes into arrays
    notes_top = split_comma_separated(db_row.get("notes_top"))
    notes_middle = split_comma_separated(db_row.get("notes_middle"))
    notes_base = split_comma_separated(db_row.get("notes_base"))

    return {
        "bottle_id": db_row.get("original_index"),  # INT used by recommender, not UUID
        "name": db_row.get("name"),
        "brand": db_row.get("brand"),
        "gender": db_row.get("gender"),
        "country": db_row.get("country"),
        "image_url": sanitize_image_url(db_row.get("image_url")),
        "main_accords": main_accords,
        "notes": {
            "top": notes_top,
            "middle": notes_middle,
            "base": notes_base,
        },
        "rating_value": db_row.get("rating_value"),
        "rating_count": db_row.get("rating_count"),
        "year": db_row.get("year"),
    }
