import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Lock, Loader2, Search, PenTool, PlayCircle } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplaceService';

interface PYQ {
    id: string;
    title: string;
    category: string;
    year: string;
    type?: 'pdf' | 'test';
    fileUrl?: string;
    testId?: string;
    price: number;
}

const StudentPYQsPage = () => {
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const navigate = useNavigate();
    const [pyqs, setPyqs] = useState<PYQ[]>([]);
    const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [buyingId, setBuyingId] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser) {
            // Fetch purchases
            const purchasesRef = collection(db, 'users', currentUser.uid, 'purchases');
            const unsubscribePurchases = onSnapshot(purchasesRef, (snapshot) => {
                // Check either testId or itemId (for future compatibility)
                const ids = new Set(snapshot.docs.map(doc => doc.data().testId || doc.data().itemId));
                setPurchasedIds(ids);
            });

            // Fetch PYQs
            const q = query(collection(db, 'pyqs')); // Removed orderBy to check for index issues
            const unsubscribePyqs = onSnapshot(q, (snapshot) => {
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
                console.log("PYQs Subscription Data:", fetched);
                if (fetched.length === 0) {
                    console.warn("PYQs collection is empty in Firestore.");
                }
                setPyqs(fetched);
                setIsLoading(false);
            }, (error) => {
                console.error("PYQ subscription error:", error);
                setIsLoading(false);
                alert("Error loading PYQs: " + error.message);
            });

            return () => {
                unsubscribePurchases();
                unsubscribePyqs();
            };
        }
    }, [currentUser]);

    const handleBuy = async (pyq: PYQ) => {
        if (!currentUser) return;
        setBuyingId(pyq.id);
        try {
            await marketplaceService.enrollInItem(currentUser.uid, {
                id: pyq.id,
                title: pyq.title,
                price: pyq.price,
                type: 'pyq'
            });
            alert('Unlocked successfully!');
        } catch (error) {
            console.error("Purchase failed", error);
            alert('Failed to unlock.');
        } finally {
            setBuyingId(null);
        }
    };

    const filteredPyqs = pyqs.filter(item => {
        const search = searchTerm.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(search);
        const categoryMatch = item.category?.toLowerCase().includes(search);
        const yearMatch = item.year?.toString().toLowerCase().includes(search);
        return titleMatch || categoryMatch || yearMatch;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            className="max-w-7xl mx-auto space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#17274B]">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Previous Year Questions</h1>
                    <p className="text-slate-400 font-medium text-sm mt-1">Practice with authentic questions from past exams.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#38BDF8] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search PYQs by exam, year..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[#0B152B] border border-[#17274B] rounded-2xl text-white placeholder-slate-500 font-bold text-xs focus:outline-none focus:border-[#38BDF8] shadow-sm transition-all"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-24"><Loader2 className="animate-spin text-[#38BDF8]" size={40} /></div>
            ) : filteredPyqs.length === 0 ? (
                <div className="text-center py-24 bg-[#0B152B] rounded-[32px] border border-[#17274B] text-slate-400 font-medium text-sm">
                    No PYQs found matching your criteria.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPyqs.map((pyq) => {
                        const isUnlocked = pyq.price === 0 || purchasedIds.has(pyq.id);
                        const isTest = pyq.type === 'test';

                        return (
                            <motion.div
                                key={pyq.id}
                                variants={itemVariants}
                                className="bg-[#0B152B] rounded-[28px] border border-[#17274B] p-6 hover:border-[#38BDF8]/40 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-5">
                                        <div className={`p-3.5 rounded-2xl border ${
                                            isUnlocked 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}>
                                            {isTest ? <PenTool size={22} /> : <FileText size={22} />}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-[#10224A] text-[#38BDF8] border border-[#1E3A75] rounded-full">
                                            {pyq.category}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-white text-lg tracking-tight mb-2">{pyq.title}</h3>
                                    <p className="text-xs font-semibold text-slate-400 mb-6 flex items-center gap-2">
                                        <span>{pyq.year}</span>
                                        <span>•</span>
                                        <span className="text-[#38BDF8]">{isTest ? 'Interactive Test' : 'PDF Document'}</span>
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-[#17274B] flex items-center justify-between">
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Access</span>
                                        <span className="font-black text-white text-lg">
                                            {pyq.price === 0 ? 'Free' : `₹${pyq.price}`}
                                        </span>
                                    </div>
                                    {isUnlocked ? (
                                        isTest ? (
                                            <button
                                                onClick={() => {
                                                    const message = `Are you sure you want to attempt "${pyq.title}"? The timer will start immediately.`;
                                                    if (window.confirm(message)) {
                                                        const path = (pyq as any).isOMR
                                                            ? `/dashboard/omr-attempt/${pyq.testId}`
                                                            : `/dashboard/attempt/${pyq.testId}`;
                                                        navigate(path);
                                                    }
                                                }}
                                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                                            >
                                                <PlayCircle size={15} /> Attempt
                                            </button>
                                        ) : (
                                            <a
                                                href={pyq.fileUrl || "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2.5 bg-[#10224A] hover:bg-blue-600 text-white text-xs font-black uppercase tracking-wider rounded-xl border border-[#1E3A75] hover:border-transparent flex items-center gap-2 transition-all cursor-pointer"
                                            >
                                                <Download size={15} /> Download
                                            </a>
                                        )
                                    ) : (
                                        <button
                                            onClick={() => handleBuy(pyq)}
                                            disabled={buyingId === pyq.id}
                                            className="px-5 py-2.5 bg-gradient-to-r from-[#FF7A00] to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-60"
                                        >
                                            {buyingId === pyq.id ? <Loader2 className="animate-spin" size={15} /> : <Lock size={15} />}
                                            Unlock
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};
export default StudentPYQsPage;
