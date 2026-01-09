# Database Schema

## bottles

Stores fragrance bottle data from the Fragrantica cleaned dataset. This table contains ~24K fragrances with brand, notes, ratings, and metadata for browse/search functionality.

### Schema

```sql
CREATE TABLE bottles (
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

  -- Image fields (future-proofing for Phase 3+)
  -- These fields prepare for eventual scraping/upload workflow
  image_url TEXT,      -- Public URL for bottle image (NULL for now; will be populated via scraping → Supabase Storage → URL)
  source_url TEXT,     -- Canonical source page URL from dataset (e.g., Fragrantica URL)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient search by brand and name
CREATE INDEX idx_bottles_brand ON bottles(brand);
CREATE INDEX idx_bottles_name ON bottles(name);

-- Full-text search index for combined search across name, brand, notes
CREATE INDEX idx_bottles_search ON bottles USING gin(
  to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(brand, '') || ' ' || COALESCE(notes_top, '') || ' ' || COALESCE(notes_middle, '') || ' ' || COALESCE(notes_base, ''))
);
```

### Notes

- **Rating normalization**: CSV uses European format "4,50" which needs conversion to 4.50
- **Comma-separated notes**: Stored as TEXT to keep schema simple; can be split in application layer if needed
- **Image workflow (future)**:
  1. Scraper reads `source_url`
  2. Downloads/uploads images to Supabase Storage or S3
  3. Updates `image_url` with public CDN URL
- **No user_id foreign key**: Bottles are global catalog data, not user-specific
- **Search strategy**: Full-text search via GIN index on tsvector for name/brand/notes
