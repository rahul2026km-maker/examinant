import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Save,
    Link as LinkIcon,
    PenTool,
    Loader2,
    Upload,
    FileText,
    Calendar,
    BookOpen,
    CheckCircle2,
    AlertCircle,
    Check,
    DollarSign,
    Sparkles,
    FileCheck,
    Eye,
    Trash2
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, query, getDocs } from 'firebase/firestore';
import { useExamList } from '../../hooks/useExamList';
import { uploadToCloudinary } from '../../utils/cloudinary';

const AdminAddPYQPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; size: string } | null>(null);
    const [tests, setTests] = useState<{ id: string; title: string }[]>([]);
    const [isLoadingTests, setIsLoadingTests] = useState(true);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const exams = useExamList();

    const [formData, setFormData] = useState<{
        title: string;
        category: string;
        year: string;
        type: 'pdf' | 'test';
        fileUrl: string;
        testId: string;
        price: string;
        description: string;
        status: 'approved' | 'pending';
    }>({
        title: '',
        category: 'SSC CGL',
        year: new Date().getFullYear().toString(),
        type: 'pdf',
        fileUrl: '',
        testId: '',
        price: '0',
        description: '',
        status: 'approved'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const q = query(collection(db, 'testSeries'));
                const snapshot = await getDocs(q);
                const fetchedTests = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    const displayTitle = data.title || data.name || data.testName || `Test ID: ${doc.id}`;
                    return {
                        id: doc.id,
                        title: displayTitle
                    };
                });
                setTests(fetchedTests);
            } catch (error: any) {
                console.error("Error fetching tests:", error);
            } finally {
                setIsLoadingTests(false);
            }
        };

        fetchTests();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const sizeFormatted = file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
            : `${Math.round(file.size / 1024)} KB`;

        setUploadedFileInfo({
            name: file.name,
            size: sizeFormatted
        });

        // If title is empty, smartly suggest clean title from uploaded file name
        if (!formData.title.trim()) {
            const cleanName = file.name
                .replace(/\.[^/.]+$/, '')
                .replace(/[-_]/g, ' ')
                .trim();
            setFormData((prev) => ({ ...prev, title: cleanName }));
        }

        setIsUploading(true);
        setUploadProgress(10);
        try {
            const url = await uploadToCloudinary(file, (percent) => setUploadProgress(percent));
            setFormData((prev) => ({ ...prev, fileUrl: url }));
            showToast("PDF file uploaded successfully!", "success");
        } catch (err: any) {
            console.error("Upload error:", err);
            showToast("Upload failed: " + (err.message || 'Error uploading file'), "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isUploading) {
            showToast("Please wait, file upload is still in progress!", "error");
            return;
        }

        if (!formData.title.trim()) {
            showToast("Please provide a paper title", "error");
            return;
        }

        if (formData.type === 'pdf' && !formData.fileUrl.trim()) {
            showToast("Please upload a PDF document or paste a direct PDF link", "error");
            return;
        }

        if (formData.type === 'test' && !formData.testId) {
            showToast("Please select an interactive test to link", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const pyqData: any = {
                title: formData.title.trim(),
                category: formData.category,
                year: formData.year,
                type: formData.type,
                price: Number(formData.price) || 0,
                status: formData.status,
                isApproved: formData.status === 'approved',
                description:
                    formData.description.trim() ||
                    `Official Previous Year Question paper for ${formData.title} containing authentic questions with step-by-step solutions, answer keys, and exam insights.`,
                createdAt: serverTimestamp()
            };

            if (formData.type === 'pdf') {
                pyqData.fileUrl = formData.fileUrl.trim();
            } else {
                pyqData.testId = formData.testId;
            }

            await addDoc(collection(db, 'pyqs'), pyqData);
            showToast("PYQ published successfully!", "success");
            setTimeout(() => {
                navigate('/admin-dashboard/pyqs');
            }, 800);
        } catch (error: any) {
            console.error("Error creating PYQ:", error);
            showToast("Failed to create PYQ: " + (error.message || 'Unknown error'), "error");
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
        >
            {/* Toast Alert */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-md border flex items-center gap-3 backdrop-blur-md ${
                            toast.type === 'success'
                                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
                                : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
                        }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                        ) : (
                            <AlertCircle size={18} className="text-rose-400 shrink-0" />
                        )}
                        <span className="text-sm font-bold">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Back Navigation Button */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/admin-dashboard/pyqs')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    <span>Back to PYQ Papers</span>
                </button>
            </div>

            {/* Main Form Container with Normal, Clean Shadow */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header Banner */}
                <div className="p-6 sm:p-7 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <BookOpen size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    Add New PYQ Paper
                                </h1>
                                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                    <Sparkles size={11} /> Official Exam Paper
                                </span>
                            </div>
                            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                                Upload and publish Previous Year Questions, answer keys, and solutions for students.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Fields - noValidate prevents native browser URL block */}
                <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-6">
                    {/* Section 1: Basic Paper Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                                Paper Title <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 text-sm font-semibold transition-all shadow-sm"
                                    placeholder="e.g. SSC CGL 2024 Tier 1 General Awareness Official Paper"
                                />
                            </div>
                        </div>

                        {/* Category & Year */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                                    Exam Category <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer shadow-sm appearance-none"
                                    >
                                        {exams.map((exam) => (
                                            <option key={exam} value={exam}>
                                                {exam}
                                            </option>
                                        ))}
                                        <option value="General">General</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                                    Exam Year <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min="2000"
                                        max="2030"
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
                                        placeholder="e.g. 2024"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                                Description / Paper Summary
                            </label>
                            <textarea
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
                                placeholder="e.g. Official Previous Year Question paper containing authentic questions with step-by-step solutions, answer keys, and exam insights."
                            />
                        </div>
                    </div>

                    {/* Section 2: Resource Type Selection */}
                    <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                            Select Resource Format
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label
                                className={`flex items-center gap-3.5 p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                                    formData.type === 'pdf'
                                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 text-blue-900'
                                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="type"
                                    checked={formData.type === 'pdf'}
                                    onChange={() => setFormData({ ...formData, type: 'pdf' })}
                                    className="hidden"
                                />
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        formData.type === 'pdf' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-black text-sm">Official PDF Paper</div>
                                    <p className="text-[11px] text-slate-500">
                                        Printable & downloadable authentic question paper
                                    </p>
                                </div>
                                {formData.type === 'pdf' && (
                                    <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                                )}
                            </label>

                            <label
                                className={`flex items-center gap-3.5 p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                                    formData.type === 'test'
                                        ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 text-purple-900'
                                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="type"
                                    checked={formData.type === 'test'}
                                    onChange={() => setFormData({ ...formData, type: 'test' })}
                                    className="hidden"
                                />
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        formData.type === 'test'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    <PenTool size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-black text-sm">Interactive Online Test</div>
                                    <p className="text-[11px] text-slate-500">
                                        Timed mock exam with instant computer evaluation
                                    </p>
                                </div>
                                {formData.type === 'test' && (
                                    <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Section 3: File Upload or Test Link */}
                    {formData.type === 'pdf' ? (
                        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <FileCheck size={16} className="text-blue-600" />
                                    <span>Upload PDF Document</span>
                                </label>
                                {isUploading && (
                                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5 animate-pulse">
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Uploading to Cloud ({uploadProgress}%)</span>
                                    </span>
                                )}
                            </div>

                            {/* Upload Area */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="flex flex-col items-center justify-center gap-2 p-5 bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer transition-all text-center group shadow-sm">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform flex items-center justify-center">
                                        <Upload size={20} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-black text-slate-800 block">
                                            Choose PDF File from Computer
                                        </span>
                                        <span className="text-[11px] text-slate-400">PDF documents up to 50MB</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                        className="hidden"
                                    />
                                </label>

                                <div className="flex flex-col justify-center space-y-2 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <label className="text-xs font-black text-slate-600 uppercase">
                                        Or Paste Direct PDF Link
                                    </label>
                                    <div className="relative">
                                        <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="url"
                                            value={formData.fileUrl}
                                            onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                                            placeholder="https://..."
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        Uploaded PDF documents are saved securely to cloud storage and can be viewed or downloaded directly.
                                    </p>
                                </div>
                            </div>

                            {formData.fileUrl && (
                                <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                            <FileCheck size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-emerald-950 truncate max-w-[240px] sm:max-w-md">
                                                    {uploadedFileInfo?.name || 'Attached PDF Document'}
                                                </span>
                                                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-black shrink-0">
                                                    ✓ Ready
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-emerald-700 truncate">
                                                {uploadedFileInfo?.size ? `${uploadedFileInfo.size} • ` : ''}
                                                <span className="font-mono text-[10px] text-emerald-800 underline truncate">
                                                    {formData.fileUrl}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                                        <button
                                            type="button"
                                            onClick={() => window.open(formData.fileUrl, '_blank')}
                                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                                            title="Click to view/verify the uploaded PDF"
                                        >
                                            <Eye size={14} />
                                            <span>Preview PDF</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, fileUrl: '' }));
                                                setUploadedFileInfo(null);
                                            }}
                                            className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                            title="Remove attached PDF"
                                        >
                                            <Trash2 size={13} />
                                            <span>Remove</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                                Select Test to Link ({tests.length} available)
                            </label>
                            {isLoadingTests ? (
                                <div className="flex items-center gap-2 text-slate-500 py-3 pl-4 border border-slate-200 rounded-xl bg-white text-xs font-bold shadow-sm">
                                    <Loader2 className="animate-spin text-blue-600" size={16} /> Loading available tests...
                                </div>
                            ) : (
                                <div className="relative">
                                    <PenTool size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        required
                                        value={formData.testId}
                                        onChange={(e) => setFormData({ ...formData, testId: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all appearance-none cursor-pointer shadow-sm"
                                    >
                                        <option value="">-- Select an Interactive Test --</option>
                                        {tests.map((test) => (
                                            <option key={test.id} value={test.id}>
                                                {test.title}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Section 4: Publishing Status & Pricing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* Approval Status */}
                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                                Initial Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer shadow-sm"
                            >
                                <option value="approved">Approved (Instantly Live for Students)</option>
                                <option value="pending">Pending Review (Draft)</option>
                            </select>
                        </div>

                        {/* Pricing */}
                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                                Access Pricing
                            </label>
                            <div className="flex items-center gap-3">
                                <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-sm text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.price === '0'}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.checked ? '0' : '' })}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span>Free</span>
                                </label>

                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">
                                        ₹
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        disabled={formData.price === '0'}
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl disabled:bg-slate-100 disabled:text-slate-400 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-sm"
                                        placeholder="Enter Price"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/admin-dashboard/pyqs')}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Publishing PYQ Paper...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Publish PYQ Paper</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default AdminAddPYQPage;
