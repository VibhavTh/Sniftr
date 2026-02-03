# UI Style Guide — Visual Law

> Last updated: 2026-01-30

## Design Philosophy

**Luxury editorial aesthetic** — think high-end fashion magazine meets minimalist product catalog. Calm, sophisticated, and deliberately restrained.

### Core Principles
- Large whitespace, calm hierarchy
- Serif headings + clean sans-serif body
- Neutral palette (black, white, warm grays)
- Thin borders, subtle dividers
- Minimal shadows (or none)
- Motion limited to subtle transitions (opacity, translate)

---

## ABSOLUTE RULE: No Rounded Corners

```
DO NOT USE: rounded, rounded-sm, rounded-md, rounded-lg, rounded-xl, rounded-2xl, rounded-full

ALWAYS USE: rounded-none (or omit rounded entirely)
```

This applies to:
- Cards
- Modals
- Buttons
- Inputs
- Images
- Badges/chips
- Sections
- Everything

**Why?** The boxy aesthetic is intentional. Rounded corners feel casual; sharp corners feel editorial and premium.

---

## Typography

### Fonts (defined in `apps/web/app/layout.tsx`)

| Purpose | Font | Variable |
|---------|------|----------|
| Headings (serif) | Cormorant | `--font-serif` |
| Body (sans-serif) | Inter | `--font-sans` |

### Usage Patterns

```css
/* Page titles */
font-serif text-[42px] font-light text-neutral-900 leading-tight

/* Section headings */
font-serif text-[28px] font-light text-neutral-900

/* Card titles */
font-serif text-xl leading-tight text-gray-900

/* Body text */
text-[15px] font-light text-neutral-500

/* Labels/caps */
text-[11px] font-normal text-neutral-500 uppercase tracking-widest

/* Navigation */
text-[15px] font-light text-neutral-900
```

---

## Color Palette

### Primary Colors
| Use | Class |
|-----|-------|
| Background | `bg-stone-50` or `bg-white` |
| Text primary | `text-neutral-900` |
| Text secondary | `text-neutral-500` |
| Text muted | `text-neutral-400` |
| Borders | `border-neutral-200` or `border-neutral-300` |
| Buttons (primary) | `bg-neutral-900 text-white` |
| Buttons (secondary) | `border border-neutral-300 text-neutral-900` |

### Gender Badge Colors
```css
/* Women */
bg-pink-100 text-pink-700

/* Men */
bg-blue-100 text-blue-700

/* Unisex */
bg-purple-100 text-purple-700
```

### Accord/Note Chips
Use mappings from `lib/fragrance-colors.ts`. Example:
```css
/* Woody */
bg-amber-100 text-amber-800

/* Floral */
bg-pink-100 text-pink-800

/* Fresh/Citrus */
bg-yellow-100 text-yellow-800

/* Fallback */
bg-gray-100 text-gray-700
```

---

## Layout Patterns

### Page Container
```css
max-w-[1400px] mx-auto px-8 lg:px-14
```

### Navigation Bar
```css
bg-white border-b border-neutral-200
h-[72px] /* fixed height */
```

### Content Sections
```css
py-20 /* vertical padding */
mb-14 /* header margin bottom */
```

### Grids
```css
/* Browse page */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16

/* Collection page */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20
```

---

## Component Patterns

### Cards (`FragranceCard.tsx`)
```css
/* Container */
group w-full text-left transition-all duration-300 hover:scale-[1.02]

/* Image container */
relative aspect-square w-full overflow-hidden bg-gray-100 mb-4

/* Content spacing */
space-y-2
```

### Modal (`FragranceDetailModal.tsx`)
```css
/* Backdrop */
fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4

/* Modal container */
relative w-full max-w-2xl overflow-hidden bg-white shadow-2xl

/* Scrollable content */
max-h-[90vh] overflow-y-auto
```

### Buttons
```css
/* Primary (filled) */
px-10 py-3.5 bg-neutral-900 text-white text-[13px] font-light tracking-wide uppercase hover:bg-neutral-800 transition-colors

/* Secondary (outline) */
px-6 py-3.5 border border-neutral-300 text-[15px] font-light text-neutral-900 hover:bg-neutral-50 transition-colors
```

### Inputs
```css
w-full pl-12 pr-4 py-3.5 border border-neutral-300 text-[15px] font-light text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors
```

### Chips/Tags
```css
px-2.5 py-1 text-xs capitalize
/* + color from getAccordColor() */
```

### Empty States
```css
/* Container */
bg-white border border-neutral-200 p-16 text-center

/* Icon circle */
w-20 h-20 bg-neutral-100 mx-auto mb-8 flex items-center justify-center
/* Note: icon circle is one exception where rounded-full is acceptable for visual balance */
```

---

## Tailwind Do's and Don'ts

### DO
```css
rounded-none
border-neutral-200
bg-white
bg-stone-50
text-neutral-900
tracking-wide
uppercase
max-w-6xl
py-16
font-light
transition-colors
```

### DON'T
```css
rounded-xl
rounded-lg
shadow-xl
/* bright colors */
/* gradients */
/* glassmorphism */
/* neumorphism */
/* heavy blur */
```

---

## Visual References

Template screenshots in `skills/scentlymax-ui/assets/`:
- `homepage_template.png`
- `homepage_template_2.png`
- `explore_template.png`
- `profile_template.png`

When styling, match these templates:
- Boxy cards (no rounding)
- Editorial typography
- Neutral palette
- Whitespace-heavy layout

---

## Verified Sources

- `skills/scentlymax-ui/SKILL.md:1-140`
- `apps/web/app/layout.tsx:1-38`
- `apps/web/components/FragranceCard.tsx:1-77`
- `apps/web/components/FragranceDetailModal.tsx:1-257`
- `apps/web/app/browse/page.tsx:1-243`
- `apps/web/lib/fragrance-colors.ts:1-568`
