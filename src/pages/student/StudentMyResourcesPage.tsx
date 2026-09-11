import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, BookOpen, FileText, Video, Award, Sparkles, Filter, ChevronRight,
    ChevronLeft, Download, Bookmark, Lock, CheckCircle2, Star, Clock,
    Layers, Zap, Trophy, ShieldCheck, Flame, Gift, ArrowRight, Eye,
    ExternalLink, X, HelpCircle, Check, Play, RefreshCw, Folder, BookMarked,
    SlidersHorizontal, Compass, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { loadRazorpay } from '../../utils/razorpay';
import { marketplaceService } from '../../services/marketplaceService';

// Types
interface ResourceItem {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    type: 'pdf' | 'video' | 'mindmap' | 'pyq' | 'ppt' | 'formula' | 'notes';
    subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology' | 'General';
    chapterNumber?: string;
    pages?: number;
    readTime?: string;
    duration?: string;
    questionsCount?: number;
    updatedDate?: string;
    accessType: 'included' | 'free' | 'purchased' | 'premium';
    price?: number;
    originalPrice?: number;
    progress?: number; // 0-100
    rating?: number;
    ratingCount?: string;
    badge?: string;
    exam: string;
    url?: string;
    isBookmarked?: boolean;
    isDownloaded?: boolean;
}

// Available Exam Options
const EXAM_OPTIONS = [
    { id: 'jee-2027', name: 'JEE Main 2027', icon: '⚡', category: 'Engineering' },
    { id: 'neet-2027', name: 'NEET UG 2027', icon: '🩺', category: 'Medical' },
    { id: 'cuet-2027', name: 'CUET UG 2027', icon: '🎓', category: 'University' },
    { id: 'gate-2027', name: 'GATE 2027', icon: '⚙️', category: 'Engineering' },
    { id: 'ssc-2027', name: 'SSC CGL 2027', icon: '🎯', category: 'Govt Job' },
    { id: 'defence-2027', name: 'Defence Exams', icon: '🛡️', category: 'Defence' }
];

// Initial Rich Resources Dataset
const DEFAULT_RESOURCES: ResourceItem[] = [
    // Section 2 - My Resources
    {
        id: 'res-1',
        title: 'Units & Dimensions',
        subtitle: 'Complete Notes',
        type: 'notes',
        subject: 'Physics',
        chapterNumber: '01',
        pages: 18,
        readTime: '15 min read',
        updatedDate: '10 Aug 2026',
        accessType: 'included',
        progress: 78,
        exam: 'JEE Main 2027',
        isBookmarked: true
    },
    {
        id: 'res-2',
        title: 'Kinematics',
        subtitle: 'Revision Lecture',
        type: 'video',
        subject: 'Physics',
        chapterNumber: '02',
        duration: '48 min',
        readTime: '22 min read',
        pages: 26,
        updatedDate: '12 Aug 2026',
        accessType: 'included',
        progress: 60,
        exam: 'JEE Main 2027',
        isBookmarked: false
    },
    {
        id: 'res-3',
        title: 'JEE Main PYQs',
        subtitle: '2019–2026 Chapterwise',
        type: 'pyq',
        subject: 'General',
        pages: 620,
        questionsCount: 1850,
        updatedDate: '01 Aug 2026',
        accessType: 'free',
        progress: 0,
        exam: 'JEE Main 2027',
        rating: 4.8,
        ratingCount: '12.6K',
        isDownloaded: true
    },
    {
        id: 'res-4',
        title: 'Laws of Motion',
        subtitle: 'Mind Map',
        type: 'mindmap',
        subject: 'Physics',
        chapterNumber: '03',
        pages: 1,
        readTime: '5 min review',
        updatedDate: '12 Aug 2026',
        accessType: 'purchased',
        progress: 100,
        exam: 'JEE Main 2027',
        isBookmarked: true
    },
    // Section 4 - Explore Resources
    {
        id: 'res-5',
        title: 'Physics Complete Notes',
        subtitle: '24 Chapters Master Set',
        type: 'notes',
        subject: 'Physics',
        pages: 312,
        accessType: 'premium',
        price: 299,
        originalPrice: 799,
        exam: 'JEE Main 2027',
        rating: 4.9,
        ratingCount: '8.7K'
    },
    {
        id: 'res-6',
        title: 'Chemistry Revision Lectures',
        subtitle: 'All Chapters Video Series',
        type: 'video',
        subject: 'Chemistry',
        duration: '18.5 Hours',
        accessType: 'included',
        exam: 'JEE Main 2027',
        rating: 4.7,
        ratingCount: '6.1K'
    },
    {
        id: 'res-7',
        title: 'Mind Map Collection',
        subtitle: 'Quick Visual Revision',
        type: 'mindmap',
        subject: 'General',
        pages: 156,
        accessType: 'included',
        exam: 'JEE Main 2027',
        rating: 4.7,
        ratingCount: '3.9K'
    },
    {
        id: 'res-8',
        title: 'Formula Sheet Booklet',
        subtitle: 'All Formulae in One Place',
        type: 'formula',
        subject: 'General',
        pages: 68,
        accessType: 'premium',
        price: 79,
        originalPrice: 199,
        exam: 'JEE Main 2027',
        rating: 4.9,
        ratingCount: '5.3K'
    },
    // Section 5 - Notes List
    {
        id: 'res-9',
        title: 'Work, Energy & Power',
        subtitle: 'Complete Notes',
        type: 'notes',
        subject: 'Physics',
        chapterNumber: '04',
        pages: 42,
        readTime: '32 min read',
        updatedDate: '14 Aug 2026',
        accessType: 'premium',
        price: 99,
        originalPrice: 199,
        progress: 45,
        exam: 'JEE Main 2027'
    },
    {
        id: 'res-10',
        title: 'System of Particles',
        subtitle: 'Complete Notes',
        type: 'notes',
        subject: 'Physics',
        chapterNumber: '05',
        pages: 20,
        readTime: '16 min read',
        updatedDate: '08 Aug 2026',
        accessType: 'free',
        progress: 100,
        exam: 'JEE Main 2027'
    },
    {
        id: 'res-11',
        title: 'Chemical Bonding & Structure',
        subtitle: 'Complete Notes',
        type: 'notes',
        subject: 'Chemistry',
        chapterNumber: '04',
        pages: 38,
        readTime: '28 min read',
        updatedDate: '11 Aug 2026',
        accessType: 'included',
        progress: 50,
        exam: 'JEE Main 2027'
    },
    {
        id: 'res-12',
        title: 'Definite Integration Tricks',
        subtitle: 'Formula & Shortcuts',
        type: 'notes',
        subject: 'Mathematics',
        chapterNumber: '07',
        pages: 25,
        readTime: '20 min read',
        updatedDate: '15 Aug 2026',
        accessType: 'included',
        progress: 85,
        exam: 'JEE Main 2027'
    }
];

