import PageLayout from '../components/landing/PageLayout';

const PrivacyPolicyPage = () => {
    return (
        <PageLayout>
            <div className="bg-[#070D1E] py-16 min-h-screen text-slate-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-extrabold text-white mb-8">Privacy Policy</h1>

                    <div className="prose prose-invert prose-lg text-slate-300">
                        <p className="mb-2 font-semibold text-slate-400">Effective Date: 27 January 2026</p>
                        <p className="mb-6">
                            Examinantt ("we", "our", "us") is committed to protecting the privacy and personal information of students, parents, and users ("you", "your"). This Privacy Policy explains how we collect, use, store, and protect your information when you use our website, apps, tests, and related services.
                        </p>
                        <p className="mb-6">
                            By using Examinantt, you agree to the practices described in this policy.
                        </p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
                        <p className="mb-4">We collect only the information that is necessary to provide, improve, and personalize our educational services.</p>

                        <h3 className="text-xl font-semibold text-slate-200 mt-6 mb-3">a) Personal Information</h3>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Student name</li>
                            <li>Email address</li>
                            <li>Phone number</li>
                            <li>Address (city/state only, where required)</li>
                            <li>Exam you are preparing for (e.g., NEET, JEE, board exams)</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-200 mt-6 mb-3">b) Academic & Test Information</h3>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Test responses and scores</li>
                            <li>Performance analytics</li>
                            <li>Strengths and weaknesses by topic</li>
                            <li>Progress history and rankings (if applicable)</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-200 mt-6 mb-3">c) Technical Information</h3>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Device type and browser</li>
                            <li>IP address</li>
                            <li>App/website usage data (for performance and security)</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. How We Use Your Information</h2>
                        <p className="mb-4">We use your information only for legitimate educational and platform-related purposes, including:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Conducting tests and evaluations</li>
                            <li>Generating performance analysis and reports</li>
                            <li>Personalizing study recommendations</li>
                            <li>Improving test quality, difficulty level, and accuracy</li>
                            <li>Communicating important updates, results, or support messages</li>
                            <li>Enhancing platform security and preventing misuse</li>
                        </ul>
                        <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                            <p className="text-blue-400 font-medium">
                                ❗ We do NOT sell or rent student data to any third party.
                            </p>
                        </div>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Use of Test Performance Data</h2>
                        <p className="mb-4">Student test performance data is used to:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Improve question quality and exam simulation accuracy</li>
                            <li>Enhance AI-based analysis and feedback</li>
                            <li>Conduct internal academic research (data is anonymized where possible)</li>
                        </ul>
                        <p className="mb-6">Performance data may be analyzed in aggregate form, without identifying individual students.</p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Data Sharing & Disclosure</h2>
                        <p className="mb-4">We may share limited data only in the following cases:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>With trusted service providers (hosting, analytics, messaging) strictly for platform operations</li>
                            <li>When required by law, court order, or government authority</li>
                            <li>To protect the rights, safety, and security of Examinantt and its users</li>
                        </ul>
                        <p className="mb-6">All partners are bound by confidentiality obligations.</p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Data Security</h2>
                        <p className="mb-4">We take data protection seriously and use:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Secure servers and encrypted connections</li>
                            <li>Access controls and internal data protection policies</li>
                            <li>Regular system monitoring and updates</li>
                        </ul>
                        <p className="mb-6">While no system is 100% secure, we follow industry-standard security practices to safeguard your data.</p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Children’s Privacy</h2>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Examinantt is designed for students preparing for competitive and academic exams.</li>
                            <li>If a user is under 18, we assume parental or guardian consent has been obtained for using our services.</li>
                            <li>We do not knowingly collect unnecessary personal information from minors.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Data Retention</h2>
                        <p className="mb-4">We retain user data only for as long as:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Your account remains active, or</li>
                            <li>It is necessary for academic analysis, legal compliance, or service improvement</li>
                        </ul>
                        <p className="mb-6">You may request account deletion, subject to legal and academic record requirements.</p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Your Rights</h2>
                        <p className="mb-4">You have the right to:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Access your personal data</li>
                            <li>Request correction of incorrect information</li>
                            <li>Request deletion of your account (where applicable)</li>
                            <li>Withdraw consent for non-essential communications</li>
                        </ul>
                        <p className="mb-6">Requests can be made by contacting us (see Section 10).</p>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Changes to This Privacy Policy</h2>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>We may update this Privacy Policy from time to time.</li>
                            <li>Any changes will be posted on this page with an updated effective date.</li>
                            <li>Continued use of Examinantt after updates means you accept the revised policy.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">10. Contact Us</h2>
                        <p className="mb-4">If you have any questions, concerns, or data-related requests, please contact:</p>
                        <div className="bg-[#0B152B] p-6 rounded-2xl border border-[#17254E]">
                            <p className="font-bold text-white mb-2">Examinantt Support Team</p>
                            <p className="flex items-center gap-2 mb-2 text-slate-300">
                                📧 Email: support@examinantt.com
                            </p>
                            <p className="flex items-center gap-2 text-slate-300">
                                🌐 Website: www.examinantt.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default PrivacyPolicyPage;
