-- RPC function for true random bottle selection
-- Uses PostgreSQL's ORDER BY random() for uniform distribution across all 24K bottles
-- Call via Supabase: supabase.rpc('get_random_bottles', { 'p_limit': 5 })

CREATE OR REPLACE FUNCTION get_random_bottles(p_limit INTEGER DEFAULT 50)
RETURNS SETOF bottles
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM bottles
  ORDER BY random()
  LIMIT p_limit;
$$;

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION get_random_bottles(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_random_bottles(INTEGER) TO anon;
