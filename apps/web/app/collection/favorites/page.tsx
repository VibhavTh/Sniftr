/**
 * Favorites collection grid page
 * Fetches from GET /collections?type=favorites
 */

'use client'

import { useState, useEffect } from 'react'
import { apiGet, ApiError } from '@/lib/api'
import { Fragrance } from '@/types/fragrance'
import FragranceCard from '@/components/FragranceCard'
import Navigation from '@/components/Navigation'
import { useFragranceModal } from '@/contexts/FragranceModalContext'

interface CollectionResponse {
  collection_type: string
  results: Fragrance[]
}

export default function FavoritesPage() {
  const { open: openModal } = useFragranceModal()
  const [bottles, setBottles] = useState<Fragrance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiGet<CollectionResponse>('/collections?type=favorites')
        setBottles(data.results)
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setError('Please log in to view your favorites')
        } else {
          setError('Failed to load favorites')
        }
        setBottles([])
      } finally {
        setLoading(false)
      }
    }
    fetchCollection()
  }, [])

  return (
    <div className="min-h-screen bg-stone-50">
      <Navigation variant="solid" currentPath="/collection" />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-14 py-8 sm:py-12 lg:py-20">
        {/* Back link */}
        <a href="/collection" className="inline-flex items-center gap-2 text-[12px] sm:text-[13px] font-light text-neutral-500 hover:text-neutral-700 transition-colors mb-6 sm:mb-8">
          ← Back to Collection
        </a>

        {/* Page header */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="font-serif text-[28px] sm:text-[36px] lg:text-[42px] font-light text-neutral-900 mb-1 sm:mb-2 leading-tight">Favorites</h2>
          <p className="text-[14px] sm:text-[15px] font-light text-neutral-500">
            Fragrances you love
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-neutral-200 p-8 sm:p-12 lg:p-16 text-center">
              <p className="text-[14px] sm:text-[15px] font-light text-neutral-500">{error}</p>
              <a
                href="/signin"
                className="inline-block mt-5 sm:mt-6 px-6 sm:px-8 py-3 sm:py-3.5 bg-neutral-900 text-white text-[14px] sm:text-[15px] font-light hover:bg-neutral-800 transition-colors"
              >
                Log In
              </a>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && !error && (
          <div className="text-center py-12 sm:py-20">
            <p className="text-[14px] sm:text-[15px] font-light text-neutral-400">Loading...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && bottles.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-neutral-200 p-8 sm:p-12 lg:p-16 text-center">
              <h3 className="font-serif text-[22px] sm:text-[26px] lg:text-[28px] font-light text-neutral-900 mb-3 sm:mb-4 leading-tight">
                No Favorites Yet
              </h3>
              <p className="text-[14px] sm:text-[15px] font-light text-neutral-500 leading-relaxed mb-6 sm:mb-10 max-w-md mx-auto">
                Start discovering fragrances using the Finder or browse the Explore page to find scents you love
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <a
                  href="/finder"
                  className="px-6 sm:px-8 py-3 sm:py-3.5 bg-neutral-900 text-white text-[14px] sm:text-[15px] font-light hover:bg-neutral-800 transition-colors"
                >
                  Start Finder
                </a>
                <a
                  href="/browse"
                  className="px-6 sm:px-8 py-3 sm:py-3.5 border border-neutral-300 text-[14px] sm:text-[15px] font-light text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  Explore
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Grid of saved bottles */}
        {!loading && !error && bottles.length > 0 && (
          <>
            <p className="text-[12px] sm:text-[13px] font-light text-neutral-500 mb-6 sm:mb-8">
              {bottles.length} {bottles.length === 1 ? 'fragrance' : 'fragrances'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-6 lg:gap-x-8 gap-y-8 sm:gap-y-12 lg:gap-y-16">
              {bottles.map((bottle) => (
                <FragranceCard
                  key={bottle.bottle_id}
                  fragrance={bottle}
                  onOpen={openModal}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
