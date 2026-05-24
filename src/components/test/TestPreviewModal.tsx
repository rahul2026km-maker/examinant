import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Flag, Timer, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import type { TestFormData } from '../../types/test.types';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

// ─── Shared question shape used inside this modal ───────────────────────────
interface PreviewQuestion {
    id: string;
    text: string;
    options: string[];
    type: 'MCQ' | 'Numerical';
    subject: string;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface TestPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Pass formData for the wizard "preview before publish" mode */
    formData?: Partial<TestFormData>;
    /** Pass testId to load a real published/draft test from Firestore */
    testId?: string;
}

// ─── Fallback sample questions (wizard mode only) ────────────────────────────
const SAMPLES: PreviewQuestion[] = [
    {
        id: 's1', subject: 'Physics', type: 'MCQ',
        text: 'A particle moves along the x-axis. At t = 0 it is at x = 0 with v = 5 m/s and a = 2 m/s². What is the displacement after 3 s?',
        options: ['21 m', '24 m', '18 m', '27 m'],
    },
    {
        id: 's2', subject: 'Chemistry', type: 'MCQ',
        text: 'Which compound exhibits the highest boiling point among the following?',
        options: ['CH₄', 'NH₃', 'H₂O', 'HF'],
    },
    {
        id: 's3', subject: 'Mathematics', type: 'MCQ',
        text: 'The number of solutions of sin x = x/5 in [0, 2π] is:',
        options: ['0', '1', '2', '3'],
    },
    {
        id: 's4', subject: 'Physics', type: 'Numerical',
        text: 'The value of ∫₀^π sin(x) dx is equal to ________.',
        options: [],
    },
    {
        id: 's5', subject: 'Chemistry', type: 'MCQ',
        text: 'Which of the following has the highest electronegativity?',
        options: ['F', 'O', 'N', 'Cl'],
    },
];

type QStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked';

const STATUS_CLS: Record<QStatus, string> = {
    'not-visited': 'bg-slate-200 text-slate-500',
    'not-answered': 'bg-red-100 text-red-700 border border-red-300',
    'answered': 'bg-green-500 text-white',
    'marked': 'bg-purple-500 text-white',
};

// ─── Inner component (renders once questions are ready) ───────────────────────
interface InnerProps {
    questions: PreviewQuestion[];
    testName: string;
    subjects: string[];
    duration: number;
    marksPerQ: number;
    negMarks: number;
    instructions?: string;
    totalQ: number;           // real total (may be more than questions.length when using samples)
    isLive: boolean;          // true = all real questions, false = sample subset
    onClose: () => void;
}

