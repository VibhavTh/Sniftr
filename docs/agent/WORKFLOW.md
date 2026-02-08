# Workflow — How We Work

> Last updated: 2026-02-07 (session 9 — Auth Pages Redesign + Branding)

## Session Startup Protocol

Every new agent session should begin with:

### 1. Read Context Docs First
```
docs/agent/CONTEXT.md    → Current state, issues, rules
docs/agent/API_CONTRACT.md → Backend endpoints and shapes
docs/agent/UI_STYLE.md   → Visual constraints
docs/agent/FILE_MAP.md   → Where files live
```

### 2. Verify Router Type
The frontend uses **App Router** (Next.js 15):
- Pages live in `apps/web/app/<route>/page.tsx`
- NOT in `apps/web/pages/`
- Use `'use client'` directive for interactive components

### 3. Check for Active Issues
Look at `docs/agent/CONTEXT.md` "Known Issues" section before starting work.

---

## Core Rules

### Do Not Invent

**Never hallucinate:**
- API endpoints that don't exist
- Query params that aren't implemented
- Response fields not in the normalizer
- Components or hooks not in the codebase
- Libraries not in package.json

**If unsure:**
1. Read the actual source file
2. If still unsure, ask ONE clarifying question
3. Present options clearly: "Option A does X, Option B does Y"

### Backend is Truth

The API contract is defined by the actual router code, not by what "should" exist:
- Check `apps/api/routers/*.py` for exact endpoint signatures
- Check `apps/api/utils/bottle_normalizer.py` for response shape
- If frontend type doesn't match backend, fix the type (or ask)

### No Design Creep

The visual style is fixed:
- **No rounded corners** — ever
- No gradients, no glassmorphism, no shadows unless explicitly requested
- If a UI element is plain in the templates, keep it plain
- When unsure, choose the simpler, flatter option

### Display Text Formatting

User-facing strings from the backend may contain hyphens (e.g., `"fresh-spicy"`, `"dolce-gabbana"`):
- **Always use `formatDisplayText()`** for: name, brand, gender, accords, notes
- Import from `@/lib/fragrance-colors`
- Converts hyphens to spaces: `"light-blue"` → `"light blue"`
- Apply at render time only — never mutate backend data

### Color Rules

- **Accords**: Use `getAccordColor(accord)` — colored chips
- **Notes**: Neutral styling only (`bg-white border border-neutral-200 text-neutral-700`)
- **Gender**: Inline color logic (pink/purple/blue based on value)

### Tailwind Purge Gotcha

Dynamic class strings in `lib/fragrance-colors.ts` (like `ACCORD_COLORS`) are only preserved if Tailwind scans that directory. The `tailwind.config.ts` content array MUST include `"./lib/**/*.{js,ts}"`. Without this, accord colors render as gray fallbacks because Tailwind purges the unused classes at build time.

### Navigation Structure

All pages use a consistent 4-tab navigation: `Home | Finder | Explore | Collection`
- **Home** → `/` (homepage)
- **Finder** → `/finder` (swipe discovery)
- **Explore** → `/browse` (search/browse grid)
- **Collection** → `/collection` (user profile dashboard)

The active tab is underlined. Navigation is currently duplicated in each page (no shared component).

**Brand name**: "SNIFTR" (uppercase with `tracking-[0.3em]`)
**Profile icon**: Links to `/signin` on all pages

### Auth Pages

Auth pages (`/signin`, `/signup`, `/forgot-password`) use `AuthSplitLayout`:
- **Left panel**: Form content (stone-50 background)
- **Right panel**: Hero with two-tone gradient (hidden on mobile)

**Key behaviors:**
- Users are NOT auto-redirected when already signed in
- "Currently signed in as X" banner shown with "Go to Home" and "Sign Out" options
- Signing in with same email shows "already signed in" error
- Signing up with existing email shows friendly error message
- `/login` redirects to `/signin` for backwards compatibility

---

## Change Discipline

### Before Making Changes

1. **Read before editing** — Always read the file you're about to modify
2. **Understand the context** — Check how the component is used elsewhere
3. **Check for dependencies** — Will this break other pages/components?

### Making Changes

1. **Plan first** — State what you're about to do
2. **Minimal implementation** — Only change what's needed
3. **Verify after** — Test or ask user to test

### After Changes

1. **Summarize** — What was changed and why
2. **Note issues** — Any gotchas or follow-up needed
3. **Update docs** — If a pattern changes, update these docs

---

## Phase Reflection Protocol

