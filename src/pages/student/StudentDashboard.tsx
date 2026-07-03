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
    Crown
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
        testsTrend: 'Start now',
        scoreTrend: '-',
        timeTrend: '-'
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
                    // getRecommendedSeries is called to preheat/fetch but not rendered in UI
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

    const getPrepData = (exam: string) => {
        const examLower = exam.toLowerCase();
        if (examLower.includes('neet') || examLower.includes('medical')) {
            return [
                {
                    title: 'NEET Biology - Plant Kingdom Booster',
                    desc: 'Chapter Test • 90 Questions • 45 Min',
                    progress: 65,
                    testId: 'neet-bio-plant'
                },
                {
                    title: 'Chemistry - Organic Hydrocarbons',
                    desc: 'Chapter Test • 45 Questions • 30 Min',
                    progress: 40,
                    testId: 'neet-chem-hydrocarbons'
                },
                {
                    title: 'Physics - Ray Optics & Instruments',
                    desc: 'Chapter Test • 45 Questions • 45 Min',
                    progress: 20,
                    testId: 'neet-phys-optics'
                }
            ];
        } else if (examLower.includes('jee') || examLower.includes('engineering')) {
            return [
                {
                    title: 'JEE Main - Calculus & Limits Practice',
                    desc: 'Chapter Test • 30 Questions • 60 Min',
                    progress: 65,
                    testId: 'jee-math-calculus'
                },
                {
                    title: 'Physics - Electrostatics & Gauss Law',
                    desc: 'Chapter Test • 30 Questions • 60 Min',
                    progress: 40,
                    testId: 'jee-phys-electrostatics'
                },
                {
                    title: 'Chemistry - Chemical Kinetics & Equilibrium',
                    desc: 'Chapter Test • 30 Questions • 45 Min',
                    progress: 20,
                    testId: 'jee-chem-kinetics'
                }
            ];
        } else if (examLower.includes('upsc') || examLower.includes('pcs')) {
            return [
                {
                    title: 'UPSC CSE Prelims - Indian Polity & Gov',
                    desc: 'Full Mock • 100 Questions • 120 Min',
                    progress: 65,
                    testId: 'upsc-polity'
                },
                {
                    title: 'Modern Indian History - Freedom Struggle',
                    desc: 'Chapter Test • 50 Questions • 60 Min',
                    progress: 40,
                    testId: 'upsc-modern-history'
                },
                {
                    title: 'General Geography & Environment',
                    desc: 'Chapter Test • 50 Questions • 60 Min',
                    progress: 20,
                    testId: 'upsc-geography'
                }
            ];
        } else if (examLower.includes('bank') || examLower.includes('teach') || examLower.includes('rail') || examLower.includes('def')) {
            return [
                {
                    title: `${exam} General Awareness Test 01`,
                    desc: 'Practice Test • 50 Questions • 30 Min',
                    progress: 65,
                    testId: 'general-exam-01'
                },
                {
                    title: 'Quantitative Aptitude - Data Interpretation',
                    desc: 'Chapter Test • 25 Questions • 20 Min',
                    progress: 40,
                    testId: 'general-quant-di'
                },
                {
                    title: 'English Comprehension & Sentence Correction',
                    desc: 'Chapter Test • 25 Questions • 20 Min',
                    progress: 20,
                    testId: 'general-english'
                }
            ];
        } else {
            // Dynamic default titles based on the exam name
            return [
                {
                    title: `${exam} Full Length Practice Test 01`,
                    desc: 'Full Length Test • 100 Questions • 60 Min',
                    progress: 65,
                    testId: 'dynamic-mock-1'
                },
                {
                    title: `${exam} Sectional Mock - Section A`,
                    desc: 'Chapter Test • 25 Questions • 20 Min',
                    progress: 40,
                    testId: 'dynamic-mock-2'
                },
                {
                    title: `${exam} Subject Practice Paper`,
                    desc: 'Chapter Test • 25 Questions • 20 Min',
                    progress: 20,
                    testId: 'dynamic-mock-3'
                }
            ];
        }
    };

    const getRecentActivityData = (exam: string) => {
        const examLower = exam.toLowerCase();
        if (examLower.includes('neet') || examLower.includes('medical')) {
            return [
                { title: 'NEET Physics - Kinematics Mini Mock', detail: 'Score: 162/180 • Rank: 250/12500' },
                { title: 'NEET Biology - Cell Biology Full Test', detail: 'Score: 320/360 • Rank: 184/18200' },
                { title: 'NEET Chemistry - Mole Concept Practice', detail: 'Score: 140/180 • Rank: 89/9450' },
                { title: 'NEET Weekly Revision Mock 04', detail: 'Score: 610/720 • Rank: 1045/45670' }
            ];
        } else if (examLower.includes('jee') || examLower.includes('engineering')) {
            return [
                { title: 'JEE Main Physics - Modern Physics Mock', detail: 'Score: 84/120 • Rank: 110/6800' },
                { title: 'JEE Main Maths - Vector Algebra Practice', detail: 'Score: 92/120 • Rank: 85/7400' },
                { title: 'JEE Main Chemistry - Coordination Compounds', detail: 'Score: 76/120 • Rank: 320/8200' },
                { title: 'JEE Main Physics - Mechanical Properties', detail: 'Score: 80/120 • Rank: 145/7100' }
            ];
        } else {
            return [
                { title: `${exam} Chapter-wise Mock Test 02`, detail: 'Score: 82% • Rank: 125/4567' },
                { title: `${exam} Weekly Practice Test 01`, detail: 'Score: 76% • Rank: 234/2345' },
                { title: `${exam} Topic Test - Set A`, detail: 'Score: 64% • Rank: 345/4567' },
                { title: `${exam} Speed Test 05`, detail: 'Score: 58% • Rank: 567/4567' }
            ];
        }
    };

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
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-[#0B1E43]" size={40} />
            </div>
        );
    }

    // Chart mock data matching the reference image layout
    const performanceOverviewData = [
        { name: 'Mon', Score: 60, Accuracy: 40 },
        { name: 'Tue', Score: 50, Accuracy: 45 },
        { name: 'Wed', Score: 52, Accuracy: 40 },
        { name: 'Thu', Score: 62, Accuracy: 50 },
        { name: 'Fri', Score: 58, Accuracy: 43 },
        { name: 'Sat', Score: 68, Accuracy: 55 },
        { name: 'Sun', Score: 65, Accuracy: 62 },
    ];

    const subjectWiseData = [
        { name: 'Quantitative Aptitude', value: 72, color: '#0B1E43' },
        { name: 'Reasoning Ability', value: 65, color: '#1D64D0' },
        { name: 'English Language', value: 70, color: '#3A907C' },
        { name: 'General Awareness', value: 60, color: '#FBBF24' }
    ];

    return (
        <motion.div
            className="space-y-6 max-w-7xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Top Welcome Panel */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                        Welcome back, {profileData?.fullName?.split(' ')[0] || profileData?.displayName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'Aditya'}! 👋 ({targetExam})
                    </h1>
                    <p className="text-slate-400 font-medium text-xs mt-1">
                        Track your progress and continue your learning journey.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm text-xs font-semibold text-slate-600 self-start md:self-auto">
                    <Clock size={14} className="text-slate-400" />
                    <span>{getFormattedDate()}</span>
                </div>
            </div>

            {/* 5 Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    {
                        label: 'Tests Attempted',
                        value: stats.totalTests > 0 ? stats.totalTests : 24,
                        subText: 'Total Tests',
                        trend: '↑ 12% this week',
                        trendColor: 'text-emerald-500',
                        icon: <ClipboardList size={18} />,
                        iconColor: 'text-[#1D64D0]',
                        iconBg: 'bg-blue-50'
                    },
                    {
                        label: 'Average Score',
                        value: stats.averageScore > 0 ? `${stats.averageScore}%` : '68.5%',
                        subText: 'Across all tests',
                        trend: '↑ 8.4% improvement',
                        trendColor: 'text-emerald-500',
                        icon: <Award size={18} />,
                        iconColor: 'text-purple-600',
                        iconBg: 'bg-purple-50'
                    },
                    {
                        label: 'Accuracy',
                        value: '72.3%',
                        subText: 'Correct questions %',
                        trend: '↑ 6.7% improvement',
                        trendColor: 'text-emerald-500',
                        icon: <Target size={18} />,
                        iconColor: 'text-red-500',
                        iconBg: 'bg-red-50'
                    },
                    {
                        label: 'Total Study Time',
                        value: stats.totalTimeSpent > 0 ? formatDurationHours(stats.totalTimeSpent) : '48h 30m',
                        subText: 'Time spent in test',
                        trend: '↑ 5h 20m this week',
                        trendColor: 'text-emerald-500',
                        icon: <Clock size={18} />,
                        iconColor: 'text-sky-500',
                        iconBg: 'bg-sky-50'
                    },
                    {
                        label: 'Current Streak',
                        value: '7 Days',
                        subText: 'Keep it up! 🔥',
                        trend: 'Daily active learning',
                        trendColor: 'text-[#FF7A00]',
                        icon: <Flame size={18} />,
                        iconColor: 'text-[#FF7A00]',
                        iconBg: 'bg-orange-50'
                    }
                ].map((card, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <div className={`p-2.5 rounded-xl ${card.iconBg} ${card.iconColor}`}>
                                {card.icon}
                            </div>
                            <span className={`text-[10px] font-bold ${card.trendColor}`}>
                                {card.trend}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                            <h3 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{card.value}</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{card.subText}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts & Daily Goal Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Performance Overview (Line Chart) */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm lg:col-span-5 flex flex-col justify-between"
                >
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-800">Performance Overview</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Weekly metrics analysis</p>
                        </div>
                        <select className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 outline-none">
                            <option>This Week</option>
                            <option>Last Month</option>
                        </select>
                    </div>

                    <div className="h-44 w-full text-xs overflow-x-auto">
                        <AreaChart width={400} height={170} data={performanceOverviewData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0B1E43" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#0B1E43" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#FF7A00" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Area type="monotone" dataKey="Score" stroke="#0B1E43" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            <Area type="monotone" dataKey="Accuracy" stroke="#FF7A00" strokeWidth={2} fillOpacity={1} fill="url(#colorAccuracy)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        </AreaChart>
                    </div>

                    <div className="flex justify-center items-center gap-6 mt-2 text-[10px] font-bold text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#0B1E43]"></div>
                            <span>Score (%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#FF7A00]"></div>
                            <span>Accuracy (%)</span>
                        </div>
                    </div>
                </motion.div>

                {/* Subject Wise Performance (Donut Chart) */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm lg:col-span-4 flex flex-col justify-between"
                >
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h3 className="text-sm font-black text-slate-800">Subject Wise Performance</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Average accuracy per subject</p>
                        </div>
                        <button className="text-[10px] font-bold text-[#1D64D0] hover:underline">View All</button>
                    </div>

                    <div className="flex flex-row items-center justify-between gap-2 h-44">
                        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                            <PieChart width={112} height={112}>
                                <Pie
                                    data={subjectWiseData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={32}
                                    outerRadius={45}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {subjectWiseData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-black text-slate-800 leading-none">68.5%</span>
                                <span className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Overall</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-2 text-[10px]">
                            {subjectWiseData.map((subject, idx) => (
                                <div key={idx} className="flex items-center justify-between font-semibold">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: subject.color }}></div>
                                        <span className="text-slate-500 truncate">{subject.name}</span>
                                    </div>
                                    <span className="text-slate-800 font-bold ml-1">{subject.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Daily Goal Progress */}
                <motion.div
                    variants={itemVariants}
                    className="bg-[#0B1E43] text-white p-5 border border-slate-100 rounded-2xl shadow-sm lg:col-span-3 flex flex-col justify-between"
                >
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-300">Daily Goal</span>
                        <ArrowRight size={14} className="text-slate-300 cursor-pointer" />
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">Reset in 10h 30m</div>

                    {/* SVG Circle Progress */}
                    <div className="flex items-center justify-center my-3 relative">
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="36"
                                className="stroke-slate-700/40"
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
                                strokeDashoffset={226 - (226 * 75) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-lg font-black tracking-tighter">75%</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] font-semibold text-slate-300">3 / 4 Tests Completed</p>
                        <button
                            onClick={() => navigate('/dashboard/market')}
                            className="w-full mt-3 py-2.5 bg-[#FF7A00] hover:bg-[#FF8B1F] text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#FF7A00]/20"
                        >
                            Start Test Now
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Preparation, Recent Activity & Quick Access row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Continue Your Preparation */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between"
                >
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-800">Continue Your Preparation</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Resume where you left off</p>
                        </div>
                        <button onClick={() => navigate('/dashboard/tests')} className="text-[10px] font-bold text-[#1D64D0] hover:underline">View All</button>
                    </div>

                    <div className="space-y-3.5">
                        {getPrepData(targetExam).map((prep, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                <div className="p-2 bg-red-50 text-red-500 rounded-xl shrink-0">
                                    <ClipboardList size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-black text-slate-800 truncate leading-tight">{prep.title}</h4>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{prep.desc}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#FF7A00] rounded-full" style={{ width: `${prep.progress}%` }}></div>
                                        </div>
                                        <span className="text-[8px] font-bold text-slate-500">{prep.progress}%</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        // Try to find if activeTests matches
                                        const actual = activeTests[0];
                                        if (actual) {
                                            navigate(`/dashboard/attempt/${actual.testId}`);
                                        } else {
                                            navigate('/dashboard/tests');
                                        }
                                    }}
                                    className="px-2.5 py-1.5 bg-[#0B1E43] hover:bg-[#1D64D0] text-white text-[9px] font-bold uppercase rounded-lg shadow-sm shrink-0 flex items-center gap-1 transition-all"
                                >
                                    <PlayCircle size={10} className="fill-white/10" />
                                    <span>Resume</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Test Activity */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between"
                >
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-800">Recent Test Activity</h3>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Your recent test performance</p>
                        </div>
                        <button onClick={() => navigate('/dashboard/results')} className="text-[10px] font-bold text-[#1D64D0] hover:underline">View All</button>
                    </div>

                    <div className="space-y-3">
                        {getRecentActivityData(targetExam).map((act, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent transition-all">
                                <div className="min-w-0">
                                    <h4 className="text-xs font-black text-slate-800 truncate leading-tight">{act.title}</h4>
                                    <p className="text-[8px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{act.detail}</p>
                                </div>
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-bold uppercase rounded-md shrink-0 border border-emerald-100">
                                    Completed
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Quick Access & Gold Promo */}
                <motion.div
                    variants={itemVariants}
                    className="space-y-4"
                >
                    {/* Quick Access Icons */}
                    <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 mb-4">Quick Access</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Test Series', path: '/dashboard/market', icon: <Layers size={16} />, color: 'text-orange-500 bg-orange-50' },
                                { label: 'PYQs', path: '/dashboard/pyqs', icon: <BookMarked size={16} />, color: 'text-emerald-500 bg-emerald-50' },
                                { label: 'Books', path: '/dashboard/resources', icon: <BookOpen size={16} />, color: 'text-blue-500 bg-blue-50' },
                                { label: 'Results', path: '/dashboard/results', icon: <Award size={16} />, color: 'text-purple-500 bg-purple-50' },
                                { label: 'Leaderboard', path: '/dashboard/analytics', icon: <Trophy size={16} />, color: 'text-yellow-500 bg-yellow-50' },
                                { label: 'Bookmarks', path: '/dashboard/bookmarks', icon: <Bookmark size={16} />, color: 'text-pink-500 bg-pink-50' }
                            ].map((btn, index) => (
                                <button
                                    key={index}
                                    onClick={() => navigate(btn.path)}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100/80 hover:border-slate-200 hover:bg-slate-50 transition-all text-center gap-1.5 cursor-pointer"
                                >
                                    <div className={`p-2 rounded-lg ${btn.color}`}>
                                        {btn.icon}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 tracking-tight">{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Promo Card */}
                    <div className="p-4 bg-gradient-to-r from-[#0B1E43] to-[#1D64D0] text-white border border-slate-800 rounded-2xl shadow-sm relative overflow-hidden flex items-center justify-between">
                        <div className="absolute right-0 bottom-0 top-0 opacity-15 pointer-events-none flex items-center">
                            <Crown size={96} className="text-white transform translate-x-8 translate-y-2" />
                        </div>
                        <div className="relative z-10 max-w-[65%]">
                            <h4 className="text-xs font-black tracking-tight">Examinantt Gold Test Series</h4>
                            <p className="text-[9px] text-slate-300 font-semibold mt-1 leading-snug">
                                Premium mocks. Detailed analysis. Top ranks. Your success.
                            </p>
                            <button
                                onClick={() => navigate('/dashboard/market')}
                                className="mt-3 px-3 py-1.5 bg-[#FF7A00] hover:bg-[#FF8B1F] text-white font-bold text-[9px] uppercase tracking-wider rounded-lg shadow-md transition-all"
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

            {/* Horizontal Footer Values Bar */}
            <motion.div
                variants={itemVariants}
                className="bg-[#FFF9F2] border border-[#FFE2C2] rounded-2xl p-4 shadow-sm"
            >
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-[#FFE2C2]/60">
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
                                <span className="text-xs font-black text-slate-800 leading-none">{feat.label}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 mt-1">{feat.desc}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default StudentDashboard;

