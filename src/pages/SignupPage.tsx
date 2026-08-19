import { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle, Loader2, User, Mail, Lock, MapPin, Star, CheckCircle, Phone, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.png';
import studentBanner from '../assets/student_banner.png';
import { INDIA_STATES as STATES } from '../data/indiaStates';

const SignupPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [state, setState] = useState('');
    const [district, setDistrict] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [emailVerified, setEmailVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const districts = STATES.find(s => s.name === state)?.districts || [];

    const handleSendOtp = async () => {
        if (!email || !email.includes('@')) {
            return setError('Please enter a valid email address first.');
        }
        setOtpLoading(true);
        setError('');
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/api/request-signup-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
            setOtpSent(true);
            setError('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode || otpCode.length !== 6) {
            return setError('Please enter a valid 6-digit OTP.');
        }
        setOtpLoading(true);
        setError('');
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/api/verify-signup-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpCode })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
            setEmailVerified(true);
            setOtpSent(false);
            setError('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleRegisterAndVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!emailVerified) {
            return setError('Please verify your email address before creating an account.');
        }

        if (fullName.trim().length < 3) {
            return setError('Please enter a valid full name (min 3 characters)');
        }

        if (!/^\d{10}$/.test(mobile)) {
            return setError('Please enter a valid 10-digit mobile number');
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters long');
        }

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (!state || !district) {
            return setError('Please select your state and district');
        }

        if (!auth || !db) {
            setError('Firebase is not configured.');
            return;
        }

        setLoading(true);
        try {
            // Check if email already exists
            const emailQuery = query(collection(db, 'users'), where('email', '==', email));
            const emailSnapshot = await getDocs(emailQuery);
            if (!emailSnapshot.empty) {
                setError('This email address is already registered.');
                setLoading(false);
                return;
            }

            // Check if mobile number already exists
            const mobileQuery = query(collection(db, 'users'), where('mobile', '==', mobile));
            const mobileSnapshot = await getDocs(mobileQuery);
            if (!mobileSnapshot.empty) {
                setError('This mobile number is already registered.');
                setLoading(false);
                return;
            }

            // Create main Email/Password credential
            const emailCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Save profile under Email UID
            await setDoc(doc(db, 'users', emailCredential.user.uid), {
                fullName,
                email,
                mobile,
                state: state,
                district: district,
                role: 'student',
                createdAt: new Date(),
                joinedDate: new Date(),
                phoneVerified: false
            });

            navigate('/login');
        } catch (err: any) {
            console.error("Signup failed:", err);
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        if (!auth || !db) {
            setError('Firebase is not configured.');
            return;
        }

        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            
            const userRef = doc(db, 'users', result.user.uid);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    fullName: result.user.displayName || '',
                    email: result.user.email,
                    mobile: result.user.phoneNumber || '',
                    state: '',
                    district: '',
                    role: 'student',
                    createdAt: new Date(),
                    joinedDate: new Date(),
                    phoneVerified: false
                });
            }

            navigate('/login');
        } catch (err: any) {
            console.error("Google signup failed:", err);
            setError(err.message || 'Google signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-slate-100 relative overflow-hidden font-sans">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/30 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
            
            <div className="w-full h-full overflow-y-auto overflow-x-hidden relative z-10 scrollbar-hide">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full min-h-full bg-white/80 backdrop-blur-xl flex flex-col md:flex-row"
                >
                {/* Left Side - Graphics */}
                <div className="hidden md:flex flex-col w-5/12 relative overflow-hidden p-10 justify-between">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 z-0" />
                    
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10 z-0 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[size:24px_24px]" />
                    
                    <img
                        src="/education_hero.png"
                        alt="Education Hero"
                        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay scale-105"
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
                            Registrations Open
                        </motion.div>

                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-4xl lg:text-5xl font-black text-white leading-[1.15] mb-6 tracking-tight"
                        >
                            Unlock Your <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">True Potential</span>
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-indigo-100 text-lg max-w-sm font-medium"
                        >
                            Join the elite league of students mastering their competitive exams with our AI-driven platform.
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
                            <div className="text-3xl font-black text-white">99<span className="text-blue-300">%</span></div>
                            <div className="text-xs text-indigo-100 font-medium leading-tight">Success<br/>Rate</div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-center bg-white/50 min-h-full">
                    <div className="max-w-[500px] w-full mx-auto flex flex-col justify-center py-6">


                        <div className="mb-5">
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">Create account</h2>
                            <p className="text-slate-500 font-medium text-sm">Start your preparation journey with us today.</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="mb-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-sm font-medium shadow-sm"
                            >
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <div className="mb-4">
                            <div className="flex gap-3">
                                <motion.button
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    type="button"
                                    onClick={handleGoogleSignup}
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
                                className="relative flex items-center justify-center mt-5 mb-1"
                            >
                                <div className="absolute inset-x-0 h-px bg-slate-200"></div>
                                <span className="relative bg-white/50 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur-xl">Or continue with email</span>
                            </motion.div>
                        </div>

                        <form onSubmit={handleRegisterAndVerify} className="space-y-3.5">
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 ml-1 mb-1 inline-block">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <User size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            minLength={3}
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full pl-[42px] pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 text-sm font-medium placeholder:text-slate-400 hover:border-slate-300 hover:bg-slate-100"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 ml-1 mb-1 inline-block">Mobile Number</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Phone size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="tel"
                                            required
                                            pattern="[0-9]{10}"
                                            title="Please enter a valid 10-digit mobile number"
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            placeholder="10-digit number"
                                            className="w-full pl-[42px] pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 text-sm font-bold placeholder:text-slate-400 hover:border-slate-300 hover:bg-slate-100 tracking-wide"
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1 mb-1 inline-block">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Mail size={18} strokeWidth={2.5} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        disabled={emailVerified}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setEmailVerified(false);
                                            setOtpSent(false);
                                        }}
                                        placeholder="you@example.com"
                                        className="w-full pl-[42px] pr-[100px] py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 text-sm font-medium placeholder:text-slate-400 hover:border-slate-300 hover:bg-slate-100 disabled:opacity-70 disabled:bg-slate-100"
                                    />
                                    <div className="absolute inset-y-0 right-1 flex items-center">
                                        {emailVerified ? (
                                            <span className="flex items-center gap-1 px-3 text-sm font-bold text-green-600">
                                                <CheckCircle size={16} /> Verified
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleSendOtp}
                                                disabled={otpLoading || !email || otpSent}
                                                className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                            >
                                                {otpLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : (otpSent ? 'Sent' : 'Send OTP')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {otpSent && !emailVerified && (
                                    <div className="mt-2 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter 6-digit OTP"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerifyOtp}
                                            disabled={otpLoading || otpCode.length !== 6}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                                        >
                                            {otpLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Verify'}
                                        </button>
                                    </div>
                                )}
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 ml-1 mb-1 inline-block">State</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <MapPin size={18} strokeWidth={2.5} />
                                        </div>
                                        <select
                                            required
                                            value={state}
                                            onChange={(e) => {
                                                setState(e.target.value);
                                                setDistrict('');
                                            }}
                                            className="w-full pl-[42px] pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 text-sm font-medium appearance-none cursor-pointer hover:border-slate-300 hover:bg-slate-100"
                                        >
                                            <option value="" disabled className="text-slate-400">Select State</option>
                                            {STATES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 ml-1 mb-1 inline-block">District</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <MapPin size={18} strokeWidth={2.5} />
                                        </div>
                                        <select
                                            required
                                            value={district}
                                            disabled={!state}
                                            onChange={(e) => setDistrict(e.target.value)}
                                            className="w-full pl-[42px] pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 text-sm font-medium appearance-none disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed cursor-pointer hover:border-slate-300 hover:bg-slate-100"
                                        >
                                            <option value="" disabled className="text-slate-400">Select District</option>
                                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 ml-1 mb-1 inline-block">Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={6}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 text-sm font-medium placeholder:text-slate-400 hover:border-slate-300 hover:bg-slate-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 ml-1 mb-1 inline-block">Confirm</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            minLength={6}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 text-sm font-medium placeholder:text-slate-400 hover:border-slate-300 hover:bg-slate-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                disabled={loading}
                                type="submit"
                                className="w-full relative group overflow-hidden bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-5 text-base"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className="relative z-10 flex items-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create Account'}
                                    {!loading && <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />}
                                </span>
                            </motion.button>
                        </form>
                        
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 text-center text-sm text-slate-600 font-medium">
                            Already have an account? <Link to="/login" state={location.state} className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-all">Sign In</Link>
                        </motion.div>

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-4 text-center text-xs text-slate-500 font-medium">
                            By creating an account, you agree to our <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link to="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                        </motion.div>
                    </div>
                </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SignupPage;
