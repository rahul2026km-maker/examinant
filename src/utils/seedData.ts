import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const seedData = async () => {
    try {
        // Seed PYQs
        const pyqs = [
            {
                title: "JEE Mains 2023 Physics Paper",
                category: "JEE",
                year: "2023",
                type: "pdf",
                fileUrl: "https://firebasestorage.googleapis.com/v0/b/examinant-99.appspot.com/o/sample.pdf?alt=media",
                price: 0,
                createdAt: serverTimestamp()
            },
            {
                title: "NEET 2022 Biology Full Mock",
                category: "NEET",
                year: "2022",
                type: "test",
                testId: "jee-physics-unit-dimensions", // Example existing test ID
                price: 99,
                createdAt: serverTimestamp()
            },
            {
                title: "JEE Advanced 2023 Chemistry",
                category: "JEE",
                year: "2023",
                type: "pdf",
                fileUrl: "https://firebasestorage.googleapis.com/v0/b/examinant-99.appspot.com/o/sample.pdf?alt=media",
                price: 49,
                createdAt: serverTimestamp()
            },
            {
                title: "SSC CGL 2023 General Awareness",
                category: "SSC",
                year: "2023",
                type: "pdf",
                fileUrl: "https://firebasestorage.googleapis.com/v0/b/examinant-99.appspot.com/o/sample.pdf?alt=media",
                price: 0,
                createdAt: serverTimestamp()
            }
        ];

        for (const pyq of pyqs) {
            await addDoc(collection(db, 'pyqs'), pyq);
        }

        // Seed Resources
        const resources = [
            {
                title: "Organic Chemistry Revision Notes",
                description: "Complete notes for 12th Board and Competitive Exams.",
                type: "pdf",
                category: "Chemistry",
                url: "https://firebasestorage.googleapis.com/v0/b/examinant-99.appspot.com/o/sample.pdf?alt=media",
                isFree: true,
                price: 0,
                createdAt: serverTimestamp()
            },
            {
                title: "Advanced Physics Video Series",
                description: "Deep dive into Mechanics and Electromagnetism.",
                type: "video",
                category: "Physics",
                url: "https://www.youtube.com/watch?v=8qd8yWrrXu4",
                isFree: false,
                price: 199,
                createdAt: serverTimestamp()
            },
            {
                title: "SSC Maths Formula Booklet",
                description: "Quick reference for all important math formulas.",
                type: "pdf",
                category: "Maths",
                url: "https://firebasestorage.googleapis.com/v0/b/examinant-99.appspot.com/o/sample.pdf?alt=media",
                isFree: true,
                price: 0,
                createdAt: serverTimestamp()
            },
            {
                title: "UPSC General Studies Link",
                description: "Curated resource for current affairs.",
                type: "link",
                category: "General Studies",
                url: "https://example.com",
                isFree: false,
                price: 29,
                createdAt: serverTimestamp()
            }
        ];

        for (const res of resources) {
            await addDoc(collection(db, 'resources'), res);
        }

        return true;
    } catch (error) {
        console.error("Seeding failed:", error);
        throw error;
    }
};
