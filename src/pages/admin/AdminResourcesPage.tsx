import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Trash2,
    FileText,
    Video,
    ExternalLink,
    Loader2,
    Eye,
    Download,
    CheckCircle2,
    Clock,
    Check,
    AlertCircle,
    Edit3,
    X,
    Upload
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
import { handleDownloadPYQ } from '../../utils/pyqPdfGenerator';
import { uploadToCloudinary } from '../../utils/cloudinary';

interface Resource {
    id: string;
    title: string;
    description: string;
    type: 'pdf' | 'video' | 'link';
    category: string;
    url: string;
    isFree: boolean;
    price?: number;
    isApproved?: boolean;
    status?: 'approved' | 'pending';
    createdAt: any;
}

const CATEGORIES = [
    'Mathematics',
    'Science',
    'History',
    'Geography',
    'English',
    'Computer Science',
    'General Knowledge',
    'Current Affairs',
    'Reasoning',
    'Other'
];

const AdminResourcesPage: React.FC = () => {
    const navigate = useNavigate();
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'approved' | 'pending'>('All');
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Edit Modal State
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        category: 'Mathematics',
        type: 'pdf' as 'pdf' | 'video' | 'link',
        url: '',
        isFree: true,
        price: 0,
        isApproved: false
    });
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isUploadingEditFile, setIsUploadingEditFile] = useState(false);
    const [editUploadProgress, setEditUploadProgress] = useState(0);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedResources = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Resource[];
            setResources(fetchedResources);
            setIsLoading(false);
        }, (err) => {
            console.error("Firestore resources listener error:", err);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Toggle Approval (Approve <-> Pending)
    const handleToggleApproval = async (resource: Resource) => {
        const isCurrentlyApproved = resource.isApproved === true || resource.status === 'approved';
        const newIsApproved = !isCurrentlyApproved;
        const newStatus = newIsApproved ? 'approved' : 'pending';
        setTogglingId(resource.id);
        try {
            await updateDoc(doc(db, 'resources', resource.id), {
                isApproved: newIsApproved,
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            showToast(
                newIsApproved
                    ? `✓ Approved "${resource.title}" — Live for students!`
                    : `Clock "${resource.title}" moved to Pending (Hidden from students)`,
                "success"
            );
        } catch (error: any) {
            console.error("Error updating resource approval:", error);
            showToast("Failed to update status: " + (error.message || 'Unknown error'), "error");
        } finally {
            setTogglingId(null);
        }
    };

    // Open Edit Modal
    const handleOpenEdit = (resource: Resource) => {
        setEditingResource(resource);
        setEditFormData({
            title: resource.title || '',
            description: resource.description || '',
            category: resource.category || 'Mathematics',
            type: resource.type || 'pdf',
            url: resource.url || '',
            isFree: resource.isFree ?? true,
            price: resource.price ?? 0,
            isApproved: resource.isApproved === true || resource.status === 'approved'
        });
        setEditUploadProgress(0);
    };

    // File upload inside Edit Modal
    const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingEditFile(true);
        setEditUploadProgress(15);
        try {
            const uploadedUrl = await uploadToCloudinary(file, (progress) => {
                setEditUploadProgress(Math.max(15, progress));
            });
            setEditFormData(prev => ({ ...prev, url: uploadedUrl }));
            setEditUploadProgress(100);
            showToast("New file attached successfully!", "success");
        } catch (err: any) {
            console.error("Edit file upload failed:", err);
            showToast("Upload failed: " + (err.message || 'Check connection'), "error");
        } finally {
            setIsUploadingEditFile(false);
        }
    };

    // Save edited resource
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingResource) return;
        if (!editFormData.title.trim()) {
            showToast("Please enter a resource title", "error");
            return;
        }
        if (!editFormData.url.trim()) {
            showToast("Please provide or upload a resource file/URL", "error");
            return;
        }

        setIsSavingEdit(true);
        try {
            await updateDoc(doc(db, 'resources', editingResource.id), {
                title: editFormData.title.trim(),
                description: editFormData.description.trim(),
                category: editFormData.category,
                type: editFormData.type,
                url: editFormData.url.trim(),
                isFree: editFormData.isFree,
                price: editFormData.isFree ? 0 : Number(editFormData.price) || 0,
                isApproved: editFormData.isApproved,
                status: editFormData.isApproved ? 'approved' : 'pending',
                updatedAt: serverTimestamp()
            });

            showToast("Resource updated successfully!", "success");
            setEditingResource(null);
        } catch (err: any) {
            console.error("Error saving resource edit:", err);
            showToast("Failed to save changes: " + (err.message || 'Unknown error'), "error");
        } finally {
            setIsSavingEdit(false);
        }
    };

    // Delete resource
    const handleDelete = async (id: string, title: string) => {
        if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
            try {
                await deleteDoc(doc(db, 'resources', id));
                showToast(`"${title}" deleted successfully`, "success");
            } catch (error: any) {
                console.error("Error deleting resource:", error);
                showToast("Failed to delete resource", "error");
            }
        }
    };

    const filteredResources = resources.filter(item => {
        const matchesSearch =
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase());

        const isApproved = item.isApproved === true || item.status === 'approved';
        const matchesStatus =
            statusFilter === 'All' ||
            (statusFilter === 'approved' && isApproved) ||
            (statusFilter === 'pending' && !isApproved);

        return matchesSearch && matchesStatus;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText size={20} className="text-red-500" />;
            case 'video': return <Video size={20} className="text-blue-500" />;
            default: return <ExternalLink size={20} className="text-slate-500" />;
        }
    };

    return (
        <motion.div
            className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
                                ? 'bg-slate-900/95 text-emerald-400 border-slate-700'
                                : 'bg-rose-950/95 text-rose-300 border-rose-800'
                        }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                        ) : (
                            <AlertCircle size={18} className="text-rose-400 shrink-0" />
                        )}
                        <span className="text-sm font-bold text-white">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Study Resources</h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Manage study materials, notes, and videos. <span className="font-bold text-blue-600">Students only see Approved items.</span>
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin-dashboard/resources/new')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                >
                    <Plus size={16} /> Add Resource
                </button>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Search & Status Filter Bar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search resources by title or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        />
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
                        {(['All', 'approved', 'pending'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setStatusFilter(tab)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    statusFilter === tab
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tab === 'All' ? 'All Resources' : tab === 'approved' ? 'Approved (Live)' : 'Pending (Hidden)'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/70 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Access</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <Loader2 className="animate-spin inline text-blue-600" size={24} />
                                    </td>
                                </tr>
                            ) : filteredResources.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-slate-500 text-sm">
                                        No resources found matching filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredResources.map((resource) => {
                                    const isApproved = resource.isApproved === true || resource.status === 'approved';
                                    const isToggling = togglingId === resource.id;

                                    return (
                                        <tr key={resource.id} className="hover:bg-slate-50/60 transition-colors">
                                            {/* TITLE & DESCRIPTION */}
                                            <td className="px-6 py-4 font-medium text-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                                                        {getIcon(resource.type)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm">{resource.title}</div>
                                                        <div className="text-xs text-slate-400 truncate max-w-[220px]">
                                                            {resource.description || 'No description provided'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* CATEGORY */}
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                                                    {resource.category}
                                                </span>
                                            </td>

                                            {/* TYPE */}
                                            <td className="px-6 py-4 capitalize text-xs font-semibold text-slate-600">
                                                {resource.type}
                                            </td>

                                            {/* ACCESS (Free / Paid) */}
                                            <td className="px-6 py-4">
                                                {resource.isFree ? (
                                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-black">
                                                        Free
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-black">
                                                        ₹ {resource.price || 0}
                                                    </span>
                                                )}
                                            </td>

                                            {/* STATUS (Live vs Pending) */}
                                            <td className="px-6 py-4 text-center">
                                                {isApproved ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        Live
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold">
                                                        <Clock size={11} className="text-amber-600" />
                                                        Pending
                                                    </span>
                                                )}
                                            </td>

                                            {/* ACTIONS (Approve, Edit, View, Download, Delete) */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* 1. APPROVE BUTTON */}
                                                    <button
                                                        onClick={() => handleToggleApproval(resource)}
                                                        disabled={isToggling}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 border ${
                                                            isApproved
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                                                                : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 hover:shadow-amber-500/25'
                                                        }`}
                                                        title={
                                                            isApproved
                                                                ? "Click to Mark as Pending (Hidden from Students)"
                                                                : "Click to Approve & Publish (Live for Students)"
                                                        }
                                                    >
                                                        {isToggling ? (
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
                                                        onClick={() => handleOpenEdit(resource)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
                                                        title="Edit Resource Details"
                                                    >
                                                        <Edit3 size={13} />
                                                        <span>Edit</span>
                                                    </button>

                                                    {/* 3. VIEW BUTTON */}
                                                    <button
                                                        onClick={() => window.open(resource.url, '_blank')}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-800 text-slate-700 hover:text-white border border-slate-200 hover:border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                                                        title="View / Open Resource in new tab"
                                                    >
                                                        <Eye size={13} />
                                                        <span>View</span>
                                                    </button>

                                                    {/* 4. DOWNLOAD BUTTON */}
                                                    {resource.type === 'pdf' && (
                                                        <button
                                                            onClick={() =>
                                                                handleDownloadPYQ({
                                                                    title: resource.title,
                                                                    category: resource.category,
                                                                    fileUrl: resource.url
                                                                })
                                                            }
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                                                            title="Download original uploaded PDF"
                                                        >
                                                            <Download size={13} />
                                                            <span>Download</span>
                                                        </button>
                                                    )}

                                                    {/* 5. DELETE BUTTON */}
                                                    <button
                                                        onClick={() => handleDelete(resource.id, resource.title)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
                                                        title="Delete this resource"
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

            {/* ================= EDIT RESOURCE MODAL ================= */}
            <AnimatePresence>
                {editingResource && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Edit3 size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black">Edit Study Resource</h2>
                                        <p className="text-xs text-blue-100">Update title, file, category, or approval status</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditingResource(null)}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto" noValidate>
                                {/* Title */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase text-slate-600">
                                        Resource Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editFormData.title}
                                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-colors"
                                        placeholder="e.g. Complete Trigonometry Handwritten Notes"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase text-slate-600">
                                        Description
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={editFormData.description}
                                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-colors"
                                        placeholder="Short summary of what this resource covers..."
                                    />
                                </div>

                                {/* Category & Type Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-600">
                                            Category
                                        </label>
                                        <select
                                            value={editFormData.category}
                                            onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-colors"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-600">
                                            Resource Type
                                        </label>
                                        <select
                                            value={editFormData.type}
                                            onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as any })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-colors"
                                        >
                                            <option value="pdf">PDF Document</option>
                                            <option value="video">Video</option>
                                            <option value="link">External Link / Website</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Access & Pricing */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs font-black uppercase text-slate-700">Access Pricing</div>
                                            <div className="text-xs text-slate-500">Free for all students or paid</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditFormData({ ...editFormData, isFree: true, price: 0 })}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                                    editFormData.isFree
                                                        ? 'bg-emerald-600 text-white shadow-sm'
                                                        : 'bg-white text-slate-600 border border-slate-200'
                                                }`}
                                            >
                                                Free
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditFormData({ ...editFormData, isFree: false })}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                                    !editFormData.isFree
                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                        : 'bg-white text-slate-600 border border-slate-200'
                                                }`}
                                            >
                                                Paid
                                            </button>
                                        </div>
                                    </div>

                                    {!editFormData.isFree && (
                                        <div className="space-y-1 pt-2 border-t border-slate-200">
                                            <label className="text-xs font-bold text-slate-600">Price in INR (₹)</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={editFormData.price}
                                                onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:border-blue-600 focus:outline-none"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* File Attachment / URL with Direct Upload Option */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-600 flex items-center justify-between">
                                        <span>Resource File / URL *</span>
                                        {editFormData.url && (
                                            <span className="text-emerald-600 font-bold lowercase text-[11px] truncate max-w-[200px]">
                                                Attached
                                            </span>
                                        )}
                                    </label>

                                    {/* Direct upload trigger */}
                                    <div className="flex items-center gap-3">
                                        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all border border-slate-200 shrink-0">
                                            {isUploadingEditFile ? (
                                                <Loader2 size={14} className="animate-spin text-blue-600" />
                                            ) : (
                                                <Upload size={14} />
                                            )}
                                            <span>{isUploadingEditFile ? `Uploading ${editUploadProgress}%...` : 'Upload New File'}</span>
                                            <input
                                                type="file"
                                                accept=".pdf,application/pdf"
                                                onChange={handleEditFileUpload}
                                                disabled={isUploadingEditFile}
                                                className="hidden"
                                            />
                                        </label>

                                        <input
                                            type="text"
                                            value={editFormData.url}
                                            onChange={(e) => setEditFormData({ ...editFormData, url: e.target.value })}
                                            placeholder="https://... or /uploads/..."
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Approval Status Toggle */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-black uppercase text-slate-700">Approval Status</div>
                                        <div className="text-xs text-slate-500">
                                            {editFormData.isApproved
                                                ? 'Approved — Live for all students on website & portal'
                                                : 'Pending — Hidden from students until approved'}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditFormData({ ...editFormData, isApproved: !editFormData.isApproved })}
                                        className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all border ${
                                            editFormData.isApproved
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                : 'bg-amber-500 text-white border-amber-600'
                                        }`}
                                    >
                                        {editFormData.isApproved ? '✓ Approved' : 'Clock Pending'}
                                    </button>
                                </div>

                                {/* Submit Buttons */}
                                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setEditingResource(null)}
                                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingEdit || isUploadingEditFile}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSavingEdit ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>Save Changes</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminResourcesPage;
