// contexts/CollectionsContext.tsx
'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { apiGet, apiPost, apiDelete, ApiError } from '@/lib/api'

type CollectionType = 'favorites' | 'wishlist' | 'personal'

interface CollectionStatus {
  favorites: boolean
  wishlist: boolean
  personal: boolean
}

interface CollectionsContextType {
  getStatus: (bottleId: number) => CollectionStatus
  fetchStatus: (bottleId: number) => Promise<CollectionStatus>
  toggleFavorite: (bottleId: number) => Promise<void>
  setCollection: (type: CollectionType, bottleId: number, enabled: boolean) => Promise<void>
}

const defaultStatus: CollectionStatus = { favorites: false, wishlist: false, personal: false }

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined)

export function CollectionsProvider({ children }: { children: ReactNode }) {
  // Cache: bottle_id -> status
  const [cache, setCache] = useState<Map<number, CollectionStatus>>(new Map())

  // Get cached status (returns default if not cached)
  const getStatus = useCallback((bottleId: number): CollectionStatus => {
    return cache.get(bottleId) ?? defaultStatus
  }, [cache])

  // Fetch status from API and cache it
  const fetchStatus = useCallback(async (bottleId: number): Promise<CollectionStatus> => {
    try {
      const status = await apiGet<CollectionStatus>(`/collections/status?bottle_id=${bottleId}`)
      setCache(prev => new Map(prev).set(bottleId, status))
      return status
    } catch (err) {
      // If not authenticated or error, return default (all false)
      if (err instanceof ApiError && err.status === 401) {
        return defaultStatus
      }
      console.error('Error fetching collection status:', err)
      return defaultStatus
    }
  }, [])

  // Toggle favorites (optimistic update)
  const toggleFavorite = useCallback(async (bottleId: number): Promise<void> => {
    const current = cache.get(bottleId) ?? defaultStatus
    const newFavorited = !current.favorites

    // Optimistic update
    const optimisticStatus = { ...current, favorites: newFavorited }
    setCache(prev => new Map(prev).set(bottleId, optimisticStatus))

    try {
      if (newFavorited) {
        await apiPost('/collections', { bottle_id: bottleId, collection_type: 'favorites' })
      } else {
        await apiDelete(`/collections/${bottleId}?type=favorites`)
      }
    } catch (err) {
      // Revert on error
      setCache(prev => new Map(prev).set(bottleId, current))
      console.error('Error toggling favorite:', err)
      throw err
    }
  }, [cache])

  // Set collection (add or remove)
  const setCollection = useCallback(async (
    type: CollectionType,
    bottleId: number,
    enabled: boolean
  ): Promise<void> => {
    const current = cache.get(bottleId) ?? defaultStatus

    // Optimistic update
    const optimisticStatus = { ...current, [type]: enabled }
    setCache(prev => new Map(prev).set(bottleId, optimisticStatus))

    try {
      if (enabled) {
        await apiPost('/collections', { bottle_id: bottleId, collection_type: type })
      } else {
        await apiDelete(`/collections/${bottleId}?type=${type}`)
      }
    } catch (err) {
      // Revert on error
      setCache(prev => new Map(prev).set(bottleId, current))
      console.error(`Error setting ${type}:`, err)
      throw err
    }
  }, [cache])

  return (
    <CollectionsContext.Provider value={{ getStatus, fetchStatus, toggleFavorite, setCollection }}>
      {children}
    </CollectionsContext.Provider>
  )
}

export function useCollections() {
  const context = useContext(CollectionsContext)
  if (!context) {
    throw new Error('useCollections must be used within CollectionsProvider')
  }
  return context
}
