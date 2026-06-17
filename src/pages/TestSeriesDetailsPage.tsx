import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Clock,
    BookOpen,
    CheckCircle,
    AlertCircle,
    ChevronLeft,
    ShoppingCart,
    Loader2,
    PlayCircle
} from 'lucide-react';
import { loadRazorpay } from '../utils/razorpay';
import { useAuth } from '../contexts/AuthContext';
import { getTestSeries } from '../services/testSeriesService';
import { studentService } from '../services/studentService';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { TestSeries } from '../types/test.types';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const TestSeriesDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth() || {};

    const [series, setSeries] = useState<TestSeries | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isOwned, setIsOwned] = useState(false);

    useEffect(() => {
        const fetchSeries = async () => {
            if (!id) return;
            try {
                // Fetch Series Details
                const data = await getTestSeries(id);
                setSeries(data);

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

    const handleEnroll = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (!series) return;

        setIsEnrolling(true);
        try {
            if (series.pricing.type === 'paid') {
                const res = await loadRazorpay();

                if (!res) {
                    alert('Razorpay SDK failed to load. Are you online?');
                    setIsEnrolling(false);
                    return;
                }

                const options = {
                    key: 'rzp_test_S7lSvWtu89c6zD', // Enter the Key ID generated from the Dashboard
                    amount: (series.pricing.amount || 0) * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                    currency: 'INR',
                    name: 'Examinant',
                    description: `Purchase ${series.name}`,
                    image: 'https://examinantt.web.app/logo192.png', // Optional logic for logo
                    handler: async function (_response: any) {
                        try {
                            // In a real app, verify signature on backend: response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature
                            await studentService.enrollInTestSeries(currentUser.uid, series);
                            setIsOwned(true);
                            alert('Payment Successful!');
                            navigate('/dashboard');
                        } catch (err) {
                            console.error("Enrollment error after payment:", err);
                            alert("Payment successful but enrollment failed. Please contact support.");
                        }
                    },
                    prefill: {
                        name: currentUser.displayName || 'Student',
                        email: currentUser.email || 'student@example.com',
                        contact: '' // valid phone number could be added if available
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
                await studentService.enrollInTestSeries(currentUser.uid, series);
                setIsOwned(true);
                alert('Enrolled successfully!');
                navigate('/dashboard');
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

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar />

            <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 transition-colors group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 items-center md:items-start">
                            <div className="flex-1">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${series.examCategory === 'NEET' ? 'bg-green-100 text-green-700' :
                                    series.examCategory === 'JEE' ? 'bg-blue-100 text-blue-700' :
                                        'bg-purple-100 text-purple-700'
                                    }`}>
                                    {series.examCategory}
                                </span>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                                    {series.name}
                                </h1>
                                <p className="text-lg text-slate-600 leading-relaxed">
                                    {series.description}
                                </p>
                            </div>
                            {series.thumbnailUrl && (
                                <div className="w-full md:w-1/3 shrink-0 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                                    <img 
                                        src={series.thumbnailUrl} 
                                        alt={series.name} 
                                        className="w-full h-auto object-cover aspect-video" 
                                    />
                                </div>
                            )}
                        </div>

                        {/* Features / Details */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">What's Included</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <PlayCircle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">
                                            {series.stats?.totalTests || series.testIds?.length || 'Multiple'} Tests
                                        </h4>
                                        <p className="text-sm text-slate-500">Full length mock tests</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Detailed Solutions</h4>
                                        <p className="text-sm text-slate-500">Step-by-step explanations</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Performance Analytics</h4>
                                        <p className="text-sm text-slate-500">Track your progress</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                        <CheckCircle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Exam Pattern</h4>
                                        <p className="text-sm text-slate-500">Latest syllabus coverage</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Sidebar / Pricing Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sticky top-24">
                            <div className="text-center mb-6">
                                <p className="text-slate-500 text-sm font-medium mb-2">Total Price</p>
                                <div className="flex items-center justify-center gap-3">
                                    {series.pricing.type === 'paid' && (
                                        <span className="text-2xl text-slate-400 line-through">₹{series.pricing.amount ? series.pricing.amount * 1.5 : 0}</span>
                                    )}
                                    <span className="text-5xl font-extrabold text-slate-900">
                                        {series.pricing.type === 'free' ? 'Free' : `₹${series.pricing.amount}`}
                                    </span>
                                </div>
                            </div>

                            {isOwned ? (
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                                >
                                    Go to Dashboard
                                </button>
                            ) : (
                                <button
                                    onClick={handleEnroll}
                                    disabled={isEnrolling}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isEnrolling ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart size={20} />
                                            {series.pricing.type === 'free' ? 'Enroll Now' : 'Buy Now'}
                                        </>
                                    )}
                                </button>
                            )}

                            <p className="text-center text-xs text-slate-400 mt-4">
                                {series.pricing.type === 'paid' ? 'Secure payment via Payment Gateway' : 'Instant access to all test materials'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TestSeriesDetailsPage;
