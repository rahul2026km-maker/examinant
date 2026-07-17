import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Clock,
    Calendar,
    Award,
    Target,
    BookOpen,
    TrendingUp,
    ArrowRight,
    Download,
    Flame,
    Zap,
    Eye,
    Timer,
    AlertCircle,
    Loader2,
    Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import {
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
    LineChart,
    Line,
    BarChart,
    Bar,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface Attempt {
    id: string;
    testTitle: string;
    score: number;
    totalQuestions: number;
    attemptDate: any;
    duration?: number;
    attemptedQuestions?: number;
    maxScore: number;
    sectionWiseScore?: Record<string, any>;
}

type TabType = 'overall' | 'accuracy' | 'speed' | 'time' | 'consistency' | 'score' | 'compare';

const StudentAnalyticsPage = () => {
    const navigate = useNavigate();
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') as TabType;
    const activeTab = tabParam || 'overall';
    const setActiveTab = (tab: TabType) => {
        setSearchParams({ tab });
    };
    const [isLoading, setIsLoading] = useState(true);

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
                }) as Attempt[];

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
                        totalTime += a.duration || 0;
                        totalAttempted += a.attemptedQuestions || 0;
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
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setIsLoading(false);
        }
    }, [currentUser]);

    // ==========================================
    // DYNAMIC STATS GENERATORS FROM ATTEMPTS
    // ==========================================
    const hasData = attempts.length > 0;
    const dynamicAvgScore = hasData ? stats.averageScore : 65;
    const dynamicBestScore = hasData ? stats.bestScore : 87;
    const dynamicTotalTests = hasData ? attempts.length : 12;

    const parseAttemptDate = (dateVal: any): Date | null => {
        if (!dateVal) return null;
        if (typeof dateVal.toDate === 'function') {
            try {
                return dateVal.toDate();
            } catch (e) {
                console.error(e);
            }
        }
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? null : d;
    };

    // 1. Calculate subject-wise accuracy and scores dynamically
    const parsedSubjectStats: Record<string, { totalScore: number; maxScore: number; totalTime: number; count: number }> = {};
    attempts.forEach(a => {
        const sections = a.sectionWiseScore || {};
        Object.entries(sections).forEach(([subj, data]: [string, any]) => {
            if (!parsedSubjectStats[subj]) {
                parsedSubjectStats[subj] = { totalScore: 0, maxScore: 0, totalTime: 0, count: 0 };
            }
            parsedSubjectStats[subj].totalScore += (data.score || 0);
            parsedSubjectStats[subj].maxScore += (data.maxScore || 100);
            parsedSubjectStats[subj].totalTime += (data.timeSpent || 0);
            parsedSubjectStats[subj].count++;
        });
    });

    const getSubjectValue = (subject: string) => {
        if (parsedSubjectStats[subject] && parsedSubjectStats[subject].maxScore > 0) {
            return Math.round((parsedSubjectStats[subject].totalScore / parsedSubjectStats[subject].maxScore) * 100);
        }
        // Fallback proportionate to user's overall average
        const multipliers: Record<string, number> = {
            'Quantitative Aptitude': 0.95,
            'Reasoning': 1.1,
            'Reasoning Ability': 1.1,
            'English Language': 1.05,
            'General Awareness': 0.85,
            'Computer Awareness': 0.9,
        };
        const mult = multipliers[subject] || 1.0;
        return Math.min(Math.round(dynamicAvgScore * mult), 98);
    };

    // 2. Generate Radar Data dynamically
    const radarData = [
        { subject: 'Quantitative Aptitude', value: getSubjectValue('Quantitative Aptitude'), top10: Math.min(getSubjectValue('Quantitative Aptitude') + 15, 96) },
        { subject: 'Reasoning', value: getSubjectValue('Reasoning'), top10: Math.min(getSubjectValue('Reasoning') + 12, 98) },
        { subject: 'English Language', value: getSubjectValue('English Language'), top10: Math.min(getSubjectValue('English Language') + 14, 94) },
        { subject: 'General Awareness', value: getSubjectValue('General Awareness'), top10: Math.min(getSubjectValue('General Awareness') + 18, 90) },
        { subject: 'Computer Awareness', value: getSubjectValue('Computer Awareness'), top10: Math.min(getSubjectValue('Computer Awareness') + 14, 92) },
    ];

    // 3. Generate Score/Performance Trend Data dynamically
    const overallTrendData = hasData 
        ? [...attempts].slice(0, 6).reverse().map((a, idx) => ({
            name: `Test ${idx + 1}`,
            Score: Math.round((a.score / a.maxScore) * 100)
          }))
        : [
            { name: 'Test 1', Score: 54 },
            { name: 'Test 2', Score: 58 },
            { name: 'Test 3', Score: 62 },
            { name: 'Test 4', Score: 63 },
            { name: 'Test 5', Score: 66 },
            { name: 'Test 6', Score: 67 },
          ];

    const accuracyTrendData = hasData
        ? [...attempts].slice(0, 11).reverse().map((a, idx) => {
            const aDate = parseAttemptDate(a.attemptDate);
            const dateStr = aDate 
                ? aDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) 
                : `T${idx+1}`;
            const acc = Math.min(Math.round((a.score / a.maxScore) * 105), 100);
            return {
                name: dateStr,
                Accuracy: acc,
                top10: Math.min(acc + 15, 96)
            };
          })
        : [
            { name: '24 Apr', Accuracy: 42, top10: 72 },
            { name: '27 Apr', Accuracy: 45, top10: 74 },
            { name: '30 Apr', Accuracy: 48, top10: 76 },
            { name: '03 May', Accuracy: 52, top10: 77 },
            { name: '05 May', Accuracy: 55, top10: 78 },
            { name: '09 May', Accuracy: 58, top10: 79 },
            { name: '12 May', Accuracy: 60, top10: 81 },
            { name: '15 May', Accuracy: 62, top10: 82 },
            { name: '18 May', Accuracy: 63, top10: 83 },
            { name: '21 May', Accuracy: 65, top10: 84 },
            { name: '24 May', Accuracy: 67, top10: 85 },
          ];

    const accuracyDistributionData = [
        { name: '80% and above', value: hasData ? Math.round(attempts.length * 0.2) : 198, color: '#3A907C' },
        { name: '60% - 79%', value: hasData ? Math.round(attempts.length * 0.4) : 456, color: '#1D64D0' },
        { name: '40% - 59%', value: hasData ? Math.round(attempts.length * 0.3) : 384, color: '#FBBF24' },
        { name: 'Below 40%', value: hasData ? Math.round(attempts.length * 0.1) : 210, color: '#EF4444' }
    ];

    const speedSubjectData = [
        { subject: 'Quantitative Aptitude', You: 62, Overall: 48 },
        { subject: 'Reasoning', You: 45, Overall: 38 },
        { subject: 'English Language', You: 37, Overall: 31 },
        { subject: 'General Awareness', You: 35, Overall: 30 },
        { subject: 'Computer Awareness', You: 33, Overall: 28 },
    ];

    const speedDistributionData = [
        { name: 'Fast (< 30s)', value: 248, color: '#3A907C' },
        { name: 'Optimal (30-60s)', value: 718, color: '#1D64D0' },
        { name: 'Slow (60-90s)', value: 202, color: '#FBBF24' },
        { name: 'Very Slow (> 90s)', value: 80, color: '#EF4444' }
    ];

    const timeUtilTrendData = hasData
        ? [...attempts].slice(0, 10).reverse().map((a, idx) => ({
            name: `Test ${idx + 1}`,
            You: Math.min(Math.round(((a.duration || 0) / (a.totalQuestions * 60)) * 150), 98), // approximate utilization
            top10: 96
          }))
        : [
            { name: 'Test 1', You: 82, top10: 90 },
            { name: 'Test 2', You: 87, top10: 92 },
            { name: 'Test 3', You: 85, top10: 88 },
            { name: 'Test 4', You: 96, top10: 96 },
            { name: 'Test 5', You: 97, top10: 97 },
            { name: 'Test 6', You: 96, top10: 96 },
            { name: 'Test 7', You: 97, top10: 97 },
            { name: 'Test 8', You: 97, top10: 97 },
          ];

    const timeDistributionData = [
        { name: 'On Time (Ideal)', value: 563, color: '#3A907C' },
        { name: 'Over Time', value: 461, color: '#EF4444' },
        { name: 'Under Time', value: 184, color: '#FBBF24' },
        { name: 'Not Attempted', value: 40, color: '#94A3B8' }
    ];

    const getCalendarColorForDay = (dateOffset: number) => {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - dateOffset);
        
        const match = attempts.find(a => {
            const aDate = parseAttemptDate(a.attemptDate);
            if (!aDate) return false;
            return aDate.getFullYear() === targetDate.getFullYear() &&
                   aDate.getMonth() === targetDate.getMonth() &&
                   aDate.getDate() === targetDate.getDate();
        });

        if (!match) return '#E2E8F0';
        const durationMin = (match.duration || 0) / 60;
        if (durationMin >= 90) return '#3A907C';
        if (durationMin >= 60) return '#1D64D0';
        if (durationMin >= 30) return '#FBBF24';
        return '#EF4444';
    };

    const dynamicConsistencyCalendar: Array<{label: string, days: string[]}> = [];
    // Build 5 weeks backwards
    for (let w = 4; w >= 0; w--) {
        const weekDaysColors: string[] = [];
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
        const weekStartDate = new Date(startOfWeek);
        weekStartDate.setDate(weekStartDate.getDate() - (w * 7));

        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);

        const label = `${weekStartDate.getDate()} ${weekStartDate.toLocaleDateString(undefined, {month:'short'})} - ${weekEndDate.getDate()} ${weekEndDate.toLocaleDateString(undefined, {month:'short'})}`;

        for (let d = 0; d < 7; d++) {
            const dayDate = new Date(weekStartDate);
            dayDate.setDate(dayDate.getDate() + d);
            
            const diffTime = Math.abs(new Date().getTime() - dayDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            weekDaysColors.push(getCalendarColorForDay(diffDays));
        }
        dynamicConsistencyCalendar.push({ label, days: weekDaysColors });
    }

    const calculateStreak = () => {
        if (!hasData) return 0;
        let streak = 0;
        let checkDate = new Date();
        let safetyCounter = 0;
        
        while (safetyCounter < 365) {
            safetyCounter++;
            const hasAttempt = attempts.some(a => {
                const aDate = parseAttemptDate(a.attemptDate);
                if (!aDate) return false;
                return aDate.getFullYear() === checkDate.getFullYear() &&
                       aDate.getMonth() === checkDate.getMonth() &&
                       aDate.getDate() === checkDate.getDate();
            });
            
            if (hasAttempt) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                if (streak === 0) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    const hasYesterday = attempts.some(a => {
                        const aDate = parseAttemptDate(a.attemptDate);
                        if (!aDate) return false;
                        return aDate.getFullYear() === checkDate.getFullYear() &&
                               aDate.getMonth() === checkDate.getMonth() &&
                               aDate.getDate() === checkDate.getDate();
                    });
                    if (hasYesterday) {
                        streak = 1;
                        checkDate.setDate(checkDate.getDate() - 1);
                        continue;
                    }
                }
                break;
            }
        }
        return streak;
    };

    const dynamicStreak = calculateStreak();
    const consistencyCalendarWeeks = dynamicConsistencyCalendar;

    const consistencyTrendData = [
        { name: '24 Apr', You: 62, top10: 82 },
        { name: '27 Apr', You: 65, top10: 83 },
        { name: '30 Apr', You: 66, top10: 84 },
        { name: '03 May', You: 68, top10: 84 },
        { name: '06 May', You: 70, top10: 85 },
        { name: '09 May', You: 72, top10: 86 },
        { name: '12 May', You: 74, top10: 87 },
        { name: '15 May', You: 76, top10: 88 },
        { name: '18 May', You: 78, top10: 89 },
        { name: '21 May', You: 79, top10: 89 },
        { name: '24 May', You: 78, top10: 89 },
    ];

    const consistencyBreakdownData = [
        { name: 'Highly Consistent (≥ 60 min)', value: 14, color: '#3A907C' },
        { name: 'Moderate (30-60 min)', value: 6, color: '#FBBF24' },
        { name: 'Low (< 30 min)', value: 3, color: '#EF4444' },
        { name: 'No Activity', value: 7, color: '#94A3B8' }
    ];

    const scoreTrendData = [
        { name: 'Test 1', You: 42, top10: 72 },
        { name: 'Test 2', You: 48, top10: 74 },
        { name: 'Test 3', You: 52, top10: 76 },
        { name: 'Test 4', You: 55, top10: 78 },
        { name: 'Test 5', You: 58, top10: 79 },
        { name: 'Test 6', You: 60, top10: 81 },
        { name: 'Test 7', You: 62, top10: 82 },
        { name: 'Test 8', You: 63, top10: 84 },
        { name: 'Test 9', You: 65, top10: 85 },
        { name: 'Test 10', You: 67, top10: 86 },
        { name: 'Test 11', You: 70, top10: 87 },
        { name: 'Test 12', You: 65, top10: 88 },
    ];

    const scoreSubjectData = [
        { subject: 'Quantitative Aptitude', You: 62.5, top10: 82.1, color: 'bg-blue-500' },
        { subject: 'Reasoning Ability', You: 68.3, top10: 86.4, color: 'bg-indigo-500' },
        { subject: 'English Language', You: 71.6, top10: 84.0, color: 'bg-emerald-500' },
        { subject: 'General Awareness', You: 58.2, top10: 76.5, color: 'bg-amber-500' },
        { subject: 'Computer Awareness', You: 64.7, top10: 81.3, color: 'bg-purple-500' },
    ];

    const scoreDistributionData = [
        { name: '80% and above', value: 2, color: '#3A907C' },
        { name: '60% - 79%', value: 5, color: '#1D64D0' },
        { name: '40% - 59%', value: 3, color: '#FBBF24' },
        { name: 'Below 40%', value: 1, color: '#EF4444' },
        { name: 'Not Attempted', value: 1, color: '#94A3B8' }
    ];

    const scoreCompare = [
        { category: 'Top 10% Students', value: 85.6 },
        { category: 'Top 25% Students', value: 73.2 },
        { category: 'Top 50% Students', value: 61.4 },
        { category: 'Your Score', value: 82.4, isYou: true },
        { category: 'Bottom 50% Students', value: 45.1 },
    ];

    const accuracyCompare = [
        { category: 'Top 10% Students', value: 88.9 },
        { category: 'Top 25% Students', value: 76.6 },
        { category: 'Top 50% Students', value: 64.2 },
        { category: 'Your Accuracy', value: 78.6, isYou: true },
        { category: 'Bottom 50% Students', value: 49.3 },
    ];

    const speedCompare = [
        { category: 'Top 10% Students', value: 38 },
        { category: 'Top 25% Students', value: 46 },
        { category: 'Top 50% Students', value: 58 },
        { category: 'Your Speed', value: 48, isYou: true },
        { category: 'Bottom 50% Students', value: 72 },
    ];

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-[#0B1E43]" size={40} />
            </div>
        );
    }

    if (attempts.length === 0) {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col items-center justify-center bg-white p-12 border border-slate-100 rounded-2xl shadow-sm text-center">
                    <div className="p-4 bg-blue-50 text-[#0B1E43] rounded-full mb-4">
                        <TrendingUp size={48} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Performance Analytics Yet</h3>
                    <p className="text-slate-500 text-sm max-w-md mb-6">
                        Once you start attempting mock tests and OMR practice, detailed analytics of your scores, speed, accuracy, and consistency will appear here.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard/market')}
                        className="px-6 py-3 bg-[#0B1E43] hover:bg-[#1D64D0] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                    >
                        Explore Test Series
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                        {activeTab === 'overall' && 'Performance Radar'}
                        {activeTab === 'accuracy' && 'Accuracy Trend'}
                        {activeTab === 'speed' && 'Speed Analysis'}
                        {activeTab === 'time' && 'Time Management Analysis'}
                        {activeTab === 'consistency' && 'Consistency'}
                        {activeTab === 'score' && 'Scoreboard'}
                        {activeTab === 'compare' && 'Competitive Analysis'}
                    </h1>
                    <p className="text-slate-400 font-medium text-xs mt-1">
                        {activeTab === 'overall' && 'Visualize your strengths and improvement areas across subjects.'}
                        {activeTab === 'accuracy' && 'Track your accuracy improvement over time across subjects and tests.'}
                        {activeTab === 'speed' && 'Analyze your solving speed and time management across subjects and tests.'}
                        {activeTab === 'time' && 'Understand how you spend time in tests and how you can optimize it.'}
                        {activeTab === 'consistency' && 'Track your practice consistency and build winning habits.'}
                        {activeTab === 'score' && 'Your overall performance snapshot across tests, subjects and topics.'}
                        {activeTab === 'compare' && 'See how you perform compared to other students.'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 border border-slate-100 rounded-xl shadow-sm">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Target Exam</span>
                        <span className="text-xs font-black text-[#0B1E43]">{localStorage.getItem('selectedTargetExam') || 'SSC CGL Tier 1'}</span>
                    </div>
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1E43] hover:bg-[#1D64D0] rounded-xl text-[10px] font-black uppercase tracking-wider text-white shadow-sm transition-all"
                    >
                        <Download size={12} />
                        Download PDF
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'overall', label: 'Overall' },
                        { id: 'accuracy', label: 'Accuracy' },
                        { id: 'speed', label: 'Speed' },
                        { id: 'time', label: 'Time Management' },
                        { id: 'consistency', label: 'Consistency' },
                        { id: 'score', label: 'Score Board' },
                        { id: 'compare', label: 'Comparative Analysis' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                activeTab === tab.id
                                    ? 'bg-[#FF7A00] text-white shadow-sm shadow-[#FF7A00]/20'
                                    : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                    Last updated: Today, 08:30 AM
                </div>
            </div>

            <div className="space-y-6">
                
                {/* 1. OVERALL PERFORMANCE RADAR TAB */}
                {activeTab === 'overall' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* Performance Radar Plot */}
                            <div className="lg:col-span-8 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-slate-800">Overall Performance Radar</h3>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                                            <span>Your Performance</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 bg-orange-400 rounded-full"></div>
                                            <span>Top 10% Students</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="h-80 w-full flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                            <PolarGrid stroke="#F1F5F9" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 800 }} />
                                            <Radar name="Your Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2.5} />
                                            <Radar name="Top 10%" dataKey="top10" stroke="#FF7A00" fill="#FF7A00" fillOpacity={0.06} strokeWidth={2} />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Overall Snapshot & Insights */}
                            <div className="lg:col-span-4 grid grid-cols-1 gap-6">
                                {/* Overall Snapshot */}
                                <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4">
                                    <h3 className="text-sm font-black text-slate-800">Overall Snapshot</h3>
                                    <div className="space-y-3.5">
                                        {[
                                            { label: 'Average Accuracy', value: '67%', color: 'text-emerald-500', icon: <Target size={16} />, bg: 'bg-emerald-50' },
                                            { label: 'Average Score', value: '132 / 200', color: 'text-[#0B1E43]', icon: <Award size={16} />, bg: 'bg-blue-50' },
                                            { label: 'Average Time / Ques', value: '48 sec', color: 'text-sky-500', icon: <Clock size={16} />, bg: 'bg-sky-50' },
                                            { label: 'Tests Analyzed', value: '12', color: 'text-purple-500', icon: <BookOpen size={16} />, bg: 'bg-purple-50' },
                                            { label: 'Percentile', value: '68.4%', color: 'text-[#FF7A00]', icon: <TrendingUp size={16} />, bg: 'bg-orange-50' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                                                        {item.icon}
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-semibold">{item.label}</span>
                                                </div>
                                                <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Info & Subject Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Subject Wise Details */}
                            <div className="lg:col-span-8 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-5">
                                <h3 className="text-sm font-black text-slate-800">Subject-wise Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
                                    {[
                                        { subject: 'Quant', value: 68, score: '34/50', time: '62s', perc: '61%', badge: 'Needs Improvement', bColor: 'bg-orange-50 text-orange-500 border-orange-100' },
                                        { subject: 'Reasoning', value: 76, score: '38/50', time: '44s', perc: '72%', badge: 'Good', bColor: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                                        { subject: 'English', value: 72, score: '36/50', time: '45s', perc: '66%', badge: 'Good', bColor: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                                        { subject: 'GK', value: 58, score: '29/50', time: '50s', perc: '52%', badge: 'Needs Improvement', bColor: 'bg-orange-50 text-orange-500 border-orange-100' },
                                        { subject: 'Computer', value: 64, score: '32/50', time: '40s', perc: '58%', badge: 'Average', bColor: 'bg-amber-50 text-amber-500 border-amber-100' },
                                    ].map((sub, i) => (
                                        <div key={i} className="p-4 border border-slate-100 rounded-2xl flex flex-col justify-between space-y-3.5">
                                            <div className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{sub.subject}</div>
                                            <div>
                                                <div className="text-xl font-black text-slate-800">{sub.value}%</div>
                                                <div className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase">Accuracy</div>
                                            </div>
                                            <div className="text-[9px] font-semibold text-slate-500 space-y-1">
                                                <div className="flex justify-between"><span>Score</span><span className="font-bold">{sub.score}</span></div>
                                                <div className="flex justify-between"><span>Avg. Time</span><span className="font-bold">{sub.time}</span></div>
                                                <div className="flex justify-between"><span>Percentile</span><span className="font-bold">{sub.perc}</span></div>
                                            </div>
                                            <div className={`px-2 py-1 rounded-lg text-[8px] font-extrabold uppercase border text-center ${sub.bColor}`}>{sub.badge}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Performance Trend Chart */}
                            <div className="lg:col-span-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800">Performance Trend</h3>
                                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">Overall growth over tests</p>
                                    </div>
                                    <div className="px-2 py-1 bg-slate-50 rounded-lg text-[9px] font-bold text-slate-400">Overall</div>
                                </div>
                                <div className="h-36 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={overallTrendData}>
                                            <XAxis dataKey="name" fontSize={9} stroke="#94A3B8" tickLine={false} axisLine={false} />
                                            <YAxis fontSize={9} stroke="#94A3B8" tickLine={false} axisLine={false} domain={[0, 100]} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="Score" stroke="#0B1E43" strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <button 
                                    onClick={() => navigate('/dashboard/tests')}
                                    className="w-full mt-3 py-2 bg-[#0B1E43] hover:bg-[#1D64D0] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-1.5"
                                >
                                    <span>Practice Weak Areas</span>
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. ACCURACY TREND TAB */}
                {activeTab === 'accuracy' && (
                    <div className="space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { label: 'Overall Accuracy', value: '63%', desc: '↑ 9% vs last 30 days', icon: <Target size={16} />, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { label: 'Highest Accuracy', value: '78%', desc: 'In Reasoning', icon: <TrendingUp size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { label: 'Lowest Accuracy', value: '42%', desc: 'In Geometry (Quant)', icon: <AlertCircle size={16} />, color: 'text-red-500', bg: 'bg-red-50' },
                                { label: 'Total Tests', value: '12', desc: 'In last 30 days', icon: <BookOpen size={16} />, color: 'text-purple-500', bg: 'bg-purple-50' },
                                { label: 'Questions Solved', value: '1,248', desc: 'Avg. 104 per test', icon: <Flame size={16} />, color: 'text-[#FF7A00]', bg: 'bg-orange-50' },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
                                        <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>{item.icon}</div>
                                    </div>
                                    <div className="mt-3">
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tight">{item.value}</h4>
                                        <p className="text-[9px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Overall Accuracy Trend Line Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Line Chart */}
                            <div className="lg:col-span-8 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800">Overall Accuracy Trend</h3>
                                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">Growth curve vs toppers</p>
                                    </div>
                                    <select className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 outline-none">
                                        <option>Daily View</option>
                                        <option>Weekly View</option>
                                    </select>
                                </div>

                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={accuracyTrendData}>
                                            <XAxis dataKey="name" fontSize={9} stroke="#94A3B8" tickLine={false} />
                                            <YAxis fontSize={9} stroke="#94A3B8" tickLine={false} domain={[0, 100]} />
                                            <Tooltip />
                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: '800' }} />
                                            <Line name="Your Accuracy (%)" type="monotone" dataKey="Accuracy" stroke="#1D64D0" strokeWidth={3} dot={{ r: 4 }} />
                                            <Line name="Top 10% Students (%)" type="monotone" dataKey="top10" stroke="#FF7A00" strokeDasharray="3 3" strokeWidth={2} dot={{ r: 2 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Accuracy by Subject */}
                            <div className="lg:col-span-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-5 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Accuracy by Subject</h3>
                                <div className="space-y-4">
                                    {[
                                        { name: 'Quantitative Aptitude', value: 58, top: 82, color: 'bg-blue-500' },
                                        { name: 'Reasoning', value: 78, top: 88, color: 'bg-indigo-500' },
                                        { name: 'English Language', value: 62, top: 80, color: 'bg-emerald-500' },
                                        { name: 'General Awareness', value: 57, top: 76, color: 'bg-amber-500' },
                                        { name: 'Computer Awareness', value: 64, top: 78, color: 'bg-purple-500' },
                                    ].map((sub, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                                <span>{sub.name}</span>
                                                <span className="font-extrabold text-slate-800">{sub.value}% <span className="text-slate-400">/ {sub.top}%</span></span>
                                            </div>
                                            <div className="h-2 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                                <div className={`h-full ${sub.color} rounded-full`} style={{ width: `${sub.value}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all">
                                    View Subject Analysis
                                </button>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Accuracy Distribution */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Accuracy Distribution</h3>
                                <div className="h-44 flex items-center justify-center relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={accuracyDistributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={36}
                                                outerRadius={54}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {accuracyDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-lg font-black text-slate-800 leading-none">1,248</span>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Questions</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[8px] font-bold text-slate-500">
                                    {accuracyDistributionData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                                            <span className="truncate">{d.name} ({d.value})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Accuracy by Difficulty Level */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-5 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Accuracy by Difficulty</h3>
                                <div className="space-y-4">
                                    {[
                                        { level: 'Easy', value: 92, top: 92, gap: '-18%', color: 'bg-emerald-400' },
                                        { level: 'Moderate', value: 59, top: 80, gap: '-21%', color: 'bg-amber-400' },
                                        { level: 'Difficult', value: 41, top: 65, gap: '-24%', color: 'bg-red-400' },
                                    ].map((dif, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                                <span>{dif.level}</span>
                                                <span className="font-extrabold text-slate-800">{dif.value}% <span className="text-slate-400">/ {dif.top}%</span></span>
                                            </div>
                                            <div className="h-2 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                                <div className={`h-full ${dif.color} rounded-full`} style={{ width: `${dif.value}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-[9px] text-amber-700 font-semibold">
                                    ★ Focus on difficult questions to improve your overall accuracy.
                                </div>
                            </div>

                            {/* Recent Test Accuracy Table */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-slate-800">Recent Test Accuracy</h3>
                                    <button className="text-[10px] font-bold text-[#1D64D0] hover:underline">View All</button>
                                </div>
                                <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                                    {[
                                        { name: 'Mock Test 12', date: '24 May 2024', acc: '67%', change: '↑ 7%', color: 'text-emerald-500' },
                                        { name: 'Mock Test 11', date: '21 May 2024', acc: '60%', change: '↑ 5%', color: 'text-emerald-500' },
                                        { name: 'Mock Test 10', date: '18 May 2024', acc: '55%', change: '↑ 4%', color: 'text-emerald-500' },
                                        { name: 'Mock Test 9', date: '15 May 2024', acc: '51%', change: '↓ 2%', color: 'text-red-500' }
                                    ].map((test, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px] p-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                            <div>
                                                <div className="font-black text-slate-700">{test.name}</div>
                                                <div className="text-[8px] font-bold text-slate-400 mt-0.5">{test.date}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-slate-800">{test.acc}</div>
                                                <div className={`text-[8px] font-bold ${test.color} mt-0.5`}>{test.change}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. SPEED ANALYSIS TAB */}
                {activeTab === 'speed' && (
                    <div className="space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Average Time per Question', value: '48 sec', desc: 'In last 30 days', icon: <Clock size={16} />, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { label: 'Best Speed (Avg.)', value: '42 sec', desc: 'On 18 May 2024', icon: <TrendingUp size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { label: 'Slowest Speed (Avg.)', value: '56 sec', desc: 'On 06 May 2024', icon: <AlertCircle size={16} />, color: 'text-red-500', bg: 'bg-red-50' },
                                { label: 'Total Questions Attempted', value: '1,248', desc: 'In last 30 days', icon: <Flame size={16} />, color: 'text-[#FF7A00]', bg: 'bg-orange-50' },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
                                        <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>{item.icon}</div>
                                    </div>
                                    <div className="mt-3">
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tight">{item.value}</h4>
                                        <p className="text-[9px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Bar Chart - Time per Question by Subject */}
                            <div className="lg:col-span-8 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-6">
                                <h3 className="text-sm font-black text-slate-800">Average Time per Question by Subject</h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={speedSubjectData}>
                                            <XAxis dataKey="subject" fontSize={9} stroke="#94A3B8" tickLine={false} />
                                            <YAxis fontSize={9} stroke="#94A3B8" tickLine={false} label={{ value: 'Seconds', angle: -90, position: 'insideLeft', style: { fontSize: '9px', fontWeight: '800' } }} />
                                            <Tooltip />
                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: '800' }} />
                                            <Bar name="Your Avg. Time (sec)" dataKey="You" fill="#FF7A00" radius={[4, 4, 0, 0]} />
                                            <Bar name="Overall Avg. Time (sec)" dataKey="Overall" fill="#0B1E43" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Average Time per Question by Test */}
                            <div className="lg:col-span-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-slate-800">Average Time per Question by Test</h3>
                                    <button className="text-[10px] font-bold text-[#1D64D0] hover:underline">View All</button>
                                </div>
                                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                    {[
                                        { name: 'Mock Test 12', date: '24 May 2024', time: '46 sec', status: 'Optimal', color: 'text-emerald-500' },
                                        { name: 'Mock Test 11', date: '21 May 2024', time: '44 sec', status: 'Optimal', color: 'text-emerald-500' },
                                        { name: 'Mock Test 10', date: '18 May 2024', time: '42 sec', status: 'Optimal', color: 'text-emerald-500' },
                                        { name: 'Mock Test 9', date: '15 May 2024', time: '49 sec', status: 'Slow', color: 'text-amber-500' },
                                        { name: 'Mock Test 8', date: '12 May 2024', time: '52 sec', status: 'Slow', color: 'text-amber-500' }
                                    ].map((test, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px] p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100">
                                            <div>
                                                <div className="font-black text-slate-700">{test.name}</div>
                                                <div className="text-[8px] font-bold text-slate-400 mt-0.5">{test.date}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-slate-800">{test.time}</div>
                                                <div className={`text-[8px] font-bold ${test.color} mt-0.5`}>{test.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Speed Distribution */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Speed Distribution</h3>
                                <div className="h-44 flex items-center justify-center relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={speedDistributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={36}
                                                outerRadius={54}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {speedDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-lg font-black text-slate-800 leading-none">1,248</span>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Questions</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[8px] font-bold text-slate-500">
                                    {speedDistributionData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                                            <span className="truncate">{d.name} ({d.value})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Time vs Accuracy Table */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Time vs Accuracy</h3>
                                <div className="space-y-3.5 text-[10px] font-semibold text-slate-500">
                                    <div className="flex justify-between border-b border-slate-50 pb-1.5 font-bold">
                                        <span>Time Range</span>
                                        <span>Questions</span>
                                        <span>Accuracy</span>
                                    </div>
                                    {[
                                        { range: '0 - 30 sec', qs: '248', acc: '78%', color: 'text-emerald-500' },
                                        { range: '30 - 60 sec', qs: '718', acc: '86%', color: 'text-emerald-500' },
                                        { range: '60 - 90 sec', qs: '202', acc: '63%', color: 'text-amber-500' },
                                        { range: '90+ sec', qs: '80', acc: '41%', color: 'text-red-500' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <span>{item.range}</span>
                                            <span className="font-bold text-slate-700">{item.qs}</span>
                                            <span className={`font-black ${item.color}`}>{item.acc}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[9px] text-emerald-700 font-semibold">
                                    ★ Your accuracy is highest in the 30-60 sec range. Keep it up!
                                </div>
                            </div>

                            {/* Speed Insights */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Speed Insights</h3>
                                <div className="space-y-3">
                                    {[
                                        { icon: <Zap size={14} />, text: 'You are faster than average in Computer Awareness (33 sec vs 28 sec).', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                        { icon: <Clock size={14} />, text: 'You take more time in Quantitative Aptitude. Focus on improving speed in this area.', color: 'text-amber-500', bg: 'bg-amber-50' },
                                        { icon: <TrendingUp size={14} />, text: 'Your speed has improved by 15% in the last 30 days.', color: 'text-purple-500', bg: 'bg-purple-50' }
                                    ].map((ins, i) => (
                                        <div key={i} className="flex gap-3 items-start p-2.5 rounded-xl hover:bg-slate-50 transition-all">
                                            <div className={`p-2 rounded-lg ${ins.bg} ${ins.color} shrink-0`}>{ins.icon}</div>
                                            <p className="text-[10px] text-slate-600 font-semibold leading-relaxed mt-0.5">{ins.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-2 bg-[#0B1E43] hover:bg-[#1D64D0] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1">
                                    <span>Practice to Improve Speed</span>
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. TIME MANAGEMENT TAB */}
                {activeTab === 'time' && (
                    <div className="space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            {[
                                { label: 'Average Time per Test', value: '64 min', desc: 'of 60 min allotted', icon: <Clock size={16} />, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { label: 'Time Utilization', value: '91%', desc: 'Good', icon: <TrendingUp size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { label: 'Questions Attempted', value: '71 / 100', desc: 'Avg. per test', icon: <Target size={16} />, color: 'text-sky-500', bg: 'bg-sky-50' },
                                { label: 'Questions Reviewed', value: '18', desc: 'Avg. per test', icon: <Eye size={16} />, color: 'text-purple-500', bg: 'bg-purple-50' },
                                { label: 'Time Left (Avg.)', value: '6 min', desc: 'per test', icon: <Timer size={16} />, color: 'text-[#FF7A00]', bg: 'bg-orange-50' },
                                { label: 'Best Time Management', value: '92%', desc: 'On 18 May 2024', icon: <Award size={16} />, color: 'text-pink-500', bg: 'bg-pink-50' },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-3.5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-slate-400">{item.label}</span>
                                        <div className={`p-1 rounded-lg ${item.bg} ${item.color}`}>{item.icon}</div>
                                    </div>
                                    <div className="mt-2.5">
                                        <h4 className="text-xl font-black text-slate-800 tracking-tight">{item.value}</h4>
                                        <p className="text-[8px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tables and Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Table - Time Spent by Section */}
                            <div className="lg:col-span-6 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4">
                                <h3 className="text-sm font-black text-slate-800">Time Spent by Section (Average)</h3>
                                <div className="space-y-3 text-[10px] font-semibold text-slate-500">
                                    <div className="grid grid-cols-4 border-b border-slate-50 pb-2 font-bold text-slate-700">
                                        <span>Section</span>
                                        <span>You (min)</span>
                                        <span>Recommended</span>
                                        <span>Top 10%</span>
                                    </div>
                                    {[
                                        { section: 'Quantitative Aptitude', you: '25.4', rec: '24', top: '20.1', status: 'Slow', sColor: 'text-red-500 bg-red-50 border-red-100' },
                                        { section: 'Reasoning Ability', you: '18.7', rec: '18', top: '16.0', status: 'Slow', sColor: 'text-red-500 bg-red-50 border-red-100' },
                                        { section: 'English Language', you: '11.2', rec: '10', top: '8.6', status: 'Slow', sColor: 'text-red-500 bg-red-50 border-red-100' },
                                        { section: 'General Awareness', you: '6.8', rec: '6', top: '5.2', status: 'Slightly Slow', sColor: 'text-amber-600 bg-amber-50 border-amber-100' },
                                        { section: 'Computer Awareness', you: '2.6', rec: '2', top: '1.8', status: 'Good', sColor: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-4 items-center py-1">
                                            <span className="font-bold text-slate-700 truncate pr-2">{item.section}</span>
                                            <span>{item.you}</span>
                                            <span>{item.rec}</span>
                                            <span className="font-bold text-[#0B1E43]">{item.top}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl text-[9px] text-red-600 font-semibold">
                                    ⚠ You are spending more time than recommended in 3 sections.
                                </div>
                            </div>

                            {/* Chart - Time Utilization Trend */}
                            <div className="lg:col-span-6 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Time Utilization Trend</h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={timeUtilTrendData}>
                                            <XAxis dataKey="name" fontSize={9} stroke="#94A3B8" tickLine={false} />
                                            <YAxis fontSize={9} stroke="#94A3B8" tickLine={false} domain={[0, 100]} />
                                            <Tooltip />
                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: '800' }} />
                                            <Line name="Your Time (%)" type="monotone" dataKey="You" stroke="#FF7A00" strokeWidth={3} dot={{ r: 4 }} />
                                            <Line name="Top 10% Students (%)" type="monotone" dataKey="top10" stroke="#0B1E43" strokeDasharray="3 3" strokeWidth={2} dot={{ r: 2 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Time Distribution */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Time Distribution</h3>
                                <div className="h-44 flex items-center justify-center relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={timeDistributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={36}
                                                outerRadius={54}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {timeDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-lg font-black text-slate-800 leading-none">1,248</span>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Questions</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[8px] font-bold text-slate-500">
                                    {timeDistributionData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                                            <span className="truncate">{d.name} ({d.value})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Time per Question Analysis */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Time per Question Analysis</h3>
                                <div className="space-y-4 text-[10px] font-semibold text-slate-500">
                                    <div className="flex justify-between text-slate-700 font-bold">
                                        <span>Ideal Time per Question</span>
                                        <span>Overall Avg. Time</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-amber-500 font-black">36 sec</span>
                                        <span className="text-red-500 font-black">48 sec</span>
                                    </div>
                                    <div className="space-y-2 pt-2 border-t border-slate-50">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase">Time per Question by Section</div>
                                        {[
                                            { section: 'Quantitative Aptitude', you: 57, ideal: 40, status: '+17 sec', color: 'bg-red-500' },
                                            { section: 'Reasoning Ability', you: 47, ideal: 35, status: '+12 sec', color: 'bg-red-500' },
                                            { section: 'English Language', you: 41, ideal: 30, status: '+11 sec', color: 'bg-red-500' },
                                            { section: 'General Awareness', you: 34, ideal: 25, status: '+9 sec', color: 'bg-amber-500' },
                                            { section: 'Computer Awareness', you: 25, ideal: 20, status: '+5 sec', color: 'bg-emerald-500' },
                                        ].map((sec, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                                                    <span>{sec.section}</span>
                                                    <span className="text-slate-800 font-extrabold">{sec.you}s <span className="text-slate-400">({sec.status})</span></span>
                                                </div>
                                                <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                                    <div className={`h-full ${sec.color}`} style={{ width: `${Math.min((sec.you / 60) * 100, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Time Management Insights */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Time Management Insights</h3>
                                <div className="space-y-3">
                                    {[
                                        { icon: <Clock size={14} />, text: 'You spend 17 sec more per question in Quantitative Aptitude than ideal.', color: 'text-red-500', bg: 'bg-red-50' },
                                        { icon: <TrendingUp size={14} />, text: 'You attempt 29% more questions in the last 15 minutes. Avoid rushing to improve accuracy.', color: 'text-amber-500', bg: 'bg-amber-50' },
                                        { icon: <Timer size={14} />, text: 'You leave 6 minutes on average. Reviewing answers could boost your score by 6-8%.', color: 'text-emerald-500', bg: 'bg-emerald-50' }
                                    ].map((ins, i) => (
                                        <div key={i} className="flex gap-3 items-start p-2.5 rounded-xl hover:bg-slate-50 transition-all">
                                            <div className={`p-2 rounded-lg ${ins.bg} ${ins.color} shrink-0`}>{ins.icon}</div>
                                            <p className="text-[10px] text-slate-600 font-semibold leading-relaxed mt-0.5">{ins.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-2 bg-[#0B1E43] hover:bg-[#1D64D0] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1">
                                    <span>Practice with Timer</span>
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. CONSISTENCY TAB */}
                {activeTab === 'consistency' && (
                    <div className="space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            {[
                                { label: 'Study Streak', value: `${dynamicStreak} Days`, desc: `Best: ${Math.max(dynamicStreak, 24)} Days`, icon: <Flame size={16} />, color: 'text-orange-500', bg: 'bg-orange-50' },
                                { label: 'Practice Days', value: `${hasData ? attempts.length : 23} / 30 Days`, desc: `${hasData ? Math.round((attempts.length / 30) * 100) : 76.7}%`, icon: <Calendar size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { label: 'Avg. Daily Practice', value: stats.timeEfficiency !== '--' ? stats.timeEfficiency : '82 min', desc: 'vs last 30 days ↑ 12%', icon: <Clock size={16} />, color: 'text-purple-500', bg: 'bg-purple-50' },
                                { label: 'Consistency Score', value: `${Math.round(dynamicAvgScore * 1.1)} / 100`, desc: 'Good', icon: <Target size={16} />, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { label: 'Longest Streak', value: `${Math.max(dynamicStreak, 24)} Days`, desc: 'Active Streak', icon: <TrendingUp size={16} />, color: 'text-sky-500', bg: 'bg-sky-50' },
                                { label: 'Most Productive Day', value: 'Saturday', desc: 'Avg. 96 min', icon: <Award size={16} />, color: 'text-pink-500', bg: 'bg-pink-50' },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-3.5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-slate-400">{item.label}</span>
                                        <div className={`p-1 rounded-lg ${item.bg} ${item.color}`}>{item.icon}</div>
                                    </div>
                                    <div className="mt-2.5">
                                        <h4 className="text-xl font-black text-slate-800 tracking-tight">{item.value}</h4>
                                        <p className="text-[8px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Calendar & Trend Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Consistency Calendar */}
                            <div className="lg:col-span-6 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-slate-800">Daily Consistency Calendar</h3>
                                    <select className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 outline-none">
                                        <option>Last 5 Weeks</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-8 gap-2 text-[9px] font-bold text-slate-400 text-center">
                                        <div>Week</div>
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d}>{d}</div>)}
                                    </div>
                                    {consistencyCalendarWeeks.map((week, idx) => (
                                        <div key={idx} className="grid grid-cols-8 gap-2 items-center text-center">
                                            <div className="text-[8px] font-bold text-slate-400 text-left truncate">{week.label}</div>
                                            {week.days.map((color, dIdx) => (
                                                <div key={dIdx} className="flex justify-center">
                                                    <div className="w-5 h-5 rounded-md border border-slate-50 flex items-center justify-center shrink-0" style={{ backgroundColor: color }}></div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                {/* Legend */}
                                <div className="flex flex-wrap gap-3.5 text-[8px] font-bold text-slate-400 pt-2 border-t border-slate-50">
                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-[#3A907C]"></div><span>&gt; 90 min</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-[#1D64D0]"></div><span>60-90 min</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-[#FBBF24]"></div><span>30-60 min</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-[#EF4444]"></div><span>&lt; 30 min</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-[#E2E8F0]"></div><span>No Activity</span></div>
                                </div>
                            </div>

                            {/* Consistency Trend Chart */}
                            <div className="lg:col-span-6 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-slate-800">Consistency Trend</h3>
                                    <select className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 outline-none">
                                        <option>Last 30 Days</option>
                                    </select>
                                </div>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={consistencyTrendData}>
                                            <XAxis dataKey="name" fontSize={9} stroke="#94A3B8" tickLine={false} />
                                            <YAxis fontSize={9} stroke="#94A3B8" tickLine={false} domain={[0, 100]} />
                                            <Tooltip />
                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: '800' }} />
                                            <Line name="Consistency Score (You)" type="monotone" dataKey="You" stroke="#FF7A00" strokeWidth={3} dot={{ r: 4 }} />
                                            <Line name="Top 10% Students" type="monotone" dataKey="top10" stroke="#0B1E43" strokeDasharray="3 3" strokeWidth={2} dot={{ r: 2 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Consistency Breakdown */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Consistency Breakdown</h3>
                                <div className="h-44 flex items-center justify-center relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={consistencyBreakdownData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={36}
                                                outerRadius={54}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {consistencyBreakdownData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-lg font-black text-slate-800 leading-none">23</span>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Practice Days</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[8px] font-bold text-slate-500">
                                    {consistencyBreakdownData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                                            <span className="truncate">{d.name} ({d.value} Days)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Practice Time Distribution */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Practice Time Distribution</h3>
                                <div className="space-y-3.5 text-[10px] font-semibold text-slate-500">
                                    <div className="flex justify-between border-b border-slate-50 pb-1.5 font-bold">
                                        <span>Time Range (min)</span>
                                        <span>Days</span>
                                        <span>Percentage</span>
                                    </div>
                                    {[
                                        { range: '90 min and above', days: '8', perc: '26.1%', color: 'text-emerald-500' },
                                        { range: '60 - 90 min', days: '6', perc: '19.6%', color: 'text-emerald-500' },
                                        { range: '30 - 60 min', days: '6', perc: '19.6%', color: 'text-amber-500' },
                                        { range: 'Below 30 min', days: '3', perc: '9.8%', color: 'text-red-500' },
                                        { range: 'No Activity', days: '7', perc: '23.3%', color: 'text-slate-400' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <span>{item.range}</span>
                                            <span className="font-bold text-slate-700">{item.days}</span>
                                            <span className={`font-black ${item.color}`}>{item.perc}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[9px] text-emerald-700 font-semibold">
                                    ★ Ideal: 60+ min of effective practice daily.
                                </div>
                            </div>

                            {/* Consistency by Time of Day & Insights */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Consistency by Time of Day</h3>
                                <div className="space-y-3 text-[10px] font-semibold text-slate-500">
                                    <div className="grid grid-cols-4 border-b border-slate-50 pb-1.5 font-bold text-slate-700">
                                        <span className="col-span-2">Time Slot</span>
                                        <span className="text-center">Days</span>
                                        <span className="text-right">Consistency</span>
                                    </div>
                                    {[
                                        { slot: 'Morning (5 AM - 12 PM)', days: '12', cons: '80%', color: 'text-emerald-500' },
                                        { slot: 'Afternoon (12 PM - 5 PM)', days: '9', cons: '60%', color: 'text-amber-500' },
                                        { slot: 'Evening (5 PM - 10 PM)', days: '20', cons: '83%', color: 'text-emerald-500' },
                                        { slot: 'Night (10 PM - 5 AM)', days: '6', cons: '46%', color: 'text-red-500' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-4 items-center py-0.5">
                                            <span className="col-span-2 font-bold text-slate-700 truncate pr-1">{item.slot}</span>
                                            <span className="text-center font-bold text-slate-600">{item.days}</span>
                                            <span className={`text-right font-black ${item.color}`}>{item.cons}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[9px] text-emerald-700 font-semibold">
                                    ✔ Your most productive time is Evening (5 PM - 10 PM).
                                </div>
                            </div>
                        </div>

                        {/* Consistency Table & Insights Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Table */}
                            <div className="lg:col-span-8 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4">
                                <h3 className="text-sm font-black text-slate-800">Consistency by Week</h3>
                                <div className="space-y-3.5 text-[10px] font-semibold text-slate-500 overflow-x-auto">
                                    <div className="grid grid-cols-6 border-b border-slate-50 pb-2 font-bold text-slate-700 min-w-[500px]">
                                        <span>Week</span>
                                        <span>Practice Days</span>
                                        <span>Avg. Practice (min)</span>
                                        <span>Total Time</span>
                                        <span>Tests Taken</span>
                                        <span>Consistency Score</span>
                                    </div>
                                    {[
                                        { week: '21 Apr - 27 Apr', days: '6/7', avg: '74 min', total: '8h 37m', tests: '5', score: '62/100', color: 'text-amber-500' },
                                        { week: '28 Apr - 04 May', days: '7/7', avg: '81 min', total: '9h 27m', tests: '6', score: '71/100', color: 'text-emerald-500' },
                                        { week: '05 May - 11 May', days: '6/7', avg: '90 min', total: '10h 32m', tests: '7', score: '76/100', color: 'text-emerald-500' },
                                        { week: '12 May - 18 May', days: '7/7', avg: '97 min', total: '11h 19m', tests: '8', score: '82/100', color: 'text-emerald-500' },
                                        { week: '19 May - 25 May', days: '7/7', avg: '88 min', total: '10h 16m', tests: '6', score: '78/100', color: 'text-emerald-500' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-6 items-center py-1 min-w-[500px] border-b border-slate-50/50">
                                            <span className="font-bold text-slate-700">{item.week}</span>
                                            <span>{item.days}</span>
                                            <span>{item.avg}</span>
                                            <span>{item.total}</span>
                                            <span>{item.tests}</span>
                                            <span className={`font-black ${item.color}`}>{item.score}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Consistency Insights */}
                            <div className="lg:col-span-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                                <h3 className="text-sm font-black text-slate-800">Consistency Insights</h3>
                                <div className="space-y-3.5">
                                    {[
                                        { icon: <TrendingUp size={14} />, text: 'You are consistent on 76.7% of days in the last 30 days.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                        { icon: <Clock size={14} />, text: 'Increase your daily practice by 12 more minutes to reach the top 10% students.', color: 'text-amber-500', bg: 'bg-amber-50' },
                                        { icon: <AlertCircle size={14} />, text: 'You missed 7 days of practice. Try to avoid study breaks.', color: 'text-red-500', bg: 'bg-red-50' },
                                        { icon: <Calendar size={14} />, text: 'Maintaining a streak of 21+ days can improve your score by 15-20%.', color: 'text-purple-500', bg: 'bg-purple-50' }
                                    ].map((ins, i) => (
                                        <div key={i} className="flex gap-3 items-start p-2 rounded-xl hover:bg-slate-50 transition-all">
                                            <div className={`p-1.5 rounded-lg ${ins.bg} ${ins.color} shrink-0`}>{ins.icon}</div>
                                            <p className="text-[10px] text-slate-600 font-semibold leading-relaxed mt-0.5">{ins.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all">
                                    View Consistency Tips
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. SCORE BOARD TAB */}
                {activeTab === 'score' && (
                    <div className="space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            {[
                                { label: 'Tests Completed', value: `${dynamicTotalTests}`, desc: 'vs last 30 days ↑ 20%', icon: <BookOpen size={16} />, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { label: 'Average Score', value: `${dynamicAvgScore}%`, desc: 'vs last 30 days ↑ 8.6%', icon: <TrendingUp size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { label: 'Highest Score', value: `${dynamicBestScore}%`, desc: hasData ? `In ${attempts[0]?.testTitle}` : 'In SSC CGL Mock Test 11', icon: <Award size={16} />, color: 'text-purple-500', bg: 'bg-purple-50' },
                                { label: 'Predicted Score', value: `${Math.round(dynamicAvgScore * 2)} / 200`, desc: 'Good', icon: <Target size={16} />, color: 'text-sky-500', bg: 'bg-sky-50' },
                                { label: 'Rank Estimate', value: hasData ? `${Math.round(25842 * (1 - (dynamicAvgScore * 0.9 + 20)/100))} - ${Math.round(25842 * (1 - (dynamicAvgScore * 0.9 + 20)/100)) + 2000}` : '4,500 - 7,000', desc: 'Likely Range', icon: <Users size={16} />, color: 'text-[#FF7A00]', bg: 'bg-orange-50' },
                                { label: 'Percentile', value: hasData ? (dynamicAvgScore * 0.9 + 20).toFixed(1) : '82.4', desc: 'vs last 30 days ↑ 9.3', icon: <Flame size={16} />, color: 'text-pink-500', bg: 'bg-pink-50' },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-3.5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-slate-400">{item.label}</span>
                                        <div className={`p-1 rounded-lg ${item.bg} ${item.color}`}>{item.icon}</div>
                                    </div>
                                    <div className="mt-2.5">
                                        <h4 className="text-xl font-black text-slate-800 tracking-tight">{item.value}</h4>
                                        <p className="text-[8px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chart Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Score Trend */}
                            <div className="lg:col-span-8 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-slate-800">Score Trend</h3>
                                    <select className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 outline-none">
                                        <option>Last 12 Tests</option>
                                    </select>
                                </div>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={scoreTrendData}>
                                            <XAxis dataKey="name" fontSize={9} stroke="#94A3B8" tickLine={false} />
                                            <YAxis fontSize={9} stroke="#94A3B8" tickLine={false} domain={[0, 100]} />
                                            <Tooltip />
                                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: '800' }} />
                                            <Line name="Your Score (%)" type="monotone" dataKey="You" stroke="#1D64D0" strokeWidth={3} dot={{ r: 4 }} />
                                            <Line name="Top 10% Students (%)" type="monotone" dataKey="top10" stroke="#FF7A00" strokeDasharray="3 3" strokeWidth={2} dot={{ r: 2 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Subject-wise Score */}
                            <div className="lg:col-span-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-5 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Subject-wise Score (Average %)</h3>
                                <div className="space-y-4">
                                    {scoreSubjectData.map((sub, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                                <span>{sub.subject}</span>
                                                <span className="font-extrabold text-slate-800">{sub.You}% <span className="text-slate-400">/ {sub.top10}%</span></span>
                                            </div>
                                            <div className="h-2 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                                <div className={`h-full ${sub.color} rounded-full`} style={{ width: `${sub.You}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all">
                                    View Detailed Analysis
                                </button>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Score Distribution */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Score Distribution (All Tests)</h3>
                                <div className="h-44 flex items-center justify-center relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={scoreDistributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={36}
                                                outerRadius={54}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {scoreDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-lg font-black text-slate-800 leading-none">12</span>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Tests</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[8px] font-bold text-slate-500">
                                    {scoreDistributionData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                                            <span className="truncate">{d.name} ({d.value} Tests)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Performance Summary */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Performance Summary</h3>
                                <div className="space-y-3.5 text-[10px] font-semibold text-slate-500">
                                    {[
                                        { label: 'Total Questions Attempted', value: '1,248' },
                                        { label: 'Total Questions Correct', value: '811' },
                                        { label: 'Overall Accuracy', value: '65.0%' },
                                        { label: 'Average Time per Question', value: '48 sec' },
                                        { label: 'Total Study Hours', value: '42h 35m' },
                                        { label: 'Mock Tests Taken', value: '12' },
                                        { label: 'PYQs Solved', value: '842' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-1">
                                            <span>{item.label}</span>
                                            <span className="font-black text-slate-800">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Best & Recent Performance */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Best & Recent Performance</h3>
                                <div className="space-y-3.5">
                                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
                                        <div>
                                            <div className="text-[8px] font-black text-emerald-600 uppercase">Best Performance</div>
                                            <div className="text-xs font-black text-slate-800 mt-1">87.5% Accuracy</div>
                                            <div className="text-[8px] font-bold text-slate-400 mt-0.5">SSC CGL Mock Test 11 (21 May 2024)</div>
                                        </div>
                                        <Award size={20} className="text-emerald-500 shrink-0" />
                                    </div>
                                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                                        <div>
                                            <div className="text-[8px] font-black text-blue-600 uppercase">Most Recent Test</div>
                                            <div className="text-xs font-black text-slate-800 mt-1">65.0% Accuracy</div>
                                            <div className="text-[8px] font-bold text-slate-400 mt-0.5">SSC CGL Mock Test 12 (24 May 2024)</div>
                                        </div>
                                        <BookOpen size={20} className="text-blue-500 shrink-0" />
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-24 overflow-y-auto">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase">Recent 5 Tests</div>
                                    {[
                                        { name: 'Mock Test 12', score: '65.0%', perc: '82.4', rank: '5,600' },
                                        { name: 'Mock Test 11', score: '87.5%', perc: '94.7', rank: '2,150' },
                                        { name: 'Mock Test 10', score: '70.0%', perc: '85.1', rank: '4,900' },
                                    ].map((test, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-[9px] text-slate-500 font-semibold py-0.5">
                                            <span className="font-bold text-slate-700 truncate pr-2">{test.name}</span>
                                            <span>{test.score}</span>
                                            <span>{test.perc} %</span>
                                            <span className="font-bold">{test.rank}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. COMPARATIVE ANALYSIS TAB */}
                {activeTab === 'compare' && (
                    <div className="space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { label: 'Your Percentile', value: `${hasData ? (dynamicAvgScore * 0.9 + 20).toFixed(1) : '82.4'}%`, desc: `You are in top ${(100 - (hasData ? (dynamicAvgScore * 0.9 + 20) : 82.4)).toFixed(1)}%`, icon: <TrendingUp size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { label: 'Your Rank', value: hasData ? `${Math.round(25842 * (1 - (dynamicAvgScore * 0.9 + 20)/100))} / 25,842` : '4,560 / 25,842', desc: 'Among all students', icon: <Users size={16} />, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { label: 'Average Score', value: `${dynamicAvgScore}%`, desc: `You: ${dynamicAvgScore}%`, icon: <Target size={16} />, color: 'text-sky-500', bg: 'bg-sky-50' },
                                { label: 'Highest Score', value: '92.0%', desc: `You: ${dynamicBestScore}%`, icon: <Award size={16} />, color: 'text-purple-500', bg: 'bg-purple-50' },
                                { label: 'Tests Attempted', value: `${dynamicTotalTests}`, desc: `You: ${dynamicTotalTests}`, icon: <BookOpen size={16} />, color: 'text-pink-500', bg: 'bg-pink-50' },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
                                        <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>{item.icon}</div>
                                    </div>
                                    <div className="mt-3">
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tight">{item.value}</h4>
                                        <p className="text-[9px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Comparisons Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Score Comparison */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4">
                                <h3 className="text-sm font-black text-slate-800">Score Comparison</h3>
                                <div className="space-y-4">
                                    {scoreCompare.map((item, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-500">
                                                <span>{item.category}</span>
                                                <span className={`font-extrabold ${item.isYou ? 'text-[#FF7A00]' : 'text-slate-800'}`}>{item.value}%</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                                <div className={`h-full rounded-full ${item.isYou ? 'bg-[#FF7A00]' : 'bg-[#0B1E43]'}`} style={{ width: `${item.value}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Accuracy Comparison */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4">
                                <h3 className="text-sm font-black text-slate-800">Accuracy Comparison</h3>
                                <div className="space-y-4">
                                    {accuracyCompare.map((item, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-500">
                                                <span>{item.category}</span>
                                                <span className={`font-extrabold ${item.isYou ? 'text-[#FF7A00]' : 'text-slate-800'}`}>{item.value}%</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                                <div className={`h-full rounded-full ${item.isYou ? 'bg-[#FF7A00]' : 'bg-indigo-500'}`} style={{ width: `${item.value}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Speed Comparison */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-slate-800">Speed Comparison</h3>
                                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↓ Lower is Better</span>
                                </div>
                                <div className="space-y-4">
                                    {speedCompare.map((item, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-500">
                                                <span>{item.category}</span>
                                                <span className={`font-extrabold ${item.isYou ? 'text-[#FF7A00]' : 'text-slate-800'}`}>{item.value} sec</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                                {/* Speed width is inverted for display (maximum 90s) */}
                                                <div className={`h-full rounded-full ${item.isYou ? 'bg-[#FF7A00]' : 'bg-purple-500'}`} style={{ width: `${(item.value / 90) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Percentile Distribution */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Percentile Distribution</h3>
                                <div className="h-44 flex items-center justify-center relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Top 10%', value: 10, color: '#3A907C' },
                                                    { name: 'Top 10%-25%', value: 15, color: '#1D64D0' },
                                                    { name: 'Top 25%-50%', value: 25, color: '#FBBF24' },
                                                    { name: 'Bottom 50%', value: 50, color: '#EF4444' }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={36}
                                                outerRadius={54}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {[
                                                    { color: '#3A907C' },
                                                    { color: '#1D64D0' },
                                                    { color: '#FBBF24' },
                                                    { color: '#EF4444' }
                                                ].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-sm font-bold text-slate-400">You</span>
                                        <span className="text-base font-black text-slate-800 leading-none mt-0.5">82.4%</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[8px] font-bold text-slate-500">
                                    {[
                                        { name: 'Top 10%', value: '90 - 100', color: '#3A907C' },
                                        { name: 'Top 10%-25%', value: '75 - 90', color: '#1D64D0' },
                                        { name: 'Top 25%-50%', value: '50 - 75', color: '#FBBF24' },
                                        { name: 'Bottom 50%', value: '25 - 50', color: '#EF4444' }
                                    ].map((d, i) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                                            <span className="truncate">{d.name} ({d.value})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Subject-wise Percentile */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Subject-wise Percentile</h3>
                                <div className="space-y-3.5">
                                    {[
                                        { name: 'Quantitative Aptitude', value: 85.6, color: 'bg-blue-500' },
                                        { name: 'Reasoning Ability', value: 80.3, color: 'bg-indigo-500' },
                                        { name: 'English Language', value: 78.9, color: 'bg-emerald-500' },
                                        { name: 'General Awareness', value: 76.4, color: 'bg-amber-500' },
                                        { name: 'Computer Awareness', value: 70.1, color: 'bg-purple-500' },
                                    ].map((sub, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                                <span>{sub.name}</span>
                                                <span className="font-extrabold text-slate-800">{sub.value}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                                <div className={`h-full ${sub.color} rounded-full`} style={{ width: `${sub.value}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[9px] text-emerald-700 font-semibold">
                                    ✔ You are strongest in Quantitative Aptitude.
                                </div>
                            </div>

                            {/* Overall Comparison */}
                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                                <h3 className="text-sm font-black text-slate-800">Overall Comparison</h3>
                                <div className="space-y-3 text-[9px] font-semibold text-slate-500">
                                    <div className="grid grid-cols-5 border-b border-slate-50 pb-1.5 font-bold text-slate-700">
                                        <span className="col-span-2">Metric</span>
                                        <span>You</span>
                                        <span>Top 10%</span>
                                        <span>Top 25%</span>
                                    </div>
                                    {[
                                        { label: 'Average Score', you: '82.4%', top: '85.6%', sec: '73.2%' },
                                        { label: 'Average Accuracy', you: '78.6%', top: '88.9%', sec: '76.6%' },
                                        { label: 'Average Speed', you: '48 sec', top: '38 sec', sec: '46 sec' },
                                        { label: 'Tests Attempted', you: '12', top: '14', sec: '13' },
                                        { label: 'Percentile', you: '82.4', top: '95+', sec: '87.5' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-5 items-center py-1">
                                            <span className="col-span-2 font-bold text-slate-700 truncate pr-1">{item.label}</span>
                                            <span className="font-bold text-[#FF7A00]">{item.you}</span>
                                            <span>{item.top}</span>
                                            <span>{item.sec}</span>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-2 bg-[#0B1E43] hover:bg-[#1D64D0] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1">
                                    <span>View Improvement Plan</span>
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentAnalyticsPage;
