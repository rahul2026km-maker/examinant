import logo from '../../assets/logo.png';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[#172554] pt-16 pb-8 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Logo Section */}
                <div className="flex flex-col items-center justify-center mb-16 space-y-4">
                    <img src={logo} alt="Examinantt Logo" className="w-12 h-12 rounded-lg bg-white/10 p-1" />
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white tracking-tight">Examinantt</h2>
                        <p className="text-slate-300 font-medium mt-1">Study Smartly</p>
                    </div>
                </div>

                {/* Main Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-16">
                    {/* Quick links */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-2 relative inline-block">
                            Quick links
                            <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-orange-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-4 mt-8">
                            <li><Link to="/contact" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Test series enquiry</Link></li>
                            <li><Link to="/" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Home</Link></li>
                            <li><Link to="/test-series" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Test series</Link></li>
                            <li><Link to="/resources" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Free resources</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-2 relative inline-block">
                            Company
                            <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-orange-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-4 mt-8">
                            <li><Link to="/about" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">About Us</Link></li>
                            <li><Link to="#" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Public Notice</Link></li>
                            <li><Link to="#" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Management</Link></li>
                            <li><Link to="#" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Careers</Link></li>
                        </ul>
                    </div>

                    {/* Help & Support */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-2 relative inline-block">
                            Help & Support
                            <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-orange-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-4 mt-8">
                            <li><Link to="/contact" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Contact us</Link></li>
                            <li><Link to="/refund-policy" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Refund policy</Link></li>
                            <li><Link to="/terms" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Terms and conditions</Link></li>
                            <li><Link to="#" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Exam Motivation</Link></li>
                        </ul>
                    </div>

                    {/* Exam Categories */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-2 relative inline-block">
                            Exam Categories
                            <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-orange-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-4 mt-8">
                            <li><Link to="/test-series?category=NEET" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">NEET</Link></li>
                            <li><Link to="/test-series?category=JEE" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">JEE</Link></li>
                            <li><Link to="/test-series?category=SSC" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">SSC</Link></li>
                        </ul>
                    </div>

                    {/* Contact Us */}
                    <div className="lg:col-span-1">
                        <h4 className="text-white font-bold text-lg mb-2 relative inline-block">
                            Contact Us
                            <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-orange-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-4 mt-8">
                            <li>
                                <a href="mailto:support@examinantt.com" className="flex items-start gap-3 text-slate-300 hover:text-white transition-colors group">
                                    <Mail className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                                    <span className="text-sm font-medium leading-tight">support@examinantt.com</span>
                                </a>
                            </li>
                            <li>
                                <a href="tel:+918881188678" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group">
                                    <Phone className="w-5 h-5 text-orange-500 shrink-0" />
                                    <span className="text-sm font-medium">888-1188-678</span>
                                </a>
                            </li>
                            <li>
                                <div className="flex items-start gap-3 text-slate-300">
                                    <MapPin className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                                    <span className="text-sm font-medium leading-relaxed">
                                        Examinantt office, Near BBAU, Lucknow, U.P., India - 226025
                                    </span>
                                </div>
                            </li>
                        </ul>

                        {/* Social Icons */}
                        <div className="flex items-center gap-3 mt-6">
                            <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-orange-500 transition-colors">
                                <Facebook size={14} fill="currentColor" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-orange-500 transition-colors">
                                <Twitter size={14} fill="currentColor" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors">
                                <Instagram size={14} />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-orange-500 transition-colors">
                                <Linkedin size={14} fill="currentColor" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-orange-500 transition-colors">
                                <Youtube size={14} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-800/60 pt-8 flex justify-center">
                    <p className="text-xs text-slate-400 font-medium">
                        © 2026 Examinantt (OPC) Pvt. Ltd. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
