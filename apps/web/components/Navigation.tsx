/**
 * Shared navigation component with responsive mobile menu.
 *
 * Features:
 * - Desktop: Horizontal nav links with wide spacing
 * - Mobile: Hamburger menu with slide-down drawer
 * - Supports transparent (hero overlay) and solid (white bg) variants
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'

interface NavigationProps {
  variant?: 'solid' | 'transparent'
  currentPath?: string
}

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/finder', label: 'Finder' },
  { href: '/browse', label: 'Explore' },
  { href: '/collection', label: 'Collection' },
]

export default function Navigation({ variant = 'solid', currentPath }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isTransparent = variant === 'transparent'

  // Color classes based on variant
  const bgClass = isTransparent ? '' : 'bg-white border-b border-neutral-200'
  const textClass = isTransparent ? 'text-white' : 'text-neutral-900'
  const textMutedClass = isTransparent ? 'text-white/90' : 'text-neutral-900'
  const hoverClass = isTransparent ? 'hover:text-white' : 'hover:text-neutral-600'
  const iconStroke = isTransparent ? 'white' : 'currentColor'

  return (
    <nav className={`${isTransparent ? 'absolute top-0 left-0 right-0 z-20' : ''} ${bgClass}`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-14">
        <div className="flex justify-between items-center h-[60px] sm:h-[72px]">
          {/* Logo */}
          <Link
            href="/"
            className={`font-serif text-[14px] sm:text-[15px] font-normal ${textClass} tracking-[0.3em] uppercase`}
          >
            SNIFTR
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[15px] font-light ${textMutedClass} ${hoverClass} transition ${
                  currentPath === link.href ? 'underline underline-offset-4' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: profile + hamburger */}
          <div className="flex items-center gap-2">
            {/* Profile icon (always visible) */}
            <Link href="/signin" className="w-10 h-10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </Link>

            {/* Hamburger button (mobile only) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden w-10 h-10 flex items-center justify-center ${textClass}`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className={`md:hidden ${isTransparent ? 'bg-black/90' : 'bg-white border-t border-neutral-200'}`}>
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 text-[15px] font-light ${
                  isTransparent ? 'text-white' : 'text-neutral-900'
                } ${currentPath === link.href ? 'font-normal' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
