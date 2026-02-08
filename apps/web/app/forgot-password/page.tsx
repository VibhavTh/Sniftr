/**
 * Purpose:
 * Password reset request page for users who forgot their password.
 *
 * Responsibilities:
 * - Render password reset form within the two-panel AuthSplitLayout
 * - Handle form submission via Supabase resetPasswordForEmail
 * - Manage loading, error, and success states
 * - Redirect authenticated users away from this page
 *
 * System context:
 * - Linked from /signin page
 * - Uses Supabase Auth for password reset
 * - Follows luxury editorial aesthetic (no rounded corners)
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AuthSplitLayout from '@/components/auth/AuthSplitLayout'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/')
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSuccess(true)
  }

  // Success state - email sent
  if (success) {
    return (
      <AuthSplitLayout mode="signin">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-100 mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="font-serif text-[28px] font-light text-neutral-900 mb-3">Check your email</h2>
          <p className="text-[15px] font-light text-neutral-500 mb-8">
            We&apos;ve sent a password reset link to<br />
            <strong className="text-neutral-900">{email}</strong>
          </p>
          <div className="bg-stone-100 border border-neutral-200 p-6 mb-8 text-left">
            <p className="text-[13px] font-normal text-neutral-700 mb-3">Next steps:</p>
            <ol className="text-[13px] font-light text-neutral-600 space-y-2 list-decimal list-inside">
              <li>Open your email inbox</li>
              <li>Click the password reset link</li>
              <li>Create a new password</li>
            </ol>
          </div>
          <Link
            href="/signin"
            className="inline-block px-8 py-4 bg-neutral-900 text-white text-[13px] font-normal tracking-widest uppercase hover:bg-neutral-800 transition-colors"
          >
            Back to Sign In
          </Link>
          <p className="mt-6 text-[13px] font-light text-neutral-400">
            Didn&apos;t receive the email? Check your spam folder.
          </p>
        </div>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout mode="signin">
      <div className="mb-8">
        <Link
          href="/signin"
          className="inline-flex items-center gap-2 text-[13px] font-light text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
          </svg>
          Back to sign in
        </Link>
      </div>

      <h2 className="font-serif text-[28px] font-light text-neutral-900 mb-3">Reset your password</h2>
      <p className="text-[15px] font-light text-neutral-500 mb-8">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

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
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </AuthSplitLayout>
  )
}
