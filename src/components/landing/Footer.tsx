import logo from '../../assets/logo.png';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
                    {/* Brand Section - Spans 4 columns */}
                    <div className="lg:col-span-4 space-y-6">
                        <Link to="/" className="flex items-center gap-3">
                            <img src={logo} alt="Examinantt Logo" className="w-10 h-10 rounded-lg" />
                            <span className="text-2xl font-bold text-white tracking-tight">Examinantt</span>
                        </Link>
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-white leading-snug">
                                Your Expert Partner for Precision<br />
                                <span className="text-blue-400">Exam Preparation</span>
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                                Empowering students with AI-driven analytics, real-time testing environments, and premium study resources.
                            </p>
                        </div>

                    </div>

                    {/* Links Sections - Spans 8 columns */}
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                        {/* Column 1: Services */}
                        <div>
                            <h4 className="text-white font-semibold mb-6">Services</h4>
                            <ul className="space-y-4">
                                <li><Link to="/test-series" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">Test Series</Link></li>
                                <li><Link to="/pyqs" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">PYQ Bank</Link></li>
                                <li><Link to="/resources" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">Free Resources</Link></li>
                                <li><Link to="/dashboard" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">Student Dashboard</Link></li>
                            </ul>
                        </div>

                        {/* Column 2: Company */}
                        <div>
                            <h4 className="text-white font-semibold mb-6">Company</h4>
                            <ul className="space-y-4">
                                <li><Link to="/about" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">About Us</Link></li>
                                <li><Link to="/signup" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">Contact</Link></li>
                                <li><Link to="/" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">Careers</Link></li>
                                <li><Link to="/" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">Partners</Link></li>
                            </ul>
                        </div>

                        {/* Column 3: Resources */}
                        <div>
                            <h4 className="text-white font-semibold mb-6">Resources</h4>
                            <ul className="space-y-4">
                                <li><Link to="/resources" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">Blog</Link></li>
                                <li><Link to="/about" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">Help Center</Link></li>
                                <li><Link to="/signup" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">Community</Link></li>
                                <li><Link to="/" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">Sitemap</Link></li>
                            </ul>
                        </div>

                        {/* Column 4: Legal */}
                        <div>
                            <h4 className="text-white font-semibold mb-6">Legal</h4>
                            <ul className="space-y-4">
                                <li><Link to="/privacy" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">Privacy Policy</Link></li>
                                <li><Link to="/terms" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">Terms of Service</Link></li>
                                <li><Link to="/refund-policy" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">Refund Policy</Link></li>
                                <li><Link to="/sla" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium">SLA</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-500">
                        © 2026 Examinantt (OPC) PVT. LTD. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link to="/privacy" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Privacy</Link>
                        <Link to="/terms" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Terms</Link>
                        <Link to="/refund-policy" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Refund Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
