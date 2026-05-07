import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, AlertCircle, Loader2, Mail, CheckCircle2, Sparkles } from 'lucide-react';
import logo from '../assets/logo.png';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const authContext = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!authContext?.resetPassword) {
            setError('System configuration error. Please try again later.');
            return;
        }

        try {
            setMessage('');
            setError('');
            setLoading(true);
            await authContext.resetPassword(email);
            setMessage('Check your inbox for further instructions.');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email address.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                setError('Failed to reset password. ' + (err.message || 'Please try again.'));
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white w-full max-w-[500px] rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 p-8 md:p-12"
            >
                <div className="text-center mb-10">
                    <Link to="/login" className="inline-flex items-center gap-2 mb-8 group">
                        <span className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                            <img src={logo} alt="Examinantt" className="h-8 w-8 rounded-lg" />
                        </span>
                        <span className="text-2xl font-black text-slate-900 tracking-tight">
                            Examinantt
                        </span>
                    </Link>
                    
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                        <Sparkles size={14} className="fill-blue-600" />
                        Account Recovery
                    </div>
                    
                    <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Forgot Password?</h2>
                    <p className="text-slate-500 font-medium">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm font-bold"
                    >
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </motion.div>
                )}

                {message && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 p-6 bg-emerald-50 border border-emerald-100 rounded-[32px] flex flex-col items-center text-center gap-3 text-emerald-700"
                    >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-500">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="font-bold">{message}</span>
                        <Link to="/login" className="text-xs font-black uppercase tracking-widest text-emerald-800 hover:underline mt-2">Back to Login</Link>
                    </motion.div>
                )}

                {!message && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-bold text-sm placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full relative group/btn h-14 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl overflow-hidden transition-all active:scale-95 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                        >
                            <div className="absolute inset-0 bg-slate-900 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative z-10 flex items-center gap-2">
                                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Send Reset Link'}
                            </span>
                        </button>
                    </form>
                )}

                <div className="mt-10 text-center">
                    <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-colors">
                        <ChevronLeft size={16} />
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
