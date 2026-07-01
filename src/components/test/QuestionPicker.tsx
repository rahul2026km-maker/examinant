import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, Loader2, BookOpen } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

interface Question {
    id: string;
    text: string;
    textHindi?: string;
    subject: string;
    chapter: string;
    type: 'MCQ' | 'Numerical';
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface QuestionPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (questionIds: string[]) => void;
    initialSelected?: string[];
    subjects: string[];
    maxSelection?: number;
}

const getSubjectCandidates = (subject: string): string[] => {
    if (!subject) return [];
    const trimmed = subject.trim();
    const lower = trimmed.toLowerCase();
    
    const candidates = new Set<string>([
        subject,
        trimmed,
        lower,
        trimmed.toUpperCase(),
    ]);
    
    // Add title casing
    const titleCase = trimmed.replace(/\b\w/g, c => c.toUpperCase());
    candidates.add(titleCase);
    
    // Add sentence casing
    const sentenceCase = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    candidates.add(sentenceCase);
    
    // Add specific common typos/variations
    if (lower.includes('english')) {
        candidates.add('English Comprehension');
        candidates.add('English comprehension');
        candidates.add('english comprehension');
    }
    if (lower.includes('awareness') || lower.includes('awarencess')) {
        candidates.add('General Awareness');
        candidates.add('General Awarencess');
        candidates.add('general awareness');
    }
    if (lower.includes('quantitative') || lower.includes('aptitude')) {
        candidates.add('Quantitative Aptitude ');
        candidates.add('Quantitative Aptitude');
        candidates.add('quantitative aptitude');
        candidates.add('quantitative aptitude ');
    }
    if (lower.includes('intelligence') || lower.includes('reasoning')) {
        candidates.add('General Intelligence & Reasoning');
        candidates.add('General Intelligence and Reasoning');
        candidates.add('general intelligence & reasoning');
    }
    
    return Array.from(candidates).filter(Boolean);
};

const QuestionPicker = ({
    isOpen,
    onClose,
    onSelect,
    initialSelected = [],
    subjects,
    maxSelection
}: QuestionPickerProps) => {
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [activeSubject, setActiveSubject] = useState<string>(subjects[0] || '');
    const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');
    const [filterType, setFilterType] = useState<'all' | 'MCQ' | 'Numerical'>('all');
    const [filterChapter, setFilterChapter] = useState<string>('all');
    const [displayLimit, setDisplayLimit] = useState(40);

    useEffect(() => {
        setDisplayLimit(40);
    }, [activeSubject, filterDifficulty, filterType, filterChapter, searchTerm]);

    useEffect(() => {
        setFilterChapter('all');
    }, [activeSubject]);

    const uniqueChapters = Array.from(new Set(questions.map(q => q.chapter))).filter(Boolean);

    useEffect(() => {
        if (isOpen) {
            fetchQuestions();
        }
    }, [isOpen, activeSubject, filterDifficulty, filterType]);

    // Update active subject if props change
    useEffect(() => {
        if (subjects.length > 0 && !subjects.includes(activeSubject)) {
            setActiveSubject(subjects[0]);
        }
    }, [subjects]);

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const candidates = getSubjectCandidates(activeSubject);
            let q = query(
                collection(db, 'questions'),
                where('subject', 'in', candidates)
            );

            const snapshot = await getDocs(q);
            let fetchedQuestions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Question[];

            // Sort by createdAt desc client-side to avoid needing composite index
            fetchedQuestions.sort((a: any, b: any) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });

            // Client-side filtering for flexibility
            if (filterDifficulty !== 'all') {
                fetchedQuestions = fetchedQuestions.filter(q => q.difficulty === filterDifficulty);
            }
            if (filterType !== 'all') {
                fetchedQuestions = fetchedQuestions.filter(q => q.type === filterType);
            }

            setQuestions(fetchedQuestions);
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(qId => qId !== id);
            } else {
                if (maxSelection && prev.length >= maxSelection) {
                    alert(`You can select up to ${maxSelection} questions.`);
                    return prev;
                }
                return [...prev, id];
            }
        });
    };

    const handleConfirm = () => {
        onSelect(selectedIds);
        onClose();
    };

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesChapter = filterChapter === 'all' || q.chapter === filterChapter;
        return matchesSearch && matchesChapter;
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Select Questions</h2>
                                <p className="text-sm text-slate-500">
                                    Selected: <span className="font-bold text-blue-600">{selectedIds.length}</span>
                                    {maxSelection && <span className="text-slate-400"> / {maxSelection}</span>}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Filters & Search */}
                        <div className="p-4 border-b border-slate-100 space-y-4">
                            {/* Subject Tabs */}
                            <div className="flex gap-2">
                                {subjects.map(subject => (
                                    <button
                                        key={subject}
                                        onClick={() => setActiveSubject(subject)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeSubject === subject
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {subject}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search question text..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <select
                                        value={filterChapter}
                                        onChange={(e) => setFilterChapter(e.target.value)}
                                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white max-w-[200px]"
                                    >
                                        <option value="all">All Chapters</option>
                                        {uniqueChapters.map(chap => (
                                            <option key={chap} value={chap}>{chap}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={filterDifficulty}
                                        onChange={(e) => setFilterDifficulty(e.target.value as any)}
                                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                    >
                                        <option value="all">All Difficulties</option>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>

                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value as any)}
                                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="MCQ">MCQ</option>
                                        <option value="Numerical">Numerical</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Question List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : filteredQuestions.length > 0 ? (
                                <>
                                    {filteredQuestions.slice(0, displayLimit).map(question => (
                                        <div
                                            key={question.id}
                                            onClick={() => toggleSelection(question.id)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${selectedIds.includes(question.id)
                                                ? 'border-blue-500 bg-blue-50/50'
                                                : 'border-white bg-white hover:border-blue-200'
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.includes(question.id)
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : 'border-slate-300 bg-white'
                                                    }`}>
                                                    {selectedIds.includes(question.id) && <Check size={14} className="text-white" />}
                                                </div>

                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${question.type === 'MCQ' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            {question.type}
                                                        </span>
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${question.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                                            question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                            {question.difficulty}
                                                        </span>
                                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                                            <BookOpen size={12} /> {question.chapter}
                                                        </span>
                                                    </div>

                                                    <p className="text-slate-800 text-sm font-medium line-clamp-2">
                                                        {/* Strip HTML if needed, simplistic approach here */}
                                                        {question.text.replace(/<[^>]*>/g, '')}
                                                    </p>
                                                    {question.textHindi && (
                                                        <p className="text-slate-500 text-xs italic mt-1 line-clamp-1 border-l border-slate-300 pl-2">
                                                            {question.textHindi.replace(/<[^>]*>/g, '')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredQuestions.length > displayLimit && (
                                        <div className="flex justify-center pt-2 pb-2">
                                            <button
                                                type="button"
                                                onClick={() => setDisplayLimit(prev => prev + 40)}
                                                className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 shadow-sm transition-all hover:shadow text-sm"
                                            >
                                                Load More (+{Math.min(40, filteredQuestions.length - displayLimit)} Questions)
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    <p>No questions found matching your filters.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200"
                            >
                                Confirm Selection ({selectedIds.length})
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default QuestionPicker;
