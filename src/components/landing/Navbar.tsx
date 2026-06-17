import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/logo.png';
import { getAllTestSeries } from '../../services/testSeriesService';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [testCategories, setTestCategories] = useState<string[]>([]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        const fetchCategories = async () => {
            try {
                const data = await getAllTestSeries({ status: 'published' });
                const categories = Array.from(new Set(data.map(item => item.examCategory).filter(Boolean)));
                setTestCategories(categories as string[]);
            } catch (err) {
                console.error("Failed to fetch test categories", err);
            }
        };
        fetchCategories();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { label: 'Home', path: '/' },
        { label: 'Tests', path: '/test-series', hasDropdown: true },
        { label: 'Courses', path: '/test-series' },
        { label: 'Our Products', path: '/#test-series' },
        { label: 'Rankers', path: '/test-series' },
        { label: 'Resources', path: '/resources', hasDropdown: true },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled
                ? 'bg-[#1E3A8A]/95 backdrop-blur-xl border-b border-white/5 py-4 shadow-xl'
                : 'bg-[#173A7A] py-4 shadow-lg border-b border-white/5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-2.5 cursor-pointer z-10"
                        onClick={() => navigate('/')}
                    >
                        <img src={logo} alt="Examinantt Logo" className="w-10 h-10 rounded-lg" />
                        <span className="text-xl font-black text-white tracking-tight uppercase">
                            Examinantt
                        </span>
                    </motion.div>

                    {/* Desktop Links */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => (
                            <div key={item.label} className="relative group">
                                <button
                                    onClick={() => {
                                        if (item.hasDropdown) {
                                            setActiveDropdown(activeDropdown === item.label ? null : item.label);
                                        } else {
                                            navigate(item.path);
                                            setActiveDropdown(null);
                                        }
                                    }}
                                    className={`px-4 py-2 text-[13px] font-bold transition-all duration-300 flex items-center gap-1.5 ${isActive(item.path) || activeDropdown === item.label
                                        ? 'text-white'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {item.label}
                                    {item.hasDropdown && <ChevronDown size={14} className={`opacity-50 transition-transform duration-300 ${activeDropdown === item.label ? 'rotate-180' : ''}`} />}
                                </button>

                                {/* Dropdown Menu */}
                                {item.hasDropdown && activeDropdown === item.label && (
                                    <div className="absolute top-full left-0 mt-2 w-56 bg-[#173A7A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {item.label === 'Tests' && (
                                            <>
                                                <button onClick={() => { navigate('/test-series'); setActiveDropdown(null); }} className="w-full text-left px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5">All Tests</button>
                                                {testCategories.map(cat => (
                                                    <button key={cat} onClick={() => { navigate(`/test-series?category=${encodeURIComponent(cat)}`); setActiveDropdown(null); }} className="w-full text-left px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5 capitalize">
                                                        {cat}
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                        {item.label === 'Resources' && (
                                            <>
                                                <button onClick={() => { navigate('/resources'); setActiveDropdown(null); }} className="w-full text-left px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5">PYQ Papers</button>
                                                <button onClick={() => { navigate('/resources'); setActiveDropdown(null); }} className="w-full text-left px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Study Material</button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center gap-4 z-10">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2.5 text-[13px] font-black text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-black shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition-all active:scale-95"
                        >
                            Sign Up Free
                        </button>
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
                            {navItems.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        navigate(item.path);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`w-full text-left px-5 py-4 rounded-2xl text-base font-bold transition-all ${isActive(item.path)
                                        ? 'bg-blue-600/10 text-blue-500'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-4 text-white font-black border border-white/10 rounded-2xl"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20"
                            >
                                Sign Up Free
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
