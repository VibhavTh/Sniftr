# File Map — Where Things Live

> Last updated: 2026-02-07 (session 9 — Auth Pages Redesign + Branding)

## Repository Root

```
ScentlyMax/
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   └── api/                    # FastAPI backend
├── docs/
│   ├── agent/                  # Agent context docs (you are here)
│   └── learning-log.md         # Development reflections
├── specs/
│   ├── db/                     # Database schemas
│   └── recsys_contract.md      # ML contract
└── skills/
    └── scentlymax-ui/          # UI skill with templates
```

---

## Frontend: `apps/web/`

### Pages (App Router)

| Path | File | Status |
|------|------|--------|
| `/` | `app/page.tsx` | **Wired to API** (editorial homepage with trending) |
| `/signin` | `app/signin/page.tsx` | Auth (two-panel layout) |
| `/signup` | `app/signup/page.tsx` | Auth (two-panel layout) |
| `/login` | `app/login/page.tsx` | Redirect → `/signin` |
| `/forgot-password` | `app/forgot-password/page.tsx` | Auth (password reset) |
| `/browse` | `app/browse/page.tsx` | **Wired to API** |
| `/finder` | `app/finder/page.tsx` | **Wired to API** (swipe MVP) |
| `/collection` | `app/collection/page.tsx` | **Wired to API** (Profile dashboard) |
| `/collection/favorites` | `app/collection/favorites/page.tsx` | **Wired to API** |
| `/collection/wishlist` | `app/collection/wishlist/page.tsx` | **Wired to API** |
| `/collection/personal` | `app/collection/personal/page.tsx` | **Wired to API** |
| `/test-fragrance` | `app/test-fragrance/page.tsx` | Dev testing |

### Layout & Config

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with fonts + `FragranceModalProvider` |
| `app/globals.css` | Tailwind imports |
| `next.config.ts` | Image remote patterns (http/https `**`) |
| `tailwind.config.ts` | Tailwind configuration (content includes `./lib/**/*.{js,ts}` for accord colors) |

### Components

| File | Purpose |
|------|---------|
| `components/FragranceCard.tsx` | Reusable bottle card for grids |
| `components/FragranceDetailModal.tsx` | Universal detail modal (full view) |
| `components/auth/AuthSplitLayout.tsx` | Two-panel auth layout (form left, hero right) |

### Contexts

| File | Purpose |
|------|---------|
| `contexts/FragranceModalContext.tsx` | Global modal state provider + hook |
| `contexts/CollectionsContext.tsx` | Collection status cache + optimistic toggle actions |

### Lib (Utilities)

| File | Purpose |
|------|---------|
| `lib/api.ts` | `apiGet`, `apiPost`, `apiDelete`, `authenticatedFetch` |
| `lib/supabase.ts` | Supabase client initialization |
| `lib/fragrance-colors.ts` | `getAccordColor`, `getNoteEmoji`, `formatDisplayText` helpers |

### Types

| File | Purpose |
|------|---------|
| `types/fragrance.ts` | `Fragrance` and `FragranceCard` interfaces |

---

## Backend: `apps/api/`

### Entry Point & Database

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app, CORS, router registration, lifespan (DB pool + ML init) |
| `db.py` | Asyncpg connection pool wrapper (`Database` class, `db` singleton) |

### Routers

| File | Endpoints |
|------|-----------|
| `routers/health.py` | `GET /health`, `GET /health-auth` |
| `routers/bottles.py` | `GET /bottles`, `GET /bottles/random`, `GET /bottles/{id}` |
| `routers/recommendations.py` | `GET /recommendations` |
| `routers/swipe_candidates.py` | `GET /swipe/candidates` |
| `routers/swipes.py` | `POST /swipes` |
| `routers/collections.py` | `POST /collections`, `GET /collections`, `DELETE /collections/{id}` |

### Dependencies

| File | Purpose |
|------|---------|
| `deps/auth.py` | `get_current_user` JWT verification |

### Utilities

| File | Purpose |
|------|---------|
| `utils/bottle_normalizer.py` | `normalize_bottle()` transforms DB rows to API shape |

### Config

| File | Purpose |
|------|---------|
| `core/config.py` | Settings: `DATABASE_URL` (RDS/Postgres), `SUPABASE_URL` (auth only), `CORS_ORIGINS` |
| `core/__init__.py` | Package init |

### Migration Scripts

| File | Purpose |
|------|---------|
| `schema.sql` | PostgreSQL schema DDL (bottles, swipes, collections tables) |
| `export_from_supabase.py` | Export data from Supabase to JSON files |
| `import_to_postgres.py` | Import JSON data to PostgreSQL (RDS or local) |

### ML / Intelligence

| File | Purpose |
|------|---------|
| `intelligence/recommender.py` | `FragranceRecommender` class |
| `intelligence/artifacts/` | Pre-trained TF-IDF matrix, vectorizer, mappings |
| `intelligence/scripts/` | Training scripts |

