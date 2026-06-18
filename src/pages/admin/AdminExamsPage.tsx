import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react';
import { examService, DEFAULT_EXAMS } from '../../services/examService';
import type { ExamRecord } from '../../services/examService';

const AdminExamsPage = () => {
    const [exams, setExams] = useState<ExamRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newExam, setNewExam] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let isSeeding = false;
        const unsubscribe = examService.subscribe(async (records) => {
            setExams(records);
            setIsLoading(false);
            
            if (!isSeeding && !localStorage.getItem('hasSeededExams_v1')) {
                isSeeding = true;
                try {
                    const existingNames = records.map(r => r.name.toLowerCase());
                    for (const def of DEFAULT_EXAMS) {
                        if (!existingNames.includes(def.toLowerCase())) {
                            await examService.create(def);
                        }
                    }
                    localStorage.setItem('hasSeededExams_v1', 'true');
                } catch (err) {
                    console.error("Error during seeding", err);
                }
            }
        });
        return unsubscribe;
    }, []);

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmed = newExam.trim();
        if (!trimmed) return;
        if (exams.some(exam => exam.name.toLowerCase() === trimmed.toLowerCase())) {
            alert('Exam Category already exists.');
            return;
        }
        setIsSaving(true);
        try {
            await examService.create(trimmed);
            setNewExam('');
        } catch (error) {
            console.error('Error adding exam:', error);
            alert('Could not add exam.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (exam: ExamRecord) => {
        setEditId(exam.id);
        setEditName(exam.name);
    };

    const handleUpdate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!editId) return;
        const trimmed = editName.trim();
        if (!trimmed) return;
        if (exams.some(exam => exam.name.toLowerCase() === trimmed.toLowerCase() && exam.id !== editId)) {
            alert('Another exam category with this name already exists.');
            return;
        }
        setIsSaving(true);
        try {
            await examService.update(editId, trimmed);
            setEditId(null);
            setEditName('');
        } catch (error) {
            console.error('Error updating exam:', error);
            alert('Could not update exam category.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (exam: ExamRecord) => {
        if (!window.confirm(`Delete exam category "${exam.name}"? This will not remove questions or test series already tagged with it.`)) {
            return;
        }
        setIsSaving(true);
        try {
            await examService.delete(exam.id);
        } catch (error) {
            console.error('Error deleting exam:', error);
            alert('Could not delete exam category.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Manage Exams</h1>
                    <p className="text-slate-500 mt-2">Add, edit, or remove exam categories (e.g. JEE, NEET) from the dashboard.</p>
                </div>
                
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Exam List</h2>
                                <p className="text-sm text-slate-500">Current exam categories available.</p>
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                {exams.length} exams
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 size={32} className="animate-spin text-slate-500" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {exams.length === 0 ? (
                                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                                        No exams found.
                                    </div>
                                ) : (
                                    exams.map(exam => (
                                        <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl border border-slate-200 p-4 bg-white">
                                            <div className="space-y-1">
                                                <div className="text-slate-900 font-semibold">{exam.name}</div>
                                                <div className="text-xs text-slate-500">ID: {exam.id}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(exam)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                                                >
                                                    <Edit2 size={16} />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(exam)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>


                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-3">Add New Exam</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Exam Name</label>
                            <input
                                type="text"
                                value={newExam}
                                onChange={e => setNewExam(e.target.value)}
                                placeholder="e.g. CUET"
                                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center justify-center w-full gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                        >
                            <Plus size={18} />
                            {isSaving ? 'Saving...' : 'Add Exam'}
                        </button>
                        {editId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditId(null);
                                    setEditName('');
                                }}
                                className="inline-flex items-center justify-center w-full gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                                <X size={18} />
                                Cancel edit
                            </button>
                        )}
                    </form>
                </div>
            </div>

            {editId && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Edit Exam</h2>
                            <p className="text-sm text-slate-500">Update the exam category name for existing records.</p>
                        </div>
                    </div>
                    <form onSubmit={handleUpdate} className="grid gap-4 sm:grid-cols-[1fr_auto]">
                        <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                        >
                            <Save size={18} />
                            Save Changes
                        </button>
                    </form>
                </div>
            )}
        </motion.div>
    );
};

export default AdminExamsPage;
