/**
 * Purpose:
 * Shared two-panel layout for authentication pages (signin/signup).
 *
 * Responsibilities:
 * - Render two-column layout: left form panel, right brand hero panel
 * - Provide consistent branding and messaging across auth pages
 * - Handle responsive behavior (hero hidden on mobile)
 *
 * System context:
 * - Used by /signin and /signup pages
 * - Follows luxury editorial aesthetic (no rounded corners, serif headings)
 */

import Link from 'next/link'

interface AuthSplitLayoutProps {
  mode: 'signin' | 'signup'
  children: React.ReactNode
}

export default function AuthSplitLayout({ mode, children }: AuthSplitLayoutProps) {
  const title = mode === 'signin' ? 'Welcome back' : 'Create your account'
  const subtitle = mode === 'signin'
    ? 'Sign in to continue your fragrance journey.'
    : 'Start your fragrance discovery journey.'
  const footerText = mode === 'signin'
    ? "Don't have an account?"
    : 'Already have an account?'
  const footerLinkText = mode === 'signin' ? 'Create one' : 'Sign in'
  const footerLinkHref = mode === 'signin' ? '/signup' : '/signin'

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 lg:px-16 xl:px-24 bg-stone-50">
        <div className="max-w-md w-full mx-auto">
          {/* Brand */}
          <p className="font-serif text-[18px] font-light italic text-neutral-900 mb-12">
            ScentlyMax
          </p>

          {/* Heading */}
          <h1 className="font-serif text-[36px] lg:text-[42px] font-light text-neutral-900 leading-tight mb-3">
            {title}
          </h1>
          <p className="text-[15px] font-light text-neutral-500 mb-10">
            {subtitle}
          </p>

          {/* Form content (passed as children) */}
          {children}

          {/* Footer link */}
          <p className="text-[14px] font-light text-neutral-500 mt-8 text-center">
            {footerText}{' '}
            <Link
              href={footerLinkHref}
              className="text-neutral-900 underline underline-offset-4 hover:text-neutral-600 transition-colors"
            >
              {footerLinkText}
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Hero (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-b from-stone-700 via-stone-600 to-stone-500 flex-col items-center justify-center p-16">
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/10" />

        <div className="relative z-10 text-center max-w-lg">
          {/* Headline */}
          <h2 className="font-serif text-[42px] lg:text-[52px] font-light text-white leading-tight mb-6">
            Discover your<br />signature scent
          </h2>

          {/* Subtext */}
          <p className="text-[16px] font-light text-neutral-300 leading-relaxed mb-12">
            Swipe, save favorites, and build your collection — powered by a content-based recommender.
          </p>

          {/* Metrics row */}
          <div className="flex items-center justify-center gap-4 text-[13px] font-light text-neutral-400">
            <span>20,000+ Fragrances</span>
            <span className="text-neutral-600">•</span>
            <span>Personal Collections</span>
            <span className="text-neutral-600">•</span>
            <span>Smart Recommendations</span>
          </div>
        </div>
      </div>
    </div>
  )
}
