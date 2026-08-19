import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, ShieldCheck, CheckCircle2, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import PageLayout from '../components/landing/PageLayout';
import { certificateService } from '../services/certificateService';
import type { CourseCertificate } from '../types/course.types';

const CertificateVerificationPage = () => {
    const { certificateId } = useParams<{ certificateId: string }>();
    const navigate = useNavigate();

    const [certificate, setCertificate] = useState<CourseCertificate | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (certificateId) verify();
    }, [certificateId]);

    const verify = async () => {
        setIsLoading(true);
        try {
            if (!certificateId) return;
            const cert = await certificateService.verifyCertificate(certificateId);
            setCertificate(cert);
        } catch (error) {
            console.error("Error verifying certificate:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageLayout>
            <div className="bg-slate-50 min-h-screen py-16 flex items-center justify-center px-4">
                {isLoading ? (
                    <Loader2 size={40} className="animate-spin text-blue-600" />
                ) : !certificate ? (
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md space-y-4 shadow-sm">
                        <Award size={48} className="text-slate-300 mx-auto" />
                        <h2 className="text-xl font-black text-slate-900">Certificate Not Found</h2>
                        <p className="text-slate-500 text-xs font-medium">The certificate ID specified could not be verified in Examinant records.</p>
                        <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl">Back to Home</button>
                    </div>
                ) : (
                    <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 text-center max-w-2xl w-full shadow-2xl space-y-8 relative overflow-hidden">
                        {/* Top Badge */}
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full border border-emerald-200 text-xs font-black uppercase tracking-wider">
                            <ShieldCheck size={16} className="text-emerald-600" />
                            <span>Verified Certificate of Completion</span>
                        </div>

                        {/* Certificate Header */}
                        <div className="space-y-2">
                            <Award size={64} className="text-amber-500 mx-auto" />
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Examinant Certificate</h1>
                            <p className="text-slate-400 font-mono text-xs">ID: {certificate.id}</p>
                        </div>

                        {/* Certificate Body */}
                        <div className="space-y-4 py-4 border-y border-slate-100">
                            <p className="text-xs text-slate-400 uppercase font-black tracking-widest">This certifies that</p>
                            <h2 className="text-2xl font-black text-blue-600">{certificate.userName}</h2>
                            <p className="text-xs text-slate-500 font-medium">has successfully completed all mandatory lessons and assessments for the course</p>
                            <h3 className="text-xl font-black text-slate-900 leading-snug">{certificate.courseTitle}</h3>
                        </div>

                        {/* Details */}
                        <div className="flex justify-around items-center text-xs font-bold text-slate-500 pt-2">
                            <div>
                                <span className="block text-[10px] text-slate-400 uppercase font-bold">Issue Date</span>
                                <span className="text-slate-800 font-extrabold">{new Date(certificate.issuedAt?.toDate ? certificate.issuedAt.toDate() : Date.now()).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-slate-400 uppercase font-bold">Status</span>
                                <span className="text-emerald-600 font-extrabold capitalize">{certificate.status}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    );
};

export default CertificateVerificationPage;
