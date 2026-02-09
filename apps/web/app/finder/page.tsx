/**
 * Finder page — Tinder-style swipe interface for discovering fragrances.
 *
 * State Machine (v4 — seenIds dedupe + queue refill):
 *   Mount  → fetch 1 random bottle, mode="random", add to seenIds
 *   LIKE   → fetch candidates, DEDUPE against seenIds, consume first, mode="candidates"
 *   PASS in candidates, life unused → consume from queue (use life)
 *   PASS in candidates, life used   → BREAK cycle → fetch random
 *   PASS in random                  → fetch random
 *   REFILL → when queue < 10, fetch more candidates using lastLikedId, dedupe, append
 *
 * Key fix (v4): seenIds prevents showing duplicates within session.
 * Every shown bottle is added to seenIds. Candidates are filtered before use.
 */

'use client'

import { useReducer, useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { apiPost, ApiError } from '@/lib/api'
import { Fragrance } from '@/types/fragrance'
import { useFragranceModal } from '@/contexts/FragranceModalContext'
import { getAccordColor, formatDisplayText } from '@/lib/fragrance-colors'
import Navigation from '@/components/Navigation'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ============================================
// SWIPE ANIMATION CONFIG
// ============================================
type SwipeDirection = 'left' | 'right' | null

const SWIPE_THRESHOLD = 100 // pixels to trigger swipe on drag

const cardVariants = {
  enter: {
    opacity: 0,
    y: 20,
  },
  center: {
    opacity: 1,
    y: 0,
    x: 0,
    rotate: 0,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
  },
  exitLeft: {
    opacity: 0,
    x: -300,
    rotate: -15,
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as const },
  },
  exitRight: {
    opacity: 0,
    x: 300,
    rotate: 15,
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as const },
  },
}

// ============================================
// RESPONSE TYPES (from API_CONTRACT.md)
// ============================================
interface RandomBottlesResponse {
  count: number
  results: Fragrance[]
}

interface CandidatesResponse {
  seed_bottle_id: number
  count: number
  results: Fragrance[]
}

// ============================================
// REDUCER STATE MACHINE (v4 — seenIds dedupe)
// ============================================
type FinderMode = 'random' | 'candidates'

interface FinderState {
  currentBottle: Fragrance | null
  mode: FinderMode
  candidateQueue: Fragrance[]
  passLifeUsed: boolean
  lastLikedId: number | null
  seenIds: Record<number, true>  // Track all shown bottle_ids for dedupe
  loadingInitial: boolean
  actionBusy: boolean
}

const INITIAL_STATE: FinderState = {
  currentBottle: null,
  mode: 'random',
  candidateQueue: [],
  passLifeUsed: false,
  lastLikedId: null,
  seenIds: {},
  loadingInitial: true,
  actionBusy: false,
}

type FinderAction =
  | { type: 'INIT_DONE'; bottle: Fragrance | null }
  | { type: 'BUSY_ON' }
  | { type: 'BUSY_OFF' }
  | { type: 'LIKED'; nextBottle: Fragrance | null; queue: Fragrance[]; likedId: number }
  | { type: 'PASS_CONSUME'; nextBottle: Fragrance | null; queue: Fragrance[] }
  | { type: 'PASS_BREAK'; bottle: Fragrance | null }
  | { type: 'PASS_RANDOM'; bottle: Fragrance | null }
  | { type: 'REFILL_QUEUE'; additionalCandidates: Fragrance[] }

