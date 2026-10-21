import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Save,
    FileText,
    Video,
    Link as LinkIcon,
    Upload,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Eye,
    Trash2,
    DollarSign,
    Sparkles,
    FileCheck,
    BookOpen,
    Layers,
    HelpCircle
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useExamList } from '../../hooks/useExamList';
import { uploadToCloudinary } from '../../utils/cloudinary';

const BASE_CATEGORIES = [
    'General',
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology',
    'Reasoning',
    'English Language',
    'Current Affairs & GK'
];

const AdminAddResourcePage = () => {
    const navigate = useNavigate();
    const dynamicExams = useExamList();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; size: string } | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        category: string;
        type: 'pdf' | 'video' | 'link';
        url: string;
        isFree: boolean;
        price: string;
    }>({
        title: '',
        description: '',
        category: 'Mathematics',
        type: 'pdf',
        url: '',
        isFree: true,
        price: '0'
    });

    const categories = Array.from(new Set([...BASE_CATEGORIES, ...dynamicExams]));

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

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

        // Pre-fill clean title if empty
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
            const uploadedUrl = await uploadToCloudinary(file, (percent) => setUploadProgress(percent));
            setFormData((prev) => ({ ...prev, url: uploadedUrl }));
            showToast("Document uploaded successfully to cloud!", "success");
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
            showToast("Please wait for the file upload to complete!", "error");
            return;
        }

        if (!formData.title.trim()) {
            showToast("Please enter a title for the study resource", "error");
            return;
        }

        if (!formData.url.trim()) {
            showToast(
                formData.type === 'pdf'
                    ? "Please choose a PDF document to upload or enter a PDF link"
                    : "Please provide a valid URL for the resource",
                "error"
            );
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'resources'), {
                title: formData.title.trim(),
                description: formData.description.trim() || `${formData.category} study resource: ${formData.title.trim()}`,
                category: formData.category,
                type: formData.type,
                url: formData.url.trim(),
                isFree: formData.isFree,
                price: formData.isFree ? 0 : Number(formData.price) || 0,
                status: 'pending',
                isApproved: false,
                createdAt: serverTimestamp()
            });

            showToast("Study Resource created (Pending Approval)!", "success");
            setTimeout(() => {
                navigate('/admin-dashboard/resources');
            }, 800);
        } catch (error: any) {
            console.error("Error adding resource:", error);
            showToast("Failed to add resource: " + (error.message || 'Unknown error'), "error");
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
        >
            {/* Animated Toast Alert */}
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
                    type="button"
                    onClick={() => navigate('/admin-dashboard/resources')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Resources</span>
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
                                    Add New Resource
                                </h1>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                                    <Sparkles size={11} /> Admin
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                                Upload study notes, PDFs, or add video links for students.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Fields - noValidate prevents native browser URL block */}
                <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                            Resource Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                            placeholder="e.g. Complete Mathematics Formula Handbook & Short Tricks"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                            Subject / Exam Category *
                        </label>
                        <div className="relative">
                            <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer appearance-none"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Resource Type Selection */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                            Select Resource Format *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* PDF */}
                            <label
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    formData.type === 'pdf'
                                        ? 'border-blue-600 bg-blue-50/60 text-blue-900'
                                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
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
                                        formData.type === 'pdf'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-sm">PDF / Notes</div>
                                    <p className="text-[11px] text-slate-500 truncate">Printable docs</p>
                                </div>
                                {formData.type === 'pdf' && (
                                    <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                                )}
                            </label>

                            {/* Video */}
                            <label
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    formData.type === 'video'
                                        ? 'border-rose-600 bg-rose-50/60 text-rose-900'
                                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="type"
                                    checked={formData.type === 'video'}
                                    onChange={() => setFormData({ ...formData, type: 'video' })}
                                    className="hidden"
                                />
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        formData.type === 'video'
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    <Video size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-sm">Video Lecture</div>
                                    <p className="text-[11px] text-slate-500 truncate">YouTube / Drive</p>
                                </div>
                                {formData.type === 'video' && (
                                    <CheckCircle2 size={18} className="text-rose-600 shrink-0" />
                                )}
                            </label>

                            {/* Link */}
                            <label
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    formData.type === 'link'
                                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900'
                                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="type"
                                    checked={formData.type === 'link'}
                                    onChange={() => setFormData({ ...formData, type: 'link' })}
                                    className="hidden"
                                />
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        formData.type === 'link'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    <LinkIcon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-sm">External Link</div>
                                    <p className="text-[11px] text-slate-500 truncate">Web / Article</p>
                                </div>
                                {formData.type === 'link' && (
                                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Dynamic Upload / URL Section */}
                    {formData.type === 'pdf' ? (
                        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <FileCheck size={16} className="text-blue-600" />
                                    <span>Upload PDF Document from Computer</span>
                                </label>
                                {isUploading && (
                                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5 animate-pulse">
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Uploading ({uploadProgress}%)</span>
                                    </span>
                                )}
                            </div>

                            {/* File Drag / Pick Area */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="flex flex-col items-center justify-center gap-2 p-5 bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer transition-all text-center group">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform flex items-center justify-center">
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

                                <div className="flex flex-col justify-center space-y-2 p-4 bg-white rounded-xl border border-slate-200">
                                    <label className="text-xs font-black text-slate-600 uppercase">
                                        Or Paste Direct PDF Link
                                    </label>
                                    <div className="relative">
                                        <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={formData.url.startsWith('/uploads/') ? '' : formData.url}
                                            onChange={(e) => {
                                                setFormData({ ...formData, url: e.target.value });
                                                if (e.target.value.trim()) setUploadedFileInfo(null);
                                            }}
                                            placeholder="https://... (Google Drive, Cloudinary, etc.)"
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        If file is uploaded from computer above, you can leave this link box blank.
                                    </p>
                                </div>
                            </div>

                            {/* Attached File Card */}
                            {formData.url && (
                                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                            <FileCheck size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-emerald-950 truncate max-w-[220px] sm:max-w-md">
                                                    {uploadedFileInfo?.name || formData.url}
                                                </span>
                                                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-black shrink-0">
                                                    ✓ Ready
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-emerald-700 truncate font-mono">
                                                {uploadedFileInfo?.size ? `${uploadedFileInfo.size} • ` : ''}
                                                {formData.url}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                                        <button
                                            type="button"
                                            onClick={() => window.open(formData.url, '_blank')}
                                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                                            title="Click to view/verify the uploaded PDF"
                                        >
                                            <Eye size={13} />
                                            <span>Preview PDF</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData((prev) => ({ ...prev, url: '' }));
                                                setUploadedFileInfo(null);
                                            }}
                                            className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                            title="Remove attached PDF"
                                        >
                                            <Trash2 size={13} />
                                            <span>Remove</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : formData.type === 'video' ? (
                        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-2">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <Video size={16} className="text-rose-600" />
                                <span>Video Lecture Link *</span>
                            </label>
                            <div className="relative">
                                <Video size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                                    placeholder="https://www.youtube.com/watch?v=... or Google Drive link"
                                />
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Enter a valid YouTube, Vimeo, Loom, or Google Drive video URL for students to stream.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-2">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <LinkIcon size={16} className="text-emerald-600" />
                                <span>Website / Resource URL *</span>
                            </label>
                            <div className="relative">
                                <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                    placeholder="https://..."
                                />
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Enter direct link to official portal, syllabus, or study article.
                            </p>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                            Description / Summary
                        </label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-sm resize-none"
                            placeholder="Provide brief details on what this study resource covers..."
                        />
                    </div>

                    {/* Pricing */}
                    <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                            Access & Pricing
                        </label>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={formData.isFree}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            isFree: e.target.checked,
                                            price: e.target.checked ? '0' : formData.price || '49'
                                        })
                                    }
                                    className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <div>
                                    <span className="block font-bold text-slate-800 text-sm">Free Resource</span>
                                    <span className="text-xs text-slate-400">Accessible to all registered students without payment</span>
                                </div>
                            </label>

                            {!formData.isFree && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="relative flex items-center w-full sm:w-48"
                                >
                                    <span className="absolute left-3.5 text-slate-500 font-bold text-sm">₹</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:outline-none focus:border-blue-600 shadow-sm"
                                        placeholder="Price in INR"
                                    />
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Publishing Study Resource...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Publish Study Resource</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default AdminAddResourcePage;
