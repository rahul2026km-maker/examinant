import { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle2, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { getInquiries, updateInquiryStatus, deleteInquiry, type Inquiry } from '../../services/inquiryService';

const AdminInquiriesPage = () => {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

    const loadInquiries = async () => {
        setIsLoading(true);
        try {
            const data = await getInquiries();
            setInquiries(data);
        } catch (error) {
            console.error("Failed to load inquiries", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInquiries();
    }, []);

    const handleStatusChange = async (id: string, status: 'new' | 'read' | 'resolved') => {
        try {
            await updateInquiryStatus(id, status);
            setInquiries(inquiries.map(inq => inq.id === id ? { ...inq, status } : inq));
            if (selectedInquiry?.id === id) {
                setSelectedInquiry({ ...selectedInquiry, status });
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this inquiry?")) return;
        
        try {
            await deleteInquiry(id);
            setInquiries(inquiries.filter(inq => inq.id !== id));
            if (selectedInquiry?.id === id) {
                setSelectedInquiry(null);
            }
        } catch (error) {
            console.error("Failed to delete inquiry", error);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="h-96 flex justify-center items-center">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contact Inquiries</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage user messages and support requests.</p>
                </div>
                <button 
                    onClick={loadInquiries}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
                    title="Refresh"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inquiry List */}
                <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col h-[600px] shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800">Inbox ({inquiries.length})</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {inquiries.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                No inquiries found.
                            </div>
                        ) : (
                            inquiries.map((inquiry) => (
                                <button
                                    key={inquiry.id}
                                    onClick={() => {
                                        setSelectedInquiry(inquiry);
                                        if (inquiry.status === 'new' && inquiry.id) {
                                            handleStatusChange(inquiry.id, 'read');
                                        }
                                    }}
                                    className={`w-full text-left p-4 border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                                        selectedInquiry?.id === inquiry.id ? 'bg-blue-50/50' : ''
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold truncate pr-2 ${inquiry.status === 'new' ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {inquiry.name}
                                        </h4>
                                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap pt-1">
                                            {formatDate(inquiry.createdAt)}
                                        </span>
                                    </div>
                                    <p className={`text-sm truncate mb-2 ${inquiry.status === 'new' ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                                        {inquiry.subject}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {inquiry.status === 'new' && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                New
                                            </span>
                                        )}
                                        {inquiry.status === 'resolved' && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                Resolved
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Inquiry Detail */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 h-[600px] flex flex-col shadow-sm">
                    {selectedInquiry ? (
                        <>
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/30">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedInquiry.subject}</h2>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="font-semibold text-slate-700">{selectedInquiry.name}</div>
                                        <a href={`mailto:${selectedInquiry.email}`} className="text-blue-600 hover:underline">
                                            {selectedInquiry.email}
                                        </a>
                                        {selectedInquiry.phone && (
                                            <span className="text-slate-500 flex items-center gap-1">
                                                • {selectedInquiry.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                                    {formatDate(selectedInquiry.createdAt)}
                                </div>
                            </div>
                            <div className="p-8 flex-1 overflow-y-auto">
                                <div className="prose prose-slate max-w-none">
                                    <p className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">
                                        {selectedInquiry.message}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-3xl">
                                <div className="flex gap-3">
                                    {selectedInquiry.status !== 'resolved' ? (
                                        <button
                                            onClick={() => selectedInquiry.id && handleStatusChange(selectedInquiry.id, 'resolved')}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors"
                                        >
                                            <CheckCircle2 size={16} /> Mark as Resolved
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => selectedInquiry.id && handleStatusChange(selectedInquiry.id, 'read')}
                                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl flex items-center gap-2 transition-colors"
                                        >
                                            <Clock size={16} /> Reopen
                                        </button>
                                    )}
                                    <a
                                        href={`mailto:${selectedInquiry.email}?subject=Re: ${selectedInquiry.subject}`}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors"
                                    >
                                        <Mail size={16} /> Reply via Email
                                    </a>
                                </div>
                                <button
                                    onClick={() => selectedInquiry.id && handleDelete(selectedInquiry.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    title="Delete Inquiry"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <Mail size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">Select an inquiry to read</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminInquiriesPage;
