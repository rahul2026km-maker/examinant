import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PlayCircle, Award, CheckCircle2, Clock, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { entitlementService } from '../../services/entitlementService';
import type { CourseEnrollment } from '../../types/course.types';

const StudentCoursesPage = () => {
    const navigate = useNavigate();
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;

    const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (currentUser) loadStudentCourses();
    }, [currentUser]);

    const loadStudentCourses = async () => {
        setIsLoading(true);
        try {
            if (!currentUser) return;
            const list = await entitlementService.getStudentEnrollments(currentUser.uid);
            setEnrollments(list);
        } catch (error) {
            console.error("Error loading student courses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Sparkles size={18} className="fill-blue-600" />
                        <span className="text-xs font-black uppercase tracking-widest">My Learning Hub</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Enrolled Courses</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Track your progress and continue learning from where you left off.</p>
                </div>
                <button
                    onClick={() => navigate('/courses')}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold text-sm px-6 py-3.5 rounded-2xl transition-all shadow-md"
                >
                    <BookOpen size={18} />
                    <span>Browse All Courses</span>
                </button>
            </div>

            {/* Courses List */}
            {isLoading ? (
                <div className="flex justify-center py-20 bg-white rounded-3xl border border-slate-100">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
            ) : enrollments.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 space-y-4">
                    <BookOpen size={48} className="mx-auto text-slate-300" />
                    <h3 className="text-xl font-extrabold text-slate-800">You haven't enrolled in any courses yet.</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">Explore expert video courses and start building your exam preparation today.</p>
                    <button
                        onClick={() => navigate('/courses')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 transition-all"
                    >
                        Explore Courses Catalog
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {enrollments.map(item => (
                        <div
                            key={item.id}
                            className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                        >
                            <div className="p-6 space-y-4">
                                {item.thumbnailUrl && (
                                    <div className="w-full h-40 rounded-2xl overflow-hidden bg-slate-900 relative">
                                        <img src={item.thumbnailUrl} alt={item.courseTitle} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                                        {item.status === 'completed' ? 'Completed' : 'In Progress'}
                                    </span>
                                    <h3 className="text-lg font-extrabold text-slate-900 leading-snug line-clamp-2 pt-1">{item.courseTitle}</h3>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-1.5 pt-2">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-slate-500">Overall Progress</span>
                                        <span className="text-blue-600 font-extrabold">{item.progressPercent || 0}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${item.progressPercent || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 pt-0 border-t border-slate-100/80 bg-slate-50/50">
                                <button
                                    onClick={() => navigate(`/dashboard/courses/${item.courseId}/learn`)}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all mt-4"
                                >
                                    <PlayCircle size={18} />
                                    <span>{item.progressPercent >= 100 ? 'Review Course' : 'Continue Learning'}</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentCoursesPage;
