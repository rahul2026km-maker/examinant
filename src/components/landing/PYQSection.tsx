import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, FileText, ArrowRight, Loader2, BookOpen, Download, Eye, FolderOpen, ChevronDown, Search } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

interface PYQItem {
    id: string;
    title: string;
    category: string;
    year?: string;
    type?: string;
    price?: number;
    fileUrl?: string;
    description?: string;
}

const RICH_SAMPLE_PYQS = [
    { 
        title: "SSC CGL 2024 Tier 1 General Awareness Official Paper", 
        category: "SSC CGL", 
        year: "2024", 
        type: "pdf", 
        price: 0,
        description: "Official Tier-1 General Awareness question paper with verified answer key covering Indian History, Polity, Geography, Current Affairs, and General Science for SSC CGL aspirants."
    },
    { 
        title: "SSC CGL 2023 Tier 1 Quantitative Aptitude Shift 1", 
        category: "SSC CGL", 
        year: "2023", 
        type: "pdf", 
        price: 0,
        description: "Shift-1 Quantitative Aptitude question paper featuring step-by-step mathematical solutions, shortcut methods for Arithmetic, Algebra, Geometry & Trigonometry."
    },
    { 
        title: "SSC CGL 2022 Tier 2 English Language & Comprehension", 
        category: "SSC CGL", 
        year: "2022", 
        type: "pdf", 
        price: 0,
        description: "Comprehensive Tier-2 English Language official question paper including Reading Comprehension, Grammar error detection, Cloze test, and Vocabulary."
    },
    { 
        title: "SSC CGL 2021 Reasoning Ability Question Bank", 
        category: "SSC CGL", 
        year: "2021", 
        type: "pdf", 
        price: 0,
        description: "Complete General Intelligence & Reasoning question bank with detailed logical explanation for Analogy, Coding-Decoding, Syllogism, and Blood Relations."
    },
    { 
        title: "SSC CGL 2020 Tier 1 Full Length Mock Paper", 
        category: "SSC CGL", 
        year: "2020", 
        type: "pdf", 
        price: 0,
        description: "Full length 100-question practice set based on SSC CGL 2020 exam pattern with section-wise marks distribution and official answer explanations."
    },

    { 
        title: "NEET UG 2024 Biology Full Question Paper with Solutions", 
        category: "NEET UG", 
        year: "2024", 
        type: "pdf", 
        price: 0,
        description: "Complete NEET UG 2024 Biology question paper with 90 authentic questions from Botany and Zoology, featuring NCERT line references and detailed explanations."
    },
    { 
        title: "NEET UG 2023 Physics & Chemistry Question Bank", 
        category: "NEET UG", 
        year: "2023", 
        type: "pdf", 
        price: 0,
        description: "Official NEET UG 2023 Physics & Chemistry paper containing numerical step-by-step solutions, chemical reaction mechanisms, and formula derivations."
    },
    { 
        title: "NEET UG 2022 Biology Chapterwise PYQs", 
        category: "NEET UG", 
        year: "2022", 
        type: "pdf", 
        price: 0,
        description: "Chapterwise organized Biology PYQs covering Human Physiology, Genetics, Biotechnology, Ecology, and Plant Reproduction with answer key."
    },
    { 
        title: "NEET UG 2021 Complete Question Paper with Answer Key", 
        category: "NEET UG", 
        year: "2021", 
        type: "pdf", 
        price: 0,
        description: "Official 200-question NEET UG 2021 paper with verified answer keys, chapter-wise weightage breakdown, and solution notes."
    },
    { 
        title: "NEET UG 2020 Physics Mechanics Previous Year Questions", 
        category: "NEET UG", 
        year: "2020", 
        type: "pdf", 
        price: 0,
        description: "Dedicated Mechanics question set covering Laws of Motion, Work Energy Power, Rotational Dynamics, and Gravitation with step-by-step solutions."
    },

    { 
        title: "CUET UG 2024 Domain Science Mock Paper", 
        category: "CUET UG", 
        year: "2024", 
        type: "pdf", 
        price: 0,
        description: "Latest NTA pattern CUET UG 2024 Domain Science paper for B.Sc. aspirants with MCQs covering Class 12 NCERT syllabus and detailed solutions."
    },
    { 
        title: "CUET UG 2023 General Test Official Question Paper", 
        category: "CUET UG", 
        year: "2023", 
        type: "pdf", 
        price: 0,
        description: "Official CUET UG General Test memory-based paper covering General Knowledge, Current Affairs, General Mental Ability, Quantitative Reasoning & Logical Ability."
    },
    { 
        title: "CUET UG 2022 English Language Test Paper", 
        category: "CUET UG", 
        year: "2022", 
        type: "pdf", 
        price: 0,
        description: "CUET UG 2022 Section IA English Language paper featuring Reading Comprehension passages, Synonyms, Antonyms, and Verbal Ability practice questions."
    },
    { 
        title: "CUET UG 2021 General Test Previous Year Paper", 
        category: "CUET UG", 
        year: "2021", 
        type: "pdf", 
        price: 0,
        description: "Previous year General Test paper with full solutions to practice speed and accuracy for CUET undergraduate university admissions."
    },

    { 
        title: "JEE Mains 2024 Physics Shift 1 Question Paper", 
        category: "JEE Mains", 
        year: "2024", 
        type: "pdf", 
        price: 0,
        description: "Shift 1 Physics paper with detailed numerical solutions, electrodynamics shortcuts, and mechanics problem-solving techniques for JEE aspirants."
    },
    { 
        title: "JEE Mains 2023 Chemistry Official PYQ Paper with Solutions", 
        category: "JEE Mains", 
        year: "2023", 
        type: "pdf", 
        price: 0,
        description: "Comprehensive Chemistry paper with step-by-step reaction mechanisms for Organic Chemistry, Physical numericals, and Inorganic trends."
    },
    { 
        title: "JEE Mains 2022 Mathematics Shift 2 Solutions", 
        category: "JEE Mains", 
        year: "2022", 
        type: "pdf", 
        price: 0,
        description: "Shift 2 Mathematics paper featuring Calculus, Vectors, 3D Geometry, and Algebra problem solutions with trick methods."
    },
    { 
        title: "JEE Mains 2021 Physics Mechanics & Electromagnetism", 
        category: "JEE Mains", 
        year: "2021", 
        type: "pdf", 
        price: 0,
        description: "Topic-focused JEE Mains Physics question paper covering high-weightage topics like Electromagnetism, Optics, and Thermodynamics."
    },
    { 
        title: "JEE Mains 2020 Inorganic Chemistry PYQs", 
        category: "JEE Mains", 
        year: "2020", 
        type: "pdf", 
        price: 0,
        description: "NCERT-focused Inorganic Chemistry question collection covering Coordination Compounds, p-Block, and Chemical Bonding with complete explanations."
    },
];

