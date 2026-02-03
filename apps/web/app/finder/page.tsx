/**
 * Finder page - Tinder-style swipe interface for discovering fragrances.
 *
 * State Machine (v2):
 * - Mount: Always fetch 1 random bottle (fresh start, ignore localStorage)
 * - LIKE: Immediately fetch candidates, replace queue, show personalized next
 * - PASS: "One try" rule - if we have a recent like, try candidates once, then random
 *
 * Features:
 * - Immediate personalization after first LIKE (no waiting for queue exhaustion)
 * - Like/Pass buttons that log to POST /swipes (when authenticated)
 * - Auto-adds to favorites on Like via POST /collections
 * - Card click opens FragranceDetailModal for full details
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { apiPost, ApiError } from '@/lib/api'
import { Fragrance } from '@/types/fragrance'
import { useFragranceModal } from '@/contexts/FragranceModalContext'
import { getAccordColor, formatDisplayText } from '@/lib/fragrance-colors'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const LOCALSTORAGE_KEY = 'scentlymax_lastLikedBottleId'

interface RandomBottlesResponse {
  count: number
  results: Fragrance[]
}

interface CandidatesResponse {
  seed_bottle_id: number
  count: number
  results: Fragrance[]
}

export default function FinderPage() {
  const { open: openModal } = useFragranceModal()

  // ============================================
  // NEW STATE MODEL (v2)
  // ============================================
  // The single bottle currently displayed to the user
  const [currentBottle, setCurrentBottle] = useState<Fragrance | null>(null)
  // Queue of ML-similar candidates (filled after LIKE)
  const [candidateQueue, setCandidateQueue] = useState<Fragrance[]>([])
  // The bottle ID the user liked this session (used as seed for candidates)
  const [lastLikedThisSession, setLastLikedThisSession] = useState<number | null>(null)
  // "One try" flag: have we already tried fetching candidates after a PASS?
  const [hasTriedCandidatesThisSession, setHasTriedCandidatesThisSession] = useState(false)
  // Track all swiped bottle IDs to avoid showing duplicates
  const [swipedIds, setSwipedIds] = useState<Set<number>>(new Set())

  // UI states
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ============================================
  // AUTH CHECK
  // ============================================
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session?.access_token)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.access_token)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ============================================
  // API FETCHERS
  // ============================================

  // Fetch a single random bottle for fresh start
  // CRITICAL: cache: 'no-store' + timestamp + next.revalidate prevents ALL caching
  const fetchRandomBottle = useCallback(async (): Promise<Fragrance | null> => {
    const url = `${API_BASE_URL}/bottles/random?limit=1&_t=${Date.now()}`
    console.log('[FETCH] GET random', url)
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      next: { revalidate: 0 }
    } as RequestInit)
    if (!response.ok) throw new Error('Failed to fetch random bottle')
    const data: RandomBottlesResponse = await response.json()
    console.log('[FETCH] Got random bottle:', data.results[0]?.bottle_id, data.results[0]?.name)
    return data.results[0] || null
  }, [])

  // Fetch personalized candidates based on seed bottle
  // CRITICAL: cache: 'no-store' + timestamp prevents ALL caching
  const fetchCandidates = useCallback(async (seedBottleId: number): Promise<Fragrance[]> => {
    const url = `${API_BASE_URL}/swipe/candidates?seed_bottle_id=${seedBottleId}&_t=${Date.now()}`
    console.log('[FETCH] GET candidates', url)
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      next: { revalidate: 0 }
    } as RequestInit)
    if (!response.ok) {
      console.warn('Candidates fetch failed')
      return []
    }
    const data: CandidatesResponse = await response.json()
    console.log('[FETCH] Got', data.results.length, 'candidates')
    return data.results
  }, [])

  // ============================================
  // MOUNT: FRESH START WITH RANDOM BOTTLE
  // ============================================
  // Always fetch 1 random bottle on mount, ignoring localStorage.
  // CRITICAL: Explicitly reset ALL session state to ensure fresh experience
  // even with client-side navigation, back/forward, or fast refresh.
  useEffect(() => {
    const initWithRandomBottle = async () => {
      // EXPLICIT RESET: Clear all session state on every mount
      setCandidateQueue([])
      setLastLikedThisSession(null)
      setHasTriedCandidatesThisSession(false)
      setSwipedIds(new Set())

      // DEBUG: Log mount state
      console.log('[FINDER MOUNT] Resetting state and fetching random bottle...')

      setLoading(true)
      try {
        const bottle = await fetchRandomBottle()
        // DEBUG: Log fetched bottle
        console.log('[FINDER MOUNT] Fetched bottle:', bottle?.bottle_id, bottle?.name)
        if (bottle) {
          setCurrentBottle(bottle)
        }
      } catch (err) {
        console.error('Failed to fetch initial bottle:', err)
      } finally {
        setLoading(false)
      }
    }

    initWithRandomBottle()
  }, [fetchRandomBottle])

  // ============================================
  // SWIPE LOGGING (authenticated only)
  // ============================================
  const logSwipe = async (bottleId: number, action: 'like' | 'pass') => {
    if (!isAuthenticated) return

    try {
      await apiPost('/swipes', { bottle_id: bottleId, action })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setIsAuthenticated(false)
      }
      console.error('Failed to log swipe:', err)
    }
  }

  // ============================================
  // ADD TO FAVORITES (authenticated only)
  // ============================================
  const addToFavorites = async (bottleId: number) => {
    if (!isAuthenticated) return

    try {
      await apiPost('/collections', { bottle_id: bottleId, collection_type: 'favorites' })
    } catch (err) {
      console.error('Failed to add to favorites:', err)
    }
  }

  // ============================================
  // HELPER: Filter out already-swiped bottles
  // ============================================
  const filterSwiped = useCallback((bottles: Fragrance[], alreadySwiped: Set<number>): Fragrance[] => {
    return bottles.filter(b => !alreadySwiped.has(b.bottle_id))
  }, [])

  // ============================================
  // LIKE HANDLER: Immediate Personalization
  // ============================================
  // When user likes a bottle:
  // 1. Log swipe + add to favorites (fire and forget)
  // 2. Update localStorage seed (for cross-session persistence)
  // 3. Set lastLikedThisSession (for immediate candidate fetching)
  // 4. Fetch candidates immediately using this bottle as seed
  // 5. Replace candidateQueue with fresh candidates
  // 6. Show next personalized bottle immediately
  // 7. Reset hasTriedCandidatesThisSession (new like = new try allowance)
  const handleLike = async () => {
    if (!currentBottle) return

    // DEBUG: Log handler entry
    console.log('[LIKE HANDLER] Fired for bottle:', currentBottle.bottle_id, currentBottle.name)

    const likedBottleId = currentBottle.bottle_id
    const newSwipedIds = new Set([...swipedIds, likedBottleId])

    // Mark as swiped
    setSwipedIds(newSwipedIds)

    // Fire and forget: log swipe + add to favorites
    logSwipe(likedBottleId, 'like')
    addToFavorites(likedBottleId)

    // Persist to localStorage for cross-session use (though we don't use it on mount)
    localStorage.setItem(LOCALSTORAGE_KEY, likedBottleId.toString())

    // Update session state
    setLastLikedThisSession(likedBottleId)
    setHasTriedCandidatesThisSession(false) // Reset the "one try" flag

    // Show loading state
    setLoading(true)

    try {
      // Fetch candidates immediately using the liked bottle as seed
      console.log('[LIKE HANDLER] Fetching candidates for seed:', likedBottleId)
      const candidates = await fetchCandidates(likedBottleId)
      const filtered = filterSwiped(candidates, newSwipedIds)
      console.log('[LIKE HANDLER] Got', filtered.length, 'candidates after filter')

      if (filtered.length > 0) {
        // Pop first candidate as next bottle, rest goes to queue
        const [nextBottle, ...rest] = filtered
        console.log('[LIKE HANDLER] Showing candidate:', nextBottle.bottle_id, nextBottle.name)
        setCurrentBottle(nextBottle)
        setCandidateQueue(rest)
      } else {
        // No candidates available, fall back to random
        console.log('[LIKE HANDLER] No candidates, falling back to random')
        const randomBottle = await fetchRandomBottle()
        setCurrentBottle(randomBottle)
        setCandidateQueue([])
      }
    } catch (err) {
      console.error('Failed to fetch candidates after like:', err)
      // Fall back to random
      try {
        const randomBottle = await fetchRandomBottle()
        setCurrentBottle(randomBottle)
        setCandidateQueue([])
      } catch {
        setCurrentBottle(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // PASS HANDLER: "One Try Then Reset" Rule
  // ============================================
  // When user passes on a bottle:
  // 1) If candidateQueue has items → pop next candidate
  // 2) Else if lastLikedThisSession AND !hasTriedCandidatesThisSession:
  //    - Fetch candidates ONCE using lastLikedThisSession as seed
  //    - Set hasTriedCandidatesThisSession = true
  //    - Show next candidate from results
  // 3) Else → RESET CYCLE:
  //    - Fetch new random bottle
  //    - Clear candidateQueue, lastLikedThisSession, hasTriedCandidatesThisSession
  const handlePass = async () => {
    if (!currentBottle) return

    // DEBUG: Log handler entry and state
    console.log('[PASS HANDLER] Fired for bottle:', currentBottle.bottle_id, currentBottle.name)
    console.log('[PASS HANDLER] State:', {
      candidateQueueLength: candidateQueue.length,
      lastLikedThisSession,
      hasTriedCandidatesThisSession
    })

    const passedBottleId = currentBottle.bottle_id
    const newSwipedIds = new Set([...swipedIds, passedBottleId])

    // Mark as swiped
    setSwipedIds(newSwipedIds)

    // Fire and forget: log swipe
    logSwipe(passedBottleId, 'pass')

    // Show loading state
    setLoading(true)

    try {
      // Check if we have items in candidateQueue first
      const availableInQueue = filterSwiped(candidateQueue, newSwipedIds)

      if (availableInQueue.length > 0) {
        // Still have candidates in queue, pop next one
        console.log('[PASS HANDLER] Branch: Popping from queue')
        const [nextBottle, ...rest] = availableInQueue
        setCurrentBottle(nextBottle)
        setCandidateQueue(rest)
      } else if (lastLikedThisSession && !hasTriedCandidatesThisSession) {
        // "One Try" Rule: We have a recent like and haven't tried candidates yet
        // Give the recommender one try to find something the user likes
        console.log('[PASS HANDLER] Branch: One Try - fetching candidates for seed', lastLikedThisSession)
        setHasTriedCandidatesThisSession(true)

        const candidates = await fetchCandidates(lastLikedThisSession)
        const filtered = filterSwiped(candidates, newSwipedIds)
        console.log('[PASS HANDLER] One Try - got', filtered.length, 'candidates after filter')

        if (filtered.length > 0) {
          const [nextBottle, ...rest] = filtered
          console.log('[PASS HANDLER] One Try - showing candidate:', nextBottle.bottle_id, nextBottle.name)
          setCurrentBottle(nextBottle)
          setCandidateQueue(rest)
        } else {
          // No candidates, fall back to random
          console.log('[PASS HANDLER] One Try - no candidates, falling back to random')
          const randomBottle = await fetchRandomBottle()
          setCurrentBottle(randomBottle)
          setCandidateQueue([])
        }
      } else {
        // RESET CYCLE: No recent like OR already tried candidates
        // Must reset ALL session state for fresh discovery
        console.log('[PASS HANDLER] Branch: RESET CYCLE - fetching new random bottle')
        const randomBottle = await fetchRandomBottle()
        console.log('[PASS HANDLER] RESET - got bottle:', randomBottle?.bottle_id, randomBottle?.name)
        setCurrentBottle(randomBottle)
        setCandidateQueue([])
        setHasTriedCandidatesThisSession(false)
        setLastLikedThisSession(null)
      }
    } catch (err) {
      console.error('Failed to get next bottle after pass:', err)
      try {
        const randomBottle = await fetchRandomBottle()
        setCurrentBottle(randomBottle)
        setCandidateQueue([])
      } catch {
        setCurrentBottle(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // CARD CLICK: Open Modal
  // ============================================
  const handleCardClick = () => {
    if (currentBottle) {
      openModal(currentBottle)
    }
  }

  // ============================================
  // RENDER: Loading State
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <nav className="bg-white border-b border-neutral-200">
          <div className="max-w-[1400px] mx-auto px-8 lg:px-14">
            <div className="flex justify-between items-center h-[72px]">
              <h1 className="font-serif text-[15px] font-normal text-neutral-900 tracking-[0.3em] uppercase">FRAGRANCE</h1>
              <div className="flex items-center gap-10">
                <a href="/finder" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition underline underline-offset-4">Finder</a>
                <a href="/browse" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition">Explore</a>
                <a href="/collection" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition">Profile</a>
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
        <div className="flex items-center justify-center py-40">
          <p className="text-[15px] font-light text-neutral-400">Loading fragrances...</p>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: Main Content
  // ============================================
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation bar */}
      <nav className="bg-white border-b border-neutral-200">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-14">
          <div className="flex justify-between items-center h-[72px]">
            <h1 className="font-serif text-[15px] font-normal text-neutral-900 tracking-[0.3em] uppercase">FRAGRANCE</h1>
            <div className="flex items-center gap-10">
              <a href="/finder" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition underline underline-offset-4">Finder</a>
              <a href="/browse" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition">Explore</a>
              <a href="/collection" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition">Profile</a>
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
        {/* Page header */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-[42px] font-light text-neutral-900 mb-4 leading-tight">Fragrance Finder</h2>
          <p className="text-[15px] font-light text-neutral-500">
            {isAuthenticated ? 'Swipe to discover and save your favorites' : 'Log in to save your favorites'}
          </p>
        </div>

        {/* Centered fragrance card */}
        <div className="max-w-md mx-auto">
          {currentBottle ? (
            <>
              <button
                onClick={handleCardClick}
                className="w-full bg-white border border-neutral-200 p-8 text-left hover:border-neutral-300 transition-colors"
              >
                {/* Fragrance name and brand at top */}
                <div className="text-center mb-6">
                  <h3 className="font-serif text-[32px] font-light text-neutral-900 mb-2 leading-tight">
                    {formatDisplayText(currentBottle.name)}
                  </h3>
                  <p className="text-[13px] font-normal text-neutral-500 uppercase tracking-wider">
                    {formatDisplayText(currentBottle.brand)}
                  </p>
                </div>

                {/* Fragrance image */}
                <div className="aspect-[3/4] bg-neutral-200 mb-8 relative">
                  {currentBottle.image_url ? (
                    <img
                      src={currentBottle.image_url}
                      alt={`${currentBottle.brand} ${currentBottle.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[13px] font-light text-neutral-500 tracking-wider uppercase">FRAGRANCE</span>
                    </div>
                  )}
                </div>

                {/* Main accords section */}
                <div className="mb-4">
                  <p className="text-[11px] font-normal text-neutral-500 uppercase tracking-wider mb-3 text-center">MAIN ACCORDS</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {currentBottle.main_accords.slice(0, 5).map((accord, idx) => (
                      <span
                        key={idx}
                        className={`text-[11px] font-normal px-2.5 py-1 ${getAccordColor(accord)}`}
                      >
                        {formatDisplayText(accord)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rating if available */}
                {currentBottle.rating_value && (
                  <div className="text-center mt-4">
                    <span className="text-[13px] font-light text-neutral-500">
                      {currentBottle.rating_value.toFixed(1)} ★
                      {currentBottle.rating_count && ` (${currentBottle.rating_count.toLocaleString()})`}
                    </span>
                  </div>
                )}

                <p className="text-[11px] font-light text-neutral-400 text-center mt-4">
                  Tap for details
                </p>
              </button>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button
                  onClick={handlePass}
                  className="px-8 py-4 border border-neutral-300 text-[15px] font-light text-neutral-900 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Pass
                </button>
                <button
                  onClick={handleLike}
                  className="px-8 py-4 bg-neutral-900 text-white text-[15px] font-light hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  Like
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white border border-neutral-200 p-16 text-center">
              <h3 className="font-serif text-[28px] font-light text-neutral-900 mb-4 leading-tight">
                No More Fragrances
              </h3>
              <p className="text-[15px] font-light text-neutral-500 leading-relaxed mb-10 max-w-md mx-auto">
                You&apos;ve gone through all available fragrances. Check back later for more discoveries.
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="/browse"
                  className="px-8 py-3.5 bg-neutral-900 text-white text-[15px] font-light hover:bg-neutral-800 transition-colors"
                >
                  Explore Collection
                </a>
                <a
                  href="/collection"
                  className="px-8 py-3.5 border border-neutral-300 text-[15px] font-light text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  View Profile
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
