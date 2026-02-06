/**
 * Personal collection grid page
 * Fetches from GET /collections?type=personal
 */

'use client'

import { useState, useEffect } from 'react'
import { apiGet, ApiError } from '@/lib/api'
import { Fragrance } from '@/types/fragrance'
import FragranceCard from '@/components/FragranceCard'
import { useFragranceModal } from '@/contexts/FragranceModalContext'

interface CollectionResponse {
  collection_type: string
  results: Fragrance[]
}

export default function PersonalPage() {
  const { open: openModal } = useFragranceModal()
  const [bottles, setBottles] = useState<Fragrance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiGet<CollectionResponse>('/collections?type=personal')
        setBottles(data.results)
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setError('Please log in to view your personal collection')
        } else {
          setError('Failed to load personal collection')
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
      {/* Navigation bar */}
      <nav className="bg-white border-b border-neutral-200">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-14">
          <div className="flex justify-between items-center h-[72px]">
            <h1 className="font-serif text-[15px] font-normal text-neutral-900 tracking-[0.3em] uppercase">FRAGRANCE</h1>
            <div className="flex items-center gap-10">
              <a href="/" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition">Home</a>
              <a href="/finder" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition">Finder</a>
              <a href="/browse" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition">Explore</a>
              <a href="/collection" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition underline underline-offset-4">Collection</a>
            </div>
            <button className="w-8 h-8 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-8 lg:px-14 py-20">
        {/* Back link */}
        <a href="/collection" className="inline-flex items-center gap-2 text-[13px] font-light text-neutral-500 hover:text-neutral-700 transition-colors mb-8">
          ← Back to Collection
        </a>

        {/* Page header */}
        <div className="mb-10">
          <h2 className="font-serif text-[42px] font-light text-neutral-900 mb-2 leading-tight">Personal Collection</h2>
          <p className="text-[15px] font-light text-neutral-500">
            Fragrances you own
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-neutral-200 p-16 text-center">
              <p className="text-[15px] font-light text-neutral-500">{error}</p>
              <a
                href="/login"
                className="inline-block mt-6 px-8 py-3.5 bg-neutral-900 text-white text-[15px] font-light hover:bg-neutral-800 transition-colors"
              >
                Log In
              </a>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && !error && (
          <div className="text-center py-20">
            <p className="text-[15px] font-light text-neutral-400">Loading...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && bottles.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-neutral-200 p-16 text-center">
              <h3 className="font-serif text-[28px] font-light text-neutral-900 mb-4 leading-tight">
                No Personal Collection Yet
              </h3>
              <p className="text-[15px] font-light text-neutral-500 leading-relaxed mb-10 max-w-md mx-auto">
                Add fragrances you own to your personal collection from the detail view
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="/finder"
                  className="px-8 py-3.5 bg-neutral-900 text-white text-[15px] font-light hover:bg-neutral-800 transition-colors"
                >
                  Start Finder
                </a>
                <a
                  href="/browse"
                  className="px-8 py-3.5 border border-neutral-300 text-[15px] font-light text-neutral-900 hover:bg-neutral-50 transition-colors"
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
            <p className="text-[13px] font-light text-neutral-500 mb-8">
              {bottles.length} {bottles.length === 1 ? 'fragrance' : 'fragrances'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
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
