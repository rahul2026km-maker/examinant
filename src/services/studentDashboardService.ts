import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from '../firebase';

export interface StudentStats {
    totalTests: number;
    averageScore: number;
    totalTimeSpent: number; // in seconds
    accuracy: number; // in percentage
    currentStreak: number;
    testsTrend: string; // e.g., "+2 this week"
    scoreTrend: string; // e.g., "+5% improvement"
    timeTrend: string; // e.g., "Last 30 days"
    weeklyPerformance: { name: string; Score: number; Accuracy: number }[];
    subjectPerformance: { name: string; value: number; color: string }[];
    dailyGoalCompleted: number;
    dailyGoalTarget: number;
    recentAttempts: {
        id: string;
        testTitle: string;
        score: number;
        maxScore: number;
        correctAnswers: number;
        totalQuestions: number;
        attemptDate: any;
    }[];
}

export interface RecommendedSeries {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    questionCount?: number;
    stats?: {
        totalTests?: number;
    };
}

export interface ActiveTest {
    id: string; // purchaseId or seriesId
    testId: string; // underlying series/test id
    title: string;
    category: string;
    purchaseDate: any;
}

// Helper to format duration
export const formatDurationHours = (seconds: number): string => {
    const hours = Math.round(seconds / 3600);
    return `${hours}h`;
};

// Get aggregated student stats
export const getStudentStats = async (userId: string): Promise<StudentStats> => {
    try {
        const attemptsRef = collection(db, 'users', userId, 'attempts');
        const q = query(attemptsRef, orderBy('attemptDate', 'desc'));
        const snapshot = await getDocs(q);
        
        const getLocalDateString = (dateVal: any) => {
            if (!dateVal) return '';
            const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
            if (!(date instanceof Date) || isNaN(date.getTime())) return '';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const parseLocalDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        };

        const attempts = snapshot.docs.map(doc => {
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
                correctAnswers: data.correctAnswers ?? data.correctCount ?? 0,
                sectionWiseScore: data.sectionWiseScore || {}
            };
        });

        const totalTests = attempts.length;
        let totalScorePercentage = 0;
        let totalTime = 0;
        let totalCorrect = 0;
        let totalAttempted = 0;

        attempts.forEach(a => {
            const pct = Math.max(0, Math.min(100, (a.score / a.maxScore) * 100));
            totalScorePercentage += pct;
            totalTime += a.duration;
            totalCorrect += a.correctAnswers;
            totalAttempted += a.attemptedQuestions;
        });

        const averageScore = totalTests > 0 ? Math.round(totalScorePercentage / totalTests) : 0;
        const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 1000) / 10 : 0;

        // Calculate streak in local timezone
        const calculateStreak = () => {
            if (attempts.length === 0) return 0;
            const attemptDates = new Set<string>();
            attempts.forEach(a => {
                const dateStr = getLocalDateString(a.attemptDate);
                if (dateStr) {
                    attemptDates.add(dateStr);
                }
            });
            const sortedDates = Array.from(attemptDates).sort((a, b) => b.localeCompare(a));
            if (sortedDates.length === 0) return 0;

            const todayStr = getLocalDateString(new Date());
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getLocalDateString(yesterday);

            const latestDate = sortedDates[0];
            if (latestDate !== todayStr && latestDate !== yesterdayStr) {
                return 0;
            }

            let streak = 0;
            const currentDate = parseLocalDate(latestDate);
            for (let i = 0; i < sortedDates.length + 5; i++) {
                const expectedStr = getLocalDateString(currentDate);
                if (attemptDates.has(expectedStr)) {
                    streak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }
            return streak;
        };
        const currentStreak = calculateStreak();

        // Daily goal attempts completed today in local timezone
        const todayStr = getLocalDateString(new Date());
        const dailyGoalCompleted = attempts.filter(a => {
            return getLocalDateString(a.attemptDate) === todayStr;
        }).length;
        const dailyGoalTarget = 2; // Default daily goal of 2 tests

        // Weekly Performance (Monday to Sunday of current week in local timezone)
        const getStartOfWeek = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            return new Date(date.setDate(diff));
        };
        const startOfWeek = getStartOfWeek(new Date());
        startOfWeek.setHours(0, 0, 0, 0);

        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weeklyPerformance = weekDays.map((dayName, idx) => {
            const targetDate = new Date(startOfWeek);
            targetDate.setDate(targetDate.getDate() + idx);
            const targetDateStr = getLocalDateString(targetDate);

            const dayAttempts = attempts.filter(a => {
                return getLocalDateString(a.attemptDate) === targetDateStr;
            });

            if (dayAttempts.length === 0) {
                return { name: dayName, Score: 0, Accuracy: 0 };
            }

            const totalDayScorePct = dayAttempts.reduce((sum, a) => {
                const pct = Math.max(0, Math.min(100, (a.score / a.maxScore) * 100));
                return sum + pct;
            }, 0);
            const totalDayCorr = dayAttempts.reduce((sum, a) => sum + a.correctAnswers, 0);
            const totalDayAtt = dayAttempts.reduce((sum, a) => sum + a.attemptedQuestions, 0);

            return {
                name: dayName,
                Score: Math.round(totalDayScorePct / dayAttempts.length),
                Accuracy: totalDayAtt > 0 ? Math.round((totalDayCorr / totalDayAtt) * 100) : 0
            };
        });

        // Subject Performance
        const subjectsList = [
            { name: 'Quantitative Aptitude', color: '#0B1E43' },
            { name: 'Reasoning Ability', color: '#1D64D0' },
            { name: 'English Language', color: '#3A907C' },
            { name: 'General Awareness', color: '#FBBF24' }
        ];

        const subjectStats: Record<string, { correct: number; attempted: number }> = {};
        attempts.forEach(a => {
            if (a.sectionWiseScore) {
                Object.entries(a.sectionWiseScore).forEach(([subj, data]: [string, any]) => {
                    const normalizedSubj = subjectsList.find(s => s.name.toLowerCase() === subj.toLowerCase() || subj.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]))?.name || subj;
                    if (!subjectStats[normalizedSubj]) {
                        subjectStats[normalizedSubj] = { correct: 0, attempted: 0 };
                    }
                    const correct = data.correct ?? data.correctAnswers ?? 0;
                    const wrong = data.wrong ?? data.wrongAnswers ?? 0;
                    const attempted = correct + wrong;
                    subjectStats[normalizedSubj].correct += correct;
                    subjectStats[normalizedSubj].attempted += attempted;
                });
            }
        });

        const subjectPerformance = subjectsList.map(subj => {
            const stats = subjectStats[subj.name];
            const accuracyVal = (stats && stats.attempted > 0) ? Math.round((stats.correct / stats.attempted) * 100) : 0;
            return {
                name: subj.name,
                value: accuracyVal,
                color: subj.color
            };
        });

        const recentAttempts = attempts.slice(0, 4).map(a => ({
            id: a.id,
            testTitle: a.testTitle,
            score: a.score,
            maxScore: a.maxScore,
            correctAnswers: a.correctAnswers,
            totalQuestions: a.totalQuestions,
            attemptDate: a.attemptDate
        }));

        return {
            totalTests,
            averageScore,
            totalTimeSpent: totalTime,
            accuracy,
            currentStreak,
            testsTrend: totalTests > 0 ? `${totalTests} total` : 'Start your journey',
            scoreTrend: totalTests > 0 ? 'based on attempts' : 'No data yet',
            timeTrend: 'Total learning time',
            weeklyPerformance,
            subjectPerformance,
            dailyGoalCompleted,
            dailyGoalTarget,
            recentAttempts
        };
    } catch (error) {
        console.error("Error fetching student stats:", error);
        return {
            totalTests: 0,
            averageScore: 0,
            totalTimeSpent: 0,
            accuracy: 0,
            currentStreak: 0,
            testsTrend: '0 total',
            scoreTrend: 'No data yet',
            timeTrend: 'Total learning time',
            weeklyPerformance: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({ name: day, Score: 0, Accuracy: 0 })),
            subjectPerformance: [
                { name: 'Quantitative Aptitude', value: 0, color: '#0B1E43' },
                { name: 'Reasoning Ability', value: 0, color: '#1D64D0' },
                { name: 'English Language', value: 0, color: '#3A907C' },
                { name: 'General Awareness', value: 0, color: '#FBBF24' }
            ],
            dailyGoalCompleted: 0,
            dailyGoalTarget: 2,
            recentAttempts: []
        };
    }
};

