"""
Import exported JSON data to local PostgreSQL.
Run after export_from_supabase.py has created the JSON files.
"""

import json
import asyncio
import asyncpg
import os
from datetime import datetime

# Local PostgreSQL connection string
# Adjust user/password/host as needed for your local setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/scently")


def parse_timestamp(ts_str):
    """Parse ISO timestamp string to datetime object."""
    if not ts_str:
        return None
    # Handle various ISO formats
    try:
        # Remove 'Z' suffix and handle timezone
        ts_str = ts_str.replace('Z', '+00:00')
        return datetime.fromisoformat(ts_str)
    except ValueError:
        return None


async def import_bottles(conn, bottles):
    """Import bottles from JSON list."""
    print(f"Importing {len(bottles)} bottles...")

    # Prepare insert statement
    insert_sql = """
        INSERT INTO bottles (
            original_index, name, brand, gender, country,
            accord1, accord2, accord3, accord4, accord5,
            notes_top, notes_middle, notes_base,
            image_url, rating_value, rating_count, year
        ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13,
            $14, $15, $16, $17
        )
        ON CONFLICT (original_index) DO UPDATE SET
            name = EXCLUDED.name,
            brand = EXCLUDED.brand,
            gender = EXCLUDED.gender,
            country = EXCLUDED.country,
            accord1 = EXCLUDED.accord1,
            accord2 = EXCLUDED.accord2,
            accord3 = EXCLUDED.accord3,
            accord4 = EXCLUDED.accord4,
            accord5 = EXCLUDED.accord5,
            notes_top = EXCLUDED.notes_top,
            notes_middle = EXCLUDED.notes_middle,
            notes_base = EXCLUDED.notes_base,
            image_url = EXCLUDED.image_url,
            rating_value = EXCLUDED.rating_value,
            rating_count = EXCLUDED.rating_count,
            year = EXCLUDED.year
    """

    # Batch insert for performance
    batch_size = 500
    for i in range(0, len(bottles), batch_size):
        batch = bottles[i:i + batch_size]
        records = [
            (
                b.get("original_index"),
                b.get("name"),
                b.get("brand"),
                b.get("gender"),
                b.get("country"),
                b.get("accord1"),
                b.get("accord2"),
                b.get("accord3"),
                b.get("accord4"),
                b.get("accord5"),
                b.get("notes_top"),
                b.get("notes_middle"),
                b.get("notes_base"),
                b.get("image_url"),
                b.get("rating_value"),
                b.get("rating_count"),
                b.get("year"),
            )
            for b in batch
        ]

        await conn.executemany(insert_sql, records)
        print(f"  Imported {min(i + batch_size, len(bottles))}/{len(bottles)}")

    print("Bottles import complete!")


async def import_swipes(conn, swipes):
    """Import swipes from JSON list."""
    if not swipes:
        print("No swipes to import")
        return

    print(f"Importing {len(swipes)} swipes...")

    insert_sql = """
        INSERT INTO swipes (user_id, bottle_id, action, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
    """

    records = [
        (
            s.get("user_id"),
            s.get("bottle_id"),
            s.get("action"),
            parse_timestamp(s.get("created_at")),
        )
        for s in swipes
    ]

    await conn.executemany(insert_sql, records)
    print("Swipes import complete!")


async def import_collections(conn, collections):
    """Import collections from JSON list."""
    if not collections:
        print("No collections to import")
        return

    print(f"Importing {len(collections)} collection entries...")

    insert_sql = """
        INSERT INTO collections (user_id, bottle_id, collection_type, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, bottle_id, collection_type) DO NOTHING
    """

    records = [
        (
            c.get("user_id"),
            c.get("bottle_id"),
            c.get("collection_type"),
            parse_timestamp(c.get("created_at")),
        )
        for c in collections
    ]

    await conn.executemany(insert_sql, records)
    print("Collections import complete!")


async def main():
    print(f"Connecting to: {DATABASE_URL}")
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        # Import bottles
        if os.path.exists("bottles_export.json"):
            with open("bottles_export.json") as f:
                bottles = json.load(f)
            await import_bottles(conn, bottles)
        else:
            print("bottles_export.json not found - run export_from_supabase.py first")

        # Import swipes
        if os.path.exists("swipes_export.json"):
            with open("swipes_export.json") as f:
                swipes = json.load(f)
            await import_swipes(conn, swipes)

        # Import collections
        if os.path.exists("collections_export.json"):
            with open("collections_export.json") as f:
                collections = json.load(f)
            await import_collections(conn, collections)

        # Verify counts
        bottles_count = await conn.fetchval("SELECT COUNT(*) FROM bottles")
        swipes_count = await conn.fetchval("SELECT COUNT(*) FROM swipes")
        collections_count = await conn.fetchval("SELECT COUNT(*) FROM collections")

        print(f"\n--- Import Summary ---")
        print(f"Bottles: {bottles_count}")
        print(f"Swipes: {swipes_count}")
        print(f"Collections: {collections_count}")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
