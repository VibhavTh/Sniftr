// components/FragranceCard.tsx
import { Fragrance } from '@/types/fragrance'
import { getAccordColor, formatDisplayText } from '@/lib/fragrance-colors'
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
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100 mb-3 sm:mb-4">
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
            <span className="text-[10px] sm:text-sm tracking-widest text-gray-400">
              SNIFTR
            </span>
          </div>
        )}

        {/* Gender badge (top-right) */}
        {fragrance.gender && (
          <span className={`absolute right-1.5 sm:right-2 top-1.5 sm:top-2 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs ${
            fragrance.gender.toLowerCase() === 'women'
              ? 'bg-pink-100 text-pink-700'
              : fragrance.gender.toLowerCase() === 'unisex'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {formatDisplayText(fragrance.gender.toLowerCase())}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1 sm:space-y-2">
        {/* Name (serif, larger) */}
        <h3 className="font-serif text-base sm:text-lg lg:text-xl leading-tight text-gray-900 line-clamp-1">
          {formatDisplayText(fragrance.name)}
        </h3>

        {/* Brand */}
        <p className="text-xs sm:text-sm text-gray-600">
          {formatDisplayText(fragrance.brand)}
        </p>

        {/* Accords (max 3) */}
        {fragrance.main_accords && fragrance.main_accords.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-0.5 sm:pt-1">
            {fragrance.main_accords.slice(0, 3).map((accord, idx) => (
              <span
                key={idx}
                className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs capitalize ${getAccordColor(accord)}`}
              >
                {formatDisplayText(accord.toLowerCase())}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
