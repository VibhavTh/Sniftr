# Recommender Contract (ML ↔ Backend) — ScentlyMax

## Goal
Serve content-based recommendations using TF-IDF + cosine similarity.

## Model Type
- Vector Space Model: TF-IDF over structured fragrance text
- Similarity: cosine similarity over sparse vectors
- Feature weighting: Main Accords weighted higher than notes

## Inputs (data required from DB)
Each bottle must provide:
- id: int
- name: string
- brand: string
- main_accords: string[] (or mainaccord1..5 mapped into array)
- notes_top: string[]
- notes_middle: string[]
- notes_base: string[]
- description: string (optional)

## Artifacts (where ML writes, backend reads)
Artifacts live at:
- apps/api/intelligence/artifacts/
  - vectorizer.joblib
  - tfidf_matrix.npz
  - bottle_id_map.json (index → bottle_id)
  - metadata.parquet (optional)

## Python API (functions ML exposes)
ML module path:
- apps/api/intelligence/recommender.py

Required functions:
- build_artifacts(input_csv_path: str, out_dir: str) -> None
- load_artifacts(dir: str) -> Recommender
- recommend_by_bottle_id(bottle_id: int, k: int) -> list[int]
- recommend_by_query(query: str, k: int) -> list[int]

Returned list must be **bottle IDs** ordered best→worst.

## Backend Endpoints
### GET /recommendations
Query params (choose one mode):
- seed_bottle_id: int (optional)
- q: string (optional)
- k: int default 20

Rules:
- Must provide either seed_bottle_id OR q
- Response returns bottle cards needed by UI

Response schema:
{
  "mode": "seed" | "query",
  "seed_bottle_id": int | null,
  "query": string | null,
  "k": int,
  "results": [
    {
      "id": int,
      "name": string,
      "brand": string,
      "image_url": string | null,
      "main_accords": string[]
    }
  ]
}

## Failure behavior
- If artifacts missing: return HTTP 503 with clear message: "Recommender artifacts not built"
- If bottle_id not found: HTTP 404
