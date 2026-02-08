-- ScentlyMax RDS Schema
-- Run this after creating the database: psql -U postgres -d scently -f schema.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Bottles table (fragrance catalog)
CREATE TABLE IF NOT EXISTS bottles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_index INT UNIQUE NOT NULL,
    name TEXT,
    brand TEXT,
    gender TEXT,
    country TEXT,
    accord1 TEXT,
    accord2 TEXT,
    accord3 TEXT,
    accord4 TEXT,
    accord5 TEXT,
    notes_top TEXT,
    notes_middle TEXT,
    notes_base TEXT,
    image_url TEXT,
    rating_value FLOAT,
    rating_count INT,
    year INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Swipes table (user interactions for future ML)
CREATE TABLE IF NOT EXISTS swipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    bottle_id INT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections table (wishlist, favorites, personal)
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    bottle_id INT NOT NULL,
    collection_type TEXT NOT NULL CHECK (collection_type IN ('wishlist', 'favorites', 'personal')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, bottle_id, collection_type)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_bottles_original_index ON bottles(original_index);
CREATE INDEX IF NOT EXISTS idx_bottles_brand ON bottles(brand);
CREATE INDEX IF NOT EXISTS idx_bottles_name ON bottles(name);
CREATE INDEX IF NOT EXISTS idx_swipes_user ON swipes(user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_bottle ON swipes(bottle_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_type ON collections(user_id, collection_type);
CREATE INDEX IF NOT EXISTS idx_collections_bottle ON collections(bottle_id);

-- Verify tables created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
