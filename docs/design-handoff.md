# Design Handoff – ScentlyMax

## Design Source
The UI design is defined in Figma (Figma Make output).
Claude Code should treat this design as the source of truth.

## Brand & Style
- Editorial / luxury fragrance catalog
- Calm, whitespace-heavy layout
- No gradients, no bright colors, no heavy shadows
- Not a generic SaaS look

## Typography (Locked)

The UI must use the following fonts exclusively:

- **Headings / display text:** Cormorant
- **Body text / UI text:** Inter

Fonts must be loaded via Google Fonts using:

@import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

### Usage rules
- Use Cormorant for page titles, section headers, and fragrance names where appropriate.
- Use Inter for body copy, buttons, form labels, and UI controls.
- Maintain clear hierarchy through font size and weight, not color.
- Do not introduce any other fonts.

## Color Palette
- Background: off-white / warm neutral
- Text: near-black
- Accent: muted, used sparingly for primary actions

## Core Screens
1. Explore fragrances (grid/list with search + filters)
2. Finder (single centered card with Yes/No actions)
3. Collection (empty state + populated list)
4. Auth (simple centered form)

## Components
- FragranceCard
- NoteTag / AccordTag
- Primary / Secondary buttons
- Navbar with Finder / Explore / Collection

## Constraints
- The Figma designs + screenshots are the visual source of truth.
- The Design Protocol defines style rules and constraints.
- The UI skill must not invent layouts, colors, or components not present in the design.
- No generic SaaS patterns, no shadcn defaults, no Tailwind boilerplate look.


## 3 screenshots from Figma

## Note Tags (Important Visual Rule)

When displaying fragrance notes or main accords as visual tags (chips) beneath a fragrance:

- Each note/accord must be color-coded based on a predefined semantic color system.
- Colors should be muted, elegant, and consistent with the overall luxury/editorial theme.
- Do NOT use random colors or default gray tags.

### Example Note Color Mapping (guideline)
- Woody → warm brown / taupe
- Amber → muted gold / amber
- Spicy → deep rust / muted red
- Floral → soft rose / blush
- Citrus → pale yellow / soft orange
- Fresh → cool sage / soft green
- Powdery → light lavender / gray-lilac
- Aquatic → muted blue / slate

### Rules
- Use the same color for the same note type everywhere in the app.
- Text color must remain readable (sufficient contrast).
- If a note type is unknown, fall back to a neutral tag style.
- When rendering note or accord tags, apply a consistent semantic color system per note type (e.g., woody, floral, amber), matching the design-handoff rules. Do not use default or random tag colors.

### Role separation
- Human (me): all logic (forms, redirects, state, API calls, auth guards)
- UI skill: styling, layout, visual components only

### Quality bar
The resulting UI should be indistinguishable from a hand-built, designer-led
startup MVP and must not resemble common “vibe-coded” applications.
