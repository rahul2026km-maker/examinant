import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc, addDoc } from 'firebase/firestore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, AlertCircle, Loader2, Mail, Lock, Phone, Globe, Star, CheckCircle, User, Eye, EyeOff, X, Smartphone, ShieldCheck } from 'lucide-react';
import logo from '../assets/logo.png';
import studentBanner from '../assets/student_banner.png';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // OTP Modal & Login States
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [modalError, setModalError] = useState('');
    const [mobile, setMobile] = useState('');
    const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);

    const openOtpModal = () => {
        setIsOtpModalOpen(true);
        setModalError('');
        setError('');
        setMobile('');
    };

    const handleCompleteMobileLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');
        const cleanMobile = mobile.replace(/\D/g, '');
        if (!cleanMobile || cleanMobile.length !== 10) {
            setModalError('Please enter a valid 10-digit mobile number.');
            return;
        }

        setLoading(true);
        try {
            const from = (location.state as any)?.from || '/';

            if (pendingGoogleUser) {
                // Save mobile number under Google User UID
                const userDocRef = doc(db, 'users', pendingGoogleUser.uid);
                const userDoc = await getDoc(userDocRef);
                const existingData = userDoc.exists() ? userDoc.data() : {};

                await setDoc(userDocRef, {
                    fullName: pendingGoogleUser.displayName || existingData.fullName || 'Student',
                    email: pendingGoogleUser.email || existingData.email || '',
                    mobile: cleanMobile,
                    role: existingData.role || 'student',
                    status: existingData.status || 'active',
                    createdAt: existingData.createdAt || new Date(),
                    joinedDate: existingData.joinedDate || new Date(),
                    updatedAt: new Date()
                }, { merge: true });

                setIsOtpModalOpen(false);
                setPendingGoogleUser(null);

                if (existingData.role === 'admin') {
                    navigate('/admin-dashboard');
                } else {
                    navigate(from);
                }
            } else {
                // Standalone Mobile Number login
                const q = query(collection(db, 'users'), where('mobile', '==', cleanMobile));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const existingDoc = querySnapshot.docs[0];
                    const existingData = existingDoc.data();
                    if (existingData.status === 'blocked') {
                        await auth.signOut();
                        setModalError('Your account is blocked. Please contact admin.');
                        setLoading(false);
                        return;
                    }
                    setIsOtpModalOpen(false);
                    if (existingData.role === 'admin') {
                        navigate('/admin-dashboard');
                    } else {
                        navigate(from);
                    }
                } else {
                    const newRef = doc(collection(db, 'users'));
                    await setDoc(newRef, {
                        fullName: `User ${cleanMobile.slice(-4)}`,
                        mobile: cleanMobile,
                        role: 'student',
                        status: 'active',
                        createdAt: new Date(),
                        joinedDate: new Date()
                    });
                    setIsOtpModalOpen(false);
                    navigate(from);
                }
            }
        } catch (err: any) {
            console.error("Login failed:", err);
            setModalError('Failed to complete login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (!auth) {
            setError('Firebase is not configured. Please check your .env file for valid keys.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            const from = (location.state as any)?.from || '/';

            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.status === 'blocked') {
                    await auth.signOut();
                    setError('Your account is blocked. Please contact admin.');
                    setLoading(false);
                    return;
                }
                if (userData.mobile && userData.mobile.length === 10) {
                    if (userData.role === 'admin') {
                        navigate('/admin-dashboard');
                    } else {
                        navigate(from);
                    }
                    setLoading(false);
                    return;
                }
            }

            // Google sign-in succeeded, open popup modal to enter mobile number
            setPendingGoogleUser(user);
            setIsOtpModalOpen(true);
            setModalError('');
            setMobile('');
        } catch (err: any) {
            console.error("Google sign in failed:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Google sign-in window was closed. Please click "Google" again to select your account.');
            } else {
                setError(err.message || 'Google sign in failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!auth) {
            setError('Firebase is not configured. Please check your .env file for valid keys.');
            return;
        }

        if (!email.trim() || !password) {
            setError('Please enter both email and password.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

            const from = (location.state as any)?.from || '/';

            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role === 'admin') {
                    navigate('/admin-dashboard');
                } else {
                    navigate(from);
                }
            } else {
                // Fallback if no user doc found, though this shouldn't typically happen for valid users
                navigate(from);
            }
        } catch (err: any) {
            console.error('Login error details:', err);
            const errorCode = err.code || '';
            if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
                setError('Incorrect email or password. If you do not have an account, please Sign Up or log in with Google.');
            } else if (errorCode === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again in a few minutes or reset your password using "Forgot password?".');
            } else if (errorCode === 'auth/user-disabled') {
                setError('Your account has been disabled. Please contact support or admin.');
            } else {
                setError(err.message || 'Failed to log in. Please check your credentials.');
            }
        }

        setLoading(false);
    };

    return (
        <div className="h-screen w-full bg-[#070D1E] relative overflow-hidden font-sans">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />
            
            <div className="w-full h-full overflow-y-auto overflow-x-hidden relative z-10 scrollbar-hide">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full min-h-full bg-[#070D1E] flex flex-col md:flex-row"
                >
                {/* Left Side - Graphics */}
                <div className="hidden md:flex flex-col w-5/12 relative overflow-hidden p-10 justify-between">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-[#0B152B] to-[#040814] z-0" />
                    
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10 z-0 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[size:24px_24px]" />
                    
                    <img
                        src={studentBanner}
                        alt="Education Hero"
                        className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay scale-105"
                    />

                    {/* Top Content */}
                    <div className="relative z-20">
                        {/* Logo on Left Side */}
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="mb-12"
                        >
                            <Link to="/" className="inline-flex items-center gap-3 group">
                                <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 group-hover:bg-white/20 transition-all">
                                    <img src={logo} alt="Examinantt" className="h-8 w-8 rounded-xl object-contain" />
                                </div>
                                <span className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                                    Examinantt
                                </span>
                            </Link>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-sm font-semibold text-white mb-8 shadow-xl"
                        >
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Welcome Back
                        </motion.div>

                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-4xl lg:text-5xl font-black text-white leading-[1.15] mb-6 tracking-tight"
                        >
                            Continue Your <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Journey</span>
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-slate-300 text-lg max-w-sm font-medium"
                        >
                            Pick up right where you left off. Access your mocks, analytics, and track your progress.
                        </motion.p>
                    </div>

                    {/* Bottom Features */}
                    <div className="relative z-20 space-y-4">
                        {[
                            { title: 'Smart Analytics', icon: <Star size={18} className="text-yellow-400" /> },
                            { title: 'Chapter-wise Mocks', icon: <CheckCircle size={18} className="text-green-400" /> },
                            { title: 'Expert Guidance', icon: <User size={18} className="text-blue-300" /> }
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
                            <div className="p-2 bg-blue-600/50 rounded-lg">
                                <Globe className="text-white" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-blue-200 font-medium">Global</p>
                                <p className="text-white font-bold text-sm">Community</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-center bg-[#0B152B] border-l border-[#17254E] min-h-full">
                    <div className="max-w-[420px] w-full mx-auto flex flex-col justify-center py-6">

                        <div className="mb-5">
                            <h2 className="text-3xl font-extrabold text-white mb-1.5 tracking-tight">Welcome Back!</h2>
                            <p className="text-slate-400 font-medium text-sm">Please enter your details to sign in.</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="mb-5 p-3 bg-red-500/15 backdrop-blur-sm border border-red-500/30 rounded-xl flex items-start gap-2 text-red-400 text-xs font-medium shadow-sm"
                            >
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <div className="mb-5">
                            <div className="flex gap-3">
                                <motion.button
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#0E1B38] border border-[#1E3360] hover:bg-[#13244a] text-slate-200 font-bold py-2.5 rounded-xl transition-all group text-xs shadow-sm cursor-pointer"
                                >
                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    Google
                                </motion.button>

                                <motion.button
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    type="button"
                                    onClick={() => window.open('https://play.google.com/store/apps/details?id=com.examinantt.studentapp', '_blank')}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#0E1B38] border border-[#1E3360] hover:bg-[#13244a] text-slate-200 font-bold py-2.5 rounded-xl transition-all group text-xs shadow-sm cursor-pointer"
                                >
                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2.868 2.072L16.273 13.483L19.5 10.256L2.868 2.072Z" fill="#32A071"/>
                                        <path d="M2.868 21.928l16.632-8.184-3.227-3.227L2.868 21.928z" fill="#F1514F"/>
                                        <path d="M22.25 12c0-.525-.26-.983-.65-1.25L2.868 2.072A1.47 1.47 0 002 3.428v17.143c0 .81.66 1.47 1.47 1.47.26 0 .5-.07.72-.18l18.06-8.88c.39-.27.65-.73.65-1.25z" fill="#4B90E3"/>
                                        <path d="M19.5 10.256l2.75 1.744c.39.267.65.725.65 1.25s-.26.983-.65 1.25l-2.75 1.744-3.227-3.227 3.227-2.761z" fill="#F5C029"/>
                                    </svg>
                                    Play Store
                                </motion.button>
                            </div>
                            
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="relative flex items-center justify-center mt-6 mb-1"
                            >
                                <div className="absolute inset-x-0 h-px bg-[#17254E]"></div>
                                <span className="relative bg-[#0B152B] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Or continue with email</span>
                            </motion.div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-300 ml-1 mb-1 inline-block">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                        <Mail size={18} strokeWidth={2.5} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-[42px] pr-4 py-3 bg-[#0E1B38] border border-[#1E3360] rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 transition-all text-white text-sm font-medium placeholder:text-slate-500 hover:border-[#253f75]"
                                    />
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-300 ml-1 mb-1 inline-block">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                        <Lock size={18} strokeWidth={2.5} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-[42px] pr-12 py-3 bg-[#0E1B38] border border-[#1E3360] rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 transition-all text-white text-sm font-medium placeholder:text-slate-500 hover:border-[#253f75]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center justify-between text-sm py-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-4 h-4 rounded border-[#1E3360] bg-[#0E1B38] text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                    <span className="text-slate-400 font-medium group-hover:text-slate-300 transition-colors">Remember for 30 days</span>
                                </label>
                                <Link to="/forgot-password" className="font-bold text-blue-400 hover:text-blue-300 hover:underline">Forgot password?</Link>
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                disabled={loading}
                                type="submit"
                                className="w-full relative group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-3 text-sm cursor-pointer"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
                                    {!loading && <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />}
                                </span>
                            </motion.button>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 text-center text-sm text-slate-400 font-medium">
                                Don't have an account? <Link to="/signup" state={location.state} className="text-blue-400 hover:text-blue-300 font-bold hover:underline transition-all">Sign Up</Link>
                            </motion.div>
                        </form>
                    </div>
                </div>
                </motion.div>
            </div>

            {/* Firebase Recaptcha Container */}
            <div id="recaptcha-container"></div>

            {/* Mobile OTP Popup Modal */}
            <AnimatePresence>
                {isOtpModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", duration: 0.3 }}
                            className="w-full max-w-md bg-[#0B152B] border border-[#1E3360] text-white rounded-2xl shadow-2xl overflow-hidden p-6 relative"
                        >
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setIsOtpModalOpen(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>

                            {/* Modal Header */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                                    <Smartphone size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-white tracking-tight">
                                        {pendingGoogleUser ? 'Enter Mobile Number' : 'Enter Mobile Number'}
                                    </h3>
                                    <p className="text-slate-400 text-xs font-medium">
                                        {pendingGoogleUser 
                                            ? `Logged in as ${pendingGoogleUser.email}. Please verify mobile number to complete.` 
                                            : 'Log in using OTP sent to your phone'}
                                    </p>
                                </div>
                            </div>

                            {pendingGoogleUser && (
                                <div className="mb-4 p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-xs font-semibold text-green-400">
                                    <CheckCircle size={16} className="shrink-0" />
                                    <span>Google Email Verified: {pendingGoogleUser.email}</span>
                                </div>
                            )}

                            {modalError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-start gap-2 text-red-400 text-xs font-medium"
                                >
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{modalError}</span>
                                </motion.div>
                            )}

                            <form onSubmit={handleCompleteMobileLogin} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Mobile Number</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-xs font-bold text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-md">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            maxLength={10}
                                            required
                                            autoFocus
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                                            placeholder="9876543210"
                                            className="w-full pl-20 pr-4 py-3 bg-[#0E1B38] border border-[#1E3360] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm font-semibold tracking-wider placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || mobile.length !== 10}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Complete Login'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoginPage;
