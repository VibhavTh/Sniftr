# Sniftr

A fragrance discovery platform with content-based recommendations. Built with Next.js 15, FastAPI, PostgreSQL, and a custom TF-IDF recommendation engine.

**Live site:** [sniftr.net](https://sniftr.net)

---

## Project Overview

Sniftr is a full-stack web application that helps users discover fragrances through a Tinder-style swipe interface. The core idea: like a fragrance, and the system recommends similar ones based on their scent profiles.

The app features three main discovery modes:
- **Finder**: Swipe through fragrances (like/pass), with ML-powered recommendations after each like
- **Explore**: Search and browse a catalog of 24,000+ fragrances
- **Collection**: Save favorites, build a wishlist, track owned bottles

I built this as a learning project to work through the full stack: frontend UI patterns, backend API design, database operations, ML systems, and deployment.

---

## Motivation & Purpose

I wanted to build something end-to-end that wasn't a tutorial project. Fragrance discovery seemed like a good domain because:

1. **The data is interesting** - Fragrances have structured metadata (accords, notes, brand, gender) that lends itself to content-based filtering
2. **The UX problem is real** - With thousands of fragrances on the market, discovery is genuinely hard
3. **The scope is tractable** - Small enough to finish, complex enough to learn from

The goal was to understand how all the pieces fit together: how ML models get deployed behind APIs, how state machines work in React, how auth flows interact with protected endpoints, how database migrations happen in production.

---

## Key Features

### Swipe Discovery (Finder)
- Tinder-style card interface with drag gestures and animations
- One-life mechanic: after liking a fragrance, you can pass once on similar bottles before returning to random
- Session-based deduplication to prevent seeing the same fragrance twice
- Auto-queue refill when similar bottles run low

### Search & Browse (Explore)
- Full-text search across fragrance names and brands
- Filter by gender
- Debounced search with no loading flash between keystrokes
- Click-to-expand detail modal with notes, accords, and ratings

### Collections
- Three collection types: Favorites (liked bottles), Wishlist, Personal (owned)
- Optimistic UI updates for instant feedback
- Heart icon state synced across all views

### Authentication
- Supabase Auth with email/password
- JWT verification via JWKS endpoint
- Public endpoints for browsing, protected endpoints for user actions
- Inline login prompts when unauthenticated users try to save

---

## System Architecture

### Frontend (Next.js 15)

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with a strict design system (no rounded corners, minimal shadows)
- **State**: React Context for global state (modal, collections), useReducer for complex flows (Finder)
- **Animations**: Framer Motion for swipe gestures and card transitions

The Finder page uses a state machine pattern with useReducer to manage the swipe flow. This was a deliberate choice after simpler useState approaches became unwieldy. The reducer handles mode transitions (random vs. candidates), queue management, and the "one life" mechanic.

### Backend (FastAPI)

- **Framework**: FastAPI with async handlers
- **Database**: PostgreSQL via asyncpg connection pool
- **Auth**: JWT verification against Supabase JWKS endpoint
- **ML**: TF-IDF recommender loaded as singleton at startup

The API is split into public endpoints (browse, search, random bottles) and protected endpoints (swipes, collections). The auth dependency fetches Supabase's public keys and verifies token signatures using ES256.

### Database (PostgreSQL)

Three main tables:
- `bottles`: 24,063 fragrances with metadata (name, brand, gender, accords, notes, image, rating)
- `swipes`: User interaction log (like/pass) for future personalization
- `collections`: User-saved bottles by type (favorites, wishlist, personal)

Originally used Supabase for both auth and data. Migrated data layer to RDS to reduce latency and simplify the stack while keeping Supabase for auth only.

### ML Layer

The recommendation engine uses TF-IDF (Term Frequency-Inverse Document Frequency) with cosine similarity:

1. Each fragrance is represented as a text document combining its accords and notes
2. TF-IDF vectorizer converts documents to sparse vectors
3. Cosine similarity finds nearest neighbors in vector space
4. Results are filtered and returned as recommendations

Artifacts (vectorizer, TF-IDF matrix, mappings) are pre-computed and loaded once at API startup.

### Deployment

- **Frontend**: Vercel (Next.js optimized hosting)
- **Backend**: AWS EC2 with uvicorn behind nginx
- **Database**: AWS RDS PostgreSQL
- **Auth**: Supabase (hosted service)

---

## Data & ML

### Dataset

The fragrance catalog contains 24,063 bottles scraped from public fragrance databases. Each entry includes:
- Name and brand
- Gender classification
- Up to 5 accords (e.g., "woody", "fresh-spicy", "amber")
- Top, middle, and base notes
- Image URL
- User ratings

### Recommendation Approach

I chose content-based filtering over collaborative filtering because:
1. No cold-start problem - recommendations work immediately without user history
2. Explainable results - similar fragrances share actual scent characteristics
3. Simpler to implement and debug

The TF-IDF approach treats each fragrance as a document:

```
"woody aromatic citrus bergamot lavender cedar sandalwood musk"
```

The vectorizer learns term weights across the corpus, and cosine similarity finds fragrances with similar scent profiles.

### Tradeoffs

- **TF-IDF vs. embeddings**: TF-IDF is simpler and sufficient for this domain. Neural embeddings would be overkill given the vocabulary size.
- **Pre-computed vs. online**: Computing similarity at request time would be slow. Pre-computing the full matrix uses more memory but enables sub-100ms responses.
- **Sparse vs. dense**: The TF-IDF matrix is stored in scipy CSR (Compressed Sparse Row) format to reduce memory footprint.

---

## Engineering Challenges & Tradeoffs

### The "5 Bottles Repeating" Bug

**Problem**: Users would see the same 5-6 fragrances cycling repeatedly in the Finder.

**Root cause**: The candidate queue wasn't being deduplicated across the session. When the queue ran low and refilled, it fetched the same similar bottles again.

**Solution**: Added `seenIds: Record<number, true>` to reducer state. Every shown bottle gets added to seenIds. All candidate fetches filter against this set before use.

### Deterministic Random

**Problem**: The "random" bottles endpoint returned the same bottles every time in production.

**Root cause**: PostgreSQL's `ORDER BY random()` with `LIMIT` can be optimized by the query planner in ways that reduce randomness, especially with connection pooling.

**Solution**: Created a PostgreSQL function that forces true random selection:

```sql
CREATE OR REPLACE FUNCTION get_random_bottles(n INT)
RETURNS SETOF bottles AS $$
  SELECT * FROM bottles ORDER BY random() LIMIT n;
$$ LANGUAGE sql VOLATILE;
```

The `VOLATILE` marker prevents query plan caching.

### Loading State Flash

**Problem**: The Explore page would flash a loading spinner between every keystroke during search.

**Root cause**: Each search query created a new cache key, triggering loading state even when results came back quickly.

**Solution**: Implemented debounced search with stable query keys. The UI only shows loading state after a 300ms delay, and the search input is decoupled from the API call.

### Queue Exhaustion

**Problem**: In Finder, the candidate queue would empty completely, leaving users stuck.

**Root cause**: Initial implementation fetched candidates once per like. Heavy users would exhaust the queue faster than expected.

**Solution**: Added a refill effect that triggers when queue length drops below 10. Fetches more candidates using the last liked bottle as seed, deduplicates against seenIds, and appends to queue (capped at 80 total).

### Order Preservation in Batch Queries

**Problem**: When fetching multiple bottles by ID, the returned order didn't match the requested order.

**Root cause**: SQL `WHERE id IN (...)` doesn't guarantee result order.

**Solution**: Used `unnest` with `WITH ORDINALITY` to preserve order:

```sql
SELECT b.* FROM unnest($1::int[]) WITH ORDINALITY AS t(id, ord)
JOIN bottles b ON b.original_index = t.id
ORDER BY t.ord
```

### RDS Migration

**Problem**: Supabase's data layer added latency and complexity. Wanted to use standard PostgreSQL tooling.

**Approach**:
1. Exported all data from Supabase to JSON files
2. Created schema in RDS with proper indexes
3. Imported data with validation
4. Updated connection strings and tested
5. Kept Supabase for auth only (JWKS verification works the same)

The hybrid setup simplifies the data layer while retaining Supabase's auth infrastructure.

---

## Results & Current State

The app is live at [sniftr.net](https://sniftr.net) with:

- 24,063 fragrances in the catalog
- Sub-100ms recommendation latency
- Three discovery modes (Finder, Explore, Collection)
- Full auth flow with protected endpoints
- Mobile-responsive UI

### What Works Well

- The swipe UX is satisfying - drag gestures, card animations, the "one life" mechanic adds engagement
- Recommendations feel relevant - TF-IDF on accords/notes surfaces genuinely similar fragrances
- The state machine pattern made the Finder logic maintainable after multiple iterations

### Known Limitations

- No personalization beyond content similarity - doesn't learn from aggregate user behavior
- Search is basic full-text - no fuzzy matching or typo tolerance
- No social features - can't share or compare collections

---

## What I Learned

### State Machines for Complex UI

The Finder page went through four iterations before landing on useReducer. The lesson: when you have multiple interdependent state variables with complex transition rules, a reducer with explicit actions is clearer than scattered useState calls.

### Read Before Write

Multiple bugs came from not fully understanding existing code before modifying it. The deterministic random bug, for instance, wasn't in my code - it was in how PostgreSQL optimizes queries. Reading the actual behavior (via logs, debugger, explain plans) beats assumptions.

### The Value of Normalization Layers

Having a single `normalize_bottle()` function that transforms database rows to API responses saved hours of debugging. Every endpoint returns the same shape. Frontend types match. Changes happen in one place.

### Pre-computed vs. On-Demand

Loading ML artifacts at startup felt wasteful initially. But the alternative - computing TF-IDF similarity per request - would add seconds of latency. The singleton pattern with startup initialization is the right call for anything computationally expensive.

### Optimistic UI

Collection toggles need to feel instant. Waiting for the API round-trip before updating the heart icon creates perceived lag. Optimistic updates (change UI immediately, revert on error) make the app feel faster than it is.

---

## Future Improvements

### Collaborative Filtering
Combine content-based similarity with user behavior patterns. Users who liked X also liked Y.

### Better Search
Add fuzzy matching, did-you-mean suggestions, and filters for accords/notes.

### Fragrance Comparison
Side-by-side comparison of two fragrances showing shared and unique notes.

### User Profiles
Public profiles showing collections, reviews, and fragrance preferences.

### Performance
- Cache recommendation results
- Implement proper pagination for large result sets
- Add request coalescing for rapid-fire actions

---

## Try It Yourself

**Live site**: [sniftr.net](https://sniftr.net)

### Local Development

```bash
# Clone the repo
git clone https://github.com/yourusername/scentlymax.git
cd scentlymax

# Frontend
cd apps/web
npm install
npm run dev

# Backend
cd apps/api
pip install -r requirements.txt
uvicorn main:app --reload
```

Requires:
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Environment variables for database and Supabase URLs

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python 3.11, asyncpg |
| Database | PostgreSQL (AWS RDS) |
| Auth | Supabase Auth (JWT/JWKS) |
| ML | scikit-learn (TF-IDF), scipy (sparse matrices) |
| Deployment | Vercel (frontend), AWS EC2 (backend), AWS RDS (database) |

---

## Repository Structure

```
scentlymax/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── contexts/        # Global state providers
│   │   ├── lib/             # Utilities (API, colors)
│   │   └── types/           # TypeScript interfaces
│   └── api/                 # FastAPI backend
│       ├── routers/         # API endpoints
│       ├── deps/            # Dependencies (auth)
│       ├── utils/           # Helpers (normalizer)
│       ├── intelligence/    # ML recommender
│       └── core/            # Config
├── docs/
│   ├── agent/               # Development context docs
│   └── learning-log.md      # Session reflections
└── specs/                   # Database schemas, contracts
```
