"""
Export bottles data from Supabase to local PostgreSQL.
Uses Supabase API (not direct DB connection) so no DB password needed.
"""

import os
import json
from supabase import create_client

# Load from environment
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://dccxxlbegttjuguunfsu.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    print("Error: SUPABASE_SERVICE_ROLE_KEY not set")
    print("Run: source .env or export SUPABASE_SERVICE_ROLE_KEY=...")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Fetching bottles from Supabase...")

# Fetch all bottles in batches (Supabase has 1000 row limit per request)
all_bottles = []
offset = 0
batch_size = 1000

while True:
    response = supabase.table("bottles").select("*").range(offset, offset + batch_size - 1).execute()
    batch = response.data

    if not batch:
        break

    all_bottles.extend(batch)
    print(f"  Fetched {len(all_bottles)} bottles...")
    offset += batch_size

    if len(batch) < batch_size:
        break

print(f"\nTotal bottles: {len(all_bottles)}")

# Export to JSON for import
output_file = "bottles_export.json"
with open(output_file, "w") as f:
    json.dump(all_bottles, f)

print(f"Exported to {output_file}")

# Also export swipes and collections if they exist
for table in ["swipes", "collections"]:
    try:
        response = supabase.table(table).select("*").execute()
        data = response.data
        if data:
            with open(f"{table}_export.json", "w") as f:
                json.dump(data, f)
            print(f"Exported {len(data)} rows from {table}")
        else:
            print(f"No data in {table} table")
    except Exception as e:
        print(f"Could not export {table}: {e}")

print("\nDone! Now run import_to_postgres.py to import to local PostgreSQL.")
