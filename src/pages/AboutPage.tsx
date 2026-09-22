import PageLayout from '../components/landing/PageLayout';
import logo from '../assets/logo.png';
import directorImg from '../assets/director.png';
import sudhanshuImg from '../assets/sudhanshu_sir.png';

const AboutPage = () => {
    return (
        <PageLayout>
            <div className="bg-[#070D1E] py-16 text-slate-100 min-h-screen">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <img src={logo} alt="Examinantt Logo" className="w-20 h-20 mx-auto rounded-2xl mb-6 shadow-2xl border border-[#17254E]" />
                        <h1 className="text-4xl font-extrabold text-white mb-6">About Examinantt</h1>
                        <p className="text-xl text-slate-300 leading-relaxed">
                            We are on a mission to democratize quality education and exam preparation through technology.
                        </p>
                    </div>

                    <div className="prose prose-lg mx-auto text-slate-300">
                        <p className="mb-6">
                            Examinantt was founded with a simple yet powerful idea: that every student deserves access to the best testing tools and analytics, regardless of their location or background.
                        </p>
                        <p className="mb-6">
                            Our platform combines state-of-the-art technology with high-quality content curated by industry experts. We simulate real exam environments to help students build confidence and improve their performance.
                        </p>

                        <h2 className="text-2xl font-bold text-white mt-12 mb-4">Our Vision</h2>
                        <p className="mb-6">
                            To become the most trusted and effective exam preparation partner for students across India, empowering them to achieve their academic goals.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center">
                            <div className="p-6 bg-[#0B152B] border border-[#17254E] rounded-2xl">
                                <h3 className="text-4xl font-black text-blue-400 mb-2">10k+</h3>
                                <p className="text-slate-400 font-medium">Students Trusted</p>
                            </div>
                            <div className="p-6 bg-[#0B152B] border border-[#17254E] rounded-2xl">
                                <h3 className="text-4xl font-black text-blue-400 mb-2">500+</h3>
                                <p className="text-slate-400 font-medium">Tests Conducted</p>
                            </div>
                            <div className="p-6 bg-[#0B152B] border border-[#17254E] rounded-2xl">
                                <h3 className="text-4xl font-black text-blue-400 mb-2">50+</h3>
                                <p className="text-slate-400 font-medium">Expert Educators</p>
                            </div>
                        </div>
                    </div>

                    {/* Test Developer Team */}
                    <div className="mt-20 border-t border-[#17254E] pt-16">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-extrabold text-white mb-4">Test Developer Team</h2>
                            <p className="text-slate-400 font-semibold max-w-2xl mx-auto text-base">
                                The subject specialists and experts who craft exam-level questions for your success.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
                            {/* Director */}
                            <div className="bg-[#0B152B] rounded-3xl p-6 border border-[#17254E] shadow-xl hover:border-blue-500/40 transition-all flex flex-col items-center text-center group">
                                <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-[#0E1B38] mb-6 border border-[#1E3360] relative">
                                    <img src={directorImg} alt="Aditya Kushwaha" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <h4 className="text-xl font-extrabold text-white tracking-tight">Aditya Kushwaha</h4>
                                <p className="text-xs text-orange-400 font-bold uppercase tracking-wider mt-1.5 bg-orange-500/15 border border-orange-500/30 px-3 py-1 rounded-full">Director</p>
                            </div>

                            {/* Test Developer */}
                            <div className="bg-[#0B152B] rounded-3xl p-6 border border-[#17254E] shadow-xl hover:border-blue-500/40 transition-all flex flex-col items-center text-center group">
                                <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-[#0E1B38] mb-6 border border-[#1E3360] relative">
                                    <img src={sudhanshuImg} alt="Sudhanshu Sir" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <h4 className="text-xl font-extrabold text-white tracking-tight">Sudhanshu Sir</h4>
                                <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mt-1.5 bg-blue-500/15 border border-blue-500/30 px-3 py-1 rounded-full">Test Developer</p>
                            </div>

                            {/* Placeholder Slot */}
                            <div className="bg-[#0B152B] rounded-3xl p-6 border border-[#17254E] shadow-xl hover:border-blue-500/40 transition-all flex flex-col items-center text-center group">
                                <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-[#0E1B38] mb-6 border border-dashed border-[#1E3360] flex items-center justify-center relative">
                                    <div className="text-center p-4">
                                        <div className="w-12 h-12 rounded-full bg-[#13244a] border border-[#1E3360] flex items-center justify-center mx-auto mb-3 text-slate-400 font-bold text-lg">
                                            +
                                        </div>
                                        <span className="text-xs text-slate-400 font-bold">Coming Soon</span>
                                    </div>
                                </div>
                                <h4 className="text-xl font-extrabold text-slate-300 tracking-tight">Team Member</h4>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5 bg-[#0E1B38] border border-[#1E3360] px-3 py-1 rounded-full">Subject Expert</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default AboutPage;
