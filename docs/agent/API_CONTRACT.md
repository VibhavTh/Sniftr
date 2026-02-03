# API Contract — Backend is Law

> Last updated: 2026-01-30

All endpoints defined in `apps/api/routers/`. Base URL: `http://localhost:8000`

## Authentication

- **Method:** Bearer token in `Authorization` header
- **Token source:** Supabase JWT (from `supabase.auth.getSession()`)
- **Backend verification:** ES256 via Supabase JWKS endpoint
- **Auth dependency:** `deps/auth.py:get_current_user` returns `{ user_id, email }`

---

## Public Endpoints (No Auth)

### GET /health
Health check for monitoring.

**Response:**
```json
{ "status": "ok" }
```

### GET /bottles
Paginated browse with optional search. Stable ordering for deterministic pagination.

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number (1-indexed) |
| `limit` | int | 24 | Items per page (max 100) |
| `q` | string | null | Search query (filters name OR brand, case-insensitive) |

**Ordering:** `rating_count DESC`, `rating_value DESC`, `original_index ASC`

**Response:**
```json
{
  "page": 1,
  "limit": 24,
  "total": 24352,
  "results": [Bottle, ...]
}
```

### GET /bottles/random
Random bottles for initial swipe queue seeding.

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | int | 50 | Number of bottles (max 100) |

**Response:**
```json
{
  "count": 50,
  "results": [Bottle, ...]
}
```

### GET /bottles/{bottle_id}
Single bottle detail by ID.

**Path Params:**
| Param | Type | Description |
|-------|------|-------------|
| `bottle_id` | int | The bottle's `original_index` value |

**Response:** Single `Bottle` object (not wrapped)

**Errors:** 404 if bottle not found

### GET /recommendations
ML-powered recommendations. Supports two modes (mutually exclusive).

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Natural language query (e.g., "fresh summer citrus") |
| `seed_bottle_id` | int | Find bottles similar to this one |
| `k` | int | Number of results (default 20, max 100) |

**Rules:** Must provide exactly one of `q` OR `seed_bottle_id`

**Response:**
```json
{
  "mode": "query" | "seed",
  "seed_bottle_id": int | null,
  "query": string | null,
  "k": 20,
  "results": [Bottle, ...]
}
```

### GET /swipe/candidates
Get similar bottles for swipe queue (k=50 fixed).

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `seed_bottle_id` | int | **Required.** Bottle ID to find similar fragrances |

**Response:**
```json
{
  "seed_bottle_id": 1234,
  "count": 50,
  "results": [Bottle, ...]
}
```

**Errors:** 404 if no candidates found

---

## Protected Endpoints (Auth Required)

### GET /health-auth
Authenticated health check. Returns user context from JWT.

**Response:**
```json
{
  "user_id": "uuid-string",
  "email": "user@example.com"
}
```

### POST /swipes
Log a swipe action (like or pass).

**Request Body:**
```json
{
  "bottle_id": 1234,
  "action": "like" | "pass"
}
```

**Response:**
```json
{
  "ok": true,
  "bottle_id": 1234,
  "action": "like"
}
```

**Notes:** Allows duplicate swipes (same user/bottle) for time-series analytics.

### GET /collections/status
Check if a bottle is in user's collections. Returns boolean flags for each type.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `bottle_id` | int | **Required.** The bottle's `original_index` value |

**Response:**
```json
{
  "wishlist": true,
  "favorites": false,
  "personal": false
}
```

**Notes:** Returns all `false` if bottle is not in any collection. Used by frontend to render filled/unfilled hearts.

### POST /collections
Add bottle to collection. **Idempotent** — returns 200 even if already exists.

**Request Body:**
```json
{
  "bottle_id": 1234,
  "collection_type": "wishlist" | "favorites" | "personal"
}
```

**Response:**
```json
{
  "ok": true,
  "bottle_id": 1234,
  "collection_type": "wishlist"
}
```

### GET /collections
Fetch all bottles in a user's collection by type.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `type` | string | **Required.** One of: `wishlist`, `favorites`, `personal` |

**Response:**
```json
{
  "collection_type": "wishlist",
  "results": [Bottle, ...]
}
```

**Notes:** Results ordered by `created_at DESC` (most recently added first).

### DELETE /collections/{bottle_id}
Remove bottle from collection. **Idempotent** — returns 200 even if didn't exist.

**Path Params:**
| Param | Type | Description |
|-------|------|-------------|
| `bottle_id` | int | The bottle's `original_index` value |

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `type` | string | **Required.** One of: `wishlist`, `favorites`, `personal` |

**Response:**
```json
{
  "ok": true,
  "bottle_id": 1234,
  "collection_type": "wishlist"
}
```

---

## Bottle Object Shape

All endpoints return bottles normalized by `utils/bottle_normalizer.py`:

```typescript
interface Bottle {
  bottle_id: number;       // original_index (INT, not UUID)
  name: string;
  brand: string;
  gender: string | null;   // "men", "women", "unisex"
  country: string | null;
  image_url: string | null; // Sanitized: null if invalid URL
  main_accords: string[];   // From accord1..5 columns, filtered
  notes: {
    top: string[];         // Split from comma-separated TEXT
    middle: string[];
    base: string[];
  };
  rating_value: number | null;  // e.g., 4.50
  rating_count: number | null;
  year: number | null;
}
```

## Normalization Rules

1. **bottle_id** = `original_index` (integer row index for ML compatibility)
2. **main_accords** = `[accord1, accord2, accord3, accord4, accord5]` with nulls filtered
3. **notes** = nested object with `top`, `middle`, `base` arrays (split from comma-separated TEXT)
4. **image_url** = sanitized (must start with `http://` or `https://`, otherwise `null`)

---

## Verified Sources

- `apps/api/routers/health.py:1-63`
- `apps/api/routers/bottles.py:1-145`
- `apps/api/routers/recommendations.py:1-92`
- `apps/api/routers/swipe_candidates.py:1-66`
- `apps/api/routers/swipes.py:1-77`
- `apps/api/routers/collections.py:1-163`
- `apps/api/utils/bottle_normalizer.py:1-72`
- `apps/api/deps/auth.py:1-76`
