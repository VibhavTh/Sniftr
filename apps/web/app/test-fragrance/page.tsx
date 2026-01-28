// app/test-fragrance/page.tsx
'use client'

import FragranceCard from '@/components/FragranceCard'
import { useFragranceModal } from '@/contexts/FragranceModalContext'
import { Fragrance } from '@/types/fragrance'

// Mock data for testing
const mockFragrances: Fragrance[] = [
  {
    bottle_id: 1,
    brand: 'Creed',
    name: 'Aventus',
    image_url: null,
    year: 2010,
    gender: 'men',
    rating_value: 4.5,
    rating_count: 12453,
    main_accords: ['Fruity', 'Sweet', 'Woody', 'Leather'],
    notes: {
      top: ['Bergamot', 'Black Currant', 'Apple', 'Pineapple'],
      middle: ['Pineapple', 'Patchouli', 'Moroccan Jasmine'],
      base: ['Birch', 'Musk', 'Oak Moss', 'Ambergris'],
    },
  },
  {
    bottle_id: 2,
    brand: 'Dior',
    name: 'Sauvage',
    image_url: null,
    year: 2015,
    gender: 'men',
    rating_value: 4.2,
    rating_count: 8392,
    main_accords: ['citrus', 'warm spicy', 'aromatic'],
    notes: {
      top: ['Calabrian Bergamot', 'Pepper'],
      middle: ['Sichuan Pepper', 'Lavender', 'Pink Pepper', 'Vetiver', 'Patchouli', 'Geranium', 'Elemi'],
      base: ['Ambroxan', 'Cedar', 'Labdanum'],
    },
  },
  {
    bottle_id: 3,
    brand: 'Chanel',
    name: 'Coco Mademoiselle',
    image_url: null,
    year: 2001,
    gender: 'women',
    rating_value: 4.6,
    rating_count: 15234,
    main_accords: ['floral', 'oriental', 'citrus', 'patchouli'],
    notes: {
      top: ['Orange', 'Mandarin Orange', 'Orange Blossom', 'Bergamot'],
      middle: ['Mimosa', 'Jasmine', 'Turkish Rose', 'Ylang-Ylang'],
      base: ['Tonka Bean', 'Patchouli', 'Opoponax', 'Vanilla', 'Vetiver', 'White Musk'],
    },
  },
  {
    bottle_id: 4,
    brand: 'Tom Ford',
    name: 'Tobacco Vanille',
    image_url: null,
    year: 2007,
    gender: 'unisex',
    rating_value: 4.4,
    rating_count: 6821,
    main_accords: ['warm spicy', 'sweet', 'vanilla', 'tobacco'],
    notes: {
      top: ['Tobacco Leaf', 'Spicy Notes', 'Ginger'],
      middle: ['Tobacco', 'Tonka Bean', 'Vanilla', 'Cacao', 'Dried Fruits'],
      base: ['Woods', 'Sandalwood'],
    },
  },
]

export default function TestFragrancePage() {
  const { open } = useFragranceModal()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="font-serif text-5xl text-gray-900 mb-2">
            Fragrance Card + Modal Test
          </h1>
          <p className="text-gray-600">
            Click any card to open the detail modal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockFragrances.map((fragrance) => (
            <FragranceCard
              key={fragrance.bottle_id}
              fragrance={fragrance}
              onOpen={open}
            />
          ))}
        </div>

        <div className="mt-12 rounded-lg bg-white p-6 border border-gray-200">
          <h2 className="font-semibold text-lg mb-4">Test Instructions:</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ Click any card to open the modal</li>
            <li>✅ Press ESC or click outside to close</li>
            <li>✅ Check gender badges (men/women/unisex)</li>
            <li>✅ Verify ratings display correctly</li>
            <li>✅ Verify main accords show (max 4 on card)</li>
            <li>✅ In modal: check top/middle/base notes with icons</li>
            <li>✅ Test Like/Pass buttons (check console logs)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
