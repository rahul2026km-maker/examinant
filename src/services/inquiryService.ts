import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const INQUIRY_COLLECTION = 'inquiries';

export interface Inquiry {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'resolved';
    createdAt: Timestamp | null;
}

export const submitInquiry = async (data: Omit<Inquiry, 'id' | 'status' | 'createdAt'>): Promise<string> => {
    const inquiryData = {
        ...data,
        status: 'new',
        createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, INQUIRY_COLLECTION), inquiryData);
    return docRef.id;
};

export const getInquiries = async (): Promise<Inquiry[]> => {
    const q = query(collection(db, INQUIRY_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Inquiry[];
};

export const updateInquiryStatus = async (id: string, status: 'new' | 'read' | 'resolved'): Promise<void> => {
    const docRef = doc(db, INQUIRY_COLLECTION, id);
    await updateDoc(docRef, { status });
};

export const deleteInquiry = async (id: string): Promise<void> => {
    const docRef = doc(db, INQUIRY_COLLECTION, id);
    await deleteDoc(docRef);
};
