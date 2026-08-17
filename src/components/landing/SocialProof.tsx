import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";

const SocialProof = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-[#0B4F97] via-[#1D64D0] to-[#0A3D75] rounded-[40px] p-10 md:p-16 lg:p-20 overflow-hidden shadow-2xl">
          {/* Decorative background shapes to make it feel premium and full */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-12 xl:gap-20">
            {/* Left side: Text Content */}
            <div className="flex-1 text-center xl:text-left">
              <h3 className="text-blue-200 font-black uppercase tracking-widest mb-4 text-sm md:text-base">
                Don't Leave Your
              </h3>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-8">
                Rank to <span className="text-orange-400">Chance.</span>
              </h2>

              <div className="flex flex-col sm:flex-row items-center xl:items-start gap-6 max-w-xl mx-auto xl:mx-0">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-orange-400 shrink-0 border border-white/20">
                  <Clock size={28} />
                </div>
                <p className="text-lg md:text-xl text-blue-100 max-w-md text-center sm:text-left leading-relaxed">
                  Every minute matters. Start your practice with precision and engineer your success today.
                </p>
              </div>
            </div>

            {/* Right side: Buttons and Trust mark */}
            <div className="shrink-0 flex flex-col items-center xl:items-end w-full xl:w-auto">
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
                <button
                  onClick={() => navigate("/signup")}
                  className="w-full sm:w-auto px-6 py-3.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 group"
                >
                  Start Practice
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => navigate('/test-series')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-xl font-bold text-base transition-all active:scale-95"
                >
                  Try a Demo Test
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 pt-8 text-xs font-bold text-blue-200 uppercase tracking-widest opacity-80">
                <div className="w-8 h-px bg-blue-300/30"></div>
                Trusted by serious aspirants
                <div className="w-8 h-px bg-blue-300/30"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;