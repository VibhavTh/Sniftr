/**
 * Collection page component for displaying saved fragrances.
 *
 * This protected route shows the user's collection of liked fragrances. When empty,
 * displays an elegant empty state with call-to-action buttons to start discovering.
 */

'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiGet } from '@/lib/api';

/**
 * Bottle interface representing a saved fragrance in the collection.
 *
 * Defines the shape of bottle data stored in the user's collection.
 */
interface Bottle {
    id: number;
    name: string;
    brand: string;
    image_url: string | null;
    main_accords: string[];
}

/**
 * CollectionPage component renders the user's saved fragrances or an empty state.
 *
 * Shows a grid of saved bottles when the collection has items, or an elegant empty
 * state with CTAs to start discovering fragrances via Finder or Explore pages.
 */
export default function CollectionPage() {
    const router = useRouter();
    const [bottles, setBottles] = useState<Bottle[]>([]);
    const [loading, setLoading] = useState(true);

    /**
     * Effect hook to fetch the user's collection.
     *
     * In production, this would fetch saved bottles from the backend API.
     * Currently shows empty state for demonstration.
     */
    useEffect(() => {
        const init = async () => {
            // Empty collection for demonstration
            setBottles([]);
            setLoading(false);
        };
        init();
    }, []);

    /**
     * Maps accord names to their semantic color classes following design handoff guidelines.
     *
     * Returns muted, elegant color combinations for each accord type.
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

    if (loading) {
        return <div>Loading...</div>;
    }

    /**
     * Renders the collection page with navigation and either empty state or bottle grid.
     *
     * The empty state includes a centered icon, heading, description, and action buttons
     * that guide users to start building their collection via Finder or Explore pages.
     */
    return (
        <div className="min-h-screen bg-stone-50">
            {/* Navigation bar */}
            <nav className="bg-white border-b border-neutral-200">
                <div className="max-w-[1400px] mx-auto px-8 lg:px-14">
                    <div className="flex justify-between items-center h-[72px]">
                        <h1 className="font-serif text-[15px] font-normal text-neutral-900 tracking-[0.3em] uppercase">FRAGRANCE</h1>
                        <div className="flex items-center gap-10">
                            <a href="/finder" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition">Finder</a>
                            <a href="/browse" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition">Explore</a>
                            <a href="/collection" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition underline underline-offset-4">Collection</a>
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
                {/* Page header */}
                <div className="mb-16">
                    <h2 className="font-serif text-[42px] font-light text-neutral-900 mb-3 leading-tight">Your Collection</h2>
                    <p className="text-[15px] font-light text-neutral-500 leading-relaxed">
                        Fragrances you&apos;ve discovered and saved
                    </p>
                </div>

                {bottles.length === 0 ? (
                    /* Empty state with centered icon and CTAs */
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white border border-neutral-200 rounded-sm p-16 text-center">
                            {/* Heart icon in circle */}
                            <div className="w-20 h-20 rounded-full bg-neutral-100 mx-auto mb-8 flex items-center justify-center">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            </div>

                            {/* Empty state heading and description */}
                            <h3 className="font-serif text-[28px] font-light text-neutral-900 mb-4 leading-tight">
                                Your Collection is Empty
                            </h3>
                            <p className="text-[15px] font-light text-neutral-500 leading-relaxed mb-10 max-w-md mx-auto">
                                Start discovering fragrances using the Finder or browse the Explore page to build your collection
                            </p>

                            {/* Action buttons */}
                            <div className="flex gap-4 justify-center">
                                <a
                                    href="/finder"
                                    className="px-8 py-3.5 bg-neutral-900 text-white text-[15px] font-light hover:bg-neutral-800 transition-colors"
                                >
                                    Start Finder
                                </a>
                                <a
                                    href="/browse"
                                    className="px-8 py-3.5 border border-neutral-300 text-[15px] font-light text-neutral-900 hover:bg-neutral-50 transition-colors"
                                >
                                    Explore
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Grid of saved bottles (shown when collection has items) */
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
                )}
            </main>
        </div>
    );
}
