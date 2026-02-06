import joblib
import json
import os
import re
from scipy import sparse
from sklearn.metrics.pairwise import cosine_similarity

class FragranceRecommender:
    def __init__(self):
        self.vectorizer = None
        self.tfidf_matrix = None
        self.id_map = None       # Map: matrix_row -> bottle_id
        self.reverse_map = None  # Map: bottle_id -> matrix_row
        self.popularity_map = None  # Map: bottle_id -> popularity_score

    # This method brings our pre-computed 'brain' into memory. By loading the 
    # artifacts and building a reverse_map, we enable O(1) instant lookups. 
    # This allows the API to find any perfume's mathematical position without 
    # scanning the entire dataset.
    def load_artifacts(self, artifacts_dir: str):
        self.vectorizer = joblib.load(os.path.join(artifacts_dir, 'vectorizer.joblib'))
        self.tfidf_matrix = sparse.load_npz(os.path.join(artifacts_dir, 'tfidf_matrix.npz'))
        
        # 2. Load the ID Map (STAYING! Essential for Matrix -> ID translation)
        with open(os.path.join(artifacts_dir, 'bottle_id_map.json'), 'r') as f:
            self.id_map = json.load(f)
        
        # 3. Load the Popularity Map (NEW! Essential for Reranking)
        with open(os.path.join(artifacts_dir, 'popularity_map.json'), 'r') as f:
            raw_pop = json.load(f)
            # Convert string keys from JSON back to integers
            self.popularity_map = {int(k): float(v) for k, v in raw_pop.items()}
        
        # Build reverse map for fast ID-to-Row conversion
        self.reverse_map = {int(v): int(k) for k, v in self.id_map.items()}
        print(f"Engine Ready: {len(self.id_map)} items in ID map, {len(self.popularity_map)} in Pop map.")
    
    # We use internal preprocessing to ensure that a user's raw text query is 
    # cleaned exactly like the training data. Standardizing input here prevents 
    # typos or special characters from degrading the mathematical similarity scores.
    def _preprocess_query(self, text: str) -> str:
        if not isinstance(text, str): return ""
        return re.sub(r'[^a-zA-Z0-9\s]', '', text).lower().strip()

    # This is the 'By ID' core logic. It retrieves a specific perfume's vector, 
    # calculates its Cosine Similarity against all other bottles, and returns 
    # the top K results. It includes a filter to ensure the 'seed' bottle 
    # isn't recommended to itself.
    def recommend_by_bottle_id(self, bottle_id: int, k: int = 20) -> list[int]:
        target_row_idx = self.reverse_map.get(bottle_id)
        if target_row_idx is None: return []
   
        # We grab 50 candidates to ensure we have a good pool for popularity to "nudge"
        # 2. Candidate Generation (Get Top 50 instead of K)
        # We pull 51 because the bottle itself will be the #1 match
        pool_size = 50
        target_vector = self.tfidf_matrix[target_row_idx]
        similarities = cosine_similarity(target_vector, self.tfidf_matrix).flatten()
        
        # argsort gives indices of lowest to highest; we take the last 51 and reverse them
        top_indices = similarities.argsort()[-(pool_size + 1):][::-1]

        candidate_ids = []
        sim_scores = {}
        
        # 3. Build the Similarity Dictionary for the Reranker
        for idx in top_indices:
            b_id = int(self.id_map[str(idx)])
            # Skip the original bottle so we don't recommend a perfume to itself
            if b_id == bottle_id: continue
            
            candidate_ids.append(b_id)
            sim_scores[b_id] = float(similarities[idx])

        # 4. Two-Stage Rerank (with internal normalization)
        final_ranked_ids = self.rerank_candidates(candidate_ids, sim_scores)
        
        # Return the user's requested amount (k)
        return final_ranked_ids[:k]

    # The 'By Query' logic allows for natural language search. The vectorizer 
    # projects the user's text into the existing model's coordinate space. 
    # We then find which perfumes are closest to those new coordinates, 
    # enabling 'search by feel' (e.g., 'dark vanilla and woods').
    def recommend_by_query(self, query: str, k: int = 20) -> list[int]:
        clean_text = self._preprocess_query(query)
        query_vec = self.vectorizer.transform([clean_text])

        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        pool_size = 50
        top_indices = similarities.argsort()[-k:][::-1]
        candidate_ids = []
        sim_scores = {}
        
        for idx in top_indices:
            b_id = int(self.id_map[str(idx)])
            candidate_ids.append(b_id)
            sim_scores[b_id] = float(similarities[idx])
            
        # 4. Rerank and truncate
        return self.rerank_candidates(candidate_ids, sim_scores)[:k]
    

    def rerank_candidates(self, candidate_ids: list[int], sim_scores: dict[int, float], alpha: float = 0.85) -> list[int]:
        if not candidate_ids:
            return []

        # 1. Extract raw similarities from the pool
        raw_sims = [sim_scores[b_id] for b_id in candidate_ids]
        min_sim = min(raw_sims)
        max_sim = max(raw_sims)
        
        # Use a small epsilon to prevent DivisionByZero if all sims are identical
        diff = max_sim - min_sim
        eps = 1e-9 

        scored_candidates = []
        for b_id in candidate_ids:
            # 2. Local Min-Max Normalization
            # This turns the 0.12 - 0.129 range into a 0.0 - 1.0 range
            raw_sim = sim_scores.get(b_id, 0.0)
            norm_sim = (raw_sim - min_sim) / (diff + eps)
            
            # 3. Fetch Popularity (already 0-1)
            pop = self.popularity_map.get(b_id, 0.4)
            
            # 4. Hybrid Math
            final_score = (norm_sim * alpha) + (pop * (1 - alpha))
            scored_candidates.append((b_id, final_score))

        # Sort and return
        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        return [item[0] for item in scored_candidates]
        


    # --- UX Feature Wrappers ---
    def recommend_similar(self, bottle_id: int) -> list[int]:
        # For the "Similar Products" shelf, we want a tight top 10
        return self.recommend_by_bottle_id(bottle_id, k=10)
        

if __name__ == "__main__":
    # 1. Initialize and Load
    rec = FragranceRecommender()
    current_dir = os.path.dirname(os.path.abspath(__file__))
    artifacts_path = os.path.join(current_dir, "artifacts")
    
    print(f"Loading from: {artifacts_path}")
    rec.load_artifacts(artifacts_path)
    
    # 2. Test Case A: Natural Language Search
    print("\n--- Testing Search: 'fresh summer citrus' ---")
    query_results = rec.recommend_by_query("fresh summer citrus", k=5)
    print(f"Top 5 Search IDs: {query_results}")

    # 3. Test Case B: Similar to a specific bottle
    # Let's pick an ID from your dataset (e.g., the first one in your search results)
    if query_results:
        test_id = query_results[0]
        print(f"\n--- Testing 'Similar to ID {test_id}' ---")
        similar_results = rec.recommend_by_bottle_id(test_id, k=5)
        print(f"Top 5 Similar IDs: {similar_results}")
        
        # Check: The test_id should NOT be in the results (Self-filter check)
        if test_id in similar_results:
            print("❌ FAIL: Seed bottle found in recommendations.")
        else:
            print("✅ PASS: Seed bottle correctly filtered out.")