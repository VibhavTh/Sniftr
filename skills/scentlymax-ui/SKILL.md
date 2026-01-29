---
name: scentlymax-ui
description: ScentlyMax luxury editorial UI skill. Use when building or styling frontend components in apps/web, wiring UI to FastAPI in apps/api, or when discussing modal, cards, browse, swipe, recommender, collections, or visual polish.
---

# ScentlyMax UI Skill (Luxury Editorial + No Hallucinations)

## Repo structure (authoritative)
- Frontend (Next.js): `apps/web/`
- Backend (FastAPI): `apps/api/`
- Docs: `docs/` (learning log: `docs/learning-log.md`)
- DB specs / SQL: `specs/`

### Frontend file placement rules (apps/web)
Create files ONLY in these locations unless explicitly instructed otherwise:
- Types: `apps/web/types/*`
- API client + mappers: `apps/web/lib/*`
- Shared UI components: `apps/web/components/*`
- Feature components: `apps/web/components/<feature>/*`
- Routes:
  - Use App Router if `apps/web/app/` exists
  - Otherwise Pages Router if `apps/web/pages/` exists

**Hard constraint:** Never suggest `src/`, `frontend/`, or guessed paths.

---

## Design system (must match provided templates)
Luxury editorial aesthetic:
- Large whitespace, calm hierarchy, minimal UI
- Serif headings + clean sans-serif body
- Neutral palette (black / white / warm grays)
- Thin borders, subtle dividers; avoid heavy shadows
- Reusable card, chip, button, and modal patterns
- Motion limited to subtle transitions (opacity / translate)

### Hard geometry constraint (IMPORTANT)
- NO rounded corners anywhere in the UI.
  - Use `rounded-none` by default on cards, modals, buttons, inputs, images, sections.
  - Do NOT use `rounded`, `rounded-lg`, `rounded-xl`, etc.
- Prefer borders + whitespace over rounded corners or elevated surfaces.

### Tailwind do/don't
DO: `rounded-none`, `border-neutral-200`, `bg-white`, `text-neutral-900`, `tracking-wide`, `uppercase`, `max-w-6xl`, `py-16`
DON'T: `rounded-xl`, `shadow-xl`, bright colors, gradients, glassmorphism, neumorphism, heavy blur

### No design creep rule
Do not gradually introduce visual flair over time.
If a UI element is plain in the template, it must remain plain unless the user explicitly requests a change.
When unsure, choose the simpler, flatter, more editorial option.


### Component styling defaults
- Cards: white background, thin border (`border border-neutral-200/300`), `rounded-none`, minimal shadow (or none)
- Buttons: squared, border or solid black primary, subtle hover (opacity change)
- Chips/tags: squared, small caps feel, muted gray background, no rounding
- Inputs: squared, subtle border, clean focus ring (no glows)

## Visual references
Template screenshots live in: `skills/scentlymax-ui/assets/`
When styling, match these templates:
- boxy cards (no rounding)
- editorial typography
- neutral palette and whitespace-heavy layout


---

## Data contract (frontend)
- Canonical UI ID: `bottle_id` (maps to backend `original_index`)
- API returns normalized arrays:
  - `accords: string[]`
  - `notes_top`, `notes_middle`, `notes_base`
- Collections:
  - `wishlist`
  - `favorites`
  - `personal`

If backend responses differ, do NOT guess — ask one question or create a mapper.

---

## Anti-hallucination rules (absolute)
You must NOT invent:
- API endpoints or parameters
- database fields
- frontend components/hooks not shown or confirmed
- libraries or dependencies

If required info is missing:
- Ask exactly ONE clarifying question, OR
- Present Option A / Option B and proceed with the safest assumption, clearly labeled.

---

## Output mode (INSTRUCTOR MODE)
Every response must start with:
1. **Goal** (1–2 sentences)
2. **Task checklist** (3–7 bullets)
3. **Risks / gotchas** (2–4 bullets)

### Code rules
- Provide only small starter code (structure + styling).
- Do NOT write full implementations unless explicitly asked.
- Before each code block, explain:
  - where the file lives
  - what it connects to
  - which backend endpoint it uses (if any)

Starter code means:
- Component skeletons
- JSX structure
- Tailwind classes
- Prop interfaces
NOT:
- Full hooks
- Data fetching logic
- State machines
- Business logic

---

## Architecture expectations
- Universal Fragrance Detail Modal opens from any page
- All fragrance cards reuse the same Card + Modal system
- Collections, Swipe, Browse, Recommender share components
- Favor reuse over duplication

---

## Phase reflection
When a component or phase is complete:
1) Reflect with the user (what worked, what didn’t, lessons).
2) Append a dated entry to `docs/learning-log.md`:
   - Summary
   - Decisions
   - Pitfalls
   - What I learned
   - Next steps
