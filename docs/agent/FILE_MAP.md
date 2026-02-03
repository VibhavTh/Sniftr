# File Map — Where Things Live

> Last updated: 2026-02-01 (session 3)

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
| `/` | `app/page.tsx` | Landing page |
| `/login` | `app/login/page.tsx` | Auth |
| `/signup` | `app/signup/page.tsx` | Auth |
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
| `tailwind.config.ts` | Tailwind configuration |

### Components

| File | Purpose |
|------|---------|
| `components/FragranceCard.tsx` | Reusable bottle card for grids |
| `components/FragranceDetailModal.tsx` | Universal detail modal (full view) |

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

### Entry Point

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app, CORS, router registration, lifespan |

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
| `core/config.py` | Settings (Supabase URL, keys) |
| `core/__init__.py` | Package init |

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

### "I need to change how bottles are returned from API"
→ `apps/api/utils/bottle_normalizer.py`

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
→ Uses `/bottles/random` for cold start, `/swipe/candidates?seed_bottle_id=X` for personalized queue
→ Logs swipes to `POST /swipes`, auto-favorites on Like via `POST /collections`
→ localStorage key: `scentlymax_lastLikedBottleId`

---

## Verified Sources

- `apps/web/` directory listing
- `apps/api/` directory listing
- `specs/` directory listing
- `skills/` directory listing
