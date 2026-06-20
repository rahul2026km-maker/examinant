import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MoreVertical, Loader2, UserX, UserCheck, Mail, X, Download, Trash2, Calendar, BarChart3 } from 'lucide-react';
import { studentService, type Student } from '../../services/studentService';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const AdminStudentsPage = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'active' | 'inactive' | 'blocked'>('All');

    // New States
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentAttempts, setStudentAttempts] = useState<any[]>([]);
    const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
    const [studentPurchases, setStudentPurchases] = useState<any[]>([]);
    const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
    const [modalTab, setModalTab] = useState<'attempts' | 'purchases'>('attempts');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteFormData, setInviteFormData] = useState({ displayName: '', email: '' });
    const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingInvite(true);
        try {
            const newStudent = await studentService.addStudent(inviteFormData);
            // Optimistic update
            setStudents(prev => [{
                ...newStudent,
                role: 'student',
                testsTaken: 0,
                status: 'active',
                joinedDate: new Date()
            } as Student, ...prev]);
            setIsInviteModalOpen(false);
            setInviteFormData({ displayName: '', email: '' });
            alert("Student added successfully!");
        } catch (error: any) {
            if (error.message === "EMAIL_EXISTS") {
                alert("This email is already registered with another student. Please use a unique email.");
            } else {
                alert("Failed to add student. Please try again.");
            }
        } finally {
            setIsSubmittingInvite(false);
        }
    };

    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;
        setIsSubmittingInvite(true); // Reusing submittig state for simplicity or add specific one
        try {
            await studentService.updateStudent(editingStudent.id, {
                displayName: editingStudent.displayName,
                fullName: editingStudent.fullName,
                email: editingStudent.email,
                mobile: editingStudent.mobile,
                state: editingStudent.state,
                district: editingStudent.district
            });
            setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s));
            setIsEditModalOpen(false);
            setEditingStudent(null);
            alert("Student profile updated!");
        } catch (error) {
            alert("Failed to update student");
        } finally {
            setIsSubmittingInvite(false);
        }
    };

    const exportToCSV = () => {
        const headers = ["Name", "Email", "Mobile", "State", "District", "Status", "Exams Taken", "Joined Date"];
        const rows = filteredStudents.map(s => [
            s.fullName || s.displayName || "Unnamed",
            s.email,
            s.mobile || s.phone || "N/A",
            s.state || "N/A",
            s.district || "N/A",
            s.status,
            s.testsTaken || 0,
            new Date(s.joinedDate).toLocaleDateString()
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fetchStudentAttemptsAndPurchases = async (studentId: string) => {
        setIsLoadingAttempts(true);
        setIsLoadingPurchases(true);
        try {
            // Fetch attempts
            const attemptsRef = collection(db, 'users', studentId, 'attempts');
            const snapshot = await getDocs(attemptsRef);
            const attempts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudentAttempts(attempts);

            // Fetch purchases
            const purchasesRef = collection(db, 'users', studentId, 'purchases');
            const purchasesSnapshot = await getDocs(purchasesRef);
            const purchases = purchasesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudentPurchases(purchases);
        } catch (error) {
            console.error("Error fetching student details:", error);
        } finally {
            setIsLoadingAttempts(false);
            setIsLoadingPurchases(false);
        }
    };

    const handleDelete = async (studentId: string) => {
        if (!window.confirm("CRITICAL: Are you sure you want to permanently delete this student? This cannot be undone.")) return;
        try {
            await studentService.deleteStudent(studentId);
            setStudents(prev => prev.filter(s => s.id !== studentId));
            setSelectedStudent(null);
        } catch (error) {
            alert("Failed to delete student");
        }
    };
    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        filterStudents();
    }, [searchTerm, statusFilter, students]);

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            // Fetching a larger batch initially since client-side search is easier for v1
            const { students: fetchedStudents } = await studentService.getAllStudents(null, 50);
            setStudents(fetchedStudents);
        } catch (error: any) {
            console.error("Failed to load students", error);
            alert("Error loading students: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const filterStudents = () => {
        let temp = [...students];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            temp = temp.filter(s =>
                (s.displayName?.toLowerCase() || '').includes(lowerSearch) ||
                (s.fullName?.toLowerCase() || '').includes(lowerSearch) ||
                (s.email?.toLowerCase() || '').includes(lowerSearch) ||
                (s.mobile || s.phone || '').includes(lowerSearch) ||
                (s.state?.toLowerCase() || '').includes(lowerSearch) ||
                (s.district?.toLowerCase() || '').includes(lowerSearch)
            );
        }

        if (statusFilter !== 'All') {
            temp = temp.filter(s => s.status === statusFilter);
        }

        setFilteredStudents(temp);
    };

    const handleStatusUpdate = async (id: string, newStatus: 'active' | 'blocked') => {
        if (!window.confirm(`Are you sure you want to ${newStatus === 'blocked' ? 'block' : 'activate'} this student ? `)) return;

        try {
            await studentService.updateStudentStatus(id, newStatus);
            // Optimistic update
            setStudents(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <motion.div
            className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Students</h1>
                    <p className="text-slate-500 mt-1">View and manage registered students ({filteredStudents.length}).</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <Download size={18} /> Export CSV
                    </button>
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Invite Student
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="All">All Status</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Mobile</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Exams Taken</th>
                                <th className="px-6 py-4">Joined Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center">
                                        <Loader2 className="animate-spin inline text-blue-600" size={32} />
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-500">
                                        No students found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                        onClick={() => {
                                            setSelectedStudent(student);
                                            setModalTab('attempts');
                                            fetchStudentAttemptsAndPurchases(student.id);
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-bold text-slate-600 overflow-hidden">
                                                    {student.photoURL ? (
                                                        <img src={student.photoURL} alt={student.fullName || student.displayName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (student.fullName || student.displayName || student.email).charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800">{student.fullName || student.displayName || 'Unnamed Student'}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Mail size={10} /> {student.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 font-semibold">
                                            {student.mobile || student.phone || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {student.district && student.state
                                                ? `${student.district}, ${student.state}`
                                                : student.state || student.district || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                                    }`}></span>
                                                {student.status === 'active' ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-blue-600 font-bold">
                                            {student.testsTaken || 0}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm opacity-60">
                                            {new Date(student.joinedDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2 text-slate-400">
                                                {student.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleStatusUpdate(student.id, 'blocked')}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                                                        title="Block User"
                                                    >
                                                        <UserX size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleStatusUpdate(student.id, 'active')}
                                                        className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors border border-green-100"
                                                        title="Activate User"
                                                    >
                                                        <UserCheck size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(student.id)}
                                                    className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-100"
                                                    title="Delete Student"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingStudent(student);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="p-1.5 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Simple Pagination - Just load more for v1 */}
                {/* <div className="p-4 border-t border-slate-200 flex justify-center">
                    <button className="text-sm font-medium text-blue-600 hover:underline">Load More</button>
                </div> */}
            </div>

            {/* Student Details Modal */}
            <AnimatePresence>
                {selectedStudent && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedStudent(null)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                                        {selectedStudent.displayName?.charAt(0) || selectedStudent.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">{selectedStudent.displayName || 'Unnamed Student'}</h3>
                                        <p className="text-sm text-slate-500">{selectedStudent.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                        <BarChart3 className="mx-auto text-blue-600 mb-2" size={24} />
                                        <div className="text-xl font-bold">{selectedStudent.testsTaken || 0}</div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400">Exams Taken</div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                        <Calendar className="mx-auto text-orange-600 mb-2" size={24} />
                                        <div className="text-sm font-bold">{new Date(selectedStudent.joinedDate).toLocaleDateString()}</div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400">Joined</div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                        <div className={`text-sm font-bold mb-2 capitalize ${selectedStudent.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                            {selectedStudent.status}
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Registration Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-left">
                                        <div>
                                            <span className="font-semibold text-slate-500 block text-xs">Mobile Number</span>
                                            <span className="font-bold text-slate-800">{selectedStudent.mobile || selectedStudent.phone || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-500 block text-xs">State</span>
                                            <span className="font-bold text-slate-800">{selectedStudent.state || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-500 block text-xs">District</span>
                                            <span className="font-bold text-slate-800">{selectedStudent.district || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tab Selector */}
                                <div className="flex border-b border-slate-100 mb-4">
                                    <button
                                        onClick={() => setModalTab('attempts')}
                                        className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                                            modalTab === 'attempts'
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        Test Attempts
                                    </button>
                                    <button
                                        onClick={() => setModalTab('purchases')}
                                        className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                                            modalTab === 'purchases'
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        Purchased Courses
                                    </button>
                                </div>

                                <div>
                                    {modalTab === 'attempts' ? (
                                        <div>
                                            {isLoadingAttempts ? (
                                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
                                            ) : studentAttempts.length === 0 ? (
                                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 font-medium">No attempts recorded yet.</div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {studentAttempts.map((attempt: any) => (
                                                        <div key={attempt.id} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center transition-all hover:border-blue-300 shadow-sm">
                                                            <div>
                                                                <div className="font-bold text-slate-800">{attempt.testTitle}</div>
                                                                <div className="text-xs text-slate-500">Attempted: {attempt.attemptDate?.toDate ? new Date(attempt.attemptDate.toDate()).toLocaleString() : new Date(attempt.attemptDate).toLocaleString()}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-extrabold text-blue-600">{attempt.score}%</div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Score</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            {isLoadingPurchases ? (
                                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
                                            ) : studentPurchases.length === 0 ? (
                                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 font-medium">No courses purchased yet.</div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {studentPurchases.map((purchase: any) => (
                                                        <div key={purchase.id} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center transition-all hover:border-blue-300 shadow-sm">
                                                            <div>
                                                                <div className="font-bold text-slate-800">{purchase.seriesTitle || purchase.testTitle}</div>
                                                                <div className="text-xs text-slate-500">
                                                                    Status: <span className="capitalize font-semibold text-blue-600">{purchase.paymentStatus || 'free'}</span>
                                                                    {purchase.paymentId && purchase.paymentId !== 'free' && ` | ID: ${purchase.paymentId}`}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-extrabold text-slate-700">
                                                                    {purchase.price > 0 ? `₹${purchase.price}` : 'Free'}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Price</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="px-5 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-xl transition-all"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        handleStatusUpdate(selectedStudent.id, selectedStudent.status === 'active' ? 'blocked' : 'active');
                                        setSelectedStudent(null);
                                    }}
                                    className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${selectedStudent.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                >
                                    {selectedStudent.status === 'active' ? 'Block Student' : 'Activate Student'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Invite Student Modal */}
                {isInviteModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsInviteModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-slate-800">Add New Student</h3>
                                <button onClick={() => setIsInviteModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={inviteFormData.displayName}
                                        onChange={(e) => setInviteFormData({ ...inviteFormData, displayName: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                                        placeholder="Enter student name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={inviteFormData.email}
                                        onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                                        placeholder="student@example.com"
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsInviteModalOpen(false)}
                                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingInvite}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        {isSubmittingInvite ? 'Adding...' : 'Add Student'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Edit Student Modal */}
                {isEditModalOpen && editingStudent && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsEditModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-xl font-bold text-slate-800">Edit Student Profile</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingStudent.displayName || editingStudent.fullName || ''}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, displayName: e.target.value, fullName: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={editingStudent.email}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                                        placeholder="student@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Mobile Number</label>
                                    <input
                                        type="text"
                                        value={editingStudent.mobile || editingStudent.phone || ''}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, mobile: e.target.value, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                                        placeholder="10-digit mobile number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">State</label>
                                    <input
                                        type="text"
                                        value={editingStudent.state || ''}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, state: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                                        placeholder="State"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">District</label>
                                    <input
                                        type="text"
                                        value={editingStudent.district || ''}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, district: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                                        placeholder="District"
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingInvite}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        {isSubmittingInvite ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminStudentsPage;
