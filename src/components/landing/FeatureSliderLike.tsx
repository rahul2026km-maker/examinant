import { Trophy, Clock, Target, BarChart2 } from 'lucide-react';
import studentBanner from '../../assets/student_banner.png';

const FeatureSliderLike = () => {
    return (
        <section className="py-24 bg-[#070D1E] relative overflow-hidden text-slate-200 border-t border-[#17254E]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Content Left */}
                    <div>
                        <div className="inline-block px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-bold mb-6 border border-blue-500/20">
                            Why Students Trust Us?
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                            We Help You <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Crack The Exam Code.</span>
                        </h2>
                        <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                            Examinantt isn't just a test platform; it's your personal performance coach. We analyze every keystroke to tell you exactly where you're losing marks.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-8">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-[#0E1B38] rounded-xl flex items-center justify-center text-blue-400 shrink-0 border border-[#1E3360]">
                                    <Trophy size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg mb-1">95% Success Rate</h3>
                                    <p className="text-slate-400 text-sm">Students improving scores</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-[#0E1B38] rounded-xl flex items-center justify-center text-blue-400 shrink-0 border border-[#1E3360]">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg mb-1">Real-Time Sync</h3>
                                    <p className="text-slate-400 text-sm">Exam-like environment</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-[#0E1B38] rounded-xl flex items-center justify-center text-blue-400 shrink-0 border border-[#1E3360]">
                                    <Target size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg mb-1">Targeted Prep</h3>
                                    <p className="text-slate-400 text-sm">Focus on weak areas</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-[#0E1B38] rounded-xl flex items-center justify-center text-blue-400 shrink-0 border border-[#1E3360]">
                                    <BarChart2 size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg mb-1">AI Insights</h3>
                                    <p className="text-slate-400 text-sm">Detailed performance reports</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Right */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-600 rounded-[2rem] rotate-6 opacity-10 blur-xl scale-95 pointer-events-none"></div>
                        <img
                            src={studentBanner}
                            alt="Student Learning"
                            className="relative w-full rounded-[2rem] shadow-2xl object-cover aspect-[4/3] border-4 border-[#1E3360] ring-1 ring-blue-500/20"
                        />

                        {/* Floating Stat Card */}
                        <div className="absolute -bottom-6 -left-6 bg-[#0B152B] p-6 rounded-xl shadow-2xl border border-[#17254E] flex items-center gap-4 max-w-xs animate-bounce" style={{ animationDuration: '4s' }}>
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                                4.9
                            </div>
                            <div>
                                <div className="font-bold text-white">Top Rated Platform</div>
                                <div className="text-xs text-slate-400">Based on 5000+ reviews</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FeatureSliderLike;
