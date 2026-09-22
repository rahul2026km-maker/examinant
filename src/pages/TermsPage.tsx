import PageLayout from '../components/landing/PageLayout';

const TermsPage = () => {
    return (
        <PageLayout>
            <div className="bg-[#070D1E] py-16 min-h-screen text-slate-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-extrabold text-white mb-8">Terms and Conditions</h1>

                    <div className="prose prose-invert prose-lg text-slate-300">
                        <p className="mb-2 font-semibold text-slate-400">Last Updated: 27th Jan 2026</p>
                        <p className="mb-6">
                            Welcome to Examinantt. By accessing, registering, purchasing, or using any service offered by Examinantt (“Platform”, “We”, “Us”, “Our”), you (“User”, “Student”, “Parent”) agree to be legally bound by the following Terms and Conditions.
                        </p>
                        <p className="mb-6 font-medium text-slate-200">
                            If you do not agree with these terms, please do not use our services.
                        </p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Nature of Services</h2>
                        <p className="mb-4">Examinantt provides academic and competitive examination preparation services, including but not limited to:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Online & offline mock tests</li>
                            <li>Online & offline academic and competition exam coaching</li>
                            <li>AI-based exam analysis and performance reports</li>
                            <li>Real exam simulation environments</li>
                            <li>Test series for competitive exams (NEET, JEE, SSC, Boards, etc.)</li>
                            <li>Study materials, question banks, and assessments</li>
                            <li>Academic guidance and analytics tools</li>
                        </ul>
                        <p className="mb-6">All services are educational in nature and aim to support exam preparation.</p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Eligibility</h2>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Users must be 13 years or older to use the platform.</li>
                            <li>Users below 18 years must have parent/guardian consent.</li>
                            <li>Providing false personal or academic information may lead to account termination.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Account Responsibility</h2>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Users are responsible for maintaining the confidentiality of their login credentials.</li>
                            <li>Any activity performed through your account will be considered your responsibility.</li>
                            <li>Examinantt is not liable for unauthorized access due to user negligence.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Payments & Pricing</h2>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>All prices are displayed in Indian Rupees (INR) unless stated otherwise.</li>
                            <li>Payments must be made in full before accessing paid services.</li>
                            <li>Examinantt reserves the right to change pricing at any time without prior notice.</li>
                        </ul>

                        <div className="border-l-4 border-red-500 bg-red-950/30 p-6 my-8 rounded-r-lg border border-red-900/40">
                            <h2 className="text-2xl font-bold text-red-400 mb-4">5. Strict No Refund Policy</h2>
                            <p className="font-bold text-red-400 mb-4">⚠️ IMPORTANT – PLEASE READ CAREFULLY</p>
                            <ul className="list-disc pl-5 space-y-2 mb-4 text-red-300 font-medium">
                                <li>All payments made to Examinantt are NON-REFUNDABLE and NON-TRANSFERABLE.</li>
                            </ul>
                            <p className="mb-4 text-slate-300">No refunds will be provided under any circumstances, including but not limited to:</p>
                            <ul className="list-disc pl-5 space-y-2 mb-6 text-slate-300">
                                <li>Change of mind</li>
                                <li>Dissatisfaction with performance or results</li>
                                <li>Non-usage of purchased services</li>
                                <li>Technical issues from the user’s side</li>
                                <li>Exam postponement, cancellation, or syllabus changes</li>
                                <li>Admission denial or exam failure</li>
                            </ul>
                            <p className="font-semibold text-slate-200">Once a service, test series, or subscription is purchased, it cannot be canceled, refunded, or exchanged.</p>
                        </div>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. No Guarantee of Results</h2>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Examinantt does not guarantee selection, rank, marks, percentile, or exam success.</li>
                            <li>Performance depends on multiple factors including:
                                <ul className="list-[circle] pl-5 mt-2 space-y-1">
                                    <li>Student effort & consistency</li>
                                    <li>Exam difficulty</li>
                                    <li>Competition level</li>
                                </ul>
                            </li>
                            <li>AI analysis and predictions are indicative only, not absolute outcomes.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Intellectual Property Rights</h2>
                        <p className="mb-4">All content including:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-4">
                            <li>Questions, solutions, mock tests</li>
                            <li>Study materials</li>
                            <li>AI reports & analytics</li>
                            <li>Website/app design</li>
                        </ul>
                        <p className="mb-6">are the exclusive intellectual property of Examinantt.</p>
                        <p className="font-bold text-red-400 mb-2">🚫 Users may NOT:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Copy, share, resell, record, distribute, or reproduce content</li>
                            <li>Share login credentials with others</li>
                        </ul>
                        <p className="mb-6 font-medium text-slate-200">Violation may result in legal action and permanent account termination.</p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Fair Usage & Misconduct</h2>
                        <p className="mb-2">Users must NOT:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-4">
                            <li>Attempt to hack, manipulate, or misuse the platform</li>
                            <li>Use unfair means during tests</li>
                            <li>Share exam questions publicly</li>
                            <li>Use automated tools or bots</li>
                        </ul>
                        <p className="mb-6">Examinantt reserves the right to suspend or terminate accounts without refund if misconduct is detected.</p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Technical Limitations</h2>
                        <p className="mb-4">Examinantt is not responsible for issues caused by:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Poor internet connection</li>
                            <li>Device incompatibility</li>
                            <li>Power failure</li>
                            <li>Server downtime due to maintenance or force majeure</li>
                        </ul>
                        <p className="mb-6">Temporary service interruptions do not qualify for refunds or compensation.</p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">10. Modifications to Services</h2>
                        <p className="mb-4">Examinantt may:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Modify test patterns</li>
                            <li>Add/remove features</li>
                            <li>Update AI models</li>
                        </ul>
                        <p className="mb-6">without prior notice, to improve educational quality.</p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">11. Third-Party Links & Tools</h2>
                        <p className="mb-6">
                            The platform may contain links or integrations with third-party tools. Examinantt is not responsible for their content, accuracy, or policies.
                        </p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">12. Privacy & Data Usage</h2>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>User data is handled as per our Privacy Policy.</li>
                            <li>Performance data may be used anonymously for:
                                <ul className="list-[circle] pl-5 mt-2 space-y-1">
                                    <li>Research</li>
                                    <li>AI improvement</li>
                                    <li>Platform analytics</li>
                                </ul>
                            </li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">13. Limitation of Liability</h2>
                        <p className="mb-4">To the maximum extent permitted by law, Examinantt shall not be liable for:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Academic losses</li>
                            <li>Emotional distress</li>
                            <li>Missed exams</li>
                            <li>Career outcomes</li>
                            <li>Indirect or consequential damages</li>
                        </ul>
                        <p className="mb-6">Use of services is at the user’s own risk.</p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">14. Termination of Access</h2>
                        <p className="mb-4">Examinantt reserves the right to:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Suspend or terminate access</li>
                            <li>Block accounts</li>
                            <li>Restrict services</li>
                        </ul>
                        <p className="mb-6">without notice if terms are violated. No refunds will be issued after termination.</p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">15. Governing Law & Jurisdiction</h2>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>These Terms are governed by the laws of India.</li>
                            <li>Any disputes shall be subject to the exclusive jurisdiction of courts in India.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">16. Acceptance of Terms</h2>
                        <p className="mb-4">By registering, purchasing, or using Examinantt services, you confirm that:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>You have read and understood these Terms</li>
                            <li>You agree to the No Refund Policy</li>
                            <li>You accept all responsibilities mentioned above</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">📌 Contact Information</h2>
                        <div className="bg-[#0B152B] p-6 rounded-2xl border border-[#17254E]">
                            <p className="mb-2 text-slate-300">For official communication:</p>
                            <p className="flex items-center gap-2 mb-2 font-medium text-blue-400">
                                📧 Email: support@examinantt.com
                            </p>
                            <p className="font-medium text-slate-300">
                                Platform: Examinantt
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default TermsPage;
