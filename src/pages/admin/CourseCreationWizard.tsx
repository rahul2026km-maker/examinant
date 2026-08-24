import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ChevronLeft, Plus, Trash2, Edit3, Upload, Loader2, Sparkles, 
    Check, Play, FileText, HelpCircle, Layers, CheckCircle2, Video, Link as LinkIcon, Image as ImageIcon 
} from 'lucide-react';
import { courseService } from '../../services/courseService';
import { curriculumService } from '../../services/curriculumService';
import type { Course, CourseModule, Lesson } from '../../types/course.types';
import { useExamList } from '../../hooks/useExamList';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { getAllTestSeries } from '../../services/testSeriesService';

const CourseCreationWizard = () => {
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId?: string }>();
    const isEditMode = Boolean(courseId);

    const exams = useExamList();
    const [step, setStep] = useState<number>(1);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
    const [testSeriesList, setTestSeriesList] = useState<any[]>([]);

    // Course Form State
    const [formData, setFormData] = useState<Partial<Course>>({
        title: '',
        slug: '',
        shortDescription: '',
        description: '',
        examCategory: 'JEE',
        examSubCategory: '',
        level: 'All Levels',
        language: 'Hinglish',
        thumbnailUrl: '',
        bannerUrl: '',
        instructor: {
            name: 'Examinant Expert Team',
            title: 'Senior Educator & Subject Specialist',
            avatarUrl: '',
            bio: 'Expert educators with 10+ years of coaching experience.'
        },
        accessType: 'paid',
        pricing: {
            amount: 499,
            originalPrice: 1499,
            currency: 'INR'
        },
        status: 'draft'
    });

    // Modules and Lessons State (for Curriculum Builder)
    const [modules, setModules] = useState<CourseModule[]>([]);
    const [moduleLessons, setModuleLessons] = useState<Record<string, Lesson[]>>({});
    const [newModuleName, setNewModuleName] = useState<string>('');
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

    // Modal state for adding/editing a lesson
    const [isAddingLesson, setIsAddingLesson] = useState<boolean>(false);
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
    const [isUploadingLessonThumbnail, setIsUploadingLessonThumbnail] = useState<boolean>(false);
    const [isUploadingLessonVideo, setIsUploadingLessonVideo] = useState<boolean>(false);
    const [lessonFormData, setLessonFormData] = useState<Partial<Lesson>>({
        title: '',
        type: 'video',
        videoProvider: 'youtube',
        videoUrl: '',
        thumbnailUrl: '',
        pdfUrl: '',
        textContent: '',
        attachedTestId: '',
        durationMinutes: 15,
        isFreePreview: false,
        isMandatory: true
    });

    useEffect(() => {
        loadInitialData();
    }, [courseId]);

    const loadInitialData = async () => {
        try {
            const series = await getAllTestSeries();
            setTestSeriesList(series);

            if (courseId) {
                const existing = await courseService.getCourseById(courseId);
                if (existing) {
                    setFormData(existing);
                    // Load curriculum
                    const mods = await curriculumService.getCourseModules(courseId);
                    setModules(mods);
                    const lessonMap: Record<string, Lesson[]> = {};
                    for (const m of mods) {
                        const lessons = await curriculumService.getModuleLessons(courseId, m.id);
                        lessonMap[m.id] = lessons;
                    }
                    setModuleLessons(lessonMap);
                    if (mods.length > 0) setActiveModuleId(mods[0].id);
                }
            }
        } catch (error) {
            console.error("Error loading course details:", error);
        }
    };

    const handleImageUpload = async (file: File) => {
        setIsUploadingImage(true);
        try {
            const url = await uploadToCloudinary(file);
            setFormData(prev => ({ ...prev, thumbnailUrl: url }));
        } catch (error) {
            alert("Image upload failed");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSaveCourseInfo = async () => {
        if (!formData.title || !formData.shortDescription) {
            alert("Please fill in required fields: Course Title and Short Description");
            return;
        }

        setIsSaving(true);
        try {
            const generatedSlug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const payload = {
                ...formData,
                slug: formData.slug || generatedSlug
            } as any;

            let targetId = courseId;
            if (!targetId) {
                targetId = await courseService.createCourse(payload);
                navigate(`/admin-dashboard/courses/${targetId}/edit`, { replace: true });
            } else {
                await courseService.updateCourse(targetId, payload);
            }
            setStep(2);
        } catch (error) {
            alert("Failed to save course details.");
        } finally {
            setIsSaving(false);
        }
    };

    // Curriculum Module Handlers
    const handleAddModule = async () => {
        if (!newModuleName.trim() || !courseId) return;
        try {
            const newId = await curriculumService.createModule(courseId, newModuleName.trim(), modules.length + 1);
            const updatedMods = await curriculumService.getCourseModules(courseId);
            setModules(updatedMods);
            setModuleLessons(prev => ({ ...prev, [newId]: [] }));
            setActiveModuleId(newId);
            setNewModuleName('');
        } catch (error) {
            alert("Failed to add module");
        }
    };

    const handleDeleteModule = async (mId: string) => {
        if (!courseId || !window.confirm("Delete this module and all its lessons?")) return;
        try {
            await curriculumService.deleteModule(courseId, mId);
            const updatedMods = await curriculumService.getCourseModules(courseId);
            setModules(updatedMods);
            if (activeModuleId === mId) {
                setActiveModuleId(updatedMods.length > 0 ? updatedMods[0].id : null);
            }
        } catch (error) {
            alert("Failed to delete module");
        }
    };

    // Lesson Handlers
    const handleOpenAddLesson = (mId: string) => {
        setActiveModuleId(mId);
        setEditingLessonId(null);
        setLessonFormData({
            title: '',
            type: 'video',
            videoProvider: 'youtube',
            videoUrl: '',
            thumbnailUrl: '',
            pdfUrl: '',
            textContent: '',
            attachedTestId: '',
            durationMinutes: 15,
            isFreePreview: false,
            isMandatory: true
        });
        setIsAddingLesson(true);
    };

    const handleOpenEditLesson = (mId: string, lesson: Lesson) => {
        setActiveModuleId(mId);
        setEditingLessonId(lesson.id);
        setLessonFormData({ ...lesson });
        setIsAddingLesson(true);
    };

    const handleLessonThumbnailUpload = async (file: File) => {
        setIsUploadingLessonThumbnail(true);
        try {
            const url = await uploadToCloudinary(file, undefined, 'image');
            setLessonFormData(prev => ({ ...prev, thumbnailUrl: url }));
        } catch (error) {
            alert("Thumbnail upload failed");
        } finally {
            setIsUploadingLessonThumbnail(false);
        }
    };

    const handleLessonVideoUpload = async (file: File) => {
        setIsUploadingLessonVideo(true);
        try {
            const url = await uploadToCloudinary(file, undefined, 'video');
            setLessonFormData(prev => ({ ...prev, videoUrl: url }));
        } catch (error) {
            alert("Video upload failed");
        } finally {
            setIsUploadingLessonVideo(false);
        }
    };

    const handleAddLessonSubmit = async () => {
        if (!courseId || !activeModuleId || !lessonFormData.title) return;
        try {
            const payload = {
                title: lessonFormData.title,
                type: lessonFormData.type || 'video',
                durationMinutes: Number(lessonFormData.durationMinutes) || 10,
                isFreePreview: Boolean(lessonFormData.isFreePreview),
                isMandatory: Boolean(lessonFormData.isMandatory),
                videoProvider: lessonFormData.videoProvider || 'youtube',
                videoUrl: lessonFormData.videoUrl || '',
                thumbnailUrl: lessonFormData.thumbnailUrl || '',
                pdfUrl: lessonFormData.pdfUrl || '',
                textContent: lessonFormData.textContent || '',
                attachedTestId: lessonFormData.attachedTestId || '',
                status: 'published'
            };

            if (editingLessonId) {
                await curriculumService.updateLesson(courseId, activeModuleId, editingLessonId, payload as any);
            } else {
                await curriculumService.createLesson(courseId, activeModuleId, {
                    ...payload,
                    order: (moduleLessons[activeModuleId]?.length || 0) + 1
                } as any);
            }

            const updatedLessons = await curriculumService.getModuleLessons(courseId, activeModuleId);
            setModuleLessons(prev => ({ ...prev, [activeModuleId]: updatedLessons }));
            setIsAddingLesson(false);
            setEditingLessonId(null);
            setLessonFormData({
                title: '',
                type: 'video',
                videoProvider: 'youtube',
                videoUrl: '',
                thumbnailUrl: '',
                pdfUrl: '',
                textContent: '',
                attachedTestId: '',
                durationMinutes: 15,
                isFreePreview: false,
                isMandatory: true
            });
        } catch (error) {
            alert("Failed to save lesson");
        }
    };

    const handleDeleteLesson = async (mId: string, lessonId: string) => {
        if (!courseId || !window.confirm("Delete this lesson?")) return;
        try {
            await curriculumService.deleteLesson(courseId, mId, lessonId);
            const updatedLessons = await curriculumService.getModuleLessons(courseId, mId);
            setModuleLessons(prev => ({ ...prev, [mId]: updatedLessons }));
        } catch (error) {
            alert("Failed to delete lesson");
        }
    };

    const handlePublishCourse = async (targetStatus: 'published' | 'draft') => {
        if (!courseId) return;
        setIsSaving(true);
        try {
            await courseService.updateCourse(courseId, { status: targetStatus });
            alert(`Course status updated to ${targetStatus}!`);
            navigate('/admin-dashboard/courses');
        } catch (error) {
            alert("Failed to publish course.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-16">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/admin-dashboard/courses')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
                >
                    <ChevronLeft size={20} />
                    <span>Back to Courses</span>
                </button>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase text-slate-400">Step {step} of 3</span>
                </div>
            </div>

            {/* Stepper Header */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-around items-center gap-4">
                <button
                    onClick={() => setStep(1)}
                    className={`flex items-center gap-3 text-sm font-black transition-all ${step === 1 ? 'text-blue-600' : 'text-slate-400'}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>1</div>
                    <span>Basic Details & Pricing</span>
                </button>
                <div className="h-0.5 w-12 bg-slate-100 hidden sm:block"></div>
                <button
                    onClick={() => courseId ? setStep(2) : alert("Please save basic details first")}
                    className={`flex items-center gap-3 text-sm font-black transition-all ${step === 2 ? 'text-blue-600' : 'text-slate-400'}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>2</div>
                    <span>Curriculum Builder</span>
                </button>
                <div className="h-0.5 w-12 bg-slate-100 hidden sm:block"></div>
                <button
                    onClick={() => courseId ? setStep(3) : alert("Please save basic details first")}
                    className={`flex items-center gap-3 text-sm font-black transition-all ${step === 3 ? 'text-blue-600' : 'text-slate-400'}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>3</div>
                    <span>Publish & Summary</span>
                </button>
            </div>

            {/* STEP 1: Basic Information & Access */}
            {step === 1 && (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Course Information</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">Set the title, target category, instructor, thumbnail and pricing model.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-600">Course Title *</label>
                            <input
                                type="text"
                                placeholder="e.g. Complete SSC CHSL Quantitative Aptitude Masterclass"
                                value={formData.title || ''}
                                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-bold text-slate-800 text-sm"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-600">Short Summary *</label>
                            <input
                                type="text"
                                placeholder="A 1-2 sentence compelling summary of what students will achieve."
                                value={formData.shortDescription || ''}
                                onChange={(e) => setFormData(p => ({ ...p, shortDescription: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium text-slate-800 text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-600">Exam Category</label>
                            <select
                                value={formData.examCategory || 'JEE'}
                                onChange={(e) => setFormData(p => ({ ...p, examCategory: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                            >
                                {exams.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-600">Target Level</label>
                            <select
                                value={formData.level || 'All Levels'}
                                onChange={(e) => setFormData(p => ({ ...p, level: e.target.value as any }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="All Levels">All Levels</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-600">Language</label>
                            <select
                                value={formData.language || 'Hinglish'}
                                onChange={(e) => setFormData(p => ({ ...p, language: e.target.value as any }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                            >
                                <option value="Hinglish">Hinglish</option>
                                <option value="Hindi">Hindi</option>
                                <option value="English">English</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-600">Access & Pricing Model</label>
                            <select
                                value={formData.accessType || 'paid'}
                                onChange={(e) => setFormData(p => ({ ...p, accessType: e.target.value as any }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                            >
                                <option value="paid">One-Time Paid Course</option>
                                <option value="free">Free for All Students</option>
                                <option value="subscription">Included in Examinant Pro Sub</option>
                            </select>
                        </div>

                        {formData.accessType === 'paid' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-600">Selling Price (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.pricing?.amount || 0}
                                        onChange={(e) => setFormData(p => ({ ...p, pricing: { ...p.pricing!, amount: Number(e.target.value) } }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-600">Original Price (Strikethrough ₹)</label>
                                    <input
                                        type="number"
                                        value={formData.pricing?.originalPrice || 0}
                                        onChange={(e) => setFormData(p => ({ ...p, pricing: { ...p.pricing!, originalPrice: Number(e.target.value) } }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-500 text-sm"
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-600">Thumbnail Image URL / Upload</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="text"
                                    placeholder="https://image-link.com/thumbnail.png"
                                    value={formData.thumbnailUrl || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, thumbnailUrl: e.target.value }))}
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-sm"
                                />
                                <label className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-black transition-colors">
                                    {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                    <span>Upload Image</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                                </label>
                            </div>
                            {formData.thumbnailUrl && (
                                <img src={formData.thumbnailUrl} alt="Preview" className="w-32 h-20 rounded-xl object-cover border border-slate-200 mt-2" />
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            onClick={handleSaveCourseInfo}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 transition-all"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                            <span>Save & Continue to Curriculum</span>
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: Interactive Curriculum Builder */}
            {step === 2 && (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Curriculum Builder</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">Organize your course into Modules/Sections and add Video lessons, PDF notes, or attached Test Series quizzes.</p>
                    </div>

                    {/* Add Module Bar */}
                    <div className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <input
                            type="text"
                            placeholder="Enter new module title (e.g. Module 1: Kinematics & Mechanics)"
                            value={newModuleName}
                            onChange={(e) => setNewModuleName(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                        />
                        <button
                            onClick={handleAddModule}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all"
                        >
                            <Plus size={16} />
                            <span>Add Module</span>
                        </button>
                    </div>

                    {/* Module Accordion & Lesson List */}
                    <div className="space-y-4">
                        {modules.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 font-medium">
                                No modules added yet. Add a module above to start adding lessons.
                            </div>
                        ) : (
                            modules.map((m, idx) => (
                                <div key={m.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                                    <div className="flex justify-between items-center bg-slate-50 p-4 border-b border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center">{idx + 1}</span>
                                            <h3 className="font-extrabold text-slate-900 text-base">{m.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenAddLesson(m.id)}
                                                className="flex items-center gap-1 text-xs font-extrabold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                                            >
                                                <Plus size={14} /> Add Lesson
                                            </button>
                                            <button
                                                onClick={() => handleDeleteModule(m.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Lessons list inside module */}
                                    <div className="p-4 space-y-2">
                                        {(moduleLessons[m.id] || []).length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No lessons in this module yet.</p>
                                        ) : (
                                            moduleLessons[m.id].map((lesson, lIdx) => (
                                                <div key={lesson.id} className="flex justify-between items-center p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        {lesson.thumbnailUrl ? (
                                                            <img src={lesson.thumbnailUrl} alt={lesson.title} className="w-12 h-8 rounded-lg object-cover border border-slate-200" />
                                                        ) : lesson.type === 'video' ? (
                                                            <Video size={16} className="text-blue-500" />
                                                        ) : (
                                                            <FileText size={16} className="text-purple-500" />
                                                        )}
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm">{lIdx + 1}. {lesson.title}</h4>
                                                            <p className="text-[11px] text-slate-400 font-medium">
                                                                {lesson.type.toUpperCase()} • {lesson.durationMinutes} Mins {lesson.isFreePreview ? '• (FREE PREVIEW)' : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleOpenEditLesson(m.id, lesson)}
                                                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100"
                                                            title="Edit Lesson"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLesson(m.id, lesson.id)}
                                                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100"
                                                            title="Delete Lesson"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Lesson Modal */}
                    {isAddingLesson && (
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                                <h3 className="text-xl font-black text-slate-900">
                                    {editingLessonId ? 'Edit Lesson' : 'Add New Lesson'}
                                </h3>
                                <div className="space-y-4 text-xs font-bold text-slate-700">
                                    <div>
                                        <label className="block mb-1 text-slate-500 uppercase">Lesson Title *</label>
                                        <input
                                            type="text"
                                            value={lessonFormData.title || ''}
                                            onChange={(e) => setLessonFormData(p => ({ ...p, title: e.target.value }))}
                                            placeholder="e.g. Newton's First Law & Inertia"
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-slate-500 uppercase">Lesson Type</label>
                                        <select
                                            value={lessonFormData.type || 'video'}
                                            onChange={(e) => setLessonFormData(p => ({ ...p, type: e.target.value as any }))}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                                        >
                                            <option value="video">Video Lesson</option>
                                            <option value="pdf">PDF Study Notes</option>
                                            <option value="test">Attach Existing Test Series / Quiz</option>
                                        </select>
                                    </div>

                                    {lessonFormData.type === 'video' && (
                                        <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                            {/* Video Upload / Link */}
                                            <div>
                                                <label className="block mb-1 text-slate-500 uppercase">Video Source / URL</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={lessonFormData.videoUrl || ''}
                                                        onChange={(e) => setLessonFormData(p => ({ ...p, videoUrl: e.target.value }))}
                                                        placeholder="https://www.youtube.com/embed/xyz or Cloudinary/MP4 URL"
                                                        className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                                                    />
                                                    <label className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white font-extrabold text-xs rounded-xl cursor-pointer hover:bg-blue-700 transition-colors shrink-0">
                                                        {isUploadingLessonVideo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                                        <span>Upload Video</span>
                                                        <input
                                                            type="file"
                                                            accept="video/*"
                                                            className="hidden"
                                                            onChange={(e) => e.target.files?.[0] && handleLessonVideoUpload(e.target.files[0])}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Video Thumbnail Upload / Link */}
                                            <div>
                                                <label className="block mb-1 text-slate-500 uppercase">Video Thumbnail Image (Poster)</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={lessonFormData.thumbnailUrl || ''}
                                                        onChange={(e) => setLessonFormData(p => ({ ...p, thumbnailUrl: e.target.value }))}
                                                        placeholder="https://image-link.com/poster.jpg"
                                                        className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                                                    />
                                                    <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white font-extrabold text-xs rounded-xl cursor-pointer hover:bg-black transition-colors shrink-0">
                                                        {isUploadingLessonThumbnail ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                                                        <span>Upload Thumbnail</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => e.target.files?.[0] && handleLessonThumbnailUpload(e.target.files[0])}
                                                        />
                                                    </label>
                                                </div>

                                                {/* Thumbnail Live Preview */}
                                                {lessonFormData.thumbnailUrl && (
                                                    <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-300 w-full aspect-video bg-black max-w-xs mx-auto">
                                                        <img
                                                            src={lessonFormData.thumbnailUrl}
                                                            alt="Lesson Thumbnail Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                                                            Thumbnail Preview
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {lessonFormData.type === 'pdf' && (
                                        <div>
                                            <label className="block mb-1 text-slate-500 uppercase">PDF Resource Link</label>
                                            <input
                                                type="text"
                                                value={lessonFormData.pdfUrl || ''}
                                                onChange={(e) => setLessonFormData(p => ({ ...p, pdfUrl: e.target.value }))}
                                                placeholder="https://resource-link.pdf"
                                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                                            />
                                        </div>
                                    )}

                                    {lessonFormData.type === 'test' && (
                                        <div>
                                            <label className="block mb-1 text-slate-500 uppercase">Attach Existing Test Series</label>
                                            <select
                                                value={lessonFormData.attachedTestId || ''}
                                                onChange={(e) => setLessonFormData(p => ({ ...p, attachedTestId: e.target.value }))}
                                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                                            >
                                                <option value="">Select Test Series</option>
                                                {testSeriesList.map(ts => <option key={ts.id} value={ts.id}>{ts.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(lessonFormData.isFreePreview)}
                                                onChange={(e) => setLessonFormData(p => ({ ...p, isFreePreview: e.target.checked }))}
                                                className="w-4 h-4 rounded text-blue-600"
                                            />
                                            <span>Allow Free Preview</span>
                                        </label>
                                        <div className="w-32">
                                            <label className="block text-[10px] text-slate-400 uppercase">Duration (Mins)</label>
                                            <input
                                                type="number"
                                                value={lessonFormData.durationMinutes || 15}
                                                onChange={(e) => setLessonFormData(p => ({ ...p, durationMinutes: Number(e.target.value) }))}
                                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button onClick={() => { setIsAddingLesson(false); setEditingLessonId(null); }} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                                    <button onClick={handleAddLessonSubmit} className="px-5 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-md">
                                        {editingLessonId ? 'Save Changes' : 'Add Lesson'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between pt-4 border-t border-slate-100">
                        <button onClick={() => setStep(1)} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl">Back</button>
                        <button onClick={() => setStep(3)} className="px-8 py-3 bg-blue-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/25">Continue to Review</button>
                    </div>
                </div>
            )}

            {/* STEP 3: Review & Publish */}
            {step === 3 && (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Review & Publish Course</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">Review full course details and set publication status.</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center gap-4">
                            {formData.thumbnailUrl && <img src={formData.thumbnailUrl} alt={formData.title} className="w-20 h-20 rounded-xl object-cover" />}
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900">{formData.title}</h3>
                                <p className="text-slate-500 text-xs font-medium">{formData.examCategory} • {formData.level} • {formData.language}</p>
                                <p className="text-blue-600 font-black text-base mt-1">
                                    {formData.accessType === 'free' ? 'FREE' : `₹${formData.pricing?.amount || 0}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-xs font-bold text-slate-600 pt-2 border-t border-slate-200">
                            <span>{modules.length} Modules</span>
                            <span>{Object.values(moduleLessons).flat().length} Total Lessons</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => handlePublishCourse('draft')}
                            disabled={isSaving}
                            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm rounded-xl"
                        >
                            Save as Draft
                        </button>
                        <button
                            onClick={() => handlePublishCourse('published')}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/25"
                        >
                            <CheckCircle2 size={18} />
                            <span>Publish Course Now</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseCreationWizard;
