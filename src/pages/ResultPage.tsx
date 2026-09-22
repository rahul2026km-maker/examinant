import PageLayout from '../components/landing/PageLayout';
import { Search } from 'lucide-react';

const ResultPage = () => {
    return (
        <PageLayout>
            <div className="min-h-[75vh] flex items-center justify-center bg-[#070D1E] py-16">
                <div className="max-w-md w-full px-6">
                    <div className="bg-[#0B152B] rounded-2xl shadow-2xl border border-[#17254E] p-8 text-center">
                        <div className="w-16 h-16 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Search size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Check Your Results</h1>
                        <p className="text-slate-400 mb-8 text-sm">Enter your Roll Number and Date of Birth to view your test results.</p>

                        <form className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Roll Number (e.g. 210543)"
                                    className="w-full px-4 py-3 rounded-xl bg-[#0E1B38] border border-[#1E3360] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                />
                            </div>
                            <div>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 rounded-xl bg-[#0E1B38] border border-[#1E3360] text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium [color-scheme:dark]"
                                />
                            </div>
                            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/30 text-sm">
                                View Result
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default ResultPage;
