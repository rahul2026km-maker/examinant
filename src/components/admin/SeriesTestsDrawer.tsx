import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Clock, BookOpen, ChevronDown, ChevronRight, Trash2,
    Plus, Loader2, AlertTriangle, CheckCircle, FileText, Zap, Eye
} from 'lucide-react';
import { db } from '../../firebase';
import {
    collection, query, where, onSnapshot,
    deleteDoc, doc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import TestPreviewModal from '../test/TestPreviewModal';

interface Question {
    id: string;
    text: string;
    type: 'MCQ' | 'Numerical';
    subject: string;
    chapter: string;
    difficulty: string;
    options?: string[];
    correctAnswer?: number | string;
}

interface Test {
    id: string;
    name: string;
    testType: string;
    status: 'draft' | 'published';
    isOMR?: boolean;
    settings?: { duration?: number };
    questionIds?: string[];
    omrTemplate?: { totalQuestions?: number; sections?: any[] };
    createdAt?: any;
}

interface SeriesTestsDrawerProps {
    seriesId: string;
    seriesName: string;
    isOpen: boolean;
    onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-amber-100 text-amber-700',
    archived: 'bg-slate-100 text-slate-500',
};

const TYPE_LABELS: Record<string, string> = {
    practice: 'Practice',
    mock: 'Full Length Mock',
    previous_year: 'Prev Year',
    full_length: 'Full Length Mock',
    subject_wise: 'Subject Wise',
    unit_wise: 'Unitwise',
    chapter_wise: 'Chapterwise',
};

const TYPE_COLORS: Record<string, string> = {
    practice: 'bg-blue-50 text-blue-700 border border-blue-200',
    mock: 'bg-purple-50 text-purple-700 border border-purple-200',
    previous_year: 'bg-green-50 text-green-700 border border-green-200',
    full_length: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    subject_wise: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    unit_wise: 'bg-pink-50 text-pink-700 border border-pink-200',
    chapter_wise: 'bg-amber-50 text-amber-700 border border-amber-200',
};

export default function SeriesTestsDrawer({ seriesId, seriesName, isOpen, onClose }: SeriesTestsDrawerProps) {
    const navigate = useNavigate();
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Record<string, Question[]>>({});
    const [loadingQuestions, setLoadingQuestions] = useState<Record<string, boolean>>({});
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [publishingId, setPublishingId] = useState<string | null>(null);
    const [previewTestId, setPreviewTestId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        const q = query(
            collection(db, 'tests'),
            where('seriesId', '==', seriesId)
        );
        const unsub = onSnapshot(q, (snap) => {
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as Test));
            // Client-side sort by createdAt descending
            fetched.sort((a, b) => {
                const timeA = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
                const timeB = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
                return timeB - timeA;
            });
            setTests(fetched);
            setLoading(false);
        }, (err) => {
            console.error("Firestore onSnapshot query error:", err);
            setLoading(false);
        });
        return unsub;
    }, [isOpen, seriesId]);

    const loadQuestions = async (test: Test) => {
        if (questions[test.id]) {
            setExpandedTestId(expandedTestId === test.id ? null : test.id);
            return;
        }
        if (test.isOMR) {
            // For OMR tests just expand to show template info
            setExpandedTestId(test.id);
            return;
        }
        const ids = test.questionIds || [];
        if (ids.length === 0) {
            setQuestions(prev => ({ ...prev, [test.id]: [] }));
            setExpandedTestId(test.id);
            return;
        }
        setLoadingQuestions(prev => ({ ...prev, [test.id]: true }));
        try {
            const { doc: docRef, getDoc } = await import('firebase/firestore');
            const fetched: Question[] = [];
            // fetch in batches of 10
            const chunks: string[][] = [];
            for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
            for (const chunk of chunks) {
                const snaps = await Promise.all(chunk.map(id => getDoc(docRef(db, 'questions', id))));
                snaps.forEach(s => { if (s.exists()) fetched.push({ id: s.id, ...s.data() } as Question); });
            }
            setQuestions(prev => ({ ...prev, [test.id]: fetched }));
        } catch (e) {
            console.error(e);
            setQuestions(prev => ({ ...prev, [test.id]: [] }));
        } finally {
            setLoadingQuestions(prev => ({ ...prev, [test.id]: false }));
            setExpandedTestId(test.id);
        }
    };

    const handleDelete = async (testId: string) => {
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'tests', testId));
            setConfirmDeleteId(null);
            if (expandedTestId === testId) setExpandedTestId(null);
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    const togglePublish = async (test: Test) => {
        setPublishingId(test.id);
        try {
            await updateDoc(doc(db, 'tests', test.id), {
                status: test.status === 'published' ? 'draft' : 'published',
                updatedAt: serverTimestamp(),
            });
        } catch (e) {
            console.error(e);
        } finally {
            setPublishingId(null);
        }
    };

    const questionCount = (test: Test) => {
        if (test.isOMR) return test.omrTemplate?.totalQuestions || 0;
        return test.questionIds?.length || 0;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 flex-shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">{seriesName}</h2>
                                <p className="text-sm text-slate-500">{tests.length} test{tests.length !== 1 ? 's' : ''} in this series</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate('/admin-dashboard/create-test')}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Plus size={14} /> Add Test
                                </button>
                                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="animate-spin text-blue-500" size={28} />
                                </div>
                            ) : tests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-60 text-center px-8">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <BookOpen className="text-slate-400" size={28} />
                                    </div>
                                    <p className="font-semibold text-slate-700">No tests yet</p>
                                    <p className="text-sm text-slate-400 mt-1">Click "Add Test" above to create the first test in this series.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {tests.map((test) => {
                                        const isExpanded = expandedTestId === test.id;
                                        const qs = questions[test.id] || [];
                                        const isLoadingQ = loadingQuestions[test.id];
                                        const qCount = questionCount(test);

                                        return (
                                            <div key={test.id} className="bg-white">
                                                {/* Test Row */}
                                                <div className="px-5 py-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[test.status]}`}>
                                                                    {test.status}
                                                                </span>
                                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${TYPE_COLORS[test.testType] || 'bg-slate-100 text-slate-600'}`}>
                                                                    {TYPE_LABELS[test.testType] || test.testType}
                                                                </span>
                                                                {test.isOMR && (
                                                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                                                        OMR
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="font-semibold text-slate-800 text-sm truncate">{test.name}</p>
                                                            <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                                                                <span className="flex items-center gap-1">
                                                                    <BookOpen size={11} /> {qCount} questions
                                                                </span>
                                                                {test.settings?.duration && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock size={11} /> {Math.floor(test.settings.duration / 60)}h {test.settings.duration % 60}m
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <button
                                                                onClick={() => setPreviewTestId(test.id)}
                                                                className="p-2 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                                                title="Preview as Student"
                                                            >
                                                                <Eye size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => loadQuestions(test)}
                                                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                                                                title="View Questions"
                                                            >
                                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                            </button>
                                                            <button
                                                                onClick={() => togglePublish(test)}
                                                                disabled={publishingId === test.id}
                                                                title={test.status === 'published' ? 'Unpublish' : 'Publish'}
                                                                className={`p-2 rounded-lg transition-colors ${test.status === 'published' ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-green-50 hover:text-green-600'}`}
                                                            >
                                                                {publishingId === test.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDeleteId(test.id)}
                                                                className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                                                title="Delete Test"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Questions Panel */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden border-t border-slate-100"
                                                        >
                                                            <div className="px-5 py-4 bg-slate-50">
                                                                {test.isOMR ? (
                                                                    /* OMR test — show section breakdown */
                                                                    <div className="space-y-2">
                                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                                                            <FileText size={12} /> OMR Sections
                                                                        </p>
                                                                        {(test.omrTemplate?.sections || []).map((sec: any, si: number) => (
                                                                            <div key={sec.id || sec.name || si} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200 text-xs">
                                                                                <span className="font-semibold text-slate-700">{sec.name}</span>
                                                                                <div className="flex items-center gap-3 text-slate-500">
                                                                                    <span>Q{sec.questionStartIndex}–{sec.questionEndIndex}</span>
                                                                                    <span className="text-green-600 font-bold">+{sec.marksCorrect}</span>
                                                                                    <span className="text-red-500 font-bold">{sec.marksWrong}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : isLoadingQ ? (
                                                                    <div className="flex items-center justify-center py-6">
                                                                        <Loader2 className="animate-spin text-blue-500" size={20} />
                                                                        <span className="ml-2 text-sm text-slate-500">Loading questions...</span>
                                                                    </div>
                                                                ) : qs.length === 0 ? (
                                                                    <div className="text-center py-6 text-sm text-slate-400">
                                                                        No questions assigned yet.
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                                                            <Zap size={12} /> {qs.length} Questions
                                                                        </p>
                                                                        {qs.map((q, idx) => (
                                                                            <div key={q.id || `q-${idx}`} className="bg-white rounded-xl p-3 border border-slate-200">
                                                                                <div className="flex items-start gap-3">
                                                                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 rounded-lg w-8 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                                        {idx + 1}
                                                                                    </span>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">{q.text}</p>
                                                                                        <div className="flex items-center gap-2 mt-1.5">
                                                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${q.type === 'MCQ' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{q.type}</span>
                                                                                            <span className="text-[10px] text-slate-400">{q.subject}</span>
                                                                                            <span className={`text-[10px] font-bold ${q.difficulty === 'Easy' ? 'text-green-600' : q.difficulty === 'Hard' ? 'text-red-500' : 'text-amber-600'}`}>{q.difficulty}</span>
                                                                                        </div>
                                                                                        {q.type === 'MCQ' && q.options && (
                                                                                            <div className="grid grid-cols-2 gap-1 mt-2">
                                                                                                {q.options.map((opt, oi) => (
                                                                                                    <div key={oi} className={`text-[10px] px-2 py-1 rounded-md flex items-center gap-1.5 ${oi === q.correctAnswer ? 'bg-green-100 text-green-700 font-bold' : 'bg-slate-50 text-slate-600'}`}>
                                                                                                        <span className="font-bold">{['A', 'B', 'C', 'D'][oi]}.</span> {opt}
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}
                                                                                        {q.type === 'Numerical' && (
                                                                                            <div className="mt-1.5 text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-mono font-bold inline-block">
                                                                                                Answer: {q.correctAnswer}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Delete confirm inline */}
                                                <AnimatePresence>
                                                    {confirmDeleteId === test.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -4 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0 }}
                                                            className="mx-5 mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4"
                                                        >
                                                            <div className="flex items-center gap-2 text-sm text-red-700">
                                                                <AlertTriangle size={16} />
                                                                Delete "<strong>{test.name}</strong>"?
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setConfirmDeleteId(null)}
                                                                    className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-white"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(test.id)}
                                                                    disabled={isDeleting}
                                                                    className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
                                                                >
                                                                    {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}

            {/* Live Test Preview Modal */}
            <TestPreviewModal
                isOpen={!!previewTestId}
                testId={previewTestId || undefined}
                onClose={() => setPreviewTestId(null)}
            />
        </AnimatePresence>
    );
}
