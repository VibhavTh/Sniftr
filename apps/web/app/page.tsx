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
import { apiGet } from '@/lib/api'
import { Fragrance } from '@/types/fragrance'
import FragranceCard from '@/components/FragranceCard'
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
        const data = await apiGet<BottlesResponse>('/bottles?limit=8&page=1')
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
      <nav className="absolute top-0 left-0 right-0 z-20">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-14">
          <div className="flex justify-between items-center h-[72px]">
            <a href="/" className="font-serif text-[15px] font-normal text-white tracking-[0.3em] uppercase">
              SNIFTR
            </a>
            <div className="flex items-center gap-10">
              <a href="/" className="text-[15px] font-light text-white/90 hover:text-white transition underline underline-offset-4">
                Home
              </a>
              <a href="/finder" className="text-[15px] font-light text-white/90 hover:text-white transition">
                Finder
              </a>
              <a href="/browse" className="text-[15px] font-light text-white/90 hover:text-white transition">
                Explore
              </a>
              <a href="/collection" className="text-[15px] font-light text-white/90 hover:text-white transition">
                Collection
              </a>
            </div>
            <a href="/signin" className="w-8 h-8 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </a>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* SECTION 1: HERO */}
      {/* ============================================ */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/scently_max_homepage_header.jpeg)',
          }}
        />
        <div className="absolute inset-0 bg-black/30" />

        {/* Hero content */}
        <div className="relative z-10 text-center px-8 max-w-3xl mx-auto">
          <h1 className="font-serif text-[56px] md:text-[72px] font-light text-white leading-[1.1] mb-6">
            Discover scents<br />made for you.
          </h1>
          <p className="text-[17px] font-light text-white/80 leading-relaxed mb-12 max-w-lg mx-auto">
            Swipe, save favorites, and build your collection — powered by a content-based recommender.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/finder"
              className="px-10 py-4 bg-neutral-900 text-white text-[13px] font-normal tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors"
            >
              Start Finding
            </a>
            <a
              href="/browse"
              className="px-10 py-4 border border-white/60 text-white text-[13px] font-normal tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
            >
              Browse Fragrances
            </a>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 2: PRIMARY NAV CARDS */}
      {/* ============================================ */}
      <section className="bg-stone-100 py-24">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Fragrance Finder */}
            <div className="bg-white border border-neutral-200 p-10">
              <div className="mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-neutral-400">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <h3 className="font-serif text-[24px] font-light text-neutral-900 mb-3 leading-tight">
                Fragrance Finder
              </h3>
              <p className="text-[15px] font-light text-neutral-500 leading-relaxed mb-8">
                Swipe through scents and train your taste.
              </p>
              <a
                href="/finder"
                className="text-[13px] font-normal text-neutral-900 tracking-wider uppercase hover:text-neutral-600 transition-colors"
              >
                Explore &rarr;
              </a>
            </div>

            {/* Explore Catalog */}
            <div className="bg-white border border-neutral-200 p-10">
              <div className="mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-neutral-400">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <h3 className="font-serif text-[24px] font-light text-neutral-900 mb-3 leading-tight">
                Explore Catalog
              </h3>
              <p className="text-[15px] font-light text-neutral-500 leading-relaxed mb-8">
                Browse the full library with filters.
              </p>
              <a
                href="/browse"
                className="text-[13px] font-normal text-neutral-900 tracking-wider uppercase hover:text-neutral-600 transition-colors"
              >
                Explore &rarr;
              </a>
            </div>

            {/* Your Collection */}
            <div className="bg-white border border-neutral-200 p-10">
              <div className="mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-neutral-400">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <h3 className="font-serif text-[24px] font-light text-neutral-900 mb-3 leading-tight">
                Your Collection
              </h3>
              <p className="text-[15px] font-light text-neutral-500 leading-relaxed mb-8">
                Favorites, wishlist, and personal shelves.
              </p>
              <a
                href="/collection"
                className="text-[13px] font-normal text-neutral-900 tracking-wider uppercase hover:text-neutral-600 transition-colors"
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
        <section className="bg-stone-50 py-24">
          <div className="max-w-[1400px] mx-auto px-8 lg:px-14">
            <div className="flex justify-between items-end mb-14">
              <h2 className="font-serif text-[36px] font-light text-neutral-900 leading-tight">
                Trending right now
              </h2>
              <a
                href="/browse"
                className="text-[13px] font-normal text-neutral-900 tracking-wider uppercase hover:text-neutral-600 transition-colors"
              >
                View all &rarr;
              </a>
            </div>

            {/* Horizontal scroll container */}
            <div className="flex gap-8 overflow-x-auto pb-4 -mx-2 px-2" style={{ scrollbarWidth: 'none' }}>
              {trending.map((bottle) => (
                <div key={bottle.bottle_id} className="flex-shrink-0 w-[260px]">
                  <FragranceCard fragrance={bottle} onOpen={openModal} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/* SECTION 4: VALUE STATEMENT / MID CTA */}
      {/* ============================================ */}
      <section className="bg-stone-200 py-28">
        <div className="max-w-[800px] mx-auto px-8 text-center">
          <h2 className="font-serif text-[42px] md:text-[52px] font-light text-neutral-900 leading-tight mb-6">
            Build your scent wardrobe.
          </h2>
          <p className="text-[17px] font-light text-neutral-500 leading-relaxed mb-12 max-w-lg mx-auto">
            Save what you love. Revisit later. Let the recommender refine your next picks.
          </p>
          <a
            href="/collection/favorites"
            className="inline-block px-10 py-4 bg-neutral-900 text-white text-[13px] font-normal tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors"
          >
            View Favorites
          </a>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 5: YOUR LIBRARY */}
      {/* ============================================ */}
      <section className="bg-stone-50 py-24">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-14">
          <h2 className="font-serif text-[36px] font-light text-neutral-900 leading-tight mb-14 text-center">
            Your Library
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Favorites */}
            <div className="bg-white border border-neutral-200 overflow-hidden">
              <div className="aspect-[16/10] bg-stone-100 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75" className="text-neutral-300">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <div className="p-8">
                <h3 className="font-serif text-[22px] font-light text-neutral-900 mb-2 leading-tight">
                  Favorites
                </h3>
                <p className="text-[15px] font-light text-neutral-500 mb-6">
                  Scents you&apos;ve loved
                </p>
                <a
                  href="/collection/favorites"
                  className="inline-block px-6 py-3 bg-neutral-900 text-white text-[12px] font-normal tracking-[0.15em] uppercase hover:bg-neutral-800 transition-colors"
                >
                  View Favorites
                </a>
              </div>
            </div>

            {/* Wishlist */}
            <div className="bg-white border border-neutral-200 overflow-hidden">
              <div className="aspect-[16/10] bg-stone-100 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75" className="text-neutral-300">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div className="p-8">
                <h3 className="font-serif text-[22px] font-light text-neutral-900 mb-2 leading-tight">
                  Wishlist
                </h3>
                <p className="text-[15px] font-light text-neutral-500 mb-6">
                  Fragrances to try next
                </p>
                <a
                  href="/collection/wishlist"
                  className="inline-block px-6 py-3 bg-neutral-900 text-white text-[12px] font-normal tracking-[0.15em] uppercase hover:bg-neutral-800 transition-colors"
                >
                  View Wishlist
                </a>
              </div>
            </div>

            {/* Personal Collection */}
            <div className="bg-white border border-neutral-200 overflow-hidden">
              <div className="aspect-[16/10] bg-stone-100 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75" className="text-neutral-300">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div className="p-8">
                <h3 className="font-serif text-[22px] font-light text-neutral-900 mb-2 leading-tight">
                  Personal Collection
                </h3>
                <p className="text-[15px] font-light text-neutral-500 mb-6">
                  Your curated shelves
                </p>
                <a
                  href="/collection/personal"
                  className="inline-block px-6 py-3 bg-neutral-900 text-white text-[12px] font-normal tracking-[0.15em] uppercase hover:bg-neutral-800 transition-colors"
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
      <footer className="bg-neutral-900 text-white py-16">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Brand */}
            <div>
              <h4 className="font-serif text-[20px] font-light mb-4">ScentlyMax</h4>
              <p className="text-[14px] font-light text-neutral-400 leading-relaxed max-w-xs">
                Discover your next signature scent. Powered by AI-driven recommendations.
              </p>
            </div>

            {/* Explore links */}
            <div>
              <h5 className="text-[11px] font-normal tracking-[0.2em] uppercase text-neutral-400 mb-6">
                Explore
              </h5>
              <ul className="space-y-3">
                <li>
                  <a href="/finder" className="text-[15px] font-light text-neutral-300 hover:text-white transition-colors">
                    Finder
                  </a>
                </li>
                <li>
                  <a href="/browse" className="text-[15px] font-light text-neutral-300 hover:text-white transition-colors">
                    Browse
                  </a>
                </li>
                <li>
                  <a href="/collection" className="text-[15px] font-light text-neutral-300 hover:text-white transition-colors">
                    Collection
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <h5 className="text-[11px] font-normal tracking-[0.2em] uppercase text-neutral-400 mb-6">
                Legal
              </h5>
              <ul className="space-y-3">
                <li>
                  <span className="text-[15px] font-light text-neutral-300">
                    Privacy
                  </span>
                </li>
                <li>
                  <span className="text-[15px] font-light text-neutral-300">
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
