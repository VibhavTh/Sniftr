#!/usr/bin/env python3
"""
Analyze dataset to find unmapped accords and notes
"""
import csv
from collections import defaultdict

# Read dataset
dataset_path = 'apps/api/intelligence/perfume_dataset_v1.csv'

# Collect all unique accords and notes
accords = set()
notes = set()

with open(dataset_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Collect accords (mainaccord1-5)
        for i in range(1, 6):
            accord = row.get(f'mainaccord{i}', '').strip()
            if accord:
                accords.add(accord.lower())

        # Collect notes (Top, Middle, Base)
        for note_type in ['Top', 'Middle', 'Base']:
            notes_str = row.get(note_type, '').strip()
            if notes_str:
                # Split by comma
                for note in notes_str.split(','):
                    note = note.strip()
                    if note:
                        notes.add(note.lower())

# Current mappings from fragrance-colors.ts
MAPPED_ACCORDS = {
    'citrus', 'fresh', 'green', 'aquatic',
    'floral', 'white floral', 'rose',
    'woody', 'aromatic', 'earthy',
    'warm spicy', 'spicy',
    'sweet', 'fruity', 'vanilla', 'gourmand',
    'oriental', 'animalic', 'leather',
    'powdery', 'musky', 'smoky'
}

MAPPED_NOTES = {
    # Citrus
    'bergamot', 'lemon', 'orange', 'grapefruit', 'mandarin',
    # Floral
    'rose', 'jasmine', 'lavender', 'violet', 'ylang-ylang', 'iris',
    # Woody
    'sandalwood', 'cedarwood', 'cedar', 'patchouli', 'vetiver', 'oakmoss', 'oak moss',
    # Spices
    'pepper', 'pink pepper', 'black pepper', 'cardamom', 'cinnamon', 'ginger',
    # Sweet/Gourmand
    'vanilla', 'tonka bean', 'caramel', 'honey', 'chocolate', 'cacao',
    # Musk/Amber
    'musk', 'white musk', 'amber', 'ambergris', 'ambroxan',
    # Leather/Animal
    'leather', 'oud', 'birch',
    # Fruity
    'apple', 'pear', 'pineapple', 'peach', 'plum', 'black currant'
}

MAPPED_EMOJIS = {
    # Citrus
    'bergamot', 'lemon', 'lime', 'orange', 'mandarin', 'mandarin orange', 'grapefruit', 'calabrian bergamot',
    # Fruits
    'apple', 'pear', 'pineapple', 'peach', 'plum', 'black currant', 'blackcurrant', 'raspberry', 'strawberry', 'cherry', 'coconut',
    # Flowers
    'rose', 'turkish rose', 'jasmine', 'moroccan jasmine', 'lavender', 'violet', 'ylang-ylang', 'iris', 'lily', 'orange blossom', 'mimosa', 'geranium',
    # Spices
    'pepper', 'pink pepper', 'black pepper', 'sichuan pepper', 'cardamom', 'cinnamon', 'ginger', 'nutmeg', 'clove',
    # Woods
    'sandalwood', 'cedarwood', 'cedar', 'patchouli', 'vetiver', 'oakmoss', 'oak moss', 'birch', 'pine',
    # Sweet/Gourmand
    'vanilla', 'tonka bean', 'caramel', 'honey', 'chocolate', 'cacao', 'coffee', 'almond',
    # Musk/Amber
    'musk', 'white musk', 'amber', 'ambergris', 'ambroxan',
    # Herbs/Green
    'mint', 'basil', 'sage', 'thyme', 'tea', 'green tea',
    # Leather/Animalic
    'leather', 'oud', 'tobacco', 'tobacco leaf',
    # Other
    'incense', 'smoke', 'sea salt', 'elemi', 'benzoin', 'labdanum', 'opoponax'
}

# Find unmapped items
unmapped_accords = sorted(accords - MAPPED_ACCORDS)
unmapped_notes = sorted(notes - MAPPED_NOTES)
notes_without_emoji = sorted(notes - MAPPED_EMOJIS)

# Statistics
print(f"=== ACCORD MAPPING COVERAGE ===")
print(f"Total unique accords in dataset: {len(accords)}")
print(f"Mapped accords: {len(MAPPED_ACCORDS)}")
print(f"Unmapped accords: {len(unmapped_accords)}")
print(f"Coverage: {len(accords & MAPPED_ACCORDS) / len(accords) * 100:.1f}%\n")

print(f"=== NOTE MAPPING COVERAGE ===")
print(f"Total unique notes in dataset: {len(notes)}")
print(f"Notes with colors: {len(MAPPED_NOTES)}")
print(f"Notes with emojis: {len(MAPPED_EMOJIS)}")
print(f"Unmapped notes (no color): {len(unmapped_notes)}")
print(f"Notes without emoji: {len(notes_without_emoji)}")
print(f"Color coverage: {len(notes & MAPPED_NOTES) / len(notes) * 100:.1f}%")
print(f"Emoji coverage: {len(notes & MAPPED_EMOJIS) / len(notes) * 100:.1f}%\n")

# Print unmapped accords
if unmapped_accords:
    print(f"=== UNMAPPED ACCORDS ({len(unmapped_accords)}) ===")
    for accord in unmapped_accords:
        print(f"  - {accord}")
    print()

# Print unmapped notes (limit to first 50 for readability)
if unmapped_notes:
    print(f"=== UNMAPPED NOTES (no color) - First 50 of {len(unmapped_notes)} ===")
    for note in unmapped_notes[:50]:
        print(f"  - {note}")
    if len(unmapped_notes) > 50:
        print(f"  ... and {len(unmapped_notes) - 50} more")
    print()

# Print notes without emoji (limit to first 50)
if notes_without_emoji:
    print(f"=== NOTES WITHOUT EMOJI - First 50 of {len(notes_without_emoji)} ===")
    for note in notes_without_emoji[:50]:
        print(f"  - {note}")
    if len(notes_without_emoji) > 50:
        print(f"  ... and {len(notes_without_emoji) - 50} more")
    print()

# Show all accords present
print(f"=== ALL ACCORDS IN DATASET ({len(accords)}) ===")
for accord in sorted(accords):
    status = "✓" if accord in MAPPED_ACCORDS else "✗"
    print(f"  {status} {accord}")
