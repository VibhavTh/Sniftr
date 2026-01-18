-- Create swipes table for Swipe v1 user interaction logging
-- Run this SQL in Supabase Dashboard → SQL Editor

-- Drop table if exists (use with caution - only during development)
-- DROP TABLE IF EXISTS swipes CASCADE;

-- Create the swipes table for logging user swipe actions
-- This table stores user interactions (like/pass) for future collaborative filtering
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who performed the swipe
  -- References Supabase auth.users table, cascade deletes if user is deleted
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Bottle that was swiped
  -- Stores original_index directly (INTEGER) for ML model compatibility
  -- NOT a foreign key to bottles.id (UUID) to avoid joins and allow future data flexibility
  bottle_id INTEGER NOT NULL,

  -- Swipe action: 'like' or 'pass'
  -- CHECK constraint ensures data integrity at database level
  action TEXT NOT NULL CHECK (action IN ('like', 'pass')),

  -- Timestamp for analytics and chronological ordering
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching user's swipe history in chronological order
-- Used by: GET /swipes?user_id=... (future analytics endpoint)
CREATE INDEX IF NOT EXISTS idx_swipes_user_created ON swipes(user_id, created_at DESC);

-- Index for checking if user has swiped a specific bottle
-- Used by: Deduplication logic in frontend or future "already seen" filters
CREATE INDEX IF NOT EXISTS idx_swipes_user_bottle ON swipes(user_id, bottle_id);

-- Verify table creation
SELECT 'swipes table created successfully' AS status;
