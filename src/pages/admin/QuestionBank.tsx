import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, X, Save, Loader2, Download, BarChart3, Edit2, Upload, AlertTriangle, List, BookOpen } from 'lucide-react';
import { db, storage } from '../../firebase';
import { useSubjectList } from '../../hooks/useSubjectList';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useExamList } from '../../hooks/useExamList';
import { parseQuestionsCSV, validateQuestion, batchUploadQuestions, downloadTemplate } from '../../utils/csvImporter';
import { JEE_MAINS_2024_WEIGHTAGE } from '../../data/jeeMainsWeightage2024';
import type { QuestionCSVRow, ValidationResult } from '../../utils/csvImporter';

interface Question {
    id: string;
    text: string;
    textHindi?: string;
    options: string[]; // For MCQ, empty for numerical
    optionsHindi?: string[];
    correctAnswer: number | string; // index for MCQ, value for numerical
    subject: string;
    chapter: string; // Chapter name
    topic?: string; // Topic from selected chapter
    examCategory?: string;
    type: 'MCQ' | 'Numerical';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    marks?: number; // Default marks for this question (default: 4)
    negativeMarks?: number; // Negative marking (optional, default: -1 for MCQ)
    explanation?: string; // Solution/explanation text (optional)
    imageUrls?: string[];
    createdAt: any;
}

