import { 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { LiveClass, LiveClassFormData } from '../types/liveClass.types';

const COLLECTION_NAME = 'live_classes';

// Seed sample data if Firestore collection is brand new
export const DEFAULT_LIVE_CLASSES: Omit<LiveClass, 'id'>[] = [
    {
        title: 'Quantitative Aptitude: Speed Maths & Short Tricks Live Session',
        description: 'Join Sudhanshu Sir live for real-time problem solving, short tricks, and doubts discussion.',
        educatorName: 'Sudhanshu Sir',
        educatorAvatar: '',
        subject: 'Mathematics',
        examCategory: 'SSC',
        scheduledStartTime: new Date().toISOString(),
        durationMinutes: 60,
        streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        streamProvider: 'youtube',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
        status: 'live',
        activeViewers: 248
    },
    {
        title: 'General Awareness: Current Affairs & Static GK Marathon',
        description: 'Comprehensive static GK revision with top 100 expected questions for upcoming exam tiers.',
        educatorName: 'Dr. Ananya Sharma',
        educatorAvatar: '',
        subject: 'General Awareness',
        examCategory: 'Railway',
        scheduledStartTime: new Date(Date.now() + 3600000 * 4).toISOString(), // 4 hrs from now
        durationMinutes: 90,
        streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        streamProvider: 'youtube',
        thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
        status: 'upcoming',
        activeViewers: 0
    },
    {
        title: 'English Comprehension & Vocab Mastery Masterclass',
        description: 'Master reading comprehension, cloze test techniques and high-frequency idioms.',
        educatorName: 'Priya Verma',
        educatorAvatar: '',
        subject: 'English',
        examCategory: 'Banking',
        scheduledStartTime: new Date(Date.now() + 3600000 * 24).toISOString(), // tomorrow
        durationMinutes: 60,
        streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        streamProvider: 'youtube',
        thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
        status: 'upcoming',
        activeViewers: 0
    }
];

export const liveClassService = {
    // Realtime subscription for students and admin
    subscribeToLiveClasses(callback: (classes: LiveClass[]) => void) {
        const colRef = collection(db, COLLECTION_NAME);
        const q = query(colRef);

        return onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                // If collection is empty, return defaults
                const seeded: LiveClass[] = DEFAULT_LIVE_CLASSES.map((item, idx) => ({
                    ...item,
                    id: `default-live-${idx + 1}`
                }));
                callback(seeded);
            } else {
                const list: LiveClass[] = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                } as LiveClass));

                // Sort: 'live' first, then upcoming by start time, then completed
                list.sort((a, b) => {
                    if (a.status === 'live' && b.status !== 'live') return -1;
                    if (b.status === 'live' && a.status !== 'live') return 1;
                    return new Date(a.scheduledStartTime || 0).getTime() - new Date(b.scheduledStartTime || 0).getTime();
                });

                callback(list);
            }
        }, (err) => {
            console.warn("Firestore live_classes subscription fallback:", err);
            const seeded: LiveClass[] = DEFAULT_LIVE_CLASSES.map((item, idx) => ({
                ...item,
                id: `default-live-${idx + 1}`
            }));
            callback(seeded);
        });
    },

    async getAllLiveClasses(): Promise<LiveClass[]> {
        try {
            const snap = await getDocs(collection(db, COLLECTION_NAME));
            if (snap.empty) {
                return DEFAULT_LIVE_CLASSES.map((item, idx) => ({
                    ...item,
                    id: `default-live-${idx + 1}`
                }));
            }
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveClass));
        } catch (error) {
            console.error("Error getting live classes:", error);
            return DEFAULT_LIVE_CLASSES.map((item, idx) => ({
                ...item,
                id: `default-live-${idx + 1}`
            }));
        }
    },

    async getLiveClassById(id: string): Promise<LiveClass | null> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return null;
            return { id: snap.id, ...snap.data() } as LiveClass;
        } catch (error) {
            console.error("Error getting live class by id:", error);
            return null;
        }
    },

    async createLiveClass(data: LiveClassFormData): Promise<string> {
        const colRef = collection(db, COLLECTION_NAME);
        const docRef = doc(colRef);
        await setDoc(docRef, {
            ...data,
            activeViewers: data.status === 'live' ? Math.floor(Math.random() * 150) + 120 : 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateLiveClass(id: string, data: Partial<LiveClassFormData>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async setLiveClassStatus(id: string, status: LiveClass['status']): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updatePayload: any = {
            status,
            updatedAt: serverTimestamp()
        };
        if (status === 'live') {
            updatePayload.activeViewers = Math.floor(Math.random() * 150) + 180;
        } else if (status === 'completed') {
            updatePayload.activeViewers = 0;
        }
        await updateDoc(docRef, updatePayload);
    },

    async deleteLiveClass(id: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    }
};
