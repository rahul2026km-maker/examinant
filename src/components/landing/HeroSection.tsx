import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Users, FileText, Trophy, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import omrImage from '../../assets/omr-sheet1.png';

const HeroSection = ({ onGetStarted }: { onGetStarted?: () => void }) => {
    const navigate = useNavigate();

    const stats = [
        { icon: <Users className="w-5 h-5 text-blue-500" />, value: "10,000+", label: "Aspirants" },
        { icon: <FileText className="w-5 h-5 text-indigo-500" />, value: "1 Lakh+", label: "Tests Attempted" },
        { icon: <Trophy className="w-5 h-5 text-yellow-500" />, value: "500+", label: "Toppers" },
        { icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />, value: "100%", label: "Secure" },
    ];

    const scrollToAI = () => {
        const el = document.getElementById('ai-simulation');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <section className="relative min-h-screen flex flex-col justify-center bg-[#0B0F19] overflow-hidden pt-32 pb-20">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

            {/* Glowing Accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left Side: Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                            <Sparkles className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-semibold text-blue-400 tracking-wide">
                                India's Most Advanced Exam Platform
                            </span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-[4rem] font-bold text-white leading-[1.1] tracking-tight">
                            Master your exams with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Real OMR</span> practice.
                        </h1>

                        <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                            Experience the real exam environment at home. Scan your OMR sheets instantly and get AI-powered analytics to identify your weak spots.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button
                                onClick={() => onGetStarted ? onGetStarted() : navigate('/signup')}
                                className="px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2 group"
                            >
                                Start Practicing Now
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={scrollToAI}
                                className="px-8 py-4 bg-slate-800/50 text-white font-semibold rounded-xl border border-slate-700 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                <Play className="w-5 h-5" fill="currentColor" />
                                See How it Works
                            </button>
                        </div>

                        <div className="flex items-center gap-4 pt-6 text-sm text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>No credit card required</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Instant AI Analysis</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side: Visuals */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative"
                    >
                        {/* Main Container */}
                        <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-3 shadow-2xl">
                            <div className="bg-slate-800/80 rounded-xl border border-slate-700/50 overflow-hidden relative group shadow-inner">
                                {/* Top Bar */}
                                <div className="h-10 bg-slate-900/80 border-b border-slate-700/50 flex items-center px-4 gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    <div className="ml-4 text-xs font-medium text-slate-400">examinant-scanner.app</div>
                                </div>

                                {/* OMR Sheet Display */}
                                <div className="p-8 bg-slate-800/30 flex justify-center items-center relative overflow-hidden min-h-[350px]">
                                    <div className="relative w-full max-w-[280px] h-full rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] group-hover:scale-[1.02] transition-transform duration-500 bg-white min-h-[300px]">
                                        <img
                                            src={omrImage}
                                            alt="OMR Sheet"
                                            className="w-full h-full min-h-[300px] object-cover rounded-lg bg-slate-200"
                                        />

                                        {/* Scanning Effect */}
                                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_2px_rgba(59,130,246,0.9)] animate-scan"></div>
                                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/20 to-transparent animate-scan-gradient pointer-events-none"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Analytics Card */}
                            <motion.div
                                animate={{ y: [-5, 5, -5] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-12 left-1/2 -translate-x-1/2 sm:-bottom-8 sm:-left-8 sm:translate-x-0 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-xl p-4 sm:p-5 shadow-2xl z-20 w-[90%] sm:w-64 max-w-[260px] sm:max-w-none"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-sm font-semibold text-slate-200">Analysis Complete</div>
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Accuracy</span>
                                            <span className="text-emerald-400 font-medium">92%</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                                            <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Score</span>
                                            <span className="text-blue-400 font-medium">650/720</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                                            <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: '90%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-24 pt-10 border-t border-slate-800"
                >
                    <div className="flex flex-wrap justify-center sm:justify-between items-center gap-8">
                        {stats.map((stat, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                                    {stat.icon}
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-white">{stat.value}</div>
                                    <div className="text-sm text-slate-400">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes scan-gradient {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 3s ease-in-out infinite;
                }
                .animate-scan-gradient {
                    animation: scan-gradient 3s ease-in-out infinite;
                }
            `}</style>
        </section>
    );
};

export default HeroSection;

