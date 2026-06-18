import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Link as LinkIcon, PenTool, Loader2 } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, query, getDocs } from 'firebase/firestore';
import { useExamList } from '../../hooks/useExamList';

const AdminAddPYQPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tests, setTests] = useState<{ id: string; title: string }[]>([]);
    const [isLoadingTests, setIsLoadingTests] = useState(true);
    const exams = useExamList();

    const [formData, setFormData] = useState<{
        title: string;
        category: string;
        year: string;
        type: 'pdf' | 'test';
        fileUrl: string;
        testId: string;
        price: string;
    }>({
        title: '',
        category: 'NEET',
        year: new Date().getFullYear().toString(),
        type: 'pdf',
        fileUrl: '',
        testId: '',
        price: '0'
    });



    useEffect(() => {
        const fetchTests = async () => {
            try {
                const q = query(collection(db, 'testSeries')); // Removed orderBy
                const snapshot = await getDocs(q);
                console.log("Fetched tests count:", snapshot.size);

                const fetchedTests = snapshot.docs.map(doc => {
                    const data = doc.data();
                    // Fallback waterfall
                    const displayTitle = data.title || data.name || data.testName || `Test ID: ${doc.id}`;
                    console.log("Mapped test:", { id: doc.id, title: displayTitle });
                    return {
                        id: doc.id,
                        title: displayTitle
                    };
                });
                setTests(fetchedTests);
            } catch (error: any) {
                console.error("Error fetching tests:", error);
                alert("Error fetching tests: " + error.message);
            } finally {
                setIsLoadingTests(false);
            }
        };

        fetchTests();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const pyqData: any = {
                title: formData.title,
                category: formData.category,
                year: formData.year,
                type: formData.type,
                price: Number(formData.price),
                createdAt: serverTimestamp()
            };

            if (formData.type === 'pdf') {
                pyqData.fileUrl = formData.fileUrl;
            } else {
                pyqData.testId = formData.testId;
            }

            await addDoc(collection(db, 'pyqs'), pyqData);
            alert('PYQ Created Successfully!');
            navigate('/admin-dashboard/pyqs');
        } catch (error) {
            console.error("Error creating PYQ:", error);
            alert("Failed to create PYQ");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <button
                onClick={() => navigate('/admin-dashboard/pyqs')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
            >
                <ArrowLeft size={20} /> Back to PYQs
            </button>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h1 className="text-2xl font-bold text-slate-800">Add New PYQ</h1>
                    <p className="text-slate-500 mt-1">Create a new Previous Year Question resource.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            placeholder="e.g. JEE Mains 2023 Shift 1 Analysis"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                            <div className="relative">
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                >
                                    {exams.map(exam => (
                                        <option key={exam} value={exam}>{exam}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Year</label>
                            <input
                                type="number"
                                required
                                value={formData.year}
                                onChange={e => setFormData({ ...formData, year: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-3">Resource Type</label>
                        <div className="flex gap-6">
                            <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.type === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    checked={formData.type === 'pdf'}
                                    onChange={() => setFormData({ ...formData, type: 'pdf' })}
                                    className="hidden"
                                />
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.type === 'pdf' ? 'border-blue-600' : 'border-slate-300'}`}>
                                    {formData.type === 'pdf' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                </div>
                                <span className={`font-bold ${formData.type === 'pdf' ? 'text-blue-700' : 'text-slate-600'}`}>PDF Document</span>
                            </label>
                            <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.type === 'test' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    checked={formData.type === 'test'}
                                    onChange={() => setFormData({ ...formData, type: 'test' })}
                                    className="hidden"
                                />
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.type === 'test' ? 'border-purple-600' : 'border-slate-300'}`}>
                                    {formData.type === 'test' && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" />}
                                </div>
                                <span className={`font-bold ${formData.type === 'test' ? 'text-purple-700' : 'text-slate-600'}`}>Interactive Test</span>
                            </label>
                        </div>
                    </div>

                    {formData.type === 'pdf' ? (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                            <label className="block text-sm font-bold text-slate-700 mb-2">File URL / Link</label>
                            <div className="relative">
                                <LinkIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="url"
                                    required
                                    value={formData.fileUrl}
                                    onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="https://firebasestorage.googleapis.com/..."
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Select Test to Link ({tests.length} available)
                            </label>
                            {isLoadingTests ? (
                                <div className="flex items-center gap-2 text-slate-500 py-3 pl-4 border border-slate-200 rounded-xl bg-slate-50">
                                    <Loader2 className="animate-spin" size={20} /> Loading available tests...
                                </div>
                            ) : (
                                <div className="relative">
                                    <PenTool size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        required
                                        value={formData.testId}
                                        onChange={e => setFormData({ ...formData, testId: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none bg-white"
                                    >
                                        <option value="" className="text-slate-500">-- Select a Test --</option>
                                        <option value="debug" className="text-red-500 font-bold bg-slate-100">DEBUG: Hardcoded Option</option>

                                        {tests.length === 0 && (
                                            <option value="" disabled className="text-slate-400 italic">No tests found in database</option>
                                        )}

                                        {tests.map(test => (
                                            <option key={test.id} value={test.id} className="text-slate-900 font-medium py-1">
                                                {test.title}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            )}
                            <p className="text-sm text-slate-500 mt-2 ml-1">
                                💡 Select one of your created tests to use as this PYQ.
                            </p>
                        </motion.div>
                    )}

                    <div className="pt-4 border-t border-slate-100">
                        <label className="block text-sm font-bold text-slate-700 mb-3">Pricing</label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.price === '0'}
                                    onChange={e => setFormData({ ...formData, price: e.target.checked ? '0' : '' })}
                                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <span className="font-medium text-slate-700">Free Resource</span>
                            </label>
                            <div className="flex-1 relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                <input
                                    type="number"
                                    disabled={formData.price === '0'}
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                                    placeholder="Price"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            {isSubmitting ? 'Creating...' : 'Create PYQ Resource'}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default AdminAddPYQPage;
