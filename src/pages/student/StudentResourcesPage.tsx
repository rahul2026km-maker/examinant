import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, ExternalLink, Loader2, BookOpen, Lock, Sparkles, ChevronRight, PlayCircle } from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { loadRazorpay } from '../../utils/razorpay';
import { marketplaceService } from '../../services/marketplaceService';

interface Resource {
    id: string;
    title: string;
    description: string;
    type: 'pdf' | 'video' | 'link';
    category: string;
    url: string;
    isFree: boolean;
    price?: number;
    createdAt: any;
}

const StudentResourcesPage = () => {
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const [resources, setResources] = useState<Resource[]>([]);
    const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [buyingId, setBuyingId] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) return;

        const purchasesRef = collection(db, 'users', currentUser.uid, 'purchases');
        const unsubscribePurchases = onSnapshot(purchasesRef, (snapshot) => {
            const ids = new Set(snapshot.docs.map(doc => doc.data().itemId));
            setPurchasedIds(ids);
        });

        const q = query(collection(db, 'resources'));
        const unsubscribeResources = onSnapshot(q, (snapshot) => {
            const fetchedResources = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Resource[];
            setResources(fetchedResources);
            setIsLoading(false);
        }, (error) => {
            console.error("Resources subscription error:", error);
            setIsLoading(false);
        });

        return () => {
            unsubscribePurchases();
            unsubscribeResources();
        };
    }, [currentUser]);

    const handleBuy = async (resource: Resource) => {
        if (!currentUser) return;
        setBuyingId(resource.id);
        try {
            const res = await loadRazorpay();
            if (!res) {
                alert('Razorpay SDK failed to load.');
                setBuyingId(null);
                return;
            }

            const options = {
                key: 'rzp_live_TAGGnZwDvZubIP',
                amount: (resource.price || 0) * 100,
                currency: 'INR',
                name: 'Examinant',
                description: `Unlock ${resource.title}`,
                image: 'https://examinantt.web.app/logo192.png',
                handler: async function (_response: any) {
                    try {
                        await marketplaceService.enrollInItem(currentUser.uid, {
                            id: resource.id,
                            title: resource.title,
                            price: resource.price || 0,
                            type: 'resource'
                        });
                    } catch (err) {
                        console.error("Enrollment error:", err);
                    }
                },
                prefill: {
                    name: currentUser.displayName || 'Student',
                    email: currentUser.email || '',
                },
                theme: { color: '#2563eb' }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();
        } catch (error) {
            console.error("Payment failed:", error);
        } finally {
            setBuyingId(null);
        }
    };

    const categories = ['All', ...Array.from(new Set(resources.map((r: Resource) => r.category)))];

    const filteredResources = resources.filter((item: Resource) => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText size={22} />;
            case 'video': return <PlayCircle size={22} />;
            default: return <ExternalLink size={22} />;
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            className="max-w-7xl mx-auto space-y-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#38BDF8] mb-2">
                        <Sparkles size={20} className="fill-[#38BDF8]" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Curated Resources</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Resource Vault</h1>
                    <p className="text-slate-400 font-medium">Access exclusive notes, video lectures, and premium materials.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="relative group">
                        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#38BDF8] transition-colors" />
                        <input
                            type="text"
                            placeholder="Find topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-80 pl-14 pr-8 py-4 bg-[#0B152B] border border-[#17274B] text-white placeholder-slate-500 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Category Chips */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 border ${selectedCategory === cat
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-400/30 shadow-lg shadow-blue-600/20'
                            : 'bg-[#0B152B] text-slate-400 border-[#17274B] hover:border-blue-500/40 hover:text-white'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Resources Grid */}
            {isLoading ? (
                <div className="flex justify-center py-32">
                    <Loader2 className="animate-spin text-[#FF7A00]" size={48} />
                </div>
            ) : filteredResources.length === 0 ? (
                <div className="text-center py-32 bg-[#0B152B] rounded-[40px] border border-[#17274B]">
                    <div className="w-20 h-20 bg-[#070D1E] rounded-[28px] border border-[#17274B] flex items-center justify-center mx-auto mb-8 shadow-sm text-slate-400">
                        <BookOpen size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Empty Vault</h3>
                    <p className="text-slate-400 font-medium">No resources found matching your current filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredResources.map((resource) => {
                        const isUnlocked = resource.isFree || purchasedIds.has(resource.id);
                        const price = resource.price || 0;

                        return (
                            <motion.div
                                key={resource.id}
                                variants={itemVariants}
                                className="group relative bg-[#0B152B] rounded-[32px] p-8 border border-[#17274B] shadow-xl hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-[#070D1E] border border-[#17274B] text-[#38BDF8] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
                                            {getIcon(resource.type)}
                                        </div>
                                        <div className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isUnlocked ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-[#38BDF8]'}`}>
                                            {resource.isFree ? 'Public' : isUnlocked ? 'Unlocked' : `₹${price}`}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF7A00]">{resource.category}</div>
                                        <h3 className="text-xl font-black text-white tracking-tight leading-tight group-hover:text-[#38BDF8] transition-colors">
                                            {resource.title}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-400 leading-relaxed line-clamp-3">
                                            {resource.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-[#17274B]/60">
                                    {isUnlocked ? (
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-between px-6 py-4 bg-[#10224A] hover:bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-[#23458A] transition-all duration-300 shadow-md"
                                        >
                                            <span>
                                                {resource.type === 'video' ? 'Play Lecture' : resource.type === 'pdf' ? 'Download PDF' : 'Visit Resource'}
                                            </span>
                                            <ChevronRight size={18} />
                                        </a>
                                    ) : (
                                        <button
                                            onClick={() => handleBuy(resource)}
                                            disabled={buyingId === resource.id}
                                            className="w-full group/btn relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#FF7A00] to-[#FF9E3D] text-white text-xs font-black uppercase tracking-widest rounded-2xl overflow-hidden transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                                        >
                                            <span className="relative z-10 flex items-center gap-2">
                                                {buyingId === resource.id ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
                                                Unlock Item
                                            </span>
                                            <ChevronRight size={18} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
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

export default StudentResourcesPage;
