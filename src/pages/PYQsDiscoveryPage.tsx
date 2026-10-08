import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, FileText, Loader2, Search, BookOpen, Download, Eye, FolderOpen, ChevronDown } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
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
    description?: string;
}

const PYQsDiscoveryPage = () => {
    const [pyqs, setPyqs] = useState<PYQ[]>([]);
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedYear, setSelectedYear] = useState<string>('All');

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
                    year: data.year || '2023',
                    price: data.price ?? 0,
                    description: data.description || ''
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

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const categories = ['All', ...Array.from(new Set(pyqs.map(p => p.category).filter(Boolean)))];
    const years = ['All', '2024', '2023', '2022', '2021', '2020'];

    const filteredPyqs = pyqs.filter(item => {
        const searchMatch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = selectedCategory === 'All' || item.category?.toLowerCase() === selectedCategory.toLowerCase();
        const yearMatch = selectedYear === 'All' || item.year?.toString() === selectedYear;
        return searchMatch && categoryMatch && yearMatch;
    });

    return (
        <PageLayout>
            <div className="bg-[#070D1E] min-h-screen text-white overflow-hidden relative">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Past Exams</span>
                        </h1>
                        <p className="text-slate-300 max-w-xl mx-auto font-medium text-sm sm:text-base">
                            Authentic repository of Previous Year Questions uploaded by educators.
                        </p>
                    </motion.div>

                    {/* Search Bar & Dropdown Filters */}
                    <div className="max-w-3xl mx-auto mb-10 space-y-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-45 transition duration-300"></div>
                            <div className="relative">
                                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by subject, year or exam name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-13 pr-6 py-4 bg-[#0B152B]/90 backdrop-blur-xl border border-[#17254E] rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm shadow-2xl"
                                />
                            </div>
                        </motion.div>

                        {/* Dropdown Filters */}
                        {pyqs.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                                <div className="relative w-full sm:w-64">
                                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                                        Select Exam / Category
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => {
                                                setSelectedCategory(e.target.value);
                                                setOpenIndex(0);
                                            }}
                                            className="w-full bg-[#0B152B] border border-[#17254E] hover:border-blue-500/50 text-white rounded-xl px-4 py-3 font-bold text-xs focus:outline-none focus:border-blue-500 transition-all cursor-pointer shadow-md appearance-none pr-10"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat} className="bg-[#0B152B] text-white py-2">
                                                    {cat === 'All' ? 'All Exams / Categories' : cat}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="relative w-full sm:w-48">
                                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                                        Select Year
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => {
                                                setSelectedYear(e.target.value);
                                                setOpenIndex(0);
                                            }}
                                            className="w-full bg-[#0B152B] border border-[#17254E] hover:border-blue-500/50 text-white rounded-xl px-4 py-3 font-bold text-xs focus:outline-none focus:border-blue-500 transition-all cursor-pointer shadow-md appearance-none pr-10"
                                        >
                                            {years.map((yr) => (
                                                <option key={yr} value={yr} className="bg-[#0B152B] text-white py-2">
                                                    {yr === 'All' ? 'All Years' : `${yr} Papers`}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="animate-spin text-blue-500" size={40} />
                        </div>
                    ) : filteredPyqs.length === 0 ? (
                        <div className="text-center py-16 px-6 bg-[#0B152B] rounded-2xl border border-[#17254E] max-w-xl mx-auto">
                            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
                                <FolderOpen size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">No PYQs Uploaded Yet</h3>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                No previous year questions match your search or have been uploaded by Admin yet.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPyqs.map((item, index) => {
                                return (
                                    <div
                                        key={item.id}
                                        className="bg-[#0B152B] border border-[#17254E] hover:border-blue-500/40 hover:bg-[#0D1833] rounded-xl p-5 flex flex-col justify-between transition-all duration-200 shadow-md group relative overflow-hidden"
                                    >
                                        <div className="space-y-3">
                                            {/* Top Badges */}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-extrabold px-3 py-1 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                                                    {item.category || 'PYQ'}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-base sm:text-lg font-black text-white leading-snug pt-1">
                                                {item.title}
                                            </h3>

                                            {/* Meta Info */}
                                            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400 pt-1">
                                                <div className="flex items-center gap-1.5">
                                                    <FileText size={14} className="text-blue-400" />
                                                    <span>Year: <strong className="text-white">{item.year || '2023'}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <BookOpen size={14} className="text-blue-400" />
                                                    <span><strong className="text-white">{item.type === 'test' ? 'Online Test' : 'Official PDF Paper'}</strong></span>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p className="text-xs text-slate-300 font-medium leading-relaxed pt-1 line-clamp-3">
                                                {item.description || `Official Previous Year Question paper for ${item.title} containing authentic questions with step-by-step solutions, answer keys, and exam insights.`}
                                            </p>
                                        </div>

                                        {/* Footer Buttons (View & Download) */}
                                        <div className="pt-4 mt-4 border-t border-[#17254E]/60 grid grid-cols-2 gap-2.5">
                                            <button
                                                onClick={() => {
                                                    if (item.fileUrl) {
                                                        window.open(item.fileUrl, '_blank');
                                                    } else {
                                                        alert(`Viewing Paper "${item.title}"`);
                                                    }
                                                }}
                                                className="w-full py-2.5 px-3 rounded-lg bg-[#0E1B38] hover:bg-[#152750] text-blue-400 hover:text-white font-extrabold text-xs uppercase tracking-wider border border-[#1E3360] hover:border-blue-500/50 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                                            >
                                                <Eye size={14} /> View
                                            </button>

                                            <button
                                                onClick={() => {
                                                    if (item.fileUrl) {
                                                        window.open(item.fileUrl, '_blank');
                                                    } else {
                                                        alert(`Downloading PDF for "${item.title}"`);
                                                    }
                                                }}
                                                className="w-full py-2.5 px-3 rounded-lg bg-[#1D64D0] hover:bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-blue-600/30 active:scale-95 cursor-pointer"
                                            >
                                                <Download size={14} /> Download
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default PYQsDiscoveryPage;
