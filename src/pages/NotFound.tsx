import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut",
                when: "beforeChildren",
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, ease: "easeOut" }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="text-center max-w-lg mx-auto bg-white p-10 md:p-14 rounded-[32px] shadow-sm border border-slate-100"
            >
                <motion.div variants={itemVariants} className="relative inline-block mb-6">
                    <div className="text-[120px] md:text-[150px] font-black text-slate-100 leading-none select-none tracking-tighter">
                        404
                    </div>
                    <motion.div 
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 12 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                        whileHover={{ rotate: 0, scale: 1.05 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div className="bg-[#1D64D0] text-white p-4 rounded-3xl shadow-xl shadow-blue-500/20">
                            <Search size={40} strokeWidth={2.5} />
                        </div>
                    </motion.div>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-3xl font-black text-[#0B4F97] mb-4 tracking-tight">
                    Page Not Found
                </motion.h1>
                
                <motion.p variants={itemVariants} className="text-slate-500 mb-10 text-sm md:text-base font-medium leading-relaxed px-4">
                    Oops! The page you are looking for doesn't exist or has been moved to another location.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                    >
                        <ArrowLeft size={18} strokeWidth={2.5} />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1D64D0] text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        <Home size={18} strokeWidth={2.5} />
                        Back to Home
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default NotFound;
