import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle, Loader2, User, Mail, Lock, MapPin, Star, CheckCircle, Phone } from 'lucide-react';
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
    const navigate = useNavigate();
    const location = useLocation();

    // OTP verification states
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const setupRecaptcha = (containerId: string) => {
        if (!(window as any).recaptchaVerifierSignup) {
            try {
                (window as any).recaptchaVerifierSignup = new RecaptchaVerifier(auth, containerId, {
                    size: 'invisible',
                    callback: () => {}
                });
            } catch (err) {
                console.error("Recaptcha verifier error:", err);
            }
        }
    };

    const handleSendOtp = async () => {
        setError('');
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

            setupRecaptcha('recaptcha-container-signup');
            const appVerifier = (window as any).recaptchaVerifierSignup;
            const formattedPhone = `+91${mobile}`;

            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            (window as any).confirmationResultSignup = confirmationResult;
            setOtpSent(true);
            alert('OTP verification code has been sent successfully to your mobile!');
        } catch (err: any) {
            console.error("SMS send failed:", err);
            setError(err.message || 'Failed to send OTP code. Please check your number.');
            if ((window as any).recaptchaVerifierSignup) {
                try {
                    (window as any).recaptchaVerifierSignup.clear();
                } catch(e){}
                (window as any).recaptchaVerifierSignup = null;
            }
        } finally {
            setLoading(false);
        }
    };

    const districts = STATES.find(s => s.name === state)?.districts || [];

    const handleRegisterAndVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

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

        if (!otpSent) {
            // First trigger sending OTP
            await handleSendOtp();
        } else {
            // Verify OTP and complete registration
            if (!otpCode || otpCode.length !== 6) {
                setError('Please enter a valid 6-digit verification code.');
                return;
            }

            setLoading(true);
            try {
                const confirmationResult = (window as any).confirmationResultSignup;
                if (!confirmationResult) {
                    setError('Session expired. Please request OTP again.');
                    setOtpSent(false);
                    setLoading(false);
                    return;
                }

                // Verify code
                await confirmationResult.confirm(otpCode);

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
                    phoneVerified: true
                });

                if ((window as any).recaptchaVerifierSignup) {
                    try {
                        (window as any).recaptchaVerifierSignup.clear();
                    } catch(e){}
                    (window as any).recaptchaVerifierSignup = null;
                }

                const from = (location.state as any)?.from || '/dashboard';
                navigate(from);
            } catch (err: any) {
                console.error("OTP verification or signup failed:", err);
                setError(err.message || 'OTP verification failed. Please enter the correct code.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white w-full max-w-[1100px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[650px]"
            >
                {/* Left Side - Graphics */}
                <div className="hidden md:flex flex-col w-5/12 bg-blue-600 relative overflow-hidden text-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-blue-800/90 z-10" />
                    <img
                        src={studentBanner}
                        alt="Student learning"
                        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay scale-110"
                    />

                    {/* Floating Decorative Elements */}
                    <div className="absolute top-10 left-10 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 z-20 animate-bounce-slow shadow-lg">
                        <Star className="text-yellow-400 fill-yellow-400" size={24} />
                    </div>

                    <div className="absolute bottom-20 right-10 bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20 z-20 shadow-xl translate-x-4 hover:translate-x-2 transition-transform duration-500">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-500 rounded-full p-1.5 shadow-lg shadow-green-500/40"><CheckCircle size={18} className="text-white" /></div>
                            <div>
                                <p className="text-xs text-blue-100 font-medium uppercase tracking-wide">Success Rate</p>
                                <p className="font-bold text-xl">98.5%</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-20 flex flex-col justify-center h-full p-12 lg:p-14">
                        <div className="mb-8">
                            <div className="inline-block bg-blue-500/30 backdrop-blur-md border border-blue-400/30 rounded-full px-4 py-1.5 text-xs font-bold text-blue-50 mb-6 shadow-sm">
                                🚀 Start your journey today
                            </div>
                            <h2 className="text-4xl font-extrabold leading-tight mb-6">
                                Master Your Exams<br />with Confidence
                            </h2>
                            <p className="text-blue-100/90 text-lg leading-relaxed">
                                Join thousands of students who are acing their JEE, NEET, and SSC exams.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {['Real-time Analytics', 'Chapter-wise Mocks', 'Expert Material'].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 text-blue-50 font-medium group">
                                    <div className="p-1 rounded-full bg-blue-500/20 group-hover:bg-blue-500/40 transition-colors">
                                        <CheckCircle size={16} className="text-green-300" />
                                    </div>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-7/12 p-8 md:p-10 lg:p-12 overflow-y-auto max-h-[90vh] md:max-h-none bg-white">
                    <div className="max-w-md mx-auto">
                        <div className="text-center mb-8">
                            <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
                                <span className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                                    <img src={logo} alt="Examinantt" className="h-8 w-8 rounded-lg" />
                                </span>
                                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                    Examinantt
                                </span>
                            </Link>
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h2>
                            <p className="text-slate-500">Begin your preparation journey with us.</p>
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
                        {!otpSent ? (
                            <form onSubmit={handleRegisterAndVerify} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 block ml-1">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                            <User size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="enter your full name"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 block ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 block ml-1">Mobile Number</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                            <Phone size={18} />
                                        </div>
                                        <input
                                            type="tel"
                                            required
                                            pattern="[0-9]{10}"
                                            title="Please enter a valid 10-digit mobile number"
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            placeholder="enter your number"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 block ml-1">State</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                                <MapPin size={18} />
                                            </div>
                                            <select
                                                required
                                                value={state}
                                                onChange={(e) => {
                                                    setState(e.target.value);
                                                    setDistrict('');
                                                }}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 appearance-none cursor-pointer"
                                            >
                                                <option value="">State</option>
                                                {STATES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 block ml-1">District</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                                <MapPin size={18} />
                                            </div>
                                            <select
                                                required
                                                value={district}
                                                disabled={!state}
                                                onChange={(e) => setDistrict(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                                <option value="">District</option>
                                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 block ml-1">Password</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                                <Lock size={18} />
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

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 block ml-1">Confirm</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-6"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send OTP to Verify Phone'}
                                    {!loading && <ChevronRight size={20} />}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegisterAndVerify} className="space-y-6 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-sm font-semibold text-slate-700 block">Verification OTP Code</label>
                                        <button
                                            type="button"
                                            onClick={() => { setOtpSent(false); setOtpCode(''); }}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
                                        >
                                            Edit Details
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                                        A 6-digit verification code was sent to **+91 {mobile}**. Enter it below to complete your registration.
                                    </p>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            pattern="[0-9]{6}"
                                            title="Please enter a valid 6-digit OTP code"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="Enter 6-digit OTP code"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 tracking-[0.2em] font-extrabold text-center"
                                        />
                                    </div>
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Create Account'}
                                    {!loading && <ChevronRight size={20} />}
                                </button>
                            </form>
                        )}
                        <div id="recaptcha-container-signup"></div>

                        <div className="mt-8 text-center text-sm font-medium">
                            <p className="text-slate-600">
                                Already have an account?{' '}
                                <Link to="/login" state={location.state} className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SignupPage;
