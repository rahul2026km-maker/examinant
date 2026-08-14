import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Copy, AlertTriangle, Loader2, X, List, Upload, Image as ImageIcon } from 'lucide-react';
import TestSeriesCard from '../../components/landing/TestSeriesCard';
import type { TestSeries } from '../../types/test.types';
import SeriesTestsDrawer from '../../components/admin/SeriesTestsDrawer';
import { storage } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
    getAllTestSeries,
    createTestSeries,
    updateTestSeries,
    deleteTestSeries,
    duplicateTestSeries
} from '../../services/testSeriesService';
import { useExamList } from '../../hooks/useExamList';
import { useAuth } from '../../contexts/AuthContext';
import { EXAM_SUBCATEGORIES } from '../../services/examService';
import { uploadToCloudinary, isCloudinaryConfigured } from '../../utils/cloudinary';

const TestSeriesManagement = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth() || {};
    const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingSeries, setEditingSeries] = useState<TestSeries | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const exams = useExamList();

    // Deletion Modal State
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isDeletingLoading, setIsDeletingLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Tests drawer state
    const [drawerSeries, setDrawerSeries] = useState<TestSeries | null>(null);
    const [cloningSeriesId, setCloningSeriesId] = useState<string | null>(null);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


    const [formData, setFormData] = useState<{
        name: string;
        examCategory: 'JEE' | 'NEET' | 'SSC' | string;
        examSubCategory: string;
        pricing: { type: 'free' | 'paid'; amount: number };
        description: string;
        status: 'draft' | 'published' | 'archived';
        thumbnailUrl: string;
    }>({
        name: '',
        examCategory: 'JEE',
        examSubCategory: '',
        pricing: { type: 'free', amount: 0 },
        description: '',
        status: 'draft',
        thumbnailUrl: ''
    });

    const [customCategory, setCustomCategory] = useState('');
    const [isCustom, setIsCustom] = useState(false);

    useEffect(() => {
        loadTestSeries();
    }, []);

    const loadTestSeries = async () => {
        setIsLoading(true);
        try {
            const data = await getAllTestSeries();
            setTestSeries(data);
        } catch (error) {
            console.error('Error loading test series:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        setIsSubmitting(true);
        try {
            const finalData = {
                ...formData,
                examCategory: isCustom ? customCategory : formData.examCategory,
                examSubCategory: EXAM_SUBCATEGORIES[isCustom ? customCategory : formData.examCategory] ? formData.examSubCategory : '',
                thumbnailUrl: formData.thumbnailUrl || ""
            };

            if (isCustom && !customCategory) {
                alert('Please enter a custom category name');
                setIsSubmitting(false);
                return;
            }

            await delay(1000); // Artificial delay
            await createTestSeries(finalData, currentUser?.uid || 'admin');
            await loadTestSeries();
            setIsCreating(false);
            resetForm();
        } catch (error) {
            console.error('Error creating test series:', error);
            alert('Failed to create test series');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingSeries) return;

        setIsSubmitting(true);
        try {
            const finalData = {
                ...formData,
                examCategory: isCustom ? customCategory : formData.examCategory,
                examSubCategory: EXAM_SUBCATEGORIES[isCustom ? customCategory : formData.examCategory] ? formData.examSubCategory : '',
                thumbnailUrl: formData.thumbnailUrl || ""
            };

            if (isCustom && !customCategory) {
                alert('Please enter a custom category name');
                setIsSubmitting(false);
                return;
            }

            await delay(1000); // Artificial delay
            await updateTestSeries(editingSeries.id, finalData);
            await loadTestSeries();
            setEditingSeries(null);
            resetForm();
        } catch (error) {
            console.error('Error updating test series:', error);
            alert('Failed to update test series');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        setIsDeletingLoading(true);
        try {
            await delay(1000); // Artificial delay
            await deleteTestSeries(id);
            await loadTestSeries();
            setConfirmDeleteId(null);
        } catch (error) {
            console.error('Error deleting test series:', error);
            alert('Failed to delete test series');
        } finally {
            setIsDeletingLoading(false);
        }
    };

    const handleDuplicate = async (series: TestSeries) => {
        setCloningSeriesId(series.id);
        try {
            await duplicateTestSeries(series.id, `${series.name} (Copy)`, currentUser?.uid || 'admin');
            alert('🎉 Test Series and all its tests cloned successfully!');
            await loadTestSeries();
        } catch (error: any) {
            console.error('Error duplicating test series:', error);
            alert('Failed to duplicate test series: ' + (error.message || error));
        } finally {
            setCloningSeriesId(null);
        }
    };

    const handleEdit = (series: TestSeries) => {
        const isPredefined = exams.includes(series.examCategory);

        setEditingSeries(series);
        setFormData({
            name: series.name,
            examCategory: isPredefined ? series.examCategory : 'Custom',
            examSubCategory: series.examSubCategory || '',
            pricing: {
                type: series.pricing.type,
                amount: series.pricing.amount || 0
            },
            description: series.description,
            status: series.status,
            thumbnailUrl: series.thumbnailUrl || ''
        });

        if (!isPredefined) {
            setCustomCategory(series.examCategory);
            setIsCustom(true);
        } else {
            setCustomCategory('');
            setIsCustom(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            examCategory: 'JEE',
            examSubCategory: '',
            pricing: { type: 'free', amount: 0 },
            description: '',
            status: 'draft',
            thumbnailUrl: ''
        });
        setCustomCategory('');
        setIsCustom(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Image size should be less than 5MB");
            return;
        }

        setIsUploadingImage(true);
        try {
            if (isCloudinaryConfigured()) {
                const downloadUrl = await uploadToCloudinary(file);
                setFormData(prev => ({ ...prev, thumbnailUrl: downloadUrl }));
                setIsUploadingImage(false);
                return;
            }

            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const imageRef = ref(storage, `test-series-thumbnails/${Date.now()}_${safeName}`);

            const uploadTask = uploadBytesResumable(imageRef, file);

            // Added a 15-second timeout since Firebase SDK will silently retry on CORS errors forever
            let isResolved = false;
            const timeoutId = setTimeout(() => {
                if (!isResolved) {
                    uploadTask.cancel();
                    alert("Upload timeout (15s). Please configure Cloudinary environment variables (VITE_CLOUDINARY_CLOUD_NAME & VITE_CLOUDINARY_UPLOAD_PRESET) in your .env file.");
                    setIsUploadingImage(false);
                }
            }, 15000);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    isResolved = true;
                    clearTimeout(timeoutId);
                    console.error('Error during upload:', error);
                    alert(`Upload failed: ${error.message}. Please configure Cloudinary in .env.`);
                    setIsUploadingImage(false);
                },
                async () => {
                    isResolved = true;
                    clearTimeout(timeoutId);
                    try {
                        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        setFormData(prev => ({ ...prev, thumbnailUrl: downloadUrl }));
                    } catch (urlError: any) {
                        console.error('Error getting URL:', urlError);
                        alert(`Failed to get image URL: ${urlError.message}`);
                    } finally {
                        setIsUploadingImage(false);
                    }
                }
            );
        } catch (error: any) {
            console.error('Error initiating upload:', error);
            alert(`Failed to initiate upload: ${error.message}`);
            setIsUploadingImage(false);
        }
    };

    const filteredSeries = testSeries.filter(series => {
        const matchesSearch = (series.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (series.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || series.examCategory === filterCategory;
        const matchesStatus = filterStatus === 'all' || series.status === filterStatus;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-slate-200/60">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Test Series Management</h1>
                    <p className="text-slate-500 mt-1 font-medium">Create and manage premium test series for your students</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end w-full">
                    <button
                        onClick={() => navigate('/admin-dashboard/create-omr-test')}
                        className="w-full sm:w-auto flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                        📄 Create OMR Test
                    </button>
                    <button
                        onClick={() => navigate('/admin-dashboard/create-test')}
                        className="w-full sm:w-auto flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm"
                    >
                        <Plus size={18} /> New Digital Test
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-full sm:w-auto flex items-center gap-2 px-6 py-2.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                        <Plus size={18} /> New Series
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search via name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-slate-700 placeholder:text-slate-400"
                    />
                </div>
                <div className="flex flex-col gap-4 sm:flex-row w-full">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer"
                    >
                        <option value="all">All Categories</option>
                        {exams.map(exam => (
                            <option key={exam} value={exam}>{exam}</option>
                        ))}
                        <option value="Custom">Custom</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Test Series Grid */}
            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 mt-4 font-medium animate-pulse">Loading amazing content...</p>
                </div>
            ) : filteredSeries.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="text-slate-300" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No test series found</h3>
                    <p className="text-slate-500 mt-1">Try adjusting filters or create a new one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-3 gap-8">
                    {filteredSeries.map((series) => (
                        <TestSeriesCard
                            key={series.id}
                            id={series.id}
                            title={series.name}
                            description={series.description}
                            features={series?.features || []}
                            originalPrice={series.pricing?.type === 'paid' ? `${(series.pricing.amount || 0) * 4}` : '0'}
                            price={series.pricing?.type === 'paid' ? `${series.pricing.amount}` : 'Free'}
                            onExplore={() => navigate(`/test-series/${series.id}`)}
                            examCategory={series.examCategory}
                            examSubCategory={series.examSubCategory}
                            testCount={series.stats?.totalTests || 0}
                            actions={
                                <div className="grid grid-cols-4 gap-2 w-full">
                                    <button
                                        onClick={() => setDrawerSeries(series)}
                                        className="flex items-center justify-center gap-1.5 py-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm col-span-1"
                                        title="View Tests"
                                    >
                                        <List size={12} /> Tests
                                    </button>
                                    <button
                                        onClick={() => handleEdit(series)}
                                        className="flex items-center justify-center gap-1.5 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm"
                                        title="Edit Series"
                                    >
                                        <Edit2 size={12} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(series)}
                                        disabled={cloningSeriesId !== null}
                                        className="flex items-center justify-center gap-1.5 py-3 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm disabled:opacity-50"
                                        title="Clone Series"
                                    >
                                        {cloningSeriesId === series.id ? (
                                            <>
                                                <Loader2 size={12} className="animate-spin" /> Cloning...
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={12} /> Clone
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setConfirmDeleteId(series.id)}
                                        className="flex items-center justify-center gap-1.5 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-red-100 shadow-sm"
                                        title="Delete Series"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            }
                        />
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {(isCreating || editingSeries) && (
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
                        onClick={() => { if (!isDeletingLoading) { setIsCreating(false); setEditingSeries(null); resetForm(); } }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl my-8 flex flex-col max-h-[85vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
                                <h2 className="text-xl font-bold text-slate-800">
                                    {editingSeries ? 'Edit Test Series' : 'Create New Test Series'}
                                </h2>
                                <button
                                    onClick={() => { setIsCreating(false); setEditingSeries(null); resetForm(); }}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Test Series Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., JEE Mains 2024 Mock Tests"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                    />
                                </div>

                                {/* Thumbnail Image */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Thumbnail Image
                                    </label>
                                    <div className="flex items-center gap-4">
                                        {formData.thumbnailUrl ? (
                                            <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-slate-200">
                                                <img src={formData.thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: '' }))}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-32 h-20 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500">
                                                <ImageIcon size={24} className="mb-1 text-slate-400" />
                                                <span className="text-[10px] font-medium">No Image</span>
                                            </div>
                                        )}

                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                id="thumbnail-upload"
                                                disabled={isUploadingImage}
                                            />
                                            <div className="flex items-center gap-3">
                                                <label
                                                    htmlFor="thumbnail-upload"
                                                    className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {isUploadingImage ? (
                                                        <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                                                    ) : (
                                                        <><Upload size={16} /> {formData.thumbnailUrl ? 'Change Image' : 'Choose Image'}</>
                                                    )}
                                                </label>

                                                {formData.thumbnailUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: '' }))}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                                                    >
                                                        <Trash2 size={16} /> Remove
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">Recommended size: 800x600px. Max size: 5MB.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Exam Category */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Examination Category *
                                    </label>
                                    <select
                                        value={formData.examCategory}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, examCategory: val as any, examSubCategory: '' });
                                            setIsCustom(val === 'Custom');
                                        }}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        {exams
                                            .filter(exam => {
                                                const subcategories = Object.values(EXAM_SUBCATEGORIES)
                                                    .flat()
                                                    .map(sub => sub.toLowerCase());
                                                return !subcategories.includes(exam.toLowerCase());
                                            })
                                            .map(exam => (
                                                <option key={exam} value={exam}>{exam}</option>
                                            ))}
                                        <option value="Custom">Custom</option>
                                    </select>
                                    {isCustom && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-3"
                                        >
                                            <input
                                                type="text"
                                                value={customCategory}
                                                onChange={(e) => setCustomCategory(e.target.value)}
                                                placeholder="Enter Category Name (e.g., UPSC, GATE)"
                                                className="w-full px-4 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50/30"
                                                autoFocus
                                            />
                                        </motion.div>
                                    )}
                                    {EXAM_SUBCATEGORIES[isCustom ? customCategory : formData.examCategory] && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-3"
                                        >
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">
                                                Examination Sub-category
                                            </label>
                                            <select
                                                value={formData.examSubCategory}
                                                onChange={(e) => setFormData({ ...formData, examSubCategory: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                                            >
                                                <option value="">Select Sub-category (Optional)</option>
                                                {EXAM_SUBCATEGORIES[isCustom ? customCategory : formData.examCategory].map(sub => (
                                                    <option key={sub} value={sub}>{sub}</option>
                                                ))}
                                            </select>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Pricing */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Pricing *
                                    </label>
                                    <div className="flex gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={formData.pricing.type === 'free'}
                                                onChange={() => setFormData({ ...formData, pricing: { type: 'free', amount: 0 } })}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="font-medium text-slate-700">Free</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={formData.pricing.type === 'paid'}
                                                onChange={() => setFormData({ ...formData, pricing: { type: 'paid', amount: 0 } })}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="font-medium text-slate-700">Paid</span>
                                        </label>
                                    </div>
                                    {formData.pricing.type === 'paid' && (
                                        <div className="mt-3 relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                            <input
                                                type="number"
                                                value={formData.pricing.amount}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    pricing: { ...formData.pricing, amount: Number(e.target.value) }
                                                })}
                                                placeholder="Enter amount"
                                                className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe this test series..."
                                        rows={6}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y shadow-sm"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 flex gap-3 bg-slate-50 rounded-b-2xl shrink-0">
                                <button
                                    type="button"
                                    onClick={() => { setIsCreating(false); setEditingSeries(null); resetForm(); }}
                                    className="flex-1 px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={editingSeries ? handleUpdate : handleCreate}
                                    disabled={isSubmitting || !formData.name || !formData.description}
                                    className="flex-1 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            {editingSeries ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : (
                                        <>
                                            {editingSeries ? <Edit2 size={18} /> : <Plus size={18} />}
                                            {editingSeries ? 'Update Series' : 'Create Series'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Delete Confirmation Modal */}
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
                                    <h3 className="text-xl font-bold text-slate-800">Delete Test Series?</h3>
                                    <p className="text-slate-500 mt-2">
                                        Are you sure you want to delete this test series? All tests associated with it will be affected. This action cannot be undone.
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

            {/* Series Tests Drawer */}
            <SeriesTestsDrawer
                isOpen={!!drawerSeries}
                seriesId={drawerSeries?.id || ''}
                seriesName={drawerSeries?.name || ''}
                onClose={() => setDrawerSeries(null)}
            />
        </motion.div>
    );
};

export default TestSeriesManagement;
