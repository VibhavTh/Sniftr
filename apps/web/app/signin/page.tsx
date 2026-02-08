/**
 * Purpose:
 * Sign-in page for authenticating existing users with email/password.
 *
 * Responsibilities:
 * - Render sign-in form within the two-panel AuthSplitLayout
 * - Handle form submission via Supabase signInWithPassword
 * - Manage loading and error states during authentication
 * - Show current session banner if already signed in (with sign out option)
 * - Prevent signing in with same email (show "already signed in" error)
 * - Allow switching accounts by signing out and signing in as different user
 *
 * System context:
 * - Entry point for existing users
 * - Uses Supabase Auth for authentication
 * - Follows luxury editorial aesthetic (no rounded corners)
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AuthSplitLayout from '@/components/auth/AuthSplitLayout'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

  // Check if user is already signed in (but don't redirect)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setCurrentUserEmail(session.user.email)
      }
    }
    checkAuth()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setCurrentUserEmail(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Check if trying to sign in with the same email
    if (currentUserEmail && email.toLowerCase() === currentUserEmail.toLowerCase()) {
      setError(`You're already signed in as ${currentUserEmail}`)
      return
    }

    setLoading(true)

    // If signed in as different user, sign out first
    if (currentUserEmail) {
      await supabase.auth.signOut()
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    router.push('/')
  }

  return (
    <AuthSplitLayout mode="signin">
      {/* Already signed in banner */}
      {currentUserEmail && (
        <div className="bg-stone-100 border border-neutral-200 p-4 mb-6">
          <p className="text-[13px] font-light text-neutral-600 mb-3">
            Currently signed in as <strong className="text-neutral-900">{currentUserEmail}</strong>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-neutral-900 text-white text-[12px] font-normal tracking-wide uppercase hover:bg-neutral-800 transition-colors"
            >
              Go to Home
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2 border border-neutral-300 text-[12px] font-normal tracking-wide uppercase text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-[11px] font-normal text-neutral-500 uppercase tracking-widest mb-2"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            className="w-full px-4 py-3.5 border border-neutral-300 text-[15px] font-light text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors bg-white"
          />
        </div>

        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            className="block text-[11px] font-normal text-neutral-500 uppercase tracking-widest mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="w-full px-4 py-3.5 pr-12 border border-neutral-300 text-[15px] font-light text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Remember me + Forgot password row */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 border border-neutral-300 text-neutral-900 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[13px] font-light text-neutral-600">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-[13px] font-light text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-[13px] font-light">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-neutral-900 text-white text-[13px] font-normal tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </AuthSplitLayout>
  )
}
