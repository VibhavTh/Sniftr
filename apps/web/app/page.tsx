/**
 * Purpose:
 * Protected home dashboard that displays user info and tests backend connectivity.
 *
 * Responsibilities:
 * - Check if user is authenticated (redirect to /login if not)
 * - Display logged-in user's email
 * - Call backend GET /health-auth with Bearer token
 * - Show backend response to verify auth flow works end-to-end
 *
 * System context:
 * - Requires active Supabase session
 * - Communicates with FastAPI backend using JWT Bearer tokens
 * - Entry point after successful login/signup
 */

'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * HomePage component renders the protected dashboard for authenticated users.
 *
 * This is the main landing page after successful login or signup. It verifies
 * the user has an active session, displays their email, and provides functionality
 * to test backend connectivity with JWT Bearer token authentication. Users can
 * also logout from this page.
 */
export default function HomePage() {
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiResponse, setApiResponse] = useState<string | null>(null);
    const [apiLoading, setApiLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    /**
     * Effect hook that runs on component mount to verify authentication.
     *
     * This ensures that only authenticated users can access this page by
     * checking for an active Supabase session. Unauthenticated users are
     * redirected to the login page.
     */
    useEffect(() => {
        checkAuth();
    }, []);

    /**
     * Verifies the user has an active Supabase session.
     *
     * If no session exists, redirects to the login page. If a session is found,
     * extracts the user's email and updates the UI to show the authenticated state.
     */
    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            router.push('/login');
            return;
        }

        setEmail(session.user.email || null);
        setLoading(false);
    };

    /**
     * Tests backend connectivity by calling the /health-auth endpoint.
     *
     * This function retrieves the current user's JWT access token from the
     * Supabase session and includes it as a Bearer token in the Authorization
     * header. The backend response is displayed to verify end-to-end authentication
     * is working correctly.
     */
    const testBackendAuth = async () => {
        setApiLoading(true);
        setApiError(null);
        setApiResponse(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setApiError('No active session');
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/health-auth`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setApiResponse(JSON.stringify(data, null, 2));
        } catch (error: any) {
            setApiError(error.message);
        } finally {
            setApiLoading(false);
        }
    };

    /**
     * Handles user logout by clearing the Supabase session.
     *
     * After signing out, the user is redirected to the login page.
     */
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    /**
     * Renders loading state while authentication is being verified.
     */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    /**
     * Renders the protected dashboard with user info and backend testing UI.
     *
     * Displays the authenticated user's email, a logout button, and controls
     * for testing backend connectivity. Shows backend responses or errors
     * based on the API call results.
     */
    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-2xl font-bold text-purple-600">ScentlyMax</h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">
                                Logged in as: <strong className="text-gray-900">{email}</strong>
                            </span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Welcome to ScentlyMax</h2>
                        <p className="mt-2 text-gray-600">Your fragrance discovery platform</p>
                    </div>

                    <div className="border-t border-gray-200 pt-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Test Backend Authentication</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Verify that your JWT token works with the FastAPI backend by calling the protected endpoint.
                        </p>

                        <button
                            onClick={testBackendAuth}
                            disabled={apiLoading}
                            className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {apiLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Calling backend...
                                </span>
                            ) : (
                                'Call GET /health-auth'
                            )}
                        </button>

                        {apiError && (
                            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-red-800 mb-2">Error:</h4>
                                <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">{apiError}</pre>
                            </div>
                        )}

                        {apiResponse && (
                            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-green-800 mb-2">Backend Response:</h4>
                                <pre className="text-sm text-green-700 whitespace-pre-wrap font-mono overflow-x-auto">{apiResponse}</pre>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
