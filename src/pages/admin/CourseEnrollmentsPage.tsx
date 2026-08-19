import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Loader2, Users, CheckCircle, ShieldCheck, UserPlus } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { courseService } from '../../services/courseService';
import { entitlementService } from '../../services/entitlementService';
import type { Course, CourseEnrollment } from '../../types/course.types';

const CourseEnrollmentsPage = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();

    const [course, setCourse] = useState<Course | null>(null);
    const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [studentEmailToEnroll, setStudentEmailToEnroll] = useState('');
    const [isEnrolling, setIsEnrolling] = useState(false);

    useEffect(() => {
        if (courseId) loadData();
    }, [courseId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (!courseId) return;
            const c = await courseService.getCourseById(courseId);
            setCourse(c);

            // Query all enrollments across users where courseId matches
            // In Firestore, we can fetch all users or enrollments
            const usersSnap = await getDocs(collection(db, 'users'));
            const allEnrollments: CourseEnrollment[] = [];

            for (const userDoc of usersSnap.docs) {
                const enrollSnap = await getDocs(query(collection(db, 'users', userDoc.id, 'enrollments'), where('courseId', '==', courseId)));
                enrollSnap.docs.forEach(docSnap => {
                    allEnrollments.push({ id: docSnap.id, ...docSnap.data() } as CourseEnrollment);
                });
            }

            setEnrollments(allEnrollments);
        } catch (error) {
            console.error("Error loading course enrollments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualEnroll = async () => {
        if (!studentEmailToEnroll.trim() || !course) return;
        setIsEnrolling(true);
        try {
            // Find user by email
            const q = query(collection(db, 'users'), where('email', '==', studentEmailToEnroll.trim()));
            const snap = await getDocs(q);
            if (snap.empty) {
                alert("No user found with this email address.");
                setIsEnrolling(false);
                return;
            }

            const targetUser = snap.docs[0];
            await entitlementService.createEnrollment(targetUser.id, course, 'admin');
            alert(`Student ${studentEmailToEnroll} successfully enrolled!`);
            setStudentEmailToEnroll('');
            await loadData();
        } catch (error) {
            alert("Failed to manually enroll student.");
        } finally {
            setIsEnrolling(false);
        }
    };

    const filtered = enrollments.filter(e => e.userId?.toLowerCase().includes(searchTerm.toLowerCase()) || e.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin-dashboard/courses')} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">{course?.title || 'Course'} — Enrollments</h1>
                    <p className="text-slate-500 text-xs font-medium">Manage student access and view real-time learning progress.</p>
                </div>
            </div>

            {/* Manual Enrollment Widget */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <UserPlus size={18} className="text-blue-600" />
                    <span>Manually Gift / Enroll Student</span>
                </h3>
                <div className="flex gap-3">
                    <input
                        type="email"
                        placeholder="Enter student email address..."
                        value={studentEmailToEnroll}
                        onChange={(e) => setStudentEmailToEnroll(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                    />
                    <button
                        onClick={handleManualEnroll}
                        disabled={isEnrolling}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2"
                    >
                        {isEnrolling ? <Loader2 size={16} className="animate-spin" /> : null}
                        <span>Enroll Student</span>
                    </button>
                </div>
            </div>

            {/* Enrollment Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-900">Enrolled Students ({filtered.length})</h3>
                </div>

                {isLoading ? (
                    <div className="py-12 flex justify-center"><Loader2 size={32} className="animate-spin text-blue-600" /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-medium">No student enrollments found yet.</div>
                ) : (
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                                <th className="py-3 px-4">User ID</th>
                                <th className="py-3 px-4">Source</th>
                                <th className="py-3 px-4">Payment ID</th>
                                <th className="py-3 px-4">Progress</th>
                                <th className="py-3 px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {filtered.map(e => (
                                <tr key={e.id}>
                                    <td className="py-3 px-4 font-bold text-slate-900">{e.userId}</td>
                                    <td className="py-3 px-4 capitalize font-extrabold text-xs text-blue-600">{e.source}</td>
                                    <td className="py-3 px-4 text-xs font-mono text-slate-500">{e.paymentId || 'free'}</td>
                                    <td className="py-3 px-4">
                                        <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${e.progressPercent || 0}%` }}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">{e.progressPercent || 0}%</span>
                                    </td>
                                    <td className="py-3 px-4 font-bold text-xs capitalize text-emerald-600">{e.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CourseEnrollmentsPage;
