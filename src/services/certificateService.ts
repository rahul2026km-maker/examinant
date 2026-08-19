import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { CourseCertificate } from '../types/course.types';

const CERTIFICATES_COLLECTION = 'courseCertificates';

export const certificateService = {
    /**
     * Generate a unique certificate ID
     */
    generateCertificateId: (): string => {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        return `EXM-CERT-${randomNum}`;
    },

    /**
     * Issue a completion certificate
     */
    issueCertificate: async (
        userId: string,
        userName: string,
        courseId: string,
        courseTitle: string
    ): Promise<CourseCertificate> => {
        try {
            // Check if certificate already exists
            const q = query(
                collection(db, CERTIFICATES_COLLECTION),
                where('userId', '==', userId),
                where('courseId', '==', courseId)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const existing = snapshot.docs[0];
                return { id: existing.id, ...existing.data() } as CourseCertificate;
            }

            const certId = certificateService.generateCertificateId();
            const certRef = doc(db, CERTIFICATES_COLLECTION, certId);
            const newCert: CourseCertificate = {
                id: certId,
                userId,
                userName,
                courseId,
                courseTitle,
                issuedAt: serverTimestamp(),
                completionDate: serverTimestamp(),
                status: 'valid'
            };

            await setDoc(certRef, newCert);
            return newCert;
        } catch (error) {
            console.error("Error issuing certificate:", error);
            throw error;
        }
    },

    /**
     * Verify a certificate by ID (Public)
     */
    verifyCertificate: async (certificateId: string): Promise<CourseCertificate | null> => {
        try {
            const certRef = doc(db, CERTIFICATES_COLLECTION, certificateId);
            const snapshot = await getDoc(certRef);
            if (!snapshot.exists()) return null;
            return { id: snapshot.id, ...snapshot.data() } as CourseCertificate;
        } catch (error) {
            console.error("Error verifying certificate:", error);
            return null;
        }
    },

    /**
     * Get user certificates
     */
    getUserCertificates: async (userId: string): Promise<CourseCertificate[]> => {
        try {
            const q = query(
                collection(db, CERTIFICATES_COLLECTION),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as CourseCertificate[];
        } catch (error) {
            console.error("Error fetching user certificates:", error);
            return [];
        }
    }
};
