import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Star, ShieldCheck, Play, Lock, CheckCircle2, Clock, Layers,
    BookOpen, Award, ArrowRight, Loader2, FileText, ChevronDown, ChevronUp, Sparkles, Target, Download,
    HelpCircle, Trophy, HardDrive
} from 'lucide-react';
import PageLayout from '../components/landing/PageLayout';
import { courseService } from '../services/courseService';
import { curriculumService } from '../services/curriculumService';
import { entitlementService } from '../services/entitlementService';
import type { Course, CourseModule, Lesson } from '../types/course.types';
import VideoPlayer from '../components/common/VideoPlayer';
import { useAuth } from '../contexts/AuthContext';
import { loadRazorpay } from '../utils/razorpay';
import { studentService } from '../services/studentService';

const CourseDetailsPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const profileData = authContext?.profileData;

    const [course, setCourse] = useState<Course | null>(null);
    const [curriculum, setCurriculum] = useState<{ module: CourseModule; lessons: Lesson[] }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'tests' | 'resources'>('overview');

    // Free Preview Video Modal
    const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);

    useEffect(() => {
        if (slug) loadCourseDetails();
    }, [slug, currentUser]);

    const loadCourseDetails = async () => {
        setIsLoading(true);
        try {
            if (!slug) return;
            let c = await courseService.getCourseBySlug(slug);
            if (!c) {
                c = await courseService.getCourseById(slug);
            }

            if (!c) {
                c = {
                    id: slug,
                    slug: slug,
                    title: 'CUET UG 2027 Admission Batch (Science Domain)',
                    shortDescription: 'Comprehensive online preparation batch for CUET UG 2027 (Science Domain), covering Physics, Chemistry, Biology & Mathematics with concept classes, practice tests, and PDF notes.',
                    description: `CUET UG 2027 Admission Batch is a comprehensive online preparation batch for CUET UG 2027 (Science Domain), designed for students aspiring to pursue B.Sc., B.Tech. and other science-related undergraduate programs.\n\nStarting 10th October 2026, the batch continues until one week before CUET UG 2027, covering the complete Science Domain syllabus with concept-based classes, regular practice, mock tests, performance analysis and multiple revisions. Build concepts. Practice consistently. Revise thoroughly. Get ready for admission.`,
                    examCategory: 'CUET UG',
                    level: 'All Levels',
                    language: 'Hinglish',
                    status: 'published',
                    accessType: 'paid',
                    pricing: {
                        amount: 2499,
                        originalPrice: 6249,
                        currency: 'INR'
                    },
                    thumbnailUrl: '/live_teacher_raj.jpg',
                    totalLessons: 15,
                    totalModules: 3,
                    durationMinutes: 7200,
                    instructor: {
                        name: 'Examinant Top Faculties',
                        title: 'Senior Educators'
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }

            setCourse(c);

            if (c) {
                // Fetch modules & lessons
                const curr = await curriculumService.getAllCourseLessons(c.id);
                setCurriculum(curr);
                if (curr.length > 0) setExpandedModuleId(curr[0].module.id);

                // Check student entitlement
                if (currentUser) {
                    const accessResult = await entitlementService.hasCourseAccess(currentUser.uid, c, profileData);
                    setHasAccess(accessResult.hasAccess);
                }
            }
        } catch (error) {
            console.error("Error loading course details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (!course) return;

        if (hasAccess) {
            navigate(`/dashboard/courses/${course.id}/learn`);
            return;
        }

        setIsEnrolling(true);
        try {
            if (course.accessType === 'paid' && (course.pricing?.amount || 0) > 0) {
                const res = await loadRazorpay();
                if (!res) {
                    alert("Razorpay SDK failed to load.");
                    setIsEnrolling(false);
                    return;
                }

                const options = {
                    key: 'rzp_live_TAGGnZwDvZubIP',
                    amount: (course.pricing?.amount || 0) * 100,
                    currency: 'INR',
                    name: 'Examinant',
                    description: `Course: ${course.title}`,
                    image: 'https://examinantt.web.app/logo192.png',
                    handler: async function (response: any) {
                        try {
                            await entitlementService.createEnrollment(currentUser.uid, course, 'purchase', {
                                paymentId: response.razorpay_payment_id,
                                amountPaid: course.pricing?.amount || 0
                            });
                            alert('Success! You are now enrolled.');
                            navigate(`/dashboard/courses/${course.id}/learn`);
                        } catch (err) {
                            console.error("Enrollment error:", err);
                        }
                    },
                    prefill: {
                        name: profileData?.fullName || currentUser.displayName || 'Student',
                        email: profileData?.email || currentUser.email || 'student@example.com'
                    },
                    theme: { color: '#2563eb' }
                };

                const paymentObject = new (window as any).Razorpay(options);
                paymentObject.open();
                setIsEnrolling(false);
            } else {
                // Free course or subscription unlocked
                await entitlementService.createEnrollment(currentUser.uid, course, 'free', {
                    paymentId: 'free',
                    amountPaid: 0
                });
                setIsEnrolling(false);
                navigate(`/dashboard/courses/${course.id}/learn`);
            }
        } catch (error) {
            console.error("Enrollment failed:", error);
            setIsEnrolling(false);
        }
    };

    if (isLoading) {
        return (
            <PageLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
            </PageLayout>
        );
    }

    if (!course) {
        return (
            <PageLayout>
                <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">
                    Batch not found.
                </div>
            </PageLayout>
        );
    }

    const effectiveTotalLessons = curriculum.reduce((acc, curr) => acc + (curr.lessons.length > 0 ? curr.lessons.length : 5), 0) || (course?.totalLessons || 15);

    return (
        <PageLayout>
            {/* Hero Section */}
            <div className="bg-[#070D1E] text-white py-12 lg:py-16 relative overflow-hidden border-b border-[#17254E]/60">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-indigo-950/30 pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                    {course.examCategory}
                                </span>
                                <span className="bg-[#0E1B38] text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-[#1E3360]">
                                    {course.level}
                                </span>
                                <span className="bg-[#0E1B38] text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-[#1E3360]">
                                    {course.language}
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                                {course.title}
                            </h1>

                            <p className="text-slate-300 text-base sm:text-lg font-medium leading-relaxed max-w-2xl">
                                {course.shortDescription}
                            </p>

                            <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-300 pt-2">
                                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                                    <Star size={16} className="fill-amber-400" />
                                    <span>{course.rating || 4.8}</span>
                                    <span className="text-slate-400">({course.ratingCount || 120} ratings)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Layers size={16} className="text-blue-400" />
                                    <span>{course.totalModules || 0} Modules</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Play size={16} className="text-blue-400" />
                                    <span>{effectiveTotalLessons} Lessons</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock size={16} className="text-blue-400" />
                                    <span>{Math.round((course.durationMinutes || 0) / 60)} Hours</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-sm">
                                    {course.instructor?.name?.charAt(0) || 'E'}
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">Educator & Faculty</p>
                                    <p className="text-sm font-extrabold text-white">{course.instructor?.name || 'Examinant Faculty'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Enrollment Card */}
                        <div className="bg-[#0B152B] text-white rounded-3xl p-8 shadow-2xl border border-[#17254E] space-y-6">
                            {course.thumbnailUrl && (
                                <div className="w-full h-48 rounded-2xl overflow-hidden relative group border border-[#17254E]/60">
                                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                    {course.accessType === 'free' ? (
                                        <span className="text-3xl font-black text-emerald-400">FREE</span>
                                    ) : (
                                        <>
                                            <span className="text-4xl font-black text-white">₹{course.pricing?.amount || 0}</span>
                                            {course.pricing?.originalPrice && (
                                                <span className="text-sm text-slate-400 line-through font-bold">₹{course.pricing.originalPrice}</span>
                                            )}
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 font-bold">Full Lifetime Access & Certificate Included</p>
                            </div>

                            <button
                                onClick={handleEnroll}
                                disabled={isEnrolling}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all cursor-pointer"
                            >
                                {isEnrolling ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : hasAccess ? (
                                    <>
                                        <span>Start / Continue Learning</span>
                                        <ArrowRight size={18} />
                                    </>
                                ) : (
                                    <>
                                        <span>{course.accessType === 'free' ? 'Enroll Now (Free)' : 'Buy Batch Now'}</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>

                            <div className="space-y-3 pt-4 border-t border-[#17254E] text-xs font-semibold text-slate-300">
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                    <span>{effectiveTotalLessons}+ HD Video Lectures</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                    <span>Downloadable PDF Revision Notes</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                    <span>Integrated Tests & Practice Quizzes</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                    <span>Official Batch Completion Certificate</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-[#0B152B] border-b border-[#17254E] sticky top-0 z-30 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex overflow-x-auto scrollbar-hide space-x-2 sm:space-x-8 py-3">
                        {[
                            { id: 'overview', label: 'Batch Features & Overview', icon: <Sparkles size={16} /> },
                            { id: 'curriculum', label: `Syllabus & Lectures (${effectiveTotalLessons})`, icon: <BookOpen size={16} /> },
                            { id: 'tests', label: 'Included Tests & Mocks', icon: <Target size={16} /> },
                            { id: 'resources', label: 'Notes & Study Resources', icon: <FileText size={16} /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-sm whitespace-nowrap transition-all cursor-pointer ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                        : 'text-slate-400 hover:text-white hover:bg-[#13244a]'
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Details Section */}
            <div className="bg-[#070D1E] py-12 lg:py-16 text-slate-200 min-h-[500px]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

                    {/* TAB 1: OVERVIEW & BATCH FEATURES */}
                    {activeTab === 'overview' && (
                        <div className="space-y-12 max-w-5xl">
                            {/* What You Get in This Batch */}
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                                        <Sparkles className="text-amber-400" />
                                        What You Will Get in This Batch
                                    </h2>
                                    <p className="text-slate-400 text-sm font-medium mt-1">
                                        Complete end-to-end preparation package for {course.examCategory} exam aspirants.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        {
                                            icon: <Play className="text-blue-400" size={24} />,
                                            title: "HD Video Lectures",
                                            desc: `${course.totalLessons || 'Concept'} structured HD video classes covering the complete syllabus from basics to advanced.`
                                        },
                                        {
                                            icon: <Target className="text-emerald-400" size={24} />,
                                            title: "Integrated Test Series",
                                            desc: "Chapter-wise mock tests, sectional practice tests & full-length exam pattern mock test series."
                                        },
                                        {
                                            icon: <FileText className="text-purple-400" size={24} />,
                                            title: "Downloadable PDF Notes",
                                            desc: "High quality revision notes, formula cheat-sheets, DPPs, and mind maps for offline studying."
                                        },
                                        {
                                            icon: <Award className="text-amber-400" size={24} />,
                                            title: "AI Performance Analytics",
                                            desc: "Detailed score breakdown, speed analysis, accuracy insights & All India Rank prediction."
                                        },
                                        {
                                            icon: <ShieldCheck className="text-cyan-400" size={24} />,
                                            title: "Expert Doubt Support",
                                            desc: "Get your subject doubts resolved quickly by experienced faculties and educators."
                                        },
                                        {
                                            icon: <CheckCircle2 className="text-green-400" size={24} />,
                                            title: "Official Batch Certificate",
                                            desc: "Earn a verifiable completion certificate upon successfully finishing the course & tests."
                                        }
                                    ].map((feature, i) => (
                                        <div key={i} className="bg-[#0B152B] border border-[#17254E] p-6 rounded-2xl hover:border-blue-500/40 transition-all space-y-3 shadow-lg">
                                            <div className="p-3 bg-[#0E1B38] border border-[#1E3360] rounded-xl w-fit">
                                                {feature.icon}
                                            </div>
                                            <h3 className="text-lg font-extrabold text-white">{feature.title}</h3>
                                            <p className="text-xs text-slate-400 font-medium leading-relaxed">{feature.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Batch Description */}
                            <div className="bg-[#0B152B] border border-[#17254E] p-8 rounded-3xl space-y-4">
                                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                                    <BookOpen className="text-blue-400" size={20} />
                                    About This Batch
                                </h3>
                                <p className="text-slate-300 text-sm font-medium leading-relaxed whitespace-pre-line">
                                    {course.description || course.shortDescription}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: CURRICULUM & LECTURES */}
                    {activeTab === 'curriculum' && (
                        <div className="space-y-6 max-w-4xl">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black text-white">Batch Syllabus & Lectures</h2>
                                <p className="text-slate-400 text-sm font-medium mt-1">Explore all modules, lectures, and video lessons included in this batch.</p>
                            </div>

                            <div className="space-y-4">
                                {(() => {
                                    const defaultCurriculum = curriculum.length > 0 ? curriculum : [
                                        { module: { id: 'mod-1', courseId: course?.id || '', title: 'Physics', description: 'Physics Domain Syllabus', order: 1, isPublished: true, totalLessons: 5, createdAt: new Date() }, lessons: [] },
                                        { module: { id: 'mod-2', courseId: course?.id || '', title: 'Chemistry', description: 'Chemistry Domain Syllabus', order: 2, isPublished: true, totalLessons: 5, createdAt: new Date() }, lessons: [] },
                                        { module: { id: 'mod-3', courseId: course?.id || '', title: 'Biology / Science Domain', description: 'Biology & Science Domain Syllabus', order: 3, isPublished: true, totalLessons: 5, createdAt: new Date() } }
                                    ];

                                    const getEffectiveLessons = (moduleTitle: string, existingLessons: Lesson[]): Lesson[] => {
                                        if (existingLessons && existingLessons.length > 0) return existingLessons;
                                        const lower = moduleTitle.toLowerCase();
                                        if (lower.includes('physic')) {
                                            return [
                                                { id: 'p1', courseId: course?.id || '', moduleId: 'mod-1', title: '01. Electric Charges & Fields - Chapter 1', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', durationMinutes: 45, isFreePreview: true, isMandatory: false, status: 'published', order: 1, createdAt: new Date() },
                                                { id: 'p2', courseId: course?.id || '', moduleId: 'mod-1', title: '02. Electrostatic Potential & Capacitance', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', durationMinutes: 50, isFreePreview: true, isMandatory: false, status: 'published', order: 2, createdAt: new Date() },
                                                { id: 'p3', courseId: course?.id || '', moduleId: 'mod-1', title: '03. Current Electricity & Kirchhoff Laws', type: 'video', durationMinutes: 60, isFreePreview: false, isMandatory: false, status: 'published', order: 3, createdAt: new Date() },
                                                { id: 'p4', courseId: course?.id || '', moduleId: 'mod-1', title: '04. Moving Charges & Magnetism', type: 'video', durationMinutes: 55, isFreePreview: false, isMandatory: false, status: 'published', order: 4, createdAt: new Date() },
                                                { id: 'p5', courseId: course?.id || '', moduleId: 'mod-1', title: '05. Physics Formula & Revision Notes PDF', type: 'pdf', durationMinutes: 10, isFreePreview: true, isMandatory: false, status: 'published', order: 5, createdAt: new Date() }
                                            ];
                                        } else if (lower.includes('chemist')) {
                                            return [
                                                { id: 'c1', courseId: course?.id || '', moduleId: 'mod-2', title: '01. Solutions & Concentration Terms', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', durationMinutes: 40, isFreePreview: true, isMandatory: false, status: 'published', order: 1, createdAt: new Date() },
                                                { id: 'c2', courseId: course?.id || '', moduleId: 'mod-2', title: '02. Electrochemistry & Galvanic Cells', type: 'video', durationMinutes: 48, isFreePreview: false, isMandatory: false, status: 'published', order: 2, createdAt: new Date() },
                                                { id: 'c3', courseId: course?.id || '', moduleId: 'mod-2', title: '03. Chemical Kinetics & Rate Laws', type: 'video', durationMinutes: 52, isFreePreview: false, isMandatory: false, status: 'published', order: 3, createdAt: new Date() },
                                                { id: 'c4', courseId: course?.id || '', moduleId: 'mod-2', title: '04. Haloalkanes & Organic Mechanisms', type: 'video', durationMinutes: 65, isFreePreview: false, isMandatory: false, status: 'published', order: 4, createdAt: new Date() },
                                                { id: 'c5', courseId: course?.id || '', moduleId: 'mod-2', title: '05. Chemistry Reaction Notes PDF', type: 'pdf', durationMinutes: 15, isFreePreview: true, isMandatory: false, status: 'published', order: 5, createdAt: new Date() }
                                            ];
                                        } else if (lower.includes('biolog')) {
                                            return [
                                                { id: 'b1', courseId: course?.id || '', moduleId: 'mod-3', title: '01. Sexual Reproduction in Flowering Plants', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', durationMinutes: 42, isFreePreview: true, isMandatory: false, status: 'published', order: 1, createdAt: new Date() },
                                                { id: 'b2', courseId: course?.id || '', moduleId: 'mod-3', title: '02. Human Reproduction & Physiology', type: 'video', durationMinutes: 55, isFreePreview: false, isMandatory: false, status: 'published', order: 2, createdAt: new Date() },
                                                { id: 'b3', courseId: course?.id || '', moduleId: 'mod-3', title: '03. Principles of Inheritance & Variation (Genetics)', type: 'video', durationMinutes: 58, isFreePreview: false, isMandatory: false, status: 'published', order: 3, createdAt: new Date() },
                                                { id: 'b4', courseId: course?.id || '', moduleId: 'mod-3', title: '04. Molecular Basis of DNA Replication', type: 'video', durationMinutes: 60, isFreePreview: false, isMandatory: false, status: 'published', order: 4, createdAt: new Date() },
                                                { id: 'b5', courseId: course?.id || '', moduleId: 'mod-3', title: '05. Biology Diagram & Mind Map Notes PDF', type: 'pdf', durationMinutes: 12, isFreePreview: true, isMandatory: false, status: 'published', order: 5, createdAt: new Date() }
                                            ];
                                        } else {
                                            return [
                                                { id: 'g1', courseId: course?.id || '', moduleId: moduleTitle, title: `01. Introduction to ${moduleTitle}`, type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', durationMinutes: 45, isFreePreview: true, isMandatory: false, status: 'published', order: 1, createdAt: new Date() },
                                                { id: 'g2', courseId: course?.id || '', moduleId: moduleTitle, title: `02. Core Concepts & Problem Solving`, type: 'video', durationMinutes: 50, isFreePreview: false, isMandatory: false, status: 'published', order: 2, createdAt: new Date() },
                                                { id: 'g3', courseId: course?.id || '', moduleId: moduleTitle, title: `03. Important Exam Questions & PYQs`, type: 'video', durationMinutes: 55, isFreePreview: false, isMandatory: false, status: 'published', order: 3, createdAt: new Date() },
                                                { id: 'g4', courseId: course?.id || '', moduleId: moduleTitle, title: `04. ${moduleTitle} Class Notes & Practice Set PDF`, type: 'pdf', durationMinutes: 15, isFreePreview: true, isMandatory: false, status: 'published', order: 4, createdAt: new Date() }
                                            ];
                                        }
                                    };

                                    return defaultCurriculum.map(({ module, lessons }, idx) => {
                                        const effectiveLessons = getEffectiveLessons(module.title, lessons || []);
                                        const isExpanded = expandedModuleId === module.id || (expandedModuleId === null && idx === 0);
                                        return (
                                            <div key={module.id} className="bg-[#0B152B] rounded-2xl border border-[#17254E] overflow-hidden shadow-sm">
                                                <button
                                                    onClick={() => setExpandedModuleId(isExpanded ? 'none' : module.id)}
                                                    className="w-full flex justify-between items-center p-5 bg-[#0E1B38] hover:bg-[#13244a] transition-colors text-left cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">{idx + 1}</span>
                                                        <div>
                                                            <h3 className="font-extrabold text-white text-base">{module.title}</h3>
                                                            <p className="text-xs text-slate-400 font-medium">{effectiveLessons.length} Lessons</p>
                                                        </div>
                                                    </div>
                                                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                                </button>

                                                {isExpanded && (
                                                    <div className="p-4 divide-y divide-[#17254E]/60 bg-[#0B152B]">
                                                        {effectiveLessons.map(lesson => (
                                                            <div key={lesson.id} className="py-3 px-2 flex justify-between items-center">
                                                                <div className="flex items-center gap-3">
                                                                    {lesson.type === 'video' ? <Play size={16} className="text-blue-400" /> : <FileText size={16} className="text-purple-400" />}
                                                                    <span className="font-bold text-slate-200 text-sm">{lesson.title}</span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-xs text-slate-400 font-medium">{lesson.durationMinutes} Mins</span>
                                                                    {lesson.isFreePreview ? (
                                                                        <button
                                                                            onClick={() => lesson.videoUrl && setPreviewLesson(lesson)}
                                                                            className="text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full hover:bg-emerald-500/20 transition-colors cursor-pointer"
                                                                        >
                                                                            Watch Preview
                                                                        </button>
                                                                    ) : (
                                                                        <Lock size={14} className="text-slate-500" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: INCLUDED TESTS & MOCKS */}
                    {activeTab === 'tests' && (
                        <div className="space-y-6 max-w-4xl">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                                    <Target className="text-blue-400" />
                                    Included Tests & Practice Series
                                </h2>
                                <p className="text-slate-400 text-sm font-medium mt-1">
                                    Mock tests and practice series included in your batch enrollment.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    {
                                        title: `${course.examCategory} Full Length Mock Test Series (10 Mocks)`,
                                        tag: "Full Length",
                                        questions: "100 Questions / Test",
                                        time: "180 Mins",
                                        marks: "400 Marks",
                                        desc: "Complete exam-pattern simulation with negative marking, detailed solutions & All India Rank analysis."
                                    },
                                    {
                                        title: "Physics & Science Domain Chapter-Wise Practice Tests",
                                        tag: "Chapter-Wise",
                                        questions: "25 Questions / Chapter",
                                        time: "45 Mins",
                                        marks: "100 Marks",
                                        desc: "Topic by topic practice questions covering Mechanics, Electromagnetism, Optics & Modern Physics."
                                    },
                                    {
                                        title: "Chemistry & Biology Speed Tests (20+ Practice Tests)",
                                        tag: "Speed Test",
                                        questions: "30 Questions / Test",
                                        time: "30 Mins",
                                        marks: "120 Marks",
                                        desc: "Rapid speed tests designed to improve calculation speed and conceptual recall under tight timer."
                                    },
                                    {
                                        title: "Previous Years Solved Question Papers (PYQs 2021 - 2026)",
                                        tag: "PYQs Series",
                                        questions: "Original Exam Papers",
                                        time: "Timed Mode",
                                        marks: "Official Scoring",
                                        desc: "Real exam papers from previous years with step-by-step video & text solutions."
                                    }
                                ].map((test, idx) => (
                                    <div key={idx} className="bg-[#0B152B] border border-[#17254E] p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-500/40 transition-all shadow-md">
                                        <div className="space-y-2 max-w-2xl">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-[#0E1B38] text-white border border-[#1E3360] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-inner">
                                                    {test.tag}
                                                </span>
                                                <h3 className="font-extrabold text-white text-base">{test.title}</h3>
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium">{test.desc}</p>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-semibold pt-1">
                                                <span className="flex items-center gap-1.5"><Clock size={14} className="text-amber-400" /> {test.time}</span>
                                                <span className="flex items-center gap-1.5"><HelpCircle size={14} className="text-blue-400" /> {test.questions}</span>
                                                <span className="flex items-center gap-1.5"><Trophy size={14} className="text-emerald-400" /> {test.marks}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleEnroll}
                                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap cursor-pointer"
                                        >
                                            {hasAccess ? 'Start Test' : 'Unlock with Batch'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: STUDY MATERIALS & NOTES */}
                    {activeTab === 'resources' && (
                        <div className="space-y-6 max-w-4xl">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                                    <FileText className="text-purple-400" />
                                    Study Material, Notes & PDFs
                                </h2>
                                <p className="text-slate-400 text-sm font-medium mt-1">
                                    Downloadable PDF revision notes, formula cheat sheets, and DPPs included in this batch.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    {
                                        title: "Complete Physics Formula & Shortcut Revision PDF",
                                        type: "PDF Document",
                                        size: "4.8 MB",
                                        pages: "42 Pages",
                                        desc: "All important formulas, derivations, shortcuts, and key points in printable PDF format."
                                    },
                                    {
                                        title: "Chemistry Reaction Mechanisms & Formula Sheet",
                                        type: "Handwritten PDF",
                                        size: "6.2 MB",
                                        pages: "58 Pages",
                                        desc: "Handwritten revision notes by top educators covering Organic, Inorganic & Physical Chemistry."
                                    },
                                    {
                                        title: "Mathematics Quick Revision Mind Maps",
                                        type: "Mind Maps",
                                        size: "3.5 MB",
                                        pages: "30 Pages",
                                        desc: "Visual mind maps for quick revision before exam day covering Algebra, Calculus & Vectors."
                                    },
                                    {
                                        title: "Daily Practice Problems (DPP) Question Bank",
                                        type: "DPP Series",
                                        size: "12 MB",
                                        pages: "120+ Sets",
                                        desc: "Chapter-wise daily practice problem sheets with step-by-step answer key."
                                    }
                                ].map((res, idx) => (
                                    <div key={idx} className="bg-[#0B152B] border border-[#17254E] p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-500/40 transition-all shadow-md">
                                        <div className="space-y-2 max-w-2xl">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-[#0E1B38] text-white border border-[#1E3360] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-inner">
                                                    {res.type}
                                                </span>
                                                <h3 className="font-extrabold text-white text-base">{res.title}</h3>
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium">{res.desc}</p>
                                            <div className="flex items-center gap-4 text-xs text-slate-300 font-semibold pt-1">
                                                <span className="flex items-center gap-1.5"><HardDrive size={14} className="text-blue-400" /> {res.size}</span>
                                                <span className="flex items-center gap-1.5"><FileText size={14} className="text-blue-400" /> {res.pages}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleEnroll}
                                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                                        >
                                            <Download size={14} />
                                            <span>{hasAccess ? 'Download PDF' : 'Unlock Notes'}</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Video Preview Modal */}
            {previewLesson && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-black rounded-3xl overflow-hidden max-w-3xl w-full relative aspect-video shadow-2xl">
                        <button
                            onClick={() => setPreviewLesson(null)}
                            className="absolute top-4 right-4 text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1 rounded-full text-xs font-bold z-20"
                        >
                            ✕ Close
                        </button>
                        <VideoPlayer
                            videoUrl={previewLesson.videoUrl || ''}
                            thumbnailUrl={previewLesson.thumbnailUrl || course?.thumbnailUrl}
                            title={previewLesson.title}
                            durationMinutes={previewLesson.durationMinutes}
                        />
                    </div>
                </div>
            )}
        </PageLayout>
    );
};

export default CourseDetailsPage;
