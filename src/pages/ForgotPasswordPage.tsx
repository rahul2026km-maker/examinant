import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, AlertCircle, Loader2, Mail, CheckCircle2, Sparkles, Globe, Star, CheckCircle, User, Lock, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.png';
import recoveryHero from '../assets/recovery_hero.png';

const ForgotPasswordPage = () => {
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setMessage('');
            setError('');
            setLoading(true);
            
            const response = await fetch('http://localhost:3001/api/request-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to request OTP');
            }
            
            setMessage(data.message);
            setStep('otp');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndReset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setMessage('');
            setError('');
            setLoading(true);
            
            const response = await fetch('http://localhost:3001/api/verify-and-reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }
            
            setMessage(data.message);
            setStep('email'); // Reset back to email step on success
            setOtp('');
            setNewPassword('');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to verify OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/30 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
            
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full min-h-screen bg-white/80 backdrop-blur-xl flex flex-col md:flex-row overflow-hidden relative z-10"
            >
                {/* Left Side - Graphics */}
                <div className="hidden md:flex flex-col w-5/12 relative overflow-hidden p-10 justify-between">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 z-0" />
                    
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10 z-0 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[size:24px_24px]" />
                    
                    <img
                        src={recoveryHero}
                        alt="Account Recovery"
                        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay scale-105"
                    />
                    
                    <div className="relative z-20">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/90 text-sm font-bold tracking-wide mb-8 border border-white/10"
                        >
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                            Account Recovery
                        </motion.div>

                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-4xl lg:text-5xl font-black text-white leading-[1.15] mb-6 tracking-tight"
                        >
                            Get Back to <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">Learning</span>
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-indigo-100 text-lg max-w-sm font-medium"
                        >
                            Don't worry, it happens to the best of us. Let's securely recover your account.
                        </motion.p>
                    </div>

                    {/* Bottom Features */}
                    <div className="relative z-20 space-y-4">
                        {[
                            { title: 'Secure Recovery', icon: <Lock size={18} className="text-blue-400" /> },
                            { title: 'Quick Process', icon: <CheckCircle size={18} className="text-green-400" /> },
                            { title: '24/7 Support', icon: <User size={18} className="text-yellow-300" /> }
                        ].map((feature, i) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + (i * 0.1) }}
                                key={i} 
                                className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 p-3 rounded-2xl hover:bg-white/10 transition-colors"
                            >
                                <div className="p-2 bg-white/10 rounded-xl">
                                    {feature.icon}
                                </div>
                                <span className="text-white font-semibold">{feature.title}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Floating Elements */}
                    <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/4 right-8 bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20 z-20 shadow-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/50 rounded-lg">
                                <Sparkles className="text-white" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-blue-200 font-medium">Fast</p>
                                <p className="text-white font-bold text-sm">Recovery</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-7/12 p-6 md:p-8 lg:p-12 flex flex-col items-center justify-center bg-white h-screen overflow-y-auto">
                    <div className="max-w-[460px] w-full mx-auto flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-10">
                            <Link to="/" className="inline-flex items-center gap-2 group">
                                <div className="p-1.5 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:shadow-md transition-all">
                                    <img src={logo} alt="Examinantt" className="h-7 w-7 rounded-lg object-contain" />
                                </div>
                                <span className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                                    Examinantt
                                </span>
                            </Link>
                            <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors px-4 py-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-all">
                                Log In
                            </Link>
                        </div>
                        
                        <div className="mb-5">
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-1.5 tracking-tight">Forgot Password?</h2>
                            <p className="text-slate-500 font-medium text-sm">Enter your email and we'll send you a link to reset your password.</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="mb-5 p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-xs font-medium shadow-sm"
                            >
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-5 p-4 bg-emerald-50/80 backdrop-blur-sm border border-emerald-100 rounded-xl flex flex-col items-center text-center gap-2 text-emerald-700 shadow-sm"
                            >
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-500 mb-1">
                                    <CheckCircle2 size={20} />
                                </div>
                                <span className="text-sm font-bold">{message}</span>
                            </motion.div>
                        )}

                        {step === 'email' ? (
                            <form onSubmit={handleRequestOTP} className="space-y-4">
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Mail size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 text-sm font-medium placeholder:text-slate-400 hover:border-slate-300 hover:bg-slate-100"
                                        />
                                    </div>
                                </motion.div>

                                <motion.button
                                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                    disabled={loading}
                                    type="submit"
                                    className="w-full relative group overflow-hidden bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-3 text-sm"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Send Reset OTP'}
                                        {!loading && <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />}
                                    </span>
                                </motion.button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyAndReset} className="space-y-4">
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <Mail size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="email"
                                            disabled
                                            value={email}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium cursor-not-allowed opacity-70"
                                        />
                                    </div>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">6-Digit OTP</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Sparkles size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            placeholder="123456"
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 text-sm font-medium placeholder:text-slate-400 hover:border-slate-300 hover:bg-slate-100 tracking-widest"
                                        />
                                    </div>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">New Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 text-sm font-medium placeholder:text-slate-400 hover:border-slate-300 hover:bg-slate-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </motion.div>

                                <motion.button
                                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                    disabled={loading}
                                    type="submit"
                                    className="w-full relative group overflow-hidden bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-3 text-sm"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Reset Password'}
                                        {!loading && <CheckCircle2 size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" />}
                                    </span>
                                </motion.button>
                            </form>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