// Get recommended test series
export const getRecommendedSeries = async (): Promise<RecommendedSeries[]> => {
    try {
        // Fetch published series
        let q = query(
            collection(db, 'testSeries'),
            where('status', '==', 'published'),
            limit(20)
        );
        let snapshot = await getDocs(q);

        // Fallback: If no published items, get some (any) for the user to see
        if (snapshot.empty) {
            console.log("No published series found, fetching latest series as fallback.");
            const fallbackQ = query(collection(db, 'testSeries'), limit(20));
            snapshot = await getDocs(fallbackQ);
        }

        const series = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.name || data.title || data.testName || 'Untitled Series',
                description: data.description || 'Practice test series',
                price: data.pricing?.amount ?? data.price ?? 0,
                category: data.examCategory || data.category || 'General',
                questionCount: data.stats?.totalTests || 0,
                createdAt: data.createdAt,
                stats: {
                    totalTests: data.stats?.totalTests || 0
                }
            } as RecommendedSeries;
        });

        // Sort client-side by createdAt descending
        return series.sort((a: any, b: any) => {
            const timeA = a.createdAt?.seconds || a.createdAt || 0;
            const timeB = b.createdAt?.seconds || b.createdAt || 0;
            return (timeB as number) - (timeA as number);
        }).slice(0, 6);

    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return [];
    }
};

// Get active/purchased tests
export const getActiveTests = async (userId: string): Promise<ActiveTest[]> => {
    try {
        const purchasesRef = collection(db, 'users', userId, 'purchases');
        const q = query(purchasesRef, orderBy('purchaseDate', 'desc'), limit(3));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                testId: data.seriesId || data.testId,
                title: data.seriesTitle || data.testTitle,
                category: data.category || 'Test Series',
                purchaseDate: data.purchaseDate
            };
        });
    } catch (error) {
        console.error("Error fetching active tests:", error);
        return [];
    }
};