const StudentMyResourcesPage: React.FC = () => {
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;

    // Active Exam State
    const [selectedExam, setSelectedExam] = useState<string>('JEE Main 2027');
    const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
    const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

    // Section Refs for smooth scroll
    const sectionRefs = {
        myResources: useRef<HTMLDivElement>(null),
        included: useRef<HTMLDivElement>(null),
        explore: useRef<HTMLDivElement>(null),
        categories: useRef<HTMLDivElement>(null),
        otherExams: useRef<HTMLDivElement>(null),
        recommended: useRef<HTMLDivElement>(null),
    };

    const scrollToSection = (key: keyof typeof sectionRefs) => {
        sectionRefs[key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // My Resources Tab state
    const [myResFilter, setMyResFilter] = useState<'All' | 'Recently Viewed' | 'Downloaded' | 'Bookmarks'>('All');

    // Explore Resources Tab state
    const [exploreCategory, setExploreCategory] = useState<string>('All');

    // Section 5 Notes Explorer Filter State
    const [notesSubject, setNotesSubject] = useState<'All' | 'Physics' | 'Chemistry' | 'Mathematics'>('All');
    const [notesAccessFilter, setNotesAccessFilter] = useState<'all' | 'included' | 'free' | 'purchased' | 'premium'>('all');
    const [notesSearch, setNotesSearch] = useState('');
    const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(['pdf']);
    const [downloadedOnly, setDownloadedOnly] = useState(false);
    const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

    // Dynamic Resources State
    const [resourcesList, setResourcesList] = useState<ResourceItem[]>(DEFAULT_RESOURCES);
    const [purchasedResourceIds, setPurchasedResourceIds] = useState<Set<string>>(new Set());
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set(['res-1', 'res-4']));
    const [enrollingId, setEnrollingId] = useState<string | null>(null);

    // Active Reader / Resource Viewer Modal
    const [activeViewerResource, setActiveViewerResource] = useState<ResourceItem | null>(null);

    // Carousel scroll helpers
    const myResScrollRef = useRef<HTMLDivElement>(null);
    const exploreScrollRef = useRef<HTMLDivElement>(null);
    const otherExamsScrollRef = useRef<HTMLDivElement>(null);

    const scrollCarousel = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
        if (ref.current) {
            const scrollAmount = direction === 'left' ? -340 : 340;
            ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Firebase Purchases Real-time sync
    useEffect(() => {
        if (!currentUser) return;
        try {
            const purchasesRef = collection(db, 'users', currentUser.uid, 'purchases');
            const unsubscribe = onSnapshot(purchasesRef, (snapshot) => {
                const ids = new Set<string>();
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.resourceId) ids.add(data.resourceId);
                    if (data.itemId) ids.add(data.itemId);
                });
                setPurchasedResourceIds(ids);
            });
            return () => unsubscribe();
        } catch (err) {
            console.error("Purchases listener error:", err);
        }
    }, [currentUser]);

    // Handle Buy / Unlock Resource
    const handleBuyResource = async (res: ResourceItem) => {
        if (!currentUser) {
            alert('Please login to continue.');
            return;
        }

        if (purchasedResourceIds.has(res.id)) {
            setActiveViewerResource(res);
            return;
        }

        setEnrollingId(res.id);
        try {
            if (res.accessType === 'premium' && res.price && res.price > 0) {
                const rzp = await loadRazorpay();
                if (!rzp) {
                    alert('Payment gateway failed to load.');
                    setEnrollingId(null);
                    return;
                }

                const options = {
                    key: 'rzp_live_TAGGnZwDvZubIP',
                    amount: (res.price || 99) * 100,
                    currency: 'INR',
                    name: 'Examinant',
                    description: `Unlock: ${res.title}`,
                    image: 'https://examinantt.web.app/logo192.png',
                    handler: async function (_response: any) {
                        try {
                            await marketplaceService.enrollInItem(currentUser.uid, {
                                id: res.id,
                                title: res.title,
                                price: res.price || 0,
                                type: 'resource'
                            });
                            setPurchasedResourceIds(prev => new Set([...Array.from(prev), res.id]));
                            alert(`🎉 Success! "${res.title}" is now unlocked.`);
                        } catch (err) {
                            console.error("Enrollment error:", err);
                        }
                    },
                    prefill: {
                        name: currentUser.displayName || 'Student',
                        email: currentUser.email || ''
                    },
                    theme: { color: '#f97316' },
                    modal: { ondismiss: () => setEnrollingId(null) }
                };

                const paymentObj = new (window as any).Razorpay(options);
                paymentObj.open();
                setEnrollingId(null);
            } else {
                setPurchasedResourceIds(prev => new Set([...Array.from(prev), res.id]));
                setActiveViewerResource(res);
                setEnrollingId(null);
            }
        } catch (error) {
            console.error("Purchase failed:", error);
            setEnrollingId(null);
        }
    };

    // Toggle Bookmark
    const toggleBookmark = (id: string) => {
        setBookmarkedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Filtered "My Resources" items
    const filteredMyResources = resourcesList.filter(res => {
        if (myResFilter === 'Bookmarks') return bookmarkedIds.has(res.id);
        if (myResFilter === 'Downloaded') return !!res.isDownloaded;
        if (myResFilter === 'Recently Viewed') return (res.progress || 0) > 0;
        return true;
    });

    // Filtered "Explore" items
    const exploreCategories = ['All', 'Notes', 'PYQs', 'Study Material', 'Mind Maps', 'PPTs', 'Formula Sheets', 'Revision Notes'];
    const filteredExplore = resourcesList.filter(res => {
        if (exploreCategory === 'All') return true;
        if (exploreCategory === 'Notes') return res.type === 'notes';
        if (exploreCategory === 'PYQs') return res.type === 'pyq';
        if (exploreCategory === 'Mind Maps') return res.type === 'mindmap';
        if (exploreCategory === 'Formula Sheets') return res.type === 'formula';
        return true;
    });

    // Filtered Notes Chapter List (Section 5)
    const filteredNotesList = resourcesList.filter(res => {
        const matchesSubject = notesSubject === 'All' || res.subject === notesSubject;
        const matchesSearch = res.title.toLowerCase().includes(notesSearch.toLowerCase()) ||
            (res.subtitle || '').toLowerCase().includes(notesSearch.toLowerCase());

        let matchesAccess = true;
        if (notesAccessFilter === 'included') matchesAccess = res.accessType === 'included';
        if (notesAccessFilter === 'free') matchesAccess = res.accessType === 'free';
        if (notesAccessFilter === 'purchased') matchesAccess = res.accessType === 'purchased' || purchasedResourceIds.has(res.id);
        if (notesAccessFilter === 'premium') matchesAccess = res.accessType === 'premium';

        let matchesOther = true;
        if (bookmarkedOnly && !bookmarkedIds.has(res.id)) matchesOther = false;
        if (downloadedOnly && !res.isDownloaded) matchesOther = false;

        return matchesSubject && matchesSearch && matchesAccess && matchesOther;
    });

    return (
        <div className="min-h-screen bg-[#070D1E] text-slate-100 -m-4 sm:-m-8 p-4 sm:p-8 space-y-12 font-sans selection:bg-orange-500 selection:text-white">

            {/* ========================================================================= */}
            {/* SECTION 1: HERO & EXAM SELECTOR + QUICK JUMP PILLS + INFO BANNER           */}
            {/* ========================================================================= */}
            <div className="relative bg-gradient-to-br from-[#0B152B] via-[#0D1B3A] to-[#070D1E] border border-[#17274B] rounded-[36px] p-6 sm:p-10 shadow-2xl overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                    <div className="space-y-4 max-w-xl">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preparing for</span>
                        </div>

                        {/* Exam Dropdown Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
                                className="flex items-center gap-3 text-2xl sm:text-4xl font-black text-white hover:text-orange-400 transition-colors group"
                            >
                                <span>{selectedExam}</span>
                                <ChevronRight className={`w-7 h-7 text-orange-400 transition-transform duration-300 ${isExamDropdownOpen ? 'rotate-90' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isExamDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full left-0 mt-3 w-72 bg-[#0D1B3A] border border-[#1E3360] rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-xl"
                                    >
                                        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/5">
                                            Select Target Exam
                                        </div>
                                        <div className="space-y-1 mt-1">
                                            {EXAM_OPTIONS.map((exam) => (
                                                <button
                                                    key={exam.id}
                                                    onClick={() => {
                                                        setSelectedExam(exam.name);
                                                        setIsExamDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all ${selectedExam === exam.name
                                                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span>{exam.icon}</span>
                                                        {exam.name}
                                                    </span>
                                                    {selectedExam === exam.name && <Check size={16} className="text-orange-400" />}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-2 text-orange-400 text-xs sm:text-sm font-bold">
                            <BookMarked size={18} className="text-orange-400" />
                            <span>8 Resource Collections Available for this exam</span>
                        </div>
                    </div>

                    {/* Change Exam Action & 3D Folder Graphic Card */}
                    <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-end">
                        <button
                            onClick={() => setIsExamDropdownOpen(true)}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 font-black text-xs uppercase tracking-wider transition-all"
                        >
                            <RefreshCw size={14} />
                            Change Exam
                        </button>

                        {/* Visual 3D Glowing Folder Illustration */}
                        <div className="w-36 h-28 sm:w-44 sm:h-32 bg-gradient-to-tr from-[#0F224A] to-[#1E3A75] border border-blue-400/20 rounded-3xl p-3 flex flex-col justify-between shadow-2xl relative group hover:scale-105 transition-transform">
                            <div className="absolute inset-0 bg-orange-500/10 rounded-3xl blur-xl group-hover:bg-orange-500/20 transition-all"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/40">
                                    <Sparkles size={16} />
                                </div>
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                </div>
                            </div>
                            <div className="relative z-10">
                                <span className="block text-[10px] uppercase font-black tracking-wider text-blue-200">Digital Vault</span>
                                <span className="text-base font-black text-white tracking-tight">Smart Resources</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6 Quick Navigation Category Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-8 relative z-10">
                    <button
                        onClick={() => scrollToSection('myResources')}
                        className="bg-[#0D1B38] hover:bg-[#132752] border border-[#1C325E] hover:border-orange-500/40 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 transition-all group active:scale-95 shadow-md"
                    >
                        <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Folder size={20} />
                        </div>
                        <span className="text-xs font-black text-slate-200 group-hover:text-white">My Resources</span>
                    </button>

                    <button
                        onClick={() => scrollToSection('included')}
                        className="bg-[#0D1B38] hover:bg-[#132752] border border-[#1C325E] hover:border-orange-500/40 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 transition-all group active:scale-95 shadow-md"
                    >
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Gift size={20} />
                        </div>
                        <span className="text-xs font-black text-slate-200 group-hover:text-white">Included with Batch</span>
                    </button>

                    <button
                        onClick={() => scrollToSection('explore')}
                        className="bg-[#0D1B38] hover:bg-[#132752] border border-[#1C325E] hover:border-orange-500/40 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 transition-all group active:scale-95 shadow-md"
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Compass size={20} />
                        </div>
                        <span className="text-xs font-black text-slate-200 group-hover:text-white">Explore Resources</span>
                    </button>

                    <button
                        onClick={() => scrollToSection('categories')}
                        className="bg-[#0D1B38] hover:bg-[#132752] border border-[#1C325E] hover:border-orange-500/40 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 transition-all group active:scale-95 shadow-md"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Layers size={20} />
                        </div>
                        <span className="text-xs font-black text-slate-200 group-hover:text-white">Categories & Notes</span>
                    </button>

                    <button
                        onClick={() => scrollToSection('otherExams')}
                        className="bg-[#0D1B38] hover:bg-[#132752] border border-[#1C325E] hover:border-orange-500/40 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 transition-all group active:scale-95 shadow-md"
                    >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <GraduationCap size={20} />
                        </div>
                        <span className="text-xs font-black text-slate-200 group-hover:text-white">Other Exams</span>
                    </button>

                    <button
                        onClick={() => scrollToSection('recommended')}
                        className="bg-[#0D1B38] hover:bg-[#132752] border border-[#1C325E] hover:border-orange-500/40 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 transition-all group active:scale-95 shadow-md"
                    >
                        <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Star size={20} />
                        </div>
                        <span className="text-xs font-black text-slate-200 group-hover:text-white">Recommended for You</span>
                    </button>
                </div>

                {/* Info Bar at Bottom of Section 1 */}
                <div className="mt-8 pt-6 border-t border-[#17274B] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-white">Everything you need to learn, revise & master your exam.</h4>
                            <p className="text-xs text-slate-400">Notes, PYQs, Study Material, Mind Maps, PPTs, Formula Sheets and more.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsHowItWorksOpen(true)}
                        className="flex items-center gap-1.5 text-xs font-black text-orange-400 hover:text-orange-300 transition-colors uppercase tracking-wider shrink-0 bg-white/5 px-4 py-2 rounded-xl border border-white/10"
                    >
                        <span>How Resources Work?</span>
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>


            {/* ========================================================================= */}
            {/* SECTION 2: MY RESOURCES (CAROUSEL / QUICK ACCESS)                          */}
            {/* ========================================================================= */}
            <div ref={sectionRefs.myResources} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                            <Folder size={20} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">My Resources</h2>
                            <p className="text-xs text-slate-400 font-medium">Quick access to the resources you've used or saved.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Carousel Arrows */}
                        <div className="flex items-center gap-1.5 bg-[#0B152B] p-1 rounded-xl border border-[#17274B]">
                            <button
                                onClick={() => scrollCarousel(myResScrollRef, 'left')}
                                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => scrollCarousel(myResScrollRef, 'right')}
                                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => scrollToSection('categories')}
                            className="flex items-center gap-1.5 text-xs font-black text-orange-400 hover:text-orange-300 transition-colors uppercase tracking-wider bg-orange-500/10 px-4 py-2.5 rounded-xl border border-orange-500/30"
                        >
                            View All My Resources <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                {/* Filter Pills: All, Recently Viewed, Downloaded, Bookmarks */}
                <div className="flex flex-wrap items-center gap-2">
                    {(['All', 'Recently Viewed', 'Downloaded', 'Bookmarks'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setMyResFilter(tab)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${myResFilter === tab
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                    : 'bg-[#0B152B] text-slate-400 hover:text-white hover:bg-[#101D3B] border border-[#17274B]'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Horizontal Scrollable Carousel Cards */}
                <div
                    ref={myResScrollRef}
                    className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {filteredMyResources.map((res) => {
                        const isBookmarked = bookmarkedIds.has(res.id);
                        return (
                            <div
                                key={res.id}
                                className="min-w-[280px] sm:min-w-[320px] max-w-[320px] bg-gradient-to-b from-[#0D1B3A] to-[#091329] border border-[#17274B] rounded-3xl p-5 flex flex-col justify-between shadow-xl hover:border-orange-500/40 transition-all snap-start group"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 rounded-2xl bg-[#14264F] border border-blue-400/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                            {res.type === 'video' ? <Video size={22} /> : res.type === 'pyq' ? <FileText size={22} /> : res.type === 'mindmap' ? <Zap size={22} /> : <BookOpen size={22} />}
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${res.accessType === 'included'
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : res.accessType === 'free'
                                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                            }`}>
                                            {res.accessType}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-black text-lg text-white group-hover:text-orange-400 transition-colors line-clamp-1">{res.title}</h3>
                                        <p className="text-xs text-slate-400 font-semibold mt-0.5">{res.subtitle || `${res.subject} • Chapter ${res.chapterNumber || '01'}`}</p>
                                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold mt-2">
                                            {res.pages && <span>{res.pages} Pages</span>}
                                            {res.duration && <span>{res.duration}</span>}
                                            {res.readTime && <span>• {res.readTime}</span>}
                                        </div>
                                    </div>

                                    {/* Progress bar if ongoing */}
                                    {res.progress !== undefined && (
                                        <div className="space-y-1.5 pt-1">
                                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                <span>{res.progress}% {res.type === 'video' ? 'Watched' : 'Viewed'}</span>
                                                {res.progress === 100 && <CheckCircle2 size={12} className="text-emerald-400" />}
                                            </div>
                                            <div className="w-full bg-[#17274B] h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${res.progress === 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-orange-500 to-amber-400'
                                                        }`}
                                                    style={{ width: `${res.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => setActiveViewerResource(res)}
                                        className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        {res.type === 'video' ? (
                                            <>
                                                <Play size={14} className="fill-white" />
                                                <span>{res.progress ? 'Continue Watching' : 'Watch Video'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <BookOpen size={14} />
                                                <span>{res.progress ? 'Continue Reading' : 'Open Resource'}</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => toggleBookmark(res.id)}
                                        className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${isBookmarked
                                                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                                                : 'bg-[#0B152B] border-[#17274B] text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        <Bookmark size={16} className={isBookmarked ? 'fill-orange-400' : ''} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


            {/* ========================================================================= */}
            {/* SECTION 3: INCLUDED WITH YOUR BATCH (PREMIUM VALUE SHOWCASE)               */}
            {/* ========================================================================= */}
            <div ref={sectionRefs.included} className="bg-gradient-to-br from-[#0B152B] via-[#0E1B3B] to-[#070D1E] border border-[#17274B] rounded-[36px] p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
                            <Gift size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Included With Your Batch</h2>
                                <span className="bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-orange-500/30">
                                    Selection Batch ✨
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                                Unlock premium digital study resources bundled with your enrolled batch at zero extra cost.
                            </p>
                        </div>
                    </div>

                    {/* Value Badge Box */}
                    <div className="bg-[#12234D] border border-blue-400/30 rounded-2xl px-6 py-4 flex items-center gap-4 self-start lg:self-auto shadow-xl">
                        <div>
                            <span className="block text-[10px] uppercase font-black tracking-widest text-slate-300">Total Resource Value</span>
                            <span className="text-2xl font-black text-emerald-400">₹2,499+</span>
                        </div>
                        <div className="h-10 w-[1px] bg-white/10"></div>
                        <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 size={16} />
                            100% Free with Batch
                        </span>
                    </div>
                </div>

                {/* 10 Interactive Category Grid Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                        { icon: <BookOpen size={20} />, title: 'Complete Notes', sub: '24 Subjects', count: '512+ Notes', color: 'blue' },
                        { icon: <FileText size={20} />, title: 'Study Material', sub: 'All Subjects', count: '320+ PDFs', color: 'indigo' },
                        { icon: <Video size={20} />, title: 'Lecture PPTs', sub: 'All Chapters', count: '480+ PPTs', color: 'orange' },
                        { icon: <Zap size={20} />, title: 'Mind Maps', sub: 'All Subjects', count: '180+ Maps', color: 'emerald' },
                        { icon: <HelpCircle size={20} />, title: 'PYQ Question Bank', sub: '2010 – 2026', count: '18,000+ Qs', color: 'purple' },
                        { icon: <BookMarked size={20} />, title: 'Revision Notes', sub: 'Quick Revision', count: '400+ Pages', color: 'amber' },
                        { icon: <Star size={20} />, title: 'Important Questions', sub: 'Chapterwise', count: '5,600+ Qs', color: 'rose' },
                        { icon: <Layers size={20} />, title: 'Formula Sheets', sub: 'All Subjects', count: '120+ Sheets', color: 'teal' },
                        { icon: <ShieldCheck size={20} />, title: 'Practice Material', sub: 'Extra Practice', count: '1,200+ Qs', color: 'cyan' },
                        { icon: <Trophy size={20} />, title: 'Topic Tests', sub: 'Chapter Tests', count: '240+ Tests', color: 'yellow' },
                    ].map((item, index) => (
                        <div
                            key={index}
                            onClick={() => scrollToSection('categories')}
                            className="bg-[#0D1B3A] hover:bg-[#12234D] border border-[#17274B] hover:border-orange-500/40 p-4 rounded-2xl flex flex-col justify-between h-32 transition-all cursor-pointer group active:scale-95 shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <div className="w-8 h-8 rounded-xl bg-white/5 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <CheckCircle2 size={16} className="text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xs text-white group-hover:text-orange-400 transition-colors line-clamp-1">{item.title}</h4>
                                <span className="block text-[10px] text-slate-400">{item.sub}</span>
                                <span className="block text-[11px] font-black text-orange-400 mt-0.5">{item.count}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {/* ========================================================================= */}
            {/* SECTION 4: EXPLORE RESOURCES (STORE / CATALOG CAROUSEL)                    */}
            {/* ========================================================================= */}
            <div ref={sectionRefs.explore} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                            <h2 className="text-2xl font-black text-white tracking-tight">Explore Resources ✨</h2>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Discover high-quality resources to supercharge your preparation.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-[#0B152B] p-1 rounded-xl border border-[#17274B]">
                            <button
                                onClick={() => scrollCarousel(exploreScrollRef, 'left')}
                                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => scrollCarousel(exploreScrollRef, 'right')}
                                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    {exploreCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setExploreCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${exploreCategory === cat
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                    : 'bg-[#0B152B] text-slate-400 hover:text-white hover:bg-[#101D3B] border border-[#17274B]'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Explore Horizontal Carousel Cards */}
                <div
                    ref={exploreScrollRef}
                    className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {filteredExplore.map((res) => {
                        const isOwned = purchasedResourceIds.has(res.id) || res.accessType === 'included' || res.accessType === 'free';
                        const isBuying = enrollingId === res.id;

                        return (
                            <div
                                key={res.id}
                                className="min-w-[280px] sm:min-w-[300px] max-w-[300px] bg-gradient-to-b from-[#0D1B3A] to-[#091329] border border-[#17274B] rounded-3xl p-5 flex flex-col justify-between shadow-xl hover:border-orange-500/40 transition-all snap-start group"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 rounded-2xl bg-[#14264F] border border-blue-400/20 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                            {res.type === 'video' ? <Video size={22} /> : res.type === 'pyq' ? <FileText size={22} /> : res.type === 'mindmap' ? <Zap size={22} /> : <BookOpen size={22} />}
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${res.accessType === 'included'
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : res.accessType === 'free'
                                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            }`}>
                                            {res.accessType}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-black text-base text-white group-hover:text-orange-400 transition-colors line-clamp-1">{res.title}</h3>
                                        <p className="text-xs text-slate-400 font-semibold mt-0.5">{res.subtitle || `${res.subject} • All Chapters`}</p>

                                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold mt-2">
                                            {res.pages && <span>PDF • {res.pages} Pages</span>}
                                            {res.duration && <span>Video • {res.duration}</span>}
                                        </div>

                                        {res.rating && (
                                            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-400">
                                                <Star size={13} className="fill-amber-400" />
                                                <span>{res.rating}</span>
                                                <span className="text-slate-400 font-normal">({res.ratingCount})</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                                    {res.price && !isOwned ? (
                                        <div>
                                            <span className="text-lg font-black text-white">₹{res.price}</span>
                                            {res.originalPrice && <span className="text-xs text-slate-400 line-through ml-1.5">₹{res.originalPrice}</span>}
                                        </div>
                                    ) : (
                                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                                            {res.accessType === 'included' ? 'Included with Batch' : 'Free Access'}
                                        </span>
                                    )}

                                    <button
                                        onClick={() => handleBuyResource(res)}
                                        disabled={isBuying}
                                        className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1"
                                    >
                                        {isBuying ? 'Unlocking...' : isOwned ? 'Open Resource' : 'Unlock Now'}
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


            {/* ========================================================================= */}
            {/* SECTION 5: CATEGORIES & CHAPTERWISE NOTES LIST EXPLORER                    */}
            {/* ========================================================================= */}
            <div ref={sectionRefs.categories} className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Notes & Chapter Resources ✨</h2>
                        <p className="text-xs text-slate-400 font-medium">Chapter-wise structured notes and materials for complete revision.</p>
                    </div>
                </div>

                {/* Subject Selector Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    {(['All', 'Physics', 'Chemistry', 'Mathematics'] as const).map((subj) => (
                        <button
                            key={subj}
                            onClick={() => setNotesSubject(subj)}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${notesSubject === subj
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                                    : 'bg-[#0B152B] text-slate-400 hover:text-white hover:bg-[#101D3B] border border-[#17274B]'
                                }`}
                        >
                            <span>{subj}</span>
                        </button>
                    ))}
                </div>

                {/* Search & Access Filter Bar */}
                <div className="bg-[#0B152B] border border-[#17274B] p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setNotesAccessFilter('all')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${notesAccessFilter === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            All ({resourcesList.length})
                        </button>
                        <button
                            onClick={() => setNotesAccessFilter('included')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${notesAccessFilter === 'included' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Included with Batch
                        </button>
                        <button
                            onClick={() => setNotesAccessFilter('free')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${notesAccessFilter === 'free' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Free
                        </button>
                        <button
                            onClick={() => setNotesAccessFilter('premium')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${notesAccessFilter === 'premium' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Premium
                        </button>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search notes or chapters..."
                            value={notesSearch}
                            onChange={(e) => setNotesSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#070D1E] border border-[#17274B] rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                        />
                    </div>
                </div>

                {/* 2-Column: Notes List & Filter Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Notes Chapter Cards List (3 Columns) */}
                    <div className="lg:col-span-3 space-y-3.5">
                        {filteredNotesList.length === 0 ? (
                            <div className="text-center py-16 bg-[#0B152B] border border-[#17274B] rounded-3xl text-slate-400">
                                <BookOpen size={36} className="mx-auto mb-3 text-slate-500" />
                                <h4 className="font-bold text-white">No Notes Found</h4>
                                <p className="text-xs text-slate-400 mt-1">Try changing your search keywords or access filter.</p>
                            </div>
                        ) : (
                            filteredNotesList.map((note) => {
                                const isOwned = purchasedResourceIds.has(note.id) || note.accessType === 'included' || note.accessType === 'free';
                                const isBookmarked = bookmarkedIds.has(note.id);

                                return (
                                    <div
                                        key={note.id}
                                        className="bg-[#0B152B] hover:bg-[#0E1B3B] border border-[#17274B] hover:border-orange-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#14264F] border border-blue-400/20 text-blue-400 flex flex-col items-center justify-center shrink-0">
                                                <span className="text-[9px] uppercase font-black tracking-widest text-blue-300">PDF</span>
                                                <FileText size={18} />
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-orange-400">{note.chapterNumber || '01'}</span>
                                                    <h3 className="font-bold text-base text-white group-hover:text-orange-400 transition-colors">{note.title}</h3>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5">{note.subject} • Chapter {note.chapterNumber || '01'}</p>
                                                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-bold mt-1.5">
                                                    <span>{note.pages || 20} Pages</span>
                                                    <span>• {note.readTime || '15 min read'}</span>
                                                    <span>• Updated: {note.updatedDate || '12 Aug 2026'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-center">
                                            {note.accessType === 'included' ? (
                                                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                                    INCLUDED
                                                </span>
                                            ) : note.accessType === 'free' ? (
                                                <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                                    FREE
                                                </span>
                                            ) : (
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-white">₹{note.price || 99}</span>
                                                    {note.originalPrice && <span className="text-[10px] text-slate-400 line-through ml-1">₹{note.originalPrice}</span>}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleBuyResource(note)}
                                                className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${isOwned
                                                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md'
                                                        : 'bg-orange-500 text-white hover:bg-orange-600'
                                                    }`}
                                            >
                                                {isOwned ? 'Read Now' : 'Unlock Now'}
                                                <ChevronRight size={14} />
                                            </button>

                                            <button
                                                onClick={() => toggleBookmark(note.id)}
                                                className={`p-2.5 rounded-xl border transition-colors ${isBookmarked
                                                        ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                                                        : 'bg-[#070D1E] border-[#17274B] text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                <Bookmark size={14} className={isBookmarked ? 'fill-orange-400' : ''} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Filter Sidebar Card (1 Column) */}
                    <div className="bg-[#0B152B] border border-[#17274B] rounded-3xl p-5 space-y-6 self-start shadow-xl">
                        <div className="text-center p-4 bg-gradient-to-br from-[#12234D] to-[#0D1B3A] rounded-2xl border border-blue-400/20">
                            <BookOpen size={32} className="text-orange-400 mx-auto mb-2" />
                            <span className="block text-2xl font-black text-white">512+</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Notes & Sheets</span>
                        </div>

                        {/* Filter by Access Type */}
                        <div className="space-y-2">
                            <span className="block text-xs font-black uppercase tracking-wider text-slate-400">Filter by Access</span>
                            <div className="space-y-1.5 text-xs font-bold text-slate-300">
                                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                                    <input type="checkbox" checked defaultChecked className="accent-orange-500 rounded" />
                                    <span>Included with Batch</span>
                                    <span className="ml-auto text-slate-500 text-[10px]">245</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                                    <input type="checkbox" checked defaultChecked className="accent-orange-500 rounded" />
                                    <span>Free Resources</span>
                                    <span className="ml-auto text-slate-500 text-[10px]">96</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                                    <input type="checkbox" className="accent-orange-500 rounded" />
                                    <span>Purchased</span>
                                    <span className="ml-auto text-slate-500 text-[10px]">32</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                                    <input type="checkbox" className="accent-orange-500 rounded" />
                                    <span>Premium</span>
                                    <span className="ml-auto text-slate-500 text-[10px]">139</span>
                                </label>
                            </div>
                        </div>

                        {/* File Type */}
                        <div className="space-y-2 pt-4 border-t border-white/5">
                            <span className="block text-xs font-black uppercase tracking-wider text-slate-400">File Type</span>
                            <div className="space-y-1.5 text-xs font-bold text-slate-300">
                                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                                    <input type="checkbox" checked defaultChecked className="accent-orange-500 rounded" />
                                    <span>PDF</span>
                                    <span className="ml-auto text-slate-500 text-[10px]">498</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                                    <input type="checkbox" className="accent-orange-500 rounded" />
                                    <span>eBook</span>
                                    <span className="ml-auto text-slate-500 text-[10px]">12</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                                    <input type="checkbox" className="accent-orange-500 rounded" />
                                    <span>DOC / PPT</span>
                                    <span className="ml-auto text-slate-500 text-[10px]">2</span>
                                </label>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                                <span>Downloaded Only</span>
                                <input
                                    type="checkbox"
                                    checked={downloadedOnly}
                                    onChange={(e) => setDownloadedOnly(e.target.checked)}
                                    className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                                <span>Bookmarked Only</span>
                                <input
                                    type="checkbox"
                                    checked={bookmarkedOnly}
                                    onChange={(e) => setBookmarkedOnly(e.target.checked)}
                                    className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* ========================================================================= */}
            {/* SECTION 6: RESOURCES FOR OTHER EXAMS                                       */}
            {/* ========================================================================= */}
            <div ref={sectionRefs.otherExams} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            <h2 className="text-2xl font-black text-white tracking-tight">Resources for Other Exams ✨</h2>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Explore high quality resources for all major exams.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-[#0B152B] p-1 rounded-xl border border-[#17274B]">
                            <button
                                onClick={() => scrollCarousel(otherExamsScrollRef, 'left')}
                                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => scrollCarousel(otherExamsScrollRef, 'right')}
                                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    ref={otherExamsScrollRef}
                    className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {[
                        { id: 'neet', name: 'NEET UG 2027', icon: '🩺', desc: 'Complete resources for NEET UG preparation', tags: ['Notes', 'PYQs', 'Mind Maps', 'PPTs'], count: '6,200+ Resources', popular: true },
                        { id: 'cuet', name: 'CUET UG 2027', icon: '🎓', desc: 'Domain wise study material and practice resources', tags: ['Notes', 'PYQs', 'Study Material', 'PPTs'], count: '3,800+ Resources' },
                        { id: 'gate', name: 'GATE 2027', icon: '⚙️', desc: 'Subject wise notes, PYQs and engineering resources', tags: ['Notes', 'Formula Sheets', 'PYQs', 'PPTs'], count: '4,100+ Resources' },
                        { id: 'ssc', name: 'SSC CGL 2027', icon: '🎯', desc: 'Complete preparation resources for SSC CGL', tags: ['Notes', 'PYQs', 'Practice Tests', 'Current Affairs'], count: '5,900+ Resources' },
                        { id: 'defence', name: 'Defence Exams', icon: '🛡️', desc: 'NDA, CDS, AFCAT and more defence exam resources', tags: ['Notes', 'PYQs', 'Practice Tests', 'PFT Guide'], count: '2,400+ Resources' },
                    ].map((item) => (
                        <div
                            key={item.id}
                            onClick={() => {
                                setSelectedExam(item.name);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="min-w-[260px] sm:min-w-[290px] max-w-[290px] bg-gradient-to-b from-[#0D1B3A] to-[#091329] border border-[#17274B] rounded-3xl p-5 flex flex-col justify-between shadow-xl hover:border-orange-500/50 hover:scale-[1.02] transition-all snap-start cursor-pointer group"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-[#14264F] text-2xl flex items-center justify-center">
                                        {item.icon}
                                    </div>
                                    {item.popular && (
                                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            POPULAR
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-black text-lg text-white group-hover:text-orange-400 transition-colors">{item.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {item.tags.map((t, idx) => (
                                        <span key={idx} className="bg-white/5 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/5">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                                <span className="text-xs font-black text-emerald-400">{item.count}</span>
                                <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-orange-500 text-slate-400 group-hover:text-white flex items-center justify-center transition-colors">
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {/* ========================================================================= */}
            {/* SECTION 7: RECOMMENDED FOR YOU & BOTTOM MOTIVATION BANNER                 */}
            {/* ========================================================================= */}
            <div ref={sectionRefs.recommended} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            <h2 className="text-2xl font-black text-white tracking-tight">Recommended for You ✨</h2>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Resources curated based on your performance and study activity.</p>
                    </div>
                </div>

                {/* 5 Recommendation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { title: 'Current Electricity', tag: 'HIGH PRIORITY', tagColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30', desc: 'Strengthen this topic to boost your overall score.', reason: 'Based on your weak areas', pages: '18 Pages', action: 'OPEN NOW' },
                        { title: 'Kinematics Mind Map', tag: 'REVISION BOOST', tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30', desc: 'Quick visual revision for better retention.', reason: 'Recommended for revision', pages: '1 Page', action: 'VIEW' },
                        { title: 'Kinematics Revision Lecture', tag: 'CONTINUE LEARNING', tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30', desc: 'Continue from where you left off in the last session.', reason: '60% Completed', pages: '48 min', action: 'RESUME' },
                        { title: 'Kinematics PYQs', tag: 'PRACTICE MORE', tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', desc: 'Practice previous year questions to master the chapter.', reason: 'Recommended for you', pages: '35 Questions', action: 'PRACTICE' },
                        { title: 'Modern Physics Notes', tag: 'NEWLY ADDED', tagColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30', desc: 'Newly added detailed notes with updated examples.', reason: 'Just added', pages: '24 Pages', action: 'READ NOW' },
                    ].map((rec, index) => (
                        <div
                            key={index}
                            className="bg-gradient-to-b from-[#0D1B3A] to-[#091329] border border-[#17274B] rounded-3xl p-5 flex flex-col justify-between shadow-xl hover:border-orange-500/40 transition-all group"
                        >
                            <div className="space-y-3">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${rec.tagColor}`}>
                                    {rec.tag}
                                </span>

                                <div>
                                    <h4 className="font-bold text-base text-white group-hover:text-orange-400 transition-colors">{rec.title}</h4>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rec.desc}</p>
                                </div>

                                <div className="bg-[#070D1E] p-2.5 rounded-xl border border-white/5 text-[10px] font-black text-orange-400 uppercase tracking-wider">
                                    {rec.reason}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                                <span className="text-[11px] font-bold text-slate-400">{rec.pages}</span>
                                <button
                                    onClick={() => {
                                        const mockItem = DEFAULT_RESOURCES[index % DEFAULT_RESOURCES.length];
                                        setActiveViewerResource(mockItem);
                                    }}
                                    className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all"
                                >
                                    {rec.action}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Motivation Banner */}
                <div className="bg-gradient-to-r from-[#0F224A] via-[#1A3366] to-[#0F224A] border border-blue-400/20 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 shrink-0">
                            <Trophy size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">Your preparation, our priority.</h3>
                            <p className="text-xs sm:text-sm text-blue-200 mt-0.5">We recommend the right resources at the right time to help you achieve your best.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
                        <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
                            <Sparkles size={18} className="text-orange-400 mx-auto mb-1" />
                            <span className="block text-[10px] font-black uppercase tracking-wider text-white">Personalized</span>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
                            <Zap size={18} className="text-amber-400 mx-auto mb-1" />
                            <span className="block text-[10px] font-black uppercase tracking-wider text-white">Performance Driven</span>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
                            <Bookmark size={18} className="text-emerald-400 mx-auto mb-1" />
                            <span className="block text-[10px] font-black uppercase tracking-wider text-white">Smart Tracking</span>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
                            <Star size={18} className="text-blue-400 mx-auto mb-1" />
                            <span className="block text-[10px] font-black uppercase tracking-wider text-white">Better Results</span>
                        </div>
                    </div>
                </div>
            </div>


            {/* ========================================================================= */}
            {/* READER / RESOURCE VIEWER MODAL                                             */}
            {/* ========================================================================= */}
            <AnimatePresence>
                {activeViewerResource && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0D1B3A] border border-[#1E3360] w-full max-w-4xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 bg-[#070D1E] border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                                        {activeViewerResource.type === 'video' ? <Video size={20} /> : <FileText size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-white">{activeViewerResource.title}</h3>
                                        <p className="text-xs text-slate-400">{activeViewerResource.subtitle || `${activeViewerResource.subject} Resource`}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setActiveViewerResource(null)}
                                    className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Viewer Body */}
                            <div className="flex-1 p-8 overflow-y-auto space-y-6">
                                <div className="aspect-video bg-black/60 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                                    <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white mb-4 shadow-xl shadow-orange-500/40 cursor-pointer hover:scale-110 transition-transform">
                                        <Play size={28} className="fill-white translate-x-0.5" />
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-1">Interactive Reader & Digital Player</h4>
                                    <p className="text-xs text-slate-400 max-w-md">
                                        Live synced study resource with highlighter, speed notes, and offline download support.
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-[#070D1E] p-4 rounded-2xl border border-white/5 text-center">
                                        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Total Pages</span>
                                        <span className="text-lg font-black text-white">{activeViewerResource.pages || '24'} Pages</span>
                                    </div>
                                    <div className="bg-[#070D1E] p-4 rounded-2xl border border-white/5 text-center">
                                        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Estimated Read</span>
                                        <span className="text-lg font-black text-white">{activeViewerResource.readTime || '20 Mins'}</span>
                                    </div>
                                    <div className="bg-[#070D1E] p-4 rounded-2xl border border-white/5 text-center">
                                        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Exam Target</span>
                                        <span className="text-lg font-black text-orange-400">{selectedExam}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-[#070D1E] border-t border-white/10 flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        alert('Downloading resource to your offline library...');
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider"
                                >
                                    <Download size={14} /> Download PDF
                                </button>

                                <button
                                    onClick={() => setActiveViewerResource(null)}
                                    className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider"
                                >
                                    Done Reading
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* ========================================================================= */}
            {/* "HOW RESOURCES WORK" MODAL                                                */}
            {/* ========================================================================= */}
            <AnimatePresence>
                {isHowItWorksOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0D1B3A] border border-[#1E3360] w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white">
                                        <Sparkles size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-white">How Resources Work</h3>
                                </div>
                                <button onClick={() => setIsHowItWorksOpen(false)} className="text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                                <div className="flex items-start gap-3 bg-[#070D1E] p-4 rounded-2xl border border-white/5">
                                    <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                                    <div>
                                        <h5 className="font-bold text-white mb-0.5">Selection Batch Inclusions</h5>
                                        <p className="text-slate-400 text-xs">All enrolled batch students automatically get access to 512+ Notes, PPTs & Mind Maps.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-[#070D1E] p-4 rounded-2xl border border-white/5">
                                    <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                                    <div>
                                        <h5 className="font-bold text-white mb-0.5">Free & PYQ Question Banks</h5>
                                        <p className="text-slate-400 text-xs">18,000+ Previous Year Questions and free chapter formula sheets are open to everyone.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-[#070D1E] p-4 rounded-2xl border border-white/5">
                                    <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                                    <div>
                                        <h5 className="font-bold text-white mb-0.5">AI Curated Recommendations</h5>
                                        <p className="text-slate-400 text-xs">Based on test performance, high priority revision boosters will be personalized for you.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsHowItWorksOpen(false)}
                                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/30 transition-all"
                            >
                                Got It!
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentMyResourcesPage;
                                </div >
                            </div >

    <button
        onClick={() => setIsHowItWorksOpen(false)}
        className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/30 transition-all"
    >
        Got It!
    </button>
                        </motion.div >
                    </div >
                )}
            </AnimatePresence >
        </div >
    );
};

export default StudentMyResourcesPage;