function finderReducer(state: FinderState, action: FinderAction): FinderState {
  switch (action.type) {
    case 'INIT_DONE': {
      const newSeenIds: Record<number, true> = {}
      if (action.bottle) newSeenIds[action.bottle.bottle_id] = true
      return { ...INITIAL_STATE, loadingInitial: false, currentBottle: action.bottle, seenIds: newSeenIds }
    }
    case 'BUSY_ON':
      return { ...state, actionBusy: true }
    case 'BUSY_OFF':
      return { ...state, actionBusy: false }
    case 'LIKED': {
      const newSeenIds = { ...state.seenIds }
      if (action.nextBottle) newSeenIds[action.nextBottle.bottle_id] = true
      return {
        ...state,
        currentBottle: action.nextBottle,
        mode: 'candidates',
        candidateQueue: action.queue,
        passLifeUsed: false,
        lastLikedId: action.likedId,
        seenIds: newSeenIds,
        actionBusy: false,
      }
    }
    case 'PASS_CONSUME': {
      const newSeenIds = { ...state.seenIds }
      if (action.nextBottle) newSeenIds[action.nextBottle.bottle_id] = true
      return {
        ...state,
        currentBottle: action.nextBottle,
        candidateQueue: action.queue,
        passLifeUsed: true,
        seenIds: newSeenIds,
        actionBusy: false,
      }
    }
    case 'PASS_BREAK': {
      const newSeenIds = { ...state.seenIds }
      if (action.bottle) newSeenIds[action.bottle.bottle_id] = true
      return {
        ...state,
        currentBottle: action.bottle,
        mode: 'random',
        candidateQueue: [],
        passLifeUsed: false,
        // Keep lastLikedId for potential refetch, keep seenIds
        seenIds: newSeenIds,
        actionBusy: false,
      }
    }
    case 'PASS_RANDOM': {
      const newSeenIds = { ...state.seenIds }
      if (action.bottle) newSeenIds[action.bottle.bottle_id] = true
      return { ...state, currentBottle: action.bottle, seenIds: newSeenIds, actionBusy: false }
    }
    case 'REFILL_QUEUE': {
      // Append new candidates to queue (already deduped by caller)
      const combined = [...state.candidateQueue, ...action.additionalCandidates]
      // Cap at 80 to prevent unbounded growth
      return { ...state, candidateQueue: combined.slice(0, 80) }
    }
    default:
      return state
  }
}

