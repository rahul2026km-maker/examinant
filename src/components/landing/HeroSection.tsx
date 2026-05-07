import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Star, Users, FileText, Trophy, Cpu, ShieldCheck, Sparkles } from 'lucide-react';

const HeroSection = ({ onGetStarted }: { onGetStarted?: () => void }) => {
    const navigate = useNavigate();

    const stats = [
        { icon: <Users size={24} className="text-blue-400" />, value: "10,000+", label: "Aspirants" },
        { icon: <FileText size={24} className="text-indigo-400" />, value: "1 Lakh+", label: "Tests Attempted" },
        { icon: <Trophy size={24} className="text-yellow-400" />, value: "500+", label: "Toppers" },
        { icon: <Cpu size={24} className="text-pink-400" />, value: "AI Powered", label: "Smart Analysis" },
        { icon: <ShieldCheck size={24} className="text-blue-500" />, value: "100% Safe", label: "Secure & Reliable" },
    ];

    const scrollToAI = () => {
        const el = document.getElementById('ai-simulation');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <section className="relative min-h-screen flex flex-col justify-center hero-dark-bg overflow-hidden pt-32 pb-12">
            {/* Background Glows */}
            <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid lg:grid-cols-2 gap-20 items-center mb-24">

                    {/* Left Side: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                AI-Powered Semi-Offline Mock Test Platform
                                <Sparkles size={12} className="fill-blue-400" />
                            </span>
                        </div>

                        <h1 className="text-6xl sm:text-7xl font-black text-white leading-[1.05] tracking-tight">
                            Crack <span className="text-blue-500">NEET, JEE, SSC</span> Like It's <br />
                            The <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">Real Exam.</span>
                        </h1>

                        <p className="text-lg text-slate-400 max-w-xl leading-relaxed font-medium">
                            Practice online, solve on real OMR sheets, and get <span className="text-blue-400 font-bold">AI-powered analysis</span> with rank prediction.
                        </p>

                        <div className="flex flex-wrap gap-5 pt-4">
                            <button
                                onClick={() => onGetStarted ? onGetStarted() : navigate('/signup')}
                                className="px-10 py-5 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3 group"
                            >
                                Start Free Test
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={scrollToAI}
                                className="px-10 py-5 bg-white/5 text-white font-black text-sm uppercase tracking-widest rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center gap-3"
                            >
                                Watch Demo
                                <Play size={20} fill="currentColor" />
                            </button>
                        </div>

                        {/* Social Proof */}
                        <div className="flex items-center gap-6 pt-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-12 h-12 rounded-full border-2 border-[#030712] overflow-hidden bg-slate-800">
                                        <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div className="flex text-yellow-400 gap-0.5 mb-1">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    10,000+ Aspirants are preparing smarter <br /> with Examinantt
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side: Visual Stack */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative"
                    >
                        {/* Main Dashboard Card */}
                        <div className="relative z-10 glass-card-dark rounded-[40px] p-6 border border-white/10 shadow-2xl overflow-hidden group">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>
                                <div className="bg-white/5 px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">NEET UG</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Overall Score</div>
                                    <div className="text-3xl font-black text-white tracking-tighter">632 <span className="text-sm opacity-30">/ 720</span></div>
                                </div>
                                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Accuracy</div>
                                    <div className="text-3xl font-black text-emerald-500 tracking-tighter">91.3%</div>
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 h-48 relative overflow-hidden">
                                <div className="flex justify-between items-end h-full gap-2 pt-10">
                                    {[30, 60, 45, 90, 75, 85].map((h, i) => (
                                        <div key={i} className="flex-1 bg-blue-600/20 rounded-t-lg relative">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                transition={{ duration: 1.5, delay: 0.5 + (i * 0.1) }}
                                                className="absolute bottom-0 w-full bg-blue-600 rounded-t-lg"
                                            ></motion.div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* OMR Sheet Graphic */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -bottom-16 -left-12 z-20 w-80 rotate-[-15deg] shadow-2xl"
                        >
                            <div className="bg-white p-6 rounded-3xl shadow-2xl overflow-hidden">
                                <div className="space-y-3 opacity-30">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="flex gap-2">
                                            <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                                            <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                                            <div className="w-4 h-4 rounded-full border border-slate-300 bg-slate-900"></div>
                                            <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-900 uppercase">OMR Sheet</span>
                                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                                        <Sparkles size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -top-12 -left-4 text-blue-500 font-bold italic text-sm tracking-tight whitespace-nowrap rotate-[15deg]">
                                Real OMR Practice <br />
                                Real Results!
                                <motion.div
                                    animate={{ rotate: [0, 5, 0] }}
                                    className="text-4xl not-italic ml-8 -mt-2"
                                >
                                    ⤵
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Phone Graphic */}
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute -bottom-10 -right-8 z-30 w-56 rotate-[12deg] shadow-2xl"
                        >
                            <div className="bg-slate-900 border-[6px] border-slate-800 rounded-[40px] p-4 h-96 relative overflow-hidden shadow-2xl">
                                <div className="w-16 h-4 bg-slate-800 rounded-full mx-auto mb-6"></div>
                                <div className="text-center space-y-6">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">OMR Uploaded</div>
                                    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                                            <circle cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="314" strokeDashoffset="0" className="text-blue-500" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black text-white tracking-tighter">100%</span>
                                            <span className="text-[8px] font-black text-slate-500 uppercase">Total Time</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Scanning Completed</div>
                                        <div className="text-[10px] font-bold text-white">AI is Analyzing...</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Bottom Stats Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-1 p-10 bg-white/5 border border-white/5 rounded-[40px] backdrop-blur-xl"
                >
                    {stats.map((stat, i) => (
                        <div key={i} className="flex flex-col items-center text-center space-y-3 group">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600/20 transition-all duration-300">
                                {stat.icon}
                            </div>
                            <div className="space-y-1">
                                <div className="text-xl font-black text-white tracking-tighter">{stat.value}</div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;

