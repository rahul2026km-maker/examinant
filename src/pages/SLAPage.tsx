import PageLayout from '../components/landing/PageLayout';

const SLAPage = () => {
    return (
        <PageLayout>
            <div className="bg-[#070D1E] py-16 min-h-screen text-slate-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-extrabold text-white mb-8">Service Level Agreement (SLA)</h1>
                    <div className="prose prose-invert prose-lg text-slate-300">
                        <p className="mb-4">Effective Date: [Date]</p>
                        <p className="mb-6">
                            This Service Level Agreement (SLA) generally covers the availability of the Service.
                        </p>
                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Service Commitment</h2>
                        <p className="mb-4">
                            [Placeholder for SLA content]
                        </p>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default SLAPage;
