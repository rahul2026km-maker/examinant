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
    serverTimestamp
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
    // Stats (to be fetched or aggregated)
    testsTaken?: number;
    avgScore?: number;
    phone?: string;
    mobile?: string;
    state?: string;
    district?: string;
}

export const studentService = {
    /**
     * Fetch all students with basic pagination and searching
     */
    getAllStudents: async (lastDoc?: any, pageSize: number = 20, _searchTerm: string = '') => {
        try {
            let q = query(
                collection(db, 'users'),
                where('role', '==', 'student'),
                limit(pageSize)
            );

            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            // Note: complex search usually requires Algolia/ElasticSearch with Firestore.
            // For simple client-side filtering on small datasets, we might fetch more or exact match.
            // Here we'll just fetch latest. Client side filtering for small user bases is often acceptable initially.

            const snapshot = await getDocs(q);
            const students: Student[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Student));

            // Populate real stats by fetching subcollection sizes
            const studentsWithStats = await Promise.all(students.map(async (student) => {
                const attemptsRef = collection(db, 'users', student.id, 'attempts');
                const attemptsSnapshot = await getDocs(attemptsRef);

                return {
                    ...student,
                    status: student.status || 'active',
                    testsTaken: attemptsSnapshot.size, // Real count
                    joinedDate: student.joinedDate ? (student.joinedDate.toDate ? student.joinedDate.toDate() : new Date(student.joinedDate)) : new Date()
                };
            }));

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
    enrollInTestSeries: async (userId: string, series: any, paymentDetails?: { paymentId?: string, paymentStatus?: string }) => {
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
                studentName: userData?.fullName || userData?.displayName || auth.currentUser?.displayName || 'Student',
                studentEmail: userData?.email || auth.currentUser?.email || 'student@example.com',
                studentMobile: userData?.mobile || userData?.phone || auth.currentUser?.phoneNumber || ''
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
