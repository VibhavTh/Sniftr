# Workflow — How We Work

> Last updated: 2026-02-05 (session 6 — Framer Motion swipe animations)

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
2. Register in `apps/api/main.py` if new router
3. Use `normalize_bottle()` for bottle responses
4. Add `Depends(get_current_user)` if auth required
5. Update `docs/agent/API_CONTRACT.md`

### Fixing a Type Mismatch

1. Check backend normalizer for ground truth
2. Update `apps/web/types/fragrance.ts` to match
3. Fix any TypeScript errors in components
4. Verify in browser

### Working with the Swipe/Finder Page

The Finder uses a **useReducer-based state machine** (v3 — one-life candidate cycle):

**State Model (managed by `finderReducer`):**
- `currentBottle` — The single bottle displayed to the user
- `mode` — `"random"` or `"candidates"` (current cycle type)
- `candidateQueue` — ML-similar bottles to show next (filled after LIKE)
- `passLifeUsed` — Whether the "one life" has been consumed in the current candidate cycle
- `lastLikedId` — Bottle ID used as seed for candidate refetch (session-scoped)
- `loadingInitial` — True only during mount fetch (full-page skeleton)
- `actionBusy` — True during LIKE/PASS async (buttons disabled, card stays visible)

**Flow:**

1. **Mount** — Fetch 1 random bottle (`GET /bottles/random?limit=1`), set mode="random"
2. **On LIKE** — Fetch candidates (`GET /swipe/candidates?seed_bottle_id=X`), replace queue, set mode="candidates", reset passLifeUsed=false
3. **On PASS in candidates, life unused** — Pop next from queue (use life), set passLifeUsed=true
4. **On PASS in candidates, life used** — BREAK cycle: mode="random", fetch new random bottle
5. **On PASS in random** — Fetch new random bottle
6. **Auth handling** — `POST /swipes` and `POST /collections` fire-and-forget when authenticated

**Reducer Actions:**
- `INIT_DONE` — Mount complete
- `LIKED` — Enter/continue candidate cycle
- `PASS_USE_LIFE` — Consume life, advance in queue
- `PASS_BREAK` — Break cycle, return to random
- `PASS_RANDOM` — New random in random mode

**Key Differences from v2:**
- v2: `useState` with stale closure risk → v3: `useReducer` for atomic state transitions
- v2: Full-page loading on every action → v3: `actionBusy` disables buttons without hiding card
- v2: "One try" per session → v3: "One life" per candidate cycle (resets on each LIKE)

```typescript
// State model (useReducer):
const [state, dispatch] = useReducer(finderReducer, INITIAL_STATE)

// LIKE → dispatch LIKED with candidates
// PASS in candidates, !passLifeUsed → dispatch PASS_USE_LIFE
// PASS in candidates, passLifeUsed → dispatch PASS_BREAK
// PASS in random → dispatch PASS_RANDOM
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
