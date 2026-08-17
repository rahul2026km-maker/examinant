import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Monitor, FileText, Clock, HelpCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface TestPreview {
    id: string;
    name: string;
    duration?: number;
    isOMR?: boolean;
    settings?: { duration?: number };
    questionIds?: string[];
    questionMappings?: any[];
    omrTemplate?: { totalQuestions: number };
}

const StudentTestModeSelect = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState<TestPreview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState<'digital' | 'omr' | null>(null);

    useEffect(() => {
        const fetchTest = async () => {
            if (!testId) return;
            try {
                const snap = await getDoc(doc(db, 'tests', testId));
                if (snap.exists()) {
                    setTest({ id: snap.id, ...snap.data() } as TestPreview);
                } else {
                    alert('Test not found!');
                    navigate(-1);
                }
            } catch (err) {
                console.error(err);
                alert('Error loading test');
                navigate(-1);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTest();
    }, [testId, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-slate-500 font-medium">Loading test...</p>
                </div>
            </div>
        );
    }

    if (!test) return null;

    const totalQuestions = test.questionIds?.length || test.questionMappings?.length || test.omrTemplate?.totalQuestions || 0;
    const duration = test.settings?.duration || test.duration || 180;
    const hasOMR = !!test.isOMR || !!test.omrTemplate;
    const hasDigital = (!!test.questionIds && test.questionIds.length > 0) || (!!test.questionMappings && test.questionMappings.length > 0);

    const handleStart = () => {
        if (!selected) return;
        if (selected === 'digital') {
            navigate(`/dashboard/attempt/${testId}`);
        } else {
            navigate(`/dashboard/omr-attempt/${testId}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-2xl"
            >
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors font-medium text-sm"
                >
                    <ArrowLeft size={18} /> Back to Tests
                </button>

                {/* Test Info Card */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 mb-6 text-white">
                    <h1 className="text-xl font-bold mb-3">{test.name}</h1>
                    <div className="flex items-center gap-6 text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                            <HelpCircle size={15} />
                            <span>{totalQuestions} Questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={15} />
                            <span>{duration} minutes</span>
                        </div>
                    </div>
                </div>

                {/* Mode Selection Title */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-extrabold text-white">Choose Test Mode</h2>
                    <p className="text-slate-400 mt-1 text-sm">Select how you want to attempt this test</p>
                </div>

                {/* Mode Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Digital Mode */}
                    <motion.button
                        whileHover={hasDigital ? { scale: 1.02 } : {}}
                        whileTap={hasDigital ? { scale: 0.98 } : {}}
                        onClick={() => hasDigital ? setSelected('digital') : undefined}
                        className={`relative flex flex-col items-start p-6 rounded-2xl border-2 text-left transition-all ${
                            !hasDigital
                                ? 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
                                : selected === 'digital'
                                ? 'border-blue-400 bg-blue-500/20 shadow-xl shadow-blue-500/20'
                                : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
                        }`}
                    >
                        {selected === 'digital' && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">✓</span>
                            </div>
                        )}
                        {!hasDigital && (
                            <div className="absolute top-4 right-4 text-xs bg-white/10 text-slate-400 px-2 py-1 rounded-full font-medium">
                                Not Available
                            </div>
                        )}
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${hasDigital ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-white/10 border border-white/10'}`}>
                            <Monitor size={28} className={hasDigital ? 'text-blue-400' : 'text-slate-500'} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Digital Mode</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Standard online test with question navigation panel, mark for review, and instant feedback. Just like NTA exam portal.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {['Question Panel', 'Instant Submit', 'Mark for Review'].map(tag => (
                                <span key={tag} className={`text-xs px-2 py-1 rounded-full font-medium ${hasDigital ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-slate-500'}`}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </motion.button>

                    {/* OMR Mode */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => hasOMR ? setSelected('omr') : undefined}
                        className={`relative flex flex-col items-start p-6 rounded-2xl border-2 text-left transition-all ${
                            !hasOMR
                                ? 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
                                : selected === 'omr'
                                ? 'border-amber-400 bg-amber-500/20 shadow-xl shadow-amber-500/20'
                                : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
                        }`}
                    >
                        {selected === 'omr' && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">✓</span>
                            </div>
                        )}
                        {!hasOMR && (
                            <div className="absolute top-4 right-4 text-xs bg-white/10 text-slate-400 px-2 py-1 rounded-full font-medium">
                                Not Available
                            </div>
                        )}
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${hasOMR ? 'bg-amber-500/20 border border-amber-400/30' : 'bg-white/10 border border-white/10'}`}>
                            <FileText size={28} className={hasOMR ? 'text-amber-400' : 'text-slate-500'} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">OMR Mode</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Bubble sheet simulation — fill circles like a real paper exam. Practice with pen-paper exam feel on screen.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {['Bubble Sheet', 'Paper Feel', 'Answer Key'].map(tag => (
                                <span key={tag} className={`text-xs px-2 py-1 rounded-full font-medium ${hasOMR ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-slate-500'}`}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </motion.button>
                </div>

                {/* Start Button */}
                <motion.button
                    whileHover={selected ? { scale: 1.02 } : {}}
                    whileTap={selected ? { scale: 0.98 } : {}}
                    onClick={handleStart}
                    disabled={!selected}
                    className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                        selected
                            ? selected === 'digital'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-500/30'
                                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xl shadow-amber-500/30'
                            : 'bg-white/10 text-slate-500 cursor-not-allowed'
                    }`}
                >
                    {selected
                        ? `Start ${selected === 'digital' ? 'Digital' : 'OMR'} Test`
                        : 'Select a mode to continue'}
                    {selected && <ChevronRight size={22} />}
                </motion.button>
            </motion.div>
        </div>
    );
};

export default StudentTestModeSelect;
