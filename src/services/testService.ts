import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
    Test,
    TestFormData,
    AutoGenerationConfig,
    CustomTopicConfig,
    QuestionConfiguration
} from '../types/test.types';
import { getWeightageDistribution, JEE_MAINS_2024_WEIGHTAGE } from '../data/jeeMainsWeightage2024';
import { addTestToSeries, removeTestFromSeries } from './testSeriesService';

const TESTS_COLLECTION = 'tests';
const QUESTIONS_COLLECTION = 'questions';

// Create a new test
export const createTest = async (data: TestFormData, userId: string): Promise<string> => {
    const testData = {
        ...data,
        questionIds: [],
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
            totalAttempts: 0,
            averageScore: 0,
            averageTime: 0
        }
    };

    const docRef = await addDoc(collection(db, TESTS_COLLECTION), testData);

    // Add test to series
    if (data.seriesId) {
        await addTestToSeries(data.seriesId, docRef.id);
    }

    return docRef.id;
};

// Update test
export const updateTest = async (testId: string, data: Partial<TestFormData>): Promise<void> => {
    const testRef = doc(db, TESTS_COLLECTION, testId);
    await updateDoc(testRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
};

// Delete test
export const deleteTest = async (testId: string): Promise<void> => {
    const test = await getTest(testId);

    if (test && test.seriesId) {
        await removeTestFromSeries(test.seriesId, testId);
    }

    const testRef = doc(db, TESTS_COLLECTION, testId);
    await deleteDoc(testRef);
};

// Get single test
export const getTest = async (testId: string): Promise<Test | null> => {
    const testRef = doc(db, TESTS_COLLECTION, testId);
    const testDoc = await getDoc(testRef);

    if (!testDoc.exists()) {
        return null;
    }

    return {
        id: testDoc.id,
        ...testDoc.data()
    } as Test;
};

// Get tests by series
export const getTestsBySeries = async (seriesId: string): Promise<Test[]> => {
    const q = query(
        collection(db, TESTS_COLLECTION),
        where('seriesId', '==', seriesId)
    );

    const snapshot = await getDocs(q);
    const tests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Test[];

    // Sort client-side by createdAt descending
    return tests.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
    });
};

