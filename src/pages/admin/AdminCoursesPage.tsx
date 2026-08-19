import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Search, Edit2, Archive, Loader2, BookOpen, Layers, 
    Users, Award, Sparkles, Filter, CheckCircle, ExternalLink, Play 
} from 'lucide-react';
import { courseService } from '../../services/courseService';
import type { Course } from '../../types/course.types';
import { useExamList } from '../../hooks/useExamList';

const AdminCoursesPage = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const exams = useExamList();

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setIsLoading(true);
        try {
            const data = await courseService.getAllAdminCourses();
            setCourses(data);
        } catch (error) {
            console.error("Failed to load admin courses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleArchive = async (courseId: string) => {
        if (!window.confirm("Are you sure you want to archive this course? Enrolled students will retain historical access.")) return;
        try {
            await courseService.archiveCourse(courseId);
            await loadCourses();
        } catch (error) {
            alert("Failed to archive course.");
        }
    };

    const handlePublishToggle = async (course: Course) => {
        const nextStatus = course.status === 'published' ? 'draft' : 'published';
        try {
            await courseService.updateCourse(course.id, { status: nextStatus });
            await loadCourses();
        } catch (error) {
            alert("Failed to update course status.");
        }
    };

    const filteredCourses = courses.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || c.examCategory === selectedCategory;
        const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Sparkles size={18} className="fill-blue-600" />
                        <span className="text-xs font-black uppercase tracking-widest">LMS & Curriculum</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Course Management</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Create, organize modules, upload video lessons, and manage course access.</p>
                </div>
                <button
                    onClick={() => navigate('/admin-dashboard/courses/create')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200"
                >
                    <Plus size={18} />
                    <span>Create New Course</span>
                </button>
            </div>

            {/* Filters & Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search courses by title, category, description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 text-sm font-medium transition-all"
                    />
                </div>
                <div className="flex flex-wrap sm:flex-nowrap gap-3">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-700 text-sm font-bold cursor-pointer"
                    >
                        <option value="All">All Categories</option>
                        {exams.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-700 text-sm font-bold cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Course Table */}
            {isLoading ? (
                <div className="flex justify-center py-20 bg-white rounded-3xl border border-slate-100">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 space-y-4">
                    <BookOpen size={48} className="mx-auto text-slate-300" />
                    <p className="text-slate-500 font-bold">No courses found matching your criteria.</p>
                    <button
                        onClick={() => navigate('/admin-dashboard/courses/create')}
                        className="text-blue-600 hover:text-blue-700 font-extrabold text-sm underline"
                    >
                        Create your first course now
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 uppercase text-[11px] font-black tracking-wider">
                                    <th className="py-4 px-6">Course Information</th>
                                    <th className="py-4 px-6">Category & Level</th>
                                    <th className="py-4 px-6">Access & Pricing</th>
                                    <th className="py-4 px-6">Curriculum</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredCourses.map(course => (
                                    <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                {course.thumbnailUrl ? (
                                                    <img src={course.thumbnailUrl} alt={course.title} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                        <BookOpen size={20} />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-extrabold text-slate-900 leading-snug line-clamp-1">{course.title}</h3>
                                                    <p className="text-xs text-slate-400 font-medium line-clamp-1">{course.instructor?.name || 'Faculty Expert'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-1">
                                                <span className="inline-block bg-blue-50 text-blue-700 text-xs font-black px-2.5 py-0.5 rounded-md">
                                                    {course.examCategory}
                                                </span>
                                                <p className="text-xs text-slate-500 font-medium">{course.level || 'All Levels'}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                {course.accessType === 'free' ? (
                                                    <span className="text-emerald-600 font-extrabold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                                        Free Access
                                                    </span>
                                                ) : course.accessType === 'subscription' ? (
                                                    <span className="text-purple-600 font-extrabold text-xs bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                                                        Pro Subscription
                                                    </span>
                                                ) : (
                                                    <span className="font-black text-slate-900 text-sm">
                                                        ₹{course.pricing?.amount || 0}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                                                <span className="flex items-center gap-1"><Layers size={14} className="text-slate-400" /> {course.totalModules || 0} Modules</span>
                                                <span className="flex items-center gap-1"><Play size={14} className="text-blue-500" /> {course.totalLessons || 0} Lessons</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => handlePublishToggle(course)}
                                                className={`px-3 py-1 rounded-full text-xs font-extrabold capitalize transition-colors ${
                                                    course.status === 'published'
                                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                        : course.status === 'draft'
                                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {course.status}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin-dashboard/courses/${course.id}/edit`)}
                                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Course & Curriculum"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin-dashboard/courses/${course.id}/enrollments`)}
                                                    className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Student Enrollments"
                                                >
                                                    <Users size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleArchive(course.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Archive Course"
                                                >
                                                    <Archive size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCoursesPage;