After completing a significant feature or phase:

### 1. Reflect with User
- What worked well?
- What was harder than expected?
- What would we do differently?

### 2. Append to Learning Log
Add a dated entry to `docs/learning-log.md`:

```markdown
---

# YYYY-MM-DD — [Phase Name]

## Summary
[1-2 sentences describing what was done]

## Decisions
- [Key decision 1 and rationale]
- [Key decision 2 and rationale]

## Pitfalls
- [Problem encountered and how it was solved]

## What I Learned
- [Insight that will help future development]

## Files Changed
- `path/to/file.ts` — [brief description]

## Next Steps
1. [Next action item]
```

---

## Common Workflows

### Adding a New Page

1. Create `apps/web/app/<route>/page.tsx`
2. Add `'use client'` if interactive
3. Use `useFragranceModal()` if it needs modal
4. Follow layout pattern from existing pages (nav, main, container widths)
5. Use `apiGet`/`apiPost` for API calls
6. **Copy nav from existing page** — Use consistent 4-tab structure: `Home | Finder | Explore | Collection`

### Wiring a Page to API

1. Check endpoint exists in `docs/agent/API_CONTRACT.md`
2. Import `apiGet` from `@/lib/api`
3. Define response interface matching API shape
4. Add loading/error states
5. Use `Fragrance` type from `@/types/fragrance`

### Adding a New API Endpoint

1. Create or modify router in `apps/api/routers/`
2. Import `from db import db` for database access
3. Use asyncpg query syntax (`$1, $2` params, `ANY($1::int[])` for arrays)
4. Use `normalize_bottle()` for bottle responses
5. Add `Depends(get_current_user)` if auth required
6. Register in `apps/api/main.py` if new router
7. Update `docs/agent/API_CONTRACT.md`

### Fixing a Type Mismatch

1. Check backend normalizer for ground truth
2. Update `apps/web/types/fragrance.ts` to match
3. Fix any TypeScript errors in components
4. Verify in browser

### Working with the Swipe/Finder Page

The Finder uses a **useReducer-based state machine** (v4 — seenIds dedupe + queue refill):

**State Model (managed by `finderReducer`):**
- `currentBottle` — The single bottle displayed to the user
- `mode` — `"random"` or `"candidates"` (current cycle type)
- `candidateQueue` — ML-similar bottles to show next (filled after LIKE)
- `passLifeUsed` — Whether the "one life" has been consumed in the current candidate cycle
- `lastLikedId` — Bottle ID used as seed for candidate refetch (session-scoped)
- `seenIds` — `Record<number, true>` tracking all shown bottle_ids for deduplication
- `loadingInitial` — True only during mount fetch (full-page skeleton)
- `actionBusy` — True during LIKE/PASS async (buttons disabled, card stays visible)

**Flow:**

1. **Mount** — Fetch 1 random bottle, add to seenIds, set mode="random"
2. **On LIKE** — Fetch candidates, DEDUPE against seenIds, consume first, set mode="candidates"
3. **On PASS in candidates, life unused** — Consume from queue (use life), set passLifeUsed=true
4. **On PASS in candidates, life used** — BREAK cycle: mode="random", fetch new random
5. **On PASS in random** — Fetch new random bottle
6. **Queue Refill** — When queue < 10 in candidates mode, auto-fetch more from lastLikedId

**Reducer Actions:**
- `INIT_DONE` — Mount complete, add bottle to seenIds
- `LIKED` — Enter/continue candidate cycle, add next bottle to seenIds
- `PASS_CONSUME` — Consume from queue, add next bottle to seenIds
- `PASS_BREAK` — Break cycle, return to random
- `PASS_RANDOM` — New random in random mode
- `REFILL_QUEUE` — Append deduped candidates to queue (cap at 80)

**Key v4 Changes (fix for "5 bottles repeating" bug):**
- Added `seenIds` to prevent showing duplicates within session
- Every shown bottle is added to seenIds via reducer
- Candidates are filtered via `dedupeBottles(candidates, seenIds, seedId)` before use
- Queue refill effect triggers when queue < 10, fetches more from lastLikedId

```typescript
// State model (useReducer):
const [state, dispatch] = useReducer(finderReducer, INITIAL_STATE)

// LIKE → dedupe candidates → dispatch LIKED
// PASS in candidates, !passLifeUsed → dispatch PASS_CONSUME
// PASS in candidates, passLifeUsed → dispatch PASS_BREAK
// PASS in random → dispatch PASS_RANDOM
// Queue low → dispatch REFILL_QUEUE
```

