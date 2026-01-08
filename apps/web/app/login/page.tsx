/**
 * Purpose:
 * Login page for authenticating existing users with email/password.
 *
 * Responsibilities:
 * - Render login form with controlled inputs for email and password
 * - Handle form submission and call Supabase signInWithPassword
 * - Manage loading and error states during authentication
 * - Redirect to home page on successful login
 *
 * System context:
 * - Entry point for existing users
 * - Uses Supabase Auth for authentication
 * - Redirects to protected home page after login
 * - Links to /signup for new users
 */

'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

/**
 * LoginPage component renders the login form and handles user authentication.
 *
 * This is the primary entry point for existing users to access the application.
 * On successful authentication, users are redirected to the protected home page.
 * The component manages form state, loading states, and error messages to provide
 * clear feedback during the authentication process.
 */
export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    /**
     * Handles form submission by authenticating the user with Supabase.
     *
     * This function prevents the default form reload, calls Supabase's
     * signInWithPassword method, and handles the response. On success,
     * the user is redirected to the home page. On failure, an error
     * message is displayed to the user.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const {data, error: authError} = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })

        setLoading(false);

        if (authError) {
            setError(authError.message);
            return;
        }

        router.push("/");
    }

    /**
     * Renders the login form with email/password inputs and error display.
     *
     * The form uses controlled inputs to manage state and displays loading
     * feedback during authentication. A link to the signup page is provided
     * for users who need to create an account.
     */
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome Back MFss</h1>
                    <p className="mt-2 text-sm text-gray-600">Sign in to your ScentlyMax account</p>
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
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link href="/signup" className="font-medium text-purple-600 hover:text-purple-500 transition">
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
