# Fragrance Color & Emoji Mapping Coverage

## Summary

We've created comprehensive color and emoji mappings for fragrances to provide a visually rich UI experience.

### Coverage Statistics

- **Accords**: 72/84 mapped (85.7% coverage)
- **Note Colors**: 210/1671 mapped (12.6% coverage)
- **Note Emojis**: 174/1671 mapped (10.4% coverage)

## Design Decisions

### Why Not 100% Coverage?

1. **Long Tail Distribution**: The dataset has 1,671 unique notes, but the top 200 notes account for the vast majority of occurrences
2. **Variations**: Many unmapped notes are spelling variations (e.g., "vetyver" vs "vetiver", "vanila" vs "vanilla")
3. **Rare/Unusual Notes**: Some notes appear only once or twice in the entire dataset
4. **Fallback Strategy**: Unmapped items get a neutral gray color (no emoji), which is acceptable

### Accord Coverage: 85.7%

**Mapped (72 accords)**:
- All major fragrance families: citrus, floral, woody, spicy, oriental, etc.
- Common subcategories: fresh spicy, white floral, yellow floral, etc.
- Gourmand notes: vanilla, caramel, chocolate, coffee, etc.
- Unique accords: leather, tobacco, oud, cannabis, rum, etc.

**Unmapped (12 accords)** - All rare/unusual:
- asphault, brown scotch tape, clay, coca-cola, gasoline
- hot iron, industrial glue, paper, plastic, rubber, vinyl, terpenic

### Note Coverage: ~10-13%

We prioritized the **top ~200 most frequent notes**, which includes:

**Citrus (21 variants)**:
- bergamot, lemon, orange, grapefruit, lime, yuzu, etc.
- Regional variants: calabrian bergamot, amalfi lemon, sicilian lemon

**Florals (43 variants)**:
- rose (5 types), jasmine (4 types), lavender, violet, iris, lily
- Exotic florals: ylang-ylang, tuberose, mimosa, osmanthus, etc.

**Woods (19 variants)**:
- sandalwood, cedar (4 types), patchouli, vetiver, oakmoss
- Modern synthetics: cashmere wood, amberwood

**Spices (17 variants)**:
- pepper (3 types), cardamom, cinnamon, ginger, saffron, etc.

**Gourmands (15 variants)**:
- vanilla (4 types), tonka bean, caramel, honey, chocolate, coffee
- Nuts: almond, hazelnut, praline

**Fruits (28 variants)**:
- Common: apple, pear, peach, plum, cherry, coconut
- Berries: raspberry, strawberry, blackberry, currants
- Tropical: mango, pineapple, passionfruit, litchi

**Herbs/Green (16 variants)**:
- mint, basil, sage, thyme, rosemary, galbanum, artemisia

**Musk/Amber (6 variants)**:
- musk, white musk, amber, white amber, ambergris, ambroxan

**Resinous (10 variants)**:
- benzoin, labdanum, incense, myrrh, opoponax, elemi

## Top 30 Unmapped Notes

Most are variations or very specific regional variants:

1. vetyver (155x) - variation of "vetiver" ✅ already mapped
2. violet leaves (147x) - variation of "violet leaf" ✅ already mapped
3. vanila (140x) - misspelling of "vanilla" ✅ already mapped
4. balsam fir, eucalyptus, hibiscus, cassia, etc.

## Recommendations

### For V1 (Current):
- ✅ Current coverage is sufficient
- ✅ Fallback to gray for unmapped items works well
- ✅ Focuses on the 80/20 rule: covers 80%+ of common use cases

### For V2 (Future Enhancements):
1. Add common variations programmatically (e.g., "vetyver" → "vetiver")
2. Add top 30-50 unmapped notes based on frequency
3. Consider admin UI for custom mappings
4. Migrate to database if mappings become too large

## File Location

[apps/web/lib/fragrance-colors.ts](apps/web/lib/fragrance-colors.ts)

- `ACCORD_COLORS`: 72 mappings
- `NOTE_COLORS`: 210 mappings  
- `NOTE_EMOJIS`: 174 mappings
- Smart fallbacks for unmapped items
