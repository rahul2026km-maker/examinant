import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Loader2, ChevronDown, PlayCircle, BookOpen, Award, FileText, Zap, Download, Scan, ChevronRight, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, getDocs, orderBy } from 'firebase/firestore';

interface PurchasedTest {
    id: string; // Purchase ID
    seriesId?: string; // New field
    testId: string; // Legacy/Fallback
    testTitle: string; // or seriesTitle
    seriesTitle?: string;
    category?: string;
    subCategory?: string;
    price: number;
    purchaseDate: any;
}

interface TestItem {
    id: string;
    name: string;
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

// Dummy X icon for modal
const X = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const SeriesCard = ({ purchase, attemptsMap }: { purchase: PurchasedTest, attemptsMap: Record<string, Attempt[]> }) => {
    const navigate = useNavigate();
    const [tests, setTests] = useState<TestItem[]>([]);
    const [loadingTests, setLoadingTests] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
    const [isModeModalOpen, setIsModeModalOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);

    const seriesId = purchase.seriesId || purchase.testId;
    const title = purchase.seriesTitle || purchase.testTitle;

    useEffect(() => {
        const fetchTests = async () => {
            if (!seriesId) return;
            setLoadingTests(true);
            try {
                const q = query(
                    collection(db, 'tests'),
                    where('seriesId', '==', seriesId)
                );
                const snapshot = await getDocs(q);
                const fetchedTests = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as TestItem[];
                setTests(fetchedTests);
            } catch (error) {
                console.error("Failed to fetch tests", error);
            } finally {
                setLoadingTests(false);
            }
        };

        if (isExpanded) fetchTests();
    }, [seriesId, isExpanded]);

    return (
        <motion.div
            layout
            className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
        >
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-8 flex items-center justify-between cursor-pointer group"
            >
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                                {purchase.category || 'Expert'}{purchase.subCategory ? ` (${purchase.subCategory})` : ''}
                            </span>
                        </div>
                        <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">
                            Unlocked {purchase.purchaseDate?.toDate().toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 transition-all ${isExpanded ? 'rotate-180 bg-slate-900 text-white' : ''}`}>
                    <ChevronDown size={20} />
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50/50"
                    >
                        <div className="px-8 pb-8 space-y-4">
                            {loadingTests ? (
                                <div className="py-12 flex justify-center">
                                    <Loader2 className="animate-spin text-blue-600" size={24} />
                                </div>
                            ) : tests.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 font-bold text-sm">
                                    No modules found in this series.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tests.map((test) => {
                                        const testAttempts = attemptsMap[test.id] || [];
                                        const hasAttempted = testAttempts.length > 0;

                                        return (
                                            <div key={test.id} className="bg-white p-6 rounded-[24px] border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-lg transition-all duration-300 group/item">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${hasAttempted ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                                                        {hasAttempted ? <Award size={24} /> : <Target size={24} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 tracking-tight">{test.name}</h4>
                                                        <div className="flex items-center gap-4 mt-1.5">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                <Clock size={12} />
                                                                {test.settings?.duration || 180} MINS
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                <FileText size={12} />
                                                                {test.questionIds?.length || 0} Qs
                                                            </div>
                                                            {hasAttempted && (
                                                                <div className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[10px] font-black uppercase tracking-widest">
                                                                    Best: {Math.max(...testAttempts.map(a => a.score))}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap lg:justify-end">
                                                    <button
                                                        onClick={() => window.open(`/dashboard/print-omr/${test.id}`, '_blank')}
                                                        className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                                                        title="Download OMR"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate('/dashboard/omr-scan')}
                                                        className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                                        title="Scan OMR"
                                                    >
                                                        <Scan size={18} />
                                                    </button>
                                                    {hasAttempted && (
                                                        <button
                                                            onClick={() => navigate('/dashboard/results')}
                                                            className="px-5 py-3 bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                                                        >
                                                            Analysis
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTest(test);
                                                            setIsModeModalOpen(true);
                                                        }}
                                                        className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${hasAttempted
                                                            ? 'bg-slate-900 text-white hover:bg-blue-600'
                                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                                                            }`}
                                                    >
                                                        <PlayCircle size={16} />
                                                        {hasAttempted ? 'Re-Take' : 'Begin Test'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
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
            </AnimatePresence>
        </motion.div>
    );
};

const StudentTestsPage = () => {
    const navigate = useNavigate();
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const [purchasedTests, setPurchasedTests] = useState<PurchasedTest[]>([]);
    const [attemptsMap, setAttemptsMap] = useState<Record<string, Attempt[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            const unsubscribePurchases = onSnapshot(collection(db, 'users', currentUser.uid, 'purchases'), (snapshot) => {
                const tests = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as PurchasedTest[];
                setPurchasedTests(tests);
                setIsLoading(false);
            });

            const unsubscribeAttempts = onSnapshot(
                query(collection(db, 'users', currentUser.uid, 'attempts'), orderBy('attemptDate', 'desc')),
                (snapshot) => {
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
                }
            );

            return () => {
                unsubscribePurchases();
                unsubscribeAttempts();
            };
        }
    }, [currentUser]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <motion.div
            className="max-w-7xl mx-auto space-y-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Your Library</h1>
                    <p className="text-slate-500 font-medium">Manage your test series and track your progress.</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard/market')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    Browse Marketplace
                    <ChevronRight size={18} strokeWidth={2.5} />
                </button>
            </div>

            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-600" size={40} />
                    </div>
                ) : purchasedTests.length === 0 ? (
                    <div className="text-center py-32 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm text-slate-300">
                            <BookOpen size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No Test Series Found</h3>
                        <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">
                            Your library is currently empty. Start your journey by choosing a test series from our market.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard/market')}
                            className="btn-primary-premium"
                        >
                            Explore Market
                        </button>
                    </div>
                ) : (
                    purchasedTests.map((purchase) => (
                        <SeriesCard key={purchase.id} purchase={purchase} attemptsMap={attemptsMap} />
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default StudentTestsPage;
