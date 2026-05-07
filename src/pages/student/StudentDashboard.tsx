import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Clock, Award, TrendingUp, ChevronRight, BookOpen, Loader2, Target, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    getStudentStats,
    getRecommendedSeries,
    getActiveTests,
    formatDurationHours,
    type StudentStats,
    type RecommendedSeries,
    type ActiveTest
} from '../../services/studentDashboardService';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const auth = useAuth();
    const currentUser = auth?.currentUser;

    const [stats, setStats] = useState<StudentStats>({
        totalTests: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        testsTrend: 'Start now',
        scoreTrend: '-',
        timeTrend: '-'
    });
    const [recommendations, setRecommendations] = useState<RecommendedSeries[]>([]);
    const [activeTests, setActiveTests] = useState<ActiveTest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (currentUser) {
                try {
                    const [statsData, recData, activeData] = await Promise.all([
                        getStudentStats(currentUser.uid),
                        getRecommendedSeries(),
                        getActiveTests(currentUser.uid)
                    ]);
                    setStats(statsData);
                    setRecommendations(recData);
                    setActiveTests(activeData);
                } catch (error) {
                    console.error("Failed to load dashboard data", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadDashboardData();
    }, [currentUser]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <motion.div
            className="max-w-7xl mx-auto space-y-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Welcome Header */}
            <motion.div variants={itemVariants} className="space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Scholar'}! 👋
                </h1>
                <p className="text-slate-500 font-medium">Here's a summary of your academic progress.</p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        label: 'Tests Completed',
                        value: stats.totalTests.toString(),
                        icon: Award,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50',
                        trend: stats.testsTrend,
                        trendColor: 'text-green-600',
                        gradient: 'from-blue-500 to-indigo-600'
                    },
                    {
                        label: 'Average Score',
                        value: `${stats.averageScore}%`,
                        icon: Target,
                        color: 'text-indigo-600',
                        bg: 'bg-indigo-50',
                        trend: stats.scoreTrend,
                        trendColor: 'text-green-600',
                        gradient: 'from-indigo-500 to-purple-600'
                    },
                    {
                        label: 'Learning Hours',
                        value: formatDurationHours(stats.totalTimeSpent),
                        icon: Clock,
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50',
                        trend: stats.timeTrend,
                        trendColor: 'text-slate-500',
                        gradient: 'from-emerald-500 to-teal-600'
                    }
                ].map((stat, index) => (
                    <motion.div
                        key={index}
                        variants={itemVariants}
                        className="relative group overflow-hidden bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                    >
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-colors duration-300 group-hover:bg-slate-900 group-hover:text-white`}>
                                    <stat.icon size={24} />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Live Updates
                                </div>
                            </div>
                            <div className="mt-auto">
                                <p className="text-sm font-bold text-slate-500 mb-1">{stat.label}</p>
                                <div className="flex items-baseline gap-3">
                                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                                    <span className={`text-xs font-black ${stat.trendColor} flex items-center gap-0.5`}>
                                        {stat.trend.includes('+') && <TrendingUp size={12} />}
                                        {stat.trend}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Dashboard Sections */}
            <div className="grid lg:grid-cols-3 gap-10">
                {/* Recommendations - Left (2 cols) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recommended for You</h2>
                            <p className="text-sm text-slate-500 font-medium">Curated test series based on your target exams.</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard/market')}
                            className="p-2.5 bg-slate-50 rounded-xl text-slate-900 hover:bg-slate-900 hover:text-white transition-all group"
                        >
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {recommendations.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-6">
                            {recommendations.map((series) => (
                                <motion.div
                                    key={series.id}
                                    whileHover={{ y: -6 }}
                                    onClick={() => navigate('/dashboard/market')}
                                    className="group relative bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 cursor-pointer"
                                >
                                    <div className="h-40 bg-slate-900 relative p-8 flex flex-col justify-between overflow-hidden">
                                        {/* Background pattern */}
                                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#3b82f6_0%,transparent_50%)]"></div>
                                        
                                        <div className="relative z-10">
                                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/20">
                                                {series.category || 'Expert Choice'}
                                            </span>
                                        </div>
                                        <div className="relative z-10 flex justify-between items-end">
                                            <div className="text-white">
                                                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Pricing starts from</p>
                                                <p className="text-2xl font-black">{series.price === 0 ? 'FREE' : `₹${series.price}`}</p>
                                            </div>
                                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                                                <Zap size={20} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 space-y-4">
                                        <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 tracking-tight">
                                            {series.title}
                                        </h3>
                                        <div className="flex items-center gap-6 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <BookOpen size={14} className="text-blue-600" />
                                                <span>{series.stats?.totalTests || '12+'} Tests</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Target size={14} className="text-indigo-600" />
                                                <span>Full Mock</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">Finding best matches for you...</p>
                        </div>
                    )}
                </div>

                {/* Active Tests - Right (1 col) */}
                <div className="space-y-8">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Tests</h2>
                        <p className="text-sm text-slate-500 font-medium">Continue where you left off.</p>
                    </div>

                    <div className="space-y-4">
                        {activeTests.length > 0 ? (
                            activeTests.map((test) => (
                                <div
                                    key={test.id}
                                    onClick={() => {
                                        const message = `Continue "${test.title}"? Your timer will resume.`;
                                        if (window.confirm(message)) {
                                            const path = (test as any).isOMR 
                                                ? `/dashboard/omr-attempt/${test.testId}` 
                                                : `/dashboard/attempt/${test.testId}`;
                                            navigate(path);
                                        }
                                    }}
                                    className="group bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center gap-5"
                                >
                                    <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                        <PlayCircle size={28} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-900 truncate tracking-tight">{test.title}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            Resuming session
                                        </p>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            ))
                        ) : (
                            <div className="bg-slate-50 rounded-[40px] p-10 text-center border border-slate-100">
                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-sm">
                                    <Zap size={32} />
                                </div>
                                <h3 className="font-black text-slate-900 mb-2">Ready to Start?</h3>
                                <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
                                    You don't have any active test sessions. Head to the market to unlock premium content.
                                </p>
                                <button
                                    onClick={() => navigate('/dashboard/market')}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg"
                                >
                                    Explore Library
                                </button>
                            </div>
                        )}
                        
                        <button
                            onClick={() => navigate('/dashboard/tests')}
                            className="w-full py-4 border border-slate-100 rounded-2xl text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            View All Purchased Tests
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StudentDashboard;

