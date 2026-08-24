import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Star, ShieldCheck, Play, Lock, CheckCircle2, Clock, Layers, 
    BookOpen, Award, ArrowRight, Loader2, FileText, ChevronDown, ChevronUp, Sparkles 
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
                setIsLoading(false);
                return;
            }

            setCourse(c);

            // Fetch modules & lessons
            const curr = await curriculumService.getAllCourseLessons(c.id);
            setCurriculum(curr);
            if (curr.length > 0) setExpandedModuleId(curr[0].module.id);

            // Check student entitlement
            if (currentUser) {
                const accessResult = await entitlementService.hasCourseAccess(currentUser.uid, c, profileData);
                setHasAccess(accessResult.hasAccess);
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
                    Course not found.
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            {/* Hero Section */}
            <div className="bg-[#0f172a] text-white py-12 lg:py-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-purple-900/30 pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                    {course.examCategory}
                                </span>
                                <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">
                                    {course.level}
                                </span>
                                <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">
                                    {course.language}
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
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
                                    <span>{course.totalLessons || 0} Lessons</span>
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
                        <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-100 space-y-6">
                            {course.thumbnailUrl && (
                                <div className="w-full h-48 rounded-2xl overflow-hidden relative group">
                                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                    {course.accessType === 'free' ? (
                                        <span className="text-3xl font-black text-emerald-600">FREE</span>
                                    ) : (
                                        <>
                                            <span className="text-4xl font-black text-slate-900">₹{course.pricing?.amount || 0}</span>
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
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all"
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
                                        <span>{course.accessType === 'free' ? 'Enroll Now (Free)' : 'Buy Course Now'}</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>

                            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-600">
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    <span>{course.totalLessons || 0} HD Video Lectures</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    <span>Downloadable PDF Revision Notes</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    <span>Integrated Tests & Practice Quizzes</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    <span>Official Course Completion Certificate</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Curriculum Accordion */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-slate-900">Course Syllabus & Curriculum</h2>
                    <p className="text-slate-600 font-medium">Explore the step-by-step module breakdown below.</p>
                </div>

                <div className="space-y-4 max-w-4xl">
                    {curriculum.length === 0 ? (
                        <p className="text-slate-400 font-medium">Curriculum coming soon.</p>
                    ) : (
                        curriculum.map(({ module, lessons }, idx) => {
                            const isExpanded = expandedModuleId === module.id;
                            return (
                                <div key={module.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                                        className="w-full flex justify-between items-center p-5 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">{idx + 1}</span>
                                            <div>
                                                <h3 className="font-extrabold text-slate-900 text-base">{module.title}</h3>
                                                <p className="text-xs text-slate-400 font-medium">{lessons.length} Lessons</p>
                                            </div>
                                        </div>
                                        {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                    </button>

                                    {isExpanded && (
                                        <div className="p-4 divide-y divide-slate-100">
                                            {lessons.map(lesson => (
                                                <div key={lesson.id} className="py-3 px-2 flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        {lesson.type === 'video' ? <Play size={16} className="text-blue-600" /> : <FileText size={16} className="text-purple-600" />}
                                                        <span className="font-bold text-slate-800 text-sm">{lesson.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs text-slate-400 font-medium">{lesson.durationMinutes} Mins</span>
                                                        {lesson.isFreePreview ? (
                                                            <button
                                                                onClick={() => lesson.videoUrl && setPreviewLesson(lesson)}
                                                                className="text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full hover:bg-emerald-100"
                                                            >
                                                                Watch Preview
                                                            </button>
                                                        ) : (
                                                            <Lock size={14} className="text-slate-300" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
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
