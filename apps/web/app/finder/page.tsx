/**
 * Finder page component for discovering fragrances via Tinder-style swipe interface.
 *
 * This protected route displays a centered fragrance card with Pass/Like actions.
 * Users can swipe through fragrances one at a time and save their favorites to their collection.
 */

'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiGet } from '@/lib/api';

/**
 * Bottle interface representing a fragrance product in the finder.
 *
 * Defines the shape of bottle data shown in the swipeable card view.
 */
interface Bottle {
    id: number;
    name: string;
    brand: string;
    image_url: string | null;
    main_accords: string[];
}

/**
 * FinderPage component renders a centered card interface for discovering fragrances.
 *
 * Shows one fragrance at a time with Pass and Like action buttons. Users swipe through
 * the collection to build their saved fragrances list.
 */
export default function FinderPage() {
    const router = useRouter();
    const [bottles, setBottles] = useState<Bottle[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    /**
     * Effect hook to initialize the finder with mock data.
     *
     * In production, this would fetch bottles from the backend and verify authentication.
     */
    useEffect(() => {
        const init = async () => {
            // Mock data matching browse page
            const mockBottles: Bottle[] = [
                { id: 1, name: "Santal 33", brand: "Le Labo", image_url: null, main_accords: ["Woody", "Spicy", "Warm"] },
                { id: 2, name: "Bleu de Chanel", brand: "Chanel", image_url: null, main_accords: ["Woody", "Aromatic"] },
                { id: 3, name: "La Vie Est Belle", brand: "Lancôme", image_url: null, main_accords: ["Floral", "Sweet", "Powdery"] },
                { id: 4, name: "Acqua di Gio", brand: "Giorgio Armani", image_url: null, main_accords: ["Aquatic", "Fresh", "Woody"] },
                { id: 5, name: "Black Opium", brand: "Yves Saint Laurent", image_url: null, main_accords: ["Amber", "Warm", "Spicy"] },
                { id: 6, name: "Chance", brand: "Chanel", image_url: null, main_accords: ["Floral", "Fresh", "Woody"] },
                { id: 7, name: "Aventus", brand: "Creed", image_url: null, main_accords: ["Fruity", "Woody", "Smoky"] },
                { id: 8, name: "Good Girl", brand: "Carolina Herrera", image_url: null, main_accords: ["Amber", "Floral", "Warm"] },
            ];

            setBottles(mockBottles);
            setLoading(false);
        };
        init();
    }, []);

    /**
     * Handles the Pass action by advancing to the next bottle.
     *
     * User is not interested in the current fragrance, so move to the next one.
     */
    const handlePass = () => {
        if (currentIndex < bottles.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    /**
     * Handles the Like action by saving the bottle and advancing to the next one.
     *
     * In production, this would call the API to save the bottle to the user's collection.
     */
    const handleLike = () => {
        if (currentIndex < bottles.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

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

    const currentBottle = bottles[currentIndex];
    const isLastBottle = currentIndex >= bottles.length - 1;

    /**
     * Renders the finder page with navigation, centered card, and action buttons.
     *
     * The main card displays the fragrance image, brand, name, and accord tags.
     * Below the card are Pass and Like buttons for user interaction.
     */
    return (
        <div className="min-h-screen bg-stone-50">
            {/* Navigation bar */}
            <nav className="bg-white border-b border-neutral-200">
                <div className="max-w-[1400px] mx-auto px-8 lg:px-14">
                    <div className="flex justify-between items-center h-[72px]">
                        <h1 className="font-serif text-[15px] font-normal text-neutral-900 tracking-[0.3em] uppercase">FRAGRANCE</h1>
                        <div className="flex items-center gap-10">
                            <a href="/finder" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition underline underline-offset-4">Finder</a>
                            <a href="/browse" className="text-[15px] font-light text-neutral-900 hover:text-neutral-600 transition">Explore</a>
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
                {/* Page header with progress indicator */}
                <div className="text-center mb-12">
                    <h2 className="font-serif text-[42px] font-light text-neutral-900 mb-4 leading-tight">Fragrance Finder</h2>
                    <p className="text-[15px] font-light text-neutral-500">
                        {currentIndex + 1} of {bottles.length}
                    </p>
                </div>

                {/* Centered fragrance card */}
                <div className="max-w-md mx-auto">
                    {currentBottle ? (
                        <div className="bg-white border border-neutral-200 p-8">
                            {/* Fragrance name and brand at top */}
                            <div className="text-center mb-6">
                                <h3 className="font-serif text-[32px] font-light text-neutral-900 mb-2 leading-tight">
                                    {currentBottle.name}
                                </h3>
                                <p className="text-[13px] font-normal text-neutral-500 uppercase tracking-wider">
                                    {currentBottle.brand}
                                </p>
                            </div>

                            {/* Fragrance image */}
                            <div className="aspect-[3/4] bg-neutral-200 mb-8 relative">
                                {currentBottle.image_url ? (
                                    <img
                                        src={currentBottle.image_url}
                                        alt={`${currentBottle.brand} ${currentBottle.name}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-[13px] font-light text-neutral-500 tracking-wider uppercase">FRAGRANCE</span>
                                    </div>
                                )}
                            </div>

                            {/* Main accords section */}
                            <div className="mb-8">
                                <p className="text-[11px] font-normal text-neutral-500 uppercase tracking-wider mb-3">MAIN ACCORDS</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {currentBottle.main_accords.map((accord, idx) => (
                                        <span
                                            key={idx}
                                            className={`text-[11px] font-normal px-2.5 py-1 rounded-sm ${getAccordColor(accord)}`}
                                        >
                                            {accord}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-[15px] font-light text-neutral-500">No more fragrances to explore</p>
                        </div>
                    )}

                    {/* Action buttons */}
                    {currentBottle && !isLastBottle && (
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <button
                                onClick={handlePass}
                                className="px-8 py-4 border border-neutral-300 text-[15px] font-light text-neutral-900 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Pass
                            </button>
                            <button
                                onClick={handleLike}
                                className="px-8 py-4 bg-neutral-900 text-white text-[15px] font-light hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                                Like
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
