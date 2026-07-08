import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDwkmfRn7_GZwUslawEuWRYUvkceL96xNg",
    authDomain: "examinantt-ae432.firebaseapp.com",
    projectId: "examinantt-ae432",
    storageBucket: "examinantt-ae432.appspot.com",
    messagingSenderId: "121993344266",
    appId: "1:121993344266:web:5ba79677f952793351f6f3",
    measurementId: "G-2KK00MFTLC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    console.log("=== ALL USERS IN 'users' ===");
    for (const d of snap.docs) {
        console.log(`ID: ${d.id} | Email: ${d.data().email} | Name: ${d.data().fullName || d.data().displayName} | Mobile: ${d.data().mobile}`);
    }
}

run().catch(console.error);
