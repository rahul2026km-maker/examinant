import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  PieChart as PieChartIcon,
  AlertCircle,
  CheckCircle,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Crown,
  ShieldCheck
} from 'lucide-react';
const laptopMobile3DImg = '/laptop_mobile_3d.png';

interface TransparentImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  threshold?: number;
  mode?: 'black' | 'green';
}

const TransparentImage = ({ src, threshold = 40, mode = 'black', ...props }: TransparentImageProps) => {
  const [processedSrc, setProcessedSrc] = useState('');

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Make dark/black pixels transparent with smooth alpha blend
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (mode === 'green') {
          // Detect green-screen chroma key color (high green, low red/blue)
          if (g > 110 && r < 120 && b < 120) {
            data[i + 3] = 0;
          }
        } else {
          // Detect black/dark background pixels with smooth alpha feathering
          const maxVal = Math.max(r, g, b);
          if (maxVal < threshold) {
            data[i + 3] = 0;
          } else if (maxVal < threshold + 35) {
            const alpha = (maxVal - threshold) / 35;
            data[i + 3] = Math.floor(data[i + 3] * alpha);
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
      setProcessedSrc(canvas.toDataURL());
    };
  }, [src, threshold, mode]);

  if (!processedSrc) {
    return <div className="animate-pulse bg-slate-800/40 rounded-3xl" style={{ width: props.width || '100%', height: props.height || '200px' }} />;
  }

  return <img src={processedSrc} {...props} />;
};

const Target3DIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0">
    <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="2" fill="url(#targetGrad)" />
    <circle cx="12" cy="12" r="6" stroke="#60a5fa" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="2" fill="#06b6d4" />
    <path d="M12 12 L19 5" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" />
    <polygon points="19,5 18,8 15,7" fill="#FF7A00" />
    <defs>
      <radialGradient id="targetGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#000E2F" stopOpacity="0.9" />
      </radialGradient>
    </defs>
  </svg>
);

const Brain3DIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] shrink-0">
    <path d="M12 4C9.5 4 7.5 5.5 6.5 7.5C5 8 4 9.5 4 11C4 13 5.5 14.5 7 14.5C7.5 15.5 8.5 16.5 10 17C10.5 18.5 12 19.5 13.5 19.5" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M12 4C14.5 4 16.5 5.5 17.5 7.5C19 8 20 9.5 20 11C20 13 18.5 14.5 17 14.5C16.5 15.5 15.5 16.5 14 17C13.5 18.5 12 19.5 10.5 19.5" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <circle cx="12" cy="7" r="1.5" fill="#a5b4fc" />
    <circle cx="9" cy="11" r="1.5" fill="#818cf8" />
    <circle cx="15" cy="11" r="1.5" fill="#818cf8" />
    <circle cx="12" cy="15" r="1.5" fill="#6366f1" />
    <line x1="12" y1="7" x2="9" y2="11" stroke="#4f46e5" strokeWidth="1" />
    <line x1="12" y1="7" x2="15" y2="11" stroke="#4f46e5" strokeWidth="1" />
    <line x1="9" y1="11" x2="12" y2="15" stroke="#4f46e5" strokeWidth="1" />
    <line x1="15" y1="11" x2="12" y2="15" stroke="#4f46e5" strokeWidth="1" />
  </svg>
);

const Sheet3DIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(56,189,248,0.8)] shrink-0">
    <rect x="5" y="3" width="14" height="18" rx="2" stroke="#38bdf8" strokeWidth="1.5" fill="url(#sheetGrad)" />
    <line x1="8" y1="7" x2="16" y2="7" stroke="#0ea5e9" strokeWidth="1.5" />
    <circle cx="9" cy="12" r="1.2" stroke="#38bdf8" strokeWidth="1" fill="#38bdf8" />
    <circle cx="12" cy="12" r="1.2" stroke="#38bdf8" strokeWidth="1" />
    <circle cx="15" cy="12" r="1.2" stroke="#38bdf8" strokeWidth="1" />

    <circle cx="9" cy="16" r="1.2" stroke="#38bdf8" strokeWidth="1" />
    <circle cx="12" cy="16" r="1.2" stroke="#38bdf8" strokeWidth="1" fill="#38bdf8" />
    <circle cx="15" cy="16" r="1.2" stroke="#38bdf8" strokeWidth="1" />
    <defs>
      <linearGradient id="sheetGrad" x1="5" y1="3" x2="19" y2="21">
        <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#000E2F" stopOpacity="0.9" />
      </linearGradient>
    </defs>
  </svg>
);

