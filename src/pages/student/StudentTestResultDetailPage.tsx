import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, CheckCircle, XCircle, MinusCircle, Clock,
    Award, Loader2, BookOpen, Download
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface Question {
    id: string;
    text: string;
    textHindi?: string;
    options: string[];
    optionsHindi?: string[];
    correctAnswer: number | string;
    subject: string;
    type: 'MCQ' | 'Numerical';
    explanation?: string;
    explanationHindi?: string;
    section?: string;
    chapter?: string;
    unit?: string;
    examCategory?: string;
}

interface AttemptData {
    id: string;
    testId: string;
    testTitle: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    attemptedQuestions: number;
    duration: number;
    timeTakenSeconds?: number;
    answers: Record<number, number | string>;
    attemptDate: any;
    isOMR?: boolean;
    questionTimes?: Record<string, number>;
}

interface TestData {
    id: string;
    omrTemplate?: {
        totalQuestions: number;
        sections: { name: string; questionStartIndex: number; questionEndIndex: number; questionCount: number }[];
    };
    questionMappings?: { serialNumber: number; correctOption: string; subject?: string }[];
}

const StudentTestResultDetailPage = () => {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const currentUser = auth?.currentUser;

    const [attempt, setAttempt] = useState<AttemptData | null>(null);
    const [testData, setTestData] = useState<TestData | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');

    useEffect(() => {
        const fetchData = async () => {
            if (!attemptId || !auth?.currentUser) return;

            try {
                // 1. Fetch Attempt Data
                const attemptRef = doc(db, 'users', auth.currentUser.uid, 'attempts', attemptId);
                const attemptSnap = await getDoc(attemptRef);

                if (!attemptSnap.exists()) {
                    alert("Result not found");
                    navigate('/dashboard/results');
                    return;
                }

                const attemptData = { id: attemptSnap.id, ...attemptSnap.data() } as AttemptData;
                setAttempt(attemptData);

                // 2. Fetch Test Metadata
                const testRef = doc(db, 'tests', attemptData.testId);
                const testSnap = await getDoc(testRef);
                
                if (testSnap.exists()) {
                    const tData = { id: testSnap.id, ...testSnap.data() } as TestData;

                    // ── BRIDGE: Unified Results Logic ──
                    if (attemptData.isOMR) {
                        // OMR-style attempt: Ensure we have an OMR template for display
                        if (!tData.omrTemplate) {
                            const totalQuestions = (tData as any).questionIds?.length || 0;
                            tData.omrTemplate = {
                                totalQuestions,
                                sections: [
                                    { 
                                        name: 'General Section', 
                                        questionStartIndex: 1, 
                                        questionEndIndex: totalQuestions, 
                                        questionCount: totalQuestions 
                                    }
                                ]
                            };
                            
                            // If OMR mappings are also missing (likely for a digital test taken as OMR),
                            // and we have question IDs, try to fetch some mapping info
                            if (!tData.questionMappings && (tData as any).questionIds?.length > 0) {
                                const qIds = (tData as any).questionIds;
                                const loadedQs: any[] = [];
                                
                                // Batched Fetching
                                const chunks = [];
                                for (let i = 0; i < qIds.length; i += 30) {
                                    chunks.push(qIds.slice(i, i + 30));
                                }
                                
                                for (const chunk of chunks) {
                                    const q = query(collection(db, 'questions'), where(documentId(), 'in', chunk));
                                    const snapshot = await getDocs(q);
                                    snapshot.docs.forEach(d => loadedQs.push({ id: d.id, ...d.data() }));
                                }

                                tData.questionMappings = qIds.map((id: string, index: number) => {
                                    const q = loadedQs.find(ql => ql.id === id);
                                    if (q) {
                                        return {
                                            serialNumber: index + 1,
                                            correctOption: String(q.correctAnswer),
                                            subject: q.subject
                                        };
                                    }
                                    return { serialNumber: index + 1, correctOption: '' };
                                });
                            }
                        }
                        setTestData(tData);
                    } else {
                        // Digital-style attempt: Needs full questions content
                        let questionIds = (tData as any).questionIds || [];
                        
                        // If it's an OMR test taken digitally, useMappings to simulate question list
                        if (questionIds.length === 0 && tData.questionMappings?.length) {
                            const loadedQuestions = tData.questionMappings.map(m => ({
                                id: `omr-${m.serialNumber}`,
                                text: (m as any).questionText || `Question ${m.serialNumber}`,
                                options: (m as any).options || ['Option A', 'Option B', 'Option C', 'Option D'],
                                correctAnswer: (m as any).correctOption || 'A',
                                subject: m.subject || 'General',
                                type: 'MCQ'
                            } as Question));
                            setQuestions(loadedQuestions);
                        } else if (questionIds.length > 0) {
                            // Standard Digital Path - Optimized with Batched Fetching
                            const loadedQuestions: Question[] = [];
                            
                            // Firestore 'in' query supports max 30 items
                            const chunks = [];
                            for (let i = 0; i < questionIds.length; i += 30) {
                                chunks.push(questionIds.slice(i, i + 30));
                            }
                            
                            for (const chunk of chunks) {
                                const q = query(
                                    collection(db, 'questions'),
                                    where(documentId(), 'in', chunk)
                                );
                                const snapshot = await getDocs(q);
                                snapshot.docs.forEach(docSnap => {
                                    loadedQuestions.push({ id: docSnap.id, ...docSnap.data() } as Question);
                                });
                            }
                            
                            // Ensure questions are in the correct order as per questionIds array
                            const orderedQuestions = questionIds.map((questionId: string) => 
                                loadedQuestions.find(q => q.id === questionId)
                            ).filter(Boolean) as Question[];
                            
                            setQuestions(orderedQuestions);
                        }
                        setTestData(tData);
                    }
                }

            } catch (error) {
                console.error("Error loading result details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [attemptId, auth?.currentUser, navigate]);

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    };

    const formatQuestionDuration = (seconds: number) => {
        if (!seconds) return '0s';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m > 0) {
            return `${m}m ${s}s`;
        }
        return `${s}s`;
    };

    const getAnswerStatus = (questionIndex: number, question: Question) => {
        const userAnswer = attempt?.answers[questionIndex];

        if (userAnswer === undefined || userAnswer === null || userAnswer === '') return 'unattempted';

        if (String(userAnswer) === String(question.correctAnswer)) return 'correct';
        return 'incorrect';
    };

    const filteredQuestions = questions.map((q, idx) => ({ ...q, index: idx, status: getAnswerStatus(idx, q) }))
        .filter(q => activeFilter === 'all' || q.status === activeFilter);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    if (!attempt) return null;

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 print-container">
            {/* Print Only Header (Certificate Style) */}
            <div className="hidden print:block mb-10 text-center border-b-4 border-double border-slate-900 pb-8">
                <div className="flex flex-col items-center">
                    <h1 className="text-5xl font-black text-slate-900 tracking-[0.2em] mb-2">EXAMINANT</h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-amber-500 mb-4"></div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">Official Performance Statement</p>
                </div>
                
                <div className="mt-10 grid grid-cols-3 gap-8 text-center max-w-3xl mx-auto border border-slate-200 p-6 rounded-2xl bg-slate-50/50">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">CANDIDATE</p>
                        <p className="text-lg font-black text-slate-900 uppercase leading-none">{currentUser?.displayName || 'Student'}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">{currentUser?.email}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">TIME TAKEN</p>
                        <p className="text-lg font-black text-slate-900 leading-none">{formatDuration(attempt.timeTakenSeconds || attempt.duration || 0)}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">Duration</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">ISSUE DATE</p>
                        <p className="text-lg font-black text-slate-900 leading-none">{new Date().toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">Ref: {attempt.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">ASSESSMENT TITLE</p>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{attempt.testTitle}</h2>
                    <div className="mt-2 inline-block px-4 py-1 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                        {attempt.isOMR ? 'OMR RECORDED ATTEMPT' : 'DIGITAL INTERACTIVE ATTEMPT'}
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/results')}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{attempt.testTitle} - Result Analysis</h1>
                        <p className="text-slate-500 text-sm">
                            Attempted on {attempt.attemptDate?.toDate().toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                    <Download size={18} />
                    Download Report
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Award size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Score</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {attempt.score} <span className="text-sm text-slate-400 font-normal">/ {attempt.isOMR ? (testData?.omrTemplate?.totalQuestions || 0) * 4 : (questions.length || attempt.totalQuestions || 0) * 4}</span>
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Correct</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {attempt.correctAnswers ?? (attempt as any).correctCount ?? 0}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Incorrect</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {(attempt as any).wrongCount ?? (attempt.attemptedQuestions - attempt.correctAnswers)}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Time Taken</p>
                        <h3 className="text-2xl font-bold text-slate-800">{formatDuration(attempt.timeTakenSeconds || attempt.duration || 0)}</h3>
                    </div>
                </div>
            </div>
            
            {/* OMR Results View */}
            {attempt.isOMR && testData?.omrTemplate && (
                <div className="space-y-8">
                    {testData.omrTemplate.sections.map((section, sIdx) => (
                        <div key={sIdx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-800">{section.name} Analysis</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {Array.from({ length: section.questionCount || (section.questionEndIndex - section.questionStartIndex + 1) }, (_, i) => {
                                    const qNumber = section.questionStartIndex + i;
                                    const mapping = testData.questionMappings?.find(m => m.serialNumber === qNumber);
                                    const correctOption = mapping?.correctOption;
                                    const studentAnswer = attempt.answers[qNumber];
                                    const isCorrect = String(studentAnswer) === String(correctOption);
                                    const isUnattempted = !studentAnswer;

                                    return (
                                        <div key={qNumber} className="flex flex-col items-center p-3 rounded-xl border border-slate-100 bg-slate-50/30">
                                            <span className="text-xs font-bold text-slate-400 mb-2">Q. {qNumber}</span>
                                            <div className="flex gap-1.5">
                                                {['A', 'B', 'C', 'D'].map(opt => {
                                                    const isSelected = studentAnswer === opt;
                                                    const isActuallyCorrect = correctOption === opt;
                                                    
                                                    let circleClass = "w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ";
                                                    
                                                    if (isActuallyCorrect) {
                                                        // This was the correct answer
                                                        circleClass += "bg-green-500 border-green-500 text-white shadow-sm shadow-green-500/20";
                                                    } else if (isSelected) {
                                                        // Student picked this and it was WRONG
                                                        circleClass += "bg-red-500 border-red-500 text-white shadow-sm shadow-red-500/20";
                                                    } else {
                                                        circleClass += "border-slate-200 text-slate-400";
                                                    }

                                                    return (
                                                        <div key={opt} className={circleClass}>
                                                            {opt}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {!isCorrect && !isUnattempted && (
                                                <span className="text-[10px] text-red-500 font-bold mt-2">Wrong</span>
                                            )}
                                            {isCorrect && (
                                                <span className="text-[10px] text-green-600 font-bold mt-2">Correct</span>
                                            )}
                                            {isUnattempted && (
                                                <span className="text-[10px] text-slate-400 font-bold mt-2">Skipped</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Digital Analysis Section (Standard List) */}
            {!attempt.isOMR && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen size={20} className="text-blue-500" />
                        Question Analysis
                    </h2>

                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {(['all', 'correct', 'incorrect', 'unattempted'] as const).map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-all ${activeFilter === filter
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredQuestions.map((q, qi) => {
                        const status = q.status;
                        const userAnswer = attempt.answers[q.index];

                        return (
                            <div key={q.id || `q-${qi}`} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${status === 'correct' ? 'bg-green-100 text-green-700' :
                                            status === 'incorrect' ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                            {q.index + 1}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap gap-2 items-center text-xs mb-1">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                                                {q.subject}
                                            </span>
                                            {q.examCategory && q.examCategory !== 'General' && (
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-100">
                                                    {q.examCategory}
                                                </span>
                                            )}
                                            {q.unit && (
                                                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold border border-purple-100">
                                                    Unit: {q.unit}
                                                </span>
                                            )}
                                            {q.chapter && (
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                                                    Chapter: {q.chapter}
                                                </span>
                                            )}
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                                                {q.type}
                                            </span>
                                            {attempt.questionTimes && (attempt.questionTimes[q.index] !== undefined || attempt.questionTimes[String(q.index)] !== undefined) && (
                                                <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded font-semibold flex items-center gap-1 border border-slate-200/50">
                                                    <Clock size={12} className="text-slate-500" />
                                                    Time Spent: {formatQuestionDuration(attempt.questionTimes[q.index] ?? attempt.questionTimes[String(q.index)] ?? 0)}
                                                </span>
                                            )}
                                            {status === 'correct' && (
                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                                    <CheckCircle size={12} /> Correct (+4)
                                                </span>
                                            )}
                                            {status === 'incorrect' && (
                                                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                                    <XCircle size={12} /> Incorrect (-1)
                                                </span>
                                            )}
                                            {status === 'unattempted' && (
                                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                                    <MinusCircle size={12} /> Unattempted (0)
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-slate-800 font-medium text-lg leading-relaxed">
                                            {q.text}
                                        </p>
                                        {q.textHindi && (
                                            <p className="text-slate-500 font-medium text-base leading-relaxed mt-1.5 border-l-2 border-slate-300 pl-3 italic">
                                                {q.textHindi}
                                            </p>
                                        )}

                                        {q.type === 'MCQ' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {q.options.map((opt, optIdx) => {
                                                    const isSelected = userAnswer === optIdx;
                                                    const isCorrect = String(q.correctAnswer) === String(optIdx);
                                                    const hasHindiOption = q.optionsHindi && q.optionsHindi[optIdx] && q.optionsHindi[optIdx].trim() !== '';

                                                    let className = "p-3 rounded-lg border-2 text-sm flex items-center gap-3 ";
                                                    if (isCorrect) className += "border-green-500 bg-green-50 text-green-900";
                                                    else if (isSelected && !isCorrect) className += "border-red-500 bg-red-50 text-red-900";
                                                    else className += "border-slate-100 text-slate-600 opacity-70";

                                                    return (
                                                        <div key={optIdx} className={className}>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isCorrect ? 'border-green-600 bg-green-600 text-white' :
                                                                isSelected ? 'border-red-600 bg-red-600 text-white' :
                                                                    'border-slate-300'
                                                                }`}>
                                                                {(isCorrect || isSelected) && <div className="w-2 h-2 bg-white rounded-full" />}
                                                            </div>
                                                            <span className="font-medium flex-1">
                                                                {opt}
                                                                {hasHindiOption && (
                                                                    <span className="block text-xs text-slate-500 mt-1 font-normal italic">
                                                                        {q.optionsHindi![optIdx]}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex gap-4">
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                    <span className="text-xs text-slate-500 block">Your Answer</span>
                                                    <span className={`font-mono font-bold ${status === 'correct' ? 'text-green-600' :
                                                        status === 'incorrect' ? 'text-red-600' : 'text-slate-400'
                                                        }`}>
                                                        {userAnswer ?? 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                                    <span className="text-xs text-green-600 block">Correct Answer</span>
                                                    <span className="font-mono font-bold text-green-700">{q.correctAnswer}</span>
                                                </div>
                                            </div>
                                        )}

                                        {(q.explanation || q.explanationHindi) && (
                                            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-sm space-y-3">
                                                {q.explanation && (
                                                    <div>
                                                        <p className="font-bold mb-1 flex items-center gap-2">
                                                            <BookOpen size={16} /> Explanation:
                                                        </p>
                                                        <p className="whitespace-pre-wrap">{q.explanation}</p>
                                                    </div>
                                                )}
                                                {q.explanationHindi && (
                                                    <div className={q.explanation ? "pt-3 border-t border-blue-200/50" : ""}>
                                                        <p className="font-bold mb-1 flex items-center gap-2 text-indigo-700">
                                                            <BookOpen size={16} /> व्याख्या (Explanation in Hindi):
                                                        </p>
                                                        <p className="whitespace-pre-wrap text-slate-700">{q.explanationHindi}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredQuestions.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        No questions found matching this filter.
                    </div>
                )}
            </div>
            )}
            <div className="mt-8 text-center text-slate-400 text-xs hidden print:block pt-8 border-t border-slate-100">
                This is a computer-generated document. No signature required.
                <br />
                Generated by Examinant Education Platform.
            </div>

            <style>{`
                @media print {
                    @page {
                        margin: 0;
                        size: A4;
                    }
                    body, html {
                        background: white !important;
                        overflow: hidden !important;
                        height: auto !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    /* Remove scrollbars from layout containers */
                    aside, nav, .overflow-y-auto, .overflow-auto, main {
                        overflow: visible !important;
                        height: auto !important;
                    }
                    ::-webkit-scrollbar {
                        display: none !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    /* Main Print Container Padding */
                    .print-container {
                        padding: 20mm !important;
                    }
                    
                    /* Background colors manually for some engines */
                    .bg-white { background-color: white !important; }
                    .bg-slate-50 { background-color: #f8fafc !important; }
                    .bg-slate-900 { background-color: #0f172a !important; }
                    
                    /* Stats Grid for print */
                    .grid-cols-1.md\\:grid-cols-4 {
                        display: grid !important;
                        grid-template-columns: repeat(4, 1fr) !important;
                        gap: 15px !important;
                    }
                    
                    /* OMR Bubble visibility on print */
                    .bg-green-500 { background-color: #22c55e !important; }
                    .bg-red-500 { background-color: #ef4444 !important; }
                    .border-green-500 { border-color: #22c55e !important; }
                    .border-red-500 { border-color: #ef4444 !important; }
                    
                    /* Avoid page breaks inside cards */
                    .bg-white.rounded-2xl {
                        page-break-inside: avoid;
                        break-inside: avoid;
                        margin-bottom: 20px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default StudentTestResultDetailPage;
