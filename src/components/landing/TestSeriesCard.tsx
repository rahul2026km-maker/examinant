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
        <div className="group bg-white rounded-[28px] border border-slate-100 flex flex-col h-full overflow-hidden relative shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.1)] transition-all duration-300">
            
            <div className="p-7 pb-2 flex-1 flex flex-col z-10">
                {/* Header Area */}
                <div className="flex justify-between items-start mb-5">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                {examCategory ? `${examCategory} Mastery` : 'Academic Mastery'}
                            </span>
                        </div>
                        {isNew ? (
                            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100/50 text-blue-600 px-3 py-1 rounded-full">
                                <Sparkles size={12} className="text-blue-500" />
                                <span className="text-[10px] font-extrabold tracking-widest uppercase">Early Access</span>
                            </div>
                        ) : null}
                    </div>
                    <BookOpen className="text-slate-800" size={24} strokeWidth={2} />
                </div>

                {/* Title & Description */}
                <div className="mb-6">
                    <h3 className="text-[22px] font-black text-slate-900 leading-tight mb-3">
                        {title}
                    </h3>
                    <p className="text-[14px] text-slate-500 leading-relaxed font-medium">
                        {description || "Elevate your preparation with our premium test series designed by top educators."}
                    </p>
                </div>

                {/* Info Pills */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <div className="flex items-center gap-2 border border-slate-100 rounded-[14px] px-3.5 py-2 bg-white">
                        <ScrollText size={16} className="text-blue-500" />
                        <span className="text-[13px] font-bold text-slate-700">{testCount || 0} Full Tests</span>
                    </div>
                    <div className="flex items-center gap-2 border border-slate-100 rounded-[14px] px-3.5 py-2 bg-white">
                        <Target size={16} className="text-blue-500" />
                        <span className="text-[13px] font-bold text-slate-700">Topic Wise</span>
                    </div>
                </div>

                {/* Feature List */}
                <ul className="space-y-3.5 mb-2 mt-auto">
                    {features.length > 0 ? features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-600">
                            <div className="shrink-0 w-[22px] h-[22px] bg-blue-50/80 text-blue-500 rounded-full flex items-center justify-center">
                                <CheckCircle size={14} strokeWidth={2.5} />
                            </div>
                            <span className="text-[13px] font-bold text-slate-700">{feature}</span>
                        </li>
                    )) : (
                        <>
                            <li className="flex items-center gap-3 text-slate-600">
                                <div className="shrink-0 w-[22px] h-[22px] bg-blue-50/80 text-blue-500 rounded-full flex items-center justify-center"><CheckCircle size={14} strokeWidth={2.5} /></div>
                                <span className="text-[13px] font-bold text-slate-700">0 Full Length Tests</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-600">
                                <div className="shrink-0 w-[22px] h-[22px] bg-blue-50/80 text-blue-500 rounded-full flex items-center justify-center"><CheckCircle size={14} strokeWidth={2.5} /></div>
                                <span className="text-[13px] font-bold text-slate-700">Detailed Performance Analysis</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-600">
                                <div className="shrink-0 w-[22px] h-[22px] bg-blue-50/80 text-blue-500 rounded-full flex items-center justify-center"><CheckCircle size={14} strokeWidth={2.5} /></div>
                                <span className="text-[13px] font-bold text-slate-700">Personalized Score Tracking</span>
                            </li>
                        </>
                    )}
                </ul>
            </div>

            {/* Pricing & CTA */}
            <div className="px-7 py-6 relative bg-white z-10 mt-4">
                <div className="absolute -right-4 -bottom-4 text-blue-50 opacity-60 pointer-events-none">
                    <Zap size={100} strokeWidth={1} fill="currentColor" />
                </div>
                
                <div className="flex items-center gap-2 mb-2 relative z-10">
                    <Award size={14} className="text-amber-400" strokeWidth={2.5} />
                    <span className="text-[11px] font-black text-slate-300 tracking-widest uppercase">Certified Content</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-5 relative z-10">
                    <span className="text-[34px] font-black text-slate-900 tracking-tight leading-none">
                        {price === 'Free' || price === '0' || !price ? 'Free' : `₹${price}`}
                    </span>
                    {price && price !== 'Free' && price !== '0' && (
                        <>
                            <span className="text-slate-400 line-through text-[15px] font-bold mt-1">₹{originalPrice}</span>
                            {savingsAmount > 0 && (
                                <div className="ml-2 inline-flex items-center bg-green-50/50 border border-green-200 px-2.5 py-1 rounded-full mt-1">
                                    <span className="text-[11px] font-black text-amber-700">You Save ₹{savingsAmount} ({discountPercentage}%)</span>
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
                    <div className="flex gap-3 relative z-10">
                        <button
                            onClick={onExplore}
                            className="flex-1 py-3 px-3 bg-slate-900 text-white hover:bg-black shadow-sm hover:shadow-md hover:-translate-y-0.5 rounded-[14px] font-bold text-[13px] transition-all duration-200 flex items-center justify-center"
                        >
                            Explore
                        </button>
                        <button
                            onClick={onExplore}
                            className="flex-1 py-3 px-3 bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 rounded-[14px] font-bold text-[13px] transition-all duration-200 flex items-center justify-center gap-1.5"
                        >
                            {price === 'Free' || price === '0' || !price ? 'Start Now' : 'Buy Now'}
                            <ArrowRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestSeriesCard;

