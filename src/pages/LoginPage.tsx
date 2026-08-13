import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc, addDoc } from 'firebase/firestore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle, Loader2, Mail, Lock, Phone, Globe, Star, CheckCircle, User, Eye, EyeOff } from 'lucide-react';
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

    // OTP Login States
    const [loginMethod, setLoginMethod] = useState<'email' | 'mobile'>('email');
    const [mobile, setMobile] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const setupRecaptcha = (containerId: string) => {
        if (!(window as any).recaptchaVerifier) {
            try {
                (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
                    size: 'invisible',
                    callback: () => { }
                });
            } catch (err) {
                console.error("Recaptcha verifier error:", err);
            }
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!mobile || mobile.length !== 10) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }
        if (!auth) {
            setError('Authentication service not available.');
            return;
        }

        setLoading(true);
        try {
            setupRecaptcha('recaptcha-container');
            const appVerifier = (window as any).recaptchaVerifier;
            const formattedPhone = `+91${mobile}`; // Defaulting to India country code

            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            (window as any).confirmationResult = confirmationResult;
            setOtpSent(true);
            alert('OTP code has been sent successfully to your mobile!');
        } catch (err: any) {
            console.error("Failed to send OTP:", err);
            setError(err.message || 'Failed to send OTP. Please check the connection and mobile number.');
            if ((window as any).recaptchaVerifier) {
                try {
                    (window as any).recaptchaVerifier.clear();
                } catch (e) { }
                (window as any).recaptchaVerifier = null;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!otpCode || otpCode.length !== 6) {
            setError('Please enter a valid 6-digit verification code.');
            return;
        }

        setLoading(true);
        try {
            const confirmationResult = (window as any).confirmationResult;
            if (!confirmationResult) {
                setError('Session expired. Please request a new OTP code.');
                setOtpSent(false);
                setLoading(false);
                return;
            }

            // Check if mobile number is registered in Firestore BEFORE signing in via confirmationResult.confirm
            const q = query(collection(db, 'users'), where('mobile', '==', mobile));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('यह मोबाइल नंबर पंजीकृत नहीं है। कृपया पहले साइन अप करें। (This mobile number is not registered. Please sign up first.)');
                setLoading(false);
                return;
            }

            const result = await confirmationResult.confirm(otpCode);
            const user = result.user;

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            const from = (location.state as any)?.from || '/dashboard';

            if (!userDoc.exists()) {
                const existingDoc = querySnapshot.docs[0];
                const existingData = existingDoc.data();
                const existingProfile = {
                    fullName: existingData.fullName || existingData.displayName || '',
                    email: existingData.email || '',
                    state: existingData.state || '',
                    district: existingData.district || '',
                    role: existingData.role || 'student',
                    status: existingData.status || 'active'
                };

                // Copy purchases
                const emailPurchasesRef = collection(db, 'users', existingDoc.id, 'purchases');
                const emailPurchasesSnapshot = await getDocs(emailPurchasesRef);
                for (const pDoc of emailPurchasesSnapshot.docs) {
                    await addDoc(collection(db, 'users', user.uid, 'purchases'), pDoc.data());
                }

                await setDoc(userDocRef, {
                    ...existingProfile,
                    mobile: mobile,
                    createdAt: new Date(),
                    joinedDate: new Date()
                });

                navigate(from);
            } else {
                const userData = userDoc.data();
                if (userData.status === 'blocked') {
                    await auth.signOut();
                    setError('Your account is blocked. Please contact admin.');
                } else if (userData.role === 'admin') {
                    navigate('/admin-dashboard');
                } else {
                    navigate(from);
                }
            }
        } catch (err: any) {
            console.error("Verification failed:", err);
            setError('Invalid code. Please enter the correct verification code.');
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

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const from = (location.state as any)?.from || '/dashboard';

            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.status === 'blocked') {
                    await auth.signOut();
                    setError('Your account is blocked. Please contact admin.');
                } else if (userData.role === 'admin') {
                    navigate('/admin-dashboard');
                } else {
                    navigate(from);
                }
            } else {
                await setDoc(doc(db, 'users', user.uid), {
                    fullName: user.displayName || 'New User',
                    email: user.email,
                    role: 'student',
                    status: 'active',
                    createdAt: new Date(),
                    joinedDate: new Date()
                });
                navigate(from);
            }
        } catch (err: any) {
            console.error("Google sign in failed:", err);
            setError(err.message || 'Google sign in failed. Please try again.');
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

            const from = (location.state as any)?.from || '/dashboard';

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
            console.error(err);
            setError('Failed to log in. Please check your credentials.');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex relative overflow-hidden font-sans">
            {/* Background Orbs */}
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
                        src={studentBanner}
                        alt="Education Hero"
                        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay scale-105"
                    />

                    {/* Top Content */}
                    <div className="relative z-20">
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
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">Journey</span>
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-indigo-100 text-lg max-w-sm font-medium"
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
                            <div className="p-2 bg-indigo-500/50 rounded-lg">
                                <Globe className="text-white" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-indigo-200 font-medium">Global</p>
                                <p className="text-white font-bold text-sm">Community</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-7/12 p-6 md:p-8 lg:p-10 flex flex-col justify-center bg-white/50 h-screen overflow-y-auto">
                    <div className="max-w-[420px] w-full mx-auto flex flex-col justify-center py-4">
                        <div className="flex justify-between items-center mb-6">
                            <Link to="/" className="inline-flex items-center gap-2 group">
                                <div className="p-1.5 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:shadow-md transition-all">
                                    <img src={logo} alt="Examinantt" className="h-7 w-7 rounded-lg object-contain" />
                                </div>
                                <span className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                                    Examinantt
                                </span>
                            </Link>
                            <Link to="/signup" state={location.state} className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors px-4 py-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-all">
                                Sign Up
                            </Link>
                        </div>

                        <div className="mb-5">
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-1.5 tracking-tight">Welcome Back!</h2>
                            <p className="text-slate-500 font-medium text-sm">Please enter your details to sign in.</p>
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

                        <div className="mb-5">
                            <div className="flex gap-3">
                                <motion.button
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl transition-all group text-xs shadow-sm"
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
                                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl transition-all group text-xs shadow-sm"
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
                                <div className="absolute inset-x-0 h-px bg-slate-200"></div>
                                <span className="relative bg-white/50 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur-xl">Or continue with email</span>
                            </motion.div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 text-sm font-medium placeholder:text-slate-400 hover:border-slate-300 hover:bg-slate-100"
                                    />
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Lock size={18} strokeWidth={2.5} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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

                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center justify-between text-sm py-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                    <span className="text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Remember for 30 days</span>
                                </label>
                                <Link to="/forgot-password" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">Forgot password?</Link>
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                disabled={loading}
                                type="submit"
                                className="w-full relative group overflow-hidden bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-3 text-sm"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className="relative z-10 flex items-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
                                    {!loading && <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />}
                                </span>
                            </motion.button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
