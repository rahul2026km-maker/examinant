import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Radio, Search, Edit2, Trash2, Loader2, Sparkles, 
    Calendar, Clock, User, ExternalLink, Video, CheckCircle2, 
    AlertCircle, Upload, Play, Tv, Eye, Layers
} from 'lucide-react';
import { liveClassService } from '../../services/liveClassService';
import type { LiveClass, LiveClassFormData } from '../../types/liveClass.types';
import { courseService } from '../../services/courseService';
import type { Course, CourseModule } from '../../types/course.types';
import { curriculumService } from '../../services/curriculumService';
import { useExamList } from '../../hooks/useExamList';
import { useSubjectList } from '../../hooks/useSubjectList';
import { uploadToCloudinary } from '../../utils/cloudinary';

const CATEGORY_SUBJECTS: Record<string, string[]> = {
    'CUET UG': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'General Test', 'English', 'Hindi', 'Economics', 'Accountancy', 'Business Studies', 'History', 'Political Science', 'Geography'],
    'JEE': ['Physics', 'Chemistry', 'Mathematics'],
    'NEET': ['Physics', 'Chemistry', 'Biology', 'Botany', 'Zoology'],
    'SSC': ['Quantitative Aptitude', 'Reasoning Ability', 'English Comprehension', 'General Awareness / GK', 'Current Affairs'],
    'Banking': ['Quantitative Aptitude', 'Reasoning Ability', 'English Language', 'General & Banking Awareness', 'Computer Aptitude'],
    'Railways': ['Mathematics', 'General Intelligence & Reasoning', 'General Science', 'General Awareness'],
    'Defence exams': ['Mathematics', 'General Ability Test (GAT)', 'English', 'General Science', 'General Knowledge'],
    'Teaching exams': ['Child Development & Pedagogy', 'Mathematics', 'Environmental Studies (EVS)', 'Social Studies', 'Science', 'English', 'Hindi'],
    'State govt. Exam': ['General Hindi', 'General Knowledge / GS', 'Reasoning Ability', 'Numerical Aptitude', 'State Special GK'],
    'State PCS': ['General Studies Paper 1', 'CSAT / Paper 2', 'Indian Polity & Governance', 'History & Culture', 'Geography', 'Economy', 'General Hindi', 'Essay'],
    'Boards': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Science', 'Science'],
    'Engineering entrance': ['Physics', 'Chemistry', 'Mathematics'],
    'Medical entrance': ['Physics', 'Chemistry', 'Biology']
};

const DEFAULT_EDUCATORS = [
    'Sudhanshu Sir',
    'Raj Sir',
    'Amit Sir',
    'Neha Ma\'am',
    'Vikram Sir',
    'Dr. Priya Rao',
    'Examinant Expert Team'
];

