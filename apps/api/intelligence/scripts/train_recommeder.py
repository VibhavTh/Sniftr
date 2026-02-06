import pandas as pd
import re
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy import sparse
import joblib
import json

# ACCORD_WEIGHT boosts the importance of 'Main Accords' over individual notes. 
# Repeating these tokens in the text 'soup' ensures the TF-IDF algorithm 
# prioritizes the overall fragrance character (e.g., 'Woody') during matching.
ACCORD_WEIGHT = 3

# This helper standardizes text data. It handles null values, removes 
# non-alphanumeric noise, and lowercases everything. This prevents 
# duplicate features like 'Rose' and 'rose' from splitting the math logic.
def clean_token(text):
    if pd.isna(text) or not isinstance(text, str): 
        return ""
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text).lower().strip()
    return text

# The 'Soup' builder performs feature engineering by merging structured 
# columns into a single string. It applies the accord weight and appends 
# notes, creating a complete aromatic profile for the TF-IDF model to analyze.
def build_soup(row):
    tokens = []
    for i in range(1, 6):
        val = clean_token(row.get(f'mainaccord{i}', ""))
        if val and val not in ['null', 'nan', 'none']:
            tokens.extend([val] * ACCORD_WEIGHT)
    for col in ['Top', 'Middle', 'Base']:
        note_list = [clean_token(n) for n in str(row.get(col, "")).split(',')]
        tokens.extend([n for n in note_list if n and n not in ['null', 'nan', 'none']])
    return " ".join(tokens)

# This block handles path management and folder creation. It uses 
# absolute path discovery to ensure the script runs correctly from 
# any directory and creates the 'artifacts' folder if it is missing.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, '..', 'perfume_dataset_v3.csv')
ARTIFACT_DIR = os.path.join(SCRIPT_DIR, '..', 'artifacts')
os.makedirs(ARTIFACT_DIR, exist_ok=True)

# Data preparation: The raw CSV is loaded and the column names are trimmed. 
# The 'build_soup' logic is then applied to all 24,000+ rows to generate 
# a 'metadata_soup' column, which serves as the blueprint for the recommender.
print("Loading and cleaning data...")
df = pd.read_csv(CSV_PATH)
df.columns = df.columns.str.strip()
print("Building metadata soup...")
df['metadata_soup'] = df.apply(build_soup, axis=1)

# Training: The TfidfVectorizer converts the text soup into a numerical matrix. 
# We cap features at 20k and set min_df=2 to eliminate noise, transforming 
# scents into coordinates in a high-dimensional mathematical space.
print(f"Starting vectorization for {len(df)} rows...")
tfidf = TfidfVectorizer(stop_words='english', max_features=20000, min_df=2)
matrix = tfidf.fit_transform(df['metadata_soup'])

# Persistence: We save the vectorizer, matrix, and a JSON map. The map links 
# matrix rows back to database IDs, ensuring that if row positions shift during 
# a future retrain, the API still retrieves the correct perfume data.
id_map = {str(i): int(row_id) for i, row_id in enumerate(df['original_index'])}
joblib.dump(tfidf, os.path.join(ARTIFACT_DIR, 'vectorizer.joblib'))
sparse.save_npz(os.path.join(ARTIFACT_DIR, 'tfidf_matrix.npz'), matrix)
with open(os.path.join(ARTIFACT_DIR, 'bottle_id_map.json'), 'w') as f:
    json.dump(id_map, f)

print(f"DONE: 3 Artifacts saved to {ARTIFACT_DIR}")

def compute_popularity_scores(df: pd.DataFrame) -> dict[int, float]:
    # 1. Clean Rating Count (handle potential commas here too just in case)
    v = df['Rating Count'].astype(str).str.replace(',', '.')
    v = pd.to_numeric(v, errors='coerce').fillna(0)
    
    # 2. Clean Rating Value (The culprit: '1,42' -> '1.42')
    R = df['Rating Value'].astype(str).str.replace(',', '.')
    R = pd.to_numeric(R, errors='coerce').fillna(0)
    
    # 2. Compute C (Global Mean)
    # We only average perfumes that actually have ratings to get a fair mean
    C = R[v > 0].mean()
    m = 50  # Our chosen threshold

    # 3. Calculate IMDB(Movie Encyclopedia) Weighted Rating (WR) 
    # with Bayesian shrinkage(shrink low-vote items toward the mean
    # and let high-vote scores be closer to their actual rating). This balances
    # popularity and quality, preventing obscure perfumes with few ratings
    # from ranking too highly while still rewarding well-rated popular ones.
    # for every row

    # WR = (v / (v+m) * R) + (m / (v+m) * C)
    # Note: Use Series operations for speed
    weighted_ratings = (v / (v + m) * R) + (m / (v + m) * C)
    
    # 4. Min-Max Normalize to 0-1 range
    # This ensures popularity matches the scale of cosine similarity
    min_val = weighted_ratings.min()
    max_val = weighted_ratings.max()
    normalized_scores = (weighted_ratings - min_val) / (max_val - min_val)
    
    # 5. Map: original_index -> normalized_score
    # Important: Cast original_index to int so it matches our other maps
    return {int(row_id): float(score) for row_id, score in zip(df['original_index'], normalized_scores)}   


def save_popularity_artifact(out_dir: str, popularity_map: dict):
    file_path = os.path.join(out_dir, 'popularity_map.json')

    with open(file_path, 'w') as f:
        json.dump(popularity_map, f)
    print(f"Popularity map saved to {file_path}")


# 2. New Popularity logic
print("Computing popularity scores...")
pop_map = compute_popularity_scores(df)

# 3. Save it
save_popularity_artifact(ARTIFACT_DIR, pop_map)