// Publish test
export const publishTest = async (testId: string): Promise<void> => {
    const testRef = doc(db, TESTS_COLLECTION, testId);
    await updateDoc(testRef, {
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

// ========== AUTO-GENERATION LOGIC ==========

export const generateQuestionsAuto = async (
    config: AutoGenerationConfig
): Promise<string[]> => {
    const questionIds: string[] = [];
    const questionsPerSubject = config.questionsPerSubject;

    for (const subject of config.subjects) {
        let subjectQuestions: string[] = [];

        if (config.useWeightage && JEE_MAINS_2024_WEIGHTAGE[subject as keyof typeof JEE_MAINS_2024_WEIGHTAGE]) {
            // Use weightage-based distribution
            subjectQuestions = await getQuestionsByWeightage(
                subject as any,
                questionsPerSubject,
                config.class
            );
        } else {
            // Random selection
            subjectQuestions = await getRandomQuestions(subject, questionsPerSubject);
        }

        questionIds.push(...subjectQuestions);
    }

    return questionIds;
};

// Get questions based on JEE Mains weightage
const getQuestionsByWeightage = async (
    subject: 'Physics' | 'Chemistry' | 'Mathematics',
    totalQuestions: number,
    classFilter?: '11' | '12' | 'both'
): Promise<string[]> => {
    const distribution = getWeightageDistribution(subject, totalQuestions);
    const questionIds: string[] = [];

    // Group distribution by unit for better fallback handling
    const unitGroups: Record<string, { count: number; chapters: string[] }> = {};

    for (const [unitKey, count] of Object.entries(distribution)) {
        if (count <= 0) continue;

        // Filter by class if specified
        if (classFilter && classFilter !== 'both') {
            if (!unitKey.includes(`Class ${classFilter}`)) continue;
        }

        const [className, unitName] = unitKey.split(' - ');
        const subjectData = JEE_MAINS_2024_WEIGHTAGE[subject];
        const classData = subjectData[className as keyof typeof subjectData];

        if (classData) {
            const unitData = (classData as any)[unitName];
            if (unitData && unitData.chapters) {
                unitGroups[unitKey] = {
                    count,
                    chapters: unitData.chapters as string[]
                };
            }
        }
    }

    // Process each unit
    for (const [unitKey, data] of Object.entries(unitGroups)) {
        let remainingQuestions = data.count;
        let availableChapters = [...data.chapters];

        // Try to distribute evenly first
        while (remainingQuestions > 0 && availableChapters.length > 0) {
            const currentBatchSize = Math.ceil(remainingQuestions / availableChapters.length);
            const currentChapter = availableChapters[0]; // Take first available

            const chapterQuestions = await getQuestionsByChapter(
                subject,
                currentChapter,
                currentBatchSize
            );

            // Add what we found
            questionIds.push(...chapterQuestions);
            remainingQuestions -= chapterQuestions.length;

            // If this chapter couldn't fulfill the request or we got what we needed
            availableChapters.shift(); // Move to next chapter
        }

        if (remainingQuestions > 0) {
            console.warn(`Could not fulfill ${remainingQuestions} questions for unit ${unitKey}`);
            // Fallback: Try random questions from the subject as a last resort
            const extraQuestions = await getRandomQuestions(subject, remainingQuestions);
            questionIds.push(...extraQuestions);
        }
    }

    // Ensure uniqueness
    const uniqueIds = Array.from(new Set(questionIds));

    // Ensure we don't exceed total questions
    return uniqueIds.slice(0, totalQuestions);
};

// Get random questions for a subject
const getRandomQuestions = async (
    subject: string,
    count: number
): Promise<string[]> => {
    const q = query(
        collection(db, QUESTIONS_COLLECTION),
        where('subject', '==', subject),
        limit(count * 2) // Fetch extra for randomization
    );

    const snapshot = await getDocs(q);
    const questions = snapshot.docs.map(doc => doc.id);

    // Shuffle and return required count
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

// Get questions by chapter
const getQuestionsByChapter = async (
    subject: string,
    chapter: string,
    count: number
): Promise<string[]> => {
    const q = query(
        collection(db, QUESTIONS_COLLECTION),
        where('subject', '==', subject),
        where('chapter', '==', chapter),
        limit(count * 2)
    );

    const snapshot = await getDocs(q);
    const questions = snapshot.docs.map(doc => doc.id);

    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, questions.length));
};

// ========== CUSTOM SELECTION LOGIC ==========

export const generateQuestionsCustom = async (
    config: CustomTopicConfig,
    questionConfig: QuestionConfiguration
): Promise<string[]> => {
    if (config.questionSelection === 'specific' && config.selectedQuestionIds) {
        return config.selectedQuestionIds;
    }

    // Build query constraints based on selections
    const questionIds: string[] = [];

    for (const subject of config.subjects) {
        const selectedChapters = config.selectedChapters[subject] || [];

        for (const chapter of selectedChapters) {
            const selectedTopics = config.selectedTopics[chapter] || [];

            if (selectedTopics.length > 0) {
                // Get questions for specific topics
                for (const topic of selectedTopics) {
                    const topicQuestions = await getQuestionsByTopic(subject, chapter, topic);
                    questionIds.push(...topicQuestions);
                }
            } else {
                // Get all questions for the chapter
                const chapterQuestions = await getQuestionsByChapter(subject, chapter, 100);
                questionIds.push(...chapterQuestions);
            }
        }
    }

    // Apply MCQ/Numerical split
    const filteredIds = await applyQuestionTypeFilter(
        questionIds,
        questionConfig
    );

    return filteredIds.slice(0, questionConfig.totalQuestions);
};

// Get questions by topic
const getQuestionsByTopic = async (
    subject: string,
    chapter: string,
    topic: string
): Promise<string[]> => {
    const q = query(
        collection(db, QUESTIONS_COLLECTION),
        where('subject', '==', subject),
        where('chapter', '==', chapter),
        where('topic', '==', topic),
        limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.id);
};

// Apply MCQ/Numerical filter
const applyQuestionTypeFilter = async (
    questionIds: string[],
    config: QuestionConfiguration
): Promise<string[]> => {
    // Get full question data
    const questions = await Promise.all(
        questionIds.map(async (id) => {
            const docRef = doc(db, QUESTIONS_COLLECTION, id);
            const docSnap = await getDoc(docRef);
            return { id, type: docSnap.data()?.type, ...docSnap.data() };
        })
    );

    // Split by type
    const mcqs = questions.filter((q: any) => q.type === 'MCQ');
    const numericals = questions.filter((q: any) => q.type === 'Numerical');

    // Calculate counts
    const mcqCount = Math.round(config.totalQuestions * (config.mcqPercentage / 100));
    const numericalCount = config.totalQuestions - mcqCount;

    // Shuffle and select
    const selectedMCQs = mcqs.sort(() => Math.random() - 0.5).slice(0, mcqCount);
    const selectedNumericals = numericals.sort(() => Math.random() - 0.5).slice(0, numericalCount);

    return [...selectedMCQs, ...selectedNumericals].map(q => q.id);
};

// Save generated questions to test
export const saveQuestionsToTest = async (
    testId: string,
    questionIds: string[]
): Promise<void> => {
    const testRef = doc(db, TESTS_COLLECTION, testId);
    await updateDoc(testRef, {
        questionIds,
        updatedAt: serverTimestamp()
    });
};
