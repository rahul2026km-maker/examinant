import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    FileText,
    Plus,
    BookOpen,
    HelpCircle,
    TrendingUp,
    Loader2,
    Award,
    Calendar,
    ArrowUpRight,
    Zap,
    Layout
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, type DashboardStats } from '../../services/dashboardService';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<number[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const [stats, analytics] = await Promise.all([
                    dashboardService.getDashboardStats(),
                    dashboardService.getAnalyticsData()
                ]);
                setDashboardStats(stats);
                setChartData(analytics);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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

    const stats = [
        {
            label: 'Total Students',
            value: dashboardStats?.totalStudents.toLocaleString() || '0',
            trend: 'Registered base',
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            indicator: 'Growth'
        },
        {
            label: 'Active Series',
            value: dashboardStats?.activeTestSeries.toLocaleString() || '0',
            trend: 'Live catalog',
            icon: Layout,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            indicator: 'Catalog'
        },
        {
            label: 'Question Bank',
            value: dashboardStats?.totalQuestions.toLocaleString() || '0',
            trend: 'Verified items',
            icon: HelpCircle,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            indicator: 'Inventory'
        },
        {
            label: 'Total Chapters',
            value: dashboardStats?.totalChapters.toLocaleString() || '0',
            trend: 'Curriculum',
            icon: BookOpen,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            indicator: 'Structure'
        }
    ];

    const quickActions = [
        { label: 'Test Series', icon: Plus, path: '/admin-dashboard/test-series', description: 'Create new series' },
        { label: 'Mock Test', icon: FileText, path: '/admin-dashboard/create-test', description: 'Draft assessment' },
        { label: 'Q Bank', icon: Zap, path: '/admin-dashboard/question-bank', description: 'Update inventory' },
        { label: 'Subjects', icon: Award, path: '/admin-dashboard/subjects', description: 'Curate catalog' },
    ];

    if (isLoading) {
        return (
            <div className="h-96 flex justify-center items-center">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <motion.div
            className="max-w-7xl mx-auto space-y-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Platform <span className="text-blue-600">Overview</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Monitoring Examinantt's growth and metrics.</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-xs font-black uppercase tracking-widest text-slate-500">
                    <Calendar size={16} className="text-blue-600" />
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        variants={itemVariants}
                        className="bg-white rounded-2xl p-4 border border-slate-100 relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white`}>
                                <stat.icon size={20} />
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                {stat.indicator}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">{stat.value}</h3>
                            <p className="text-xs font-bold text-slate-500 mb-2">{stat.label}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                                <TrendingUp size={12} />
                                <span>{stat.trend}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Analytics Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-12">
                        <div className="space-y-1">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Engagement</h2>
                            <p className="text-xs text-slate-500 font-medium">Daily student activity across the platform.</p>
                        </div>
                        <select className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 px-4 py-2 cursor-pointer outline-none hover:bg-slate-100 transition-all">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>

                    <div className="h-64 w-full flex items-end justify-between px-2 gap-4">
                        {chartData.map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end group h-full relative">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                    className="w-full bg-slate-50 rounded-2xl relative overflow-hidden group-hover:bg-blue-600 transition-all duration-500"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </motion.div>
                                {/* Tooltip */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-xl">
                                    {height} Users
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-8 text-[10px] font-black text-slate-400 px-2 uppercase tracking-widest">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={itemVariants} className="space-y-8">
                    <div className="space-y-1">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Quick Actions</h2>
                        <p className="text-xs text-slate-500 font-medium">Efficiently manage platform data.</p>
                    </div>

                    <div className="grid gap-4">
                        {quickActions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => navigate(action.path)}
                                className="group w-full p-6 bg-white border border-slate-100 rounded-3xl flex items-center justify-between hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 text-left"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 flex items-center justify-center">
                                        <action.icon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 tracking-tight text-sm">{action.label}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{action.description}</p>
                                    </div>
                                </div>
                                <ArrowUpRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                            </button>
                        ))}
                    </div>

                    <div className="p-8 bg-slate-900 rounded-[32px] text-white relative overflow-hidden group cursor-pointer" onClick={() => navigate('/admin-dashboard/students')}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/40 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10 flex flex-col gap-4">
                            <h3 className="font-black text-lg tracking-tight">User Management</h3>
                            <p className="text-xs text-blue-100/60 font-medium leading-relaxed">
                                Review student performance and manage access permissions.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                                View All Students <ArrowUpRight size={12} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
