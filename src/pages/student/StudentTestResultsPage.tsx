import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Award, BarChart3, ArrowRight, BookOpen, Target, Zap } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface TestAttempt {
    id: string;
    testTitle: string;
    score: number;
    totalQuestions: number;
    maxScore: number;
    correctAnswers: number;
    attemptDate: any;
    duration?: number;
}

const StudentTestResultsPage = () => {
    const navigate = useNavigate();
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;

    const [attempts, setAttempts] = useState<TestAttempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        totalTimeSpent: 0
    });

    useEffect(() => {
        const fetchAttempts = async () => {
            if (!currentUser) return;

            try {
                const attemptsRef = collection(db, 'users', currentUser.uid, 'attempts');
                const q = query(attemptsRef, orderBy('attemptDate', 'desc'), limit(50));
                const snapshot = await getDocs(q);

                const fetchedAttempts = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const totalQs = (data.totalQuestions ?? (data.correctCount + data.wrongCount + data.unattemptedCount)) || 0;
                    const maxScore = data.totalMarks ?? (totalQs * 4);
                    
                    return {
                        id: doc.id,
                        testTitle: data.testTitle || data.testName || 'Unknown Test',
                        score: data.score || 0,
                        totalQuestions: totalQs,
                        maxScore: maxScore,
                        correctAnswers: data.correctAnswers ?? data.correctCount ?? 0,
                        attemptDate: data.attemptDate,
                        duration: data.duration ?? data.timeTakenSeconds ?? 0
                    };
                }) as TestAttempt[];

                setAttempts(fetchedAttempts);

                // Calculate statistics
                if (fetchedAttempts.length > 0) {
                    const totalScore = fetchedAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
                    const bestScore = Math.max(...fetchedAttempts.map(a => a.score));
                    const totalTime = fetchedAttempts.reduce((sum, attempt) => sum + (attempt.duration || 0), 0);

                    setStats({
                        totalAttempts: fetchedAttempts.length,
                        averageScore: Math.round(totalScore / fetchedAttempts.length),
                        bestScore: bestScore,
                        totalTimeSpent: totalTime
                    });
                }
            } catch (error) {
                console.error('Error fetching attempts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttempts();
    }, [currentUser]);

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getScoreColor = (score: number, total: number) => {
        const percentage = total > 0 ? (score / total) * 100 : 0;
        if (percentage >= 80) return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
        if (percentage >= 60) return 'text-[#38BDF8] bg-blue-500/10 border border-blue-500/20';
        if (percentage >= 40) return 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
        return 'text-rose-400 bg-rose-500/10 border border-rose-500/20';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#38BDF8]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="pb-6 border-b border-[#17274B]">
                <h1 className="text-3xl font-black text-white tracking-tight">Test Results & History</h1>
                <p className="text-slate-400 font-medium text-sm mt-1">Track your performance and progress over time</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0B152B] border border-[#17274B] rounded-3xl p-6 text-white shadow-lg shadow-black/20 hover:border-[#38BDF8]/40 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Tests</p>
                            <h3 className="text-3xl font-black mt-2 text-white">{stats.totalAttempts}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#38BDF8] flex items-center justify-center">
                            <BookOpen size={24} />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#0B152B] border border-[#17274B] rounded-3xl p-6 text-white shadow-lg shadow-black/20 hover:border-emerald-500/40 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Average Score</p>
                            <h3 className="text-3xl font-black mt-2 text-emerald-400">{stats.averageScore}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#0B152B] border border-[#17274B] rounded-3xl p-6 text-white shadow-lg shadow-black/20 hover:border-purple-500/40 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Best Score</p>
                            <h3 className="text-3xl font-black mt-2 text-purple-400">{stats.bestScore}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                            <Award size={24} />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#0B152B] border border-[#17274B] rounded-3xl p-6 text-white shadow-lg shadow-black/20 hover:border-amber-500/40 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Time Spent</p>
                            <h3 className="text-2xl font-black mt-2 text-amber-400">{formatDuration(stats.totalTimeSpent)}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                            <Clock size={24} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Results Table */}
            <div className="bg-[#0B152B] rounded-3xl border border-[#17274B] shadow-lg shadow-black/20 overflow-hidden">
                <div className="p-6 border-b border-[#17274B]">
                    <h2 className="text-xl font-black text-white tracking-tight">Test History</h2>
                </div>

                {attempts.length === 0 ? (
                    <div className="p-16 text-center">
                        <BarChart3 className="mx-auto text-slate-500 mb-4" size={56} />
                        <h3 className="text-lg font-black text-white mb-2 tracking-tight">No tests attempted yet</h3>
                        <p className="text-slate-400 text-sm mb-6">Start your first test to see results here</p>
                        <button
                            onClick={() => navigate('/dashboard/market')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                        >
                            <Target size={18} />
                            Browse Tests
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#070D1E] text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-[#17274B]">
                                <tr>
                                    <th className="px-6 py-4 text-left">Test Name</th>
                                    <th className="px-6 py-4 text-left">Date & Time</th>
                                    <th className="px-6 py-4 text-center">Score</th>
                                    <th className="px-6 py-4 text-center">Correct</th>
                                    <th className="px-6 py-4 text-center">Accuracy</th>
                                    <th className="px-6 py-4 text-center">Duration</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#17274B]">
                                {attempts.map((attempt) => {
                                    const maxScore = attempt.maxScore;
                                    const accuracy = attempt.totalQuestions > 0 ? ((attempt.correctAnswers / attempt.totalQuestions) * 100).toFixed(1) : '0.0';

                                    return (
                                        <tr key={attempt.id} className="hover:bg-[#10224A]/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white text-sm">{attempt.testTitle}</div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-400">
                                                {formatDate(attempt.attemptDate)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <span className={`px-3 py-1 rounded-full font-bold text-xs ${getScoreColor(attempt.score, maxScore)}`}>
                                                        {attempt.score} / {maxScore}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold text-xs text-emerald-400">
                                                    {attempt.correctAnswers}/{attempt.totalQuestions}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold text-xs text-[#38BDF8]">{accuracy}%</span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs font-medium text-slate-400">
                                                {attempt.duration ? formatDuration(attempt.duration) : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10224A] hover:bg-blue-600 text-slate-200 hover:text-white border border-[#1E3A75] hover:border-transparent text-xs font-bold transition-all cursor-pointer"
                                                    onClick={() => navigate(`/dashboard/results/${attempt.id}`)}
                                                >
                                                    View Details
                                                    <ArrowRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            {attempts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => navigate('/dashboard/analytics')}
                        className="p-6 bg-[#0B152B] border border-[#17274B] hover:border-purple-500/40 rounded-3xl transition-all group text-left cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <BarChart3 size={24} />
                        </div>
                        <h3 className="font-black text-white mb-1">View Analytics</h3>
                        <p className="text-xs font-medium text-slate-400">Detailed performance insights & subject breakdown</p>
                    </button>

                    <button
                        onClick={() => navigate('/dashboard/tests')}
                        className="p-6 bg-[#0B152B] border border-[#17274B] hover:border-[#38BDF8]/40 rounded-3xl transition-all group text-left cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#38BDF8] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Zap size={24} />
                        </div>
                        <h3 className="font-black text-white mb-1">Practice More</h3>
                        <p className="text-xs font-medium text-slate-400">Continue improving your score and speed</p>
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-6 bg-[#0B152B] border border-[#17274B] hover:border-emerald-500/40 rounded-3xl transition-all group text-left cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Target size={24} />
                        </div>
                        <h3 className="font-black text-white mb-1">Dashboard</h3>
                        <p className="text-xs font-medium text-slate-400">View overall study streak and goals</p>
                    </button>
                </div>
            )}
        </div>
    );
};

export default StudentTestResultsPage;
