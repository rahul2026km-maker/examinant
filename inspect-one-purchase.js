import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
    const docRef = doc(db, 'purchases', '29XgCZ90qhXWoTj1NKi9');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        console.log("Full data:", JSON.stringify(snap.data(), null, 2));
    } else {
        console.log("Doc not found");
    }
}

run().catch(console.error);
