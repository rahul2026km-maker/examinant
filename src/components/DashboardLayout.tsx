import { type ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    BookOpen,
    TrendingUp,
    Settings,
    LogOut,
    FileText,
    Users,
    Menu,
    Bell,
    BookMarked,
    FolderTree,
    Award,
    ListChecks,
    Search,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import logo from '../assets/logo.png';

interface DashboardLayoutProps {
    children: ReactNode;
    role: 'student' | 'admin';
}

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const studentLinks = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/dashboard' },
        { icon: <BookOpen size={20} />, label: 'My Tests', path: '/dashboard/tests' },
        { icon: <Award size={20} />, label: 'Test Results', path: '/dashboard/results' },
        { icon: <FileText size={20} />, label: 'Buy Series', path: '/dashboard/market' },
        { icon: <TrendingUp size={20} />, label: 'Analytics', path: '/dashboard/analytics' },
    ];

    const adminLinks = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin-dashboard' },
        { icon: <ListChecks size={20} />, label: 'Test Series', path: '/admin-dashboard/test-series' },
        { icon: <BookMarked size={20} />, label: 'Question Bank', path: '/admin-dashboard/question-bank' },
        { icon: <FolderTree size={20} />, label: 'Chapters', path: '/admin-dashboard/chapters' },
        { icon: <FileText size={20} />, label: 'Manage PYQs', path: '/admin-dashboard/pyqs' },
        { icon: <Award size={20} />, label: 'Subjects', path: '/admin-dashboard/subjects' },
        { icon: <BookOpen size={20} />, label: 'Resources', path: '/admin-dashboard/resources' },
        { icon: <Users size={20} />, label: 'Students', path: '/admin-dashboard/students' },
        { icon: <Settings size={20} />, label: 'Settings', path: '/admin-dashboard/settings' },
    ];

    const links = role === 'admin' ? adminLinks : studentLinks;

    return (
        <div className="min-h-screen flex bg-[#f8fafc] text-slate-900 font-sans">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-[2px]"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:sticky top-0 h-screen w-72 bg-white border-r border-slate-100 z-50 transition-all duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    flex flex-col shadow-2xl md:shadow-none print:hidden
                `}
            >
                {/* Logo Area */}
                <div className="px-8 py-8 flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
                        <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg brightness-0 invert" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight font-heading">
                            Examinantt
                        </h2>
                        <p className="text-[10px] uppercase tracking-widest font-black text-blue-600">
                            {role === 'admin' ? 'Admin' : 'Student'} Hub
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4 scrollbar-hide">
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) => `
                                relative group flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm
                                ${isActive
                                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        {link.icon}
                                    </span>
                                    <span className="flex-1">{link.label}</span>
                                    {isActive && (
                                        <motion.div 
                                            layoutId="activeNavIndicator"
                                            className="absolute right-3 w-1.5 h-1.5 bg-blue-500 rounded-full" 
                                        />
                                    )}
                                    <ChevronRight size={14} className={`opacity-0 transition-all ${!isActive && 'group-hover:opacity-100 group-hover:translate-x-1'}`} />
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-6 border-t border-slate-50">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-all duration-300 group"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="sticky top-0 z-30 px-8 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-100 print:hidden">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100"
                        >
                            <Menu size={20} />
                        </button>
                        
                        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 w-80">
                            <Search size={18} className="text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search everything..." 
                                className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <button className="relative p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all">
                            <Bell size={20} />
                            <span className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
                        </button>
                        
                        <div className="h-8 w-px bg-slate-100 mx-1"></div>
                        
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-slate-900 leading-none">
                                    {currentUser?.displayName || 'Student'}
                                </p>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                                    {role === 'admin' ? 'Administrator' : 'Premium Student'}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-slate-900/10">
                                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 px-8 py-10 overflow-x-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;

