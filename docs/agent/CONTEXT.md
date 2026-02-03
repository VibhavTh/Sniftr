# ScentlyMax Context — Truth Now

> Last updated: 2026-01-30

## What is ScentlyMax?

A luxury fragrance discovery web app with a Tinder-style swipe interface, ML-powered recommendations, and user collections. Users browse ~24K fragrances, swipe to discover preferences, and build personal collections.

## Current Project Phase

**Phase: Frontend Wiring**
- Backend API fully implemented and functional
- Browse page wired to real API with search + pagination
- Finder and Collection pages still use mock data (need API wiring)
- Global modal system implemented via `FragranceModalProvider`

## Repo Structure

```
ScentlyMax/
├── apps/
│   ├── web/          # Next.js 15 frontend (App Router)
│   └── api/          # FastAPI backend
├── docs/             # Documentation and learning log
├── specs/            # Database schemas and API contracts
└── skills/           # Agent skills (scentlymax-ui)
```

## Implemented Features

### Backend (apps/api/)
- Health check endpoints (public + authenticated)
- Paginated bottle browse with search (`GET /bottles`)
- Single bottle detail (`GET /bottles/{id}`)
- Random bottles for swipe seeding (`GET /bottles/random`)
- ML recommendations (text query OR bottle similarity)
- Swipe candidates (similar bottles for swipe queue)
- Swipe logging (`POST /swipes`)
- Collections CRUD (wishlist, favorites, personal)
- JWT authentication via Supabase JWKS

### Frontend (apps/web/)
- App Router structure with pages: `/`, `/login`, `/signup`, `/browse`, `/finder`, `/collection`
- Global `FragranceModalProvider` in root layout
- `FragranceCard` component (reusable card)
- `FragranceDetailModal` component (universal modal)
- Supabase auth client (`lib/supabase.ts`)
- Authenticated API wrapper (`lib/api.ts`)
- Accord/note color mappings (`lib/fragrance-colors.ts`)
- TypeScript types (`types/fragrance.ts`)

### ML System
- TF-IDF vectorizer over accords + notes
- Cosine similarity for bottle-to-bottle recommendations
- Hybrid scoring: TF-IDF + popularity (rating_count)
- Artifacts loaded at startup (singleton pattern)

## Known Issues / Active Bugs

1. **Invalid image_url crash** — Some database rows contain invalid `image_url` values (empty strings, "NOT_FOUND", malformed URLs). Backend normalizer now sanitizes these to `null`. Frontend uses `unoptimized` prop on Next.js Image.

2. **Finder page uses mock data** — Not wired to `/bottles/random` or `/swipe/candidates` yet.

3. **Collection page uses mock data** — Not wired to `/collections` endpoints yet.

4. **Modal onLike/onPass are TODO** — Currently just `console.log` in `FragranceModalContext.tsx`.

## Non-Negotiable Rules

### Canonical IDs
- **Frontend uses `bottle_id`** (number)
- **Backend uses `original_index`** (integer, not UUID)
- These are the same value — the ML model's row index
- Never use the Supabase UUID `id` for API calls

### No Hallucination
- Do NOT invent endpoints, params, fields, or components
- If unsure, read the actual code file first
- If still unsure, ask ONE clarifying question

### Design Constraint
- **NO rounded corners anywhere** — use `rounded-none`
- Luxury editorial aesthetic (serif headings, minimal UI, thin borders)

---

## Verified Sources

- `apps/api/main.py` — router registration, lifespan
- `apps/api/routers/*.py` — all endpoint definitions
- `apps/api/utils/bottle_normalizer.py` — API response shape
- `apps/web/app/layout.tsx` — modal provider, fonts
- `apps/web/components/*.tsx` — card and modal components
- `apps/web/types/fragrance.ts` — canonical frontend type
- `skills/scentlymax-ui/SKILL.md` — design constraints


