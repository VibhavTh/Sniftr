/**
 * Profile/Dashboard page - matches profile_template.png
 * Shows stats, navigation cards, and recent favorites
 */

'use client'

import { useState, useEffect } from 'react'
import { apiGet, ApiError } from '@/lib/api'
import { Fragrance } from '@/types/fragrance'
import { useFragranceModal } from '@/contexts/FragranceModalContext'
import { formatDisplayText } from '@/lib/fragrance-colors'
import Navigation from '@/components/Navigation'

interface CollectionResponse {
  collection_type: string
  results: Fragrance[]
}

export default function ProfilePage() {
  const { open: openModal } = useFragranceModal()
  const [favorites, setFavorites] = useState<Fragrance[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [personalCount, setPersonalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch all three collections to get counts
        const [favData, wishData, persData] = await Promise.all([
          apiGet<CollectionResponse>('/collections?type=favorites'),
          apiGet<CollectionResponse>('/collections?type=wishlist'),
          apiGet<CollectionResponse>('/collections?type=personal'),
        ])
        setFavorites(favData.results)
        setWishlistCount(wishData.results.length)
        setPersonalCount(persData.results.length)
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setError('Please log in to view your profile')
        } else {
          setError('Failed to load profile')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchCollections()
  }, [])

  // Calculate total collections (wishlist + personal buckets that have items)
  const collectionsCount = (wishlistCount > 0 ? 1 : 0) + (personalCount > 0 ? 1 : 0)

  return (
    <div className="min-h-screen bg-stone-50">
      <Navigation variant="solid" currentPath="/collection" />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-14 py-8 sm:py-12 lg:py-16">
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
          <div className="text-center py-16 sm:py-20">
            <p className="text-[14px] sm:text-[15px] font-light text-neutral-400">Loading...</p>
          </div>
        )}

        {/* Profile content */}
        {!loading && !error && (
          <>
            {/* Page header */}
            <div className="mb-6 sm:mb-8 lg:mb-10">
              <h2 className="font-serif text-[28px] sm:text-[36px] lg:text-[42px] font-light text-neutral-900 mb-1 sm:mb-2 leading-tight">Your Profile</h2>
              <p className="text-[14px] sm:text-[15px] font-light text-neutral-500">
                Welcome back to your fragrance journey
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8">
              <div className="bg-white border border-neutral-200 py-6 sm:py-8 lg:py-10 text-center">
                <p className="font-serif text-[24px] sm:text-[30px] lg:text-[36px] font-light text-neutral-900 mb-0.5 sm:mb-1">{favorites.length + wishlistCount + personalCount}</p>
                <p className="text-[9px] sm:text-[10px] lg:text-[11px] font-normal text-neutral-500 uppercase tracking-wider sm:tracking-widest">Fragrances</p>
              </div>
              <a href="/collection/favorites" className="bg-white border border-neutral-200 py-6 sm:py-8 lg:py-10 text-center hover:bg-neutral-50 transition-colors">
                <p className="font-serif text-[24px] sm:text-[30px] lg:text-[36px] font-light text-neutral-900 mb-0.5 sm:mb-1">{favorites.length}</p>
                <p className="text-[9px] sm:text-[10px] lg:text-[11px] font-normal text-neutral-500 uppercase tracking-wider sm:tracking-widest">Favorites</p>
              </a>
              <a href="/collection/wishlist" className="bg-white border border-neutral-200 py-6 sm:py-8 lg:py-10 text-center hover:bg-neutral-50 transition-colors">
                <p className="font-serif text-[24px] sm:text-[30px] lg:text-[36px] font-light text-neutral-900 mb-0.5 sm:mb-1">{collectionsCount}</p>
                <p className="text-[9px] sm:text-[10px] lg:text-[11px] font-normal text-neutral-500 uppercase tracking-wider sm:tracking-widest">Collections</p>
              </a>
            </div>

            {/* Navigation cards */}
            <div className="bg-white border border-neutral-200 mb-8 sm:mb-10 lg:mb-12">
              <a href="/finder" className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 py-4 sm:py-5 border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-600 sm:w-[22px] sm:h-[22px]">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <div>
                  <p className="font-serif text-[16px] sm:text-[18px] font-normal text-neutral-900">Continue Exploring</p>
                  <p className="text-[12px] sm:text-[13px] font-light text-neutral-500">Find your next favorite scent</p>
                </div>
              </a>
              <a href="/browse" className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 py-4 sm:py-5 hover:bg-neutral-50 transition-colors">
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-600 sm:w-[22px] sm:h-[22px]">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                  </svg>
                </div>
                <div>
                  <p className="font-serif text-[16px] sm:text-[18px] font-normal text-neutral-900">Browse Collection</p>
                  <p className="text-[12px] sm:text-[13px] font-light text-neutral-500">Explore curated fragrances</p>
                </div>
              </a>
            </div>

            {/* Recent Favorites */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-serif text-[20px] sm:text-[22px] lg:text-[24px] font-light text-neutral-900">Recent Favorites</h3>
                <a href="/collection/favorites" className="text-neutral-400 hover:text-neutral-600 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="sm:w-[22px] sm:h-[22px]">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </a>
              </div>

              {favorites.length === 0 ? (
                <div className="bg-white border border-neutral-200 p-6 sm:p-8 lg:p-10 text-center">
                  <p className="text-[14px] sm:text-[15px] font-light text-neutral-500">No favorites yet. Start exploring to find fragrances you love.</p>
                </div>
              ) : (
                <div className="bg-white border border-neutral-200">
                  {favorites.slice(0, 5).map((fragrance, idx) => (
                    <button
                      key={fragrance.bottle_id}
                      onClick={() => openModal(fragrance)}
                      className={`w-full flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 text-left hover:bg-neutral-50 transition-colors ${
                        idx < Math.min(favorites.length, 5) - 1 ? 'border-b border-neutral-100' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-serif text-[14px] sm:text-[16px] font-normal text-neutral-900 truncate">{formatDisplayText(fragrance.name)}</p>
                        <p className="text-[12px] sm:text-[13px] font-light text-neutral-500 truncate">{formatDisplayText(fragrance.brand)}</p>
                      </div>
                      <span className="px-2 sm:px-3 py-1 bg-neutral-100 text-[10px] sm:text-[11px] font-normal text-neutral-600 uppercase tracking-wider flex-shrink-0">
                        Loved
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {favorites.length > 5 && (
                <a
                  href="/collection/favorites"
                  className="block mt-3 sm:mt-4 text-center text-[12px] sm:text-[13px] font-light text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  View all {favorites.length} favorites →
                </a>
              )}
            </div>

            {/* Quick links to collections */}
            <div className="flex flex-col gap-3 sm:gap-4 mt-6 sm:mt-8">
              <a
                href="/collection/favorites"
                className="bg-white border border-neutral-200 px-4 sm:px-6 py-3 sm:py-4 hover:bg-neutral-50 transition-colors"
              >
                <p className="font-serif text-[14px] sm:text-[16px] font-normal text-neutral-900">Favorites</p>
                <p className="text-[12px] sm:text-[13px] font-light text-neutral-500">{favorites.length} fragrances</p>
              </a>
              <a
                href="/collection/wishlist"
                className="bg-white border border-neutral-200 px-4 sm:px-6 py-3 sm:py-4 hover:bg-neutral-50 transition-colors"
              >
                <p className="font-serif text-[14px] sm:text-[16px] font-normal text-neutral-900">Wishlist</p>
                <p className="text-[12px] sm:text-[13px] font-light text-neutral-500">{wishlistCount} fragrances</p>
              </a>
              <a
                href="/collection/personal"
                className="bg-white border border-neutral-200 px-4 sm:px-6 py-3 sm:py-4 hover:bg-neutral-50 transition-colors"
              >
                <p className="font-serif text-[14px] sm:text-[16px] font-normal text-neutral-900">Personal Collection</p>
                <p className="text-[12px] sm:text-[13px] font-light text-neutral-500">{personalCount} fragrances</p>
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
