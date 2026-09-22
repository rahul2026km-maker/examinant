import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Lock, Loader2, Search, PenTool, ExternalLink } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/landing/PageLayout';

interface PYQ {
    id: string;
    title: string;
    category: string;
    year: string;
    type: 'pdf' | 'test';
    fileUrl?: string;
    testId?: string;
    price: number;
}

const PYQsDiscoveryPage = () => {
    const navigate = useNavigate();
    const [pyqs, setPyqs] = useState<PYQ[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'pyqs'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    title: data.title || data.name || data.testName || 'Untitled PYQ',
                    category: data.category || data.exam || 'General',
                    year: data.year || 'N/A',
                    price: data.price ?? 0
                };
            }) as PYQ[];
            setPyqs(fetched);
            setIsLoading(false);
        }, (error) => {
            console.error("PYQ Discovery Error:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleExplore = (id: string) => {
        navigate(`/pyqs/${id}`);
    };

    const filteredPyqs = pyqs.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
    };

    return (
        <PageLayout>
            <div className="bg-[#070D1E] min-h-screen text-white overflow-hidden relative">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-20"
                    >
                        <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
                            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Past Exams</span>
                        </h1>
                        <p className="text-xl text-slate-300 max-w-2xl mx-auto font-medium">
                            Premium repository of Previous Year Questions. Practice with the most authentic data used by top rankers.
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-2xl mx-auto mb-20 relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-45 transition duration-300"></div>
                        <div className="relative">
                            <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by subject, year or exam name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-[#0B152B]/90 backdrop-blur-xl border border-[#17254E] rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-lg shadow-2xl"
                            />
                        </div>
                    </motion.div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                        </div>
                    ) : filteredPyqs.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 font-bold text-xl">
                            Our archives are currently refreshing. No records found.
                        </div>
                    ) : (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {filteredPyqs.map((pyq) => (
                                <motion.div
                                    key={pyq.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                    className="bg-[#0B152B] backdrop-blur-md rounded-[32px] p-8 border border-[#17254E] hover:border-[#1E3360] transition-all flex flex-col group relative shadow-lg"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div className={`p-4 rounded-2xl ${pyq.type === 'test' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-blue-500/10 text-blue-400'} border border-[#1E3360]`}>
                                            {pyq.type === 'test' ? <PenTool size={28} /> : <FileText size={28} />}
                                        </div>
                                        <span className="bg-[#0E1B38] text-slate-300 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-[#1E3360]">
                                            {pyq.category}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight group-hover:text-blue-400 transition-colors relative z-10">{pyq.title}</h3>
                                    
                                    <div className="flex items-center gap-3 mb-8 relative z-10">
                                        <span className="py-1 px-3 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-bold border border-blue-500/20">{pyq.year}</span>
                                        <span className="text-slate-400 font-medium text-sm">
                                            {pyq.type === 'test' ? 'CBT Mock' : 'Rich PDF'}
                                        </span>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-[#17254E] flex items-center justify-between relative z-10">
                                        <div className="text-2xl font-black text-white">
                                            {pyq.price === 0 ? <span className="text-emerald-400">FREE</span> : `₹${pyq.price}`}
                                        </div>
                                        <button
                                            onClick={() => handleExplore(pyq.id)}
                                            className="px-6 py-3 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-500 transition-all transform active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-600/20"
                                        >
                                            {pyq.price === 0 ? <ExternalLink size={18} /> : <Lock size={18} />}
                                            EXPLORE
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default PYQsDiscoveryPage;
