import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getAllTestSeries } from '../services/testSeriesService';
import type { TestSeries } from '../types/test.types';
import Navbar from '../components/landing/Navbar';
import HeroSlider from '../components/landing/HeroSlider';
import AISimulationSection from '../components/landing/AISimulationSection';
import PYQSection from '../components/landing/PYQSection';
import TestDevDept from '../components/landing/TestDevDept';
import SocialProof from '../components/landing/SocialProof';
import Footer from '../components/landing/Footer';
import { ChevronLeft, ChevronRight } from 'lucide-react';
const EXAMS_LIST = [
  { 
    name: 'NDA', 
    students: '1,245+ Students', 
    bgColor: 'bg-blue-50/60',
    renderIcon: () => (
      <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 4L12 12C12 28 20 48 32 60C44 48 52 28 52 12L32 4Z" fill="#0B4F97" stroke="#D4AF37" strokeWidth="2"/>
        <path d="M32 14V46" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round"/>
        <path d="M22 26C22 26 26 34 32 34C38 34 42 26 42 26" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
        <path d="M22 36C22 36 26 42 32 42C38 42 42 36 42 36" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="32" cy="20" r="4" fill="#D4AF37"/>
      </svg>
    )
  },
  { 
    name: 'BOARDS', 
    students: '3,876+ Students', 
    bgColor: 'bg-emerald-50/60',
    renderIcon: () => (
      <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 50C18 45 32 48 32 48C32 48 46 45 58 50V16C46 11 32 14 32 14C32 14 18 11 6 16V50Z" fill="#10B981" stroke="#047857" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M32 14V48" stroke="#047857" strokeWidth="2"/>
        <path d="M12 22H26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 28H26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 34H22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M38 22H52" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M38 28H52" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M42 34H52" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  { 
    name: 'JEE MAINS/ADV', 
    students: '8,765+ Students', 
    bgColor: 'bg-blue-50/60',
    renderIcon: () => (
      <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Circular joint head */}
        <circle cx="32" cy="14" r="4.5" stroke="#1D64D0" strokeWidth="3.5" fill="none"/>
        <circle cx="32" cy="14" r="1.5" fill="#1D64D0"/>
        {/* Left leg */}
        <path d="M29.5 17.5L18 52" stroke="#1D64D0" strokeWidth="4" strokeLinecap="round"/>
        {/* Right leg */}
        <path d="M34.5 17.5L46 52" stroke="#1D64D0" strokeWidth="4" strokeLinecap="round"/>
        {/* Curved arc (arch) */}
        <path d="M23 40C26 35 38 35 41 40" stroke="#1D64D0" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        {/* Center screw dial */}
        <circle cx="32" cy="37" r="3" fill="#1D64D0"/>
        <line x1="27" y1="37" x2="37" y2="37" stroke="#1D64D0" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  },
  { 
    name: 'NEET UG', 
    students: '6,432+ Students', 
    bgColor: 'bg-[#EAFDF5]',
    renderIcon: () => (
      <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Strand 1 (Left to Right Wave) */}
        <path d="M20 12C20 22 44 22 44 32C44 42 20 42 20 52" stroke="#0EAD69" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
        {/* Strand 2 (Right to Left Wave) */}
        <path d="M44 12C44 22 20 22 20 32C20 42 44 42 44 52" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
        {/* Rungs (connecting bars) */}
        <line x1="23" y1="16" x2="41" y2="16" stroke="#34D399" strokeWidth="2" />
        <line x1="28" y1="24" x2="36" y2="24" stroke="#34D399" strokeWidth="2" />
        <line x1="28" y1="40" x2="36" y2="40" stroke="#34D399" strokeWidth="2" />
        <line x1="23" y1="48" x2="41" y2="48" stroke="#34D399" strokeWidth="2" />
      </svg>
    )
  },
  { 
    name: 'SSC CGL', 
    students: '9,876+ Students', 
    bgColor: 'bg-purple-50/60',
    renderIcon: () => (
      <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 56H56" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round"/>
        <path d="M8 56V8" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round"/>
        <path d="M14 42L26 28L38 34L52 14" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M44 14H52V22" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="14" cy="42" r="3.5" fill="#7C3AED"/>
        <circle cx="26" cy="28" r="3.5" fill="#7C3AED"/>
        <circle cx="38" cy="34" r="3.5" fill="#7C3AED"/>
        <circle cx="52" cy="14" r="3.5" fill="#7C3AED"/>
      </svg>
    )
  },
  { 
    name: 'BANKING (IBPS/SBI)', 
    students: '4,321+ Students', 
    bgColor: 'bg-blue-50/60',
    renderIcon: () => (
      <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8L6 20V24H58V20L32 8Z" fill="#1E40AF" stroke="#1E3A8A" strokeWidth="2"/>
        <rect x="12" y="24" width="6" height="24" fill="#1D4ED8" stroke="#1E3A8A" strokeWidth="2"/>
        <rect x="24" y="24" width="6" height="24" fill="#1D4ED8" stroke="#1E3A8A" strokeWidth="2"/>
        <rect x="36" y="24" width="6" height="24" fill="#1D4ED8" stroke="#1E3A8A" strokeWidth="2"/>
        <rect x="48" y="24" width="6" height="24" fill="#1D4ED8" stroke="#1E3A8A" strokeWidth="2"/>
        <rect x="8" y="48" width="48" height="8" fill="#1E40AF" stroke="#1E3A8A" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    name: 'RAILWAYS (RRB)', 
    students: '5,621+ Students', 
    bgColor: 'bg-teal-50/60',
    renderIcon: () => (
      <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="10" width="36" height="40" rx="8" fill="#0D9488" stroke="#0f766e" strokeWidth="2"/>
        <rect x="18" y="14" width="28" height="16" rx="4" fill="white"/>
        <circle cx="22" cy="42" r="3.5" fill="white"/>
        <circle cx="42" cy="42" r="3.5" fill="white"/>
        <rect x="22" y="34" width="20" height="2.5" fill="white"/>
      </svg>
    )
  },
  { 
    name: 'DEFENCE (NDA/CDS)', 
    students: '2,987+ Students', 
    bgColor: 'bg-blue-50/60',
    renderIcon: () => (
      <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 4L12 12C12 28 20 48 32 60C44 48 52 28 52 12L32 4Z" fill="#1D64D0" stroke="#0B4F97" strokeWidth="2"/>
        <path d="M32 14V46" stroke="#0B4F97" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="32" cy="20" r="4" fill="#0B4F97"/>
      </svg>
    )
  },
  { 
    name: 'STATE PCS (UPSC)', 
    students: '4,654+ Students', 
    bgColor: 'bg-indigo-50/60',
    renderIcon: () => (
      <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="20" width="44" height="32" rx="4" fill="#4F46E5" stroke="#4338ca" strokeWidth="2"/>
        <path d="M22 20V12C22 10.8954 22.8954 10 24 10H40C41.1046 10 42 10.8954 42 12V20" stroke="#4338ca" strokeWidth="3"/>
        <rect x="28" y="30" width="8" height="6" rx="1" fill="#D4AF37"/>
      </svg>
    )
  },
  { 
    name: 'TEACHING (CTET/STET)', 
    students: '3,210+ Students', 
    bgColor: 'bg-cyan-50/60',
    renderIcon: () => (
      <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8L58 20L32 32L6 20L32 8Z" fill="#0891B2" stroke="#0e7490" strokeWidth="2"/>
        <path d="M16 25V39C16 43 23 46 32 46C41 46 48 43 48 39V25" stroke="#0e7490" strokeWidth="3"/>
        <path d="M50 20V36C50 36 48 38 46 38" stroke="#D4AF37" strokeWidth="2"/>
      </svg>
    )
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchTestSeries = async () => {
      try {
        const data = await getAllTestSeries({ status: 'published' });
        setTestSeries(data);
      } catch (error) {
        console.error("Error fetching test series:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestSeries();
  }, []);

  const handleBuy = (seriesId: string) => {
    navigate(`/test-series/${seriesId}`);
  };



  return (
    <div className="font-sans antialiased bg-white text-slate-900 selection:bg-[#1D64D0] selection:text-white">
      <Navbar />

      {/* 1 & 2. Hero Slider */}
      <HeroSlider />

      {/* Exams Running Strip / Slider Carousel */}
      <div className="w-full bg-[#FAFBFC] py-10 px-4 sm:px-8 md:px-12 border-y border-slate-100 relative select-none mt-2">
        {/* Upper right decorative curves */}
        <div className="absolute right-0 top-0 bottom-0 w-[240px] pointer-events-none z-10 overflow-hidden hidden md:block">
          <svg className="w-full h-full" viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M240 10 C140 30, 130 90, 240 120" stroke="#0B4F97" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.9"/>
            <path d="M240 25 C160 45, 150 95, 240 115" stroke="#FF6B00" strokeWidth="20" strokeLinecap="round" fill="none" opacity="0.95"/>
          </svg>
        </div>

        {/* EXAMS RUNNING Badge */}
        <div className="absolute top-0 left-8 md:left-14 -translate-y-1/2 bg-[#0B4F97] text-white text-[10px] sm:text-xs font-extrabold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-md uppercase tracking-wider z-20">
          <span>🔥</span> Exams Running
        </div>

        {/* Outer Wrapper for Slider and Buttons */}
        <div className="max-w-7xl mx-auto relative px-6 sm:px-8">
          
          {/* Left Arrow Button */}
          <button 
            onClick={scrollLeft} 
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-100 text-slate-600 hover:text-[#1D64D0] transition-all z-20 hover:scale-110 active:scale-95"
            title="Scroll Left"
          >
            <ChevronLeft size={20} className="stroke-[2.5]" />
          </button>

          {/* Right Arrow Button */}
          <button 
            onClick={scrollRight} 
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-100 text-slate-600 hover:text-[#1D64D0] transition-all z-20 hover:scale-110 active:scale-95"
            title="Scroll Right"
          >
            <ChevronRight size={20} className="stroke-[2.5]" />
          </button>

          {/* Carousel Slider */}
          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [scrollbar-width:none] py-4 px-2 w-full"
          >
            {EXAMS_LIST.map((exam, idx) => {
              return (
                <div 
                  key={idx}
                  className="relative flex items-center p-4 pt-6 bg-white border border-slate-100 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] w-[210px] shrink-0 hover:scale-[1.02] hover:shadow-[0_10px_30px_-6px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all duration-300"
                >
                  {/* LIVE Badge */}
                  <span className="absolute top-2.5 left-3 bg-[#FF6B00] text-white text-[8px] font-black px-1.5 py-0.5 rounded leading-none">
                    LIVE
                  </span>
                  
                  <div className="flex items-center gap-3 w-full mt-1.5">
                    {/* Icon wrapper */}
                    <div className={`p-1.5 rounded-xl ${exam.bgColor} flex items-center justify-center shrink-0 w-12 h-12`}>
                      {exam.renderIcon()}
                    </div>
                    {/* Text content */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-extrabold text-slate-800 tracking-wide uppercase truncate leading-tight">
                        {exam.name}
                      </span>
                      <span className="text-[9px] font-bold text-orange-500 mt-1 leading-none">
                        Live Tests
                      </span>
                      <span className="text-[9px] font-medium text-slate-400 mt-1.5 leading-none">
                        {exam.students}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* 4. AI Analysis and Real Exam Simulation Demo */}
      <AISimulationSection />

      {/* Test Series Section */}
      <section id="test-series" className="py-24 bg-[#F8FAFC] scroll-mt-24 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 blur-3xl"></div>
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-50/50 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <span className="inline-block text-xs font-bold text-[#1D64D0] bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full tracking-wider uppercase mb-4 shadow-sm">
              Practice & Preparation
            </span>

            <h3 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Test <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1D64D0] to-blue-400">Series</span>
            </h3>

            <p className="mt-4 text-gray-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              Practice with curated mock tests designed to boost your exam performance and confidence.
            </p>

            <div className="w-16 h-1.5 bg-gradient-to-r from-[#1D64D0] to-blue-400 mx-auto mt-6 rounded-full"></div>
          </motion.div>

          {/* CONTENT */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#1D64D0]"></div>
            </div>
          ) : testSeries.length > 0 ? (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {testSeries.map((series, index) => (

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  key={series.id}
                  className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 overflow-hidden flex flex-col h-full relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-50/0 to-blue-50/0 group-hover:to-blue-50/50 transition-colors duration-300 pointer-events-none z-0"></div>

                  {/* Thumbnail Image */}
                  {series.thumbnailUrl && (
                    <div className="w-full h-[150px] overflow-hidden relative z-10 border-b border-gray-100 bg-slate-900">
                      <img
                        src={series.thumbnailUrl}
                        alt={series.name}
                        className="w-full h-full object-fill group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  {/* Top badges */}
                  <div className={`flex justify-between items-center px-6 ${series.thumbnailUrl ? 'pt-5' : 'pt-6'} relative z-10`}>
                    <span className="text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-green-500 text-white px-2.5 py-0.5 rounded-full shadow-sm tracking-wide">
                      NEW
                    </span>

                    <span className="text-[10px] text-[#1D64D0] font-bold uppercase tracking-wider">
                      {series.examCategory || 'Test Series'}{series.examSubCategory ? ` (${series.examSubCategory})` : ''}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="px-6 mt-3.5 relative z-10">
                    <h4 className="text-[19px] font-bold text-gray-900 group-hover:text-[#1D64D0] transition-colors duration-300 leading-snug">
                      {series.name}
                    </h4>
                  </div>

                  {/* Description */}
                  <div className="px-6 mt-2.5 relative z-10 flex-grow">
                    <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed">
                      {series.description || "Practice with high-quality mock tests and detailed solutions."}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="px-6 mt-5 mb-5 space-y-2.5 text-[13px] text-gray-600 relative z-10">
                    <p className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-50 text-[#1D64D0] text-[10px]">✓</span>
                      <span className="font-medium">Detailed Solutions</span>
                    </p>
                    <p className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-50 text-[#1D64D0] text-[10px]">✓</span>
                      <span className="font-medium">All India Ranking</span>
                    </p>
                    <p className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-50 text-[#1D64D0] text-[10px]">✓</span>
                      <span className="font-medium">Performance Analytics</span>
                    </p>
                  </div>

                  {/* Price and CTA section */}
                  <div className="px-6 py-4 mt-auto bg-gray-50/80 group-hover:bg-blue-50/50 transition-colors duration-300 border-t border-gray-100 flex items-center justify-between relative z-10">
                    <div className="flex flex-col">
                      {series.pricing?.type === "paid" ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[22px] font-black text-gray-900 leading-none">
                              ₹{series.pricing?.amount}
                            </span>
                            <span className="text-[12px] font-bold text-gray-400 line-through">
                              ₹{Math.round((series.pricing?.amount || 0) * 1.5)}
                            </span>
                          </div>
                          <div className="mt-1.5">
                            <span className="text-[10px] font-extrabold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase tracking-wider">
                              33% OFF
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xl font-extrabold text-emerald-500">
                          Free
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleBuy(series.id)}
                      className="relative overflow-hidden bg-[#1D64D0] text-white font-bold py-2.5 px-8 min-w-[150px] text-[13px] rounded-lg transition-all duration-300 shadow-sm hover:bg-slate-900 active:scale-95"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-1.5">
                        Explore Series
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </button>
                  </div>

                </motion.div>

              ))}
            </div>

          ) : (
            <div className="text-center py-16">
              <div className="inline-block p-8 bg-white rounded-[32px] shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <div className="w-20 h-20 bg-blue-50/80 rounded-3xl flex items-center justify-center mx-auto mb-5 rotate-3 hover:rotate-6 transition-transform">
                  <svg className="text-[#1D64D0] w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Coming Soon</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto text-sm leading-relaxed">
                  Our expert faculty is currently crafting premium test series. Stay tuned for updates!
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Trending Test series / PYQs (Resources) */}
      <PYQSection />

      {/* 5. Test development Dept */}
      <TestDevDept />

      {/* 6. Social Proof & Final CTA */}
      <SocialProof />

      {/* 7. Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
