// components/FragranceCard.tsx
import { Fragrance } from '@/types/fragrance'
import { getAccordColor } from '@/lib/fragrance-colors'
import Image from 'next/image'

interface FragranceCardProps {
  fragrance: Fragrance
  onOpen: (fragrance: Fragrance) => void
}

export default function FragranceCard({ fragrance, onOpen }: FragranceCardProps) {
  return (
    <button
      onClick={() => onOpen(fragrance)}
      className="group w-full text-left transition-all duration-300 hover:scale-[1.02]"
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100 mb-4">
        {fragrance.image_url ? (
          <Image
            src={fragrance.image_url}
            alt={`${fragrance.brand} ${fragrance.name}`}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm tracking-widest text-gray-400">
              FRAGRANCE
            </span>
          </div>
        )}

        {/* Gender badge (top-right) */}
        {fragrance.gender && (
          <span className={`absolute right-2 top-2 px-2.5 py-1 text-xs ${
            fragrance.gender.toLowerCase() === 'women'
              ? 'bg-pink-100 text-pink-700'
              : fragrance.gender.toLowerCase() === 'unisex'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {fragrance.gender.toLowerCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* Name (serif, larger) */}
        <h3 className="font-serif text-xl leading-tight text-gray-900 line-clamp-1">
          {fragrance.name}
        </h3>

        {/* Brand */}
        <p className="text-sm text-gray-600">
          {fragrance.brand}
        </p>

        {/* Accords (max 3) */}
        {fragrance.main_accords && fragrance.main_accords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {fragrance.main_accords.slice(0, 3).map((accord, idx) => (
              <span
                key={idx}
                className={`px-2.5 py-1 text-xs capitalize ${getAccordColor(accord)}`}
              >
                {accord.toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
