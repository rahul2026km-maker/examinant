import { useState, useEffect } from 'react';
import PageLayout from '../components/landing/PageLayout';
import { FileText, Download, PlayCircle, Loader2, Lock, ExternalLink } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { loadRazorpay } from '../utils/razorpay';

interface Resource {
    id: string;
    title: string;
    description: string;
    type: 'pdf' | 'video' | 'link';
    category: string;
    url: string;
    isFree: boolean;
    price?: number;
}

const FreeResourcesPage = () => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
    const { currentUser } = useAuth() || {};
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Resource[];
            setResources(fetched);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAction = async (resource: Resource) => {
        if (resource.isFree) {
            window.open(resource.url, '_blank');
            return;
        }

        if (!currentUser) {
            navigate('/login');
            return;
        }

        setIsProcessingId(resource.id);
        try {
            const res = await loadRazorpay();
            if (!res) {
                alert('Razorpay SDK failed to load. Are you online?');
                setIsProcessingId(null);
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
                        alert("Success! This resource is now available in your dashboard.");
                        navigate('/dashboard/resources');
                    } catch (err) {
                        console.error("Enrollment error after payment:", err);
                    }
                },
                prefill: {
                    name: currentUser.displayName || 'Student',
                    email: currentUser.email || '',
                },
                theme: { color: '#3399cc' }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();
        } catch (error) {
            console.error("Payment flow failed:", error);
            alert("Failed to initiate payment. Please try again.");
        } finally {
            setIsProcessingId(null);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText size={24} className="text-red-500" />;
            case 'video': return <PlayCircle size={24} className="text-purple-500" />;
            default: return <ExternalLink size={24} className="text-emerald-500" />;
        }
    };

    return (
        <PageLayout>
            <div className="bg-white py-12 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Resources</h1>
                        <p className="text-lg text-gray-600">
                            Access high-quality study materials, formula sheets, and watch revision videos.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">No resources found.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            {resources.map((resource) => (
                                <div key={resource.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow flex items-center justify-between group bg-white">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                                            {getIcon(resource.type)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{resource.title}</h3>
                                            <p className="text-sm text-gray-500 capitalize">{resource.type} • {resource.category}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {!resource.isFree && (
                                            <span className="text-blue-600 font-bold">₹{resource.price}</span>
                                        )}
                                        <button
                                            onClick={() => handleAction(resource)}
                                            disabled={isProcessingId === resource.id}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-70"
                                        >
                                            {isProcessingId === resource.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : resource.isFree ? (
                                                <><Download size={16} /> Free</>
                                            ) : (
                                                <><Lock size={16} /> Unlock</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default FreeResourcesPage;
