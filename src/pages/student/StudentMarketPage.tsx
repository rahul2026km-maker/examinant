import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import type { TestSeries } from '../../types/test.types';
import { getAllTestSeries, sortTestSeriesWithDemoFirst } from '../../services/testSeriesService';
import TestSeriesCard from '../../components/landing/TestSeriesCard';
import { loadRazorpay } from '../../utils/razorpay';
import { studentService } from '../../services/studentService';
import { useExamList } from '../../hooks/useExamList';
import { EXAM_SUBCATEGORIES } from '../../services/examService';

const StudentMarketPage = () => {
    const navigate = useNavigate();
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const profileData = authContext?.profileData;
    const [tests, setTests] = useState<TestSeries[]>([]);
    const [purchasedTestIds, setPurchasedTestIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedSubCategory, setSelectedSubCategory] = useState('All');
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const exams = useExamList();

    // Fetch Tests (Real Data)
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
                setIsLoading(false);
            }
        };
        fetchTests();
    }, []);

    // Fetch User Purchases
    useEffect(() => {
        if (currentUser) {
            try {
                const purchasesRef = collection(db, 'users', currentUser.uid, 'purchases');
                const unsubscribePurchases = onSnapshot(purchasesRef, (snapshot) => {
                    if (snapshot && snapshot.docs) {
                        const ids = new Set(snapshot.docs.map(doc => doc.data()?.seriesId || doc.data()?.testId).filter(Boolean));
                        setPurchasedTestIds(ids);
                    }
                }, (err) => {
                    console.error("Error loading user purchases snapshot:", err);
                });
                return () => unsubscribePurchases();
            } catch (err) {
                console.error("Purchases listener setup failed:", err);
            }
        }
    }, [currentUser]);

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
                            navigate('/dashboard/tests');
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
                navigate('/dashboard/tests');
            }
        } catch (error) {
            console.error("Enrollment failed", error);
            setEnrollingId(null);
        }
    };

    const filteredTests = sortTestSeriesWithDemoFirst((tests || []).filter(test => {
        if (!test) return false;
        const seriesName = test.name || (test as any).title || '';
        const category = test.examCategory || '';
        const subCategory = test.examSubCategory || '';
        const searchLower = (searchTerm || '').toLowerCase();
        const matchesSearch = (seriesName || '').toLowerCase().includes(searchLower) ||
            (category || '').toLowerCase().includes(searchLower);

        // Legacy fallback matching:
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

    return (
        <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <Sparkles size={20} className="fill-blue-600" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Premium Content</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Marketplace</h1>
                    <p className="text-slate-500 font-medium">Explore hand-crafted test series for your target exams.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="relative group min-w-[200px]">
                        <Filter size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setSelectedSubCategory('All');
                            }}
                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 text-slate-700 font-bold text-sm shadow-sm transition-all appearance-none cursor-pointer"
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
                            <Filter size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" />
                            <select
                                value={selectedSubCategory}
                                onChange={(e) => setSelectedSubCategory(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 text-slate-700 font-bold text-sm shadow-sm transition-all appearance-none cursor-pointer"
                            >
                                <option value="All">All Subcategories</option>
                                {EXAM_SUBCATEGORIES[selectedCategory].map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="relative flex-1 sm:min-w-[400px] group">
                        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by exam or subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-8 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all font-bold text-sm shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-32">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                </div>
            ) : filteredTests.length === 0 ? (
                <div className="text-center py-32 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm text-slate-300">
                        <Search size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No Results Found</h3>
                    <p className="text-slate-500 font-medium">Try adjusting your filters or search keywords.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filteredTests.map((series) => {
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
                                    <Sparkles size={12} className="fill-blue-500 text-blue-500" />
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
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentMarketPage;

