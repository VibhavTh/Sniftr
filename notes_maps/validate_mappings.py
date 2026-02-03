#!/usr/bin/env python3
"""
Validate mapping coverage by parsing the TypeScript file
"""
import csv
import re

# Parse TypeScript mappings
def parse_ts_mappings(file_path, const_name):
    """Extract keys from a TypeScript Record<string, string> constant"""
    with open(file_path, 'r') as f:
        content = f.read()

    # Find the constant definition
    pattern = f"export const {const_name}.*?= {{(.*?)\n}}"
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        return set()

    # Extract all keys (quoted strings before colons)
    keys = re.findall(r"'([^']+)':", match.group(1))
    return set(keys)

# Parse mappings from TypeScript file
ts_file = 'apps/web/lib/fragrance-colors.ts'
MAPPED_ACCORDS = parse_ts_mappings(ts_file, 'ACCORD_COLORS')
MAPPED_NOTE_COLORS = parse_ts_mappings(ts_file, 'NOTE_COLORS')
MAPPED_NOTE_EMOJIS = parse_ts_mappings(ts_file, 'NOTE_EMOJIS')

# Read dataset
dataset_path = 'apps/api/intelligence/perfume_dataset_v1.csv'
accords_in_data = set()
notes_in_data = set()

with open(dataset_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Collect accords
        for i in range(1, 6):
            accord = row.get(f'mainaccord{i}', '').strip()
            if accord:
                accords_in_data.add(accord.lower())

        # Collect notes
        for note_type in ['Top', 'Middle', 'Base']:
            notes_str = row.get(note_type, '').strip()
            if notes_str:
                for note in notes_str.split(','):
                    note = note.strip()
                    if note:
                        notes_in_data.add(note.lower())

# Calculate coverage
unmapped_accords = sorted(accords_in_data - MAPPED_ACCORDS)
unmapped_notes = sorted(notes_in_data - MAPPED_NOTE_COLORS)
notes_without_emoji = sorted(notes_in_data - MAPPED_NOTE_EMOJIS)

# Statistics
print(f"{'='*60}")
print(f"MAPPING COVERAGE REPORT")
print(f"{'='*60}\n")

print(f"📊 ACCORD COVERAGE")
print(f"  Total unique accords in dataset: {len(accords_in_data)}")
print(f"  Mapped accords: {len(MAPPED_ACCORDS)}")
print(f"  Unmapped accords: {len(unmapped_accords)}")
print(f"  Coverage: {len(accords_in_data & MAPPED_ACCORDS) / len(accords_in_data) * 100:.1f}%")
print()

print(f"🎨 NOTE COLOR COVERAGE")
print(f"  Total unique notes in dataset: {len(notes_in_data)}")
print(f"  Notes with colors: {len(MAPPED_NOTE_COLORS)}")
print(f"  Unmapped notes (no color): {len(unmapped_notes)}")
print(f"  Coverage: {len(notes_in_data & MAPPED_NOTE_COLORS) / len(notes_in_data) * 100:.1f}%")
print()

print(f"😀 NOTE EMOJI COVERAGE")
print(f"  Total unique notes in dataset: {len(notes_in_data)}")
print(f"  Notes with emojis: {len(MAPPED_NOTE_EMOJIS)}")
print(f"  Notes without emoji: {len(notes_without_emoji)}")
print(f"  Coverage: {len(notes_in_data & MAPPED_NOTE_EMOJIS) / len(notes_in_data) * 100:.1f}%")
print()

# Show unmapped accords (all of them since there aren't many)
if unmapped_accords:
    print(f"{'='*60}")
    print(f"⚠️  UNMAPPED ACCORDS ({len(unmapped_accords)})")
    print(f"{'='*60}")
    for accord in unmapped_accords:
        print(f"  • {accord}")
    print()

# Show top 30 most common unmapped notes
if unmapped_notes:
    # Count frequencies for unmapped notes
    from collections import Counter
    note_freq = Counter()

    with open(dataset_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            for note_type in ['Top', 'Middle', 'Base']:
                notes_str = row.get(note_type, '').strip()
                if notes_str:
                    for note in notes_str.split(','):
                        note = note.strip().lower()
                        if note in unmapped_notes:
                            note_freq[note] += 1

    print(f"{'='*60}")
    print(f"⚠️  TOP 30 MOST COMMON UNMAPPED NOTES")
    print(f"{'='*60}")
    for note, count in note_freq.most_common(30):
        print(f"  {count:4d}x  {note}")
    print()

print(f"✅ All accords: {len(MAPPED_ACCORDS)} mapped")
print(f"✅ Top notes: {len([n for n in MAPPED_NOTE_COLORS if n in notes_in_data])} / {len(notes_in_data)} have colors")
print(f"✅ Top notes: {len([n for n in MAPPED_NOTE_EMOJIS if n in notes_in_data])} / {len(notes_in_data)} have emojis")
