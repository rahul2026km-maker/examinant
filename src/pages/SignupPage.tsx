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
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [emailVerified, setEmailVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [isGoogleMobileModalOpen, setIsGoogleMobileModalOpen] = useState(false);
    const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);
    const [googleMobile, setGoogleMobile] = useState('');
    const [isSubmittingGoogleMobile, setIsSubmittingGoogleMobile] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const districts = STATES.find(s => s.name === state)?.districts || [];

    const handleSendOtp = async () => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
            return setError('Please enter a valid email address first.');
        }
        setOtpLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            // 1. Check if email already registered in Firebase Firestore
            if (db) {
                const emailQuery = query(collection(db, 'users'), where('email', '==', cleanEmail));
                const emailSnapshot = await getDocs(emailQuery);
                if (!emailSnapshot.empty) {
                    setError('This email address is already registered. Please login instead.');
                    setOtpLoading(false);
                    return;
                }
            }

            // 2. Request OTP from backend API which emails it to the user
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${baseUrl}/api/request-signup-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send verification OTP.');
            }

            setOtpSent(true);
            setOtpCode('');
            setSuccessMessage(`A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox (and spam folder).`);
        } catch (err: any) {
            console.error("OTP send error:", err);
            setError(err.message || 'Failed to send OTP. Please check your internet connection.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode || otpCode.length !== 6) {
            return setError('Please enter the 6-digit OTP sent to your email.');
        }
        setOtpLoading(true);
        setError('');
        const cleanEmail = email.trim().toLowerCase();

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/api/verify-signup-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail, otp: otpCode.trim() })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Incorrect or expired OTP. Please check your email and try again.');
            }

            setEmailVerified(true);
            setOtpSent(false);
            setSuccessMessage('Email verified successfully! You can now complete your registration.');
            setError('');
        } catch (err: any) {
            setError(err.message || 'Failed to verify OTP.');
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

        if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
            return setError('Mobile number is required. Please enter a valid 10-digit mobile number.');
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
                displayName: fullName,
                email,
                mobile,
                state: state,
                district: district,
                role: 'student',
                status: 'active',
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
                const cleanFormMobile = mobile.replace(/\D/g, '').slice(0, 10);
                // If 10-digit mobile number is already filled in the form, use it
                if (/^\d{10}$/.test(cleanFormMobile)) {
                    const mobileQuery = query(collection(db, 'users'), where('mobile', '==', cleanFormMobile));
                    const mobileSnapshot = await getDocs(mobileQuery);
                    if (!mobileSnapshot.empty) {
                        setError('This mobile number is already registered with another account.');
                        setLoading(false);
                        return;
                    }

                    await setDoc(userRef, {
                        fullName: result.user.displayName || '',
                        displayName: result.user.displayName || '',
                        email: result.user.email,
                        mobile: cleanFormMobile,
                        state: state || '',
                        district: district || '',
                        role: 'student',
                        status: 'active',
                        createdAt: new Date(),
                        joinedDate: new Date(),
                        phoneVerified: false
                    });
                    navigate('/login');
                } else {
                    // Mobile number is strictly required: open modal to capture it
                    setPendingGoogleUser(result.user);
                    setGoogleMobile('');
                    setIsGoogleMobileModalOpen(true);
                }
            } else {
                navigate('/login');
            }
        } catch (err: any) {
            console.error("Google signup failed:", err);
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(err.message || 'Google signup failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteGoogleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const cleanMobile = googleMobile.replace(/\D/g, '').slice(0, 10);
        if (!cleanMobile || !/^\d{10}$/.test(cleanMobile)) {
            return setError('Please enter a valid 10-digit mobile number.');
        }

        if (!pendingGoogleUser || !db) return;
        setIsSubmittingGoogleMobile(true);
        try {
            const mobileQuery = query(collection(db, 'users'), where('mobile', '==', cleanMobile));
            const mobileSnapshot = await getDocs(mobileQuery);
            if (!mobileSnapshot.empty) {
                setError('This mobile number is already registered with another account.');
                setIsSubmittingGoogleMobile(false);
                return;
            }

            const userRef = doc(db, 'users', pendingGoogleUser.uid);
            await setDoc(userRef, {
                fullName: pendingGoogleUser.displayName || '',
                displayName: pendingGoogleUser.displayName || '',
                email: pendingGoogleUser.email,
                mobile: cleanMobile,
                state: state || '',
                district: district || '',
                role: 'student',
                status: 'active',
                createdAt: new Date(),
                joinedDate: new Date(),
                phoneVerified: false
            });

            setIsGoogleMobileModalOpen(false);
            setPendingGoogleUser(null);
            navigate('/login');
        } catch (err: any) {
            console.error("Failed to complete Google signup with mobile:", err);
            setError(err.message || 'Failed to complete registration.');
        } finally {
            setIsSubmittingGoogleMobile(false);
        }
    };

    return (
        <div className="h-screen w-full bg-[#070D1E] relative overflow-hidden font-sans text-slate-200">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
            
            <div className="w-full h-full overflow-y-auto overflow-x-hidden relative z-10 scrollbar-hide">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full min-h-full bg-[#070D1E] flex flex-col md:flex-row"
                >
                {/* Left Side - Graphics */}
                <div className="hidden md:flex flex-col w-5/12 relative overflow-hidden p-10 justify-between">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-950 to-[#070D1E] z-0" />
                    
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10 z-0 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[size:24px_24px]" />
                    
                    <img
                        src="/education_hero.png"
                        alt="Education Hero"
                        className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity scale-105"
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
                            className="inline-flex items-center gap-2 bg-blue-500/10 backdrop-blur-md border border-blue-400/20 rounded-full px-4 py-1.5 text-sm font-semibold text-blue-200 mb-8 shadow-xl"
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
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-sky-300">True Potential</span>
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-slate-300 text-lg max-w-sm font-medium"
                        >
                            Join the elite league of students mastering their competitive exams with our AI-driven platform.
                        </motion.p>
                    </div>

                    {/* Bottom Features */}
                    <div className="relative z-20 space-y-4">
                        {[
                            { title: 'Smart Analytics', icon: <Star size={18} className="text-yellow-400" /> },
                            { title: 'Chapter-wise Mocks', icon: <CheckCircle size={18} className="text-emerald-400" /> },
                            { title: 'Expert Guidance', icon: <User size={18} className="text-blue-400" /> }
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
                        className="absolute top-1/4 right-8 bg-[#0B152B]/80 backdrop-blur-xl p-4 rounded-2xl border border-[#17254E] z-20 shadow-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="text-3xl font-black text-white">99<span className="text-blue-400">%</span></div>
                            <div className="text-xs text-slate-300 font-medium leading-tight">Success<br/>Rate</div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-center bg-[#0B152B] md:border-l md:border-[#17254E] min-h-full">
                    <div className="max-w-[500px] w-full mx-auto flex flex-col justify-center py-6">


                        <div className="mb-5">
                            <h2 className="text-3xl font-extrabold text-white mb-1 tracking-tight">Create account</h2>
                            <p className="text-slate-400 font-medium text-sm">Start your preparation journey with us today.</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-red-400 text-sm font-medium shadow-sm"
                            >
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-emerald-400 text-sm font-medium shadow-sm"
                            >
                                <CheckCircle size={18} className="shrink-0 mt-0.5 text-emerald-400" />
                                <span>{successMessage}</span>
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
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#0E1B38] border border-[#1E3360] hover:border-blue-500/50 hover:bg-[#132347] text-slate-200 font-bold py-2.5 rounded-xl transition-all group text-xs shadow-sm"
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
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#0E1B38] border border-[#1E3360] hover:border-blue-500/50 hover:bg-[#132347] text-slate-200 font-bold py-2.5 rounded-xl transition-all group text-xs shadow-sm"
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
                                <div className="absolute inset-x-0 h-px bg-[#1E3360]"></div>
                                <span className="relative bg-[#0B152B] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Or continue with email</span>
                            </motion.div>
                        </div>

                        <form onSubmit={handleRegisterAndVerify} className="space-y-3.5">
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-300 ml-1 mb-1 inline-block">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                             <User size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            minLength={3}
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full pl-[42px] pr-4 py-3 bg-[#0E1B38] border border-[#1E3360] rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-[#112246] transition-all text-white text-sm font-medium placeholder:text-slate-500 hover:border-slate-500 hover:bg-[#112246]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-300 ml-1 mb-1 inline-block">
                                        Mobile Number <span className="text-red-400 font-bold">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                            <Phone size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="tel"
                                            required
                                            maxLength={10}
                                            pattern="[0-9]{10}"
                                            title="Please enter a valid 10-digit mobile number"
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            placeholder="10-digit number (required)"
                                            className="w-full pl-[42px] pr-4 py-3 bg-[#0E1B38] border border-[#1E3360] rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-[#112246] transition-all text-white text-sm font-bold placeholder:text-slate-500 hover:border-slate-500 hover:bg-[#112246] tracking-wide"
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-300 ml-1 mb-1 inline-block">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
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
                                            setSuccessMessage('');
                                            setError('');
                                        }}
                                        placeholder="you@example.com"
                                        className="w-full pl-[42px] pr-[100px] py-3 bg-[#0E1B38] border border-[#1E3360] rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-[#112246] transition-all text-white text-sm font-medium placeholder:text-slate-500 hover:border-slate-500 hover:bg-[#112246] disabled:opacity-70 disabled:bg-[#0E1B38]"
                                    />
                                    <div className="absolute inset-y-0 right-1 flex items-center">
                                        {emailVerified ? (
                                            <span className="flex items-center gap-1 px-3 text-sm font-bold text-emerald-400">
                                                <CheckCircle size={16} /> Verified
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleSendOtp}
                                                disabled={otpLoading || !email}
                                                className="px-3 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                            >
                                                {otpLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : (otpSent ? 'Resend' : 'Send OTP')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {otpSent && !emailVerified && (
                                    <div className="mt-2.5 p-2.5 bg-[#0E1B38]/90 border border-[#1E3360] rounded-xl space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                placeholder="Enter 6-digit OTP"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="flex-1 px-3 py-2 bg-[#070D1E] border border-[#1E3360] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-mono text-center tracking-widest font-bold text-white placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:text-slate-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleVerifyOtp}
                                                disabled={otpLoading || otpCode.length !== 6}
                                                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-all disabled:opacity-50 shadow-sm hover:shadow"
                                            >
                                                {otpLoading ? <Loader2 size={15} className="animate-spin mx-auto" /> : 'Verify'}
                                            </button>
                                        </div>

                                        <p className="text-[11px] text-slate-400 pt-0.5 px-1 flex items-center gap-1">
                                            <span>📩 Enter the 6-digit code sent to your email. Check spam folder if not received.</span>
                                        </p>
                                    </div>
                                )}
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-300 ml-1 mb-1 inline-block">State</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                            <MapPin size={18} strokeWidth={2.5} />
                                        </div>
                                        <select
                                            required
                                            value={state}
                                            onChange={(e) => {
                                                setState(e.target.value);
                                                setDistrict('');
                                            }}
                                            className="w-full pl-[42px] pr-4 py-3 bg-[#0E1B38] border border-[#1E3360] rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-[#112246] transition-all text-white text-sm font-medium appearance-none cursor-pointer hover:border-slate-500 hover:bg-[#112246]"
                                        >
                                            <option value="" disabled className="bg-[#0E1B38] text-slate-400">Select State</option>
                                            {STATES.map(s => <option key={s.name} value={s.name} className="bg-[#0E1B38] text-white">{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-300 ml-1 mb-1 inline-block">District</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                            <MapPin size={18} strokeWidth={2.5} />
                                        </div>
                                        <select
                                            required
                                            value={district}
                                            disabled={!state}
                                            onChange={(e) => setDistrict(e.target.value)}
                                            className="w-full pl-[42px] pr-4 py-3 bg-[#0E1B38] border border-[#1E3360] rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-[#112246] transition-all text-white text-sm font-medium appearance-none disabled:opacity-50 disabled:bg-[#0E1B38] disabled:cursor-not-allowed cursor-pointer hover:border-slate-500 hover:bg-[#112246]"
                                        >
                                            <option value="" disabled className="bg-[#0E1B38] text-slate-400">Select District</option>
                                            {districts.map(d => <option key={d} value={d} className="bg-[#0E1B38] text-white">{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-300 ml-1 mb-1 inline-block">Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                            <Lock size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={6}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-10 py-2.5 bg-[#0E1B38] border border-[#1E3360] rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-[#112246] transition-all text-white text-sm font-medium placeholder:text-slate-500 hover:border-slate-500 hover:bg-[#112246]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-300 ml-1 mb-1 inline-block">Confirm</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                            <Lock size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            minLength={6}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-10 py-2.5 bg-[#0E1B38] border border-[#1E3360] rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-[#112246] transition-all text-white text-sm font-medium placeholder:text-slate-500 hover:border-slate-500 hover:bg-[#112246]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
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
                                className="w-full relative group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-5 text-base"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className="relative z-10 flex items-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create Account'}
                                    {!loading && <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />}
                                </span>
                            </motion.button>
                        </form>
                        
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 text-center text-sm text-slate-400 font-medium">
                            Already have an account? <Link to="/login" state={location.state} className="text-blue-400 hover:text-blue-300 font-bold hover:underline transition-all">Sign In</Link>
                        </motion.div>

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-4 text-center text-xs text-slate-500 font-medium">
                            By creating an account, you agree to our <Link to="/terms" className="text-blue-400 hover:underline">Terms of Service</Link> and <Link to="/privacy-policy" className="text-blue-400 hover:underline">Privacy Policy</Link>.
                        </motion.div>
                    </div>
                </div>
                </motion.div>
            </div>

            {/* Modal to require Mobile Number if user signed up with Google */}
            {isGoogleMobileModalOpen && (
                <div className="fixed inset-0 bg-[#040814]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#0B152B] border border-[#1E3360] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 text-slate-200"
                    >
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                                <Phone size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Mobile Number Required</h3>
                            <p className="text-xs text-slate-400">
                                Registration complete karne ke liye apna 10-digit mobile number enter karein.
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs font-semibold">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleCompleteGoogleSignup} className="space-y-4 pt-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-1">
                                    Mobile Number <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <span className="text-xs font-bold text-slate-500">+91</span>
                                    </div>
                                    <input
                                        type="tel"
                                        required
                                        autoFocus
                                        maxLength={10}
                                        pattern="[0-9]{10}"
                                        value={googleMobile}
                                        onChange={(e) => setGoogleMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="Enter 10-digit mobile number"
                                        className="w-full pl-12 pr-4 py-3 bg-[#0E1B38] border border-[#1E3360] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold tracking-wider text-white placeholder:text-slate-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsGoogleMobileModalOpen(false);
                                        setPendingGoogleUser(null);
                                        setError('');
                                    }}
                                    className="flex-1 py-2.5 border border-[#1E3360] text-slate-300 font-bold rounded-xl text-xs hover:bg-[#0E1B38] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingGoogleMobile || googleMobile.length !== 10}
                                    className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {isSubmittingGoogleMobile ? 'Saving...' : 'Submit & Register'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SignupPage;
