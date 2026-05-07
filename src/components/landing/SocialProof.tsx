// import { useNavigate } from 'react-router-dom';
// import { ArrowRight, CheckCircle, Clock } from 'lucide-react';

// const SocialProof = () => {
//     const navigate = useNavigate();

//     return (
//         <section className="py-32 bg-white overflow-hidden">
//             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

//                 <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">

//                     {/* Left: Toppers */}
//                     <div>
//                         <div className="text-center lg:text-left mb-12 lg:mb-16">
//                             <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 lg:mb-8">
//                                 Top Performers
//                             </div>
//                             <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#0B4F97] tracking-tighter mb-6 lg:mb-8 leading-tight">
//                                 Previous Year <br className="hidden sm:block" /> <span className="text-[#1D64D0]">Toppers.</span>
//                             </h2>
//                             <p className="text-lg lg:text-xl text-slate-500 font-medium leading-relaxed max-w-sm mx-auto lg:mx-0">
//                                 Our subject experts design questions strictly aligned with real exam difficulty.
//                             </p>
//                         </div>

//                         <div className="grid grid-cols-3 gap-3 md:gap-10 mb-12 lg:mb-16 px-2 sm:px-0">
//                             {[
//                                 { name: "Mihir S.", rank: "218", exam: "NEET", color: "bg-rose-500" },
//                                 { name: "Aditi V.", rank: "609", exam: "JEE", color: "bg-[#0B4F97]" },
//                                 { name: "Rahul D.", rank: "129", exam: "SSC", color: "bg-orange-500" }
//                             ].map((topper, i) => (
//                                 <div key={i} className="text-center group">
//                                     <div className="relative mb-6">
//                                         <div className="aspect-[4/5] rounded-[20px] sm:rounded-[32px] bg-slate-100 overflow-hidden border-[4px] lg:border-[6px] border-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-all duration-500 group-hover:rotate-2">
//                                             <img src={`https://i.pravatar.cc/300?u=${topper.name}`} alt={topper.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
//                                         </div>
//                                         <div className={`absolute -bottom-3 -right-1 sm:-bottom-4 sm:-right-2 w-10 h-10 sm:w-16 sm:h-16 ${topper.color} rounded-lg sm:rounded-2xl border-2 sm:border-4 border-white flex flex-col items-center justify-center text-white shadow-xl rotate-12 group-hover:rotate-0 transition-transform duration-500`}>
//                                             <p className="text-[6px] sm:text-[10px] font-black leading-none opacity-80">{topper.exam}</p>
//                                             <p className="text-xs sm:text-lg font-black tracking-tighter">{topper.rank}</p>
//                                         </div>
//                                     </div>
//                                     <h4 className="font-black text-[#0B4F97] text-sm sm:text-lg tracking-tight">{topper.name.split(' ')[0]}</h4>
//                                 </div>
//                             ))}
//                         </div>

//                         <div className="flex flex-wrap gap-6 lg:gap-8 items-center justify-center lg:justify-start border-t border-slate-50 pt-8 lg:pt-10">
//                             {[
//                                 { label: "Syllabus-Aligned", icon: <CheckCircle /> },
//                                 { label: "Pattern-Accurate", icon: <CheckCircle /> }
//                             ].map((item, i) => (
//                                 <div key={i} className="flex items-center gap-2 text-[10px] lg:text-xs font-black text-[#0B4F97] uppercase tracking-widest">
//                                     <div className="text-green-500">{item.icon}</div>
//                                     {item.label}
//                                 </div>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Right: Final CTA */}
//                     <div className="mt-16 lg:mt-0 relative text-center lg:text-left">
//                         {/* Decorative Background Aura */}
//                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-50/60 rounded-full blur-[80px] lg:blur-[120px] -z-10"></div>

//                         <div className="relative space-y-8 lg:space-y-12">
//                             <div>
//                                 <h3 className="text-xl lg:text-2xl font-black text-[#1D64D0] mb-3 lg:mb-4 tracking-tighter uppercase tracking-[0.1em]">Don't Leave Your</h3>
//                                 <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-[#0B4F97] tracking-[-0.05em] leading-[0.9] px-2 sm:px-0">
//                                     Rank to <br /> <span className="text-[#1D64D0]">Chance.</span>
//                                 </h2>
//                             </div>

//                             <div className="flex flex-col sm:flex-row items-center lg:items-start gap-6 max-w-md mx-auto lg:mx-0">
//                                 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F0F6FF] rounded-[24px] sm:rounded-[30px] flex items-center justify-center text-[#1D64D0] shadow-xl shadow-blue-500/10 shrink-0">
//                                     <Clock size={30} className="sm:size-9" strokeWidth={2.5} />
//                                 </div>
//                                 <p className="text-lg lg:text-xl text-slate-500 font-medium leading-normal">
//                                     Every minute matters. Start your practice with precision and engineer your success today.
//                                 </p>
//                             </div>

