/**
 * Purpose:
 * Sign-up page for creating new user accounts with email/password.
 *
 * Responsibilities:
 * - Render sign-up form within the two-panel AuthSplitLayout
 * - Handle form submission via Supabase signUp
 * - Manage loading, error, and success states during account creation
 * - Show current session banner if already signed in (with sign out option)
 * - Show email confirmation message if required
 *
 * System context:
 * - Entry point for new users
 * - Uses Supabase Auth for account creation
 * - Follows luxury editorial aesthetic (no rounded corners)
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AuthSplitLayout from '@/components/auth/AuthSplitLayout'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
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
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://sniftr.net/'
      }
    })

    setLoading(false)

    if (authError) {
      // Handle "User already registered" error with a friendlier message
      if (authError.message.toLowerCase().includes('already registered') ||
          authError.message.toLowerCase().includes('already exists')) {
        setError('This email is already associated with an existing account. Please sign in instead.')
      } else {
        setError(authError.message)
      }
      return
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      setSuccess(true)
      return
    }

    router.push('/')
  }

  // Success state - email confirmation required
  if (success) {
    return (
      <AuthSplitLayout mode="signup">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-100 mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-serif text-[28px] font-light text-neutral-900 mb-3">Check your email</h2>
          <p className="text-[15px] font-light text-neutral-500 mb-8">
            We&apos;ve sent a confirmation link to<br />
            <strong className="text-neutral-900">{email}</strong>
          </p>
          <div className="bg-stone-100 border border-neutral-200 p-6 mb-8 text-left">
            <p className="text-[13px] font-normal text-neutral-700 mb-3">Next steps:</p>
            <ol className="text-[13px] font-light text-neutral-600 space-y-2 list-decimal list-inside">
              <li>Open your email inbox</li>
              <li>Click the confirmation link</li>
              <li>Return here and sign in</li>
            </ol>
          </div>
          <Link
            href="/signin"
            className="inline-block px-8 py-4 bg-neutral-900 text-white text-[13px] font-normal tracking-widest uppercase hover:bg-neutral-800 transition-colors"
          >
            Go to Sign In
          </Link>
          <p className="mt-6 text-[13px] font-light text-neutral-400">
            Didn&apos;t receive the email? Check your spam folder.
          </p>
        </div>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout mode="signup">
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
              placeholder="Create a password"
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
          <p className="mt-2 text-[12px] font-light text-neutral-400">
            Must be at least 6 characters
          </p>
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
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </AuthSplitLayout>
  )
}
