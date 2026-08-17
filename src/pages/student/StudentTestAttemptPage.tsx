import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Timer, ArrowLeft, Save, Loader2, ChevronLeft, ChevronRight, Flag, Clock, Lock, Check
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface Question {
    id: string;
    text: string;
    textHindi?: string;
    options: string[]; // For MCQ
    optionsHindi?: string[];
    correctAnswer: number | string; // index for MCQ, value for Numerical
    subject: string;
    chapter: string;
    unit?: string;
    type: 'MCQ' | 'Numerical';
    section: 'A' | 'B'; // Added for JEE Mains structure
}

interface TestData {
    id: string;
    title: string;
    questions: Question[];
    duration?: number; // in minutes
    testPattern?: string;
    enableSectionTimers?: boolean;
    sectionDurations?: Record<string, number>;
    settings?: {
        marksPerQuestion?: number;
        negativeMarking?: number;
    };
}

type QuestionStatus = 'notVisited' | 'notAnswered' | 'answered' | 'markedForReview' | 'answeredAndMarked';

const StudentTestAttemptPage = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;

    const [testData, setTestData] = useState<TestData | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [activeSubject, setActiveSubject] = useState<string>('Physics');

    // Answers storage
    const [answers, setAnswers] = useState<Record<number, number | string>>({}); // questionIndex -> answer
    const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
    const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));
    const [testLanguage, setTestLanguage] = useState<'english' | 'hindi'>('english');

    // Section B selections (5 out of 10)
    const [sectionBSelections, setSectionBSelections] = useState<Record<string, Set<number>>>({
        Physics: new Set(),
        Chemistry: new Set(),
        Mathematics: new Set()
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(3 * 60 * 60); // Default 3 hours
    const [showInstructions, setShowInstructions] = useState(true);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});
    
    // Timed section states
    const [sectionTimeRemaining, setSectionTimeRemaining] = useState<number>(0);
    const [completedSubjects, setCompletedSubjects] = useState<Set<string>>(new Set());

    const formatQuestionTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const fetchTest = async () => {
            if (testId) {
                try {
                    // Fetch Test Document
                    const docRef = doc(db, 'tests', testId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const rawData = { id: docSnap.id, ...docSnap.data() } as any;

                        // Fetch actual questions
                        const questionIds = rawData.questionIds || [];
                        const questionMappings = rawData.questionMappings || [];
                        let fullQuestions: Question[] = [];

                        if (questionIds.length > 0) {
                            // Fetch all questions from the database
                            const questionPromises = questionIds.map((id: string) => getDoc(doc(db, 'questions', id)));
                            const questionSnaps = await Promise.all(questionPromises);

                            fullQuestions = questionSnaps
                                .filter(snap => snap.exists())
                                .map(snap => {
                                    const qData = snap.data() as any;
                                    return {
                                        id: snap.id,
                                        ...qData,
                                        section: qData.section || (qData.type === 'MCQ' ? 'A' : 'B')
                                    } as Question;
                                });
                        } else if (questionMappings.length > 0) {
                            // Convert OMR Mappings to Interactive Questions
                            fullQuestions = questionMappings.map((m: any) => ({
                                id: `omr-${m.serialNumber}`,
                                text: m.questionText || `Question ${m.serialNumber}`,
                                options: m.options || ['Option A', 'Option B', 'Option C', 'Option D'],
                                correctAnswer: m.correctAnswer || 'A',
                                subject: m.subject || 'General',
                                chapter: m.chapter || 'OMR Test',
                                type: 'MCQ',
                                section: m.sectionId || 'A'
                            } as Question));
                        }

                        const data: TestData = {
                            id: rawData.id,
                            title: rawData.name,
                            questions: fullQuestions,
                            duration: rawData.settings?.duration || rawData.duration || 180,
                            testPattern: rawData.testPattern || (fullQuestions.some(q => q.type === 'Numerical') ? 'JEE_MAINS' : 'STANDARD'),
                            enableSectionTimers: rawData.settings?.enableSectionTimers || false,
                            sectionDurations: rawData.settings?.sectionDurations || {},
                            settings: rawData.settings
                        };

                        setTestData(data);

                        if (fullQuestions.length > 0) {
                            setActiveSubject(fullQuestions[0].subject);
                            
                            const subjects = Array.from(new Set(fullQuestions.map(q => q.subject)));
                            const initialSelections: Record<string, Set<number>> = {};
                            subjects.forEach(sub => {
                                initialSelections[sub] = new Set();
                            });
                            setSectionBSelections(initialSelections);
                        }

                        // Set timer
                        if (data.duration) {
                            setTimeRemaining(data.duration * 60);
                        }
                        if (data.enableSectionTimers && fullQuestions.length > 0) {
                            const firstSub = fullQuestions[0].subject;
                            const subDur = data.sectionDurations?.[firstSub] || 30;
                            setSectionTimeRemaining(subDur * 60);
                        }
                    } else {
                        alert('Test not found');
                        navigate('/dashboard/tests');
                    }
                } catch (error) {
                    console.error("Error fetching test:", error);
                    alert("Error loading test content");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchTest();
    }, [testId, navigate]);

    // Timer Logic
    useEffect(() => {
        if (!showInstructions && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    const newTime = Math.max(0, prev - 1);
                    if (newTime === 0) {
                        handleSubmit(true); // Auto-submit when time's up
                    }
                    return newTime;
                });
                if (testData?.enableSectionTimers) {
                    setSectionTimeRemaining(prev => Math.max(0, prev - 1));
                }
                setQuestionTimes(prev => ({
                    ...prev,
                    [currentQuestionIndex]: (prev[currentQuestionIndex] || 0) + 1
                }));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [showInstructions, timeRemaining, currentQuestionIndex, testData]);

    // Section Transition Logic
    useEffect(() => {
        if (testData?.enableSectionTimers && !showInstructions && sectionTimeRemaining === 0 && testData.questions.length > 0) {
            const subjects = Array.from(new Set(testData.questions.map(q => q.subject)));
            const activeIdx = subjects.indexOf(activeSubject);
            
            if (activeIdx !== -1 && activeIdx < subjects.length - 1) {
                const nextSub = subjects[activeIdx + 1];
                
                // Add current subject to completed
                setCompletedSubjects(prev => {
                    const nextCompleted = new Set(prev);
                    nextCompleted.add(activeSubject);
                    return nextCompleted;
                });
                
                // Switch to next subject
                setActiveSubject(nextSub);
                
                // Find first question of next subject
                const nextQIdx = testData.questions.findIndex(q => q.subject === nextSub);
                if (nextQIdx !== -1) {
                    setCurrentQuestionIndex(nextQIdx);
                    setVisitedQuestions(prev => new Set(prev).add(nextQIdx));
                }
                
                // Load next subject's duration
                const nextDur = testData.sectionDurations?.[nextSub] || 30;
                setSectionTimeRemaining(nextDur * 60);
                
                alert(`Time for ${activeSubject} has ended! Automatically moving to the next section: ${nextSub}.`);
            } else if (activeIdx !== -1 && activeIdx === subjects.length - 1) {
                // Last subject timer expired -> auto-submit the exam!
                handleSubmit(true);
            }
        }
    }, [sectionTimeRemaining, testData, showInstructions]);

    const handleNextSection = () => {
        if (!testData) return;
        const subjects = Array.from(new Set(testData.questions.map(q => q.subject)));
        const activeIdx = subjects.indexOf(activeSubject);

        if (activeIdx !== -1) {
            const isLast = activeIdx === subjects.length - 1;
            const msg = isLast 
                ? "Are you sure you want to submit this final section and complete the test?"
                : `Are you sure you want to submit the "${activeSubject}" section and move to the next section? You will NOT be able to return to "${activeSubject}".`;
            
            if (window.confirm(msg)) {
                if (!isLast) {
                    const nextSub = subjects[activeIdx + 1];
                    setCompletedSubjects(prev => {
                        const nextCompleted = new Set(prev);
                        nextCompleted.add(activeSubject);
                        return nextCompleted;
                    });
                    setActiveSubject(nextSub);
                    
                    const nextQIdx = testData.questions.findIndex(q => q.subject === nextSub);
                    if (nextQIdx !== -1) {
                        setCurrentQuestionIndex(nextQIdx);
                        setVisitedQuestions(prev => new Set(prev).add(nextQIdx));
                    }
                    
                    const nextDur = testData.sectionDurations?.[nextSub] || 30;
                    setSectionTimeRemaining(nextDur * 60);
                } else {
                    handleSubmit(false);
                }
            }
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatSectionTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getQuestionStatus = (qIndex: number): QuestionStatus => {
        if (!visitedQuestions.has(qIndex)) return 'notVisited';

        const isAnswered = answers[qIndex] !== undefined;
        const isMarked = markedForReview.has(qIndex);

        if (isAnswered && isMarked) return 'answeredAndMarked';
        if (isAnswered) return 'answered';
        if (isMarked) return 'markedForReview';
        return 'notAnswered';
    };

    const getStatusColor = (status: QuestionStatus) => {
        switch (status) {
            case 'notVisited': return 'bg-white border-slate-300 text-slate-700';
            case 'notAnswered': return 'bg-red-50 border-red-300 text-red-700';
            case 'answered': return 'bg-green-50 border-green-500 text-green-700';
            case 'markedForReview': return 'bg-purple-50 border-purple-500 text-purple-700';
            case 'answeredAndMarked': return 'bg-blue-50 border-blue-500 text-blue-700';
        }
    };

    const handleAnswer = (answer: number | string) => {
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));

        const currentQ = testData?.questions[currentQuestionIndex];
        if (currentQ?.section === 'B' && currentQ.subject) {
            const subject = currentQ.subject;
            setSectionBSelections(prev => {
                const newSelections = { ...prev };
                // Safety: initialize subject set if it doesn't exist (cases like 'General' or misc subjects)
                if (!newSelections[subject]) {
                    (newSelections as any)[subject] = new Set();
                }
                newSelections[subject] = new Set(newSelections[subject]);
                newSelections[subject].add(currentQuestionIndex);
                return newSelections;
            });
        }
    };

    const clearResponse = () => {
        setAnswers(prev => {
            const newAnswers = { ...prev };
            delete newAnswers[currentQuestionIndex];
            return newAnswers;
        });

        const currentQ = testData?.questions[currentQuestionIndex];
        if (currentQ?.section === 'B' && currentQ.subject) {
            const subject = currentQ.subject;
            setSectionBSelections(prev => {
                const newSelections = { ...prev };
                if (newSelections[subject]) {
                    newSelections[subject] = new Set(newSelections[subject]);
                    newSelections[subject].delete(currentQuestionIndex);
                }
                return newSelections;
            });
        }
    };

    const toggleMarkForReview = () => {
        setMarkedForReview(prev => {
            const newSet = new Set(prev);
            if (newSet.has(currentQuestionIndex)) {
                newSet.delete(currentQuestionIndex);
            } else {
                newSet.add(currentQuestionIndex);
            }
            return newSet;
        });
    };

    const goToQuestion = (qIndex: number) => {
        setCurrentQuestionIndex(qIndex);
        setVisitedQuestions(prev => new Set(prev).add(qIndex));

        // Auto-switch subject if needed
        if (testData?.questions[qIndex]) {
            setActiveSubject(testData.questions[qIndex].subject);
        }
    };

    const nextQuestion = () => {
        if (testData && currentQuestionIndex < testData.questions.length - 1) {
            goToQuestion(currentQuestionIndex + 1);
        }
    };

    const previousQuestion = () => {
        if (currentQuestionIndex > 0) {
            goToQuestion(currentQuestionIndex - 1);
        }
    };

    const saveAndNext = () => {
        // Answer is already saved via handleAnswer
        nextQuestion();
    };

    const handleSubmit = async (autoSubmit = false) => {
        if (!currentUser || !testData) return;

        // Validate Section B selections for JEE Mains pattern
        if (testData.testPattern === 'JEE_MAINS') {
            const subjects = Array.from(new Set(testData.questions.map(q => q.subject)));
            for (const subject of subjects) {
                if (sectionBSelections[subject] && sectionBSelections[subject].size > 5) {
                    alert(`You have selected ${sectionBSelections[subject].size} questions in ${subject} Section B. Only 5 will be evaluated.`);
                }
            }
        }

        if (!autoSubmit && !window.confirm("Are you sure you want to submit the test?")) return;

        setIsSubmitting(true);
        try {
            // Calculate Score
            let score = 0;
            let correctCount = 0;
            let attemptedCount = 0;

            const marksPerQuestion = testData.settings?.marksPerQuestion !== undefined ? Number(testData.settings.marksPerQuestion) : 4;
            const rawNegative = testData.settings?.negativeMarking !== undefined ? Number(testData.settings.negativeMarking) : -1;
            const negativeMarking = rawNegative > 0 ? -rawNegative : rawNegative;

            const sectionWise: Record<string, { score: number; correct: number; wrong: number; unattempted: number; maxScore: number }> = {};

            testData.questions.forEach((q, idx) => {
                const subject = q.subject || 'General';
                if (!sectionWise[subject]) {
                    sectionWise[subject] = { score: 0, correct: 0, wrong: 0, unattempted: 0, maxScore: 0 };
                }

                let isSectionBEligible = true;
                if (q.section === 'B') {
                    const subjectSelections = Array.from(sectionBSelections[q.subject] || []);
                    if (!subjectSelections.includes(idx) || subjectSelections.indexOf(idx) >= 5) {
                        isSectionBEligible = false;
                    }
                }

                if (!isSectionBEligible) {
                    return; // Skip this question in scoring
                }

                sectionWise[subject].maxScore += marksPerQuestion;

                if (answers[idx] !== undefined) {
                    attemptedCount++;
                    if (String(answers[idx]) === String(q.correctAnswer)) {
                        score += marksPerQuestion;
                        correctCount++;
                        sectionWise[subject].score += marksPerQuestion;
                        sectionWise[subject].correct++;
                    } else {
                        score += negativeMarking;
                        sectionWise[subject].score += negativeMarking;
                        sectionWise[subject].wrong++;
                    }
                } else {
                    sectionWise[subject].unattempted++;
                }
            });

            const resultData = {
                testId: testData.id,
                testTitle: testData.title,
                score: score,
                totalQuestions: testData.questions.length,
                correctAnswers: correctCount,
                attemptedQuestions: attemptedCount,
                attemptDate: serverTimestamp(),
                duration: (testData.duration ? testData.duration * 60 : 180 * 60) - timeRemaining,
                answers: answers,
                markedForReview: Array.from(markedForReview),
                questionTimes: questionTimes,
                sectionWiseScore: sectionWise,
                sectionBSelections: Object.keys(sectionBSelections).reduce((acc, key) => {
                    acc[key] = Array.from(sectionBSelections[key]);
                    return acc;
                }, {} as Record<string, number[]>)
            };

            await addDoc(collection(db, 'users', currentUser.uid, 'attempts'), resultData);

            alert(`Test Submitted!${autoSubmit ? ' (Time Up)' : ''}\n\nYour Score: ${score}\nCorrect: ${correctCount}\nAttempted: ${attemptedCount}`);
            navigate('/dashboard/tests');

        } catch (error) {
            console.error("Error submitting test:", error);
            alert("Failed to submit test. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-slate-500 font-medium">Loading your test environment...</p>
                </div>
            </div>
        );
    }

    if (!testData) return <div>Test failed to load.</div>;

    // Instructions Overlay
    if (showInstructions) {
        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
                >
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                        <h2 className="text-2xl font-bold">{testData.title}</h2>
                        <p className="text-blue-100 mt-1">Please read the instructions carefully before starting</p>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-3">Test Pattern</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{testData.questions.length}</div>
                                    <div className="text-sm text-slate-600">Total Questions</div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {testData.duration ? `${testData.duration} Mins` : formatTime(timeRemaining)}
                                    </div>
                                    <div className="text-sm text-slate-600">Duration</div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        +{testData.settings?.marksPerQuestion || 4} / {testData.settings?.negativeMarking || -1}
                                    </div>
                                    <div className="text-sm text-slate-600">Marking Scheme</div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {testData.questions.length * (testData.settings?.marksPerQuestion || 4)}
                                    </div>
                                    <div className="text-sm text-slate-600">Total Marks</div>
                                </div>
                            </div>
                        </div>

                        {testData.testPattern === 'JEE_MAINS' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 className="font-bold text-yellow-900 mb-2">Section B Instructions</h4>
                                <p className="text-sm text-yellow-800">
                                    Each subject has 10 Numerical questions in Section B. You must attempt <strong>any 5 out of 10</strong>.
                                    Only the first 5 selected answers will be evaluated.
                                </p>
                            </div>
                        )}

                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-3">General Instructions</h3>
                            <ul className="space-y-2 text-sm text-slate-600">
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                                    <span>The test will auto-submit when the timer reaches 00:00:00</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                                    <span>You can navigate between questions using the question palette</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                                    <span>Mark questions for review to revisit them later</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                                    <span>Ensure stable internet connection throughout the test</span>
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={() => setShowInstructions(false)}
                            disabled={testData.questions.length === 0}
                            className={`w-full py-3 font-bold rounded-xl transition-colors shadow-lg ${
                                testData.questions.length === 0 
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                            }`}
                        >
                            {testData.questions.length === 0 ? 'No Questions Added to this Test' : 'I understand, Start Test'}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const currentQuestion = testData.questions[currentQuestionIndex];
    const subjectQuestions = testData.questions.filter(q => q.subject === activeSubject);
    const sectionBCount = sectionBSelections[activeSubject]?.size || 0;
    const subjectsInTest = Array.from(new Set(testData.questions.map(q => q.subject)));

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-6 py-3 shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
                                    navigate('/dashboard/tests');
                                }
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-sm md:text-lg font-bold text-slate-800">{testData.title}</h1>
                            <p className="text-xs text-slate-500">Question {currentQuestionIndex + 1} of {testData.questions.length}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        {testData.enableSectionTimers ? (
                            <div className="flex flex-col items-end gap-1">
                                <div className="text-xs font-mono text-slate-500 font-semibold px-2 py-0.5 rounded bg-slate-100">
                                    Total: {formatTime(timeRemaining)}
                                </div>
                                <div className={`flex items-center gap-1.5 font-mono text-sm md:text-base font-bold px-3 py-1 rounded-lg border-2 ${
                                    sectionTimeRemaining < 60
                                        ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                                        : sectionTimeRemaining < 300
                                            ? 'bg-orange-50 text-orange-600 border-orange-200'
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                    <Timer size={16} />
                                    <span>{activeSubject}: {formatSectionTime(sectionTimeRemaining)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className={`flex items-center gap-2 font-mono text-sm md:text-lg font-bold px-3 md:px-4 py-2 rounded-lg ${timeRemaining < 300 ? 'bg-red-50 text-red-600 animate-pulse' :
                                timeRemaining < 600 ? 'bg-orange-50 text-orange-600' :
                                    'bg-slate-100 text-slate-700'
                                }`}>
                                <Timer size={18} />
                                <span className="hidden md:inline">{formatTime(timeRemaining)}</span>
                                <span className="md:hidden">{Math.floor(timeRemaining / 60)}m</span>
                            </div>
                        )}

                        {testData.enableSectionTimers ? (
                            (() => {
                                const subjectsList = Array.from(new Set(testData.questions.map(q => q.subject)));
                                const activeIdx = subjectsList.indexOf(activeSubject);
                                const isLast = activeIdx === subjectsList.length - 1;

                                return isLast ? (
                                    <button
                                        onClick={() => setShowSubmitConfirm(true)}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-4 md:px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20 text-sm md:text-base"
                                    >
                                        <Save size={16} />
                                        <span>Submit Exam</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleNextSection}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-4 md:px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 text-sm md:text-base"
                                    >
                                        <ChevronRight size={16} />
                                        <span>Next Section</span>
                                    </button>
                                );
                            })()
                        ) : (
                            <button
                                onClick={() => setShowSubmitConfirm(true)}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-4 md:px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20 text-sm md:text-base"
                            >
                                <Save size={16} />
                                <span className="hidden md:inline">Submit</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Subject Tabs */}
                <div className="mt-3 flex gap-2 overflow-x-auto py-1">
                    {subjectsInTest.map(subject => {
                        const isActive = activeSubject === subject;
                        const isComp = completedSubjects.has(subject);
                        const isLock = testData.enableSectionTimers && !isActive && !isComp;

                        return (
                            <button
                                key={subject}
                                disabled={!!testData.enableSectionTimers}
                                onClick={() => {
                                    if (testData.enableSectionTimers) return;
                                    setActiveSubject(subject);
                                    const firstQuestionOfSubject = testData.questions.findIndex(q => q.subject === subject);
                                    if (firstQuestionOfSubject !== -1) goToQuestion(firstQuestionOfSubject);
                                }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : isComp
                                            ? 'bg-green-50 text-green-700 border border-green-200 opacity-80 cursor-not-allowed'
                                            : isLock
                                                ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-55 cursor-not-allowed'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {isComp && <Check size={14} className="text-green-600" />}
                                {isLock && <Lock size={14} className="text-slate-400" />}
                                <span>{subject}</span>
                                {testData.enableSectionTimers && isActive && (
                                    <span className="text-[10px] bg-blue-700 text-blue-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse ml-1">
                                        Active
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row">
                {/* Main Question Area */}
                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestionIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 max-w-4xl mx-auto"
                        >
                            {/* Question Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold rounded-xl flex items-center justify-center shadow-lg">
                                        {currentQuestionIndex + 1}
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500">
                                            {currentQuestion.subject} • Section {currentQuestion.section}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {currentQuestion.unit ? `${currentQuestion.unit} > ` : ''}{currentQuestion.chapter}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Language Switcher Toggle */}
                                    {(currentQuestion.textHindi || (currentQuestion.optionsHindi && currentQuestion.optionsHindi.some(o => o.trim() !== ''))) && (
                                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                                            <button
                                                type="button"
                                                onClick={() => setTestLanguage('english')}
                                                className={`px-2 py-1 rounded transition-colors ${testLanguage === 'english'
                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-800'
                                                    }`}
                                            >
                                                English
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTestLanguage('hindi')}
                                                className={`px-2 py-1 rounded transition-colors ${testLanguage === 'hindi'
                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-800'
                                                    }`}
                                            >
                                                हिंदी
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
                                        <Clock size={13} className="text-slate-500" />
                                        <span>Time spent: {formatQuestionTime(questionTimes[currentQuestionIndex] || 0)}</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentQuestion.type === 'MCQ' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {currentQuestion.type}
                                    </span>
                                </div>
                            </div>

                            {/* Question Text */}
                            <div className="mb-6">
                                <p className="text-lg md:text-xl font-medium text-slate-900 leading-relaxed">
                                    {testLanguage === 'hindi' && currentQuestion.textHindi
                                        ? currentQuestion.textHindi
                                        : currentQuestion.text}
                                </p>
                            </div>

                            {/* Answer Options */}
                            {currentQuestion.type === 'MCQ' ? (
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, oIdx) => {
                                        const hasHindiOption = currentQuestion.optionsHindi && currentQuestion.optionsHindi[oIdx] && currentQuestion.optionsHindi[oIdx].trim() !== '';
                                        const displayText = (testLanguage === 'hindi' && hasHindiOption)
                                            ? currentQuestion.optionsHindi![oIdx]
                                            : option;
                                        return (
                                            <label
                                                key={oIdx}
                                                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[currentQuestionIndex] === oIdx
                                                    ? 'bg-blue-50 border-blue-500 shadow-md shadow-blue-500/20'
                                                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${answers[currentQuestionIndex] === oIdx
                                                    ? 'border-blue-600 bg-blue-600'
                                                    : 'border-slate-300 bg-white'
                                                    }`}>
                                                    {answers[currentQuestionIndex] === oIdx && (
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-700">
                                                            {String.fromCharCode(65 + oIdx)}.
                                                        </span>
                                                        <span className="text-slate-800">{displayText}</span>
                                                    </div>
                                                </div>
                                                <input
                                                    type="radio"
                                                    name={`q-${currentQuestionIndex}`}
                                                    className="hidden"
                                                    checked={answers[currentQuestionIndex] === oIdx}
                                                    onChange={() => handleAnswer(oIdx)}
                                                />
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Enter your answer (numerical value):
                                    </label>
                                    <input
                                        type="text"
                                        value={answers[currentQuestionIndex] || ''}
                                        onChange={(e) => handleAnswer(e.target.value)}
                                        className="w-full md:w-1/2 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-lg font-mono"
                                        placeholder="e.g., 9.8 or 100"
                                    />
                                    {currentQuestion.section === 'B' && sectionBCount >= 5 && !sectionBSelections[activeSubject].has(currentQuestionIndex) && (
                                        <p className="mt-2 text-sm text-orange-600 font-semibold">
                                            ⚠️ You've already selected 5 questions in Section B. This answer won't be evaluated.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-8 flex flex-wrap gap-3">
                                <button
                                    onClick={toggleMarkForReview}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${markedForReview.has(currentQuestionIndex)
                                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    <Flag size={16} />
                                    {markedForReview.has(currentQuestionIndex) ? 'Marked' : 'Mark for Review'}
                                </button>
                                <button
                                    onClick={clearResponse}
                                    disabled={answers[currentQuestionIndex] === undefined}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    Clear Response
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    {(() => {
                        const activeSubjectQuestions = testData.questions.filter(q => q.subject === activeSubject);
                        const firstActiveSubjectQIdx = activeSubjectQuestions.length > 0 ? testData.questions.indexOf(activeSubjectQuestions[0]) : 0;
                        const lastActiveSubjectQIdx = activeSubjectQuestions.length > 0 ? testData.questions.indexOf(activeSubjectQuestions[activeSubjectQuestions.length - 1]) : 0;

                        const isPrevDisabled = testData.enableSectionTimers ? currentQuestionIndex === firstActiveSubjectQIdx : currentQuestionIndex === 0;
                        const isNextDisabled = testData.enableSectionTimers ? currentQuestionIndex === lastActiveSubjectQIdx : currentQuestionIndex === testData.questions.length - 1;

                        return (
                            <div className="flex justify-between items-center mt-6 max-w-4xl mx-auto">
                                <button
                                    onClick={previousQuestion}
                                    disabled={isPrevDisabled}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={20} />
                                    Previous
                                </button>
                                <button
                                    onClick={saveAndNext}
                                    disabled={isNextDisabled}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save & Next
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        );
                    })()}
                </main>

                {/* Question Palette Sidebar */}
                <aside className="w-full md:w-80 bg-white border-t md:border-l border-slate-200 p-4 overflow-y-auto">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Question Palette</h3>

                    {/* Section B Counter */}
                    {testData.testPattern === 'JEE_MAINS' && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-semibold text-blue-900">
                                Section B ({activeSubject}): {sectionBSelections[activeSubject]?.size || 0}/5 selected
                            </p>
                        </div>
                    )}

                    {/* Status Legend */}
                    <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded border-2 bg-white border-slate-300"></div>
                            <span className="text-slate-600">Not Visited</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-red-50 border-2 border-red-300"></div>
                            <span className="text-slate-600">Not Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-green-50 border-2 border-green-500"></div>
                            <span className="text-slate-600">Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-purple-50 border-2 border-purple-500"></div>
                            <span className="text-slate-600">Marked</span>
                        </div>
                    </div>

                    {/* Question Grid */}
                    <div className="space-y-4">
                        {testData.testPattern === 'JEE_MAINS' ? (
                            <>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 mb-2">Section A (MCQ)</h4>
                                    <div className="grid grid-cols-5 gap-2">
                                        {subjectQuestions.filter(q => q.section === 'A').map((q) => {
                                            const globalIdx = testData.questions.indexOf(q);
                                            const status = getQuestionStatus(globalIdx);
                                            return (
                                                <button
                                                    key={globalIdx}
                                                    onClick={() => goToQuestion(globalIdx)}
                                                    className={`w-full aspect-square rounded-lg border-2 font-bold text-sm transition-all ${globalIdx === currentQuestionIndex
                                                        ? 'ring-2 ring-blue-500 scale-110'
                                                        : ''
                                                        } ${getStatusColor(status)}`}
                                                >
                                                    {globalIdx + 1}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 mb-2">Section B (Numerical)</h4>
                                    <div className="grid grid-cols-5 gap-2">
                                        {subjectQuestions.filter(q => q.section === 'B').map((q) => {
                                            const globalIdx = testData.questions.indexOf(q);
                                            const status = getQuestionStatus(globalIdx);
                                            return (
                                                <button
                                                    key={globalIdx}
                                                    onClick={() => goToQuestion(globalIdx)}
                                                    className={`w-full aspect-square rounded-lg border-2 font-bold text-sm transition-all ${globalIdx === currentQuestionIndex
                                                        ? 'ring-2 ring-blue-500 scale-110'
                                                        : ''
                                                        } ${getStatusColor(status)}`}
                                                >
                                                    {globalIdx + 1}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="grid grid-cols-5 gap-2">
                                {testData.questions.map((q, idx) => {
                                    if (testData.enableSectionTimers && q.subject !== activeSubject) return null;
                                    const status = getQuestionStatus(idx);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => goToQuestion(idx)}
                                            className={`w-full aspect-square rounded-lg border-2 font-bold text-sm transition-all ${idx === currentQuestionIndex
                                                ? 'ring-2 ring-blue-500 scale-110'
                                                : ''
                                                } ${getStatusColor(status)}`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {/* Submit Confirmation Modal */}
            <AnimatePresence>
                {showSubmitConfirm && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6"
                        >
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Submit Test?</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Total Questions:</span>
                                    <span className="font-bold">{testData.questions.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Answered:</span>
                                    <span className="font-bold text-green-600">{Object.keys(answers).length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Not Answered:</span>
                                    <span className="font-bold text-red-600">
                                        {testData.questions.length - Object.keys(answers).length}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Marked for Review:</span>
                                    <span className="font-bold text-purple-600">{markedForReview.size}</span>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 mb-6">
                                Once submitted, you cannot change your answers. Are you sure you want to submit?
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSubmitConfirm(false)}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleSubmit(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 shadow-lg shadow-green-500/20 disabled:opacity-70"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentTestAttemptPage;
