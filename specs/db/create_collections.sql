-- Create collections table for user-curated bottle lists (wishlist, favorites, personal)
-- Run this SQL in Supabase Dashboard → SQL Editor
--
-- Design decision: Single table with collection_type column (Option A) instead of
-- three separate tables. All collection types share identical structure, so one table
-- with a CHECK constraint is simpler to maintain, query, and index.
--
-- bottle_id stores original_index (INTEGER), not bottles.id (UUID).
-- This matches the pattern used in the swipes table and avoids UUID/int FK mismatch.

-- Drop table if exists (use with caution - only during development)
-- DROP TABLE IF EXISTS collections CASCADE;

-- Create the collections table for user-curated bottle lists.
-- Each row represents one bottle saved to one collection by one user.
-- The UNIQUE constraint on (user_id, bottle_id, collection_type) prevents duplicates
-- while allowing the same bottle to appear in multiple collection types.
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who saved this bottle to their collection.
  -- References Supabase auth.users table, cascade deletes if user is deleted.
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Bottle that was saved (original_index value from bottles table).
  -- Not a foreign key to bottles.id (UUID) — same pattern as swipes table.
  bottle_id INTEGER NOT NULL,

  -- Which collection this bottle belongs to.
  -- CHECK constraint enforces valid values at database level.
  -- A user can add the same bottle to multiple collection types (wishlist + favorites).
  collection_type TEXT NOT NULL CHECK (collection_type IN ('wishlist', 'favorites', 'personal')),

  -- Timestamp for ordering ("recently added first") in collection views
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate entries: same user cannot add the same bottle to the same collection twice.
-- Also serves as a fast lookup index for DELETE /collections/{bottle_id}?type=...
-- which queries on all three columns.
CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_unique
  ON collections(user_id, bottle_id, collection_type);

-- Fast lookup for fetching a user's full collection by type, ordered by most recently added.
-- Powers GET /collections?type=wishlist with efficient index-only scan.
CREATE INDEX IF NOT EXISTS idx_collections_user_type
  ON collections(user_id, collection_type, created_at DESC);

-- Verify table creation
SELECT 'collections table created successfully' AS status;
