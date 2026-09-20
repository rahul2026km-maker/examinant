import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraduationCap,
    BookOpen,
    PlayCircle,
    Search,
    Clock,
    CheckCircle2,
    Sparkles,
    ArrowRight,
    Loader2,
    Layers,
    User,
    Star,
    Video,
    ChevronDown,
    ChevronUp,
    X,
    FileText,
    Lock
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { courseService } from '../../services/courseService';
import { curriculumService } from '../../services/curriculumService';
import { entitlementService } from '../../services/entitlementService';
import { useExamList } from '../../hooks/useExamList';
import { loadRazorpay } from '../../utils/razorpay';
import type { Course, CourseEnrollment, CourseModule, Lesson } from '../../types/course.types';

const StudentBatchesPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const profileData = authContext?.profileData;
    const exams = useExamList();

    // Tab state ('my-batches' | 'explore')
    const initialTab = searchParams.get('tab') === 'explore' ? 'explore' : 'my-batches';
    const [activeTab, setActiveTab] = useState<'my-batches' | 'explore'>(initialTab);

    // My Batches state
    const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
    const [isLoadingEnrollments, setIsLoadingEnrollments] = useState<boolean>(true);
    const [enrolledCoursesMap, setEnrolledCoursesMap] = useState<Record<string, Course>>({});
    const [mySearchTerm, setMySearchTerm] = useState<string>('');
    const [myStatusFilter, setMyStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

    // Explore Batches state
    const [publishedBatches, setPublishedBatches] = useState<Course[]>([]);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
    const [exploreSearchTerm, setExploreSearchTerm] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedLevel, setSelectedLevel] = useState<string>('All');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
    const [selectedPriceFilter, setSelectedPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
    const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

    // Curriculum Preview Modal state
    const [selectedCourseForModal, setSelectedCourseForModal] = useState<Course | null>(null);
    const [modalCurriculum, setModalCurriculum] = useState<{ module: CourseModule; lessons: Lesson[] }[]>([]);
    const [isLoadingModalCurriculum, setIsLoadingModalCurriculum] = useState<boolean>(false);
    const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});

    // Toast alert message state
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 5000);
    };

    // Keep URL param in sync with activeTab
    const handleTabChange = (tab: 'my-batches' | 'explore') => {
        setActiveTab(tab);
        setSearchParams(tab === 'explore' ? { tab: 'explore' } : {});
    };

    // 1. Listen to student's enrollments from Firestore
    useEffect(() => {
        if (!currentUser) {
            setIsLoadingEnrollments(false);
            return;
        }

        setIsLoadingEnrollments(true);
        try {
            const enrollmentsRef = collection(db, 'users', currentUser.uid, 'enrollments');
            const unsubscribe = onSnapshot(enrollmentsRef, async (snapshot) => {
                const list = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                })) as CourseEnrollment[];
                setEnrollments(list);
                setIsLoadingEnrollments(false);

                // Fetch full course details for enrolled items (to get instructor, category, etc.)
                const courseIds = list.map(e => e.courseId).filter(Boolean);
                if (courseIds.length > 0) {
                    const map: Record<string, Course> = {};
                    await Promise.all(
                        courseIds.map(async (cid) => {
                            try {
                                const c = await courseService.getCourseById(cid);
                                if (c) map[cid] = c;
                            } catch (e) {
                                console.error(`Error loading course ${cid}:`, e);
                            }
                        })
                    );
                    setEnrolledCoursesMap(map);
                }
            }, (error) => {
                console.error("Error subscribing to student enrollments:", error);
                setIsLoadingEnrollments(false);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error("Failed to setup enrollments listener:", err);
            setIsLoadingEnrollments(false);
        }
    }, [currentUser]);

    // 2. Fetch published batches catalog
    useEffect(() => {
        loadCatalogCourses();
    }, [selectedCategory, selectedLevel, selectedLanguage]);

    const loadCatalogCourses = async () => {
        setIsLoadingCatalog(true);
        try {
            const data = await courseService.getPublishedCourses({
                examCategory: selectedCategory !== 'All' ? selectedCategory : undefined,
                level: selectedLevel !== 'All' ? selectedLevel : undefined,
                language: selectedLanguage !== 'All' ? selectedLanguage : undefined
            });
            setPublishedBatches(data);
        } catch (error) {
            console.error("Error loading published courses:", error);
            setPublishedBatches([]);
        } finally {
            setIsLoadingCatalog(false);
        }
    };

    // 3. Curriculum Modal Loader
    const openCurriculumModal = async (course: Course) => {
        setSelectedCourseForModal(course);
        setIsLoadingModalCurriculum(true);
        try {
            const curr = await curriculumService.getAllCourseLessons(course.id);
            setModalCurriculum(curr);
            if (curr.length > 0) {
                // Expand first module by default
                setExpandedModuleIds({ [curr[0].module.id]: true });
            }
        } catch (err) {
            console.error("Error loading curriculum modal:", err);
            setModalCurriculum([]);
        } finally {
            setIsLoadingModalCurriculum(false);
        }
    };

    const toggleModuleExpansion = (moduleId: string) => {
        setExpandedModuleIds(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    // Set of enrolled course IDs
    const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));

    // 4. Handle Free or Paid Enrollment
    const handleEnroll = async (course: Course) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (enrolledCourseIds.has(course.id)) {
            navigate(`/dashboard/courses/${course.id}/learn`);
            return;
        }

        setEnrollingCourseId(course.id);

        try {
            const isFree = course.accessType === 'free' || !course.pricing?.amount || course.pricing.amount <= 0;

            if (isFree) {
                // Free enrollment
                await entitlementService.createEnrollment(currentUser.uid, course, 'free');

                // Also record in student purchase collection for unified record
                try {
                    const purchaseData = {
                        seriesId: course.id,
                        testId: course.id,
                        type: 'course',
                        courseId: course.id,
                        seriesTitle: course.title,
                        testTitle: course.title,
                        category: course.examCategory || 'General',
                        price: 0,
                        purchaseDate: serverTimestamp(),
                        status: 'active',
                        paymentId: 'free',
                        paymentStatus: 'free'
                    };
                    await addDoc(collection(db, 'users', currentUser.uid, 'purchases'), purchaseData);
                } catch (e) {
                    console.warn("Non-fatal: purchases subcollection record failed", e);
                }

                showToast(`🎉 Success! You are now enrolled in "${course.title}". Start learning right away!`, 'success');
                setEnrollingCourseId(null);
                if (selectedCourseForModal?.id === course.id) {
                    setSelectedCourseForModal(null);
                }
                handleTabChange('my-batches');
            } else {
                // Paid enrollment via Razorpay
                const res = await loadRazorpay();
                if (!res) {
                    showToast("Razorpay SDK failed to load. Please check your internet connection.", "error");
                    setEnrollingCourseId(null);
                    return;
                }

                const priceAmount = course.pricing?.amount || 0;
                const options = {
                    key: 'rzp_live_TAGGnZwDvZubIP',
                    amount: priceAmount * 100, // in paise
                    currency: 'INR',
                    name: 'Examinant',
                    description: `Batch: ${course.title}`,
                    image: 'https://examinantt.web.app/logo192.png',
                    handler: async function (response: any) {
                        try {
                            await entitlementService.createEnrollment(currentUser.uid, course, 'purchase', {
                                paymentId: response.razorpay_payment_id,
                                amountPaid: priceAmount
                            });

                            // Record in user's purchases collection
                            const purchaseData = {
                                seriesId: course.id,
                                testId: course.id,
                                type: 'course',
                                courseId: course.id,
                                seriesTitle: course.title,
                                testTitle: course.title,
                                category: course.examCategory || 'General',
                                price: priceAmount,
                                purchaseDate: serverTimestamp(),
                                status: 'active',
                                paymentId: response.razorpay_payment_id || 'online',
                                paymentStatus: 'completed'
                            };
                            await addDoc(collection(db, 'users', currentUser.uid, 'purchases'), purchaseData);

                            // Also write to global purchases for admin view
                            await addDoc(collection(db, 'purchases'), {
                                ...purchaseData,
                                userId: currentUser.uid,
                                studentName: profileData?.fullName || currentUser.displayName || 'Student',
                                studentEmail: profileData?.email || currentUser.email || 'student@example.com',
                                studentMobile: profileData?.mobile || profileData?.phone || currentUser.phoneNumber || ''
                            });

                            showToast(`🎉 Payment successful! You are now enrolled in "${course.title}".`, 'success');
                            setEnrollingCourseId(null);
                            if (selectedCourseForModal?.id === course.id) {
                                setSelectedCourseForModal(null);
                            }
                            handleTabChange('my-batches');
                        } catch (enrollErr) {
                            console.error("Failed to complete enrollment after payment:", enrollErr);
                            showToast("Payment received, but error activating batch. Please contact support.", "error");
                            setEnrollingCourseId(null);
                        }
                    },
                    prefill: {
                        name: profileData?.fullName || currentUser.displayName || 'Student',
                        email: profileData?.email || currentUser.email || 'student@example.com',
                        contact: profileData?.mobile || profileData?.phone || currentUser.phoneNumber || ''
                    },
                    theme: { color: '#2563eb' },
                    modal: {
                        ondismiss: () => setEnrollingCourseId(null)
                    }
                };

                const paymentObject = new (window as any).Razorpay(options);
                paymentObject.open();
                setEnrollingCourseId(null);
            }
        } catch (err) {
            console.error("Error during batch enrollment:", err);
            showToast("Failed to initiate enrollment. Please try again.", "error");
            setEnrollingCourseId(null);
        }
    };

    // Filtered "My Batches"
    const filteredEnrollments = enrollments.filter(item => {
        const enriched = enrolledCoursesMap[item.courseId];
        const title = (item.courseTitle || enriched?.title || '').toLowerCase();
        const category = (enriched?.examCategory || '').toLowerCase();
        const search = mySearchTerm.toLowerCase().trim();
        const matchesSearch = !search || title.includes(search) || category.includes(search);

        const isCompleted = item.status === 'completed' || (item.progressPercent || 0) >= 100;
        if (myStatusFilter === 'completed') return matchesSearch && isCompleted;
        if (myStatusFilter === 'in_progress') return matchesSearch && !isCompleted;
        return matchesSearch;
    });

    // Filtered "Explore Batches"
    const filteredCatalogBatches = publishedBatches.filter(course => {
        const title = (course.title || '').toLowerCase();
        const shortDesc = (course.shortDescription || '').toLowerCase();
        const category = (course.examCategory || '').toLowerCase();
        const instructor = (course.instructor?.name || '').toLowerCase();
        const search = exploreSearchTerm.toLowerCase().trim();

        const matchesSearch = !search ||
            title.includes(search) ||
            shortDesc.includes(search) ||
            category.includes(search) ||
            instructor.includes(search);

        if (selectedPriceFilter === 'free') {
            const isFree = course.accessType === 'free' || !course.pricing?.amount || course.pricing.amount <= 0;
            return matchesSearch && isFree;
        }
        if (selectedPriceFilter === 'paid') {
            const isPaid = course.accessType === 'paid' && (course.pricing?.amount || 0) > 0;
            return matchesSearch && isPaid;
        }

        return matchesSearch;
    });

    // Stats calculations for My Batches
    const totalEnrolledCount = enrollments.length;
    const completedCount = enrollments.filter(e => e.status === 'completed' || (e.progressPercent || 0) >= 100).length;
    const inProgressCount = totalEnrolledCount - completedCount;
    const totalLessonsEnrolled = enrollments.reduce((sum, e) => {
        const c = enrolledCoursesMap[e.courseId];
        return sum + (c?.totalLessons || 0);
    }, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-16">
            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md max-w-md ${
                            toastMessage.type === 'success'
                                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100'
                                : 'bg-rose-950/95 border-rose-500/50 text-rose-100'
                        }`}
                    >
                        <Sparkles size={20} className={toastMessage.type === 'success' ? 'text-emerald-400 shrink-0' : 'text-rose-400 shrink-0'} />
                        <span className="text-xs font-bold leading-relaxed">{toastMessage.text}</span>
                        <button onClick={() => setToastMessage(null)} className="ml-auto text-slate-400 hover:text-white p-1">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Page Header & Segmented Tabs (Dark Blue Theme) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0B152B] p-6 sm:p-8 rounded-3xl border border-[#17274B] shadow-xl">
                <div>
                    <div className="flex items-center gap-2 text-[#38BDF8] mb-1.5">
                        <GraduationCap size={20} className="text-[#38BDF8]" />
                        <span className="text-xs font-black uppercase tracking-widest">Digital Learning LMS</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        Batches & Video Courses
                    </h1>
                    <p className="text-slate-400 font-medium text-sm mt-1 max-w-2xl">
                        Access your enrolled batches, track video lecture progress, or explore expert master courses.
                    </p>
                </div>

                {/* Segmented Tab Controls */}
                <div className="bg-[#070D1E] p-1.5 rounded-2xl flex items-center gap-1.5 border border-[#17274B] shadow-inner self-start md:self-auto shrink-0">
                    <button
                        onClick={() => handleTabChange('my-batches')}
                        className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer ${
                            activeTab === 'my-batches'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                                : 'text-slate-400 hover:text-white hover:bg-[#10224A]'
                        }`}
                    >
                        <Layers size={16} />
                        <span>My Batches</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'my-batches' ? 'bg-white/20 text-white' : 'bg-[#10224A] text-slate-400'
                        }`}>
                            {totalEnrolledCount}
                        </span>
                    </button>

                    <button
                        onClick={() => handleTabChange('explore')}
                        className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer ${
                            activeTab === 'explore'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                                : 'text-slate-400 hover:text-white hover:bg-[#10224A]'
                        }`}
                    >
                        <BookOpen size={16} />
                        <span>Explore Batches</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'explore' ? 'bg-white/20 text-white' : 'bg-[#10224A] text-slate-400'
                        }`}>
                            {publishedBatches.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: MY BATCHES (PURCHASED / ENROLLED BATCHES)                          */}
            {/* ========================================================================= */}
            {activeTab === 'my-batches' && (
                <div className="space-y-8">
                    {/* Summary Ribbon Cards */}
                    {!isLoadingEnrollments && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <div className="bg-[#0B152B] rounded-3xl p-5 sm:p-6 border border-[#17274B] shadow-xl flex items-center gap-4 hover:border-[#38BDF8]/40 transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#38BDF8] border border-blue-500/20 flex items-center justify-center shrink-0">
                                    <Layers size={22} />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-wider text-[#38BDF8]">Enrolled Batches</span>
                                    <span className="text-2xl sm:text-3xl font-black text-white">{totalEnrolledCount}</span>
                                </div>
                            </div>

                            <div className="bg-[#0B152B] rounded-3xl p-5 sm:p-6 border border-[#17274B] shadow-xl flex items-center gap-4 hover:border-[#38BDF8]/40 transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-[#FF7A00] border border-amber-500/20 flex items-center justify-center shrink-0">
                                    <Clock size={22} />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-wider text-[#FF7A00]">In Progress</span>
                                    <span className="text-2xl sm:text-3xl font-black text-white">{inProgressCount}</span>
                                </div>
                            </div>

                            <div className="bg-[#0B152B] rounded-3xl p-5 sm:p-6 border border-[#17274B] shadow-xl flex items-center gap-4 hover:border-[#38BDF8]/40 transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={22} />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-400">Completed</span>
                                    <span className="text-2xl sm:text-3xl font-black text-white">{completedCount}</span>
                                </div>
                            </div>

                            <div className="bg-[#0B152B] rounded-3xl p-5 sm:p-6 border border-[#17274B] shadow-xl flex items-center gap-4 hover:border-[#38BDF8]/40 transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                    <Video size={22} />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-wider text-indigo-400">Total Lessons</span>
                                    <span className="text-2xl sm:text-3xl font-black text-white">{totalLessonsEnrolled}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#0B152B] p-4 sm:p-5 rounded-2xl border border-[#17274B]">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search enrolled batches..."
                                value={mySearchTerm}
                                onChange={(e) => setMySearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-[#070D1E] border border-[#17274B] rounded-xl font-bold text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Status Filter Buttons */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            {(['all', 'in_progress', 'completed'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setMyStatusFilter(status)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        myStatusFilter === status
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-[#070D1E] text-slate-400 hover:text-white border border-[#17274B]'
                                    }`}
                                >
                                    {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : 'Completed'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Enrollments List Grid */}
                    {isLoadingEnrollments ? (
                        <div className="flex justify-center py-24 bg-[#0B152B] rounded-3xl border border-[#17274B]">
                            <Loader2 className="animate-spin text-blue-500" size={44} />
                        </div>
                    ) : filteredEnrollments.length === 0 ? (
                        <div className="text-center py-20 bg-[#0B152B] rounded-3xl border border-[#17274B] space-y-5 px-4">
                            <div className="w-20 h-20 bg-blue-500/10 text-[#38BDF8] border border-blue-500/20 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                <GraduationCap size={40} />
                            </div>
                            <div className="space-y-1 max-w-md mx-auto">
                                <h3 className="text-xl font-black text-white">
                                    {enrollments.length === 0
                                        ? "You haven't enrolled in any batches yet."
                                        : "No batches match your search filter."}
                                </h3>
                                <p className="text-slate-400 text-xs sm:text-sm font-medium">
                                    {enrollments.length === 0
                                        ? "Explore top video batches and live classes designed by expert faculties to accelerate your prep."
                                        : "Try adjusting your search query or clear the filter."}
                                </p>
                            </div>
                            {enrollments.length === 0 ? (
                                <button
                                    onClick={() => handleTabChange('explore')}
                                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2 mx-auto cursor-pointer"
                                >
                                    <BookOpen size={18} />
                                    <span>Explore Batches Catalog</span>
                                    <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setMySearchTerm(''); setMyStatusFilter('all'); }}
                                    className="px-6 py-2.5 bg-[#10224A] text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-[#1E3A75] cursor-pointer"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredEnrollments.map((item) => {
                                const enriched = enrolledCoursesMap[item.courseId];
                                const progress = item.progressPercent || 0;
                                const isCompleted = item.status === 'completed' || progress >= 100;
                                const enrolledDate = item.enrolledAt?.toDate
                                    ? item.enrolledAt.toDate()
                                    : (item.enrolledAt ? new Date(item.enrolledAt) : null);
                                const formattedDate = enrolledDate
                                    ? enrolledDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : 'Active';

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-[#0B152B] rounded-3xl border border-[#17274B] shadow-xl hover:border-[#38BDF8]/40 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                                    >
                                        <div>
                                            {/* Thumbnail / Header */}
                                            <div className="relative h-44 bg-[#070D1E] overflow-hidden">
                                                {item.thumbnailUrl || enriched?.thumbnailUrl ? (
                                                    <img
                                                        src={item.thumbnailUrl || enriched?.thumbnailUrl}
                                                        alt={item.courseTitle || enriched?.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0F224A] to-[#070D1E] text-white p-4 text-center">
                                                        <GraduationCap size={36} className="text-[#38BDF8] mb-2" />
                                                        <span className="text-xs font-black uppercase tracking-wider text-[#38BDF8]">
                                                            {enriched?.examCategory || 'Exam Batch'}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Status Badge */}
                                                <div className="absolute top-3 left-3">
                                                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md backdrop-blur-md border ${
                                                        isCompleted
                                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                                            : 'bg-blue-500/20 text-[#38BDF8] border-blue-500/30'
                                                    }`}>
                                                        {isCompleted ? '✓ Completed' : '● In Progress'}
                                                    </span>
                                                </div>

                                                {enriched?.examCategory && (
                                                    <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-slate-200 text-[10px] font-extrabold px-3 py-1 rounded-full border border-white/10">
                                                        {enriched.examCategory}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 space-y-4">
                                                <div className="space-y-1.5">
                                                    <h3 className="text-base font-black text-white leading-snug line-clamp-2 group-hover:text-[#38BDF8] transition-colors">
                                                        {item.courseTitle || enriched?.title || 'Course Batch'}
                                                    </h3>
                                                    {enriched?.instructor && (
                                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                                            <User size={14} className="text-slate-500 shrink-0" />
                                                            <span className="truncate">{enriched.instructor.name}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Meta stats */}
                                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-1 border-t border-[#17274B]">
                                                    <span className="flex items-center gap-1.5">
                                                        <Video size={13} className="text-blue-400" />
                                                        {enriched?.totalLessons || 0} Lectures
                                                    </span>
                                                    <span>Enrolled: {formattedDate}</span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="space-y-1.5 pt-1">
                                                    <div className="flex justify-between items-center text-xs font-bold">
                                                        <span className="text-slate-400">Learning Progress</span>
                                                        <span className="text-[#38BDF8] font-black">{progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-[#070D1E] border border-[#17274B] h-2.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-blue-600 via-[#38BDF8] to-cyan-400 h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="p-6 pt-0 space-y-2 bg-[#0B152B]">
                                            <button
                                                onClick={() => navigate(`/dashboard/courses/${item.courseId}/learn`)}
                                                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                            >
                                                <PlayCircle size={16} />
                                                <span>{isCompleted ? 'Review Batch' : 'Continue Learning'}</span>
                                                <ArrowRight size={14} />
                                            </button>

                                            {enriched && (
                                                <button
                                                    onClick={() => openCurriculumModal(enriched)}
                                                    className="w-full py-2.5 bg-[#070D1E] hover:bg-[#10224A] text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-[#17274B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                                >
                                                    <FileText size={14} />
                                                    <span>View Syllabus</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: EXPLORE BATCHES (AVAILABLE TO PURCHASE / ENROLL)                   */}
            {/* ========================================================================= */}
            {activeTab === 'explore' && (
                <div className="space-y-8">
                    {/* Filter & Search Bar */}
                    <div className="bg-[#0B152B] p-5 sm:p-6 rounded-3xl border border-[#17274B] space-y-4 shadow-xl">
                        {/* Search Row */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search batches by exam, subject, faculty or topic..."
                                value={exploreSearchTerm}
                                onChange={(e) => setExploreSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-[#070D1E] border border-[#17274B] rounded-2xl font-bold text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                            />
                        </div>

                        {/* Dropdown Filters Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#17274B]">
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Category Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Exam:</span>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="px-3.5 py-2 bg-[#070D1E] border border-[#17274B] rounded-xl text-xs font-bold text-white cursor-pointer focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="All">All Exams</option>
                                        {exams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                                    </select>
                                </div>

                                {/* Level Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Level:</span>
                                    <select
                                        value={selectedLevel}
                                        onChange={(e) => setSelectedLevel(e.target.value)}
                                        className="px-3.5 py-2 bg-[#070D1E] border border-[#17274B] rounded-xl text-xs font-bold text-white cursor-pointer focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="All">All Levels</option>
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="All Levels">All Levels</option>
                                    </select>
                                </div>

                                {/* Language Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Language:</span>
                                    <select
                                        value={selectedLanguage}
                                        onChange={(e) => setSelectedLanguage(e.target.value)}
                                        className="px-3.5 py-2 bg-[#070D1E] border border-[#17274B] rounded-xl text-xs font-bold text-white cursor-pointer focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="All">All Languages</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="English">English</option>
                                        <option value="Hinglish">Hinglish</option>
                                    </select>
                                </div>
                            </div>

                            {/* Price Filter Pills */}
                            <div className="flex items-center gap-1.5 bg-[#070D1E] p-1 rounded-xl border border-[#17274B]">
                                {(['all', 'free', 'paid'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setSelectedPriceFilter(p)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                            selectedPriceFilter === p
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {p === 'all' ? 'All Price' : p === 'free' ? 'Free Batches' : 'Premium'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Published Batches Catalog Grid */}
                    {isLoadingCatalog ? (
                        <div className="flex justify-center py-24 bg-[#0B152B] rounded-3xl border border-[#17274B]">
                            <Loader2 className="animate-spin text-blue-500" size={44} />
                        </div>
                    ) : filteredCatalogBatches.length === 0 ? (
                        <div className="text-center py-20 bg-[#0B152B] rounded-3xl border border-[#17274B] space-y-4 px-4">
                            <BookOpen size={44} className="mx-auto text-slate-500" />
                            <h3 className="text-xl font-black text-white">No batches found matching criteria</h3>
                            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
                                Try changing your category, price filter, or search keywords to find available master batches.
                            </p>
                            <button
                                onClick={() => {
                                    setExploreSearchTerm('');
                                    setSelectedCategory('All');
                                    setSelectedLevel('All');
                                    setSelectedLanguage('All');
                                    setSelectedPriceFilter('all');
                                }}
                                className="px-6 py-2.5 bg-[#10224A] text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-[#1E3A75] cursor-pointer"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCatalogBatches.map(batch => {
                                const isEnrolled = enrolledCourseIds.has(batch.id);
                                const isFree = batch.accessType === 'free' || !batch.pricing?.amount || batch.pricing.amount <= 0;
                                const isEnrollingThis = enrollingCourseId === batch.id;
                                const hours = Math.round((batch.durationMinutes || 0) / 60);

                                return (
                                    <div
                                        key={batch.id}
                                        className="bg-[#0B152B] rounded-3xl border border-[#17274B] shadow-xl hover:border-blue-500/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                                    >
                                        <div>
                                            {/* Thumbnail */}
                                            <div className="relative h-48 bg-[#070D1E] overflow-hidden">
                                                {batch.thumbnailUrl ? (
                                                    <img
                                                        src={batch.thumbnailUrl}
                                                        alt={batch.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0F224A] to-[#070D1E] text-white p-4">
                                                        <GraduationCap size={44} className="text-[#38BDF8] mb-2" />
                                                        <span className="text-xs font-black uppercase tracking-wider text-[#38BDF8]">
                                                            {batch.examCategory}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Top Badges */}
                                                <div className="absolute top-3 left-3 flex items-center gap-2">
                                                    <span className="bg-[#070D1E]/85 backdrop-blur-md text-[#38BDF8] text-[10px] font-black uppercase px-3 py-1 rounded-full border border-blue-500/20">
                                                        {batch.examCategory}
                                                    </span>
                                                    {batch.level && (
                                                        <span className="bg-[#070D1E]/85 backdrop-blur-md text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                                                            {batch.level}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Free or Price Tag */}
                                                <div className="absolute top-3 right-3">
                                                    {isFree ? (
                                                        <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md">
                                                            Free
                                                        </span>
                                                    ) : (
                                                        <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                                                            ₹{batch.pricing?.amount}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Rating & Language Badge */}
                                                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                                    <span className="bg-black/75 backdrop-blur-md text-amber-400 text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/10">
                                                        <Star size={11} className="fill-amber-400" />
                                                        {batch.rating || 4.8}
                                                    </span>
                                                    {batch.language && (
                                                        <span className="bg-black/75 backdrop-blur-md text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10">
                                                            {batch.language}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="p-6 space-y-3.5">
                                                <h3 className="text-base font-black text-white leading-snug line-clamp-2 group-hover:text-[#38BDF8] transition-colors">
                                                    {batch.title}
                                                </h3>

                                                {batch.shortDescription && (
                                                    <p className="text-xs text-slate-400 line-clamp-2 font-medium leading-relaxed">
                                                        {batch.shortDescription}
                                                    </p>
                                                )}

                                                {/* Instructor */}
                                                <div className="flex items-center gap-2.5 pt-1">
                                                    <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20 shrink-0">
                                                        {batch.instructor?.name?.charAt(0) || 'F'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-xs font-bold text-slate-200 truncate block">
                                                            {batch.instructor?.name || 'Examinant Expert Faculty'}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-slate-400 truncate block">
                                                            {batch.instructor?.title || 'Senior Mentor'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quick Numbers */}
                                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#17274B] text-[11px] font-bold text-slate-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Video size={13} className="text-[#38BDF8]" />
                                                        <span>{batch.totalLessons || 0} Lectures</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 justify-end">
                                                        <Clock size={13} className="text-[#FF7A00]" />
                                                        <span>{hours > 0 ? `${hours}h Content` : 'Self-Paced'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons & Pricing */}
                                        <div className="p-6 pt-0 space-y-3 bg-[#0B152B]">
                                            {/* Price Display */}
                                            <div className="flex items-center justify-between pt-2 border-t border-[#17274B]">
                                                <div>
                                                    {isFree ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-emerald-400 font-black text-base">FREE Access</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-xl font-black text-white">₹{batch.pricing?.amount}</span>
                                                            {batch.pricing?.originalPrice && batch.pricing.originalPrice > (batch.pricing?.amount || 0) && (
                                                                <>
                                                                    <span className="text-xs text-slate-500 line-through">₹{batch.pricing.originalPrice}</span>
                                                                    <span className="text-[10px] font-black text-emerald-400">
                                                                        {Math.round(((batch.pricing.originalPrice - batch.pricing.amount) / batch.pricing.originalPrice) * 100)}% OFF
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => openCurriculumModal(batch)}
                                                    className="text-xs font-bold text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer"
                                                >
                                                    <FileText size={12} />
                                                    <span>Syllabus</span>
                                                </button>
                                            </div>

                                            {/* CTA Button */}
                                            {isEnrolled ? (
                                                <button
                                                    onClick={() => navigate(`/dashboard/courses/${batch.id}/learn`)}
                                                    className="w-full py-3.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-extrabold text-xs uppercase tracking-wider rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                                >
                                                    <CheckCircle2 size={16} />
                                                    <span>Enrolled • Go to Batch</span>
                                                    <ArrowRight size={14} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleEnroll(batch)}
                                                    disabled={isEnrollingThis}
                                                    className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                                        isFree
                                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20'
                                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                                                    }`}
                                                >
                                                    {isEnrollingThis ? (
                                                        <>
                                                            <Loader2 size={16} className="animate-spin" />
                                                            <span>Processing...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles size={14} />
                                                            <span>{isFree ? 'Enroll for Free' : 'Buy Batch Now'}</span>
                                                            <ArrowRight size={14} />
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* CURRICULUM / SYLLABUS PREVIEW MODAL                                       */}
            {/* ========================================================================= */}
            <AnimatePresence>
                {selectedCourseForModal && (
                    <div
                        className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6"
                        onClick={() => setSelectedCourseForModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.94, opacity: 0, y: 15 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0B152B] w-full max-w-2xl rounded-3xl border border-[#17274B] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-6 bg-[#070D1E] border-b border-[#17274B] flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase text-[#38BDF8]">
                                        <BookOpen size={14} />
                                        <span>Batch Syllabus & Curriculum</span>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                                        {selectedCourseForModal.title}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        {modalCurriculum.length} Modules • {selectedCourseForModal.totalLessons || 0} Lectures
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedCourseForModal(null)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-[#10224A] rounded-xl transition-colors shrink-0 cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Curriculum List */}
                            <div className="p-6 overflow-y-auto space-y-4 flex-1">
                                {isLoadingModalCurriculum ? (
                                    <div className="flex justify-center py-16">
                                        <Loader2 className="animate-spin text-blue-500" size={36} />
                                    </div>
                                ) : modalCurriculum.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 font-bold text-xs">
                                        Curriculum details will be published soon by faculty.
                                    </div>
                                ) : (
                                    modalCurriculum.map(({ module, lessons }, idx) => {
                                        const isExpanded = expandedModuleIds[module.id];
                                        return (
                                            <div
                                                key={module.id}
                                                className="bg-[#070D1E] rounded-2xl border border-[#17274B] overflow-hidden transition-all"
                                            >
                                                {/* Module Header Accordion Trigger */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleModuleExpansion(module.id)}
                                                    className="w-full p-4 flex items-center justify-between text-left hover:bg-[#10224A]/40 transition-colors cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-lg bg-blue-500/15 text-[#38BDF8] text-[11px] font-black flex items-center justify-center shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <div>
                                                            <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                                                                {module.title}
                                                            </h4>
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                {lessons.length} Lectures
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {isExpanded ? (
                                                        <ChevronUp size={16} className="text-slate-400" />
                                                    ) : (
                                                        <ChevronDown size={16} className="text-slate-400" />
                                                    )}
                                                </button>

                                                {/* Lessons List */}
                                                {isExpanded && (
                                                    <div className="p-4 pt-0 space-y-2 border-t border-[#17274B]/60 mt-1">
                                                        {lessons.length === 0 ? (
                                                            <span className="text-[11px] text-slate-500 italic block py-2">
                                                                Lectures being uploaded...
                                                            </span>
                                                        ) : (
                                                            lessons.map((lesson, lIdx) => (
                                                                <div
                                                                    key={lesson.id}
                                                                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B152B] border border-[#17274B] text-xs"
                                                                >
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <span className="text-[10px] font-bold text-slate-500 shrink-0">
                                                                            {idx + 1}.{lIdx + 1}
                                                                        </span>
                                                                        <Video size={14} className="text-blue-400 shrink-0" />
                                                                        <span className="text-slate-200 font-medium truncate">
                                                                            {lesson.title}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        {lesson.durationMinutes && (
                                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                                {lesson.durationMinutes}m
                                                                            </span>
                                                                        )}
                                                                        {lesson.isFreePreview ? (
                                                                            <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md">
                                                                                Preview
                                                                            </span>
                                                                        ) : (
                                                                            <Lock size={12} className="text-slate-500" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Modal Footer CTA */}
                            <div className="p-5 bg-[#070D1E] border-t border-[#17274B] flex items-center justify-between gap-4">
                                <div>
                                    {selectedCourseForModal.accessType === 'free' || !selectedCourseForModal.pricing?.amount ? (
                                        <span className="text-emerald-400 font-black text-sm uppercase tracking-wider">Free Batch</span>
                                    ) : (
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg font-black text-white">₹{selectedCourseForModal.pricing.amount}</span>
                                            {selectedCourseForModal.pricing.originalPrice && (
                                                <span className="text-xs text-slate-500 line-through">₹{selectedCourseForModal.pricing.originalPrice}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {enrolledCourseIds.has(selectedCourseForModal.id) ? (
                                    <button
                                        onClick={() => {
                                            navigate(`/dashboard/courses/${selectedCourseForModal.id}/learn`);
                                            setSelectedCourseForModal(null);
                                        }}
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        <PlayCircle size={15} />
                                        <span>Start Learning</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleEnroll(selectedCourseForModal)}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
                                    >
                                        <Sparkles size={15} />
                                        <span>
                                            {selectedCourseForModal.accessType === 'free' || !selectedCourseForModal.pricing?.amount
                                                ? 'Enroll for Free'
                                                : 'Buy Batch Now'}
                                        </span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentBatchesPage;
