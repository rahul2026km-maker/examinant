import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PlayCircle,
    GraduationCap,
    CheckCircle2,
    Clock,
    ArrowRight,
    BookOpen,
    Layers,
    Sparkles,
    ChevronRight,
    Award,
    Zap,
    ClipboardList
} from 'lucide-react';
import type { Course, CourseEnrollment } from '../../types/course.types';
import type { ActiveTest } from '../../services/studentDashboardService';

interface ContinueLearningSectionProps {
    enrolledBatches: CourseEnrollment[];
    featuredBatches: Course[];
    activeTests: ActiveTest[];
    isLoadingBatches: boolean;
    targetExam: string;
}

export const ContinueLearningSection: React.FC<ContinueLearningSectionProps> = ({
    enrolledBatches = [],
    featuredBatches = [],
    activeTests = [],
    isLoadingBatches = false,
    targetExam = 'SSC'
}) => {
    const navigate = useNavigate();
    const [learningTab, setLearningTab] = useState<'batches' | 'tests'>('batches');

    // Calculate aggregated stats
    const totalEnrolled = enrolledBatches.length;
    const completedCount = enrolledBatches.filter(b => (b.progressPercent || 0) >= 100 || b.status === 'completed').length;
    const averageProgress = totalEnrolled > 0
        ? Math.round(enrolledBatches.reduce((sum, b) => sum + (b.progressPercent || 0), 0) / totalEnrolled)
        : 0;

    return (
        <div className="bg-[#0B152B] p-5 sm:p-7 border border-[#17274B] rounded-3xl shadow-xl space-y-6">
            {/* Header with Title & Mode Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                        <PlayCircle size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-black text-white tracking-tight">
                                Continue Learning
                            </h2>
                            {totalEnrolled > 0 ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-[#38BDF8] border border-blue-500/30">
                                    {totalEnrolled} Active {totalEnrolled === 1 ? 'Batch' : 'Batches'}
                                </span>
                            ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-[#FF7A00] border border-orange-500/30">
                                    Target: {targetExam}
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                            Pick up right where you left off — video curriculum and mock practice
                        </p>
                    </div>
                </div>

                {/* Switcher: Video Batches vs Practice Tests */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="bg-[#070D1E] p-1 rounded-2xl border border-[#17274B] flex items-center gap-1">
                        <button
                            onClick={() => setLearningTab('batches')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                learningTab === 'batches'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <GraduationCap size={14} />
                            <span>Video Batches</span>
                            {totalEnrolled > 0 && (
                                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                                    {totalEnrolled}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setLearningTab('tests')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                learningTab === 'tests'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <ClipboardList size={14} />
                            <span>Mock Tests</span>
                            {activeTests.length > 0 && (
                                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                                    {activeTests.length}
                                </span>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={() => navigate(learningTab === 'batches' ? '/dashboard/batches' : '/dashboard/market')}
                        className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-[#070D1E] hover:bg-[#10224A] text-[#38BDF8] hover:text-white border border-[#17274B] hover:border-blue-500/40 rounded-xl font-bold text-xs transition-all cursor-pointer"
                    >
                        <span>{learningTab === 'batches' ? 'View All Batches' : 'Browse Tests'}</span>
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar if user has enrolled courses */}
            {totalEnrolled > 0 && learningTab === 'batches' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#070D1E] border border-[#17274B] text-xs">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-[#38BDF8] flex items-center justify-center font-bold">
                            <BookOpen size={16} />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Enrolled Batches</div>
                            <div className="text-sm font-black text-white">{totalEnrolled} Active</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                            <CheckCircle2 size={16} />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Completed</div>
                            <div className="text-sm font-black text-white">{completedCount} Batches</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1 border-t sm:border-t-0 border-[#17274B] pt-2 sm:pt-0">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-[#FF7A00] flex items-center justify-center font-bold">
                            <Zap size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                                <span>Avg Completion</span>
                                <span className="text-[#38BDF8]">{averageProgress}%</span>
                            </div>
                            <div className="w-full bg-[#0B152B] border border-[#17274B] h-1.5 rounded-full overflow-hidden mt-1">
                                <div
                                    className="bg-gradient-to-r from-blue-600 to-[#38BDF8] h-full rounded-full"
                                    style={{ width: `${Math.min(averageProgress, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 1. VIDEO BATCHES */}
            {learningTab === 'batches' && (
                <>
                    {enrolledBatches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {enrolledBatches.map((item) => {
                                const progress = item.progressPercent || 0;
                                const isCompleted = item.status === 'completed' || progress >= 100;

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-[#070D1E] p-4 sm:p-5 rounded-2xl border border-[#17274B] hover:border-[#38BDF8]/40 transition-all flex flex-col justify-between group shadow-lg"
                                    >
                                        <div className="space-y-3">
                                            {/* Course Thumbnail */}
                                            <div className="relative h-36 rounded-xl overflow-hidden bg-[#0B152B]">
                                                {item.thumbnailUrl ? (
                                                    <img
                                                        src={item.thumbnailUrl}
                                                        alt={item.courseTitle}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0F224A] to-[#070D1E] text-[#38BDF8]">
                                                        <GraduationCap size={36} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#070D1E] via-transparent to-transparent" />

                                                {/* Status Pill */}
                                                <div className="absolute top-2.5 left-2.5">
                                                    <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${
                                                        isCompleted
                                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-md'
                                                            : 'bg-blue-500/20 text-[#38BDF8] border-blue-500/30 backdrop-blur-md'
                                                    }`}>
                                                        {isCompleted ? '✓ Completed' : '● In Progress'}
                                                    </span>
                                                </div>

                                                {/* Play overlay button */}
                                                <div
                                                    onClick={() => navigate(`/dashboard/courses/${item.courseId}/learn`)}
                                                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-blue-600/80 hover:bg-blue-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer shadow-xl backdrop-blur-sm"
                                                >
                                                    <PlayCircle size={26} className="fill-white/20 ml-0.5" />
                                                </div>
                                            </div>

                                            {/* Title & Info */}
                                            <div>
                                                <h4 className="font-black text-sm text-white line-clamp-1 group-hover:text-[#38BDF8] transition-colors">
                                                    {item.courseTitle}
                                                </h4>
                                                <p className="text-[11px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                                                    {isCompleted ? 'Curriculum completed! Review anytime.' : 'Click to resume your next scheduled lecture'}
                                                </p>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-1.5 pt-1">
                                                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                                    <span>Curriculum Progress</span>
                                                    <span className="text-[#38BDF8]">{progress}%</span>
                                                </div>
                                                <div className="w-full bg-[#0B152B] border border-[#17274B] h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-600 via-[#38BDF8] to-cyan-400 h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Resume Action */}
                                        <button
                                            onClick={() => navigate(`/dashboard/courses/${item.courseId}/learn`)}
                                            className="mt-4 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                                        >
                                            <PlayCircle size={15} />
                                            <span>{isCompleted ? 'Review Batch' : 'Resume Lecture'}</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Empty State: Prompt Student to Start Learning with Curated Batches */
                        <div className="space-y-4">
                            <div className="p-6 rounded-2xl border border-dashed border-[#17274B] bg-[#070D1E] text-center space-y-2">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#38BDF8] flex items-center justify-center mx-auto">
                                    <GraduationCap size={24} />
                                </div>
                                <h3 className="text-sm font-black text-white">No Batches Enrolled Yet</h3>
                                <p className="text-xs text-slate-400 max-w-md mx-auto">
                                    Start learning with our top structured video batches and faculty masterclasses tailored for <strong className="text-white">{targetExam}</strong>.
                                </p>
                            </div>

                            {/* Show Curated Recommendations */}
                            {featuredBatches.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={14} className="text-orange-400" />
                                            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                                                Recommended Batches to Begin
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => navigate('/dashboard/batches?tab=explore')}
                                            className="text-xs font-bold text-[#38BDF8] hover:underline"
                                        >
                                            Explore Catalog
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {featuredBatches.slice(0, 3).map((batch) => {
                                            const isFree = batch.accessType === 'free' || !batch.pricing?.amount || batch.pricing.amount <= 0;
                                            return (
                                                <div
                                                    key={batch.id}
                                                    className="bg-[#070D1E] p-4 rounded-2xl border border-[#17274B] hover:border-blue-500/40 transition-all flex flex-col justify-between group"
                                                >
                                                    <div className="space-y-2.5">
                                                        <div className="relative h-32 rounded-xl overflow-hidden bg-[#0B152B]">
                                                            {batch.thumbnailUrl ? (
                                                                <img src={batch.thumbnailUrl} alt={batch.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90" />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0F224A] to-[#070D1E] text-[#38BDF8]">
                                                                    <GraduationCap size={32} />
                                                                </div>
                                                            )}
                                                            <div className="absolute top-2 left-2">
                                                                <span className="bg-[#070D1E]/85 backdrop-blur-md text-[#38BDF8] text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-500/20">
                                                                    {batch.examCategory}
                                                                </span>
                                                            </div>
                                                            <div className="absolute top-2 right-2">
                                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isFree ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
                                                                    {isFree ? 'FREE' : `₹${batch.pricing?.amount}`}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h4 className="font-black text-xs text-white line-clamp-1 group-hover:text-[#38BDF8] transition-colors">
                                                                {batch.title}
                                                            </h4>
                                                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                                                {batch.instructor?.name ? `By ${batch.instructor.name}` : 'Examinant Faculty'} • {batch.totalLessons || 0} Lectures
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => navigate('/dashboard/batches?tab=explore')}
                                                        className="mt-3 w-full py-2 bg-[#10224A] hover:bg-blue-600 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-[#1E3A75] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                                    >
                                                        <Sparkles size={13} className="text-[#38BDF8]" />
                                                        <span>Start Learning</span>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* TAB CONTENT: 2. ACTIVE MOCK TESTS */}
            {learningTab === 'tests' && (
                <div className="space-y-4">
                    {activeTests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {activeTests.map((act) => (
                                <div
                                    key={act.id}
                                    className="bg-[#070D1E] p-4 sm:p-5 rounded-2xl border border-[#17274B] hover:border-orange-500/40 transition-all flex flex-col justify-between group shadow-lg"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="p-2.5 bg-orange-500/15 text-[#FF7A00] rounded-xl">
                                                <ClipboardList size={20} />
                                            </div>
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-[#38BDF8] border border-blue-500/30">
                                                {act.category || 'Mock Series'}
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-black text-white line-clamp-1 group-hover:text-orange-400 transition-colors">
                                                {act.title}
                                            </h4>
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                Full mock test series with TCS pattern & instant rank analysis
                                            </p>
                                        </div>

                                        <div className="space-y-1 pt-1">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                                <span>Series Progress</span>
                                                <span className="text-[#FF7A00]">Active</span>
                                            </div>
                                            <div className="w-full bg-[#0B152B] border border-[#17274B] h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: '25%' }} />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate('/dashboard/tests')}
                                        className="mt-4 w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                                    >
                                        <PlayCircle size={15} />
                                        <span>Continue Mock Test</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 rounded-2xl border border-dashed border-[#17274B] bg-[#070D1E] text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto">
                                <Layers size={24} />
                            </div>
                            <h3 className="text-sm font-black text-white">No Active Mock Test Series</h3>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                Enroll in full-length test series to practice real-time exam simulations with all-India rankings.
                            </p>
                            <button
                                onClick={() => navigate('/dashboard/market')}
                                className="mt-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                            >
                                Browse Test Series
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContinueLearningSection;
