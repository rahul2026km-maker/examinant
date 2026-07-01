import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

async function checkQuestions() {
    try {
        const questionsSnap = await getDocs(collection(db, 'questions'));
        console.log(`Total questions in DB: ${questionsSnap.size}`);
        
        const subjectCounts: Record<string, number> = {};
        const subjectChapters: Record<string, Set<string>> = {};
        
        questionsSnap.docs.forEach(doc => {
            const data = doc.data();
            const subject = data.subject || 'NO_SUBJECT';
            const chapter = data.chapter || 'NO_CHAPTER';
            
            subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
            
            if (!subjectChapters[subject]) {
                subjectChapters[subject] = new Set<string>();
            }
            subjectChapters[subject].add(chapter);
        });
        
        console.log("\n--- Unique Subjects and Question Counts in DB ---");
        for (const [subject, count] of Object.entries(subjectCounts)) {
            console.log(`- "${subject}": ${count} questions`);
            console.log(`  Chapters:`, Array.from(subjectChapters[subject]));
        }
        
    } catch (e) {
        console.error("Error checking questions:", e);
    }
}

checkQuestions();
