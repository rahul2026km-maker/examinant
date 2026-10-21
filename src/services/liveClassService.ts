import { 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    setDoc, 
    addDoc,
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { LiveClass, LiveClassFormData, JitsiTokenResponse, LiveClassChatMessage } from '../types/liveClass.types';

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
        streamUrl: '',
        streamProvider: 'jitsi',
        roomName: 'examinant_maths_live_speed_tricks',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
        status: 'live',
        startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
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
        streamUrl: '',
        streamProvider: 'jitsi',
        roomName: 'examinant_gk_marathon_session',
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
        streamUrl: '',
        streamProvider: 'jitsi',
        roomName: 'examinant_english_comprehension_mastery',
        thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
        status: 'upcoming',
        activeViewers: 0
    }
];

export const liveClassService = {
    // Realtime subscription for all live classes
    subscribeToLiveClasses(callback: (classes: LiveClass[]) => void) {
        const colRef = collection(db, COLLECTION_NAME);
        const q = query(colRef);

        return onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
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

    // Realtime subscription for a single class (Auto-detects when instructor clicks 'Start Class')
    subscribeToSingleClass(classId: string, callback: (liveClass: LiveClass | null) => void) {
        if (!classId) return () => {};

        // If it's a mock/default class
        if (classId.startsWith('default-live-')) {
            const fallback = DEFAULT_LIVE_CLASSES.map((item, idx) => ({
                ...item,
                id: `default-live-${idx + 1}`
            })).find(c => c.id === classId) || null;
            callback(fallback);
            return () => {};
        }

        const docRef = doc(db, COLLECTION_NAME, classId);
        return onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                callback({ id: snapshot.id, ...snapshot.data() } as LiveClass);
            } else {
                callback(null);
            }
        }, (err) => {
            console.warn(`Firestore subscription error for class ${classId}:`, err);
            callback(null);
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
            if (id.startsWith('default-live-')) {
                return DEFAULT_LIVE_CLASSES.map((item, idx) => ({
                    ...item,
                    id: `default-live-${idx + 1}`
                })).find(c => c.id === id) || null;
            }

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
        const generatedRoom = data.roomName || `examinant_${data.title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)}_${Date.now().toString(36)}`;

        await setDoc(docRef, {
            ...data,
            roomName: generatedRoom,
            streamProvider: data.streamProvider || 'jitsi',
            activeViewers: data.status === 'live' ? Math.floor(Math.random() * 150) + 120 : 0,
            startedAt: data.status === 'live' ? new Date().toISOString() : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateLiveClass(id: string, data: Partial<LiveClassFormData & { roomName?: string; startedAt?: string; endedAt?: string }>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    // Session State Management: Instructor Starts Class
    async startLiveClass(id: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            status: 'live',
            startedAt: new Date().toISOString(),
            activeViewers: Math.floor(Math.random() * 150) + 120,
            updatedAt: serverTimestamp()
        });
    },

    // Session State Management: Instructor Ends Class for All
    async endLiveClass(id: string, recordingUrl?: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData: any = {
            status: 'completed',
            endedAt: new Date().toISOString(),
            activeViewers: 0,
            updatedAt: serverTimestamp()
        };
        if (recordingUrl) {
            updateData.recordingUrl = recordingUrl;
        }
        await updateDoc(docRef, updateData);
    },

    // Save or update class replay/recording URL
    async saveClassRecording(id: string, recordingUrl: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            recordingUrl,
            status: 'completed',
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
            updatePayload.startedAt = new Date().toISOString();
            updatePayload.activeViewers = Math.floor(Math.random() * 150) + 180;
        } else if (status === 'completed') {
            updatePayload.endedAt = new Date().toISOString();
            updatePayload.activeViewers = 0;
        }
        await updateDoc(docRef, updatePayload);
    },

    async deleteLiveClass(id: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    },

    // Backend JWT Token Fetcher for Jitsi / 8x8 JaaS
    async fetchLiveToken(params: {
        classId: string;
        roomId?: string;
        userId?: string;
        userName?: string;
        userEmail?: string;
        userAvatar?: string;
        isInstructor: boolean;
    }): Promise<JitsiTokenResponse> {
        try {
            const response = await fetch('/api/live-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                throw new Error(`Token endpoint responded with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.warn("Notice: Fetching live token via client fallback config:", error);
            const jaasAppId = import.meta.env.VITE_JAAS_APP_ID || '';
            const rawRoom = (params.roomId || params.classId || 'classroom').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
            const cleanRoom = rawRoom.startsWith('examinant_') ? rawRoom : `examinant_${rawRoom}`;
            
            if (jaasAppId) {
                return {
                    token: null,
                    mode: 'jaas',
                    domain: '8x8.vc',
                    appId: jaasAppId,
                    roomName: `${jaasAppId}/${cleanRoom}`,
                    isInstructor: params.isInstructor
                };
            }

            return {
                token: null,
                mode: 'jitsi_meet_direct',
                domain: 'meet.jit.si',
                roomName: cleanRoom,
                isInstructor: params.isInstructor
            };
        }
    },

    // -------------------------------------------------------------
    // Real-time Live Classroom Student & Instructor Chat
    // -------------------------------------------------------------
    subscribeToClassMessages(classId: string, callback: (messages: LiveClassChatMessage[]) => void) {
        if (!classId) return () => {};

        const messagesColRef = collection(db, COLLECTION_NAME, classId, 'messages');
        const q = query(messagesColRef, orderBy('createdAt', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const list: LiveClassChatMessage[] = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            } as LiveClassChatMessage));
            callback(list);
        }, (err) => {
            console.warn(`Firestore live chat subscription notice for ${classId}:`, err);
            callback([]);
        });
    },

    async sendClassMessage(classId: string, messageData: {
        userId: string;
        userName: string;
        userAvatar?: string;
        isFaculty: boolean;
        message: string;
    }): Promise<void> {
        if (!classId || !messageData.message.trim()) return;

        const messagesColRef = collection(db, COLLECTION_NAME, classId, 'messages');
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        await addDoc(messagesColRef, {
            ...messageData,
            classId,
            time: timeStr,
            createdAt: serverTimestamp()
        });
    }
};