const Trophy3DIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0">
    <path d="M6 4 H18 V12 C18 15 15 17 12 17 C9 17 6 15 6 12 Z" fill="url(#trophyGrad)" stroke="#f59e0b" strokeWidth="1.5" />
    <path d="M10 17 L8 21 H16 L14 17 Z" fill="#d97706" />
    <path d="M6 6 C4 6 4 9 6 10" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
    <path d="M18 6 C20 6 20 9 18 10" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
    <defs>
      <linearGradient id="trophyGrad" x1="6" y1="4" x2="18" y2="17">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
  </svg>
);

const AISimulationSection = () => {
  const navigate = useNavigate();

  return (
    <section id="ai-simulation" className="bg-white pt-6 pb-6 sm:pt-8 sm:pb-10 overflow-hidden relative">
      {/* Decorative Wavy Lines (Mockup style) */}
      <div className="absolute right-0 top-0 w-[350px] h-[350px] pointer-events-none z-0 overflow-visible hidden md:block">
        <svg className="w-full h-full" viewBox="0 0 350 350" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Orange curve sweeping up-right */}
          <path d="M350 280 C160 280, 150 140, 350 20" stroke="#FF8A00" strokeWidth="22" strokeLinecap="round" fill="none" opacity="0.95" />
          {/* Subtle blue accent line */}
          <path d="M350 295 C175 295, 165 155, 350 35" stroke="#1D64D0" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.4" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-24 lg:space-y-32 relative z-10">

        {/* AI Analytics Section */}
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-blue-50 border border-blue-100 rounded-full text-[10px] sm:text-xs font-black text-blue-600 uppercase tracking-widest">
              <Zap size={14} className="fill-blue-600 shrink-0" /> Proprietary Intelligence
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15] sm:leading-[1.1] tracking-tight">
              AI That <span className="text-gradient-blue">Evolves</span> <br />
              With Your Progress.
            </h2>

            <p className="text-slate-600 text-base sm:text-xl leading-relaxed max-w-xl">
              Our advanced algorithms analyze every keystroke and OMR bubble to identify hidden patterns that standard tests miss.
            </p>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              {[
                { title: "Mistake Audit", desc: "Pattern recognition for silly errors", icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" /> },
                { title: "Speed Metrics", desc: "Real-time velocity tracking", icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> },
                { title: "Risk Profiling", desc: "Predictive OMR failure analysis", icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" /> },
                { title: "Growth Path", desc: "Dynamic curriculum adjustments", icon: <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" /> }
              ].map((item, i) => (
                <div key={i} className="p-3 sm:p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 group hover:border-blue-500/20 hover:shadow-[0_12px_30px_-8px_rgba(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform duration-300 shrink-0">
                      {item.icon}
                    </div>
                    <p className="font-extrabold text-slate-800 text-[11px] sm:text-sm leading-tight">{item.title}</p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-semibold leading-relaxed pl-0.5">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4">
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary-premium text-xs sm:text-sm px-5 py-3 sm:px-6 sm:py-3.5"
              >
                Unlock Insights
              </button>
              <button
                onClick={() => navigate('/resources')}
                className="px-4 py-3 sm:px-6 text-xs sm:text-sm text-slate-600 font-bold hover:text-blue-600 transition-colors"
              >
                View Sample Report
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* The "Dark Mode" Tech Dashboard */}
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-3xl sm:rounded-[40px] p-4 sm:p-8 lg:p-12 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] relative overflow-hidden border border-slate-800/80">
              {/* Background glowing mesh */}
              <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-blue-500/10 blur-[90px] pointer-events-none"></div>
              <div className="absolute -left-24 -bottom-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.12),transparent)]"></div>

              <div className="relative space-y-6 sm:space-y-10">
                <div className="flex justify-between items-center gap-2">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest truncate">Global Ranking</p>
                    <h3 className="text-lg sm:text-2xl font-black text-white truncate">Performance Audit</h3>
                  </div>
                  <div className="px-2.5 py-1 bg-white/5 rounded-full border border-white/10 text-[9px] sm:text-[10px] font-bold text-white/50 flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                    ID: 8829-PX
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-end gap-2">
                    <p className="text-xs font-bold text-slate-400">Composite Mastery</p>
                    <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter">92.4 <span className="text-sm sm:text-lg text-slate-500">/ 100</span></p>
                  </div>
                  <div className="h-3 sm:h-3.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '92.4%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-6">
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:bg-white/[0.04] transition-all duration-300 space-y-2 sm:space-y-3">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</p>
                    <p className="text-xl sm:text-3xl font-black text-white">88%</p>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[88%] shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    </div>
                  </div>
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:bg-white/[0.04] transition-all duration-300 space-y-2 sm:space-y-3">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Focus Score</p>
                    <p className="text-xl sm:text-3xl font-black text-white">96%</p>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[96%] shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 bg-gradient-to-r from-white/[0.04] to-white/[0.01] rounded-2xl sm:rounded-3xl border border-white/10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/10 shrink-0">
                      <PieChartIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">Real-time Efficiency</p>
                      <p className="text-[11px] sm:text-xs text-slate-400 truncate">Optimizing strategy...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] text-blue-400 font-bold shrink-0">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    ACTIVE
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-4 right-1 sm:-top-6 sm:-right-4 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100 z-20 scale-90 sm:scale-100 origin-top-right"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-100 shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-black text-slate-900">Score Jump</p>
                  <p className="text-[9px] sm:text-[10px] text-green-600 font-black flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                    +15.2% Today
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>



        {/* Redesigned CTA Summary Box */}
        <div className="relative">
          {/* Floating Student Mascot Character with Orbit Platform Structure */}
          <div className="absolute right-1 -top-14 w-20 sm:w-36 lg:w-52 lg:-right-14 lg:-top-32 z-20 pointer-events-none">
            {/* Glowing circular orbit ring behind the boy */}
            <div className="absolute inset-0 m-auto w-14 h-14 sm:w-28 sm:h-28 lg:w-40 lg:h-40 bg-gradient-to-tr from-blue-500/20 to-indigo-500/10 rounded-full border border-blue-500/30 animate-pulse blur-[1px] -z-10"></div>
            <div className="absolute inset-0 m-auto w-10 h-10 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-slate-900/60 rounded-full border border-indigo-500/20 -z-10 shadow-[inset_0_0_20px_rgba(99,102,241,0.2)]"></div>

            <TransparentImage
              src="/student_mascot.png"
              alt="3D Student Mascot"
              className="w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] lg:drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)]"
              mode="green"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#000E2F] rounded-2xl sm:rounded-[40px] p-4 sm:p-8 md:p-12 text-white overflow-hidden shadow-2xl border border-blue-500/20 relative"
          >
            {/* Background Orbits / Glowing spots */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.1),transparent_60%)] pointer-events-none"></div>

            {/* Orange glowing spot on the bottom-left to match reference image */}
            <div className="absolute -left-24 -bottom-24 w-80 h-80 rounded-full bg-[#FF7A00]/15 blur-[80px] pointer-events-none"></div>

            {/* Glowing stars/dots for cosmic space effect */}
            <div className="absolute top-10 left-12 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
            <div className="absolute top-24 left-1/4 w-1.5 h-1.5 bg-blue-400/30 rounded-full blur-[0.5px] animate-ping"></div>
            <div className="absolute top-16 right-1/3 w-1 h-1 bg-white/50 rounded-full"></div>
            <div className="absolute bottom-16 left-1/3 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
            <div className="absolute bottom-24 right-1/4 w-1.5 h-1.5 bg-indigo-400/40 rounded-full blur-[0.5px] animate-pulse"></div>
            <div className="absolute top-1/2 left-[15%] w-1 h-1 bg-white/60 rounded-full"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center relative z-10">
              {/* Left Info Column */}
              <div className="lg:col-span-5 space-y-4 sm:space-y-5">
                <h3 className="text-xl sm:text-3.5xl lg:text-4xl font-black leading-tight tracking-tight text-white pr-14 sm:pr-20 lg:pr-0">
                  Eliminate <span className="text-[#3b82f6]">Exam Day</span> <br />
                  <span className="text-[#FF7A00]">Anxiety</span> Forever.
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-sm">
                  Join 12,000+ aspirants who have mastered the art of test-taking through our AI-simulated ecosystem.
                </p>

                {/* Rating Banner */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex -space-x-2 shrink-0">
                    {[
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80',
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80',
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&q=80',
                    ].map((src, idx) => (
                      <img key={idx} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#000E2F] object-cover" src={src} alt="Student avatar" />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-white">12,000+</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Aspirants</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex text-[#FF7A00] text-[10px]">★★★★★</div>
                      <span className="text-[9px] font-bold text-slate-400 ml-1">4.8/5 Trusted</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-2 sm:pt-3">
                  <button
                    onClick={() => navigate('/test-series')}
                    className="px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-[#FF7A00] to-[#FF9E3D] hover:opacity-95 text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF7A00]/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Try Demo Now</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="px-4 py-2.5 sm:px-5 sm:py-3 bg-transparent text-white border border-white/10 hover:bg-white/5 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Contact Counselor</span>
                    <MessageSquare size={14} className="text-blue-400" />
                  </button>
                </div>
              </div>

              {/* Middle 3D Laptop with Mobile Column */}
              <div className="lg:col-span-3 flex items-center justify-center relative min-h-[160px] sm:min-h-[180px] lg:min-h-[240px] my-2 sm:my-4 lg:my-0">
                {/* Base soft blue glow */}
                <div className="absolute w-36 h-36 sm:w-40 sm:h-40 lg:w-56 lg:h-56 bg-blue-600/10 rounded-full blur-[35px] lg:blur-[45px] -z-10"></div>
                {/* Horizontal scanner perspective ellipse */}
                <div className="absolute w-40 h-10 sm:w-48 sm:h-12 lg:w-60 lg:h-16 bg-gradient-to-t from-blue-500/20 to-transparent rounded-full border border-blue-500/30 transform translate-y-10 lg:translate-y-20 rotate-[-5deg] -z-10"></div>

                <img
                  src={laptopMobile3DImg}
                  alt="3D Laptop with Mobile Mockup"
                  className="w-52 sm:w-64 lg:w-80 object-contain relative z-10 mix-blend-screen [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_75%)] contrast-[1.08] brightness-[1.05] drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-float"
                />
              </div>

              {/* Right Features Column */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-2.5 sm:gap-4">
                {[
                  {
                    title: "100% Pattern Match",
                    desc: "Real exam. Real pressure. Real results.",
                    icon: <Target3DIcon />,
                    bg: "bg-blue-950/20 border-blue-500/30"
                  },
                  {
                    title: "AI-Driven Logic",
                    desc: "Smart algorithms for smarter you.",
                    icon: <Brain3DIcon />,
                    bg: "bg-indigo-950/20 border-blue-500/30"
                  },
                  {
                    title: "Physical OMR Sheets",
                    desc: "Practice like real exams with OMR.",
                    icon: <Sheet3DIcon />,
                    bg: "bg-sky-950/20 border-blue-500/30"
                  },
                  {
                    title: "Advanced Rankings",
                    desc: "See where you stand. Rise above the rest.",
                    icon: <Trophy3DIcon />,
                    bg: "bg-amber-950/20 border-blue-500/30"
                  }
                ].map((feat, i) => (
                  <div key={i} className={`p-3.5 sm:p-4 rounded-2xl border ${feat.bg} flex flex-col justify-between relative overflow-hidden backdrop-blur-sm group hover:border-blue-400/50 transition-all duration-300`}>
                    {/* Glowing Neon Corner Light Flare */}
                    <div className="absolute top-0 left-0 w-12 h-[1px] bg-gradient-to-r from-cyan-400 to-transparent"></div>
                    <div className="absolute top-0 left-0 w-[1px] h-12 bg-gradient-to-b from-cyan-400 to-transparent"></div>
                    <div className="absolute top-[-1.5px] left-4 w-3 h-[3px] bg-white shadow-[0_0_8px_#fff] rounded-full"></div>

                    <div>
                      {/* Icon and Title Row */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="shrink-0 scale-90 sm:scale-100">
                          {feat.icon}
                        </div>
                        <h4 className="text-[11px] sm:text-xs font-black text-white leading-tight">{feat.title}</h4>
                      </div>

                      {/* Description Below */}
                      <p className="text-[10px] sm:text-xs text-slate-300 font-medium leading-relaxed mt-1.5 sm:mt-2.5">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Value Props Bar */}
            <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-white/5 grid grid-cols-2 sm:flex sm:flex-wrap justify-between items-center gap-2.5 sm:gap-4 text-[8.5px] sm:text-[9px] font-bold text-slate-400">
              <div className="flex items-center gap-1.5"><Sparkles size={12} className="text-blue-400 shrink-0" /> AI-Powered Analytics</div>
              <div className="flex items-center gap-1.5"><Zap size={12} className="text-blue-400 shrink-0" /> Real Exam Simulation</div>
              <div className="flex items-center gap-1.5"><Crown size={12} className="text-[#FF7A00] shrink-0" /> Trusted by Top Rankers</div>
              <div className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-400 shrink-0" /> Secure Platform</div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default AISimulationSection;
