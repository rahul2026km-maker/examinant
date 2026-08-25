import logo from '../../assets/logo.png';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[#172554] py-8 sm:py-10 border-t border-slate-800 text-slate-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Compact Header Row: Logo & Brand + Social Icons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Examinantt Logo" className="w-9 h-9 rounded-lg bg-white/10 p-1 shrink-0" />
                        <div>
                            <h2 className="text-xl font-extrabold text-white tracking-tight leading-tight">Examinantt</h2>
                            <p className="text-xs text-slate-400 font-medium">Study Smartly</p>
                        </div>
                    </div>

                    {/* Compact Social Icons */}
                    <div className="flex items-center gap-2">
                        <a href="#" className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-orange-500 transition-all">
                            <Facebook size={13} fill="currentColor" />
                        </a>
                        <a href="#" className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-orange-500 transition-all">
                            <Twitter size={13} fill="currentColor" />
                        </a>
                        <a href="#" className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-orange-500 transition-all">
                            <Instagram size={13} />
                        </a>
                        <a href="#" className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-orange-500 transition-all">
                            <Linkedin size={13} fill="currentColor" />
                        </a>
                        <a href="#" className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-orange-500 transition-all">
                            <Youtube size={13} />
                        </a>
                    </div>
                </div>

                {/* Main Links Grid - Compact */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 pb-6">
                    {/* Quick links */}
                    <div>
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5 pb-1 relative inline-block">
                            Quick Links
                            <span className="absolute bottom-0 left-0 w-5 h-0.5 bg-orange-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-2 mt-2">
                            <li><Link to="/contact" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">Test Series Enquiry</Link></li>
                            <li><Link to="/" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">Home</Link></li>
                            <li><Link to="/test-series" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">Test Series</Link></li>
                            <li><Link to="/resources" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">Free Resources</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5 pb-1 relative inline-block">
                            Company
                            <span className="absolute bottom-0 left-0 w-5 h-0.5 bg-orange-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-2 mt-2">
                            <li><Link to="/about" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">About Us</Link></li>
                            <li><Link to="#" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">Public Notice</Link></li>
                            <li><Link to="#" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">Management</Link></li>
                            <li><Link to="#" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">Careers</Link></li>
                        </ul>
                    </div>

                    {/* Help & Support */}
                    <div>
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5 pb-1 relative inline-block">
                            Help & Support
                            <span className="absolute bottom-0 left-0 w-5 h-0.5 bg-orange-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-2 mt-2">
                            <li><Link to="/contact" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">Contact Us</Link></li>
                            <li><Link to="/privacy" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">Privacy Policy</Link></li>
                            <li><Link to="/refund-policy" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">Refund Policy</Link></li>
                            <li><Link to="/terms" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">Terms & Conditions</Link></li>
                            <li><Link to="#" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">Exam Motivation</Link></li>
                        </ul>
                    </div>

                    {/* Exam Categories */}
                    <div>
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5 pb-1 relative inline-block">
                            Exam Categories
                            <span className="absolute bottom-0 left-0 w-5 h-0.5 bg-orange-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-2 mt-2">
                            <li><Link to="/test-series?category=NEET" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">NEET</Link></li>
                            <li><Link to="/test-series?category=JEE" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">JEE</Link></li>
                            <li><Link to="/test-series?category=SSC" className="text-slate-300 hover:text-white transition-colors text-xs font-medium">SSC</Link></li>
                        </ul>
                    </div>

                    {/* Contact Us */}
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5 pb-1 relative inline-block">
                            Contact Us
                            <span className="absolute bottom-0 left-0 w-5 h-0.5 bg-orange-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-2 mt-2 text-xs">
                            <li>
                                <a href="mailto:support@examinantt.com" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                                    <Mail className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                    <span>support@examinantt.com</span>
                                </a>
                            </li>
                            <li>
                                <a href="tel:+918881188678" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                                    <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                    <span>888-1188-678</span>
                                </a>
                            </li>
                            <li>
                                <div className="flex items-start gap-2 text-slate-300">
                                    <MapPin className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                                    <span className="leading-normal">
                                        Examinantt office, Near BBAU, Lucknow, U.P., India - 226025
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-800/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
                    <p>© 2026 Examinantt (OPC) Pvt. Ltd. All rights reserved.</p>
                    <p>Designed for Smart Learning & Exam Preparation.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
