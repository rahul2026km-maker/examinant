import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number | string;
    subject: 'Physics' | 'Chemistry' | 'Mathematics';
    chapter: string;
    unit: string;
    type: 'MCQ' | 'Numerical';
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface TestFromTopicsParams {
    subjects: string[]; // Selected subjects
    topics: string[]; // Actually chapter names now
    questionCount: number; // Total questions needed
    mcqPercentage?: number; // Percentage of MCQs (default 70%)
}

/**
 * Generate test from selected subjects and chapters
 */
export const generateTestFromTopics = async (params: TestFromTopicsParams): Promise<{
    questions: Question[];
    warnings: string[];
}> => {
    const { subjects, topics: selectedChapters, questionCount, mcqPercentage = 70 } = params;
    const warnings: string[] = [];
    const selectedQuestions: Question[] = [];

    try {
        // Calculate MCQ and Numerical split
        const mcqCount = Math.round((questionCount * mcqPercentage) / 100);
        const numericalCount = questionCount - mcqCount;

        // Fetch all questions matching subjects
        for (const subject of subjects) {
            const questionsRef = collection(db, 'questions');
            let q;
            
            // If specific chapters are selected, filter by them
            if (selectedChapters.length > 0) {
                // Firestore 'in' query limit is 30 in some versions, but 10 is safer for older ones.
                // We'll chunk if needed, but for now we assume 10 chapters max for simplicity or query all and filter in memory.
                q = query(questionsRef, 
                    where('subject', '==', subject),
                    where('chapter', 'in', selectedChapters.slice(0, 10))
                );
            } else {
                q = query(questionsRef, where('subject', '==', subject));
            }
            
            const snapshot = await getDocs(q);

            const subjectQuestions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Question[];

            // Separate by type
            const mcqQuestions = subjectQuestions.filter(q => q.type === 'MCQ');
            const numericalQuestions = subjectQuestions.filter(q => q.type === 'Numerical');

            // Calculate questions needed per subject (distribute evenly)
            const mcqPerSubject = Math.floor(mcqCount / subjects.length);
            const numericalPerSubject = Math.floor(numericalCount / subjects.length);

            // Select random MCQs
            const shuffledMCQs = mcqQuestions.sort(() => Math.random() - 0.5);
            const selectedMCQs = shuffledMCQs.slice(0, mcqPerSubject);

            if (selectedMCQs.length < mcqPerSubject) {
                warnings.push(
                    `Insufficient MCQs for ${subject}. Required: ${mcqPerSubject}, Available: ${selectedMCQs.length}`
                );
            }

            // Select random Numericals
            const shuffledNumericals = numericalQuestions.sort(() => Math.random() - 0.5);
            const selectedNumericals = shuffledNumericals.slice(0, numericalPerSubject);

            if (selectedNumericals.length < numericalPerSubject) {
                warnings.push(
                    `Insufficient Numerical questions for ${subject}. Required: ${numericalPerSubject}, Available: ${selectedNumericals.length}`
                );
            }

            selectedQuestions.push(...selectedMCQs, ...selectedNumericals);
        }

        // Shuffle all selected questions
        const shuffledQuestions = selectedQuestions.sort(() => Math.random() - 0.5);

        return {
            questions: shuffledQuestions.slice(0, questionCount),
            warnings
        };
    } catch (error) {
        console.error('Error generating test from chapters:', error);
        throw new Error('Failed to generate test. Please check your selections.');
    }
};

/**
 * Get questions by subject and chapter
 */
export const getQuestionsBySubjectAndChapter = async (
    subject: string,
    chapters: string[]
): Promise<Question[]> => {
    try {
        const questionsRef = collection(db, 'questions');
        const q = query(
            questionsRef,
            where('subject', '==', subject),
            where('chapter', 'in', chapters.slice(0, 10))
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Question[];
    } catch (error) {
        console.error('Error fetching questions:', error);
        return [];
    }
};

/**
 * Get questions count by filters
 */
export const getQuestionsCount = async (filters: {
    subject?: string;
    chapter?: string;
    type?: string;
    difficulty?: string;
}): Promise<number> => {
    try {
        const questionsRef = collection(db, 'questions');
        let q = query(questionsRef);

        if (filters.subject) {
            q = query(questionsRef, where('subject', '==', filters.subject));
        }
        if (filters.chapter) {
            q = query(q, where('chapter', '==', filters.chapter));
        }
        if (filters.type) {
            q = query(q, where('type', '==', filters.type));
        }
        if (filters.difficulty) {
            q = query(q, where('difficulty', '==', filters.difficulty));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.length;
    } catch (error) {
        console.error('Error getting questions count:', error);
        return 0;
    }
};
