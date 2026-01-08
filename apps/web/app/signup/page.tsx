/**
 * Purpose:
 * Signup page for creating new user accounts with email/password.
 *
 * Responsibilities:
 * - Render signup form with controlled inputs for email and password
 * - Handle form submission and call Supabase signUp
 * - Manage loading and error states during account creation
 * - Redirect to home page on successful signup
 *
 * System context:
 * - Entry point for new users
 * - Uses Supabase Auth to create accounts
 * - Redirects to protected home page after signup
 * - Links to /login for existing users
 */

'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

/**
 * SignupPage component renders the registration form and handles new user account creation.
 *
 * This is the primary entry point for new users to create an account in the application.
 * On successful registration, users are redirected to the protected home page.
 * The component manages form state, loading states, and error messages to provide
 * clear feedback during the account creation process.
 */
export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    /**
     * Handles form submission by creating a new user account with Supabase.
     *
     * This function prevents the default form reload, calls Supabase's
     * signUp method, and handles the response. On success, the user is
     * redirected to the home page. On failure, an error message is
     * displayed to the user.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const {data, error: authError} = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: `${window.location.origin}/`
            }
        })

        setLoading(false);

        if (authError) {
            setError(authError.message);
            return;
        }

        // Check if email confirmation is required
        if (data.user && !data.session) {
            setSuccess(true);
            return;
        }

        router.push("/");
    }

    /**
     * Renders the signup form with email/password inputs and error display.
     *
     * The form uses controlled inputs to manage state and displays loading
     * feedback during account creation. A link to the login page is provided
     * for users who already have an account.
     */
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
                {success ? (
                    <div className="text-center py-8">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email!</h2>
                        <p className="text-gray-600 mb-6">
                            We've sent a confirmation link to <strong className="text-gray-900">{email}</strong>
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                            <p className="text-sm text-blue-800">
                                <strong>Next steps:</strong>
                            </p>
                            <ol className="text-sm text-blue-700 mt-2 ml-4 list-decimal space-y-1">
                                <li>Open your email inbox</li>
                                <li>Click the confirmation link</li>
                                <li>Return here and log in</li>
                            </ol>
                        </div>
                        <Link
                            href="/login"
                            className="inline-block px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition"
                        >
                            Go to Login
                        </Link>
                        <p className="mt-4 text-sm text-gray-500">
                            Didn't receive the email? Check your spam folder or try signing up again.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-900">Create an account</h1>
                            <p className="mt-2 text-sm text-gray-600">Start your fragrance discovery journey</p>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="johndoe@gmail.com"
                                        className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="make it long"
                                        className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {loading ? "Signing up..." : "Sign Up"}
                            </button>
                        </form>

                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link href="/login" className="font-medium text-purple-600 hover:text-purple-500 transition">
                                    Login here
                                </Link>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
