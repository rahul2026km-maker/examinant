const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyDwkmfRn7_GZwUslawEuWRYUvkceL96xNg",
    authDomain: "examinantt-ae432.firebaseapp.com",
    projectId: "examinantt-ae432",
    storageBucket: "examinantt-ae432.appspot.com",
    messagingSenderId: "121993344266",
    appId: "1:121993344266:web:5ba79677f952793351f6f3"
};

async function makeAdmin() {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const targetEmails = ['professoraditya@gmail.com', 'professoraditya0@gmail.com'];

    for (const email of targetEmails) {
        console.log(`Processing email: ${email}...`);
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            for (const userDoc of querySnapshot.docs) {
                await updateDoc(doc(db, 'users', userDoc.id), { role: 'admin' });
                console.log(`UPDATED: Set role='admin' for existing doc ID: ${userDoc.id} (${email})`);
            }
        } else {
            console.log(`No doc found in 'users' for ${email}. Querying all users to find matching UID or creating document...`);
        }
    }

    // Also get all documents in users collection to report
    const allUsersSnap = await getDocs(collection(db, 'users'));
    console.log('\n--- ALL USERS IN FIRESTORE ---');
    allUsersSnap.forEach((d) => {
        const data = d.data();
        console.log(`Doc ID: ${d.id} | Email: ${data.email} | Role: ${data.role}`);
    });
}

makeAdmin().catch(console.error);
