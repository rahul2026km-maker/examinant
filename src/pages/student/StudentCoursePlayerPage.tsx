import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Play, FileText, CheckCircle2, Lock, Award, 
    Download, ChevronRight, Menu, X, Loader2, Sparkles, BookOpen, Layers 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { courseService } from '../../services/courseService';
import { curriculumService } from '../../services/curriculumService';
import { entitlementService } from '../../services/entitlementService';
import { progressService } from '../../services/progressService';
import { certificateService } from '../../services/certificateService';
import type { Course, CourseModule, Lesson, LessonProgress } from '../../types/course.types';
import VideoPlayer from '../../components/common/VideoPlayer';

const StudentCoursePlayerPage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const profileData = authContext?.profileData;

    const [course, setCourse] = useState<Course | null>(null);
    const [curriculum, setCurriculum] = useState<{ module: CourseModule; lessons: Lesson[] }[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>({});
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isUpdatingProgress, setIsUpdatingProgress] = useState<boolean>(false);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
    const [certificateId, setCertificateId] = useState<string | null>(null);

    useEffect(() => {
        if (courseId && currentUser) loadLMSWorkspace();
    }, [courseId, currentUser]);

    const loadLMSWorkspace = async () => {
        setIsLoading(true);
        try {
            if (!courseId || !currentUser) return;

            // Fetch course details
            const c = await courseService.getCourseById(courseId);
            if (!c) {
                alert("Course not found.");
                navigate('/dashboard/courses');
                return;
            }
            setCourse(c);

            // Check entitlement
            const access = await entitlementService.hasCourseAccess(currentUser.uid, c, profileData);
            if (!access.hasAccess) {
                alert("You do not have active access to this course.");
                navigate(`/courses/${c.slug || c.id}`);
                return;
            }

            // Fetch curriculum
            const curr = await curriculumService.getAllCourseLessons(courseId);
            setCurriculum(curr);

            // Fetch progress map
            const pMap = await progressService.getCourseProgressMap(currentUser.uid, courseId);
            setProgressMap(pMap);

            // Find first uncompleted lesson or first available lesson
            let targetLesson: Lesson | null = null;
            for (const item of curr) {
                for (const l of item.lessons) {
                    if (!targetLesson) targetLesson = l;
                    if (!pMap[l.id]?.completed) {
                        targetLesson = l;
                        break;
                    }
                }
                if (targetLesson && !pMap[targetLesson.id]?.completed) break;
            }
            setCurrentLesson(targetLesson);

            // Calculate current overall percent
            let total = 0;
            let done = 0;
            curr.forEach(item => {
                item.lessons.forEach(l => {
                    total++;
                    if (pMap[l.id]?.completed) done++;
                });
            });
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            setProgressPercent(pct);

            // Check if certificate exists
            const userCerts = await certificateService.getUserCertificates(currentUser.uid);
            const foundCert = userCerts.find(cert => cert.courseId === courseId);
            if (foundCert) setCertificateId(foundCert.id);

        } catch (error) {
            console.error("Error loading LMS workspace:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkCompleteAndNext = async () => {
        if (!currentUser || !courseId || !currentLesson) return;
        setIsUpdatingProgress(true);
        try {
            const userName = profileData?.fullName || currentUser.displayName || 'Student';
            const courseTitle = course?.title || 'Course';

            const newPct = await progressService.markLessonProgress(
                currentUser.uid,
                courseId,
                currentLesson.id,
                true,
                0,
                userName,
                courseTitle
            );

            setProgressPercent(newPct);
            setProgressMap(prev => ({
                ...prev,
                [currentLesson.id]: {
                    ...(prev[currentLesson.id] || {}),
                    userId: currentUser.uid,
                    courseId,
                    lessonId: currentLesson.id,
                    completed: true
                }
            }));

            // Check if certificate issued
            if (newPct >= 100) {
                const cert = await certificateService.issueCertificate(currentUser.uid, userName, courseId, courseTitle);
                setCertificateId(cert.id);
            }

            // Find next lesson
            let foundCurrent = false;
            let nextLesson: Lesson | null = null;
            for (const item of curriculum) {
                for (const l of item.lessons) {
                    if (foundCurrent) {
                        nextLesson = l;
                        break;
                    }
                    if (l.id === currentLesson.id) {
                        foundCurrent = true;
                    }
                }
                if (nextLesson) break;
            }

            if (nextLesson) {
                setCurrentLesson(nextLesson);
            }
        } catch (error) {
            alert("Failed to save progress.");
        } finally {
            setIsUpdatingProgress(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={44} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
            {/* Top Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard/courses')}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-sm font-extrabold text-white line-clamp-1">{course?.title}</h1>
                        <p className="text-[11px] text-slate-400 font-medium line-clamp-1">Lesson: {currentLesson?.title || 'Select Lesson'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Progress Indicator */}
                    <div className="hidden sm:flex items-center gap-3">
                        <div className="w-36 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <span className="text-xs font-black text-blue-400">{progressPercent}%</span>
                    </div>

                    {certificateId && (
                        <button
                            onClick={() => navigate(`/verify/${certificateId}`)}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition-colors shadow-md"
                        >
                            <Award size={16} />
                            <span>View Certificate</span>
                        </button>
                    )}

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 text-slate-400 hover:text-white lg:hidden"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Main Learning Workspace */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar Curriculum */}
                <div className={`w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 absolute lg:relative inset-y-0 left-0 z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Course Syllabus</span>
                        <span className="text-xs text-blue-400 font-bold">{progressPercent}% Complete</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {curriculum.map(({ module, lessons }, mIdx) => (
                            <div key={module.id} className="space-y-2">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Module {mIdx + 1}: {module.title}
                                </h3>
                                <div className="space-y-1">
                                    {lessons.map(l => {
                                        const isCurrent = currentLesson?.id === l.id;
                                        const isCompleted = Boolean(progressMap[l.id]?.completed);
                                        return (
                                            <button
                                                key={l.id}
                                                onClick={() => {
                                                    setCurrentLesson(l);
                                                    if (window.innerWidth < 1024) setSidebarOpen(false);
                                                }}
                                                className={`w-full text-left p-3 rounded-xl flex items-center justify-between text-xs font-bold transition-all ${
                                                    isCurrent
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : isCompleted
                                                        ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                                                        : 'text-slate-400 hover:bg-slate-800/40'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 truncate">
                                                    {isCompleted ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : l.type === 'video' ? <Play size={14} className="shrink-0" /> : <FileText size={14} className="shrink-0" />}
                                                    <span className="truncate">{l.title}</span>
                                                </div>
                                                <span className="text-[10px] opacity-75 shrink-0 ml-1">{l.durationMinutes}m</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col justify-between overflow-y-auto bg-slate-950 p-4 sm:p-8 space-y-6">
                    {currentLesson ? (
                        <div className="space-y-6 max-w-5xl mx-auto w-full">
                            {/* Video / PDF Stage */}
                            <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative flex items-center justify-center">
                                {currentLesson.type === 'video' && currentLesson.videoUrl ? (
                                    <VideoPlayer
                                        key={currentLesson.id}
                                        videoUrl={currentLesson.videoUrl}
                                        thumbnailUrl={currentLesson.thumbnailUrl}
                                        title={currentLesson.title}
                                        durationMinutes={currentLesson.durationMinutes}
                                    />
                                ) : currentLesson.type === 'pdf' && currentLesson.pdfUrl ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                                        <FileText size={48} className="text-purple-400" />
                                        <h3 className="text-xl font-bold">{currentLesson.title} — Study Notes</h3>
                                        <a
                                            href={currentLesson.pdfUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg"
                                        >
                                            <Download size={16} />
                                            <span>Open & Download Study PDF</span>
                                        </a>
                                    </div>
                                ) : currentLesson.type === 'test' && currentLesson.attachedTestId ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                                        <BookOpen size={48} className="text-blue-400" />
                                        <h3 className="text-xl font-bold">{currentLesson.title} — Practice Quiz</h3>
                                        <button
                                            onClick={() => navigate(`/student/test/${currentLesson.attachedTestId}/mode`)}
                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg"
                                        >
                                            <Play size={16} />
                                            <span>Start Attached Quiz / Test</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-slate-500 font-bold text-sm">Select a lesson from syllabus sidebar.</div>
                                )}
                            </div>

                            {/* Lesson Info Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
                                <div>
                                    <h2 className="text-xl font-black text-white">{currentLesson.title}</h2>
                                    <p className="text-xs text-slate-400 font-medium mt-1">{currentLesson.description || 'Watch carefully and complete the lesson.'}</p>
                                </div>

                                <button
                                    onClick={handleMarkCompleteAndNext}
                                    disabled={isUpdatingProgress}
                                    className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
                                >
                                    {isUpdatingProgress ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    <span>Mark Complete & Next Lesson</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500 font-bold">Select a lesson to begin.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentCoursePlayerPage;