const AdminLiveClassesPage = () => {
    const navigate = useNavigate();
    const exams = useExamList();
    const systemSubjects = useSubjectList();

    const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [examFilter, setExamFilter] = useState<string>('All');
    const [batchFilter, setBatchFilter] = useState<string>('All');
    const [batches, setBatches] = useState<Course[]>([]);

    // Batch curriculum modules & educator selection state
    const [batchModules, setBatchModules] = useState<CourseModule[]>([]);
    const [isLoadingModules, setIsLoadingModules] = useState<boolean>(false);
    const [isCustomSubject, setIsCustomSubject] = useState<boolean>(false);
    const [isCustomEducator, setIsCustomEducator] = useState<boolean>(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isUploadingThumb, setIsUploadingThumb] = useState<boolean>(false);

    // Form data
    const [formData, setFormData] = useState<LiveClassFormData>({
        title: '',
        description: '',
        educatorName: 'Sudhanshu Sir',
        subject: 'Mathematics',
        examCategory: 'SSC',
        batchId: '',
        batchName: '',
        scheduledStartTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // 1 hr from now formatted for datetime-local
        durationMinutes: 60,
        streamUrl: '',
        streamProvider: 'youtube',
        thumbnailUrl: '',
        status: 'upcoming',
        recordingUrl: ''
    });

    useEffect(() => {
        const unsubscribe = liveClassService.subscribeToLiveClasses((data) => {
            setLiveClasses(data);
            setIsLoading(false);
        });

        // Load all batches/courses for selection
        const loadBatches = async () => {
            try {
                const list = await courseService.getAllAdminCourses();
                setBatches(list);
            } catch (err) {
                console.error("Error loading batches for live classes:", err);
            }
        };
        loadBatches();

        return () => unsubscribe();
    }, []);

    // Distinct educators across batches, past live classes, and defaults
    const allEducators = Array.from(new Set([
        ...batches.map(b => b.instructor?.name?.trim()).filter(Boolean),
        ...liveClasses.map(c => c.educatorName?.trim()).filter(Boolean),
        ...DEFAULT_EDUCATORS
    ])).filter(Boolean) as string[];

    // Currently selected batch & assigned instructor
    const selectedBatch = batches.find(b => b.id === formData.batchId);
    const selectedBatchInstructor = selectedBatch?.instructor?.name?.trim();

    // Other educators excluding the batch instructor
    const otherEducators = allEducators.filter(name => name !== selectedBatchInstructor);

    // Current category subjects
    const categorySubjects = CATEGORY_SUBJECTS[formData.examCategory] || [];

    const handleBatchChange = async (selectedId: string) => {
        const batch = batches.find(b => b.id === selectedId);
        const batchEducator = batch?.instructor?.name?.trim();
        const nextExamCat = batch?.examCategory || formData.examCategory;

        // Auto-assign batch educator if available and update form state
        setFormData(p => ({
            ...p,
            batchId: selectedId,
            batchName: batch ? batch.title : '',
            examCategory: nextExamCat,
            educatorName: batchEducator || p.educatorName
        }));

        if (selectedId) {
            setIsLoadingModules(true);
            try {
                const mods = await curriculumService.getCourseModules(selectedId);
                setBatchModules(mods);
                // If batch has modules, auto-select the first module as subject
                if (mods.length > 0) {
                    setFormData(p => ({ ...p, subject: mods[0].title }));
                    setIsCustomSubject(false);
                } else {
                    const catSubs = CATEGORY_SUBJECTS[nextExamCat] || [];
                    if (catSubs.length > 0) {
                        setFormData(p => ({ ...p, subject: catSubs[0] }));
                    }
                }
            } catch (err) {
                console.error("Error fetching batch modules:", err);
                setBatchModules([]);
            } finally {
                setIsLoadingModules(false);
            }
        } else {
            setBatchModules([]);
        }
    };

    const handleExamCategoryChange = (cat: string) => {
        setFormData(p => {
            const catSubs = CATEGORY_SUBJECTS[cat] || [];
            return {
                ...p,
                examCategory: cat,
                subject: (batchModules.length === 0 && catSubs.length > 0 && !isCustomSubject) ? catSubs[0] : p.subject
            };
        });
    };

    const handleOpenCreateModal = () => {
        setEditingId(null);
        setBatchModules([]);
        setIsCustomSubject(false);
        setIsCustomEducator(false);
        const defaultCat = exams[0] || 'CUET UG';
        const defaultSubs = CATEGORY_SUBJECTS[defaultCat] || ['Mathematics'];
        setFormData({
            title: '',
            description: '',
            educatorName: 'Sudhanshu Sir',
            subject: defaultSubs[0] || 'Mathematics',
            examCategory: defaultCat,
            batchId: '',
            batchName: '',
            scheduledStartTime: new Date(Date.now() + 1800000).toISOString().slice(0, 16),
            durationMinutes: 60,
            streamUrl: '',
            streamProvider: 'youtube',
            thumbnailUrl: '',
            status: 'upcoming',
            recordingUrl: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = async (item: LiveClass) => {
        setEditingId(item.id);
        setIsCustomSubject(false);
        setIsCustomEducator(false);
        const startTimeStr = item.scheduledStartTime ? new Date(item.scheduledStartTime).toISOString().slice(0, 16) : '';
        setFormData({
            title: item.title,
            description: item.description || '',
            educatorName: item.educatorName,
            subject: item.subject,
            examCategory: item.examCategory,
            batchId: item.batchId || '',
            batchName: item.batchName || '',
            scheduledStartTime: startTimeStr,
            durationMinutes: item.durationMinutes,
            streamUrl: item.streamUrl,
            streamProvider: item.streamProvider,
            thumbnailUrl: item.thumbnailUrl || '',
            status: (item.status === 'cancelled' ? 'upcoming' : item.status) as 'completed' | 'live' | 'upcoming',
            recordingUrl: item.recordingUrl || ''
        });

        if (item.batchId) {
            setIsLoadingModules(true);
            try {
                const mods = await curriculumService.getCourseModules(item.batchId);
                setBatchModules(mods);
            } catch (err) {
                console.error("Error loading batch modules for edit:", err);
                setBatchModules([]);
            } finally {
                setIsLoadingModules(false);
            }
        } else {
            setBatchModules([]);
        }

        setIsModalOpen(true);
    };

    const handleThumbnailUpload = async (file: File) => {
        setIsUploadingThumb(true);
        try {
            const url = await uploadToCloudinary(file, undefined, 'image');
            setFormData(prev => ({ ...prev, thumbnailUrl: url }));
        } catch (error) {
            alert("Failed to upload thumbnail.");
        } finally {
            setIsUploadingThumb(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.streamUrl.trim()) {
            alert("Please provide class title and stream URL.");
            return;
        }

        setIsSaving(true);
        try {
            const payload: LiveClassFormData = {
                ...formData,
                scheduledStartTime: new Date(formData.scheduledStartTime).toISOString()
            };

            if (editingId) {
                await liveClassService.updateLiveClass(editingId, payload);
            } else {
                await liveClassService.createLiveClass(payload);
            }
            setIsModalOpen(false);
            setEditingId(null);
        } catch (error) {
            console.error("Failed to save live class:", error);
            alert("Error saving live class session.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (item: LiveClass) => {
        try {
            const nextStatus: LiveClass['status'] = item.status === 'live' ? 'completed' : 'live';
            const confirmMsg = item.status === 'live' 
                ? "Are you sure you want to end this live session?" 
                : "Do you want to switch this session to LIVE NOW?";
            if (!window.confirm(confirmMsg)) return;

            await liveClassService.setLiveClassStatus(item.id, nextStatus);
        } catch (error) {
            alert("Failed to update status.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this live class?")) return;
        try {
            await liveClassService.deleteLiveClass(id);
        } catch (error) {
            alert("Failed to delete live class.");
        }
    };

    // Filter list
    const filteredList = liveClasses.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.educatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (c.batchName && c.batchName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
        const matchesExam = examFilter === 'All' || c.examCategory === examFilter;
        const matchesBatch = batchFilter === 'All' || c.batchId === batchFilter;
        return matchesSearch && matchesStatus && matchesExam && matchesBatch;
    });

    const activeLiveSession = liveClasses.find(c => c.status === 'live');

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 text-rose-600 mb-1">
                        <Sparkles size={18} className="fill-rose-600" />
                        <span className="text-xs font-black uppercase tracking-widest">Streaming & Live LMS</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Live Classes Hub</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Schedule interactive live lectures, broadcast video feeds, and manage classroom sessions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <Radio size={18} />
                        <span>Schedule Live Class</span>
                    </button>
                </div>
            </div>

            {/* Active Live Broadcast Banner (If Live) */}
            {activeLiveSession && (
                <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl border border-rose-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-3 z-10 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <span className="bg-rose-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse shadow-md">
                                <Radio size={14} /> Broadcasting Live
                            </span>
                            <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full">
                                {activeLiveSession.examCategory} • {activeLiveSession.subject}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black">{activeLiveSession.title}</h2>
                        <p className="text-xs text-slate-300 font-medium">Educator: {activeLiveSession.educatorName} | Stream: {activeLiveSession.streamProvider}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 z-10">
                        <a
                            href={activeLiveSession.streamUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all border border-white/10"
                        >
                            <ExternalLink size={16} />
                            <span>Preview Stream</span>
                        </a>
                        <button
                            onClick={() => handleToggleStatus(activeLiveSession)}
                            className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
                        >
                            <CheckCircle2 size={16} />
                            <span>End Live Session</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search live classes by title, educator, subject..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-slate-800 text-sm font-medium transition-all"
                    />
                </div>
                <div className="flex flex-wrap sm:flex-nowrap gap-3">
                    <select
                        value={batchFilter}
                        onChange={(e) => setBatchFilter(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm cursor-pointer max-w-[200px]"
                        title="Filter by batch"
                    >
                        <option value="All">All Batches</option>
                        {batches.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.title}
                            </option>
                        ))}
                    </select>

                    <select
                        value={examFilter}
                        onChange={(e) => setExamFilter(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm cursor-pointer"
                    >
                        <option value="All">All Exams</option>
                        {exams.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        <option value="live">Live Now</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Live Classes Table */}
            {isLoading ? (
                <div className="flex justify-center py-20 bg-white rounded-3xl border border-slate-100">
                    <Loader2 className="animate-spin text-rose-600" size={40} />
                </div>
            ) : filteredList.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 space-y-4">
                    <Radio size={48} className="mx-auto text-slate-300" />
                    <p className="text-slate-500 font-bold">No live classes found matching your search.</p>
                    <button
                        onClick={handleOpenCreateModal}
                        className="text-rose-600 hover:text-rose-700 font-extrabold text-sm underline"
                    >
                        Schedule your first live session now
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 uppercase text-[11px] font-black tracking-wider">
                                    <th className="py-4 px-6">Class Information</th>
                                    <th className="py-4 px-6">Exam & Subject</th>
                                    <th className="py-4 px-6">Schedule Time</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredList.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                {item.thumbnailUrl ? (
                                                    <img src={item.thumbnailUrl} alt={item.title} className="w-14 h-12 rounded-xl object-cover border border-slate-200" />
                                                ) : (
                                                    <div className="w-14 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                                                        <Radio size={20} />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-extrabold text-slate-900 leading-snug line-clamp-1">{item.title}</h3>
                                                        {item.batchName && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                                                <Layers size={10} /> {item.batchName}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-medium line-clamp-1">Educator: {item.educatorName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-0.5">
                                                <span className="inline-block bg-blue-50 text-blue-700 text-xs font-black px-2.5 py-0.5 rounded-md">
                                                    {item.examCategory}
                                                </span>
                                                <p className="text-xs text-slate-500 font-semibold">{item.subject}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-0.5 text-xs">
                                                <p className="font-bold text-slate-800">
                                                    {item.scheduledStartTime ? new Date(item.scheduledStartTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Flexible'}
                                                </p>
                                                <p className="text-slate-400 font-medium">{item.durationMinutes} Mins Duration</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => handleToggleStatus(item)}
                                                className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase transition-all flex items-center gap-1.5 ${
                                                    item.status === 'live'
                                                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 animate-pulse'
                                                        : item.status === 'upcoming'
                                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {item.status === 'live' && <span className="w-2 h-2 rounded-full bg-rose-600"></span>}
                                                <span>{item.status === 'live' ? 'LIVE NOW' : item.status}</span>
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.status === 'upcoming' && (
                                                    <button
                                                        onClick={() => handleToggleStatus(item)}
                                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg shadow-sm flex items-center gap-1"
                                                        title="Go Live Now"
                                                    >
                                                        <Radio size={14} />
                                                        <span>Go Live</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleOpenEditModal(item)}
                                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Live Class"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">
                                    {editingId ? 'Edit Live Session' : 'Schedule New Live Class'}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Configure live broadcast link, schedule and educator details.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-slate-600">Class Title *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Reasoning Short Tricks & Puzzles Live"
                                    value={formData.title}
                                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                                />
                            </div>

                            {/* Batch Selection Option */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-slate-600 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Layers size={14} className="text-indigo-600" />
                                        <span>Target Batch / Course</span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold lowercase">(optional / assign to batch)</span>
                                </label>
                                <select
                                    value={formData.batchId || ''}
                                    onChange={(e) => handleBatchChange(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 cursor-pointer"
                                >
                                    <option value="">Open Live Class (All Students / General)</option>
                                    {batches.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.title} {b.examCategory ? `• [${b.examCategory}]` : ''}
                                        </option>
                                    ))}
                                </select>
                                {formData.batchName && (
                                    <div className="text-[11px] text-indigo-700 font-bold flex items-center justify-between flex-wrap gap-2 mt-1 bg-indigo-50/70 border border-indigo-100 px-3 py-2 rounded-lg">
                                        <span className="flex items-center gap-1.5">
                                            <CheckCircle2 size={13} className="text-indigo-600 shrink-0" />
                                            <span>Linked to Batch: <strong>{formData.batchName}</strong></span>
                                        </span>
                                        {selectedBatchInstructor && (
                                            <span className="text-[10px] bg-indigo-100/80 text-indigo-800 px-2 py-0.5 rounded font-extrabold">
                                                Faculty: {selectedBatchInstructor}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase text-slate-600">Exam Category</label>
                                    <select
                                        value={formData.examCategory}
                                        onChange={(e) => handleExamCategoryChange(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm cursor-pointer"
                                    >
                                        {exams.map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-black uppercase text-slate-600">Subject *</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsCustomSubject(p => !p)}
                                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                                        >
                                            {isCustomSubject ? '← Select from list' : '+ Type custom'}
                                        </button>
                                    </div>

                                    {isCustomSubject ? (
                                        <div>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Mathematics, Organic Chemistry, Reasoning..."
                                                value={formData.subject}
                                                onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                                                autoFocus
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1">Typing custom subject. Click "Select from list" to choose from batch subjects.</p>
                                        </div>
                                    ) : (
                                        <select
                                            value={formData.subject}
                                            onChange={(e) => {
                                                if (e.target.value === '__custom__') {
                                                    setIsCustomSubject(true);
                                                    setFormData(p => ({ ...p, subject: '' }));
                                                } else {
                                                    setFormData(p => ({ ...p, subject: e.target.value }));
                                                }
                                            }}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 cursor-pointer"
                                        >
                                            <option value="">-- Choose Subject --</option>
                                            {batchModules.length > 0 && (
                                                <optgroup label={`📚 ${formData.batchName || 'Batch'} Curriculum Modules`}>
                                                    {batchModules.map(m => (
                                                        <option key={m.id} value={m.title}>{m.title}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            {categorySubjects.length > 0 && (
                                                <optgroup label={`🎯 ${formData.examCategory} Subjects`}>
                                                    {categorySubjects.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            <optgroup label="📋 All Available Subjects">
                                                {systemSubjects.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </optgroup>
                                            {formData.subject && !batchModules.some(m => m.title === formData.subject) && !categorySubjects.includes(formData.subject) && !systemSubjects.includes(formData.subject) && (
                                                <option value={formData.subject}>{formData.subject} (Custom Selected)</option>
                                            )}
                                            <option value="__custom__">✏️ + Enter Custom Subject...</option>
                                        </select>
                                    )}
                                    {isLoadingModules && (
                                        <p className="text-[10px] text-indigo-600 flex items-center gap-1.5 font-bold animate-pulse mt-1">
                                            <Loader2 size={11} className="animate-spin" /> Loading batch curriculum modules...
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-black uppercase text-slate-600">Educator / Faculty Name *</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsCustomEducator(p => !p)}
                                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                                        >
                                            {isCustomEducator ? '← Select from list' : '+ Type custom'}
                                        </button>
                                    </div>

                                    {isCustomEducator ? (
                                        <div>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Sudhanshu Sir, Dr. Priya Rao..."
                                                value={formData.educatorName}
                                                onChange={(e) => setFormData(p => ({ ...p, educatorName: e.target.value }))}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                                                autoFocus
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1">Typing custom educator name. Click "Select from list" to pick existing faculty.</p>
                                        </div>
                                    ) : (
                                        <select
                                            value={formData.educatorName}
                                            onChange={(e) => {
                                                if (e.target.value === '__custom__') {
                                                    setIsCustomEducator(true);
                                                    setFormData(p => ({ ...p, educatorName: '' }));
                                                } else {
                                                    setFormData(p => ({ ...p, educatorName: e.target.value }));
                                                }
                                            }}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 cursor-pointer"
                                        >
                                            <option value="">-- Choose Educator / Faculty --</option>
                                            {selectedBatchInstructor && (
                                                <optgroup label={`🎓 ${formData.batchName || 'Batch'} Assigned Faculty`}>
                                                    <option value={selectedBatchInstructor}>
                                                        {selectedBatchInstructor} (Batch Faculty)
                                                    </option>
                                                </optgroup>
                                            )}
                                            <optgroup label="👨‍🏫 Available Educators & Faculty">
                                                {otherEducators.map(name => (
                                                    <option key={name} value={name}>{name}</option>
                                                ))}
                                            </optgroup>
                                            {formData.educatorName && !allEducators.includes(formData.educatorName) && (
                                                <option value={formData.educatorName}>{formData.educatorName} (Custom Selected)</option>
                                            )}
                                            <option value="__custom__">✏️ + Enter Custom Educator Name...</option>
                                        </select>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase text-slate-600">Initial Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData(p => ({ ...p, status: e.target.value as any }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm cursor-pointer"
                                    >
                                        <option value="upcoming">Upcoming (Scheduled)</option>
                                        <option value="live">Live Now (Immediate Broadcast)</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase text-slate-600">Start Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.scheduledStartTime}
                                        onChange={(e) => setFormData(p => ({ ...p, scheduledStartTime: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase text-slate-600">Duration (Minutes)</label>
                                    <input
                                        type="number"
                                        min={10}
                                        max={360}
                                        value={formData.durationMinutes}
                                        onChange={(e) => setFormData(p => ({ ...p, durationMinutes: Number(e.target.value) }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-slate-600">Live Stream URL / YouTube Live Link *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. https://www.youtube.com/watch?v=xxxx or YouTube Live Embed"
                                    value={formData.streamUrl}
                                    onChange={(e) => setFormData(p => ({ ...p, streamUrl: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                                />
                                <p className="text-[11px] text-slate-400 font-medium">Supports YouTube Live URLs, Zoom meeting links, and custom stream links.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-slate-600">Thumbnail Image</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="https://image-link.com/live-poster.jpg"
                                        value={formData.thumbnailUrl}
                                        onChange={(e) => setFormData(p => ({ ...p, thumbnailUrl: e.target.value }))}
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                                    />
                                    <label className="px-4 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors shrink-0">
                                        {isUploadingThumb ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                        <span>Upload</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-3 text-slate-600 hover:bg-slate-100 font-extrabold text-sm rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-rose-500/25 flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                                    <span>{editingId ? 'Save Changes' : 'Schedule Live Class'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLiveClassesPage;
