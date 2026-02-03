#!/usr/bin/env python3
"""
Analyze note and accord frequency to prioritize mappings
"""
import csv
from collections import Counter

# Read dataset
dataset_path = 'apps/api/intelligence/perfume_dataset_v1.csv'

# Count frequencies
accord_freq = Counter()
note_freq = Counter()

with open(dataset_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Count accords
        for i in range(1, 6):
            accord = row.get(f'mainaccord{i}', '').strip()
            if accord:
                accord_freq[accord.lower()] += 1

        # Count notes
        for note_type in ['Top', 'Middle', 'Base']:
            notes_str = row.get(note_type, '').strip()
            if notes_str:
                for note in notes_str.split(','):
                    note = note.strip()
                    if note:
                        note_freq[note.lower()] += 1

print("=== TOP 100 MOST COMMON ACCORDS ===")
for accord, count in accord_freq.most_common(100):
    print(f"{count:5d}  {accord}")

print("\n=== TOP 200 MOST COMMON NOTES ===")
for note, count in note_freq.most_common(200):
    print(f"{count:5d}  {note}")
