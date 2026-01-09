/**
 * Browse page component for displaying paginated fragrance bottles.
 *
 * This is a protected route that displays a grid of fragrance bottles fetched from the backend API.
 * Users must be authenticated to access this page. The component manages pagination with a "Load More"
 * button to fetch additional bottles as the user scrolls through the collection.
 */

'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiGet } from '@/lib/api';

/**
 * Bottle interface representing a fragrance product.
 *
 * Defines the shape of bottle data returned from the backend API. Only includes fields
 * that are visible in the UI design (brand, name, image, and accord tags).
 */
interface Bottle {
    id: number;
    name: string;
    brand: string;
    image_url: string | null;
    main_accords: string[];
}

/**
 * BrowsePage component renders the paginated fragrance grid with authentication protection.
 *
 * This component verifies user authentication on mount, fetches the first page of bottles,
 * and provides pagination controls to load more results. It manages loading states, error
 * handling, and displays the bottle collection in a grid layout.
 */
export default function BrowsePage() {
    const router = useRouter();
    const [bottles, setBottles] = useState<Bottle[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageNum, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    /**
     * Verifies the user has an active Supabase session.
     *
     * If no session exists, redirects to the login page. This protects the route
     * from unauthorized access.
     */
    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
        }
    };

    /**
     * Fetches bottles from the backend API with pagination support.
     *
     * Calls the GET /bottles endpoint with page number and limit parameters. If fetching
     * page 1, replaces the bottles array (initial load). For subsequent pages, appends
     * new bottles to the existing array. Sets hasMore to false if fewer than 12 bottles
     * are returned, indicating no more results exist.
     *
     * @param pageNum - The page number to fetch (1-indexed)
     */
    const fetchBottles = async (pageNum: number) => {
        try {
            const data = await apiGet<Bottle[]>(`/bottles?page=${pageNum}&limit=12`);
            setError(null);
            if (pageNum === 1) {
                setBottles(data);
            } else {
                setBottles(prev => [...prev, ...data]);
            }

            if (data.length < 12) {
                setHasMore(false);
            }
        } catch (err: any) {
            setError(err.message || 'Error fetching bottles');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    /**
     * Handles the "Load More" button click to fetch the next page of bottles.
     *
     * Prevents multiple simultaneous requests by checking loadingMore state. Increments
     * the page number and calls fetchBottles with the new page.
     */
    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        const nextPage = pageNum + 1;
        setPage(nextPage);
        fetchBottles(nextPage);
    };

    /**
     * Effect hook that runs on component mount to verify authentication and fetch initial data.
     *
     * First checks if the user is authenticated and redirects if not. Then fetches the first
     * page of bottles to display in the grid.
     */
    useEffect(() => {
        const init = async () => {
            // TEMPORARY: Skip auth check and use mock data for design preview
            // await checkAuth();
            // await fetchBottles(1);

            // Mock data for design preview
            const mockBottles: Bottle[] = [
                { id: 1, name: "Sauvage", brand: "Dior", image_url: null, main_accords: ["Woody", "Fresh", "Spicy"] },
                { id: 2, name: "Bleu de Chanel", brand: "Chanel", image_url: null, main_accords: ["Woody", "Aromatic"] },
                { id: 3, name: "La Vie Est Belle", brand: "Lancôme", image_url: null, main_accords: ["Floral", "Sweet", "Powdery"] },
                { id: 4, name: "Acqua di Gio", brand: "Giorgio Armani", image_url: null, main_accords: ["Aquatic", "Fresh", "Woody"] },
                { id: 5, name: "Black Opium", brand: "Yves Saint Laurent", image_url: null, main_accords: ["Amber", "Warm", "Spicy"] },
                { id: 6, name: "Chance", brand: "Chanel", image_url: null, main_accords: ["Floral", "Fresh", "Woody"] },
                { id: 7, name: "Aventus", brand: "Creed", image_url: null, main_accords: ["Fruity", "Woody", "Smoky"] },
                { id: 8, name: "Good Girl", brand: "Carolina Herrera", image_url: null, main_accords: ["Amber", "Floral", "Warm"] },
                { id: 9, name: "J'adore", brand: "Dior", image_url: null, main_accords: ["Floral", "Fresh"] },
            ];

            setBottles(mockBottles);
            setLoading(false);
            setHasMore(true);
        };
        init();
    }, []);

    /**
     * Renders loading state while initial data is being fetched.
     */
    if (loading) {
        return <div>Loading bottles...</div>;
    }

    /**
     * Renders error state if the API request fails.
     */
    if (error) {
        return <div>Error: {error}</div>;
    }

    /**
     * Maps accord names to their semantic color classes following design handoff guidelines.
     *
     * Returns muted, elegant color combinations for each accord type. Colors are consistent
     * across the app to maintain visual coherence and support instant recognition.
     */
    const getAccordColor = (accord: string): string => {
        const accordLower = accord.toLowerCase();
        if (accordLower.includes('woody')) return 'bg-amber-100 text-amber-900';
        if (accordLower.includes('amber')) return 'bg-orange-100 text-orange-900';
        if (accordLower.includes('spicy')) return 'bg-red-100 text-red-900';
        if (accordLower.includes('floral')) return 'bg-pink-100 text-pink-900';
        if (accordLower.includes('citrus')) return 'bg-yellow-100 text-yellow-900';
        if (accordLower.includes('fresh') || accordLower.includes('aromatic')) return 'bg-green-100 text-green-900';
        if (accordLower.includes('powdery')) return 'bg-purple-100 text-purple-900';
        if (accordLower.includes('aquatic')) return 'bg-blue-100 text-blue-900';
        if (accordLower.includes('warm')) return 'bg-orange-50 text-orange-800';
        if (accordLower.includes('sweet') || accordLower.includes('fruity')) return 'bg-rose-100 text-rose-900';
        if (accordLower.includes('smoky')) return 'bg-stone-200 text-stone-900';
        return 'bg-neutral-100 text-neutral-700';
    };

    /**
     * Renders the main browse page with bottles grid and pagination controls.
     *
     * Displays the navigation bar with brand logo and page links. The main content includes
     * a page title, subtitle, search/filter bar, and a 3-column grid of fragrance cards.
     * Each card shows the bottle image, brand name, fragrance name, and main accord tags.
     */
    return (
        <div className="min-h-screen bg-stone-50">
            {/* Navigation bar with logo and page links */}
            <nav className="bg-white border-b border-neutral-200">
                <div className="max-w-[1400px] mx-auto px-8 lg:px-14">
                    <div className="flex justify-between items-center h-[72px]">
                        <h1 className="font-serif text-[15px] font-normal text-neutral-900 tracking-[0.3em] uppercase">FRAGRANCE</h1>
                        <div className="flex items-center gap-10">
                            <a href="/finder" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition">Finder</a>
                            <a href="/browse" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition underline underline-offset-4">Explore</a>
                            <a href="/collection" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition">Collection</a>
                        </div>
                        <button className="w-8 h-8 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-[1400px] mx-auto px-8 lg:px-14 py-20">
                {/* Page header with title and subtitle */}
                <div className="mb-14">
                    <h2 className="font-serif text-[42px] font-light text-neutral-900 mb-3 leading-tight">Explore Fragrances</h2>
                    <p className="text-[15px] font-light text-neutral-500 leading-relaxed">
                        Browse our complete collection of luxury fragrances
                    </p>
                </div>

                {/* Search bar with filters button */}
                <div className="mb-16 flex gap-3">
                    <div className="flex-1 relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search fragrances or brands..."
                            className="w-full pl-12 pr-4 py-3.5 border border-neutral-300 text-[15px] font-light text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
                        />
                    </div>
                    <button className="px-6 py-3.5 border border-neutral-300 text-[15px] font-light text-neutral-900 hover:bg-neutral-50 transition-colors flex items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="4" y1="21" x2="4" y2="14"></line>
                            <line x1="4" y1="10" x2="4" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12" y2="3"></line>
                            <line x1="20" y1="21" x2="20" y2="16"></line>
                            <line x1="20" y1="12" x2="20" y2="3"></line>
                            <line x1="1" y1="14" x2="7" y2="14"></line>
                            <line x1="9" y1="8" x2="15" y2="8"></line>
                            <line x1="17" y1="16" x2="23" y2="16"></line>
                        </svg>
                        Filters
                    </button>
                </div>

                {/* 3-column grid of fragrance cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
                    {bottles.map(bottle => (
                        <div key={bottle.id} className="group cursor-pointer">
                            <div className="aspect-[2/3] bg-neutral-200 mb-6 relative overflow-hidden">
                                {bottle.image_url ? (
                                    <img
                                        src={bottle.image_url}
                                        alt={`${bottle.brand} ${bottle.name}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-[13px] font-light text-neutral-500 tracking-wider uppercase">FRAGRANCE</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[11px] font-normal text-neutral-500 uppercase tracking-widest mb-2">
                                        {bottle.brand}
                                    </p>
                                    <h3 className="font-serif text-[24px] font-light text-neutral-900 leading-tight">
                                        {bottle.name}
                                    </h3>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {bottle.main_accords.slice(0, 3).map((accord, idx) => (
                                        <span
                                            key={idx}
                                            className={`text-[11px] font-normal px-3 py-1.5 rounded-sm ${getAccordColor(accord)}`}
                                        >
                                            {accord}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {hasMore && (
                    <div className="flex justify-center mt-20">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="px-10 py-3.5 bg-neutral-900 text-white text-[13px] font-light tracking-wide uppercase hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loadingMore ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}