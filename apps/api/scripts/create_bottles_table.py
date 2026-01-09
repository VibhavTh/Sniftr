"""
Purpose:
One-time setup script to create the bottles table in Supabase Postgres.

Responsibilities:
- Execute SQL DDL statements to create the bottles table with proper schema
- Create indexes for efficient querying (brand, name, full-text search)
- Handle errors gracefully if table already exists

System context:
- Run once during initial Phase 2 setup before data ingestion
- Uses Supabase Python client with service role key for admin operations
- SQL schema matches specs/db/schema.md specification
"""

import sys
from pathlib import Path

# Add parent directory to path to import core modules
sys.path.append(str(Path(__file__).parent.parent))

from supabase import create_client
from core.config import settings


# SQL statement to create the bottles table with all fields from the cleaned CSV
# Includes image_url and source_url for future-proofing (image scraping workflow)
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS bottles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  country TEXT,
  gender TEXT,

  rating_value DECIMAL(3,2),
  rating_count INTEGER,

  year INTEGER,

  notes_top TEXT,
  notes_middle TEXT,
  notes_base TEXT,

  perfumer1 TEXT,
  perfumer2 TEXT,

  accord1 TEXT,
  accord2 TEXT,
  accord3 TEXT,
  accord4 TEXT,
  accord5 TEXT,

  image_url TEXT,
  source_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
"""

# Create indexes for efficient querying by brand, name, and full-text search
CREATE_INDEXES_SQL = """
CREATE INDEX IF NOT EXISTS idx_bottles_brand ON bottles(brand);
CREATE INDEX IF NOT EXISTS idx_bottles_name ON bottles(name);
CREATE INDEX IF NOT EXISTS idx_bottles_search ON bottles USING gin(
  to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(brand, '') || ' ' || COALESCE(notes_top, '') || ' ' || COALESCE(notes_middle, '') || ' ' || COALESCE(notes_base, ''))
);
"""


def create_bottles_table():
    """
    Execute SQL statements to create bottles table and indexes in Supabase.

    This function connects to Supabase using the service role key (admin privileges)
    and executes DDL statements. The table schema supports Phase 2 requirements:
    - Store ~24K fragrances from cleaned CSV
    - Enable search/filter by brand, name, notes
    - Future-proof with image_url and source_url fields

    Raises:
        Exception: If table creation fails due to permissions or SQL errors
    """
    print("Connecting to Supabase...")
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    print("Creating bottles table...")
    try:
        # Supabase Python client doesn't expose raw SQL execution directly
        # We need to use the REST API or run this SQL manually in Supabase dashboard
        print("\n" + "=" * 60)
        print("MANUAL STEP REQUIRED:")
        print("=" * 60)
        print("\nPlease run the following SQL in your Supabase SQL Editor:")
        print("(Dashboard → SQL Editor → New Query)\n")
        print(CREATE_TABLE_SQL)
        print(CREATE_INDEXES_SQL)
        print("\n" + "=" * 60)
        print("\nAfter running the SQL, press Enter to continue...")
        input()
        print("\n✓ Table creation confirmed. Proceeding...\n")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    create_bottles_table()
