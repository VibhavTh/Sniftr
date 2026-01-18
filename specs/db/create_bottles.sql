-- Create bottles table for Phase 2 fragrance catalog
-- Run this SQL in Supabase Dashboard → SQL Editor

-- Drop table if exists (use with caution - only during development)
-- DROP TABLE IF EXISTS bottles CASCADE;

-- Create the main bottles table with all fields from the cleaned CSV
CREATE TABLE IF NOT EXISTS bottles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fragrance identification
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  country TEXT,
  gender TEXT,  -- 'men', 'women', 'unisex'

  -- Ratings (normalized from CSV format "4,50" -> 4.50)
  rating_value DECIMAL(3,2),  -- e.g., 4.50
  rating_count INTEGER,

  -- Release year
  year INTEGER,

  -- Fragrance notes (comma-separated from CSV)
  notes_top TEXT,      -- e.g., "fruity notes, aldehydes, green notes"
  notes_middle TEXT,   -- e.g., "bulgarian rose, egyptian jasmine, lily-of-the-valley"
  notes_base TEXT,     -- e.g., "eucalyptus, pine"

  -- Perfumers
  perfumer1 TEXT,
  perfumer2 TEXT,

  -- Main accords (up to 5 from dataset)
  accord1 TEXT,
  accord2 TEXT,
  accord3 TEXT,
  accord4 TEXT,
  accord5 TEXT,

  -- Recommender system integration
  -- This column stores the stable integer ID used by the ML model
  original_index INTEGER UNIQUE,  -- UNIQUE constraint required for upsert operations

  -- Image fields (future-proofing for Phase 3+)
  -- These fields prepare for eventual scraping/upload workflow:
  -- 1. Scraper reads source_url
  -- 2. Downloads/uploads images to Supabase Storage
  -- 3. Updates image_url with public CDN URL
  image_url TEXT,      -- Public URL for bottle image (NULL for now)
  source_url TEXT,     -- Canonical source page URL from dataset (e.g., Fragrantica URL)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_bottles_brand ON bottles(brand);
CREATE INDEX IF NOT EXISTS idx_bottles_name ON bottles(name);
CREATE INDEX IF NOT EXISTS idx_bottles_gender ON bottles(gender);
CREATE INDEX IF NOT EXISTS idx_bottles_year ON bottles(year);
CREATE INDEX IF NOT EXISTS idx_bottles_original_index ON bottles(original_index);

-- Full-text search index for combined search across name, brand, notes
CREATE INDEX IF NOT EXISTS idx_bottles_search ON bottles USING gin(
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(brand, '') || ' ' ||
    COALESCE(notes_top, '') || ' ' ||
    COALESCE(notes_middle, '') || ' ' ||
    COALESCE(notes_base, '')
  )
);

-- Verify table creation
SELECT 'bottles table created successfully with original_index UNIQUE constraint' AS status;
