import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  PieChart as PieChartIcon,
  AlertCircle,
  CheckCircle,
  Zap,
  Activity,
  Layers
} from 'lucide-react';

const AISimulationSection = () => {
  const navigate = useNavigate();

  return (
    <section id="ai-simulation" className="bg-white py-24 sm:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">

        {/* AI Analytics Section */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-xs font-black text-blue-600 uppercase tracking-widest">
              <Zap size={14} className="fill-blue-600" /> Proprietary Intelligence
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
              AI That <span className="text-gradient-blue">Evolves</span> <br />
              With Your Progress.
            </h2>

            <p className="text-slate-600 text-lg sm:text-xl leading-relaxed max-w-xl">
              Our advanced algorithms analyze every keystroke and OMR bubble to identify hidden patterns that standard tests miss.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "Mistake Audit", desc: "Pattern recognition for silly errors", icon: <AlertCircle className="text-red-500" /> },
                { title: "Speed Metrics", desc: "Real-time velocity tracking", icon: <Clock className="text-blue-500" /> },
                { title: "Risk Profiling", desc: "Predictive OMR failure analysis", icon: <Activity className="text-orange-500" /> },
                { title: "Growth Path", desc: "Dynamic curriculum adjustments", icon: <Layers className="text-indigo-500" /> }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    {item.icon}
                    <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary-premium text-sm"
              >
                Unlock Insights
              </button>
              <button
                onClick={() => navigate('/resources')}
                className="px-6 py-3 text-slate-600 font-bold hover:text-blue-600 transition-colors"
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
            <div className="bg-slate-900 rounded-[40px] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.15),transparent)]"></div>

              <div className="relative space-y-10">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Global Ranking</p>
                    <h3 className="text-2xl font-black text-white">Performance Audit</h3>
                  </div>
                  <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-bold text-white/50">
                    ID: 8829-PX
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-xs font-bold text-slate-400">Composite Mastery</p>
                    <p className="text-3xl font-black text-white tracking-tighter">92.4 <span className="text-lg text-slate-500">/ 100</span></p>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '92.4%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Accuracy Rate</p>
                    <p className="text-2xl font-black text-white">88%</p>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[88%]"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Focus Score</p>
                    <p className="text-2xl font-black text-white">96%</p>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[96%]"></div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400">
                    <PieChartIcon size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Real-time Efficiency</p>
                    <p className="text-xs text-slate-400">Optimizing answer strategy now...</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-6 right-2 sm:-right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">Score Jump</p>
                  <p className="text-[10px] text-green-600 font-bold">+15.2% Today</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>



        {/* CTA Summary Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-[48px] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]"></div>

          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <h3 className="text-3xl sm:text-4xl font-black leading-tight">Eliminate Exam Day <br />Anxiety Forever.</h3>
              <p className="text-blue-100 text-lg leading-relaxed opacity-80">
                Join 12,000+ aspirants who have mastered the art of test-taking through our AI-simulated ecosystem.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={() => navigate('/test-series')}
                  className="px-8 py-4 bg-white text-blue-700 font-black rounded-2xl hover:shadow-xl transition-all active:scale-95"
                >
                  Try Demo Now
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-blue-600/30 text-white border border-white/20 rounded-2xl font-black backdrop-blur-sm hover:bg-blue-600/50 transition-all"
                >
                  Contact Counselor
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                "100% Pattern Match",
                "AI-Driven Logic",
                "Physical OMR Sheets",
                "Advanced Rankings"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                    <CheckCircle size={16} />
                  </div>
                  <p className="text-xs font-bold">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default AISimulationSection;
