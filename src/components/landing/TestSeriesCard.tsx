import { CheckCircle, ArrowRight, Zap, Target, ScrollText, Award, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface TestSeriesProps {
    id?: string;
    title: string;
    description?: string;
    isNew?: boolean;
    features?: string[];
    originalPrice: string | number;
    price: string | number;
    colorTheme?: 'blue' | 'green' | 'orange';
    onExplore?: () => void;
    actions?: ReactNode; // For Admin side
    examCategory?: string;
    examSubCategory?: string;
    testCount?: number;
    thumbnailUrl?: string;
}

const TestSeriesCard = ({
    id,
    title,
    description,
    isNew,
    features = [],
    originalPrice,
    price,
    onExplore,
    actions,
    examCategory,
    examSubCategory,
    testCount,
    thumbnailUrl
}: TestSeriesProps) => {

    const [tests, setTests] = useState<any[]>([]);
    const [loadingTests, setLoadingTests] = useState(false);
    const [showPopover, setShowPopover] = useState(false);

    useEffect(() => {
        const fetchTests = async () => {
            if (!id || tests.length > 0) return;
            setLoadingTests(true);
            try {
                const q = query(
                    collection(db, 'tests'),
                    where('seriesId', '==', id)
                );
                const snapshot = await getDocs(q);
                const fetched = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTests(fetched);
            } catch (error) {
                console.error("Error fetching tests for series", error);
            } finally {
                setLoadingTests(false);
            }
        };

        if (showPopover) {
            fetchTests();
        }
    }, [id, showPopover, tests.length]);

    const handleMouseEnter = () => {
        setShowPopover(true);
    };

    const handleMouseLeave = () => {
        setShowPopover(false);
    };

    const numPrice = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, ''));
    const numOriginal = typeof originalPrice === 'number' ? originalPrice : parseFloat(String(originalPrice).replace(/[^0-9.]/g, ''));

    let discountPercentage = 0;
    let savingsAmount = 0;
    if (!isNaN(numOriginal) && !isNaN(numPrice) && numOriginal > numPrice && numPrice > 0) {
        savingsAmount = Math.round(numOriginal - numPrice);
        discountPercentage = Math.round((savingsAmount / numOriginal) * 100);
    }

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.005 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group relative bg-white rounded-2xl border border-slate-200 hover:border-blue-500/40 flex flex-col h-full transition-all duration-300 overflow-hidden"
        >
            <div className="p-6 pb-2 flex-1 flex flex-col z-10">
                {/* Header Area */}
                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                {examCategory ? `${examCategory} Mastery` : 'Academic Mastery'}
                            </span>
                        </div>
                        {(title || '').toLowerCase().includes('demo') || price === 0 || price === '0' || String(price || '').toLowerCase() === 'free' ? (
                            <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-100">
                                <Sparkles size={12} className="animate-pulse text-indigo-600" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Free Demo</span>
                            </div>
                        ) : isNew ? (
                            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100">
                                <Sparkles size={12} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Early Access</span>
                            </div>
                        ) : null}
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 text-slate-600">
                        <BookOpen size={18} />
                    </div>
                </div>

                {/* Title & Description */}
                <div className="mb-5">
                    <h3 className="text-xl font-bold text-slate-900 leading-snug mb-2">
                        {title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">
                        {description || "Elevate your preparation with our premium test series designed by top educators."}
                    </p>
                </div>

                {/* Info Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <div className="flex items-center gap-2 border border-slate-200/80 rounded-xl px-3 py-1.5 bg-slate-50/60">
                        <ScrollText size={14} className="text-blue-600" />
                        <span className="text-xs font-bold text-slate-700">{testCount || 0} Full Tests</span>
                    </div>
                    <div className="flex items-center gap-2 border border-slate-200/80 rounded-xl px-3 py-1.5 bg-slate-50/60">
                        <Target size={14} className="text-blue-600" />
                        <span className="text-xs font-bold text-slate-700">Topic Wise</span>
                    </div>
                </div>

                {/* Feature List */}
                <ul className="space-y-3 mb-2 mt-auto">
                    {features.length > 0 ? features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-slate-600">
                            <div className="shrink-0 w-5 h-5 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center border border-blue-100">
                                <CheckCircle size={13} strokeWidth={2.5} />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{feature}</span>
                        </li>
                    )) : (
                        <>
                            <li className="flex items-center gap-2.5 text-slate-600">
                                <div className="shrink-0 w-5 h-5 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center border border-blue-100"><CheckCircle size={13} strokeWidth={2.5} /></div>
                                <span className="text-xs font-bold text-slate-700">0 Full Length Tests</span>
                            </li>
                            <li className="flex items-center gap-2.5 text-slate-600">
                                <div className="shrink-0 w-5 h-5 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center border border-blue-100"><CheckCircle size={13} strokeWidth={2.5} /></div>
                                <span className="text-xs font-bold text-slate-700">Detailed Performance Analysis</span>
                            </li>
                            <li className="flex items-center gap-2.5 text-slate-600">
                                <div className="shrink-0 w-5 h-5 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center border border-blue-100"><CheckCircle size={13} strokeWidth={2.5} /></div>
                                <span className="text-xs font-bold text-slate-700">Personalized Score Tracking</span>
                            </li>
                        </>
                    )}
                </ul>
            </div>

            {/* Pricing & CTA */}
            <div className="px-6 py-5 relative bg-slate-50/40 border-t border-slate-100 z-10 mt-2">
                <div className="absolute -right-4 -bottom-4 text-blue-50 opacity-40 pointer-events-none">
                    <Zap size={90} strokeWidth={1} fill="currentColor" />
                </div>

                <div className="flex items-center gap-1.5 mb-1.5 relative z-10">
                    <Award size={13} className="text-amber-500" strokeWidth={2.5} />
                    <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Certified Content</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-4 relative z-10">
                    <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                        {price === 'Free' || price === '0' || !price ? 'Free' : `₹${price}`}
                    </span>
                    {price && price !== 'Free' && price !== '0' && (
                        <>
                            <span className="text-slate-400 line-through text-xs font-bold mt-0.5">₹{originalPrice}</span>
                            {savingsAmount > 0 && (
                                <div className="ml-1 inline-flex items-center bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                    <span className="text-[10px] font-bold text-emerald-700">You Save ₹{savingsAmount} ({discountPercentage}%)</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {actions ? (
                    <div className="flex gap-2 relative z-10">
                        {actions}
                    </div>
                ) : (
                    <div className="flex gap-2.5 relative z-10">
                        <button
                            onClick={onExplore}
                            className="flex-1 py-2.5 px-3 bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors flex items-center justify-center cursor-pointer"
                        >
                            Explore
                        </button>
                        <button
                            onClick={onExplore}
                            className="flex-1 py-2.5 px-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            {price === 'Free' || price === '0' || !price ? 'Start Now' : 'Buy Now'}
                            <ArrowRight size={13} />
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default TestSeriesCard;

