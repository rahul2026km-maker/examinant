import { db } from '../firebase';
import { collection, doc, query, orderBy, onSnapshot, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export interface ExamRecord {
    id: string;
    name: string;
    createdAt?: any;
    updatedAt?: any;
}

export const DEFAULT_EXAMS: string[] = [
    'JEE',
    'NEET',
    'SSC',
    'Boards',
    'Other'
];

const examsCollection = collection(db, 'exams');

export const examService = {
    subscribe: (onUpdate: (exams: ExamRecord[]) => void) => {
        const examsQuery = query(examsCollection, orderBy('name', 'asc'));
        return onSnapshot(examsQuery, (snapshot) => {
            const loadedExams = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ExamRecord[];
            onUpdate(loadedExams);
        });
    },

    getAll: async (): Promise<ExamRecord[]> => {
        const examsQuery = query(examsCollection, orderBy('name', 'asc'));
        const snapshot = await getDocs(examsQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ExamRecord[];
    },

    create: async (name: string) => {
        await addDoc(examsCollection, {
            name,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    },

    update: async (id: string, name: string) => {
        const examRef = doc(examsCollection, id);
        await updateDoc(examRef, {
            name,
            updatedAt: serverTimestamp()
        });
    },

    delete: async (id: string) => {
        const examRef = doc(examsCollection, id);
        await deleteDoc(examRef);
    }
};
