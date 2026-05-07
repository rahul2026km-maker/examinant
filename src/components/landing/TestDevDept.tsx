import { ShieldCheck, TrendingUp, Search, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TestDevDept = () => {
    const navigate = useNavigate();
    return (
        <section className="py-24 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center mb-20 px-4">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-[#0B4F97] mb-6">Meet the Minds Behind Every Test</h2>
                    <p className="text-lg text-slate-500 max-w-3xl mx-auto mb-8">
                        Engineered with precision. Reviewed with responsibility. Designed for real exams.
                    </p>
                    <div className="bg-white p-6 rounded-3xl inline-block shadow-sm border border-slate-100">
                        <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-2xl">
                            Every Examinantt test is built by a dedicated development system — not random question selection.
                            Our process combines subject expertise, exam trend analysis, multi-level review, and AI validation.
                        </p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-20">
                    {[
                        {
                            title: "Subject Expert Team",
                            icon: <Search className="text-blue-500" />,
                            points: ["NCERT & syllabus alignment", "Concept-wise difficulty tagging", "Balanced distribution of questions"]
                        },
                        {
                            title: "Exam Pattern Analysts",
                            icon: <TrendingUp className="text-green-500" />,
                            points: ["Past year paper analysis", "Difficulty level calibration", "Section-wise weightage planning"]
                        },
                        {
                            title: "Multi-Level Quality Review",
                            icon: <ShieldCheck className="text-[#1D64D0]" />,
                            points: ["Draft -> Review -> Error Check", "Ensuring clarity & fairness", "No ambiguous questions"]
                        },
                        {
                            title: "AI-Assisted Validation Team",
                            icon: <UserCheck className="text-purple-500" />,
                            points: ["Structure & timing verification", "Question balance checks", "OMR compatibility validation"]
                        }
                    ].map((item, i) => (
                        <div key={i} className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all relative overflow-hidden group">
                            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                {item.icon}
                            </div>
                            <h3 className="text-lg lg:text-xl font-bold text-[#0B4F97] mb-6 leading-tight min-h-[3rem]">{item.title}</h3>
                            <ul className="space-y-3 lg:space-y-4">
                                {item.points.map((p, j) => (
                                    <li key={j} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-200 mt-1.5 shrink-0"></div>
                                        <span className="text-[11px] lg:text-xs font-semibold text-slate-600 leading-relaxed">{p}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-8 lg:gap-10">
                    <div className="flex flex-wrap justify-center gap-6 lg:gap-12">
                        {[
                            "Syllabus-Aligned Tests",
                            "Exam-Pattern Accurate",
                            "Multi-Stage Quality Checks",
                            "Designed for Rank Improvement"
                        ].map((b, i) => (
                            <div key={i} className="flex items-center gap-2 text-[#0B4F97] font-bold text-xs lg:text-sm whitespace-nowrap">
                                <ShieldCheck size={18} className="text-green-500 shrink-0" />
                                {b}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button 
                            onClick={() => navigate('/resources')}
                            className="px-8 py-4 bg-[#0B4F97] text-white rounded-xl font-black text-sm lg:text-base hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 w-full sm:w-auto"
                        >
                            View Sample Test Paper
                        </button>
                        <button 
                            onClick={() => navigate('/test-series')}
                            className="px-8 py-4 bg-white text-[#0B4F97] border-2 border-slate-200 rounded-xl font-black text-sm lg:text-base hover:bg-slate-50 transition-all w-full sm:w-auto"
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