**Swipe Animations (Framer Motion):**

The Finder uses Framer Motion for Tinder-style swipe animations:

```typescript
import { motion, AnimatePresence, PanInfo } from 'framer-motion'

// Animation variants
const cardVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0, x: 0, rotate: 0 },
  exitLeft: { opacity: 0, x: -300, rotate: -15 },   // Pass
  exitRight: { opacity: 0, x: 300, rotate: 15 },    // Like
}

// Wrap card in AnimatePresence + motion.div
<AnimatePresence mode="wait" initial={false}>
  <motion.div
    key={bottle.bottle_id}
    variants={cardVariants}
    initial="enter" animate="center"
    exit={swipeDirection === 'right' ? 'exitRight' : 'exitLeft'}
    drag="x"
    onDragEnd={handleDragEnd}
  >
```

**Key animation patterns:**
- Set `swipeDirection` state BEFORE dispatch (so AnimatePresence knows which exit variant to use)
- Use `key={bottle_id}` to force remount on bottle change
- Drag threshold: 100px horizontal offset triggers Like/Pass
- Buttons placed OUTSIDE AnimatePresence to prevent them animating with card
- `onAnimationComplete={() => setSwipeDirection(null)}` resets direction after exit

---

## Database Architecture (RDS + asyncpg)

### Hybrid Setup
- **Data storage**: PostgreSQL (local dev or AWS RDS)
- **Authentication**: Supabase Auth (JWKS-based JWT verification)
- **Connection**: asyncpg pool initialized in `main.py` lifespan

### Database Configuration

Environment variables in `.env`:
```bash
# PostgreSQL connection (local or RDS)
DATABASE_URL=postgresql://user:password@host:port/dbname

# Supabase Auth (for JWT verification only)
SUPABASE_URL=https://xxx.supabase.co
```

### Query Patterns

All routers use the `db` singleton from `apps/api/db.py`:

```python
from db import db

# Fetch multiple rows
rows = await db.fetch_all("SELECT * FROM bottles WHERE brand = $1", brand_name)

# Fetch single row
row = await db.fetch_one("SELECT * FROM bottles WHERE original_index = $1", bottle_id)

# Fetch single value
count = await db.fetch_val("SELECT COUNT(*) FROM bottles")

# Execute (INSERT/UPDATE/DELETE)
await db.execute("INSERT INTO swipes (user_id, bottle_id, action) VALUES ($1, $2, $3)", user_id, bottle_id, action)
```

### Key Patterns

| Pattern | Example |
|---------|---------|
| IN clause with array | `WHERE id = ANY($1::int[])` |
| Idempotent upsert | `ON CONFLICT (user_id, bottle_id, type) DO NOTHING` |
| Random selection | `ORDER BY random() LIMIT $1` |
| Parameterized queries | `$1, $2, $3` (NOT `%s` or `?`) |

### Local Development Setup

```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE scently;"

# 2. Apply schema
psql -U postgres -d scently -f apps/api/schema.sql

# 3. Export from Supabase (if migrating)
cd apps/api && python export_from_supabase.py

# 4. Import to local
export DATABASE_URL="postgresql://postgres:password@localhost:5433/scently"
python import_to_postgres.py

# 5. Start API
uvicorn main:app --reload
```

---

## Testing Checklist

Before considering a feature complete:

- [ ] No TypeScript errors
- [ ] Page loads without crashes
- [ ] API calls work (check Network tab)
- [ ] Modal opens correctly (if applicable)
- [ ] No rounded corners (inspect elements)
- [ ] No hyphens in displayed text (name, brand, accords, notes)
- [ ] Notes are neutral-styled (no colors, only accords have color)
- [ ] Responsive on mobile (check viewport)
- [ ] Error states handled
- [ ] Search doesn't flash loading state while typing
- [ ] Collection toggles work (heart fills/unfills)
- [ ] Swipe actions log correctly (check Network tab for POST /swipes)
- [ ] Liked bottles appear in Favorites collection

---

## Communication Style

### With User
- Be direct and concise
- State what you're doing before doing it
- Report results after completion
- Ask ONE question at a time if clarification needed

### In Code
- JSDoc comments for non-obvious functions
- Purpose block at top of files (see router examples)
- No unnecessary comments for self-explanatory code

---

## Verified Sources

- `skills/scentlymax-ui/SKILL.md` — Original skill rules
- `docs/learning-log.md` — Previous development patterns
- All `apps/api/routers/*.py` — Docstring conventions
