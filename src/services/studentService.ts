import { db, auth } from '../firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    startAfter,
    limit,
    getDoc,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';

export interface Student {
    id: string;
    displayName?: string;
    fullName?: string;
    email: string;
    photoURL?: string;
    role: 'student' | 'admin';
    status: 'active' | 'inactive' | 'blocked';
    joinedDate: any;
    createdAt?: any;
    // Stats (to be fetched or aggregated)
    testsTaken?: number;
    avgScore?: number;
    phone?: string;
    mobile?: string;
    state?: string;
    district?: string;
}

/**
 * Robust date parser supporting Firestore Timestamps, objects with seconds,
 * standard JS Dates, ISO strings, and fallbacks.
 */
export const parseStudentJoinedDate = (data: any): Date => {
    const raw = data.joinedDate || data.createdAt || data.joinedAt || data.created_at || data.updatedAt;
    if (!raw) return new Date(0);

    if (typeof raw.toDate === 'function') {
        return raw.toDate();
    }
    if (raw.seconds) {
        return new Date(raw.seconds * 1000);
    }
    if (raw instanceof Date) {
        return raw;
    }
    const d = new Date(raw);
    return isNaN(d.getTime()) ? new Date(0) : d;
};

const mapStudentDoc = async (docSnap: any): Promise<Student> => {
    const data = docSnap.data();
    let testsTaken = data.testsTaken || 0;
    try {
        const attemptsRef = collection(db, 'users', docSnap.id, 'attempts');
        const attemptsSnapshot = await getDocs(attemptsRef);
        testsTaken = attemptsSnapshot.size;
    } catch {
        // Fallback gracefully if subcollection reading fails or lacks permissions
    }

    return {
        id: docSnap.id,
        ...data,
        displayName: data.displayName || data.fullName || 'Student',
        fullName: data.fullName || data.displayName || 'Student',
        email: data.email || 'N/A',
        role: data.role || 'student',
        status: data.status || 'active',
        testsTaken,
        joinedDate: parseStudentJoinedDate(data),
        createdAt: data.createdAt ? parseStudentJoinedDate({ joinedDate: data.createdAt }) : undefined
    } as Student;
};

