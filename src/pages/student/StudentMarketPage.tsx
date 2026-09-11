import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Loader2, Sparkles, Filter, ChevronRight, BookOpen, Clock, 
    Award, FileText, Zap, ChevronDown, Trophy, Flame, TrendingUp, X,
    CheckCircle2, PlayCircle, Target, Layers, LayoutGrid
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import type { TestSeries } from '../../types/test.types';
import { getAllTestSeries, sortTestSeriesWithDemoFirst } from '../../services/testSeriesService';
import TestSeriesCard from '../../components/landing/TestSeriesCard';
import { loadRazorpay } from '../../utils/razorpay';
import { studentService } from '../../services/studentService';
import { useExamList } from '../../hooks/useExamList';
import { EXAM_SUBCATEGORIES } from '../../services/examService';

const TYPE_LABELS: Record<string, string> = {
    practice: 'Practice',
    mock: 'Full Length Mock',
    previous_year: 'Prev Year',
    full_length: 'Full Length Mock',
    subject_wise: 'Subject Wise',
    unit_wise: 'Unitwise',
    chapter_wise: 'Chapterwise',
};

const TYPE_COLORS: Record<string, string> = {
    practice: 'bg-blue-50 text-blue-700 border border-blue-100',
    mock: 'bg-purple-50 text-purple-700 border border-purple-100',
    previous_year: 'bg-green-50 text-green-700 border border-green-100',
    full_length: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    subject_wise: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    unit_wise: 'bg-pink-50 text-pink-700 border border-pink-100',
    chapter_wise: 'bg-amber-50 text-amber-700 border border-amber-100',
};

interface PurchasedTest {
    id: string;
    seriesId?: string;
    testId: string;
    testTitle: string;
    seriesTitle?: string;
    category?: string;
    subCategory?: string;
    price: number;
    purchaseDate: any;
}

interface TestItem {
    id: string;
    name: string;
    testType?: string;
    seriesId?: string;
    settings: {
        duration: number;
    };
    questions?: any[];
    questionIds?: string[];
    omrTemplate?: { totalQuestions: number };
}

interface Attempt {
    id: string;
    testId: string;
    score: number;
    attemptDate: any;
}

const getCategoryIcon = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('neet')) {
        return {
            bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
            icon: <Award className="w-8 h-8" />
        };
    }
    if (cat.includes('jee')) {
        return {
            bg: 'bg-amber-50 text-amber-600 border border-amber-100',
            icon: <Zap className="w-8 h-8" />
        };
    }
    if (cat.includes('ssc')) {
        return {
            bg: 'bg-blue-50 text-blue-600 border border-blue-100',
            icon: <Trophy className="w-8 h-8" />
        };
    }
    return {
        bg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
        icon: <BookOpen className="w-8 h-8" />
    };
};

