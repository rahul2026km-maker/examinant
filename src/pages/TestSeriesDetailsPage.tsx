import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Clock,
    BookOpen,
    CheckCircle,
    AlertCircle,
    ShoppingCart,
    Loader2,
    PlayCircle,
    Award,
    Layers,
    FileText,
    Target,
    Star,
    ShieldCheck,
    Smartphone,
    Lock,
    Search,
    Check
} from 'lucide-react';
import { loadRazorpay } from '../utils/razorpay';
import { useAuth } from '../contexts/AuthContext';
import { getTestSeries, getTestsBySeriesId } from '../services/testSeriesService';
import { studentService } from '../services/studentService';
import { db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import type { TestSeries, Test } from '../types/test.types';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

interface Attempt {
    id: string;
    testId: string;
    score: number;
    attemptDate: any;
}

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

const TestSeriesDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser, profileData } = useAuth() || {};

    const [series, setSeries] = useState<TestSeries | null>(null);
    const [tests, setTests] = useState<Test[]>([]);
    const [attemptsMap, setAttemptsMap] = useState<Record<string, Attempt[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isOwned, setIsOwned] = useState(false);

    const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 10, minutes: 46, seconds: 39 });

    const [activeTab, setActiveTab] = useState<'all' | 'mock' | 'subject' | 'unit' | 'chapter'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [couponDiscount, setCouponDiscount] = useState(0);

    const handleApplyCoupon = () => {
        if (!couponCode.trim()) return;
        const code = couponCode.trim().toUpperCase();
        const expiredCodes = ['SAVE50', 'EXAM50', 'GET50', 'EXTRA50', 'OFF50'];

        if (code === 'EX14931JUL') {
            const currentAmount = series?.pricing?.amount || 299;
            // 50% discount on test series price (e.g. 299 - 150 = 149)
            let discount = Math.round(currentAmount * 0.5);
            if (currentAmount === 299) {
                discount = 150; // Brings ₹299 down to exactly ₹149
            }
            setCouponDiscount(discount);
            setAppliedCoupon(code);
            setCouponError(null);
        } else if (expiredCodes.includes(code)) {
            setCouponError('This promo code has EXPIRED. Please use EX14931JUL.');
            setCouponDiscount(0);
            setAppliedCoupon(null);
        } else {
            setCouponError('Invalid coupon code');
            setCouponDiscount(0);
            setAppliedCoupon(null);
        }
    };

    const sortedTests = [...tests].sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
    });
    const firstTestId = sortedTests[0]?.id;

    const filteredAndSearchedTests = tests.filter(test => {
        // Search Filter
        if (searchQuery && !test.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        // Tab Filter
        if (activeTab === 'all') return true;
        if (activeTab === 'mock') {
            return test.testType === 'full_length' || test.testType === 'mock' || test.testType === 'previous_year';
        }
        if (activeTab === 'subject') return test.testType === 'subject_wise';
        if (activeTab === 'unit') return test.testType === 'unit_wise';
        if (activeTab === 'chapter') return test.testType === 'chapter_wise';
        return true;
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else if (prev.minutes > 0) {
                    return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                } else if (prev.hours > 0) {
                    return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                } else if (prev.days > 0) {
                    return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
                } else {
                    clearInterval(timer);
                    return prev;
                }
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchSeries = async () => {
            if (!id) return;
            try {
                // Fetch Series Details
                const data = await getTestSeries(id);
                setSeries(data);

                // Fetch Tests in the series
                const testsData = await getTestsBySeriesId(id);
                setTests(testsData || []);

                // Check ownership if logged in
                if (currentUser && data) {
                    const purchasesRef = collection(db, 'users', currentUser.uid, 'purchases');
                    const q = query(purchasesRef, where('seriesId', '==', id));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        setIsOwned(true);
                    }
                }
            } catch (error) {
                console.error("Error details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSeries();
    }, [id, currentUser]);

    useEffect(() => {
        if (currentUser) {
            const attemptsRef = collection(db, 'users', currentUser.uid, 'attempts');
            const unsubscribeAttempts = onSnapshot(
                query(attemptsRef, orderBy('attemptDate', 'desc')),
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
                },
                (error) => {
                    console.error("Error listening to attempts:", error);
                }
            );
            return () => unsubscribeAttempts();
        }
    }, [currentUser]);

    const handleEnroll = async () => {
        if (!currentUser) {
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }

        if (!series) return;

        setIsEnrolling(true);
        try {
            if (series?.pricing?.type === 'paid') {
                const res = await loadRazorpay();

                if (!res) {
                    alert('Razorpay SDK failed to load. Are you online?');
                    setIsEnrolling(false);
                    return;
                }

                const finalPrice = Math.max(0, (series?.pricing?.amount || 0) - couponDiscount);

                const options = {
                    key: 'rzp_live_TAGGnZwDvZubIP', // Enter the Key ID generated from the Dashboard
                    amount: finalPrice * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                    currency: 'INR',
                    name: 'Examinant',
                    description: `Purchase ${series.name}`,
                    image: 'https://examinantt.web.app/logo192.png', // Optional logic for logo
                    handler: async function (response: any) {
                        try {
                            // In a real app, verify signature on backend: response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature
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
                            setIsOwned(true);
                            alert('Payment Successful!');
                            navigate('/dashboard/tests');
                        } catch (err) {
                            console.error("Enrollment error after payment:", err);
                            alert("Payment successful but enrollment failed. Please contact support.");
                        }
                    },
                    prefill: {
                        name: profileData?.fullName || currentUser.displayName || 'Student',
                        email: profileData?.email || currentUser.email || 'student@example.com',
                        contact: profileData?.mobile || '' // valid phone number could be added if available
                    },
                    notes: {
                        address: 'Examinant Corporate Office'
                    },
                    theme: {
                        color: '#3399cc'
                    }
                };


                const paymentObject = new (window as any).Razorpay(options);
                paymentObject.open();
                setIsEnrolling(false); // Reset loading since modal is open
                return; // Stop here, handler takes over
            } else {
                // Free Series
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
                setIsOwned(true);
                alert('Enrolled successfully!');
                navigate('/dashboard/tests');
            }
        } catch (error) {
            console.error("Enrollment failed:", error);
            alert("Failed to enroll. Please try again.");
            setIsEnrolling(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    if (!series) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <AlertCircle size={48} className="text-red-500" />
                <h2 className="text-2xl font-bold text-gray-800">Test Series Not Found</h2>
                <button
                    onClick={() => navigate('/')}
                    className="text-blue-600 hover:underline font-medium"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    const fullTestsCount = tests.filter(t => t.testType === 'full_length' || t.testType === 'mock' || t.testType === 'previous_year').length;
    const subjectTestsCount = tests.filter(t => t.testType === 'subject_wise').length;
    const unitTestsCount = tests.filter(t => t.testType === 'unit_wise').length;
    const chapterTestsCount = tests.filter(t => t.testType === 'chapter_wise').length;
    const totalQuestions = tests.reduce((acc, t) => acc + (t.questionConfig?.totalQuestions || t.questionIds?.length || 0), 0);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans overflow-x-hidden">
            <Navbar />

            {/* Premium Dark Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#070D1E] via-[#0E1B35] to-[#080D1A] pt-32 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(59,130,246,0.15),transparent_45%)] pointer-events-none"></div>
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

                    {/* Left Column - Info */}
                    <div className="lg:col-span-7 text-left space-y-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                            <Star size={12} className="fill-blue-400 text-blue-400" />
                            {series.examCategory} 2026
                        </span>

                        {/* Left Column - Info */}
                        <div className="lg:col-span-7 text-left space-y-6">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                                <Star size={12} className="fill-blue-400 text-blue-400" />
                                {series.examCategory}
                            </span>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
                                {(series?.name || '').split(' ').map((word, i) => (
                                    <span key={i} className={word.toLowerCase() === 'gold' ? 'text-[#FF9F1C] drop-shadow-[0_2px_15px_rgba(255,159,28,0.35)]' : ''}>
                                        {word}{' '}
                                    </span>
                                ))}
                            </h1>

                            <p className="text-lg md:text-xl font-semibold text-blue-400/90 tracking-wide">
                                More Tests. Better Practice. Smarter You.
                            </p>

                            <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl font-light">
                                Exactly the {series.examCategory} real exam interface you'll get on exam day — same layout, same timer, same experience. Practice smartly. Perform confidently. Achieve your dream.
                            </p>

                            {/* Prominent CTA to start test directly */}
                            <div className="pt-2 pb-2">
                                <button
                                    onClick={() => {
                                        if (tests.length > 0) {
                                            const test = tests[0];
                                            const hasOMR = !!test.isOMR || !!test.omrTemplate;
                                            const targetPath = hasOMR ? `/dashboard/attempt/${test.id}/mode` : `/dashboard/attempt/${test.id}`;

                                            if (!currentUser) {
                                                navigate('/login', { state: { from: targetPath } });
                                            } else {
                                                navigate(targetPath);
                                            }
                                        } else {
                                            alert('No tests are currently available in this series.');
                                        }
                                    }}
                                    disabled={tests.length === 0}
                                    className={`px-6 py-2.5 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-base group ${tests.length === 0
                                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                                            : 'bg-[#FF9F1C] hover:bg-[#e08810] text-white shadow-[0_0_30px_rgba(255,159,28,0.3)] hover:shadow-[0_0_40px_rgba(255,159,28,0.5)] active:scale-95'
                                        }`}
                                >
                                    <PlayCircle size={20} className={tests.length > 0 ? "group-hover:scale-110 transition-transform" : ""} />
                                    {tests.length === 0
                                        ? 'Tests Coming Soon'
                                        : 'Start Now'
                                    }
                                </button>
                            </div>

                            {/* Badges Grid - Horizontal Row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shrink-0">
                                        <Smartphone size={18} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Real Exam Interface</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shrink-0">
                                        <BookOpen size={18} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Bilingual (Hindi+Eng)</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shrink-0">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Trusted by Aspirants</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shrink-0">
                                        <Target size={18} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Affordable Premium</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Uploaded Banner Image or Illustration */}
                    <div className="lg:col-span-5 flex justify-center items-center">
                        {series.thumbnailUrl ? (
                            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900/90 p-1.5 group">
                                <img
                                    src={series.thumbnailUrl}
                                    alt={series.name}
                                    className="w-full h-auto max-h-[480px] object-contain rounded-xl transform group-hover:scale-[1.02] transition-transform duration-500"
                                />
                            </div>
                        ) : (
                            <div className="w-full hidden lg:block">
                                <StudentIllustration />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content & Sticky Sidebar Layout */}
            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Left & Middle Column (2 cols) */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* Tests Included in this Series Section */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div className="flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-[#FF9F1C] rounded-full"></span>
                                    <h2 className="text-2xl font-bold text-slate-900">Tests Included</h2>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search tests..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Filters Tab */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'all', label: 'All Tests' },
                                    { id: 'mock', label: 'Full Mocks' },
                                    { id: 'subject', label: 'Subject Wise' },
                                    { id: 'unit', label: 'Unit Wise' },
                                    { id: 'chapter', label: 'Chapter Wise' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${activeTab === tab.id
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10'
                                                : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tests List */}
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                {filteredAndSearchedTests.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 font-semibold text-sm">
                                        No tests match your filter or search query.
                                    </div>
                                ) : (
                                    filteredAndSearchedTests.map((test, index) => {
                                        const typeLabel = TYPE_LABELS[test.testType] || test.testType || 'Test';
                                        const typeColor = TYPE_COLORS[test.testType] || 'bg-slate-50 text-slate-600 border border-slate-100';
                                        const duration = test.settings?.duration || 180;
                                        const questionsCount = test.questionConfig?.totalQuestions || test.questionIds?.length || 0;

                                        const testAttempts = attemptsMap[test.id] || [];
                                        const hasAttempted = testAttempts.length > 0;
                                        const testBestScore = hasAttempted ? Math.max(...testAttempts.map(a => a.score || 0)) : 0;

                                        return (
                                            <div
                                                key={test.id}
                                                className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-blue-100 transition-all group"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <span className="flex-shrink-0 w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xs font-black">
                                                        {index + 1}
                                                    </span>
                                                    <div className="min-w-0 space-y-1">
                                                        <p className="font-bold text-slate-900 text-sm truncate leading-tight">
                                                            {test.name}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${typeColor}`}>
                                                                {typeLabel}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                                                                <Clock size={11} /> {duration} mins
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 font-semibold">
                                                                • {questionsCount} Qs
                                                            </span>
                                                            {hasAttempted && (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
                                                                    Best: {testBestScore.toFixed(1)}%
                                                                </span>
                                                            )}
                                                            {test.id === firstTestId && !isOwned && (
                                                                <button
                                                                    onClick={() => {
                                                                        const hasOMR = !!test.isOMR || !!test.omrTemplate;
                                                                        const targetPath = hasOMR ? `/dashboard/attempt/${test.id}/mode` : `/dashboard/attempt/${test.id}`;
                                                                        if (!currentUser) {
                                                                            navigate('/login', { state: { from: targetPath } });
                                                                        } else {
                                                                            navigate(targetPath);
                                                                        }
                                                                    }}
                                                                    className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200 animate-pulse hover:bg-orange-200 transition-colors cursor-pointer"
                                                                >
                                                                    Free Demo
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex-shrink-0 ml-4">
                                                    {isOwned ? (
                                                        <button
                                                            onClick={() => {
                                                                const hasOMR = !!test.isOMR || !!test.omrTemplate;
                                                                navigate(hasOMR ? `/dashboard/attempt/${test.id}/mode` : `/dashboard/attempt/${test.id}`);
                                                            }}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${hasAttempted
                                                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                }`}
                                                        >
                                                            <PlayCircle size={12} />
                                                            <span>{hasAttempted ? 'Reattempt' : 'Start Test'}</span>
                                                        </button>
                                                    ) : test.id === firstTestId ? (
                                                        <button
                                                            onClick={() => {
                                                                const hasOMR = !!test.isOMR || !!test.omrTemplate;
                                                                const targetPath = hasOMR ? `/dashboard/attempt/${test.id}/mode` : `/dashboard/attempt/${test.id}`;
                                                                if (!currentUser) {
                                                                    navigate('/login', { state: { from: targetPath } });
                                                                } else {
                                                                    navigate(targetPath);
                                                                }
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold transition-all"
                                                        >
                                                            <PlayCircle size={12} />
                                                            <span>Start Free</span>
                                                        </button>
                                                    ) : (
                                                        <div className="p-2 bg-slate-100 text-slate-400 rounded-xl">
                                                            <Lock size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* About This Test Series */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-[#FF9F1C] rounded-full"></span>
                                <h2 className="text-2xl font-bold text-slate-900">About This Test Series</h2>
                            </div>
                            <p className="text-slate-600 leading-relaxed">
                                {series.description || `Examinantt's ${series.name} is designed by toppers and experts to give you the most exam-like practice. Every test is based on the latest exam pattern and difficulty level.`}
                            </p>
                            <p className="text-slate-600 leading-relaxed font-light">
                                We believe quality education should be accessible to every aspirant, irrespective of their background. Because your dream shouldn't depend on your city or your family's income.
                            </p>

                            {/* Stats Counters */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50/70 border border-slate-100 rounded-2xl">
                                <div className="text-center space-y-1 border-r border-slate-200/60 last:border-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                                        <Award size={16} />
                                    </div>
                                    <p className="text-2xl font-extrabold text-slate-950">{series.stats?.totalTests || tests.length || '125+'}</p>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Tests</p>
                                </div>
                                <div className="text-center space-y-1 border-r border-slate-200/60 last:border-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                                        <PlayCircle size={16} />
                                    </div>
                                    <p className="text-2xl font-extrabold text-slate-950">{fullTestsCount || '10'}</p>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Full Length Mocks</p>
                                </div>
                                <div className="text-center space-y-1 border-r border-slate-200/60 last:border-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                                        <Target size={16} />
                                    </div>
                                    <p className="text-2xl font-extrabold text-slate-950">100%</p>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Exam Like</p>
                                </div>
                                <div className="text-center space-y-1 last:border-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                                        <FileText size={16} />
                                    </div>
                                    <p className="text-2xl font-extrabold text-slate-950">{totalQuestions || '358+'}</p>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Original Questions</p>
                                </div>
                            </div>
                        </div>

                        {/* What's Included Section */}
                        <div className="bg-white rounded-3xl p-4 sm:p-8 border border-slate-100 shadow-sm space-y-5">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-[#FF9F1C] rounded-full"></span>
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">What's Included</h2>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 p-3 sm:p-5 bg-blue-50/20 border border-blue-50/50 rounded-2xl transition-all hover:bg-blue-50/40">
                                    <div className="p-2 sm:p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                                        <Award className="w-4 h-4 sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-xs sm:text-base leading-snug">
                                            {fullTestsCount} Full Length Mocks
                                        </h4>
                                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">Real exam pattern with exact difficulty level</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 p-3 sm:p-5 bg-green-50/20 border border-green-50/50 rounded-2xl transition-all hover:bg-green-50/40">
                                    <div className="p-2 sm:p-3 bg-green-100 text-green-600 rounded-xl shrink-0">
                                        <BookOpen className="w-4 h-4 sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-xs sm:text-base leading-snug">
                                            {subjectTestsCount} Subject Wise Tests
                                        </h4>
                                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">Subject-specific practice to master individual topics</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 p-3 sm:p-5 bg-purple-50/20 border border-purple-50/50 rounded-2xl transition-all hover:bg-purple-50/40">
                                    <div className="p-2 sm:p-3 bg-purple-100 text-purple-600 rounded-xl shrink-0">
                                        <Layers className="w-4 h-4 sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-xs sm:text-base leading-snug">
                                            {unitTestsCount} Unit Wise Tests
                                        </h4>
                                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">Evaluation tests for units to cover syllabus systematically</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 p-3 sm:p-5 bg-orange-50/20 border border-orange-50/50 rounded-2xl transition-all hover:bg-orange-50/40">
                                    <div className="p-2 sm:p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                                        <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-xs sm:text-base leading-snug">
                                            {chapterTestsCount} Chapter Wise Tests
                                        </h4>
                                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">Topic & chapter tests for deep practice and concepts review</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 p-3 sm:p-5 bg-pink-50/20 border border-pink-50/50 rounded-2xl transition-all hover:bg-pink-50/40">
                                    <div className="p-2 sm:p-3 bg-pink-100 text-pink-600 rounded-xl shrink-0">
                                        <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-xs sm:text-base leading-snug">Detailed Solutions</h4>
                                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">Step-by-step explanations for every single question</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 p-3 sm:p-5 bg-indigo-50/20 border border-indigo-50/50 rounded-2xl transition-all hover:bg-indigo-50/40">
                                    <div className="p-2 sm:p-3 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
                                        <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-xs sm:text-base leading-snug">Performance Analytics</h4>
                                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">Track accuracy, time, strengths & weaknesses</p>
                                    </div>
                                </div>
                            </div>

                            {/* Built by Experts Banner */}
                            <div className="bg-gradient-to-r from-amber-50 to-[#FFF7ED] rounded-2xl p-6 border border-orange-100 flex flex-col md:flex-row gap-4 items-center md:items-start">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#FF9F1C] flex items-center justify-center shrink-0 shadow-sm border border-orange-200">
                                    <Star size={24} className="fill-[#FF9F1C]" />
                                </div>
                                <div className="text-center md:text-left space-y-1">
                                    <h4 className="font-bold text-slate-900">Built by Experts. Trusted by Thousands.</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed font-light">Join thousands of serious aspirants on their journey to success with high-quality mock test structures.</p>
                                </div>
                            </div>
                        </div>

                        {/* Why Aspirants Trust Section */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-[#FF9F1C] rounded-full"></span>
                                <h2 className="text-2xl font-bold text-slate-900">Why Aspirants Trust Examinantt?</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <Smartphone size={20} />
                                    </div>
                                    <span className="text-slate-700 font-medium text-sm">Same as Real {series.examCategory} Exam Interface</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <CheckCircle size={20} />
                                    </div>
                                    <span className="text-slate-700 font-medium text-sm">Verified & Validated Questions</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <Award size={20} />
                                    </div>
                                    <span className="text-slate-700 font-medium text-sm">Prepared by Experts & Former Toppers</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <Target size={20} />
                                    </div>
                                    <span className="text-slate-700 font-medium text-sm">Supports Your Dream Without Compromise</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sticky Sidebar / Checkout */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden sticky top-28 space-y-6">

                            {/* Offer header */}
                            <div className="bg-gradient-to-r from-blue-900 to-[#0F1E36] p-6 text-white text-center">
                                <p className="text-xs uppercase font-bold tracking-wider text-blue-300 mb-3">Limited Time Offer!</p>
                                <div className="flex items-center justify-center gap-4">
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl font-black">{String(timeLeft.days).padStart(2, '0')}</span>
                                        <span className="text-[10px] text-blue-200">Days</span>
                                    </div>
                                    <span className="text-xl font-bold opacity-50">:</span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl font-black">{String(timeLeft.hours).padStart(2, '0')}</span>
                                        <span className="text-[10px] text-blue-200">Hours</span>
                                    </div>
                                    <span className="text-xl font-bold opacity-50">:</span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl font-black">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                        <span className="text-[10px] text-blue-200">Mins</span>
                                    </div>
                                    <span className="text-xl font-bold opacity-50">:</span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl font-black">{String(timeLeft.seconds).padStart(2, '0')}</span>
                                        <span className="text-[10px] text-blue-200">Secs</span>
                                    </div>
                                </div>
                            </div>

                            {/* Price details */}
                            <div className="px-6 space-y-6">
                                <div className="text-center space-y-2">
                                    <p className="text-xs font-semibold text-slate-400">Total Price</p>
                                    <div className="flex items-center justify-center gap-3">
                                        {series?.pricing?.type === 'paid' && (
                                            <span className="text-2xl text-slate-400 line-through">
                                                ₹{series?.pricing?.amount === 349 ? 1400 : Math.round((series?.pricing?.amount || 0) * 4)}
                                            </span>
                                        )}
                                        <span className="text-5xl font-black text-slate-900">
                                            {series?.pricing?.type === 'free' ? 'Free' : `₹${Math.max(0, (series?.pricing?.amount || 0) - couponDiscount)}`}
                                        </span>
                                    </div>
                                    {series?.pricing?.type === 'paid' && (
                                        <span className="inline-block px-3 py-1 bg-green-50 border border-green-200 text-green-600 font-bold text-xs rounded-full">
                                            You Save ₹{
                                                series?.pricing?.amount === 349 && couponDiscount === 0
                                                    ? 1051
                                                    : (series?.pricing?.amount === 349 ? 1400 : Math.round((series?.pricing?.amount || 0) * 4)) - Math.max(0, (series?.pricing?.amount || 0) - couponDiscount)
                                            } ({
                                                series?.pricing?.amount === 349 && couponDiscount === 0
                                                    ? 75
                                                    : Math.round(((series?.pricing?.amount === 349 ? 1400 : Math.round((series?.pricing?.amount || 0) * 4)) - Math.max(0, (series?.pricing?.amount || 0) - couponDiscount)) / (series?.pricing?.amount === 349 ? 1400 : Math.round((series?.pricing?.amount || 0) * 4)) * 100)
                                            }%)
                                        </span>
                                    )}
                                </div>

                                {/* Discount code section */}
                                {series?.pricing?.type === 'paid' && (
                                    <div className="pt-4 border-t border-slate-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Get more discount...</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Enter discount code"
                                                value={couponCode}
                                                onChange={(e) => {
                                                    setCouponCode(e.target.value);
                                                    setCouponError(null);
                                                }}
                                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl text-sm font-semibold outline-none uppercase placeholder:normal-case"
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shrink-0"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        {couponError && (
                                            <p className="text-xs font-bold text-red-500">{couponError}</p>
                                        )}
                                        {appliedCoupon && (
                                            <p className="text-xs font-bold text-green-600 flex items-center gap-1">
                                                <Check size={12} strokeWidth={3} /> Code <strong>{appliedCoupon}</strong> applied (₹{couponDiscount} off)
                                            </p>
                                        )}
                                        {!appliedCoupon && (
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                If you have a promo code, please enter it above.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Checklist */}
                                <ul className="space-y-3 pt-4 border-t border-slate-100 text-slate-700 font-medium text-sm">
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-green-500 fill-green-50" />
                                        <span>{totalQuestions || '358'}+ Original Questions</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-green-500 fill-green-50" />
                                        <span>Real Exam Interface</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-green-500 fill-green-50" />
                                        <span>Bilingual (Hindi + English)</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-green-500 fill-green-50" />
                                        <span>Expert Crafted Tests</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-green-500 fill-green-50" />
                                        <span>Affordable Premium Quality</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-green-500 fill-green-50" />
                                        <span>Access on Web & Mobile</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <CheckCircle size={16} className="text-green-500 fill-green-50" />
                                        <span>24×7 Support</span>
                                    </li>
                                </ul>

                                {/* Action Button */}
                                <div>
                                    {isOwned ? (
                                        <button
                                            onClick={() => navigate('/dashboard/tests')}
                                            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-600/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                        >
                                            Go to Dashboard
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleEnroll}
                                            disabled={isEnrolling}
                                            className="w-full py-4 bg-[#FF9F1C] hover:bg-[#e08810] text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isEnrolling ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={20} />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingCart size={20} />
                                                    {series?.pricing?.type === 'free' ? 'Enroll Now' : 'Buy Now'}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Security and payment logos */}
                                <div className="space-y-4 pt-4 pb-6 border-t border-slate-100">
                                    <div className="flex items-center justify-center flex-wrap gap-2 md:gap-3 text-slate-400">
                                        <span className="text-[10px] font-bold tracking-widest uppercase">UPI</span>
                                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                        <span className="text-[10px] font-bold tracking-widest uppercase">VISA</span>
                                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                        <span className="text-[10px] font-bold tracking-widest uppercase">MASTERCARD</span>
                                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                        <span className="text-[10px] font-bold tracking-widest uppercase">RUPAY</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400/80 font-medium">
                                        <Lock size={12} className="text-slate-400" />
                                        <span>100% Secure & Safe Payments</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Card - Rocket */}
                            <div className="bg-[#EEF2F6] p-6 flex items-start gap-4 rounded-b-3xl">
                                <div className="space-y-1 flex-1">
                                    <h4 className="font-bold text-slate-900 text-sm">Your hard work. Our platform. Your success.</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed font-light">Examinantt is with you, in every step of your journey.</p>
                                </div>
                                <div className="text-4xl">🚀</div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

// Premium Student/Goal SVG Illustration
function StudentIllustration() {
    return (
        <svg viewBox="0 0 500 400" className="w-full h-auto max-w-md mx-auto">
            <defs>
                <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Glow */}
            <circle cx="250" cy="200" r="180" fill="url(#bgGlow)" />

            {/* Floating Target Board */}
            <circle cx="410" cy="110" r="45" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeOpacity="0.4" />
            <circle cx="410" cy="110" r="30" fill="none" stroke="#60a5fa" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="3 3" />
            <circle cx="410" cy="110" r="15" fill="none" stroke="#93c5fd" strokeWidth="2" />
            <circle cx="410" cy="110" r="6" fill="#FF9F1C" />

            {/* Floating Trophy / Badge */}
            <g transform="translate(60, 240)">
                <rect x="0" y="0" width="60" height="60" rx="16" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />
                <path d="M22 18 H38 V26 C38 31 34 35 30 35 C26 35 22 31 22 26 Z" fill="none" stroke="#FF9F1C" strokeWidth="2.5" />
                <path d="M30 35 V42 M24 42 H36" stroke="#FF9F1C" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="30" cy="26" r="3" fill="#FF9F1C" />
            </g>

            {/* Laptop Outline */}
            <path d="M 120 310 L 340 310 L 360 345 L 100 345 Z" fill="#334155" />
            <path d="M 130 200 L 330 200 L 340 305 L 120 305 Z" fill="#0f172a" stroke="#475569" strokeWidth="4" />
            <rect x="140" y="210" width="180" height="85" rx="3" fill="#1e293b" />

            {/* Analytics line graph on Laptop */}
            <path d="M 150 270 L 175 255 L 200 262 L 230 235 L 260 250 L 290 220 L 310 230" fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 150 270 L 175 255 L 200 262 L 230 235 L 260 250 L 290 220 L 310 230 V 285 H 150 Z" fill="rgba(59,130,246,0.15)" />

            {/* Floating Checkmark Badge */}
            <g transform="translate(290, 80)">
                <circle cx="25" cy="25" r="25" fill="#10b981" />
                <path d="M 17 25 L 22 30 L 33 19" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Student illustration / Icon */}
            <circle cx="230" cy="120" r="32" fill="#e2e8f0" />
            <path d="M 170 195 C 170 155, 290 155, 290 195 Z" fill="#cbd5e1" />
            <path d="M 200 135 L 230 148 L 260 135" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
        </svg>
    );
};

export default TestSeriesDetailsPage;
