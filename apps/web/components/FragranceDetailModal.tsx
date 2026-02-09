// components/FragranceDetailModal.tsx
'use client'

import { Fragrance } from '@/types/fragrance'
import { getAccordColor, getNoteEmoji, formatDisplayText } from '@/lib/fragrance-colors'
import { useCollections } from '@/contexts/CollectionsContext'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface FragranceDetailModalProps {
  fragrance: Fragrance | null
  isOpen: boolean
  onClose: () => void
  onLike?: (bottleId: number) => void
  onPass?: (bottleId: number) => void
}

export default function FragranceDetailModal({
  fragrance,
  isOpen,
  onClose,
  onLike,
  onPass,
}: FragranceDetailModalProps) {
  const { getStatus, fetchStatus, toggleFavorite, setCollection } = useCollections()
  const [status, setStatus] = useState({ favorites: false, wishlist: false, personal: false })
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // Check auth state
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

  // Fetch collection status when modal opens (only if authenticated)
  useEffect(() => {
    if (isOpen && fragrance && isAuthenticated) {
      fetchStatus(fragrance.bottle_id).then(setStatus)
    }
    if (!isOpen) {
      setDropdownOpen(false)
      setShowLoginPrompt(false)
    }
  }, [isOpen, fragrance, fetchStatus, isAuthenticated])

  // Sync with cache
  useEffect(() => {
    if (fragrance) {
      setStatus(getStatus(fragrance.bottle_id))
    }
  }, [getStatus, fragrance])

  const handleToggleFavorite = async () => {
    if (!fragrance) return
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }
    try {
      await toggleFavorite(fragrance.bottle_id)
      setStatus(prev => ({ ...prev, favorites: !prev.favorites }))
    } catch {
      // Error logged in context
    }
  }

  const handleToggleCollection = async (type: 'wishlist' | 'personal') => {
    if (!fragrance) return
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }
    const newValue = !status[type]
    try {
      await setCollection(type, fragrance.bottle_id, newValue)
      setStatus(prev => ({ ...prev, [type]: newValue }))
    } catch {
      // Error logged in context
    }
  }

  const handleCollectionsClick = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }
    setDropdownOpen(!dropdownOpen)
  }

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden' // Prevent background scroll
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !fragrance) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4"
      onClick={onClose} // Click outside to close
    >
      <div
        className="relative w-full sm:max-w-xl lg:max-w-2xl overflow-hidden bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 sm:right-4 top-3 sm:top-4 z-10 flex h-8 w-8 sm:h-8 sm:w-8 items-center justify-center bg-white/90 text-gray-600 shadow-md hover:bg-white transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Scrollable content */}
        <div className="max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          {/* Image */}
          <div className="relative aspect-square w-full bg-gray-100">
            {fragrance.image_url ? (
              <Image
                src={fragrance.image_url}
                alt={`${fragrance.brand} ${fragrance.name}`}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-sm tracking-widest text-gray-400">
                  SNIFTR
                </span>
              </div>
            )}

            {/* Gender badge overlay */}
            {fragrance.gender && (
              <span className={`absolute right-4 top-4 px-3 py-1.5 text-sm ${
                fragrance.gender.toLowerCase() === 'women'
                  ? 'bg-pink-100 text-pink-700'
                  : fragrance.gender.toLowerCase() === 'unisex'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {formatDisplayText(fragrance.gender)}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            {/* Name row with heart */}
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-tight text-gray-900">
                {formatDisplayText(fragrance.name)}
              </h2>
              <button
                onClick={handleToggleFavorite}
                className="flex-shrink-0 flex h-10 w-10 sm:h-10 sm:w-10 items-center justify-center border border-gray-200 text-lg sm:text-xl transition-colors hover:bg-gray-50"
                aria-label={status.favorites ? 'Remove from Favorites' : 'Add to Favorites'}
                title={status.favorites ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                {status.favorites ? '♥' : '♡'}
              </button>
            </div>

            {/* Brand */}
            <p className="text-base sm:text-lg text-gray-600">
              by {formatDisplayText(fragrance.brand)}
            </p>

            {/* Meta row: Year, Rating */}
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
              {fragrance.year && (
                <div>
                  <span className="text-gray-500">Year</span>
                  <p className="font-semibold text-gray-900">{fragrance.year}</p>
                </div>
              )}
              {fragrance.rating_value && (
                <div>
                  <span className="text-gray-500">Rating</span>
                  <p className="font-semibold text-gray-900">
                    ⭐ {fragrance.rating_value.toFixed(1)}
                  </p>
                </div>
              )}
              {fragrance.gender && (
                <div>
                  <span className="text-gray-500">For</span>
                  <p className="font-semibold text-gray-900 capitalize">
                    {formatDisplayText(fragrance.gender)}
                  </p>
                </div>
              )}
            </div>

            {/* Main Accords */}
            {fragrance.main_accords && fragrance.main_accords.length > 0 && (
              <div>
                <h3 className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-semibold tracking-widest text-gray-500 uppercase">
                  Main Accords
                </h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {fragrance.main_accords.map((accord, idx) => (
                    <span
                      key={idx}
                      className={`px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm capitalize ${getAccordColor(accord)}`}
                    >
                      {formatDisplayText(accord.toLowerCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes: Top / Middle / Base */}
            {fragrance.notes && (
              <div className="space-y-4 sm:space-y-6 border-t pt-4 sm:pt-6">
                {/* Top Notes */}
                {fragrance.notes.top && fragrance.notes.top.length > 0 && (
                  <div>
                    <h4 className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-semibold tracking-widest text-gray-500 uppercase">
                      Top Notes
                    </h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {fragrance.notes.top.map((note, idx) => {
                        const emoji = getNoteEmoji(note)
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-neutral-200 text-neutral-700"
                          >
                            {emoji && <span className="text-base sm:text-lg">{emoji}</span>}
                            {formatDisplayText(note)}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Middle Notes */}
                {fragrance.notes.middle && fragrance.notes.middle.length > 0 && (
                  <div>
                    <h4 className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-semibold tracking-widest text-gray-500 uppercase">
                      Middle Notes
                    </h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {fragrance.notes.middle.map((note, idx) => {
                        const emoji = getNoteEmoji(note)
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-neutral-200 text-neutral-700"
                          >
                            {emoji && <span className="text-base sm:text-lg">{emoji}</span>}
                            {formatDisplayText(note)}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Base Notes */}
                {fragrance.notes.base && fragrance.notes.base.length > 0 && (
                  <div>
                    <h4 className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-semibold tracking-widest text-gray-500 uppercase">
                      Base Notes
                    </h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {fragrance.notes.base.map((note, idx) => {
                        const emoji = getNoteEmoji(note)
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-neutral-200 text-neutral-700"
                          >
                            {emoji && <span className="text-base sm:text-lg">{emoji}</span>}
                            {formatDisplayText(note)}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons (fixed at bottom) */}
        <div className="border-t bg-white p-4 sm:p-6 space-y-3">
          {/* Login prompt */}
          {showLoginPrompt && (
            <div className="bg-neutral-50 border border-neutral-200 p-3 sm:p-4 mb-3">
              <p className="text-[13px] sm:text-[14px] font-light text-neutral-700 mb-3 text-center">
                Please log in to add fragrances to your collections
              </p>
              <div className="flex gap-2 sm:gap-3 justify-center">
                <a
                  href="/signin"
                  className="px-4 sm:px-6 py-2.5 bg-neutral-900 text-white text-[12px] sm:text-[13px] font-light hover:bg-neutral-800 transition-colors"
                >
                  Log In
                </a>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="px-4 sm:px-6 py-2.5 border border-neutral-300 text-[12px] sm:text-[13px] font-light text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add to collections dropdown */}
          <div className="relative">
            <button
              onClick={handleCollectionsClick}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Add to Collections
              <span className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {dropdownOpen && isAuthenticated && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 shadow-lg">
                <button
                  onClick={() => handleToggleCollection('wishlist')}
                  className="w-full flex items-center justify-between px-3 sm:px-4 py-3 text-xs sm:text-sm text-left hover:bg-gray-50 transition-colors"
                >
                  <span>Wishlist</span>
                  <span className="text-base sm:text-lg">{status.wishlist ? '✓' : ''}</span>
                </button>
                <button
                  onClick={() => handleToggleCollection('personal')}
                  className="w-full flex items-center justify-between px-3 sm:px-4 py-3 text-xs sm:text-sm text-left hover:bg-gray-50 transition-colors border-t border-gray-100"
                >
                  <span>Personal Collection</span>
                  <span className="text-base sm:text-lg">{status.personal ? '✓' : ''}</span>
                </button>
              </div>
            )}
          </div>

          {/* Pass/Like buttons (if provided) */}
          {(onLike || onPass) && (
            <div className="flex gap-2 sm:gap-3">
              {onPass && (
                <button
                  onClick={() => {
                    onPass(fragrance.bottle_id)
                    onClose()
                  }}
                  className="flex-1 border border-gray-300 py-3 text-xs sm:text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  ✕ Pass
                </button>
              )}
              {onLike && (
                <button
                  onClick={() => {
                    onLike(fragrance.bottle_id)
                    onClose()
                  }}
                  className="flex-1 bg-black py-3 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  ♥ Like
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
