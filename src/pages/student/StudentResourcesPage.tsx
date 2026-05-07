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
                key: 'rzp_test_S7lSvWtu89c6zD',
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
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <Sparkles size={20} className="fill-blue-600" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Curated Resources</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Vault</h1>
                    <p className="text-slate-500 font-medium">Access exclusive notes, video lectures, and premium materials.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="relative group">
                        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-80 pl-14 pr-8 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all font-bold text-sm shadow-sm"
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
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xl'
                            : 'bg-white text-slate-500 border-slate-100 hover:border-blue-600 hover:text-blue-600'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Resources Grid */}
            {isLoading ? (
                <div className="flex justify-center py-32">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                </div>
            ) : filteredResources.length === 0 ? (
                <div className="text-center py-32 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm text-slate-300">
                        <BookOpen size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Empty Vault</h3>
                    <p className="text-slate-500 font-medium">No resources found matching your current filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filteredResources.map((resource) => {
                        const isUnlocked = resource.isFree || purchasedIds.has(resource.id);
                        const price = resource.price || 0;

                        return (
                            <motion.div
                                key={resource.id}
                                variants={itemVariants}
                                className="group relative bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white`}>
                                        {getIcon(resource.type)}
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isUnlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {resource.isFree ? 'Public' : isUnlocked ? 'Unlocked' : `₹${price}`}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{resource.category}</div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                                        {resource.title}
                                    </h3>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3">
                                        {resource.description}
                                    </p>
                                </div>

                                <div className="mt-auto">
                                    {isUnlocked ? (
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-between px-8 py-5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-3xl hover:bg-blue-600 transition-all duration-300"
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
                                            className="w-full group/btn relative flex items-center justify-between px-8 py-5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-3xl overflow-hidden transition-all active:scale-95 shadow-xl shadow-blue-500/20"
                                        >
                                            <div className="absolute inset-0 bg-slate-900 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
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