//                             <div className="flex flex-col gap-4 lg:gap-5 pt-4 max-w-sm ml-auto mr-auto lg:ml-0">
//                                 <button
//                                     onClick={() => navigate('/signup')}
//                                     className="w-full py-5 lg:py-6 bg-orange-500 hover:bg-orange-600 text-white rounded-[20px] lg:rounded-[24px] font-black text-xl lg:text-2xl transition-all shadow-2xl shadow-orange-500/30 flex items-center justify-center gap-4 active:scale-95 group"
//                                 >
//                                     Start Practice
//                                     <ArrowRight size={24} className="sm:size-28 group-hover:translate-x-2 transition-transform" />
//                                 </button>
//                                 <button
//                                     className="w-full py-5 lg:py-6 bg-white text-[#0B4F97] border-2 border-slate-100 rounded-[20px] lg:rounded-[24px] font-black text-xl lg:text-2xl hover:bg-blue-50 hover:border-blue-100 transition-all active:scale-95"
//                                 >
//                                     Try a Demo Test
//                                 </button>
//                             </div>

//                             <div className="flex items-center justify-center lg:justify-start gap-3 pt-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
//                                 <div className="w-6 sm:w-8 h-px bg-slate-100"></div>
//                                 Trusted by serious aspirants
//                                 <div className="w-6 sm:w-8 h-px bg-slate-100"></div>
//                             </div>
//                         </div>
//                     </div>

//                 </div>
//             </div>
//         </section>
//     );
// };

// export default SocialProof;


import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Clock } from "lucide-react";

const SocialProof = () => {
  const navigate = useNavigate();

  const toppers = [
    {
      name: "Mihir S.",
      rank: "218",
      exam: "NEET",
      color: "bg-rose-500",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e",
    },
    {
      name: "Aditi V.",
      rank: "609",
      exam: "JEE",
      color: "bg-[#0B4F97]",
      image:
        "https://images.unsplash.com/photo-1595152772835-219674b2a8a6",
    },
    {
      name: "Rahul D.",
      rank: "129",
      exam: "SSC",
      color: "bg-orange-500",
      image:
        "https://images.unsplash.com/photo-1615109398623-88346a601842",
    },
  ];

  return (
    <section className="py-28 bg-[#F8FAFC] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* LEFT SIDE */}
          <div>
            <div className="text-center lg:text-left mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-xs font-bold text-[#1D64D0] uppercase tracking-widest mb-6">
                Top Performers
              </div>

              <h2 className="text-4xl md:text-5xl font-extrabold text-[#0B4F97] leading-tight mb-6">
                Previous Year <br />
                <span className="text-[#1D64D0]">Toppers</span>
              </h2>

              <p className="text-lg text-slate-500 max-w-md mx-auto lg:mx-0">
                Our subject experts design questions strictly aligned with real exam difficulty.
              </p>
            </div>

            {/* TOPPER CARDS */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              {toppers.map((topper, i) => (
                <div key={i} className="text-center group">

                  <div className="relative">

                    <div className="rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition duration-300">
                      <img
                        src={topper.image}
                        alt={topper.name}
                        className="w-full h-44 object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>

                    <div
                      className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${topper.color} text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md`}
                    >
                      {topper.exam} #{topper.rank}
                    </div>

                  </div>

                  <h4 className="mt-4 font-semibold text-[#0B4F97]">
                    {topper.name}
                  </h4>
                </div>
              ))}
            </div>

            {/* FEATURES */}
            <div className="flex gap-8 justify-center lg:justify-start border-t pt-8">
              {[
                { label: "Syllabus-Aligned" },
                { label: "Pattern-Accurate" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm font-semibold text-[#0B4F97]"
                >
                  <CheckCircle size={16} className="text-green-500" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE CTA */}
          <div className="text-center lg:text-left">

            <h3 className="text-lg font-bold text-[#1D64D0] uppercase tracking-wider mb-3">
              Don't Leave Your
            </h3>

            <h2 className="text-5xl md:text-6xl font-extrabold text-[#0B4F97] leading-tight mb-8">
              Rank to <br />
              <span className="text-[#1D64D0]">Chance</span>
            </h2>

            <div className="flex flex-col sm:flex-row gap-6 items-center lg:items-start mb-10">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1D64D0]">
                <Clock size={28} />
              </div>

              <p className="text-lg text-slate-500 max-w-md">
                Every minute matters. Start your practice with precision and engineer your success today.
              </p>
            </div>

            {/* BUTTONS */}
            <div className="flex flex-col gap-4 max-w-sm mx-auto lg:mx-0">

              <button
                onClick={() => navigate("/signup")}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition"
              >
                Start Practice
                <ArrowRight className="group-hover:translate-x-1 transition" />
              </button>

              <button 
                onClick={() => navigate('/test-series')}
                className="w-full py-4 bg-white border border-gray-200 text-[#0B4F97] rounded-xl font-bold text-lg hover:bg-blue-50 transition"
              >
                Try a Demo Test
              </button>

            </div>

            <div className="flex items-center justify-center lg:justify-start gap-3 pt-8 text-xs text-slate-400 uppercase tracking-wider">
              <div className="w-6 h-px bg-gray-200"></div>
              Trusted by serious aspirants
              <div className="w-6 h-px bg-gray-200"></div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;