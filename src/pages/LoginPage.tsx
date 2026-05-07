import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle, Loader2, Mail, Lock, Smartphone, Globe } from 'lucide-react';
import logo from '../assets/logo.png';
import chartGraphic from '../assets/chart_graphic.png';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!auth) {
            setError('Firebase is not configured. Please check your .env file for valid keys.');
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role === 'admin') {
                    navigate('/admin-dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                // Fallback if no user doc found, though this shouldn't typically happen for valid users
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            setError('Failed to log in. Please check your credentials.');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white w-full max-w-[1000px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[600px]"
            >
                {/* Left Side - Graphics for Login */}
                <div className="hidden md:flex flex-col w-1/2 bg-indigo-900 relative overflow-hidden text-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-blue-900/90 z-10" />
                    <img
                        src={chartGraphic}
                        alt="Analytics Dashboard"
                        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay scale-110"
                    />

                    {/* Decorative Elements */}
                    <div className="absolute top-12 right-12 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 z-20 animate-pulse-slow">
                        <Globe className="text-blue-300" size={28} />
                    </div>

                    <div className="absolute bottom-24 left-12 bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/20 z-20 shadow-xl -rotate-2 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-500 rounded-full p-2 shadow-lg shadow-blue-500/40"><Smartphone size={20} className="text-white" /></div>
                            <div>
                                <p className="text-xs text-blue-100 font-medium uppercase tracking-wider">Mobile Ready</p>
                                <p className="font-bold text-base">Learn Anywhere</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-20 flex flex-col justify-center h-full p-16">
                        <div className="mb-8">
                            <div className="inline-flex items-center gap-2 bg-indigo-800/50 backdrop-blur-md border border-indigo-500/30 rounded-full px-4 py-1.5 text-xs font-bold text-indigo-100 mb-6 uppercase tracking-wider shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                AI-Powered Learning
                            </div>
                            <h2 className="text-4xl font-extrabold leading-tight mb-6">
                                Welcome Back to <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">Examinantt</span>
                            </h2>
                            <p className="text-indigo-100/80 text-lg leading-relaxed max-w-sm">
                                Resume your preparation and track your progress with our detailed analytics.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white">
                    <div className="max-w-md mx-auto w-full">
                        <div className="text-center mb-10">
                            <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
                                <span className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                                    <img src={logo} alt="Examinantt" className="h-8 w-8 rounded-lg" />
                                </span>
                                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                    Examinantt
                                </span>
                            </Link>
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back!</h2>
                            <p className="text-slate-500">Please enter your details.</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm"
                            >
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 block ml-1">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 block ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                    <span className="text-slate-600 group-hover:text-slate-800 transition-colors">Remember for 30 days</span>
                                </label>
                                <Link to="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Forgot password?</Link>
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                                {!loading && <ChevronRight size={20} />}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-slate-600 text-sm">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                                    Sign up for free
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
