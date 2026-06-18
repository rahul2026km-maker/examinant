import { type ReactNode, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
    Mail
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
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const studentSections = [
        {
            title: 'Dashboard',
            links: [
                { icon: <LayoutDashboard size={18} />, label: 'Overview', path: '/dashboard' },
                { icon: <TrendingUp size={18} />, label: 'Analytics', path: '/dashboard/analytics' },
            ]
        },
        {
            title: 'Learning',
            links: [
                { icon: <BookOpen size={18} />, label: 'My Tests', path: '/dashboard/tests' },
                { icon: <Award size={18} />, label: 'Test Results', path: '/dashboard/results' },
                { icon: <FileText size={18} />, label: 'Buy Series', path: '/dashboard/market' },
            ]
        }
    ];

    const adminSections = [
        {
            title: 'Dashboard',
            links: [
                { icon: <LayoutDashboard size={18} />, label: 'Overview', path: '/admin-dashboard' },
            ]
        },
        {
            title: 'Content',
            links: [
                { icon: <ListChecks size={18} />, label: 'Test Series', path: '/admin-dashboard/test-series' },
                { icon: <BookMarked size={18} />, label: 'Question Bank', path: '/admin-dashboard/question-bank' },
                { icon: <FolderTree size={18} />, label: 'Chapters', path: '/admin-dashboard/chapters' },
                { icon: <FileText size={18} />, label: 'Manage PYQs', path: '/admin-dashboard/pyqs' },
                { icon: <Award size={18} />, label: 'Subjects', path: '/admin-dashboard/subjects' },
                { icon: <Award size={18} />, label: 'Exams', path: '/admin-dashboard/exams' },
                { icon: <BookOpen size={18} />, label: 'Resources', path: '/admin-dashboard/resources' },
            ]
        },
        {
            title: 'Management',
            links: [
                { icon: <Users size={18} />, label: 'Students', path: '/admin-dashboard/students' },
                { icon: <Mail size={18} />, label: 'Inquiries', path: '/admin-dashboard/inquiries' },
                { icon: <Settings size={18} />, label: 'Settings', path: '/admin-dashboard/settings' },
            ]
        }
    ];

    const sections = role === 'admin' ? adminSections : studentSections;

    return (
        <div className="min-h-screen flex bg-[#F3F4F6] text-gray-900 font-sans">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-900/40 z-40 md:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:sticky top-0 h-screen w-64 z-50 transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    flex flex-col shadow-2xl md:shadow-none print:hidden bg-white border-r border-gray-200
                `}
            >
                {/* Header / Logo */}
                <div className="px-6 pt-6 pb-6 flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#111827] rounded-lg flex items-center justify-center shadow-sm shrink-0">
                        <img src={logo} alt="Logo" className="w-5 h-5 brightness-0 invert" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-[18px] font-bold text-gray-900 tracking-tight truncate leading-tight">
                            Examinantt
                        </h2>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">
                            {role === 'admin' ? 'Admin' : 'Student'}
                        </p>
                    </div>
                </div>

                {/* Dynamic Navigation Sections */}
                <nav className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide space-y-6">
                    {sections.map((section, idx) => (
                        <div key={idx}>
                            <div className="flex items-center justify-between px-2 mb-2">
                                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{section.title}</h3>
                                <div className="w-4 h-px bg-gray-300"></div>
                            </div>
                            <div className="space-y-1">
                                {section.links.map((link) => {
                                    const isActive = location.pathname === link.path;
                                    return (
                                        <NavLink
                                            key={link.path}
                                            to={link.path}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={`
                                                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px]
                                                ${isActive
                                                    ? 'bg-gray-100 text-gray-900 font-bold'
                                                    : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900'
                                                }
                                            `}
                                        >
                                            <span className={`${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                                                {link.icon}
                                            </span>
                                            <span className="flex-1">{link.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Sidebar Footer Logout */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-50 text-gray-600 font-medium text-[13px] hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut size={16} />
                        <span>Log out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header (Mobile menu & Top right profile) */}
                <header className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between bg-[#F3F4F6] print:hidden">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 rounded-lg bg-white shadow-sm text-gray-600 hover:bg-gray-50"
                        >
                            <Menu size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        <button className="relative p-2 rounded-full text-gray-500 hover:bg-white hover:shadow-sm transition-all">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#F3F4F6]"></span>
                        </button>
                        
                        <div className="h-6 w-px bg-gray-200"></div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-[13px] font-semibold text-gray-900 leading-none">
                                    {currentUser?.displayName || 'User'}
                                </p>
                                <p className="text-[11px] font-medium text-gray-500 mt-1">
                                    {role === 'admin' ? 'Administrator' : 'Student'}
                                </p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white">
                                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 px-6 pb-10 overflow-x-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;