const AdminQuestionBank = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [chapters, setChapters] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const [searchTerm, setSearchTerm] = useState('');
    const [showStats, setShowStats] = useState(false);

    // Deletion Modal State
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isDeletingLoading, setIsDeletingLoading] = useState(false);

    // Filters
    const [filterSubject, setFilterSubject] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
    const [filterExam, setFilterExam] = useState<string>('all');

    // CSV Import states
    const [isImporting, setIsImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [parsedRows, setParsedRows] = useState<QuestionCSVRow[]>([]);
    const [validationResults, setValidationResults] = useState<Map<number, ValidationResult>>(new Map());
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const subjects = useSubjectList();
    const exams = useExamList();
    
    // New states for auto-creation options
    const [missingSubjects, setMissingSubjects] = useState<string[]>([]);
    const [missingChapters, setMissingChapters] = useState<{name: string, subject: string}[]>([]);
    const [isCreatingMissing, setIsCreatingMissing] = useState(false);
    const [importGuideTab, setImportGuideTab] = useState<'excel' | 'guide'>('excel');
    
    // Inline quick edit states
    const [editingCell, setEditingCell] = useState<{questionId: string, field: 'subject' | 'chapter' | 'topic' | 'examCategory'} | null>(null);
    const [quickEditLoading, setQuickEditLoading] = useState<string | null>(null);

    // Bulk selection state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const toggleSelectQuestion = (id: string) => {
        const newSelected = new Set(selectedQuestionIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedQuestionIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedQuestionIds.size === filteredQuestions.length && filteredQuestions.length > 0) {
            setSelectedQuestionIds(new Set());
        } else {
            setSelectedQuestionIds(new Set(filteredQuestions.map(q => q.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedQuestionIds.size === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedQuestionIds.size} selected questions?`)) return;

        setIsBulkDeleting(true);
        try {
            const batchSize = 500;
            const idsArray = Array.from(selectedQuestionIds);
            
            for (let i = 0; i < idsArray.length; i += batchSize) {
                const batch = writeBatch(db);
                const chunk = idsArray.slice(i, i + batchSize);
                chunk.forEach(id => {
                    batch.delete(doc(db, 'questions', id));
                });
                await batch.commit();
            }

            setSelectedQuestionIds(new Set());
            setIsSelectionMode(false);
            alert(`Successfully deleted ${idsArray.length} questions.`);
        } catch (error) {
            console.error("Error bulk deleting questions:", error);
            alert("Failed to delete some questions. Please try again.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        if (filteredQuestions.length === 0) return;
        if (!window.confirm(`DANGER: Are you sure you want to delete ALL ${filteredQuestions.length} questions matching current filters? This cannot be undone.`)) return;

        setIsBulkDeleting(true);
        try {
            const batchSize = 500;
            const idsArray = filteredQuestions.map(q => q.id);
            
            for (let i = 0; i < idsArray.length; i += batchSize) {
                const batch = writeBatch(db);
                const chunk = idsArray.slice(i, i + batchSize);
                chunk.forEach(id => {
                    batch.delete(doc(db, 'questions', id));
                });
                await batch.commit();
            }

            setSelectedQuestionIds(new Set());
            setIsSelectionMode(false);
            alert(`Successfully deleted all ${idsArray.length} questions.`);
        } catch (error) {
            console.error("Error deleting all questions:", error);
            alert("Failed to delete all questions. Please try again.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleDelete = async (id: string) => {
        setIsDeletingLoading(true);
        try {
            await delay(800); // Small delay for better UX
            await deleteDoc(doc(db, 'questions', id));
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Error deleting question:", error);
            alert("Failed to delete question. Please try again.");
        } finally {
            setIsDeletingLoading(false);
        }
    };

    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imagePreviews]);

    const [formData, setFormData] = useState({
        text: '',
        textHindi: '',
        options: ['', '', '', ''],
        optionsHindi: ['', '', '', ''],
        correctAnswer: '0',
        subject: 'Physics',
        chapter: '',
        topic: '',
        examCategory: 'JEE',
        type: 'MCQ' as 'MCQ' | 'Numerical',
        difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
        marks: 4,
        negativeMarks: -1,
        explanation: '',
        imageUrls: [] as string[]
    });

    // Get chapters for selected subject from chapters collection
    const getChaptersForSubject = (subject: string) => {
        return chapters.filter(ch => ch.subject === subject);
    };

    // Get topics from selected chapter
    const getTopicsForChapter = (chapterName: string) => {
        const chapter = chapters.find(ch => ch.name === chapterName);
        return chapter?.topics || [];
    };

    useEffect(() => {
        // Fetch questions
        const questionsQuery = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
        const unsubscribeQuestions = onSnapshot(questionsQuery, (snapshot) => {
            const fetchedQuestions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Question[];
            setQuestions(fetchedQuestions);
            setIsLoading(false);
        });

        // Fetch chapters for dynamic chapter and topic loading
        const chaptersQuery = query(collection(db, 'chapters'), orderBy('createdAt', 'desc'));
        const unsubscribeChapters = onSnapshot(chaptersQuery, (snapshot) => {
            const fetchedChapters = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChapters(fetchedChapters);
        });

        return () => {
            unsubscribeQuestions();
            unsubscribeChapters();
        };
    }, []);

    const sanitizeFileName = (name: string) => {
        return name
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^\w.-]/g, '');
    };

    const uploadQuestionImages = async (files: File[]) => {
        const urls: string[] = [];
        for (const file of files) {
            const safeName = sanitizeFileName(file.name);
            const imageRef = ref(storage, `question-images/${Date.now()}_${safeName}`);
            const snapshot = await uploadBytes(imageRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            urls.push(downloadUrl);
        }
        return urls;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await delay(1000); // Artificial delay

            let uploadUrls: string[] = [];
            if (imageFiles.length > 0) {
                try {
                    uploadUrls = await uploadQuestionImages(imageFiles);
                } catch (imageError) {
                    console.error('Image upload failed:', imageError);
                    alert('Image upload failed. Question will still be created without images. Please check Firebase Storage CORS and bucket configuration.');
                    uploadUrls = [];
                }
            }

            const questionData: any = {
                text: formData.text,
                textHindi: formData.textHindi || '',
                subject: formData.subject,
                chapter: formData.chapter,
                topic: formData.topic || '',
                examCategory: formData.examCategory || 'General',
                type: formData.type,
                difficulty: formData.difficulty,
                marks: formData.marks,
                negativeMarks: formData.type === 'MCQ' ? formData.negativeMarks : 0,
                explanation: formData.explanation || '',
                imageUrls: [...formData.imageUrls, ...uploadUrls],
                createdAt: serverTimestamp()
            };

            if (formData.type === 'MCQ') {
                questionData.options = formData.options.filter(o => o.trim() !== '');
                questionData.optionsHindi = formData.optionsHindi;
                questionData.correctAnswer = Number(formData.correctAnswer);
            } else {
                questionData.options = [];
                questionData.optionsHindi = formData.optionsHindi;
                questionData.correctAnswer = formData.correctAnswer;
            }

            await addDoc(collection(db, 'questions'), questionData);

            setIsCreating(false);
            setImageFiles([]);
            setImagePreviews([]);
            setFormData({
                text: '',
                textHindi: '',
                options: ['', '', '', ''],
                optionsHindi: ['', '', '', ''],
                correctAnswer: '0',
                subject: 'Physics',
                chapter: '',
                topic: '',
                examCategory: 'JEE',
                type: 'MCQ',
                difficulty: 'Medium',
                marks: 4,
                negativeMarks: -1,
                explanation: '',
                imageUrls: []
            });
        } catch (error) {
            console.error("Error creating question:", error);
            alert("Error creating question. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const handleOptionHindiChange = (index: number, value: string) => {
        const newOptionsHindi = [...formData.optionsHindi];
        newOptionsHindi[index] = value;
        setFormData({ ...formData, optionsHindi: newOptionsHindi });
    };

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        setImageFiles(files);
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    const handleEdit = (question: Question) => {
        setEditingQuestion(question);
        setFormData({
            text: question.text,
            textHindi: question.textHindi || '',
            options: question.options.length > 0 ? question.options : ['', '', '', ''],
            optionsHindi: question.optionsHindi?.length === 4 ? question.optionsHindi : ['', '', '', ''],
            correctAnswer: typeof question.correctAnswer === 'number' ? String(question.correctAnswer) : question.correctAnswer,
            subject: question.subject,
            chapter: question.chapter,
            topic: question.topic || '',
            examCategory: question.examCategory || 'JEE',
            type: question.type,
            difficulty: question.difficulty,
            marks: question.marks || 4,
            negativeMarks: question.negativeMarks || -1,
            explanation: question.explanation || '',
            imageUrls: question.imageUrls || []
        });
        setImageFiles([]);
        setImagePreviews([]);
        setIsEditing(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingQuestion) return;

        setIsSubmitting(true);
        try {
            await delay(1000); // Artificial delay

            let uploadUrls: string[] = [];
            if (imageFiles.length > 0) {
                try {
                    uploadUrls = await uploadQuestionImages(imageFiles);
                } catch (imageError) {
                    console.error('Image upload failed:', imageError);
                    alert('Image upload failed. Question will still be updated without new images. Please check Firebase Storage CORS and bucket configuration.');
                    uploadUrls = [];
                }
            }

            const questionData: any = {
                text: formData.text,
                textHindi: formData.textHindi || '',
                subject: formData.subject,
                chapter: formData.chapter,
                topic: formData.topic || '',
                examCategory: formData.examCategory || 'General',
                type: formData.type,
                difficulty: formData.difficulty,
                marks: formData.marks,
                negativeMarks: formData.type === 'MCQ' ? formData.negativeMarks : 0,
                explanation: formData.explanation || '',
                imageUrls: [...(formData.imageUrls || []), ...uploadUrls]
            };

            if (formData.type === 'MCQ') {
                questionData.options = formData.options.filter(o => o.trim() !== '');
                questionData.optionsHindi = formData.optionsHindi;
                questionData.correctAnswer = Number(formData.correctAnswer);
            } else {
                questionData.options = [];
                questionData.optionsHindi = formData.optionsHindi;
                questionData.correctAnswer = formData.correctAnswer;
            }

            await updateDoc(doc(db, 'questions', editingQuestion.id), questionData);

            setIsEditing(false);
            setEditingQuestion(null);
            setImageFiles([]);
            setImagePreviews([]);
            setFormData({
                text: '',
                textHindi: '',
                options: ['', '', '', ''],
                optionsHindi: ['', '', '', ''],
                correctAnswer: '0',
                subject: 'Physics',
                chapter: '',
                topic: '',
                examCategory: 'JEE',
                type: 'MCQ',
                difficulty: 'Medium',
                marks: 4,
                negativeMarks: -1,
                explanation: '',
                imageUrls: []
            });
        } catch (error) {
            console.error("Error updating question:", error);
            alert("Error updating question. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickUpdate = async (questionId: string, field: 'subject' | 'chapter' | 'topic' | 'examCategory', value: string) => {
        setQuickEditLoading(`${questionId}-${field}`);
        try {
            const questionRef = doc(db, 'questions', questionId);
            await updateDoc(questionRef, {
                [field]: value,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error quick updating question:", error);
            alert("Failed to update question. Please try again.");
        } finally {
            setQuickEditLoading(null);
            setEditingCell(null);
        }
    };

    // ========== CSV IMPORT HANDLERS ==========

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportFile(file);

        try {
            const result = await parseQuestionsCSV(file);
            setParsedRows(result.data);

            // Validate all rows in parallel using full dynamic subjects list
            const validationPromises = result.data.map((row, index) => validateQuestion(row, index, subjects));
            const validationList = await Promise.all(validationPromises);

            const validations = new Map<number, ValidationResult>();
            validationList.forEach((validation, index) => {
                validations.set(index, validation);
            });
            setValidationResults(validations);

            // Check for missing subjects
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

            // Check for missing chapters
            const csvChapters = Array.from(new Set(result.data.map(row => {
                let sub = row.subject?.trim() || '';
                if (sub.toLowerCase() === 'physics') sub = 'Physics';
                if (sub.toLowerCase() === 'chemistry') sub = 'Chemistry';
                if (sub.toLowerCase() === 'mathematics' || sub.toLowerCase() === 'maths') sub = 'Mathematics';
                if (sub.toLowerCase() === 'biology') sub = 'Biology';
                else sub = sub.charAt(0).toUpperCase() + sub.slice(1);

                return JSON.stringify({
                    name: row.chapter?.trim() || '',
                    subject: sub
                });
            })))
            .map(s => JSON.parse(s)) as {name: string, subject: string}[];

            const chaptersSnapshot = await getDocs(collection(db, 'chapters'));
            const existingChapters = chaptersSnapshot.docs.map((doc: any) => {
                const d = doc.data();
                return { name: d.name, subject: d.subject };
            });

            const missingChaps = csvChapters.filter(chap => 
                chap.name && chap.subject && 
                !existingChapters.some((ec: any) => ec.name.toLowerCase() === chap.name.toLowerCase() && ec.subject.toLowerCase() === chap.subject.toLowerCase())
            );
            setMissingChapters(missingChaps);

        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Error parsing CSV file. Please check the format.');
        }
    };

    const handleCreateMissingElements = async () => {
        setIsCreatingMissing(true);
        try {
            // 1. Create missing subjects
            for (const sub of missingSubjects) {
                await addDoc(collection(db, 'subjects'), {
                    name: sub,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            // 2. Create missing chapters
            for (const chap of missingChapters) {
                await addDoc(collection(db, 'chapters'), {
                    name: chap.name,
                    subject: chap.subject,
                    unit: '',
                    description: `Automatically created during CSV import`,
                    topics: [chap.name + ' Intro'],
                    difficulty: 'Medium',
                    status: 'active',
                    createdAt: serverTimestamp()
                });
            }

            alert("Successfully created missing subjects and chapters in the system!");

            // Local cache update and re-validation
            const newSubjects = [...subjects, ...missingSubjects];
            setMissingSubjects([]);
            setMissingChapters([]);

            if (importFile) {
                const result = await parseQuestionsCSV(importFile);
                const validationPromises = result.data.map((row, index) => validateQuestion(row, index, newSubjects));
                const validationList = await Promise.all(validationPromises);
                const validations = new Map<number, ValidationResult>();
                validationList.forEach((validation, index) => {
                    validations.set(index, validation);
                });
                setValidationResults(validations);
            }
        } catch (error) {
            console.error("Error creating missing elements:", error);
            alert("Failed to create missing elements. Please try again.");
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

        if (!window.confirm(`Import ${validRows.length} questions?`)) {
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const result = await batchUploadQuestions(validRows, (progress) => {
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
            console.error('Error importing questions:', error);
            alert('Error importing questions. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // Apply filters
    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.chapter.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubject = filterSubject === 'all' || q.subject === filterSubject;
        const matchesType = filterType === 'all' || q.type === filterType;
        const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
        const matchesExam = filterExam === 'all' || q.examCategory === filterExam;

        return matchesSearch && matchesSubject && matchesType && matchesDifficulty && matchesExam;
    });

    // Calculate statistics
    const getStatistics = () => {
        const stats = {
            total: questions.length,
            bySubject: {} as Record<string, number>,
            byType: { MCQ: 0, Numerical: 0 },
            byDifficulty: { Easy: 0, Medium: 0, Hard: 0 }
        };

        questions.forEach(q => {
            stats.bySubject[q.subject] = (stats.bySubject[q.subject] || 0) + 1;
            stats.byType[q.type]++;
            stats.byDifficulty[q.difficulty]++;
        });

        return stats;
    };

    const stats = getStatistics();


    const handleSeed = async () => {
        if (!window.confirm('Seed 150 dummy questions (aligned with JEE Weightage)?')) return;
        setIsLoading(true);
        try {
            await delay(1500); // Artificial delay for seed
            const batch = writeBatch(db);
            const subjects = ['Physics', 'Chemistry', 'Mathematics'];
            const types = ['MCQ', 'Numerical'];
            const difficulties = ['Easy', 'Medium', 'Hard'];

            let count = 0;
            const target = 300;

            // Flatten validation map for easier access
            const subjectChapters: Record<string, string[]> = {};

            subjects.forEach(sub => {
                subjectChapters[sub] = [];
                // @ts-ignore
                const subData = JEE_MAINS_2024_WEIGHTAGE[sub] || {};
                Object.values(subData).forEach((unit: any) => {
                    if (unit.chapters) subjectChapters[sub].push(...unit.chapters);
                });
            });

            while (count < target) {
                const subject = subjects[count % 3];
                const chaptersList = subjectChapters[subject];
                // Fallback to 'General' if undefined or empty
                const availableChapters = (chaptersList && chaptersList.length > 0) ? chaptersList : ['General'];
                const chapter = availableChapters[count % availableChapters.length];
                const type = types[count % 2] as 'MCQ' | 'Numerical';
                const difficulty = difficulties[count % 3] as 'Easy' | 'Medium' | 'Hard';

                const newDocRef = doc(collection(db, 'questions'));

                batch.set(newDocRef, {
                    text: `Dummy Question ${count + 1} for ${subject} - ${chapter} (${type})`,
                    subject,
                    chapter,
                    topic: 'Basics',
                    type,
                    difficulty,
                    marks: 4,
                    negativeMarks: type === 'MCQ' ? -1 : 0,
                    options: type === 'MCQ' ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
                    correctAnswer: type === 'MCQ' ? 0 : '10',
                    explanation: 'This is a dummy explanation.',
                    createdAt: serverTimestamp()
                });
                count++;
            }

            await batch.commit();
            alert('Seeded 150 questions!');
        } catch (error) {
            console.error("Error seeding:", error);
            alert("Error seeding questions.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Question Bank</h1>
                    <p className="text-slate-500 mt-1">Manage questions for JEE Mains test generation.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            if (isSelectionMode) setSelectedQuestionIds(new Set());
                        }}
                        className={`flex items-center justify-center gap-2 px-5 py-2.5 font-semibold rounded-xl transition-all duration-200 shadow-sm ${
                            isSelectionMode 
                            ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {isSelectionMode ? <X size={18} /> : <List size={18} />}
                        {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
                    </button>
                    <button
                        onClick={() => downloadTemplate('questions')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                    >
                        <Download size={18} /> Download CSV Template
                    </button>
                    <button
                        onClick={() => setIsImporting(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                    >
                        <Upload size={18} /> Import CSV
                    </button>
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        <BarChart3 size={20} /> Statistics
                    </button>
                    <button
                        onClick={handleSeed}
                        className="flex items-center gap-2 px-4 py-2.5 bg-yellow-600 text-white font-semibold rounded-xl hover:bg-yellow-700 transition-colors"
                    >
                        Seed DB
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} /> Add Question
                    </button>
                </div>
            </div>

            {/* Statistics Panel */}
            {showStats && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100"
                >
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Question Bank Statistics</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="bg-white rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                            <div className="text-sm text-slate-500 mt-1">Total Questions</div>
                        </div>
                        {subjects.map(subject => (
                            <div key={subject} className="bg-white rounded-xl p-4 text-center">
                                <div className={`text-2xl font-bold ${
                                    subject === 'Physics' ? 'text-green-600' :
                                    subject === 'Chemistry' ? 'text-purple-600' :
                                    subject === 'Mathematics' ? 'text-orange-600' :
                                    subject === 'Biology' ? 'text-rose-600' :
                                    'text-slate-600'
                                }`}>{stats.bySubject[subject] || 0}</div>
                                <div className="text-sm text-slate-500 mt-1">{subject}</div>
                            </div>
                        ))}
                        <div className="bg-white rounded-xl p-4 text-center">
                            <div className="text-xl font-bold text-slate-600">{stats.byType.MCQ} / {stats.byType.Numerical}</div>
                            <div className="text-sm text-slate-500 mt-1">MCQ / Numerical</div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Filters and Search */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search questions..."
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
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="all">All Types</option>
                        <option value="MCQ">MCQ</option>
                        <option value="Numerical">Numerical</option>
                    </select>
                    <select
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="all">All Difficulties</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                    <select
                        value={filterExam}
                        onChange={(e) => setFilterExam(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="all">All Exams</option>
                        {exams.map(exam => (
                            <option key={exam} value={exam}>{exam}</option>
                        ))}
                    </select>
                </div>

                {/* Bulk Actions Bar */}
                <AnimatePresence>
                    {(isSelectionMode || isBulkDeleting) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                    {selectedQuestionIds.size} questions selected
                                </span>
                                {isBulkDeleting && (
                                    <span className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                        <Loader2 className="animate-spin" size={16} />
                                        Processing bulk action...
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedQuestionIds(new Set())}
                                    disabled={isBulkDeleting}
                                    className="px-4 py-2 text-slate-500 hover:text-slate-700 font-semibold text-sm disabled:opacity-50"
                                >
                                    Cancel Selection
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isBulkDeleting || selectedQuestionIds.size === 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 size={16} /> Delete Selected
                                </button>
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={isBulkDeleting || filteredQuestions.length === 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
                                >
                                    <AlertTriangle size={16} /> Delete All Filtered
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Questions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                {isSelectionMode && (
                                    <th className="px-6 py-4 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={filteredQuestions.length > 0 && selectedQuestionIds.size === filteredQuestions.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </th>
                                )}
                                <th className="px-6 py-4">Question</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4">Chapter</th>
                                <th className="px-6 py-4">Topic</th>
                                <th className="px-6 py-4">Exam</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Marks</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                             {isLoading ? (
                                <tr><td colSpan={isSelectionMode ? 9 : 8} className="text-center py-8"><Loader2 className="animate-spin inline" /></td></tr>
                            ) : filteredQuestions.length === 0 ? (
                                <tr><td colSpan={isSelectionMode ? 9 : 8} className="text-center py-8 text-slate-500">No questions found. Add some to get started.</td></tr>
                            ) : (
                                filteredQuestions.map((q) => (
                                    <tr
                                        key={q.id}
                                        className={`hover:bg-slate-50/50 transition-colors ${selectedQuestionIds.has(q.id) ? 'bg-blue-50/30' : ''}`}
                                    >
                                         {isSelectionMode && (
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedQuestionIds.has(q.id)}
                                                    onChange={() => toggleSelectQuestion(q.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4 font-medium text-slate-700 max-w-md truncate">
                                            {q.text}
                                        </td>
                                         {/* Subject Cell with Inline Edit Dropdown */}
                                         <td className="px-6 py-4 min-w-[120px]">
                                             {quickEditLoading === `${q.id}-subject` ? (
                                                 <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                     <Loader2 className="animate-spin" size={12} /> Saving...
                                                 </div>
                                             ) : editingCell?.questionId === q.id && editingCell?.field === 'subject' ? (
                                                 <select
                                                     autoFocus
                                                     value={q.subject}
                                                     onChange={(e) => handleQuickUpdate(q.id, 'subject', e.target.value)}
                                                     onBlur={() => setEditingCell(null)}
                                                     className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                                 >
                                                     {subjects.map((sub) => (
                                                         <option key={sub} value={sub}>{sub}</option>
                                                     ))}
                                                 </select>
                                             ) : (
                                                 <div 
                                                     onClick={() => setEditingCell({ questionId: q.id, field: 'subject' })}
                                                     className="group cursor-pointer hover:bg-slate-100/70 p-1.5 rounded-lg transition-all flex items-center justify-between border border-transparent hover:border-slate-200"
                                                     title="Click to quickly change subject"
                                                 >
                                                     <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                         q.subject === 'Physics' ? 'bg-green-100 text-green-700' :
                                                         q.subject === 'Chemistry' ? 'bg-purple-100 text-purple-700' :
                                                         q.subject === 'Mathematics' ? 'bg-orange-100 text-orange-700' :
                                                         q.subject === 'Biology' ? 'bg-rose-100 text-rose-700' :
                                                         'bg-slate-100 text-slate-700'
                                                         }`}>
                                                         {q.subject}
                                                     </span>
                                                     <Edit2 size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 flex-shrink-0" />
                                                 </div>
                                             )}
                                         </td>

                                         {/* Chapter Cell with Inline Edit Dropdown */}
                                         <td className="px-6 py-4 min-w-[150px]">
                                             {quickEditLoading === `${q.id}-chapter` ? (
                                                 <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                     <Loader2 className="animate-spin" size={12} /> Saving...
                                                 </div>
                                             ) : editingCell?.questionId === q.id && editingCell?.field === 'chapter' ? (
                                                 <select
                                                     autoFocus
                                                     value={q.chapter}
                                                     onChange={(e) => handleQuickUpdate(q.id, 'chapter', e.target.value)}
                                                     onBlur={() => setEditingCell(null)}
                                                     className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                                 >
                                                     <option value="">Select Chapter</option>
                                                     {getChaptersForSubject(q.subject).map((ch: any) => (
                                                         <option key={ch.id || ch.name} value={ch.name}>{ch.name}</option>
                                                     ))}
                                                 </select>
                                             ) : (
                                                 <div 
                                                     onClick={() => setEditingCell({ questionId: q.id, field: 'chapter' })}
                                                     className="group cursor-pointer hover:bg-slate-100/70 p-1.5 rounded-lg transition-all flex items-center justify-between border border-transparent hover:border-slate-200 text-sm text-slate-600 font-medium"
                                                     title="Click to quickly change chapter"
                                                 >
                                                     <span className="truncate pr-1">{q.chapter || 'Select Chapter'}</span>
                                                     <Edit2 size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 flex-shrink-0" />
                                                 </div>
                                             )}
                                         </td>

                                         {/* Topic Cell with Inline Edit Text Input */}
                                         <td className="px-6 py-4 min-w-[150px]">
                                             {quickEditLoading === `${q.id}-topic` ? (
                                                 <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                     <Loader2 className="animate-spin" size={12} /> Saving...
                                                 </div>
                                             ) : editingCell?.questionId === q.id && editingCell?.field === 'topic' ? (
                                                 <input
                                                     type="text"
                                                     autoFocus
                                                     defaultValue={q.topic || ''}
                                                     onKeyDown={(e) => {
                                                         if (e.key === 'Enter') {
                                                             handleQuickUpdate(q.id, 'topic', e.currentTarget.value);
                                                         } else if (e.key === 'Escape') {
                                                             setEditingCell(null);
                                                         }
                                                     }}
                                                     onBlur={(e) => handleQuickUpdate(q.id, 'topic', e.target.value)}
                                                     placeholder="Type topic & Enter"
                                                     className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                                 />
                                             ) : (
                                                 <div 
                                                     onClick={() => setEditingCell({ questionId: q.id, field: 'topic' })}
                                                     className="group cursor-pointer hover:bg-slate-100/70 p-1.5 rounded-lg transition-all flex items-center justify-between border border-transparent hover:border-slate-200 text-sm text-slate-600 font-medium"
                                                     title="Click to quickly change topic"
                                                 >
                                                     <span className={`truncate pr-1 ${!q.topic || q.topic === 'None' ? 'text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded' : ''}`}>
                                                         {q.topic || 'None'}
                                                     </span>
                                                     <Edit2 size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 flex-shrink-0" />
                                                 </div>
                                             )}
                                         </td>

                                         {/* Exam Cell with Inline Edit Dropdown */}
                                         <td className="px-6 py-4 min-w-[120px]">
                                             {quickEditLoading === `${q.id}-examCategory` ? (
                                                 <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                     <Loader2 className="animate-spin" size={12} /> Saving...
                                                 </div>
                                             ) : editingCell?.questionId === q.id && editingCell?.field === 'examCategory' ? (
                                                 <select
                                                     autoFocus
                                                     value={q.examCategory || 'General'}
                                                     onChange={(e) => handleQuickUpdate(q.id, 'examCategory', e.target.value)}
                                                     onBlur={() => setEditingCell(null)}
                                                     className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                                 >
                                                     <option value="General">General</option>
                                                     {exams.map(exam => (
                                                         <option key={exam} value={exam}>{exam}</option>
                                                     ))}
                                                 </select>
                                             ) : (
                                                 <div 
                                                     onClick={() => setEditingCell({ questionId: q.id, field: 'examCategory' })}
                                                     className="group cursor-pointer hover:bg-slate-100/70 p-1.5 rounded-lg transition-all flex items-center justify-between border border-transparent hover:border-slate-200 text-sm text-slate-600 font-medium"
                                                     title="Click to quickly change exam category"
                                                 >
                                                     <span className="truncate pr-1">{q.examCategory || 'General'}</span>
                                                     <Edit2 size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 flex-shrink-0" />
                                                 </div>
                                             )}
                                         </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${q.type === 'MCQ' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {q.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{q.marks || 4}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(q)}
                                                    className="text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="Edit question"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(q.id)}
                                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                                    title="Delete question"
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
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsCreating(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-800">Add New Question</h2>
                                <button onClick={() => setIsCreating(false)}><X size={24} className="text-slate-400" /></button>
                            </div>
                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                {/* Subject and Type */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Subject *</label>
                                        <select
                                            required
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value as any, chapter: '', topic: '' })}
                                            className="w-full px-4 py-2 border rounded-lg bg-white"
                                        >
                                            {subjects.map(subject => (
                                                <option key={subject} value={subject}>{subject}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Question Type *</label>
                                        <select
                                            required
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                            className="w-full px-4 py-2 border rounded-lg bg-white"
                                        >
                                            <option>MCQ</option>
                                            <option>Numerical</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Chapter, Difficulty and Exam */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Chapter *</label>
                                        <select
                                            required
                                            value={formData.chapter}
                                            onChange={e => setFormData({ ...formData, chapter: e.target.value, topic: '' })}
                                            className="w-full px-4 py-2 border rounded-lg bg-white"
                                            disabled={!formData.subject}
                                        >
                                            <option value="">Select Chapter</option>
                                            {getChaptersForSubject(formData.subject).map((ch: any) => (
                                                <option key={ch.id} value={ch.name}>{ch.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Difficulty *</label>
                                        <select
                                            required
                                            value={formData.difficulty}
                                            onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
                                            className="w-full px-4 py-2 border rounded-lg bg-white"
                                        >
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Exam Category *</label>
                                        <select
                                            required
                                            value={formData.examCategory}
                                            onChange={e => setFormData({ ...formData, examCategory: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg bg-white"
                                        >
                                            {exams.map(exam => (
                                                <option key={exam} value={exam}>{exam}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Topic and Marks */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Topic *</label>
                                        <select
                                            required
                                            value={formData.topic}
                                            onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg bg-white"
                                            disabled={!formData.chapter}
                                        >
                                            <option value="">Select Topic</option>
                                            {getTopicsForChapter(formData.chapter).map((topic: string, idx: number) => (
                                                <option key={idx} value={topic}>{topic}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Marks *</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.marks}
                                            onChange={e => setFormData({ ...formData, marks: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border rounded-lg"
                                            placeholder="4"
                                            min="1"
                                            max="10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Negative Marks</label>
                                        <input
                                            type="number"
                                            value={formData.negativeMarks}
                                            onChange={e => setFormData({ ...formData, negativeMarks: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border rounded-lg"
                                            placeholder="-1"
                                            step="0.25"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Typically -1 for JEE Mains (MCQ only)</p>
                                    </div>
                                </div>

                                {/* Question Text */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Question Text *</label>
                                    <textarea
                                        required
                                        value={formData.text}
                                        onChange={e => setFormData({ ...formData, text: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg h-24 resize-none"
                                        placeholder="Enter the complete question text..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Question Text (Hindi)</label>
                                    <textarea
                                        value={formData.textHindi}
                                        onChange={e => setFormData({ ...formData, textHindi: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg h-24 resize-none"
                                        placeholder="हिंदी में प्रश्न लिखें (वैकल्पिक)"
                                    />
                                </div>

                                {/* Options (for MCQ) */}
                                {formData.type === 'MCQ' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Options *</label>
                                        <div className="space-y-2">
                                            {[0, 1, 2, 3].map((i) => (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                        {String.fromCharCode(65 + i)}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.options[i]}
                                                        onChange={e => handleOptionChange(i, e.target.value)}
                                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                                        placeholder={`Option ${i + 1}`}
                                                    />
                                                    <input
                                                        type="radio"
                                                        name="correctAnswer"
                                                        checked={formData.correctAnswer === String(i)}
                                                        onChange={() => setFormData({ ...formData, correctAnswer: String(i) })}
                                                        className="w-4 h-4"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Select the correct answer using the radio button</p>
                                    </div>
                                )}

                                {formData.type === 'MCQ' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hindi Options (Optional)</label>
                                        <div className="space-y-2">
                                            {[0, 1, 2, 3].map((i) => (
                                                <input
                                                    key={i}
                                                    type="text"
                                                    value={formData.optionsHindi[i]}
                                                    onChange={e => handleOptionHindiChange(i, e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                                    placeholder={`Option ${String.fromCharCode(65 + i)} in Hindi`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Hindi translations for the options are optional but helpful for bilingual uploads.</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Upload Question Images</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageSelect}
                                        className="w-full text-sm text-slate-500"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Add supporting images for the question. JPG/PNG files only.</p>
                                    {(imagePreviews.length > 0 || formData.imageUrls.length > 0) && (
                                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {formData.imageUrls.map((url, idx) => (
                                                <a key={`existing-image-${idx}`} href={url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                                    <img src={url} alt={`existing image ${idx + 1}`} className="h-24 w-full object-cover" />
                                                </a>
                                            ))}
                                            {imagePreviews.map((preview, idx) => (
                                                <div key={`preview-${idx}`} className="block rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                                    <img src={preview} alt={`preview ${idx + 1}`} className="h-24 w-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Correct Answer (for Numerical) */}
                                {formData.type === 'Numerical' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Correct Answer *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.correctAnswer}
                                            onChange={e => setFormData({ ...formData, correctAnswer: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg"
                                            placeholder="Enter numerical value (e.g., 9.8 or 100)"
                                        />
                                    </div>
                                )}

                                {/* Explanation (Optional) */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Explanation (Optional)</label>
                                    <textarea
                                        value={formData.explanation}
                                        onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg h-24 resize-none"
                                        placeholder="Provide a detailed solution or explanation for this question..."
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Add step-by-step solution for students</p>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                    {isSubmitting ? 'Creating Question...' : 'Add Question'}
                                </button>
                            </form>
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
                                                    <h3 className="text-xl font-bold text-slate-800">Delete Question?</h3>
                                                    <p className="text-slate-500 mt-2">
                                                        Are you sure you want to delete this question? This action cannot be undone and it will be removed from any tests using it.
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
                    </div>
                )}

            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setIsEditing(false); setEditingQuestion(null); }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-800">Edit Question</h2>
                                <button onClick={() => { setIsEditing(false); setEditingQuestion(null); }}><X size={24} className="text-slate-400" /></button>
                            </div>
                            {/* Same form as create but with handleUpdate */}
                            <form onSubmit={handleUpdate} className="p-6 space-y-4">

                                {/* Subject and Type */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Subject *</label>
                                        <select
                                            required
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value as any, chapter: '', topic: '' })}
                                            className="w-full px-4 py-2 border rounded-lg bg-white"
                                        >
                                            {subjects.map(subject => (
                                                <option key={subject} value={subject}>{subject}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Question Type *</label>
                                        <select
                                            required
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                            className="w-full px-4 py-2 border rounded-lg bg-white"
                                        >
                                            <option>MCQ</option>
                                            <option>Numerical</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Chapter, Difficulty and Exam */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Chapter *</label>
                                        <select
                                            required
                                            value={formData.chapter}
                                            onChange={e => setFormData({ ...formData, chapter: e.target.value, topic: '' })}
                                            className="w-full px-4 py-2 border rounded-lg bg-white"
                                            disabled={!formData.subject}
                                        >
                                            <option value="">Select Chapter</option>
                                            {getChaptersForSubject(formData.subject).map((ch: any) => (
                                                <option key={ch.id} value={ch.name}>{ch.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Difficulty *</label>
                                        <select
                                            required
                                            value={formData.difficulty}
                                            onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
                                            className="w-full px-4 py-2 border rounded-lg bg-white"
                                        >
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Exam Category *</label>
                                        <select
                                            required
                                            value={formData.examCategory}
                                            onChange={e => setFormData({ ...formData, examCategory: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg bg-white"
                                        >
                                            {exams.map(exam => (
                                                <option key={exam} value={exam}>{exam}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Topic, Marks and Negative Marks */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Topic *</label>
                                        <select
                                            required
                                            value={formData.topic}
                                            onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg bg-white"
                                            disabled={!formData.chapter}
                                        >
                                            <option value="">Select Topic</option>
                                            {getTopicsForChapter(formData.chapter).map((topic: string, idx: number) => (
                                                <option key={idx} value={topic}>{topic}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Marks *</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.marks}
                                            onChange={e => setFormData({ ...formData, marks: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border rounded-lg"
                                            placeholder="4"
                                            min="1"
                                            max="10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Negative Marks</label>
                                        <input
                                            type="number"
                                            value={formData.negativeMarks}
                                            onChange={e => setFormData({ ...formData, negativeMarks: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border rounded-lg"
                                            placeholder="-1"
                                            step="0.25"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Typically -1 for JEE Mains (MCQ only)</p>
                                    </div>
                                </div>

                                {/* Question Text */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Question Text *</label>
                                    <textarea
                                        required
                                        value={formData.text}
                                        onChange={e => setFormData({ ...formData, text: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg h-24 resize-none"
                                        placeholder="Enter the complete question text..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Question Text (Hindi)</label>
                                    <textarea
                                        value={formData.textHindi}
                                        onChange={e => setFormData({ ...formData, textHindi: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg h-24 resize-none"
                                        placeholder="हिंदी में प्रश्न लिखें (वैकल्पिक)"
                                    />
                                </div>

                                {/* Options (for MCQ) */}
                                {formData.type === 'MCQ' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Options *</label>
                                        <div className="space-y-2">
                                            {[0, 1, 2, 3].map((i) => (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                        {String.fromCharCode(65 + i)}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.options[i]}
                                                        onChange={e => handleOptionChange(i, e.target.value)}
                                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                                        placeholder={`Option ${i + 1}`}
                                                    />
                                                    <input
                                                        type="radio"
                                                        name="correctAnswer"
                                                        checked={formData.correctAnswer === String(i)}
                                                        onChange={() => setFormData({ ...formData, correctAnswer: String(i) })}
                                                        className="w-4 h-4"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Select the correct answer using the radio button</p>
                                    </div>
                                )}

                                {formData.type === 'MCQ' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hindi Options (Optional)</label>
                                        <div className="space-y-2">
                                            {[0, 1, 2, 3].map((i) => (
                                                <input
                                                    key={i}
                                                    type="text"
                                                    value={formData.optionsHindi[i]}
                                                    onChange={e => handleOptionHindiChange(i, e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                                    placeholder={`Option ${String.fromCharCode(65 + i)} in Hindi`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Hindi translations for the options are optional but helpful for bilingual uploads.</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Upload Question Images</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageSelect}
                                        className="w-full text-sm text-slate-500"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Add supporting images for the question. JPG/PNG files only.</p>
                                    {(imagePreviews.length > 0 || formData.imageUrls.length > 0) && (
                                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {formData.imageUrls.map((url, idx) => (
                                                <a key={`existing-image-${idx}`} href={url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                                    <img src={url} alt={`existing image ${idx + 1}`} className="h-24 w-full object-cover" />
                                                </a>
                                            ))}
                                            {imagePreviews.map((preview, idx) => (
                                                <div key={`preview-${idx}`} className="block rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                                    <img src={preview} alt={`preview ${idx + 1}`} className="h-24 w-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Correct Answer (for Numerical) */}
                                {formData.type === 'Numerical' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Correct Answer *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.correctAnswer}
                                            onChange={e => setFormData({ ...formData, correctAnswer: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg"
                                            placeholder="Enter numerical value (e.g., 9.8 or 100)"
                                        />
                                    </div>
                                )}

                                {/* Explanation (Optional) */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Explanation (Optional)</label>
                                    <textarea
                                        value={formData.explanation}
                                        onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg h-24 resize-none"
                                        placeholder="Provide a detailed solution or explanation for this question..."
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Add step-by-step solution for students</p>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> Update Question
                                </button>

                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Import CSV Modal */}
            <AnimatePresence>
                {isImporting && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setIsImporting(false); setParsedRows([]); setValidationResults(new Map()); }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Import Questions from CSV</h2>
                                    <p className="text-sm text-slate-500 mt-1">Upload a CSV file to bulk import questions</p>
                                </div>
                                <button onClick={() => { setIsImporting(false); setParsedRows([]); setValidationResults(new Map()); setMissingSubjects([]); setMissingChapters([]); setImportFile(null); }}>
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
                                                                 onClick={() => downloadTemplate('questions')}
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
                                                                     <span>questions_template.csv — Excel Grid View</span>
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
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[120px]">C</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[100px]">D</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[70px]">E</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[70px]">F</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[50px]">G</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[50px]">H</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[120px]">I</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[120px]">J</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[120px]">K</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[120px]">L</th>
                                                                             <th className="px-3 py-1 border-r border-slate-200 text-center min-w-[90px]">M</th>
                                                                             <th className="px-3 py-1 border-slate-200 text-center min-w-[200px]">N</th>
                                                                         </tr>
                                                                         {/* CSV Headers Row */}
                                                                         <tr className="bg-emerald-50/70 text-emerald-900 border-b border-slate-200 font-bold">
                                                                             <td className="px-2 py-1.5 border-r border-slate-200 bg-slate-200 text-center text-slate-500 font-sans font-medium">1</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-blue-700">text <span className="text-red-500 font-sans">*</span></td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-blue-700">subject <span className="text-red-500 font-sans">*</span></td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-blue-700">chapter <span className="text-red-500 font-sans">*</span></td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-blue-700">topic <span className="text-red-500 font-sans">*</span></td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-blue-700">type <span className="text-red-500 font-sans">*</span></td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-blue-700">difficulty <span className="text-red-500 font-sans">*</span></td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-blue-700">marks <span className="text-red-500 font-sans">*</span></td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200">negativeMarks</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200">optionA</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200">optionB</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200">optionC</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200">optionD</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-blue-700">correctAnswer <span className="text-red-500 font-sans">*</span></td>
                                                                             <td className="px-3 py-1.5">explanation</td>
                                                                         </tr>
                                                                     </thead>
                                                                     <tbody className="divide-y divide-slate-100 text-slate-700">
                                                                         {/* Row 2: Biology MCQ */}
                                                                         <tr>
                                                                             <td className="px-2 py-1.5 border-r border-slate-200 bg-slate-100 text-center text-slate-400 font-sans font-medium">2</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[150px] font-sans">The most abundant chemical in living organisms is:</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 bg-rose-50 text-rose-800 font-semibold font-sans">Biology</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans">Biomolecules</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans">Chemical Constituents</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans">Easy</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-center">4</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-center">-1</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[100px] font-sans">Water</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[100px] font-sans">Proteins</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[100px] font-sans">Carbohydrates</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[100px] font-sans">Lipids</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 bg-amber-50 text-amber-800 text-center font-bold">A</td>
                                                                             <td className="px-3 py-1.5 truncate max-w-[150px] font-sans">Water comprises 70-90% of cellular mass.</td>
                                                                         </tr>
                                                                         {/* Row 3: Chemistry MCQ */}
                                                                         <tr>
                                                                             <td className="px-2 py-1.5 border-r border-slate-200 bg-slate-100 text-center text-slate-400 font-sans font-medium">3</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[150px] font-sans">What is the atomic number of carbon?</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 bg-emerald-50 text-emerald-800 font-semibold font-sans">Chemistry</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans">Structure of Atom</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans">Atomic Models</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans">Easy</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-center">4</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-center">-1</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[100px] font-sans">4</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[100px] font-sans">6</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[100px] font-sans">8</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[100px] font-sans">12</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 bg-amber-50 text-amber-800 text-center font-bold">1</td>
                                                                             <td className="px-3 py-1.5 truncate max-w-[150px] font-sans">Carbon has atomic number 6 (6 protons).</td>
                                                                         </tr>
                                                                         {/* Row 4: Physics Numerical */}
                                                                         <tr>
                                                                             <td className="px-2 py-1.5 border-r border-slate-200 bg-slate-100 text-center text-slate-400 font-sans font-medium">4</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 truncate max-w-[150px] font-sans">A body of mass 2 kg is moving with velocity 10 m/s. Kinetic Energy in Joules is:</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 bg-blue-50 text-blue-800 font-semibold font-sans">Physics</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans">Work Energy Power</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans">Kinetic Energy</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 font-sans">Medium</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-center">4</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-center">0</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-slate-300 italic text-[10px]">Leave Blank</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-slate-300 italic text-[10px]">Leave Blank</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-slate-300 italic text-[10px]">Leave Blank</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 text-slate-300 italic text-[10px]">Leave Blank</td>
                                                                             <td className="px-3 py-1.5 border-r border-slate-200 bg-amber-50 text-amber-800 text-center font-bold font-sans">100</td>
                                                                             <td className="px-3 py-1.5 truncate max-w-[150px] font-sans">KE = 0.5 * m * v^2 = 0.5 * 2 * 100 = 100 J.</td>
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
                                                             💡 <strong>Key Notice:</strong> For MCQ type, the <code className="bg-amber-100 text-amber-900 font-bold px-1 rounded">correctAnswer</code> column supports index matching (<code>0</code> for Option A, <code>1</code> for Option B, etc.) as well as direct letter indicators (<code>A</code>, <code>B</code>, <code>C</code>, <code>D</code>) or Option names. If any subject or chapter isn't already present in your database, the system scanner will let you auto-create them right below!
                                                         </div>
                                                     </div>
                                                 ) : (
                                                     /* Grid Column Specifications View */
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                             <span className="font-bold text-blue-700 block mb-1">text</span>
                                                             <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1 inline-block">Required</span>
                                                             <p className="text-slate-600">The full question statement. Supports plain text, equations, and mathematical symbols.</p>
                                                         </div>
                                                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                             <span className="font-bold text-blue-700 block mb-1">subject</span>
                                                             <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1 inline-block">Required</span>
                                                             <p className="text-slate-600">E.g., Physics, Chemistry, Biology, etc. If the subject doesn't exist, you can create it below automatically.</p>
                                                         </div>
                                                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                             <span className="font-bold text-blue-700 block mb-1">chapter</span>
                                                             <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1 inline-block">Required</span>
                                                             <p className="text-slate-600">The chapter/category (e.g. Biomolecules). Can be automatically created on the fly during upload.</p>
                                                         </div>
                                                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                             <span className="font-bold text-blue-700 block mb-1">type</span>
                                                             <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1 inline-block">Required</span>
                                                             <p className="text-slate-600">Must be exactly <span className="font-semibold text-slate-800">MCQ</span> or <span className="font-semibold text-slate-800">Numerical</span>.</p>
                                                         </div>
                                                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                             <span className="font-bold text-blue-700 block mb-1">correctAnswer</span>
                                                             <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1 inline-block">Required</span>
                                                             <p className="text-slate-600">
                                                                 For <strong>MCQ</strong>: Supports index (<code>0</code>-<code>3</code>) OR letter (<code>A</code>-<code>D</code>) OR full option text.
                                                                 For <strong>Numerical</strong>: Supports decimal values (e.g. <code>9.8</code>).
                                                             </p>
                                                         </div>
                                                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                             <span className="font-bold text-blue-700 block mb-1">optionA - optionD</span>
                                                             <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1 inline-block">Conditional</span>
                                                             <p className="text-slate-600">Required for MCQ questions. Leave blank if type is Numerical.</p>
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
                                                         {importFile ? importFile.name : 'Choose Questions CSV file'}
                                                     </div>
                                                     <div className="text-[10px] text-slate-400">
                                                         {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : 'or drag and drop here'}
                                                     </div>
                                                 </div>
                                             </div>
                                             
                                             {/* Dynamic Elements Auto-creation Box */}
                                             {(missingSubjects.length > 0 || missingChapters.length > 0) && (
                                                 <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 shadow-sm animate-pulse-once">
                                                     <div>
                                                         <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                                                             <AlertTriangle size={16} className="text-amber-600" /> Registry Additions Detected
                                                         </h4>
                                                         <p className="text-[10px] text-amber-800 mt-1">
                                                             This CSV refers to new subjects or chapters. Select the button below to register them in the database instantly:
                                                         </p>
                                                         <div className="flex flex-wrap gap-1 mt-2">
                                                             {missingSubjects.map(sub => (
                                                                 <span key={sub} className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-bold border border-rose-200 flex items-center gap-0.5">
                                                                     Subject: {sub}
                                                                 </span>
                                                             ))}
                                                             {missingChapters.map(chap => (
                                                                 <span key={chap.name} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-bold border border-blue-200 flex items-center gap-0.5">
                                                                     Chapter: {chap.name} ({chap.subject})
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
                                        <div className="max-h-96 overflow-auto border rounded-lg">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left">Status</th>
                                                        <th className="px-3 py-2 text-left">Question</th>
                                                        <th className="px-3 py-2 text-left">Subject</th>
                                                        <th className="px-3 py-2 text-left">Chapter</th>
                                                        <th className="px-3 py-2 text-left">Type</th>
                                                        <th className="px-3 py-2 text-left">Errors</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {parsedRows.map((row, index) => {
                                                        const validation = validationResults.get(index);
                                                        const hasWarnings = validation?.warnings && validation.warnings.length > 0;
                                                        const isValid = validation?.valid;

                                                        return (
                                                            <tr key={index} className={
                                                                isValid 
                                                                    ? (hasWarnings ? 'bg-amber-50/50' : 'bg-emerald-50/50') 
                                                                    : 'bg-rose-50/50'
                                                            }>
                                                                <td className="px-3 py-2">
                                                                    {!isValid ? (
                                                                        <span className="text-rose-600 font-bold">✗</span>
                                                                    ) : hasWarnings ? (
                                                                        <span className="text-amber-600 font-bold">!</span>
                                                                    ) : (
                                                                        <span className="text-emerald-600 font-bold">✓</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 max-w-xs truncate text-slate-700">{row.text}</td>
                                                                <td className="px-3 py-2 text-slate-600">{row.subject}</td>
                                                                <td className="px-3 py-2 text-slate-600">{row.chapter}</td>
                                                                <td className="px-3 py-2 text-slate-600">{row.type}</td>
                                                                <td className="px-3 py-2 text-[10px]">
                                                                    {validation?.errors.length ? (
                                                                        <div className="text-rose-600 font-medium">
                                                                            {validation.errors.slice(0, 1).join(', ')}
                                                                            {validation.errors.length > 1 ? ` (+${validation.errors.length - 1} more)` : ''}
                                                                        </div>
                                                                    ) : null}
                                                                    {hasWarnings ? (
                                                                        <div className="text-amber-600 italic">
                                                                            {validation?.warnings?.slice(0, 1).join(', ')}
                                                                            {validation?.warnings && validation.warnings.length > 1 ? ` (+${validation.warnings.length - 1} more)` : ''}
                                                                        </div>
                                                                    ) : null}
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
                                            {isUploading ? 'Importing...' : `Import ${Array.from(validationResults.values()).filter(v => v.valid).length} Valid Questions`}
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

            {/* Individual Delete Confirmation Modal */}
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
                                    <h3 className="text-xl font-bold text-slate-800">Delete Question?</h3>
                                    <p className="text-slate-500 mt-2">
                                        Are you sure you want to delete this question? This action cannot be undone.
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

export default AdminQuestionBank;