const PreviewInner = ({
    questions, testName, subjects, duration, marksPerQ, negMarks,
    instructions, totalQ, isLive, onClose,
}: InnerProps) => {
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<Record<number, number | string>>({});
    const [qStatus, setQStatus] = useState<Record<number, QStatus>>({ 0: 'not-answered' });
    const [numericalInput, setNumericalInput] = useState<Record<number, string>>({});

    const count = questions.length;
    const q = questions[currentQ];

    const goTo = useCallback((idx: number) => {
        setQStatus(prev => ({
            ...prev,
            [idx]: prev[idx] === 'not-visited' || !prev[idx] ? 'not-answered' : prev[idx],
        }));
        setCurrentQ(idx);
    }, []);

    const handleSelect = (optIdx: number) => {
        setSelectedAnswer(prev => ({ ...prev, [currentQ]: optIdx }));
        setQStatus(prev => ({ ...prev, [currentQ]: 'answered' }));
    };

    const hours = Math.floor(duration / 60);
    const mins = duration % 60;

    // Unique subjects across actual questions
    const activeSubjects = subjects.length > 0 ? subjects
        : Array.from(new Set(questions.map(q => q.subject)));

    return (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">

            {/* Admin banner */}
            <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 text-amber-700 text-sm">
                    <AlertCircle size={16} />
                    {isLive
                        ? <span><strong>Admin Preview</strong> — all {count} questions loaded</span>
                        : <span><strong>Admin Preview</strong> — showing {count} sample questions from {totalQ} total</span>
                    }
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Test header */}
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="font-bold text-lg">{testName || 'Untitled Test'}</h1>
                    <p className="text-slate-300 text-sm">{activeSubjects.join(' · ')}</p>
                </div>
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-lg">
                        <Timer size={16} className="text-green-400" />
                        <span className="font-mono font-bold text-green-400 text-sm">
                            {String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')}:00
                        </span>
                    </div>
                    <div className="text-sm text-slate-300">
                        <span className="font-bold text-white">+{marksPerQ}</span>
                        {' / '}
                        <span className="text-red-400 font-bold">{negMarks}</span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">

                {/* Question area */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* Subject tabs */}
                    <div className="flex border-b border-slate-200 bg-white flex-shrink-0 overflow-x-auto">
                        {activeSubjects.map((sub, si) => (
                            <button
                                key={sub || `sub-${si}`}
                                className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${q.subject === sub
                                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                                onClick={() => {
                                    const idx = questions.findIndex(x => x.subject === sub);
                                    if (idx >= 0) goTo(idx);
                                }}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>

                    {/* Question body */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {instructions && currentQ === 0 && (
                            <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-blue-700 font-semibold mb-1.5">
                                    <BookOpen size={15} /> Instructions
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-line">{instructions}</p>
                            </div>
                        )}

                        {/* Q meta */}
                        <div className="flex items-center gap-2 mb-5">
                            <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">Q{currentQ + 1}</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${q.type === 'MCQ' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {q.type === 'MCQ' ? 'Single Correct' : 'Numerical'}
                            </span>
                            <span className="text-xs text-slate-400 ml-auto">{q.subject}</span>
                        </div>

                        <p className="text-slate-800 text-base leading-relaxed mb-8">{q.text}</p>

                        {q.type === 'MCQ' ? (
                            <div className="space-y-3">
                                {q.options.map((opt, idx) => {
                                    const isSel = selectedAnswer[currentQ] === idx;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelect(idx)}
                                            className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${isSel ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold text-sm ${isSel ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-600'}`}>
                                                {['A', 'B', 'C', 'D'][idx]}
                                            </div>
                                            <span className="text-slate-700 pt-0.5">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Enter your answer:</label>
                                <input
                                    type="number" step="any"
                                    value={numericalInput[currentQ] || ''}
                                    onChange={e => {
                                        setNumericalInput(prev => ({ ...prev, [currentQ]: e.target.value }));
                                        if (e.target.value) setQStatus(prev => ({ ...prev, [currentQ]: 'answered' }));
                                    }}
                                    placeholder="Type numerical answer..."
                                    className="max-w-xs w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono"
                                />
                            </div>
                        )}
                    </div>

                    {/* Nav bar */}
                    <div className="border-t border-slate-200 px-6 py-3.5 flex items-center justify-between bg-white flex-shrink-0">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setQStatus(prev => ({
                                    ...prev,
                                    [currentQ]: prev[currentQ] === 'marked' ? 'not-answered' : 'marked',
                                }))}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${qStatus[currentQ] === 'marked'
                                    ? 'border-purple-600 bg-purple-600 text-white'
                                    : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                                    }`}
                            >
                                <Flag size={15} />
                                {qStatus[currentQ] === 'marked' ? 'Unmark' : 'Mark for Review'}
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedAnswer(prev => { const n = { ...prev }; delete n[currentQ]; return n; });
                                    setQStatus(prev => ({ ...prev, [currentQ]: 'not-answered' }));
                                    setNumericalInput(prev => { const n = { ...prev }; delete n[currentQ]; return n; });
                                }}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button disabled={currentQ === 0} onClick={() => goTo(currentQ - 1)}
                                className="flex items-center gap-1 px-5 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-40">
                                <ChevronLeft size={17} /> Prev
                            </button>
                            <button disabled={currentQ === count - 1} onClick={() => goTo(currentQ + 1)}
                                className="flex items-center gap-1 px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-40">
                                Next <ChevronRight size={17} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Palette */}
                <div className="w-60 border-l border-slate-200 flex flex-col flex-shrink-0 bg-slate-50 overflow-y-auto">
                    <div className="p-4 border-b border-slate-200">
                        <p className="font-bold text-slate-700 text-sm">Question Palette</p>
                    </div>

                    {/* Legend */}
                    <div className="p-3 border-b border-slate-100 space-y-1.5">
                        {([
                            { cls: 'bg-green-500', label: 'Answered' },
                            { cls: 'bg-red-100 border border-red-300', label: 'Not Answered' },
                            { cls: 'bg-purple-500', label: 'Marked for Review' },
                            { cls: 'bg-slate-200', label: 'Not Visited' },
                        ] as const).map(({ cls, label }) => (
                            <div key={label} className="flex items-center gap-2 text-xs text-slate-600">
                                <div className={`w-4 h-4 rounded-full ${cls}`} />
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="p-4">
                        <div className="grid grid-cols-5 gap-1.5">
                            {questions.map((_, idx) => (
                                <button key={idx} onClick={() => goTo(idx)}
                                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${idx === currentQ ? 'ring-2 ring-blue-600 ring-offset-1' : ''} ${STATUS_CLS[qStatus[idx] || 'not-visited']}`}>
                                    {idx + 1}
                                </button>
                            ))}
                            {!isLive && Array.from({ length: Math.min(totalQ - count, 10) }).map((_, i) => (
                                <div key={`g${i}`} className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-300 font-bold">
                                    {count + i + 1}
                                </div>
                            ))}
                            {!isLive && totalQ - count > 10 && (
                                <div key="more-count" className="col-span-5 text-center text-xs text-slate-400 pt-1">+{totalQ - count - 10} more</div>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-auto p-4 border-t border-slate-200 space-y-2 text-xs text-slate-600">
                        <div className="flex justify-between">
                            <span>Total Questions</span>
                            <span className="font-bold text-slate-800">{totalQ}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Duration</span>
                            <span className="font-bold text-slate-800">{hours}h {mins}m</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Max Marks</span>
                            <span className="font-bold text-green-700">{totalQ * marksPerQ}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const TestPreviewModal = ({ isOpen, onClose, formData, testId }: TestPreviewModalProps) => {
    const [liveQuestions, setLiveQuestions] = useState<PreviewQuestion[]>([]);
    const [liveMeta, setLiveMeta] = useState<{
        name: string; duration: number; marksPerQ: number; negMarks: number;
        instructions?: string; subjects: string[];
    } | null>(null);
    const [loadingLive, setLoadingLive] = useState(false);
    const [liveError, setLiveError] = useState<string | null>(null);

    // Fetch real test when testId is supplied
    useEffect(() => {
        if (!isOpen || !testId) return;
        let cancelled = false;
        setLoadingLive(true);
        setLiveError(null);

        (async () => {
            try {
                const testSnap = await getDoc(doc(db, 'tests', testId));
                if (!testSnap.exists()) { setLiveError('Test not found.'); return; }

                const test = { id: testSnap.id, ...testSnap.data() } as any;
                const qIds: string[] = test.questionIds || [];

                // Fetch questions in batches of 10
                const fetched: PreviewQuestion[] = [];
                for (let i = 0; i < qIds.length; i += 10) {
                    const chunk = qIds.slice(i, i + 10);
                    const snaps = await Promise.all(chunk.map((id: string) => getDoc(doc(db, 'questions', id))));
                    snaps.forEach(s => {
                        if (s.exists()) {
                            const d = s.data() as any;
                            fetched.push({
                                id: s.id,
                                text: d.text || d.question || 'Question text not available',
                                options: d.options || [],
                                type: d.type === 'Numerical' ? 'Numerical' : 'MCQ',
                                subject: d.subject || 'General',
                            });
                        }
                    });
                }

                if (!cancelled) {
                    let subjects = Array.from(new Set(fetched.map(q => q.subject)));
                    if (subjects.length === 0) {
                        subjects = test.subjects || (test.autoConfig?.subjects || test.customConfig?.subjects || ['Physics', 'Chemistry', 'Mathematics']);
                    }
                    
                    const totalQ = qIds.length || test.totalQuestions || test.questionConfig?.totalQuestions || 90;
                    
                    // If no questions are found in the test (e.g. empty/draft test), generate dynamic questions
                    if (fetched.length === 0) {
                        subjects.forEach((sub: string, subIdx: number) => {
                            const baseCount = Math.floor(totalQ / subjects.length);
                            const extra = subIdx < (totalQ % subjects.length) ? 1 : 0;
                            const questionsForThisSub = baseCount + extra;

                            for (let qIdx = 0; qIdx < questionsForThisSub; qIdx++) {
                                fetched.push({
                                    id: `s-${subIdx}-${qIdx}`,
                                    subject: sub,
                                    type: qIdx % 3 === 2 ? 'Numerical' : 'MCQ',
                                    text: `[${sub}] Question ${qIdx + 1}: ` + (
                                        qIdx % 5 === 0 ? "A particle moves along the x-axis. At t = 0 it is at x = 0 with v = 5 m/s and a = 2 m/s². What is the displacement after 3 s?" :
                                        qIdx % 5 === 1 ? "Which compound exhibits the highest boiling point among the following under standard conditions?" :
                                        qIdx % 5 === 2 ? "The number of solutions of sin x = x/5 in [0, 2π] is:" :
                                        qIdx % 5 === 3 ? "The value of the definite integral of sin(x) from 0 to π is equal to ________." :
                                        "Which of the following elements has the highest electronegativity?"
                                    ),
                                    options: qIdx % 3 === 2 ? [] : (
                                        qIdx % 5 === 0 ? ['21 m', '24 m', '18 m', '27 m'] :
                                        qIdx % 5 === 1 ? ['CH₄', 'NH₃', 'H₂O', 'HF'] :
                                        qIdx % 5 === 2 ? ['0', '1', '2', '3'] :
                                        ['F', 'O', 'N', 'Cl']
                                    )
                                });
                            }
                        });
                    }

                    setLiveQuestions(fetched);
                    setLiveMeta({
                        name: test.name || 'Untitled Test',
                        duration: test.settings?.duration || 180,
                        marksPerQ: test.settings?.marksPerQuestion || 4,
                        negMarks: test.settings?.negativeMarking ?? -1,
                        instructions: test.settings?.instructions,
                        subjects,
                    });
                }
            } catch (e) {
                if (!cancelled) setLiveError('Failed to load test. Check your connection.');
                console.error(e);
            } finally {
                if (!cancelled) setLoadingLive(false);
            }
        })();

        return () => { cancelled = true; };
    }, [isOpen, testId]);

    if (!isOpen) return null;

    const isLiveMode = !!testId;

    // Wizard mode — use sample questions + formData
    if (!isLiveMode && formData) {
        const subjects = (formData.autoConfig?.subjects || formData.customConfig?.subjects || ['Physics', 'Chemistry', 'Mathematics']) as string[];
        const totalQ = formData.questionConfig?.totalQuestions || 90;
        
        // Generate the full set of questions dynamically distributed across all configured subjects
        const sampleQs: PreviewQuestion[] = [];
        subjects.forEach((sub, subIdx) => {
            const baseCount = Math.floor(totalQ / subjects.length);
            const extra = subIdx < (totalQ % subjects.length) ? 1 : 0;
            const questionsForThisSub = baseCount + extra;

            for (let qIdx = 0; qIdx < questionsForThisSub; qIdx++) {
                sampleQs.push({
                    id: `s-${subIdx}-${qIdx}`,
                    subject: sub,
                    type: qIdx % 3 === 2 ? 'Numerical' : 'MCQ',
                    text: `[${sub}] Question ${qIdx + 1}: ` + (
                        qIdx % 5 === 0 ? "A particle moves along the x-axis. At t = 0 it is at x = 0 with v = 5 m/s and a = 2 m/s². What is the displacement after 3 s?" :
                        qIdx % 5 === 1 ? "Which compound exhibits the highest boiling point among the following under standard conditions?" :
                        qIdx % 5 === 2 ? "The number of solutions of sin x = x/5 in [0, 2π] is:" :
                        qIdx % 5 === 3 ? "The value of the definite integral of sin(x) from 0 to π is equal to ________." :
                        "Which of the following elements has the highest electronegativity?"
                    ),
                    options: qIdx % 3 === 2 ? [] : (
                        qIdx % 5 === 0 ? ['21 m', '24 m', '18 m', '27 m'] :
                        qIdx % 5 === 1 ? ['CH₄', 'NH₃', 'H₂O', 'HF'] :
                        qIdx % 5 === 2 ? ['0', '1', '2', '3'] :
                        ['F', 'O', 'N', 'Cl']
                    )
                });
            }
        });

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <PreviewInner
                    questions={sampleQs}
                    testName={formData.name || 'Untitled Test'}
                    subjects={subjects}
                    duration={formData.settings?.duration || 180}
                    marksPerQ={formData.settings?.marksPerQuestion || 4}
                    negMarks={formData.settings?.negativeMarking ?? -1}
                    instructions={formData.settings?.instructions}
                    totalQ={totalQ}
                    isLive={true}
                    onClose={onClose}
                />
            </div>
        );
    }

    // Live mode — loading / error / ready
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            {loadingLive ? (
                <div className="bg-white rounded-2xl shadow-2xl p-16 flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-slate-600 font-semibold">Loading test questions...</p>
                </div>
            ) : liveError ? (
                <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm text-center">
                    <AlertCircle className="text-red-500 mx-auto mb-3" size={36} />
                    <p className="font-bold text-slate-800 mb-1">Could not load test</p>
                    <p className="text-sm text-slate-500 mb-6">{liveError}</p>
                    <button onClick={onClose} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700">Close</button>
                </div>
            ) : liveMeta ? (
                <PreviewInner
                    questions={liveQuestions.length > 0 ? liveQuestions : SAMPLES}
                    testName={liveMeta.name}
                    subjects={liveMeta.subjects}
                    duration={liveMeta.duration}
                    marksPerQ={liveMeta.marksPerQ}
                    negMarks={liveMeta.negMarks}
                    instructions={liveMeta.instructions}
                    totalQ={liveQuestions.length || 0}
                    isLive={true}
                    onClose={onClose}
                />
            ) : null}
        </div>
    );
};

export default TestPreviewModal;
