import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Trash2,
    Eye,
    Loader2,
    FileText,
    PenTool,
    CheckCircle2,
    Clock,
    Edit3,
    X,
    Check,
    Upload,
    AlertCircle,
    Save,
    RotateCcw,
    Download
} from 'lucide-react';
import { db } from '../../firebase';
import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useExamList } from '../../hooks/useExamList';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { handleViewPYQ, handleDownloadPYQ } from '../../utils/pyqPdfGenerator';

interface PYQ {
    id: string;
    title: string;
    category: string;
    year: string;
    type: 'pdf' | 'test';
    fileUrl?: string;
    testId?: string;
    price: number;
    status?: 'approved' | 'pending' | 'draft' | 'published';
    isApproved?: boolean;
    description?: string;
    createdAt?: any;
    updatedAt?: any;
}

const AdminPYQsPage = () => {
    const [pyqs, setPyqs] = useState<PYQ[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Edit Modal State
    const [editingPyq, setEditingPyq] = useState<PYQ | null>(null);
    const [editFormData, setEditFormData] = useState({
        title: '',
        category: 'SSC CGL',
        year: '2024',
        type: 'pdf' as 'pdf' | 'test',
        fileUrl: '',
        testId: '',
        price: 0,
        status: 'approved' as 'approved' | 'pending',
        description: ''
    });
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Delete Modal State
    const [deleteConfirmPyq, setDeleteConfirmPyq] = useState<PYQ | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const navigate = useNavigate();
    const exams = useExamList();

    // Toast helper
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        let isMounted = true;
        const q = collection(db, 'pyqs');

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                if (!isMounted) return;
                const fetchedPyqs: PYQ[] = snapshot.docs.map((d) => {
                    const data = d.data();
                    return {
                        id: d.id,
                        ...data,
                        title: String(data.title || data.name || data.testName || 'Untitled PYQ'),
                        category: String(data.category || data.exam || 'General'),
                        year: String(data.year || '2024'),
                        type: (data.type === 'test' ? 'test' : 'pdf') as 'pdf' | 'test',
                        price: Number(data.price) || 0,
                        status: (data.status || (data.isApproved === false ? 'pending' : 'approved')) as any,
                        isApproved: data.isApproved ?? (data.status !== 'pending' && data.status !== 'draft'),
                        createdAt: data.createdAt
                    };
                });

                // Safe client-side sort without requiring composite indexes
                fetchedPyqs.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
                    return timeB - timeA;
                });

                setPyqs(fetchedPyqs);
                setIsLoading(false);
            },
            (error) => {
                console.error("Firestore PYQ subscription error:", error);
                if (isMounted) setIsLoading(false);
            }
        );

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    // 1. APPROVE / PENDING TOGGLE
    const handleToggleApprove = async (pyq: PYQ) => {
        const currentlyApproved = pyq.status === 'approved' || pyq.isApproved === true;
        const newStatus = currentlyApproved ? 'pending' : 'approved';
        const newIsApproved = !currentlyApproved;

        setProcessingId(pyq.id);
        try {
            await updateDoc(doc(db, 'pyqs', pyq.id), {
                status: newStatus,
                isApproved: newIsApproved,
                updatedAt: serverTimestamp()
            });
            showToast(
                currentlyApproved ? `"${pyq.title}" marked as Pending` : `"${pyq.title}" Approved Successfully!`,
                'success'
            );
        } catch (err: any) {
            console.error("Error toggling approval:", err);
            showToast("Failed to update status: " + (err.message || 'Unknown error'), 'error');
        } finally {
            setProcessingId(null);
        }
    };

    // 2. OPEN EDIT MODAL
    const handleOpenEdit = (pyq: PYQ) => {
        setEditingPyq(pyq);
        setEditFormData({
            title: pyq.title || '',
            category: pyq.category || 'SSC CGL',
            year: pyq.year || new Date().getFullYear().toString(),
            type: pyq.type || 'pdf',
            fileUrl: pyq.fileUrl || '',
            testId: pyq.testId || '',
            price: pyq.price || 0,
            status: pyq.status === 'pending' ? 'pending' : 'approved',
            description: pyq.description || ''
        });
        setUploadProgress(0);
    };

    // Handle File Upload inside Edit Modal
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(10);
        try {
            const url = await uploadToCloudinary(file, (percent) => setUploadProgress(percent));
            setEditFormData((prev) => ({ ...prev, fileUrl: url }));
            showToast("New PDF uploaded successfully!", "success");
        } catch (err: any) {
            console.error("Upload error:", err);
            showToast("Upload failed: " + (err.message || "Error uploading file"), "error");
        } finally {
            setIsUploading(false);
        }
    };

    // SAVE EDITS
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPyq) return;

        if (isUploading) {
            showToast("Please wait, file upload is still in progress!", "error");
            return;
        }

        if (!editFormData.title.trim()) {
            showToast("Title is required", "error");
            return;
        }

        setIsSavingEdit(true);
        try {
            await updateDoc(doc(db, 'pyqs', editingPyq.id), {
                title: editFormData.title.trim(),
                category: editFormData.category,
                year: editFormData.year,
                type: editFormData.type,
                fileUrl: editFormData.type === 'pdf' ? editFormData.fileUrl : '',
                testId: editFormData.type === 'test' ? editFormData.testId : '',
                price: Number(editFormData.price) || 0,
                status: editFormData.status,
                isApproved: editFormData.status === 'approved',
                description: editFormData.description,
                updatedAt: serverTimestamp()
            });

            showToast("PYQ updated successfully!", "success");
            setEditingPyq(null);
        } catch (err: any) {
            console.error("Error updating PYQ:", err);
            showToast("Failed to save changes: " + (err.message || "Unknown error"), "error");
        } finally {
            setIsSavingEdit(false);
        }
    };

    // 3. EXECUTE DELETE
    const handleConfirmDelete = async () => {
        if (!deleteConfirmPyq) return;

        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'pyqs', deleteConfirmPyq.id));
            showToast(`Deleted "${deleteConfirmPyq.title}"`, "success");
            setDeleteConfirmPyq(null);
        } catch (error: any) {
            console.error("Error deleting PYQ:", error);
            showToast("Failed to delete PYQ: " + (error.message || "Unknown error"), "error");
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter list safely with useMemo
    const filteredPyqs = useMemo(() => {
        const searchLower = searchTerm.trim().toLowerCase();
        return pyqs.filter((item) => {
            const titleStr = String(item.title || '').toLowerCase();
            const catStr = String(item.category || '').toLowerCase();
            const yearStr = String(item.year || '').toLowerCase();

            const matchesSearch =
                !searchLower ||
                titleStr.includes(searchLower) ||
                catStr.includes(searchLower) ||
                yearStr.includes(searchLower);

            const matchesCategory =
                categoryFilter === 'All' || item.category === categoryFilter;

            const isApproved = item.status === 'approved' || item.isApproved === true;
            const matchesStatus =
                statusFilter === 'All' ||
                (statusFilter === 'approved' && isApproved) ||
                (statusFilter === 'pending' && !isApproved);

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [pyqs, searchTerm, categoryFilter, statusFilter]);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(pyqs.map((p) => String(p.category || '').trim()).filter(Boolean)));
        return ['All', ...cats];
    }, [pyqs]);

    return (
        <motion.div
            className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
                            toast.type === 'success'
                                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-500/10'
                                : 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-500/10'
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

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manage PYQs</h1>
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                            {pyqs.length} Total Papers
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">
                        Review, approve, edit, and organize Previous Year Question Papers.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin-dashboard/pyqs/new')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/25 active:scale-95 cursor-pointer"
                >
                    <Plus size={18} />
                    <span>Add New PYQ</span>
                </button>
            </div>

            {/* Controls & Filter Bar */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-slate-50/40">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search
                            size={18}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            placeholder="Search by title, exam category, or year..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 text-sm font-medium transition-all"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer shadow-sm"
                            title="Filter by Exam Category"
                        >
                            <option value="All">All Categories</option>
                            {categories.filter((c) => c !== 'All').map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer shadow-sm"
                            title="Filter by Approval Status"
                        >
                            <option value="All">All Statuses</option>
                            <option value="approved">Approved Only</option>
                            <option value="pending">Pending Approval</option>
                        </select>

                        {(searchTerm || categoryFilter !== 'All' || statusFilter !== 'All') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setCategoryFilter('All');
                                    setStatusFilter('All');
                                }}
                                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                title="Reset Filters"
                            >
                                <RotateCcw size={13} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-black uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-4">Title & Details</th>
                                <th className="px-4 py-4">Category</th>
                                <th className="px-3 py-4 text-center">Year</th>
                                <th className="px-3 py-4 text-center">Type</th>
                                <th className="px-4 py-4 text-center">Status</th>
                                <th className="px-4 py-4 text-center">Price</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16">
                                        <Loader2 className="animate-spin inline text-blue-600 mb-2" size={32} />
                                        <p className="text-slate-400 font-bold text-xs">Loading previous year papers...</p>
                                    </td>
                                </tr>
                            ) : filteredPyqs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-slate-400 space-y-2">
                                        <FileText size={40} className="mx-auto text-slate-300" />
                                        <p className="font-bold text-slate-600">No PYQs found matching your filters.</p>
                                        <p className="text-xs text-slate-400">Try adjusting your search terms or add a new PYQ.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPyqs.map((pyq) => {
                                    const isApproved = pyq.status === 'approved' || pyq.isApproved === true;
                                    const isProcessing = processingId === pyq.id;

                                    return (
                                        <tr key={pyq.id} className="hover:bg-slate-50/70 transition-colors group">
                                            {/* Title & Document Icon */}
                                            <td className="px-5 py-4 max-w-xs md:max-w-sm">
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                                                        pyq.type === 'test'
                                                            ? 'bg-purple-50 text-purple-600 border border-purple-200'
                                                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                                                    }`}>
                                                        {pyq.type === 'test' ? <PenTool size={16} /> : <FileText size={16} />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                                                            {pyq.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                                            <span>{pyq.type === 'test' ? 'Online Interactive Test' : 'Official PDF Paper'}</span>
                                                            {pyq.fileUrl && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-emerald-600 font-bold">PDF Attached</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                                                    {pyq.category}
                                                </span>
                                            </td>

                                            {/* Year */}
                                            <td className="px-3 py-4 whitespace-nowrap text-center">
                                                <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100">
                                                    {pyq.year || '2024'}
                                                </span>
                                            </td>

                                            {/* Type */}
                                            <td className="px-3 py-4 whitespace-nowrap text-center">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                                                        pyq.type === 'test'
                                                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                    }`}
                                                >
                                                    {pyq.type === 'test' ? 'Test' : 'PDF'}
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                {isApproved ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Approved
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-300">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                        Pending
                                                    </span>
                                                )}
                                            </td>

                                            {/* Price */}
                                            <td className="px-4 py-4 whitespace-nowrap text-center font-bold">
                                                {pyq.price === 0 ? (
                                                    <span className="text-emerald-600 font-extrabold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                        FREE
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-700 font-black text-xs">
                                                        ₹{pyq.price}
                                                    </span>
                                                )}
                                            </td>

                                            {/* ACTIONS BUTTONS GROUP (Approve, Edit, View, Delete) */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* 1. APPROVE BUTTON */}
                                                    <button
                                                        onClick={() => handleToggleApprove(pyq)}
                                                        disabled={isProcessing}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 border ${
                                                            isApproved
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                                                                : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 hover:shadow-amber-500/25'
                                                        }`}
                                                        title={isApproved ? "Click to Mark as Pending" : "Click to Approve Paper"}
                                                    >
                                                        {isProcessing ? (
                                                            <Loader2 size={13} className="animate-spin" />
                                                        ) : isApproved ? (
                                                            <CheckCircle2 size={13} className="text-emerald-600" />
                                                        ) : (
                                                            <Check size={13} />
                                                        )}
                                                        <span>{isApproved ? 'Approved' : 'Approve'}</span>
                                                    </button>

                                                    {/* 2. EDIT BUTTON */}
                                                    <button
                                                        onClick={() => handleOpenEdit(pyq)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
                                                        title="Edit PYQ Paper Details"
                                                    >
                                                        <Edit3 size={13} />
                                                        <span>Edit</span>
                                                    </button>

                                                    {/* 3. VIEW BUTTON */}
                                                    <button
                                                        onClick={() => handleViewPYQ(pyq)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-800 text-slate-700 hover:text-white border border-slate-200 hover:border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                                                        title="View / Preview PDF Paper in browser"
                                                    >
                                                        <Eye size={13} />
                                                        <span>View</span>
                                                    </button>

                                                    {/* 4. DOWNLOAD BUTTON */}
                                                    {pyq.type === 'pdf' && (
                                                        <button
                                                            onClick={() => handleDownloadPYQ(pyq)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                                                            title="Download exact uploaded PDF"
                                                        >
                                                            <Download size={13} />
                                                            <span>Download</span>
                                                        </button>
                                                    )}

                                                    {/* 5. DELETE BUTTON */}
                                                    <button
                                                        onClick={() => setDeleteConfirmPyq(pyq)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
                                                        title="Delete this PYQ"
                                                    >
                                                        <Trash2 size={13} />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ================= EDIT PYQ MODAL ================= */}
            <AnimatePresence>
                {editingPyq && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Edit3 size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black">Edit PYQ Paper</h2>
                                        <p className="text-xs text-blue-100">Update paper title, category, file, or approval status</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditingPyq(null)}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                                {/* Title */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase text-slate-600">
                                        Paper Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editFormData.title}
                                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                        placeholder="e.g. SSC CGL 2024 Tier 1 General Awareness Official Paper"
                                    />
                                </div>

                                {/* Category & Year Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-600">
                                            Exam Category *
                                        </label>
                                        <select
                                            value={editFormData.category}
                                            onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                                        >
                                            {exams.map((exam) => (
                                                <option key={exam} value={exam}>
                                                    {exam}
                                                </option>
                                            ))}
                                            <option value="General">General</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-600">
                                            Exam Year *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={editFormData.year}
                                            onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                                            placeholder="e.g. 2024"
                                        />
                                    </div>
                                </div>

                                {/* Type, Status, Price Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-600">
                                            Paper Type
                                        </label>
                                        <select
                                            value={editFormData.type}
                                            onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as any })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm cursor-pointer"
                                        >
                                            <option value="pdf">Official PDF Paper</option>
                                            <option value="test">Interactive Online Test</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-600">
                                            Approval Status
                                        </label>
                                        <select
                                            value={editFormData.status}
                                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm cursor-pointer"
                                        >
                                            <option value="approved">Approved (Live)</option>
                                            <option value="pending">Pending (Hidden)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-600">
                                            Price (₹)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={editFormData.price}
                                            onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                                            placeholder="0 for Free"
                                        />
                                    </div>
                                </div>

                                {/* PDF File Upload & URL */}
                                {editFormData.type === 'pdf' ? (
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                                                <FileText size={15} className="text-blue-600" />
                                                <span>PDF Document Link / Upload</span>
                                            </label>
                                            {isUploading && (
                                                <span className="text-xs font-bold text-blue-600 flex items-center gap-1 animate-pulse">
                                                    <Loader2 size={13} className="animate-spin" /> Uploading ({uploadProgress}%)
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={editFormData.fileUrl}
                                                onChange={(e) => setEditFormData({ ...editFormData, fileUrl: e.target.value })}
                                                placeholder="https://... (Cloudinary, Firebase, or external PDF link)"
                                                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                            />
                                            <label className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0">
                                                <Upload size={14} />
                                                <span>Upload File</span>
                                                <input
                                                    type="file"
                                                    accept=".pdf,application/pdf"
                                                    onChange={handleFileUpload}
                                                    disabled={isUploading}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        {editFormData.fileUrl && (
                                            <div className="flex items-center justify-between gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <Check size={14} className="text-emerald-600 shrink-0" />
                                                    <span className="truncate font-mono text-[11px]">{editFormData.fileUrl}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewPYQ({ title: editFormData.title, category: editFormData.category, fileUrl: editFormData.fileUrl })}
                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                                                >
                                                    <Eye size={12} />
                                                    <span>Preview</span>
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-[11px] text-slate-400">
                                            The uploaded PDF will be opened directly when clicking View, and downloaded when clicking Download.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-600">
                                            Linked Interactive Test ID
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.testId}
                                            onChange={(e) => setEditFormData({ ...editFormData, testId: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                                            placeholder="e.g. testSeriesDocId"
                                        />
                                    </div>
                                )}

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase text-slate-600">
                                        Description & Summary
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={editFormData.description}
                                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                        placeholder="Brief overview of shift, syllabus topics covered, and question paper details..."
                                    />
                                </div>

                                {/* Modal Actions */}
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditingPyq(null)}
                                        className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 text-xs transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingEdit || isUploading}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {isSavingEdit ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                <span>Saving Changes...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save size={14} />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ================= DELETE CONFIRMATION MODAL ================= */}
            <AnimatePresence>
                {deleteConfirmPyq && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                                <Trash2 size={24} />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-slate-900">Delete Question Paper?</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Are you sure you want to permanently delete{' '}
                                    <strong className="text-slate-800 font-bold">"{deleteConfirmPyq.title}"</strong>?
                                    This action cannot be undone.
                                </p>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setDeleteConfirmPyq(null)}
                                    disabled={isDeleting}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 text-xs transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all shadow-lg shadow-rose-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={13} />
                                            <span>Delete Paper</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminPYQsPage;
