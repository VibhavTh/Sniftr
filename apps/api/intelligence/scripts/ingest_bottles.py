"""
Purpose:
One-time data ingestion script to populate the bottles table from perfume_dataset_v3.csv.

Responsibilities:
- Read CSV with comma delimiter
- Map CSV columns to database schema
- Normalize ratings from European format ("4,50") to decimal (4.50)
- Clean empty/unknown values to NULL
- Upsert bottles using original_index as unique key

System context:
- Run once after table creation: python apps/api/intelligence/scripts/ingest_bottles.py
- CSV path: apps/api/intelligence/perfume_dataset_v3.csv
- Uses Supabase Python client with service role key for bulk insert
"""

import csv
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent directories to path for imports
# Script is at apps/api/intelligence/scripts/, need to go up to apps/api/
api_dir = Path(__file__).parent.parent.parent
sys.path.append(str(api_dir))

# Load .env file from apps/api/.env
env_path = api_dir / ".env"
load_dotenv(env_path)

from supabase import create_client
from core.config import settings


def parse_rating(value: str) -> float | None:
    """
    Convert European decimal format to float.

    Handles ratings in format "4,50" by converting comma to decimal point.
    Returns None for empty or invalid values.

    Args:
        value: Rating string like "4,50" or "1,42"

    Returns:
        Float like 4.50, or None if empty/invalid
    """
    try:
        value = value.strip()
        if not value:
            return None
        # Replace European comma with decimal point
        return float(value.replace(',', '.'))
    except (ValueError, AttributeError):
        return None


def clean_text(value: str) -> str | None:
    """
    Clean text fields by converting empty/"unknown" to None.

    Database NULL is more appropriate than empty strings for missing data.
    Also handles the common "unknown" placeholder in the dataset.

    Args:
        value: Text field from CSV

    Returns:
        Cleaned string or None
    """
    if not value:
        return None
    cleaned = value.strip()
    if not cleaned or cleaned.lower() == "unknown":
        return None
    return cleaned


def ingest_bottles():
    """
    Main ingestion function that reads CSV and populates Supabase.

    Reads perfume_dataset_v3.csv row by row, maps columns to the bottles table
    schema, and performs batched upsert operations using original_index as the conflict key.
    Batching prevents HTTP/2 connection timeouts that occur with thousands of individual requests.
    This allows re-running the script safely to update existing data.
    Prints progress every batch for visibility during long imports.
    """
    # CSV is located at apps/api/intelligence/perfume_dataset_v3.csv
    csv_path = Path(__file__).parent.parent / "perfume_dataset_v3.csv"

    print(f"Reading CSV from: {csv_path}")
    if not csv_path.exists():
        print(f"ERROR: CSV file not found at {csv_path}")
        sys.exit(1)

    print("Connecting to Supabase...")
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    print("Starting ingestion...")

    # Batch configuration to prevent connection timeouts
    # Processing 100 rows per request reduces 24K requests to ~240 requests
    BATCH_SIZE = 100
    batch = []
    count = 0

    # Open CSV and process rows
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Map CSV columns to database schema
            # Handle potential missing values and type conversions
            bottle = {
                "original_index": int(row["original_index"]),
                "name": clean_text(row["Perfume"]),
                "brand": clean_text(row["Brand"]),
                "country": clean_text(row["Country"]),
                "gender": clean_text(row["Gender"]),
                "rating_value": parse_rating(row["Rating Value"]),
                "rating_count": int(row["Rating Count"]) if row.get("Rating Count") and row["Rating Count"].strip() else None,
                "year": int(float(row["Year"])) if row.get("Year") and row["Year"].strip() else None,
                "notes_top": clean_text(row["Top"]),
                "notes_middle": clean_text(row["Middle"]),
                "notes_base": clean_text(row["Base"]),
                "perfumer1": clean_text(row["Perfumer1"]),
                "perfumer2": clean_text(row["Perfumer2"]),
                "accord1": clean_text(row["mainaccord1"]),
                "accord2": clean_text(row["mainaccord2"]),
                "accord3": clean_text(row["mainaccord3"]),
                "accord4": clean_text(row["mainaccord4"]),
                "accord5": clean_text(row["mainaccord5"]),
                "source_url": clean_text(row["url"]),
                "image_url": clean_text(row["image_url"])
            }

            batch.append(bottle)
            count += 1

            # When batch is full, upsert all rows at once
            if len(batch) >= BATCH_SIZE:
                supabase.table("bottles").upsert(batch, on_conflict="original_index").execute()
                print(f"Processed {count} bottles...")
                batch = []  # Clear batch after successful insert

        # Upsert any remaining rows that didn't fill a complete batch
        if batch:
            supabase.table("bottles").upsert(batch, on_conflict="original_index").execute()
            print(f"Processed {count} bottles...")

    print(f"\n✓ Ingestion complete! Total bottles: {count}")


if __name__ == "__main__":
    ingest_bottles()
