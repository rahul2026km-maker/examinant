import { type ReactNode, useState, useEffect } from 'react';
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
    Mail,
    CreditCard,
    Home,
    Bookmark,
    Gift,
    Crown,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import logo from '../assets/logo.png';
import { examService, DEFAULT_EXAMS } from '../services/examService';

interface DashboardLayoutProps {
    children: ReactNode;
    role: 'student' | 'admin';
}

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [examsList, setExamsList] = useState<string[]>(DEFAULT_EXAMS);
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;
    const profileData = authContext?.profileData;
    const selectedExam = authContext?.selectedExam || 'SSC';
    const setSelectedExam = authContext?.setSelectedExam || (() => {});
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (role === 'student') {
            const unsubscribe = examService.subscribe((records) => {
                const names = records.map(r => r.name);
                setExamsList(names.length > 0 ? names : DEFAULT_EXAMS);
                
                // If current selected exam is not in list, set to first available
                const activeList = names.length > 0 ? names : DEFAULT_EXAMS;
                if (!activeList.includes(selectedExam)) {
                    const fallback = activeList[0] || 'SSC';
                    setSelectedExam(fallback);
                }
            });
            return unsubscribe;
        }
    }, [role, selectedExam, setSelectedExam]);

    const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        console.log("Exam selector changed in layout to:", val);
        setSelectedExam(val);
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    // Sidebar sections matching the reference image for Student role
    const studentSections = [
        {
            title: 'Dashboard',
            links: [
                { icon: <Home size={18} />, label: 'Dashboard', path: '/dashboard' },
                { icon: <TrendingUp size={18} />, label: 'Analytics', path: '/dashboard/analytics' },
            ]
        },
        {
            title: 'Learning',
            links: [
                { icon: <FileText size={18} />, label: 'My Tests', path: '/dashboard/tests' },
                { icon: <ListChecks size={18} />, label: 'Test Series', path: '/dashboard/market' },
                { icon: <BookMarked size={18} />, label: 'PYQs', path: '/dashboard/pyqs' },
                { icon: <BookOpen size={18} />, label: 'Books & eBooks', path: '/dashboard/resources' },
            ]
        },
        {
            title: 'Personal',
            links: [
                { icon: <Bookmark size={18} />, label: 'Bookmarks', path: '/dashboard/bookmarks' },
                { icon: <Gift size={18} />, label: 'Rewards', path: '/dashboard/rewards' },
                { icon: <Bell size={18} />, label: 'Notices & Updates', path: '/dashboard/notices' },
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
                { icon: <CreditCard size={18} />, label: 'Payments', path: '/admin-dashboard/payments' },
                { icon: <Mail size={18} />, label: 'Inquiries', path: '/admin-dashboard/inquiries' },
                { icon: <Settings size={18} />, label: 'Settings', path: '/admin-dashboard/settings' },
            ]
        }
    ];

    const fullName = profileData?.fullName || profileData?.displayName || currentUser?.displayName || 'Aditya';
    const firstLetter = fullName.charAt(0).toUpperCase();
    const sections = role === 'admin' ? adminSections : studentSections;

    return (
        <div className="min-h-screen flex bg-[#F4F7FE] text-slate-800 font-sans">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:sticky top-0 h-screen w-64 z-50 transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    flex flex-col shadow-xl md:shadow-none print:hidden bg-white border-r border-slate-100/80
                `}
            >
                {/* Header / Logo */}
                <div className="px-6 pt-6 pb-6 flex items-center gap-3">
                    <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain shadow-sm shrink-0" />
                    <div className="min-w-0">
                        <h2 className="text-[20px] font-black text-[#0B1E43] tracking-tight leading-none">
                            Examinantt
                        </h2>
                        <p className="text-[9px] font-black text-[#FF7A00] uppercase tracking-widest mt-1">
                            ACE YOUR EXAMS
                        </p>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide space-y-4">
                    {sections.map((section, idx) => (
                        <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between px-2 mb-1">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{section.title}</h3>
                                <div className="w-12 h-px bg-slate-100"></div>
                            </div>
                            <div className="space-y-0.5">
                                {section.links.map((link) => {
                                    const isActive = location.pathname === link.path;
                                    return (
                                        <NavLink
                                            key={link.label}
                                            to={link.path}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={`
                                                flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-[13px]
                                                ${isActive
                                                    ? 'bg-[#0B1E43] text-white font-semibold shadow-md shadow-blue-900/10'
                                                    : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900'
                                                }
                                            `}
                                        >
                                            <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>
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

                {/* Sidebar Gold Card Upgrade section for student */}
                {role === 'student' && (
                    <div className="px-4 mb-4">
                        <div className="p-4 bg-gradient-to-b from-[#FFFDF9] to-[#FFF6E9] border border-[#FFE8CC] rounded-2xl shadow-sm text-center relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-12 h-12 bg-[#FF7A00]/5 rounded-full blur-md"></div>
                            <div className="inline-flex p-2.5 bg-[#FFF0DB] rounded-full text-[#FF7A00] mb-3">
                                <Crown size={20} className="fill-[#FF7A00]/20" />
                            </div>
                            <h4 className="text-xs font-black text-slate-800 tracking-tight">Examinantt Gold</h4>
                            <p className="text-[10px] text-slate-500 font-medium mt-1 leading-snug">
                                Unlock All Tests & Premium Features
                            </p>
                            <button className="w-full mt-3 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FF9E3D] hover:opacity-95 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-sm transition-all duration-300">
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                )}

                {/* Sidebar Footer Logout */}
                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-xl text-slate-500 font-semibold text-[13px] hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut size={16} className="rotate-180" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header (Top Nav with Quote, Badge, Profile) */}
                <header className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between bg-[#F4F7FE] print:hidden">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Top Quote */}
                        <div className="hidden xl:flex items-center gap-1.5 text-slate-700 italic font-semibold max-w-xl">
                            <span className="text-xl font-bold text-slate-400">“</span>
                            <span className="text-[13px] leading-none text-slate-600">Success is the sum of small efforts, repeated every day.</span>
                            <span className="text-[13px] font-bold text-slate-500 not-italic ml-1">— Examinantt</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4.5 ml-auto">
                        {/* Target Exam Selector Dropdown */}
                        {role === 'student' && (
                            <div className="hidden md:flex items-center gap-2 bg-white px-3.5 py-1.5 border border-slate-100 rounded-xl shadow-sm hover:border-slate-200 transition-all cursor-pointer">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Target Exam</span>
                                <select 
                                    value={selectedExam}
                                    onChange={handleExamChange}
                                    className="text-xs font-black text-[#0B1E43] bg-transparent outline-none cursor-pointer border-none py-0.5 pr-1 focus:ring-0"
                                >
                                    {examsList.map((examName) => (
                                        <option key={examName} value={examName}>{examName}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Gold Badge */}
                        {role === 'student' && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
                                <div className="p-1 bg-[#FFF0DB] rounded-full text-[#FF7A00]">
                                    <Crown size={12} className="fill-[#FF7A00]/20" />
                                </div>
                                <div className="text-left pr-1">
                                    <div className="flex items-center gap-1">
                                        <p className="text-[10px] font-black text-slate-800 leading-none">Examinantt</p>
                                        <ChevronDown size={10} className="text-slate-400" />
                                    </div>
                                    <p className="text-[8px] font-medium text-slate-400">Trusted by 1M+ Aspirants</p>
                                </div>
                            </div>
                        )}

                        {/* Notification Button */}
                        <button className="relative p-2.5 rounded-xl bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 shadow-sm transition-all">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF7A00] rounded-full ring-2 ring-white"></span>
                        </button>
                        
                        <div className="h-6 w-px bg-slate-200"></div>

                        {/* Profile Selector */}
                        <div className="flex items-center gap-2.5 px-1 py-1 rounded-xl hover:bg-white/50 transition-all cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white uppercase">
                                {firstLetter}
                            </div>
                            <div className="text-left hidden md:block">
                                <div className="flex items-center gap-1">
                                    <p className="text-xs font-bold text-[#0B1E43] leading-none">
                                        {fullName}
                                    </p>
                                    <ChevronDown size={12} className="text-slate-400" />
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                    {role === 'admin' ? 'Admin' : 'Student'}
                                </p>
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