### Scripts

| File | Purpose |
|------|---------|
| `scripts/create_bottles_table.py` | DB setup script |

---

## Specs: `specs/`

| File | Purpose |
|------|---------|
| `db/schema.md` | Database schema documentation |
| `db/create_bottles.sql` | Bottles table DDL |
| `db/create_swipes.sql` | Swipes table DDL |
| `db/create_collections.sql` | Collections table DDL |
| `recsys_contract.md` | ML ↔ Backend contract |
| `api/openapi.yaml` | OpenAPI spec (may be outdated) |

---

## Skills: `skills/`

| File | Purpose |
|------|---------|
| `scentlymax-ui/SKILL.md` | UI skill rules + design constraints |
| `scentlymax-ui/assets/*.png` | Template screenshots |

---

## Key Files Quick Reference

### "I need to work on the Homepage"
→ `apps/web/app/page.tsx`
→ Public editorial landing page (no auth required)
→ 6 sections: Hero, Nav Cards, Trending (API), Value Statement, Your Library, Footer
→ Trending fetches from `GET /bottles?limit=8` using `apiGet`, renders via `FragranceCard`
→ Nav overlays hero with white text (absolute positioned)
→ Nav structure: `Home | Finder | Explore | Collection`

### "I need to add/update navigation"
→ Navigation is duplicated in each page (no shared component yet)
→ Brand name: "SNIFTR" (top-left, uppercase with tracking)
→ Standard 4-tab structure: `Home | Finder | Explore | Collection`
→ Profile icon (top-right) links to `/signin`
→ Homepage nav: white text on dark hero (absolute positioned)
→ Inner pages nav: dark text on white bar (static)
→ Active tab has `underline underline-offset-4`
→ Collection sub-pages also have "← Back to Collection" link

### "I need to change how bottles are returned from API"
→ `apps/api/utils/bottle_normalizer.py`

### "I need to change database configuration"
→ `apps/api/core/config.py` — `DATABASE_URL` env var
→ `apps/api/db.py` — asyncpg pool wrapper
→ Connection string format: `postgresql://user:pass@host:port/dbname`

### "I need to run raw SQL queries"
→ Use `db.fetch_all()`, `db.fetch_one()`, `db.execute()` from `apps/api/db.py`
→ All routers import: `from db import db`
→ Use `$1, $2, $3` for parameterized queries (asyncpg style)
→ Use `ANY($1::int[])` for IN clauses with arrays

### "I need to add a new API endpoint"
→ Create in `apps/api/routers/`, register in `apps/api/main.py`

### "I need to change the fragrance card appearance"
→ `apps/web/components/FragranceCard.tsx`

### "I need to change the modal"
→ `apps/web/components/FragranceDetailModal.tsx`

### "I need to add a new page"
→ `apps/web/app/<route>/page.tsx`

### "I need to change accord colors or emoji mappings"
→ `apps/web/lib/fragrance-colors.ts`

### "I need to format display text (hyphens → spaces)"
→ Use `formatDisplayText(text)` from `apps/web/lib/fragrance-colors.ts`
→ Already applied to: name, brand, gender, accords, notes in Card and Modal

### "I need to change the frontend type definition"
→ `apps/web/types/fragrance.ts`

### "I need to make an authenticated API call"
→ Use `apiGet` or `apiPost` from `apps/web/lib/api.ts`

### "I need to open the modal from anywhere"
→ `const { open } = useFragranceModal()` from `apps/web/contexts/FragranceModalContext.tsx`

### "I need to check/toggle collection status"
→ Use `useCollections()` from `apps/web/contexts/CollectionsContext.tsx`
→ Provides: `getStatus(bottleId)`, `fetchStatus(bottleId)`, `toggleFavorite(bottleId)`, `setCollection(bottleId, type, inCollection)`

### "I need to work on the Finder/Swipe page"
→ `apps/web/app/finder/page.tsx`
→ Uses `useReducer` state machine (v4): mode, candidateQueue, passLifeUsed, lastLikedId, **seenIds**
→ `/bottles/random` for cold start + pass-in-random, `/swipe/candidates?seed_bottle_id=X` for personalized queue on LIKE
→ Logs swipes to `POST /swipes`, auto-favorites on Like via `POST /collections` (fire-and-forget, auth only)
→ No localStorage — all state is in-memory, resets on mount
→ **Dedupe (v4)**: `seenIds: Record<number, true>` tracks all shown bottles; candidates filtered before use
→ **Queue refill**: When queue < 10 in candidates mode, auto-fetches more from lastLikedId
→ **Animations**: Framer Motion (`motion`, `AnimatePresence`) for swipe exits (left=Pass, right=Like with rotation)
→ **Drag gesture**: Drag threshold 100px triggers Like/Pass via `onDragEnd` handler

---

## Verified Sources

- `apps/web/` directory listing
- `apps/api/` directory listing
- `specs/` directory listing
- `skills/` directory listing
