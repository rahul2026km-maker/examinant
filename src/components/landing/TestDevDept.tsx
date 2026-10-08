import { ShieldCheck, TrendingUp, Search, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import directorImg from '../../assets/director.png';
import sudhanshuImg from '../../assets/sudhanshu_sir.png';

const TestDevDept = () => {
    const navigate = useNavigate();
    return (
        <section className="py-24 bg-[#040814] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center mb-20 px-4">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Meet the Minds Behind Every Test</h2>
                    <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-8">
                        Engineered with precision. Reviewed with responsibility. Designed for real exams.
                    </p>
                    <p className="text-sm md:text-base font-medium text-slate-300 leading-relaxed max-w-2xl mx-auto">
                        Every Examinantt test is built by a dedicated development system — not random question selection.
                        Our process combines subject expertise, exam trend analysis, multi-level review, and AI validation.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6 mb-20">
                    {[
                        {
                            title: "Subject Expert Team",
                            icon: <Search className="text-blue-400" size={22} />,
                            badgeColor: "bg-blue-500/10 border-blue-500/20 text-blue-400",
                            points: ["NCERT & syllabus alignment", "Concept-wise difficulty tagging", "Balanced distribution of questions"]
                        },
                        {
                            title: "Exam Pattern Analysts",
                            icon: <TrendingUp className="text-emerald-400" size={22} />,
                            badgeColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                            points: ["Past year paper analysis", "Difficulty level calibration", "Section-wise weightage planning"]
                        },
                        {
                            title: "Multi-Level Quality Review",
                            icon: <ShieldCheck className="text-cyan-400" size={22} />,
                            badgeColor: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
                            points: ["Draft → Review → Error Check", "Ensuring clarity & fairness", "No ambiguous questions"]
                        },
                        {
                            title: "AI-Assisted Validation Team",
                            icon: <UserCheck className="text-purple-400" size={22} />,
                            badgeColor: "bg-purple-500/10 border-purple-500/20 text-purple-400",
                            points: ["Structure & timing verification", "Question balance checks", "OMR compatibility validation"]
                        }
                    ].map((item, i) => (
                        <div key={i} className="bg-[#0B152B] rounded-2xl p-7 sm:p-8 min-h-[260px] shadow-xl border border-[#17254E] hover:border-blue-500/40 hover:bg-[#0D1833] transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
                            <div>
                                <div className="p-3 bg-[#0E1B38] border border-[#1E3360] rounded-xl w-fit mb-5 group-hover:scale-105 transition-transform">
                                    {item.icon}
                                </div>
                                <h3 className="text-base lg:text-lg font-black text-white mb-4 leading-snug">{item.title}</h3>
                                <ul className="space-y-3">
                                    {item.points.map((p, j) => (
                                        <li key={j} className="flex items-start gap-2.5">
                                            <span className="w-4 h-4 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</span>
                                            <span className="text-xs font-semibold text-slate-300 leading-relaxed">{p}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Test Developer Team */}
                <div className="mt-20 border-t border-slate-800/80 pt-14 mb-16">
                    <div className="text-center mb-10">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Test Developer Team</h3>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-2xl mx-auto">
                            The subject specialists and experts who craft exam-level questions for your success.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
                        {/* Director */}
                        <div className="bg-[#0B152B] hover:bg-[#0E1B38] rounded-xl p-3.5 border border-[#17254E] hover:border-blue-500/40 shadow-lg transition-all flex flex-col items-center text-center group">
                            <div className="w-full aspect-[4/5] rounded-lg overflow-hidden bg-[#070D1E] mb-3.5 relative border border-white/5">
                                <img src={directorImg} alt="Aditya Kushwaha" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">Aditya Kushwaha</h4>
                            <p className="text-xs text-orange-400 font-semibold tracking-wide mt-1 bg-orange-500/10 border border-orange-500/20 px-3 py-0.5 rounded-lg">Director</p>
                        </div>

                        {/* Test Developer */}
                        <div className="bg-[#0B152B] hover:bg-[#0E1B38] rounded-xl p-3.5 border border-[#17254E] hover:border-blue-500/40 shadow-lg transition-all flex flex-col items-center text-center group">
                            <div className="w-full aspect-[4/5] rounded-lg overflow-hidden bg-[#070D1E] mb-3.5 relative border border-white/5">
                                <img src={sudhanshuImg} alt="Sudhanshu Sir" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">Sudhanshu Sir</h4>
                            <p className="text-xs text-blue-400 font-semibold tracking-wide mt-1 bg-blue-500/10 border border-blue-500/20 px-3 py-0.5 rounded-lg">Test Developer</p>
                        </div>

                        {/* Placeholder Slot */}
                        <div className="bg-[#0B152B] hover:bg-[#0E1B38] rounded-xl p-3.5 border border-[#17254E] hover:border-blue-500/40 shadow-lg transition-all flex flex-col items-center text-center group">
                            <div className="w-full aspect-[4/5] rounded-lg overflow-hidden bg-[#070D1E] mb-3.5 border border-dashed border-slate-700/60 flex items-center justify-center relative">
                                <div className="text-center p-4">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-2 text-slate-400 font-bold text-base">
                                        +
                                    </div>
                                    <span className="text-xs text-slate-400 font-semibold">Coming Soon</span>
                                </div>
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-400 tracking-tight">Team Member</h4>
                            <p className="text-xs text-slate-400 font-semibold tracking-wide mt-1 bg-white/5 border border-white/10 px-3 py-0.5 rounded-lg">Subject Expert</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-6">
                    {/* Feature Highlights Row */}
                    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8">
                        {[
                            "Syllabus-Aligned Tests",
                            "Exam-Pattern Accurate",
                            "Multi-Stage Quality Checks",
                            "Designed for Rank Improvement"
                        ].map((b, i) => (
                            <div key={i} className="flex items-center gap-2 text-slate-300 font-medium text-xs sm:text-sm whitespace-nowrap bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-lg">
                                <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
                                <span>{b}</span>
                            </div>
                        ))}
                    </div>

                    {/* Action CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
                        <button 
                            onClick={() => navigate('/resources')}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 w-full sm:w-auto active:scale-95"
                        >
                            View Sample Test Paper
                        </button>
                        <button 
                            onClick={() => navigate('/test-series')}
                            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-lg font-semibold text-xs sm:text-sm transition-all w-full sm:w-auto active:scale-95"
                        >
                            Try a Demo Test (Free)
                        </button>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default TestDevDept;
