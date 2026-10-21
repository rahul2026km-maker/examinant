import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDwkmfRn7_GZwUslawEuWRYUvkceL96xNg",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "examinantt-ae432.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "examinantt-ae432",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "examinantt-ae432.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "121993344266",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:121993344266:web:5ba79677f952793351f6f3",
    measurementId: "G-2KK00MFTLC"
};

// Initialize Firebase
let app;
let auth: any;
let db: any;
let storage: any;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "examinantt-ae432.firebasestorage.app";
    storage = getStorage(app, `gs://${bucket}`);
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

export { auth, db, storage };
export default app;