// Attempt Mode Modal
const AttemptModeModal = ({ isOpen, onClose, onConfirm, testName }: { 
    isOpen: boolean, 
    onClose: () => void, 
    onConfirm: (mode: 'digital' | 'omr') => void,
    testName: string
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-white/20 relative"
                    >
                        <div className="bg-slate-900 px-8 py-10 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
                            >
                                <X size={20} />
                            </button>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg shadow-blue-600/30">
                                    <Zap size={28} className="fill-white text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2 tracking-tight">Attempt Mode</h2>
                                <p className="text-blue-100/80 text-sm font-medium">{testName}</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-4">
                            <button
                                type="button"
                                onClick={() => onConfirm('digital')}
                                className="w-full group p-5 bg-slate-50 border border-slate-100 rounded-[24px] flex items-center gap-5 hover:bg-white hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all text-left"
                            >
                                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <BookOpen size={28} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 text-lg tracking-tight">Interactive Digital</h3>
                                    <p className="text-slate-500 text-xs font-medium leading-relaxed mt-0.5">Real-time interface with automated grading.</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all">
                                    <ChevronRight size={18} />
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => onConfirm('omr')}
                                className="w-full group p-5 bg-slate-50 border border-slate-100 rounded-[24px] flex items-center gap-5 hover:bg-white hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all text-left"
                            >
                                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <FileText size={28} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 text-lg tracking-tight">OMR Simulation</h3>
                                    <p className="text-slate-500 text-xs font-medium leading-relaxed mt-0.5">Bubble sheet practice with PDF support.</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-all">
                                    <ChevronRight size={18} />
                                </div>
                            </button>

                            <p className="text-center text-[10px] text-slate-400 mt-6 uppercase tracking-[0.2em] font-bold">
                                Multi-mode support enabled for this session
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// Series Card for My Tests view
const SeriesCard = ({ 
    purchase, 
    seriesTests, 
    attemptsMap 
}: { 
    purchase: PurchasedTest, 
    seriesTests: TestItem[], 
    attemptsMap: Record<string, Attempt[]> 
}) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'attempted' | 'not_attempted'>('all');
    const [showAllTests, setShowAllTests] = useState(false);
    const [isModeModalOpen, setIsModeModalOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);

    const title = purchase.seriesTitle || purchase.testTitle;
    const totalTestsCount = seriesTests.length;
    const attemptedTests = seriesTests.filter(t => (attemptsMap[t.id] || []).length > 0);
    const attemptedCount = attemptedTests.length;
    
    const allScores = seriesTests.flatMap(t => attemptsMap[t.id] || []).map(a => a.score || 0);
    const bestScore = allScores.length > 0 ? Math.max(...allScores) : 0;
    const progress = totalTestsCount > 0 ? Math.round((attemptedCount / totalTestsCount) * 100) : 0;

    const filteredTests = seriesTests.filter(t => {
        const hasAttempts = (attemptsMap[t.id] || []).length > 0;
        if (activeFilter === 'attempted') return hasAttempts;
        if (activeFilter === 'not_attempted') return !hasAttempts;
        return true;
    });

    const displayedTests = showAllTests ? filteredTests : filteredTests.slice(0, 6);
    const styleInfo = getCategoryIcon(purchase.category);

    const purchaseDateObj = purchase.purchaseDate?.toDate ? purchase.purchaseDate.toDate() : new Date(purchase.purchaseDate || Date.now());
    const validityDateObj = new Date(purchaseDateObj);
    validityDateObj.setFullYear(validityDateObj.getFullYear() + 1);
    
    const formattedPurchaseDate = purchaseDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedValidityDate = validityDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <motion.div
            layout
            className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
        >
            {!isExpanded ? (
                <div
                    onClick={() => setIsExpanded(true)}
                    className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer group"
                >
                    <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${styleInfo.bg}`}>
                            {styleInfo.icon}
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
                                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                                    {purchase.category || 'Expert'}{purchase.subCategory ? ` (${purchase.subCategory})` : ''}
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">
                                Purchased on {formattedPurchaseDate} • Valid till {formattedValidityDate}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-8 lg:gap-12">
                        <div className="text-center min-w-[70px]">
                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Tests</span>
                            <span className="font-black text-slate-800 text-lg">{totalTestsCount}+</span>
                        </div>
                        <div className="text-center min-w-[70px]">
                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Attempted</span>
                            <span className="font-black text-slate-800 text-lg">{attemptedCount}</span>
                        </div>
                        <div className="text-center min-w-[70px]">
                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Best Score</span>
                            <span className="font-black text-emerald-600 text-lg">{bestScore > 0 ? `${bestScore.toFixed(1)}%` : '-'}</span>
                        </div>
                        <div className="min-w-[120px]">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                                <span>Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-24 lg:w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-all">
                            <ChevronDown size={20} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col">
                    <div className="bg-gradient-to-r from-[#0B2545] via-[#134074] to-[#0B2545] p-8 text-white relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
                        
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                <Trophy size={32} className="text-blue-300" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-2xl font-black tracking-tight">{title}</h3>
                                    <span className="bg-blue-500/30 text-blue-100 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-400/30">
                                        {purchase.category || 'Expert'}
                                    </span>
                                </div>
                                <p className="text-slate-300 text-xs font-semibold mt-1">
                                    Purchased on {formattedPurchaseDate} • Valid till {formattedValidityDate}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-8 lg:gap-12 relative z-10">
                            <div className="text-center min-w-[70px]">
                                <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">Total Tests</span>
                                <span className="font-black text-white text-2xl">{totalTestsCount}+</span>
                            </div>
                            <div className="text-center min-w-[70px]">
                                <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">Attempted</span>
                                <span className="font-black text-white text-2xl">{attemptedCount}</span>
                            </div>
                            <div className="text-center min-w-[70px]">
                                <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">Best Score</span>
                                <span className="font-black text-emerald-400 text-2xl">{bestScore > 0 ? `${bestScore.toFixed(1)}%` : '-'}</span>
                            </div>
                            <div className="min-w-[150px]">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 mb-1.5 uppercase">
                                    <span>Progress</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-400 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Active
                                </span>
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                                >
                                    <ChevronDown size={20} className="rotate-180" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="px-8 pt-6 pb-2 border-b border-slate-100 flex gap-6 bg-white">
                        <button
                            onClick={() => { setActiveFilter('all'); setShowAllTests(false); }}
                            className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
                                activeFilter === 'all' 
                                    ? 'border-blue-600 text-blue-600' 
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            All Tests ({totalTestsCount})
                        </button>
                        <button
                            onClick={() => { setActiveFilter('attempted'); setShowAllTests(false); }}
                            className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
                                activeFilter === 'attempted' 
                                    ? 'border-blue-600 text-blue-600' 
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            Attempted ({attemptedCount})
                        </button>
                        <button
                            onClick={() => { setActiveFilter('not_attempted'); setShowAllTests(false); }}
                            className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
                                activeFilter === 'not_attempted' 
                                    ? 'border-blue-600 text-blue-600' 
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            Not Attempted ({totalTestsCount - attemptedCount})
                        </button>
                    </div>

                    {/* Test items */}
                    <div className="bg-slate-50/50 p-8 space-y-4">
                        {displayedTests.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 font-bold text-sm bg-white rounded-3xl border border-slate-100">
                                No tests found matching the criteria.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {displayedTests.map((test) => {
                                    const testAttempts = attemptsMap[test.id] || [];
                                    const hasAttempted = testAttempts.length > 0;
                                    const testBestScore = hasAttempted ? Math.max(...testAttempts.map(a => a.score || 0)) : 0;

                                    return (
                                        <div key={test.id} className="bg-white p-6 rounded-[24px] border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-lg transition-all duration-300 group/item">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${hasAttempted ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    {hasAttempted ? <Award size={24} /> : <Target size={24} />}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 tracking-tight">{test.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-4 mt-2">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            <Clock size={12} />
                                                            {test.settings?.duration || 180} MINS
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            <FileText size={12} />
                                                            {test.questionIds?.length || 0} Qs
                                                        </div>
                                                        {test.testType && (
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${TYPE_COLORS[test.testType] || 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                                {TYPE_LABELS[test.testType] || test.testType}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8 lg:gap-12 flex-wrap lg:justify-end">
                                                <div className="text-center min-w-[70px]">
                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score</span>
                                                    <span className={`font-black text-sm ${hasAttempted ? 'text-green-600' : 'text-slate-400'}`}>
                                                        {hasAttempted ? `${testBestScore.toFixed(1)}%` : 'Not Attempted'}
                                                    </span>
                                                </div>

                                                <div className="text-center min-w-[120px]">
                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rank</span>
                                                    <span className="font-bold text-sm text-slate-700">
                                                        {hasAttempted ? `${Math.floor((100 - testBestScore) * 350 + 120)} / 45231` : '-'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {hasAttempted && (
                                                        <button
                                                            onClick={() => navigate('/dashboard/results')}
                                                            className="px-4 py-3 bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-900 hover:text-white transition-all border border-slate-200"
                                                        >
                                                            Analysis
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTest(test);
                                                            setIsModeModalOpen(true);
                                                        }}
                                                        className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                                                            hasAttempted
                                                                ? 'bg-slate-900 text-white hover:bg-blue-600'
                                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                                                        }`}
                                                    >
                                                        <PlayCircle size={14} />
                                                        {hasAttempted ? 'Reattempt' : 'Start Test'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {filteredTests.length > 6 && (
                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={() => setShowAllTests(!showAllTests)}
                                    className="px-6 py-3 bg-white text-slate-700 font-black text-xs uppercase tracking-widest rounded-full hover:bg-slate-900 hover:text-white transition-all border border-slate-200 flex items-center gap-2 shadow-sm"
                                >
                                    {showAllTests ? 'Show Less Tests' : `View All Tests (${filteredTests.length})`}
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${showAllTests ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AttemptModeModal 
                isOpen={isModeModalOpen}
                onClose={() => setIsModeModalOpen(false)}
                testName={selectedTest?.name || ''}
                onConfirm={(mode) => {
                    if (!selectedTest) return;
                    setIsModeModalOpen(false);
                    const path = mode === 'omr' 
                        ? `/dashboard/omr-attempt/${selectedTest.id}` 
                        : `/dashboard/attempt/${selectedTest.id}`;
                    navigate(path);
                }}
            />
        </motion.div>
    );
};

const StudentMarketPage = ({ defaultTab }: { defaultTab?: 'my-tests' | 'all-tests' }) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const profileData = authContext?.profileData;

    // Active Main Tab: 'my-tests' | 'all-tests'
    const tabFromUrl = searchParams.get('tab') as 'my-tests' | 'all-tests' | null;
    const [activeTab, setActiveTab] = useState<'my-tests' | 'all-tests'>(
        tabFromUrl || defaultTab || 'all-tests'
    );

    // Synchronize tab state with search params if URL changes
    useEffect(() => {
        if (tabFromUrl && (tabFromUrl === 'my-tests' || tabFromUrl === 'all-tests')) {
            setActiveTab(tabFromUrl);
        }
    }, [tabFromUrl]);

    const handleTabChange = (tab: 'my-tests' | 'all-tests') => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    // Catalog state (All Tests)
    const [tests, setTests] = useState<TestSeries[]>([]);
    const [purchasedTestIds, setPurchasedTestIds] = useState<Set<string>>(new Set());
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedSubCategory, setSelectedSubCategory] = useState('All');
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const exams = useExamList();

    // My Tests state
    const [purchasedTests, setPurchasedTests] = useState<PurchasedTest[]>([]);
    const [attemptsMap, setAttemptsMap] = useState<Record<string, Attempt[]>>({});
    const [mySeriesTests, setMySeriesTests] = useState<TestItem[]>([]);
    const [validSeriesIds, setValidSeriesIds] = useState<Set<string>>(new Set());
    const [isLoadingMyTests, setIsLoadingMyTests] = useState(true);

    // Fetch Catalog Tests
    useEffect(() => {
        const fetchTests = async () => {
            try {
                let data = await getAllTestSeries({ status: 'published' });
                if (!data || data.length === 0) {
                    data = await getAllTestSeries();
                }
                setTests(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching test series:", error);
                setTests([]);
            } finally {
                setIsLoadingCatalog(false);
            }
        };
        fetchTests();
    }, []);

    // Listen to User Purchases & Attempts
    useEffect(() => {
        if (!currentUser) {
            setIsLoadingMyTests(false);
            return;
        }

        try {
            const purchasesRef = collection(db, 'users', currentUser.uid, 'purchases');
            const unsubscribePurchases = onSnapshot(purchasesRef, (snapshot) => {
                if (snapshot && snapshot.docs) {
                    const ids = new Set(snapshot.docs.map(doc => doc.data()?.seriesId || doc.data()?.testId).filter(Boolean));
                    setPurchasedTestIds(ids);

                    const testsList = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as PurchasedTest[];
                    setPurchasedTests(testsList);
                }
                setIsLoadingMyTests(false);
            }, (err) => {
                console.error("Error loading user purchases snapshot:", err);
                setIsLoadingMyTests(false);
            });

            const attemptsRef = query(collection(db, 'users', currentUser.uid, 'attempts'), orderBy('attemptDate', 'desc'));
            const unsubscribeAttempts = onSnapshot(attemptsRef, (snapshot) => {
                const attempts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Attempt[];

                const map: Record<string, Attempt[]> = {};
                attempts.forEach(attempt => {
                    if (!map[attempt.testId]) map[attempt.testId] = [];
                    map[attempt.testId].push(attempt);
                });
                setAttemptsMap(map);
            }, (err) => {
                console.error("Error loading user attempts snapshot:", err);
            });

            return () => {
                unsubscribePurchases();
                unsubscribeAttempts();
            };
        } catch (err) {
            console.error("Purchases listener setup failed:", err);
            setIsLoadingMyTests(false);
        }
    }, [currentUser]);

    // Fetch tests of all purchased test series
    useEffect(() => {
        if (purchasedTests.length === 0) {
            setMySeriesTests([]);
            setValidSeriesIds(new Set());
            return;
        }

        const fetchAllMyTests = async () => {
            try {
                const seriesIds = purchasedTests.map(p => p.seriesId || p.testId).filter(Boolean);
                
                if (seriesIds.length > 0) {
                    const seriesChunks = [];
                    for (let i = 0; i < seriesIds.length; i += 30) {
                        seriesChunks.push(seriesIds.slice(i, i + 30));
                    }
                    
                    const existing = new Set<string>();
                    for (const chunk of seriesChunks) {
                        const qSeries = query(
                            collection(db, 'testSeries'),
                            where('__name__', 'in', chunk)
                        );
                        const snapshotSeries = await getDocs(qSeries);
                        snapshotSeries.docs.forEach(doc => {
                            existing.add(doc.id);
                        });
                    }
                    setValidSeriesIds(existing);

                    const validList = Array.from(existing);
                    if (validList.length > 0) {
                        const chunks = [];
                        for (let i = 0; i < validList.length; i += 30) {
                            chunks.push(validList.slice(i, i + 30));
                        }
                        
                        let fetched: TestItem[] = [];
                        for (const chunk of chunks) {
                            const q = query(
                                collection(db, 'tests'),
                                where('seriesId', 'in', chunk),
                                where('status', '==', 'published')
                            );
                            const snapshot = await getDocs(q);
                            const chunkTests = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            })) as TestItem[];
                            fetched = [...fetched, ...chunkTests];
                        }
                        setMySeriesTests(fetched);
                    } else {
                        setMySeriesTests([]);
                    }
                } else {
                    setValidSeriesIds(new Set());
                    setMySeriesTests([]);
                }
            } catch (error) {
                console.error("Error fetching all tests for purchased series:", error);
            }
        };

        fetchAllMyTests();
    }, [purchasedTests]);

    const handleBuy = async (series: TestSeries) => {
        if (!currentUser || !series?.id) return;
        if (purchasedTestIds.has(series.id)) return;

        setEnrollingId(series.id);
        try {
            if (series.pricing?.type === 'paid' && (series.pricing.amount || 0) > 0) {
                const res = await loadRazorpay();
                if (!res) {
                    alert('Razorpay SDK failed to load.');
                    setEnrollingId(null);
                    return;
                }

                const options = {
                    key: 'rzp_live_TAGGnZwDvZubIP',
                    amount: (series.pricing.amount || 0) * 100,
                    currency: 'INR',
                    name: 'Examinant',
                    description: `Purchase: ${series.name || 'Test Series'}`,
                    image: 'https://examinantt.web.app/logo192.png',
                    handler: async function (response: any) {
                        try {
                            await studentService.enrollInTestSeries(currentUser.uid, series, {
                                paymentId: response.razorpay_payment_id,
                                paymentStatus: 'completed'
                            }, {
                                displayName: currentUser.displayName,
                                email: currentUser.email,
                                phoneNumber: currentUser.phoneNumber,
                                fullName: profileData?.fullName,
                                mobile: profileData?.mobile
                            });
                            alert('Success! You are now enrolled.');
                            handleTabChange('my-tests');
                        } catch (err) {
                            console.error("Enrollment error:", err);
                        }
                    },
                    prefill: {
                        name: profileData?.fullName || currentUser.displayName || 'Student',
                        email: profileData?.email || currentUser.email || 'student@example.com'
                    },
                    theme: { color: '#2563eb' },
                    modal: { ondismiss: () => setEnrollingId(null) }
                };

                const paymentObject = new (window as any).Razorpay(options);
                paymentObject.open();
                setEnrollingId(null);
            } else {
                await studentService.enrollInTestSeries(currentUser.uid, series, {
                    paymentId: 'free',
                    paymentStatus: 'free'
                }, {
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    phoneNumber: currentUser.phoneNumber,
                    fullName: profileData?.fullName,
                    mobile: profileData?.mobile
                });
                setEnrollingId(null);
                handleTabChange('my-tests');
            }
        } catch (error) {
            console.error("Enrollment failed", error);
            setEnrollingId(null);
        }
    };

    // Filter catalog tests
    const filteredCatalogTests = sortTestSeriesWithDemoFirst((tests || []).filter(test => {
        if (!test) return false;
        const seriesName = test.name || (test as any).title || '';
        const category = test.examCategory || '';
        const subCategory = test.examSubCategory || '';
        const searchLower = (searchTerm || '').toLowerCase();
        const matchesSearch = (seriesName || '').toLowerCase().includes(searchLower) ||
            (category || '').toLowerCase().includes(searchLower);

        if (selectedCategory === 'Engineering entrance') {
            if (category === 'JEE') {
                return matchesSearch && (selectedSubCategory === 'All' || selectedSubCategory === 'JEE');
            }
        }
        if (selectedCategory === 'Medical entrance') {
            if (category === 'NEET') {
                return matchesSearch && (selectedSubCategory === 'All' || selectedSubCategory === 'NEET');
            }
        }

        const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
        const matchesSubCategory = selectedSubCategory === 'All' || subCategory === selectedSubCategory;
        return matchesSearch && matchesCategory && matchesSubCategory;
    }));

    // Aggregated stats for My Tests
    const filteredPurchasedTests = purchasedTests.filter(p => validSeriesIds.has(p.seriesId || p.testId));
    const totalPurchasedCount = filteredPurchasedTests.length;
    const totalMyTestsCount = mySeriesTests.length;
    const attemptedTestIds = new Set(Object.keys(attemptsMap));
    const testsAttemptedCount = mySeriesTests.filter(t => attemptedTestIds.has(t.id)).length;

    let totalScore = 0;
    let attemptsCount = 0;
    const validTestIds = new Set(mySeriesTests.map(t => t.id));
    Object.values(attemptsMap).flat().forEach(attempt => {
        if (attempt.score !== undefined && validTestIds.has(attempt.testId)) {
            totalScore += attempt.score;
            attemptsCount++;
        }
    });
    const averageScore = attemptsCount > 0 ? (totalScore / attemptsCount).toFixed(1) : '0';

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Top Page Header & Segmented Tab Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200/80">
                <div>
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <Sparkles size={18} className="fill-blue-600" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Examinant Test Arena</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Test Series</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Practice real exam simulations, track your scores, or explore new test series.
                    </p>
                </div>

                {/* Segmented Heading Tabs: My Test Series & All Test Series */}
                <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200 shadow-inner self-start md:self-auto">
                    <button
                        onClick={() => handleTabChange('my-tests')}
                        className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 ${
                            activeTab === 'my-tests'
                                ? 'bg-white text-blue-600 shadow-md shadow-slate-200 scale-[1.02]'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                        <Layers size={16} />
                        <span>My Test Series</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'my-tests' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                            {totalPurchasedCount}
                        </span>
                    </button>

                    <button
                        onClick={() => handleTabChange('all-tests')}
                        className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 ${
                            activeTab === 'all-tests'
                                ? 'bg-white text-blue-600 shadow-md shadow-slate-200 scale-[1.02]'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                        <LayoutGrid size={16} />
                        <span>All Test Series</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'all-tests' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                            {tests.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* TAB 1: MY TEST SERIES */}
            {activeTab === 'my-tests' && (
                <div className="space-y-10">
                    {/* Stats Cards Row */}
                    {!isLoadingMyTests && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                            <div className="bg-[#EEF4FF] rounded-3xl p-6 border border-blue-50/50 flex flex-col justify-between h-36">
                                <div className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <span className="block text-[10px] text-blue-600/80 font-black uppercase tracking-wider mb-1">My Test Series</span>
                                    <span className="font-black text-slate-900 text-3xl">{totalPurchasedCount}</span>
                                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Purchased</span>
                                </div>
                            </div>

                            <div className="bg-[#ECFDF5] rounded-3xl p-6 border border-emerald-50/50 flex flex-col justify-between h-36">
                                <div className="w-10 h-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <span className="block text-[10px] text-emerald-600/80 font-black uppercase tracking-wider mb-1">Tests Available</span>
                                    <span className="font-black text-slate-900 text-3xl">{totalMyTestsCount}</span>
                                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">In My Series</span>
                                </div>
                            </div>

                            <div className="bg-[#F5F3FF] rounded-3xl p-6 border border-purple-50/50 flex flex-col justify-between h-36">
                                <div className="w-10 h-10 bg-white text-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <span className="block text-[10px] text-purple-600/80 font-black uppercase tracking-wider mb-1">Tests Attempted</span>
                                    <span className="font-black text-slate-900 text-3xl">{testsAttemptedCount}</span>
                                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Keep it up!</span>
                                </div>
                            </div>

                            <div className="bg-[#FFFBEB] rounded-3xl p-6 border border-amber-50/50 flex flex-col justify-between h-36">
                                <div className="w-10 h-10 bg-white text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <span className="block text-[10px] text-amber-600/80 font-black uppercase tracking-wider mb-1">Average Score</span>
                                    <span className="font-black text-slate-900 text-3xl">{averageScore}%</span>
                                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Across all tests</span>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-6 border border-orange-100/50 flex flex-col justify-between h-36 relative overflow-hidden">
                                <div className="absolute right-2 bottom-2 opacity-15 pointer-events-none">
                                    <Flame size={72} className="text-orange-500 fill-orange-500" />
                                </div>
                                <div>
                                    <span className="block text-xs font-black text-orange-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        Keep Pushing! <Flame size={12} className="fill-orange-600" />
                                    </span>
                                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed max-w-[160px]">
                                        Consistency is the key to exam success.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* List of Purchased Series */}
                    <div className="space-y-6">
                        {isLoadingMyTests ? (
                            <div className="flex justify-center py-24">
                                <Loader2 className="animate-spin text-blue-600" size={40} />
                            </div>
                        ) : filteredPurchasedTests.length === 0 ? (
                            <div className="text-center py-28 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-sm text-slate-300">
                                    <BookOpen size={36} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No Purchased Test Series Yet</h3>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto font-medium text-sm">
                                    You haven't enrolled in any test series yet. Explore the All Test Series tab to start practicing.
                                </p>
                                <button
                                    onClick={() => handleTabChange('all-tests')}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-sm shadow-xl shadow-blue-600/30 mx-auto transition-all active:scale-95"
                                >
                                    <LayoutGrid size={16} />
                                    Explore All Test Series
                                </button>
                            </div>
                        ) : (
                            filteredPurchasedTests.map((purchase) => {
                                const seriesId = purchase.seriesId || purchase.testId;
                                const seriesTests = mySeriesTests.filter(t => t.seriesId === seriesId);
                                return (
                                    <SeriesCard 
                                        key={purchase.id} 
                                        purchase={purchase} 
                                        seriesTests={seriesTests} 
                                        attemptsMap={attemptsMap} 
                                    />
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: ALL TESTS (MARKETPLACE CATALOG) */}
            {activeTab === 'all-tests' && (
                <div className="space-y-8">
                    {/* Filters & Search Row */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/70 p-4 rounded-3xl border border-slate-100">
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            <div className="relative group min-w-[200px]">
                                <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        setSelectedSubCategory('All');
                                    }}
                                    className="w-full pl-10 pr-6 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 text-slate-700 font-bold text-xs shadow-sm transition-all appearance-none cursor-pointer"
                                >
                                    <option value="All">All Categories</option>
                                    {(exams || [])
                                        .filter(exam => {
                                            if (!exam) return false;
                                            const subcategories = Object.values(EXAM_SUBCATEGORIES || {})
                                                .flat()
                                                .map(sub => (sub || '').toLowerCase());
                                            return !subcategories.includes((exam || '').toLowerCase());
                                        })
                                        .map(exam => (
                                            <option key={exam} value={exam}>{exam}</option>
                                        ))}
                                </select>
                            </div>
                            {EXAM_SUBCATEGORIES[selectedCategory] && (
                                <div className="relative group min-w-[200px]">
                                    <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    <select
                                        value={selectedSubCategory}
                                        onChange={(e) => setSelectedSubCategory(e.target.value)}
                                        className="w-full pl-10 pr-6 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 text-slate-700 font-bold text-xs shadow-sm transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="All">All Subcategories</option>
                                        {EXAM_SUBCATEGORIES[selectedCategory].map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="relative flex-1 w-full lg:max-w-md group">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by exam or subject..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-bold text-xs shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Catalog Grid */}
                    {isLoadingCatalog ? (
                        <div className="flex justify-center py-32">
                            <Loader2 className="animate-spin text-blue-600" size={48} />
                        </div>
                    ) : filteredCatalogTests.length === 0 ? (
                        <div className="text-center py-28 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-sm text-slate-300">
                                <Search size={36} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No Test Series Found</h3>
                            <p className="text-slate-500 font-medium text-sm">Try adjusting your filters or search keywords.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredTestCatalogItem(filteredCatalogTests, purchasedTestIds, enrollingId, navigate, handleBuy)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Helper for rendering catalog test items
function filteredTestCatalogItem(
    testsList: TestSeries[], 
    purchasedTestIds: Set<string>, 
    enrollingId: string | null, 
    navigate: any, 
    handleBuy: (series: TestSeries) => void
) {
    return testsList.map((series) => {
        const isOwned = purchasedTestIds.has(series.id);
        const isBuying = enrollingId === series.id;
        const isFree = series.pricing?.type === 'free' || !series.pricing?.amount || series.pricing.amount === 0;

        const actionButton = isOwned ? (
            <>
                <button
                    onClick={() => navigate(`/test-series/${series.id}`)}
                    className="flex-1 h-14 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-200"
                >
                    Explore
                </button>
                <div className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-default">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    Enrolled
                </div>
            </>
        ) : (
            <>
                <button
                    onClick={() => navigate(`/test-series/${series.id}`)}
                    className="flex-1 h-14 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-200"
                >
                    Explore
                </button>
                <button
                    onClick={() => handleBuy(series)}
                    disabled={isBuying}
                    className="flex-1 group/btn relative h-14 bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider rounded-2xl overflow-hidden transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait shadow-xl shadow-blue-500/20"
                >
                    <div className="absolute inset-0 bg-slate-900 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative z-10 flex items-center justify-center gap-1">
                        {isBuying ? (
                            <Loader2 className="animate-spin" size={14} />
                        ) : (
                            <>
                                {isFree ? 'Free' : `Unlock`}
                                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </>
                        )}
                    </span>
                </button>
            </>
        );

        return (
            <div key={series.id} className="relative">
                <TestSeriesCard
                    id={series.id}
                    title={series.name}
                    description={series.description}
                    isNew={!!(series as any).isNew}
                    features={(series as any).features || []}
                    originalPrice={series.pricing?.type === 'paid' ? `${Math.floor((series.pricing.amount || 0) * 4)}` : '0'}
                    price={series.pricing?.type === 'paid' ? `${series.pricing.amount}` : 'Free'}
                    colorTheme="blue"
                    examCategory={series.examCategory}
                    examSubCategory={series.examSubCategory}
                    testCount={(series as any).testIds?.length || 0}
                    actions={actionButton}
                />
            </div>
        );
    });
}

export default StudentMarketPage;
