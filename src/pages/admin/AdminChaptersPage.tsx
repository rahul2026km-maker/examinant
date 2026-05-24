import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, X, Save, Loader2, FolderPlus, BookOpen, Edit2, Upload, Download, AlertTriangle } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useSubjectList } from '../../hooks/useSubjectList';
import { parseChaptersCSV, validateChapter, batchUploadChapters, downloadTemplate } from '../../utils/csvImporter';
import type { ChapterCSVRow, ValidationResult } from '../../utils/csvImporter';

interface Chapter {
    id: string;
    name: string;
    subject: string;
    unit?: string; // Unit name/number (e.g., "Unit 1", "Mechanics")
    description: string;
    topics: string[]; // Topics within this chapter
    difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
    tags?: string[];
    status: 'draft' | 'active' | 'archived';
    createdAt: any;
    updatedAt?: any;
}

const AdminChaptersPage = () => {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSubject, setFilterSubject] = useState<string>('all');

    // CSV Import states
    const [isImporting, setIsImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [parsedRows, setParsedRows] = useState<ChapterCSVRow[]>([]);
    const [validationResults, setValidationResults] = useState<Map<number, ValidationResult>>(new Map());
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [importGuideTab, setImportGuideTab] = useState<'excel' | 'guide'>('excel');
    const [missingSubjects, setMissingSubjects] = useState<string[]>([]);
    const [isCreatingMissing, setIsCreatingMissing] = useState(false);
    const subjects = useSubjectList();

    const [formData, setFormData] = useState({
        name: '',
        subject: 'Physics',
        unit: '',
        description: '',
        topics: [''],
        difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard' | 'Mixed',
        tags: [] as string[],
        status: 'active' as 'draft' | 'active' | 'archived'
    });

    useEffect(() => {
        const q = query(collection(db, 'chapters'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTopics = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Chapter[];
            setChapters(fetchedTopics);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'chapters'), {
                ...formData,
                unit: formData.unit.trim() || undefined,
                topics: formData.topics.filter(c => c.trim() !== ''),
                tags: formData.tags.filter(t => t.trim() !== ''),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            setIsCreating(false);
            setFormData({
                name: '',
                subject: 'Physics',
                unit: '',
                description: '',
                topics: [''],
                difficulty: 'Medium',
                tags: [],
                status: 'active'
            });
        } catch (error) {
            console.error("Error creating chapter:", error);
            alert("Error creating chapter. Please try again.");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this topic?')) {
            try {
                await deleteDoc(doc(db, 'chapters', id));
            } catch (error) {
                console.error("Error deleting chapter:", error);
                alert("Error deleting chapter. Please try again.");
            }
        }
    };

    const handleEdit = (chapter: Chapter) => {
        setEditingChapter(chapter);
        setFormData({
            name: chapter.name,
            subject: chapter.subject,
            unit: chapter.unit || '',
            description: chapter.description,
            topics: chapter.topics.length > 0 ? chapter.topics : [''],
            difficulty: chapter.difficulty || 'Medium',
            tags: chapter.tags || [],
            status: chapter.status
        });
        setIsEditing(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingChapter) return;

        try {
            const topicRef = doc(db, 'chapters', editingChapter.id);
            await updateDoc(topicRef, {
                name: formData.name,
                subject: formData.subject,
                unit: formData.unit.trim() || undefined,
                description: formData.description,
                topics: formData.topics.filter(c => c.trim() !== ''),
                difficulty: formData.difficulty,
                tags: formData.tags.filter(t => t.trim() !== ''),
                status: formData.status,
                updatedAt: serverTimestamp()
            });

            setIsEditing(false);
            setEditingChapter(null);
            setFormData({
                name: '',
                subject: 'Physics',
                unit: '',
                description: '',
                topics: [''],
                difficulty: 'Medium',
                tags: [],
                status: 'active'
            });
        } catch (error) {
            console.error("Error updating chapter:", error);
            alert("Error updating chapter. Please try again.");
        }
    };

    const handleTopicChange = (index: number, value: string) => {
        const newTopics = [...formData.topics];
        newTopics[index] = value;
        setFormData({ ...formData, topics: newTopics });
    };

    const addTopicField = () => {
        setFormData({ ...formData, topics: [...formData.topics, ''] });
    };

    const removeTopicField = (index: number) => {
        const newTopics = formData.topics.filter((_, i) => i !== index);
        setFormData({ ...formData, topics: newTopics });
    };

    // ========== CSV IMPORT HANDLERS ==========

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportFile(file);

        try {
            const result = await parseChaptersCSV(file);
            setParsedRows(result.data);

            // Validate all chapters in parallel using dynamic subjects
            const validationPromises = result.data.map((row, index) => validateChapter(row, index, subjects));
            const validationList = await Promise.all(validationPromises);

            const validations = new Map<number, ValidationResult>();
            validationList.forEach((validation, index) => {
                validations.set(index, validation);
            });
            setValidationResults(validations);

            // Scan for missing subjects in chapter CSV
            const csvSubjects = Array.from(new Set(result.data.map(row => {
                let sub = row.subject?.trim() || '';
                if (sub.toLowerCase() === 'physics') return 'Physics';
                if (sub.toLowerCase() === 'chemistry') return 'Chemistry';
                if (sub.toLowerCase() === 'mathematics' || sub.toLowerCase() === 'maths') return 'Mathematics';
                if (sub.toLowerCase() === 'biology') return 'Biology';
                return sub.charAt(0).toUpperCase() + sub.slice(1);
            })));
            const missingSubs = csvSubjects.filter(sub => sub && !subjects.includes(sub));
            setMissingSubjects(missingSubs);
        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Error parsing CSV file. Please check the format.');
        }
    };

    const handleCreateMissingElements = async () => {
        setIsCreatingMissing(true);
        try {
            for (const sub of missingSubjects) {
                await addDoc(collection(db, 'subjects'), {
                    name: sub,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            alert("Successfully created missing subjects in the system database!");

            const newSubjects = [...subjects, ...missingSubjects];
            setMissingSubjects([]);

            if (importFile) {
                const result = await parseChaptersCSV(importFile);
                const validationPromises = result.data.map((row, index) => validateChapter(row, index, newSubjects));
                const validationList = await Promise.all(validationPromises);
                const validations = new Map<number, ValidationResult>();
                validationList.forEach((validation, index) => {
                    validations.set(index, validation);
                });
                setValidationResults(validations);
            }
        } catch (error) {
            console.error("Error auto-creating missing elements:", error);
            alert("Error auto-creating missing elements. Please try again.");
        } finally {
            setIsCreatingMissing(false);
        }
    };

    const handleImportCSV = async () => {
        const validRows = parsedRows.filter((_, index) => {
            const validation = validationResults.get(index);
            return validation?.valid;
        });

        if (validRows.length === 0) {
            alert('No valid rows to import');
            return;
        }

        if (!window.confirm(`Import ${validRows.length} chapters?`)) {
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const result = await batchUploadChapters(validRows, (progress) => {
                setUploadProgress(progress);
            });

            alert(`Import complete!\nSuccessfully imported: ${result.success}\nSkipped (duplicates): ${result.skipped}\nFailed: ${result.failed}`);

            // Reset import state
            setIsImporting(false);
            setImportFile(null);
            setParsedRows([]);
            setValidationResults(new Map());
            setUploadProgress(0);
        } catch (error) {
            console.error('Error importing chapters:', error);
            alert('Error importing chapters. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const filteredChapters = chapters.filter((chapter) => {
        const matchesSearch = chapter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            chapter.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubject = filterSubject === 'all' || chapter.subject === filterSubject;
        return matchesSearch && matchesSubject;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <motion.div
            className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manage Chapters</h1>
                    <p className="text-slate-500 mt-1">Create and organize topics for test creation</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => downloadTemplate('chapters')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                    >
                        <Download size={18} /> Template
                    </button>
                    <button
                        onClick={() => setIsImporting(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                    >
                        <Upload size={18} /> Import CSV
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} />
                        Create Chapter
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600">{chapters.length}</div>
                    <div className="text-sm text-slate-600 mt-1">Total Chapters</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                    <div className="text-3xl font-bold text-green-600">
                        {chapters.filter(t => t.subject === 'Physics').length}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">Physics</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
                    <div className="text-3xl font-bold text-purple-600">
                        {chapters.filter(t => t.subject === 'Chemistry').length}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">Chemistry</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                    <div className="text-3xl font-bold text-orange-600">
                        {chapters.filter(t => t.subject === 'Mathematics').length}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">Mathematics</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="all">All Subjects</option>
                        {subjects.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChapters.length === 0 ? (
                    <div className="col-span-full text-center py-20">
                        <FolderPlus className="mx-auto text-slate-300 mb-4" size={64} />
                        <h3 className="text-lg font-bold text-slate-600 mb-2">No chapters found</h3>
                        <p className="text-slate-500 mb-6">Create your first topic to organize questions</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={20} />
                            Create Chapter
                        </button>
                    </div>
                ) : (
                    filteredChapters.map((chapter) => (
                        <motion.div
                            key={chapter.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="text-blue-600" size={24} />
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{chapter.name}</h3>
                                        {chapter.unit && (
                                            <p className="text-xs text-slate-500 mt-0.5">{chapter.unit}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(chapter)}
                                        className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded-lg"
                                        title="Edit chapter"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(chapter.id)}
                                        className="text-slate-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                                        title="Delete chapter"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{chapter.description || 'No description provided'}</p>

                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${chapter.subject === 'Physics' ? 'bg-green-100 text-green-700' :
                                    chapter.subject === 'Chemistry' ? 'bg-purple-100 text-purple-700' :
                                        chapter.subject === 'Mathematics' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    {chapter.subject}
                                </span>

                                {chapter.difficulty && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${chapter.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' :
                                        chapter.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                            chapter.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                                                'bg-indigo-100 text-indigo-700'
                                        }`}>
                                        {chapter.difficulty}
                                    </span>
                                )}

                                {chapter.status && chapter.status !== 'active' && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${chapter.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                        'bg-slate-100 text-slate-700'
                                        }`}>
                                        {chapter.status.charAt(0).toUpperCase() + chapter.status.slice(1)}
                                    </span>
                                )}
                            </div>

                            {chapter.topics && chapter.topics.length > 0 && (
                                <div className="border-t border-slate-100 pt-3">
                                    <p className="text-xs text-slate-500 mb-2">Topics ({chapter.topics.length})</p>
                                    <div className="flex flex-wrap gap-1">
                                        {chapter.topics.slice(0, 3).map((topic, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs"
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                        {chapter.topics.length > 3 && (
                                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                                                +{chapter.topics.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-800">Create New Topic</h2>
                                <button onClick={() => setIsCreating(false)}>
                                    <X size={24} className="text-slate-400 hover:text-slate-600" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="p-6 space-y-5">
                                {/* Chapter Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        Chapter Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Electromagnetic Induction"
                                    />
                                </div>

                                {/* Subject and Unit */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Subject *
                                        </label>
                                        <select
                                            required
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value as any })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        >
                                            {subjects.map(subject => (
                                                <option key={subject} value={subject}>{subject}</option>
                                            ))}
                                            <option value="All">All Subjects</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Unit
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.unit}
                                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Unit 1, Mechanics"
                                        />
                                    </div>
                                </div>

                                {/* Difficulty and Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Difficulty Level
                                        </label>
                                        <select
                                            value={formData.difficulty}
                                            onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                            <option value="Mixed">Mixed</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        >
                                            <option value="active">Active</option>
                                            <option value="draft">Draft</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                                        placeholder="Brief description of this topic..."
                                    />
                                </div>

                                {/* Topics in this Chapter */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Topics in this Chapter
                                    </label>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                        {formData.topics.map((chapter, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <div className="flex-1 flex gap-2 items-center">
                                                    <span className="text-sm font-medium text-slate-500 w-20">
                                                        Topic {idx + 1}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={chapter}
                                                        onChange={e => handleTopicChange(idx, e.target.value)}
                                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder={`Enter topic ${idx + 1} name`}
                                                    />
                                                </div>
                                                {formData.topics.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTopicField(idx)}
                                                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove topic"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addTopicField}
                                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                                    >
                                        <Plus size={16} />
                                        Add Another Topic
                                    </button>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} />
                                        Create Chapter
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-800">Edit Chapter</h2>
                                <button onClick={() => {
                                    setIsEditing(false);
                                    setEditingChapter(null);
                                }}>
                                    <X size={24} className="text-slate-400 hover:text-slate-600" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate} className="p-6 space-y-5">
                                {/* Same form fields as create modal */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        Chapter Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Electromagnetic Induction"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Subject *
                                        </label>
                                        <select
                                            required
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value as any })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        >
                                            {subjects.map(subject => (
                                                <option key={subject} value={subject}>{subject}</option>
                                            ))}
                                            <option value="All">All Subjects</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Unit
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.unit}
                                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Unit 1, Mechanics"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Difficulty Level
                                        </label>
                                        <select
                                            value={formData.difficulty}
                                            onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                            <option value="Mixed">Mixed</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        >
                                            <option value="active">Active</option>
                                            <option value="draft">Draft</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                                        placeholder="Brief description of this topic..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Topics in this Chapter
                                    </label>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                        {formData.topics.map((chapter, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <div className="flex-1 flex gap-2 items-center">
                                                    <span className="text-sm font-medium text-slate-500 w-20">
                                                        Topic {idx + 1}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={chapter}
                                                        onChange={e => handleTopicChange(idx, e.target.value)}
                                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder={`Enter topic ${idx + 1} name`}
                                                    />
                                                </div>
                                                {formData.topics.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTopicField(idx)}
                                                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove topic"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addTopicField}
                                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                                    >
                                        <Plus size={16} />
                                        Add Another Topic
                                    </button>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} />
                                        Update Chapter
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Import CSV Modal */}
            <AnimatePresence>
                {isImporting && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setIsImporting(false); setParsedRows([]); setValidationResults(new Map()); setMissingSubjects([]); }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Import Chapters from CSV</h2>
                                    <p className="text-sm text-slate-500 mt-1">Upload a CSV file to bulk import chapters</p>
                                </div>
                                <button onClick={() => { setIsImporting(false); setParsedRows([]); setValidationResults(new Map()); setMissingSubjects([]); setImportFile(null); }}>
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 bg-slate-50/50">
                                 {/* Formatting Guidelines & File Upload in 2-Column Grid */}
                                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                     {/* Left Panel: Excel Formatting Guide with Tabs */}
                                     <div className="lg:col-span-2 space-y-4">
                                         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                             {/* Header & Tabs */}
                                             <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                 <div className="flex items-center gap-2">
                                                     <BookOpen size={20} className="text-blue-600" />
                                                     <h3 className="font-bold text-slate-800">
                                                         Excel/CSV Template Guide
                                                     </h3>
                                                 </div>
                                                 <div className="flex bg-slate-200/70 p-1 rounded-xl self-start sm:self-auto">
                                                     <button
                                                         type="button"
                                                         onClick={() => setImportGuideTab('excel')}
                                                         className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                             importGuideTab === 'excel'
                                                                 ? 'bg-white text-slate-800 shadow-sm'
                                                                 : 'text-slate-500 hover:text-slate-700'
                                                         }`}
                                                     >
                                                         📊 Visual Excel View
                                                     </button>
                                                     <button
                                                         type="button"
                                                         onClick={() => setImportGuideTab('guide')}
                                                         className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                             importGuideTab === 'guide'
                                                                 ? 'bg-white text-slate-800 shadow-sm'
                                                                 : 'text-slate-500 hover:text-slate-700'
                                                         }`}
                                                     >
                                                         📋 Column Descriptions
                                                     </button>
                                                 </div>
                                             </div>

                                             <div className="p-5">
                                                 {importGuideTab === 'excel' ? (
                                                     <div className="space-y-4">
                                                         <div className="flex justify-between items-center text-xs text-slate-500">
                                                             <span>Scroll horizontally to view all columns. Pre-filled with standard sample values:</span>
                                                             <button
                                                                 onClick={() => downloadTemplate('chapters')}
                                                                 className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
                                                             >
                                                                 <Download size={12} /> Download CSV Template
                                                             </button>
                                                         </div>

                                                         {/* Mock Excel Sheet Container */}
                                                         <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner bg-slate-50">
                                                             {/* Excel Header Toolbar */}
                                                             <div className="bg-[#107c41] text-white px-3 py-2 text-xs font-semibold flex items-center justify-between border-b border-emerald-700">
                                                                 <div className="flex items-center gap-2">
                                                                     <span className="bg-white text-[#107c41] px-1 rounded text-[9px] font-bold">XLSX</span>
                                                                     <span>chapters_template.csv — Excel Grid View</span>
                                                                 </div>
                                                                 <span className="text-[10px] opacity-75">Comma-Separated (CSV)</span>
                                                             </div>

                                                             {/* Excel Grid Layout */}
                                                             <div className="overflow-x-auto max-w-full">
                                                                 <table className="w-full border-collapse text-left text-xs bg-white font-mono">
                                                                     <thead>
                                                                         {/* Column Letters Row */}
                                                                         <tr className="bg-slate-100 text-slate-500 font-sans border-b border-slate-200">
                                                                             <th className="px-2 py-1 border-r border-slate-200 bg-slate-200 text-center font-bold min-w-[30px]"></th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[150px]">A</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[100px]">B</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[85px]">C</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[200px]">D</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[150px]">E</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[80px]">F</th>
                                                                             <th className="px-3 py-1 border-slate-200 text-center min-w-[80px]">G</th>
                                                                         </tr>
                                                                         {/* CSV Headers Row */}
                                                                         <tr className="bg-emerald-50/70 text-emerald-900 border-b border-slate-200 font-bold">
                                                                             <td className="px-2 py-1.5 border-r border-slate-200 bg-slate-200 text-center text-slate-500 font-sans font-medium">1</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-blue-700">name <span className="text-red-500 font-sans">*</span></td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-blue-700">subject <span className="text-red-500 font-sans">*</span></td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200">unit</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-blue-700">description <span className="text-red-500 font-sans">*</span></td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-blue-700">topics <span className="text-red-500 font-sans">*</span></td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200">difficulty</td>
                                                                             <td className="px-3 py-1.5">status</td>
                                                                         </tr>
                                                                     </thead>
                                                                     <tbody className="divide-y divide-slate-100 text-slate-700">
                                                                         {/* Row 2: Biology Chapter */}
                                                                         <tr>
                                                                             <td className="px-2 py-1.5 border-r border-slate-200 bg-slate-100 text-center text-slate-400 font-sans font-medium">2</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans font-semibold text-slate-800">Biomolecules</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 bg-rose-50 text-rose-800 font-semibold font-sans">Biology</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans">Unit 1</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[180px] font-sans">Detailed study of biomolecules and enzymes</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[150px] font-sans">Amino Acids|Proteins|Lipids|Enzymes</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans text-center">Medium</td>
                                                                             <td className="px-3 py-1.5 font-sans text-center text-green-600 font-semibold">active</td>
                                                                         </tr>
                                                                         {/* Row 3: Chemistry Chapter */}
                                                                         <tr>
                                                                             <td className="px-2 py-1.5 border-r border-slate-200 bg-slate-100 text-center text-slate-400 font-sans font-medium">3</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans font-semibold text-slate-800">Structure of Atom</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 bg-emerald-50 text-emerald-800 font-semibold font-sans">Chemistry</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans">Unit 1</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[180px] font-sans">Atomic structure and chemical theories</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[150px] font-sans">Bohr Model|Rutherford Model|Quantum Numbers</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans text-center">Medium</td>
                                                                             <td className="px-3 py-1.5 font-sans text-center text-green-600 font-semibold">active</td>
                                                                         </tr>
                                                                         {/* Row 4: Physics Chapter */}
                                                                         <tr>
                                                                             <td className="px-2 py-1.5 border-r border-slate-200 bg-slate-100 text-center text-slate-400 font-sans font-medium">4</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans font-semibold text-slate-800">Laws of Motion</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 bg-blue-50 text-blue-800 font-semibold font-sans">Physics</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans">Unit 2</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[180px] font-sans">Newtonian mechanics and force dynamics</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[150px] font-sans">Newton's First Law|Friction|Circular Motion</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans text-center">Hard</td>
                                                                             <td className="px-3 py-1.5 font-sans text-center text-green-600 font-semibold">active</td>
                                                                         </tr>
                                                                     </tbody>
                                                                 </table>
                                                             </div>
                                                             {/* Excel Footer Sheet Tabs */}
                                                             <div className="bg-slate-100 border-t border-slate-200 px-3 py-1 flex items-center gap-1.5 text-[10px] text-slate-600">
                                                                 <div className="bg-white border-x border-t border-slate-300 text-emerald-700 px-3 py-1 font-bold rounded-t shadow-sm">
                                                                     Sheet1
                                                                 </div>
                                                                 <span className="opacity-40">|</span>
                                                                 <span className="cursor-pointer hover:underline text-slate-400 font-bold px-1">+</span>
                                                             </div>
                                                         </div>

                                                         <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed">
                                                             💡 <strong>Key Notice:</strong> Use a vertical pipe (<code>|</code>) character in the <code className="bg-slate-200 px-1 rounded">topics</code> column to separate multiple sub-topics in a single chapter row. Missing subjects will be auto-detected and can be instantly created!
                                                         </div>
                                                     </div>
                                                 ) : (
                                                     /* Grid Column Specifications View */
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                             <span className="font-bold text-blue-700 block mb-1">name</span>
                                                             <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1 inline-block">Required</span>
                                                             <p className="text-slate-600">The chapter or category name (e.g. Biomolecules).</p>
                                                         </div>
                                                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                             <span className="font-bold text-blue-700 block mb-1">subject</span>
                                                             <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1 inline-block">Required</span>
                                                             <p className="text-slate-600">Must be an existing subject in your system database. You can auto-create missing subjects below.</p>
                                                         </div>
                                                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                             <span className="font-bold text-blue-700 block mb-1">unit</span>
                                                             <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1 inline-block">Optional</span>
                                                             <p className="text-slate-600">The unit name or number (e.g. Unit 1).</p>
                                                         </div>
                                                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                             <span className="font-bold text-blue-700 block mb-1">description</span>
                                                             <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1 inline-block">Required</span>
                                                             <p className="text-slate-600">A detailed description of what is covered in this chapter.</p>
                                                         </div>
                                                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                             <span className="font-bold text-blue-700 block mb-1">topics</span>
                                                             <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1 inline-block">Required</span>
                                                             <p className="text-slate-600">Sub-topics within the chapter, separated by a vertical pipe <code>|</code> character.</p>
                                                         </div>
                                                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                             <span className="font-bold text-blue-700 block mb-1">difficulty</span>
                                                             <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1 inline-block">Optional</span>
                                                             <p className="text-slate-600">Must be Easy, Medium, or Hard. Defaults to Medium.</p>
                                                         </div>
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                     </div>

                                     {/* Right Panel: File Upload & Action Center */}
                                     <div className="space-y-4">
                                         <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                                             <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                 <Upload size={18} className="text-purple-600" />
                                                 Upload CSV File
                                             </h4>
                                             
                                             {/* Premium Drag & Drop or Custom File Selector Box */}
                                             <div className="relative group border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 rounded-xl p-4 transition-all duration-200 text-center">
                                                 <input
                                                     type="file"
                                                     accept=".csv"
                                                     onChange={handleFileSelect}
                                                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                 />
                                                 <div className="space-y-2">
                                                     <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                                         <Upload size={18} />
                                                     </div>
                                                     <div className="text-xs font-semibold text-slate-700">
                                                         {importFile ? importFile.name : 'Choose Chapters CSV file'}
                                                     </div>
                                                     <div className="text-[10px] text-slate-400">
                                                         {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : 'or drag and drop here'}
                                                     </div>
                                                 </div>
                                             </div>
                                             
                                             {/* Dynamic Elements Auto-creation Box */}
                                             {missingSubjects.length > 0 && (
                                                 <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 shadow-sm animate-pulse-once">
                                                     <div>
                                                         <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                                                             <AlertTriangle size={16} className="text-amber-600" /> Registry Additions Detected
                                                         </h4>
                                                         <p className="text-[10px] text-amber-800 mt-1">
                                                             This CSV refers to new subjects. Select the button below to register them in the database instantly:
                                                         </p>
                                                         <div className="flex flex-wrap gap-1 mt-2">
                                                             {missingSubjects.map(sub => (
                                                                 <span key={sub} className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-bold border border-rose-200 flex items-center gap-0.5">
                                                                     Subject: {sub}
                                                                 </span>
                                                             ))}
                                                         </div>
                                                     </div>
                                                     <button
                                                         type="button"
                                                         onClick={handleCreateMissingElements}
                                                         disabled={isCreatingMissing}
                                                         className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all text-xs shadow disabled:opacity-50 flex items-center justify-center gap-2"
                                                     >
                                                         {isCreatingMissing ? <Loader2 className="animate-spin" size={12} /> : null}
                                                         Auto-Create Registry Entries
                                                     </button>
                                                 </div>
                                             )}
                                         </div>
                                     </div>
                                 </div>

                                {/* Preview and Validation */}
                                {parsedRows.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-slate-700">
                                                Preview ({parsedRows.length} rows found)
                                            </h3>
                                            <div className="text-sm text-slate-600">
                                                Valid: {Array.from(validationResults.values()).filter(v => v.valid).length} |
                                                Invalid: {Array.from(validationResults.values()).filter(v => !v.valid).length}
                                            </div>
                                        </div>

                                        {/* Preview Table */}
                                        <div className="max-h-64 overflow-auto border rounded-lg">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left">Status</th>
                                                        <th className="px-3 py-2 text-left">Name</th>
                                                        <th className="px-3 py-2 text-left">Subject</th>
                                                        <th className="px-3 py-2 text-left">Topics</th>
                                                        <th className="px-3 py-2 text-left">Errors</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {parsedRows.map((row, index) => {
                                                        const validation = validationResults.get(index);
                                                        return (
                                                            <tr key={index} className={validation?.valid ? 'bg-green-50/50' : 'bg-red-50/50'}>
                                                                <td className="px-3 py-2">
                                                                    {validation?.valid ? (
                                                                        <span className="text-green-600 font-bold">✓</span>
                                                                    ) : (
                                                                        <span className="text-red-600 font-bold">✗</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2">{row.name}</td>
                                                                <td className="px-3 py-2">{row.subject}</td>
                                                                <td className="px-3 py-2 text-xs">{row.topics?.split('|').length || 0} topics</td>
                                                                <td className="px-3 py-2 text-xs text-red-600 font-semibold">
                                                                    {validation?.errors.join(', ')}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Upload Progress */}
                                        {isUploading && (
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Uploading...</span>
                                                    <span>{Math.round(uploadProgress)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Import Button */}
                                        <button
                                            onClick={handleImportCSV}
                                            disabled={isUploading || Array.from(validationResults.values()).filter(v => v.valid).length === 0}
                                            className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                                            {isUploading ? 'Importing...' : `Import ${Array.from(validationResults.values()).filter(v => v.valid).length} Valid Chapters`}
                                        </button>
                                    </div>
                                )}

                                {importFile === null && parsedRows.length === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        <Upload size={48} className="mx-auto mb-2 opacity-50" />
                                        <p>Select a CSV file to begin importing</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminChaptersPage;
