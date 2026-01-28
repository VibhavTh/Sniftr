// contexts/FragranceModalContext.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Fragrance } from '@/types/fragrance'
import FragranceDetailModal from '@/components/FragranceDetailModal'

interface FragranceModalContextType {
  open: (fragrance: Fragrance) => void
  close: () => void
}

const FragranceModalContext = createContext<FragranceModalContextType | undefined>(
  undefined
)

export function FragranceModalProvider({ children }: { children: ReactNode }) {
  const [fragrance, setFragrance] = useState<Fragrance | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const open = (f: Fragrance) => {
    setFragrance(f)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    // Delay clearing fragrance until animation completes
    setTimeout(() => setFragrance(null), 200)
  }

  return (
    <FragranceModalContext.Provider value={{ open, close }}>
      {children}
      <FragranceDetailModal
        fragrance={fragrance}
        isOpen={isOpen}
        onClose={close}
        onLike={(id) => console.log('Like:', id)} // TODO: implement
        onPass={(id) => console.log('Pass:', id)} // TODO: implement
      />
    </FragranceModalContext.Provider>
  )
}

export function useFragranceModal() {
  const context = useContext(FragranceModalContext)
  if (!context) {
    throw new Error('useFragranceModal must be used within FragranceModalProvider')
  }
  return context
}
