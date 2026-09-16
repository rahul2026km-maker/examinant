import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    PlayCircle,
    Clock,
    Award,
    TrendingUp,
    BookOpen,
    Loader2,
    Target,
    ArrowRight,
    Flame,
    ClipboardList,
    Layers,
    BookMarked,
    Bookmark,
    Trophy,
    Sparkles,
    Headphones,
    Crown,
    CheckCircle2,
    Compass,
    Users,
    ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    getStudentStats,
    getRecommendedSeries,
    getActiveTests,
    formatDurationHours,
    type StudentStats,
    type ActiveTest
} from '../../services/studentDashboardService';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const auth = useAuth();
    const currentUser = auth?.currentUser;
    const profileData = auth?.profileData;
    const targetExam = auth?.selectedExam || 'SSC';

    const [stats, setStats] = useState<StudentStats>({
        totalTests: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        accuracy: 0,
        currentStreak: 0,
        testsTrend: 'Start now',
        scoreTrend: '-',
        timeTrend: '-',
        weeklyPerformance: [],
        subjectPerformance: [],
        dailyGoalCompleted: 0,
        dailyGoalTarget: 2,
        recentAttempts: []
    });
    const [activeTests, setActiveTests] = useState<ActiveTest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (currentUser) {
                try {
                    const [statsData, , activeData] = await Promise.all([
                        getStudentStats(currentUser.uid),
                        getRecommendedSeries(),
                        getActiveTests(currentUser.uid)
                    ]);
                    setStats(statsData);
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

    const getFormattedDate = () => {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, '0');
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const weekday = weekdays[date.getDay()];
        return `${day} ${month} ${year}, ${weekday}`;
    };

    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants: any = {
        hidden: { y: 15, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center bg-[#070D1E] -mx-6 -mt-6 -mb-10 rounded-3xl">
                <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
        );
    }

    // Weekly performance data for line chart
    const performanceOverviewData = stats.weeklyPerformance && stats.weeklyPerformance.length > 0
        ? stats.weeklyPerformance
        : [
            { name: 'Mon', Score: 0, Accuracy: 0 },
            { name: 'Tue', Score: 0, Accuracy: 0 },
            { name: 'Wed', Score: 0, Accuracy: 0 },
            { name: 'Thu', Score: 0, Accuracy: 0 },
            { name: 'Fri', Score: 0, Accuracy: 0 },
            { name: 'Sat', Score: 0, Accuracy: 0 },
            { name: 'Sun', Score: 0, Accuracy: 0 }
        ];

    // Subject accuracy data for donut chart
    const subjectWiseData = stats.subjectPerformance && stats.subjectPerformance.length > 0
        ? stats.subjectPerformance
        : [
            { name: 'Quantitative Aptitude', value: 0, color: '#38BDF8' },
            { name: 'Reasoning Ability', value: 0, color: '#818CF8' },
            { name: 'English Language', value: 0, color: '#34D399' },
            { name: 'General Awareness', value: 0, color: '#FBBF24' }
        ];

    // Handle empty subject data for Recharts Pie (to prevent rendering empty chart issues)
    const isPieDataEmpty = subjectWiseData.every(d => d.value === 0);
    const chartDataForPie = isPieDataEmpty
        ? [{ name: 'No attempts yet', value: 100, color: '#1E293B' }]
        : subjectWiseData;

    return (
        <motion.div
            className="min-h-screen bg-[#070D1E] text-slate-100 -mx-6 -mt-6 -mb-10 p-4 sm:p-8 space-y-8 font-sans selection:bg-orange-500 selection:text-white"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* ========================================================================= */}
            {/* TOP WELCOME HERO BANNER (WITH IMAGE & EXAM BADGE)                         */}
            {/* ========================================================================= */}
            <div className="relative bg-gradient-to-br from-[#0B152B] via-[#0D1B3A] to-[#070D1E] border border-[#17274B] rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                    <div className="space-y-3 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                            <Sparkles size={14} className="text-orange-400" />
                            Target Exam: {targetExam}
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                            Welcome back, {profileData?.fullName?.split(' ')[0] || profileData?.displayName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'Aspirant'}! 👋
                        </h1>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            "Success is the sum of small efforts, repeated day in and day out." Track your daily progress, attempt full mock tests, and master every concept.
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button
                                onClick={() => navigate('/dashboard/market')}
                                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                            >
                                <PlayCircle size={16} />
                                <span>Attempt Mock Test</span>
                            </button>
                            <button
                                onClick={() => navigate('/dashboard/community')}
                                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold px-4 py-3 rounded-2xl transition-all"
                            >
                                <Users size={16} className="text-blue-400" />
                                <span>Student Community</span>
                            </button>
                        </div>
                    </div>

                    {/* Visual Study Booster Image Card */}
                    <div className="relative group w-full lg:w-auto shrink-0">
                        <div className="w-full sm:w-80 h-44 rounded-3xl overflow-hidden relative border border-blue-400/20 shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80"
                                alt="Exam Study Sprint"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#070D1E] via-[#070D1E]/60 to-transparent" />
                            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-orange-500/90 text-white font-black text-[10px] uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1">
                                <Flame size={12} />
                                <span>Live Prep</span>
                            </div>
                            <div className="absolute bottom-3 left-3 right-3">
                                <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Preparation Sprint</div>
                                <div className="text-xs font-black text-white">Daily High-Yield Drills & Revisions</div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-300 mt-0.5">
                                    <Clock size={11} className="text-orange-400" />
                                    <span>{getFormattedDate()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 5 STATS CARDS GRID (BLUE THEMED)                                         */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    {
                        label: 'Tests Attempted',
                        value: stats.totalTests,
                        subText: 'Total Tests',
                        trend: stats.totalTests > 0 ? 'Dynamic data loaded' : 'No attempts yet',
                        trendColor: 'text-blue-400',
                        icon: <ClipboardList size={18} />,
                        iconColor: 'text-blue-400',
                        iconBg: 'bg-blue-500/15'
                    },
                    {
                        label: 'Average Score',
                        value: stats.totalTests > 0 ? `${stats.averageScore}%` : 'N/A',
                        subText: 'Across all tests',
                        trend: stats.totalTests > 0 ? 'Overall Average' : 'No attempts yet',
                        trendColor: 'text-purple-400',
                        icon: <Award size={18} />,
                        iconColor: 'text-purple-400',
                        iconBg: 'bg-purple-500/15'
                    },
                    {
                        label: 'Accuracy',
                        value: stats.totalTests > 0 ? `${stats.accuracy}%` : 'N/A',
                        subText: 'Correct questions %',
                        trend: stats.totalTests > 0 ? 'Solving Accuracy' : 'No attempts yet',
                        trendColor: 'text-rose-400',
                        icon: <Target size={18} />,
                        iconColor: 'text-rose-400',
                        iconBg: 'bg-rose-500/15'
                    },
                    {
                        label: 'Total Study Time',
                        value: stats.totalTimeSpent > 0 ? formatDurationHours(stats.totalTimeSpent) : '0h',
                        subText: 'Time spent in test',
                        trend: 'Learning duration',
                        trendColor: 'text-sky-400',
                        icon: <Clock size={18} />,
                        iconColor: 'text-sky-400',
                        iconBg: 'bg-sky-500/15'
                    },
                    {
                        label: 'Current Streak',
                        value: `${stats.currentStreak} Days`,
                        subText: stats.currentStreak > 0 ? 'Keep it up! 🔥' : 'Start practicing! 🔥',
                        trend: 'Daily active learning',
                        trendColor: 'text-[#FF7A00]',
                        icon: <Flame size={18} />,
                        iconColor: 'text-[#FF7A00]',
                        iconBg: 'bg-orange-500/15'
                    }
                ].map((card, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        className="bg-[#0B152B] p-5 border border-[#17274B] hover:border-[#1E3A75] rounded-3xl shadow-lg flex flex-col justify-between hover:shadow-2xl transition-all duration-300 group"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <div className={`p-2.5 rounded-2xl ${card.iconBg} ${card.iconColor} group-hover:scale-110 transition-transform`}>
                                {card.icon}
                            </div>
                            <span className={`text-[10px] font-bold ${card.trendColor}`}>
                                {card.trend}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                            <h3 className="text-2xl font-black text-white mt-1 tracking-tight">{card.value}</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{card.subText}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ========================================================================= */}
            {/* FEATURED IMAGES SECTION: LEARNING PATHS & STUDY HUBS                     */}
            {/* ========================================================================= */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-orange-400" />
                        <h2 className="text-sm font-black uppercase tracking-wider text-white">Recommended Study Hubs</h2>
                    </div>
                    <span className="text-xs font-semibold text-blue-400">Curated for {targetExam}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Image Card 1 */}
                    <div
                        onClick={() => navigate('/dashboard/market')}
                        className="group relative h-48 rounded-3xl overflow-hidden border border-[#17274B] hover:border-orange-500/50 shadow-xl cursor-pointer transition-all hover:scale-[1.02]"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80"
                            alt="Mock Test Series"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070D1E] via-[#070D1E]/70 to-transparent" />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-orange-500/90 text-white font-black text-[10px] uppercase tracking-wider backdrop-blur-md">
                            Mock Test Series
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                            <div>
                                <h3 className="font-black text-base text-white group-hover:text-orange-400 transition-colors">
                                    Full Length Mock Drills
                                </h3>
                                <p className="text-xs text-slate-300 mt-0.5">TCS pattern tests with instant AIR rankings</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center group-hover:bg-orange-500 transition-colors shrink-0">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Image Card 2 */}
                    <div
                        onClick={() => navigate('/dashboard/my-resources')}
                        className="group relative h-48 rounded-3xl overflow-hidden border border-[#17274B] hover:border-blue-500/50 shadow-xl cursor-pointer transition-all hover:scale-[1.02]"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80"
                            alt="Digital Smart Vault"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070D1E] via-[#070D1E]/70 to-transparent" />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-blue-600/90 text-white font-black text-[10px] uppercase tracking-wider backdrop-blur-md">
                            Digital Vault
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                            <div>
                                <h3 className="font-black text-base text-white group-hover:text-blue-400 transition-colors">
                                    Smart Notes & Formula Sheets
                                </h3>
                                <p className="text-xs text-slate-300 mt-0.5">Mind maps, chapter summaries & revision PDFs</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors shrink-0">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Image Card 3 */}
                    <div
                        onClick={() => navigate('/dashboard/community')}
                        className="group relative h-48 rounded-3xl overflow-hidden border border-[#17274B] hover:border-purple-500/50 shadow-xl cursor-pointer transition-all hover:scale-[1.02]"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80"
                            alt="Student Peer Community"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070D1E] via-[#070D1E]/70 to-transparent" />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-purple-600/90 text-white font-black text-[10px] uppercase tracking-wider backdrop-blur-md">
                            Student Community
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                            <div>
                                <h3 className="font-black text-base text-white group-hover:text-purple-400 transition-colors">
                                    Peer Doubts & Study Rooms
                                </h3>
                                <p className="text-xs text-slate-300 mt-0.5">Solve doubts with 14,000+ peers & mentors</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center group-hover:bg-purple-600 transition-colors shrink-0">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* CHARTS & DAILY GOAL SECTION (DARK BLUE THEMED)                            */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Performance Overview (Line Chart) */}
                <motion.div
                    variants={itemVariants}
                    className="bg-[#0B152B] p-5 sm:p-6 border border-[#17274B] rounded-3xl shadow-xl lg:col-span-5 flex flex-col justify-between"
                >
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-white">Performance Overview</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Weekly metrics analysis</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 bg-[#070D1E] px-2.5 py-1 rounded-lg border border-[#17274B]">
                            Weekly
                        </span>
                    </div>

                    <div className="h-44 w-full text-xs overflow-x-auto">
                        <AreaChart width={400} height={170} data={performanceOverviewData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#FF7A00" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#17274B" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0D1B3A', borderColor: '#1E3A75', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                            />
                            <Area type="monotone" dataKey="Score" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            <Area type="monotone" dataKey="Accuracy" stroke="#FF7A00" strokeWidth={2} fillOpacity={1} fill="url(#colorAccuracy)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        </AreaChart>
                    </div>

                    <div className="flex justify-center items-center gap-6 mt-2 text-[10px] font-bold text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                            <span className="text-slate-300">Score (%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#FF7A00]" />
                            <span className="text-slate-300">Accuracy (%)</span>
                        </div>
                    </div>
                </motion.div>

                {/* Subject Wise Performance (Donut Chart) */}
                <motion.div
                    variants={itemVariants}
                    className="bg-[#0B152B] p-5 sm:p-6 border border-[#17274B] rounded-3xl shadow-xl lg:col-span-4 flex flex-col justify-between"
                >
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h3 className="text-sm font-black text-white">Subject Wise Performance</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Average accuracy per subject</p>
                        </div>
                        <button onClick={() => navigate('/dashboard/analytics')} className="text-[10px] font-bold text-blue-400 hover:underline">
                            View All
                        </button>
                    </div>

                    <div className="flex flex-row items-center justify-between gap-2 h-44">
                        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                            <PieChart width={112} height={112}>
                                <Pie
                                    data={chartDataForPie}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={32}
                                    outerRadius={45}
                                    paddingAngle={isPieDataEmpty ? 0 : 2}
                                    dataKey="value"
                                >
                                    {chartDataForPie.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-black text-white leading-none">
                                    {stats.totalTests > 0 ? `${stats.accuracy}%` : '0%'}
                                </span>
                                <span className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Overall</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-2 text-[10px]">
                            {subjectWiseData.map((subject, idx) => (
                                <div key={idx} className="flex items-center justify-between font-semibold">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                                        <span className="text-slate-400 truncate">{subject.name}</span>
                                    </div>
                                    <span className="text-white font-bold ml-1">{subject.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Daily Goal Progress */}
                <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-b from-[#0F224A] to-[#0B152B] text-white p-5 sm:p-6 border border-[#1E3A75] rounded-3xl shadow-xl lg:col-span-3 flex flex-col justify-between"
                >
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">Daily Goal</span>
                        <ArrowRight size={14} className="text-slate-400 cursor-pointer hover:text-white" onClick={() => navigate('/dashboard/market')} />
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">Reset daily at midnight</div>

                    {/* SVG Circle Progress */}
                    <div className="flex items-center justify-center my-3 relative">
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="36"
                                className="stroke-[#17274B]"
                                strokeWidth="8"
                                fill="transparent"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="36"
                                className="stroke-[#FF7A00]"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={226}
                                strokeDashoffset={226 - (226 * Math.min(Math.round(((stats.dailyGoalCompleted || 0) / (stats.dailyGoalTarget || 2)) * 100), 100)) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-lg font-black tracking-tighter text-white">
                                {Math.min(Math.round(((stats.dailyGoalCompleted || 0) / (stats.dailyGoalTarget || 2)) * 100), 100)}%
                            </span>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] font-semibold text-slate-300">
                            {stats.dailyGoalCompleted || 0} / {stats.dailyGoalTarget || 2} Tests Completed
                        </p>
                        <button
                            onClick={() => navigate('/dashboard/market')}
                            className="w-full mt-3 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/20"
                        >
                            Start Test Now
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* ========================================================================= */}
            {/* PREPARATION, RECENT ACTIVITY & QUICK ACCESS ROW                          */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Continue Your Preparation */}
                <motion.div
                    variants={itemVariants}
                    className="bg-[#0B152B] p-5 sm:p-6 border border-[#17274B] rounded-3xl shadow-xl flex flex-col justify-between"
                >
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-white">Continue Your Preparation</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Resume where you left off</p>
                        </div>
                        <button onClick={() => navigate('/dashboard/tests')} className="text-[10px] font-bold text-blue-400 hover:underline">
                            View All
                        </button>
                    </div>

                    <div className="space-y-3.5">
                        {activeTests.length > 0 ? (
                            activeTests.map((act) => (
                                <div key={act.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#070D1E] hover:bg-[#0E1E42] transition-all border border-[#17274B] hover:border-blue-500/30">
                                    <div className="p-2.5 bg-rose-500/15 text-rose-400 rounded-xl shrink-0">
                                        <ClipboardList size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-black text-white truncate leading-tight">{act.title}</h4>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{act.category} Series</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="flex-1 h-1 bg-[#17274B] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#FF7A00] rounded-full" style={{ width: '0%' }} />
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-400">0%</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/dashboard/tests')}
                                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold uppercase rounded-lg shadow-sm shrink-0 flex items-center gap-1 transition-all"
                                    >
                                        <PlayCircle size={10} className="fill-white/10" />
                                        <span>Start</span>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed border-[#17274B] bg-[#070D1E] rounded-2xl my-2 min-h-[200px] w-full">
                                <div className="p-2.5 bg-orange-500/15 text-[#FF7A00] rounded-xl mb-2.5">
                                    <Layers size={20} />
                                </div>
                                <h4 className="text-[11px] font-black text-white mb-0.5">No Active Test Series</h4>
                                <p className="text-[9px] font-semibold text-slate-400 max-w-[180px] mb-3 leading-normal">
                                    Enroll in standard mock test series to begin your exam preparation.
                                </p>
                                <button
                                    onClick={() => navigate('/dashboard/market')}
                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[8px] font-bold uppercase rounded-lg shadow-sm transition-all"
                                >
                                    Browse Market
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Recent Test Activity */}
                <motion.div
                    variants={itemVariants}
                    className="bg-[#0B152B] p-5 sm:p-6 border border-[#17274B] rounded-3xl shadow-xl flex flex-col justify-between"
                >
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-white">Recent Test Activity</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Your recent test performance</p>
                        </div>
                        <button onClick={() => navigate('/dashboard/results')} className="text-[10px] font-bold text-blue-400 hover:underline">
                            View All
                        </button>
                    </div>

                    <div className="space-y-3">
                        {stats.recentAttempts && stats.recentAttempts.length > 0 ? (
                            stats.recentAttempts.map((act) => {
                                const date = act.attemptDate?.toDate ? act.attemptDate.toDate() : new Date(act.attemptDate);
                                const formattedDate = date instanceof Date && !isNaN(date.getTime()) 
                                    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : 'N/A';
                                return (
                                    <div key={act.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-[#070D1E] hover:bg-[#0E1E42] border border-[#17274B] hover:border-blue-500/30 transition-all">
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-black text-white truncate leading-tight">{act.testTitle}</h4>
                                            <p className="text-[8px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                                                Score: {act.score} / {act.maxScore} • {formattedDate}
                                            </p>
                                        </div>
                                        <span 
                                            onClick={() => navigate(`/dashboard/results/${act.id}`)}
                                            className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-[8px] font-bold uppercase rounded-md shrink-0 border border-emerald-500/20 cursor-pointer transition-all"
                                        >
                                            Analysis
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed border-[#17274B] bg-[#070D1E] rounded-2xl my-2 min-h-[200px] w-full">
                                <div className="p-2.5 bg-purple-500/15 text-purple-400 rounded-xl mb-2.5">
                                    <ClipboardList size={20} />
                                </div>
                                <h4 className="text-[11px] font-black text-white mb-0.5">No Attempt History</h4>
                                <p className="text-[9px] font-semibold text-slate-400 max-w-[180px] mb-3 leading-normal">
                                    Your scores, time taken, and correct answers will appear here once you take a test.
                                </p>
                                <button
                                    onClick={() => navigate('/dashboard/market')}
                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[8px] font-bold uppercase rounded-lg shadow-sm transition-all"
                                >
                                    Start First Test
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Quick Access & Gold Promo */}
                <motion.div
                    variants={itemVariants}
                    className="space-y-4"
                >
                    {/* Quick Access Icons */}
                    <div className="bg-[#0B152B] p-5 border border-[#17274B] rounded-3xl shadow-xl">
                        <h3 className="text-sm font-black text-white mb-4">Quick Access</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Test Series', path: '/dashboard/market', icon: <Layers size={16} />, color: 'text-orange-400 bg-orange-500/15' },
                                { label: 'PYQs', path: '/dashboard/pyqs', icon: <BookMarked size={16} />, color: 'text-emerald-400 bg-emerald-500/15' },
                                { label: 'Books', path: '/dashboard/resources', icon: <BookOpen size={16} />, color: 'text-blue-400 bg-blue-500/15' },
                                { label: 'Results', path: '/dashboard/results', icon: <Award size={16} />, color: 'text-purple-400 bg-purple-500/15' },
                                { label: 'Leaderboard', path: '/dashboard/analytics', icon: <Trophy size={16} />, color: 'text-amber-400 bg-amber-500/15' },
                                { label: 'Bookmarks', path: '/dashboard/bookmarks', icon: <Bookmark size={16} />, color: 'text-pink-400 bg-pink-500/15' }
                            ].map((btn, index) => (
                                <button
                                    key={index}
                                    onClick={() => navigate(btn.path)}
                                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#070D1E] border border-[#17274B] hover:border-blue-500/30 hover:bg-[#0E1E42] transition-all text-center gap-1.5 cursor-pointer group"
                                >
                                    <div className={`p-2 rounded-xl ${btn.color} group-hover:scale-110 transition-transform`}>
                                        {btn.icon}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-300 tracking-tight group-hover:text-white">{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Promo Card */}
                    <div className="p-5 bg-gradient-to-r from-[#0F224A] to-[#1E3A75] text-white border border-[#23458A] rounded-3xl shadow-xl relative overflow-hidden flex items-center justify-between">
                        <div className="absolute right-0 bottom-0 top-0 opacity-15 pointer-events-none flex items-center">
                            <Crown size={96} className="text-white transform translate-x-8 translate-y-2" />
                        </div>
                        <div className="relative z-10 max-w-[65%]">
                            <h4 className="text-xs font-black tracking-tight text-white">Examinantt Gold Test Series</h4>
                            <p className="text-[9px] text-blue-200 font-semibold mt-1 leading-snug">
                                Premium mocks. Detailed analysis. Top ranks. Your success.
                            </p>
                            <button
                                onClick={() => navigate('/dashboard/market')}
                                className="mt-3 px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-xl shadow-md transition-all"
                            >
                                Explore Now
                            </button>
                        </div>
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-[#FFBB33] shrink-0 border border-white/10 shadow-inner">
                            <Crown size={28} className="fill-[#FFBB33]/20" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ========================================================================= */}
            {/* HORIZONTAL FOOTER VALUES BAR (DARK BLUE THEMED)                           */}
            {/* ========================================================================= */}
            <motion.div
                variants={itemVariants}
                className="bg-[#0B152B] border border-[#17274B] rounded-3xl p-5 shadow-xl"
            >
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-[#17274B]">
                    {[
                        { label: '1500+', desc: 'Tests Available', icon: <ClipboardList size={14} className="text-[#FF7A00]" /> },
                        { label: '50+', desc: 'Exams Covered', icon: <Award size={14} className="text-[#FF7A00]" /> },
                        { label: 'Detailed', desc: 'Performance Analysis', icon: <TrendingUp size={14} className="text-[#FF7A00]" /> },
                        { label: 'AI-Powered', desc: 'Smart Recommendations', icon: <Sparkles size={14} className="text-[#FF7A00]" /> },
                        { label: '24x7', desc: 'Student Support', icon: <Headphones size={14} className="text-[#FF7A00]" /> }
                    ].map((feat, index) => (
                        <div key={index} className="flex flex-col items-center justify-center p-2 md:p-0">
                            <div className="flex items-center gap-1.5">
                                {feat.icon}
                                <span className="text-xs font-black text-white leading-none">{feat.label}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 mt-1">{feat.desc}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default StudentDashboard;
