import { useState, useEffect } from 'react';
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
// sdfsd
const LandingPage = () => {
  const navigate = useNavigate();
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(true);

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

      {/* Auto-scrolling Exams Strip */}
      <div className="w-full bg-slate-50 py-7 border-y border-slate-100 overflow-hidden relative select-none">
        {/* Left and Right Fade Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

        <div className="animate-marquee flex gap-8 items-center">
          {[
            'JEE Mains/Adv', 'NEET UG', 'SSC CGL', 'Banking (IBPS/SBI)', 'Railways (RRB)', 
            'Defence (NDA/CDS)', 'State PCS (UPSC)', 'Teaching (CTET/STET)', 'UPSI', 
            'UPP Constable', 'UPSSSC', 'NDA', 'Boards'
          ].concat([
            'JEE Mains/Adv', 'NEET UG', 'SSC CGL', 'Banking (IBPS/SBI)', 'Railways (RRB)', 
            'Defence (NDA/CDS)', 'State PCS (UPSC)', 'Teaching (CTET/STET)', 'UPSI', 
            'UPP Constable', 'UPSSSC', 'NDA', 'Boards'
          ]).concat([
            'JEE Mains/Adv', 'NEET UG', 'SSC CGL', 'Banking (IBPS/SBI)', 'Railways (RRB)', 
            'Defence (NDA/CDS)', 'State PCS (UPSC)', 'Teaching (CTET/STET)', 'UPSI', 
            'UPP Constable', 'UPSSSC', 'NDA', 'Boards'
          ]).map((exam, idx) => {
            const getExamRoute = (name: string) => {
              switch (name) {
                case 'JEE Mains/Adv':
                  return '/test-series?category=Engineering%20entrance&subcategory=JEE';
                case 'NEET UG':
                  return '/test-series?category=Medical%20entrance&subcategory=NEET';
                case 'SSC CGL':
                  return '/test-series?category=SSC';
                case 'Banking (IBPS/SBI)':
                  return '/test-series?category=Banking';
                case 'Railways (RRB)':
                  return '/test-series?category=Railways';
                case 'Defence (NDA/CDS)':
                  return '/test-series?category=Defence%20exams&subcategory=NDA';
                case 'State PCS (UPSC)':
                  return '/test-series?category=State%20PCS';
                case 'Teaching (CTET/STET)':
                  return '/test-series?category=Teaching%20exams';
                case 'UPSI':
                  return '/test-series?category=State%20govt.%20Exam&subcategory=UPSI';
                case 'UPP Constable':
                  return '/test-series?category=State%20govt.%20Exam&subcategory=UPP%20contable';
                case 'UPSSSC':
                  return '/test-series?category=State%20govt.%20Exam&subcategory=UPSSSC';
                case 'NDA':
                  return '/test-series?category=Defence%20exams&subcategory=NDA';
                case 'Boards':
                  return '/test-series?category=Boards';
                default:
                  return '/test-series';
              }
            };

            return (
              <div 
                key={idx}
                onClick={() => navigate(getExamRoute(exam))}
                className="flex items-center gap-3 px-6 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_22px_-4px_rgba(0,0,0,0.05)] text-[13px] font-black text-slate-800 transition-all hover:scale-105 cursor-pointer hover:border-blue-200 shrink-0 whitespace-nowrap"
              >
                <span className="flex items-center justify-center bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded leading-none animate-pulse">
                  LIVE
                </span>
                <span className="tracking-wide uppercase">{exam}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. AI Analysis and Real Exam Simulation Demo */}
      <AISimulationSection />

      {/* 3. Trending Test series / PYQs (Resources) */}
      <PYQSection />

      {/* Trending Series */}
      {/* <section id="test-series" className="py-24 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-xs font-bold text-[#1D64D0] tracking-widest uppercase mb-2 block">Trending Products</span>
                        <h3 className="text-3xl md:text-5xl font-extrabold text-[#0B4F97]">Test Series</h3>
                        <div className="w-20 h-1.5 bg-[#1D64D0] mx-auto mt-6 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            <div className="col-span-full flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D64D0]"></div>
                            </div>
                        ) : testSeries.length > 0 ? (
                            testSeries.map((series) => (
                                <TestSeriesCard
                                    key={series.id}
                                    title={series.name}
                                    isNew={true}
                                    originalPrice={series.pricing.type === 'paid' ? `${(series.pricing.amount || 0) * 1.5}` : '0'}
                                    price={series.pricing.type === 'paid' ? `${series.pricing.amount}` : 'Free'}
                                    features={series.description ? [series.description] : []}
                                    onExplore={() => handleBuy(series.id)}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-500 py-12">
                                <p>No test series available at the moment.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section> */}
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
                  whileHover={{ y: -8 }}
                  key={series.id}
                  className="group bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all duration-300 overflow-hidden flex flex-col h-full relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-50/0 to-blue-50/0 group-hover:to-blue-50/50 transition-colors duration-300 pointer-events-none z-0"></div>

                  {/* Thumbnail Image */}
                  {series.thumbnailUrl && (
                    <div className="w-full h-40 overflow-hidden relative z-10 border-b border-gray-100">
                      <img
                        src={series.thumbnailUrl}
                        alt={series.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  {/* Top badges */}
                  <div className={`flex justify-between items-center px-6 ${series.thumbnailUrl ? 'pt-4' : 'pt-6'} relative z-10`}>
                    <span className="text-xs font-bold bg-gradient-to-r from-emerald-400 to-green-500 text-white px-3 py-1 rounded-full shadow-sm">
                      New
                    </span>

                    <span className="text-xs text-[#1D64D0] font-bold uppercase tracking-wider">
                      {series.examCategory || 'Test Series'}{series.examSubCategory ? ` (${series.examSubCategory})` : ''}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="px-6 mt-4 relative z-10">
                    <h4 className="text-xl font-bold text-gray-900 group-hover:text-[#1D64D0] transition-colors duration-300">
                      {series.name}
                    </h4>
                  </div>

                  {/* Description */}
                  <div className="px-6 mt-3 relative z-10 flex-grow">
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                      {series.description || "Practice with high-quality mock tests and detailed solutions."}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="px-6 mt-6 space-y-3 text-sm text-gray-600 relative z-10">
                    <p className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-[#1D64D0] text-xs">✓</span>
                      <span className="font-medium">Detailed Solutions</span>
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-[#1D64D0] text-xs">✓</span>
                      <span className="font-medium">All India Ranking</span>
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-[#1D64D0] text-xs">✓</span>
                      <span className="font-medium">Performance Analytics</span>
                    </p>
                  </div>

                  {/* Price and CTA section */}
                  <div className="p-6 mt-8 bg-gray-50/80 group-hover:bg-blue-50/50 transition-colors duration-300 mt-auto border-t border-gray-100 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      {series.pricing.type === "paid" ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold text-gray-900">
                            ₹{series.pricing.amount}
                          </span>
                          <span className="text-sm font-medium text-gray-400 line-through">
                            ₹{(series.pricing.amount || 0) * 1.5}
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xl font-extrabold text-emerald-500">
                          Free
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleBuy(series.id)}
                      className="w-full relative overflow-hidden bg-[#1D64D0] text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-md group-hover:shadow-blue-500/30 group-hover:bg-blue-700"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Explore Test Series
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </button>
                  </div>

                </motion.div>

              ))}
            </div>

          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm"
            >
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-500 font-medium">
                No test series available at the moment.
              </p>
            </motion.div>
          )}
        </div>
      </section>

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
