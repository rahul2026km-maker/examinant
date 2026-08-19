import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Course, CourseEnrollment } from '../types/course.types';

export const entitlementService = {
    /**
     * Check if a student has active entitlement/access to a course
     */
    hasCourseAccess: async (userId: string, course: Course, userProfile?: any): Promise<{
        hasAccess: boolean;
        source?: 'free' | 'purchase' | 'subscription' | 'exam_pass' | 'admin' | 'none';
        enrollment?: CourseEnrollment;
    }> => {
        try {
            if (!userId) return { hasAccess: false, source: 'none' };

            // 1. Check if course is free
            if (course.accessType === 'free') {
                return { hasAccess: true, source: 'free' };
            }

            // 2. Check direct enrollment record under users/{userId}/enrollments
            const enrollmentsRef = collection(db, 'users', userId, 'enrollments');
            const q = query(enrollmentsRef, where('courseId', '==', course.id), where('status', 'in', ['active', 'completed']));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const enrollmentDoc = snapshot.docs[0];
                const data = { id: enrollmentDoc.id, ...enrollmentDoc.data() } as CourseEnrollment;
                return {
                    hasAccess: true,
                    source: data.source || 'purchase',
                    enrollment: data
                };
            }

            // 3. Check legacy purchase records for backward compatibility
            const purchasesRef = collection(db, 'users', userId, 'purchases');
            const purchaseQ = query(purchasesRef, where('itemId', '==', course.id));
            const purchaseSnap = await getDocs(purchaseQ);
            if (!purchaseSnap.empty) {
                return { hasAccess: true, source: 'purchase' };
            }

            // 4. Check active subscription entitlement
            if (userProfile?.subscription?.status === 'active' || userProfile?.role === 'admin') {
                const subPlan = userProfile?.subscription?.planId;
                const subCategories = userProfile?.subscription?.accessibleCategories || ['ALL'];
                
                if (userProfile?.role === 'admin') {
                    return { hasAccess: true, source: 'admin' };
                }

                if (course.accessType === 'subscription') {
                    if (subCategories.includes('ALL') || subCategories.includes(course.examCategory)) {
                        return { hasAccess: true, source: 'subscription' };
                    }
                    if (course.subscriptionPlanIds && subPlan && course.subscriptionPlanIds.includes(subPlan)) {
                        return { hasAccess: true, source: 'subscription' };
                    }
                }
            }

            // 5. Check Exam Pass entitlement
            if (course.accessType === 'exam_pass' && userProfile?.examPasses) {
                const hasPass = course.examPassIds?.some(passId => userProfile.examPasses.includes(passId));
                if (hasPass) {
                    return { hasAccess: true, source: 'exam_pass' };
                }
            }

            return { hasAccess: false, source: 'none' };

        } catch (error) {
            console.error("Error checking course entitlement:", error);
            return { hasAccess: false, source: 'none' };
        }
    },

    /**
     * Create an enrollment document for student
     */
    createEnrollment: async (
        userId: string,
        course: Course,
        source: 'free' | 'purchase' | 'subscription' | 'exam_pass' | 'admin',
        paymentDetails?: { paymentId?: string; amountPaid?: number }
    ): Promise<CourseEnrollment> => {
        try {
            const enrollmentRef = doc(collection(db, 'users', userId, 'enrollments'));
            const newEnrollment: CourseEnrollment = {
                id: enrollmentRef.id,
                userId,
                courseId: course.id,
                courseTitle: course.title,
                thumbnailUrl: course.thumbnailUrl || '',
                source,
                paymentId: paymentDetails?.paymentId || (source === 'free' ? 'free' : 'n/a'),
                amountPaid: paymentDetails?.amountPaid || (course.pricing?.amount || 0),
                status: 'active',
                enrolledAt: serverTimestamp(),
                progressPercent: 0
            };

            await setDoc(enrollmentRef, newEnrollment);

            // Increment total enrollments in course stats
            const courseRef = doc(db, 'courses', course.id);
            const currentSnap = await getDoc(courseRef);
            if (currentSnap.exists()) {
                const currentData = currentSnap.data();
                const currentCount = currentData.stats?.totalEnrollments || 0;
                await setDoc(courseRef, {
                    stats: {
                        ...currentData.stats,
                        totalEnrollments: currentCount + 1
                    }
                }, { merge: true });
            }

            return newEnrollment;
        } catch (error) {
            console.error("Error creating enrollment:", error);
            throw error;
        }
    },

    /**
     * Fetch all active enrollments for student
     */
    getStudentEnrollments: async (userId: string): Promise<CourseEnrollment[]> => {
        try {
            const enrollmentsRef = collection(db, 'users', userId, 'enrollments');
            const snapshot = await getDocs(enrollmentsRef);
            return snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as CourseEnrollment[];
        } catch (error) {
            console.error("Error fetching student enrollments:", error);
            return [];
        }
    }
};