// ============================================
// COMPONENT
// ============================================
export default function FinderPage() {
  const { open: openModal } = useFragranceModal()
  const [state, dispatch] = useReducer(finderReducer, INITIAL_STATE)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const prevBottleIdRef = useRef<number | null>(null)

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
  // FETCH HELPERS (public endpoints, no auth)
  // ============================================
  const fetchRandom = useCallback(async (): Promise<Fragrance | null> => {
    const url = `${API_BASE_URL}/bottles/random?limit=1&_t=${Date.now()}`
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    })
    if (!res.ok) throw new Error(`Random fetch failed: ${res.status}`)
    const data: RandomBottlesResponse = await res.json()
    return data.results[0] || null
  }, [])

  const fetchCandidates = useCallback(async (seedId: number): Promise<Fragrance[]> => {
    const url = `${API_BASE_URL}/swipe/candidates?seed_bottle_id=${seedId}&_t=${Date.now()}`
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    })
    if (!res.ok) {
      console.warn('[FETCH] Candidates failed:', res.status)
      return []
    }
    const data: CandidatesResponse = await res.json()
    return data.results
  }, [])

  // ============================================
  // MOUNT: Fresh random bottle
  // ============================================
  useEffect(() => {
    const init = async () => {
      try {
        const bottle = await fetchRandom()
        console.log('[MOUNT] mode=random, passLifeUsed=false, fetched id:', bottle?.bottle_id)
        dispatch({ type: 'INIT_DONE', bottle })
      } catch (err) {
        console.error('[MOUNT] Failed:', err)
        dispatch({ type: 'INIT_DONE', bottle: null })
      }
    }
    init()
  }, [fetchRandom])

  // ============================================
  // SWIPE LOGGING (auth only, fire-and-forget)
  // ============================================
  const logSwipe = async (bottleId: number, action: 'like' | 'pass'): Promise<void> => {
    if (!isAuthenticated) return
    try {
      await apiPost('/swipes', { bottle_id: bottleId, action })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setIsAuthenticated(false)
      console.error('[SWIPE] Failed:', err)
    }
  }

  const addToFavorites = async (bottleId: number): Promise<void> => {
    if (!isAuthenticated) return
    try {
      await apiPost('/collections', { bottle_id: bottleId, collection_type: 'favorites' })
    } catch (err) {
      console.error('[FAVORITES] Failed:', err)
    }
  }

  // ============================================
  // DEDUPE HELPER
  // Filter out bottles already in seenIds
  // ============================================
  const dedupeBottles = useCallback((bottles: Fragrance[], seenIds: Record<number, true>, seedId?: number): Fragrance[] => {
    return bottles.filter(b => {
      if (seenIds[b.bottle_id]) return false
      if (seedId !== undefined && b.bottle_id === seedId) return false
      return true
    })
  }, [])

  // ============================================
  // LIKE HANDLER (v4 — with dedupe)
  // Fetch fresh candidates, dedupe against seenIds, consume queue.
  // ============================================
  const handleLike = async () => {
    if (!state.currentBottle || state.actionBusy) return

    // Check authentication - show prompt if not logged in
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }

    const bottleId = state.currentBottle.bottle_id
    const { seenIds } = state

    // Set animation direction BEFORE changing bottle
    setSwipeDirection('right')
    prevBottleIdRef.current = bottleId

    dispatch({ type: 'BUSY_ON' })

    logSwipe(bottleId, 'like')
    addToFavorites(bottleId)

    try {
      const rawCandidates = await fetchCandidates(bottleId)

      // DEBUG: Log raw fetch results
      console.log('[LIKE] Raw candidates fetched:', rawCandidates.length,
        'first10:', rawCandidates.slice(0, 10).map(b => b.bottle_id))

      // DEDUPE: Remove seen bottles and the seed itself
      const deduped = dedupeBottles(rawCandidates, seenIds, bottleId)
      console.log('[LIKE] After dedupe:', deduped.length, 'seenIds size:', Object.keys(seenIds).length)

      let nextBottle: Fragrance | null
      let queue: Fragrance[]

      if (deduped.length > 0) {
        nextBottle = deduped[0]
        queue = deduped.slice(1)
      } else {
        // Fallback to random if all candidates were seen
        console.log('[LIKE] All candidates seen, falling back to random')
        nextBottle = await fetchRandom()
        queue = []
      }

      console.log('[ANIM] direction=right, prev=' + bottleId + ', next=' + nextBottle?.bottle_id)
      console.log('[LIKE] RESULT: next=' + nextBottle?.bottle_id + ', queueLen=' + queue.length)
      dispatch({ type: 'LIKED', nextBottle, queue, likedId: bottleId })
    } catch (err) {
      console.error('[LIKE] Error:', err)
      setSwipeDirection(null)
      dispatch({ type: 'BUSY_OFF' })
    }
  }

  // ============================================
  // PASS HANDLER (v4 — consume queue, one-life rule)
  // candidates + life unused → consume from queue (use life)
  // candidates + life used   → BREAK cycle → random
  // random                   → fetch new random
  // PASS never re-fetches candidates; only LIKE does.
  // ============================================
  const handlePass = async () => {
    if (!state.currentBottle || state.actionBusy) return

    const bottleId = state.currentBottle.bottle_id
    const { mode, passLifeUsed, candidateQueue, seenIds } = state

    // Set animation direction BEFORE changing bottle
    setSwipeDirection('left')
    prevBottleIdRef.current = bottleId

    dispatch({ type: 'BUSY_ON' })
    logSwipe(bottleId, 'pass')

    try {
      if (mode === 'candidates') {
        if (!passLifeUsed) {
          // USE THE ONE LIFE — consume next from queue
          // Filter queue against seenIds in case of stale entries
          const validQueue = candidateQueue.filter(b => !seenIds[b.bottle_id])

          let nextBottle: Fragrance | null
          let queue: Fragrance[]

          if (validQueue.length > 0) {
            nextBottle = validQueue[0]
            queue = validQueue.slice(1)
            console.log('[PASS] Consuming from queue. queueLen before:', candidateQueue.length, 'after:', queue.length)
          } else {
            // Queue exhausted — break to random
            console.log('[PASS] Queue empty after dedupe, breaking to random')
            nextBottle = await fetchRandom()
            queue = []
          }

          console.log('[ANIM] direction=left, prev=' + bottleId + ', next=' + nextBottle?.bottle_id)
          console.log('[PASS] mode=candidates, life: false→true, next:', nextBottle?.bottle_id, 'queueLen:', queue.length)
          dispatch({ type: 'PASS_CONSUME', nextBottle, queue })
        } else {
          // LIFE ALREADY USED → BREAK CYCLE
          const randomBottle = await fetchRandom()
          console.log('[ANIM] direction=left, prev=' + bottleId + ', next=' + randomBottle?.bottle_id)
          console.log('[PASS] mode=candidates, life=used → BREAK, next:', randomBottle?.bottle_id)
          dispatch({ type: 'PASS_BREAK', bottle: randomBottle })
        }
      } else {
        // RANDOM MODE
        const randomBottle = await fetchRandom()
        console.log('[ANIM] direction=left, prev=' + bottleId + ', next=' + randomBottle?.bottle_id)
        console.log('[PASS] mode=random, next:', randomBottle?.bottle_id)
        dispatch({ type: 'PASS_RANDOM', bottle: randomBottle })
      }
    } catch (err) {
      console.error('[PASS] Error:', err)
      setSwipeDirection(null)
      dispatch({ type: 'BUSY_OFF' })
    }
  }

  // ============================================
  // QUEUE REFILL EFFECT
  // When in candidates mode and queue is low, fetch more candidates
  // ============================================
  useEffect(() => {
    const refillQueue = async () => {
      const { mode, candidateQueue, lastLikedId, seenIds, actionBusy } = state

      // Only refill in candidates mode, when queue is low, and we have a seed
      if (mode !== 'candidates' || candidateQueue.length >= 10 || !lastLikedId || actionBusy) {
        return
      }

      console.log('[REFILL] Queue low:', candidateQueue.length, 'fetching more from seed:', lastLikedId)

      try {
        const rawCandidates = await fetchCandidates(lastLikedId)
        const deduped = dedupeBottles(rawCandidates, seenIds, lastLikedId)

        console.log('[REFILL] Fetched:', rawCandidates.length, 'after dedupe:', deduped.length)

        if (deduped.length > 0) {
          dispatch({ type: 'REFILL_QUEUE', additionalCandidates: deduped })
        } else {
          console.log('[REFILL] No new candidates after dedupe, queue will exhaust naturally')
        }
      } catch (err) {
        console.error('[REFILL] Error:', err)
      }
    }

    refillQueue()
  }, [state.candidateQueue.length, state.mode, state.lastLikedId, state.actionBusy, fetchCandidates, dedupeBottles, state.seenIds])

  // ============================================
  // CARD CLICK: Open Modal
  // ============================================
  const handleCardClick = () => {
    if (state.currentBottle) openModal(state.currentBottle)
  }

  // ============================================
  // DRAG HANDLERS: Swipe gesture
  // ============================================
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (state.actionBusy) return

    const { offset } = info
    if (offset.x > SWIPE_THRESHOLD) {
      // Swiped right → Like
      console.log('[DRAG] threshold crossed: right → Like')
      handleLike()
    } else if (offset.x < -SWIPE_THRESHOLD) {
      // Swiped left → Pass
      console.log('[DRAG] threshold crossed: left → Pass')
      handlePass()
    }
    // If within threshold, card snaps back (handled by Framer Motion)
  }

  // ============================================
  // RENDER: Initial Loading (mount only)
  // ============================================
  if (state.loadingInitial) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navigation variant="solid" currentPath="/finder" />
        <div className="flex items-center justify-center py-32 sm:py-40">
          <p className="text-[14px] sm:text-[15px] font-light text-neutral-400">Loading fragrances...</p>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: Main Content
  // ============================================
  return (
    <div className="min-h-[100svh] bg-stone-50 flex flex-col">
      {/* Login prompt modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-neutral-200 p-6 sm:p-8 max-w-sm w-full text-center">
            <h3 className="font-serif text-[20px] sm:text-[24px] font-light text-neutral-900 mb-2 sm:mb-3">
              Log in to Like
            </h3>
            <p className="text-[13px] sm:text-[14px] font-light text-neutral-500 mb-5 sm:mb-6">
              Please log in to like fragrances and add them to your collections
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/signin"
                className="px-5 sm:px-6 py-2.5 bg-neutral-900 text-white text-[12px] sm:text-[13px] font-light hover:bg-neutral-800 transition-colors"
              >
                Log In
              </a>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="px-5 sm:px-6 py-2.5 border border-neutral-300 text-[12px] sm:text-[13px] font-light text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation variant="solid" currentPath="/finder" />

      <main className="flex-1 flex flex-col max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-14 py-4 sm:py-8 lg:py-12">
        <div className="text-center mb-4 sm:mb-8 lg:mb-12">
          <h2 className="font-serif text-[28px] sm:text-[36px] lg:text-[42px] font-light text-neutral-900 mb-2 sm:mb-4 leading-tight">Fragrance Finder</h2>
          <p className="text-[13px] sm:text-[15px] font-light text-neutral-500">
            {isAuthenticated ? 'Swipe to discover and save your favorites' : 'Log in to save your favorites'}
          </p>
        </div>

        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          <AnimatePresence mode="wait" initial={false}>
            {state.currentBottle ? (
              <motion.div
                key={state.currentBottle.bottle_id}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit={swipeDirection === 'right' ? 'exitRight' : 'exitLeft'}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                onAnimationComplete={() => setSwipeDirection(null)}
                className="cursor-grab active:cursor-grabbing touch-pan-y"
              >
                <button
                  onClick={handleCardClick}
                  className="w-full bg-white border border-neutral-200 p-4 sm:p-6 lg:p-8 text-left hover:border-neutral-300 transition-colors"
                >
                  <div className="text-center mb-3 sm:mb-4 lg:mb-6">
                    <h3 className="font-serif text-[22px] sm:text-[26px] lg:text-[32px] font-light text-neutral-900 mb-1 sm:mb-2 leading-tight line-clamp-2">
                      {formatDisplayText(state.currentBottle.name)}
                    </h3>
                    <p className="text-[11px] sm:text-[12px] lg:text-[13px] font-normal text-neutral-500 uppercase tracking-wider">
                      {formatDisplayText(state.currentBottle.brand)}
                    </p>
                  </div>

                  <div className="aspect-square sm:aspect-[3/4] bg-neutral-200 mb-4 sm:mb-6 lg:mb-8 relative">
                    {state.currentBottle.image_url ? (
                      <img
                        src={state.currentBottle.image_url}
                        alt={`${state.currentBottle.brand} ${state.currentBottle.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[12px] sm:text-[13px] font-light text-neutral-500 tracking-wider uppercase">SNIFTR</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <p className="text-[10px] sm:text-[11px] font-normal text-neutral-500 uppercase tracking-wider mb-2 sm:mb-3 text-center">MAIN ACCORDS</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                      {state.currentBottle.main_accords.slice(0, 4).map((accord, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] sm:text-[11px] font-normal px-2 sm:px-2.5 py-0.5 sm:py-1 ${getAccordColor(accord)}`}
                        >
                          {formatDisplayText(accord)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {state.currentBottle.rating_value && (
                    <div className="text-center mt-2 sm:mt-4">
                      <span className="text-[12px] sm:text-[13px] font-light text-neutral-500">
                        {state.currentBottle.rating_value.toFixed(1)} ★
                        {state.currentBottle.rating_count && ` (${state.currentBottle.rating_count.toLocaleString()})`}
                      </span>
                    </div>
                  )}

                  <p className="text-[10px] sm:text-[11px] font-light text-neutral-400 text-center mt-2 sm:mt-4">
                    Tap for details · Drag to swipe
                  </p>
                </button>
              </motion.div>
            ) : (
              <div className="bg-white border border-neutral-200 p-8 sm:p-12 lg:p-16 text-center">
                <h3 className="font-serif text-[22px] sm:text-[26px] lg:text-[28px] font-light text-neutral-900 mb-3 sm:mb-4 leading-tight">
                  No More Fragrances
                </h3>
                <p className="text-[14px] sm:text-[15px] font-light text-neutral-500 leading-relaxed mb-6 sm:mb-10 max-w-md mx-auto">
                  You&apos;ve gone through all available fragrances. Check back later for more discoveries.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <a
                    href="/browse"
                    className="px-6 sm:px-8 py-3 sm:py-3.5 bg-neutral-900 text-white text-[14px] sm:text-[15px] font-light hover:bg-neutral-800 transition-colors"
                  >
                    Explore Collection
                  </a>
                  <a
                    href="/collection"
                    className="px-6 sm:px-8 py-3 sm:py-3.5 border border-neutral-300 text-[14px] sm:text-[15px] font-light text-neutral-900 hover:bg-neutral-50 transition-colors"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Action buttons — outside AnimatePresence, disabled during async */}
          {state.currentBottle && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6 lg:mt-8 pb-4 sm:pb-0">
              <button
                onClick={handlePass}
                disabled={state.actionBusy}
                className={`min-h-[52px] sm:min-h-[56px] px-4 sm:px-8 py-3 sm:py-4 border border-neutral-300 text-[14px] sm:text-[15px] font-light text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100 transition-colors flex items-center justify-center gap-2 ${state.actionBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="sm:w-5 sm:h-5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Pass
              </button>
              <button
                onClick={handleLike}
                disabled={state.actionBusy}
                className={`min-h-[52px] sm:min-h-[56px] px-4 sm:px-8 py-3 sm:py-4 bg-neutral-900 text-white text-[14px] sm:text-[15px] font-light hover:bg-neutral-800 active:bg-neutral-700 transition-colors flex items-center justify-center gap-2 ${state.actionBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="sm:w-5 sm:h-5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Like
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