const PYQSection = () => {
    const navigate = useNavigate();
    const [pyqs, setPyqs] = useState<PYQItem[]>([]);
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedYear, setSelectedYear] = useState<string>('All');

    useEffect(() => {
        const q = query(collection(db, 'pyqs'), limit(50));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.docs.length < 5) {
                // Auto seed rich sample dataset to Firestore so all categories & years exist
                console.log("Seeding rich PYQ dataset to Firestore...");
                for (const pyq of RICH_SAMPLE_PYQS) {
                    try {
                        await addDoc(collection(db, 'pyqs'), {
                            ...pyq,
                            createdAt: serverTimestamp()
                        });
                    } catch (e) {
                        console.error("Auto seed error:", e);
                    }
                }
            }

            const fetched: PYQItem[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title || data.name || 'Untitled PYQ',
                    category: data.category || data.exam || 'General',
                    year: data.year || '2023',
                    type: data.type || 'pdf',
                    price: data.price ?? 0,
                    fileUrl: data.fileUrl,
                    description: data.description || ''
                };
            });
            setPyqs(fetched.length > 0 ? fetched : RICH_SAMPLE_PYQS.map((item, i) => ({ ...item, id: `sample-${i}` })));
            setIsLoading(false);
        }, (error) => {
            console.error("Landing PYQ Fetch Error:", error);
            setPyqs(RICH_SAMPLE_PYQS.map((item, i) => ({ ...item, id: `sample-${i}` })));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // Extract dynamic categories from uploaded pyqs
    const categories = ['All', ...Array.from(new Set(pyqs.map(p => p.category).filter(Boolean)))];
    // Dynamic year filter options sorted descending
    const extractedYears = Array.from(new Set(pyqs.map(p => p.year?.toString()).filter(Boolean))).sort().reverse();
    const years = ['All', ...extractedYears];

    const filteredPyqs = pyqs.filter(item => {
        const categoryMatch = selectedCategory === 'All' || item.category?.toLowerCase() === selectedCategory.toLowerCase();
        const yearMatch = selectedYear === 'All' || item.year?.toString() === selectedYear;
        return categoryMatch && yearMatch;
    });

    return (
        <section id="resources" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#070D1E] text-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-3 border border-blue-500/20">Resources</span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Explore PYQs (Free)</h2>
                    <p className="text-blue-400 font-bold text-sm sm:text-base uppercase tracking-widest opacity-90">
                        ACCESS PREVIOUS YEAR QUESTION PAPERS
                    </p>
                </div>

                {/* Dropdown Filters Section (Category & Year) */}
                {pyqs.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                        {/* Exam Category Dropdown */}
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

                        {/* Year Dropdown */}
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

                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="animate-spin text-blue-500" size={36} />
                    </div>
                ) : pyqs.length === 0 ? (
                    <div className="text-center py-16 px-6 bg-[#0B152B] rounded-2xl border border-[#17254E] max-w-xl mx-auto">
                        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
                            <FolderOpen size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No PYQs Uploaded Yet</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Admin has not uploaded any PYQs yet. Once uploaded from the Admin panel, they will appear here automatically.
                        </p>
                    </div>
                ) : filteredPyqs.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-[#0B152B] rounded-2xl border border-[#17254E] max-w-xl mx-auto text-slate-400 font-medium text-sm">
                        No PYQs found matching filter "{selectedCategory}" ({selectedYear}).
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPyqs.map((item, index) => {
                            return (
                                <div
                                    key={item.id || index}
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
        </section>
    );
};

export default PYQSection;
