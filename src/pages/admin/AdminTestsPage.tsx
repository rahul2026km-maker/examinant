import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, X, Save, Loader2, List, FileText, Sparkles, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp, arrayUnion, getDocs } from 'firebase/firestore';
import { generateJEEMainsTest } from '../../services/testGenerationService';
import { generateTestFromTopics } from '../../services/topicTestService';

interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number; // index
}

interface TestSeries {
    id: string;
    title: string;
    category: string;
    price: number;
    description: string;
    questions: Question[];
    status: 'draft' | 'published';
    testPattern?: 'JEE_MAINS' | 'NEET' | 'CUSTOM';
    duration?: number; // in minutes
    createdAt: any;
}

const AdminTestsPage = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState<TestSeries[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Question Management State
    const [managingTest, setManagingTest] = useState<TestSeries | null>(null);
    const [questionForm, setQuestionForm] = useState({
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0
    });

    // Form State for New Test
    const [formData, setFormData] = useState({
        title: '',
        category: 'JEE',
        price: '',
        description: '',
        status: 'draft' as 'draft' | 'published',
        testPattern: 'CUSTOM' as 'JEE_MAINS' | 'NEET' | 'CUSTOM',
        duration: 180 // 3 hours default
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isDeletingLoading, setIsDeletingLoading] = useState(false);

    // Chapter-based test creation state
    const [chapters, setChapters] = useState<any[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
    const [customQuestionCount, setCustomQuestionCount] = useState(30);
    const [mcqPercentage, setMcqPercentage] = useState(70);

    useEffect(() => {
        const q = query(collection(db, 'testSeries'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TestSeries[];
            setTests(fetchedTests);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch chapters for chapter-based test creation
    useEffect(() => {
        const fetchChapters = async () => {
            try {
                const chaptersSnapshot = await getDocs(collection(db, 'chapters'));
                const chaptersData = chaptersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setChapters(chaptersData);
            } catch (error) {
                console.error("Error fetching chapters:", error);
            }
        };
        fetchChapters();
    }, []);


    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await delay(1000); // Artificial delay
            await addDoc(collection(db, 'testSeries'), {
                ...formData,
                price: Number(formData.price),
                questions: [],
                createdAt: serverTimestamp()
            });
            setIsCreating(false);
            setFormData({
                title: '',
                category: 'JEE',
                price: '',
                description: '',
                status: 'draft',
                testPattern: 'CUSTOM',
                duration: 180
            });
        } catch (error) {
            console.error("Error creating test:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAutoGenerate = async () => {
        if (formData.testPattern !== 'JEE_MAINS') {
            alert('Auto-generate is currently only available for JEE Mains pattern');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateJEEMainsTest();
            setGeneratedQuestions(result.questions);

            if (result.warnings.length > 0) {
                alert(`Test generated with warnings:\n${result.warnings.join('\n')}`);
            }

            setShowPreview(true);
        } catch (error) {
            console.error('Error generating test:', error);
            alert('Failed to generate test. Please ensure you have uploaded sufficient questions in the Question Bank.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmGenerated = async () => {
        setIsSubmitting(true);
        try {
            await delay(1500); // Artificial delay
            await addDoc(collection(db, 'testSeries'), {
                ...formData,
                price: Number(formData.price),
                questions: generatedQuestions,
                testPattern: 'JEE_MAINS',
                createdAt: serverTimestamp()
            });
            setShowPreview(false);
            setIsCreating(false);
            setFormData({
                title: '',
                category: 'JEE',
                price: '',
                description: '',
                status: 'draft',
                testPattern: 'CUSTOM',
                duration: 180
            });
            setGeneratedQuestions([]);
            alert('JEE Mains test created successfully with 90 questions!');
        } catch (error) {
            console.error("Error saving generated test:", error);
            alert("Failed to save test. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateFromTopics = async () => {
        if (selectedSubjects.length === 0) {
            alert('Please select at least one subject');
            return;
        }

        if (customQuestionCount < 1 || customQuestionCount > 200) {
            alert('Please enter a valid question count (1-200)');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateTestFromTopics({
                subjects: selectedSubjects,
                topics: selectedChapters, // We pass chapter names here
                questionCount: customQuestionCount,
                mcqPercentage: mcqPercentage
            });

            if (result.questions.length === 0) {
                alert('No questions found for the selected chapters. Please ensure questions are uploaded in the Question Bank for these chapters.');
                return;
            }

            setGeneratedQuestions(result.questions);
            setShowPreview(true);
        } catch (error) {
            console.error('Error generating test:', error);
            alert('Failed to generate test. Please ensure you have uploaded sufficient questions.');
        } finally {
            setIsGenerating(false);
        }
    };


    const handleDelete = async (id: string) => {
        setIsDeletingLoading(true);
        try {
            await delay(800); // Artificial delay for better UX
            await deleteDoc(doc(db, 'testSeries', id));
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Error deleting test:", error);
            alert("Failed to delete test series. Please try again.");
        } finally {
            setIsDeletingLoading(false);
        }
    };

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!managingTest) return;

        const newQuestion: Question = {
            id: crypto.randomUUID(),
            text: questionForm.text,
            options: questionForm.options.map(o => o.trim()), // Allow empty options if user wants, but generally should validate
            correctAnswer: Number(questionForm.correctAnswer)
        };

        try {
            const testRef = doc(db, 'testSeries', managingTest.id);
            await updateDoc(testRef, {
                questions: arrayUnion(newQuestion)
            });

            // Update local state for immediate feedback
            setManagingTest(prev => prev ? {
                ...prev,
                questions: [...(prev.questions || []), newQuestion]
            } : null);

            // Reset form
            setQuestionForm({
                text: '',
                options: ['', '', '', ''],
                correctAnswer: 0
            });
        } catch (error) {
            console.error("Error adding question:", error);
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...questionForm.options];
        newOptions[index] = value;
        setQuestionForm({ ...questionForm, options: newOptions });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const filteredTests = tests.filter(test =>
        test.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div
            className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manage Tests</h1>
                    <p className="text-slate-500 mt-1">Create, edit, and publish test series.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* ── NEW: OMR Test Button ── */}
                    <button
                        onClick={() => navigate('/admin-dashboard/create-omr-test')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                    >
                        <FileText size={18} />
                        Create OMR Test
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} />
                        Create New Test
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Table Header/Filter Area */}
                <div className="p-4 border-b border-slate-200 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Questions</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="animate-spin" size={20} /> Loading tests...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No test series found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredTests.map((test) => (
                                    <tr key={test.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-700">{test.title}</td>
                                        <td className="px-6 py-4 text-slate-500">{test.category}</td>
                                        <td className="px-6 py-4 text-slate-500">{test.questions?.length || 0}</td>
                                        <td className="px-6 py-4 font-medium text-slate-700">₹{test.price}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${test.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {test.status === 'published' ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setManagingTest(test)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                                                    title="Manage Questions"
                                                >
                                                    <List size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(test.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsCreating(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-800">Create New Test Series</h2>
                                <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                        placeholder="e.g. Full Physics Mock Test"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                                        >
                                            <option>NEET</option>
                                            <option>JEE</option>
                                            <option>SSC</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="block text-sm font-semibold text-slate-700">Pricing</label>
                                        <div className="flex items-center gap-2 mb-2">
                                            <input
                                                type="checkbox"
                                                id="isFree"
                                                checked={formData.price === '0'}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.checked ? '0' : '' })}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="isFree" className="text-sm text-slate-600">This is a free test series</label>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                            <input
                                                type="number"
                                                required={formData.price !== '0'}
                                                disabled={formData.price === '0'}
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                                                placeholder={formData.price === '0' ? "Free" : "499"}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                                    <textarea
                                        required
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 h-24 resize-none"
                                        placeholder="Describe what's included in this test series..."
                                    ></textarea>
                                </div>

                                {/* Test Pattern Selection */}
                                <div className="border-t pt-4 space-y-4">
                                    <h3 className="text-md font-bold text-slate-800">Test Generation Options</h3>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, testPattern: 'JEE_MAINS' })}
                                            className={`p-4 border-2 rounded-xl transition-all ${formData.testPattern === 'JEE_MAINS'
                                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                                                : 'border-slate-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-4 h-4 rounded-full border-2 ${formData.testPattern === 'JEE_MAINS' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                                                    }`}>
                                                    {formData.testPattern === 'JEE_MAINS' && (
                                                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                                    )}
                                                </div>
                                                <span className="font-semibold text-sm">Auto JEE Mains</span>
                                            </div>
                                            <p className="text-xs text-slate-500 text-left">90 Qs from NTA weightage</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, testPattern: 'CUSTOM' })}
                                            className={`p-4 border-2 rounded-xl transition-all ${formData.testPattern === 'CUSTOM'
                                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                                                : 'border-slate-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-4 h-4 rounded-full border-2 ${formData.testPattern === 'CUSTOM' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                                                    }`}>
                                                    {formData.testPattern === 'CUSTOM' && (
                                                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                                    )}
                                                </div>
                                                <span className="font-semibold text-sm">Custom Chapters</span>
                                            </div>
                                            <p className="text-xs text-slate-500 text-left">Select subjects & chapters</p>
                                        </button>
                                    </div>

                                    {/* Custom Test Configuration */}
                                    {formData.testPattern === 'CUSTOM' && chapters.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-4 bg-slate-50 p-4 rounded-xl"
                                        >
                                            {/* Subject Selection */}
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Subjects</label>
                                                <div className="flex gap-2">
                                                    {['Physics', 'Chemistry', 'Mathematics'].map(subject => (
                                                        <button
                                                            key={subject}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSubjects(prev =>
                                                                    prev.includes(subject)
                                                                        ? prev.filter(s => s !== subject)
                                                                        : [...prev, subject]
                                                                );
                                                            }}
                                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedSubjects.includes(subject)
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                                                                }`}
                                                        >
                                                            {subject}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Chapter Selection */}
                                            {selectedSubjects.length > 0 && (
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                        Select Chapters (Optional - leave empty for all chapters)
                                                    </label>
                                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 bg-white border border-slate-200 rounded-lg">
                                                        {chapters
                                                            .filter(c => selectedSubjects.includes(c.subject))
                                                            .map(chapter => (
                                                                <label key={chapter.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedChapters.includes(chapter.name)}
                                                                        onChange={e => {
                                                                            if (e.target.checked) {
                                                                                setSelectedChapters(prev => [...prev, chapter.name]);
                                                                            } else {
                                                                                setSelectedChapters(prev => prev.filter(name => name !== chapter.name));
                                                                            }
                                                                        }}
                                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                                    />
                                                                    <span className="text-sm text-slate-700">{chapter.name}</span>
                                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 ml-auto">{chapter.subject}</span>
                                                                </label>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Question Count */}
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Total Questions: {customQuestionCount}
                                                </label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="200"
                                                    value={customQuestionCount}
                                                    onChange={e => setCustomQuestionCount(Number(e.target.value))}
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                />
                                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                                    <span>1</span>
                                                    <span>200</span>
                                                </div>
                                            </div>

                                            {/* MCQ Percentage */}
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    MCQ Percentage: {mcqPercentage}%
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    step="5"
                                                    value={mcqPercentage}
                                                    onChange={e => setMcqPercentage(Number(e.target.value))}
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                />
                                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                                    <span>All Numerical</span>
                                                    <span>All MCQ</span>
                                                </div>
                                            </div>

                                            {/* Status Selection */}
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Initial Status</label>
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="radio" 
                                                            name="status" 
                                                            checked={formData.status === 'published'}
                                                            onChange={() => setFormData({...formData, status: 'published'})}
                                                            className="w-4 h-4 text-blue-600"
                                                        />
                                                        <span className="text-sm font-medium text-slate-700">Published</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="radio" 
                                                            name="status" 
                                                            checked={formData.status === 'draft'}
                                                            onChange={() => setFormData({...formData, status: 'draft'})}
                                                            className="w-4 h-4 text-blue-600"
                                                        />
                                                        <span className="text-sm font-medium text-slate-700">Draft</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Generate Button */}
                                            <button
                                                type="button"
                                                onClick={handleGenerateFromTopics}
                                                disabled={selectedSubjects.length === 0 || isGenerating}
                                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={18} />
                                                        Generating Questions...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={18} />
                                                        Generate & Preview Questions
                                                    </>
                                                )}
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* JEE Mains Generate Button */}
                                    {formData.testPattern === 'JEE_MAINS' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100"
                                        >
                                            <p className="text-sm text-slate-600 mb-3">
                                                This will automatically generate 90 questions (30 per subject) based on JEE Mains 2024 chapter weightage.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleAutoGenerate}
                                                disabled={isGenerating}
                                                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={18} />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        Auto-Generate 90 Questions
                                                    </>
                                                )}
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        {isSubmitting ? 'Creating...' : 'Create Test'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Generated Test Modal */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowPreview(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-xl overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Preview Generated Test</h2>
                                    <p className="text-sm text-slate-500">
                                        Generated {generatedQuestions.length} questions based on {formData.testPattern === 'JEE_MAINS' ? 'JEE Mains pattern' : 'selected topics'}
                                    </p>
                                </div>
                                <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                                {generatedQuestions.map((q, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold text-slate-700">Question {idx + 1}</span>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${q.subject === 'Physics' ? 'bg-green-100 text-green-700' :
                                                q.subject === 'Chemistry' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                {q.subject}
                                            </span>
                                        </div>
                                        <div className="text-slate-800 mb-3">{q.text}</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {q.options?.map((opt: string, i: number) => (
                                                <div key={i} className={`px-3 py-2 rounded-lg text-sm border ${i === q.correctAnswer
                                                    ? 'bg-green-50 border-green-200 text-green-700 font-medium'
                                                    : 'bg-slate-50 border-slate-100 text-slate-500'
                                                    }`}>
                                                    <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 sticky bottom-0 z-10">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmGenerated}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md shadow-green-500/20 flex items-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    {isSubmitting ? 'Saving...' : 'Confirm & Save Test'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Manage Questions Modal */}
            <AnimatePresence>
                {managingTest && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setManagingTest(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Left: Questions List */}
                            <div className="w-full md:w-1/2 border-r border-slate-200 flex flex-col h-full bg-slate-50">
                                <div className="p-4 border-b border-slate-200 bg-white">
                                    <h3 className="font-bold text-slate-800">Questions ({managingTest.questions?.length || 0})</h3>
                                    <p className="text-xs text-slate-500 truncate">{managingTest.title}</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {managingTest.questions?.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400">
                                            No questions added yet.
                                        </div>
                                    ) : (
                                        managingTest.questions?.map((q, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
                                                <div className="font-medium text-slate-800 mb-2">Q{idx + 1}. {q.text}</div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {q.options.map((opt, i) => (
                                                        <div key={i} className={`px-2 py-1 rounded text-xs ${i === q.correctAnswer ? 'bg-green-100 text-green-700 font-bold' : 'bg-slate-50 text-slate-500'}`}>
                                                            {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right: Add Question Form */}
                            <div className="w-full md:w-1/2 flex flex-col h-full bg-white">
                                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">Add Question</h3>
                                    <button onClick={() => setManagingTest(null)} className="text-slate-400 hover:text-slate-600">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleAddQuestion} className="flex-1 overflow-y-auto p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Question Text</label>
                                        <textarea
                                            required
                                            value={questionForm.text}
                                            onChange={e => setQuestionForm({ ...questionForm, text: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 h-24 resize-none"
                                            placeholder="Enter question here..."
                                        ></textarea>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-slate-700">Options</label>
                                        {[0, 1, 2, 3].map((optIndex) => (
                                            <div key={optIndex} className="flex gap-2 items-center">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${questionForm.correctAnswer === optIndex ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    {String.fromCharCode(65 + optIndex)}
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={questionForm.options[optIndex]}
                                                    onChange={e => handleOptionChange(optIndex, e.target.value)}
                                                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none text-sm ${questionForm.correctAnswer === optIndex ? 'border-green-500 ring-1 ring-green-500' : 'border-slate-200 focus:border-blue-500'}`}
                                                    placeholder={`Option ${optIndex + 1}`}
                                                />
                                                <input
                                                    type="radio"
                                                    name="correctAnswer"
                                                    checked={questionForm.correctAnswer === optIndex}
                                                    onChange={() => setQuestionForm({ ...questionForm, correctAnswer: optIndex })}
                                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                        >
                                            <Plus size={18} /> Add Question
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {confirmDeleteId && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="text-red-600" size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Delete Test?</h3>
                                    <p className="text-slate-500 mt-2">
                                        Are you sure you want to delete this test? This action cannot be undone.
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full pt-4">
                                    <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        disabled={isDeletingLoading}
                                        className="flex-1 px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDelete(confirmDeleteId)}
                                        disabled={isDeletingLoading}
                                        className="flex-1 px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-red-400 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                                    >
                                        {isDeletingLoading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Deleting...
                                            </>
                                        ) : (
                                            'Delete Now'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminTestsPage;