export const studentService = {
    /**
     * Fetch all students with basic pagination and searching
     */
    getAllStudents: async (lastDoc?: any, pageSize: number = 200, _searchTerm: string = '') => {
        try {
            // Fetch users from collection. We do not use where('role', '==', 'student')
            // because students registered without an explicit role field would be excluded by Firestore.
            let q = query(
                collection(db, 'users'),
                limit(pageSize)
            );

            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);
            // Exclude only admin accounts - treat all other users as students
            const studentDocs = snapshot.docs.filter(docSnap => docSnap.data().role !== 'admin');

            // Populate real stats by fetching subcollection sizes
            const studentsWithStats = await Promise.all(
                studentDocs.map(docSnap => mapStudentDoc(docSnap))
            );

            // Always sort descending by joinedDate (newest registered students at top)
            studentsWithStats.sort((a, b) => {
                const timeA = a.joinedDate instanceof Date ? a.joinedDate.getTime() : new Date(a.joinedDate || 0).getTime();
                const timeB = b.joinedDate instanceof Date ? b.joinedDate.getTime() : new Date(b.joinedDate || 0).getTime();
                return timeB - timeA;
            });

            return {
                students: studentsWithStats,
                lastVisible: snapshot.docs[snapshot.docs.length - 1]
            };

        } catch (error) {
            console.error("Error fetching students:", error);
            throw error;
        }
    },

    /**
     * Subscribe to real-time student updates so new registrations appear instantly
     */
    subscribeToStudents: (onUpdate: (students: Student[]) => void, onError?: (err: any) => void) => {
        const q = query(collection(db, 'users'), limit(200));
        return onSnapshot(q, async (snapshot) => {
            try {
                const studentDocs = snapshot.docs.filter(docSnap => docSnap.data().role !== 'admin');
                const studentsWithStats = await Promise.all(
                    studentDocs.map(docSnap => mapStudentDoc(docSnap))
                );

                studentsWithStats.sort((a, b) => {
                    const timeA = a.joinedDate instanceof Date ? a.joinedDate.getTime() : new Date(a.joinedDate || 0).getTime();
                    const timeB = b.joinedDate instanceof Date ? b.joinedDate.getTime() : new Date(b.joinedDate || 0).getTime();
                    return timeB - timeA;
                });

                onUpdate(studentsWithStats);
            } catch (err) {
                console.error("Error processing real-time students update:", err);
                if (onError) onError(err);
            }
        }, (err) => {
            console.error("Firestore onSnapshot error:", err);
            if (onError) onError(err);
        });
    },

    /**
     * Update student status (block/unblock)
     */
    updateStudentStatus: async (studentId: string, status: 'active' | 'inactive' | 'blocked') => {
        try {
            const userRef = doc(db, 'users', studentId);
            await updateDoc(userRef, {
                status,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Error updating student status:", error);
            throw error;
        }
    },

    /**
     * Get single student detailed profile
     */
    getStudentDetails: async (studentId: string) => {
        try {
            const userRef = doc(db, 'users', studentId);
            const snapshot = await getDoc(userRef);
            if (snapshot.exists()) {
                return { id: snapshot.id, ...snapshot.data() } as Student;
            }
            return null;
        } catch (error) {
            console.error("Error getting student details:", error);
            return null;
        }
    },

    /**
     * Update student profile data
     */
    updateStudent: async (studentId: string, data: Partial<Student>) => {
        try {
            const userRef = doc(db, 'users', studentId);
            await updateDoc(userRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Error updating student:", error);
            throw error;
        }
    },

    /**
     * Enroll student in a test series (record purchase)
     */
    enrollInTestSeries: async (
        userId: string, 
        series: any, 
        paymentDetails?: { paymentId?: string, paymentStatus?: string },
        studentInfo?: { fullName?: string | null; email?: string | null; mobile?: string | null; displayName?: string | null; phoneNumber?: string | null }
    ) => {
        try {
            // Get user details from Firestore
            const userSnap = await getDoc(doc(db, 'users', userId));
            const userData = userSnap.exists() ? userSnap.data() : null;

            const purchaseData = {
                seriesId: series.id,
                testId: series.id, // Fallback
                type: 'series',
                seriesTitle: series.name,
                testTitle: series.name, // Fallback
                category: series.examCategory || 'General',
                subCategory: series.examSubCategory || '',
                price: series.pricing.type === 'free' ? 0 : (series.pricing.amount || 0),
                purchaseDate: serverTimestamp(),
                status: 'active',
                paymentId: paymentDetails?.paymentId || 'free',
                paymentStatus: paymentDetails?.paymentStatus || (series.pricing.type === 'free' ? 'free' : 'completed')
            };

            // Write to student's private purchases collection
            await addDoc(collection(db, 'users', userId, 'purchases'), purchaseData);

            // Also write to global purchases collection for admin view
            await addDoc(collection(db, 'purchases'), {
                ...purchaseData,
                userId,
                studentName: userData?.fullName || userData?.displayName || studentInfo?.fullName || studentInfo?.displayName || auth.currentUser?.displayName || 'Student',
                studentEmail: userData?.email || studentInfo?.email || auth.currentUser?.email || 'student@example.com',
                studentMobile: userData?.mobile || userData?.phone || studentInfo?.mobile || studentInfo?.phoneNumber || auth.currentUser?.phoneNumber || ''
            });

            return true;
        } catch (error) {
            console.error("Error enrolling in test series:", error);
            throw error;
        }
    },

    /**
     * Delete student document
     */
    deleteStudent: async (studentId: string) => {
        try {
            await deleteDoc(doc(db, 'users', studentId));
            return true;
        } catch (error) {
            console.error("Error deleting student:", error);
            throw error;
        }
    },

    /**
     * Manually add a student (minimal record)
     */
    addStudent: async (data: { displayName: string, email: string }) => {
        try {
            // Check if email already exists
            const q = query(collection(db, 'users'), where('email', '==', data.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                throw new Error("EMAIL_EXISTS");
            }

            const userRef = await addDoc(collection(db, 'users'), {
                ...data,
                role: 'student',
                status: 'active',
                joinedDate: serverTimestamp(),
                createdAt: serverTimestamp()
            });
            return { id: userRef.id, ...data };
        } catch (error: any) {
            console.error("Error adding student:", error);
            throw error;
        }
    }
};
