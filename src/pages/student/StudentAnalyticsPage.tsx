import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Calendar, Award, Target, BookOpen, TrendingUp, ArrowRight, Sparkles, Filter, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar
} from 'recharts';

interface Attempt {
    id: string;
    testTitle: string;
    score: number;
    totalQuestions: number;
    attemptDate: any;
    duration?: number;
    attemptedQuestions?: number;
}

const StudentAnalyticsPage = () => {
    const navigate = useNavigate();
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [stats, setStats] = useState({
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        timeEfficiency: '--'
    });

    useEffect(() => {
        if (currentUser) {
            const q = query(collection(db, 'users', currentUser.uid, 'attempts'), orderBy('attemptDate', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedAttempts = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const totalQs = data.totalQuestions || (data.correctCount + data.wrongCount + data.unattemptedCount) || 0;
                    const maxScore = data.totalMarks || (totalQs * 4) || 1;
                    
                    return {
                        id: doc.id,
                        testTitle: data.testTitle || data.testName || 'Unknown Test',
                        score: data.score || 0,
                        totalQuestions: totalQs,
                        maxScore: maxScore,
                        attemptDate: data.attemptDate,
                        duration: data.duration || data.timeTakenSeconds || 0,
                        attemptedQuestions: data.attemptedQuestions || (data.correctCount + data.wrongCount) || 0,
                        sectionWiseScore: data.sectionWiseScore || {}
                    };
                }) as any[];

                setAttempts(fetchedAttempts);

                if (fetchedAttempts.length > 0) {
                    const total = fetchedAttempts.length;
                    const totalScorePercentage = fetchedAttempts.reduce((acc, curr) => {
                        return acc + ((curr.score / curr.maxScore) * 100);
                    }, 0);

                    const avg = totalScorePercentage / total;
                    const best = Math.max(...fetchedAttempts.map(a => (a.score / a.maxScore) * 100));

                    let totalTime = 0;
                    let totalAttempted = 0;
                    fetchedAttempts.forEach(a => {
                        totalTime += a.duration;
                        totalAttempted += a.attemptedQuestions;
                    });

                    let timeEffStr = '--';
                    if (totalAttempted > 0) {
                        const avgSecondsPerQ = totalTime / totalAttempted;
                        if (avgSecondsPerQ < 60) {
                            timeEffStr = `${Math.round(avgSecondsPerQ)}s/q`;
                        } else {
                            const m = Math.floor(avgSecondsPerQ / 60);
                            const s = Math.round(avgSecondsPerQ % 60);
                            timeEffStr = `${m}m ${s}s/q`;
                        }
                    }

                    setStats({
                        totalTests: total,
                        averageScore: Math.round(avg),
                        bestScore: Math.round(best),
                        timeEfficiency: timeEffStr
                    });
                }
            });
            return () => unsubscribe();
        }
    }, [currentUser]);

    const chartData = [...attempts].reverse().map(attempt => ({
        name: attempt.testTitle.substring(0, 10),
        score: Math.round((attempt.score / (attempt as any).maxScore) * 100),
        date: attempt.attemptDate?.toDate ? attempt.attemptDate.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''
    }));

    const subjectDataMap: Record<string, { totalScore: number; maxScore: number }> = {};
    attempts.forEach(a => {
        const sections = (a as any).sectionWiseScore || {};
        Object.entries(sections).forEach(([subject, data]: [string, any]) => {
            if (!subjectDataMap[subject]) subjectDataMap[subject] = { totalScore: 0, maxScore: 0 };
            subjectDataMap[subject].totalScore += (typeof data === 'number' ? data : (data?.score || 0));
            subjectDataMap[subject].maxScore += 100;
        });
    });

    const masteryData = Object.entries(subjectDataMap).map(([subject, data]) => ({
        subject: subject || 'General',
        A: attempts.length > 0 ? Math.round((data.totalScore / (attempts.length * 100)) * 100) : 0,
        fullMark: 100
    }));

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            className="max-w-7xl mx-auto space-y-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <TrendingUp size={20} className="fill-blue-600" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Live Analytics</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Performance Tracker</h1>
                    <p className="text-slate-500 font-medium">Deep insights into your learning progress and mastery.</p>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 shadow-sm hover:shadow-xl transition-all"
                >
                    <Download size={16} />
                    Download Report
                </button>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Tests Taken', value: stats.totalTests, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Average Score', value: `${stats.averageScore}%`, icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Best Score', value: `${stats.bestScore}%`, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Speed Efficiency', value: stats.timeEfficiency, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((stat, i) => (
                    <motion.div key={i} variants={itemVariants} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500">
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white`}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Score Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                Performance Trend
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">Growth trajectory over the last sessions.</p>
                        </div>
                        <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Percentage (%)
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        {attempts.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }}
                                        dy={15}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{ 
                                            borderRadius: '24px', 
                                            border: 'none', 
                                            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                                            padding: '16px 24px',
                                            fontWeight: '800',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#2563eb"
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                        strokeWidth={4}
                                        dot={{ fill: '#2563eb', strokeWidth: 3, r: 5, stroke: '#fff' }}
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                        animationDuration={2000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
                                <Sparkles size={40} className="mb-4 opacity-20" />
                                <p className="font-bold text-sm">Insufficient data to generate trend</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Subject Mastery Radar */}
                <motion.div variants={itemVariants} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                    <div className="space-y-1 mb-10">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Subject Mastery
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Competency mapping across domains.</p>
                    </div>
                    <div className="h-80 w-full flex items-center justify-center">
                        {masteryData.length >= 3 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={masteryData}>
                                    <PolarGrid stroke="#F1F5F9" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 800 }} />
                                    <Radar
                                        name="Proficiency"
                                        dataKey="A"
                                        stroke="#2563eb"
                                        fill="#2563eb"
                                        fillOpacity={0.15}
                                        strokeWidth={3}
                                        animationDuration={2500}
                                    />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center p-8 space-y-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                                    <Target size={32} />
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed font-bold uppercase tracking-widest">
                                    Attempt more tests to unlock radar analytics.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Recent Activity Table */}
            <motion.div variants={itemVariants} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Attempt History</h3>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        <Filter size={14} /> 
                        Most Recent
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-10 py-6">Module Name</th>
                                <th className="px-10 py-6">Date</th>
                                <th className="px-10 py-6 text-center">Outcome</th>
                                <th className="px-10 py-6 text-center">Score</th>
                                <th className="px-10 py-6 text-center">Time</th>
                                <th className="px-10 py-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {attempts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-10 py-20 text-center">
                                        <div className="max-w-xs mx-auto">
                                            <TrendingUp size={48} className="mx-auto text-slate-100 mb-6" />
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Your journey starts here. Take a test to see results.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                attempts.map((attempt) => {
                                    const perc = Math.round((attempt.score / (attempt as any).maxScore) * 100);
                                    return (
                                        <tr key={attempt.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                                            <td className="px-10 py-6">
                                                <div className="font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                                                    {attempt.testTitle}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="text-xs text-slate-400 font-black flex items-center gap-2 uppercase tracking-widest">
                                                    <Calendar size={14} className="text-slate-300" />
                                                    {attempt.attemptDate?.toDate ? attempt.attemptDate.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${perc >= 60 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                    {perc >= 60 ? 'Qualified' : 'Incomplete'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <div className="text-base font-black text-slate-900 tracking-tighter">
                                                    {perc}%
                                                    <span className="block text-[10px] text-slate-400 font-bold mt-0.5 tracking-normal opacity-50">{attempt.score}/{(attempt as any).maxScore}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <div className="text-xs font-black text-slate-500">
                                                    {attempt.duration ? `${Math.round(attempt.duration / 60)}m` : '--'}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <button 
                                                    onClick={() => navigate(`/dashboard/results/${attempt.id}`)}
                                                    className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all ml-auto"
                                                >
                                                    <ArrowRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <style>{`
                @media print {
                    @page { margin: 15mm; size: A4 landscape; }
                    body { background: white !important; -webkit-print-color-adjust: exact; }
                    .print\\:hidden, aside, nav, button { display: none !important; }
                    .bg-white { background-color: white !important; }
                    .border { border: 1px solid #e2e8f0 !important; }
                    .shadow-sm { box-shadow: none !important; }
                    .grid { gap: 1rem !important; }
                    .lg\\:col-span-2 { width: 100% !important; }
                }
            `}</style>
        </motion.div>
    );
};

export default StudentAnalyticsPage;
