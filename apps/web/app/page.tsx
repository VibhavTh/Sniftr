/**
 * Purpose:
 * Public homepage — editorial landing page for ScentlyMax.
 *
 * Sections:
 * 1. Hero — full-width fragrance photography + value prop + CTAs
 * 2. Nav Cards — 3-up grid linking to Finder, Browse, Collection
 * 3. Trending — horizontal scroll of top-rated fragrances from API
 * 4. Value Statement — mid-page CTA for collections
 * 5. Your Library — 3-up grid of collection category cards
 * 6. Footer — brand info + navigation links
 *
 * System context:
 * - Public page (no auth required)
 * - Fetches trending bottles from GET /bottles?limit=8
 * - Reuses FragranceCard component for trending section
 */

'use client'

import { useState, useEffect } from 'react'
import { publicApiGet } from '@/lib/api'
import { Fragrance } from '@/types/fragrance'
import FragranceCard from '@/components/FragranceCard'
import Navigation from '@/components/Navigation'
import { useFragranceModal } from '@/contexts/FragranceModalContext'

interface BottlesResponse {
  page: number
  limit: number
  total: number
  results: Fragrance[]
}

export default function HomePage() {
  const { open: openModal } = useFragranceModal()
  const [trending, setTrending] = useState<Fragrance[]>([])

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await publicApiGet<BottlesResponse>('/bottles?limit=8&page=1')
        setTrending(data.results)
      } catch {
        // Trending section silently degrades
      }
    }
    fetchTrending()
  }, [])

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ============================================ */}
      {/* NAVIGATION */}
      {/* ============================================ */}
      <Navigation variant="transparent" currentPath="/" />

      {/* ============================================ */}
      {/* SECTION 1: HERO */}
      {/* ============================================ */}
      <section className="relative h-[100svh] min-h-[500px] sm:min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/scently_max_homepage_header.jpeg)',
          }}
        />
        <div className="absolute inset-0 bg-black/30" />

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 sm:px-8 max-w-3xl mx-auto pt-16 sm:pt-0">
          <h1 className="font-serif text-[36px] sm:text-[48px] md:text-[56px] lg:text-[72px] font-light text-white leading-[1.1] mb-4 sm:mb-6">
            Discover scents<br />made for you.
          </h1>
          <p className="text-[15px] sm:text-[17px] font-light text-white/80 leading-relaxed mb-8 sm:mb-12 max-w-lg mx-auto">
            Swipe, save favorites, and build your collection — powered by a content-based recommender.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <a
              href="/finder"
              className="px-8 sm:px-10 py-3.5 sm:py-4 bg-neutral-900 text-white text-[12px] sm:text-[13px] font-normal tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors"
            >
              Start Finding
            </a>
            <a
              href="/browse"
              className="px-8 sm:px-10 py-3.5 sm:py-4 border border-white/60 text-white text-[12px] sm:text-[13px] font-normal tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
            >
              Browse Fragrances
            </a>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 2: PRIMARY NAV CARDS */}
      {/* ============================================ */}
      <section className="bg-stone-100 py-12 sm:py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Fragrance Finder */}
            <div className="bg-white border border-neutral-200 p-6 sm:p-8 lg:p-10">
              <div className="mb-4 sm:mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-neutral-400 sm:w-8 sm:h-8">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <h3 className="font-serif text-[20px] sm:text-[22px] lg:text-[24px] font-light text-neutral-900 mb-2 sm:mb-3 leading-tight">
                Fragrance Finder
              </h3>
              <p className="text-[14px] sm:text-[15px] font-light text-neutral-500 leading-relaxed mb-6 sm:mb-8">
                Swipe through scents and train your taste.
              </p>
              <a
                href="/finder"
                className="text-[12px] sm:text-[13px] font-normal text-neutral-900 tracking-wider uppercase hover:text-neutral-600 transition-colors"
              >
                Explore &rarr;
              </a>
            </div>

            {/* Explore Catalog */}
            <div className="bg-white border border-neutral-200 p-6 sm:p-8 lg:p-10">
              <div className="mb-4 sm:mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-neutral-400 sm:w-8 sm:h-8">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <h3 className="font-serif text-[20px] sm:text-[22px] lg:text-[24px] font-light text-neutral-900 mb-2 sm:mb-3 leading-tight">
                Explore Catalog
              </h3>
              <p className="text-[14px] sm:text-[15px] font-light text-neutral-500 leading-relaxed mb-6 sm:mb-8">
                Browse the full library with filters.
              </p>
              <a
                href="/browse"
                className="text-[12px] sm:text-[13px] font-normal text-neutral-900 tracking-wider uppercase hover:text-neutral-600 transition-colors"
              >
                Explore &rarr;
              </a>
            </div>

            {/* Your Collection */}
            <div className="bg-white border border-neutral-200 p-6 sm:p-8 lg:p-10">
              <div className="mb-4 sm:mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-neutral-400 sm:w-8 sm:h-8">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <h3 className="font-serif text-[20px] sm:text-[22px] lg:text-[24px] font-light text-neutral-900 mb-2 sm:mb-3 leading-tight">
                Your Collection
              </h3>
              <p className="text-[14px] sm:text-[15px] font-light text-neutral-500 leading-relaxed mb-6 sm:mb-8">
                Favorites, wishlist, and personal shelves.
              </p>
              <a
                href="/collection"
                className="text-[12px] sm:text-[13px] font-normal text-neutral-900 tracking-wider uppercase hover:text-neutral-600 transition-colors"
              >
                Explore &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 3: TRENDING RIGHT NOW */}
      {/* ============================================ */}
      {trending.length > 0 && (
        <section className="bg-stone-50 py-12 sm:py-16 lg:py-24">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-14">
            <div className="flex justify-between items-end mb-8 sm:mb-10 lg:mb-14">
              <h2 className="font-serif text-[24px] sm:text-[28px] lg:text-[36px] font-light text-neutral-900 leading-tight">
                Trending right now
              </h2>
              <a
                href="/browse"
                className="text-[12px] sm:text-[13px] font-normal text-neutral-900 tracking-wider uppercase hover:text-neutral-600 transition-colors hidden sm:block"
              >
                View all &rarr;
              </a>
            </div>

            {/* Horizontal scroll container */}
            <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-2 sm:px-2" style={{ scrollbarWidth: 'none' }}>
              {trending.map((bottle) => (
                <div key={bottle.bottle_id} className="flex-shrink-0 w-[200px] sm:w-[220px] lg:w-[260px]">
                  <FragranceCard fragrance={bottle} onOpen={openModal} />
                </div>
              ))}
            </div>

            {/* Mobile "View all" link */}
            <a
              href="/browse"
              className="block sm:hidden text-center mt-6 text-[13px] font-normal text-neutral-900 tracking-wider uppercase hover:text-neutral-600 transition-colors"
            >
              View all &rarr;
            </a>
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/* SECTION 4: VALUE STATEMENT / MID CTA */}
      {/* ============================================ */}
      <section className="bg-stone-200 py-16 sm:py-20 lg:py-28">
        <div className="max-w-[800px] mx-auto px-4 sm:px-8 text-center">
          <h2 className="font-serif text-[28px] sm:text-[36px] md:text-[42px] lg:text-[52px] font-light text-neutral-900 leading-tight mb-4 sm:mb-6">
            Build your scent wardrobe.
          </h2>
          <p className="text-[15px] sm:text-[17px] font-light text-neutral-500 leading-relaxed mb-8 sm:mb-12 max-w-lg mx-auto">
            Save what you love. Revisit later. Let the recommender refine your next picks.
          </p>
          <a
            href="/collection/favorites"
            className="inline-block px-8 sm:px-10 py-3.5 sm:py-4 bg-neutral-900 text-white text-[12px] sm:text-[13px] font-normal tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors"
          >
            View Favorites
          </a>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 5: YOUR LIBRARY */}
      {/* ============================================ */}
      <section className="bg-stone-50 py-12 sm:py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-14">
          <h2 className="font-serif text-[24px] sm:text-[28px] lg:text-[36px] font-light text-neutral-900 leading-tight mb-8 sm:mb-10 lg:mb-14 text-center">
            Your Library
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Favorites */}
            <div className="bg-white border border-neutral-200 overflow-hidden">
              <div className="aspect-[16/10] bg-stone-100 overflow-hidden">
                <img
                  src="/collection-favorites.jpg"
                  alt="Favorites collection"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 sm:p-6 lg:p-8">
                <h3 className="font-serif text-[18px] sm:text-[20px] lg:text-[22px] font-light text-neutral-900 mb-1 sm:mb-2 leading-tight">
                  Favorites
                </h3>
                <p className="text-[14px] sm:text-[15px] font-light text-neutral-500 mb-4 sm:mb-6">
                  Scents you&apos;ve loved
                </p>
                <a
                  href="/collection/favorites"
                  className="inline-block px-5 sm:px-6 py-2.5 sm:py-3 bg-neutral-900 text-white text-[11px] sm:text-[12px] font-normal tracking-[0.15em] uppercase hover:bg-neutral-800 transition-colors"
                >
                  View Favorites
                </a>
              </div>
            </div>

            {/* Wishlist */}
            <div className="bg-white border border-neutral-200 overflow-hidden">
              <div className="aspect-[16/10] bg-stone-100 overflow-hidden">
                <img
                  src="/collection-wishlist.jpg"
                  alt="Wishlist collection"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 sm:p-6 lg:p-8">
                <h3 className="font-serif text-[18px] sm:text-[20px] lg:text-[22px] font-light text-neutral-900 mb-1 sm:mb-2 leading-tight">
                  Wishlist
                </h3>
                <p className="text-[14px] sm:text-[15px] font-light text-neutral-500 mb-4 sm:mb-6">
                  Fragrances to try next
                </p>
                <a
                  href="/collection/wishlist"
                  className="inline-block px-5 sm:px-6 py-2.5 sm:py-3 bg-neutral-900 text-white text-[11px] sm:text-[12px] font-normal tracking-[0.15em] uppercase hover:bg-neutral-800 transition-colors"
                >
                  View Wishlist
                </a>
              </div>
            </div>

            {/* Personal Collection */}
            <div className="bg-white border border-neutral-200 overflow-hidden sm:col-span-2 md:col-span-1">
              <div className="aspect-[16/10] bg-stone-100 overflow-hidden">
                <img
                  src="/collection-personal.jpg"
                  alt="Personal collection"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 sm:p-6 lg:p-8">
                <h3 className="font-serif text-[18px] sm:text-[20px] lg:text-[22px] font-light text-neutral-900 mb-1 sm:mb-2 leading-tight">
                  Personal Collection
                </h3>
                <p className="text-[14px] sm:text-[15px] font-light text-neutral-500 mb-4 sm:mb-6">
                  Your curated shelves
                </p>
                <a
                  href="/collection/personal"
                  className="inline-block px-5 sm:px-6 py-2.5 sm:py-3 bg-neutral-900 text-white text-[11px] sm:text-[12px] font-normal tracking-[0.15em] uppercase hover:bg-neutral-800 transition-colors"
                >
                  Browse Collection
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 6: FOOTER */}
      {/* ============================================ */}
      <footer className="bg-neutral-900 text-white py-10 sm:py-12 lg:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-14">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 mb-4 md:mb-0">
              <h4 className="font-serif text-[18px] sm:text-[20px] font-light mb-3 sm:mb-4">ScentlyMax</h4>
              <p className="text-[13px] sm:text-[14px] font-light text-neutral-400 leading-relaxed max-w-xs">
                Discover your next signature scent. Powered by AI-driven recommendations.
              </p>
            </div>

            {/* Explore links */}
            <div>
              <h5 className="text-[10px] sm:text-[11px] font-normal tracking-[0.2em] uppercase text-neutral-400 mb-4 sm:mb-6">
                Explore
              </h5>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a href="/finder" className="text-[14px] sm:text-[15px] font-light text-neutral-300 hover:text-white transition-colors">
                    Finder
                  </a>
                </li>
                <li>
                  <a href="/browse" className="text-[14px] sm:text-[15px] font-light text-neutral-300 hover:text-white transition-colors">
                    Browse
                  </a>
                </li>
                <li>
                  <a href="/collection" className="text-[14px] sm:text-[15px] font-light text-neutral-300 hover:text-white transition-colors">
                    Collection
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <h5 className="text-[10px] sm:text-[11px] font-normal tracking-[0.2em] uppercase text-neutral-400 mb-4 sm:mb-6">
                Legal
              </h5>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <span className="text-[14px] sm:text-[15px] font-light text-neutral-300">
                    Privacy
                  </span>
                </li>
                <li>
                  <span className="text-[14px] sm:text-[15px] font-light text-neutral-300">
                    Terms
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
