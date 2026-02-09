/**
 * Browse page component for displaying paginated fragrance bottles.
 *
 * Fetches from GET /bottles?page=&limit=&q= with optional search.
 * Uses FragranceCard component and global modal context.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { publicApiGet } from '@/lib/api'
import { Fragrance } from '@/types/fragrance'
import FragranceCard from '@/components/FragranceCard'
import Navigation from '@/components/Navigation'
import { useFragranceModal } from '@/contexts/FragranceModalContext'

// API response shape from GET /bottles
interface BottlesResponse {
  page: number
  limit: number
  total: number
  results: Fragrance[]
}

const ITEMS_PER_PAGE = 24

export default function BrowsePage() {
  const { open: openModal } = useFragranceModal()

  const [bottles, setBottles] = useState<Fragrance[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Debounce search input (300ms)
  useEffect(() => {
    // Show searching indicator while typing (only if query changed)
    if (searchQuery !== debouncedQuery) {
      setIsSearching(true)
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, debouncedQuery])

  // Reset pagination when search changes (but don't clear results or show full loading)
  useEffect(() => {
    setPage(1)
    // Don't setBottles([]) or setLoading(true) — keep current results visible during fetch
  }, [debouncedQuery])

  // Fetch bottles from API
  const fetchBottles = useCallback(async (pageNum: number, query: string) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      })
      if (query.trim()) {
        params.set('q', query.trim())
      }
      // actual data in normalized bottle array format using get_bottle function which in turn uses normalize_bottle function
      const data = await publicApiGet<BottlesResponse>(`/bottles?${params.toString()}`)
      setError(null)
      setTotal(data.total)

      if (pageNum === 1) {
        setBottles(data.results)
      } else {
        setBottles(prev => [...prev, ...data.results])
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching bottles')
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setIsSearching(false)
    }
  }, [])

  // Initial fetch and refetch on search change
  useEffect(() => {
    fetchBottles(1, debouncedQuery)
  }, [debouncedQuery, fetchBottles])

  // Load more handler
  const handleLoadMore = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    setPage(nextPage)
    await fetchBottles(nextPage, debouncedQuery)
  }

  const hasMore = bottles.length < total

  // Loading state
  if (loading && bottles.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navigation variant="solid" currentPath="/browse" />
        <div className="flex items-center justify-center py-32 sm:py-40">
          <p className="text-[14px] sm:text-[15px] font-light text-neutral-500">Loading fragrances...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && bottles.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navigation variant="solid" currentPath="/browse" />
        <div className="flex items-center justify-center py-32 sm:py-40">
          <p className="text-[14px] sm:text-[15px] font-light text-red-600">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navigation variant="solid" currentPath="/browse" />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-14 py-8 sm:py-12 lg:py-20">
        {/* Page header */}
        <div className="mb-6 sm:mb-10 lg:mb-14">
          <h2 className="font-serif text-[28px] sm:text-[36px] lg:text-[42px] font-light text-neutral-900 mb-2 sm:mb-3 leading-tight">
            Explore Fragrances
          </h2>
          <p className="text-[14px] sm:text-[15px] font-light text-neutral-500 leading-relaxed">
            Browse our collection of {total.toLocaleString()} luxury fragrances
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-8 sm:mb-12 lg:mb-16 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fragrances or brands..."
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 border border-neutral-300 text-[14px] sm:text-[15px] font-light text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
            />
          </div>
          <button className="px-4 sm:px-6 py-3 sm:py-3.5 border border-neutral-300 text-[14px] sm:text-[15px] font-light text-neutral-900 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="sm:w-[18px] sm:h-[18px]">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            Filters
          </button>
        </div>

        {/* Results count when searching */}
        {debouncedQuery && (
          <p className="mb-6 sm:mb-8 text-[12px] sm:text-[13px] font-light text-neutral-500">
            {isSearching ? 'Searching...' : `${total.toLocaleString()} results for "${debouncedQuery}"`}
          </p>
        )}
        {/* Searching indicator when no committed query yet */}
        {!debouncedQuery && isSearching && (
          <p className="mb-6 sm:mb-8 text-[12px] sm:text-[13px] font-light text-neutral-400">
            Searching...
          </p>
        )}

        {/* Grid of fragrance cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-6 lg:gap-x-8 gap-y-8 sm:gap-y-12 lg:gap-y-16">
          {bottles.map((bottle) => (
            <FragranceCard
              key={bottle.bottle_id}
              fragrance={bottle}
              onOpen={openModal}
            />
          ))}
        </div>

        {/* Empty state */}
        {bottles.length === 0 && !loading && (
          <div className="text-center py-12 sm:py-20">
            <p className="text-[14px] sm:text-[15px] font-light text-neutral-500">
              No fragrances found{debouncedQuery ? ` for "${debouncedQuery}"` : ''}
            </p>
          </div>
        )}

        {/* Load more button */}
        {hasMore && bottles.length > 0 && (
          <div className="flex justify-center mt-12 sm:mt-16 lg:mt-20">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full sm:w-auto px-8 sm:px-10 py-3.5 bg-neutral-900 text-white text-[12px] sm:text-[13px] font-light tracking-wide uppercase hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {/* Pagination info */}
        {bottles.length > 0 && (
          <p className="text-center mt-6 sm:mt-8 text-[12px] sm:text-[13px] font-light text-neutral-400">
            Showing {bottles.length} of {total.toLocaleString()}
          </p>
        )}
      </main>
    </div>
  )
}
