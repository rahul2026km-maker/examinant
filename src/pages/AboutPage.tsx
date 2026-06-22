import PageLayout from '../components/landing/PageLayout';
import logo from '../assets/logo.png';
import directorImg from '../assets/director.png';
import sudhanshuImg from '../assets/sudhanshu_sir.png';

const AboutPage = () => {
    return (
        <PageLayout>
            <div className="bg-white py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <img src={logo} alt="Examinantt Logo" className="w-20 h-20 mx-auto rounded-xl mb-6 shadow-lg" />
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">About Examinantt</h1>
                        <p className="text-xl text-gray-600 leading-relaxed">
                            We are on a mission to democratize quality education and exam preparation through technology.
                        </p>
                    </div>

                    <div className="prose prose-lg mx-auto text-gray-600">
                        <p className="mb-6">
                            Examinantt was founded with a simple yet powerful idea: that every student deserves access to the best testing tools and analytics, regardless of their location or background.
                        </p>
                        <p className="mb-6">
                            Our platform combines state-of-the-art technology with high-quality content curated by industry experts. We simulate real exam environments to help students build confidence and improve their performance.
                        </p>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Our Vision</h2>
                        <p className="mb-6">
                            To become the most trusted and effective exam preparation partner for students across India, empowering them to achieve their academic goals.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center">
                            <div>
                                <h3 className="text-4xl font-bold text-blue-600 mb-2">10k+</h3>
                                <p className="text-gray-500">Students Trusted</p>
                            </div>
                            <div>
                                <h3 className="text-4xl font-bold text-blue-600 mb-2">500+</h3>
                                <p className="text-gray-500">Tests Conducted</p>
                            </div>
                            <div>
                                <h3 className="text-4xl font-bold text-blue-600 mb-2">50+</h3>
                                <p className="text-gray-500">Expert Educators</p>
                            </div>
                        </div>
                    </div>

                    {/* Test Developer Team */}
                    <div className="mt-20 border-t border-slate-200/60 pt-16">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Test Developer Team</h2>
                            <p className="text-slate-500 font-semibold max-w-2xl mx-auto text-base">
                                The subject specialists and experts who craft exam-level questions for your success.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
                            {/* Director */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col items-center text-center group">
                                <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-slate-50 mb-6 border border-slate-100 relative">
                                    <img src={directorImg} alt="Aditya Kushwaha" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <h4 className="text-xl font-extrabold text-slate-800 tracking-tight">Aditya Kushwaha</h4>
                                <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mt-1.5 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">Director</p>
                            </div>

                            {/* Test Developer */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col items-center text-center group">
                                <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-slate-50 mb-6 border border-slate-100 relative">
                                    <img src={sudhanshuImg} alt="Sudhanshu Sir" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <h4 className="text-xl font-extrabold text-slate-800 tracking-tight">Sudhanshu Sir</h4>
                                <p className="text-xs text-[#0B4F97] font-bold uppercase tracking-wider mt-1.5 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">Test Developer</p>
                            </div>

                            {/* Placeholder Slot */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col items-center text-center group">
                                <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-slate-50 mb-6 border border-dashed border-slate-200 flex items-center justify-center relative">
                                    <div className="text-center p-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400 font-bold text-lg">
                                            +
                                        </div>
                                        <span className="text-xs text-slate-400 font-bold">Coming Soon</span>
                                    </div>
                                </div>
                                <h4 className="text-xl font-extrabold text-slate-400 tracking-tight">Team Member</h4>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">Subject Expert</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default AboutPage;
