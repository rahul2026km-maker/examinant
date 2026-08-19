import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/logo.png';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase';
import { examService, EXAM_SUBCATEGORIES } from '../../services/examService';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;

    const handleNav = (path: string) => {
        navigate(path);
        if (!path.includes('#')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [testCategories, setTestCategories] = useState<string[]>([]);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [mobileActiveDropdown, setMobileActiveDropdown] = useState<string | null>(null);
    const [mobileActiveCategory, setMobileActiveCategory] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        const unsubscribeExams = examService.subscribe((records) => {
            const subcategories = Object.values(EXAM_SUBCATEGORIES)
                .flat()
                .map(sub => sub.toLowerCase());
            const filtered = records
                .map(r => r.name)
                .filter(name => !subcategories.includes(name.toLowerCase()));
            setTestCategories(filtered);
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            unsubscribeExams();
        };
    }, []);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            handleNav('/');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const navItems = [
        { label: 'Home', path: '/' },
        { label: 'Tests', path: '/test-series', hasDropdown: true },
        { label: 'Courses', path: '/courses' },
        { label: 'Our Products', path: '/#test-series' },
        { label: 'Rankers', path: '/test-series' },
        { label: 'Resources', path: '/resources', hasDropdown: true },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
                ? 'bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/10 py-3 shadow-2xl'
                : 'bg-[#173A7A] py-4 shadow-lg border-b border-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-3 cursor-pointer z-10"
                        onClick={() => handleNav('/')}
                    >
                        <img src={logo} alt="Examinantt Logo" className="w-10 h-10 rounded-xl shadow-md" />
                        <span className="text-2xl font-extrabold text-white tracking-tight uppercase drop-shadow-sm">
                            Examinantt
                        </span>
                    </motion.div>

                    {/* Desktop Links */}
                    <div className="hidden lg:flex items-center gap-1.5">
                        {navItems.map((item) => (
                            <div key={item.label} className="relative group">
                                <button
                                    onClick={() => {
                                        if (item.hasDropdown) {
                                            setActiveDropdown(activeDropdown === item.label ? null : item.label);
                                        } else {
                                            handleNav(item.path);
                                            setActiveDropdown(null);
                                        }
                                    }}
                                    className={`px-4 py-2 text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${isActive(item.path) || activeDropdown === item.label
                                        ? 'text-white'
                                        : 'text-slate-300 hover:text-white'
                                        }`}
                                >
                                    {item.label}
                                    {item.hasDropdown && <ChevronDown size={14} className={`opacity-70 transition-transform duration-300 ${activeDropdown === item.label ? 'rotate-180' : ''}`} />}
                                </button>

                                {/* Dropdown Menu */}
                                {item.hasDropdown && activeDropdown === item.label && (
                                    <div 
                                        className={`absolute top-full left-0 mt-3 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-visible py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
                                            item.label === 'Tests' && testCategories.length > 8 ? 'w-[32rem]' : 'w-56'
                                        }`}
                                        onMouseLeave={() => setHoveredCategory(null)}
                                    >
                                        {item.label === 'Tests' && (
                                            <div className={testCategories.length > 8 ? 'grid grid-cols-2 gap-x-1' : 'space-y-0.5'}>
                                                <button 
                                                    onClick={() => { handleNav('/test-series'); setActiveDropdown(null); }} 
                                                    className="col-span-full text-left px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                                                    onMouseEnter={() => setHoveredCategory(null)}
                                                >
                                                    All Tests
                                                </button>
                                                {testCategories.map(cat => {
                                                    const hasSubs = !!EXAM_SUBCATEGORIES[cat];
                                                    return (
                                                        <div 
                                                            key={cat} 
                                                            className="relative"
                                                            onMouseEnter={() => setHoveredCategory(cat)}
                                                        >
                                                            <button 
                                                                onClick={() => { 
                                                                    handleNav(`/test-series?category=${encodeURIComponent(cat)}`); 
                                                                    setActiveDropdown(null); 
                                                                }} 
                                                                className="w-full text-left px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5 capitalize flex justify-between items-center"
                                                            >
                                                                <span>{cat}</span>
                                                                {hasSubs && <ChevronRight size={14} className="opacity-50" />}
                                                            </button>

                                                            {/* Sub-dropdown for Desktop */}
                                                            {hasSubs && hoveredCategory === cat && (
                                                                <div className="absolute left-full top-0 ml-1 w-48 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-left-2 duration-150">
                                                                    {EXAM_SUBCATEGORIES[cat].map(sub => (
                                                                        <button
                                                                            key={sub}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleNav(`/test-series?category=${encodeURIComponent(cat)}&subcategory=${encodeURIComponent(sub)}`);
                                                                                setActiveDropdown(null);
                                                                            }}
                                                                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                                                                        >
                                                                            {sub}
                                                                        </button>
                                                                    ))}
                                                                 </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {item.label === 'Resources' && (
                                            <>
                                                <button onClick={() => { handleNav('/resources'); setActiveDropdown(null); }} className="w-full text-left px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5" onMouseEnter={() => setHoveredCategory(null)}>PYQ Papers</button>
                                                <button onClick={() => { handleNav('/resources'); setActiveDropdown(null); }} className="w-full text-left px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors" onMouseEnter={() => setHoveredCategory(null)}>Study Material</button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center gap-3 z-10">
                        {currentUser ? (
                            <>
                                <button
                                    onClick={() => handleNav('/dashboard')}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-500 hover:shadow-blue-500/40 transition-all active:scale-95"
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-6 py-2 text-sm font-bold text-slate-200 hover:text-white border border-white/20 rounded-full hover:bg-white/10 transition-all"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleNav('/login')}
                                    className="px-6 py-2 text-sm font-bold text-white border border-white/20 rounded-full hover:bg-white/10 hover:border-white/40 transition-all"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => handleNav('/signup')}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-500 hover:shadow-blue-500/40 transition-all active:scale-95"
                                >
                                    Sign Up Free
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden z-10">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="bg-white/5 p-2 rounded-xl border border-white/10 text-white"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden absolute top-full left-0 w-full bg-[#1E3A8A] border-b border-white/5 shadow-2xl p-6"
                    >
                        <div className="space-y-2">
                            {navItems.map((item) => {
                                const isDropdownOpen = mobileActiveDropdown === item.label;
                                return (
                                    <div key={item.label} className="w-full">
                                        <button
                                            onClick={() => {
                                                if (item.hasDropdown) {
                                                    setMobileActiveDropdown(isDropdownOpen ? null : item.label);
                                                } else {
                                                    handleNav(item.path);
                                                    setMobileMenuOpen(false);
                                                }
                                            }}
                                            className={`w-full text-left px-5 py-4 rounded-2xl text-base font-bold transition-all flex justify-between items-center ${isActive(item.path) || isDropdownOpen
                                                ? 'bg-blue-600/10 text-blue-500'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <span>{item.label}</span>
                                            {item.hasDropdown && <ChevronDown size={18} className={`opacity-50 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />}
                                        </button>

                                        {/* Mobile Submenu */}
                                        {item.hasDropdown && isDropdownOpen && (
                                            <div className="pl-6 pr-2 py-2 space-y-2 border-l border-white/10 ml-5 mt-1">
                                                {item.label === 'Tests' && (
                                                    <>
                                                        <button 
                                                            onClick={() => { handleNav('/test-series'); setMobileMenuOpen(false); }} 
                                                            className="w-full text-left py-2 text-sm font-semibold text-slate-300 hover:text-white"
                                                        >
                                                            All Tests
                                                        </button>
                                                        {testCategories.map(cat => {
                                                            const hasSubs = !!EXAM_SUBCATEGORIES[cat];
                                                            const isCatOpen = mobileActiveCategory === cat;
                                                            return (
                                                                <div key={cat} className="w-full">
                                                                    <div className="flex justify-between items-center py-2">
                                                                        <button 
                                                                            onClick={() => { 
                                                                                handleNav(`/test-series?category=${encodeURIComponent(cat)}`); 
                                                                                setMobileMenuOpen(false); 
                                                                            }} 
                                                                            className="text-left text-sm font-semibold text-slate-300 hover:text-white capitalize"
                                                                        >
                                                                            {cat}
                                                                        </button>
                                                                        {hasSubs && (
                                                                            <button 
                                                                                onClick={() => setMobileActiveCategory(isCatOpen ? null : cat)}
                                                                                className="p-1 hover:bg-white/5 rounded"
                                                                            >
                                                                                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isCatOpen ? 'rotate-180' : ''}`} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {hasSubs && isCatOpen && (
                                                                        <div className="pl-4 py-1 space-y-2 border-l border-white/5 ml-2 mt-1">
                                                                            {EXAM_SUBCATEGORIES[cat].map(sub => (
                                                                                <button
                                                                                    key={sub}
                                                                                    onClick={() => {
                                                                                        handleNav(`/test-series?category=${encodeURIComponent(cat)}&subcategory=${encodeURIComponent(sub)}`);
                                                                                        setMobileMenuOpen(false);
                                                                                    }}
                                                                                    className="w-full text-left py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
                                                                                >
                                                                                    {sub}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                                {item.label === 'Resources' && (
                                                    <>
                                                        <button onClick={() => { handleNav('/resources'); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-sm font-semibold text-slate-300 hover:text-white">PYQ Papers</button>
                                                        <button onClick={() => { handleNav('/resources'); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-sm font-semibold text-slate-300 hover:text-white">Study Material</button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-4">
                            {currentUser ? (
                                <>
                                    <button
                                        onClick={() => { handleNav('/dashboard'); setMobileMenuOpen(false); }}
                                        className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20"
                                    >
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                        className="w-full py-4 text-white font-black border border-white/10 rounded-2xl"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => { handleNav('/login'); setMobileMenuOpen(false); }}
                                        className="w-full py-4 text-white font-black border border-white/10 rounded-2xl"
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => { handleNav('/signup'); setMobileMenuOpen(false); }}
                                        className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20"
                                    >
                                        Sign Up Free
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
