import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Calendar, CreditCard, Filter, Mail, Phone, BookOpen, User, IndianRupee } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface PurchaseRecord {
    id: string;
    userId: string;
    studentName: string;
    studentEmail: string;
    studentMobile?: string;
    seriesId: string;
    seriesTitle: string;
    category: string;
    price: number;
    purchaseDate: any;
    status: string;
    paymentId: string;
    paymentStatus: string;
}

const AdminPaymentsPage = () => {
    const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Free'>('All');

    useEffect(() => {
        const fetchPurchases = async () => {
            setIsLoading(true);
            try {
                const purchasesRef = collection(db, 'purchases');
                const q = query(purchasesRef, orderBy('purchaseDate', 'desc'));
                const snapshot = await getDocs(q);
                
                const data = snapshot.docs.map(doc => {
                    const docData = doc.data();
                    return {
                        id: doc.id,
                        ...docData,
                        purchaseDate: docData.purchaseDate?.toDate ? docData.purchaseDate.toDate() : new Date(docData.purchaseDate)
                    } as PurchaseRecord;
                });
                
                setPurchases(data);
            } catch (error) {
                console.error("Error fetching global purchases:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPurchases();
    }, []);

    // Filter purchases
    const filteredPurchases = purchases.filter(record => {
        const matchesSearch = 
            record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.seriesTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (record.paymentId && record.paymentId.toLowerCase().includes(searchTerm.toLowerCase()));

        const isPaid = record.price > 0;
        const matchesFilter = 
            paymentFilter === 'All' ||
            (paymentFilter === 'Paid' && isPaid) ||
            (paymentFilter === 'Free' && !isPaid);

        return matchesSearch && matchesFilter;
    });

    // Stats calculations
    const totalSales = purchases.length;
    const paidSales = purchases.filter(p => p.price > 0).length;
    const freeSales = totalSales - paidSales;
    const totalRevenue = purchases.reduce((acc, curr) => acc + (curr.price || 0), 0);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <motion.div
            className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Transactions & Payments</h1>
                    <p className="text-slate-500 mt-1">Monitor all user course purchases, payments, and enrollments.</p>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <IndianRupee size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">₹{totalRevenue.toLocaleString()}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{totalSales}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Enrollments</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{paidSales}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid Sales</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <User size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{freeSales}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Free Enrollments</div>
                    </div>
                </div>
            </div>

            {/* List and Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by student, course, payment ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex items-center">
                            <Filter size={16} className="absolute left-3 text-slate-400" />
                            <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value as any)}
                                className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer text-sm"
                            >
                                <option value="All">All Types</option>
                                <option value="Paid">Paid Only</option>
                                <option value="Free">Free Only</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Transaction Date</th>
                                <th className="px-6 py-4">Student Info</th>
                                <th className="px-6 py-4">Test Series</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Gateway & ID</th>
                                <th className="px-6 py-4">Payment Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <Loader2 className="animate-spin inline text-blue-600" size={32} />
                                    </td>
                                </tr>
                            ) : filteredPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                                        No purchase transactions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredPurchases.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                        {/* Date */}
                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                <div>
                                                    <div className="font-medium text-slate-700">
                                                        {record.purchaseDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold">
                                                        {record.purchaseDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Student Info */}
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-bold text-slate-800">{record.studentName}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Mail size={10} className="text-slate-400" /> {record.studentEmail}
                                                </div>
                                                {record.studentMobile && (
                                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Phone size={10} className="text-slate-400" /> {record.studentMobile}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        {/* Test Series */}
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-semibold text-slate-800">{record.seriesTitle}</div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <BookOpen size={10} /> {record.category}
                                                </div>
                                            </div>
                                        </td>
                                        {/* Amount */}
                                        <td className="px-6 py-4 font-extrabold text-slate-800 whitespace-nowrap">
                                            {record.price > 0 ? (
                                                <span className="text-blue-600">₹{record.price}</span>
                                            ) : (
                                                <span className="text-emerald-600 font-bold">Free</span>
                                            )}
                                        </td>
                                        {/* Gateway & Payment ID */}
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                                            {record.price > 0 ? (
                                                <div>
                                                    <div className="text-[10px] text-indigo-600 font-black tracking-widest uppercase">Razorpay</div>
                                                    <div className="text-slate-600 select-all">{record.paymentId}</div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Free Activation</span>
                                            )}
                                        </td>
                                        {/* Status */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                                record.paymentStatus === 'completed'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : record.paymentStatus === 'free'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    record.paymentStatus === 'completed'
                                                        ? 'bg-blue-500'
                                                        : record.paymentStatus === 'free'
                                                        ? 'bg-emerald-500'
                                                        : 'bg-yellow-500'
                                                }`}></span>
                                                {record.paymentStatus === 'completed' ? 'Paid' : record.paymentStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminPaymentsPage;
