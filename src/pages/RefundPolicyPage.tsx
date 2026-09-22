import PageLayout from '../components/landing/PageLayout';

const RefundPolicyPage = () => {
    return (
        <PageLayout>
            <div className="bg-[#070D1E] py-16 min-h-screen text-slate-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-extrabold text-white mb-8">Refund Policy</h1>

                    <div className="prose prose-invert prose-lg text-slate-300">
                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">No Refund Policy</h2>
                        <p className="mb-4">
                            Thank you for choosing our platform. Please read this Refund Policy carefully before making any purchase.
                        </p>
                        <p className="mb-6 font-medium text-slate-200">
                            All purchases made on our website are final and non-refundable. We do not offer refunds, cancellations, or chargebacks under any circumstances once a payment has been successfully completed.
                        </p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Why No Refunds?</h2>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Our services include instant digital access to exams, test series, analytics, and learning resources.</li>
                            <li>Once access is granted, the service is considered used and delivered.</li>
                            <li>Pricing and infrastructure are structured accordingly to keep costs affordable for all students.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Non-Refundable Scenarios (Including but Not Limited To)</h2>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Change of mind after purchase</li>
                            <li>Mistaken purchase or wrong plan selection</li>
                            <li>Partial usage or non-usage of services</li>
                            <li>Dissatisfaction with performance or results</li>
                            <li>Technical issues caused by user’s device, internet, or browser</li>
                            <li>Failure to read course/test details before purchase</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Payment Errors</h2>
                        <p className="mb-6">
                            In case of duplicate payment or technical transaction failure, please contact our support team with valid proof. Such cases will be reviewed individually, but this does not guarantee a refund.
                        </p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Policy Acceptance</h2>
                        <p className="mb-4">By completing a purchase on our platform, you acknowledge that:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>You have read and understood this Refund Policy</li>
                            <li>You agree that no refunds will be issued</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Contact Us</h2>
                        <p className="mb-4">
                            For any payment-related queries, you may contact us at:
                        </p>
                        <p className="flex items-center gap-2 font-medium text-blue-400">
                            📧 business.examinatt@gmail.com
                        </p>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default RefundPolicyPage;
