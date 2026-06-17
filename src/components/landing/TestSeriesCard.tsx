import { CheckCircle, ArrowRight, Zap, Target, ScrollText, Award, Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface TestSeriesProps {
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
    testCount?: number;
    thumbnailUrl?: string;
}

const TestSeriesCard = ({ 
    title, 
    description,
    isNew, 
    features = [], 
    originalPrice, 
    price, 
    onExplore,
    actions,
    examCategory,
    testCount,
    thumbnailUrl
}: TestSeriesProps) => {

    return (
        <motion.div 
            whileHover={{ y: -10, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group relative bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-12px_rgba(37,99,235,0.15)] flex flex-col h-full"
        >
            {/* Top Glow Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>

            {/* Thumbnail Image */}
            {thumbnailUrl && (
                <div className="w-full h-40 overflow-hidden relative border-b border-slate-100 shrink-0">
                    <img 
                        src={thumbnailUrl} 
                        alt={title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
            )}

            {/* Header Area */}
            <div className={`px-8 ${thumbnailUrl ? 'pt-6' : 'pt-8'} pb-4 flex justify-between items-start`}>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                            {examCategory || 'Academic'} Mastery
                        </span>
                    </div>
                    {isNew && (
                        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
                            <Sparkles size={12} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Early Access</span>
                        </div>
                    )}
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <BookOpen size={20} />
                </div>
            </div>

            <div className="px-8 pb-8 flex-1 flex flex-col">
                {/* Title & Description */}
                <div className="mb-6">
                    <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight mb-3 group-hover:text-blue-600 transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">
                        {description || "Elevate your preparation with our premium test series designed by top educators."}
                    </p>
                </div>

                {/* Info Pills */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                        <ScrollText size={14} className="text-blue-600" />
                        <span className="text-xs font-bold text-slate-700">{testCount || 12} Full Tests</span>
                    </div>
                    <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                        <Target size={14} className="text-indigo-600" />
                        <span className="text-xs font-bold text-slate-700">Topic Wise</span>
                    </div>
                </div>

                {/* Feature List */}
                <ul className="space-y-3 mb-8">
                    {features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-600">
                            <div className="shrink-0 w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                <CheckCircle size={12} />
                            </div>
                            <span className="text-xs font-bold leading-none">{feature}</span>
                        </li>
                    ))}
                </ul>

                {/* Pricing & CTA */}
                <div className="mt-auto pt-6 border-t border-slate-50">
                    <div className="flex items-end justify-between mb-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 opacity-50">
                                <Award size={12} className="text-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Certified Content</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-900 tracking-tighter">
                                    {price === 'Free' || price === '0' || !price ? 'FREE' : `₹${price}`}
                                </span>
                                {price && price !== 'Free' && price !== '0' && (
                                    <span className="text-slate-300 line-through text-sm font-bold tracking-tight">₹{originalPrice}</span>
                                )}
                            </div>
                        </div>
                        <div className="text-blue-600/10 group-hover:text-blue-600/20 transition-colors">
                            <Zap size={40} />
                        </div>
                    </div>

                    {actions ? (
                        <div className="flex gap-2">
                            {actions}
                        </div>
                    ) : (
                        <button
                            onClick={onExplore}
                            className="w-full relative group/btn overflow-hidden h-14 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-300 hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Explore Series
                            <ArrowRight size={18} className="group-hover/btn:translate-x-1.5 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default TestSeriesCard;

