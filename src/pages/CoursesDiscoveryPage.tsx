import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, BookOpen, Sparkles, Filter, Star, Clock, Layers, ChevronRight, Play } from 'lucide-react';
import PageLayout from '../components/landing/PageLayout';
import { courseService } from '../services/courseService';
import type { Course } from '../types/course.types';
import { useExamList } from '../hooks/useExamList';

const CoursesDiscoveryPage = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedLevel, setSelectedLevel] = useState('All');
    const exams = useExamList();

    useEffect(() => {
        loadCourses();
    }, [selectedCategory, selectedLevel]);

    const loadCourses = async () => {
        setIsLoading(true);
        try {
            const data = await courseService.getPublishedCourses({
                examCategory: selectedCategory,
                level: selectedLevel,
                searchTerm
            });
            setCourses(data);
        } catch (error) {
            console.error("Error loading courses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loadCourses();
    };

    return (
        <PageLayout>
            <div className="bg-[#070D1E] text-white min-h-screen py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    {/* Hero Header */}
                    <div className="text-center max-w-3xl mx-auto space-y-4 pt-6">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full border border-blue-500/20 shadow-sm">
                            <Sparkles size={14} className="animate-pulse" />
                            <span>Structured Video Batches & LMS</span>
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                            Master Exams with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-400">Expert Video Batches</span>
                        </h1>
                        <p className="text-slate-400 text-base sm:text-lg font-medium leading-relaxed">
                            Comprehensive video lectures, downloadable study notes, and integrated practice tests designed by top educators.
                        </p>

                        {/* Search Bar */}
                        <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto pt-4">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search batches by exam, subject, or keyword..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-13 pr-32 py-4 bg-[#0B152B] border border-[#17254E] rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-white placeholder-slate-400 text-sm shadow-sm transition-all"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-md"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0B152B] p-4 sm:p-5 rounded-2xl border border-[#17254E] shadow-xl">
                        <div className="flex items-center gap-2 text-slate-200 font-bold text-xs uppercase tracking-wider">
                            <Filter size={16} className="text-blue-400" />
                            <span>Filter Batches:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-2.5 bg-[#070D1E] border border-[#17254E] rounded-xl font-bold text-slate-200 text-xs cursor-pointer focus:border-blue-500 focus:outline-none"
                            >
                                <option value="All">All Categories</option>
                                {exams.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>

                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="px-4 py-2.5 bg-[#070D1E] border border-[#17254E] rounded-xl font-bold text-slate-200 text-xs cursor-pointer focus:border-blue-500 focus:outline-none"
                            >
                                <option value="All">All Levels</option>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    {/* Course Grid */}
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-blue-500" size={40} />
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 font-medium bg-[#0B152B] rounded-3xl border border-[#17254E]">
                            No published batches found matching your criteria. Check back soon!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map(course => (
                                <div
                                    key={course.id}
                                    onClick={() => navigate(`/courses/${course.slug || course.id}`)}
                                    className="group bg-[#0B152B] rounded-3xl border border-[#17254E] shadow-xl hover:shadow-2xl hover:border-blue-500/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer relative"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-full h-48 overflow-hidden relative bg-slate-900 shrink-0">
                                        {course.thumbnailUrl ? (
                                            <img
                                                src={course.thumbnailUrl}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 text-white font-black text-xl">
                                                {course.examCategory}
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                                                {course.examCategory}
                                            </span>
                                            {course.accessType === 'free' && (
                                                <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                                                    FREE
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                                <Star size={14} className="fill-amber-400" />
                                                <span>{course.rating || 4.8}</span>
                                                <span className="text-slate-400 font-medium">({course.ratingCount || 120} reviews)</span>
                                            </div>
                                            <h3 className="text-lg font-extrabold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                                                {course.title}
                                            </h3>
                                            <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">
                                                {course.shortDescription}
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-2 border-t border-[#17254E]">
                                            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                                                <span className="flex items-center gap-1.5"><Layers size={14} className="text-blue-400" /> {course.totalModules || 0} Modules</span>
                                                <span className="flex items-center gap-1.5"><Play size={14} className="text-blue-400" /> {course.totalLessons || 0} Lessons</span>
                                                <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-400" /> {Math.round((course.durationMinutes || 0)/60)} Hrs</span>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <div>
                                                    {course.accessType === 'free' ? (
                                                        <span className="text-xl font-black text-emerald-400">FREE</span>
                                                    ) : (
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-2xl font-black text-white">₹{course.pricing?.amount || 0}</span>
                                                            {course.pricing?.originalPrice && (
                                                                <span className="text-xs text-slate-400 line-through font-bold">₹{course.pricing.originalPrice}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-400 group-hover:translate-x-1 transition-transform">
                                                    <span>Explore Batch</span>
                                                    <ChevronRight size={16} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default CoursesDiscoveryPage;
